import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import {
  Users, Mail, Phone, User, X, Search, RefreshCw,
  FileText, Download, Linkedin, Twitter, Globe, MapPin,
  Star, Award, Briefcase, Building, GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { CircularProgress } from '@mui/material';
import CoachExpertPageLayout from '../components/CoachExpertPageLayout';

// ── Page wrapper ──────────────────────────────────────────────────────────────
const CoachAllRecruiters = () => (
  <CoachExpertPageLayout>
    <CoachAllRecruitersContent />
  </CoachExpertPageLayout>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const completionColor = (p) => {
  if (p >= 80) return 'bg-green-500';
  if (p >= 50) return 'bg-blue-500';
  if (p >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
};

const catLabel = (r) => {
  const v = r.skillCategory;
  return Array.isArray(v) ? v.join(', ') : (v || '');
};

const InfoRow = ({ icon, label, value }) => (
  <div className="bg-gray-50 p-3 rounded-xl flex items-start gap-3">
    <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-all">{value || '—'}</p>
    </div>
  </div>
);

// ── Full-profile Modal ────────────────────────────────────────────────────────
const RecruiterModal = ({ recruiterId, basicInfo, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    if (!recruiterId) return;
    setLoading(true);
    setTab(0);
    setResumeOpen(false);
    axios.get(`/api/profile/recruiter/${recruiterId}/admin`, { withCredentials: true })
      .then(res => { if (res.data.success) setProfile(res.data.data); })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [recruiterId]);

  const p = profile;
  const name = p?.name || basicInfo?.name || 'Recruiter';

  const tabs = ['Personal', 'Professional', 'Skills', 'Experience'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-orange-100 text-sm">{p?.currentTitle || p?.experienceCategory || 'Recruiter'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Profile completion bar */}
        {p && (
          <div className="px-5 pt-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Profile Completion</span>
              <span className="text-xs font-bold text-orange-600">{p.profileCompletion || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${completionColor(p.profileCompletion || 0)}`} style={{ width: `${p.profileCompletion || 0}%` }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        {!loading && p && (
          <div className="flex border-b border-gray-200 px-5 mt-3 flex-shrink-0 overflow-x-auto">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  tab === i
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CircularProgress sx={{ color: '#f97316' }} />
              <p className="text-gray-400 text-sm">Loading profile…</p>
            </div>
          ) : !p ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-yellow-500" />
              </div>
              <h4 className="font-bold text-gray-700 mb-1">Profile not complete</h4>
              <p className="text-gray-400 text-sm">This recruiter hasn't filled in their profile yet.</p>
              {basicInfo && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4 text-left text-sm">
                  <p><span className="text-gray-500">Name:</span> <span className="font-medium ml-1">{basicInfo.name}</span></p>
                  <p className="mt-1"><span className="text-gray-500">Email:</span> <span className="font-medium ml-1">{basicInfo.email}</span></p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5">
              {/* ── Tab 0: Personal ── */}
              {tab === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={<Mail size={16} />}    label="Email"     value={p.email} />
                    <InfoRow icon={<Phone size={16} />}   label="Phone"     value={p.phone} />
                    <InfoRow icon={<MapPin size={16} />}  label="Location"  value={[p.location, p.country].filter(Boolean).join(', ')} />
                    <InfoRow icon={<Building size={16} />} label="Company"  value={p.currentCompany} />
                  </div>

                  {p.bio && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Bio</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{p.bio}</p>
                    </div>
                  )}

                  {/* Social links */}
                  <div className="flex flex-wrap gap-2">
                    {p.linkedin && (
                      <a href={p.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                        <Linkedin size={15} /> LinkedIn Profile
                      </a>
                    )}
                    {p.twitter && (
                      <a href={p.twitter} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 rounded-xl text-sm font-medium hover:bg-sky-100 transition-colors">
                        <Twitter size={15} /> Twitter
                      </a>
                    )}
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
                        <Globe size={15} /> Website
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-600">{p.totalPositions || 0}</p>
                      <p className="text-xs text-blue-500 font-medium mt-0.5">Positions</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{p.totalCandidates || 0}</p>
                      <p className="text-xs text-green-500 font-medium mt-0.5">Candidates</p>
                    </div>
                  </div>

                  {/* Resume */}
                  {(p.resume || p.resumeUrl) && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><FileText size={12} /> Resume</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setResumeOpen(o => !o)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all"
                        >
                          <FileText size={14} /> {resumeOpen ? 'Hide Resume' : 'View Resume'}
                        </button>
                        {p.resume && (
                          <button
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = `data:application/pdf;base64,${p.resume}`;
                              a.download = p.resumeFileName || 'resume.pdf';
                              a.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
                          >
                            <Download size={14} /> Download
                          </button>
                        )}
                      </div>
                      {resumeOpen && (
                        <div className="mt-3 border-2 border-gray-200 rounded-xl overflow-hidden">
                          <iframe
                            src={p.resume ? `data:application/pdf;base64,${p.resume}` : p.resumeUrl}
                            title="Resume"
                            className="w-full h-96"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 1: Professional ── */}
              {tab === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={<Briefcase size={16} />} label="Current Title"        value={p.currentTitle} />
                    <InfoRow icon={<Award size={16} />}     label="Years of Experience"  value={p.yearsOfExperience} />
                    <InfoRow icon={<Star size={16} />}      label="Experience Category"  value={p.experienceCategory} />
                    <InfoRow icon={<Users size={16} />}     label="Specialization"        value={p.specialization} />
                  </div>

                  {p.targetIndustries?.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2">Target Industries</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.targetIndustries.map((ind, i) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{ind}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.recruitmentMethods?.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2">Recruitment Methods</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.recruitmentMethods.map((m, i) => (
                          <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {p.education?.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <GraduationCap size={15} className="text-orange-500" /> Education
                      </p>
                      <div className="space-y-2">
                        {p.education.map((edu, i) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-xl text-sm">
                            <p className="font-semibold text-gray-800">{edu.degree || 'Degree'}</p>
                            <p className="text-gray-500">{edu.institutionName || edu.institution || 'Institution'}</p>
                            {edu.year && <p className="text-xs text-gray-400 mt-0.5">{edu.year}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 2: Skills ── */}
              {tab === 2 && (
                <div>
                  {p.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {p.skills.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-sm font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Star size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No skills added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 3: Experience ── */}
              {tab === 3 && (
                <div>
                  {p.workExperience?.length > 0 ? (
                    <div className="space-y-3">
                      {p.workExperience.map((exp, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{exp.jobTitle || exp.position || 'Position'}</p>
                              <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                                <Building size={12} /> {exp.companyName || exp.company || 'Company'}
                              </p>
                              {exp.location && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <MapPin size={11} /> {exp.location}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 bg-white px-2 py-1 rounded-lg border whitespace-nowrap">
                              {exp.startDate} – {exp.isCurrent ? 'Present' : (exp.endDate || '?')}
                            </p>
                          </div>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No work experience added yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-orange-700 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main content ──────────────────────────────────────────────────────────────
const CoachAllRecruitersContent = () => {
  const { user } = useContext(UserStateContext);
  const [recruiters, setRecruiters]         = useState([]);
  const [coachCategories, setCoachCategories] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [selectedId, setSelectedId]         = useState(null);
  const [selectedBasic, setSelectedBasic]   = useState(null);
  const [expandedRows, setExpandedRows]     = useState({});
  const [clientFilters, setClientFilters]   = useState({});
  const [posFilters, setPosFilters]         = useState({});

  const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  const setClientFilter = (id, val) => setClientFilters(prev => ({ ...prev, [id]: val }));
  const setPosFilter   = (id, val) => setPosFilters(prev => ({ ...prev, [id]: val }));

  const fetchRecruiters = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/coach-expert/recruiters/all', { withCredentials: true });
      if (res.data.success) {
        setRecruiters(res.data.recruiters || []);
        setCoachCategories(res.data.coachCategories || []);
      }
    } catch (err) {
      console.error('Failed to fetch recruiters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchRecruiters(); }, [user]);

  const filtered = useMemo(() =>
    recruiters.filter(r =>
      !search ||
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
      catLabel(r).toLowerCase().includes(search.toLowerCase())
    ),
  [recruiters, search]);

  const openModal = (r) => { setSelectedId(r.id); setSelectedBasic(r); };
  const closeModal = () => { setSelectedId(null); setSelectedBasic(null); };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-5 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">All Recruiters</h2>
              <p className="text-orange-100 text-sm">
                {recruiters.length} recruiter{recruiters.length !== 1 ? 's' : ''} matching your skill{coachCategories.length !== 1 ? ' categories' : ' category'}
                {coachCategories.length > 0 && `: ${coachCategories.join(', ')}`}
              </p>
            </div>
          </div>
          <button onClick={fetchRecruiters} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or skill category…"
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress sx={{ color: '#f97316' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{search ? 'No results found' : 'No recruiters found matching your skill category'}</p>
          {!search && coachCategories.length === 0 && (
            <p className="text-sm mt-1">Set a skill category in your profile to see matching recruiters.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-orange-50 to-orange-100 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Skill Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Positions</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <React.Fragment key={r.id}>
                    <tr className="border-t border-gray-100 hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{r.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-gray-400 flex-shrink-0" />
                          {r.email || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {catLabel(r)
                          ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{catLabel(r)}</span>
                          : <span className="text-gray-400 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {(r.positionCount || 0) > 0 ? (
                          <button
                            onClick={() => toggleExpand(r.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs font-bold transition-colors"
                          >
                            <Briefcase size={11} />
                            {r.positionCount} position{r.positionCount !== 1 ? 's' : ''}
                            <ChevronRight size={12} className={`transition-transform ${expandedRows[r.id] ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">0 positions</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openModal(r)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all">
                          View
                        </button>
                      </td>
                    </tr>

                    {/* Expanded positions row */}
                    {expandedRows[r.id] && r.positions?.length > 0 && (() => {
                      const uniqueClients = [...new Set(r.positions.map(p => p.client).filter(Boolean))].sort();
                      const activeClient = clientFilters[r.id] || '';
                      const posSearch = posFilters[r.id] || '';
                      const visiblePositions = r.positions.filter(p => {
                        if (activeClient && p.client !== activeClient) return false;
                        if (posSearch && !(p.positionTitle || '').toLowerCase().includes(posSearch.toLowerCase())) return false;
                        return true;
                      });
                      return (
                        <tr className="bg-blue-50/60 border-t border-blue-100">
                          <td colSpan={7} className="px-6 py-4">
                            {/* Header + filter */}
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                              <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                <Briefcase size={11} /> Positions {r.name} is working on
                                <span className="ml-1 text-blue-400 font-normal">({visiblePositions.length} of {r.positions.length})</span>
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Position name search */}
                                <div className="relative">
                                  <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    value={posSearch}
                                    onChange={e => setPosFilter(r.id, e.target.value)}
                                    placeholder="Search position…"
                                    className="text-xs border border-blue-200 rounded-lg pl-6 pr-6 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-500 w-36"
                                  />
                                  {posSearch && (
                                    <button onClick={() => setPosFilter(r.id, '')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                      <X size={10} className="text-gray-400" />
                                    </button>
                                  )}
                                </div>

                                {/* Client dropdown */}
                                {uniqueClients.length > 0 && (
                                  <>
                                    <span className="text-xs text-gray-400">|</span>
                                    <select
                                      value={activeClient}
                                      onChange={e => setClientFilter(r.id, e.target.value)}
                                      className="text-xs border border-blue-200 rounded-lg px-2 py-1 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500"
                                    >
                                      <option value="">All Clients</option>
                                      {uniqueClients.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  </>
                                )}

                                {(activeClient || posSearch) && (
                                  <button
                                    onClick={() => { setClientFilter(r.id, ''); setPosFilter(r.id, ''); }}
                                    className="text-xs text-red-400 hover:text-red-600 underline"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Position cards */}
                            {visiblePositions.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No positions for this client.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {visiblePositions.map((pos, pi) => (
                                  <div key={pi} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs shadow-sm">
                                    <span className="font-semibold text-gray-800">{pos.positionTitle}</span>
                                    {pos.client && (
                                      <span className="text-gray-400">· {pos.client}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })()}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedId && (
        <RecruiterModal
          recruiterId={selectedId}
          basicInfo={selectedBasic}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CoachAllRecruiters;
