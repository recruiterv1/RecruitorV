import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Inbox, Search, Loader2, CheckCircle2, Users, ShieldCheck } from 'lucide-react';

// SuperAdmin/Admin page to grant the (paid) sidebar Inbox to individual users.
// Everyone keeps the menu item, but only users checked here can open the Inbox;
// the rest see a "contact your administrator" screen.
const roleBadge = {
  recruiter: 'bg-blue-100 text-blue-700',
  coach: 'bg-purple-100 text-purple-700',
  expert: 'bg-emerald-100 text-emerald-700',
  clientspoc: 'bg-orange-100 text-orange-700',
  vendor: 'bg-pink-100 text-pink-700',
};

const FREE_DURATIONS = [
  { key: '1month', label: 'For 1 Month' },
  { key: 'quarterly', label: 'For Quarterly' },
  { key: 'halfyearly', label: 'For Half Yearly' },
  { key: 'lifetime', label: 'Life time free' },
];

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

// Amount (₹) for a plan the user clicked but didn't buy.
const PLAN_AMOUNT = { '6month': '₹699', '1year': '₹1299' };

const DURATION_LABEL = { '1month': '1 Month', quarterly: 'Quarterly', halfyearly: 'Half Yearly', lifetime: 'Lifetime' };

// One-line description of a user's current access (type · plan/duration · date).
const accessDetail = (u) => {
  if (!u.enabled) return '';
  if (u.source === 'subscription') {
    const PLAN_LABEL = { '6month': '6 Months', '1year': '1 Year' };
    const plan = PLAN_LABEL[u.plan] || (u.months ? `${u.months}-month plan` : 'Subscription');
    if (u.validUntil) return `${plan} · ${u.autopay ? 'renews' : 'valid till'} ${fmtDate(u.validUntil)}${u.autopay ? '' : ' · autopay off'}`;
    return plan;
  }
  // free / admin grant
  const dur = DURATION_LABEL[u.freeDuration] || (u.validUntil ? '' : 'Lifetime');
  if (u.validUntil) return `${dur ? dur + ' · ' : ''}valid till ${fmtDate(u.validUntil)}`;
  return dur || 'Lifetime';
};

export default function SuperAdminInboxAccess() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState({});        // email -> bool (in-flight)
  const [error, setError] = useState('');
  const [grantedCount, setGrantedCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounce = useRef(null);
  const PAGE_SIZE = 25;

  // Top filters. Kept in a ref too so pagination / post-grant refetches always
  // send the current filter set even inside the memoised fetchUsers.
  const [fStatus, setFStatus] = useState('all');   // all | paid | free | clicked | noaccess
  const [fPlan, setFPlan] = useState('');           // '' | 6month | 1year
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const filtersRef = useRef({ status: 'all', plan: '', from: '', to: '' });

  const fetchUsers = useCallback(async (q = '', p = 1) => {
    setLoading(true); setError('');
    try {
      const f = filtersRef.current;
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (q) params.set('q', q);
      if (f.status && f.status !== 'all') params.set('status', f.status);
      if (f.plan) params.set('plan', f.plan);
      if (f.from) params.set('from', f.from);
      if (f.to) params.set('to', f.to);
      const res = await axios.get(`/api/inbox-access/users?${params.toString()}`, { withCredentials: true });
      setUsers(res.data.users || []);
      setGrantedCount(res.data.grantedCount || 0);
      setTotalUsers(res.data.totalUsers || 0);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || p);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users.');
      setUsers([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers('', 1); }, [fetchUsers]);

  // Debounced server-side search — resets to page 1.
  const onSearch = (v) => {
    setSearch(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchUsers(v.trim(), 1), 300);
  };

  // Update one filter, sync the ref, and refetch from page 1.
  const setFilter = (key, val) => {
    filtersRef.current = { ...filtersRef.current, [key]: val };
    if (key === 'status') setFStatus(val);
    if (key === 'plan') setFPlan(val);
    if (key === 'from') setFFrom(val);
    if (key === 'to') setFTo(val);
    fetchUsers(search.trim(), 1);
  };
  const clearFilters = () => {
    filtersRef.current = { status: 'all', plan: '', from: '', to: '' };
    setFStatus('all'); setFPlan(''); setFFrom(''); setFTo('');
    fetchUsers(search.trim(), 1);
  };

  const goToPage = (p) => { if (p >= 1 && p <= totalPages) fetchUsers(search.trim(), p); };

  // Mark an unverified user verified. isVerified:false makes inbound mail to their
  // derived @recruiterv.com address get dropped, so a paid Inbox never receives.
  const verifyUser = async (u) => {
    setSaving(s => ({ ...s, [u.email]: true }));
    setError('');
    try {
      await axios.post('/api/inbox-access/verify-user', { email: u.email }, { withCredentials: true });
      await fetchUsers(search.trim(), page);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to verify user.');
    } finally {
      setSaving(s => { const n = { ...s }; delete n[u.email]; return n; });
    }
  };

  // Grant free access for a duration, or revoke. Re-fetches current page.
  const setAccess = async (u, enabled, duration) => {
    setSaving(s => ({ ...s, [u.email]: true }));
    setError('');
    try {
      await axios.post('/api/inbox-access/toggle',
        { email: u.email, enabled, duration, name: u.name, role: u.role },
        { withCredentials: true });
      await fetchUsers(search.trim(), page);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update access.');
    } finally {
      setSaving(s => { const n = { ...s }; delete n[u.email]; return n; });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-1">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white flex-shrink-0">
          <Inbox size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inbox Access</h1>
          <p className="text-sm text-gray-500">
            The sidebar <b>Inbox</b> is a paid feature. Check a user to grant them access; unchecked users see a
            "contact your administrator" message.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 my-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">Total users</span>
          <span className="text-sm font-bold text-gray-900">{totalUsers}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-sm text-gray-600">With access</span>
          <span className="text-sm font-bold text-green-600">{grantedCount}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4 bg-white border border-gray-200 rounded-xl px-3 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Access</span>
          <select value={fStatus} onChange={e => setFilter('status', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="all">All users</option>
            <option value="paid">Paid</option>
            <option value="free">Free (admin grant)</option>
            <option value="clicked">Clicked plan · unpaid</option>
            <option value="noaccess">No access</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Plan</span>
          <select value={fPlan} onChange={e => setFilter('plan', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">Any plan</option>
            <option value="6month">6 Months · ₹699</option>
            <option value="1year">1 Year · ₹1299</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Registered from</span>
          <input type="date" value={fFrom} onChange={e => setFilter('from', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Registered to</span>
          <input type="date" value={fTo} onChange={e => setFilter('to', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30" />
        </label>
        {(fStatus !== 'all' || fPlan || fFrom || fTo) && (
          <button onClick={clearFilters}
            className="text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
            Clear filters
          </button>
        )}
      </div>

      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 grid place-items-center text-gray-400">
            <Loader2 size={26} className="animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No users found.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map(u => {
              const paid = u.source === 'subscription';
              return (
                <li key={u.email} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 grid place-items-center text-white text-sm font-bold flex-shrink-0">
                    {(u.name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-800 truncate">{u.name || '—'}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    {u.phone && <div className="text-xs text-gray-400 truncate">{u.phone}</div>}
                  </div>

                  {/* Registered on + payment-intent (clicked a plan, didn't buy) */}
                  <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0 w-32">
                    <span className="text-[11px] text-gray-400">Registered</span>
                    <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap">{fmtDate(u.registeredOn) || '—'}</span>
                    {u.clickedPlan && (
                      <span className="mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap"
                        title="Clicked a plan but did not complete payment">
                        Clicked {PLAN_AMOUNT[u.clickedPlan] || u.clickedPlan} · unpaid
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadge[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>

                  {/* Unverified users have inbound mail to their @recruiterv.com
                      address dropped — surface + one-click fix. */}
                  {u.verified === false && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap"
                        title="isVerified is false — incoming email to this user is being dropped. Verify to enable inbox delivery.">
                        Unverified
                      </span>
                      <button
                        onClick={() => verifyUser(u)}
                        disabled={!!saving[u.email]}
                        className="text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg px-2.5 py-1 transition disabled:opacity-60">
                        {saving[u.email] ? '…' : 'Verify'}
                      </button>
                    </div>
                  )}

                  {u.enabled ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${paid ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                          {paid ? 'Paid' : 'Free'}
                        </span>
                        <div className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">{accessDetail(u)}</div>
                      </div>
                      <button
                        onClick={() => setAccess(u, false)}
                        disabled={!!saving[u.email]}
                        className="text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 transition disabled:opacity-60">
                        Revoke
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        defaultValue="lifetime"
                        disabled={!!saving[u.email]}
                        id={`dur-${u.email}`}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/30">
                        {FREE_DURATIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                      </select>
                      <button
                        onClick={() => setAccess(u, true, document.getElementById(`dur-${u.email}`)?.value || 'lifetime')}
                        disabled={!!saving[u.email]}
                        className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg px-2.5 py-1 transition disabled:opacity-60">
                        {saving[u.email] ? '…' : 'Grant free'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            {search ? ' matches' : ' users'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="px-3 text-gray-600">Page {page} / {totalPages}</span>
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
