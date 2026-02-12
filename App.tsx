import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  WeatherData,
  WeatherLocation,
  Language,
  AppTheme
} from './types';
import {
  TRANSLATIONS,
  QWEATHER_API_KEY,
  ONBOARDED_STORAGE_KEY,
  WEATHER_CACHE_KEY,
  CURRENT_LOC_STORAGE_KEY
} from './constants';
import { fetchWeatherData, getCoordinates, reverseGeocode } from './services/weatherService';
import { Capacitor } from '@capacitor/core';
import { sendNotification, scheduleWeatherNotifications } from './services/notificationService';
import { saveWeatherToCache } from './utils/weatherUtils';

// Components
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import PermissionModal from './components/PermissionModal';
import ErrorBoundary from './components/ErrorBoundary';
import HomeView from './components/HomeView';

// Hooks
import { useAppSettings } from './hooks/useAppSettings';
import { useLocations } from './hooks/useLocations';

// Lazy load pages for performance
const LocationsPage = lazy(() => import('./pages/LocationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isLaunched, setIsLaunched] = useState(false);
  const [launchStatus, setLaunchStatus] = useState("Loading...");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const { settings, updateSettings } = useAppSettings();
  const {
    locations,
    currentLocationId,
    setCurrentLocationId,
    addLocation,
    deleteLocation,
    setLocations
  } = useLocations(settings.language);

  const t = (TRANSLATIONS as any)[settings.language];
  const lastNotifiedRef = useRef<string>("");
  const isFirstVisit = useRef(!localStorage.getItem(CURRENT_LOC_STORAGE_KEY));

  // Initialize Weather with Cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const initLocId = localStorage.getItem(CURRENT_LOC_STORAGE_KEY) || 'current_gps';
        if (parsed.locationId === initLocId && parsed.data) {
          setWeather(parsed.data);
        }
      }
    } catch (e) {
      console.warn("Weather cache load failed", e);
    }
  }, []);

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (settings.theme === AppTheme.DARK) {
        isDark = true;
      } else if (settings.theme === AppTheme.SYSTEM) {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
        document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')?.setAttribute('content', '#030712');
        document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', '#030712');
      } else {
        root.classList.remove('dark');
        document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')?.setAttribute('content', '#fdfcff');
        document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', '#fdfcff');
      }
    };

    applyTheme();

    if (settings.theme === AppTheme.SYSTEM) {
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  // Reset scroll on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
    const containers = document.querySelectorAll('.overflow-y-auto, .overflow-auto, main');
    containers.forEach(el => el.scrollTop = 0);
  }, [activeTab]);

  // Initialization sequence
  useEffect(() => {
    const initApp = async () => {
      const startTime = Date.now();
      setLaunchStatus("Initializing...");

      const hasOnboarded = localStorage.getItem(ONBOARDED_STORAGE_KEY);
      if (!hasOnboarded) {
        setIsLaunched(true);
        setShowPermissionModal(true);
        return;
      }

      let currentCoords = locations.find(l => l.id === currentLocationId)?.coords;

      if (isFirstVisit.current || (currentLocationId === 'current_gps' && locations.find(l => l.id === 'current_gps')?.name === t.loading)) {
        try {
          setLaunchStatus("Locating...");
          const coords = await getCoordinates(QWEATHER_API_KEY);
          currentCoords = coords;

          setLocations((prev: WeatherLocation[]) => prev.map(loc => {
            if (loc.isCurrentLocation) return { ...loc, coords: coords };
            return loc;
          }));

          reverseGeocode(coords, settings.language, QWEATHER_API_KEY).then(info => {
            setLocations((prev: WeatherLocation[]) => prev.map(loc => {
              if (loc.isCurrentLocation) {
                return { ...loc, name: info.city || t.currentLocation, district: info.district };
              }
              return loc;
            }));
          });
        } catch (e) {
          console.warn("Init GPS failed", e);
        }
      }

      if (currentCoords) {
        setLaunchStatus("Forecast...");
        try {
          const data = await fetchWeatherData(currentCoords, settings.language, settings.weatherSource);
          setWeather(data);
          saveWeatherToCache(WEATHER_CACHE_KEY, currentLocationId, data);
        } catch (e) {
          console.error("Init Weather Failed", e);
        }
      }

      const elapsedTime = Date.now() - startTime;
      const MIN_DISPLAY_TIME = 2000;
      if (elapsedTime < MIN_DISPLAY_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsedTime));
      }
      setIsLaunched(true);
    };

    initApp();
  }, []);

  // Fresh weather load
  const loadWeatherData = async () => {
    if (!weather) setLoading(true);
    const loc = locations.find(l => l.id === currentLocationId) || locations[0];
    if (loc && loc.coords) {
      try {
        const data = await fetchWeatherData(loc.coords, settings.language, settings.weatherSource);
        setWeather(data);
        saveWeatherToCache(WEATHER_CACHE_KEY, loc.id, data);
      } catch (error) {
        console.error("Failed to load weather", error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLaunched) loadWeatherData();
  }, [currentLocationId, isLaunched, settings.weatherSource]);

  // Notifications
  useEffect(() => {
    if (!settings.enableNotifications || !weather) return;

    // For Native platforms, use OS scheduling (more reliable in background)
    if (Capacitor.isNativePlatform()) {
      scheduleWeatherNotifications(settings, weather, t);
      return;
    }

    // For Web, use interval polling (only works when tab is active/open)
    const checkNotifications = () => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const dateKey = `${now.getDate()}-${timeStr}`;

      if (lastNotifiedRef.current === dateKey) return;

      if (timeStr === settings.morningReportTime) {
        const today = weather.daily[0];
        if (today) {
          sendNotification(t.morningReportTitle, { 
            body: `${t.today}: ${today.condition}, ${Math.round(today.minTemp)}° / ${Math.round(today.maxTemp)}°.` 
          });
          lastNotifiedRef.current = dateKey;
        }
      } else if (timeStr === settings.eveningReportTime) {
        const tomorrow = weather.daily[1];
        if (tomorrow) {
          sendNotification(t.eveningReportTitle, { 
            body: `${t.daily}: ${tomorrow.condition}, ${Math.round(tomorrow.minTemp)}° / ${Math.round(tomorrow.maxTemp)}°.` 
          });
          lastNotifiedRef.current = dateKey;
        }
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [settings.enableNotifications, settings.morningReportTime, settings.eveningReportTime, weather, t]);

  return (
    <ErrorBoundary>
      <div className="font-sans text-gray-900 bg-[#fdfcff] dark:bg-[#030712] min-h-[100dvh] landscape:h-[100dvh] landscape:flex landscape:flex-col landscape:overflow-hidden pt-[env(safe-area-inset-top,0px)] landscape:pl-[calc(80px+env(safe-area-inset-left,0px))] transition-colors duration-300">
        {!isLaunched && <LoadingScreen status={launchStatus} />}

        <PermissionModal
          isOpen={showPermissionModal}
          onClose={() => {
            setShowPermissionModal(false);
            localStorage.setItem(ONBOARDED_STORAGE_KEY, 'true');
            if (!locations[0].coords || locations[0].name === t.loading) {
              window.location.reload();
            }
          }}
          onLocationGranted={(coords) => {
            setLocations((prev: WeatherLocation[]) => prev.map(loc => loc.isCurrentLocation ? { ...loc, coords } : loc));
            reverseGeocode(coords, settings.language, QWEATHER_API_KEY).then(info => {
              setLocations((prev: WeatherLocation[]) => prev.map(loc => loc.isCurrentLocation ? { ...loc, name: info.city || t.currentLocation, district: info.district } : loc));
            });
            fetchWeatherData(coords, settings.language, settings.weatherSource).then(data => {
              setWeather(data);
              saveWeatherToCache(WEATHER_CACHE_KEY, currentLocationId, data);
            });
          }}
          onNotificationGranted={() => updateSettings({ enableNotifications: true })}
        />

        {isLaunched && (
          <main className="animate-fade-in flex-1 landscape:min-h-0 landscape:overflow-y-auto no-scrollbar">
            {activeTab === 'home' && (
              <HomeView
                weather={weather!}
                locations={locations}
                currentLocationId={currentLocationId}
                translations={t}
                loading={loading}
                onLocationClick={() => setActiveTab('locations')}
              />
            )}
            {activeTab !== 'home' && (
              <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pt-6 lg:pt-8 min-h-[100dvh] landscape:min-h-0">
                <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
                  {activeTab === 'locations' && (
                    <LocationsPage
                      locations={locations}
                      currentLocationId={currentLocationId}
                      onSelect={(id) => { setCurrentLocationId(id); setActiveTab('home'); }}
                      onDelete={deleteLocation}
                      onAdd={addLocation}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <SettingsPage settings={settings} updateSettings={updateSettings} />
                  )}
                </Suspense>
              </div>
            )}
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
    </ErrorBoundary>
  );
};

export default App;
