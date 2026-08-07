import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import {
  Users, User, Briefcase, Calendar, Clock, FileText, ChevronDown, ChevronUp,
  RefreshCw, Search, BarChart3, CheckCircle, X, Mail, Phone, MapPin, DollarSign,
  GraduationCap, Building2,
} from 'lucide-react';

const rejectionStatuses = [
  'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject',
  'Background Verification Reject', 'Negotiation Reject', 'Offer Declined',
  'Test Reject', 'Client Drop', 'Candidate Drop', 'Duplicate',
];
const successStatuses = ['Offer Accepted', 'Joining'];
const statusColor = (s) => {
  if (successStatuses.includes(s)) return 'bg-green-100 text-green-700 border-green-200';
  if (rejectionStatuses.includes(s)) return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

// ── Candidate detail modal ──────────────────────────────────────────────────
// Nice labels & ordering for known candidate fields
const FIELD_LABELS = {
  emails: 'Email', email: 'Email', mob: 'Mobile', mobile: 'Mobile', dob: 'Date of Birth',
  curr_emp: 'Current Employer',
  rel_exp: 'Relevant Experience (yrs)', total_exp: 'Total Experience (yrs)',
  current_ctc: 'Current CTC', exp_ctc: 'Expected CTC',
  notice_period: 'Notice Period', last_day: 'Last Working Day',
  offer_hand: 'Offer in Hand', offer_amt: 'Offer Amount',
  curr_loc: 'Current Location', curr_state: 'Current State',
  pref_loc: 'Preferred Location', pref_state: 'Preferred State',
  skill_type: 'Skill Type',
  tech_category: 'Tech Category', tech_subcategory: 'Tech Subcategory',
  tech_skill: 'Tech Skills', tech_exp: 'Tech Experience',
  nontech_category: 'Non-Tech Category', nontech_subcategory: 'Non-Tech Subcategory',
  nontech_skill: 'Non-Tech Skills', nontech_exp: 'Non-Tech Experience',
  self_rate: 'Self Rating', highest_education: 'Highest Education',
  jr_number: 'JR Number', pan_number: 'PAN', rh_id: 'RH ID',
  recName: 'Recruiter', hr_name: 'HR Name', pos_name: 'Position', client: 'Client',
  statusa: 'Status', source: 'Source',
};
// Internal / duplicate / already-shown keys to skip in the generic dump
const HIDE_FIELDS = new Set([
  'id', 'recId', 'recEmail', 'recRole', 'clientspoc', 'pos_id', 'name', 'candidate',
  'cv_data', 'cv_url', 'datePosted', 'statusChangedAt', 'statusChangedBy', 'statusChangedByName',
  'statusaDate', 'updatedAt', 'matchEvaluatedAt', 'matchPercent', 'matchSummary', 'statusa',
  'hr_name',
]);
const humanize = (k) => FIELD_LABELS[k] || k.replace(/[_-]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
const fmtFieldValue = (v) => {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return v.filter(x => x !== null && x !== undefined && x !== '').join(', ');
  if (typeof v === 'object') {
    if (v._seconds) return new Date(v._seconds * 1000).toLocaleString('en-GB');
    return JSON.stringify(v);
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

const Row = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{value}</p>
    </div>
  );
};

const CandidateModal = ({ candidate, recruiterName, onClose }) => {
  if (!candidate) return null;
  const c = candidate;
  const raw = c.raw || {};

  // Ordered, non-empty fields from the full candidate document
  const orderedKeys = Object.keys(FIELD_LABELS).filter(k => !HIDE_FIELDS.has(k));
  const seen = new Set();
  const rows = [];
  orderedKeys.forEach(k => {
    if (seen.has(FIELD_LABELS[k])) return;
    const val = fmtFieldValue(raw[k]);
    if (val) { rows.push([humanize(k), val]); seen.add(FIELD_LABELS[k]); }
  });
  // Any remaining non-empty fields not already covered
  Object.keys(raw).sort().forEach(k => {
    if (HIDE_FIELDS.has(k) || FIELD_LABELS[k]) return;
    const val = fmtFieldValue(raw[k]);
    if (val) rows.push([humanize(k), val]);
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              {(c.candidate || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{c.candidate || '—'}</h3>
              <p className="text-blue-100 text-sm truncate">{c.positionTitle || '—'}{c.client ? ` · ${c.client}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white flex-shrink-0"><X size={22} /></button>
        </div>

        {/* Status + match */}
        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusColor(c.status)}`}>{c.status}</span>
          {c.matchPercent !== null && c.matchPercent !== undefined && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${c.matchPercent <= 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Match {c.matchPercent}%</span>
          )}
          {recruiterName && <span className="text-xs text-gray-400">by {recruiterName}</span>}
        </div>

        {/* Quick contact chips */}
        <div className="px-5 pt-3 flex flex-wrap gap-3 text-sm text-gray-600">
          {(raw.emails || c.email) && <span className="inline-flex items-center gap-1.5"><Mail size={14} className="text-blue-500" />{raw.emails || c.email}</span>}
          {(raw.mob || c.mobile) && <span className="inline-flex items-center gap-1.5"><Phone size={14} className="text-blue-500" />{raw.mob || c.mobile}</span>}
        </div>

        {/* Full details */}
        <div className="px-5 py-3 overflow-y-auto">
          {c.matchSummary && (
            <div className="mb-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-[11px] uppercase tracking-wide text-indigo-400 font-semibold mb-0.5">AI Match Summary</p>
              <p className="text-sm text-indigo-900">{c.matchSummary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {rows.map(([label, value], i) => <Row key={i} label={label} value={value} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-1">
            <Row label="Submitted On" value={c.submittedOn} />
            <Row label="Status Updated On" value={c.statusUpdatedOn} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          {c.cvUrl ? (
            <a href={c.cvUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
              <FileText size={15} /> View CV
            </a>
          ) : <span className="text-sm text-gray-400 self-center">No CV uploaded</span>}
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">Close</button>
        </div>
      </div>
    </div>
  );
};

const CoachRecruiterStatsContent = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // { candidate, recruiterName }

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/coach-expert/recruiter-stats', { withCredentials: true });
      if (res.data?.success) {
        setRecruiters(res.data.recruiters || []);
        setTotal(res.data.totalCandidates || 0);
        // Expand all by default
        const exp = {};
        (res.data.recruiters || []).forEach(r => { exp[r.recruiterEmail] = true; });
        setExpanded(exp);
      }
    } catch (err) {
      console.error('Error fetching recruiter stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (email) => setExpanded(prev => ({ ...prev, [email]: !prev[email] }));

  const filtered = recruiters.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (r.recruiterName?.toLowerCase().includes(q) || r.recruiterEmail?.toLowerCase().includes(q)) return true;
    return r.candidates.some(c =>
      (c.candidate || '').toLowerCase().includes(q) ||
      (c.positionTitle || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q));
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl"><BarChart3 className="text-white" size={26} /></div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Recruiter Stats</h2>
                <p className="text-blue-100 text-sm">Candidates your recruiters submitted on positions you assigned</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4">
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-bold text-white">{recruiters.length}</p>
                  <p className="text-xs text-blue-100">Recruiters</p>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-bold text-white">{total}</p>
                  <p className="text-xs text-blue-100">Candidates</p>
                </div>
              </div>
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold">
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </div>
          <div className="mt-4 relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recruiter, candidate, position, status…"
              className="w-full pl-9 pr-3 py-2 bg-white/20 placeholder-white/60 text-white border border-white/30 rounded-xl text-sm focus:outline-none focus:bg-white/30"
            />
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center text-gray-400">
            <Users size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No recruiter submissions yet</p>
            <p className="text-sm mt-1">Once recruiters you assigned submit candidates, they'll appear here.</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.recruiterEmail} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Recruiter header */}
              <button
                onClick={() => toggle(r.recruiterEmail)}
                className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {(r.recruiterName || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-gray-900 truncate">{r.recruiterName}</p>
                    <p className="text-xs text-gray-500 truncate">{r.recruiterEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">{r.candidateCount} candidate{r.candidateCount === 1 ? '' : 's'}</span>
                  {expanded[r.recruiterEmail] ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </div>
              </button>

              {/* Candidates table */}
              {expanded[r.recruiterEmail] && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-600">
                        <th className="text-left font-semibold px-4 py-2 whitespace-nowrap"><span className="inline-flex items-center gap-1"><User size={13} /> Candidate</span></th>
                        <th className="text-left font-semibold px-4 py-2 whitespace-nowrap"><span className="inline-flex items-center gap-1"><Briefcase size={13} /> Position</span></th>
                        <th className="text-left font-semibold px-4 py-2 whitespace-nowrap"><span className="inline-flex items-center gap-1"><CheckCircle size={13} /> Status</span></th>
                        <th className="text-left font-semibold px-4 py-2 whitespace-nowrap"><span className="inline-flex items-center gap-1"><Calendar size={13} /> Submitted</span></th>
                        <th className="text-left font-semibold px-4 py-2 whitespace-nowrap"><span className="inline-flex items-center gap-1"><Clock size={13} /> Status Updated</span></th>
                        <th className="text-left font-semibold px-4 py-2 whitespace-nowrap">CV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.candidates.map((c, i) => (
                        <tr key={i}
                          onClick={() => setSelected({ candidate: c, recruiterName: r.recruiterName })}
                          className="even:bg-gray-50/50 hover:bg-blue-50/60 border-t border-gray-100 cursor-pointer">
                          <td className="px-4 py-2.5 font-medium text-blue-700 whitespace-nowrap hover:underline">{c.candidate || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-700">
                            <div className="font-medium">{c.positionTitle || '—'}</div>
                            {c.client && <div className="text-xs text-gray-400">{c.client}</div>}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${statusColor(c.status)}`}>{c.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.submittedOn || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.statusUpdatedOn || '—'}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {c.cvUrl ? (
                              <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                                <FileText size={12} /> View CV
                              </a>
                            ) : <span className="text-xs text-gray-400">No CV</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CandidateModal
        candidate={selected?.candidate}
        recruiterName={selected?.recruiterName}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

// Page wrapper with sidebar + header (matches other coach/expert route pages)
const CoachRecruiterStats = () => {
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
        <Wrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <style>{`
          @keyframes slide-in { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

const Wrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">
        <CoachRecruiterStatsContent />
      </main>
      <Footer />
    </div>
  );
};

export default CoachRecruiterStats;
