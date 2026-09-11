import React from 'react';
import { Clock } from 'lucide-react';

// The availability column and filter shared by the SuperAdmin recruiter, coach
// and expert lists, so all three read and behave the same way.
//
// Availability has only been collected since registration started asking for
// it, so most people have none — "Not set" is the common case, not an error.
export const TIME_SLOTS = [
  '6 AM - 8 AM', '8 AM - 10 AM', '10 AM - 12 PM', '12 PM - 2 PM',
  '2 PM - 4 PM', '4 PM - 6 PM', '6 PM - 8 PM', '8 PM - 10 PM', '10 PM - 12 AM',
];

const slotsOf = (row) => (Array.isArray(row?.availability) ? row.availability.filter(Boolean) : []);

// The column definition, ready to splice into a material-react-table columns array.
export const availabilityColumn = {
  accessorKey: 'availability',
  header: 'Availability',
  size: 200,
  Cell: ({ row }) => {
    const slots = slotsOf(row.original);
    if (!slots.length) {
      return <span className="text-xs text-gray-400 italic">Not set</span>;
    }
    return (
      <div className="flex flex-wrap gap-1 items-center">
        <Clock size={12} className="text-orange-500 flex-shrink-0" />
        {slots.map(s => (
          <span key={s}
            className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 whitespace-nowrap">
            {s}
          </span>
        ))}
      </div>
    );
  },
  // Sorting puts people who set something above those who did not, then by how
  // early in the day they start — a list sorted by an array is meaningless.
  sortingFn: (a, b) => {
    const A = slotsOf(a.original), B = slotsOf(b.original);
    if (!A.length !== !B.length) return A.length ? -1 : 1;
    return TIME_SLOTS.indexOf(A[0]) - TIME_SLOTS.indexOf(B[0]);
  },
};

// Applies the filter to a row. `mode` is 'all' | 'set' | 'unset'; `slot` is one
// of TIME_SLOTS or '' for any.
export const matchesAvailability = (row, mode, slot) => {
  const slots = slotsOf(row);
  if (mode === 'set' && !slots.length) return false;
  if (mode === 'unset' && slots.length) return false;
  if (slot && !slots.includes(slot)) return false;
  return true;
};

// The filter control, styled to sit alongside the existing filter groups.
export const AvailabilityFilter = ({ mode, setMode, slot, setSlot }) => {
  const btn = (active, onClick, label) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? 'bg-orange-500 text-white shadow-md'
               : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'}`}>
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <Clock size={12} /> Availability:
      </span>
      {btn(mode === 'all', () => { setMode('all'); setSlot(''); }, 'All')}
      {btn(mode === 'set', () => setMode('set'), '✓ Set')}
      {btn(mode === 'unset', () => { setMode('unset'); setSlot(''); }, '✗ Not set')}
      <select
        value={slot}
        onChange={e => { setSlot(e.target.value); if (e.target.value) setMode('set'); }}
        disabled={mode === 'unset'}
        className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-orange-300 text-orange-700 bg-white disabled:opacity-40">
        <option value="">Any time slot</option>
        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
};
