import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import {
  Users, Briefcase, BarChart3, Loader2, Search, ChevronDown, ChevronUp, Download, MapPin, Mail, Phone,
  UserCheck, ArrowUpDown
} from 'lucide-react';
import CvViewButton from '../components/CvViewButton';

const STATUS_OPTIONS = [
  'Screen Reject', 'CV Feedback Pending', 'Submitted',
  'L1 To be Schedule', 'L1 Scheduled', 'L1 Feedback Pending', 'L1 Reject',
  'L2 To be Schedule', 'L2 Scheduled', 'L2 Feedback Pending', 'L2 Reject',
  'L3 To be Schedule', 'L3 Scheduled', 'L3 Feedback Pending', 'L3 Reject',
  'HR To be Schedule', 'HR Scheduled', 'HR Feedback Pending', 'HR Reject',
  'Background Verification Pending', 'Background Verification Reject',
  'Negotiation Scheduled', 'Negotiation Reject',
  'To Be Offered', 'Offer Declined', 'Offer Accepted', 'Joining',
  'Test Assigned', 'Test Select', 'Test Reject',
  'Client Drop', 'Candidate Drop', 'Duplicate', 'Position On Hold',
];
const REJECT = new Set(['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject',
  'Background Verification Reject', 'Negotiation Reject', 'Test Reject',
  'Client Drop', 'Candidate Drop', 'Duplicate', 'Offer Declined', 'Position On Hold'].map(s => s.toLowerCase()));

const fmtDate = (d) => d?._seconds ? new Date(d._seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ManagerDashboard = () => (
  <SidebarProvider>
    <div className="min-h-screen bg-gray-50 relative">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40"><Sidebar /></aside>
      <Content />
    </div>
  </SidebarProvider>
);

const Content = () => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const [tab, setTab] = useState('clientspocs');
  const [spocs, setSpocs] = useState([]);
  const [loadingSpocs, setLoadingSpocs] = useState(true);
  const [search, setSearch] = useState('');
  const [selSpoc, setSelSpoc] = useState('');

  useEffect(() => {
    axios.get('/api/manager/clientspocs', { withCredentials: true })
      .then(r => setSpocs(r.data?.clientspocs || []))
      .catch(() => setSpocs([]))
      .finally(() => setLoadingSpocs(false));
  }, []);

  const gotoPositions = (email) => { setSelSpoc(email); setTab('positions'); };
  const filteredSpocs = spocs.filter(s => !search || [s.name, s.email, s.company].some(v => (v || '').toLowerCase().includes(search.toLowerCase())));

  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm"><Dash_Header /></header>

      <div className="px-4 sm:px-6 lg:px-8 py-5 border-b bg-white">
        <h1 className="text-xl font-bold text-gray-900">Manager Panel</h1>
        <p className="text-sm text-gray-500">All ClientSPOCs, their positions & candidates, and reports</p>
      </div>

      {/* Tabs (sub-menus) */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 flex-wrap">
          {[['clientspocs', 'All ClientSPOCs', Users], ['positions', 'Positions & Candidates', Briefcase], ['recruiters', 'Recruiters', UserCheck], ['spoc-activity', 'SPOC Activity', BarChart3], ['reports', 'Reports', BarChart3]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 ${tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <main className="min-h-screen p-4 sm:p-6 lg:p-8">
        {tab === 'clientspocs' && (
          <div>
            <div className="flex items-center gap-2 mb-4 max-w-sm">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full">
                <Search size={15} className="text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ClientSPOC…" className="bg-transparent text-sm outline-none w-full" />
              </div>
            </div>
            {loadingSpocs ? <Spin /> : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Company</th><th className="px-4 py-2">Positions</th><th className="px-4 py-2">Active</th><th className="px-4 py-2"></th></tr>
                  </thead>
                  <tbody>
                    {filteredSpocs.map(s => (
                      <tr key={s.email} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-semibold text-gray-800">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.email}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.company || '—'}</td>
                        <td className="px-4 py-2.5 text-center">{s.totalPositions}</td>
                        <td className="px-4 py-2.5 text-center text-green-600 font-semibold">{s.activePositions}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => gotoPositions(s.email)} className="text-xs font-semibold text-blue-600 hover:underline">View positions →</button>
                        </td>
                      </tr>
                    ))}
                    {!filteredSpocs.length && <tr><td colSpan={6} className="text-center text-gray-400 py-8">No ClientSPOCs found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'positions' && <PositionsTab spocs={spocs} selSpoc={selSpoc} setSelSpoc={setSelSpoc} />}
        {tab === 'recruiters' && <RecruitersTab />}
        {tab === 'spoc-activity' && <SpocActivityTab />}
        {tab === 'reports' && <ReportsTab spocs={spocs} selSpoc={selSpoc} setSelSpoc={setSelSpoc} />}
      </main>
      <Footer />
    </div>
  );
};

const Spin = () => <div className="py-16 text-center text-gray-400"><Loader2 size={20} className="animate-spin inline" /></div>;

const SpocSelect = ({ spocs, value, onChange }) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white min-w-[240px]">
    <option value="">Select a ClientSPOC…</option>
    {spocs.map(s => <option key={s.email} value={s.email}>{s.name} — {s.email}</option>)}
  </select>
);

const PositionsTab = ({ spocs, selSpoc, setSelSpoc }) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    if (!selSpoc) { setPositions([]); return; }
    setLoading(true);
    axios.get(`/api/manager/positions?clientspoc=${encodeURIComponent(selSpoc)}`, { withCredentials: true })
      .then(r => setPositions(r.data?.positions || []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, [selSpoc]);
  useEffect(() => { load(); }, [load]);

  const shown = positions.filter(p => statusFilter === 'all' || (statusFilter === 'active' ? p.active : !p.active));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SpocSelect spocs={spocs} value={selSpoc} onChange={setSelSpoc} />
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded ${statusFilter === f ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>
      {!selSpoc ? <p className="text-gray-400 text-sm py-10 text-center">Select a ClientSPOC to view positions.</p>
        : loading ? <Spin /> : (
          <div className="space-y-2">
            {shown.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(expanded === p.pos_id ? null : p.pos_id)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{p.position} <span className="text-xs text-gray-400">#{p.pos_id}</span></div>
                    <div className="text-xs text-gray-500">{p.client} · {p.location || '—'}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                    <span className="text-xs text-gray-600">{p.candidateCount} candidates</span>
                    {expanded === p.pos_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {expanded === p.pos_id && <CandidatesPanel posId={p.pos_id} />}
              </div>
            ))}
            {!shown.length && <p className="text-gray-400 text-sm py-10 text-center">No positions.</p>}
          </div>
        )}
    </div>
  );
};

const CandidatesPanel = ({ posId }) => {
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`/api/manager/position/${posId}/candidates`, { withCredentials: true })
      .then(r => setCands(r.data?.candidates || []))
      .catch(() => setCands([]))
      .finally(() => setLoading(false));
  }, [posId]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (c, statusa) => {
    if (statusa === c.statusa) return;
    let rejectReason = '';
    if (REJECT.has((statusa || '').toLowerCase())) {
      rejectReason = window.prompt(`Reason for "${statusa}" (required):`, c.rejectReason || '') || '';
      if (!rejectReason.trim()) { alert('A rejection reason is required.'); return; }
    }
    setSavingId(c.id);
    try {
      await axios.patch(`/addit/update/status/${c.id}`, { statusa, rejectReason }, { withCredentials: true });
      setCands(prev => prev.map(x => x.id === c.id ? { ...x, statusa, rejectReason } : x));
    } catch (e) { alert(e.response?.data?.error || e.response?.data?.message || 'Failed to update status.'); }
    finally { setSavingId(null); }
  };

  if (loading) return <div className="px-4 py-4 text-sm text-gray-400"><Loader2 size={15} className="animate-spin inline mr-1" /> Loading candidates…</div>;
  if (!cands.length) return <div className="px-4 py-4 text-sm text-gray-400">No candidates submitted.</div>;

  return (
    <div className="border-t border-gray-100 divide-y divide-gray-50">
      {cands.map(c => (
        <div key={c.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-gray-900">{c.candidate || '—'}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
              {c.emails && <span className="inline-flex items-center gap-1"><Mail size={11} />{c.emails}</span>}
              {c.mob && <span className="inline-flex items-center gap-1"><Phone size={11} />{c.mob}</span>}
              {c.curr_loc && <span className="inline-flex items-center gap-1"><MapPin size={11} />{c.curr_loc}</span>}
              {c.recName && <span>by {c.recName}</span>}
              <span>{fmtDate(c.datePosted)}</span>
            </div>
          </div>
          {c.cv_data ? <CvViewButton url={c.cv_data} label="CV" /> : <span className="text-xs text-gray-300">No CV</span>}
          <select value={STATUS_OPTIONS.includes(c.statusa) ? c.statusa : ''} disabled={savingId === c.id}
            onChange={e => changeStatus(c, e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white">
            {!STATUS_OPTIONS.includes(c.statusa) && <option value="">{c.statusa || 'Set status'}</option>}
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {savingId === c.id && <Loader2 size={14} className="animate-spin text-gray-500" />}
        </div>
      ))}
    </div>
  );
};


// ── SPOC Activity: date-wise candidate intake vs action, per ClientSPOC ───────
const SpocActivityTab = () => {
  const [rows, setRows] = useState(null);
  const [totals, setTotals] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [spocFilter, setSpocFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    axios.get(`/api/manager/spoc-activity?${q}`, { withCredentials: true })
      .then(r => { setRows(r.data?.rows || []); setTotals(r.data?.totals || null); })
      .catch(() => { setRows([]); setTotals(null); })
      .finally(() => setLoading(false));
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const spocNames = useMemo(
    () => [...new Set((rows || []).map(r => r.clientspocName))].sort(), [rows]);
  const view = useMemo(
    () => (rows || []).filter(r => !spocFilter || r.clientspocName === spocFilter), [rows, spocFilter]);

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(view.map(r => ({
      'Date': r.date,
      'ClientSPOC': r.clientspocName,
      'Email': r.clientspoc,
      'Direct Applicants Received': r.directReceived,
      'Direct Applicants Updated': r.directActioned,
      'Direct Pending': r.directReceived - r.directActioned,
      'From Recruiters Received': r.recruiterReceived,
      'From Recruiters Updated': r.recruiterActioned,
      'Recruiter Pending': r.recruiterReceived - r.recruiterActioned,
      'Auto Screen Rejected': r.autoScreenRejected,
      'Total Received': r.total,
    }))), 'SPOC Activity');
    XLSX.writeFile(wb, `SPOC_Activity_${from || 'all'}_${to || 'all'}.xlsx`);
  };

  const Cell = ({ got, done, showPct = true }) => (
    <td className="px-3 py-2 text-center whitespace-nowrap">
      <span className="font-semibold text-gray-900">{got}</span>
      <span className="text-gray-400"> / </span>
      <span className={done === got && got > 0 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{done}</span>
      {showPct && got > 0 && <span className="text-[11px] text-gray-400 ml-1">({pct(done, got)}%)</span>}
    </td>
  );

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">From
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">To
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">ClientSPOC
          <select value={spocFilter} onChange={e => setSpocFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
            <option value="">All ClientSPOCs</option>
            {spocNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {(from || to || spocFilter) && (
          <button onClick={() => { setFrom(''); setTo(''); setSpocFilter(''); }}
            className="text-xs font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">Clear</button>
        )}
        <button onClick={exportExcel} disabled={!view.length}
          className="ml-auto inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl px-4 py-2">
          <Download size={16} /> Export to Excel
        </button>
      </div>

      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {[
            ['Direct applicants', totals.directReceived, totals.directActioned],
            ['From recruiters', totals.recruiterReceived, totals.recruiterActioned],
            ['Auto screen rejected', totals.autoScreenRejected, null],
            ['Total received', totals.total, null],
            ['Overall actioned', totals.total, totals.directActioned + totals.recruiterActioned],
          ].map(([label, got, done]) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-2xl font-extrabold text-gray-900">
                {got}{done !== null && <span className="text-base text-gray-400"> / {done}</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}{done !== null && ' (received / updated)'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : !view.length ? (
          <div className="py-16 text-center text-gray-400 text-sm">No activity for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-left">
                  <th className="px-3 py-3 font-semibold text-gray-600">Date</th>
                  <th className="px-3 py-3 font-semibold text-gray-600">ClientSPOC</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 text-center">Direct<br/><span className="text-[10px] font-normal">received / updated</span></th>
                  <th className="px-3 py-3 font-semibold text-gray-600 text-center">From Recruiters<br/><span className="text-[10px] font-normal">received / updated</span></th>
                  <th className="px-3 py-3 font-semibold text-gray-600 text-center">Auto<br/><span className="text-[10px] font-normal">screen reject</span></th>
                  <th className="px-3 py-3 font-semibold text-gray-600 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {view.map(r => (
                  <tr key={r.clientspoc + r.date} className="border-t border-gray-100 hover:bg-blue-50/30">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{r.clientspocName}
                      <span className="block text-[11px] text-gray-400">{r.clientspoc}</span></td>
                    <Cell got={r.directReceived} done={r.directActioned} />
                    <Cell got={r.recruiterReceived} done={r.recruiterActioned} />
                    <td className="px-3 py-2 text-center">
                      {r.autoScreenRejected > 0
                        ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{r.autoScreenRejected}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-gray-900">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const ReportsTab = ({ spocs, selSpoc, setSelSpoc }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selSpoc) { setReport(null); return; }
    setLoading(true);
    axios.get(`/api/manager/report?clientspoc=${encodeURIComponent(selSpoc)}`, { withCredentials: true })
      .then(r => setReport(r.data?.report || null))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [selSpoc]);

  const download = () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.positions.map(p => ({
      'Pos ID': p.pos_id, Position: p.position, Client: p.client, Status: p.status, Active: p.active ? 'Yes' : 'No', Candidates: p.candidates,
    }))), 'Positions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.entries(report.byStatus).map(([Status, Count]) => ({ Status, Count }))), 'By Status');
    XLSX.writeFile(wb, `Report_${selSpoc}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SpocSelect spocs={spocs} value={selSpoc} onChange={setSelSpoc} />
        {report && <button onClick={download} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"><Download size={15} /> Download Excel</button>}
      </div>
      {!selSpoc ? <p className="text-gray-400 text-sm py-10 text-center">Select a ClientSPOC to generate a report.</p>
        : loading ? <Spin /> : !report ? <p className="text-gray-400 text-sm py-10 text-center">No data.</p> : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[['Positions', report.totalPositions], ['Active', report.activePositions], ['Inactive', report.inactivePositions], ['Candidates', report.totalCandidates], ['Statuses', Object.keys(report.byStatus).length]].map(([l, v]) => (
                <div key={l} className="bg-white border border-gray-200 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-gray-900">{v}</div><div className="text-xs text-gray-500">{l}</div></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-900 mb-2 text-sm">Candidates by status</div>
                {Object.entries(report.byStatus).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
                  <div key={s} className="flex justify-between text-sm py-1 border-b border-gray-50"><span className="text-gray-600">{s}</span><span className="font-semibold">{n}</span></div>
                ))}
                {!Object.keys(report.byStatus).length && <div className="text-gray-400 text-sm">No candidates.</div>}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-900 mb-2 text-sm">Positions</div>
                <div className="max-h-80 overflow-y-auto">
                  {report.positions.map(p => (
                    <div key={p.pos_id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50">
                      <span className="text-gray-700 truncate mr-2">{p.position}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                        <span className="font-semibold text-gray-800">{p.candidates}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

const fmtMs = (ms) => ms ? new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SortHead = ({ label, col, sort, setSort, className = '' }) => (
  <th className={`px-3 py-2 cursor-pointer select-none ${className}`} onClick={() => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))}>
    <span className="inline-flex items-center gap-1">{label}<ArrowUpDown size={11} className={sort.col === col ? 'text-blue-600' : 'text-gray-300'} /></span>
  </th>
);

const RecruitersTab = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ col: 'submitted', dir: 'desc' });
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams(); if (from) q.set('from', from); if (to) q.set('to', to);
    axios.get(`/api/manager/recruiters?${q.toString()}`, { withCredentials: true })
      .then(r => setRows(r.data?.recruiters || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.col], bv = b[sort.col];
    const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av - bv);
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const exportSummary = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map(r => ({
      Recruiter: r.recName, Email: r.recEmail, Positions: r.positionCount,
      Submitted: r.submitted, Rejected: r.rejected, Selected: r.selected,
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Recruiters');
    XLSX.writeFile(wb, `Recruiters_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4 bg-white border border-gray-200 rounded-xl p-3">
        <label className="text-xs text-gray-500">From<br /><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5" /></label>
        <label className="text-xs text-gray-500">To<br /><input type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5" /></label>
        {(from || to) && <button onClick={() => { setFrom(''); setTo(''); }} className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-2">Clear</button>}
        <button onClick={exportSummary} className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"><Download size={15} /> Export XLS</button>
      </div>

      {loading ? <Spin /> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <SortHead label="Recruiter" col="recName" sort={sort} setSort={setSort} className="text-left" />
                <SortHead label="Positions" col="positionCount" sort={sort} setSort={setSort} />
                <SortHead label="Submitted" col="submitted" sort={sort} setSort={setSort} />
                <SortHead label="Rejected" col="rejected" sort={sort} setSort={setSort} />
                <SortHead label="Selected" col="selected" sort={sort} setSort={setSort} />
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <React.Fragment key={r.recEmail}>
                  <tr className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5"><div className="font-semibold text-gray-800">{r.recName}</div><div className="text-[11px] text-gray-400">{r.recEmail}</div></td>
                    <td className="px-3 py-2.5 text-center">{r.positionCount}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-blue-700">{r.submitted}</td>
                    <td className="px-3 py-2.5 text-center text-red-600">{r.rejected}</td>
                    <td className="px-3 py-2.5 text-center text-green-600">{r.selected}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => setExpanded(expanded === r.recEmail ? null : r.recEmail)} className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                        Details {expanded === r.recEmail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === r.recEmail && (
                    <tr><td colSpan={6} className="bg-gray-50 px-3 py-3"><RecruiterCandidates recEmail={r.recEmail} from={from} to={to} /></td></tr>
                  )}
                </React.Fragment>
              ))}
              {!sorted.length && <tr><td colSpan={6} className="text-center text-gray-400 py-8">No recruiters found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const RecruiterCandidates = ({ recEmail, from, to }) => {
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ col: 'submittedMs', dir: 'desc' });

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ recEmail }); if (from) q.set('from', from); if (to) q.set('to', to);
    axios.get(`/api/manager/recruiter-candidates?${q.toString()}`, { withCredentials: true })
      .then(r => setCands(r.data?.candidates || []))
      .catch(() => setCands([]))
      .finally(() => setLoading(false));
  }, [recEmail, from, to]);

  const sorted = [...cands].sort((a, b) => {
    const av = a[sort.col], bv = b[sort.col];
    const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av - bv);
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const exportDetail = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map(c => ({
      Candidate: c.candidate, Position: c.pos_name, Client: c.client, Status: c.statusa,
      'Reject Reason': c.rejectReason, 'Submitted Date': fmtMs(c.submittedMs), 'Status Change Date': fmtMs(c.statusChangeMs),
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `Candidates_${recEmail}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="text-sm text-gray-400 py-2"><Loader2 size={14} className="animate-spin inline mr-1" /> Loading candidates…</div>;
  if (!cands.length) return <div className="text-sm text-gray-400 py-2">No candidates.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-gray-500">{cands.length} candidate(s)</span>
        <button onClick={exportDetail} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50"><Download size={13} /> Export</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <SortHead label="Candidate" col="candidate" sort={sort} setSort={setSort} className="text-left" />
              <SortHead label="Position" col="pos_name" sort={sort} setSort={setSort} className="text-left" />
              <SortHead label="Status" col="statusa" sort={sort} setSort={setSort} className="text-left" />
              <SortHead label="Submitted" col="submittedMs" sort={sort} setSort={setSort} />
              <SortHead label="Status changed" col="statusChangeMs" sort={sort} setSort={setSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-3 py-2"><div className="font-semibold text-gray-800">{c.candidate || '—'}</div><div className="text-[10px] text-gray-400">{c.emails}</div></td>
                <td className="px-3 py-2 text-gray-600">{c.pos_name || '—'}<div className="text-[10px] text-gray-400">{c.client}</div></td>
                <td className="px-3 py-2"><span className="font-semibold text-gray-700">{c.statusa || '—'}</span></td>
                <td className="px-3 py-2 text-center text-gray-600">{fmtMs(c.submittedMs)}</td>
                <td className="px-3 py-2 text-center text-gray-600">{fmtMs(c.statusChangeMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerDashboard;
