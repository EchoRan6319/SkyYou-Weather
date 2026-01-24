import React from 'react';
import { 
  Sun, Moon, CloudSun, CloudMoon, Cloud, CloudRain, 
  CloudSnow, Wind, CloudFog, CloudLightning, Droplets,
  Thermometer, Gauge, Eye, Navigation
} from 'lucide-react';
import { WeatherIconType } from '../types';

interface WeatherIconProps {
  type: WeatherIconType;
  size?: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ type, size = 24, className = "" }) => {
  const props = { size, className };

  switch (type) {
    case 'clear-day': return <Sun {...props} className={`${className} text-orange-400`} />;
    case 'clear-night': return <Moon {...props} className={`${className} text-indigo-400`} />;
    case 'partly-cloudy-day': return <CloudSun {...props} className={`${className} text-yellow-500`} />;
    case 'partly-cloudy-night': return <CloudMoon {...props} className={`${className} text-indigo-300`} />;
    case 'cloudy': return <Cloud {...props} className={`${className} text-gray-400`} />;
    case 'rain': return <CloudRain {...props} className={`${className} text-blue-400`} />;
    case 'snow': return <CloudSnow {...props} className={`${className} text-cyan-200`} />;
    case 'wind': return <Wind {...props} className={`${className} text-gray-500`} />;
    case 'fog': return <CloudFog {...props} className={`${className} text-gray-300`} />;
    case 'thunderstorm': return <CloudLightning {...props} className={`${className} text-purple-500`} />;
    default: return <CloudSun {...props} />;
  }
};
