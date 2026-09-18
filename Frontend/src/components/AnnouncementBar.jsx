import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Megaphone, X } from 'lucide-react';

// Scrolling announcement bar. Shows only what the signed-in user's own role is
// meant to see — the server decides that, so nothing leaks between roles.
//
// Dismissal is remembered per announcement id in sessionStorage, so a user can
// clear it for the session without it vanishing forever.

const TONES = {
  info:     { bar: 'from-blue-600 to-indigo-600',    text: 'text-white' },
  success:  { bar: 'from-green-600 to-emerald-600',  text: 'text-white' },
  warning:  { bar: 'from-amber-500 to-orange-500',   text: 'text-white' },
  critical: { bar: 'from-red-600 to-rose-600',       text: 'text-white' },
};

const DISMISS_KEY = 'rv_dismissed_announcements';

const readDismissed = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')); }
  catch { return new Set(); }
};

export default function AnnouncementBar() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    let live = true;
    axios.get('/api/announcements/mine', { withCredentials: true })
      // Bars only — anything set to 'toast' is rendered by AnnouncementToast, and
      // showing it here as well would put the same message on screen twice.
      .then(r => { if (live) setItems((r.data?.announcements || []).filter(a => (a.display || 'bar') === 'bar')); })
      .catch(() => { if (live) setItems([]); });   // never break the dashboard
    return () => { live = false; };
  }, []);

  const visible = items.filter(a => !dismissed.has(a.id));

  // Scroll speed follows the amount of text, so a long announcement doesn't race
  // past and a short one doesn't crawl.
  useEffect(() => {
    if (!visible.length) return;
    const chars = visible.reduce((n, a) => n + a.text.length, 0);
    setDuration(Math.min(90, Math.max(18, Math.round(chars / 6))));
  }, [items, dismissed]);

  if (!visible.length) return null;

  // The strongest tone present sets the bar colour.
  const rank = { info: 0, success: 1, warning: 2, critical: 3 };
  const tone = visible.reduce((worst, a) =>
    (rank[a.tone] ?? 0) > (rank[worst] ?? 0) ? a.tone : worst, 'info');
  const style = TONES[tone] || TONES.info;

  const dismiss = () => {
    const next = new Set([...dismissed, ...visible.map(a => a.id)]);
    setDismissed(next);
    try { sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...next])); } catch (_) { /* private mode */ }
  };

  // Rendered twice so the marquee loops without a visible gap.
  const Run = ({ ariaHidden }) => (
    <span className="inline-flex items-center shrink-0" aria-hidden={ariaHidden || undefined}>
      {visible.map(a => (
        <span key={a.id} className="inline-flex items-center">
          <span className="mx-3 opacity-60">•</span>
          {a.link ? (
            <a href={a.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-90">
              {a.text}
            </a>
          ) : a.text}
        </span>
      ))}
    </span>
  );

  return (
    <div className={`relative w-full bg-gradient-to-r ${style.bar} ${style.text} print:hidden`}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Megaphone size={15} className="flex-shrink-0 opacity-90" />

        <div
          className="relative flex-1 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className="inline-flex whitespace-nowrap text-[13px] font-medium will-change-transform"
            style={{
              animation: `rvMarquee ${duration}s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            <Run />
            <Run ariaHidden />
          </div>
        </div>

        <button onClick={dismiss} title="Hide for now" aria-label="Hide announcements"
          className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors">
          <X size={14} />
        </button>
      </div>

      <style>{`
        @keyframes rvMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          /* Respect a reduced-motion preference: hold the text still. */
          [style*="rvMarquee"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
