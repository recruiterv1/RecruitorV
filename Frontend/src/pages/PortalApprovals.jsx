import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, RefreshCw } from 'lucide-react';

// SuperAdmin → approvals for the four portal account types. Company and Vendor
// live in admin_db; a consulting firm has its own collection. Both are shown
// here so there is one place to approve from.

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'company', label: 'Company' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'consultingfirm', label: 'Consulting Firm' },
];

const BADGE = {
  company: 'bg-blue-100 text-blue-700',
  vendor: 'bg-purple-100 text-purple-700',
  consultingfirm: 'bg-teal-100 text-teal-700',
};

const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PortalApprovals() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get('/api/portal/pending', { params: { type: tab }, withCredentials: true })
      .then(r => { setRows(r.data?.pending || []); setError(''); })
      .catch(e => setError(e.response?.data?.message || 'Could not load pending accounts.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [tab]);   // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (row, approve) => {
    const reason = approve ? '' : (window.prompt(`Reason for rejecting "${row.name}"? (optional)`) ?? '');
    if (!approve && reason === null) return;
    if (!window.confirm(
      approve
        ? `Approve "${row.name}"? They will be emailed and able to sign in.`
        : `Reject "${row.name}"? They will be emailed and cannot sign in.`
    )) return;

    setBusy(row.id);
    try {
      const r = await axios.post(`/api/portal/pending/${row.id}/decision`,
        { source: row.source, approve, reason }, { withCredentials: true });
      alert(r.data?.message || 'Done.');
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update this account.');
    } finally { setBusy(null); }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} /> Portal Approvals
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Company, Vendor and Consulting Firm accounts waiting to be approved. They cannot sign in until you approve them.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : !rows.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">Nothing waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{r.name || '—'}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE[r.type] || 'bg-gray-100 text-gray-600'}`}>
                    {TYPES.find(t => t.key === r.type)?.label || r.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {r.contactName ? `${r.contactName} · ` : ''}{r.email}{r.phone ? ` · ${r.phone}` : ''}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Registered {fmt(r.registeredAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => decide(r, true)} disabled={busy === r.id}
                  className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => decide(r, false)} disabled={busy === r.id}
                  className="px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
