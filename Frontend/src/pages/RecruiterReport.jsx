import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, RefreshCw, Download, Search, X, ChevronDown, ChevronRight, Calendar, CheckCircle, XCircle, UserCircle, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import RecruiterDetail from './RecruiterDetail';

const REJECT_S_FE = new Set(['Rejected','Reject','rejected','reject','Not Selected','not selected',
  'No Show','no show','Duplicate','duplicate','Client Drop','Candidate Drop','Test Reject']);

const fmtDate = (ts) => {
  if (!ts) return '—';
  const sec = ts._seconds || ts.seconds || (typeof ts === 'number' ? ts : 0);
  if (!sec) return '—';
  return new Date(sec * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ProfileBar = ({ pct }) => {
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{pct}%</span>
    </div>
  );
};

const hrsLabel = (h) => `${(Math.round((h || 0) * 10) / 10)}h`;

// Session hours for Today / Week / Month — the selected period is highlighted.
const SessionCell = ({ session, period }) => {
  const s = session || { hoursToday: 0, hoursWeek: 0, hoursMonth: 0 };
  const items = [
    { k: 'today', label: 'Today', val: s.hoursToday || 0 },
    { k: 'week',  label: 'Week',  val: s.hoursWeek  || 0 },
    { k: 'month', label: 'Month', val: s.hoursMonth || 0 },
  ];
  return (
    <div className="flex flex-col gap-0.5 items-center min-w-24">
      {items.map(it => {
        const active = it.k === period;
        return (
          <div key={it.k}
            className={`flex items-center justify-between gap-2 w-full px-2 py-0.5 rounded ${active ? 'bg-blue-50' : ''}`}>
            <span className={`text-[10px] uppercase tracking-wide ${active ? 'text-blue-600 font-bold' : 'text-gray-400 font-semibold'}`}>{it.label}</span>
            <span className={`text-xs tabular-nums ${active ? 'text-blue-700 font-extrabold' : 'text-gray-600 font-semibold'}`}>{hrsLabel(it.val)}</span>
          </div>
        );
      })}
    </div>
  );
};

const RecruiterReport = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [expandedPos, setExpandedPos] = useState({}); // recruiterId::posIdx
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState([]); // multi-select array
  const [clientFilter, setClientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [profileFilter, setProfileFilter] = useState(''); // '' | 'above80' | 'below80'
  const [agreementFilter, setAgreementFilter] = useState(''); // '' | 'signed' | 'unsigned'
  const [sessionPeriod, setSessionPeriod] = useState('today'); // 'today' | 'week' | 'month'
  const [detailId, setDetailId] = useState(null); // recruiter id for the detailed dashboard

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/admin/reports/recruiters', { withCredentials: true });
      setRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
    } catch (e) {
      console.error('RecruiterReport fetch error:', e?.response?.data || e.message);
      setError(e?.response?.data?.message || 'Failed to load data');
      setRows([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Split comma-joined skillCategory strings into individual unique categories
  const categories = useMemo(() => {
    const all = rows.flatMap(r => (r.skillCategory || '').split(',').map(s => s.trim()).filter(Boolean));
    return [...new Set(all)].sort();
  }, [rows]);
  const clients    = useMemo(() => [...new Set(rows.flatMap(r => r.positions.map(p => p.client)).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => {
      if (catFilter.length > 0) {
        const rowCats = (r.skillCategory || '').split(',').map(s => s.trim());
        if (!catFilter.some(f => rowCats.includes(f))) return false;
      }
      if (q && !(r.name || '').toLowerCase().includes(q) && !(r.email || '').toLowerCase().includes(q)) return false;
      if (profileFilter === 'above80' && (r.profileCompletion || 0) < 80) return false;
      if (profileFilter === 'below80' && (r.profileCompletion || 0) >= 80) return false;
      if (agreementFilter === 'signed'   && !r.agreementSigned) return false;
      if (agreementFilter === 'unsigned' &&  r.agreementSigned) return false;
      if (clientFilter || dateFrom || dateTo) {
        const hasMatch = r.positions.some(p => {
          if (clientFilter && p.client !== clientFilter) return false;
          if (dateFrom && p.lastSubmission && new Date(p.lastSubmission * 1000) < new Date(dateFrom)) return false;
          if (dateTo   && p.lastSubmission && new Date(p.lastSubmission * 1000) > new Date(dateTo))   return false;
          return true;
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [rows, search, catFilter, clientFilter, dateFrom, dateTo, profileFilter, agreementFilter]);

  const periodKey = sessionPeriod === 'today' ? 'hoursToday' : sessionPeriod === 'week' ? 'hoursWeek' : 'hoursMonth';

  // Sort by the selected session period (most active first); active-now bubbles up.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a.session?.activeNow ? 100000 : 0) + (a.session?.[periodKey] || 0);
      const bv = (b.session?.activeNow ? 100000 : 0) + (b.session?.[periodKey] || 0);
      return bv - av;
    });
  }, [filtered, periodKey]);

  const toggle    = (id)  => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const togglePos = (key) => setExpandedPos(p => ({ ...p, [key]: !p[key] }));
  const clearFilters = () => { setSearch(''); setCatFilter([]); setClientFilter(''); setDateFrom(''); setDateTo(''); setProfileFilter(''); setAgreementFilter(''); };
  const isFiltered = search || catFilter.length > 0 || clientFilter || dateFrom || dateTo || profileFilter || agreementFilter;

  const downloadExcel = () => {
    const out = [];
    filtered.forEach(r => {
      const base = { Recruiter: r.name, Email: r.email, 'Skill Category': r.skillCategory, 'Profile %': r.profileCompletion || 0, 'Agreement Signed': r.agreementSigned ? 'Yes' : 'No',
        'Active Now': r.session?.activeNow ? 'Yes' : 'No',
        'Hours Today': r.session?.hoursToday || 0, 'Hours This Week': r.session?.hoursWeek || 0, 'Hours This Month': r.session?.hoursMonth || 0,
        'Active Slots': (r.session?.slots || []).join(' , ') };
      if (r.positions.length === 0) {
        out.push({ ...base, Position: '—', Client: '—', 'Total Candidates': 0, 'Active Candidates': 0, 'Last Submission': '—' });
      } else {
        r.positions.forEach(p => {
          out.push({ ...base, Position: p.positionTitle, Client: p.client, 'Total Candidates': p.totalCandidates, 'Active Candidates': p.activeCandidates, 'Last Submission': fmtDate(p.lastSubmission ? { _seconds: p.lastSubmission } : null) });
        });
      }
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recruiter Report');
    XLSX.writeFile(wb, `recruiter-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (detailId) {
    return (
      <RecruiterDetail
        recruiterId={detailId}
        allRows={sorted}
        onBack={() => setDetailId(null)}
        onSelect={(id) => setDetailId(id)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Recruiter Report</h2>
              <p className="text-blue-200 text-sm">{filtered.length} recruiters · {filtered.reduce((s, r) => s + r.positions.length, 0)} positions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"><RefreshCw size={15} /> Refresh</button>
            <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all"><Download size={15} /> Excel</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recruiter…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        <MultiSelectDropdown
          options={categories}
          selected={catFilter}
          onChange={setCatFilter}
          placeholder="All Skill Categories"
          accentColor="bg-blue-600"
        />
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={profileFilter} onChange={e => setProfileFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
          <option value="">All Profile %</option>
          <option value="above80">Profile ≥ 80%</option>
          <option value="below80">Profile &lt; 80%</option>
        </select>
        <select value={agreementFilter} onChange={e => setAgreementFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
          <option value="">All Agreement</option>
          <option value="signed">Signed</option>
          <option value="unsigned">Not Signed</option>
        </select>
        {/* Session period toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <span className="text-xs font-semibold text-gray-500 px-1.5">Session:</span>
          {[
            { k: 'today', label: 'Today' },
            { k: 'week',  label: 'This Week' },
            { k: 'month', label: 'This Month' },
          ].map(o => (
            <button key={o.k} onClick={() => setSessionPeriod(o.k)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${sessionPeriod === o.k ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400" />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400" />
        </div>
        {isFiltered && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline">Clear</button>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm font-semibold">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-900 text-white text-left">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Recruiter</th>
                  <th className="px-4 py-3">Skill Category</th>
                  <th className="px-4 py-3 text-center">Positions</th>
                  <th className="px-4 py-3 text-center">Total Cand.</th>
                  <th className="px-4 py-3 text-center">Active Cand.</th>
                  <th className="px-4 py-3 text-center">Session</th>
                  <th className="px-4 py-3">Profile %</th>
                  <th className="px-4 py-3 text-center">Agreement</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">No data found</td></tr>
                ) : sorted.map((r, i) => (
                  <React.Fragment key={r.id}>
                    <tr className="border-t border-gray-100 hover:bg-blue-50/30 cursor-pointer" onClick={() => toggle(r.id)}>
                      <td className="px-3 py-3">{expanded[r.id] ? <ChevronDown size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-gray-400" />}</td>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">{r.name || '—'}</p>
                          {r.session?.activeNow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active now
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{r.email}</p>
                        {r.session?.slots?.length > 0 && (
                          <p className="text-[11px] text-indigo-500 font-medium mt-0.5">
                            Active in {r.session.slots.join(', ')}
                          </p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetailId(r.id); }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all whitespace-nowrap">
                          <BarChart3 size={14} /> View Detailed
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {r.skillCategory ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{r.skillCategory}</span> : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700">{r.positions.length}</td>
                      <td className="px-4 py-3 text-center font-bold text-orange-600">{r.positions.reduce((s, p) => s + p.totalCandidates, 0)}</td>
                      <td className="px-4 py-3 text-center font-bold text-green-600">{r.positions.reduce((s, p) => s + p.activeCandidates, 0)}</td>
                      <td className="px-4 py-3"><SessionCell session={r.session} period={sessionPeriod} /></td>
                      <td className="px-4 py-3"><ProfileBar pct={r.profileCompletion || 0} /></td>
                      <td className="px-4 py-3 text-center">
                        {r.agreementSigned
                          ? <CheckCircle size={16} className="text-green-500 mx-auto" />
                          : <XCircle size={16} className="text-red-400 mx-auto" />}
                      </td>
                    </tr>
                    {expanded[r.id] && (
                      <tr className="bg-blue-50/40 border-t border-blue-100">
                        <td colSpan={10} className="px-6 py-4">
                          {r.positions.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No positions assigned yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {r.positions.filter(p => (!clientFilter || p.client === clientFilter)).map((p, pi) => {
                                const posKey = `${r.id}::${pi}`;
                                const isPosExpanded = expandedPos[posKey];
                                const isActive = (p.positionStatus || 'Active').toLowerCase().includes('active');
                                const isPaused = (p.positionStatus || '').toLowerCase().includes('pause');
                                return (
                                  <div key={pi} className="border border-blue-200 rounded-xl overflow-hidden">
                                    {/* Position row */}
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 cursor-pointer transition-colors"
                                      onClick={() => togglePos(posKey)}>
                                      <span className="text-blue-600">{isPosExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-semibold text-blue-900 text-xs">{p.positionTitle || '—'}</span>
                                        <span className="text-blue-600 text-xs ml-2">· {p.client || '—'}</span>
                                      </div>
                                      {/* Position status badge */}
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                        isActive ? 'bg-green-100 text-green-700 border-green-200'
                                        : isPaused ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                      }`}>
                                        {p.positionStatus || 'Active'}
                                      </span>
                                      <span className="text-xs text-orange-600 font-bold">{p.totalCandidates} cand.</span>
                                      <span className="text-xs text-green-600 font-bold">{p.activeCandidates} active</span>
                                      <span className="text-xs text-gray-400">Last: {fmtDate(p.lastSubmission ? { _seconds: p.lastSubmission } : null)}</span>
                                    </div>

                                    {/* Candidates nested table */}
                                    {isPosExpanded && (
                                      <div className="px-4 py-3 bg-white">
                                        {(!p.candidates || p.candidates.length === 0) ? (
                                          <p className="text-xs text-gray-400 italic flex items-center gap-1"><UserCircle size={12} /> No candidates submitted yet.</p>
                                        ) : (
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                                <th className="px-3 py-2 text-left font-semibold">#</th>
                                                <th className="px-3 py-2 text-left font-semibold">Candidate</th>
                                                <th className="px-3 py-2 text-left font-semibold">Email</th>
                                                <th className="px-3 py-2 text-left font-semibold">Date Submitted</th>
                                                <th className="px-3 py-2 text-left font-semibold">Date Updated</th>
                                                <th className="px-3 py-2 text-left font-semibold">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {p.candidates.map((c, ci) => (
                                                <tr key={ci} className="hover:bg-blue-50">
                                                  <td className="px-3 py-2 text-gray-400">{ci + 1}</td>
                                                  <td className="px-3 py-2 font-medium text-gray-800">{c.candidateName || '—'}</td>
                                                  <td className="px-3 py-2 text-gray-500 truncate max-w-32">{c.email || '—'}</td>
                                                  <td className="px-3 py-2 text-gray-500">{fmtDate(c.datePosted)}</td>
                                                  <td className="px-3 py-2 text-gray-500">{fmtDate(c.updatedAt)}</td>
                                                  <td className="px-3 py-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                      REJECT_S_FE.has(c.status) ? 'bg-red-100 text-red-700'
                                                      : c.status?.toLowerCase() === 'hired' ? 'bg-green-100 text-green-700'
                                                      : c.status?.toLowerCase() === 'shortlisted' ? 'bg-blue-100 text-blue-700'
                                                      : 'bg-yellow-100 text-yellow-700'
                                                    }`}>{c.status || 'Pending'}</span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
        </div>
      )}
    </div>
  );
};

export default RecruiterReport;
