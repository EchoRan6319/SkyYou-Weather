import { CAIYUN_API_KEY, OPENWEATHER_API_KEY, QWEATHER_API_KEY, QWEATHER_API_HOST, WeatherSource } from '../constants';
import { Coordinates, WeatherData, Language, WeatherIconType, WeatherLocation, WeatherAlert } from '../types';
import { fetchQWeatherData } from './weatherProviders/qWeather';
import { fetchCaiyunData } from './weatherProviders/caiyun';
import { fetchOpenWeatherData } from './weatherProviders/openWeather';

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
  const getBrowserCoords = (): Promise<Coordinates> => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("No Geolocation Support"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });

  try {
    return await getBrowserCoords();
  } catch (e) {
    if (apiKey) {
      try {
        const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=auto_ip&key=${apiKey}`).then(r => r.json());
        if (res.code === '200' && res.location?.[0]) return { lat: parseFloat(res.location[0].lat), lon: parseFloat(res.location[0].lon) };
      } catch (ipErr) { /* fallback */ }
    }
    return { lat: 39.9042, lon: 116.4074 };
  }
};

export const reverseGeocode = async (coords: Coordinates, lang: Language, apiKey?: string): Promise<{ city: string; district: string }> => {
  const isZh = lang === Language.ZH;
  if (apiKey) {
    try {
      const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${coords.lon.toFixed(2)},${coords.lat.toFixed(2)}&key=${apiKey}&lang=${isZh ? 'zh' : 'en'}`).then(r => r.json());
      if (res.code === '200' && res.location?.[0]) {
        return { city: res.location[0].adm2 || res.location[0].name, district: res.location[0].adm2 === res.location[0].name ? "" : res.location[0].name };
      }
    } catch (e) { /* fallback */ }
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&accept-language=${isZh ? 'zh-CN' : 'en'}&zoom=14`).then(r => r.json());
    const addr = res.address || {};
    let city = isZh ? (addr.city || addr.municipality || addr.state || "") : (addr.city || addr.town || "Unknown");
    let district = isZh ? (addr.district || addr.county || addr.town || "") : (addr.district || "");
    if (isZh && !city && district) { city = district; district = ""; }
    return { city, district };
  } catch (e) { return { city: "Unknown", district: "" }; }
};

export const searchCity = async (query: string, lang: Language): Promise<WeatherLocation[]> => {
  if (!query || query.length < 2) return [];
  try {
    const data = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&accept-language=${lang === Language.ZH ? 'zh-CN' : 'en'}&addressdetails=1`).then(r => r.json());
    return data.map((item: any) => {
      const addr = item.address || {};
      const name = lang === Language.ZH ? (addr.city || addr.municipality || addr.state || item.display_name.split(',')[0]) : (addr.city || addr.town || item.display_name.split(',')[0]);
      return { id: `loc_${item.place_id}`, name, district: addr.district || addr.county || addr.town || addr.state || "", coords: { lat: parseFloat(item.lat), lon: parseFloat(item.lon) }, isCurrentLocation: false };
    });
  } catch (e) { return []; }
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
