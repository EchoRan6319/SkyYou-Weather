import { WeatherData, Coordinates, Language } from '../../types';
import { OPENWEATHER_API_KEY } from '../../constants';

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

export const fetchCaiyunData = async (
    coords: Coordinates,
    lang: Language,
    apiKey: string,
    fetchOpenWeatherPollution: any
): Promise<WeatherData> => {
    const url = `https://api.caiyunapp.com/v2.6/${apiKey}/${coords.lon},${coords.lat}/weather.json?alert=true&dailysteps=7&hourlysteps=24`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Caiyun API Error');

    const data = await response.json();
    if (data.status !== "ok") throw new Error(`Caiyun logic failed: ${data.status}`);

    const r = data.result;
    const isZh = lang === Language.ZH;
    const locale = isZh ? 'zh-CN' : 'en-US';

    const alerts = (r.alert?.content || []).map((a: any) => ({
        title: a.title,
        description: a.description,
        level: 'major',
        source: a.source
    }));

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

    const hourlyData = (r.hourly?.temperature || []).map((item: any, idx: number) => {
        const skyconVal = r.hourly.skycon?.[idx]?.value || r.realtime?.skycon;
        return {
            time: new Date(item.datetime).getHours() + ':00',
            temp: item.value,
            icon: mapCaiyunIcon(skyconVal) as any,
            pop: 0
        };
    });

    return {
        lastUpdated: Date.now(),
        current: {
            temp: r.realtime?.temperature || 0,
            feelsLike: r.realtime?.apparent_temperature || 0,
            highTemp: r.daily?.temperature?.[0]?.max || r.realtime?.temperature || 0,
            lowTemp: r.daily?.temperature?.[0]?.min || r.realtime?.temperature || 0,
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
        daily: (r.daily?.temperature || []).map((item: any, idx: number) => {
            const dailySkycon = r.daily.skycon?.[idx]?.value || 'CLEAR_DAY';
            return {
                date: item.date,
                dayName: new Date(item.date).toLocaleDateString(locale, { weekday: 'short' }),
                minTemp: item.min,
                maxTemp: item.max,
                icon: mapCaiyunIcon(dailySkycon) as any,
                condition: dailySkycon
            };
        }),
        alerts: alerts
    };
};
