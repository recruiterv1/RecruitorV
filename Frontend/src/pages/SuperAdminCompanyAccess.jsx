import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Building2, Search, Loader2, UserCheck, KeyRound, Save } from 'lucide-react';

// SuperAdmin/Admin: give a company portal login (email + password) and assign the
// ONE ClientSPOC that reviews/approves its posted positions.
export default function SuperAdminCompanyAccess() {
  const [companies, setCompanies] = useState([]);
  const [spocs, setSpocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({});     // id -> { email, password, clientspoc }
  const [saving, setSaving] = useState({});
  const [okMsg, setOkMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [c, s] = await Promise.all([
        axios.get('/api/company/admin/list', { withCredentials: true }),
        axios.get('/api/company/admin/clientspocs', { withCredentials: true }),
      ]);
      setCompanies(c.data.companies || []);
      setSpocs(s.data.clientspocs || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load. SuperAdmin access required.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setField = (id, key, val) => setDraft(d => ({ ...d, [id]: { ...d[id], [key]: val } }));

  const save = async (co) => {
    const d = draft[co.id] || {};
    const clientspocEmail = d.clientspoc !== undefined ? d.clientspoc : (co.assignedClientspoc || '');
    const spoc = spocs.find(s => s.email === clientspocEmail);
    setSaving(s => ({ ...s, [co.id]: true })); setError(''); setOkMsg('');
    try {
      await axios.post('/api/company/admin/access', {
        companyId: co.id,
        email: d.email !== undefined ? d.email : co.email,
        password: d.password || undefined,           // only change when typed
        clientspocEmail,
        clientspocName: spoc?.name || '',
        portalEnabled: true,
      }, { withCredentials: true });
      setOkMsg(`Saved ${co.name}.`);
      setDraft(dr => { const n = { ...dr }; delete n[co.id]; return n; });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(s => { const n = { ...s }; delete n[co.id]; return n; });
    }
  };

  const filtered = companies.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white flex-shrink-0"><Building2 size={22} /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Company Portal Access</h1>
          <p className="text-sm text-gray-500">Give a company a login for <b>recruiterv.com/company</b> and assign the ClientSPOC who approves its positions.</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40" />
      </div>

      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      {okMsg && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{okMsg}</div>}

      {loading ? (
        <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={26} className="animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(co => {
            const d = draft[co.id] || {};
            const emailVal = d.email !== undefined ? d.email : (co.email || '');
            const spocVal = d.clientspoc !== undefined ? d.clientspoc : (co.assignedClientspoc || '');
            return (
              <div key={co.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="font-semibold text-gray-900">{co.name}</div>
                  <div className="flex items-center gap-2">
                    {co.hasLogin && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Login set</span>}
                    {co.assignedClientspocName && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">SPOC: {co.assignedClientspocName}</span>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="text-xs text-gray-500">
                    Login email
                    <input value={emailVal} onChange={e => setField(co.id, 'email', e.target.value)} placeholder="company@example.com"
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </label>
                  <label className="text-xs text-gray-500">
                    <span className="flex items-center gap-1"><KeyRound size={12} /> {co.hasLogin ? 'New password (leave blank to keep)' : 'Set password'}</span>
                    <input type="text" value={d.password || ''} onChange={e => setField(co.id, 'password', e.target.value)} placeholder="••••••••"
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </label>
                  <label className="text-xs text-gray-500">
                    <span className="flex items-center gap-1"><UserCheck size={12} /> Assigned ClientSPOC</span>
                    <select value={spocVal} onChange={e => setField(co.id, 'clientspoc', e.target.value)}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30">
                      <option value="">— none —</option>
                      {spocs.map(s => <option key={s.email} value={s.email}>{s.name} ({s.email})</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={() => save(co)} disabled={!!saving[co.id]}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition disabled:opacity-60">
                    {saving[co.id] ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No companies found.</div>}
        </div>
      )}
    </div>
  );
}
