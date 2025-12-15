
import React from 'react';
import { DailyForecast as DailyType } from '../types';
import { WeatherIcon } from './Icon';

interface Props {
  data: DailyType[];
  title: string;
  todayLabel: string;
}

const DailyForecast: React.FC<Props> = ({ data, title, todayLabel }) => {
  return (
    <div className="w-full px-6 py-4">
      <h3 className="text-sm font-semibold mb-4 text-[#041e49] opacity-70 uppercase tracking-wider">{title}</h3>
      <div className="flex flex-col space-y-1">
        {data.map((day, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 hover:bg-[#f0f4fc] rounded-2xl p-3 transition-colors group"
          >
             {/* Day Name */}
             <div className="w-10 sm:w-14 flex-shrink-0">
                <span className="font-semibold text-gray-700 text-sm">
                    {index === 0 ? todayLabel : day.dayName}
                </span>
             </div>

             {/* Icon & Condition Text */}
             <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-[#041e49] flex-shrink-0">
                  <WeatherIcon type={day.icon} size={24} />
                </div>
                <span className="text-sm text-gray-600 font-medium truncate">
                    {day.condition}
                </span>
             </div>
             
             {/* Temperature Section */}
             <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-medium text-gray-400 w-8 text-right">{Math.round(day.minTemp)}°</span>
                
                {/* Visual Bar - Hidden on very small screens to prioritize text, visible on sm+ */}
                <div className="hidden sm:block w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#d3e3fd] group-hover:bg-[#a8c7fa] transition-colors rounded-full w-[60%] ml-[20%]"></div>
                </div>

                <span className="text-sm font-bold text-gray-900 w-8 text-right">{Math.round(day.maxTemp)}°</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyForecast;
