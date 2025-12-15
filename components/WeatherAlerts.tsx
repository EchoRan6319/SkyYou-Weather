
import React, { useState } from 'react';
import { WeatherAlert } from '../types';
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface Props {
  alerts: WeatherAlert[];
}

const WeatherAlerts: React.FC<Props> = ({ alerts }) => {
  const [expanded, setExpanded] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  // Prioritize rendering: Get the first alert
  const primaryAlert = alerts[0];

  // Determine color based on simple keywords (fallback to red/orange)
  // Real apps might parse alert level codes.
  const isSevere = primaryAlert.level === 'severe' || primaryAlert.title.includes('红') || primaryAlert.title.includes('Red');
  const bgColor = isSevere ? 'bg-red-100' : 'bg-orange-100';
  const textColor = isSevere ? 'text-red-900' : 'text-orange-900';
  const iconColor = isSevere ? 'text-red-600' : 'text-orange-600';

  return (
    <div className={`w-full rounded-[2rem] p-4 ${bgColor} transition-all duration-300 animate-fade-in`}>
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-3">
           <div className={`p-2 bg-white/60 rounded-full ${iconColor}`}>
             <AlertTriangle size={20} />
           </div>
           <div>
             <h3 className={`font-bold text-base ${textColor} leading-tight mb-1`}>
                {primaryAlert.title}
             </h3>
             <p className={`text-xs font-medium opacity-80 ${textColor}`}>
                {primaryAlert.source}
             </p>
           </div>
        </div>
        <button className={`p-1 rounded-full hover:bg-white/30 ${textColor}`}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
          <div className={`mt-3 pt-3 border-t border-black/5 ${textColor} text-sm leading-relaxed whitespace-pre-wrap`}>
            {primaryAlert.description}
            
            {alerts.length > 1 && (
                <div className="mt-4 pt-2 border-t border-black/5">
                    <div className="text-xs font-bold opacity-70 mb-2 uppercase">其他预警 ({alerts.length - 1})</div>
                    {alerts.slice(1).map((alert, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                            <span className="font-bold block">{alert.title}</span>
                            <span className="text-xs opacity-80">{alert.description}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default WeatherAlerts;
