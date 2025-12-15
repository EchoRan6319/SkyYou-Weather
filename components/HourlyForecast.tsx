
import React from 'react';
import { HourlyForecast as HourlyType } from '../types';
import { WeatherIcon } from './Icon';

interface Props {
  data: HourlyType[];
  title: string;
  noDataLabel?: string;
}

const HourlyForecast: React.FC<Props> = ({ data, title, noDataLabel = "No Data" }) => {
  return (
    <div className="w-full py-4">
      <h3 className="text-sm font-semibold px-6 mb-4 text-[#041e49] opacity-70 uppercase tracking-wider">{title}</h3>
      
      {data.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
              {noDataLabel}
          </div>
      ) : (
          <div className="flex overflow-x-auto no-scrollbar px-4 space-x-2 pb-2">
            {data.map((item, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 flex flex-col items-center justify-between bg-[#f0f4fc] min-w-[4.5rem] h-32 rounded-[1.5rem] py-4"
              >
                <span className="text-xs font-medium text-gray-500">{item.time}</span>
                <WeatherIcon type={item.icon} size={28} className="text-[#041e49]" />
                <span className="text-lg font-bold text-[#041e49]">{Math.round(item.temp)}°</span>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default HourlyForecast;
