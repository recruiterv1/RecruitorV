import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Briefcase, RefreshCw, Download, Search, X, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt)) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  const cls = s.includes('active') || s === '' ? 'bg-green-100 text-green-700'
    : s.includes('clos') || s.includes('filled') ? 'bg-red-100 text-red-700'
    : 'bg-yellow-100 text-yellow-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status || 'Active'}</span>;
};

const PositionReport = () => {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [spocFilter, setSpocFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/reports/positions', { withCredentials: true });
      setRows(res.data?.rows || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const categories = useMemo(() => [...new Set(rows.map(r => r.skill_category).filter(Boolean))].sort(), [rows]);
  const clients    = useMemo(() => [...new Set(rows.map(r => r.client).filter(Boolean))].sort(), [rows]);
  const spocs      = useMemo(() => [...new Set(rows.map(r => r.clientspoc).filter(Boolean))].sort(), [rows]);
  const statuses   = useMemo(() => [...new Set(rows.map(r => r.status).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => {
      if (catFilter    && r.skill_category !== catFilter)    return false;
      if (clientFilter && r.client !== clientFilter)         return false;
      if (spocFilter   && r.clientspoc !== spocFilter)       return false;
      if (statusFilter && (r.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (q && !(r.positionTitle || '').toLowerCase().includes(q) && !(r.client || '').toLowerCase().includes(q)) return false;
      if (dateFrom && r.datePosted && new Date(r.datePosted) < new Date(dateFrom)) return false;
      if (dateTo   && r.datePosted && new Date(r.datePosted) > new Date(dateTo))   return false;
      return true;
    });
  }, [rows, search, catFilter, clientFilter, spocFilter, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => { setSearch(''); setCatFilter(''); setClientFilter(''); setSpocFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); };
  const isFiltered = search || catFilter || clientFilter || spocFilter || statusFilter || dateFrom || dateTo;

  const downloadExcel = () => {
    const out = filtered.map(r => ({
      Position:          r.positionTitle || '—',
      Client:            r.client        || '—',
      'Skill Category':  r.skill_category || '—',
      'Client SPOC':     r.clientspoc    || '—',
      'Recruiter Count': r.recruiterCount,
      'Coach Count':     r.coachCount,
      'Expert Count':    r.expertCount,
      'Total Candidates': r.totalCandidates,
      Status:            r.status || 'Active',
      'Date Created':    fmtDate(r.datePosted),
      'Last Submission': fmtDate(r.lastSubmission),
      'Last Updated':    fmtDate(r.updatedAt),
    }));
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Position Report');
    XLSX.writeFile(wb, `position-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-700 to-cyan-900 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Briefcase size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Position Report</h2>
              <p className="text-cyan-200 text-sm">{filtered.length} of {rows.length} positions · {filtered.reduce((s, r) => s + r.totalCandidates, 0)} candidates</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"><RefreshCw size={15} /> Refresh</button>
            <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"><Download size={15} /> Excel</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Positions',   val: filtered.length,                                             color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
          { label: 'Total Candidates',  val: filtered.reduce((s, r) => s + r.totalCandidates, 0),         color: 'bg-orange-100 text-orange-700 border-orange-200' },
          { label: 'Avg. Recruiters/Position', val: filtered.length ? Math.round(filtered.reduce((s, r) => s + r.recruiterCount, 0) / filtered.length * 10) / 10 : 0, color: 'bg-blue-100 text-blue-700 border-blue-200' },
          { label: 'Active Positions',  val: filtered.filter(r => !(r.status || '').toLowerCase().includes('clos') && !(r.status || '').toLowerCase().includes('hold') && !(r.status || '').toLowerCase().includes('paused')).length, color: 'bg-green-100 text-green-700 border-green-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 border ${c.color} shadow-sm`}>
            <p className="text-xs font-semibold mb-1 opacity-70">{c.label}</p>
            <p className="text-2xl font-bold">{c.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search position or client…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400">
          <option value="">All Skill Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={spocFilter} onChange={e => setSpocFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All ClientSPOCs</option>
          {spocs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400" />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400" />
        </div>
        {isFiltered && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline">Clear</button>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-700 to-cyan-900 text-white text-left">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Skill Category</th>
                  <th className="px-4 py-3">Client SPOC</th>
                  <th className="px-3 py-3 text-center">Rec.</th>
                  <th className="px-3 py-3 text-center">Coach</th>
                  <th className="px-3 py-3 text-center">Expert</th>
                  <th className="px-3 py-3 text-center">Candidates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date Created</th>
                  <th className="px-4 py-3">Last Submission</th>
                  <th className="px-4 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={13} className="px-4 py-12 text-center text-gray-400">No positions found</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.positionId} className={`border-t border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-cyan-50/30 transition-colors`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.positionTitle || '—'}</p>
                      <p className="text-xs text-gray-400">{r.positionId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.client || '—'}</td>
                    <td className="px-4 py-3">
                      {r.skill_category
                        ? <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">{r.skill_category}</span>
                        : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.clientspoc || '—'}</td>
                    <td className="px-3 py-3 text-center"><span className="font-bold text-blue-600">{r.recruiterCount}</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-bold text-purple-600">{r.coachCount}</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-bold text-amber-600">{r.expertCount}</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-bold text-orange-600">{r.totalCandidates}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(r.datePosted)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(r.lastSubmission)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filtered.length} of {rows.length} positions
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionReport;
