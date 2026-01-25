import React from 'react';
import { WeatherData, WeatherLocation } from '../types';
import WeatherCard from './WeatherCard';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import WeatherStats from './WeatherStats';
import WeatherAlerts from './WeatherAlerts';
import { getUvCategory, getHumidityCategory } from '../utils/weatherUtils';

interface HomeViewProps {
    weather: WeatherData;
    locations: WeatherLocation[];
    currentLocationId: string;
    translations: any;
    loading: boolean;
    onLocationClick: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({
    weather,
    locations,
    currentLocationId,
    translations,
    loading,
    onLocationClick
}) => {
    const t = translations;

    if (loading && !weather) {
        return (
            <div className="flex items-center justify-center min-h-[100dvh] bg-[#fdfcff]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!weather) return null;

    const currentLoc = locations.find(l => l.id === currentLocationId) || locations[0];

    const getDisplayAlerts = (w: WeatherData) => {
        const existingAlerts = w.alerts || [];
        const hasRainSoon = w.hourly.slice(0, 2).some(h => h.pop > 40 || /rain|snow|thunderstorm/.test(h.icon));

        if (hasRainSoon) {
            const precipAlert = {
                title: t.precipWarning,
                description: t.precipWarningDesc,
                level: 'moderate',
                source: 'SkyYou'
            };
            return [precipAlert, ...existingAlerts];
        }
        return existingAlerts;
    };

    const displayAlerts = getDisplayAlerts(weather);

    return (
        <div className="min-h-[100dvh] bg-[#fdfcff] dark:bg-[#030712] pb-[calc(110px+env(safe-area-inset-bottom))] landscape:h-[100dvh] landscape:pb-0 landscape:overflow-hidden">
            <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pt-6 lg:pt-8 animate-fade-in landscape:h-full landscape:flex landscape:flex-col">

                <div className="mb-4 flex-shrink-0 landscape:mb-6 select-none touch-none">
                    <h1 className="text-3xl font-medium text-[#1f1f1f] dark:text-gray-200 tracking-tight font-sans leading-tight">SkyYou Weather</h1>
                </div>

                <div className="flex flex-col gap-4 landscape:grid landscape:grid-cols-12 landscape:gap-8 landscape:flex-1 landscape:min-h-0">
                    <div className="landscape:col-span-5 lg:landscape:col-span-4 landscape:h-full landscape:overflow-hidden landscape:no-scrollbar select-none">
                        <div className="flex flex-col w-full landscape:min-h-full landscape:pb-4 sm:landscape:pb-6">
                            <WeatherCard
                                data={weather.current}
                                location={currentLoc}
                                feelsLikeLabel={t.feelsLike}
                                uvCategory={""}
                                humidityCategory={""}
                                onClick={onLocationClick}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="landscape:col-span-7 lg:landscape:col-span-8 flex flex-col gap-4 landscape:h-full landscape:overflow-y-auto no-scrollbar landscape:pr-2 landscape:pb-4 sm:landscape:pb-6">
                        {displayAlerts.length > 0 && (
                            <div className="flex-shrink-0">
                                <WeatherAlerts alerts={displayAlerts as any} />
                            </div>
                        )}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-sm border border-gray-100/50 dark:border-gray-800/50 flex-shrink-0 transform-gpu outline outline-1 outline-transparent">
                            <HourlyForecast data={weather.hourly} title={t.hourly} noDataLabel={t.noData} />
                        </div>
                        <div className="flex-shrink-0">
                            <WeatherStats
                                data={weather.current}
                                uvCategory={getUvCategory(weather.current.uvIndex, t)}
                                humidityCategory={getHumidityCategory(weather.current.humidity, t)}
                                labels={{ uv: t.uvIndex, wind: t.wind, humidity: t.humidity, aqi: t.aqi }}
                            />
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-sm border border-gray-100/50 dark:border-gray-800/50 flex-shrink-0 transform-gpu outline outline-1 outline-transparent">
                            <DailyForecast data={weather.daily} title={t.daily} todayLabel={t.today} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;
