import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../pages/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, MapPin, BadgePercent, Calendar, Users, User,
  Clock, CheckCircle, AlertTriangle, Send, Share2, Copy, Check,
  Ban, ChevronDown, ChevronUp, Loader2, RefreshCw,
} from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import { formatCommission } from '../lib/commission';
import SubmitCandidateTabs from '../components/SubmitCandidateTabs';
import ApplyModal from '../components/ApplyModal';

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

const statusColor = (status) => {
  const successStatuses = ['Offer Accepted', 'Joining'];
  const rejectionStatuses = ['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject',
    'Background Verification Reject', 'Negotiation Reject', 'Offer Declined'];
  if (successStatuses.includes(status)) return 'bg-green-100 text-green-700 border-green-200';
  if (rejectionStatuses.includes(status)) return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

const locText = (loc) => Array.isArray(loc)
  ? loc.slice(0, 2).join(', ') + (loc.length > 2 ? '…' : '')
  : (loc || '—');

// ─── Main content ─────────────────────────────────────────────────────────────
const AssignedPositionsContent = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullModal, setShowFullModal] = useState(false);
  const [selectedFullPosition, setSelectedFullPosition] = useState(null);

  // Submit Candidate modal state (same flow used across the app)
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyPos, setApplyPos] = useState(null);
  const [loadingApplyId, setLoadingApplyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/direct-coach-request/assigned-positions', { withCredentials: true });
      if (res.data.success) setPositions(res.data.positions);
    } catch (err) {
      console.error('Error fetching assigned positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPositions(); }, []);

  const isPositionActive = (p) => {
    const st = (p?.status || '').toString().toLowerCase().trim();
    return st === '' || st.includes('active');
  };

  // Open the Submit Candidate modal — fetch full detail for clientspoc / hr_name.
  const handleSubmitCandidate = async (e, position) => {
    e.stopPropagation();
    if (loadingApplyId) return;
    if (position.isFull) { setSelectedFullPosition(position); setShowFullModal(true); return; }
    setLoadingApplyId(position.pos_id);
    try {
      let full = position;
      try {
        const res = await axios.get(`/candidate/position/${position.pos_id}`);
        if (res.data) full = { ...position, ...res.data };
      } catch { /* fall back to what we have */ }
      setApplyPos({
        pos_id: position.pos_id,
        client: full.client || position.client || '',
        clientspoc: full.clientspoc || '',
        pos_name: full.position || position.position || '',
        hr_name: full.hr_name || position.hr_name || '',
      });
      setIsApplyOpen(true);
    } finally {
      setLoadingApplyId(null);
    }
  };
  const closeApplyModal = () => { setIsApplyOpen(false); setApplyPos(null); };

  // Copy a role-aware share link — carries THIS coach/expert's email so applicants
  // are attributed to them. Only assigned positions can be shared, which is why
  // the button lives here.
  const handleShare = (e, position) => {
    e.stopPropagation();
    const recParam = user?.email ? `&rec=${encodeURIComponent(user.email)}` : '';
    const url = `${window.location.origin}/position/${position.pos_id}?view=share${recParam}`;
    navigator.clipboard.writeText(url)
      .then(() => { setCopiedId(position.pos_id); setTimeout(() => setCopiedId(null), 2000); })
      .catch(() => {});
  };

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 lg:p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Briefcase size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Assigned Positions</h3>
                <p className="text-orange-100 text-sm">
                  {positions.length} position{positions.length !== 1 ? 's' : ''} approved — submit candidates or share the position link
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-orange-100">My Candidates</p>
                  <p className="text-lg font-bold text-white">{positions.reduce((s, p) => s + (p.myCandidateCount || 0), 0)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-orange-100">Available Slots</p>
                  <p className="text-lg font-bold text-white">{positions.reduce((s, p) => s + (p.remaining || 0), 0)}</p>
                </div>
              </div>
              <button onClick={fetchPositions}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-sm transition-all">
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tip banner */}
        <div className="bg-orange-50 border-b-2 border-orange-200 px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Share2 size={16} className="text-orange-600 flex-shrink-0" />
            <p className="text-orange-800">
              <span className="font-semibold">Tip:</span> Use <strong>Submit Candidate</strong> to add a profile, or <strong>Share</strong> to copy a link — candidates who apply through it come to your Direct Candidates.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="p-3 sm:p-4 lg:p-5">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : positions.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase size={44} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-600">No assigned positions yet</p>
              <p className="text-sm text-gray-400 mt-1">Positions a coach/expert accepts appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {positions.map((position, idx) => {
                const c = commissionColor(position.commison);
                const busy = loadingApplyId === position.pos_id;
                const active = isPositionActive(position) && !position.isFull;
                const myCands = position.myCandidates || [];
                const isOpen = !!expanded[position.pos_id];
                return (
                  <div key={position.pos_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button onClick={() => navigate(`/dash_view/${position.pos_id}`)}
                            className="font-bold text-gray-900 text-sm sm:text-base text-left hover:text-orange-600 transition-colors truncate block w-full">
                            {position.position || 'Position'}
                          </button>
                          <p className="text-xs text-gray-500 truncate">{position.pos_cat || ''}</p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full ${c.bg} ${c.text} border ${c.border} font-bold text-[11px]`}>
                          <BadgePercent size={11} />{formatCommission(position.commison, position.commission_type)}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-600 col-span-2"><User size={13} className="text-orange-500 flex-shrink-0" /><span className="truncate">{position.client || 'Confidential'}</span></div>
                        <div className="flex items-center gap-1 text-gray-600 col-span-2"><MapPin size={13} className="text-orange-500 flex-shrink-0" /><span className="truncate">{locText(position.location)}</span></div>
                        <div className="flex items-center gap-1 text-gray-500"><Calendar size={12} className="text-orange-500 flex-shrink-0" />{formatDate(position.datePosted)}</div>
                        <div className={`flex items-center gap-1 justify-end font-bold ${position.isFull ? 'text-red-600' : 'text-green-700'}`}>
                          {position.remaining ?? 0}/{position.maxCandidate || 10} slots
                        </div>
                      </div>

                      {/* Counts */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${(position.candidateCount || 0) > 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Users size={13} /> {position.candidateCount || 0} total
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${(position.myCandidateCount || 0) > 0 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <User size={13} /> {position.myCandidateCount || 0} mine
                        </span>
                      </div>

                      {/* My candidates expander */}
                      {myCands.length > 0 && (
                        <div>
                          <button onClick={() => setExpanded(p => ({ ...p, [position.pos_id]: !p[position.pos_id] }))}
                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                            {isOpen ? <>Hide my candidates <ChevronUp size={13} /></> : <>My candidates ({myCands.length}) <ChevronDown size={13} /></>}
                          </button>
                          {isOpen && (
                            <div className="mt-2 space-y-1.5">
                              {myCands.map((cand, i) => (
                                <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{cand.candidateName}</p>
                                    {cand.dateAdded && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} />{formatDate(cand.dateAdded)}</p>}
                                  </div>
                                  <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor(cand.status)}`}>{cand.status}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2">
                      {active ? (
                        <button onClick={() => navigate(`/dash_view/${position.pos_id}?submit=1`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                          <Send size={15} /> Submit Candidate
                        </button>
                      ) : (
                        <button disabled
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-500 text-sm font-semibold rounded-xl border border-gray-200 cursor-not-allowed">
                          <Ban size={15} /> {position.isFull ? 'Position Full' : 'Paused'}
                        </button>
                      )}
                      {/* Share is hidden for paused positions — they can't take applications */}
                      {isPositionActive(position) && (
                        <button onClick={(e) => handleShare(e, position)} title="Copy share link"
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                            copiedId === position.pos_id ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
                          }`}>
                          {copiedId === position.pos_id ? <><Check size={15} /> Copied</> : <><Share2 size={15} /> Share</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full-position dialog */}
      <Dialog open={showFullModal} onClose={() => { setShowFullModal(false); setSelectedFullPosition(null); }}>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} /> Max Candidates Reached
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedFullPosition && (
              <div className="space-y-3">
                <p className="text-gray-700">
                  The position <strong>{selectedFullPosition.position}</strong> has reached its maximum candidate limit.
                </p>
                <div className="bg-gray-100 p-3 rounded-lg space-y-1 text-sm">
                  <p><span className="font-medium">Client:</span> {selectedFullPosition.client || 'Confidential'}</p>
                  <p><span className="font-medium">Max Candidates:</span> {selectedFullPosition.maxCandidate || 10}</p>
                  <p><span className="font-medium">Current Candidates:</span> {selectedFullPosition.candidateCount || 0}</p>
                </div>
                <p className="text-gray-600 text-sm">You cannot add more candidates to this position.</p>
              </div>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowFullModal(false); setSelectedFullPosition(null); }} color="primary" autoFocus>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Submit Candidate Modal */}
      {applyPos && (
        <ApplyModal isOpen={isApplyOpen} onClose={closeApplyModal}>
          <SubmitCandidateTabs
            pos_id={applyPos.pos_id}
            client={applyPos.client}
            clientspoc={applyPos.clientspoc}
            pos_name={applyPos.pos_name}
            hr_name={applyPos.hr_name}
            onClose={closeApplyModal}
            onSubmitted={() => { closeApplyModal(); fetchPositions(); }}
          />
        </ApplyModal>
      )}
    </div>
  );
};

// ─── Page shell ───────────────────────────────────────────────────────────────
const CoachExpertAssignedPositions = () => {
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
          <AssignedPositionsContent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoachExpertAssignedPositions;
