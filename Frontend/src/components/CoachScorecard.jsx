import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, Clock, ShieldCheck, Hourglass } from 'lucide-react';

// How a coach's reviews have held up.
//
// Silent for anyone outside the pilot, and silent until they have reviewed
// something — a scorecard reading zero on every line is discouraging, not
// informative.
export default function CoachScorecard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    axios.get('/api/coach-bin/my-scorecard', { withCredentials: true })
      .then(r => { if (r.data?.success) setD(r.data); })
      .catch(() => {});
  }, []);

  if (!d || !d.reviewed) return null;

  const mins = d.medianReviewMs == null ? null : Math.round(d.medianReviewMs / 60000);
  const agree = d.agreementRate;

  const Tile = ({ icon: Icon, label, value, sub, tone = 'gray' }) => (
    <div className="rounded-xl bg-white border border-gray-200 p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        <Icon size={11} /> {label}
      </p>
      <p className={`mt-1 text-[22px] font-bold leading-none ${
        tone === 'good' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-[11.5px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <p className="font-bold text-gray-900 text-[15px] mb-3">Your review record</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile icon={Award} label="Reviewed" value={d.reviewed}
          sub={`${d.approved} approved · ${d.rejected} rejected`} />
        <Tile icon={Clock} label="Typical time" value={mins == null ? '—' : `${mins} min`}
          sub="claim to decision" />
        {/* An open dispute is not a disagreement yet, so it is shown apart from
            the rate rather than counted against it. */}
        <Tile icon={ShieldCheck} label="Client agreed"
          value={agree == null ? '—' : `${agree}%`}
          tone={agree == null ? 'gray' : agree >= 70 ? 'good' : 'warn'}
          sub={agree == null ? 'no dispute settled yet'
            : `${d.upheld} upheld · ${d.overturned} overturned`} />
        <Tile icon={Hourglass} label="Disputed" value={d.disputed}
          sub={d.pendingDisputes ? `${d.pendingDisputes} with the client now` : 'all settled'} />
      </div>
    </div>
  );
}
