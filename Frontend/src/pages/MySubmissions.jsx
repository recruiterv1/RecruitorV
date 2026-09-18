import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { FileText, Gauge, Loader2, MessageSquare, RotateCcw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import DashShell from '../components/DashShell';

// What became of the candidates this recruiter submitted, and what the coach
// said about each one.
//
// A rejection can be appealed here: the recruiter states their case and it goes
// to the coach who rejected and to the Client SPOC who owns the position.
const scoreColour = (n) =>
  n == null ? 'bg-gray-100 text-gray-500'
  : n >= 75 ? 'bg-emerald-50 text-emerald-700'
  : n >= 50 ? 'bg-amber-50 text-amber-700'
  : 'bg-red-50 text-red-700';

export default function MySubmissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [appealing, setAppealing] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await axios.get('/api/coach-bin/my-submissions', { withCredentials: true });
      setRows(r.data?.submissions || []);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not load your submissions.' });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <DashShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Candidates you sent for review, what the coach decided, and why.
        </p>

        {msg && <p className={`mb-4 text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}

        {loading ? (
          <p className="flex items-center gap-2 text-gray-400 text-sm py-8"><Loader2 size={15} className="animate-spin" /> Loading…</p>
        ) : !rows.length ? (
          <div className="text-center py-16 text-gray-500">
            <FileText size={34} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No submissions have gone through review yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(r => <Row key={r.id} r={r} onAppeal={() => setAppealing(r)} />)}
          </div>
        )}
      </div>

      {appealing && (
        <AppealModal entry={appealing} onClose={() => setAppealing(null)}
          onDone={async (t) => { setAppealing(null); setMsg({ ok: true, text: t }); await load(); }} />
      )}
    </DashShell>
  );
}

function Row({ r, onAppeal }) {
  const decided = r.decision === 'approve' || r.decision === 'reject';
  const approved = r.decision === 'approve';
  const sr = r.secondReview;

  return (
    <div className={`rounded-2xl border-2 p-4 ${
      !decided ? 'border-gray-200 bg-white'
      : approved ? 'border-emerald-200 bg-emerald-50/30'
      : 'border-red-200 bg-red-50/25'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-[15px]">{r.candidateName || '—'}</p>
          <p className="text-[13px] text-gray-600">{r.positionTitle}</p>
          <p className="text-[12px] text-gray-400">{r.client}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-bold ${scoreColour(r.matchPercent)}`}>
            <Gauge size={12} />{r.matchPercent == null ? '—' : `${r.matchPercent}%`}
          </span>
          {decided ? (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold ${
              approved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {approved ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {approved ? 'Approved' : 'Rejected'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold bg-amber-50 text-amber-700">
              <Clock size={12} /> In review
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap text-[12.5px] text-gray-500">
        {r.reviewedByName || r.reviewedBy ? <span>Coach: <strong className="text-gray-700">{r.reviewedByName || r.reviewedBy}</strong></span> : null}
        {r.reviewedAt && <span>{new Date(r.reviewedAt).toLocaleString('en-IN')}</span>}
        {r.currentStatus && <span>Now: <strong className="text-gray-700">{r.currentStatus}</strong></span>}
      </div>

      {/* The coach's own words — the point of this page. */}
      {(r.reason || r.briefing || r.comments || r.suitability) && (
        <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
            <MessageSquare size={11} /> Coach feedback
          </p>
          {r.reason && <p className="text-[12.5px] text-gray-700"><strong>Reason:</strong> {r.reason}</p>}
          {r.briefing && <p className="text-[12.5px] text-gray-700"><strong>Briefing:</strong> {r.briefing}</p>}
          {r.suitability && <p className="text-[12.5px] text-gray-700"><strong>Suitability:</strong> {r.suitability}</p>}
          {r.comments && <p className="text-[12.5px] text-gray-700"><strong>Comments:</strong> {r.comments}</p>}
        </div>
      )}
      {r.missedBriefing && (
        <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-[12.5px] text-amber-900"><strong>Briefing (missed CV):</strong> {r.missedBriefing}</p>
        </div>
      )}

      {/* A second review, once asked for. */}
      {sr && (
        <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1.5">
            <RotateCcw size={11} /> Second review · {sr.outcome ? `resolved — ${sr.outcome === 'overturn' ? 'rejection overturned' : 'rejection upheld'}` : 'awaiting the coach and the client'}
          </p>
          <p className="text-[12.5px] text-gray-700"><strong>Your points:</strong> {sr.recruiterPoints}</p>
          {sr.coachFeedback && <p className="text-[12.5px] text-gray-700"><strong>Coach:</strong> {sr.coachFeedback}</p>}
          {sr.spocFeedback && <p className="text-[12.5px] text-gray-700"><strong>Client:</strong> {sr.spocFeedback}</p>}
        </div>
      )}

      {r.canRequestSecondReview && (
        <button onClick={onAppeal}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-300 text-blue-700 text-[12.5px] font-bold hover:bg-blue-50">
          <RotateCcw size={13} /> Ask for a second review
        </button>
      )}
    </div>
  );
}

function AppealModal({ entry, onClose, onDone }) {
  const [points, setPoints] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!points.trim()) return setErr('Please say why this candidate should be looked at again.');
    setBusy(true); setErr('');
    try {
      const r = await axios.post(`/api/coach-bin/${entry.id}/second-review`, { points }, { withCredentials: true });
      onDone(r.data?.message || 'Second review requested.');
    } catch (e) { setErr(e?.response?.data?.message || 'Could not raise the request.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">Ask for a second review</p>
          <p className="text-[13px] text-gray-500">{entry.candidateName} · {entry.positionTitle}</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-[12px] font-bold text-red-800">The coach rejected this candidate</p>
            {entry.reason && <p className="text-[12.5px] text-red-900 mt-1">{entry.reason}</p>}
          </div>
          <div>
            <label className="text-[12.5px] font-bold text-gray-700">
              Why should this be looked at again? <span className="text-red-500">*</span>
            </label>
            <textarea rows={4} value={points} onChange={e => setPoints(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"
              placeholder="Point to what you think was missed — experience on the CV, something from your conversation with the candidate…" />
          </div>
          <p className="text-[12px] text-gray-500">
            This goes to the coach who reviewed it and to the client for this position. Both will
            see the coach's original feedback alongside your points.
          </p>
          {err && <p className="text-[13px] font-semibold text-red-600">{err}</p>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-[13px] font-bold">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold disabled:opacity-60">
            {busy ? 'Sending…' : 'Request second review'}
          </button>
        </div>
      </div>
    </div>
  );
}
