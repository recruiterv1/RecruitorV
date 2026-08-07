import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Users, Briefcase, Building2, Filter, Download,
  Search, X, ChevronUp, ChevronDown, RefreshCw, Calendar,
  CheckCircle, Clock, AlertCircle, TrendingUp, FileText, Info, Sparkles
} from "lucide-react";

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_COLORS = {
  submitted:   "bg-blue-100 text-blue-700",
  applied:     "bg-indigo-100 text-indigo-700",
  shortlisted: "bg-green-100 text-green-700",
  "l1 select": "bg-emerald-100 text-emerald-700",
  "l2 select": "bg-teal-100 text-teal-700",
  selected:    "bg-green-200 text-green-800",
  offered:     "bg-purple-100 text-purple-700",
  joined:      "bg-green-300 text-green-900 font-bold",
  "screen reject": "bg-red-100 text-red-700",
  "l1 reject":     "bg-red-100 text-red-700",
  "l2 reject":     "bg-red-100 text-red-700",
  rejected:        "bg-red-100 text-red-700",
  "client drop":   "bg-orange-100 text-orange-700",
  "candidate drop":"bg-orange-100 text-orange-700",
  duplicate:       "bg-gray-100 text-gray-600",
  hold:            "bg-yellow-100 text-yellow-700",
};
const statusClass = (s) => STATUS_COLORS[(s || "").toLowerCase()] || "bg-gray-100 text-gray-600";

// Colour for the AI match-score badge
const matchClass = (p) =>
  p == null ? "bg-gray-100 text-gray-500"
  : p >= 75 ? "bg-green-100 text-green-700"
  : p >= 50 ? "bg-yellow-100 text-yellow-700"
  : "bg-red-100 text-red-700";

/* AI Match% cell: score badge + (i) icon revealing the evaluation reason */
const MatchCell = ({ row }) => {
  const [open, setOpen] = useState(false);
  const hasScore = row.matchPercent != null;
  const reason = (row.matchReasoning || row.matchSummary || "").trim();

  if (!row.matchEvaluated && !hasScore) {
    return <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> Not evaluated</span>;
  }
  return (
    <div className="relative flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${matchClass(row.matchPercent)}`}>
        <Sparkles size={11} />{hasScore ? `${row.matchPercent}%` : "—"}
      </span>
      {reason && (
        <>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Why this score"
          >
            <Info size={15} />
          </button>
          {open && (
            <div className="absolute z-30 top-7 left-0 w-72 max-h-56 overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1.5">
                <Sparkles size={12} /> AI Match Reasoning
              </div>
              {row.matchSummary && <p className="text-xs font-semibold text-gray-800 mb-1">{row.matchSummary}</p>}
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{row.matchReasoning || row.matchSummary}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── export to CSV ────────────────────────────────────────── */
function exportCSV(rows) {
  const headers = [
    "Candidate Name", "Candidate Email", "Mobile",
    "Position ID", "Position Name", "Client",
    "Client SPOC", "Submitted By", "Submitted By Email",
    "Role Type", "Status", "AI Match %", "AI Match Reason", "Date Submitted", "Last Updated",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map(r => [
      r.candidate, r.emails, r.mob,
      r.pos_id, r.pos_name, r.client,
      r.clientspoc, r.recName, r.recEmail,
      r.recRole, r.statusa,
      r.matchPercent != null ? `${r.matchPercent}%` : (r.matchEvaluated ? "—" : "Not evaluated"),
      r.matchReasoning || r.matchSummary || "",
      r.datePosted ? new Date(r.datePosted).toLocaleDateString("en-IN") : "",
      r.updatedAt  ? new Date(r.updatedAt ).toLocaleDateString("en-IN") : "",
    ].map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `direct_applicants_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* ── summary card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${color} p-5 flex items-center gap-4 shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace("border-", "bg-").replace("-200", "-100")}`}>
        <Icon size={22} className={color.replace("border-", "text-").replace("-200", "-600")} />
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────── */
export default function DirectApplicants() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  /* filters */
  const [search,      setSearch]      = useState("");
  const [fPosition,   setFPosition]   = useState("");
  const [fClient,     setFClient]     = useState("");
  const [fSpoc,       setFSpoc]       = useState("");
  const [fRecruiter,  setFRecruiter]  = useState("");
  const [fStatus,     setFStatus]     = useState("");
  const [fRole,       setFRole]       = useState("");
  const [fDateFrom,   setFDateFrom]   = useState("");
  const [fDateTo,     setFDateTo]     = useState("");

  /* sort */
  const [sortKey, setSortKey] = useState("datePosted");
  const [sortDir, setSortDir] = useState("desc");

  /* pagination */
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const fetch = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get("/admin/direct-applicants", { withCredentials: true });
      if (res.data.success) setRows(res.data.applicants);
      else setError(res.data.message || "Failed to load");
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  /* unique filter options */
  const positions  = useMemo(() => [...new Set(rows.map(r => r.pos_name).filter(Boolean))].sort(), [rows]);
  const clients    = useMemo(() => [...new Set(rows.map(r => r.client).filter(Boolean))].sort(), [rows]);
  const spocs      = useMemo(() => [...new Set(rows.map(r => r.clientspoc).filter(Boolean))].sort(), [rows]);
  const recruiters = useMemo(() => [...new Set(rows.map(r => r.recName).filter(Boolean))].sort(), [rows]);
  const statuses   = useMemo(() => [...new Set(rows.map(r => r.statusa).filter(Boolean))].sort(), [rows]);

  /* filtered rows */
  const filtered = useMemo(() => {
    let out = rows;
    if (search)     { const q = search.toLowerCase(); out = out.filter(r => [r.candidate, r.emails, r.mob, r.pos_name, r.client, r.recName].some(v => (v||"").toLowerCase().includes(q))); }
    if (fPosition)  out = out.filter(r => r.pos_name  === fPosition);
    if (fClient)    out = out.filter(r => r.client    === fClient);
    if (fSpoc)      out = out.filter(r => r.clientspoc === fSpoc);
    if (fRecruiter) out = out.filter(r => r.recName   === fRecruiter);
    if (fStatus)    out = out.filter(r => r.statusa   === fStatus);
    if (fRole)      out = out.filter(r => (r.recRole || "").toLowerCase() === fRole.toLowerCase());
    if (fDateFrom)  out = out.filter(r => r.datePosted && new Date(r.datePosted) >= new Date(fDateFrom));
    if (fDateTo)    out = out.filter(r => r.datePosted && new Date(r.datePosted) <= new Date(fDateTo + "T23:59:59"));
    return out;
  }, [rows, search, fPosition, fClient, fSpoc, fRecruiter, fStatus, fRole, fDateFrom, fDateTo]);

  /* sorted rows */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va = a[sortKey]; let vb = b[sortKey];
      if (sortKey === "datePosted" || sortKey === "updatedAt") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else if (sortKey === "matchPercent") {
        va = va == null ? -1 : Number(va);
        vb = vb == null ? -1 : Number(vb);
      } else {
        va = (va || "").toString().toLowerCase();
        vb = (vb || "").toString().toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const paged   = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  const pages   = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setFPosition(""); setFClient(""); setFSpoc("");
    setFRecruiter(""); setFStatus(""); setFRole(""); setFDateFrom(""); setFDateTo("");
    setPage(1);
  };
  const hasFilters = search || fPosition || fClient || fSpoc || fRecruiter || fStatus || fRole || fDateFrom || fDateTo;

  /* summary stats */
  const totalByStatus = useMemo(() => {
    const m = {};
    rows.forEach(r => { const s = (r.statusa || "Submitted").toLowerCase(); m[s] = (m[s] || 0) + 1; });
    return m;
  }, [rows]);

  const SortIcon = ({ col }) => (
    sortKey === col
      ? (sortDir === "asc" ? <ChevronUp size={13} className="text-orange-400" /> : <ChevronDown size={13} className="text-orange-400" />)
      : <ChevronDown size={13} className="text-gray-300" />
  );

  const Th = ({ col, label, className = "" }) => (
    <th onClick={() => toggleSort(col)} className={`px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-800 transition-colors ${className}`}>
      <div className="flex items-center gap-1">{label}<SortIcon col={col} /></div>
    </th>
  );

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users size={26} className="text-blue-600" /> Direct Applicants
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">All candidates submitted via public share links</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-200 hover:border-blue-300 rounded-xl text-sm font-semibold text-gray-600 transition-all">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => exportCSV(sorted)} disabled={sorted.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50">
            <Download size={15} /> Download Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Applications"  value={rows.length}   color="border-blue-200" />
        <StatCard icon={CheckCircle} label="Shortlisted / Selected" value={rows.filter(r => ["shortlisted","selected","l1 select","l2 select","offered","joined"].includes((r.statusa||"").toLowerCase())).length} color="border-green-200" />
        <StatCard icon={Clock}     label="Pending Review"      value={rows.filter(r => ["submitted","applied"].includes((r.statusa||"").toLowerCase())).length} color="border-orange-200" />
        <StatCard icon={TrendingUp} label="Unique Positions"   value={new Set(rows.map(r => r.pos_id)).size} color="border-purple-200" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Filter size={15} /> Filters
            {hasFilters && <span className="ml-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{filtered.length} results</span>}
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors">
              <X size={12} /> Clear All
            </button>
          )}
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search candidate, email, position…" className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 focus:border-blue-400 rounded-xl text-sm outline-none transition-all" />
          </div>

          <select value={fPosition} onChange={e => { setFPosition(e.target.value); setPage(1); }} className="border-2 border-gray-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-700">
            <option value="">All Positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select value={fClient} onChange={e => { setFClient(e.target.value); setPage(1); }} className="border-2 border-gray-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-700">
            <option value="">All Clients</option>
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }} className="border-2 border-gray-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-700">
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={fRecruiter} onChange={e => { setFRecruiter(e.target.value); setPage(1); }} className="border-2 border-gray-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-700">
            <option value="">All Submitted By</option>
            {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={fSpoc} onChange={e => { setFSpoc(e.target.value); setPage(1); }} className="border-2 border-gray-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-700">
            <option value="">All Client SPOCs</option>
            {spocs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={fRole} onChange={e => { setFRole(e.target.value); setPage(1); }} className="border-2 border-gray-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-700">
            <option value="">All Role Types</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Candidate">Direct (Candidate)</option>
            <option value="ClientSpoc">Client SPOC</option>
          </select>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={fDateFrom} onChange={e => { setFDateFrom(e.target.value); setPage(1); }} title="Date From" className="w-full pl-8 pr-2 py-2.5 border-2 border-gray-200 focus:border-blue-400 rounded-xl text-sm outline-none transition-all text-gray-700" />
            </div>
            <div className="relative flex-1">
              <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={fDateTo} onChange={e => { setFDateTo(e.target.value); setPage(1); }} title="Date To" className="w-full pl-8 pr-2 py-2.5 border-2 border-gray-200 focus:border-blue-400 rounded-xl text-sm outline-none transition-all text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <RefreshCw size={32} className="animate-spin mb-4 text-blue-400" />
            <p className="text-sm font-medium">Loading direct applicants…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-red-500">
            <AlertCircle size={32} className="mb-4" />
            <p className="font-semibold">{error}</p>
            <button onClick={fetch} className="mt-4 px-5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-all">Retry</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <FileText size={36} className="mb-4 text-gray-300" />
            <p className="font-semibold text-gray-600">{hasFilters ? "No results match your filters" : "No direct applicants yet"}</p>
            {hasFilters && <button onClick={clearFilters} className="mt-3 text-sm text-blue-500 hover:underline">Clear filters</button>}
          </div>
        ) : (
          <>
            {/* Table scroll wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1250px]">
                <thead className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-6">#</th>
                    <Th col="candidate"   label="Candidate"    />
                    <Th col="pos_name"    label="Position"     />
                    <Th col="client"      label="Client"       />
                    <Th col="clientspoc"  label="Client SPOC"  />
                    <Th col="recName"     label="Submitted By" />
                    <Th col="recRole"     label="Role"         />
                    <Th col="statusa"     label="Status"       />
                    <Th col="matchPercent" label="AI Match %"  />
                    <Th col="datePosted"  label="Date Submitted" />
                    <Th col="updatedAt"   label="Last Updated"   />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map((r, i) => (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>

                      {/* Candidate */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{r.candidate || "—"}</div>
                        <div className="text-xs text-gray-400">{r.emails}</div>
                        {r.mob && <div className="text-xs text-gray-400">{r.mob}</div>}
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{r.pos_name || "—"}</div>
                        {r.pos_id && <div className="text-xs text-gray-400 font-mono">{r.pos_id}</div>}
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3 text-gray-700">{r.client || "—"}</td>

                      {/* Client SPOC */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.clientspoc || "—"}</td>

                      {/* Submitted by */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{r.recName || "—"}</div>
                        {r.recEmail && r.recEmail !== r.emails && (
                          <div className="text-xs text-gray-400">{r.recEmail}</div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          (r.recRole || "").toLowerCase() === "recruiter"
                            ? "bg-blue-100 text-blue-700"
                            : (r.recRole || "").toLowerCase() === "clientspoc"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {r.recRole === "Candidate" ? "Direct" : r.recRole || "Direct"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass(r.statusa)}`}>
                          {r.statusa || "Submitted"}
                        </span>
                      </td>

                      {/* AI Match % */}
                      <td className="px-4 py-3"><MatchCell row={r} /></td>

                      {/* Date submitted */}
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{fmt(r.datePosted)}</td>

                      {/* Last updated */}
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(r.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-700">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)}</span> of <span className="font-bold text-gray-700">{sorted.length}</span> results
              </div>
              <div className="flex items-center gap-1.5">
                <button disabled={page === 1} onClick={() => setPage(1)} className="px-2.5 py-1.5 text-xs font-semibold border-2 border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">«</button>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-semibold border-2 border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">‹ Prev</button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  let p;
                  if (pages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= pages - 3) p = pages - 6 + i;
                  else p = page - 3 + i;
                  if (p < 1 || p > pages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-all ${page === p ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white border-transparent shadow-md" : "border-gray-200 hover:border-blue-300 text-gray-600"}`}>{p}</button>
                  );
                })}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-semibold border-2 border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next ›</button>
                <button disabled={page === pages} onClick={() => setPage(pages)} className="px-2.5 py-1.5 text-xs font-semibold border-2 border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">»</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Position summary table */}
      {!loading && rows.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-orange-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={16} className="text-blue-600" /> Applications by Position</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Position", "Client", "Total", "Submitted", "Shortlisted", "Selected/Offered", "Rejected"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.values(
                  rows.reduce((acc, r) => {
                    const key = r.pos_id || r.pos_name;
                    if (!acc[key]) acc[key] = { pos_name: r.pos_name, client: r.client, total: 0, submitted: 0, shortlisted: 0, selected: 0, rejected: 0 };
                    acc[key].total++;
                    const s = (r.statusa || "").toLowerCase();
                    if (["submitted","applied"].includes(s)) acc[key].submitted++;
                    else if (["shortlisted","l1 select","l2 select"].includes(s)) acc[key].shortlisted++;
                    else if (["selected","offered","joined"].includes(s)) acc[key].selected++;
                    else if (s.includes("reject") || ["client drop","candidate drop","duplicate"].includes(s)) acc[key].rejected++;
                    return acc;
                  }, {})
                ).sort((a, b) => b.total - a.total).map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.pos_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.client || "—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{row.total}</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{row.submitted}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{row.shortlisted}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{row.selected}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{row.rejected}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
