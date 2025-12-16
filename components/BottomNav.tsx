
import React from 'react';
import { Home, MapPin, Settings } from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  labels: { home: string; locations: string; settings: string };
}

const BottomNav: React.FC<Props> = ({ activeTab, onTabChange, labels }) => {
  const navItems = [
    { id: 'home', icon: Home, label: labels.home },
    { id: 'locations', icon: MapPin, label: labels.locations },
    { id: 'settings', icon: Settings, label: labels.settings }
  ];

  return (
    // Landscape: Move to left side, full height, fixed width
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none landscape:top-0 landscape:right-auto landscape:w-[80px] landscape:h-screen landscape:border-r landscape:border-gray-100">
      {/* 
         Fixed: Added 'pb-[calc(8px+env(safe-area-inset-bottom))]' to handle iOS Home Indicator correctly.
         'pb-safe' is not standard in Tailwind CDN.
      */}
      <div className="bg-[#fdfcff]/90 backdrop-blur-lg border-t border-gray-100 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 h-auto flex justify-around items-start max-w-2xl mx-auto rounded-t-3xl pointer-events-auto md:shadow-lg landscape:h-full landscape:w-full landscape:flex-col landscape:justify-center landscape:items-center landscape:gap-8 landscape:rounded-none landscape:border-t-0 landscape:pt-0 landscape:pb-0 landscape:max-w-none landscape:shadow-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center w-20 group min-h-[56px]"
            >
              <div 
                className={`
                  flex items-center justify-center w-16 h-8 rounded-full mb-1 transition-all duration-300
                  ${isActive ? 'bg-[#d3e3fd]' : 'bg-transparent group-hover:bg-gray-100'}
                `}
              >
                <Icon 
                  size={24} 
                  className={`transition-colors duration-300 ${isActive ? 'text-[#041e49]' : 'text-gray-500'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-[#041e49]' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
