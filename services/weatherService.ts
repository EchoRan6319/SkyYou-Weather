
import { CAIYUN_API_KEY, OPENWEATHER_API_KEY, QWEATHER_API_KEY, QWEATHER_API_HOST, WeatherSource } from '../constants';
import { Coordinates, WeatherData, Language, WeatherIconType, WeatherLocation, WeatherAlert } from '../types';

/**
 * Mapped Caiyun skycon codes to our internal icon types
 */
const mapCaiyunIcon = (skycon: string): string => {
  if (!skycon) return 'partly-cloudy-day';
  const s = skycon.toUpperCase();
  if (s.includes('CLEAR_DAY')) return 'clear-day';
  if (s.includes('CLEAR_NIGHT')) return 'clear-night';
  if (s.includes('PARTLY_CLOUDY_DAY')) return 'partly-cloudy-day';
  if (s.includes('PARTLY_CLOUDY_NIGHT')) return 'partly-cloudy-night';
  if (s.includes('CLOUDY')) return 'cloudy';
  if (s.includes('RAIN')) return 'rain';
  if (s.includes('SNOW')) return 'snow';
  if (s.includes('WIND')) return 'wind';
  if (s.includes('FOG')) return 'fog';
  if (s.includes('HAZE')) return 'fog';
  return 'partly-cloudy-day';
};

/**
 * Map OpenWeather icon codes to internal types
 */
const mapOpenWeatherIcon = (code: string): WeatherIconType => {
  switch (code) {
    case '01d': return 'clear-day';
    case '01n': return 'clear-night';
    case '02d': return 'partly-cloudy-day';
    case '02n': return 'partly-cloudy-night';
    case '03d': case '03n':
    case '04d': case '04n': return 'cloudy';
    case '09d': case '09n':
    case '10d': case '10n': return 'rain';
    case '11d': case '11n': return 'thunderstorm';
    case '13d': case '13n': return 'snow';
    case '50d': case '50n': return 'fog';
    default: return 'partly-cloudy-day';
  }
};

/**
 * Map QWeather (和风天气) icon codes to internal types
 */
const mapQWeatherIcon = (code: string): string => {
  const c = parseInt(code);
  if (c === 100) return 'clear-day';
  if (c === 150) return 'clear-night';
  if (c >= 101 && c <= 103) return 'partly-cloudy-day';
  if (c === 151 || c === 153) return 'partly-cloudy-night';
  if (c === 104) return 'cloudy';
  if (c >= 300 && c <= 399) return 'rain';
  if (c >= 400 && c <= 499) return 'snow';
  if (c >= 500 && c <= 599) return 'fog';
  return 'partly-cloudy-day';
};

/**
 * Generate localized mock data
 */
const getMockData = (lang: Language): WeatherData => {
  const isZh = lang === Language.ZH;
  const locale = isZh ? 'zh-CN' : 'en-US';

  const mockAlerts: WeatherAlert[] = isZh ? [
    {
      title: "暴雨蓝色预警",
      description: "预计未来24小时内，本市大部分地区将出现50毫米以上降水，请注意防范。",
      level: "major",
      source: "市气象台"
    }
  ] : [
    {
      title: "Heavy Rain Warning",
      description: "Heavy rain is expected in the next 24 hours.",
      level: "major",
      source: "Met Office"
    }
  ];

  // 30% chance to show an alert in mock mode
  const alerts = Math.random() > 0.7 ? mockAlerts : [];

  return {
    lastUpdated: Date.now(),
    current: {
      temp: 2,
      feelsLike: -1,
      highTemp: 5,
      lowTemp: -3,
      condition: isZh ? "寒冷多云" : "Cold & Cloudy",
      humidity: 45,
      windSpeed: 15,
      pressure: 1025,
      uvIndex: 1,
      visibility: 8,
      aqi: 75,
      aqiDescription: isZh ? "良" : "Fair",
      icon: 'partly-cloudy-day'
    },
    hourly: Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      temp: 1 + Math.round(Math.random() * 4 - 2),
      icon: i > 7 && i < 17 ? 'clear-day' : 'clear-night',
      pop: Math.round(Math.random() * 10)
    })),
    daily: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' });

      return {
        date: d.toISOString().split('T')[0],
        dayName: dayName,
        minTemp: -5 + Math.round(Math.random() * 3),
        maxTemp: 3 + Math.round(Math.random() * 3),
        icon: (i % 5 === 0 ? 'snow' : 'partly-cloudy-day') as WeatherIconType,
        condition: i % 5 === 0 ? (isZh ? "小雪" : "Light Snow") : (isZh ? "多云" : "Cloudy")
      };
    }),
    alerts: alerts
  };
};

/**
 * GET COORDINATES - With IP Fallback for China compatibility
 */
export const getCoordinates = async (apiKey?: string): Promise<Coordinates> => {
  // 1. Try Browser Geolocation (Most precise)
  const getBrowserCoords = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("No Geolocation Support"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  try {
    return await getBrowserCoords();
  } catch (e) {
    console.warn("Browser geolocation failed or timed out, trying IP fallback...", e);

    // 2. Fallback to QWeather IP Lookup (Highly reliable in China)
    if (apiKey) {
      try {
        const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=auto_ip&key=${apiKey}`).then(r => r.json());
        if (res.code === '200' && res.location?.[0]) {
          const loc = res.location[0];
          console.log("Using QWeather IP Geolocation:", loc.name);
          return { lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) };
        }
      } catch (ipErr) {
        console.error("IP Geolocation failed", ipErr);
      }
    }

    // 3. Final Hardcoded Fallback (Beijing)
    return { lat: 39.9042, lon: 116.4074 };
  }
};

interface LocationName {
  city: string;
  district: string;
}

/**
 * REVERSE GEOCODING - OSM Implementation (Default)
 */
/**
 * REVERSE GEOCODING - QWeather + OSM Fallback
 */
export const reverseGeocode = async (coords: Coordinates, lang: Language, apiKey?: string): Promise<LocationName> => {
  const isZh = lang === Language.ZH;

  // 1. Try QWeather GeoAPI (Preferred for China)
  if (apiKey) {
    try {
      const res = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${coords.lon.toFixed(2)},${coords.lat.toFixed(2)}&key=${apiKey}&lang=${isZh ? 'zh' : 'en'}`).then(r => r.json());
      if (res.code === '200' && res.location?.[0]) {
        const loc = res.location[0];
        return {
          city: loc.adm2 || loc.name,
          district: loc.adm2 === loc.name ? "" : loc.name
        };
      }
    } catch (e) {
      console.warn("QWeather Reverse Geocoding failed", e);
    }
  }

  // 2. Fallback to OSM (International)
  try {
    const localeParam = isZh ? 'zh-CN' : 'en';
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&accept-language=${localeParam}&zoom=14`
    );
    if (!response.ok) throw new Error("OSM failed");

    const data = await response.json();
    const addr = data.address || {};

    let city = "";
    let district = "";

    if (isZh) {
      city = addr.city || addr.municipality || addr.state || "";
      district = addr.district || addr.county || addr.town || "";
      if (!city && district) { city = district; district = ""; }
    } else {
      city = addr.city || addr.town || "Unknown";
      district = addr.district || "";
    }

    return { city, district };

  } catch (error) {
    console.warn("All Reverse geocoding failed", error);
    return { city: "Unknown", district: "" };
  }
};

/**
 * SEARCH CITY - OSM Implementation (Default)
 */
export const searchCity = async (query: string, lang: Language): Promise<WeatherLocation[]> => {
  if (!query || query.length < 2) return [];
  try {
    const localeParam = lang === Language.ZH ? 'zh-CN' : 'en';
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&accept-language=${localeParam}&addressdetails=1`
    );
    if (!response.ok) return [];

    const data = await response.json();
    return data.map((item: any) => {
      const addr = item.address || {};
      let name = "";
      let district = "";
      if (lang === Language.ZH) {
        name = addr.city || addr.municipality || addr.state || item.display_name.split(',')[0];
        district = addr.district || addr.county || addr.town || "";
      } else {
        name = addr.city || addr.town || item.display_name.split(',')[0];
        district = addr.state || addr.country || "";
      }
      return {
        id: `loc_${item.place_id}`,
        name: name,
        district: district,
        coords: { lat: parseFloat(item.lat), lon: parseFloat(item.lon) },
        isCurrentLocation: false
      };
    });
  } catch (e) {
    console.warn("Search failed", e);
    return [];
  }
};

// --- API FETCHERS ---

const fetchOpenWeatherPollution = async (coords: Coordinates, lang: Language, apiKey: string): Promise<{ aqi: number, description: string } | null> => {
  try {
    const isZh = lang === Language.ZH;
    const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}`;
    const res = await fetch(pollutionUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.list && data.list.length > 0) {
      const level = data.list[0].main.aqi;
      let aqiVal = 0;
      let aqiDesc = isZh ? "未知" : "Unknown";
      switch (level) {
        case 1: aqiVal = 30; aqiDesc = isZh ? "优" : "Good"; break;
        case 2: aqiVal = 70; aqiDesc = isZh ? "良" : "Fair"; break;
        case 3: aqiVal = 120; aqiDesc = isZh ? "轻度污染" : "Moderate"; break;
        case 4: aqiVal = 160; aqiDesc = isZh ? "中度污染" : "Poor"; break;
        case 5: aqiVal = 201; aqiDesc = isZh ? "重度污染" : "Very Poor"; break;
      }
      return { aqi: aqiVal, description: aqiDesc };
    }
  } catch (e) { /* silent fail */ }
  return null;
};

const fetchCaiyunData = async (coords: Coordinates, lang: Language, apiKey: string): Promise<WeatherData> => {
  try {
    const url = `https://api.caiyunapp.com/v2.6/${apiKey}/${coords.lon},${coords.lat}/weather.json?alert=true&dailysteps=7&hourlysteps=24`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Caiyun HTTP Error: ${response.status}`);
      throw new Error('Caiyun API Error');
    }
    const data = await response.json();
    if (data.status !== "ok") {
      console.error(`Caiyun Logic Error: ${data.status} for location ${coords.lat},${coords.lon}`);
      throw new Error(`Caiyun logic failed: ${data.status}`);
    }
    const r = data.result;
    if (!r) throw new Error('Invalid Caiyun Data Structure');

    // ... Parsing Logic Same as Before ...
    const isZh = lang === Language.ZH;
    const locale = isZh ? 'zh-CN' : 'en-US';

    // Alerts
    const alerts: WeatherAlert[] = [];
    if (r.alert && r.alert.content) {
      r.alert.content.forEach((a: any) => {
        alerts.push({
          title: a.title,
          description: a.description,
          level: 'major',
          source: a.source
        });
      });
    }

    // AQI
    let aqi = 0;
    let aqiDescription = isZh ? "优" : "Good";
    const caiyunAqi = r.realtime?.air_quality?.aqi?.chn;
    if (typeof caiyunAqi === 'number') {
      aqi = caiyunAqi;
      aqiDescription = r.realtime?.air_quality?.description?.chn || aqiDescription;
    } else if (OPENWEATHER_API_KEY) {
      const owData = await fetchOpenWeatherPollution(coords, lang, OPENWEATHER_API_KEY);
      if (owData) {
        aqi = owData.aqi;
        aqiDescription = owData.description;
      }
    }

    const dailyTemp = r.daily?.temperature || [];
    const todayHigh = dailyTemp.length > 0 ? dailyTemp[0].max : r.realtime?.temperature;
    const todayLow = dailyTemp.length > 0 ? dailyTemp[0].min : r.realtime?.temperature;

    let hourlyData: any[] = [];
    if (r.hourly && r.hourly.temperature) {
      hourlyData = r.hourly.temperature.map((item: any, idx: number) => {
        const skyconVal = r.hourly.skycon && r.hourly.skycon[idx] ? r.hourly.skycon[idx].value : r.realtime?.skycon;
        return {
          time: new Date(item.datetime).getHours() + ':00',
          temp: item.value,
          icon: mapCaiyunIcon(skyconVal) as any,
          pop: 0
        };
      });
    }
    if (hourlyData.length === 0) throw new Error("Partial Data");

    return {
      lastUpdated: Date.now(),
      current: {
        temp: r.realtime?.temperature || 0,
        feelsLike: r.realtime?.apparent_temperature || 0,
        highTemp: todayHigh || 0,
        lowTemp: todayLow || 0,
        condition: r.realtime?.skycon || "Unknown",
        humidity: (r.realtime?.humidity || 0) * 100,
        windSpeed: r.realtime?.wind?.speed || 0,
        pressure: r.realtime?.pressure || 0,
        uvIndex: r.realtime?.life_index?.ultraviolet?.index || 0,
        visibility: r.realtime?.visibility || 0,
        aqi: aqi,
        aqiDescription: aqiDescription,
        icon: mapCaiyunIcon(r.realtime?.skycon) as any
      },
      hourly: hourlyData,
      daily: r.daily?.temperature ? r.daily.temperature.map((item: any, idx: number) => {
        const d = new Date(item.date);
        const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
        const dailySkycon = r.daily.skycon && r.daily.skycon[idx] ? r.daily.skycon[idx].value : 'CLEAR_DAY';
        return {
          date: item.date,
          dayName: dayName,
          minTemp: item.min,
          maxTemp: item.max,
          icon: mapCaiyunIcon(dailySkycon) as any,
          condition: dailySkycon
        };
      }) : [],
      alerts: alerts
    };

  } catch (e) {
    throw e; // Let the main fallback handle it
  }
};

const fetchOpenWeatherData = async (coords: Coordinates, lang: Language, apiKey: string): Promise<WeatherData> => {
  const isZh = lang === Language.ZH;
  const locale = isZh ? 'zh_cn' : 'en';
  const units = 'metric';

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=${units}&lang=${locale}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=${units}&lang=${locale}`;

  const [resCurrent, resForecast] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl)
  ]);

  let aqiVal = 0;
  let aqiDesc = isZh ? "未知" : "Unknown";
  try {
    const owData = await fetchOpenWeatherPollution(coords, lang, apiKey);
    if (owData) {
      aqiVal = owData.aqi;
      aqiDesc = owData.description;
    }
  } catch (e) { /* ignore */ }

  if (!resCurrent.ok || !resForecast.ok) throw new Error('OpenWeather API Error');

  const curr = await resCurrent.json();
  const fore = await resForecast.json();

  const hourly = fore.list ? fore.list.slice(0, 9).map((item: any) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.getHours() + ':00',
      temp: item.main.temp,
      icon: mapOpenWeatherIcon(item.weather[0].icon),
      pop: Math.round(item.pop * 100)
    };
  }) : [];

  if (hourly.length === 0) throw new Error("OpenWeather Partial");

  const dailyMap = new Map();
  if (fore.list) {
    fore.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { temps: [], icons: [], conditions: [], dt: item.dt });
      }
      const entry = dailyMap.get(date);
      entry.temps.push(item.main.temp);
      entry.icons.push(item.weather[0].icon);
      entry.conditions.push(item.weather[0].description);
    });
  }

  const daily = Array.from(dailyMap.values()).slice(0, 7).map((entry: any) => {
    const minTemp = Math.min(...entry.temps);
    const maxTemp = Math.max(...entry.temps);
    const midIndex = Math.floor(entry.icons.length / 2);
    const d = new Date(entry.dt * 1000);
    const dayName = d.toLocaleDateString(lang === Language.ZH ? 'zh-CN' : 'en-US', { weekday: 'short' });
    return {
      date: d.toISOString().split('T')[0],
      dayName: dayName,
      minTemp,
      maxTemp,
      icon: mapOpenWeatherIcon(entry.icons[midIndex]),
      condition: entry.conditions[midIndex]
    };
  });

  return {
    lastUpdated: Date.now(),
    current: {
      temp: curr.main.temp,
      feelsLike: curr.main.feels_like,
      highTemp: daily[0]?.maxTemp || curr.main.temp_max,
      lowTemp: daily[0]?.minTemp || curr.main.temp_min,
      condition: curr.weather[0].description,
      humidity: curr.main.humidity,
      windSpeed: Math.round(curr.wind.speed * 3.6),
      pressure: curr.main.pressure,
      uvIndex: 0,
      visibility: curr.visibility / 1000,
      aqi: aqiVal,
      aqiDescription: aqiDesc,
      icon: mapOpenWeatherIcon(curr.weather[0].icon)
    },
    hourly,
    daily,
    alerts: []
  };
};

const fetchQWeatherData = async (coords: Coordinates, lang: Language, apiKey: string, host: string): Promise<WeatherData> => {
  const isZh = lang === Language.ZH;
  const location = `${coords.lon.toFixed(2)},${coords.lat.toFixed(2)}`;
  const baseUrl = host.startsWith('http') ? host : `https://${host}`;
  const langKey = isZh ? 'zh' : 'en';

  const endpoints = {
    now: `${baseUrl}/v7/weather/now?location=${location}&key=${apiKey}&lang=${langKey}`,
    hourly: `${baseUrl}/v7/weather/24h?location=${location}&key=${apiKey}&lang=${langKey}`,
    daily: `${baseUrl}/v7/weather/7d?location=${location}&key=${apiKey}&lang=${langKey}`,
    air: `${baseUrl}/v7/air/now?location=${location}&key=${apiKey}&lang=${langKey}`,
    indices: `${baseUrl}/v7/indices/1d?location=${location}&key=${apiKey}&lang=${langKey}&type=1,3,5`
  };

  const [resNow, resHourly, resDaily, resAir] = await Promise.all([
    fetch(endpoints.now).then(r => r.json()),
    fetch(endpoints.hourly).then(r => r.json()),
    fetch(endpoints.daily).then(r => r.json()),
    fetch(endpoints.air).then(r => r.json())
  ]);

  if (resNow.code !== '200' || resDaily.code !== '200') {
    throw new Error(`QWeather Error: ${resNow.code}`);
  }

  const current = resNow.now;
  const dailyData = resDaily.daily.map((d: any) => ({
    date: d.fxDate,
    dayName: new Date(d.fxDate).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { weekday: 'short' }),
    minTemp: parseInt(d.tempMin),
    maxTemp: parseInt(d.tempMax),
    icon: mapQWeatherIcon(d.iconDay) as any,
    condition: d.textDay
  }));

  const hourlyData = (resHourly.hourly || []).map((h: any) => ({
    time: new Date(h.fxTime).getHours() + ':00',
    temp: parseInt(h.temp),
    icon: mapQWeatherIcon(h.icon) as any,
    pop: parseInt(h.pop || '0')
  }));

  return {
    lastUpdated: Date.now(),
    current: {
      temp: parseInt(current.temp),
      feelsLike: parseInt(current.feelsLike),
      highTemp: dailyData[0]?.maxTemp || parseInt(current.temp),
      lowTemp: dailyData[0]?.minTemp || parseInt(current.temp),
      condition: current.text,
      humidity: parseInt(current.humidity),
      windSpeed: parseInt(current.windSpeed),
      pressure: parseInt(current.pressure),
      uvIndex: 0, // Will be filled from indices if needed
      visibility: parseInt(current.vis),
      aqi: parseInt(resAir.now?.aqi || '0'),
      aqiDescription: resAir.now?.category || (isZh ? "优" : "Good"),
      icon: mapQWeatherIcon(current.icon) as any
    },
    hourly: hourlyData,
    daily: dailyData,
    alerts: []
  };
};

/**
 * RECENTLY ADDED: Data Fetcher with Manual Source Selection
 */
export const fetchWeatherData = async (
  coords: Coordinates,
  lang: Language,
  preferredSource: WeatherSource = WeatherSource.MIXED
): Promise<WeatherData> => {
  let data: WeatherData | null = null;

  // Wrapped fetchers for cleaner fallback logic
  const tryQWeather = async () => {
    if (QWEATHER_API_KEY && QWEATHER_API_HOST) {
      try {
        const res = await fetchQWeatherData(coords, lang, QWEATHER_API_KEY, QWEATHER_API_HOST);
        console.log("Using QWeather Data");
        return res;
      } catch (e) {
        console.warn("QWeather API failed", e);
      }
    }
    return null;
  };

  const tryCaiyun = async () => {
    if (CAIYUN_API_KEY) {
      try {
        const res = await fetchCaiyunData(coords, lang, CAIYUN_API_KEY);
        console.log("Using Caiyun Data");
        return res;
      } catch (e) {
        console.warn("Caiyun API failed", e);
      }
    }
    return null;
  };

  const tryOpenWeather = async () => {
    if (OPENWEATHER_API_KEY) {
      try {
        const res = await fetchOpenWeatherData(coords, lang, OPENWEATHER_API_KEY);
        console.log("Using OpenWeather Data");
        return res;
      } catch (e) {
        console.warn("OpenWeather API failed", e);
      }
    }
    return null;
  };

  // Dispatch based on user selection
  if (preferredSource === WeatherSource.QWEATHER) {
    data = await tryQWeather();
  } else if (preferredSource === WeatherSource.CAIYUN) {
    data = await tryCaiyun();
  } else if (preferredSource === WeatherSource.OPENWEATHER) {
    data = await tryOpenWeather();
  } else {
    // MIXED (Default Priority: QWeather > Caiyun > OpenWeather)
    data = await tryQWeather();
    if (!data) data = await tryCaiyun();
    if (!data) data = await tryOpenWeather();
  }

  // --- Strict Fallback Logic ---
  const anyApiConfigured = !!(QWEATHER_API_KEY || CAIYUN_API_KEY || OPENWEATHER_API_KEY);

  if (!data) {
    if (!anyApiConfigured) {
      // ONLY use mock if absolutely NO keys are provided
      console.log("No API keys detected. Entering Dev/Mock mode.");
      await new Promise(r => setTimeout(r, 600));
      data = getMockData(lang);
    } else {
      // Keys are present but all attempts failed - DO NOT HIDE THIS WITH MOCK DATA
      const errorMsg = "天气数据获取失败。已配置的 API 可能已达到上限、Key 无效或网络连接异常，请检查设置。";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // Data Consistency: Ensure Today's Forecast text/icon matches Current Weather Card
  if (data && data.daily && data.daily.length > 0) {
    data.daily[0].condition = data.current.condition;
    data.daily[0].icon = data.current.icon;
  }

  return data;
};
