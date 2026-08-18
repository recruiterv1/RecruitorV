import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Briefcase, Users, HelpCircle, LogOut, Plus, Loader2, PauseCircle,
  Trash2, Save, Menu, X, CheckCircle2, Search, LayoutDashboard, UserCircle, KeyRound, ArrowLeft, Mail, Phone,
} from 'lucide-react';
import Ad_Pos from './Ad_Pos';
import QuestionsEditor, { validateQuestions } from '../components/QuestionsEditor';

const api = axios.create({ baseURL: '/api/company', withCredentials: true });
const rupee = (v) => v ? `₹${v}` : '—';

// A position with no explicit status is treated as active (recruiter default).
const normStatus = (s) => (s || '').toString().toLowerCase().trim() || 'active';
const statusPill = (s) => {
  const v = normStatus(s);
  if (v === 'active') return 'bg-green-100 text-green-700';
  if (v === 'pending') return 'bg-amber-100 text-amber-700';
  if (v === 'hold' || v === 'paused') return 'bg-orange-100 text-orange-700';
  if (v === 'rejected' || v === 'closed') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};
const statusText = (s) => {
  const v = normStatus(s);
  if (v === 'active') return 'Live';
  if (v === 'pending') return 'Pending approval';
  if (v === 'hold') return 'On hold';
  if (v === 'paused') return 'Paused';
  if (v === 'rejected') return 'Rejected';
  if (v === 'closed') return 'Closed';
  return s || '—';
};
// Sort rank: Live first, then Pending, then Hold/Paused, then others, Rejected/Closed last.
const posRank = (s) => { const v = normStatus(s); if (v === 'active') return 0; if (v === 'pending') return 1; if (v === 'hold' || v === 'paused') return 2; if (v === 'rejected' || v === 'closed') return 4; return 3; };
// Candidate reject-type statuses sink to the bottom.
const CAND_REJECTS = new Set(['screen reject','l1 reject','l2 reject','l3 reject','hr reject','background verification reject','negotiation reject','test reject','client drop','candidate drop','duplicate','offer declined','position on hold','rejected']);
const candRank = (s) => CAND_REJECTS.has((s || '').toLowerCase().trim()) ? 1 : 0;
const FilterBar = ({ q, setQ, statuses, sf, setSf, placeholder }) => (
  <div className="flex flex-wrap gap-2 mb-4">
    <div className="relative flex-1 min-w-[180px]">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30" />
    </div>
    <select value={sf} onChange={e => setSf(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30">
      <option value="all">All statuses</option>
      {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  </div>
);

// ── Shared: modal + detail row ───────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer }) {
  useEffect(() => { const h = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{title}</h3>
            {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-gray-200">{footer}</div>}
      </div>
    </div>
  );
}

const stripHtml = (s) => (s || '').toString().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const Row = ({ label, value }) => {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="col-span-2 text-gray-800 break-words whitespace-pre-wrap">{Array.isArray(value) ? value.join(', ') : String(value)}</div>
    </div>
  );
};

// A candidate whose status the COMPANY still needs to action (fresh submission).
const needsCompanyUpdate = (s) => { const x = (s || '').toString().toLowerCase().trim(); return x === '' || x === 'submitted'; };
// A positive/closed-won status → green.
const isJoinedStatus = (s) => { const x = (s || '').toString().toLowerCase(); return x.includes('join') || x === 'offer accepted' || x === 'selected'; };

// ── Company position detail (JD Details + Candidates tabs) ───────────────────
function CompanyPositionDetail({ position, onBack, onChanged }) {
  const [tab, setTab] = useState('jd');           // 'jd' | 'candidates'
  const [cands, setCands] = useState(null);
  const [allowed, setAllowed] = useState([]);
  const [openCand, setOpenCand] = useState(null);
  const [editing, setEditing] = useState(false);
  const [statusa, setStatusa] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const loc = (Array.isArray(position.location) ? position.location.join(', ') : position.location) || '—';

  const loadCands = useCallback(() => {
    api.get('/candidates').then(r => {
      setAllowed(r.data.allowedStatuses || []);
      setCands((r.data.candidates || []).filter(c => String(c.pos_id) === String(position.pos_id)));
    }).catch(() => setCands([]));
  }, [position.pos_id]);
  useEffect(() => { if (tab === 'candidates' && cands === null) loadCands(); }, [tab, cands, loadCands]);

  const saveStatus = async () => {
    if (!statusa || !reason.trim()) return;
    setBusy(true);
    try {
      await api.post(`/candidates/${openCand.id}/status`, { statusa, reason: reason.trim() });
      setEditing(false); setStatusa(''); setReason(''); setOpenCand(null); setCands(null); loadCands();
    } catch (e) { alert(e.response?.data?.message || 'Failed to update.'); }
    finally { setBusy(false); }
  };

  const doHold = async () => {
    if (!holdReason.trim()) return;
    setBusy(true);
    try { await api.post(`/positions/${position.id}/hold`, { reason: holdReason.trim() }); setHoldOpen(false); setHoldReason(''); onChanged && onChanged(); onBack(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to hold.'); }
    finally { setBusy(false); }
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-lg truncate">{position.position}</div>
          <div className="text-xs text-gray-400 flex items-center gap-2">#{position.pos_id} <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusPill(position.status)}`}>{statusText(position.status)}</span></div>
        </div>
        {(position.status === 'active' || position.status === 'pending') && !holdOpen && (
          <button onClick={() => setHoldOpen(true)} className="flex items-center gap-1 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-50"><PauseCircle size={15} /> Hold position</button>
        )}
      </div>
      {holdOpen && (
        <div className="mb-4 bg-white border border-orange-200 rounded-xl p-3">
          <textarea value={holdReason} onChange={e => setHoldReason(e.target.value)} rows={2} placeholder="Reason for holding this position (required)…"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/40" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setHoldOpen(false)} className="text-xs text-gray-500 px-3 py-1.5">Cancel</button>
            <button onClick={doHold} disabled={busy || !holdReason.trim()} className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg px-3 py-1.5 disabled:opacity-50">Confirm hold</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {tabBtn('jd', 'JD Details')}
        {tabBtn('candidates', `Candidates${cands ? ` (${cands.length})` : ''}`)}
      </div>

      {tab === 'jd' ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <Row label="Status" value={statusText(position.status)} />
          <Row label="Position ID" value={position.pos_id} />
          <Row label="Client" value={position.client} />
          <Row label="ClientSPOC" value={position.clientspoc_name || position.clientspoc} />
          <Row label="Skill category" value={position.skill_category} />
          <Row label="Sub category" value={position.skill_sub_category} />
          <Row label="Specialization" value={position.specialization} />
          <Row label="Employment type" value={position.employment_type} />
          <Row label="Work mode" value={position.work_mode} />
          <Row label="No. of positions" value={position.no_of_positions} />
          <Row label="Experience" value={position.experience || position.min_exp} />
          <Row label="Education" value={position.req_education} />
          <Row label="CTC" value={position.ctcStart && position.ctcEnd ? `${position.ctcStart} – ${position.ctcEnd}` : (position.commison || position.budget)} />
          <Row label="Location" value={loc} />
          <Row label="State" value={position.state} />
          <Row label="HR name" value={position.hr_name} />
          <Row label="Job summary" value={stripHtml(position.job_desc) || stripHtml(position.overview)} />
          <Row label="Must-have skills" value={stripHtml(position.m_have)} />
          <Row label="Good-to-have" value={stripHtml(position.g_have)} />
          <Row label="Key responsibilities" value={stripHtml(position.key_res)} />
          {position.holdReason && <Row label="Hold reason" value={position.holdReason} />}
          {position.rejectReason && <Row label="Reject reason" value={position.rejectReason} />}
        </div>
      ) : (
        <div>
          {cands === null ? (
            <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
          ) : cands.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No candidates submitted for this position yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {cands.map(c => (
                <button key={c.id} onClick={() => { setOpenCand(c); setEditing(false); setStatusa(''); setReason(''); }}
                  className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-blue-300 transition">
                  <div className="flex items-start gap-3">
                    {c.photo_url
                      ? <img src={c.photo_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                      : <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 grid place-items-center font-bold flex-shrink-0">{(c.candidate || '?')[0].toUpperCase()}</div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-gray-900 leading-snug truncate">{c.candidate || 'Unnamed'}</div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">{c.statusa || 'Submitted'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Exp {c.total_exp || '—'}y · {rupee(c.exp_ctc)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {openCand && (
            <Modal title={openCand.candidate} subtitle={`${openCand.pos_name || ''} · ${openCand.statusa || 'Submitted'}`} onClose={() => setOpenCand(null)}
              footer={
                editing ? (
                  <div className="space-y-2">
                    <select value={statusa} onChange={e => setStatusa(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30">
                      <option value="">— select status —</option>
                      {allowed.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Reason for this status (required)…"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-3 py-1.5">Cancel</button>
                      <button onClick={saveStatus} disabled={busy || !statusa || !reason.trim()} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 disabled:opacity-50">Update status</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {openCand.cv_data ? <a href={openCand.cv_data} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View resume →</a> : <span />}
                    <button onClick={() => setEditing(true)} className="text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">Change status</button>
                  </div>
                )
              }>
              {openCand.photo_url && (
                <div className="mb-3 flex justify-center">
                  <img src={openCand.photo_url} alt="candidate" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                </div>
              )}
              <Row label="Current status" value={openCand.statusa || 'Submitted'} />
              <Row label="Email" value={openCand.emails} />
              <Row label="Phone" value={openCand.mob} />
              <Row label="RH ID" value={openCand.rh_id} />
              <Row label="Current employer" value={openCand.curr_emp} />
              <Row label="Highest education" value={openCand.highest_education} />
              <Row label="Relevant exp" value={openCand.rel_exp && `${openCand.rel_exp} yrs`} />
              <Row label="Total exp" value={openCand.total_exp && `${openCand.total_exp} yrs`} />
              <Row label="Current CTC" value={openCand.current_ctc && rupee(openCand.current_ctc)} />
              <Row label="Expected CTC" value={openCand.exp_ctc && rupee(openCand.exp_ctc)} />
              <Row label="Notice period" value={openCand.notice_period} />
              <Row label="Current location" value={openCand.curr_loc ? `${openCand.curr_loc}${openCand.curr_state ? ', ' + openCand.curr_state : ''}` : ''} />
              <Row label="Tech skills" value={openCand.tech_skill} />
              <Row label="Submitted by" value={openCand.recName} />
              {openCand.rejectReason && <Row label="Last reason" value={openCand.rejectReason} />}
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

// ── My Positions ─────────────────────────────────────────────────────────────
function MyPositions() {
  const [list, setList] = useState(null);
  const [detailPos, setDetailPos] = useState(null);   // position shown in the detail view
  const [q, setQ] = useState('');
  const [sf, setSf] = useState('all');

  const [pendingCounts, setPendingCounts] = useState({});   // pos_id -> # candidates awaiting company action
  const load = useCallback(() => api.get('/positions').then(r => setList(r.data.positions || [])).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/candidates').then(r => {
      const counts = {};
      (r.data.candidates || []).forEach(c => { if (needsCompanyUpdate(c.statusa)) counts[c.pos_id] = (counts[c.pos_id] || 0) + 1; });
      setPendingCounts(counts);
    }).catch(() => {});
  }, []);

  if (detailPos) return <CompanyPositionDetail position={detailPos} onBack={() => setDetailPos(null)} onChanged={load} />;
  if (!list) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  if (!list.length) return <div className="py-16 text-center text-gray-400 text-sm">No positions yet. Post one from “Post Position”.</div>;

  const loc = (p) => (Array.isArray(p.location) ? p.location.join(', ') : p.location) || '—';
  const statusOpts = [
    { value: 'active', label: 'Live' }, { value: 'pending', label: 'Pending' },
    { value: 'hold', label: 'On hold / Paused' }, { value: 'rejected', label: 'Rejected / Closed' },
  ];
  const groupOf = (s) => { const v = normStatus(s); if (v === 'paused') return 'hold'; if (v === 'closed') return 'rejected'; return v; };
  const view = list
    .filter(p => sf === 'all' || groupOf(p.status) === sf)
    .filter(p => { if (!q.trim()) return true; const t = q.toLowerCase(); return (p.position || '').toLowerCase().includes(t) || String(p.pos_id || '').includes(t) || (p.skill_category || '').toLowerCase().includes(t); })
    .sort((a, b) => posRank(a.status) - posRank(b.status) || (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0));

  return (
    <>
      <FilterBar q={q} setQ={setQ} statuses={statusOpts} sf={sf} setSf={setSf} placeholder="Search positions by title, ID, skill…" />
      <div className="text-xs text-gray-400 mb-2">{view.length} of {list.length}</div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {view.map(p => (
          <button key={p.id} onClick={() => setDetailPos(p)}
            className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-blue-300 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-gray-900 leading-snug">{p.position}</div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusPill(p.status)}`}>{statusText(p.status)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">#{p.pos_id}</div>
            <div className="text-xs text-gray-500 mt-2">{p.skill_category || '—'}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{loc(p)}</div>
            {(() => {
              const n = pendingCounts[p.pos_id] || 0;
              return (
                <div className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${n > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Users size={12} /> {n} to update
                </div>
              );
            })()}
          </button>
        ))}
      </div>

    </>
  );
}

// ── Candidates ───────────────────────────────────────────────────────────────
function Candidates() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);   // candidate in modal
  const [statusa, setStatusa] = useState('');
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [sf, setSf] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  const load = useCallback(() => api.get('/candidates').then(r => setData(r.data)).catch(() => setData({ candidates: [], allowedStatuses: [] })), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, sf]);

  const save = async () => {
    if (!statusa || !reason.trim()) return;
    setBusy(true);
    try { await api.post(`/candidates/${open.id}/status`, { statusa, reason: reason.trim() }); setEditing(false); setStatusa(''); setReason(''); setOpen(null); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to update.'); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  const { candidates = [], allowedStatuses = [] } = data;
  if (!candidates.length) return <div className="py-16 text-center text-gray-400 text-sm">No candidates submitted to your positions yet.</div>;

  const statusOpts = [
    { value: 'active', label: 'Active (in process)' },
    { value: 'rejected', label: 'Rejected / dropped' },
  ];
  const view = candidates
    .filter(c => { if (sf === 'all') return true; const rej = candRank(c.statusa) === 1; return sf === 'rejected' ? rej : !rej; })
    .filter(c => { if (!q.trim()) return true; const t = q.toLowerCase(); return (c.candidate || '').toLowerCase().includes(t) || (c.pos_name || '').toLowerCase().includes(t) || (c.emails || '').toLowerCase().includes(t); })
    .sort((a, b) => candRank(a.statusa) - candRank(b.statusa));

  const totalPages = Math.max(1, Math.ceil(view.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * PAGE_SIZE;
  const pageRows = view.slice(start, start + PAGE_SIZE);

  return (
    <>
      <FilterBar q={q} setQ={setQ} statuses={statusOpts} sf={sf} setSf={setSf} placeholder="Search candidates by name, position, email…" />
      <div className="text-xs text-gray-400 mb-2">
        {view.length ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, view.length)} of ${view.length}` : `0 of ${candidates.length}`}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {pageRows.map(c => {
          const green = isJoinedStatus(c.statusa);
          const orange = needsCompanyUpdate(c.statusa);
          const cardCls = green
            ? 'bg-green-50 border-green-300 hover:border-green-400'
            : orange
              ? 'bg-orange-50 border-orange-300 hover:border-orange-400'
              : 'bg-white border-gray-200 hover:border-blue-300';
          return (
          <button key={c.id} onClick={() => { setOpen(c); setEditing(false); setStatusa(''); setReason(''); }}
            className={`text-left border rounded-2xl p-4 hover:shadow-md transition ${cardCls}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-gray-900 leading-snug truncate">{c.candidate}</div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">{c.statusa || 'Submitted'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">{c.pos_name}</div>
            <div className="text-xs text-gray-400 mt-2">Exp {c.total_exp || '—'}y · Expected {rupee(c.exp_ctc)}</div>
          </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={curPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50">Prev</button>
          <span className="px-2 text-gray-600">Page {curPage} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={curPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}

      {open && (
        <Modal title={open.candidate} subtitle={`${open.pos_name || ''} · ${open.statusa || 'Submitted'}`} onClose={() => setOpen(null)}
          footer={
            editing ? (
              <div className="space-y-2">
                <select value={statusa} onChange={e => setStatusa(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">— select status —</option>
                  {allowedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Reason for this status (required)…"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-3 py-1.5">Cancel</button>
                  <button onClick={save} disabled={busy || !statusa || !reason.trim()} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 disabled:opacity-50">Update status</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {open.cv_data ? <a href={open.cv_data} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View resume →</a> : <span />}
                <button onClick={() => setEditing(true)} className="text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">Change status</button>
              </div>
            )
          }>
          <Row label="Current status" value={open.statusa || 'Submitted'} />
          <Row label="Email" value={open.emails} />
          <Row label="Phone" value={open.mob} />
          <Row label="Position" value={`${open.pos_name || ''} (#${open.pos_id || ''})`} />
          <Row label="RH ID" value={open.rh_id} />
          <Row label="Current employer" value={open.curr_emp} />
          <Row label="Highest education" value={open.highest_education} />
          <Row label="Relevant exp" value={open.rel_exp && `${open.rel_exp} yrs`} />
          <Row label="Total exp" value={open.total_exp && `${open.total_exp} yrs`} />
          <Row label="Current CTC" value={open.current_ctc && rupee(open.current_ctc)} />
          <Row label="Expected CTC" value={open.exp_ctc && rupee(open.exp_ctc)} />
          <Row label="Notice period" value={open.notice_period} />
          <Row label="Current location" value={open.curr_loc ? `${open.curr_loc}${open.curr_state ? ', ' + open.curr_state : ''}` : ''} />
          <Row label="Preferred location" value={open.pref_loc ? `${open.pref_loc}${open.pref_state ? ', ' + open.pref_state : ''}` : ''} />
          <Row label="Tech skills" value={open.tech_skill} />
          <Row label="Submitted by" value={open.recName} />
          {open.rejectReason && <Row label="Last reason" value={open.rejectReason} />}
        </Modal>
      )}
    </>
  );
}

// ── Client-requirement questions ─────────────────────────────────────────────
function Questions() {
  const [qs, setQs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Normalise any legacy {label} shape to the canonical {question}.
  useEffect(() => {
    api.get('/questions')
      .then(r => setQs((r.data.questions || []).map(q => ({ type: q.type || 'subjective', question: q.question ?? q.label ?? '', options: Array.isArray(q.options) ? q.options : [] }))))
      .catch(() => setQs([]));
  }, []);

  const save = async () => {
    const err = validateQuestions(qs);
    if (err) { setMsg(err); return; }
    setBusy(true); setMsg('');
    try {
      const r = await api.put('/questions', { questions: qs });
      setQs(r.data.questions || []); setMsg('ok');
    } catch (e) { setMsg(e.response?.data?.message || 'Failed to save.'); }
    finally { setBusy(false); }
  };

  if (!qs) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  return (
    <div className="max-w-2xl">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900">Client requirement questions</h2>
        <p className="text-sm text-gray-500">Shown to recruiters in the submit-candidate form for your positions. Existing questions are loaded below — edit, add or remove them.</p>
      </div>
      {msg === 'ok' && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">Saved.</div>}
      {msg && msg !== 'ok' && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}

      <QuestionsEditor questions={qs} onChange={setQs} />

      <button onClick={save} disabled={busy} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save questions
      </button>
    </div>
  );
}

// ── POC: ClientSPOCs engaged on this company's positions ─────────────────────
function POCs() {
  const [pocs, setPocs] = useState(null);
  useEffect(() => { api.get('/pocs').then(r => setPocs(r.data.pocs || [])).catch(() => setPocs([])); }, []);
  if (!pocs) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  if (!pocs.length) return <div className="py-16 text-center text-gray-400 text-sm">No ClientSPOC is engaged on your positions yet.</div>;
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Your points of contact at RecruiterV — the ClientSPOCs handling your positions.</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {pocs.map(p => (
          <div key={p.email} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 grid place-items-center text-white font-bold flex-shrink-0">
                {(p.name || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                <div className="text-xs text-gray-500 truncate">ClientSPOC</div>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-600 truncate"><Mail size={14} className="text-gray-400 flex-shrink-0" /><a href={`mailto:${p.email}`} className="text-blue-600 truncate hover:underline">{p.email}</a></div>
              <div className="flex items-center gap-2 text-gray-600"><Phone size={14} className="text-gray-400 flex-shrink-0" />{p.phone ? <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline">{p.phone}</a> : <span className="text-gray-400">—</span>}</div>
            </div>
            {p.positions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Positions ({p.positions.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {p.positions.map((pos, i) => (
                    <span key={i} className="text-[11px] font-medium bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5">{pos}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard (stats + charts) ───────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-4">
    <div className={`text-2xl font-extrabold ${color || 'text-gray-900'}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
  </div>
);

function Donut({ segments, total }) {
  // Dependency-free donut via conic-gradient.
  let acc = 0;
  const stops = segments.map(s => {
    const from = total ? (acc / total) * 100 : 0;
    acc += s.value;
    const to = total ? (acc / total) * 100 : 0;
    return `${s.color} ${from}% ${to}%`;
  }).join(', ');
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-36 h-36 flex-shrink-0 rounded-full" style={{ background: total ? `conic-gradient(${stops})` : '#e5e7eb' }}>
        <div className="absolute inset-[18%] rounded-full bg-white grid place-items-center">
          <div className="text-center"><div className="text-xl font-extrabold text-gray-900">{total}</div><div className="text-[10px] text-gray-400">total</div></div>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-semibold text-gray-900 ml-1">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <div className="w-40 truncate text-gray-600 flex-shrink-0" title={r.label}>{r.label}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color || '#3b82f6' }} />
          </div>
          <div className="w-10 text-right font-semibold text-gray-900">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/summary').then(r => setS(r.data)).catch(() => setS(false)); }, []);
  if (s === null) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  if (s === false) return <div className="py-16 text-center text-gray-400 text-sm">Couldn't load dashboard.</div>;

  const p = s.positions, c = s.candidates;
  const posSegs = [
    { label: 'Live', value: p.live, color: '#22c55e' },
    { label: 'Pending', value: p.pending, color: '#f59e0b' },
    { label: 'On hold', value: p.hold, color: '#f97316' },
    { label: 'Rejected', value: p.rejected, color: '#ef4444' },
    { label: 'Other', value: p.other, color: '#94a3b8' },
  ].filter(x => x.value > 0);
  const candRows = Object.entries(c.byStatus || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([label, value]) => ({ label, value, color: CAND_REJECTS.has(label.toLowerCase().trim()) ? '#ef4444' : '#3b82f6' }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total positions" value={p.total} />
        <StatCard label="Live" value={p.live} color="text-green-600" />
        <StatCard label="Pending approval" value={p.pending} color="text-amber-600" />
        <StatCard label="On hold" value={p.hold} color="text-orange-600" />
        <StatCard label="Total candidates" value={c.total} />
        <StatCard label="In process" value={c.inProcess} color="text-blue-600" />
        <StatCard label="Rejected / dropped" value={c.rejected} color="text-red-600" />
        <StatCard label="Rejected positions" value={p.rejected} color="text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Positions by status</h3>
          <Donut segments={posSegs.length ? posSegs : [{ label: 'None', value: 0, color: '#e5e7eb' }]} total={p.total} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Candidates by status <span className="text-xs font-normal text-gray-400">(top)</span></h3>
          {candRows.length ? <Bars rows={candRows} /> : <div className="text-sm text-gray-400 py-8 text-center">No candidates yet.</div>}
        </div>
      </div>
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────
const PROFILE_FIELDS = [
  { key: 'website', label: 'Website' },
  { key: 'industry', label: 'Industry' },
  { key: 'contactPerson', label: 'Contact person' },
  { key: 'contactPhone', label: 'Contact phone' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
];
function Profile() {
  const [c, setC] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  // password
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    api.get('/profile').then(r => {
      const co = r.data.company || {};
      setC(co);
      const f = { overview: co.overview || '', address: co.address || '', about: co.about || '', photoRequired: !!co.photoRequired };
      PROFILE_FIELDS.forEach(x => f[x.key] = co[x.key] || '');
      setForm(f);
    }).catch(() => setC({}));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true); setMsg('');
    try { const r = await api.put('/profile', form); setC(cc => ({ ...cc, ...r.data.company })); setMsg('ok'); }
    catch (e) { setMsg(e.response?.data?.message || 'Failed to save.'); }
    finally { setBusy(false); }
  };
  const changePw = async () => {
    setPwMsg('');
    if (pw.newPassword.length < 6) { setPwMsg('New password must be at least 6 characters.'); return; }
    if (pw.newPassword !== pw.confirm) { setPwMsg('New passwords do not match.'); return; }
    setPwBusy(true);
    try {
      await api.post('/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' }); setPwMsg('ok');
    } catch (e) { setPwMsg(e.response?.data?.message || 'Failed to change password.'); }
    finally { setPwBusy(false); }
  };

  if (!c) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  const inputCls = 'mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30';

  return (
    <div className="max-w-2xl space-y-4">
      {/* Read-only identity */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white"><Building2 size={22} /></div>
          <div>
            <div className="text-lg font-bold text-gray-900">{c.name}</div>
            <div className="text-xs text-gray-500">Company profile</div>
          </div>
        </div>
        <Row label="Company name" value={c.name} />
        <Row label="Login email" value={c.email} />
        <Row label="Assigned ClientSPOC" value={c.assignedClientspocName || c.assignedClientspoc || 'Not assigned'} />
        <Row label="Commission" value={Array.isArray(c.commissionTiers) && c.commissionTiers.length ? c.commissionTiers.map(t => `${t.tier}: ${t.value}${t.type === 'percentage' ? '%' : ''}`).join(' · ') : (c.commisson || '—')} />
        <p className="text-[11px] text-gray-400 mt-3">Company name, login email, ClientSPOC and commission are managed by your RecruiterV administrator.</p>
      </div>

      {/* Editable details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Edit details</h3>
        {msg === 'ok' && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">Saved.</div>}
        {msg && msg !== 'ok' && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
        <label className="text-xs text-gray-500 block">Overview / About
          <textarea value={form.overview} onChange={e => set('overview', e.target.value)} rows={3} className={inputCls} />
        </label>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {PROFILE_FIELDS.map(x => (
            <label key={x.key} className="text-xs text-gray-500">{x.label}
              <input value={form[x.key] || ''} onChange={e => set(x.key, e.target.value)} className={inputCls} />
            </label>
          ))}
          <label className="text-xs text-gray-500 sm:col-span-2">Address
            <input value={form.address || ''} onChange={e => set('address', e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 mt-3">
          <input type="checkbox" checked={!!form.photoRequired} onChange={e => set('photoRequired', e.target.checked)} />
          Require candidate photo on submissions
        </label>
        <button onClick={save} disabled={busy} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save details
        </button>
      </div>

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Change password</h3>
        {pwMsg === 'ok' && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">Password updated.</div>}
        {pwMsg && pwMsg !== 'ok' && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{pwMsg}</div>}
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-xs text-gray-500">Current password
            <input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} className={inputCls} />
          </label>
          <label className="text-xs text-gray-500">New password
            <input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} className={inputCls} />
          </label>
          <label className="text-xs text-gray-500">Confirm new
            <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className={inputCls} />
          </label>
        </div>
        <button onClick={changePw} disabled={pwBusy} className="mt-4 flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl px-5 py-2.5 disabled:opacity-60">
          {pwBusy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Update password
        </button>
      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────
export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    api.get('/me').then(r => setMe(r.data)).catch(() => navigate('/company'));
  }, [navigate]);

  // Dark theme for the whole company portal — leverage the global dark stylesheet.
  // Re-assert on the next frame so the app's ThemeProvider (which defaults to light
  // for this session) can't clear it after mount. Cleared on unmount.
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => el.setAttribute('data-theme', 'dark');
    apply();
    const raf = requestAnimationFrame(apply);
    return () => { cancelAnimationFrame(raf); el.removeAttribute('data-theme'); };
  }, []);

  const logout = async () => { try { await api.post('/logout'); } catch (_) {} navigate('/company'); };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'post', label: 'Post Position', icon: Plus },
    { id: 'positions', label: 'My Positions', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'poc', label: 'POC', icon: UserCircle },
    { id: 'questions', label: 'Client Questions', icon: HelpCircle },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];
  const activeLabel = tabs.find(t => t.id === tab)?.label || '';

  if (!me) return <div className="min-h-screen grid place-items-center bg-gray-50"><Loader2 size={28} className="animate-spin text-blue-500" /></div>;

  const NavItems = () => (
    <>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => { setTab(t.id); setMobileNav(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
              ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon size={17} /> <span>{t.label}</span>
          </button>
        );
      })}
    </>
  );

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white flex-shrink-0"><Building2 size={20} /></div>
        <div className="min-w-0">
          <div className="font-bold text-gray-900 leading-tight truncate">{me.name}</div>
          <div className="text-[11px] text-gray-400 truncate">Company portal</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto"><NavItems /></nav>
      <div className="p-3 border-t border-gray-200">
        <div className="text-[11px] text-gray-400 px-2 mb-2">{me.assignedClientspocName ? `SPOC: ${me.assignedClientspocName}` : 'No SPOC assigned'}</div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition"><LogOut size={17} /> Logout</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 fixed inset-y-0 left-0 z-30"><Sidebar /></aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
          <div className="relative w-64"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button className="lg:hidden text-gray-600" onClick={() => setMobileNav(true)}><Menu size={22} /></button>
          <h1 className="text-lg font-bold text-gray-900">{activeLabel}</h1>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-gray-400">RecruiterV ·</span>
            <span className="font-semibold text-gray-700 truncate max-w-[160px]">{me.name}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 grid place-items-center text-white text-xs font-bold flex-shrink-0">{(me.name || '?')[0].toUpperCase()}</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'profile' && <Profile />}
          {tab === 'post' && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <Ad_Pos companyMode={{
                companyName: me.name,
                spocEmail: me.assignedClientspoc,
                spocName: me.assignedClientspocName,
                onPosted: () => { setRefreshKey(k => k + 1); setTab('positions'); },
              }} />
            </div>
          )}
          {tab === 'positions' && <MyPositions key={refreshKey} />}
          {tab === 'candidates' && <Candidates />}
          {tab === 'poc' && <POCs />}
          {tab === 'questions' && <Questions />}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-4 sm:px-6 py-3 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} RecruiterV · Company Portal
        </footer>
      </div>
    </div>
  );
}
