import React, { useMemo } from 'react';
import { parseExperience, formatExperience, EXPERIENCE_YEAR_OPTIONS } from '../utils/experienceRange';

// Min/max year pickers for a position's experience requirement.
//
// This replaced a fixed list of twelve ranges. That list matched only 62 of 592
// live positions — any requirement it didn't anticipate (3-8, 9-14) simply could
// not be entered. Two pickers cover every range while still producing one
// canonical string, which is what the fixed list was reaching for.
//
// Emits the same `experience` string the position already stores, so nothing
// downstream changes. An existing value of any spelling is read back into the
// pickers, and a value with no numbers at all is kept verbatim rather than lost.
export default function ExperienceRange({ value, onChange, required = false, className = '' }) {
  const parsed = useMemo(() => parseExperience(value), [value]);
  const min = parsed.min;
  const max = parsed.max;
  const openEnded = parsed.ok && parsed.max === null && parsed.min !== '';

  const emit = (nextMin, nextMax) => onChange(formatExperience(nextMin, nextMax));

  const setMin = (v) => {
    if (v === '') return onChange('');
    const lo = Number(v);
    // Keep the pair coherent: a maximum below the new minimum is nonsense.
    const hi = openEnded ? null : (max === '' || max === null || Number(max) < lo ? lo : Number(max));
    emit(lo, hi);
  };

  const setMax = (v) => {
    if (min === '' ) return;
    if (v === 'open') return emit(Number(min), null);
    emit(Number(min), Number(v));
  };

  const sel = 'h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white w-full';

  // A stored value we could not read (no digits at all) — show it rather than
  // silently blanking the field, and let them replace it with the pickers.
  if (value && !parsed.ok) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-700 border-2 border-amber-200 bg-amber-50 rounded-lg px-3 py-2">{value}</span>
          <button type="button" onClick={() => onChange('')}
            className="text-xs font-semibold text-blue-600 hover:underline">Change</button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <select className={sel} value={min === '' ? '' : String(min)}
          onChange={e => setMin(e.target.value)} required={required}>
          <option value="">Min</option>
          {EXPERIENCE_YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          {min !== '' && !EXPERIENCE_YEAR_OPTIONS.includes(Number(min)) && (
            <option value={String(min)}>{min}</option>
          )}
        </select>

        <span className="text-gray-400 text-sm shrink-0">to</span>

        <select className={sel} value={openEnded ? 'open' : (max === '' || max === null ? '' : String(max))}
          onChange={e => setMax(e.target.value)} disabled={min === ''} required={required}>
          <option value="">Max</option>
          {EXPERIENCE_YEAR_OPTIONS.filter(y => min === '' || y >= Number(min))
            .map(y => <option key={y} value={y}>{y}</option>)}
          {max !== '' && max !== null && !EXPERIENCE_YEAR_OPTIONS.includes(Number(max)) && (
            <option value={String(max)}>{max}</option>
          )}
          <option value="open">{min === '' ? 'and above' : `${min}+ (no upper limit)`}</option>
        </select>

        <span className="text-gray-500 text-sm shrink-0">years</span>
      </div>

      {value && (
        <p className="mt-1.5 text-xs text-gray-500">Saved as <span className="font-semibold text-gray-700">{value}</span></p>
      )}
    </div>
  );
}
