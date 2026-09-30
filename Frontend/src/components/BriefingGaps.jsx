import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Clock } from 'lucide-react';

// Positions a pilot coach is on but has not briefed.
//
// Since a CV only reaches a coach who has briefed the position, an assignment
// without a briefing sends them nothing — and nothing in the product said so.
// This is the one place that tells them, with the count of what they already
// earn from as the contrast. Renders nothing when there is no gap, and nothing
// at all for anyone outside the pilot.
export default function BriefingGaps() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/coach-bin/briefing-gaps', { withCredentials: true })
      .then(r => { if (r.data?.success) setData(r.data); })
      .catch(() => {});          // not in the pilot, or not a coach — stay silent
  }, []);

  if (!data || !data.count) return null;

  const noHours = !data.availability?.length;

  return (
    <div className="mb-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Mic size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 text-[15px]">
            {data.count} {data.count === 1 ? 'position is' : 'positions are'} waiting for your briefing
          </p>
          <p className="text-[13px] text-gray-700 mt-0.5">
            You are assigned to these, but CVs for them will not reach you until your briefing
            is recorded. {data.earning > 0
              ? `You are already receiving CVs from ${data.earning} other ${data.earning === 1 ? 'position' : 'positions'}.`
              : 'No position is sending you CVs yet.'}
          </p>

          <div className="mt-3 space-y-1.5">
            {data.gaps.slice(0, 5).map(g => (
              <button key={g.pos_id} onClick={() => navigate(`/briefing/${g.pos_id}`)}
                className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400">
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-gray-900 truncate">{g.position}</span>
                  <span className="block text-[11.5px] text-gray-500">{g.client} · {g.skillCategory}</span>
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  {/* A draft is half-done work, which is a different ask from a blank one. */}
                  {g.briefingStatus === 'draft' && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Draft</span>
                  )}
                  <ArrowRight size={14} className="text-amber-600" />
                </span>
              </button>
            ))}
            {data.gaps.length > 5 && (
              <p className="text-[12px] text-gray-500 pl-1">and {data.gaps.length - 5} more</p>
            )}
          </div>

          {/* Being briefed is only half of it — we only alert during declared hours. */}
          {noHours && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-800">
              <Clock size={12} />
              Set your availability too, or we cannot tell you when a CV arrives.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
