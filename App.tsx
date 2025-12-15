
import React, { useState, useEffect, useRef } from 'react';
import { 
  WeatherData, 
  WeatherLocation, 
  AppSettings, 
  Language, 
  AppTheme,
  WeatherAlert
} from './types';
import { 
  DEFAULT_LOCATIONS, 
  DEFAULT_SETTINGS, 
  TRANSLATIONS
} from './constants';
import { fetchWeatherData, getCoordinates, reverseGeocode } from './services/weatherService';
import { sendNotification } from './services/notificationService';

import WeatherCard from './components/WeatherCard';
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import WeatherStats from './components/WeatherStats'; 
import WeatherAlerts from './components/WeatherAlerts';
import BottomNav from './components/BottomNav';
import LocationsPage from './pages/LocationsPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [locations, setLocations] = useState<WeatherLocation[]>(DEFAULT_LOCATIONS);
  const [currentLocationId, setCurrentLocationId] = useState<string>(DEFAULT_LOCATIONS[0].id);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Track last notification sent to prevent duplicates in the same minute
  const lastNotifiedRef = useRef<string>(""); 

  // Translation helper
  const t = TRANSLATIONS[settings.language];

  // Helper to get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  };

  // Helper to get UV category
  const getUvCategory = (uv: number) => {
    if (uv <= 2) return t.uvLow;
    if (uv <= 5) return t.uvModerate;
    if (uv <= 7) return t.uvHigh;
    if (uv <= 10) return t.uvVeryHigh;
    return t.uvExtreme;
  };

  // Helper to get Humidity category
  const getHumidityCategory = (humidity: number) => {
    if (humidity < 40) return t.humidityLow;
    if (humidity <= 70) return t.humidityModerate;
    return t.humidityHigh;
  };

  // Initial Data Load
  useEffect(() => {
    loadWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocationId]);

  // Refresh data and ALL location names when language/service changes
  useEffect(() => {
    loadWeatherData();
    refreshAllLocationNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language, settings.locationService]);

  // Try to get real location on mount
  useEffect(() => {
    initLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scheduled Notification Logic
  useEffect(() => {
    if (!settings.enableNotifications || !weather) return;

    const checkSchedule = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;

        // Key to debounce same-minute checks
        const dateKey = `${now.getDate()}-${currentTimeStr}`;
        if (lastNotifiedRef.current === dateKey) return;

        // Morning Report
        if (currentTimeStr === settings.morningReportTime) {
            const today = weather.daily[0];
            const msg = `${t.today}: ${today.condition}, ${Math.round(today.minTemp)}° / ${Math.round(today.maxTemp)}°.`;
            sendNotification(t.morningReportTitle, { body: msg });
            lastNotifiedRef.current = dateKey;
        }

        // Evening Report (For Tomorrow)
        if (currentTimeStr === settings.eveningReportTime) {
            const tomorrow = weather.daily[1];
            if (tomorrow) {
                const msg = `${t.daily}: ${tomorrow.condition}, ${Math.round(tomorrow.minTemp)}° / ${Math.round(tomorrow.maxTemp)}°.`;
                sendNotification(t.eveningReportTitle, { body: msg });
                lastNotifiedRef.current = dateKey;
            }
        }
    };

    const interval = setInterval(checkSchedule, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [settings, weather, t]);


  const initLocation = async () => {
    try {
      const coords = await getCoordinates();
      // Initially "Current Location", will update via reverse geocode
      const rawName = await reverseGeocode(coords, settings.language, settings.locationService);
      // Logic for splitting string if it's strictly Name+District from our new service
      const parts = rawName.split(' ');
      const name = parts[0] || t.currentLocation;
      const district = parts.length > 1 ? parts.slice(1).join(' ') : '';

      const dynamicLoc: WeatherLocation = {
        id: 'current_gps',
        name: name,
        district: district,
        coords: coords,
        isCurrentLocation: true
      };

      setLocations(prev => {
          const filtered = prev.filter(p => !p.isCurrentLocation);
          const newLocations = [dynamicLoc, ...filtered];
          return newLocations;
      });
      setCurrentLocationId('current_gps');
    } catch (e) {
      console.log("GPS unavailable, using default city");
    }
  };

  const refreshAllLocationNames = async () => {
    const updatedLocations = await Promise.all(locations.map(async (loc) => {
        try {
            const fullString = await reverseGeocode(loc.coords, settings.language, settings.locationService);
            // Parse "City District" string back into object
            const parts = fullString.split(' ');
            return { 
                ...loc, 
                name: parts[0] || loc.name,
                district: parts.length > 1 ? parts.slice(1).join(' ') : ''
            };
        } catch (e) {
            console.warn(`Failed to localize ${loc.name}`);
        }
        return loc;
    }));
    if (JSON.stringify(updatedLocations) !== JSON.stringify(locations)) {
        setLocations(updatedLocations);
    }
  };

  const loadWeatherData = async () => {
    setLoading(true);
    const loc = locations.find(l => l.id === currentLocationId) || locations[0];
    try {
      const data = await fetchWeatherData(loc.coords, settings.language);
      setWeather(data);
    } catch (error) {
      console.error("Failed to load weather", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = (newLoc: WeatherLocation) => {
     if (locations.some(l => l.id === newLoc.id || (l.name === newLoc.name && l.district === newLoc.district))) {
       return;
     }
     setLocations([...locations, newLoc]);
     setCurrentLocationId(newLoc.id);
     setActiveTab('home');
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
    if (currentLocationId === id) {
        setCurrentLocationId(locations[0].id);
    }
  };

  // Helper to inject precipitation warning
  const getDisplayAlerts = (w: WeatherData) => {
      const existingAlerts = w.alerts || [];
      
      // Check next 2 hours for rain
      const hasRainSoon = w.hourly.slice(0, 2).some(h => {
          return h.pop > 40 || 
                 h.icon.includes('rain') || 
                 h.icon.includes('snow') || 
                 h.icon.includes('thunderstorm');
      });

      if (hasRainSoon) {
          const precipAlert: WeatherAlert = {
              title: t.precipWarning,
              description: t.precipWarningDesc,
              level: 'moderate',
              source: 'SkyYou Analysis'
          };
          return [precipAlert, ...existingAlerts];
      }
      return existingAlerts;
  };

  const renderHome = () => {
    if (loading && !weather) {
        return (
            // Use 100dvh for proper full screen on mobile browsers
            <div className="flex items-center justify-center min-h-[100dvh] bg-[#fdfcff]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#d3e3fd] rounded-full mb-4"></div>
                    <div className="text-gray-400 font-medium">{t.loading}</div>
                </div>
            </div>
        );
    }

    if (!weather) return null;

    const currentLoc = locations.find(l => l.id === currentLocationId) || locations[0];
    const displayAlerts = getDisplayAlerts(weather);

    return (
      // Changed h-screen to min-h-[100dvh] for better mobile support
      // Added landscape:h-[100dvh] to fix landscape scrolling issues on iOS
      <div className="min-h-[100dvh] bg-[#f8f9fa] pb-[110px] landscape:h-[100dvh] landscape:pb-0 landscape:pl-[80px] landscape:overflow-hidden">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pt-6 lg:pt-8 animate-fade-in landscape:h-full landscape:flex landscape:flex-col">
          
          {/* Header Section: Spans full width now */}
          <div className="mb-4 flex-shrink-0 landscape:mb-6">
             <h1 className="text-[22px] font-normal text-[#1f1f1f] tracking-tight font-sans">SkyYou Weather</h1>
          </div>

          {/* Content Wrapper: Grid in Landscape, taking remaining height */}
          <div className="flex flex-col gap-4 landscape:grid landscape:grid-cols-12 landscape:gap-8 landscape:flex-1 landscape:min-h-0">
            
            {/* Left Column: Weather Card */}
            <div className="landscape:col-span-5 lg:landscape:col-span-4 landscape:h-full landscape:flex landscape:flex-col landscape:pb-8">
               <WeatherCard 
                   data={weather.current} 
                   location={currentLoc} 
                   feelsLikeLabel={t.feelsLike}
                   uvCategory={""} 
                   humidityCategory={""} 
                   onClick={() => setActiveTab('locations')}
                   className="landscape:flex-1"
               />
            </div>

            {/* Right Column: Scrollable Details */}
            <div className="landscape:col-span-7 lg:landscape:col-span-8 flex flex-col gap-4 landscape:h-full landscape:overflow-y-auto landscape:no-scrollbar landscape:pr-2 landscape:pb-8">
                
                {/* Display Alerts (including dynamic precip warning) */}
                {displayAlerts.length > 0 && (
                   <div className="flex-shrink-0">
                      <WeatherAlerts alerts={displayAlerts} />
                   </div>
                )}

                <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100/50 flex-shrink-0">
                   <HourlyForecast 
                     data={weather.hourly} 
                     title={t.hourly} 
                     noDataLabel={t.noData}
                   />
                </div>

                <div className="flex-shrink-0">
                  <WeatherStats 
                      data={weather.current}
                      uvCategory={getUvCategory(weather.current.uvIndex)}
                      humidityCategory={getHumidityCategory(weather.current.humidity)}
                      labels={{
                          uv: t.uvIndex,
                          wind: t.wind,
                          humidity: t.humidity,
                          aqi: t.aqi
                      }}
                  />
                </div>

                <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100/50 flex-shrink-0">
                   <DailyForecast 
                        data={weather.daily} 
                        title={t.daily} 
                        todayLabel={t.today}
                   />
                </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-gray-900 bg-[#f8f9fa] min-h-[100dvh]">
      <main>
        {activeTab === 'home' && renderHome()}
        
        <div className="max-w-4xl mx-auto">
        {activeTab === 'locations' && (
          <LocationsPage 
            locations={locations} 
            currentLocationId={currentLocationId}
            onSelect={(id) => {
                setCurrentLocationId(id);
                setActiveTab('home');
            }}
            onDelete={handleDeleteLocation}
            onAdd={handleAddLocation}
            lang={settings.language}
            locationService={settings.locationService}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage 
            settings={settings} 
            updateSettings={(s) => setSettings({...settings, ...s})} 
          />
        )}
        </div>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        labels={{
            home: t.home,
            locations: t.locations,
            settings: t.settings
        }}
      />
    </div>
  );
};

export default App;
