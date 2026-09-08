import React from 'react';
import { Clock } from 'lucide-react';

// The two-hour windows someone said they can be reached in, and whether now is
// one of them.
//
// Shown on the team-building cards so a coach picking recruiters — or a
// recruiter picking a coach — can tell who they can actually reach today.

// '6 AM - 8 AM' -> { start: 6, end: 8 } in 24-hour terms.
const parseSlot = (slot) => {
  const m = String(slot).match(/^(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)$/i);
  if (!m) return null;
  const to24 = (h, mer) => {
    h = parseInt(h, 10) % 12;
    return /pm/i.test(mer) ? h + 12 : h;
  };
  const start = to24(m[1], m[2]);
  let end = to24(m[3], m[4]);
  if (end === 0) end = 24;                 // '10 PM - 12 AM' ends at midnight
  return { start, end };
};

// Is the current local time inside any of these windows?
export const isAvailableNow = (availability, now = new Date()) => {
  if (!Array.isArray(availability) || !availability.length) return false;
  const h = now.getHours() + now.getMinutes() / 60;
  return availability.some(s => {
    const w = parseSlot(s);
    return w && h >= w.start && h < w.end;
  });
};

// A recent heartbeat means they are on the platform right now.
export const isOnlineNow = (lastActiveDate, withinMinutes = 15) => {
  if (!lastActiveDate) return false;
  const t = new Date(lastActiveDate).getTime();
  return Number.isFinite(t) && (Date.now() - t) < withinMinutes * 60000;
};

export default function AvailabilityBadge({ availability, compact = false }) {
  const slots = Array.isArray(availability) ? availability : [];
  if (!slots.length) return null;
  const now = isAvailableNow(slots);

  return (
    <div className={compact ? 'mt-1.5' : 'mt-2'}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Clock size={12} className={now ? 'text-emerald-600' : 'text-gray-400'} />
        {slots.map(s => (
          <span key={s}
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
              now ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// The "reachable right now" pill, for the top of a card.
export function AvailableNowPill({ availability, lastActiveDate }) {
  const avail = isAvailableNow(availability);
  const online = isOnlineNow(lastActiveDate);
  if (!avail && !online) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
      online ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-white' : 'bg-emerald-500'}`} />
      {online ? 'Online now' : 'Available now'}
    </span>
  );
}
