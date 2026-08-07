import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Users, RefreshCw, Edit2, Send, X, CheckCircle, AlertCircle,
  Phone, Mail, FileText, ChevronDown, ChevronUp,
  Save, Loader2, XCircle
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import AiMatchInfo from '../components/AiMatchInfo';
import CvPreview from '../components/CvPreview';

// True when AI auto-rejected this applicant via CV↔JD screening
const aiRejected = (c) => c?.statusChangedBy === 'ai-screening' ||
  ((c?.matchPercent !== undefined && c?.matchPercent !== null) && c.matchPercent <= 50);

const STATUS_COLORS = {
  'applied':     'bg-blue-100 text-blue-700 border-blue-200',
  'submitted':   'bg-purple-100 text-purple-700 border-purple-200',
  'shortlisted': 'bg-green-100 text-green-700 border-green-200',
  'rejected':    'bg-red-100 text-red-700 border-red-200',
};
const sc = (s) => STATUS_COLORS[(s||'').toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';

const fmtDate = (ts) => {
  if (!ts) return '—';
  const sec = ts._seconds ?? ts.seconds ?? null;
  if (!sec) return '—';
  return new Date(sec * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Edit Candidate Modal ─────────────────────────────────────────────────────
const EditModal = ({ candidate, onClose, onSaved, onSubmitted, canSubmit }) => {
  const [form, setForm] = useState({ ...candidate });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      await axios.patch(`/addit/update/direct-applicant/${candidate.id}`, form, { withCredentials: true });
      onSaved(form);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  // Save the edits, then submit the candidate to their position.
  const handleSaveAndSubmit = async () => {
    setSubmitting(true); setErr('');
    try {
      await axios.patch(`/addit/update/direct-applicant/${candidate.id}`, form, { withCredentials: true });
      onSaved(form);
      await onSubmitted?.();   // parent handles the submit + toast + status update
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  };

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300";
  const lbl = "block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 rounded-t-2xl text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Edit Candidate</h3>
            <p className="text-orange-100 text-sm">{candidate.candidate} · {candidate.pos_name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{err}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Full Name</label><input className={inp} value={form.candidate||''} onChange={e=>set('candidate',e.target.value)} /></div>
            <div><label className={lbl}>Email</label><input className={inp} value={form.emails||''} onChange={e=>set('emails',e.target.value)} /></div>
            <div><label className={lbl}>Phone</label><input className={inp} value={form.mob||''} onChange={e=>set('mob',e.target.value)} /></div>
            <div><label className={lbl}>Current Employer</label><input className={inp} value={form.curr_emp||''} onChange={e=>set('curr_emp',e.target.value)} /></div>
            <div><label className={lbl}>Current CTC</label><input className={inp} value={form.current_ctc||''} onChange={e=>set('current_ctc',e.target.value)} /></div>
            <div><label className={lbl}>Expected CTC</label><input className={inp} value={form.exp_ctc||''} onChange={e=>set('exp_ctc',e.target.value)} /></div>
            <div><label className={lbl}>Total Experience</label><input className={inp} value={form.total_exp||''} onChange={e=>set('total_exp',e.target.value)} /></div>
            <div><label className={lbl}>Relevant Experience</label><input className={inp} value={form.rel_exp||''} onChange={e=>set('rel_exp',e.target.value)} /></div>
            <div><label className={lbl}>Notice Period</label><input className={inp} value={form.notice_period||''} onChange={e=>set('notice_period',e.target.value)} /></div>
            <div><label className={lbl}>Location</label><input className={inp} value={form.curr_loc||''} onChange={e=>set('curr_loc',e.target.value)} /></div>
            <div><label className={lbl}>Education</label><input className={inp} value={form.highest_education||''} onChange={e=>set('highest_education',e.target.value)} /></div>
            <div><label className={lbl}>Self Rating</label><input className={inp} value={form.self_rate||''} onChange={e=>set('self_rate',e.target.value)} /></div>
          </div>

          {/* CV / Resume preview */}
          {candidate.cv_data && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText size={15}/> CV / Resume</span>
                <a href={candidate.cv_data} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  <FileText size={12}/> Open in New Tab
                </a>
              </div>
              <CvPreview url={candidate.cv_data} height="55vh" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-50 rounded-xl text-sm font-semibold">
              {saving ? <><Loader2 size={14} className="animate-spin"/>Saving...</> : <><Save size={14}/>Save Changes</>}
            </button>
            {canSubmit && (
              <button onClick={handleSaveAndSubmit} disabled={saving || submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                {submitting ? <><Loader2 size={14} className="animate-spin"/>Submitting...</> : <><Send size={14}/>Save &amp; Submit</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const RecruiterDirectApplicants = () => {
  const { user } = useContext(UserStateContext);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState({});
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalNotice, setEvalNotice] = useState(false); // "evaluation done — refresh" prompt
  const autoEvalRef = useRef(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // `silent` skips the full-page loading spinner — used for background refetches
  // so the card grid never flashes/"reloads" while the user is reading it.
  const fetchApplicants = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get('/addit/show/recruiter/candi', { withCredentials: true });
      const direct = (res.data || []).filter(c => c.source === 'direct_apply');
      setApplicants(direct);
      return direct;
    } catch (e) { console.error(e); return []; }
    finally { if (!silent) setLoading(false); }
  };

  // Evaluate CVs vs JD (Match %); profiles ≤50% are auto-rejected + emailed.
  // Runs the batches in the BACKGROUND without refetching the list (so the page
  // never reloads mid-evaluation). When it finishes, we prompt the user to
  // refresh to pull the newly-scored results instead of yanking the grid.
  const evaluatePending = async () => {
    if (evaluating) return;
    setEvaluating(true);
    setEvalNotice(false);
    let evaluatedCount = 0;
    try {
      let remaining = 1, guard = 0;
      while (remaining > 0 && guard < 40) {
        const res = await axios.post('/api/cv-match/evaluate-batch-recruiter', { limit: 6 }, { withCredentials: true });
        evaluatedCount += (res.data?.evaluated?.length || 0);
        remaining = res.data?.remaining ?? 0;
        guard++;
        if (remaining > 0) await new Promise(r => setTimeout(r, 400));
      }
    } catch (e) { console.error('evaluate CVs', e); }
    finally {
      setEvaluating(false);
      if (evaluatedCount > 0) setEvalNotice(true); // ask the user to refresh for latest scores
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = await fetchApplicants();
      if (!autoEvalRef.current) {
        const needs = (data || []).some(c => (c.matchPercent === undefined || c.matchPercent === null) && !c.matchEvaluated && (c.cv_data || c.cv_url));
        if (needs) { autoEvalRef.current = true; evaluatePending(); } // runs silently in the background
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaved = (updatedForm) => {
    setApplicants(prev => prev.map(a => a.id === updatedForm.id ? { ...a, ...updatedForm } : a));
    showToast('Candidate details saved.');
  };

  const handleSubmit = async (applicant) => {
    setSubmitting(p => ({ ...p, [applicant.id]: 'submit' }));
    try {
      await axios.patch(`/addit/update/status/${applicant.id}`, { statusa: 'Submitted' }, { withCredentials: true });
      setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, statusa: 'Submitted' } : a));
      showToast(`${applicant.candidate} submitted for ${applicant.pos_name}!`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(p => ({ ...p, [applicant.id]: null }));
    }
  };

  const handleReject = async (applicant) => {
    if (!window.confirm(`Reject ${applicant.candidate}'s application? This cannot be undone.`)) return;
    setSubmitting(p => ({ ...p, [applicant.id]: 'reject' }));
    try {
      await axios.patch(`/addit/update/status/${applicant.id}`, { statusa: 'Screen Reject' }, { withCredentials: true });
      setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, statusa: 'Screen Reject' } : a));
      showToast(`${applicant.candidate}'s application rejected.`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setSubmitting(p => ({ ...p, [applicant.id]: null }));
    }
  };

  const pending  = useMemo(() => applicants.filter(a => (a.statusa||'').toLowerCase() === 'applied'), [applicants]);
  const others   = useMemo(() => applicants.filter(a => (a.statusa||'').toLowerCase() !== 'applied'), [applicants]);

  // ── Sort + paginate ──────────────────────────────────────────────────────
  // Highest match score first, lowest/unscored last; within the same score the
  // latest applicant is on top. 18 cards per page.
  const PER_PAGE = 18;
  const [page, setPage] = useState(1);
  const toMs = (d) => {
    if (!d) return 0;
    if (typeof d === 'object' && typeof d._seconds === 'number') return d._seconds * 1000;
    if (typeof d === 'object' && typeof d.seconds === 'number') return d.seconds * 1000;
    const t = new Date(d).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const scoreOf = (a) => (a.matchPercent === undefined || a.matchPercent === null ? -1 : Number(a.matchPercent));

  const sorted = useMemo(() => {
    // Screen-rejected applicants leave this page — they move to the Resume Bank
    // (reusable for other positions).
    return applicants
      .filter(a => (a.statusa || '').toLowerCase() !== 'screen reject')
      .sort((a, b) => {
        const s = scoreOf(b) - scoreOf(a);        // score: high → low
        if (s !== 0) return s;
        return toMs(b.datePosted) - toMs(a.datePosted); // tie-break: latest first
      });
  }, [applicants]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  // Keep the current page valid when the list size changes.
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const pageItems = useMemo(() => sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE), [sorted, page]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      {editTarget && (
        <EditModal
          candidate={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          onSubmitted={() => handleSubmit(editTarget)}
          canSubmit={(editTarget.statusa || '').toLowerCase() === 'applied'}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22}/></div>
            <div>
              <h2 className="text-xl font-bold">Direct Applicants</h2>
              <p className="text-orange-100 text-sm">
                Candidates who applied via your shared position links · {pending.length} pending review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm" title="Applicants you haven't actioned yet (status still 'Applied')">
              <span className="text-2xl font-extrabold text-orange-600 leading-none">{pending.length}</span>
              <span className="text-xs font-semibold text-gray-500 leading-tight">status not<br/>updated</span>
            </div>
            <button onClick={evaluatePending} disabled={evaluating}
              title="Score each CV against the position JD; profiles ≤50% are auto-rejected and emailed"
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 rounded-xl text-sm font-semibold shadow-sm">
              {evaluating ? <Loader2 size={15} className="animate-spin"/> : <span>✨</span>}
              {evaluating ? 'Evaluating CVs…' : 'Evaluate CVs vs JD'}
            </button>
            <button onClick={fetchApplicants} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold">
              <RefreshCw size={15}/> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Background evaluation status — the grid stays put, no reloads */}
      {evaluating && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm">
          <Loader2 size={15} className="animate-spin"/>
          Evaluating CVs against the job description in the background… you can keep working. We'll let you know when it's done.
        </div>
      )}
      {evalNotice && !evaluating && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
          <span className="flex items-center gap-2"><CheckCircle size={15}/> CV evaluation complete. Refresh to see the latest match scores.</span>
          <button onClick={() => { setEvalNotice(false); fetchApplicants(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold">
            <RefreshCw size={13}/> Refresh now
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Users size={40} className="mx-auto mb-3 text-gray-300"/>
          <p className="font-semibold text-gray-600">No direct applicants yet</p>
          <p className="text-sm text-gray-400 mt-1">Share a position link and candidates who apply will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageItems.map(a => {
            const isOpen = !!expanded[a.id];
            const isPending = (a.statusa||'').toLowerCase() === 'applied';
            const hasM = a.matchPercent !== undefined && a.matchPercent !== null;
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Card body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Header: avatar + name + status */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {(a.candidate || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{a.candidate || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{a.pos_name || a.pos_id}</p>
                      <p className="text-[11px] text-gray-400">{fmtDate(a.datePosted)}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-col gap-1">
                    {a.emails && <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate"><Mail size={12} className="flex-shrink-0"/>{a.emails}</p>}
                    {a.mob && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone size={12} className="flex-shrink-0"/>{a.mob}</p>}
                  </div>

                  {/* Status + Match % */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${sc(a.statusa)}`}>
                        {a.statusa || 'Applied'}
                      </span>
                      {aiRejected(a) && (
                        <AiMatchInfo percent={a.matchPercent} reasoning={a.matchReasoning} summary={a.matchSummary} rejected />
                      )}
                    </span>
                    {hasM ? (
                      <span title={a.matchSummary || ''}
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${a.matchPercent <= 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        Match {a.matchPercent}%
                      </span>
                    ) : (
                      <span className="text-[10px] italic text-gray-400">{a.matchEvaluated ? 'CV not readable' : (evaluating ? 'Evaluating…' : 'Not evaluated')}</span>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      {[
                        ['Current CTC', a.current_ctc],
                        ['Expected CTC', a.exp_ctc],
                        ['Total Exp', a.total_exp],
                        ['Relevant Exp', a.rel_exp],
                        ['Notice Period', a.notice_period],
                        ['Location', a.curr_loc],
                        ['Education', a.highest_education],
                        ['Self Rating', a.self_rate],
                      ].map(([label, val]) => val ? (
                        <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                          <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-0.5">{label}</p>
                          <p className="text-gray-800 font-medium break-words">{val}</p>
                        </div>
                      ) : null)}
                    </div>
                  )}

                  {a.cv_data && (
                    <button onClick={() => setEditTarget(a)}
                      className="flex items-center gap-2 text-blue-600 hover:underline text-xs font-semibold w-fit">
                      <FileText size={13}/> View CV / Resume
                    </button>
                  )}
                </div>

                {/* Footer actions */}
                <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => setEditTarget(a)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isPending ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}>
                    <Edit2 size={11}/> {isPending ? 'Edit & Submit' : 'Edit'}
                  </button>
                  {isPending && (
                    <button onClick={() => handleReject(a)} disabled={!!submitting[a.id]}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all">
                      {submitting[a.id] === 'reject' ? <Loader2 size={11} className="animate-spin"/> : <XCircle size={11}/>}
                      Reject
                    </button>
                  )}
                  <button onClick={() => setExpanded(p => ({ ...p, [a.id]: !p[a.id] }))}
                    className="ml-auto flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-semibold">
                    {isOpen ? <>Less <ChevronUp size={14}/></> : <>Details <ChevronDown size={14}/></>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && sorted.length > PER_PAGE && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="px-3 text-sm text-gray-600">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDirectApplicants;
