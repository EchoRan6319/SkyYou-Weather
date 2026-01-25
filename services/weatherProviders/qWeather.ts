import { WeatherData, Coordinates, Language } from '../../types';

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

export const fetchQWeatherData = async (coords: Coordinates, lang: Language, apiKey: string, host: string): Promise<WeatherData> => {
    const isZh = lang === Language.ZH;
    const location = `${coords.lon.toFixed(2)},${coords.lat.toFixed(2)}`;
    const baseUrl = host.startsWith('http') ? host : `https://${host}`;
    const langKey = isZh ? 'zh' : 'en';

    const endpoints = {
        now: `${baseUrl}/v7/weather/now?location=${location}&key=${apiKey}&lang=${langKey}`,
        hourly: `${baseUrl}/v7/weather/24h?location=${location}&key=${apiKey}&lang=${langKey}`,
        daily: `${baseUrl}/v7/weather/7d?location=${location}&key=${apiKey}&lang=${langKey}`,
        air: `${baseUrl}/v7/air/now?location=${location}&key=${apiKey}&lang=${langKey}`
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
            uvIndex: 0,
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
