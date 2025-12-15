import React from 'react';

interface Props {
  aqi: number;
  description: string;
  title: string;
}

const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return 'bg-green-100 text-green-800';
  if (aqi <= 100) return 'bg-yellow-100 text-yellow-800';
  if (aqi <= 150) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const AqiCard: React.FC<Props> = ({ aqi, description, title }) => {
  const colorClass = getAqiColor(aqi);

  return (
    <div className="px-6 mb-2">
      <div className={`flex items-center justify-between rounded-3xl p-5 ${colorClass}`}>
        <div>
          <h4 className="text-sm font-semibold uppercase opacity-70 tracking-wider mb-1">{title}</h4>
          <span className="text-2xl font-bold">{description}</span>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black">{aqi}</span>
          <div className="text-xs font-medium opacity-70 mt-1">AQI CN</div>
        </div>
      </div>
    </div>
  );
};

export default AqiCard;
