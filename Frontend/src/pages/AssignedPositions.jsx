import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, MapPin, BadgePercent, Calendar, Users, User, Clock, CheckCircle, Filter, X, Search, UserCheck, Send, Ban, ChevronDown, ChevronUp, Building2, Loader, Sparkles, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApplyModal from '../components/ApplyModal';
import SubmitCandidateTabs from '../components/SubmitCandidateTabs';
import { formatCommission } from '../lib/commission';

const AssignedPositions = () => {
  const navigate = useNavigate();
  // Candidate carried over from Refer & Earn "Use Resume" — pre-fills the
  // Submit Candidate form once a position is chosen.
  const [useResumeCand, setUseResumeCand] = useState(() => {
    try {
      const raw = sessionStorage.getItem('rne_use_resume');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const clearUseResume = () => {
    try { sessionStorage.removeItem('rne_use_resume'); } catch (_) {}
    setUseResumeCand(null);
  };
  const [positions, setPositions] = useState([]);
  const [coachAssigned, setCoachAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  // Submit Candidate modal state (mirrors dash_view / Dash_See)
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyPos, setApplyPos] = useState(null);
  const [loadingApplyId, setLoadingApplyId] = useState(null);

  // Set of positionIds the coach has assigned to this recruiter (accepted)
  const coachAssignedIds = useMemo(
    () => new Set(coachAssigned.map(a => a.positionId)),
    [coachAssigned]
  );

  const fetchAssignedPositions = async () => {
    setLoading(true);
    try {
      // Fetch positions — primary data, must succeed
      const posRes = await axios.get("/candidate/pos/assigned-positions", { withCredentials: true });
      if (posRes.data.success) setPositions(posRes.data.positions);
    } catch (err) {
      console.error('Error fetching assigned positions:', err);
    } finally {
      setLoading(false);
    }
    // Fetch coach assignments separately — non-blocking, failures silently ignored
    try {
      const coachRes = await axios.get("/api/coach-expert/coach-assigned-positions", { withCredentials: true });
      setCoachAssigned((coachRes.data?.assignments || []).filter(a => a.status === 'accepted'));
    } catch {
      setCoachAssigned([]);
    }
  };

  useEffect(() => {
    fetchAssignedPositions();
  }, []);

  // A position is active unless its status says otherwise (matches backend
  // convention exactly: empty status OR a status containing the word "active").
  const isPositionActive = (position) => {
    const st = (position?.status || '').toString().toLowerCase().trim();
    return st === '' || st.includes('active');
  };

  // Submit Candidate → open the live position page (v2) with the form already open,
  // instead of the old in-page modal.
  const handleSubmitCandidate = (e, position) => {
    e.stopPropagation();
    if (!isPositionActive(position)) return;   // never for inactive/paused positions
    navigate(`/dash_view/${position.pos_id}?submit=1`);
  };

  const closeApplyModal = () => {
    setIsApplyOpen(false);
    setApplyPos(null);
  };

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  const getCommissionColor = (commission) => {
    if (commission >= 10) return 'bg-green-100 text-green-700 border-green-200';
    if (commission >= 5) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const successStatuses = ['Offer Accepted', 'Joining'];
    const rejectionStatuses = ['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject', 'Background Verification Reject', 'Negotiation Reject', 'Offer Declined'];

    if (successStatuses.includes(status)) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (rejectionStatuses.includes(status)) {
      return 'bg-red-100 text-red-700 border-red-200';
    } else {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Get unique values for filters
  const uniquePositions = useMemo(() => {
    return [...new Set(positions.map(p => p.position))].sort();
  }, [positions]);

  const uniqueClients = useMemo(() => {
    return [...new Set(positions.map(p => p.client).filter(c => c && c !== 'Confidential'))].sort();
  }, [positions]);

  // Filtered lists based on search
  const filteredPositionOptions = useMemo(() => {
    const filtered = uniquePositions.filter(pos =>
      pos.toLowerCase().includes(positionSearch.toLowerCase())
    );
    return filtered.slice(0, 10);
  }, [uniquePositions, positionSearch]);

  const filteredClientOptions = useMemo(() => {
    const filtered = uniqueClients.filter(client =>
      client.toLowerCase().includes(clientSearch.toLowerCase())
    );
    return filtered.slice(0, 10);
  }, [uniqueClients, clientSearch]);

  // Filter positions based on selected filters, then show active positions first
  const filteredPositions = useMemo(() => {
    const filtered = positions.filter(position => {
      if (positionFilter && position.position !== positionFilter) return false;
      if (clientFilter && position.client !== clientFilter) return false;
      if (catFilter && position.pos_cat !== catFilter) return false;
      return true;
    });
    // Stable sort: active positions first, preserving the existing (newest-first) order within each group
    return filtered
      .map((position, index) => ({ position, index }))
      .sort((a, b) => {
        const aActive = isPositionActive(a.position) ? 0 : 1;
        const bActive = isPositionActive(b.position) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.index - b.index;
      })
      .map(item => item.position);
  }, [positions, positionFilter, clientFilter, catFilter]);

  const clearFilters = () => {
    setPositionFilter('');
    setClientFilter('');
    setPositionSearch('');
    setClientSearch('');
    setCatFilter('');
  };

  // Quick category filters (match position.pos_cat values)
  const CATEGORY_FILTERS = [
    { label: 'Immediate Hiring', color: 'red' },
    { label: 'Interview Drives', color: 'purple' },
    { label: 'Fast Response', color: 'blue' },
    { label: 'High Commission', color: 'green' },
    { label: 'New', color: 'teal' },
  ];
  const catBtnClasses = (cat) => {
    const active = catFilter === cat.label;
    const palette = {
      red: active ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      purple: active ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      blue: active ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: active ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      teal: active ? 'bg-teal-600 text-white border-teal-600' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    };
    return palette[cat.color];
  };

  const toggleRowExpansion = (posId) => {
    setExpandedRows(prev => ({ ...prev, [posId]: !prev[posId] }));
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-500 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Briefcase size={20} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    Assigned Positions
                  </h3>
                  <p className="text-green-100 text-xs sm:text-sm">
                    {positions.length} positions • Submit candidates directly from each card
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-green-100">Your Candidates</p>
                  <p className="text-lg font-bold text-white">
                    {positions.reduce((sum, pos) => sum + (pos.myCandidateCount || 0), 0)}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-green-100">Owned Positions</p>
                  <p className="text-lg font-bold text-white">
                    {positions.filter(p => p.isOwner).length}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-green-100">Available Slots</p>
                  <p className="text-lg font-bold text-white">
                    {positions.reduce((sum, pos) => sum + (pos.remaining || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-gradient-to-r from-gray-50 to-green-50 border-b-2 border-green-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-green-600" />
              <h4 className="font-semibold text-gray-800">Filters</h4>
              {(positionFilter || clientFilter) && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Position Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Position Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search positions..."
                    value={positionSearch}
                    onChange={(e) => setPositionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  size="5"
                >
                  <option value="">All Positions</option>
                  {filteredPositionOptions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                  {uniquePositions.length > 10 && filteredPositionOptions.length === 10 && (
                    <option disabled>... {uniquePositions.length - 10} more (search to find)</option>
                  )}
                </select>
              </div>

              {/* Client Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  size="5"
                >
                  <option value="">All Clients</option>
                  {filteredClientOptions.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                  {uniqueClients.length > 10 && filteredClientOptions.length === 10 && (
                    <option disabled>... {uniqueClients.length - 10} more (search to find)</option>
                  )}
                </select>
              </div>

              {/* Status Summary - Read Only */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Position Status
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Full Positions</span>
                    <span className="font-bold text-red-600">
                      {positions.filter(p => p.isFull).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Available</span>
                    <span className="font-bold text-green-600">
                      {positions.filter(p => !p.isFull).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ownership Badge */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ownership
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Owned by You</span>
                    <span className="font-bold text-green-600">
                      {positions.filter(p => p.isOwner).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Assigned to You</span>
                    <span className="font-bold text-blue-600">
                      {positions.filter(p => !p.isOwner).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(positionFilter || clientFilter) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {positionFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Position: {positionFilter}
                    <button onClick={() => { setPositionFilter(''); setPositionSearch(''); }} className="hover:bg-green-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {clientFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Client: {clientFilter}
                    <button onClick={() => { setClientFilter(''); setClientSearch(''); }} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Referral "Use Resume" banner — a candidate is waiting to be submitted */}
          {useResumeCand && (
            <div className="bg-indigo-50 border-b-2 border-indigo-200 px-3 sm:px-4 lg:px-6 py-3">
              <div className="flex items-start sm:items-center gap-3 text-sm flex-wrap">
                <FileText size={17} className="text-indigo-600 flex-shrink-0" />
                <p className="text-indigo-900 flex-1 min-w-0">
                  Submitting <strong>{useResumeCand.candidate || 'referred candidate'}</strong>
                  {useResumeCand.emails ? ` (${useResumeCand.emails})` : ''} — choose a position below and click
                  <strong> Submit Candidate</strong>. Their details will be filled in for you.
                </p>
                <button onClick={clearUseResume}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold text-xs underline flex-shrink-0">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-green-50 border-b-2 border-green-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Users size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                <span className="font-semibold">Tip:</span>
                <span className="hidden sm:inline"> Click <strong>Submit Candidate</strong> on any card to add a candidate, or "My Candidates" to view your submissions.</span>
                <span className="sm:hidden"> Tap Submit Candidate on a card to apply.</span>
              </p>
            </div>
          </div>

          {/* Category Quick Filters */}
          <div className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCatFilter('')}
                className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                  catFilter === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setCatFilter(prev => prev === cat.label ? '' : cat.label)}
                  className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${catBtnClasses(cat)}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="p-3 sm:p-4 lg:p-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Briefcase size={44} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No assigned positions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPositions.map((position) => {
                  const posId = position.pos_id;
                  const active = isPositionActive(position);
                  const isCoach = coachAssignedIds.has(posId);
                  const myCandidates = position.myCandidates || [];
                  const isExpanded = expandedRows[posId];
                  const loc = (() => {
                    const arr = Array.isArray(position.location)
                      ? position.location.filter(Boolean)
                      : (position.location ? [position.location] : []);
                    if (arr.length > 0) {
                      return arr.slice(0, 2).join(', ') + (arr.length > 2 ? '…' : '');
                    }
                    // fallback to state field when location is empty (matches dash_view)
                    const st = Array.isArray(position.state)
                      ? position.state.filter(Boolean).join(', ')
                      : (position.state || '');
                    return st || '—';
                  })();
                  const busy = loadingApplyId === posId;

                  return (
                    <div
                      key={posId}
                      onClick={() => navigate(`/dash_view/${posId}`)}
                      className={`relative bg-white rounded-2xl border shadow-sm flex flex-col gap-3 p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                        isCoach ? 'border-orange-200 ring-1 ring-orange-200' : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      {/* Title + badges */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{position.position || '—'}</h4>
                          <div className="flex-shrink-0 flex items-center gap-1.5">
                            <span
                              title={`${position.resumeBankMatchCount || 0} resume-bank candidate(s) match this JD by 75% or more`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                position.resumeBankMatchCount > 0
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                            >
                              <Sparkles size={10} /> {position.resumeBankMatchCount || 0} match
                            </span>
                            {position.isOwner && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">Owner</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {position.pos_cat && (
                            <span className="text-xs text-gray-500">{position.pos_cat}</span>
                          )}
                          {isCoach && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-[10px] font-bold">
                              <UserCheck size={10} /> Coach
                            </span>
                          )}
                          {!active && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-200 text-gray-600 border border-gray-300 rounded-full text-[10px] font-bold">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Client */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Building2 size={13} className="text-green-500 flex-shrink-0" />
                        <span className="truncate font-medium">{position.client || 'Confidential'}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={13} className="text-blue-400 flex-shrink-0" />
                        <span className="truncate">{loc}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                          <Users size={12} /> {position.candidateCount || 0} total
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                          <User size={12} /> {position.myCandidateCount || 0} mine
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${
                          position.isFull ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {position.remaining ?? 0}/{position.maxCandidate || 10} left
                        </span>
                      </div>

                      {/* Date + commission */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={11} />
                          <span>{formatDate(position.datePosted) || '—'}</span>
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full border ${getCommissionColor(position.commison)}`}>
                          <BadgePercent size={11} />{formatCommission(position.commison, position.commission_type)}
                        </span>
                      </div>

                      {/* Action: Submit Candidate / Position Not Active */}
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        {active ? (
                          <button
                            onClick={(e) => handleSubmitCandidate(e, position)}
                            disabled={busy}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            {busy ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                            Submit Candidate
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 text-sm font-semibold rounded-xl border border-gray-200 cursor-not-allowed"
                          >
                            <Ban size={15} />
                            Position Not Active
                          </button>
                        )}
                      </div>

                      {/* My Candidates expander */}
                      {myCandidates.length > 0 && (
                        <div className="border-t border-gray-100 pt-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleRowExpansion(posId)}
                            className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-gray-900"
                          >
                            <span className="flex items-center gap-1.5">
                              <User size={13} className="text-green-600" />
                              My Candidates ({myCandidates.length})
                            </span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {myCandidates.map((candidate, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                  <p className="font-medium text-gray-900 text-xs">{candidate.candidateName}</p>
                                  {candidate.dateAdded && (
                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                      <Clock size={11} />
                                      <span>Submitted {formatDate(candidate.dateAdded)}</span>
                                    </div>
                                  )}
                                  <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${getStatusColor(candidate.status)}`}>
                                    <CheckCircle size={10} />
                                    {candidate.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default AssignedPositions;
