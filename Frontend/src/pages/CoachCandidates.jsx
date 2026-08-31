import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, RefreshCw, Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import DashShell from '../components/DashShell';
import CandidateFilterBar from '../components/CandidateFilterBar';
import { applyCandidateFilters, EMPTY_FILTERS } from '../utils/candidateFilters';

// The coach's two candidate lists — what they submitted themselves, and what
// their team submitted. Same table either way; the team view adds the recruiter
// who made each submission.

const STATUS_TONE = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('reject') || v.includes('drop') || v.includes('duplicate')) return 'bg-red-50 text-red-700 border-red-200';
  if (v.includes('joining') || v.includes('joined') || v.includes('selected') || v.includes('offer')) return 'bg-green-50 text-green-700 border-green-200';
  if (v.includes('interview') || v.includes('l1') || v.includes('l2') || v.includes('l3')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (v.includes('shortlist')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (v.includes('applied')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', yy: undefined, year: '2-digit' });
};

// Headline counts above the table, computed from what is currently filtered in.
const summarise = (rows) => {
  const has = (r, ...parts) => parts.some(p => String(r.statusa || '').toLowerCase().includes(p));
  return {
    total: rows.length,
    inProcess: rows.filter(r => !has(r, 'reject', 'drop', 'duplicate') && !has(r, 'joining', 'joined')).length,
    placed: rows.filter(r => has(r, 'joining', 'joined', 'selected')).length,
    rejected: rows.filter(r => has(r, 'reject', 'drop', 'duplicate')).length,
  };
};

const Stat = ({ label, value, tone }) => (
  <div className={`rounded-2xl border p-4 ${tone}`}>
    <p className="text-[11px] uppercase tracking-wider opacity-70">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

function CoachCandidatesInner({ view }) {
  const isTeam = view === 'team';
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({});
  const [teamSize, setTeamSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const url = isTeam ? '/api/coach-expert/team-candidates' : '/api/coach-expert/my-candidates';
      const r = await axios.get(url, { withCredentials: true });
      setRows(r.data?.candidates || []);
      setFacets(r.data?.facets || {});
      setTeamSize(r.data?.teamSize || 0);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load candidates.');
    } finally { setLoading(false); }
  };

  // Reload from scratch whenever the view switches between my and team.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setFilters(EMPTY_FILTERS); setPage(1); load(); }, [view]);

  const filtered = useMemo(() => applyCandidateFilters(rows, filters), [rows, filters]);
  const stats = useMemo(() => summarise(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Export exactly what is on screen, filters included — not the whole list.
  const exportCsv = () => {
    const head = ['Candidate', 'Email', 'Phone', 'Position', 'Client', 'Status',
      ...(isTeam ? ['Submitted By'] : []), 'Experience', 'Notice', 'Submitted On'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = filtered.map(r => [r.candidate, r.emails, r.mob, r.pos_name, r.client, r.statusa,
      ...(isTeam ? [r.recruiterName || r.recruiterEmail] : []),
      r.total_exp, r.notice_period, fmtDate(r.submittedAt)].map(esc).join(','));
    const blob = new Blob([[head.map(esc).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${isTeam ? 'team' : 'my'}-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">{isTeam ? 'Team Candidates' : 'My Candidates'}</h2>
              <p className="text-orange-100 text-sm">
                {isTeam
                  ? `Every candidate submitted by your team${teamSize ? ` · ${teamSize} recruiter${teamSize === 1 ? '' : 's'}` : ''}`
                  : 'Candidates you have submitted yourself'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} disabled={!filtered.length}
              className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 disabled:opacity-50 rounded-xl text-sm font-semibold shadow-sm">
              <Download size={15} /> Export
            </button>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Candidates"  value={stats.total}     tone="border-gray-200 bg-white text-gray-800" />
        <Stat label="In Process"  value={stats.inProcess} tone="border-blue-200 bg-blue-50 text-blue-700" />
        <Stat label="Placed"      value={stats.placed}    tone="border-green-200 bg-green-50 text-green-700" />
        <Stat label="Rejected"    value={stats.rejected}  tone="border-red-200 bg-red-50 text-red-700" />
      </div>

      <CandidateFilterBar
        value={filters} onChange={(f) => { setFilters(f); setPage(1); }}
        facets={facets} showRecruiter={isTeam}
        resultCount={filtered.length} totalCount={rows.length}
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading candidates…
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20 px-6">
            <Users size={36} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-600">
              {rows.length ? 'No candidates match these filters' : 'No candidates yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {rows.length
                ? 'Try clearing a filter to widen the list.'
                : isTeam
                  ? 'Candidates submitted by recruiters on your team will appear here.'
                  : 'Candidates you submit against a position will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-semibold">Candidate</th>
                    <th className="px-4 py-3 font-semibold">Position</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    {isTeam && <th className="px-4 py-3 font-semibold">Submitted By</th>}
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Exp / Notice</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Submitted</th>
                    <th className="px-4 py-3 font-semibold text-right">CV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{r.candidate || '—'}</p>
                        <p className="text-[11px] text-gray-500">{r.emails}</p>
                        {r.mob && <p className="text-[11px] text-gray-400">{r.mob}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{r.pos_name || '—'}</p>
                        {r.pos_id && <p className="text-[11px] text-gray-400">#{r.pos_id}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.client || '—'}</td>
                      {isTeam && (
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{r.recruiterName || '—'}</p>
                          <p className="text-[11px] text-gray-400">{r.recruiterEmail}</p>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_TONE(r.statusa)}`}>
                          {r.statusa || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {r.total_exp || '—'}{r.notice_period ? ` · ${r.notice_period}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.submittedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {r.cv_data
                          ? <a href={r.cv_data} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-xs font-semibold">
                              <FileText size={13} /> View
                            </a>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 text-sm">
                <span className="text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                    Previous
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CoachCandidates({ view = 'my' }) {
  return (
    <DashShell>
      <CoachCandidatesInner view={view} />
    </DashShell>
  );
}
