import axios from 'axios';
import { positionMatchesSkills } from '../utils/skillMatch';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, TrendingUp, AlertCircle, CheckCircle, Check, Send, Clock, Ban, Zap, Building2, Search, X, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { formatCommission } from '../lib/commission';
import AssignedPositions from './AssignedPositions';

const Dash_Pos= () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessStats, setAccessStats] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [myDirectRequests, setMyDirectRequests] = useState({}); // positionId → status (coach/expert)
  const [myAccessStatus, setMyAccessStatus] = useState({}); // positionId → status (recruiter)
  const [assigningId, setAssigningId] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);

  const isCoachOrExpert = user?.roleCategory === 'Coach' || user?.roleCategory === 'Expert';

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch ALL positions (no skill restriction); the "Matching" tab filters
      // client-side by the recruiter's profile skill categories.
      const res = await axios.get("/candidate/pos/show-for-user?scope=all", { withCredentials: true });
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching positions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch approved assignments to filter out assigned positions
  const fetchMyAssignments = async () => {
    try {
      const res = await axios.get("/api/position-access/my-positions", {
        withCredentials: true
      });
      if (res.data.success) {
        setMyAssignments(res.data.data.assignments || []);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      // Fallback to old endpoint if new one fails
      try {
        const oldRes = await axios.get("/candidate/pos/assign/my-assignments", {
          withCredentials: true
        });
        if (oldRes.data.success) {
          setMyAssignments(oldRes.data.assignments || []);
        }
      } catch (e) {
        console.error("Error fetching old assignments:", e);
      }
    }
  };

  const fetchMyDirectRequests = async () => {
    if (!isCoachOrExpert) return;
    try {
      const res = await axios.get('/api/direct-coach-request/my-requests', { withCredentials: true });
      const map = {};
      (res.data.data || []).forEach(r => { map[r.positionId] = r.status; });
      setMyDirectRequests(map);
    } catch {
      // silently ignore
    }
  };

  // Per-position access status for recruiters (pending / waitlist / rejected / approved)
  const fetchMyAccessStatus = async () => {
    if (isCoachOrExpert) return;
    try {
      const res = await axios.get('/api/position-access/recruiter', { withCredentials: true });
      const map = {};
      (res.data.data || []).forEach(r => { map[r.positionId] = r.status; });
      setMyAccessStatus(map);
    } catch {
      // silently ignore
    }
  };

  const handleAssignMe = async (e, job) => {
    e.stopPropagation();
    if (assigningId) return;
    setAssigningId(job.pos_id);
    try {
      await axios.post('/api/direct-coach-request', {
        positionId: job.pos_id,
        roleCategory: user.roleCategory,
      }, { withCredentials: true });
      setMyDirectRequests(prev => ({ ...prev, [job.pos_id]: 'pending' }));
      showToast('Request sent to ClientSPOC successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request.', false);
    } finally {
      setAssigningId(null);
    }
  };

  // Recruiter "Assign Me" — mirrors the dash_view (Dash_See) flow
  const handleRecruiterAssign = async (e, job) => {
    e.stopPropagation();
    if (assigningId) return;
    const pos_id = job.pos_id;
    const isFreeUser = user?.planType === 0;

    // Assigning is unrestricted — the free-plan 4-position limit only counts positions
    // with an active candidate and is enforced when submitting a candidate.
    setAssigningId(pos_id);
    try {
      const assignResponse = await axios.post(`/candidate/pos/assign/${pos_id}`, {}, { withCredentials: true });

      if (assignResponse.data.success) {
        // Create the access record so Submit Candidate is unlocked immediately
        try {
          await axios.post('/api/position-access/request', { positionId: pos_id }, { withCredentials: true });
        } catch {
          // ignore "already have a request"
        }
        showToast('Position assigned to you successfully!');
        // Reflect the new request immediately, then refresh from the server
        setMyAccessStatus(prev => ({ ...prev, [pos_id]: prev[pos_id] === 'approved' ? 'approved' : 'pending' }));
        // Refresh assignments — approved positions are filtered out of the grid
        fetchMyAssignments();
        fetchMyAccessStatus();
        if (isFreeUser) {
          try {
            const statsResponse = await axios.get('/api/position-access/recruiter/stats', { withCredentials: true });
            if (statsResponse.data.success) setAccessStats(statsResponse.data.data);
          } catch { /* non-fatal */ }
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to assign position. Please try again.', false);
    } finally {
      setAssigningId(null);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMyAssignments();
    fetchMyDirectRequests();
    fetchMyAccessStatus();
  }, [user?.email]); // re-fetch once auth resolves and user identity is confirmed

  // Fetch plan limits and access stats for free users
  useEffect(() => {
    const fetchPlanInfo = async () => {
      if (user?.planType === 0) {
        try {
          const statsResponse = await axios.get('/api/position-access/recruiter/stats', { withCredentials: true });
          if (statsResponse.data.success) {
            setAccessStats(statsResponse.data.data);
          }
        } catch (error) {
          console.error('Error fetching plan info:', error);
        }
      }
    };

    fetchPlanInfo();
  }, [user]);

  // Get set of position IDs that are already assigned/approved
  const assignedPositionIds = useMemo(() => {
    return new Set(myAssignments.map(a => a.positionId || a.pos_id));
  }, [myAssignments]);

  // Filter out positions that the recruiter is already approved for
  const availableJobs = useMemo(() => {
    return jobs.filter(job => !assignedPositionIds.has(job.pos_id));
  }, [jobs, assignedPositionIds]);

  // ── Tabs: All | Matching Positions (sub-tabs = the recruiter's profile skill cats) ──
  const skillCats = useMemo(() => {
    const sc = user?.skillCategory;
    return [...new Set((Array.isArray(sc) ? sc : sc ? [sc] : []).map(s => String(s).trim()).filter(Boolean))];
  }, [user]);
  const [mainTab, setMainTab] = useState('all');          // 'all' | 'matching'
  const [matchCat, setMatchCat] = useState('');           // selected skill-category sub-tab
  useEffect(() => { if (skillCats.length && !matchCat) setMatchCat(skillCats[0]); }, [skillCats]);

  // Positions for the active tab (before search/filters).
  const tabJobs = useMemo(() => {
    if (mainTab === 'all') return availableJobs;
    if (!matchCat) return [];
    return availableJobs.filter(j => positionMatchesSkills(j, [matchCat]));
  }, [availableJobs, mainTab, matchCat]);
  // Count of matching positions per skill category (for the sub-tab badges).
  const matchCounts = useMemo(() => {
    const m = {};
    skillCats.forEach(c => { m[c] = availableJobs.filter(j => positionMatchesSkills(j, [c])).length; });
    return m;
  }, [availableJobs, skillCats]);

  // Assigning is always allowed. The free-plan limit of 4 positions only counts
  // positions that have an active candidate and is enforced at candidate submission,
  // so the Assign Me button is never disabled by the limit.
  const canSelectPosition = true;

  // Get limit message for free users
  const getLimitMessage = () => {
    if (user?.planType !== 0) return null;

    if (!accessStats) return null;

    const working = accessStats.currentlyWorking ?? 0;
    const maxPositions = accessStats.maxPositions || 4;

    if (working >= maxPositions) {
      return {
        type: 'error',
        message: `Free plan limit reached: you can work on a maximum of ${maxPositions} positions (those with at least 1 active candidate). Complete or close a position to take on a new one.`
      };
    }

    return null;
  };

  const limitMessage = getLimitMessage();

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  const [search, setSearch] = useState('');
  const [filterClient,   setFilterClient]   = useState('');
  const [filterCat,      setFilterCat]      = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [showFilters,    setShowFilters]    = useState(false);

  // Derive unique options from the active tab's positions
  const clientOptions   = useMemo(() => [...new Set(tabJobs.map(j => j.client).filter(Boolean))].sort(), [tabJobs]);
  const catOptions      = useMemo(() => [...new Set(tabJobs.map(j => j.pos_cat).filter(Boolean))].sort(), [tabJobs]);
  const locationOptions = useMemo(() => {
    const locs = new Set();
    tabJobs.forEach(j => {
      const arr = Array.isArray(j.location) ? j.location : j.location ? [j.location] : [];
      arr.forEach(l => locs.add(l));
    });
    return [...locs].sort();
  }, [tabJobs]);

  const activeFilterCount = [filterClient, filterCat, filterLocation, filterDateFrom, filterDateTo].filter(Boolean).length;

  const clearFilters = () => {
    setFilterClient(''); setFilterCat(''); setFilterLocation('');
    setFilterDateFrom(''); setFilterDateTo('');
  };

  // Sort: Immediate Hiring first, then by datePosted desc
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
      if (filterClient   && job.client !== filterClient) return false;
      if (filterCat      && job.pos_cat !== filterCat) return false;
      if (filterLocation && !loc.includes(filterLocation)) return false;
      if (filterDateFrom || filterDateTo) {
        const ts = (job.datePosted?._seconds || 0) * 1000;
        if (filterDateFrom && ts < new Date(filterDateFrom).getTime()) return false;
        if (filterDateTo   && ts > new Date(filterDateTo).getTime() + 86399999) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aImm = a.pos_cat === 'Immediate Hiring' ? 1 : 0;
      const bImm = b.pos_cat === 'Immediate Hiring' ? 1 : 0;
      if (bImm !== aImm) return bImm - aImm;
      return (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0);
    });
  }, [tabJobs, search, filterClient, filterCat, filterLocation, filterDateFrom, filterDateTo]);

  const handleCardClick = (job) => {
    // Viewing a position is never blocked — the 4-position limit is enforced on Assign Me.
    navigate(`/dash_view/${job.pos_id}`);
  };

  const getCommissionColor = (c) => {
    if (c >= 10) return 'bg-green-100 text-green-700 border-green-200';
    if (c >= 5)  return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

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

  const renderAssignStatus = (posId) => {
    const status = myDirectRequests[posId];
    const isBusy = assigningId === posId;
    if (status === 'approved')  return <span className="flex items-center gap-1 text-green-700 font-semibold text-xs"><Check size={12}/> Approved</span>;
    if (status === 'pending')   return <span className="flex items-center gap-1 text-yellow-600 font-semibold text-xs"><Clock size={12}/> Requested</span>;
    if (status === 'waitlist')  return <span className="flex items-center gap-1 text-orange-600 font-semibold text-xs"><Clock size={12}/> Waitlisted</span>;
    if (status === 'rejected')  return <span className="flex items-center gap-1 text-red-600 font-semibold text-xs"><Ban size={12}/> Rejected</span>;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleAssignMe(e, { pos_id: posId }); }}
        disabled={isBusy || !!assigningId}
        className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        {isBusy ? <CircularProgress size={10} color="inherit" /> : <Send size={10}/>}
        Assign Me
      </button>
    );
  };

  const renderRecruiterAssignStatus = (job) => {
    const posId = job.pos_id;
    const status = myAccessStatus[posId];
    const isBusy = assigningId === posId;
    const locked = !canSelectPosition;
    if (status === 'approved')  return <span className="flex items-center gap-1 text-green-700 font-semibold text-xs"><Check size={12}/> Approved</span>;
    if (status === 'pending')   return <span className="flex items-center gap-1 text-yellow-600 font-semibold text-xs"><Clock size={12}/> Access Pending</span>;
    if (status === 'waitlist')  return <span className="flex items-center gap-1 text-orange-600 font-semibold text-xs"><Clock size={12}/> Waitlisted</span>;
    if (status === 'rejected')  return (
      <button
        onClick={(e) => handleRecruiterAssign(e, job)}
        disabled={isBusy || !!assigningId || locked}
        className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        {isBusy ? <CircularProgress size={10} color="inherit" /> : <RefreshCw size={10}/>}
        Request Again
      </button>
    );
    return (
      <button
        onClick={(e) => handleRecruiterAssign(e, job)}
        disabled={isBusy || !!assigningId || locked}
        className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        {isBusy ? <CircularProgress size={10} color="inherit" /> : <Send size={10}/>}
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

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-5 mb-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl"><Briefcase size={24} className="text-white" /></div>
            <div>
              <h3 className="text-xl font-bold text-white">Open Positions</h3>
              <p className="text-blue-100 text-sm">{sortedJobs.length} of {tabJobs.length} positions • {myAssignments.length} assigned to you</p>
            </div>
          </div>
          <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15}/> Refresh
          </button>
        </div>
        {/* Search + filter toggle row */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by position, client or location…"
              className="w-full pl-9 pr-8 py-2 bg-white/20 placeholder-white/60 text-white border border-white/30 rounded-xl text-sm focus:outline-none focus:bg-white/30"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-white/70"/></button>}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${showFilters ? 'bg-white text-blue-700 border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
          >
            <Filter size={14}/>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>
            )}
            <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* ── Tabs: All | Matching Positions ── */}
      <div className="flex items-center gap-2 mb-3">
        {[{ id: 'all', label: 'All' }, { id: 'matching', label: 'Skill Fit' }, { id: 'assigned', label: 'Assigned Positions' }].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${mainTab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'assigned' && <AssignedPositions />}
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

      {/* A genuinely empty Skill Fit means there is no open position in that
          field right now — say so, rather than showing a blank page. */}
      {mainTab === 'matching' && skillCats.length > 0 && tabJobs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-amber-900 font-semibold">
            No open position in {matchCat} right now.
          </p>
          <p className="text-xs text-amber-800 mt-1">
            {skillCats.some(c => (matchCounts[c] || 0) > 0)
              ? 'Try one of your other skill categories above, or browse every open position.'
              : 'Nothing matches your profile categories at the moment. Browse every open position, or add more categories to your profile.'}
          </p>
          <button onClick={() => setMainTab('all')}
            className="mt-2 text-xs font-bold text-amber-900 underline underline-offset-2">
            Browse all {availableJobs.length} open positions →
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Filter size={14}/> Filters</h4>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"><X size={12}/> Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Client</label>
              <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">All Clients</option>
                {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">All Categories</option>
                {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
              <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">All Locations</option>
                {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {/* Date range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date Posted</label>
              <div className="flex gap-1.5">
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
                  title="From date" />
                <span className="self-center text-gray-400 text-xs">–</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
                  title="To date" />
              </div>
            </div>
          </div>
          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {filterClient   && <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">Client: {filterClient}<button onClick={() => setFilterClient('')}><X size={11}/></button></span>}
              {filterCat      && <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">Category: {filterCat}<button onClick={() => setFilterCat('')}><X size={11}/></button></span>}
              {filterLocation && <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold border border-orange-200">Location: {filterLocation}<button onClick={() => setFilterLocation('')}><X size={11}/></button></span>}
              {(filterDateFrom || filterDateTo) && <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">Date: {filterDateFrom || '…'} → {filterDateTo || '…'}<button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}><X size={11}/></button></span>}
            </div>
          )}
        </div>
      )}

      {/* Free user limits banner */}
      {user?.planType === 0 && accessStats && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-blue-600">{accessStats.currentlyWorking ?? 0}/{accessStats.maxPositions || 4}</p><p className="text-xs text-gray-500">Positions In Use</p></div>
            <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-green-600">{Math.max(0, (accessStats.maxPositions || 4) - (accessStats.currentlyWorking ?? 0))}</p><p className="text-xs text-gray-500">Slots Remaining</p></div>
            <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-purple-600">{myAssignments.length}</p><p className="text-xs text-gray-500">Assigned To You</p></div>
          </div>
          {limitMessage ? (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${limitMessage.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{limitMessage.message}</p>
                <p className="text-xs mt-0.5">Visit <a href="/my-access-requests" className="underline font-medium">My Access Requests</a> to manage.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-800">
              <CheckCircle size={15} className="flex-shrink-0" />
              <span><strong>Free Plan Active</strong> — assign any position instantly (no approval needed). You can work on up to {accessStats.maxPositions || 4} positions with active candidates.</span>
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : sortedJobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Briefcase size={44} className="mx-auto mb-3 opacity-30"/>
          <p className="font-semibold">No positions found</p>
          {search && <p className="text-sm mt-1">Try adjusting your search</p>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedJobs.map(job => {
            const isImmediate = job.pos_cat === 'Immediate Hiring';
            const loc = Array.isArray(job.location) ? job.location.join(', ') : job.location || '—';
            return (
              <div
                key={job.pos_id}
                onClick={() => handleCardClick(job)}
                className={`relative bg-white rounded-2xl border shadow-sm flex flex-col gap-3 p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 border-gray-200 hover:border-blue-300 ${isImmediate ? 'ring-2 ring-red-300' : ''}`}
              >
                {/* Immediate Hiring tag */}
                {isImmediate && (
                  <span className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full shadow">
                    <Zap size={10}/> Immediate Hiring
                  </span>
                )}

                {/* Position + category tag */}
                <div className="mt-1">
                  <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{job.position || '—'}</h4>
                  {job.pos_cat && !isImmediate && (
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${getCatColor(job.pos_cat)}`}>{job.pos_cat}</span>
                  )}
                </div>

                {/* Client */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Building2 size={13} className="text-blue-400 flex-shrink-0"/>
                  <span className="truncate font-medium">{job.client || 'Confidential'}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={13} className="text-orange-400 flex-shrink-0"/>
                  <span className="truncate">{loc}</span>
                </div>

                {/* Date + Commission */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={11}/>
                    <span>{formatDate(job.datePosted) || '—'}</span>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full border ${getCommissionColor(job.commison)}`}>
                    <BadgePercent size={11}/>{formatCommission(job.commison, job.commission_type)}
                  </span>
                </div>

                {/* Assign Me */}
                <div className="pt-1" onClick={e => e.stopPropagation()}>
                  {isCoachOrExpert ? renderAssignStatus(job.pos_id) : renderRecruiterAssignStatus(job)}
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

export default Dash_Pos;
