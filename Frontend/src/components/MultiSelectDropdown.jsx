import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

/**
 * Reusable multi-select dropdown with checkboxes.
 * Props:
 *   options     — string[]
 *   selected    — string[]
 *   onChange    — (selected: string[]) => void
 *   placeholder — string (default "Select…")
 *   accentColor — tailwind bg class for checked items (default "bg-blue-600")
 */
const MultiSelectDropdown = ({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select…',
  accentColor = 'bg-blue-600',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(s => s !== val));
    else onChange([...selected, val]);
  };

  const clearAll = (e) => { e.stopPropagation(); onChange([]); };

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm bg-white transition-colors min-w-40 max-w-56
          ${open ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
          ${selected.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        {selected.length > 0 && (
          <span onClick={clearAll} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
            <X size={13} />
          </span>
        )}
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-48 max-w-64 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400 italic">No options</p>
          ) : (
            <>
              {selected.length > 0 && (
                <button onClick={() => onChange([])}
                  className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 border-b border-gray-100 font-semibold">
                  Clear all
                </button>
              )}
              {options.map(opt => {
                const checked = selected.includes(opt);
                return (
                  <button key={opt} onClick={() => toggle(opt)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors
                      ${checked ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors
                      ${checked ? `${accentColor} border-transparent` : 'border-gray-300 bg-white'}`}>
                      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
