import { CAIYUN_API_KEY, OPENWEATHER_API_KEY, QWEATHER_API_KEY, QWEATHER_API_HOST, WeatherSource } from '../constants';
import { Coordinates, WeatherData, Language, WeatherIconType, WeatherLocation, WeatherAlert } from '../types';
import { fetchQWeatherData } from './weatherProviders/qWeather';
import { fetchCaiyunData } from './weatherProviders/caiyun';
import { fetchOpenWeatherData } from './weatherProviders/openWeather';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const fetchOpenWeatherPollution = async (coords: Coordinates, lang: Language, apiKey: string): Promise<{ aqi: number, description: string } | null> => {
  try {
    const isZh = lang === Language.ZH;
    const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.list?.[0]) {
      const level = data.list[0].main.aqi;
      let aqiVal = 0, aqiDesc = isZh ? "未知" : "Unknown";
      switch (level) {
        case 1: aqiVal = 30; aqiDesc = isZh ? "优" : "Good"; break;
        case 2: aqiVal = 70; aqiDesc = isZh ? "良" : "Fair"; break;
        case 3: aqiVal = 120; aqiDesc = isZh ? "轻度污染" : "Moderate"; break;
        case 4: aqiVal = 160; aqiDesc = isZh ? "中度污染" : "Poor"; break;
        case 5: aqiVal = 201; aqiDesc = isZh ? "重度污染" : "Very Poor"; break;
      }
      return { aqi: aqiVal, description: aqiDesc };
    }
  } catch (e) { /* silent */ }
  return null;
};

const getMockData = (lang: Language): WeatherData => {
  const isZh = lang === Language.ZH;
  const locale = isZh ? 'zh-CN' : 'en-US';
  return {
    lastUpdated: Date.now(),
    current: {
      temp: 2, feelsLike: -1, highTemp: 5, lowTemp: -3,
      condition: isZh ? "寒冷多云" : "Cold & Cloudy",
      humidity: 45, windSpeed: 15, pressure: 1025, uvIndex: 1, visibility: 8,
      aqi: 75, aqiDescription: isZh ? "良" : "Fair", icon: 'partly-cloudy-day'
    },
    hourly: Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`, temp: 1 + Math.round(Math.random() * 4 - 2),
      icon: i > 7 && i < 17 ? 'clear-day' : 'clear-night', pop: Math.round(Math.random() * 10)
    })),
    daily: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString(locale, { weekday: 'short' }),
        minTemp: -5 + Math.round(Math.random() * 3),
        maxTemp: 3 + Math.round(Math.random() * 3),
        icon: (i % 5 === 0 ? 'snow' : 'partly-cloudy-day') as WeatherIconType,
        condition: i % 5 === 0 ? (isZh ? "小雪" : "Light Snow") : (isZh ? "多云" : "Cloudy")
      };
    }),
    alerts: []
  };
};

export const getCoordinates = async (apiKey?: string): Promise<Coordinates> => {
  const getNativeCoords = async (): Promise<Coordinates> => {
    const permissions = await Geolocation.checkPermissions();
    if (permissions.location !== 'granted') {
      await Geolocation.requestPermissions();
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  };

  const getBrowserCoords = (): Promise<Coordinates> => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("No Geolocation Support"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  // Try Native Geolocation first if on Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      return await getNativeCoords();
    } catch (e) {
      console.warn("Native geolocation failed, falling back", e);
    }
  }

  // Try Browser Geolocation
  try {
    return await getBrowserCoords();
  } catch (e) {
    console.warn("Browser geolocation failed, falling back to IP", e);
    if (apiKey) {
      try {
        // Use QWeather IP lookup as primary fallback for China
        const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=auto_ip&key=${apiKey}`).then(r => r.json());
        if (res.code === '200' && res.location?.[0]) {
          return { lat: parseFloat(res.location[0].lat), lon: parseFloat(res.location[0].lon) };
        }
      } catch (ipErr) {
        console.warn("IP-based location failed", ipErr);
      }
    }
    // Final fallback: Beijing
    return { lat: 39.9042, lon: 116.4074 };
  }
};

export const reverseGeocode = async (coords: Coordinates, lang: Language, apiKey?: string): Promise<{ city: string; district: string }> => {
  const isZh = lang === Language.ZH;
  const key = apiKey || QWEATHER_API_KEY;

  if (key) {
    try {
      const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${coords.lon.toFixed(2)},${coords.lat.toFixed(2)}&key=${key}&lang=${isZh ? 'zh' : 'en'}`).then(r => r.json());
      if (res.code === '200' && res.location?.[0]) {
        const loc = res.location[0];
        return {
          city: loc.adm2 || loc.name,
          district: loc.adm2 === loc.name ? "" : loc.name
        };
      }
    } catch (e) {
      console.warn("QWeather reverse geocode failed", e);
    }
  }

  return { city: isZh ? "未知位置" : "Unknown", district: "" };
};

export const searchCity = async (query: string, lang: Language): Promise<WeatherLocation[]> => {
  if (!query || query.length < 1) return [];
  const isZh = lang === Language.ZH;

  if (QWEATHER_API_KEY) {
    try {
      const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(query)}&key=${QWEATHER_API_KEY}&lang=${isZh ? 'zh' : 'en'}`).then(r => r.json());
      if (res.code === '200' && res.location) {
        return res.location.map((item: any) => ({
          id: `loc_${item.id}`,
          name: item.name,
          district: item.adm2 || item.adm1 || "",
          coords: { lat: parseFloat(item.lat), lon: parseFloat(item.lon) },
          isCurrentLocation: false
        }));
      }
    } catch (e) {
      console.warn("QWeather city search failed", e);
    }
  }

  return [];
};

export const fetchWeatherData = async (coords: Coordinates, lang: Language, preferredSource: WeatherSource = WeatherSource.MIXED): Promise<WeatherData> => {
  let data: WeatherData | null = null;
  const tryQWeather = () => (QWEATHER_API_KEY && QWEATHER_API_HOST) ? fetchQWeatherData(coords, lang, QWEATHER_API_KEY, QWEATHER_API_HOST) : null;
  const tryCaiyun = () => CAIYUN_API_KEY ? fetchCaiyunData(coords, lang, CAIYUN_API_KEY, fetchOpenWeatherPollution) : null;
  const tryOpenWeather = () => OPENWEATHER_API_KEY ? fetchOpenWeatherData(coords, lang, OPENWEATHER_API_KEY, fetchOpenWeatherPollution) : null;

  try {
    if (preferredSource === WeatherSource.QWEATHER) data = await tryQWeather();
    else if (preferredSource === WeatherSource.CAIYUN) data = await tryCaiyun();
    else if (preferredSource === WeatherSource.OPENWEATHER) data = await tryOpenWeather();
    else {
      data = await tryQWeather();
      if (!data) data = await tryCaiyun();
      if (!data) data = await tryOpenWeather();
    }
  } catch (e) { console.error("Fetcher error", e); }

  if (!data) {
    if (!(QWEATHER_API_KEY || CAIYUN_API_KEY || OPENWEATHER_API_KEY)) return getMockData(lang);
    throw new Error("天气数据获取失败，请检查 API 配置或网络。");
  }
  if (data.daily?.[0]) { data.daily[0].condition = data.current.condition; data.daily[0].icon = data.current.icon; }
  return data;
};
