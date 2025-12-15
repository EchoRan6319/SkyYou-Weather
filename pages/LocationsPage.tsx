
import React, { useState, useEffect } from 'react';
import { WeatherLocation, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Navigation, Trash2, Search, X, Loader2 } from 'lucide-react';
import { searchCity, formatCityDistrict } from '../services/weatherService';

interface Props {
  locations: WeatherLocation[];
  currentLocationId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (location: WeatherLocation) => void;
  lang: Language;
}

const LocationsPage: React.FC<Props> = ({ locations, currentLocationId, onSelect, onDelete, onAdd, lang }) => {
  const t = TRANSLATIONS[lang];
  
  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  // Debounce search
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (query.length > 1) {
        setIsSearchingApi(true);
        try {
          const results = await searchCity(query, lang, controller.signal);
          setSearchResults(results);
        } catch (_) { /* aborted or failed */ }
        setIsSearchingApi(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query, lang]);

  const handleSelectResult = (loc: WeatherLocation) => {
    onAdd(loc);
    setIsSearching(false);
    setQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-24 animate-fade-in landscape:pb-6 landscape:pl-[80px]">
      {/* Header / Search Bar */}
      <div className="flex justify-between items-center mb-6">
        {isSearching ? (
           <div className="flex-1 flex items-center bg-white rounded-2xl shadow-sm border border-gray-100 px-4 h-14">
              <Search size={20} className="text-gray-400 mr-3" />
              <input 
                autoFocus
                type="text"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
              {isSearchingApi ? (
                <Loader2 size={18} className="animate-spin text-gray-400" />
              ) : (
                <button type="button" aria-label="关闭搜索" title="关闭搜索" onClick={() => { setIsSearching(false); setQuery(''); }} className="p-2">
                   <X size={20} className="text-gray-500" />
                </button>
              )}
           </div>
        ) : (
          <>
            <h1 className="text-3xl font-medium text-gray-900">{t.manageLocations}</h1>
            <button 
              type="button"
              aria-label="添加城市"
              title="添加城市"
              onClick={() => setIsSearching(true)}
              className="w-12 h-12 rounded-2xl bg-[#d3e3fd] text-[#041e49] flex items-center justify-center hover:shadow-md transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        
        {/* Search Results */}
        {isSearching && (
          <div className="space-y-3 animate-fade-in">
             {searchResults.length === 0 && query.length > 1 && !isSearchingApi && (
                <div className="text-center text-gray-400 py-8">{t.unknown}</div>
             )}
             {searchResults.map((loc: WeatherLocation) => (
               <div 
                 key={loc.id}
                 onClick={() => handleSelectResult(loc)}
                 className="flex flex-col p-4 bg-white rounded-2xl border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
               >
                  <span className="font-bold text-lg text-gray-800">{formatCityDistrict(loc.name, loc.district)}</span>
               </div>
             ))}
          </div>
        )}

        {/* Saved Locations List */}
        {!isSearching && locations.map((loc: WeatherLocation) => {
            const isSelected = loc.id === currentLocationId;
            return (
                <div 
                    key={loc.id}
                    onClick={() => onSelect(loc.id)}
                    className={`
                        relative flex items-center justify-between p-6 rounded-3xl transition-all duration-300 border
                        ${isSelected ? 'bg-[#041e49] text-white border-transparent shadow-lg' : 'bg-white text-gray-800 border-gray-100'}
                    `}
                >
                    <div className="flex items-center gap-4">
                        {loc.isCurrentLocation && (
                            <Navigation size={20} className={isSelected ? 'text-blue-200' : 'text-blue-500'} />
                        )}
                        <div className="overflow-hidden">
                            <h3 className="text-xl font-bold truncate pr-4">{formatCityDistrict(loc.name, loc.district)}</h3>
                        </div>
                    </div>
                    
                    {!loc.isCurrentLocation && (
                        <button 
                            type="button"
                            aria-label="删除城市"
                            title="删除城市"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                onDelete(loc.id);
                            }}
                            className={`p-2 rounded-full ${isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-red-500'}`}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default LocationsPage;
