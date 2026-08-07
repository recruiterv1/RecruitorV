import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BarChart3, RefreshCw, Download, Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

const fmt = (d) => {
  if (!d || d === 'unknown') return 'Unknown';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

const StatCell = ({ val, color }) => (
  <span className={`inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
    {val || 0}
  </span>
);

const AdminRegistrationReport = () => {
  const [rows, setRows]     = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all | recruiters | coaches | experts

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/reports/registrations', { withCredentials: true });
      setRows(res.data?.rows || []);
      setTotals(res.data?.totals || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => !search || (r.date || '').includes(search) || fmt(r.date).toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  const roles = roleFilter === 'all' ? ['recruiters', 'coaches', 'experts'] : [roleFilter];

  const downloadExcel = () => {
    const out = [];
    filtered.forEach(r => {
      const row = { Date: fmt(r.date) };
      ['recruiters', 'coaches', 'experts'].forEach(role => {
        const d = r[role] || {};
        row[`${role} Total`]    = d.total    || 0;
        row[`${role} Approved`] = d.approved || 0;
        row[`${role} Pending`]  = d.pending  || 0;
        row[`${role} Waitlist`] = d.waitlist || 0;
        row[`${role} Signed`]   = d.signed   || 0;
        row[`${role} Unsigned`] = d.unsigned || 0;
      });
      out.push(row);
    });
    // Totals row
    const tot = { Date: 'TOTAL' };
    ['recruiters', 'coaches', 'experts'].forEach(role => {
      const d = totals[role] || {};
      tot[`${role} Total`]          = d.total         || 0;
      tot[`${role} Approved`]       = d.approved      || 0;
      tot[`${role} Pending`]        = d.pending       || 0;
      tot[`${role} Waitlist`]       = d.waitlist      || 0;
      tot[`${role} Signed`]   = d.signed   || 0;
      tot[`${role} Unsigned`] = d.unsigned || 0;
    });
    out.push(tot);
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registration Report');
    XLSX.writeFile(wb, `registration-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const grandTotal = (key) => ['recruiters', 'coaches', 'experts'].reduce((s, r) => s + ((totals[r] || {})[key] || 0), 0);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><BarChart3 size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Admin Registration Report</h2>
              <p className="text-slate-300 text-sm">Date-wise registrations by role and status</p>
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
          { label: 'Total Registered', val: grandTotal('total'), bg: 'bg-slate-100 text-slate-700 border-slate-200' },
          { label: 'Approved', val: grandTotal('approved'), bg: 'bg-green-100 text-green-700 border-green-200' },
          { label: 'Pending', val: grandTotal('pending'), bg: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          { label: 'Waitlist', val: grandTotal('waitlist'), bg: 'bg-orange-100 text-orange-700 border-orange-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 border ${c.bg} shadow-sm`}>
            <p className="text-xs font-semibold mb-1 opacity-70">{c.label}</p>
            <p className="text-2xl font-bold">{c.val}</p>
          </div>
        ))}
      </div>

      {/* Role Totals */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { role: 'recruiters', label: 'Recruiters', color: 'from-blue-600 to-blue-800' },
          { role: 'coaches',    label: 'Coaches',    color: 'from-purple-600 to-purple-800' },
          { role: 'experts',    label: 'Experts',    color: 'from-amber-500 to-orange-600' },
        ].map(({ role, label, color }) => {
          const d = totals[role] || {};
          return (
            <div key={role} className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white`}>
              <p className="text-sm font-bold mb-2">{label}</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="opacity-70">Total</span>    <span className="font-bold">{d.total    || 0}</span>
                <span className="opacity-70">Approved</span> <span className="font-bold text-green-200">{d.approved || 0}</span>
                <span className="opacity-70">Pending</span>  <span className="font-bold text-yellow-200">{d.pending  || 0}</span>
                <span className="opacity-70">Waitlist</span> <span className="font-bold text-orange-200">{d.waitlist || 0}</span>
                <span className="opacity-70">Signed</span>   <span className="font-bold text-cyan-200">{d.signed   || 0}</span>
                <span className="opacity-70">Unsigned</span> <span className="font-bold text-red-200">{d.unsigned || 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by date…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-2">
          {['all', 'recruiters', 'coaches', 'experts'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${roleFilter === r ? 'bg-slate-700 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-slate-400'}`}>
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-900 text-white text-left">
                  <th className="px-4 py-3">Date</th>
                  {roles.includes('recruiters') && <>
                    <th className="px-3 py-3 text-center bg-blue-900/40" colSpan={6}>Recruiters</th>
                  </>}
                  {roles.includes('coaches') && <>
                    <th className="px-3 py-3 text-center bg-purple-900/40" colSpan={6}>Coaches</th>
                  </>}
                  {roles.includes('experts') && <>
                    <th className="px-3 py-3 text-center bg-amber-900/40" colSpan={6}>Experts</th>
                  </>}
                </tr>
                <tr className="bg-slate-800 text-slate-200 text-xs">
                  <th className="px-4 py-2"></th>
                  {roles.flatMap(() => ['Total', 'Approved', 'Pending', 'Waitlist', 'Signed', 'Unsigned']).map((h, i) => (
                    <th key={i} className="px-3 py-2 text-center font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={1 + roles.length * 6} className="px-4 py-12 text-center text-gray-400">No data found</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-slate-50`}>
                    <td className="px-4 py-2.5 font-semibold text-gray-700">{fmt(r.date)}</td>
                    {roles.flatMap(role => {
                      const d = r[role] || {};
                      return [
                        <td key={`${i}-${role}-t`} className="px-3 py-2.5 text-center"><StatCell val={d.total}    color="bg-slate-100 text-slate-700" /></td>,
                        <td key={`${i}-${role}-a`} className="px-3 py-2.5 text-center"><StatCell val={d.approved} color="bg-green-100 text-green-700" /></td>,
                        <td key={`${i}-${role}-p`} className="px-3 py-2.5 text-center"><StatCell val={d.pending}  color="bg-yellow-100 text-yellow-700" /></td>,
                        <td key={`${i}-${role}-w`} className="px-3 py-2.5 text-center"><StatCell val={d.waitlist} color="bg-orange-100 text-orange-700" /></td>,
                        <td key={`${i}-${role}-s`} className="px-3 py-2.5 text-center"><StatCell val={d.signed}   color="bg-cyan-100 text-cyan-700" /></td>,
                        <td key={`${i}-${role}-u`} className="px-3 py-2.5 text-center"><StatCell val={d.unsigned} color="bg-red-100 text-red-700" /></td>,
                      ];
                    })}
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <td className="px-4 py-2.5 text-slate-700">TOTAL</td>
                  {roles.flatMap(role => {
                    const d = totals[role] || {};
                    return [
                      <td key={`tot-${role}-t`} className="px-3 py-2.5 text-center"><StatCell val={d.total}    color="bg-slate-200 text-slate-800" /></td>,
                      <td key={`tot-${role}-a`} className="px-3 py-2.5 text-center"><StatCell val={d.approved} color="bg-green-200 text-green-800" /></td>,
                      <td key={`tot-${role}-p`} className="px-3 py-2.5 text-center"><StatCell val={d.pending}  color="bg-yellow-200 text-yellow-800" /></td>,
                      <td key={`tot-${role}-w`} className="px-3 py-2.5 text-center"><StatCell val={d.waitlist} color="bg-orange-200 text-orange-800" /></td>,
                      <td key={`tot-${role}-s`} className="px-3 py-2.5 text-center"><StatCell val={d.signed}   color="bg-cyan-200 text-cyan-800" /></td>,
                      <td key={`tot-${role}-u`} className="px-3 py-2.5 text-center"><StatCell val={d.unsigned} color="bg-red-200 text-red-800" /></td>,
                    ];
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationReport;
