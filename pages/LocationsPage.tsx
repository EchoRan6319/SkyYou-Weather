
import React, { useState, useEffect } from 'react';
import { WeatherLocation, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Navigation, Trash2, Search, X, Loader2 } from 'lucide-react';
import { searchCity } from '../services/weatherService';

interface Props {
  locations: WeatherLocation[];
  currentLocationId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (location: WeatherLocation) => void;
}

const LocationsPage: React.FC<Props> = ({ locations, currentLocationId, onSelect, onDelete, onAdd }) => {
  const t = TRANSLATIONS[Language.ZH];

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 1) {
        setIsSearchingApi(true);
        const results = await searchCity(query, Language.ZH);
        setSearchResults(results);
        setIsSearchingApi(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (loc: WeatherLocation) => {
    onAdd(loc);
    setIsSearching(false);
    setQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col min-h-full pb-24 animate-fade-in landscape:pb-6">
      {/* Header / Search Bar */}
      <div className="flex justify-between items-start mb-6">
        {isSearching ? (
          <div className="flex-1 flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-4 h-14">
            <Search size={20} className="text-gray-400 mr-3" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
            />
            {isSearchingApi ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <button
                onClick={() => { setIsSearching(false); setQuery(''); }}
                className="p-2"
                title={t.skip}
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 leading-tight">{t.manageLocations}</h1>
            <button
              onClick={() => setIsSearching(true)}
              className="w-12 h-12 rounded-2xl bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-blue-100 flex items-center justify-center hover:shadow-md transition-all active:scale-95 -mt-1"
              title={t.addLocation}
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
            {searchResults.map((loc) => (
              <div
                key={loc.id}
                onClick={() => handleSelectResult(loc)}
                className="flex flex-col p-4 bg-white rounded-2xl border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="font-bold text-lg text-gray-800">{loc.name}</span>
                <span className="text-sm text-gray-500">{loc.district}</span>
              </div>
            ))}
          </div>
        )}

        {/* Saved Locations List */}
        {!isSearching && locations.map((loc) => {
          const isSelected = loc.id === currentLocationId;
          return (
            <div
              key={loc.id}
              onClick={() => onSelect(loc.id)}
              className={`
                        relative flex items-center justify-between p-6 rounded-3xl transition-all duration-300 border
                        ${isSelected
                  ? 'bg-[#041e49] dark:bg-[#004a77] text-white border-transparent shadow-lg'
                  : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-100 dark:border-gray-800'}
                    `}
            >
              <div className="flex items-center gap-4">
                {loc.isCurrentLocation && (
                  <Navigation size={20} className={isSelected ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'} />
                )}
                <div className="overflow-hidden">
                  <h3 className={`text-xl font-bold truncate pr-4 ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{loc.name}</h3>
                  <p className={`text-sm truncate pr-4 ${isSelected ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {loc.district || (loc.isCurrentLocation ? t.currentLocation : '')}
                  </p>
                </div>
              </div>

              {!loc.isCurrentLocation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(loc.id);
                  }}
                  className={`p-2 rounded-full ${isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500'}`}
                  title={t.clearData}
                  aria-label={t.clearData}
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
