import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Building2, RefreshCw, Download, Search, X, ChevronDown, ChevronRight, Calendar, Filter, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const fmtDate = (ts) => {
  if (!ts) return '—';
  try {
    if (ts._seconds) return new Date(ts._seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (ts.seconds)  return new Date(ts.seconds  * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (ts.toDate)   return ts.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const toMs = (ts) => {
  if (!ts) return null;
  if (ts._seconds) return ts._seconds * 1000;
  if (ts.seconds)  return ts.seconds  * 1000;
  if (ts.toDate)   return ts.toDate().getTime();
  const d = new Date(ts); return isNaN(d) ? null : d.getTime();
};

const ClientSpocReport = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Per-SPOC expanded filters (keyed by email)
  const [expandedClientFilter, setExpandedClientFilter] = useState({});
  const [expandedDateFrom, setExpandedDateFrom]         = useState({});
  const [expandedDateTo, setExpandedDateTo]             = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/reports/clientspocs', { withCredentials: true });
      setRows(res.data?.rows || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const categories = useMemo(() => [...new Set(rows.flatMap(r => r.positions.map(p => p.skill_category)).filter(Boolean))].sort(), [rows]);
  const clients    = useMemo(() => [...new Set(rows.flatMap(r => r.positions.map(p => p.client)).filter(Boolean))].sort(), [rows]);
  const statuses   = useMemo(() => [...new Set(rows.flatMap(r => r.positions.map(p => p.status)).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => {
      if (q && !(r.name || '').toLowerCase().includes(q) && !(r.email || '').toLowerCase().includes(q)) return false;
      if (catFilter && !r.positions.some(p => p.skill_category === catFilter)) return false;
      if (clientFilter && !r.positions.some(p => p.client === clientFilter)) return false;
      if (statusFilter && !r.positions.some(p => (p.status || '').toLowerCase() === statusFilter.toLowerCase())) return false;
      return true;
    });
  }, [rows, search, catFilter, clientFilter, statusFilter]);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const clearFilters = () => { setSearch(''); setCatFilter(''); setClientFilter(''); setStatusFilter(''); };
  const isFiltered = search || catFilter || clientFilter || statusFilter;

  const clearExpandedFilters = (email) => {
    setExpandedClientFilter(p => ({ ...p, [email]: '' }));
    setExpandedDateFrom(p => ({ ...p, [email]: '' }));
    setExpandedDateTo(p => ({ ...p, [email]: '' }));
  };

  // Filter positions within an expanded SPOC row
  const filterExpandedPositions = (positions, email) => {
    const cf = expandedClientFilter[email] || '';
    const df = expandedDateFrom[email] || '';
    const dt = expandedDateTo[email] || '';
    return positions.filter(p => {
      if (catFilter    && p.skill_category !== catFilter) return false;
      if (clientFilter && p.client !== clientFilter) return false;
      if (statusFilter && (p.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (cf && p.client !== cf) return false;
      if (df || dt) {
        // Use reactivatedAt if present (position was reactivated), else datePosted
        const ms = toMs(p.reactivatedAt || p.datePosted);
        if (ms === null) return false;
        if (df && ms < new Date(df).getTime()) return false;
        if (dt && ms > new Date(dt).getTime() + 86399999) return false;
      }
      return true;
    });
  };

  const downloadExcel = () => {
    const out = [];
    filtered.forEach(r => {
      (r.positions.length === 0 ? [null] : r.positions).forEach(p => {
        out.push({
          ClientSPOC: r.name, Email: r.email,
          'Skill Category': p?.skill_category || '—',
          Client: p?.client || '—',
          Position: p?.positionTitle || '—',
          'Recruiters Working': p?.recruiterCount || 0,
          'Coaches': p?.coachCount || 0,
          'Experts': p?.expertCount || 0,
          'Total Candidates': p?.totalCandidates || 0,
          'Active Candidates': p?.activeCandidates || 0,
          'Date Added': p?.reactivatedAt ? `${fmtDate(p.reactivatedAt)} (Reactivated)` : (p?.datePosted ? fmtDate(p.datePosted) : '—'),
          'Last Updated': p?.updatedAt ? fmtDate(p.updatedAt) : '—',
          Status: p?.status || '—',
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ClientSPOC Report');

    // Second sheet: date-wise bulk resume uploads per ClientSPOC + totals
    const bulkOut = [];
    filtered.forEach(r => {
      (r.bulkUploads || []).forEach(b => bulkOut.push({ ClientSPOC: r.name, Email: r.email, Date: b.label, 'Resumes Uploaded': b.count }));
      if ((r.bulkTotal || 0) > 0) bulkOut.push({ ClientSPOC: r.name, Email: r.email, Date: 'TOTAL', 'Resumes Uploaded': r.bulkTotal });
    });
    if (bulkOut.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bulkOut), 'Bulk Uploads');

    XLSX.writeFile(wb, `clientspoc-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Building2 size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Client SPOC Report</h2>
              <p className="text-teal-200 text-sm">{filtered.length} SPOCs · {filtered.reduce((s, r) => s + r.positions.length, 0)} positions</p>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SPOC…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Skill Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {isFiltered && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline">Clear</button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-teal-600 to-teal-800 text-white text-left">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Client SPOC</th>
                <th className="px-4 py-3 text-center">Total Positions</th>
                <th className="px-4 py-3 text-center">Active Positions</th>
                <th className="px-4 py-3 text-center">Paused Positions</th>
                <th className="px-4 py-3 text-center">Total Candidates</th>
                <th className="px-4 py-3 text-center">Active Candidates</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No data found</td></tr>
              ) : filtered.map((r, i) => (
                <React.Fragment key={r.email}>
                  <tr className="border-t border-gray-100 hover:bg-teal-50/30 cursor-pointer" onClick={() => toggle(r.email)}>
                    <td className="px-3 py-3">{expanded[r.email] ? <ChevronDown size={16} className="text-teal-600" /> : <ChevronRight size={16} className="text-gray-400" />}</td>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.name || '—'}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{r.positions.length}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{r.positions.filter(p => (p.status || '').toLowerCase().includes('active')).length}</td>
                    <td className="px-4 py-3 text-center font-bold text-yellow-600">{r.positions.filter(p => (p.status || '').toLowerCase().includes('pause')).length}</td>
                    <td className="px-4 py-3 text-center font-bold text-orange-600">{r.positions.reduce((s, p) => s + p.totalCandidates, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{r.positions.reduce((s, p) => s + p.activeCandidates, 0)}</td>
                  </tr>
                  {expanded[r.email] && (
                    <tr className="bg-teal-50/40 border-t border-teal-100">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="space-y-6">
                        {r.positions.length === 0 ? <p className="text-xs text-gray-400 italic">No positions created yet.</p> : (() => {
                          const rowClients = [...new Set(r.positions.map(p => p.client).filter(Boolean))].sort();
                          const hasExpandedFilter = expandedClientFilter[r.email] || expandedDateFrom[r.email] || expandedDateTo[r.email];
                          const visiblePositions = filterExpandedPositions(r.positions, r.email);
                          return (
                            <div className="space-y-3">
                              {/* Expanded-row filters */}
                              <div className="flex flex-wrap items-center gap-2 bg-white border border-teal-200 rounded-xl px-3 py-2">
                                <Filter size={13} className="text-teal-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-teal-700 mr-1">Filter positions:</span>

                                {/* Client filter */}
                                <select value={expandedClientFilter[r.email] || ''} onChange={e => setExpandedClientFilter(p => ({ ...p, [r.email]: e.target.value }))}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-teal-400">
                                  <option value="">All Clients</option>
                                  {rowClients.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                {/* Date from */}
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar size={12} className="text-teal-400" /> From
                                  <input type="date" value={expandedDateFrom[r.email] || ''} onChange={e => setExpandedDateFrom(p => ({ ...p, [r.email]: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-teal-400" />
                                </div>

                                {/* Date to */}
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  To
                                  <input type="date" value={expandedDateTo[r.email] || ''} onChange={e => setExpandedDateTo(p => ({ ...p, [r.email]: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-teal-400" />
                                </div>

                                {hasExpandedFilter && (
                                  <button onClick={() => clearExpandedFilters(r.email)} className="text-xs text-red-500 hover:text-red-700 underline ml-1">Clear</button>
                                )}
                                <span className="ml-auto text-xs text-gray-400">{visiblePositions.length} of {r.positions.length}</span>
                              </div>

                              {/* Positions table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-teal-100 text-teal-800">
                                      <th className="px-3 py-2 text-left font-semibold">Position</th>
                                      <th className="px-3 py-2 text-left font-semibold">Client</th>
                                      <th className="px-3 py-2 text-left font-semibold">Skill Category</th>
                                      <th className="px-3 py-2 text-center font-semibold">Recruiters</th>
                                      <th className="px-3 py-2 text-center font-semibold">Coaches</th>
                                      <th className="px-3 py-2 text-center font-semibold">Experts</th>
                                      <th className="px-3 py-2 text-center font-semibold">Total Cand.</th>
                                      <th className="px-3 py-2 text-center font-semibold">Active Cand.</th>
                                      <th className="px-3 py-2 text-left font-semibold">Date Added</th>
                                      <th className="px-3 py-2 text-left font-semibold">Last Updated</th>
                                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-teal-100">
                                    {visiblePositions.length === 0 ? (
                                      <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400 italic">No positions match the filters</td></tr>
                                    ) : visiblePositions.map((p, pi) => (
                                      <tr key={pi} className="hover:bg-teal-50">
                                        <td className="px-3 py-2 font-medium text-gray-800">{p.positionTitle || '—'}</td>
                                        <td className="px-3 py-2 text-gray-600">{p.client || '—'}</td>
                                        <td className="px-3 py-2">
                                          {p.skill_category ? <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">{p.skill_category}</span> : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-blue-600">{p.recruiterCount}</td>
                                        <td className="px-3 py-2 text-center font-bold text-purple-600">{p.coachCount}</td>
                                        <td className="px-3 py-2 text-center font-bold text-amber-600">{p.expertCount}</td>
                                        <td className="px-3 py-2 text-center font-bold text-orange-600">{p.totalCandidates}</td>
                                        <td className="px-3 py-2 text-center font-bold text-green-600">{p.activeCandidates}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {p.reactivatedAt ? (
                                            <span className="flex flex-col gap-0.5">
                                              <span className="text-green-600 font-semibold">{fmtDate(p.reactivatedAt)}</span>
                                              <span className="text-gray-400 text-xs">Reactivated</span>
                                            </span>
                                          ) : (
                                            <span className="text-gray-500">{fmtDate(p.datePosted)}</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtDate(p.updatedAt)}</td>
                                        <td className="px-3 py-2">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            (p.status || '').toLowerCase().includes('active') ? 'bg-green-100 text-green-700'
                                            : (p.status || '').toLowerCase().includes('close') ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                          }`}>{p.status || '—'}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Date-wise bulk-uploaded resumes */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Upload size={14} className="text-teal-600" />
                            <h4 className="text-sm font-bold text-gray-800">Bulk Resume Uploads (date-wise)</h4>
                            <span className="ml-auto text-xs font-semibold bg-teal-600 text-white px-2.5 py-1 rounded-full">Total: {r.bulkTotal || 0}</span>
                          </div>
                          {(!r.bulkUploads || r.bulkUploads.length === 0) ? (
                            <p className="text-xs text-gray-400 italic">No bulk resumes uploaded.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-teal-100 text-teal-800">
                                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                                    <th className="px-3 py-2 text-center font-semibold">Resumes Uploaded</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-teal-100">
                                  {r.bulkUploads.map((b, bi) => (
                                    <tr key={bi} className="hover:bg-teal-50">
                                      <td className="px-3 py-2 text-gray-700">{b.label}</td>
                                      <td className="px-3 py-2 text-center font-bold text-teal-700">{b.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-teal-50 font-bold border-t-2 border-teal-200">
                                    <td className="px-3 py-2 text-right text-gray-800">Total uploaded</td>
                                    <td className="px-3 py-2 text-center text-teal-800">{r.bulkTotal || 0}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Standalone: date-wise bulk resume uploads per ClientSPOC ── */}
      {!loading && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-3 flex items-center gap-2">
            <Upload size={18} className="text-white" />
            <h3 className="text-white font-bold">Bulk Resume Uploads — date-wise (per ClientSPOC)</h3>
            <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              {filtered.reduce((s, r) => s + (r.bulkTotal || 0), 0)} total
            </span>
          </div>
          {filtered.every(r => (r.bulkTotal || 0) === 0) ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 italic">No bulk resumes have been uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-50 text-teal-800 text-left">
                    <th className="px-4 py-2.5 font-semibold">ClientSPOC</th>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Resumes Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.filter(r => (r.bulkTotal || 0) > 0).map(r => (
                    <React.Fragment key={r.email}>
                      {r.bulkUploads.map((b, bi) => (
                        <tr key={bi} className="hover:bg-teal-50/40">
                          {bi === 0 && (
                            <td rowSpan={r.bulkUploads.length + 1} className="px-4 py-2.5 align-top font-semibold text-gray-800 border-r border-gray-100 whitespace-nowrap">
                              {r.name}<div className="text-xs font-normal text-gray-400">{r.email}</div>
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{b.label}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-teal-700">{b.count}</td>
                        </tr>
                      ))}
                      <tr className="bg-teal-50 font-bold border-t border-teal-200">
                        <td className="px-4 py-2.5 text-right text-gray-800">Total uploaded</td>
                        <td className="px-4 py-2.5 text-center text-teal-800">{r.bulkTotal}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSpocReport;
