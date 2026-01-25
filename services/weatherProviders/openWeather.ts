import { WeatherData, Coordinates, Language, WeatherIconType } from '../../types';

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

export const fetchOpenWeatherData = async (
    coords: Coordinates,
    lang: Language,
    apiKey: string,
    fetchOpenWeatherPollution: any
): Promise<WeatherData> => {
    const isZh = lang === Language.ZH;
    const locale = isZh ? 'zh_cn' : 'en';

    const [resCurrent, resForecast] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=${locale}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=${locale}`)
    ]);

    if (!resCurrent.ok || !resForecast.ok) throw new Error('OpenWeather API Error');

    const curr = await resCurrent.json();
    const fore = await resForecast.json();

    const owPollution = await fetchOpenWeatherPollution(coords, lang, apiKey);

    const hourly = (fore.list || []).slice(0, 9).map((item: any) => ({
        time: new Date(item.dt * 1000).getHours() + ':00',
        temp: item.main.temp,
        icon: mapOpenWeatherIcon(item.weather[0].icon),
        pop: Math.round(item.pop * 100)
    }));

    const dailyMap = new Map();
    (fore.list || []).forEach((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyMap.has(date)) dailyMap.set(date, { temps: [], icons: [], conditions: [], dt: item.dt });
        const entry = dailyMap.get(date);
        entry.temps.push(item.main.temp);
        entry.icons.push(item.weather[0].icon);
        entry.conditions.push(item.weather[0].description);
    });

    const daily = Array.from(dailyMap.values()).slice(0, 7).map((entry: any) => {
        const d = new Date(entry.dt * 1000);
        return {
            date: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { weekday: 'short' }),
            minTemp: Math.min(...entry.temps),
            maxTemp: Math.max(...entry.temps),
            icon: mapOpenWeatherIcon(entry.icons[Math.floor(entry.icons.length / 2)]),
            condition: entry.conditions[Math.floor(entry.conditions.length / 2)]
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
            aqi: owPollution?.aqi || 0,
            aqiDescription: owPollution?.description || (isZh ? "未知" : "Unknown"),
            icon: mapOpenWeatherIcon(curr.weather[0].icon)
        },
        hourly,
        daily,
        alerts: []
    };
};
