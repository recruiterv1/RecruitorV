import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Info, CheckCircle2, AlertTriangle, AlertOctagon, ExternalLink } from 'lucide-react';

// Announcements a SuperAdmin chose to send as a toast rather than a bar.
//
// Same targeting as the bar — the server returns only what this user's role is
// meant to see — but a toast sits in the corner and can be dismissed, and stays
// dismissed for that person. Several stack.
const KEY = 'rv_toast_dismissed';

const TONE = {
  info:     { icon: Info,         ring: 'border-blue-200',    dot: 'bg-blue-500',    fg: 'text-blue-700' },
  success:  { icon: CheckCircle2, ring: 'border-emerald-200', dot: 'bg-emerald-500', fg: 'text-emerald-700' },
  warning:  { icon: AlertTriangle,ring: 'border-amber-200',   dot: 'bg-amber-500',   fg: 'text-amber-700' },
  critical: { icon: AlertOctagon, ring: 'border-red-200',     dot: 'bg-red-500',     fg: 'text-red-700' },
};

const readDismissed = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export default function AnnouncementToast() {
  const [items, setItems] = useState([]);
  const [gone, setGone] = useState(readDismissed);

  useEffect(() => {
    let live = true;
    axios.get('/api/announcements/mine', { withCredentials: true })
      .then(r => {
        if (!live) return;
        setItems((r.data?.announcements || []).filter(a => a.display === 'toast'));
      })
      .catch(() => { if (live) setItems([]); });   // never let this break a page
    return () => { live = false; };
  }, []);

  const dismiss = (id) => {
    const next = [...new Set([...gone, id])];
    setGone(next);
    // Remembered per person, so a dismissed toast does not come back on every
    // page they open.
    try { localStorage.setItem(KEY, JSON.stringify(next.slice(-50))); } catch { /* private mode */ }
  };

  const visible = items.filter(a => !gone.includes(a.id));
  if (!visible.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[950] flex flex-col gap-2 max-w-[340px]">
      <style>{`
        @keyframes rvToastIn { from { opacity: 0; transform: translateY(10px); }
                               to   { opacity: 1; transform: none; } }
        .rv-toast { animation: rvToastIn .28s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rv-toast { animation: none; } }
      `}</style>

      {visible.map(a => {
        const t = TONE[a.tone] || TONE.info;
        const Icon = t.icon;
        return (
          <div key={a.id}
            className={`rv-toast rounded-2xl bg-white shadow-2xl border ${t.ring} p-3.5 pr-9 relative`}>
            <button onClick={() => dismiss(a.id)} aria-label="Dismiss"
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <X size={14} />
            </button>
            <div className="flex items-start gap-2.5">
              <Icon size={17} className={`${t.fg} flex-shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <p className="text-[13px] text-gray-800 leading-relaxed">{a.text}</p>
                {a.link && (
                  <a href={a.link} target="_blank" rel="noopener noreferrer"
                    className={`mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-bold ${t.fg} hover:underline`}>
                    Open <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
