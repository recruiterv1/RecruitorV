import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import {
  Users, UserPlus, Search, X, CheckCircle, AlertCircle,
  RefreshCw, Clock, UserCheck, ChevronDown, ChevronUp,
  MapPin, Briefcase, Mail, ExternalLink, Crown, Send,
  FileText, Download, GraduationCap, Phone, Trash2, XCircle, Activity
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import CoachExpertPageLayout from '../components/CoachExpertPageLayout';

const TEAM_LIMIT = 6;

const fmtLastActive = (iso) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const VendorUpgradeModal = ({ onClose }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      await axios.post('/api/coach-expert/vendor-upgrade-request', {}, { withCredentials: true });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-5 rounded-t-2xl text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Crown size={22} /></div>
            <div>
              <h3 className="text-xl font-bold">Team Limit Reached</h3>
              <p className="text-orange-200 text-sm">You've reached the maximum of {TEAM_LIMIT} team members</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <p className="font-bold text-gray-800">Request Sent!</p>
              <p className="text-sm text-gray-500">Our administrators will review your request and get back to you shortly.</p>
              <button onClick={onClose} className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all">Close</button>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-sm leading-relaxed">
                To add more than <strong>{TEAM_LIMIT} recruiters</strong> to your team, you need to become a <strong>Vendor</strong> on RecruiterV.
                As a vendor, you can manage larger teams and unlock additional features.
              </p>
              <p className="text-gray-500 text-sm">Please contact the administrator to upgrade your account.</p>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSend} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all">
                  {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={15} />}
                  Send Request to Become a Vendor
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const STATUS_STYLE = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  approved: { label: 'Approved', cls: 'bg-green-100  text-green-700  border-green-200',  icon: CheckCircle },
  rejected: { label: 'Rejected', cls: 'bg-red-100    text-red-700    border-red-200',    icon: XCircle },
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const ms = ts._seconds ? ts._seconds * 1000 : ts.seconds ? ts.seconds * 1000 : null;
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RecruiterProfileModal = ({ recruiter, onClose }) => {
  const [resumeOpen, setResumeOpen] = useState(false);
  if (!recruiter) return null;

  const hasResume = recruiter.resume || recruiter.resumeUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-5 rounded-t-2xl text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
          <div className="flex items-center gap-4">
            {recruiter.profilePhoto
              ? <img src={recruiter.profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40 flex-shrink-0" />
              : <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">{(recruiter.name || '?')[0].toUpperCase()}</div>
            }
            <div>
              <h3 className="text-xl font-bold">{recruiter.name || '—'}</h3>
              <p className="text-orange-200 text-sm">{recruiter.currentTitle || recruiter.specialization || '—'}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {recruiter.email    && <div className="flex items-center gap-2 text-gray-600"><Mail size={14} className="text-orange-400 flex-shrink-0" /><span className="truncate">{recruiter.email}</span></div>}
            {recruiter.phone    && <div className="flex items-center gap-2 text-gray-600"><Phone size={14} className="text-orange-400 flex-shrink-0" />{recruiter.phone}</div>}
            {recruiter.location && <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-orange-400 flex-shrink-0" />{recruiter.location}</div>}
            {recruiter.yearsOfExperience && <div className="flex items-center gap-2 text-gray-600"><Briefcase size={14} className="text-orange-400 flex-shrink-0" />{recruiter.yearsOfExperience} yrs experience</div>}
          </div>

          {recruiter.bio && <p className="text-sm text-gray-600 bg-orange-50 rounded-xl p-3 leading-relaxed">{recruiter.bio}</p>}

          {/* Skill Category */}
          {recruiter.skillCategory && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skill Category</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(recruiter.skillCategory) ? recruiter.skillCategory : [recruiter.skillCategory]).map(s => (
                  <span key={s} className="px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {recruiter.skills?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {recruiter.skills.map((s, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{s}</span>)}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {recruiter.workExperience?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Briefcase size={12} /> Work Experience</p>
              <div className="space-y-2">
                {recruiter.workExperience.map((w, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">{w.title || w.position || '—'}</p>
                    <p className="text-xs text-gray-500">{w.company || w.organization || ''}{w.duration || w.years ? ` · ${w.duration || w.years}` : ''}</p>
                    {w.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{w.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {recruiter.education?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><GraduationCap size={12} /> Education</p>
              <div className="space-y-2">
                {recruiter.education.map((e, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">{e.degree || e.qualification || '—'}</p>
                    <p className="text-xs text-gray-500">{e.institution || e.school || e.college || ''}{e.year || e.passoutYear ? ` · ${e.year || e.passoutYear}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn */}
          {recruiter.linkedin && (
            <a href={recruiter.linkedin} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <ExternalLink size={14} /> LinkedIn Profile
            </a>
          )}

          {/* Resume / CV */}
          {hasResume && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FileText size={12} /> Resume / CV</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setResumeOpen(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
                    <FileText size={14} /> {resumeOpen ? 'Hide CV' : 'View CV'}
                  </button>
                  {recruiter.resume && (
                    <button onClick={() => {
                      const a = document.createElement('a');
                      a.href = `data:application/pdf;base64,${recruiter.resume}`;
                      a.download = recruiter.resumeFileName || 'resume.pdf';
                      a.click();
                    }} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-all">
                      <Download size={14} /> Download
                    </button>
                  )}
                  {recruiter.resumeUrl && !recruiter.resume && (
                    <a href={recruiter.resumeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-all">
                      <ExternalLink size={14} /> Open
                    </a>
                  )}
                </div>
                {resumeOpen && (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <iframe
                      src={recruiter.resume ? `data:application/pdf;base64,${recruiter.resume}` : recruiter.resumeUrl}
                      title="Resume"
                      className="w-full h-[500px]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {!hasResume && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <FileText size={14} /> No resume uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CoachTeam = () => (
  <CoachExpertPageLayout>
    <CoachTeamContent />
  </CoachExpertPageLayout>
);

const CoachTeamContent = () => {
  const { user } = useContext(UserStateContext);
  const [recruiters, setRecruiters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState({});
  const [profileModal, setProfileModal] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [tab, setTab] = useState('find'); // 'find' | 'team' | 'requests'
  const [findTab, setFindTab] = useState('fit'); // 'fit' (Skill Fit) | 'all'
  const [showTeam, setShowTeam] = useState(true);
  const [removing, setRemoving] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [actingIncoming, setActingIncoming] = useState({});
  const [profileLoadingId, setProfileLoadingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch the recruiter list for the current Find sub-tab.
  //   'all' → any category, non-employee, active 72h;  'fit' → skill-category match.
  const fetchRecruiters = async (which = findTab) => {
    try {
      const url = `/api/coach-expert/team/eligible-recruiters${which === 'all' ? '?scope=all' : ''}`;
      const res = await axios.get(url, { withCredentials: true });
      setRecruiters(res.data?.recruiters || []);
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, teamRes, incomingRes] = await Promise.allSettled([
        axios.get(`/api/coach-expert/team/eligible-recruiters${findTab === 'all' ? '?scope=all' : ''}`, { withCredentials: true }),
        axios.get('/api/coach-expert/team/my-team', { withCredentials: true }),
        axios.get('/api/coach-expert/team/incoming-join-requests', { withCredentials: true }),
      ]);
      if (recRes.status === 'fulfilled') setRecruiters(recRes.value.data?.recruiters || []);
      if (teamRes.status === 'fulfilled') setRequests(teamRes.value.data?.requests || []);
      if (incomingRes.status === 'fulfilled') setIncomingRequests(incomingRes.value.data?.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);
  useEffect(() => { if (user) fetchRecruiters(); /* eslint-disable-next-line */ }, [findTab]);

  const requestMap = useMemo(() => {
    const m = {};
    requests.forEach(r => { m[r.recruiterId] = r; });
    return m;
  }, [requests]);

  const teamMembers = useMemo(() => requests.filter(r => r.status === 'approved'), [requests]);
  const pendingReqs = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);

  const filtered = useMemo(() =>
    recruiters.filter(r =>
      !search ||
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(search.toLowerCase())
    ), [recruiters, search]);

  const sendRequest = async (recruiterId) => {
    // Enforce 6-member limit (approved + pending count toward limit)
    const activeCount = requests.filter(r => r.status === 'approved' || r.status === 'pending').length;
    if (activeCount >= TEAM_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }
    setSending(p => ({ ...p, [recruiterId]: true }));
    try {
      await axios.post('/api/coach-expert/team/send-request', { recruiterId }, { withCredentials: true });
      showToast('Request sent to recruiter!');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSending(p => ({ ...p, [recruiterId]: false }));
    }
  };

  const actOnIncoming = async (id, status) => {
    setActingIncoming(p => ({ ...p, [id]: status }));
    try {
      await axios.patch(`/api/coach-expert/team/incoming-join-requests/${id}`, { status }, { withCredentials: true });
      showToast(status === 'approved' ? 'Recruiter approved and added to team!' : 'Request rejected');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActingIncoming(p => ({ ...p, [id]: null }));
    }
  };

  // Open the full profile (with CV) for a team member / request row by recruiter id
  const openProfile = async (recruiterId) => {
    if (!recruiterId || profileLoadingId) return;
    setProfileLoadingId(recruiterId);
    try {
      const res = await axios.get(`/api/coach-expert/recruiter-profile/${recruiterId}`, { withCredentials: true });
      if (res.data?.success) setProfileModal(res.data.recruiter);
      else showToast('Could not load recruiter profile', 'error');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not load recruiter profile', 'error');
    } finally {
      setProfileLoadingId(null);
    }
  };

  const removeRequest = async (requestId) => {
    if (!window.confirm('Remove this recruiter from your team?')) return;
    setRemoving(p => ({ ...p, [requestId]: true }));
    try {
      await axios.delete(`/api/coach-expert/team/remove/${requestId}`, { withCredentials: true });
      showToast('Recruiter removed from team');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove', 'error');
    } finally {
      setRemoving(p => ({ ...p, [requestId]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <RecruiterProfileModal recruiter={profileModal} onClose={() => setProfileModal(null)} />
      {showUpgradeModal && <VendorUpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">My Team</h2>
              <p className="text-orange-100 text-sm">
                {teamMembers.length}/{TEAM_LIMIT} members · {pendingReqs.length} pending · {incomingRequests.filter(r => r.status === 'pending').length} join request{incomingRequests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            ['find', 'Find Recruiters', null],
            ['team', 'My Team', null],
            ['requests', 'Join Requests', incomingRequests.filter(r => r.status === 'pending').length],
          ].map(([key, label, badge]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === key ? 'bg-white text-orange-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {label}
              {badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === key ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === 'find' ? (
        /* ── Find Recruiters Tab ── */
        <div className="space-y-4">
          {/* Sub-tabs: All (any category, non-employee, active 72h) | Skill Fit */}
          <div className="flex gap-2">
            {[{ id: 'all', label: 'All' }, { id: 'fit', label: 'Skill Fit' }].map(t => (
              <button key={t.id} onClick={() => setFindTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  findTab === t.id ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            {findTab === 'all'
              ? 'All non-employee recruiters active in the last 72 hours, across every skill category.'
              : 'Recruiters that match your skill category.'}
          </p>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recruiters by name or email…"
                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">No eligible recruiters found</p>
              <p className="text-xs mt-1">
                {findTab === 'all'
                  ? 'No non-employee recruiters have been active in the last 72 hours right now.'
                  : 'No recruiters match your skill category. Try the “All” tab, or set your skill category in your profile.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(r => {
                const req = requestMap[r.id];
                const isPending  = req?.status === 'pending';
                const isApproved = req?.status === 'approved';
                const isRejected = req?.status === 'rejected';
                return (
                  <div key={r.id} className="relative bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                    {/* Teams connected count (top-right) */}
                    <span
                      title={`Connected to ${r.teamsConnected || 0} team${(r.teamsConnected || 0) === 1 ? '' : 's'}`}
                      className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                        (r.teamsConnected || 0) >= 3
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200'
                      }`}
                    >
                      <Users size={11} /> {r.teamsConnected || 0}/3 teams
                    </span>
                    <div className="flex items-start gap-3 pr-16">
                      {r.profilePhoto
                        ? <img src={r.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg flex-shrink-0">{(r.name || '?')[0].toUpperCase()}</div>
                      }
                      <div className="min-w-0">
                        <button onClick={() => setProfileModal(r)}
                          className="font-semibold text-gray-800 hover:text-orange-600 transition-colors text-left leading-tight truncate block w-full">
                          {r.name || '—'}
                        </button>
                        <p className="text-xs text-gray-500 truncate">{r.email}</p>
                        {r.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11} />{r.location}</p>}
                        {fmtLastActive(r.lastActiveDate) && (
                          <span className="flex items-center gap-1 text-xs text-green-600 mt-1">
                            <Activity size={10} /> Last active: {fmtLastActive(r.lastActiveDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {r.currentTitle && <p className="text-xs text-gray-600 font-medium">{r.currentTitle}</p>}

                    <div className="pt-1 flex items-center justify-between">
                      {isApproved ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                          <UserCheck size={13} /> In Team
                        </span>
                      ) : isPending ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                          <Clock size={13} /> Request Sent
                        </span>
                      ) : (
                        <button onClick={() => sendRequest(r.id)} disabled={sending[r.id]}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-full transition-all">
                          {sending[r.id] ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={13} />}
                          {isRejected ? 'Re-invite' : 'Add to Team'}
                        </button>
                      )}
                      <button onClick={() => setProfileModal(r)} className="text-xs text-gray-400 hover:text-orange-500 underline">View Profile</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'requests' ? (
        /* ── Join Requests Tab ── */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <UserPlus size={15} className="text-blue-600" /> Recruiter Join Requests
            </h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
              {incomingRequests.filter(r => r.status === 'pending').length} pending
            </span>
          </div>
          {incomingRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No join requests yet</p>
              <p className="text-xs mt-1">Recruiters with the same skill category can request to join your team</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {incomingRequests.map(req => {
                const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
                const SIcon = s.icon;
                return (
                  <div key={req.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                        {(req.recruiterName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{req.recruiterName || '—'}</p>
                        <p className="text-xs text-gray-400">{req.recruiterEmail}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Requested {fmtDate(req.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>
                        <SIcon size={11} />{s.label}
                      </span>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => actOnIncoming(req.id, 'approved')} disabled={!!actingIncoming[req.id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all">
                            {actingIncoming[req.id] === 'approved' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={12} />}
                            Approve
                          </button>
                          <button onClick={() => actOnIncoming(req.id, 'rejected')} disabled={!!actingIncoming[req.id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all">
                            {actingIncoming[req.id] === 'rejected' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── My Team Tab ── */
        <div className="space-y-4">
          {/* Team Members */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button onClick={() => setShowTeam(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 bg-orange-50 hover:bg-orange-100 transition-colors">
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <UserCheck size={16} className="text-green-600" /> Team Members
                <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{teamMembers.length}</span>
              </span>
              {showTeam ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showTeam && (
              teamMembers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <UserCheck size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No team members yet</p>
                  <p className="text-xs mt-1">Switch to "Find Recruiters" to invite members</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {teamMembers.map((req, i) => (
                    <div key={req.id} onClick={() => openProfile(req.recruiterId)}
                      className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-orange-50/50 transition-colors"
                      title="View full profile">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm hover:text-orange-600">{req.recruiterName}</p>
                          <p className="text-xs text-gray-400">{req.recruiterEmail}</p>
                        </div>
                        {profileLoadingId === req.recruiterId && <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Joined {fmtDate(req.updatedAt)}</span>
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full border border-green-200">Active</span>
                        <button onClick={(e) => { e.stopPropagation(); removeRequest(req.id); }} disabled={removing[req.id]}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all disabled:opacity-50">
                          {removing[req.id] ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* All Requests History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={15} className="text-orange-500" /> All Requests</h3>
              <span className="text-xs text-gray-400">{requests.length} total</span>
            </div>
            {requests.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No requests sent yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Recruiter</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r, i) => {
                      const s = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
                      return (
                        <tr key={r.id} onClick={() => openProfile(r.recruiterId)} title="View full profile"
                          className="border-t border-gray-100 hover:bg-orange-50/50 cursor-pointer">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800 hover:text-orange-600">
                            <span className="inline-flex items-center gap-2">{r.recruiterName || '—'}
                              {profileLoadingId === r.recruiterId && <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin inline-block" />}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{r.recruiterEmail || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{fmtDate(r.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button onClick={(e) => { e.stopPropagation(); removeRequest(r.id); }} disabled={removing[r.id]}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all disabled:opacity-50">
                              {removing[r.id] ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachTeam;
