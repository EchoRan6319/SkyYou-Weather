export const getUvCategory = (uv: number, t: any) => {
    if (uv <= 2) return t.uvLow;
    if (uv <= 5) return t.uvModerate;
    if (uv <= 7) return t.uvHigh;
    if (uv <= 10) return t.uvVeryHigh;
    return t.uvExtreme;
};

export const getHumidityCategory = (humidity: number, t: any) => {
    if (humidity < 40) return t.humidityLow;
    if (humidity <= 70) return t.humidityModerate;
    return t.humidityHigh;
};

export const saveWeatherToCache = (WEATHER_CACHE_KEY: string, locId: string, data: any) => {
    try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
            locationId: locId,
            data: data
        }));
    } catch (e) {
        console.warn("Failed to save weather cache", e);
    }
};
