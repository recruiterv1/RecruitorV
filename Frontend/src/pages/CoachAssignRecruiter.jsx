import React, { useState, useEffect, useContext, useMemo } from 'react';
import CertifiedBadge from '../components/CertifiedBadge';
import axios from 'axios';
import {
  UserPlus, Briefcase, Users, Search, X, CheckCircle,
  AlertCircle, Clock, RefreshCw, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import CoachExpertPageLayout from '../components/CoachExpertPageLayout';

const STATUS_STYLE = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  accepted: { label: 'Accepted', cls: 'bg-green-100  text-green-700  border-green-200'  },
  rejected: { label: 'Rejected', cls: 'bg-red-100    text-red-700    border-red-200'    },
};

const CoachAssignRecruiter = () => (
  <CoachExpertPageLayout>
    <CoachAssignRecruiterContent />
  </CoachExpertPageLayout>
);

const CoachAssignRecruiterContent = () => {
  const { user } = useContext(UserStateContext);

  // Data
  const [positions, setPositions]       = useState([]);
  const [recruiters, setRecruiters]     = useState([]);
  const [assignments, setAssignments]   = useState([]);
  const [coachCategories, setCoachCategories] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingAsgn, setLoadingAsgn]   = useState(true);

  // Form state
  const [selectedPos, setSelectedPos]   = useState('');
  const [selectedRec, setSelectedRec]   = useState('');
  const [note, setNote]                 = useState('');
  const [posSearch, setPosSearch]       = useState('');
  const [recSearch, setRecSearch]       = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState(null);

  // UI
  const [showForm, setShowForm] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    setLoadingAsgn(true);

    // Fetch positions, team member IDs, and all recruiters independently
    const [posRes, teamRes, recRes] = await Promise.allSettled([
      axios.get('/api/coach-expert/matching-positions', { withCredentials: true }),
      axios.get('/api/coach-expert/team/my-team-members', { withCredentials: true }),
      axios.get('/api/coach-expert/recruiters/all', { withCredentials: true }),
    ]);

    if (posRes.status === 'fulfilled') {
      setPositions(posRes.value.data?.positions || []);
      setCoachCategories(posRes.value.data?.coachCategories || []);
    } else {
      console.error('positions fetch error:', posRes.reason);
    }

    // Team members for the "Select Recruiter" dropdown. Prefer the full recruiter
    // objects returned by my-team-members (unfiltered by category); fall back to
    // intersecting recruiters/all with member IDs for older backends.
    const teamData = teamRes.status === 'fulfilled' ? (teamRes.value.data || {}) : {};
    const teamRecruiters = teamData.recruiters || [];
    const memberIds = new Set(teamData.memberIds || []);
    if (teamRecruiters.length > 0) {
      setRecruiters(teamRecruiters);
    } else if (recRes.status === 'fulfilled') {
      const all = recRes.value.data?.recruiters || [];
      setRecruiters(memberIds.size > 0 ? all.filter(r => memberIds.has(r.id)) : []);
    } else {
      setRecruiters([]);
      console.error('recruiters fetch error:', recRes.reason);
    }
    if (!coachCategories.length && recRes.status === 'fulfilled') {
      setCoachCategories(prev => prev.length ? prev : (recRes.value.data?.coachCategories || []));
    }

    setLoading(false);

    // Assignments fetched separately — failure silently ignored
    try {
      const asgnRes = await axios.get('/api/coach-expert/my-recruiter-assignments', { withCredentials: true });
      setAssignments(asgnRes.data?.assignments || []);
    } catch (err) {
      console.error('assignments fetch error:', err);
      setAssignments([]);
    } finally {
      setLoadingAsgn(false);
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const filteredPositions = useMemo(() =>
    positions.filter(p =>
      !posSearch ||
      (p.position || p.title || '').toLowerCase().includes(posSearch.toLowerCase()) ||
      (p.client || '').toLowerCase().includes(posSearch.toLowerCase())
    ), [positions, posSearch]);

  const filteredRecruiters = useMemo(() =>
    recruiters.filter(r =>
      !recSearch ||
      (r.name || '').toLowerCase().includes(recSearch.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(recSearch.toLowerCase())
    ), [recruiters, recSearch]);

  const selectedPosData = positions.find(p => p.pos_id === selectedPos);
  const selectedRecData = recruiters.find(r => r.id === selectedRec);

  const handleAssign = async () => {
    if (!selectedPos || !selectedRec) {
      showToast('Please select both a position and a recruiter', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/coach-expert/recruiter-assignment',
        { positionId: selectedPos, recruiterId: selectedRec, note },
        { withCredentials: true }
      );
      showToast('Recruiter assigned successfully! Email sent.');
      setSelectedPos(''); setSelectedRec(''); setNote('');
      setPosSearch(''); setRecSearch('');
      // Refresh assignments
      const res = await axios.get('/api/coach-expert/my-recruiter-assignments', { withCredentials: true });
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Assignment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><UserPlus size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Assign Recruiter</h2>
              <p className="text-orange-100 text-sm">
                {coachCategories.length > 0
                  ? `Showing positions & recruiters for: ${coachCategories.join(', ')}`
                  : 'Assign a recruiter to a position and notify them by email'}
              </p>
            </div>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowForm(f => !f)}
          className="w-full flex items-center justify-between px-5 py-4 bg-orange-50 hover:bg-orange-100 transition-colors"
        >
          <span className="font-bold text-gray-800 flex items-center gap-2">
            <UserPlus size={18} className="text-orange-500" /> New Assignment
          </span>
          {showForm ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </button>

        {showForm && (
          <div className="p-5 space-y-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Position Picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Briefcase size={14} className="inline mr-1 text-orange-500" /> Select Position *
                  </label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={posSearch} onChange={e => setPosSearch(e.target.value)}
                      placeholder="Search positions…"
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                    {posSearch && <button onClick={() => setPosSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
                  </div>
                  <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                    {filteredPositions.length === 0
                      ? <p className="text-center text-gray-400 py-6 text-sm">No positions found</p>
                      : filteredPositions.map(p => (
                        <button key={p.pos_id} onClick={() => setSelectedPos(p.pos_id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 text-sm transition-colors ${
                            selectedPos === p.pos_id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'hover:bg-gray-50'
                          }`}>
                          <p className="font-semibold text-gray-800">{p.position || p.title}</p>
                          <p className="text-xs text-gray-500">{p.client} · {p.location || 'Remote'}</p>
                        </button>
                      ))
                    }
                  </div>
                  {selectedPosData && (
                    <div className="mt-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                      Selected: <span className="font-bold text-orange-700">{selectedPosData.position || selectedPosData.title}</span>
                      {' '}— {selectedPosData.client}
                    </div>
                  )}
                </div>

                {/* Recruiter Picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Users size={14} className="inline mr-1 text-orange-500" /> Select Recruiter * <span className="font-normal text-gray-400 text-xs">(team members only)</span>
                  </label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={recSearch} onChange={e => setRecSearch(e.target.value)}
                      placeholder="Search recruiters…"
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                    {recSearch && <button onClick={() => setRecSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
                  </div>
                  <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                    {filteredRecruiters.length === 0
                      ? <p className="text-center text-gray-400 py-6 text-sm">No team members yet — add recruiters from <strong>My Team</strong></p>
                      : filteredRecruiters.map(r => (
                        <button key={r.id} onClick={() => setSelectedRec(r.id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 text-sm transition-colors ${
                            selectedRec === r.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'hover:bg-gray-50'
                          }`}>
                          <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                            {r.name}
                            <CertifiedBadge tier={r.eligibilityTier} size="xs" withLabel={false} />
                          </p>
                          <p className="text-xs text-gray-500">{r.email}</p>
                        </button>
                      ))
                    }
                  </div>
                  {selectedRecData && (
                    <div className="mt-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                      Selected: <span className="font-bold text-orange-700">{selectedRecData.name}</span>
                      {' '}· {selectedRecData.email}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Note (optional)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    rows={3} placeholder="Add a message to the recruiter…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none" />
                </div>

                <button onClick={handleAssign} disabled={submitting || !selectedPos || !selectedRec}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-md">
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Assigning…</>
                    : <><Send size={15} /> Assign & Notify Recruiter</>
                  }
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* My Assignments Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" /> My Assignments
          </h3>
          <span className="text-xs text-gray-500">{assignments.length} total</span>
        </div>

        {loadingAsgn ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">No assignments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Position</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Recruiter</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Assigned On</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => {
                  const s = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                  const date = a.createdAt?._seconds
                    ? new Date(a.createdAt._seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  return (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{a.positionTitle || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.client || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{a.recruiterName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{a.recruiterEmail || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachAssignRecruiter;
