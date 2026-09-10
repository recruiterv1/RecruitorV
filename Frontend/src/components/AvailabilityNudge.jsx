import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Clock, X, ArrowRight } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';

// A quiet nudge for coaches, experts and recruiters who have not set the hours
// they can be reached in.
//
// Deliberately a corner toast rather than a modal: availability only started
// being collected at registration, so most existing members have none, and a
// centre-screen interruption on every login would be worse than the gap it is
// pointing at. Dismissing it holds for a day.
const KEY = 'rv_availability_nudge_dismissed';
const QUIET_HOURS = 24;

const dismissedRecently = () => {
  try {
    const at = Number(localStorage.getItem(KEY) || 0);
    return at && (Date.now() - at) < QUIET_HOURS * 3600 * 1000;
  } catch { return false; }
};

export default function AvailabilityNudge() {
  const { user } = useContext(UserStateContext) || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);

  // Only the roles that have availability at all, and never on the page that
  // sets it — nudging someone who is already there is just noise.
  const role = String(user?.roleCategory || '').toLowerCase();
  const applies = !!user
    && !['clientspoc', 'vendor'].includes(role)
    && user?.type !== 'admin'
    && location.pathname !== '/my-availability';

  useEffect(() => {
    if (!applies || dismissedRecently()) { setShow(false); return; }
    let live = true;
    axios.get('/api/coach-expert/my-availability', { withCredentials: true })
      .then(r => { if (live) setShow((r.data?.availability || []).length === 0); })
      .catch(() => { if (live) setShow(false); })   // not a member, or offline — stay quiet
    return () => { live = false; };
  }, [applies, user?.email, location.pathname]);

  if (!show) return null;

  const close = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ }
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[900] max-w-[330px] rv-nudge">
      <style>{`
        @keyframes rvNudge { from { opacity: 0; transform: translateY(12px); }
                             to   { opacity: 1; transform: none; } }
        .rv-nudge { animation: rvNudge .3s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rv-nudge { animation: none; } }
      `}</style>
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 p-4 pr-9 relative">
        <button onClick={close} aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
          <X size={15} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Clock size={17} className="text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-[13.5px] leading-snug">
              Set the hours you can be reached
            </p>
            <p className="text-[12.5px] text-gray-500 mt-0.5 leading-relaxed">
              Your card shows no availability, so people building a team can't tell when
              to reach you.
            </p>
            <button onClick={() => { close(); navigate('/my-availability'); }}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-blue-600 hover:text-blue-700">
              Add your availability <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
