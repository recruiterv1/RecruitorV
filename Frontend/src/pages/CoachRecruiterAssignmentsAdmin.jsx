import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { UserCheck, RefreshCw, Search, X, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'Accepted', cls: 'bg-green-100  text-green-700',  icon: CheckCircle },
  rejected: { label: 'Rejected', cls: 'bg-red-100    text-red-700',    icon: XCircle },
};

const CoachRecruiterAssignmentsAdmin = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/coach-recruiter-assignments', { withCredentials: true });
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      console.error('fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const filtered = useMemo(() =>
    assignments.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (a.coachName   || '').toLowerCase().includes(q) ||
        (a.coachEmail  || '').toLowerCase().includes(q) ||
        (a.recruiterName  || '').toLowerCase().includes(q) ||
        (a.recruiterEmail || '').toLowerCase().includes(q) ||
        (a.positionTitle  || '').toLowerCase().includes(q) ||
        (a.client         || '').toLowerCase().includes(q)
      );
    }),
  [assignments, search, statusFilter]);

  const counts = useMemo(() => ({
    all:      assignments.length,
    pending:  assignments.filter(a => a.status === 'pending').length,
    accepted: assignments.filter(a => a.status === 'accepted').length,
    rejected: assignments.filter(a => a.status === 'rejected').length,
  }), [assignments]);

  const formatDate = (ts) => {
    if (!ts?._seconds) return '—';
    return new Date(ts._seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const btn = (key, label, count) => (
    <button
      key={key}
      onClick={() => setStatusFilter(key)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        statusFilter === key
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
      }`}
    >
      {label} <span className="ml-1 opacity-75">({count})</span>
    </button>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><UserCheck size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Coach → Recruiter Assignments</h2>
              <p className="text-blue-200 text-sm">{assignments.length} total assignments across all coaches</p>
            </div>
          </div>
          <button onClick={fetchAssignments} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search coach, recruiter, position…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {btn('all', 'All', counts.all)}
          {btn('pending', 'Pending', counts.pending)}
          {btn('accepted', 'Accepted', counts.accepted)}
          {btn('rejected', 'Rejected', counts.rejected)}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <UserCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{search || statusFilter !== 'all' ? 'No results found' : 'No assignments yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-left">
                  {['#','Coach','Coach Email','Recruiter','Recruiter Email','Position','Client','Status','Note','Assigned On'].map(h => (
                    <th key={h} className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const s = STATUS_CFG[a.status] || STATUS_CFG.pending;
                  const Icon = s.icon;
                  return (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3 font-semibold text-gray-800">{a.coachName || '—'}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{a.coachEmail || '—'}</td>
                      <td className="px-3 py-3 font-semibold text-gray-800">{a.recruiterName || '—'}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{a.recruiterEmail || '—'}</td>
                      <td className="px-3 py-3 font-medium text-gray-700">{a.positionTitle || '—'}</td>
                      <td className="px-3 py-3 text-gray-600">{a.client || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>
                          <Icon size={10} /> {s.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-400 max-w-32 truncate" title={a.note}>{a.note || '—'}</td>
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filtered.length} of {assignments.length} records
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachRecruiterAssignmentsAdmin;
