import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Users, UserCheck, RefreshCw, Search, X, ChevronDown, ChevronUp,
  Briefcase, FileText, Clock, CheckCircle, XCircle, ArrowLeft, User, Phone,
} from 'lucide-react';

const STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200',         icon: XCircle },
};

const CAND_STATUS_CLS = {
  Submitted:  'bg-blue-100 text-blue-700',
  Shortlisted:'bg-purple-100 text-purple-700',
  Interview:  'bg-yellow-100 text-yellow-700',
  Selected:   'bg-green-100 text-green-700',
  Rejected:   'bg-red-100 text-red-700',
  Offered:    'bg-indigo-100 text-indigo-700',
  Joined:     'bg-teal-100 text-teal-700',
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const ms = ts._seconds ? ts._seconds * 1000 : ts.seconds ? ts.seconds * 1000 : typeof ts === 'string' ? new Date(ts).getTime() : null;
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Expandable candidate list per position inside the recruiter row
const CandidateExpand = ({ positions }) => {
  if (!positions || positions.length === 0) return <p className="text-xs text-gray-400 py-2">No positions assigned by this coach/expert.</p>;

  return (
    <div className="space-y-3 pt-1">
      {positions.map((pos, pi) => (
        <div key={pi} className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Briefcase size={12} className="text-blue-500" />
              {pos.positionTitle || pos.positionId}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {pos.candidates.length} CV{pos.candidates.length !== 1 ? 's' : ''}
            </span>
          </div>
          {pos.candidates.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No CVs submitted for this position.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 font-semibold text-gray-500">#</th>
                  <th className="px-4 py-2 font-semibold text-gray-500">Candidate</th>
                  <th className="px-4 py-2 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-2 font-semibold text-gray-500">Date Submitted</th>
                  <th className="px-4 py-2 font-semibold text-gray-500">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {pos.candidates.map((c, ci) => (
                  <tr key={ci} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{ci + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800 flex items-center gap-1.5">
                      <User size={11} className="text-gray-400 flex-shrink-0" />
                      {c.name}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CAND_STATUS_CLS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status || 'Submitted'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{fmtDate(c.datePosted)}</td>
                    <td className="px-4 py-2 text-gray-500">{fmtDate(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

const TeamDetailView = ({ team, onBack }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = useMemo(() =>
    team.members.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (m.recruiterName || '').toLowerCase().includes(q) ||
             (m.recruiterEmail || '').toLowerCase().includes(q);
    }),
  [team.members, search, statusFilter]);

  const counts = useMemo(() => ({
    all:      team.members.length,
    approved: team.members.filter(m => m.status === 'approved').length,
    pending:  team.members.filter(m => m.status === 'pending').length,
    rejected: team.members.filter(m => m.status === 'rejected').length,
  }), [team.members]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-xl">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-3 transition-colors">
          <ArrowLeft size={16} /> Back to Teams
        </button>
        <div className="flex items-center gap-4">
          {team.profilePhoto
            ? <img src={team.profilePhoto} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/30 flex-shrink-0" />
            : <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">{(team.name || '?')[0].toUpperCase()}</div>
          }
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{team.name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-white/20 rounded-full">{team.role}</span>
            </div>
            <p className="text-blue-200 text-sm">{team.email}{team.phone ? ` · ${team.phone}` : ''}</p>
            <div className="flex items-center gap-4 mt-1.5 text-sm">
              <span className="flex items-center gap-1"><UserCheck size={14} /> {counts.approved} active</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {counts.pending} pending</span>
              <span className="flex items-center gap-1"><Users size={14} /> {counts.all} total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recruiter…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        {['all', 'approved', 'pending', 'rejected'].map(key => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              statusFilter === key ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
            }`}>
            {key} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No recruiter requests found</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[32px_1fr_120px_100px_80px_40px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
              <span>#</span>
              <span>Recruiter</span>
              <span>Status</span>
              <span>Positions</span>
              <span>CVs</span>
              <span></span>
            </div>

            {filtered.map((m, i) => {
              const s = STATUS_CFG[m.status] || STATUS_CFG.pending;
              const SIcon = s.icon;
              const isOpen = !!expanded[m.id];
              const positionNames = m.positions.map(p => p.positionTitle || p.positionId);

              return (
                <div key={m.id} className="border-t border-gray-100">
                  {/* Row */}
                  <div className="grid grid-cols-[32px_1fr_120px_100px_80px_40px] gap-2 items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-xs text-gray-400">{i + 1}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{m.recruiterName || '—'}</p>
                      <p className="text-xs text-gray-400">{m.recruiterEmail}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>
                        <SIcon size={11} /> {s.label}
                      </span>
                    </div>
                    <div>
                      {positionNames.length === 0 ? (
                        <span className="text-gray-400 text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {positionNames.slice(0, 2).map((p, pi) => (
                            <span key={pi} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-100 truncate max-w-[90px]" title={p}>{p}</span>
                          ))}
                          {positionNames.length > 2 && (
                            <span className="text-xs text-gray-400">+{positionNames.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 font-bold text-sm ${m.cvCount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        <FileText size={13} /> {m.cvCount}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleExpand(m.id)}
                      className="flex items-center justify-center p-1 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                      title={isOpen ? 'Collapse' : 'Expand candidates'}
                    >
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Expanded candidates */}
                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <CandidateExpand positions={m.positions} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const SuperAdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/teams', { withCredentials: true });
      setTeams(res.data?.teams || []);
    } catch (err) {
      console.error('teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const filtered = useMemo(() =>
    teams.filter(t => {
      if (roleFilter !== 'all' && t.role.toLowerCase() !== roleFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (t.name || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q);
    }),
  [teams, search, roleFilter]);

  const counts = useMemo(() => ({
    all:    teams.length,
    coach:  teams.filter(t => t.role === 'Coach').length,
    expert: teams.filter(t => t.role === 'Expert').length,
  }), [teams]);

  if (selectedTeam) {
    return (
      <div className="p-4 sm:p-6">
        <TeamDetailView team={selectedTeam} onBack={() => setSelectedTeam(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Teams</h2>
              <p className="text-blue-200 text-sm">
                {counts.coach} coaches · {counts.expert} experts · {teams.reduce((a, t) => a + t.teamSize, 0)} active recruiters total
              </p>
            </div>
          </div>
          <button onClick={fetchTeams} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
        </div>
        {[['all', 'All', counts.all], ['coach', 'Coach', counts.coach], ['expert', 'Expert', counts.expert]].map(([key, label, count]) => (
          <button key={key} onClick={() => setRoleFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              roleFilter === key ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
            }`}>
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No teams found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(team => {
            const totalCVs = team.members.reduce((sum, m) => sum + (m.cvCount || 0), 0);
            const activeCVs = team.members.reduce((sum, m) =>
              sum + (m.positions || []).reduce((s, p) =>
                s + (p.candidates || []).filter(c => c.status !== 'Rejected').length, 0), 0);
            const totalPositions = new Set(team.members.flatMap(m => (m.positions || []).map(p => p.positionId))).size;
            return (
            <button key={team.email} onClick={() => setSelectedTeam(team)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-left hover:shadow-md hover:border-blue-300 transition-all group">
              <div className="flex items-start gap-3 mb-3">
                {team.profilePhoto
                  ? <img src={team.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">{(team.name || '?')[0].toUpperCase()}</div>
                }
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{team.name}</p>
                  <p className="text-xs text-gray-400 truncate">{team.email}</p>
                  {team.phone && (
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5"><Phone size={11} className="text-blue-400" />{team.phone}</p>
                  )}
                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
                    team.role === 'Coach' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>{team.role}</span>
                </div>
              </div>

              {team.skillCategory && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {(Array.isArray(team.skillCategory) ? team.skillCategory : [team.skillCategory]).slice(0, 2).map(s => (
                    <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-green-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-green-700">{team.teamSize}</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
                <div className="bg-yellow-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-yellow-700">{team.members.filter(m => m.status === 'pending').length}</p>
                  <p className="text-xs text-yellow-600">Pending</p>
                </div>
                <div className="bg-blue-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-blue-700">{team.totalRequests}</p>
                  <p className="text-xs text-blue-600">Total</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-indigo-50 rounded-xl py-2 flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <FileText size={13} className="text-indigo-500" />
                    <p className="text-lg font-bold text-indigo-700">{totalCVs}</p>
                  </div>
                  <p className="text-xs text-indigo-600">CVs Total</p>
                </div>
                <div className="bg-teal-50 rounded-xl py-2 flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <UserCheck size={13} className="text-teal-500" />
                    <p className="text-lg font-bold text-teal-700">{activeCVs}</p>
                  </div>
                  <p className="text-xs text-teal-600">CVs Active</p>
                </div>
                <div className="bg-orange-50 rounded-xl py-2 flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Briefcase size={13} className="text-orange-500" />
                    <p className="text-lg font-bold text-orange-700">{totalPositions}</p>
                  </div>
                  <p className="text-xs text-orange-600">Positions</p>
                </div>
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminTeams;
