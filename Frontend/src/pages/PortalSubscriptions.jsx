import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, RefreshCw, Gift } from 'lucide-react';

// SuperAdmin → subscriptions for Vendor and Consulting Firm accounts.
// Shows who is active, who has lapsed, and lets access be granted or extended
// without a payment.

const fmt = (v) => v
  ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const STATE = {
  paid: { label: 'Active', cls: 'bg-green-100 text-green-700' },
  free: { label: 'Free access', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Expired', cls: 'bg-red-100 text-red-700' },
  'never-paid': { label: 'Not paid', cls: 'bg-amber-100 text-amber-700' },
  'no-plan-yet': { label: 'No plan yet', cls: 'bg-gray-100 text-gray-600' },
};

export default function PortalSubscriptions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [tab, setTab] = useState('all');

  const load = () => {
    setLoading(true);
    axios.get('/api/portal-subscription/admin/accounts', { withCredentials: true })
      .then(r => { setRows(r.data?.accounts || []); setError(''); })
      .catch(e => setError(e.response?.data?.message || 'Could not load subscriptions.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const act = async (row, mode, extra = {}) => {
    setBusy(row.email);
    try {
      const r = await axios.post('/api/portal-subscription/admin/grant',
        { email: row.email, mode, ...extra }, { withCredentials: true });
      alert(r.data?.message || 'Done.');
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update this account.');
    } finally { setBusy(null); }
  };

  const grantFree = (row) => {
    const until = window.prompt(
      `Give ${row.name} free access.\n\nLeave blank for unlimited, or enter an end date as YYYY-MM-DD:`, '');
    if (until === null) return;
    act(row, 'free', until.trim() ? { until: until.trim() } : {});
  };

  const extend = (row) => {
    const months = window.prompt(`Extend ${row.name} by how many months?`, '6');
    if (!months) return;
    act(row, 'extend', { months: parseInt(months, 10) || 6 });
  };

  const shown = rows.filter(r => {
    if (tab === 'all') return true;
    if (tab === 'active') return r.active;
    if (tab === 'lapsed') return !r.active;
    if (tab === 'free') return r.free;
    return true;
  });

  const counts = {
    all: rows.length,
    active: rows.filter(r => r.active).length,
    lapsed: rows.filter(r => !r.active).length,
    free: rows.filter(r => r.free).length,
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard size={20} /> Subscriptions
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Vendor and Consulting Firm plans. A lapsed account cannot sign in until it is renewed or given free access.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['all', 'All'], ['active', 'Active'], ['lapsed', 'Lapsed'], ['free', 'Free access']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {label} ({counts[k]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : !shown.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">Nothing here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Valid until</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map(r => {
                  const st = STATE[r.free ? 'free' : r.reason] || STATE['no-plan-yet'];
                  return (
                    <tr key={r.email} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{r.name || '—'}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(r.validUntil)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {r.free ? (
                            <button onClick={() => act(r, 'revoke')} disabled={busy === r.email}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                              Remove free access
                            </button>
                          ) : (
                            <button onClick={() => grantFree(r)} disabled={busy === r.email}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                              <Gift size={13} /> Give free access
                            </button>
                          )}
                          <button onClick={() => extend(r)} disabled={busy === r.email}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50">
                            Extend
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
