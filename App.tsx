
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
import LoadingScreen from './components/LoadingScreen';

const SETTINGS_STORAGE_KEY = 'skyyou_settings';
const LOCATIONS_STORAGE_KEY = 'skyyou_locations';
const CURRENT_LOC_STORAGE_KEY = 'skyyou_current_loc_id';
const WEATHER_CACHE_KEY = 'skyyou_weather_cache';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isLaunched, setIsLaunched] = useState(false); // Controls the SplashScreen
  const [launchStatus, setLaunchStatus] = useState("Loading...");

  // Initialize settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) { console.warn("Settings load failed", e); }
    return DEFAULT_SETTINGS;
  });

  const t = TRANSLATIONS[settings.language];

  // Initialize locations
  const [locations, setLocations] = useState<WeatherLocation[]>(() => {
      let initial = DEFAULT_LOCATIONS;
      try {
          const saved = localStorage.getItem(LOCATIONS_STORAGE_KEY);
          if (saved) initial = JSON.parse(saved);
      } catch (e) { console.warn("Locations load failed", e); }

      const hasGPS = initial.some(l => l.isCurrentLocation);
      if (!hasGPS) {
          const placeholder: WeatherLocation = {
              id: 'current_gps',
              name: t.loading,
              district: '',
              coords: { lat: 39.9042, lon: 116.4074 }, 
              isCurrentLocation: true
          };
          return [placeholder, ...initial.filter(l => l.id !== 'current_gps')];
      }
      return initial;
  });

  // Initialize current location ID
  const [currentLocationId, setCurrentLocationId] = useState<string>(() => {
      const savedId = localStorage.getItem(CURRENT_LOC_STORAGE_KEY);
      return savedId || 'current_gps'; 
  });

  const isFirstVisit = useRef(!localStorage.getItem(CURRENT_LOC_STORAGE_KEY));

  // Initialize Weather with Cache
  const [weather, setWeather] = useState<WeatherData | null>(() => {
      try {
          const cached = localStorage.getItem(WEATHER_CACHE_KEY);
          if (cached) {
              const parsed = JSON.parse(cached);
              const initLocId = localStorage.getItem(CURRENT_LOC_STORAGE_KEY) || 'current_gps';
              if (parsed.locationId === initLocId && parsed.data) {
                  return parsed.data;
              }
          }
      } catch (e) { console.warn("Weather cache load failed", e); }
      return null;
  });

  const [loading, setLoading] = useState(false); // For internal loading updates (not splash)
  const lastNotifiedRef = useRef<string>(""); 

  // --- Helpers ---
  const getUvCategory = (uv: number) => {
    if (uv <= 2) return t.uvLow;
    if (uv <= 5) return t.uvModerate;
    if (uv <= 7) return t.uvHigh;
    if (uv <= 10) return t.uvVeryHigh;
    return t.uvExtreme;
  };

  const getHumidityCategory = (humidity: number) => {
    if (humidity < 40) return t.humidityLow;
    if (humidity <= 70) return t.humidityModerate;
    return t.humidityHigh;
  };

  const saveWeatherToCache = (locId: string, data: WeatherData) => {
      try {
          localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
              locationId: locId,
              data: data
          }));
      } catch (e) { console.warn("Failed to save weather cache", e); }
  };

  // --- Persist Effects ---
  useEffect(() => { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations)); }, [locations]);
  useEffect(() => { localStorage.setItem(CURRENT_LOC_STORAGE_KEY, currentLocationId); }, [currentLocationId]);

  // --- Initialization Sequence (Splash Screen Logic) ---
  useEffect(() => {
    const initApp = async () => {
        const startTime = Date.now();
        setLaunchStatus("Initializing...");

        // 1. Initialize Location (GPS or Cached)
        let currentCoords = locations.find(l => l.id === currentLocationId)?.coords;
        
        // If first visit or we need GPS and don't really have it (placeholder), try fetching
        if (isFirstVisit.current || (currentLocationId === 'current_gps' && locations.find(l => l.id === 'current_gps')?.name === t.loading)) {
            try {
                setLaunchStatus("Locating...");
                const coords = await getCoordinates();
                currentCoords = coords;
                
                // Update Locations State immediately
                setLocations(prev => prev.map(loc => {
                    if (loc.isCurrentLocation) {
                        return { ...loc, coords: coords };
                    }
                    return loc;
                }));

                // Async: Get address name (don't block critical path too long, but helpful for UI)
                reverseGeocode(coords, settings.language).then(info => {
                     setLocations(prev => prev.map(loc => {
                        if (loc.isCurrentLocation) {
                            return { ...loc, name: info.city || t.currentLocation, district: info.district };
                        }
                        return loc;
                    }));
                });

            } catch (e) {
                console.warn("Init GPS failed", e);
                // Fallback handled by default coords in state
            }
        }

        // 2. Fetch Weather Data
        // If we have cached weather, the UI is already technically "ready", 
        // but we want to fetch fresh data while the splash is up if possible.
        if (currentCoords) {
             setLaunchStatus("Forecast...");
             try {
                 const data = await fetchWeatherData(currentCoords, settings.language);
                 setWeather(data);
                 saveWeatherToCache(currentLocationId, data);
             } catch (e) {
                 console.error("Init Weather Failed", e);
                 // If failed, we fall back to whatever is in 'weather' state (cache or null)
             }
        }

        // 3. Ensure Minimum Display Time for Animation (Smoothness)
        const elapsedTime = Date.now() - startTime;
        const MIN_DISPLAY_TIME = 2000; // 2 seconds splash screen
        if (elapsedTime < MIN_DISPLAY_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsedTime));
        }

        // 4. Launch
        setIsLaunched(true);
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  // --- Standard Data Loading (Post-Launch updates) ---
  useEffect(() => {
    if (isLaunched) {
        loadWeatherData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocationId, isLaunched]);

  // Refresh names/data on language change
  useEffect(() => {
    if (isLaunched) {
        loadWeatherData();
        refreshAllLocationNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language]);

  // Notifications
  useEffect(() => {
    if (!settings.enableNotifications || !weather) return;
    const checkSchedule = () => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const dateKey = `${now.getDate()}-${timeStr}`;
        if (lastNotifiedRef.current === dateKey) return;

        if (timeStr === settings.morningReportTime) {
            const today = weather.daily[0];
            sendNotification(t.morningReportTitle, { body: `${t.today}: ${today.condition}, ${Math.round(today.minTemp)}° / ${Math.round(today.maxTemp)}°.` });
            lastNotifiedRef.current = dateKey;
        }
        if (timeStr === settings.eveningReportTime) {
            const tomorrow = weather.daily[1];
            if (tomorrow) {
                sendNotification(t.eveningReportTitle, { body: `${t.daily}: ${tomorrow.condition}, ${Math.round(tomorrow.minTemp)}° / ${Math.round(tomorrow.maxTemp)}°.` });
                lastNotifiedRef.current = dateKey;
            }
        }
    };
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [settings, weather, t]);


  // --- Logic Helpers ---

  const refreshAllLocationNames = async () => {
    const updatedLocations = await Promise.all(locations.map(async (loc) => {
        try {
            const info = await reverseGeocode(loc.coords, settings.language);
            const newName = info.city || loc.name;
            const newDist = info.district; 
            return { ...loc, name: newName, district: newDist };
        } catch (e) { return loc; }
    }));
    
    if (JSON.stringify(updatedLocations) !== JSON.stringify(locations)) {
        setLocations(updatedLocations);
    }
  };

  const loadWeatherData = async () => {
    // Only set loading if not initial launch (initial launch handled by splash)
    // and if we don't have weather (to prevent flickering)
    if (!weather) setLoading(true);
    
    let loc = locations.find(l => l.id === currentLocationId);
    if (!loc) {
        loc = locations[0]; 
        if(loc) setCurrentLocationId(loc.id);
    }

    if (loc) {
        try {
            const data = await fetchWeatherData(loc.coords, settings.language);
            setWeather(data);
            saveWeatherToCache(loc.id, data);
        } catch (error) { console.error("Failed to load weather", error); }
    }
    setLoading(false);
  };

  const handleAddLocation = (newLoc: WeatherLocation) => {
     if (locations.some(l => l.id === newLoc.id)) return;
     if (locations.some(l => l.name === newLoc.name && l.district === newLoc.district && !l.isCurrentLocation)) return;
     
     setLocations([...locations, newLoc]);
     setCurrentLocationId(newLoc.id);
     setActiveTab('home');
  };

  const handleDeleteLocation = (id: string) => {
    const newLocations = locations.filter(l => l.id !== id);
    setLocations(newLocations);
    if (currentLocationId === id) {
        setCurrentLocationId(newLocations[0]?.id || 'current_gps');
    }
  };

  const getDisplayAlerts = (w: WeatherData) => {
      const existingAlerts = w.alerts || [];
      const hasRainSoon = w.hourly.slice(0, 2).some(h => h.pop > 40 || /rain|snow|thunderstorm/.test(h.icon));

      if (hasRainSoon) {
          const precipAlert: WeatherAlert = {
              title: t.precipWarning,
              description: t.precipWarningDesc,
              level: 'moderate',
              source: 'SkyYou'
          };
          return [precipAlert, ...existingAlerts];
      }
      return existingAlerts;
  };

  const renderHome = () => {
    // During normal usage (post-launch), if we are loading AND have no weather, show small spinner
    if (loading && !weather && isLaunched) {
        return (
            <div className="flex items-center justify-center min-h-[100dvh] bg-[#fdfcff]">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!weather) return null;

    const currentLoc = locations.find(l => l.id === currentLocationId) || locations[0];
    const displayAlerts = getDisplayAlerts(weather);

    return (
      <div className="min-h-[100dvh] bg-[#f8f9fa] pb-[110px] landscape:h-[100dvh] landscape:pb-0 landscape:pl-[80px] landscape:overflow-hidden">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pt-6 lg:pt-8 animate-fade-in landscape:h-full landscape:flex landscape:flex-col">
          
          <div className="mb-4 flex-shrink-0 landscape:mb-6">
             <h1 className="text-[22px] font-normal text-[#1f1f1f] tracking-tight font-sans">SkyYou Weather</h1>
          </div>

          <div className="flex flex-col gap-4 landscape:grid landscape:grid-cols-12 landscape:gap-8 landscape:flex-1 landscape:min-h-0">
            {/* 
                Refined Left Column for Landscape:
                - Use 'overflow-y-auto' so if card is too tall for a small phone screen, user can scroll.
                - Wrapper padding adjusted: 'landscape:pb-4 sm:landscape:pb-6' to match horizontal margin (px-4/px-6).
                  This ensures the bottom gap is equal to the left gap.
            */}
            <div className="landscape:col-span-5 lg:landscape:col-span-4 landscape:h-full landscape:overflow-y-auto landscape:no-scrollbar">
               <div className="flex flex-col w-full landscape:min-h-full landscape:pb-4 sm:landscape:pb-6">
                  <WeatherCard 
                      data={weather.current} 
                      location={currentLoc} 
                      feelsLikeLabel={t.feelsLike}
                      uvCategory={""} 
                      humidityCategory={""} 
                      onClick={() => setActiveTab('locations')}
                      className="flex-1" 
                  />
               </div>
            </div>

            {/* Right Column */}
            <div className="landscape:col-span-7 lg:landscape:col-span-8 flex flex-col gap-4 landscape:h-full landscape:overflow-y-auto landscape:no-scrollbar landscape:pr-2 landscape:pb-4 sm:landscape:pb-6">
                {displayAlerts.length > 0 && (
                   <div className="flex-shrink-0">
                      <WeatherAlerts alerts={displayAlerts} />
                   </div>
                )}
                <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100/50 flex-shrink-0">
                   <HourlyForecast data={weather.hourly} title={t.hourly} noDataLabel={t.noData}/>
                </div>
                <div className="flex-shrink-0">
                  <WeatherStats 
                      data={weather.current}
                      uvCategory={getUvCategory(weather.current.uvIndex)}
                      humidityCategory={getHumidityCategory(weather.current.humidity)}
                      labels={{ uv: t.uvIndex, wind: t.wind, humidity: t.humidity, aqi: t.aqi }}
                  />
                </div>
                <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100/50 flex-shrink-0">
                   <DailyForecast data={weather.daily} title={t.daily} todayLabel={t.today}/>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-gray-900 bg-[#f8f9fa] min-h-[100dvh]">
      {!isLaunched && <LoadingScreen status={launchStatus} />}
      
      {/* 
        We render the app structure even behind the splash screen if data is available 
        to ensure smooth fade-in, but visibility controls the user experience.
      */}
      {isLaunched && (
          <main className="animate-fade-in">
            {activeTab === 'home' && renderHome()}
            <div className="max-w-4xl mx-auto">
            {activeTab === 'locations' && (
              <LocationsPage 
                locations={locations} 
                currentLocationId={currentLocationId}
                onSelect={(id) => { setCurrentLocationId(id); setActiveTab('home'); }}
                onDelete={handleDeleteLocation}
                onAdd={handleAddLocation}
                lang={settings.language}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsPage settings={settings} updateSettings={(s) => setSettings({...settings, ...s})} />
            )}
            </div>
          </main>
      )}

      {isLaunched && (
        <BottomNav 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            labels={{ home: t.home, locations: t.locations, settings: t.settings }}
        />
      )}
    </div>
  );
};

export default App;
