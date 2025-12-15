
import { CAIYUN_API_KEY, OPENWEATHER_API_KEY } from '../constants';
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
      temp: 24,
      feelsLike: 26,
      highTemp: 28,
      lowTemp: 19,
      condition: isZh ? "多云" : "Partly Cloudy",
      humidity: 65,
      windSpeed: 12,
      pressure: 1012,
      uvIndex: 4,
      visibility: 10,
      aqi: 45,
      aqiDescription: isZh ? "优" : "Good",
      icon: 'partly-cloudy-day'
    },
    hourly: Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      temp: 20 + Math.round(Math.random() * 8 - 4),
      icon: i > 6 && i < 18 ? 'clear-day' : 'clear-night',
      pop: Math.round(Math.random() * 30)
    })),
    daily: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
      
      return {
        date: d.toISOString().split('T')[0],
        dayName: dayName,
        minTemp: 18 + Math.round(Math.random() * 5),
        maxTemp: 28 + Math.round(Math.random() * 5),
        icon: (i % 3 === 0 ? 'rain' : 'partly-cloudy-day') as WeatherIconType,
        condition: i % 3 === 0 ? (isZh ? "小雨" : "Light Rain") : (isZh ? "多云" : "Cloudy")
      };
    }),
    alerts: alerts
  };
};

export const getCoordinates = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, 
        timeout: 8000
      }
    );
  });
};

interface LocationName {
    city: string;
    district: string;
}

/**
 * REVERSE GEOCODING - OSM Implementation (Default)
 */
export const reverseGeocode = async (coords: Coordinates, lang: Language): Promise<LocationName> => {
    try {
        const localeParam = lang === Language.ZH ? 'zh-CN' : 'en';
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&accept-language=${localeParam}&zoom=14`
        );
        if (!response.ok) throw new Error("Geocoding failed");
        
        const data = await response.json();
        const addr = data.address || {};
        
        let city = "";
        let district = "";

        if (lang === Language.ZH) {
            city = addr.city || addr.municipality || addr.state || "";
            district = addr.district || addr.county || addr.town || "";
            
            if (district && (district.includes(city) || city.includes(district))) {
               // clean redundancy if needed
            }
            if (!city && district) {
                city = district;
                district = "";
            }
        } else {
             city = addr.city || addr.town || "Unknown";
             district = addr.district || "";
        }

        return { city, district };

    } catch (error) {
        console.warn("OSM Reverse geocoding failed", error);
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

const fetchOpenWeatherPollution = async (coords: Coordinates, lang: Language, apiKey: string): Promise<{aqi: number, description: string} | null> => {
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
    if (!response.ok) throw new Error('Caiyun API Error');
    const data = await response.json();
    const r = data.result;
    if (!r) throw new Error('Invalid Caiyun Data');
    
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

export const fetchWeatherData = async (coords: Coordinates, lang: Language): Promise<WeatherData> => {
  // 1. Try Caiyun (Preferred for China)
  if (CAIYUN_API_KEY) {
    try {
      return await fetchCaiyunData(coords, lang, CAIYUN_API_KEY);
    } catch (e) {
      // Check if it is likely a CORS error (network error with no response status usually)
      // We suppress the warning for cleaner logs unless it's a specific API error
    }
  }

  // 2. Try OpenWeather
  if (OPENWEATHER_API_KEY) {
    try {
        return await fetchOpenWeatherData(coords, lang, OPENWEATHER_API_KEY);
    } catch (e) {
        console.warn("OpenWeather API failed, fallback to mock...");
    }
  }

  // 3. Fallback to Mock
  console.log("Using Mock Data");
  await new Promise(r => setTimeout(r, 600)); 
  return getMockData(lang);
};
