import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Inbox, Clock, Lock, CheckCircle2, XCircle, Loader2, AlertTriangle, Gauge, FileText, ExternalLink, Mail, Phone, Briefcase, MapPin } from 'lucide-react';
import DashShell from '../components/DashShell';
import useReviewReasons from '../hooks/useReviewReasons';

// The Coach/Expert review bin.
//
// A recruiter's candidate waits here before the Client SPOC sees them. Two
// clocks run, both from the original submission: four hours to be claimed by
// any eligible coach, one hour to finish a review once claimed. Past four hours
// the candidate goes to the SPOC anyway and lands under Missed CVs.
const fmt = (ms) => {
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
};

const scoreColour = (n) =>
  n == null ? 'bg-gray-100 text-gray-500'
  : n >= 75 ? 'bg-emerald-50 text-emerald-700'
  : n >= 50 ? 'bg-amber-50 text-amber-700'
  : 'bg-red-50 text-red-700';

export default function CoachBin() {
  const [tab, setTab] = useState('bin');
  const [rows, setRows] = useState([]);
  const [missed, setMissed] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [tick, setTick] = useState(0);
  const [held, setHeld] = useState(0);
  const [maxClaims, setMaxClaims] = useState(4);

  const load = useCallback(async () => {
    try {
      const [a, m, v] = await Promise.all([
        axios.get('/api/coach-bin/available', { withCredentials: true }),
        axios.get('/api/coach-bin/missed', { withCredentials: true }).catch(() => null),
        axios.get('/api/coach-bin/reviewed', { withCredentials: true }).catch(() => null),
      ]);
      setRows(a.data?.requests || []);
      setHeld(a.data?.held ?? 0);
      setMaxClaims(a.data?.maxClaims ?? 4);
      setMissed(m?.data?.requests || []);
      setReviewed(v?.data?.requests || []);
      setMsg(null);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not load the bin.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  // The countdowns must move without re-fetching every second.
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const left = (iso) => (iso ? new Date(iso).getTime() - Date.now() : 0);

  const release = async (r) => {
    setBusy(r.id); setMsg(null);
    try {
      const res = await axios.post(`/api/coach-bin/${r.id}/release`, {}, { withCredentials: true });
      setMsg({ ok: true, text: res.data?.message || 'Released.' });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not release that candidate.' });
      await load();
    } finally { setBusy(''); }
  };

  const claim = async (r) => {
    setBusy(r.id); setMsg(null);
    try {
      await axios.post(`/api/coach-bin/${r.id}/claim`, {}, { withCredentials: true });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not claim that candidate.' });
      await load();
    } finally { setBusy(''); }
  };

  const atCap = held >= maxClaims;

  const Card = ({ r, isMissed }) => {
    const avail = left(r.expiresAt);
    const claimLeft = left(r.claimExpiresAt);
    const mine = !!r.claimedBy;
    return (
      <div className={`rounded-2xl border-2 p-4 ${
        isMissed ? 'border-gray-200 bg-gray-50'
        : mine ? 'border-blue-300 bg-blue-50/40'
        : avail < 30 * 60000 ? 'border-amber-300 bg-amber-50/40'
        : 'border-gray-200 bg-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-[15px] truncate">{r.candidateName || '—'}</p>
            <p className="text-[13px] text-gray-600 truncate">{r.positionTitle}</p>
            <p className="text-[12px] text-gray-400 truncate">{r.client} · from {String(r.recruiterEmail).split('@')[0]}</p>
          </div>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-bold ${scoreColour(r.matchPercent)}`}>
            <Gauge size={12} />{r.matchPercent == null ? '—' : `${r.matchPercent}%`}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap text-[12.5px]">
          {isMissed ? (
            <span className="inline-flex items-center gap-1.5 text-gray-500 font-semibold">
              <AlertTriangle size={13} /> Window closed
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 font-semibold ${
              avail < 30 * 60000 ? 'text-amber-700' : 'text-gray-600'}`}>
              <Clock size={13} /> Available for: {fmt(avail)}
            </span>
          )}
          {mine && !isMissed && (
            <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold">
              <Lock size={13} /> Yours for {fmt(claimLeft)}
            </span>
          )}
          {r.currentStatus && (
            <span className="text-gray-500">Status: <strong className="text-gray-700">{r.currentStatus}</strong></span>
          )}
        </div>

        {isMissed && r.reviewedByOther && (
          <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3">
            <p className="text-[12px] font-bold text-gray-700">Reviewed by another coach</p>
            {r.otherCoachReason && <p className="text-[12.5px] text-gray-600 mt-1"><strong>Reason:</strong> {r.otherCoachReason}</p>}
            {r.otherCoachBriefing && <p className="text-[12.5px] text-gray-600 mt-1"><strong>Briefing:</strong> {r.otherCoachBriefing}</p>}
          </div>
        )}

        <div className="flex gap-2 mt-3.5">
          {isMissed ? (
            <button onClick={() => setReviewing({ ...r, missedOnly: true })}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-700 text-[12.5px] font-bold hover:bg-white">
              Add a briefing
            </button>
          ) : mine ? (
            <>
              <button onClick={() => setReviewing(r)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-[13px] font-bold">
                Review candidate
              </button>
              {/* Claimed the wrong CV? Hand it straight back rather than
                  locking it away from everyone else for the full hour. */}
              <button onClick={() => release(r)} disabled={busy === r.id}
                title="Return this candidate to the bin"
                className="px-3 py-2.5 rounded-lg border-2 border-gray-300 text-gray-600 text-[12.5px] font-bold hover:bg-gray-50 disabled:opacity-60">
                {busy === r.id ? '…' : 'Release'}
              </button>
            </>
          ) : (
            <button onClick={() => claim(r)} disabled={busy === r.id || atCap}
              title={atCap ? `You are holding ${held} of ${maxClaims} — review or release one first` : undefined}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-[13px] font-bold disabled:opacity-40">
              {busy === r.id ? 'Claiming…' : atCap ? 'Limit reached' : 'Claim'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const list = tab === 'bin' ? rows : tab === 'reviewed' ? reviewed : missed;

  return (
    <DashShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Inbox size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Review Bin</h1>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Candidates waiting on your review before the client sees them. Claim one to lock it
          for an hour; every candidate leaves the bin four hours after it was submitted.
        </p>

        <div className="flex gap-2 mb-5">
          {[['bin', `Bin (${rows.length})`], ['reviewed', `Reviewed (${reviewed.length})`], ['missed', `Missed CVs (${missed.length})`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold border-2 transition ${
                tab === id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* How many you are holding — claiming locks a candidate away from every
            other coach, so the cap is worth showing before it bites. */}
        {tab === 'bin' && (
          <p className={`mb-3 text-[12.5px] font-semibold ${atCap ? 'text-amber-700' : 'text-gray-500'}`}>
            Holding {held} of {maxClaims}
            {atCap && ' — review or release one before claiming another.'}
          </p>
        )}

        {msg && <p className={`mb-4 text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}

        {loading ? (
          <p className="flex items-center gap-2 text-gray-400 text-sm py-8"><Loader2 size={15} className="animate-spin" /> Loading…</p>
        ) : !list.length ? (
          <div className="text-center py-16 text-gray-500">
            <Inbox size={34} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{
              tab === 'bin' ? 'Nothing waiting for review.'
              : tab === 'reviewed' ? 'You have not reviewed any candidates yet.'
              : 'No missed CVs.'}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map(r => tab === 'reviewed'
              ? <ReviewedCard key={r.id} r={r} />
              : <Card key={r.id} r={r} isMissed={tab === 'missed'} />)}
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewModal entry={reviewing} onClose={() => setReviewing(null)}
          onDone={async (text) => { setReviewing(null); setMsg({ ok: true, text }); await load(); }} />
      )}
    </DashShell>
  );
}

// A candidate this coach has already decided on, and where they got to since.
function ReviewedCard({ r }) {
  const approved = r.decision === 'approve';
  return (
    <div className={`rounded-2xl border-2 p-4 ${approved ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/30'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-[15px] truncate">{r.candidateName || '—'}</p>
          <p className="text-[13px] text-gray-600 truncate">{r.positionTitle}</p>
          <p className="text-[12px] text-gray-400 truncate">{r.client}</p>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold ${
          approved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {approved ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {approved ? 'Approved' : 'Rejected'}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2.5 flex-wrap text-[12.5px]">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${scoreColour(r.matchPercent)}`}>
          <Gauge size={11} />{r.matchPercent == null ? '—' : `${r.matchPercent}%`}
        </span>
        {r.reviewedAt && (
          <span className="text-gray-500">Reviewed {new Date(r.reviewedAt).toLocaleString('en-IN')}</span>
        )}
        {/* Where the candidate stands now — a SPOC may have moved them on. */}
        {r.currentStatus && (
          <span className="text-gray-500">Now: <strong className="text-gray-700">{r.currentStatus}</strong></span>
        )}
      </div>

      <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3 space-y-1.5">
        {r.reason && <p className="text-[12.5px] text-gray-700"><strong>Reason:</strong> {r.reason}</p>}
        {r.briefing && <p className="text-[12.5px] text-gray-700"><strong>Briefing:</strong> {r.briefing}</p>}
        {r.suitability && <p className="text-[12.5px] text-gray-700"><strong>Suitability:</strong> {r.suitability}</p>}
      </div>
    </div>
  );
}

// The decision. Reason and briefing are required either way — the recruiter is
// shown both, and a verdict with no explanation teaches them nothing.
function ReviewModal({ entry, onClose, onDone }) {
  const missedOnly = entry.missedOnly;
  // The candidate themselves. A name and a job title is not enough to judge
  // anyone, so the record and the CV are pulled in when the modal opens.
  const [cand, setCand] = useState(null);
  const [pos, setPos] = useState(null);
  const [loadingCand, setLoadingCand] = useState(true);

  useEffect(() => {
    let live = true;
    axios.get(`/api/coach-bin/${entry.id}/candidate`, { withCredentials: true })
      .then(r => { if (live) { setCand(r.data?.candidate || null); setPos(r.data?.position || null); } })
      .catch(() => { if (live) setCand(null); })
      .finally(() => { if (live) setLoadingCand(false); });
    return () => { live = false; };
  }, [entry.id]);
  const [decision, setDecision] = useState('approve');
  const [reason, setReason] = useState('');
  // On a rejection the coach picks from the same list the Client SPOC uses, so
  // the two can be counted together and mean the same thing.
  const [rejectCategory, setRejectCategory] = useState('');
  const [approveCategory, setApproveCategory] = useState('');
  // Maintained by an admin; falls back to the built-in list if unreachable.
  const { rejectReasons, approveReasons } = useReviewReasons();
  const [briefing, setBriefing] = useState('');
  const [comments, setComments] = useState('');
  const [suitability, setSuitability] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (missedOnly) {
      if (!briefing.trim()) return setErr('A briefing is required.');
      setBusy(true);
      try {
        await axios.post(`/api/coach-bin/missed/${entry.id}/briefing`, { briefing }, { withCredentials: true });
        onDone('Briefing saved — the recruiter can see it.');
      } catch (e) { setErr(e?.response?.data?.message || 'Could not save.'); }
      finally { setBusy(false); }
      return;
    }
    if (decision === 'reject' && !rejectCategory) return setErr('Choose a rejection reason.');
    // Only demanded when an admin has configured approval reasons; with none
    // set up the coach writes their own words, as before.
    if (decision === 'approve' && approveReasons.length && !approveCategory) {
      return setErr('Choose an approval reason.');
    }
    if (!reason.trim()) return setErr('A reason is required.');
    if (!briefing.trim()) return setErr('A briefing against the position is required.');
    setBusy(true);
    try {
      const r = await axios.post(`/api/coach-bin/${entry.id}/review`,
        { decision, reason, briefing, comments, suitability, rejectCategory, approveCategory },
        { withCredentials: true });
      onDone(r.data?.message || 'Review saved.');
    } catch (e) { setErr(e?.response?.data?.message || 'Could not save the review.'); }
    finally { setBusy(false); }
  };

  const field = 'w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none';

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-gray-900">{entry.candidateName}</p>
              <p className="text-[13px] text-gray-500">{entry.positionTitle} · {entry.client}</p>
            </div>
            <div className="flex gap-2">
              {cand?.cvUrl && (
                <a href={cand.cvUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-blue-300 text-blue-700 text-[12.5px] font-bold hover:bg-blue-50">
                  <FileText size={13} /> View CV
                </a>
              )}
              {pos?.url && (
                // The JD opens in its own tab so the review in progress is not lost.
                <a href={pos.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 text-[12.5px] font-bold hover:bg-gray-50">
                  <ExternalLink size={13} /> View JD
                </a>
              )}
            </div>
          </div>

          {loadingCand ? (
            <p className="mt-3 text-[12.5px] text-gray-400 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Loading the candidate…
            </p>
          ) : !cand ? (
            <p className="mt-3 text-[12.5px] text-amber-700">The candidate record could not be loaded.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                {[
                  [Mail, 'Email', cand.email],
                  [Phone, 'Phone', cand.phone],
                  [Briefcase, 'Current employer', cand.currentEmployer],
                  [Clock, 'Notice', cand.noticePeriod],
                  [null, 'Experience', [cand.totalExp && `${cand.totalExp} yrs total`, cand.relevantExp && `${cand.relevantExp} relevant`].filter(Boolean).join(' · ')],
                  [null, 'CTC', [cand.currentCtc && `₹${cand.currentCtc}`, cand.expectedCtc && `exp ₹${cand.expectedCtc}`].filter(Boolean).join(' · ')],
                  [MapPin, 'Location', [cand.currentLocation, cand.preferredLocation && `prefers ${cand.preferredLocation}`].filter(Boolean).join(' · ')],
                  [null, 'Education', cand.education],
                ].filter(([, , v]) => v).map(([Icon, label, value]) => (
                  <div key={label} className="min-w-0">
                    <span className="text-gray-400 inline-flex items-center gap-1">
                      {Icon ? <Icon size={11} /> : null}{label}
                    </span>
                    <p className="text-gray-800 font-medium truncate" title={value}>{value}</p>
                  </div>
                ))}
              </div>
              {cand.skills && (
                <p className="mt-2 text-[12.5px]"><span className="text-gray-400">Skills</span>{' '}
                  <span className="text-gray-800">{cand.skills}</span></p>
              )}
              {cand.matchSummary && (
                <p className="mt-2 text-[12px] text-gray-500 italic">{cand.matchSummary}</p>
              )}
            </>
          )}
        </div>

        <div className="p-5 space-y-3.5">
          {!missedOnly && (
            <div className="flex gap-2">
              {[['approve', 'Approve', CheckCircle2, 'emerald'], ['reject', 'Reject', XCircle, 'red']].map(([v, label, Icon, c]) => (
                <button key={v} onClick={() => { setDecision(v); setRejectCategory(''); setApproveCategory(''); }}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold border-2 ${
                    decision === v
                      ? (c === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700')
                      : 'border-gray-200 text-gray-500'}`}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* The client's own rejection categories — the same fifteen they pick
              from when screening, so a coach rejection reads identically. */}
          {!missedOnly && decision === 'approve' && approveReasons.length > 0 && (
            <div>
              <label className="text-[12.5px] font-bold text-gray-700">
                Approval reason <span className="text-red-500">*</span>
              </label>
              <select value={approveCategory} onChange={e => setApproveCategory(e.target.value)}
                className={field + ' mt-1'}>
                <option value="">Choose a reason…</option>
                {approveReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {!missedOnly && decision === 'reject' && (
            <div>
              <label className="text-[12.5px] font-bold text-gray-700">
                Rejection reason <span className="text-red-500">*</span>
              </label>
              <select value={rejectCategory} onChange={e => setRejectCategory(e.target.value)}
                className={field + ' mt-1'}>
                <option value="">Choose a reason…</option>
                {rejectReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {!missedOnly && (
            <div>
              <label className="text-[12.5px] font-bold text-gray-700">
                {decision === 'approve' && approveReasons.length ? 'In your own words'
                  : decision === 'approve' ? 'Approval reason' : 'In your own words'} <span className="text-red-500">*</span>
              </label>
              <textarea className={field + ' mt-1'} rows={2} value={reason} onChange={e => setReason(e.target.value)}
                placeholder={decision === 'approve' ? 'Why this candidate fits' : 'What specifically led to that reason'} />
            </div>
          )}

          <div>
            <label className="text-[12.5px] font-bold text-gray-700">
              Briefing against the position <span className="text-red-500">*</span>
            </label>
            <textarea className={field + ' mt-1'} rows={3} value={briefing} onChange={e => setBriefing(e.target.value)}
              placeholder="What the recruiter should know about this candidate against this role" />
          </div>

          {!missedOnly && (
            <>
              <div>
                <label className="text-[12.5px] font-bold text-gray-700">Suitability for the position</label>
                <input className={field + ' mt-1'} value={suitability} onChange={e => setSuitability(e.target.value)}
                  placeholder="e.g. Strong fit for the data-modelling half of the role" />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-gray-700">
                  {decision === 'approve' ? 'Other comments' : 'Concerns about the candidate'}
                </label>
                <textarea className={field + ' mt-1'} rows={2} value={comments} onChange={e => setComments(e.target.value)} />
              </div>
            </>
          )}

          {err && <p className="text-[13px] font-semibold text-red-600">{err}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-[13px] font-bold">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold disabled:opacity-60">
            {busy ? 'Saving…' : missedOnly ? 'Save briefing' : decision === 'approve' ? 'Approve candidate' : 'Reject candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
