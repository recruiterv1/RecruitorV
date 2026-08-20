import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';

// SuperAdmin → Candidates. One table behind three tabs; the server does the
// filtering and paging because candidate_db holds 21k+ rows.

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Status pill colouring: green for progress, red for closed-out, amber for waiting.
const statusTone = (st) => {
  const s = String(st || '').toLowerCase();
  if (s.includes('reject') || s.includes('drop') || s === 'duplicate') return 'bg-red-100 text-red-700';
  if (s.includes('offer accepted') || s.includes('joining') || s.includes('selected')) return 'bg-green-100 text-green-700';
  if (s.includes('schedul') || s.includes('pending') || s === 'applied' || s === 'submitted') return 'bg-amber-100 text-amber-700';
  if (s === 'resume bank') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
};

const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-9 border-2 border-gray-200 rounded-lg px-2 text-xs bg-white focus:border-blue-500 outline-none max-w-[190px]"
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/**
 * @param {'all'|'direct'|'active'} tab
 * @param {string[]} columns  which optional columns to show
 */
const CandidateTable = ({ tab, title, subtitle, dateLabel, showSubmitter }) => {
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({ statuses: [], positions: [], clients: [], sources: [], recruiters: [] });
  const [meta, setMeta] = useState({ total: 0, tabTotal: 0, page: 1, pages: 1, pageSize: 50 });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState('');
  const [client, setClient] = useState('');
  const [recruiter, setRecruiter] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the free-text box so typing doesn't fire a request per keystroke.
  const [qDebounced, setQDebounced] = useState('');
  const qTimer = useRef(null);
  useEffect(() => {
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => { setQDebounced(q); setPage(1); }, 350);
    return () => clearTimeout(qTimer.current);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    const params = { tab, page, pageSize: 50 };
    if (qDebounced) params.q = qDebounced;
    if (status) params.status = status;
    if (position) params.position = position;
    if (client) params.client = client;
    if (recruiter) params.recruiter = recruiter;
    if (source) params.source = source;
    if (from) params.from = from;
    if (to) params.to = to;
    if (tab === 'active') params.sort = 'updated';

    axios.get('/admin/candidates', { params, withCredentials: true })
      .then(r => {
        setRows(r.data?.candidates || []);
        setFacets(r.data?.facets || { statuses: [], positions: [], clients: [], sources: [], recruiters: [] });
        setMeta({
          total: r.data?.total || 0, tabTotal: r.data?.tabTotal || 0,
          page: r.data?.page || 1, pages: r.data?.pages || 1, pageSize: r.data?.pageSize || 50,
        });
      })
      .catch(() => { setRows([]); })
      .finally(() => setLoading(false));
  }, [tab, page, qDebounced, status, position, client, recruiter, source, from, to]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setQ(''); setStatus(''); setPosition(''); setClient('');
    setRecruiter(''); setSource(''); setFrom(''); setTo(''); setPage(1);
  };
  const anyFilter = q || status || position || client || recruiter || source || from || to;

  // Export what is currently filtered, not just the visible page.
  const exportCsv = async () => {
    const params = { tab, page: 1, pageSize: 200 };
    if (qDebounced) params.q = qDebounced;
    if (status) params.status = status;
    if (position) params.position = position;
    if (client) params.client = client;
    if (recruiter) params.recruiter = recruiter;
    if (source) params.source = source;
    if (from) params.from = from;
    if (to) params.to = to;

    const out = [];
    for (let p = 1; p <= Math.ceil(meta.total / 200) && p <= 60; p++) {
      const r = await axios.get('/admin/candidates', { params: { ...params, page: p }, withCredentials: true });
      out.push(...(r.data?.candidates || []));
    }
    const head = ['Candidate', 'Email', 'Mobile', 'Position', 'Position ID', 'Client',
      'Status', 'Source', 'Submitted by', 'Role', 'Landed', 'Last updated'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [head.join(',')].concat(out.map(c => [
      c.candidate, c.emails, c.mob, c.pos_name, c.pos_id, c.client,
      c.statusa, c.source, c.recName || c.clientspocName || c.recEmail, c.recRole,
      fmtDate(c.datePosted), fmtDate(c.updatedAt),
    ].map(esc).join(','))).join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab}-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-white/80 text-sm mt-1">
            {subtitle} · <b>{meta.tabTotal.toLocaleString('en-IN')}</b> total
            {anyFilter && <> · <b>{meta.total.toLocaleString('en-IN')}</b> matching</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} disabled={!meta.total}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium disabled:opacity-40">
            <Download size={16} /> Export
          </button>
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, mobile, position…"
              className="w-full h-9 border-2 border-gray-200 rounded-lg pl-9 pr-3 text-xs focus:border-blue-500 outline-none"
            />
          </div>
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={facets.statuses} placeholder="All statuses" />
          <Select value={position} onChange={(v) => { setPosition(v); setPage(1); }} options={facets.positions} placeholder="All positions" />
          <Select value={client} onChange={(v) => { setClient(v); setPage(1); }} options={facets.clients} placeholder="All clients" />
          <Select value={recruiter} onChange={(v) => { setRecruiter(v); setPage(1); }} options={facets.recruiters} placeholder="Anyone" />
          {tab !== 'direct' && (
            <Select value={source} onChange={(v) => { setSource(v); setPage(1); }} options={facets.sources} placeholder="Any source" />
          )}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400">{dateLabel}</span>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="h-9 border-2 border-gray-200 rounded-lg px-2 text-xs focus:border-blue-500 outline-none" />
            <span className="text-[11px] text-gray-400">to</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="h-9 border-2 border-gray-200 rounded-lg px-2 text-xs focus:border-blue-500 outline-none" />
          </div>
          {anyFilter && (
            <button onClick={resetFilters}
              className="h-9 flex items-center gap-1 px-3 text-xs font-semibold text-gray-600 border-2 border-gray-200 rounded-lg hover:bg-gray-50">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Candidate</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                {showSubmitter && <th className="px-4 py-3 font-semibold">Submitted by</th>}
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">{dateLabel}</th>
                {tab === 'active' && <th className="px-4 py-3 font-semibold whitespace-nowrap">Last updated</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">Loading…</td></tr>
              ) : !rows.length ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">No candidates match these filters.</td></tr>
              ) : rows.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{c.candidate || '—'}</p>
                    <p className="text-xs text-gray-400">{c.emails || c.mob || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{c.pos_name || '—'}</p>
                    {c.pos_id && <p className="text-xs text-gray-400">#{c.pos_id}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.client || '—'}</td>
                  {showSubmitter && (
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{c.recName || c.clientspocName || c.recEmail || '—'}</p>
                      <p className="text-xs text-gray-400">{c.recRole || (c.clientspocName ? 'ClientSPOC' : '')}</p>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${statusTone(c.statusa)}`}>
                      {c.statusa || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {fmtDate(tab === 'active' ? c.datePosted : c.datePosted)}
                  </td>
                  {tab === 'active' && (
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(c.updatedAt)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta.pages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-500">
              Page {meta.page} of {meta.pages} · {meta.total.toLocaleString('en-IN')} candidates
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border-2 border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white">
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={meta.page >= meta.pages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border-2 border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AllCandidatesPanel = () => (
  <CandidateTable
    tab="all"
    title="All Candidates"
    subtitle="Every candidate in the system"
    dateLabel="Date landed"
    showSubmitter
  />
);

export const DirectCandidatesPanel = () => (
  <CandidateTable
    tab="direct"
    title="Direct Candidates"
    subtitle="Applied directly against a shared position"
    dateLabel="Date landed"
    showSubmitter
  />
);

export const ActiveCandidatesPanel = () => (
  <CandidateTable
    tab="active"
    title="Active Candidates"
    subtitle="In play — excludes Resume Bank, rejections, drops and duplicates"
    dateLabel="Date landed"
    showSubmitter
  />
);

export default AllCandidatesPanel;
