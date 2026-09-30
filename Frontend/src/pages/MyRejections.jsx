import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { TrendingDown, Loader2, Lightbulb, Clock, HelpCircle, Copy, Briefcase } from 'lucide-react';
import DashShell from '../components/DashShell';

// Why this recruiter's candidates came back.
//
// One rejection reads as bad luck; the shape of a few months' worth is the part
// worth acting on. The three causes are kept apart on purpose — turned down on
// merit, never looked at, and turned down with nothing written are different
// problems, and only the first is the recruiter's to fix.
export default function MyRejections() {
  const [d, setD] = useState(null);
  const [days, setDays] = useState('90');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await axios.get(`/api/my-rejections?days=${days}`, { withCredentials: true });
      if (r.data?.success) setD(r.data);
      else setErr(r.data?.message || 'Could not load your summary.');
    } catch (e) {
      // A failed load used to render as "nothing rejected", which is a
      // different thing entirely and quietly reassuring in the wrong way.
      setD(null);
      setErr(e?.response?.status === 401 || e?.response?.status === 403
        ? 'Your session has expired — please sign in again.'
        : (e?.response?.data?.message || 'Could not load your summary. Please try again.'));
    }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const rate = d && d.submitted ? Math.round((d.rejected / d.submitted) * 100) : 0;

  const Tile = ({ icon: Icon, label, value, sub, tone }) => (
    <div className="rounded-xl bg-white border border-gray-200 p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        <Icon size={11} /> {label}
      </p>
      <p className={`mt-1 text-[22px] font-bold leading-none ${
        tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-[11.5px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );

  return (
    <DashShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Rejection Summary</h1>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Why your candidates came back, grouped, with what to check before you submit next time.
        </p>

        <div className="flex gap-2 mb-5">
          {[['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last year'], ['all', 'All time']].map(([v, label]) => (
            <button key={v} onClick={() => setDays(v)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border ${
                days === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-gray-400 text-sm py-10">
            <Loader2 size={15} className="animate-spin" /> Working it out…
          </p>
        ) : err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-800">{err}</p>
            <button onClick={load} className="mt-3 px-4 py-2 rounded-lg bg-white border border-red-200 text-[13px] font-bold text-red-700">
              Try again
            </button>
          </div>
        ) : !d || !d.rejected ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <p className="font-semibold text-gray-700">Nothing rejected in this period</p>
            <p className="text-[13px] text-gray-500 mt-1">
              {d?.submitted ? `All ${d.submitted} of your submissions are still live.` : 'No submissions in this period.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <Tile icon={TrendingDown} label="Rejected" value={`${d.rejected} of ${d.submitted}`}
                sub={`${rate}% of what you sent`} tone={rate > 60 ? 'bad' : rate > 35 ? 'warn' : undefined} />
              <Tile icon={Lightbulb} label="On feedback" value={d.onFeedback}
                sub="a reason you can act on" />
              <Tile icon={Clock} label="Never reviewed" value={d.notReviewed}
                sub="closed by the timer, not judged" tone={d.notReviewed ? 'warn' : undefined} />
              <Tile icon={HelpCircle} label="No reason given" value={d.noReason}
                sub="rejected without a note" />
            </div>

            {/* Saying this out loud matters: a recruiter looking at a high
                rejection count should know how much of it was never their call. */}
            {(d.notReviewed > 0 || d.noReason > 0) && (
              <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-[13px] text-amber-900">
                {d.notReviewed > 0 && <>{d.notReviewed} of these were closed because nobody opened them in time, not because of the candidate. </>}
                {d.noReason > 0 && <>{d.noReason} were rejected with no reason recorded. </>}
                Only the {d.onFeedback} marked <b>on feedback</b> tell you anything about your sourcing.
              </div>
            )}

            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Reasons</p>
            <div className="space-y-2 mb-6">
              {d.reasons.map(r => (
                <div key={r.label} className="rounded-xl bg-white border border-gray-200 overflow-hidden">
                  <button onClick={() => setOpen(open === r.label ? null : r.label)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        r.kind === 'feedback' ? 'bg-blue-500' : r.kind === 'system' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                      <span className="text-[13px] font-semibold text-gray-900 truncate">{r.label}</span>
                      {r.kind === 'system' && <span className="text-[10.5px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">not your call</span>}
                    </span>
                    <span className="text-[12px] font-bold text-gray-700 flex-shrink-0">{r.count}</span>
                  </button>
                  {open === r.label && (
                    <div className="px-3.5 pb-3 space-y-2">
                      {r.guidance && <p className="text-[12.5px] text-gray-700 leading-relaxed">{r.guidance}</p>}
                      {r.examples?.length > 0 && (
                        <p className="text-[11.5px] text-gray-500">
                          e.g. {r.examples.map(e => `${e.candidate}${e.position ? ` (${e.position})` : ''}`).join(' · ')}
                        </p>
                      )}
                      {!r.guidance && r.kind === 'feedback' && (
                        <p className="text-[12px] text-gray-400">No guidance recorded for this reason yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {d.byPosition?.length > 0 && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Where they came back from</p>
                <div className="space-y-1.5">
                  {d.byPosition.map(p => (
                    <div key={p.position} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 bg-white">
                      <span className="flex items-center gap-2 min-w-0">
                        <Briefcase size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-[13px] text-gray-800 truncate">{p.position}</span>
                      </span>
                      <span className="text-[12.5px] font-bold text-gray-600 flex-shrink-0">{p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashShell>
  );
}
