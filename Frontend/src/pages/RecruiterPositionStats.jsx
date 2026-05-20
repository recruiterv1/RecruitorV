import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Briefcase, Users, RefreshCw, AlertCircle, ChevronRight, ChevronDown,
  MapPin, IndianRupee, Calendar, Clock, User
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { SidebarProvider } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';

const RecruiterPositionStatsContent = () => {
  const { user } = useContext(UserStateContext);
  const [positions, setPositions] = useState([]);
  const [summary, setSummary] = useState({
    totalPositions: 0,
    totalCandidates: 0,
    totalMaxCandidates: 0,
    totalRemaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Expandable row states
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [positionCandidates, setPositionCandidates] = useState({});
  const [loadingCandidates, setLoadingCandidates] = useState({});

  const fetchPositionStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/candidate/pos/recruiter-stats', {
        withCredentials: true
      });
      
      if (res.data.success) {
        setPositions(res.data.positions || []);
        setSummary(res.data.summary || {
          totalPositions: 0,
          totalCandidates: 0,
          totalMaxCandidates: 0,
          totalRemaining: 0
        });
      } else {
        setError(res.data.message || 'Failed to fetch position statistics');
      }
    } catch (err) {
      console.error('Error fetching position stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch position statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositionStats();
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = async (positionId, pos_id) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (newExpandedRows.has(positionId)) {
      newExpandedRows.delete(positionId);
      setExpandedRows(newExpandedRows);
    } else {
      newExpandedRows.add(positionId);
      setExpandedRows(newExpandedRows);
      
      // Fetch candidates for this position if not already loaded
      if (!positionCandidates[positionId]) {
        await fetchCandidatesForPosition(positionId, pos_id);
      }
    }
  };

  // Fetch candidates for a specific position
  const fetchCandidatesForPosition = async (positionId, pos_id) => {
    setLoadingCandidates(prev => ({ ...prev, [positionId]: true }));
    try {
      const res = await axios.get(`/candidate/pos/${pos_id}/candidates`, {
        withCredentials: true
      });
      
      if (res.data.success) {
        setPositionCandidates(prev => ({
          ...prev,
          [positionId]: res.data.candidates || []
        }));
      }
    } catch (err) {
      console.error('Error fetching candidates for position:', err);
    } finally {
      setLoadingCandidates(prev => ({ ...prev, [positionId]: false }));
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const successStatuses = ['Offer Accepted', 'Joining'];
    const rejectionStatuses = ['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject', 'Background Verification Reject', 'Negotiation Reject', 'Offer Declined'];
    
    if (successStatuses.includes(status)) return 'bg-green-100 text-green-700';
    if (rejectionStatuses.includes(status)) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Format date for position date
  const formatPositionDate = (datePosted) => {
    if (!datePosted) return 'N/A';
    try {
      if (datePosted._seconds) {
        const postDate = new Date(datePosted._seconds * 1000);
        return postDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      }
      return datePosted;
    } catch (e) {
      return 'N/A';
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your position statistics...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching positions where you've submitted candidates</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md border-2 border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchPositionStats}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-orange-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                My Position Statistics
              </h2>
              <p className="text-green-100 text-sm">
                Positions where you've submitted candidates
              </p>
            </div>
            <button
              onClick={fetchPositionStats}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Positions</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatNumber(summary.totalPositions)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">My Candidates</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">{formatNumber(summary.totalCandidates)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Candidates</p>
                <p className="text-2xl sm:text-3xl font-bold text-teal-600">{formatNumber(summary.totalAllCandidates || 0)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="text-teal-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Max Candidates</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatNumber(summary.totalMaxCandidates)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Briefcase className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Available Slots</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatNumber(summary.totalRemaining)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ChevronRight className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-600 to-teal-500 text-white">
                  <th className="w-10"></th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">S.No</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Position Name</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Client</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Location</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">CTC Range</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">My Candidates</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Total Candidates</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Max Limit</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No positions found</p>
                        <p className="text-sm text-gray-400">You haven't submitted any candidates yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  positions.map((position, index) => (
                    <React.Fragment key={position.id}>
                      <tr 
                        onClick={() => toggleRowExpansion(position.id, position.pos_id)}
                        className="hover:bg-green-50 transition-colors cursor-pointer"
                      >
                        <td className="px-2 py-4">
                          <button
                            className="text-gray-500 hover:text-green-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(position.id, position.pos_id);
                            }}
                          >
                            {expandedRows.has(position.id) ? (
                              <ChevronDown size={20} className="text-green-600" />
                            ) : (
                              <ChevronRight size={20} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-green-100 text-green-600 rounded-full text-xs sm:text-sm font-bold">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">{position.position}</p>
                            <p className="text-xs text-gray-500">ID: {position.pos_id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-700 text-xs sm:text-sm">
                            {position.client || 'Confidential'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm">
                            <MapPin size={12} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {Array.isArray(position.location) 
                                ? position.location.slice(0, 2).join(", ") + (position.location.length > 2 ? '...' : '')
                                : position.location || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-gray-600 text-xs sm:text-sm">
                            <IndianRupee size={12} className="text-green-500" />
                            <span>{position.ctcStart || '0'} - {position.ctcEnd || '0'} LPA</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            position.candidateCount > 0 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {position.candidateCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            position.totalCandidates > 0 
                              ? 'bg-teal-100 text-teal-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {position.totalCandidates || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-bold">
                            {position.maxCandidate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            position.remaining === 0 
                              ? 'bg-red-100 text-red-700' 
                              : position.remaining <= 3 
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {position.remaining}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expanded Row - Candidate Details */}
                      {expandedRows.has(position.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan="10" className="px-4 py-4">
                            {loadingCandidates[position.id] ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                <span className="text-gray-600">Loading candidates...</span>
                              </div>
                            ) : positionCandidates[position.id]?.length > 0 ? (
                              <div className="bg-white rounded-lg p-4 shadow-inner">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Users size={16} className="text-green-600" />
                                    All Candidates for {position.position}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-teal-100 border-2 border-teal-300"></span>
                                      <span className="text-gray-600">Your Candidates</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-gray-100 border-2 border-gray-300"></span>
                                      <span className="text-gray-600">Other Recruiters</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100 text-gray-700">
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Candidate Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Submitted By</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Last Updated</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {positionCandidates[position.id].map((candidate, idx) => {
                                        // Check if this candidate was submitted by the logged-in recruiter
                                        const isMyCandidate = (candidate.recEmail || "").toLowerCase() === (user?.email || "").toLowerCase();
                                        
                                        return (
                                          <tr 
                                            key={idx} 
                                            className={`transition-colors ${
                                              isMyCandidate 
                                                ? 'bg-teal-50 hover:bg-teal-100' 
                                                : 'hover:bg-gray-50'
                                            }`}
                                          >
                                            <td className="px-3 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                  isMyCandidate 
                                                    ? 'bg-gradient-to-br from-teal-500 to-green-500' 
                                                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                }`}>
                                                  {candidate.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm text-gray-900 font-medium">{candidate.name}</span>
                                                  {isMyCandidate && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full">
                                                      YOU
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <User size={12} className="text-gray-400" />
                                                <span className={isMyCandidate ? 'font-medium text-teal-700' : ''}>
                                                  {candidate.recName || 'N/A'}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="px-3 py-3">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                                                {candidate.status}
                                              </span>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Clock size={12} className="text-gray-400" />
                                                {formatDate(candidate.lastUpdated)}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="font-medium">No candidates found</p>
                                <p className="text-sm">Your submitted candidates for this position will appear here</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-green-600 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-1">About Your Position Statistics</p>
              <p>This page shows all positions where you have submitted candidates. The "My Candidates" count reflects only your submissions. Contact the Client SPOC if you need to increase the candidate limit for any position.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const RecruiterPositionStats = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <Sidebar />
        </aside>

        {/* Sidebar - Mobile Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <Sidebar />
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="transition-all duration-300 lg:pl-64">
          
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white shadow-sm">
            <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          </header>

          {/* Main Content */}
          <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
            <RecruiterPositionStatsContent />
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Animations */}
        <style>{`
          @keyframes slide-in {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

export default RecruiterPositionStats;

