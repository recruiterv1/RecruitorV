import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Users, CheckCircle, XCircle, Clock, RefreshCw, X,
  MapPin, Briefcase, Phone, Mail, ExternalLink, AlertCircle,
  GraduationCap, Search, UserPlus, Send, FileText, Download, Activity
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';

const fmtDate = (ts) => {
  if (!ts) return '—';
  const ms = ts._seconds ? ts._seconds * 1000 : ts.seconds ? ts.seconds * 1000 : null;
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

const STATUS_STYLE = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  approved: { label: 'Approved', cls: 'bg-green-100  text-green-700  border-green-200',  icon: CheckCircle },
  rejected: { label: 'Declined', cls: 'bg-red-100    text-red-700    border-red-200',    icon: XCircle },
};

// ── Coach/Expert Profile Modal ───────────────────────────────────────────────
const CoachProfileModal = ({ coach, onClose }) => {
  const [cvOpen, setCvOpen] = useState(false);
  if (!coach) return null;

  const hasResume = coach.resume || coach.resumeUrl;
  const cvSrc = coach.resume ? `data:application/pdf;base64,${coach.resume}` : coach.resumeUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 rounded-t-2xl text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
          <div className="flex items-center gap-4">
            {coach.profilePhoto
              ? <img src={coach.profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40 flex-shrink-0" />
              : <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">{(coach.name || '?')[0].toUpperCase()}</div>
            }
            <div>
              <h3 className="text-xl font-bold">{coach.name || '—'}</h3>
              <p className="text-blue-200 text-sm">{coach.currentTitle || '—'}</p>
              {coach.role && <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">{coach.role}</span>}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {coach.email    && <div className="flex items-center gap-2 text-gray-600"><Mail size={14} className="text-blue-400 flex-shrink-0" /><span className="truncate">{coach.email}</span></div>}
            {coach.phone    && <div className="flex items-center gap-2 text-gray-600"><Phone size={14} className="text-blue-400 flex-shrink-0" />{coach.phone}</div>}
            {coach.location && <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-blue-400 flex-shrink-0" />{coach.location}</div>}
            {coach.yearsOfExperience && <div className="flex items-center gap-2 text-gray-600"><Briefcase size={14} className="text-blue-400 flex-shrink-0" />{coach.yearsOfExperience} yrs experience</div>}
          </div>

          {/* Bio */}
          {coach.bio && <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-3 leading-relaxed">{coach.bio}</p>}

          {/* Skill Category */}
          {coach.skillCategory && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skill Category</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(coach.skillCategory) ? coach.skillCategory : [coach.skillCategory]).map(s => (
                  <span key={s} className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {coach.skills?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {coach.skills.map((s, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{s}</span>)}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {coach.workExperience?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Briefcase size={12} /> Work Experience</p>
              <div className="space-y-2">
                {coach.workExperience.map((w, i) => (
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
          {coach.education?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><GraduationCap size={12} /> Education</p>
              <div className="space-y-2">
                {coach.education.map((e, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">{e.degree || e.qualification || '—'}</p>
                    <p className="text-xs text-gray-500">{e.institution || e.school || e.college || ''}{e.year || e.passoutYear ? ` · ${e.year || e.passoutYear}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn */}
          {coach.linkedin && (
            <a href={coach.linkedin} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <ExternalLink size={14} /> LinkedIn Profile
            </a>
          )}

          {/* CV / Resume */}
          {hasResume ? (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FileText size={12} /> Resume / CV</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setCvOpen(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all">
                    <FileText size={14} /> {cvOpen ? 'Hide CV' : 'View CV'}
                  </button>
                  {coach.resume && (
                    <button onClick={() => {
                      const a = document.createElement('a');
                      a.href = `data:application/pdf;base64,${coach.resume}`;
                      a.download = coach.resumeFileName || 'resume.pdf';
                      a.click();
                    }} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-all">
                      <Download size={14} /> Download
                    </button>
                  )}
                  {coach.resumeUrl && !coach.resume && (
                    <a href={coach.resumeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-all">
                      <ExternalLink size={14} /> Open
                    </a>
                  )}
                </div>
                {cvOpen && (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <iframe
                      src={cvSrc}
                      title="Resume"
                      className="w-full h-[500px]"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <FileText size={14} /> No resume uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Layout wrapper ───────────────────────────────────────────────────────────
const RecruiterJoinTeam = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <Sidebar />
        </aside>
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in"><Sidebar /></aside>
          </div>
        )}
        <RecruiterJoinTeamContent isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <style>{`
          @keyframes slide-in { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

const RecruiterJoinTeamContent = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">
        <RecruiterJoinTeamPage />
      </main>
      <Footer />
    </div>
  );
};

// ── Page content ─────────────────────────────────────────────────────────────
const RecruiterJoinTeamPage = () => {
  const { user } = useContext(UserStateContext);
  const [tab, setTab] = useState('find'); // 'find' | 'requests' | 'invitations'

  // Find tab state
  const [coaches, setCoaches] = useState([]);
  const [coachHint, setCoachHint] = useState('');
  const [findTab, setFindTab] = useState('fit'); // 'fit' (Skill Fit) | 'all'
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState({});

  // My requests tab state
  const [myRequests, setMyRequests] = useState([]);

  // Invitations tab state (coach-initiated, existing flow)
  const [invitations, setInvitations] = useState([]);
  const [responding, setResponding] = useState({});
  const [leaving, setLeaving] = useState({});

  const [profileModal, setProfileModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch the coach/expert list for the current Find sub-tab.
  //   'all' → any skill category, active in last 48h;  'fit' → skill-category match.
  const fetchCoaches = async (which = findTab) => {
    try {
      const url = `/api/coach-expert/team/available-coaches${which === 'all' ? '?scope=all' : ''}`;
      const res = await axios.get(url, { withCredentials: true });
      setCoaches(res.data?.coaches || []);
      setCoachHint(res.data?.hint || '');
    } catch (e) { console.error(e); }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [coachRes, myReqRes, invRes] = await Promise.allSettled([
        axios.get(`/api/coach-expert/team/available-coaches${findTab === 'all' ? '?scope=all' : ''}`, { withCredentials: true }),
        axios.get('/api/coach-expert/team/recruiter-my-requests', { withCredentials: true }),
        axios.get('/api/coach-expert/team/join-requests', { withCredentials: true }),
      ]);
      if (coachRes.status === 'fulfilled') {
        setCoaches(coachRes.value.data?.coaches || []);
        setCoachHint(coachRes.value.data?.hint || '');
      }
      if (myReqRes.status === 'fulfilled') setMyRequests(myReqRes.value.data?.requests || []);
      if (invRes.status === 'fulfilled') setInvitations(invRes.value.data?.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);
  // Re-fetch just the coach list when the Find sub-tab changes.
  useEffect(() => { if (user) fetchCoaches(); /* eslint-disable-next-line */ }, [findTab]);

  const sendJoinRequest = async (coach) => {
    setSending(p => ({ ...p, [coach.email]: true }));
    try {
      await axios.post('/api/coach-expert/team/recruiter-join-request', {
        coachEmail: coach.email,
        coachRole: coach.role,
      }, { withCredentials: true });
      showToast('Join request sent!');
      setCoaches(prev => prev.map(c => c.email === coach.email ? { ...c, alreadyRequested: true } : c));
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSending(p => ({ ...p, [coach.email]: false }));
    }
  };

  const leaveTeam = async (id) => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    setLeaving(p => ({ ...p, [id]: true }));
    try {
      await axios.delete(`/api/coach-expert/team/leave/${id}`, { withCredentials: true });
      showToast('You have left the team');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave team', 'error');
    } finally {
      setLeaving(p => ({ ...p, [id]: false }));
    }
  };

  const respondInvitation = async (id, status) => {
    setResponding(p => ({ ...p, [id]: status }));
    try {
      await axios.patch(`/api/coach-expert/team/respond/${id}`, { status }, { withCredentials: true });
      showToast(status === 'approved' ? 'You joined the team!' : 'Invitation declined');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setResponding(p => ({ ...p, [id]: null }));
    }
  };

  const filtered = coaches.filter(c =>
    !c.alreadyRequested && (
      !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const pendingInvitations = invitations.filter(r => r.status === 'pending');
  const pendingCount = pendingInvitations.length;

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

      <CoachProfileModal coach={profileModal} onClose={() => setProfileModal(null)} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Join a Team</h2>
              <p className="text-blue-200 text-sm">
                {coaches.length} coach{coaches.length !== 1 ? 'es' : ''}/experts available · {myRequests.filter(r => r.status === 'pending').length} pending request{myRequests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            ['find', 'Find Coaches/Experts'],
            ['requests', `My Requests${myRequests.length ? ` (${myRequests.length})` : ''}`],
            ['invitations', `Invitations${pendingCount ? ` (${pendingCount})` : ''}`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === key ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === 'find' ? (
        /* ── Find Coaches/Experts ── */
        <div className="space-y-4">
          {/* Sub-tabs: All (any category, active 48h) | Skill Fit (matching category) */}
          <div className="flex gap-2">
            {[{ id: 'all', label: 'All' }, { id: 'fit', label: 'Skill Fit' }].map(t => (
              <button key={t.id} onClick={() => setFindTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  findTab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            {findTab === 'all'
              ? 'All coaches & experts active in the last 48 hours, across every skill category.'
              : 'Coaches & experts that match your profile skill category.'}
          </p>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or location…"
                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">No coaches or experts available</p>
              <p className="text-xs mt-1">
                {coachHint || (findTab === 'all'
                  ? 'No coaches/experts have been active in the last 48 hours right now. Check back soon.'
                  : 'No coaches/experts match your skill category yet. Try the “All” tab, or set your skill category in your profile.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(c => (
                <div key={c.email} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3 flex flex-col">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3">
                    {c.profilePhoto
                      ? <img src={c.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">{(c.name || '?')[0].toUpperCase()}</div>
                    }
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setProfileModal(c)} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors text-left block truncate w-full">
                        {c.name || '—'}
                      </button>
                      <p className="text-xs text-gray-500 truncate">{c.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.role === 'Expert' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{c.role}</span>
                        {c.location && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{c.location}</span>}
                      </div>
                      {fmtLastActive(c.lastActiveDate) && (
                        <span className="flex items-center gap-1 text-xs text-green-600 mt-1">
                          <Activity size={10} /> Last active: {fmtLastActive(c.lastActiveDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.currentTitle && <p className="text-xs text-gray-600 font-medium">{c.currentTitle}</p>}

                  <div className="pt-1 flex items-center justify-between mt-auto">
                    {c.alreadyRequested ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                        <Clock size={12} /> Request Sent
                      </span>
                    ) : (
                      <button onClick={() => sendJoinRequest(c)} disabled={sending[c.email]}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-full transition-all">
                        {sending[c.email] ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={12} />}
                        Request to Join
                      </button>
                    )}
                    <button onClick={() => setProfileModal(c)} className="text-xs text-gray-400 hover:text-blue-500 underline">View Profile</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : tab === 'requests' ? (
        /* ── My Requests ── */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
            <Send size={16} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">My Join Requests</h3>
            <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">{myRequests.length}</span>
          </div>
          {myRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Send size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No requests sent yet</p>
              <p className="text-xs mt-1">Go to "Find Coaches/Experts" to send a join request</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Coach / Expert</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r, i) => {
                    const s = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
                    const Icon = s.icon;
                    return (
                      <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{r.coachName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.coachEmail || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.coachRole === 'Expert' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{r.coachRole || 'Coach'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>
                            <Icon size={11} />{s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{fmtDate(r.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : (
        /* ── Invitations (coach-initiated) ── */
        <div className="space-y-4">
          {/* Pending invitations */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
              <Clock size={16} className="text-yellow-600" />
              <h3 className="font-bold text-gray-800">Pending Invitations</h3>
              <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">{pendingInvitations.length}</span>
            </div>
            {pendingInvitations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No pending invitations</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingInvitations.map(req => (
                  <div key={req.id} className="px-5 py-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {req.coachProfilePhoto
                        ? <img src={req.coachProfilePhoto} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">{(req.coachName || '?')[0].toUpperCase()}</div>
                      }
                      <div className="min-w-0">
                        <button onClick={() => setProfileModal({ ...req, name: req.coachName, email: req.coachEmail, profilePhoto: req.coachProfilePhoto, bio: req.coachBio, location: req.coachLocation, skillCategory: req.coachSkillCategory, skills: req.coachSkills, currentTitle: req.coachCurrentTitle, workExperience: req.coachWorkExperience, education: req.coachEducation, linkedin: req.coachLinkedin, yearsOfExperience: req.coachYearsOfExperience })}
                          className="font-semibold text-gray-800 hover:text-blue-600 transition-colors text-left block truncate">
                          {req.coachName || '—'}
                        </button>
                        <p className="text-xs text-gray-400">{req.coachEmail}</p>
                        {req.coachLocation && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11} />{req.coachLocation}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">Invited {fmtDate(req.createdAt)}</p>
                        {req.coachBio && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-1.5 max-h-20 overflow-y-auto leading-relaxed">{req.coachBio}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => respondInvitation(req.id, 'approved')} disabled={!!responding[req.id]}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all">
                        {responding[req.id] === 'approved' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={14} />}
                        Accept
                      </button>
                      <button onClick={() => respondInvitation(req.id, 'rejected')} disabled={!!responding[req.id]}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all">
                        {responding[req.id] === 'rejected' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle size={14} />}
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {invitations.filter(r => r.status !== 'pending').length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Invitation History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-600">Coach</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.filter(r => r.status !== 'pending').map(req => {
                      const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
                      const Icon = s.icon;
                      return (
                        <tr key={req.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{req.coachName || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{req.coachEmail}</td>
                          <td className="px-4 py-3"><span className={`flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}><Icon size={11} />{s.label}</span></td>
                          <td className="px-4 py-3 text-gray-400">{fmtDate(req.updatedAt)}</td>
                          <td className="px-4 py-3">
                            {req.status === 'approved' && (
                              <button
                                onClick={() => leaveTeam(req.id)}
                                disabled={leaving[req.id]}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                              >
                                {leaving[req.id] ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <XCircle size={12} />}
                                Leave Team
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterJoinTeam;
