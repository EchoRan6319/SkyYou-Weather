
import React, { useRef, useEffect } from 'react';
import { HourlyForecast as HourlyType } from '../types';
import { WeatherIcon } from './Icon';

interface Props {
  data: HourlyType[];
  title: string;
  noDataLabel?: string;
}

const HourlyForecast: React.FC<Props> = ({ data, title, noDataLabel = "No Data" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If user is scrolling vertically, convert to horizontal
      if (e.deltaY !== 0) {
        el.scrollLeft += e.deltaY;
        // CRITICAL: Block the vertical scroll propagation to the entire page
        e.preventDefault();
      }
    };

    // Use native addEventListener with passive: false to allow preventDefault
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="w-full py-4">
      <h3 className="text-sm font-semibold px-6 mb-4 text-[#041e49] dark:text-blue-200 opacity-70 uppercase tracking-wider">{title}</h3>

      {data.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">
          {noDataLabel}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar px-4 space-x-2 pb-2 pt-2"
        >
          {data.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 flex flex-col items-center justify-between bg-[#f0f4fc] dark:bg-gray-900 ring-1 ring-[#dee5f7]/60 dark:ring-gray-800/80 min-w-[4.8rem] h-32 rounded-3xl py-4 transform-gpu will-change-transform backface-hidden overflow-hidden shadow-sm bg-clip-padding"
            >
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.time}</span>
              <WeatherIcon type={item.icon} size={28} className="text-[#041e49] dark:text-blue-200" />
              <span className="text-lg font-bold text-[#041e49] dark:text-blue-100">{Math.round(item.temp)}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HourlyForecast;
