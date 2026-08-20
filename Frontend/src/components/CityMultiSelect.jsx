import React, { useState } from 'react';
import { Search, Plus, X, CheckCircle } from 'lucide-react';
import { searchCities } from '../data/indiaCities';

/**
 * Job-location picker: type a city, pick from the ranked suggestions, select as
 * many as needed. Any Indian city in any state is searchable, former names
 * resolve to the current one (Bangalore → Bengaluru), and anything genuinely
 * missing can be added as a custom city.
 *
 * The value is the same plain array of city-name strings the forms already
 * save, so nothing downstream changes.
 *
 * @param {string[]} value      selected cities
 * @param {(next: string[]) => void} onChange
 * @param {string} placeholder
 */
export default function CityMultiSelect({ value = [], onChange, placeholder = 'Type a city — e.g. Pune, Coimbatore, Siliguri…' }) {
  const [search, setSearch] = useState('');
  const [hi, setHi] = useState(-1);          // keyboard-highlighted suggestion
  const [focused, setFocused] = useState(false);
  const [custom, setCustom] = useState([]);  // cities added by hand this session

  const selected = Array.isArray(value) ? value : [];
  const trimmed = search.trim();
  const suggestions = searchCities(search, custom, 12);
  const exists = trimmed && [...custom, ...suggestions.map(s => s.city)]
    .some(c => c.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !exists;

  const pick = (city) => {
    if (!selected.some(c => c.toLowerCase() === city.toLowerCase())) onChange([...selected, city]);
    setSearch('');
    setHi(-1);
  };

  const addCustom = () => {
    if (!trimmed) return;
    setCustom(prev => [...prev, trimmed]);
    pick(trimmed);
  };

  const remove = (city) => onChange(selected.filter(c => c !== city));

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hi >= 0 && suggestions[hi]) pick(suggestions[hi].city);
      else if (suggestions.length) pick(suggestions[0].city);
      else if (canAdd) addCustom();
    } else if (e.key === 'Escape') { setFocused(false); }
    else if (e.key === 'Backspace' && !search && selected.length) { remove(selected[selected.length - 1]); }
  };

  return (
    <div>
      <div className="relative">
        <Search size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          autoComplete="off"
          onChange={(e) => { setSearch(e.target.value); setHi(-1); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKeyDown}
          className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
        />

        {focused && trimmed.length > 0 && (suggestions.length > 0 || canAdd) && (
          <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {suggestions.map((sug, i) => {
              const picked = selected.some(c => c.toLowerCase() === sug.city.toLowerCase());
              return (
                <button
                  key={sug.city}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(sug.city)}
                  className={`w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 text-left transition-colors ${
                    i === hi ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <span className="min-w-0">
                    <span className="text-sm font-semibold text-gray-800">{sug.city}</span>
                    {sug.state && <span className="text-xs text-gray-500">, {sug.state}</span>}
                    {sug.via && <span className="text-[11px] text-gray-400 ml-1">(also “{sug.via}”)</span>}
                  </span>
                  {picked
                    ? <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                    : <Plus size={15} className="text-blue-500 flex-shrink-0" />}
                </button>
              );
            })}
            {canAdd && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addCustom}
                className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-left border-t border-gray-100 hover:bg-blue-50"
              >
                <Plus size={15} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-700">Add “{trimmed}” as a new city</span>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-1.5 text-[11px] text-gray-400">
        Start typing to see matching cities — pick as many as you need. Not listed? You can add it.
      </p>

      {selected.length > 0 && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Selected Cities ({selected.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map(city => (
              <span
                key={city}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium"
              >
                {city}
                <button
                  type="button"
                  onClick={() => remove(city)}
                  className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                >
                  <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
