import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Briefcase, MapPin, IndianRupee, ChevronDown, ChevronRight, X,
  Users, Calendar, BadgePercent, CheckCircle, XCircle, Clock,
  Search, RefreshCw
} from 'lucide-react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { formatCommission } from '../lib/commission';

// ── helpers ──────────────────────────────────────────────────────
const fmtDate = (ts) => {
  if (!ts) return 'N/A';
  try {
    const ms = ts._seconds ? ts._seconds * 1000 : typeof ts === 'string' ? Date.parse(ts) : ts;
    return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return 'N/A'; }
};

const STATUS_COLORS = {
  Selected:   'bg-green-100 text-green-700',
  Rejected:   'bg-red-100 text-red-600',
  Submitted:  'bg-blue-100 text-blue-700',
};
const statusCls = (s) => {
  const sl = (s || '').toLowerCase();
  if (sl.includes('reject') || sl.includes('drop') || sl === 'duplicate') return 'bg-red-100 text-red-600';
  if (sl === 'submitted') return 'bg-blue-100 text-blue-700';
  if (sl === 'selected') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
};

// ── JD / Position Detail Modal ────────────────────────────────────
const PositionModal = ({ pos, onClose }) => {
  if (!pos) return null;
  const Section = ({ title, value }) => value ? (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <div className="text-sm text-gray-700 whitespace-pre-wrap">{value}</div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 px-6 py-4 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{pos.position}</h2>
            <p className="text-white/75 text-sm mt-0.5">{pos.client} · {pos.pos_id}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white mt-0.5 flex-shrink-0"><X size={22} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Status', value: pos.status, cls: pos.isActive ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50' },
              { label: 'Candidates', value: pos.totalCandidates, cls: 'text-blue-700 bg-blue-50' },
              { label: 'Recruiters', value: pos.recruitersWorking, cls: 'text-orange-700 bg-orange-50' },
              { label: 'Commission', value: pos.commison ? formatCommission(pos.commison, pos.commission_type) : '0%', cls: 'text-purple-700 bg-purple-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
                <p className="text-xs font-semibold opacity-70 mb-0.5">{s.label}</p>
                <p className="font-bold text-sm">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Core details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <Section title="ClientSPOC" value={pos.clientspoc} />
              <Section title="Experience" value={pos.experience} />
              <Section title="Location" value={pos.location} />
              <Section title="CTC Range" value={pos.ctcStart && pos.ctcEnd ? `₹${pos.ctcStart} – ₹${pos.ctcEnd} LPA` : undefined} />
              <Section title="Category" value={pos.pos_cat} />
              <Section title="Skill Category" value={pos.skill_category} />
              <Section title="Date Posted" value={fmtDate(pos.datePosted)} />
            </div>
            <div>
              <Section title="Must Have" value={pos.m_have} />
              <Section title="Good to Have" value={pos.g_have} />
              <Section title="Key Responsibilities" value={pos.key_res} />
              <Section title="Competencies" value={pos.compet} />
            </div>
          </div>

          {/* JD */}
          {pos.job_desc && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Job Description</p>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {pos.job_desc}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Recruiter-wise candidate breakdown (expand panel) ─────────────
const RecruiterBreakdown = ({ breakdown }) => {
  const [openRec, setOpenRec] = useState(null);
  if (!breakdown?.length) return <p className="text-sm text-gray-400 italic px-4 py-3">No candidates submitted yet.</p>;

  return (
    <div className="px-4 py-3 space-y-3">
      {breakdown.map((rec, ri) => (
        <div key={ri} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenRec(openRec === ri ? null : ri)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                {(rec.recruiterName || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{rec.recruiterName}</p>
                <p className="text-xs text-gray-400">{rec.recruiterEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {rec.candidates.length} candidate{rec.candidates.length !== 1 ? 's' : ''}
              </span>
              {openRec === ri ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
            </div>
          </button>

          {openRec === ri && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-blue-50">
                  <tr>
                    {['#', 'Candidate', 'Email', 'Phone', 'Status', 'Submitted', 'Status Updated'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-blue-700 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rec.candidates.map((c, ci) => (
                    <tr key={c.id || ci} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{ci + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{c.name}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.email || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.phone || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${statusCls(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.submittedDate}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.statusUpdatedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main AllPositions component ───────────────────────────────────
const AllPositions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [jdModal, setJdModal]         = useState(null);
  const [statusFilter, setStatusFilter]     = useState('all');
  const [zeroFilter, setZeroFilter]         = useState('all');
  const [skillCatFilter, setSkillCatFilter] = useState('');
  const [clientFilter, setClientFilter]     = useState('');
  const [spocFilter, setSpocFilter]         = useState('');

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/admin/all-positions-detail', { withCredentials: true });
      setPositions(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPositions(); }, []);

  const skillCategories = useMemo(() =>
    [...new Set(positions.map(p => p.skill_category).filter(Boolean))].sort(), [positions]);
  const clientOptions = useMemo(() =>
    [...new Set(positions.map(p => p.client).filter(Boolean))].sort(), [positions]);
  const spocOptions = useMemo(() =>
    [...new Set(positions.map(p => p.clientspoc).filter(Boolean))].sort(), [positions]);

  const anyFilterActive = statusFilter !== 'all' || zeroFilter !== 'all' || skillCatFilter || clientFilter || spocFilter;

  const filtered = useMemo(() => {
    let rows = positions;
    if (statusFilter === 'active')        rows = rows.filter(p => p.isActive);
    if (statusFilter === 'inactive')      rows = rows.filter(p => !p.isActive);
    if (zeroFilter === 'zero-candidates') rows = rows.filter(p => p.totalCandidates === 0);
    if (zeroFilter === 'zero-recruiters') rows = rows.filter(p => p.recruitersWorking === 0);
    if (skillCatFilter) rows = rows.filter(p => (p.skill_category || '').toLowerCase() === skillCatFilter.toLowerCase());
    if (clientFilter)   rows = rows.filter(p => (p.client || '').toLowerCase() === clientFilter.toLowerCase());
    if (spocFilter)     rows = rows.filter(p => (p.clientspoc || '').toLowerCase() === spocFilter.toLowerCase());
    return rows;
  }, [positions, statusFilter, zeroFilter, skillCatFilter, clientFilter, spocFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'position',
      header: 'Position',
      size: 220,
      Cell: ({ cell, row }) => (
        <div>
          <p className="font-bold text-gray-900 text-sm">{cell.getValue()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.original.pos_id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      size: 160,
      Cell: ({ cell }) => <span className="text-sm font-medium text-gray-700">{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'clientspoc',
      header: 'ClientSPOC',
      size: 160,
      Cell: ({ cell }) => <span className="text-sm text-gray-600">{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'datePosted',
      header: 'Date Created',
      size: 130,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
          <Calendar size={13} className="text-orange-500 flex-shrink-0" />
          {fmtDate(cell.getValue())}
        </div>
      ),
      sortingFn: (a, b) => {
        const aS = a.original.datePosted?._seconds ?? 0;
        const bS = b.original.datePosted?._seconds ?? 0;
        return aS - bS;
      },
    },
    {
      accessorKey: 'recruitersWorking',
      header: 'Recruiters',
      size: 110,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-blue-500 flex-shrink-0" />
          <span className="font-bold text-blue-700 text-sm">{cell.getValue() ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalCandidates',
      header: 'Candidates',
      size: 110,
      Cell: ({ cell }) => (
        <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {cell.getValue() ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'skill_category',
      header: 'Skill Category',
      size: 150,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        return val ? (
          <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">{val}</span>
        ) : <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      size: 110,
      Cell: ({ cell, row }) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cell.getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cell.getValue() ? 'bg-green-500' : 'bg-red-400'}`} />
          {cell.getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
      filterVariant: 'select',
    },
    {
      id: 'view-jd',
      header: 'JD',
      size: 90,
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => (
        <button
          onClick={e => { e.stopPropagation(); setJdModal(row.original); }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Briefcase size={11} /> View JD
        </button>
      ),
    },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data: filtered,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableGlobalFilter: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableExpanding: true,
    getRowId: row => row.pos_id,
    initialState: {
      pagination: { pageSize: 20, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'datePosted', desc: true }],
    },
    state: { isLoading: loading, showAlertBanner: !!error },
    muiToolbarAlertBannerProps: error ? { color: 'error', children: error } : undefined,
    muiTableContainerProps: { sx: { maxHeight: 'calc(100vh - 380px)', minHeight: '400px' } },
    muiTableBodyRowProps: ({ row }) => ({
      sx: { cursor: 'pointer', '&:hover': { backgroundColor: '#eff6ff' } },
    }),
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #eff6ff, #fff7ed)',
        borderBottom: '2px solid #bfdbfe',
        fontWeight: 600,
        color: '#1f2937',
      },
    },
    muiTablePaperProps: { sx: { boxShadow: 'none', border: 'none' } },
    muiTopToolbarProps: {
      sx: {
        background: 'linear-gradient(to right, #2563eb, #f97316)',
        '& .MuiIconButton-root': { color: 'white' },
        '& .MuiInputBase-root': { color: 'white', '&::before': { borderBottomColor: 'rgba(255,255,255,0.5)' } },
      },
    },
    renderTopToolbarCustomActions: () => (
      <button
        onClick={fetchPositions}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <RefreshCw size={15} /> Refresh
      </button>
    ),
    renderDetailPanel: ({ row }) => <RecruiterBreakdown breakdown={row.original.recruiterBreakdown} />,
  });

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">All Positions</h2>
            <p className="text-blue-100 text-sm mt-0.5">Full position list with candidate & recruiter breakdown</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/20 px-4 py-2 rounded-lg text-center">
              <p className="text-xs text-white/70">Total</p>
              <p className="text-lg font-bold">{positions.length}</p>
            </div>
            <div className="bg-green-500/40 px-4 py-2 rounded-lg text-center">
              <p className="text-xs text-white/80">Active</p>
              <p className="text-lg font-bold">{positions.filter(p => p.isActive).length}</p>
            </div>
            <div className="bg-red-500/40 px-4 py-2 rounded-lg text-center">
              <p className="text-xs text-white/80">Inactive</p>
              <p className="text-lg font-bold">{positions.filter(p => !p.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status:</span>
          {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'inactive', label: 'Inactive' }].map(o => (
            <button key={o.key} onClick={() => setStatusFilter(o.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === o.key ? 'bg-blue-600 text-white shadow' : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'}`}>
              {o.label}
            </button>
          ))}

          <span className="mx-1 text-gray-300">|</span>

          {/* Zero-count filters */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Show:</span>
          {[
            { key: 'all', label: 'All' },
            { key: 'zero-candidates', label: '0 Candidates' },
            { key: 'zero-recruiters', label: '0 Recruiters' },
          ].map(o => (
            <button key={o.key} onClick={() => setZeroFilter(o.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${zeroFilter === o.key ? 'bg-orange-500 text-white shadow' : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'}`}>
              {o.label}
            </button>
          ))}

          <span className="mx-1 text-gray-300">|</span>

          {/* Skill Category */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Skill:</span>
          <select
            value={skillCatFilter}
            onChange={e => setSkillCatFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-300 text-purple-700 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="">All Categories</option>
            {skillCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Client */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Client:</span>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[160px]"
          >
            <option value="">All Clients</option>
            {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* ClientSPOC */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">SPOC:</span>
          <select
            value={spocFilter}
            onChange={e => setSpocFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[160px]"
          >
            <option value="">All SPOCs</option>
            {spocOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {anyFilterActive && (
            <button
              onClick={() => { setStatusFilter('all'); setZeroFilter('all'); setSkillCatFilter(''); setClientFilter(''); setSpocFilter(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
            >
              ✕ Clear All
            </button>
          )}

          <span className="ml-auto text-xs text-gray-500">
            Showing <span className="font-bold text-blue-600">{filtered.length}</span> of {positions.length}
            {' '}· Click row to expand
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden p-3">
        <MaterialReactTable table={table} />
      </div>

      {/* JD Modal */}
      {jdModal && <PositionModal pos={jdModal} onClose={() => setJdModal(null)} />}
    </div>
  );
};

export default AllPositions;
