import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Landmark, Loader2, Search, KeyRound, Save, Plus } from 'lucide-react';

const QUOTA_KEYS = [
  { key: 'maxCompanies', label: 'Companies' },
  { key: 'maxPositions', label: 'Positions' },
  { key: 'maxRecruiters', label: 'Recruiters' },
  { key: 'maxClientspocs', label: 'ClientSPOCs' },
];

// SuperAdmin: approve consulting firms, set quotas, (re)set login password, or create one.
export default function SuperAdminConsultingFirms() {
  const [firms, setFirms] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [draft, setDraft] = useState({});   // id -> { quotas, password, status }
  const [saving, setSaving] = useState({});
  const [creating, setCreating] = useState(false);
  const [nf, setNf] = useState({ name: '', email: '', phone: '', password: '', maxCompanies: 5, maxPositions: 20, maxRecruiters: 10, maxClientspocs: 5 });

  const load = useCallback(async () => {
    setError('');
    try { const r = await axios.get('/api/consulting/admin/list', { withCredentials: true }); setFirms(r.data.firms || []); }
    catch (e) { setFirms([]); setError(e.response?.data?.message || 'Failed to load. SuperAdmin access required.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setQuota = (id, key, val, cur) => setDraft(d => ({ ...d, [id]: { ...d[id], quotas: { ...(d[id]?.quotas || cur), [key]: val } } }));
  const setField = (id, key, val) => setDraft(d => ({ ...d, [id]: { ...d[id], [key]: val } }));

  const save = async (f, status) => {
    const d = draft[f.id] || {};
    setSaving(s => ({ ...s, [f.id]: true })); setError(''); setOk('');
    try {
      await axios.post(`/api/consulting/admin/update/${f.id}`, {
        status: status || d.status || f.status,
        quotas: { ...f.quotas, ...(d.quotas || {}) },
        password: d.password || undefined,
        canPostOpenToAll: d.canPostOpenToAll !== undefined ? d.canPostOpenToAll : f.canPostOpenToAll,
      }, { withCredentials: true });
      setOk(`Saved ${f.name}.`);
      setDraft(x => { const n = { ...x }; delete n[f.id]; return n; });
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(s => { const n = { ...s }; delete n[f.id]; return n; }); }
  };

  const createFirm = async () => {
    if (!nf.name || !nf.email || !nf.password) { setError('Name, email and password are required.'); return; }
    setError(''); setOk('');
    try {
      await axios.post('/api/consulting/admin/create', {
        name: nf.name, email: nf.email, phone: nf.phone, password: nf.password,
        quotas: { maxCompanies: nf.maxCompanies, maxPositions: nf.maxPositions, maxRecruiters: nf.maxRecruiters, maxClientspocs: nf.maxClientspocs },
      }, { withCredentials: true });
      setOk('Firm created.'); setCreating(false); setNf({ name: '', email: '', phone: '', password: '', maxCompanies: 5, maxPositions: 20, maxRecruiters: 10, maxClientspocs: 5 });
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to create.'); }
  };

  const list = (firms || []).filter(f => !search || (f.name || '').toLowerCase().includes(search.toLowerCase()) || (f.email || '').toLowerCase().includes(search.toLowerCase()));
  const cls = 'mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white flex-shrink-0"><Landmark size={22} /></div>
          <div><h1 className="text-xl font-bold text-gray-900">Consulting Firms</h1><p className="text-sm text-gray-500">Approve firms, set quotas and manage logins.</p></div>
        </div>
        <button onClick={() => setCreating(c => !c)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-3 py-2"><Plus size={15} /> New firm</button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      {ok && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{ok}</div>}

      {creating && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-gray-900 mb-2">Create firm</h3>
          <div className="grid sm:grid-cols-4 gap-2">
            <label className="text-xs text-gray-500">Name *<input value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} className={cls} /></label>
            <label className="text-xs text-gray-500">Email *<input value={nf.email} onChange={e => setNf({ ...nf, email: e.target.value })} className={cls} /></label>
            <label className="text-xs text-gray-500">Phone<input value={nf.phone} onChange={e => setNf({ ...nf, phone: e.target.value })} className={cls} /></label>
            <label className="text-xs text-gray-500">Password *<input value={nf.password} onChange={e => setNf({ ...nf, password: e.target.value })} className={cls} /></label>
            {QUOTA_KEYS.map(q => <label key={q.key} className="text-xs text-gray-500">{q.label} quota<input type="number" value={nf[q.key]} onChange={e => setNf({ ...nf, [q.key]: e.target.value })} className={cls} /></label>)}
          </div>
          <button onClick={createFirm} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2">Create</button>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search firms…" className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40" />
      </div>

      {!firms ? <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={26} className="animate-spin" /></div>
        : list.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">No firms.</div>
        : <div className="space-y-3">{list.map(f => {
            const d = draft[f.id] || {};
            const statusColor = f.status === 'approved' ? 'bg-green-100 text-green-700' : f.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
            return (
              <div key={f.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div><div className="font-semibold text-gray-900">{f.name}</div><div className="text-xs text-gray-500">{f.email} · {f.phone || '—'}</div></div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{f.status}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUOTA_KEYS.map(q => (
                    <label key={q.key} className="text-xs text-gray-500">{q.label} <span className="text-gray-400">(used {f.usage?.[q.key.replace('max', '').toLowerCase()] ?? 0})</span>
                      <input type="number" value={(d.quotas?.[q.key]) ?? f.quotas?.[q.key] ?? 0} onChange={e => setQuota(f.id, q.key, e.target.value, f.quotas)} className={cls} />
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 mt-3 cursor-pointer">
                  <input type="checkbox" checked={d.canPostOpenToAll !== undefined ? d.canPostOpenToAll : (f.canPostOpenToAll === true)} onChange={e => setField(f.id, 'canPostOpenToAll', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  Allow posting positions <b className="mx-1">open to all recruiters</b> (shows an "Open to all" checkbox on their post form)
                </label>
                <div className="flex flex-wrap items-end gap-2 mt-3">
                  <label className="text-xs text-gray-500 flex-1 min-w-[160px]"><span className="flex items-center gap-1"><KeyRound size={12} /> New password (optional)</span>
                    <input value={d.password || ''} onChange={e => setField(f.id, 'password', e.target.value)} placeholder="leave blank to keep" className={cls} />
                  </label>
                  {f.status !== 'approved'
                    ? <button onClick={() => save(f, 'approved')} disabled={!!saving[f.id]} className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 disabled:opacity-60">Approve & save</button>
                    : <button onClick={() => save(f, 'blocked')} disabled={!!saving[f.id]} className="text-sm font-medium text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50">Block</button>}
                  <button onClick={() => save(f)} disabled={!!saving[f.id]} className="flex items-center gap-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-60">{saving[f.id] ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
                </div>
              </div>
            );
          })}</div>}
    </div>
  );
}
