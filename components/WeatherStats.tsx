
import React from 'react';
import { CurrentWeather } from '../types';
import { Droplets, Wind, Sun, Activity } from 'lucide-react';

interface Props {
    data: CurrentWeather;
    uvCategory: string;
    humidityCategory: string;
    labels: {
        uv: string;
        wind: string;
        humidity: string;
        aqi: string;
    };
}

const WeatherStats: React.FC<Props> = ({ data, uvCategory, humidityCategory, labels }) => {

    const StatCard = ({
        icon: Icon,
        label,
        value,
        unit,
        subtext,
        bgClass,
        iconBgClass,
        textColor
    }: any) => (
        <div className={`${bgClass} rounded-3xl p-5 flex flex-col justify-between aspect-[1/1] transition-transform active:scale-[0.98] transform-gpu outline outline-1 outline-transparent`}>
            <div className="flex justify-between items-start">
                <div className={`${iconBgClass} p-3 rounded-full`}>
                    <Icon size={22} className={textColor} />
                </div>
                <span className={`text-sm font-semibold uppercase tracking-wider opacity-60 ${textColor}`}>{label}</span>
            </div>

            <div>
                <div className={`text-3xl font-medium tracking-tight ${textColor}`}>
                    {value}<span className="text-lg opacity-60 ml-0.5 font-normal">{unit}</span>
                </div>
                {subtext && <div className={`text-xs font-medium mt-1 opacity-70 ${textColor}`}>{subtext}</div>}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {/* Humidity - Blue/Cyan Theme */}
            <StatCard
                icon={Droplets}
                label={labels.humidity}
                value={data.humidity}
                unit="%"
                subtext={humidityCategory}
                bgClass="bg-[#c3e7ff] dark:bg-[#003351]"
                iconBgClass="bg-white/40 dark:bg-black/20"
                textColor="text-[#001d35] dark:text-blue-100"
            />

            {/* Wind - Green/Teal Theme */}
            <StatCard
                icon={Wind}
                label={labels.wind}
                value={data.windSpeed}
                unit="km/h"
                bgClass="bg-[#c4eed0] dark:bg-[#0b331b]"
                iconBgClass="bg-white/40 dark:bg-black/20"
                textColor="text-[#072111] dark:text-green-100"
            />

            {/* UV Index - Yellow/Orange Theme */}
            <StatCard
                icon={Sun}
                label={labels.uv}
                value={data.uvIndex}
                unit=""
                subtext={uvCategory}
                bgClass="bg-[#ffdf99] dark:bg-[#4d3300]"
                iconBgClass="bg-white/40 dark:bg-black/20"
                textColor="text-[#261900] dark:text-orange-100"
            />

            {/* AQI - Purple/Pink Theme */}
            <StatCard
                icon={Activity}
                label={labels.aqi}
                value={data.aqi}
                unit=""
                subtext={data.aqiDescription}
                bgClass="bg-[#ffd8e4] dark:bg-[#4d1929]"
                iconBgClass="bg-white/40 dark:bg-black/20"
                textColor="text-[#31111d] dark:text-pink-100"
            />
        </div>
    );
};

export default WeatherStats;
