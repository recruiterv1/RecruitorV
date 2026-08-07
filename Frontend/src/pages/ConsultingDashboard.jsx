import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Landmark, LayoutDashboard, Building2, Briefcase, Users, UserCheck, FileDown,
  LogOut, Plus, Loader2, Menu, X, Ban, CheckCircle2, ShieldAlert, Pencil, Save,
} from 'lucide-react';
import Ad_Pos from './Ad_Pos';
import QuestionsEditor from '../components/QuestionsEditor';
import RichTextEditor from '../components/RichTextEditor';

const api = axios.create({ baseURL: '/api/consulting', withCredentials: true });
const posColors = { live: '#22c55e', pending: '#f59e0b', hold: '#f97316', rejected: '#ef4444', other: '#94a3b8' };
const posLabels = { live: 'Live', pending: 'Pending', hold: 'On hold', rejected: 'Rejected', other: 'Other' };

// ── Small charts (dependency-free) ───────────────────────────────────────────
function Donut({ data }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <div className="h-40 grid place-items-center text-gray-400 text-sm">No positions yet</div>;
  let acc = 0;
  const stops = entries.map(([k, v]) => { const start = (acc / total) * 360; acc += v; const end = (acc / total) * 360; return `${posColors[k]} ${start}deg ${end}deg`; }).join(', ');
  return (
    <div className="flex items-center gap-5">
      <div className="w-32 h-32 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${stops})` }}>
        <div className="w-full h-full grid place-items-center">
          <div className="w-20 h-20 rounded-full bg-white grid place-items-center">
            <div className="text-center"><div className="text-lg font-extrabold text-gray-900">{total}</div><div className="text-[10px] text-gray-400">positions</div></div>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-sm" style={{ background: posColors[k] }} /><span className="text-gray-600">{posLabels[k]}</span><span className="font-bold text-gray-900 ml-1">{v}</span></div>
        ))}
      </div>
    </div>
  );
}
function Bars({ data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (!entries.length) return <div className="h-32 grid place-items-center text-gray-400 text-sm">No candidates yet</div>;
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          <div className="w-40 truncate text-gray-600" title={k}>{k}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-orange-500" style={{ width: `${(v / max) * 100}%` }} /></div>
          <div className="w-8 text-right font-bold text-gray-900">{v}</div>
        </div>
      ))}
    </div>
  );
}
const QuotaCard = ({ icon: Icon, label, used, max }) => {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const full = max && used >= max;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs"><Icon size={15} /> {label}</div>
      <div className="text-2xl font-extrabold text-gray-900 mt-1">{used}<span className="text-sm font-medium text-gray-400"> / {max}</span></div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
};

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/summary').then(r => setS(r.data)).catch(() => setS({})); }, []);
  if (!s) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  const q = s.quotas || {}, u = s.usage || {};
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <QuotaCard icon={Building2} label="Companies" used={u.companies || 0} max={q.maxCompanies || 0} />
        <QuotaCard icon={Briefcase} label="Positions" used={u.positions || 0} max={q.maxPositions || 0} />
        <QuotaCard icon={Users} label="Recruiters" used={u.recruiters || 0} max={q.maxRecruiters || 0} />
        <QuotaCard icon={UserCheck} label="ClientSPOCs" used={u.clientspocs || 0} max={q.maxClientspocs || 0} />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-3">Positions by status</h3>
          <Donut data={s.positions?.byGroup || {}} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-1">Candidates</h3>
          <div className="text-xs text-gray-500 mb-3">{s.candidates?.total || 0} total · {s.candidates?.inProcess || 0} in process · {s.candidates?.rejected || 0} rejected</div>
          <Bars data={s.candidates?.byStatus || {}} />
        </div>
      </div>
    </div>
  );
}

// ── Companies ────────────────────────────────────────────────────────────────
const EMPTY_CO = { name: '', overview: '', candidateInstructions: '', photoRequired: false, commissionPercentage: '', logoUrl: '' };
function Companies({ onChanged }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_CO);
  const [questions, setQuestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api.get('/companies').then(r => setList(r.data.companies || [])).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditId(null); setForm(EMPTY_CO); setQuestions([]); setMsg(''); setOpen(true); };
  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name || '', overview: c.overview || '', candidateInstructions: c.candidateInstructions || '', photoRequired: !!c.photoRequired, commissionPercentage: c.commissionType === 'percentage' ? (c.commisson || '') : (c.commisson || ''), logoUrl: c.logoUrl || '' });
    setQuestions(Array.isArray(c.questions) ? c.questions.map(q => ({ type: q.type || 'subjective', question: q.question ?? q.label ?? '', options: q.options || [] })) : []);
    setMsg(''); setOpen(true);
  };
  const uploadLogo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('Please choose an image file.'); return; }
    if (file.size > 3 * 1024 * 1024) { setMsg('Logo must be under 3 MB.'); return; }
    setLogoBusy(true); setMsg('');
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const r = await api.post('/upload-image', { filename: file.name, contentType: file.type, base64 });
      setForm(f => ({ ...f, logoUrl: r.data.url }));
    } catch (e) { setMsg(e.response?.data?.message || 'Logo upload failed.'); }
    finally { setLogoBusy(false); }
  };
  const save = async () => {
    if (!form.name.trim()) { setMsg('Company name is required.'); return; }
    setBusy(true); setMsg('');
    try {
      if (editId) await api.put(`/companies/${editId}`, { ...form, questions });
      else await api.post('/companies', { ...form, questions });
      setOpen(false); setEditId(null); setForm(EMPTY_CO); setQuestions([]); await load(); onChanged && onChanged();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed.'); }
    finally { setBusy(false); }
  };
  const cls = 'mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30';
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">Companies</h2>
        <button onClick={openAdd} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-3 py-2"><Plus size={15} /> Add company</button>
      </div>
      {open && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 max-w-2xl">
          <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-gray-900">{editId ? 'Edit company' : 'Add company'}</h3><button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button></div>
          {msg && <div className="text-sm text-red-600 mb-2">{msg}</div>}
          {/* Logo */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 grid place-items-center overflow-hidden flex-shrink-0">
              {form.logoUrl ? <img src={form.logoUrl} alt="logo" className="w-full h-full object-contain" /> : <Building2 size={22} className="text-gray-300" />}
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 cursor-pointer">
              {logoBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-500 block">Company name *<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={cls} /></label>
            <label className="text-xs text-gray-500 block">Commission % <span className="text-gray-400">(auto-fills at position posting)</span><input type="number" value={form.commissionPercentage} onChange={e => setForm(f => ({ ...f, commissionPercentage: e.target.value }))} className={cls} /></label>
          </div>
          <label className="text-xs text-gray-500 block mt-3">Overview<textarea rows={3} value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} className={cls} /></label>
          <div className="mt-3"><label className="text-xs text-gray-500 block mb-1">Candidate Instructions</label><RichTextEditor value={form.candidateInstructions} onChange={(html) => setForm(f => ({ ...f, candidateInstructions: html }))} minHeight={120} placeholder="Instructions shown to candidates before the company overview…" /></div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-3"><input type="checkbox" checked={form.photoRequired} onChange={e => setForm(f => ({ ...f, photoRequired: e.target.checked }))} /> Require candidate photo</label>
          <div className="mt-3"><label className="text-xs text-gray-500 block mb-1">Client requirement questions</label><QuestionsEditor questions={questions} onChange={setQuestions} /></div>
          <button onClick={save} disabled={busy} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editId ? 'Save changes' : 'Save company'}</button>
        </div>
      )}
      {!list ? <div className="py-12 grid place-items-center text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
        : list.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">No companies yet.</div>
        : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{list.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 grid place-items-center overflow-hidden flex-shrink-0">
                  {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" /> : <Building2 size={18} className="text-gray-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">{c.name}</div>
                  {c.commisson ? <div className="text-xs text-green-700 font-medium mt-0.5">Commission: {c.commisson}{c.commissionType === 'percentage' ? '%' : ''}</div> : null}
                </div>
                <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-50 flex-shrink-0"><Pencil size={12} /> Edit</button>
              </div>
              <div className="text-xs text-gray-500 mt-2 line-clamp-2">{(c.overview || '').replace(/<[^>]*>/g, ' ') || 'No overview'}</div>
            </div>
          ))}</div>}
    </div>
  );
}

// ── People (recruiters / clientspocs) ────────────────────────────────────────
function People({ kind, onChanged }) {
  const isRec = kind === 'recruiters';
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '', skillCategory: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api.get(`/${kind}`).then(r => setList(r.data[kind] || [])).catch(() => setList([])), [kind]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) { setMsg('Name, email and password are required.'); return; }
    setBusy(true); setMsg('');
    try {
      await api.post(`/${kind}`, { ...form, skillCategory: form.skillCategory ? form.skillCategory.split(',').map(s => s.trim()).filter(Boolean) : [] });
      setOpen(false); setForm({ name: '', email: '', password: '', mobile: '', skillCategory: '' }); await load(); onChanged && onChanged();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed.'); }
    finally { setBusy(false); }
  };
  const toggle = async (r) => {
    const next = (r.accountStatus === 'blocked') ? 'approved' : 'blocked';
    try { await api.post(`/recruiters/${r.id}/status`, { status: next }); await load(); } catch (e) { alert(e.response?.data?.message || 'Failed.'); }
  };
  const cls = 'mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30';
  const title = isRec ? 'Recruiters' : 'ClientSPOCs';
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-3 py-2"><Plus size={15} /> Add {isRec ? 'recruiter' : 'ClientSPOC'}</button>
      </div>
      {open && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 max-w-xl">
          {msg && <div className="text-sm text-red-600 mb-2">{msg}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">Name *<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={cls} /></label>
            <label className="text-xs text-gray-500">Email *<input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={cls} /></label>
            <label className="text-xs text-gray-500">Password *<input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={cls} /></label>
            <label className="text-xs text-gray-500">Mobile<input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className={cls} /></label>
            <label className="text-xs text-gray-500 sm:col-span-2">Skill categories <span className="text-gray-400">comma-separated</span><input value={form.skillCategory} onChange={e => setForm(f => ({ ...f, skillCategory: e.target.value }))} className={cls} /></label>
          </div>
          <button onClick={save} disabled={busy} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save</button>
        </div>
      )}
      {!list ? <div className="py-12 grid place-items-center text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
        : list.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">None yet.</div>
        : <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">{list.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 grid place-items-center text-white text-sm font-bold">{(p.name || '?')[0].toUpperCase()}</div>
              <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div><div className="text-xs text-gray-500 truncate">{p.email} · {p.mobile || '—'}</div></div>
              {isRec && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.accountStatus === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.accountStatus === 'blocked' ? 'Blocked' : 'Active'}</span>}
              {isRec && <button onClick={() => toggle(p)} className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1">{p.accountStatus === 'blocked' ? <><CheckCircle2 size={12} /> Unblock</> : <><Ban size={12} /> Block</>}</button>}
            </div>
          ))}</div>}
    </div>
  );
}

// ── Positions ────────────────────────────────────────────────────────────────
function Positions({ onChanged, canPostOpenToAll }) {
  const [list, setList] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [spocs, setSpocs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = useCallback(() => api.get('/positions').then(r => setList(r.data.positions || [])).catch(() => setList([])), []);
  useEffect(() => {
    load();
    api.get('/companies').then(r => setCompanies((r.data.companies || []).map(c => c.name))).catch(() => {});
    api.get('/clientspocs').then(r => setSpocs((r.data.clientspocs || []).map(s => ({ id: s.id, name: s.name, email: s.email })))).catch(() => {});
  }, [load]);
  const pill = (s) => { const v = (s || '').toLowerCase(); if (v === 'active') return 'bg-green-100 text-green-700'; if (v === 'pending') return 'bg-amber-100 text-amber-700'; if (v === 'rejected') return 'bg-red-100 text-red-700'; if (v === 'hold') return 'bg-orange-100 text-orange-700'; return 'bg-gray-100 text-gray-600'; };
  const txt = (s) => { const v = (s || '').toLowerCase(); if (v === 'active') return 'Live'; if (v === 'pending') return 'Pending SPOC'; if (v === 'rejected') return 'Rejected'; if (v === 'hold') return 'On hold'; return s || '—'; };

  // Add or edit — both use the SAME Ad_Pos form (edit passes editPosition).
  if (open || editing) return (
    <div>
      <button onClick={() => { setOpen(false); setEditing(null); load(); }} className="mb-3 text-sm text-blue-600 hover:underline">← Back to positions</button>
      {(!companies.length || !spocs.length) ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2"><ShieldAlert size={16} /> Add at least one company and one ClientSPOC before posting a position.</div>
      ) : (
        <Ad_Pos firmMode={{ companies, spocs, canPostOpenToAll, editPosition: editing || undefined, onPosted: () => { setOpen(false); setEditing(null); load(); onChanged && onChanged(); } }} />
      )}
    </div>
  );
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">Positions</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-3 py-2"><Plus size={15} /> Post position</button>
      </div>
      {!list ? <div className="py-12 grid place-items-center text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
        : list.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">No positions yet.</div>
        : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{list.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2"><div className="font-semibold text-gray-900">{p.position}</div><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pill(p.status)}`}>{txt(p.status)}</span></div>
              <div className="text-xs text-gray-400 mt-0.5">#{p.pos_id}</div>
              <div className="text-xs text-gray-500 mt-1">{p.client} · {p.skill_category || '—'}</div>
              <div className="text-xs text-gray-400 mt-1">SPOC: {p.clientspoc_name || p.clientspoc}</div>
              <div className="mt-3 flex justify-end">
                <button onClick={() => setEditing(p)} className="flex items-center gap-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50"><Pencil size={12} /> Edit</button>
              </div>
            </div>
          ))}</div>}
    </div>
  );
}

// ── Reports ──────────────────────────────────────────────────────────────────
function Reports() {
  const dl = (type) => { window.open(`/api/consulting/report/${type}`, '_blank'); };
  const items = [
    { type: 'recruiters', label: 'Recruiters', icon: Users },
    { type: 'clientspocs', label: 'ClientSPOCs', icon: UserCheck },
    { type: 'positions', label: 'Positions', icon: Briefcase },
    { type: 'candidates', label: 'Candidates', icon: Users },
  ];
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Reports</h2>
      <p className="text-sm text-gray-500 mb-4">Download CSV reports for your firm's data.</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {items.map(it => (
          <button key={it.type} onClick={() => dl(it.type)} className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition">
            <it.icon size={20} className="text-blue-600" />
            <div className="font-semibold text-gray-900 mt-2">{it.label}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FileDown size={12} /> Download CSV</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const slugify = (s) => (s || '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Profile / Landing page ───────────────────────────────────────────────────
function Profile({ firmId, firmName }) {
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  useEffect(() => { api.get('/profile').then(r => setF(r.data.firm || {})).catch(() => setF({})); }, []);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const uploadLogo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('Please choose an image file.'); return; }
    if (file.size > 3 * 1024 * 1024) { setMsg('Logo must be under 3 MB.'); return; }
    setLogoBusy(true); setMsg('');
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const r = await api.post('/logo', { filename: file.name, contentType: file.type, base64 });
      set('logoUrl', r.data.url);
    } catch (e) { setMsg(e.response?.data?.message || 'Logo upload failed.'); }
    finally { setLogoBusy(false); }
  };
  const save = async () => {
    setBusy(true); setMsg('');
    try { const r = await api.put('/profile', { about: f.about, logoUrl: f.logoUrl, website: f.website, city: f.city, state: f.state, phone: f.phone, linkedin: f.linkedin }); setF(x => ({ ...x, ...r.data.firm })); setMsg('ok'); }
    catch (e) { setMsg(e.response?.data?.message || 'Failed.'); }
    finally { setBusy(false); }
  };
  if (!f) return <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  const cls = 'mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30';
  const landingUrl = `${window.location.origin}/firm/${slugify(firmName) || firmId}`;
  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600 min-w-0"><div className="font-semibold text-gray-900">Your public landing page</div><a href={landingUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{landingUrl}</a></div>
        <button onClick={() => navigator.clipboard?.writeText(landingUrl)} className="text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 flex-shrink-0">Copy link</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Firm profile</h3>
        {msg === 'ok' && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">Saved.</div>}
        {msg && msg !== 'ok' && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 grid place-items-center overflow-hidden flex-shrink-0">
              {f.logoUrl ? <img src={f.logoUrl} alt="logo" className="w-full h-full object-contain" /> : <Landmark size={26} className="text-gray-300" />}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 cursor-pointer">
                {logoBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} />
              </label>
              <p className="text-[11px] text-gray-400 mt-1">PNG/JPG/SVG, under 3 MB.</p>
            </div>
          </div>
        </div>
        <div className="mt-3"><label className="text-xs text-gray-500 block mb-1">About</label>
          <RichTextEditor value={f.about || ''} onChange={(html) => set('about', html)} minHeight={140} placeholder="Tell candidates and clients about your firm…" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="text-xs text-gray-500">Website<input value={f.website || ''} onChange={e => set('website', e.target.value)} className={cls} /></label>
          <label className="text-xs text-gray-500">LinkedIn<input value={f.linkedin || ''} onChange={e => set('linkedin', e.target.value)} className={cls} /></label>
          <label className="text-xs text-gray-500">City<input value={f.city || ''} onChange={e => set('city', e.target.value)} className={cls} /></label>
          <label className="text-xs text-gray-500">State<input value={f.state || ''} onChange={e => set('state', e.target.value)} className={cls} /></label>
        </div>
        <button onClick={save} disabled={busy} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" /> : null} Save profile</button>
      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────
export default function ConsultingDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('overview');
  const [nav, setNav] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => { api.get('/me').then(r => setMe(r.data)).catch(() => navigate('/consulting')); }, [navigate, refresh]);
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => el.setAttribute('data-theme', 'dark');
    apply(); const raf = requestAnimationFrame(apply);
    return () => { cancelAnimationFrame(raf); el.removeAttribute('data-theme'); };
  }, []);
  const logout = async () => { try { await api.post('/logout'); } catch (_) {} navigate('/consulting'); };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'positions', label: 'Positions', icon: Briefcase },
    { id: 'recruiters', label: 'Recruiters', icon: Users },
    { id: 'clientspocs', label: 'ClientSPOCs', icon: UserCheck },
    { id: 'reports', label: 'Reports', icon: FileDown },
    { id: 'profile', label: 'Profile & Landing', icon: Landmark },
  ];

  if (!me) return <div className="min-h-screen grid place-items-center"><Loader2 size={28} className="animate-spin text-blue-500" /></div>;

  const pending = me.status !== 'approved';
  const bump = () => setRefresh(x => x + 1);

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-slate-950 text-slate-200 flex flex-col transition-transform ${nav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-4 flex items-center gap-2 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white"><Landmark size={18} /></div>
          <div className="min-w-0"><div className="font-bold text-white truncate">{me.name}</div><div className="text-[11px] text-slate-400">Consulting Firm</div></div>
        </div>
        <nav className="flex-1 py-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setNav(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="m-3 flex items-center gap-2 justify-center text-sm text-slate-300 hover:text-white border border-slate-700 rounded-lg py-2"><LogOut size={15} /> Logout</button>
      </aside>
      {nav && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setNav(false)} />}

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button className="lg:hidden text-gray-500" onClick={() => setNav(true)}><Menu size={22} /></button>
            <h1 className="font-bold text-gray-900">{tabs.find(t => t.id === tab)?.label}</h1>
          </div>
          <div className="text-xs text-gray-400">{me.email}</div>
        </header>

        <main className="p-4 sm:p-6">
          {pending && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
              <ShieldAlert size={16} /> Your firm account is <b>pending administrator approval</b>. You can look around, but adding companies/positions/team is disabled until approved and quotas are set.
            </div>
          )}
          {tab === 'overview' && <Overview key={refresh} />}
          {tab === 'companies' && <Companies onChanged={bump} />}
          {tab === 'positions' && <Positions onChanged={bump} canPostOpenToAll={me.canPostOpenToAll} />}
          {tab === 'recruiters' && <People kind="recruiters" onChanged={bump} />}
          {tab === 'clientspocs' && <People kind="clientspocs" onChanged={bump} />}
          {tab === 'reports' && <Reports />}
          {tab === 'profile' && <Profile firmId={me.id} firmName={me.name} />}
        </main>
      </div>
    </div>
  );
}
