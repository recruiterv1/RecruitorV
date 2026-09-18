import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { RotateCcw, Gauge, Loader2, CheckCircle2, XCircle, MessageSquare, User } from 'lucide-react';
import DashShell from '../components/DashShell';

// Second reviews, for the two people who have to look again: the coach who
// rejected the candidate, and the Client SPOC who owns the position.
//
// One screen for both — the difference is which endpoint it reads and whether
// the viewer can settle it. The client can: the position is theirs. The coach
// gives their view on the recruiter's points but does not reverse their own
// decision, which is the thing being disputed.
export default function SecondReviews({ as = 'coach' }) {
  const isSpoc = as === 'spoc';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [responding, setResponding] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await axios.get(isSpoc ? '/api/coach-bin/spoc/second-reviews' : '/api/coach-bin/second-reviews',
        { withCredentials: true });
      setRows(r.data?.requests || []);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not load second reviews.' });
    } finally { setLoading(false); }
  }, [isSpoc]);
  useEffect(() => { load(); }, [load]);

  const open = rows.filter(r => r.status === 'open');
  const done = rows.filter(r => r.status !== 'open');

  return (
    <DashShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <RotateCcw size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Second Reviews</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {isSpoc
            ? 'Candidates a recruiter has asked to be reconsidered for your positions, with the coach’s original feedback.'
            : 'Candidates you rejected that the recruiter has asked you to look at again.'}
        </p>

        {msg && <p className={`mb-4 text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}

        {loading ? (
          <p className="flex items-center gap-2 text-gray-400 text-sm py-8"><Loader2 size={15} className="animate-spin" /> Loading…</p>
        ) : !rows.length ? (
          <div className="text-center py-16 text-gray-500">
            <RotateCcw size={34} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No second reviews waiting.</p>
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <>
                <p className="text-[12px] font-bold uppercase tracking-wide text-gray-400 mb-2">Awaiting a response ({open.length})</p>
                <div className="space-y-3 mb-7">
                  {open.map(r => <Card key={r.id} r={r} isSpoc={isSpoc} onRespond={() => setResponding(r)} />)}
                </div>
              </>
            )}
            {done.length > 0 && (
              <>
                <p className="text-[12px] font-bold uppercase tracking-wide text-gray-400 mb-2">Settled ({done.length})</p>
                <div className="space-y-3">
                  {done.map(r => <Card key={r.id} r={r} isSpoc={isSpoc} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {responding && (
        <RespondModal entry={responding} isSpoc={isSpoc} onClose={() => setResponding(null)}
          onDone={async (t) => { setResponding(null); setMsg({ ok: true, text: t }); await load(); }} />
      )}
    </DashShell>
  );
}

function Card({ r, isSpoc, onRespond }) {
  const settled = r.status !== 'open';
  const overturned = r.outcome === 'overturn';
  return (
    <div className={`rounded-2xl border-2 p-4 ${
      settled ? (overturned ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50')
              : 'border-blue-300 bg-blue-50/30'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-[15px]">{r.candidateName || '—'}</p>
          <p className="text-[13px] text-gray-600">{r.positionTitle}</p>
          <p className="text-[12px] text-gray-400">{r.client} · recruiter {String(r.recruiterEmail || '').split('@')[0]}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-bold ${
            r.matchPercent == null ? 'bg-gray-100 text-gray-500'
            : r.matchPercent >= 75 ? 'bg-emerald-50 text-emerald-700'
            : r.matchPercent >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
            <Gauge size={12} />{r.matchPercent == null ? '—' : `${r.matchPercent}%`}
          </span>
          {settled && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold ${
              overturned ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
              {overturned ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {overturned ? 'Overturned' : 'Upheld'}
            </span>
          )}
        </div>
      </div>

      {/* The coach's original decision. For the client this is the crux: they are
          weighing the recruiter's case against what the coach actually said. */}
      <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3 space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-red-600 flex items-center gap-1.5">
          <XCircle size={11} /> Rejected by {r.reviewedByName || String(r.reviewedBy || '').split('@')[0]}
          {r.reviewedAt && <span className="font-normal text-gray-400 normal-case tracking-normal">· {new Date(r.reviewedAt).toLocaleDateString('en-IN')}</span>}
        </p>
        {r.originalReason && <p className="text-[12.5px] text-gray-700"><strong>Reason:</strong> {r.originalReason}</p>}
        {r.originalBriefing && <p className="text-[12.5px] text-gray-700"><strong>Briefing:</strong> {r.originalBriefing}</p>}
        {r.originalComments && <p className="text-[12.5px] text-gray-700"><strong>Comments:</strong> {r.originalComments}</p>}
      </div>

      <div className="mt-2 rounded-xl bg-blue-50 border border-blue-200 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1.5">
          <User size={11} /> The recruiter's case
        </p>
        <p className="text-[12.5px] text-gray-800 mt-1">{r.recruiterPoints}</p>
      </div>

      {(r.coachFeedback || r.spocFeedback) && (
        <div className="mt-2 rounded-xl bg-white border border-gray-200 p-3 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
            <MessageSquare size={11} /> Second-review feedback
          </p>
          {r.coachFeedback && <p className="text-[12.5px] text-gray-700"><strong>Coach:</strong> {r.coachFeedback}</p>}
          {r.spocFeedback && <p className="text-[12.5px] text-gray-700"><strong>Client:</strong> {r.spocFeedback}</p>}
        </div>
      )}

      {!settled && onRespond && (
        <button onClick={onRespond}
          className="mt-3 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-[13px] font-bold">
          {isSpoc ? 'Decide' : 'Add your view'}
        </button>
      )}
    </div>
  );
}

function RespondModal({ entry, isSpoc, onClose, onDone }) {
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!feedback.trim()) return setErr('Feedback is required.');
    if (isSpoc && !decision) return setErr('Please uphold or overturn the rejection.');
    setBusy(true); setErr('');
    try {
      const r = await axios.post(`/api/coach-bin/${entry.id}/second-review/feedback`,
        { feedback, ...(decision ? { decision } : {}) }, { withCredentials: true });
      onDone(r.data?.message || 'Saved.');
    } catch (e) { setErr(e?.response?.data?.message || 'Could not save.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">{entry.candidateName}</p>
          <p className="text-[13px] text-gray-500">{entry.positionTitle} · {entry.client}</p>
        </div>
        <div className="p-5 space-y-3.5">
          {isSpoc && (
            <div className="flex gap-2">
              {[['overturn', 'Overturn — send through', CheckCircle2, true], ['uphold', 'Uphold the rejection', XCircle, false]].map(([v, label, Icon, good]) => (
                <button key={v} onClick={() => setDecision(v)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-bold border-2 ${
                    decision === v
                      ? (good ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-400 bg-gray-100 text-gray-700')
                      : 'border-gray-200 text-gray-500'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="text-[12.5px] font-bold text-gray-700">
              Your feedback <span className="text-red-500">*</span>
            </label>
            <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"
              placeholder={isSpoc
                ? 'What you make of the coach’s reasoning and the recruiter’s points'
                : 'Your view on the points the recruiter has raised'} />
          </div>
          {!isSpoc && (
            <p className="text-[12px] text-gray-500">
              The client decides the outcome for this position — your view goes to them alongside
              the recruiter's.
            </p>
          )}
          {err && <p className="text-[13px] font-semibold text-red-600">{err}</p>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-[13px] font-bold">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold disabled:opacity-60">
            {busy ? 'Saving…' : isSpoc ? 'Submit decision' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
