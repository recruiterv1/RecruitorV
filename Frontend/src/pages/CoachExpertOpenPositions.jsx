import React, { useState, useEffect, useMemo, useContext } from 'react';
import Sidebar from '../pages/Sidebar';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import {
  Briefcase, MapPin, IndianRupee, BadgePercent, Calendar,
  Check, Send, Clock, Ban, LayoutDashboard, ClipboardList,
  Users, DollarSign, TrendingUp, BarChart2, UserPlus,
  Zap, Building2, Search, X, RefreshCw, Filter, ChevronDown,
  Info, UserCheck,
} from 'lucide-react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import ViewPositionModal from './ViewPositionModal';
import axios_ from 'axios';
import { formatCommission } from '../lib/commission';
import { AssignedPositionsContent } from './CoachExpertAssignedPositions';

// ─── helpers ────────────────────────────────────────────────────────────────
const formatDate = (datePosted) => {
  if (!datePosted?._seconds) return '';
  return new Date(datePosted._seconds * 1000).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const commissionColor = (v) =>
  v >= 10
    ? { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    : v >= 5
    ? { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
    : { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

// ─── Sidebar (self-contained, orange) ───────────────────────────────────────
// ─── helpers ─────────────────────────────────────────────────────────────────
const getCatColor = (cat) => {
  const map = {
    'Immediate Hiring': 'bg-red-100 text-red-700 border-red-200',
    'Interview Drives': 'bg-purple-100 text-purple-700 border-purple-200',
    'Fast Response':    'bg-blue-100 text-blue-700 border-blue-200',
    'High Commission':  'bg-green-100 text-green-700 border-green-200',
    'New':              'bg-teal-100 text-teal-700 border-teal-200',
  };
  return map[cat] || 'bg-gray-100 text-gray-600 border-gray-200';
};

// Hover info icon → lists people (name / email / phone) for a position
const PeopleInfo = ({ people = [] }) => {
  const [show, setShow] = useState(false);
  if (!people.length) return null;
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={13} style={{ color: '#ea580c', cursor: 'help' }} />
      {show && (
        <div style={{
          position: 'absolute', bottom: '150%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, width: 250, maxHeight: 260, overflowY: 'auto',
          background: '#111827', color: '#fff', borderRadius: 10, padding: '8px 10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)', textAlign: 'left',
        }}>
          {people.map((p, i) => (
            <div key={i} style={{ padding: '5px 0', borderBottom: i < people.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{p.name}{p.type ? ` · ${p.type}` : ''}</div>
              {p.email && <div style={{ fontSize: 11, opacity: 0.85, wordBreak: 'break-all' }}>{p.email}</div>}
              {p.phone && <div style={{ fontSize: 11, opacity: 0.85 }}>{p.phone}</div>}
            </div>
          ))}
        </div>
      )}
    </span>
  );
};

// ─── Positions card grid (content) ──────────────────────────────────────────
const OpenPositionsContent = () => {
  const { user } = useContext(UserStateContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [people, setPeople] = useState({}); // pos_id -> { recruiters:[], coaches:[] }
  const navigate = useNavigate();

  // filter/search state
  const [search,        setSearch]        = useState('');
  const [filterClient,  setFilterClient]  = useState('');
  const [filterCat,     setFilterCat]     = useState('');
  const [filterLoc,     setFilterLoc]     = useState('');
  const [filterDateFrom,setFilterDateFrom]= useState('');
  const [filterDateTo,  setFilterDateTo]  = useState('');
  const [showFilters,   setShowFilters]   = useState(false);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchJobs = () => {
    setLoading(true);
    // All positions (no skill restriction); the "Matching" tab filters client-side.
    axios.get('/candidate/pos/show-for-user?scope=all', { withCredentials: true })
      .then(r => setJobs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user?.email) return;
    fetchJobs();
    axios.get('/api/direct-coach-request/my-requests', { withCredentials: true })
      .then(r => {
        const map = {};
        (r.data.data || []).forEach(req => { map[req.positionId] = req.status; });
        setMyRequests(map);
      })
      .catch(() => {});
    axios.get('/api/coach-expert/position-people', { withCredentials: true })
      .then(r => setPeople(r.data?.people || {}))
      .catch(() => {});
  }, [user?.email]);

  const handleAssignMe = async (e, posId) => {
    e.stopPropagation();
    if (assigningId) return;
    setAssigningId(posId);
    try {
      await axios.post('/api/direct-coach-request', {
        positionId: posId,
        roleCategory: user?.roleCategory,
      }, { withCredentials: true });
      // Auto-approved — mark approved so it disappears from Open Positions and
      // shows under Assigned Positions.
      setMyRequests(prev => ({ ...prev, [posId]: 'approved' }));
      showToast('Assigned! Find it under Assigned Positions.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign.', false);
    } finally {
      setAssigningId(null);
    }
  };

  // ── Tabs: All | Matching Positions (sub-tabs = the user's profile skill cats) ──
  const skillCats = useMemo(() => {
    const sc = user?.skillCategory;
    return [...new Set((Array.isArray(sc) ? sc : sc ? [sc] : []).map(s => String(s).trim()).filter(Boolean))];
  }, [user]);
  const [mainTab, setMainTab] = useState('all');   // 'all' | 'matching'
  const [matchCat, setMatchCat] = useState('');
  useEffect(() => { if (skillCats.length && !matchCat) setMatchCat(skillCats[0]); }, [skillCats]);

  // Positions the coach/expert has already self-assigned (auto-approved) are hidden
  // from Open Positions — they live under Assigned Positions now.
  const openJobs = useMemo(
    () => jobs.filter(j => myRequests[j.pos_id] !== 'approved'),
    [jobs, myRequests]
  );

  const tabJobs = useMemo(() => {
    if (mainTab === 'all') return openJobs;
    const cat = (matchCat || '').toLowerCase().trim();
    if (!cat) return [];
    return openJobs.filter(j => (j.skill_category || '').toLowerCase().trim() === cat);
  }, [openJobs, mainTab, matchCat]);
  const matchCounts = useMemo(() => {
    const m = {};
    skillCats.forEach(c => { const cl = c.toLowerCase().trim(); m[c] = openJobs.filter(j => (j.skill_category || '').toLowerCase().trim() === cl).length; });
    return m;
  }, [openJobs, skillCats]);

  // derived filter options (from the active tab's positions)
  const clientOptions = useMemo(() => [...new Set(tabJobs.map(j => j.client).filter(Boolean))].sort(), [tabJobs]);
  const catOptions    = useMemo(() => [...new Set(tabJobs.map(j => j.pos_cat).filter(Boolean))].sort(), [tabJobs]);
  const locOptions    = useMemo(() => {
    const s = new Set();
    tabJobs.forEach(j => {
      const arr = Array.isArray(j.location) ? j.location : j.location ? [j.location] : [];
      arr.forEach(l => s.add(l));
    });
    return [...s].sort();
  }, [tabJobs]);

  const activeFilterCount = [filterClient, filterCat, filterLoc, filterDateFrom, filterDateTo].filter(Boolean).length;

  const clearFilters = () => {
    setFilterClient(''); setFilterCat(''); setFilterLoc('');
    setFilterDateFrom(''); setFilterDateTo('');
  };

  const sortedJobs = useMemo(() => {
    const filtered = tabJobs.filter(job => {
      const loc = Array.isArray(job.location) ? job.location.join(' ') : job.location || '';
      if (search) {
        const q = search.toLowerCase();
        if (
          !(job.position || '').toLowerCase().includes(q) &&
          !(job.client || '').toLowerCase().includes(q) &&
          !loc.toLowerCase().includes(q)
        ) return false;
      }
      if (filterClient && job.client !== filterClient) return false;
      if (filterCat    && job.pos_cat !== filterCat)   return false;
      if (filterLoc    && !loc.includes(filterLoc))    return false;
      if (filterDateFrom || filterDateTo) {
        const ts = (job.datePosted?._seconds || 0) * 1000;
        if (filterDateFrom && ts < new Date(filterDateFrom).getTime()) return false;
        if (filterDateTo   && ts > new Date(filterDateTo).getTime() + 86399999) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aI = a.pos_cat === 'Immediate Hiring' ? 1 : 0;
      const bI = b.pos_cat === 'Immediate Hiring' ? 1 : 0;
      if (bI !== aI) return bI - aI;
      return (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0);
    });
  }, [tabJobs, search, filterClient, filterCat, filterLoc, filterDateFrom, filterDateTo]);

  const renderAssignBtn = (posId) => {
    const status = myRequests[posId];
    const isBusy = assigningId === posId;
    if (status === 'approved') return <span className="flex items-center gap-1 text-green-700 font-semibold text-xs"><Check size={12}/> Approved</span>;
    if (status === 'pending')  return <span className="flex items-center gap-1 text-yellow-600 font-semibold text-xs"><Clock size={12}/> Requested</span>;
    if (status === 'waitlist') return <span className="flex items-center gap-1 text-orange-600 font-semibold text-xs"><Clock size={12}/> Waitlisted</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-red-600 font-semibold text-xs"><Ban size={12}/> Rejected</span>;
    return (
      <button
        onClick={(e) => handleAssignMe(e, posId)}
        disabled={isBusy || !!assigningId}
        className="flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        {isBusy ? <CircularProgress size={10} color="inherit"/> : <Send size={10}/>}
        Assign Me
      </button>
    );
  };

  return (
    <div className="w-full py-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {selectedPosition && (
        <ViewPositionModal
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
          onAssignMe={async (e) => {
            if (e) e.stopPropagation();
            if (assigningId) return;
            setAssigningId(selectedPosition.pos_id);
            try {
              await axios.post('/api/direct-coach-request', {
                positionId: selectedPosition.pos_id,
                roleCategory: user?.roleCategory,
              }, { withCredentials: true });
              setMyRequests(prev => ({ ...prev, [selectedPosition.pos_id]: 'pending' }));
              showToast('Request sent to ClientSPOC!');
            } catch (err) {
              showToast(err.response?.data?.message || 'Failed to send request.', false);
            } finally {
              setAssigningId(null);
            }
          }}
          assignStatus={myRequests[selectedPosition?.pos_id]}
          isAssigning={assigningId === selectedPosition?.pos_id}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-5 mb-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl"><Briefcase size={24} className="text-white"/></div>
            <div>
              <h3 className="text-xl font-bold text-white">Open Positions</h3>
              <p className="text-orange-100 text-sm">{sortedJobs.length} of {tabJobs.length} positions — click a card to view details</p>
            </div>
          </div>
          <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15}/> Refresh
          </button>
        </div>

        {/* Search + filter toggle */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by position, client or location…"
              className="w-full pl-9 pr-8 py-2 bg-white/20 placeholder-white/60 text-white border border-white/30 rounded-xl text-sm focus:outline-none focus:bg-white/30"/>
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-white/70"/></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${showFilters ? 'bg-white text-orange-700 border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}>
            <Filter size={14}/>
            Filters
            {activeFilterCount > 0 && <span className="ml-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
            <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* ── Tabs: All | Matching Positions ── */}
      <div className="flex items-center gap-2 mb-3">
        {[{ id: 'all', label: 'All' }, { id: 'matching', label: 'Skill Fit' }, { id: 'assigned', label: 'Assigned Positions' }].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${mainTab === t.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'assigned' && <AssignedPositionsContent />}
      {mainTab !== 'assigned' && (<>

      {/* Matching sub-tabs — one per profile skill category */}
      {mainTab === 'matching' && (
        skillCats.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
            No skill categories are set on your profile yet. Add them in your profile to see matching positions.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-5">
            {skillCats.map(cat => (
              <button key={cat} onClick={() => setMatchCat(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${matchCat === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {cat}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${matchCat === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{matchCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        )
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Filter size={14}/> Filters</h4>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"><X size={12}/> Clear all</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Client</label>
              <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white">
                <option value="">All Clients</option>
                {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white">
                <option value="">All Categories</option>
                {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
              <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white">
                <option value="">All Locations</option>
                {locOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date Posted</label>
              <div className="flex gap-1.5">
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" title="From"/>
                <span className="self-center text-gray-400 text-xs">–</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" title="To"/>
              </div>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {filterClient   && <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">Client: {filterClient}<button onClick={() => setFilterClient('')}><X size={11}/></button></span>}
              {filterCat      && <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">Category: {filterCat}<button onClick={() => setFilterCat('')}><X size={11}/></button></span>}
              {filterLoc      && <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold border border-orange-200">Location: {filterLoc}<button onClick={() => setFilterLoc('')}><X size={11}/></button></span>}
              {(filterDateFrom || filterDateTo) && <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">Date: {filterDateFrom || '…'} → {filterDateTo || '…'}<button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}><X size={11}/></button></span>}
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : sortedJobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Briefcase size={44} className="mx-auto mb-3 opacity-30"/>
          <p className="font-semibold">No positions found</p>
          {search && <p className="text-sm mt-1">Try adjusting your search</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedJobs.map(job => {
            const isImmediate = job.pos_cat === 'Immediate Hiring';
            const loc = Array.isArray(job.location) ? job.location.join(', ') : job.location || '—';
            const recs   = people[job.pos_id]?.recruiters || [];
            const coaches = people[job.pos_id]?.coaches || [];
            return (
              <div
                key={job.pos_id}
                onClick={() => navigate(`/dash_view/${job.pos_id}`)}
                className={`relative min-w-0 bg-white rounded-2xl border shadow-sm flex flex-col gap-3 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-orange-300 ${isImmediate ? 'ring-2 ring-red-300 border-gray-200' : 'border-gray-200'}`}
              >
                {/* Immediate Hiring badge */}
                {isImmediate && (
                  <span className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full shadow">
                    <Zap size={10}/> Immediate Hiring
                  </span>
                )}

                {/* Position name + category tag */}
                <div className="mt-1">
                  <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{job.position || '—'}</h4>
                  {job.pos_cat && !isImmediate && (
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${getCatColor(job.pos_cat)}`}>{job.pos_cat}</span>
                  )}
                </div>

                {/* Client */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Building2 size={13} className="text-orange-400 flex-shrink-0"/>
                  <span className="truncate font-medium">{job.client || 'Confidential'}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={13} className="text-orange-400 flex-shrink-0"/>
                  <span className="truncate">{loc}</span>
                </div>

                {/* Recruiter & Coach/Expert counts with hover details */}
                <div className="flex items-center gap-4 text-xs text-gray-600" onClick={e => e.stopPropagation()}>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-orange-400 flex-shrink-0"/>
                    <span className="font-bold text-gray-800">{recs.length}</span> Recruiter{recs.length === 1 ? '' : 's'}
                    <PeopleInfo people={recs} />
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck size={13} className="text-orange-400 flex-shrink-0"/>
                    <span className="font-bold text-gray-800">{coaches.length}</span> Coach/Expert{coaches.length === 1 ? '' : 's'}
                    <PeopleInfo people={coaches} />
                  </span>
                </div>

                {/* Date + Commission */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={11}/>
                    <span>{formatDate(job.datePosted) || '—'}</span>
                  </div>
                  {job.commison != null && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full border ${commissionColor(job.commison).bg} ${commissionColor(job.commison).text} ${commissionColor(job.commison).border}`}>
                      <BadgePercent size={11}/>{formatCommission(job.commison, job.commission_type)}
                    </span>
                  )}
                </div>

                {/* Assign Me button */}
                <div className="pt-1" onClick={e => e.stopPropagation()}>
                  {renderAssignBtn(job.pos_id)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>)}
    </div>
  );
};

// ─── Page shell (sidebar + header + footer) ──────────────────────────────────
const CoachExpertOpenPositions = () => {
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
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <Sidebar />
            </aside>
          </div>
        )}

        <ContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <style>{`
          @keyframes slide-in { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

const ContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full">
          <OpenPositionsContent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoachExpertOpenPositions;
