
import React from 'react';
import { CurrentWeather, WeatherLocation } from '../types';
import { WeatherIcon } from './Icon';
import { ArrowDown, ArrowUp, Thermometer, MapPin } from 'lucide-react';

interface Props {
  data: CurrentWeather;
  location: WeatherLocation;
  feelsLikeLabel: string;
  uvCategory: string;
  humidityCategory: string;
  onClick?: () => void;
  className?: string;
}

const WeatherCard: React.FC<Props> = ({ data, location, onClick, feelsLikeLabel, className = "" }) => {
  return (
    <div 
      onClick={onClick}
      // Added 'isolate' to ensure proper stacking context for absolute blurs in Safari
      // Added 'transform-gpu' to force hardware acceleration
      className={`relative isolate transform-gpu overflow-hidden w-full bg-[#d3e3fd] text-[#041e49] rounded-[2rem] p-6 xl:p-10 min-h-[220px] shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col items-center justify-between ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none mix-blend-overlay"></div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none mix-blend-overlay"></div>

      {/* Top: Location Pill */}
      <div className="relative z-10 w-full flex justify-center">
        <div className="inline-flex items-center gap-1.5 bg-white/40 backdrop-blur-md pl-3 pr-4 py-1.5 xl:py-2 xl:px-6 rounded-full shadow-sm border border-white/20">
            <MapPin size={16} className="text-[#041e49] xl:w-5 xl:h-5" />
            <span className="font-bold text-sm xl:text-base tracking-wide line-clamp-1 max-w-[200px] text-[#041e49]">
                {location.name}{location.district ? ` ${location.district}` : ''}
            </span>
        </div>
      </div>

      {/* Middle: Main Weather Info (Centered) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full py-2">
          {/* Flex wrap enabled to prevent overlap on narrow screens, justify-center keeps it tidy */}
          <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-2 xl:gap-x-8 w-full">
             
             {/* Icon & Condition Group */}
             <div className="flex items-end gap-2 xl:gap-4 flex-shrink min-w-0 justify-center">
                 <div className="xl:scale-125 origin-bottom-right transition-transform">
                    <WeatherIcon type={data.icon} size={80} className="text-[#041e49] drop-shadow-sm leading-none flex-shrink-0" />
                 </div>
                 {/* Condition Text: Multi-line support, max-width constrained */}
                 <div className="text-xl xl:text-3xl font-bold opacity-90 tracking-wide mb-3 leading-tight break-words max-w-[120px] sm:max-w-[160px] xl:max-w-[200px]">
                     {data.condition}
                 </div>
             </div>

             {/* Temperature */}
             <div className="text-[5rem] sm:text-[5.5rem] xl:text-[8rem] leading-[0.8] font-medium tracking-tighter text-[#041e49] flex-shrink-0 mb-1 xl:-mb-2">
                 {Math.round(data.temp)}°
             </div>
          </div>
      </div>

      {/* Bottom: Stats (Centered) */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5 xl:gap-8">
           
           {/* Feels Like */}
           <div className="flex items-center gap-1.5 opacity-80 whitespace-nowrap">
                <Thermometer size={16} className="xl:w-5 xl:h-5" />
                <span className="text-sm xl:text-lg font-medium">
                    {feelsLikeLabel} {Math.round(data.feelsLike)}°
                </span>
            </div>

           {/* High / Low */}
           <div className="flex items-center gap-3 bg-white/20 px-3 py-1.5 xl:px-5 xl:py-2 rounded-xl backdrop-blur-sm border border-white/10 whitespace-nowrap">
                <span className="flex items-center text-sm xl:text-lg font-bold">
                    <ArrowUp size={16} className="mr-0.5 opacity-70 xl:w-5 xl:h-5"/>
                    {Math.round(data.highTemp)}°
                </span>
                <div className="w-px h-3 xl:h-4 bg-[#041e49]/20"></div>
                <span className="flex items-center text-sm xl:text-lg font-bold">
                    <ArrowDown size={16} className="mr-0.5 opacity-70 xl:w-5 xl:h-5"/>
                    {Math.round(data.lowTemp)}°
                </span>
            </div>
      </div>
    </div>
  );
};

export default WeatherCard;
