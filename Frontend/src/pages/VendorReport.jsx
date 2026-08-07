import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Store, RefreshCw, Download, Search, X, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const fmtDate = (ts) => {
  if (!ts) return '—';
  const sec = ts._seconds || ts.seconds || (typeof ts === 'number' ? ts : 0);
  if (!sec) return '—';
  return new Date(sec * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const VendorReport = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]   = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/reports/vendors', { withCredentials: true });
      setRows(res.data?.rows || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const clients = useMemo(() => [...new Set(rows.flatMap(r => r.positions.map(p => p.client)).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => {
      if (q && !(r.name || '').toLowerCase().includes(q) && !(r.email || '').toLowerCase().includes(q)) return false;
      if (clientFilter && !r.positions.some(p => p.client === clientFilter)) return false;
      if (dateFrom || dateTo) {
        const hasMatch = r.positions.some(p => {
          if (!p.lastSubmission) return false;
          const d = new Date(p.lastSubmission * 1000);
          if (dateFrom && d < new Date(dateFrom)) return false;
          if (dateTo   && d > new Date(dateTo))   return false;
          return true;
        });
        if (!hasMatch && r.positions.length > 0) return false;
      }
      return true;
    });
  }, [rows, search, clientFilter, dateFrom, dateTo]);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const clearFilters = () => { setSearch(''); setClientFilter(''); setDateFrom(''); setDateTo(''); };
  const isFiltered = search || clientFilter || dateFrom || dateTo;

  const downloadExcel = () => {
    const out = [];
    filtered.forEach(r => {
      (r.positions.length === 0 ? [null] : r.positions).forEach(p => {
        out.push({
          Vendor: r.name, Email: r.email,
          'Total Recruiters': r.totalRecruiters,
          Position: p?.positionTitle || '—', Client: p?.client || '—',
          'Recruiter Count': p?.recruiterCount || 0,
          'Coach Count': p?.coachCount || 0,
          'Expert Count': p?.expertCount || 0,
          'Total Candidates': p?.totalCandidates || 0,
          'Active Candidates': p?.activeCandidates || 0,
          'Last Submission': fmtDate(p?.lastSubmission ? { _seconds: p.lastSubmission } : null),
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Report');
    XLSX.writeFile(wb, `vendor-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Store size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Vendor Report</h2>
              <p className="text-indigo-200 text-sm">{filtered.length} vendors · {filtered.reduce((s, r) => s + r.positions.length, 0)} positions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"><RefreshCw size={15} /> Refresh</button>
            <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"><Download size={15} /> Excel</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5" />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-gray-200 rounded-lg px-2 py-1.5" />
        </div>
        {isFiltered && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline">Clear</button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white text-left">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3 text-center">Recruiters</th>
                <th className="px-4 py-3 text-center">Positions</th>
                <th className="px-4 py-3 text-center">Total Candidates</th>
                <th className="px-4 py-3 text-center">Active Candidates</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No data found</td></tr>
              ) : filtered.map((r, i) => (
                <React.Fragment key={r.id}>
                  <tr className="border-t border-gray-100 hover:bg-indigo-50/30 cursor-pointer" onClick={() => toggle(r.id)}>
                    <td className="px-3 py-3">{expanded[r.id] ? <ChevronDown size={16} className="text-indigo-600" /> : <ChevronRight size={16} className="text-gray-400" />}</td>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.name || '—'}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="font-bold text-indigo-600">{r.totalRecruiters}</span></td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{r.positions.length}</td>
                    <td className="px-4 py-3 text-center font-bold text-orange-600">{r.positions.reduce((s, p) => s + p.totalCandidates, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{r.positions.reduce((s, p) => s + p.activeCandidates, 0)}</td>
                  </tr>
                  {expanded[r.id] && (
                    <tr className="bg-indigo-50/40 border-t border-indigo-100">
                      <td colSpan={7} className="px-6 py-4">
                        {r.positions.length === 0 ? <p className="text-xs text-gray-400 italic">No positions yet.</p> : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-indigo-100 text-indigo-800">
                                  <th className="px-3 py-2 text-left font-semibold">Position</th>
                                  <th className="px-3 py-2 text-left font-semibold">Client</th>
                                  <th className="px-3 py-2 text-center font-semibold">Recruiters</th>
                                  <th className="px-3 py-2 text-center font-semibold">Coaches</th>
                                  <th className="px-3 py-2 text-center font-semibold">Experts</th>
                                  <th className="px-3 py-2 text-center font-semibold">Total Cand.</th>
                                  <th className="px-3 py-2 text-center font-semibold">Active Cand.</th>
                                  <th className="px-3 py-2 text-left font-semibold">Last Submission</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-100">
                                {r.positions
                                  .filter(p => (!clientFilter || p.client === clientFilter) && (!dateFrom || !p.lastSubmission || new Date(p.lastSubmission * 1000) >= new Date(dateFrom)) && (!dateTo || !p.lastSubmission || new Date(p.lastSubmission * 1000) <= new Date(dateTo)))
                                  .map((p, pi) => (
                                  <tr key={pi} className="hover:bg-indigo-50">
                                    <td className="px-3 py-2 font-medium text-gray-800">{p.positionTitle || '—'}</td>
                                    <td className="px-3 py-2 text-gray-600">{p.client || '—'}</td>
                                    <td className="px-3 py-2 text-center font-bold text-blue-600">{p.recruiterCount}</td>
                                    <td className="px-3 py-2 text-center font-bold text-purple-600">{p.coachCount}</td>
                                    <td className="px-3 py-2 text-center font-bold text-amber-600">{p.expertCount}</td>
                                    <td className="px-3 py-2 text-center font-bold text-orange-600">{p.totalCandidates}</td>
                                    <td className="px-3 py-2 text-center font-bold text-green-600">{p.activeCandidates}</td>
                                    <td className="px-3 py-2 text-gray-500">{fmtDate(p.lastSubmission ? { _seconds: p.lastSubmission } : null)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorReport;
