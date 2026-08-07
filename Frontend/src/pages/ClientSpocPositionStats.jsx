import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, Plus, RefreshCw, CheckCircle, X, 
  AlertCircle, ChevronRight, ChevronDown, Clock, User,
  Menu, ArrowLeft
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';

// Rejection statuses that don't count towards candidate count
const REJECTION_STATUSES = [
  'Screen Reject',
  'L1 Reject',
  'L2 Reject',
  'L3 Reject',
  'HR Reject',
  'Background Verification Reject',
  'Negotiation Reject',
  'Offer Declined',
  // NEW rejection statuses
  'Test Reject',
  'Client Drop',
  'Candidate Drop',
  'Duplicate'
];

const ClientSpocPositionStats = () => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [positions, setPositions] = useState([]);
  const [summary, setSummary] = useState({
    totalPositions: 0,
    totalCandidates: 0,
    totalActiveCandidates: 0,
    totalMaxCandidates: 0,
    totalRemaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [additionalCandidates, setAdditionalCandidates] = useState('');
  const [updating, setUpdating] = useState(false);
  // Expandable row states
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [positionCandidates, setPositionCandidates] = useState({});
  const [loadingCandidates, setLoadingCandidates] = useState({});
  const navigate = useNavigate();

  const isCollapsed = isSidebarCollapsed || false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchPositionStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/candidate/pos/clientspoc-stats', {
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
    const rejectionStatuses = ['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject', 'Background Verification Reject', 'Negotiation Reject', 'Offer Declined', 'Test Reject', 'Client Drop', 'Candidate Drop', 'Duplicate'];
    
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

  useEffect(() => {
    // Only fetch data when user is loaded
    if (user) {
      fetchPositionStats();
    }
  }, [user]);

  const handleAddMoreClick = (position) => {
    setSelectedPosition(position);
    setAdditionalCandidates('');
    setShowModal(true);
  };

  const handleAddCandidates = async () => {
    if (!additionalCandidates || isNaN(additionalCandidates) || Number(additionalCandidates) <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setUpdating(true);
    try {
      const res = await axios.put(
        `/candidate/pos/update-max-candidate/${selectedPosition.id}`,
        { additionalCandidates: Number(additionalCandidates) },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert(`Successfully updated max candidate count from ${res.data.data.maxCandidate - res.data.data.additionalAdded} to ${res.data.data.maxCandidate}`);
        setShowModal(false);
        fetchPositionStats(); // Refresh the data
      } else {
        alert(res.data.message || 'Failed to update max candidate count');
      }
    } catch (err) {
      console.error('Error updating max candidate:', err);
      alert(err.response?.data?.message || 'Failed to update max candidate count');
    } finally {
      setUpdating(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // Loading spinner - shows while checking auth or loading data
  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading position statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50 relative">
      
      {/* Sidebar - Mobile */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <ClientSpocSidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-10'}`}>
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <button
                onClick={() => navigate('/ad_panel')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Position Statistics</h1>
                <p className="text-sm text-gray-500">Viewing as {user?.name || 'Client SPOC'}</p>
              </div>
            </div>
            <button
              onClick={fetchPositionStats}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen">
          <div className="w-full p-2 sm:p-4 lg:p-6">
            <div className="max-w-full mx-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Position Statistics
              </h2>
              <p className="text-blue-100 text-sm">
                Manage candidate limits for your positions
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
                <p className="text-xs text-gray-500 mb-1">Total Candidates</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">{formatNumber(summary.totalCandidates)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Active Candidates</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{formatNumber(summary.totalActiveCandidates ?? 0)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
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
                <CheckCircle className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatNumber(summary.totalRemaining)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Plus className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                  <th className="w-10"></th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">S.No</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Position Name</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Client</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Candidates</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Active Candidates</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Max Limit</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">Remaining</th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold">More Candidate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No positions found</p>
                        <p className="text-sm text-gray-400">Create positions to see statistics here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  positions.map((position, index) => (
                    <React.Fragment key={position.id}>
                      <tr 
                        onClick={() => toggleRowExpansion(position.id, position.pos_id)}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <td className="px-2 py-4">
                          <button
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(position.id, position.pos_id);
                            }}
                          >
                            {expandedRows.has(position.id) ? (
                              <ChevronDown size={20} className="text-blue-600" />
                            ) : (
                              <ChevronRight size={20} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full text-xs sm:text-sm font-bold">
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
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            position.isFull
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {position.candidateCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs sm:text-sm font-bold">
                            {position.activeCount ?? '—'}
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
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddMoreClick(position);
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                              position.remaining === 0
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-md hover:shadow-lg'
                            }`}
                          >
                            <Plus size={14} />
                            Add More
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Row - Candidate Details */}
                      {expandedRows.has(position.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan="9" className="px-4 py-4">
                            {loadingCandidates[position.id] ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                <span className="text-gray-600">Loading candidates...</span>
                              </div>
                            ) : positionCandidates[position.id]?.length > 0 ? (
                              <div className="bg-white rounded-lg p-4 shadow-inner">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <Users size={16} className="text-blue-600" />
                                  Candidates for {position.position}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100 text-gray-700">
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Candidate Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Last Updated</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold">Submitted By</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {positionCandidates[position.id].map((candidate, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {candidate.name.charAt(0).toUpperCase()}
                                              </div>
                                              <span className="text-sm text-gray-900 font-medium">{candidate.name}</span>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                                              {candidate.status}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                              <Clock size={12} className="text-gray-400" />
                                              {formatDate(candidate.lastUpdated)}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                              <User size={12} className="text-gray-400" />
                                              {candidate.recName || 'N/A'}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="font-medium">No candidates found</p>
                                <p className="text-sm">Candidates submitted to this position will appear here</p>
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
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About Candidate Limits</p>
              <p>Each position has a default limit of 10 candidates. When a position reaches its limit, it will no longer be visible in the recruiters' dashboard for new submissions. Use the "Add More" button to increase the limit for specific positions.</p>
            </div>
          </div>
        </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="h-6 w-auto" />
              <span className="text-sm text-gray-500">© 2024 RecruiterV. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Add More Candidates Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-white">Add More Candidates</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="text-white w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Position Details</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Position:</span> <span className="font-medium">{selectedPosition?.position}</span></p>
                    <p><span className="text-gray-500">Client:</span> <span className="font-medium">{selectedPosition?.client || 'Confidential'}</span></p>
                    <p><span className="text-gray-500">Current Limit:</span> <span className="font-medium">{selectedPosition?.maxCandidate}</span></p>
                    <p><span className="text-gray-500">Current Candidates:</span> <span className="font-medium">{selectedPosition?.candidateCount}</span></p>
                    <p><span className="text-gray-500">Remaining:</span> <span className="font-medium">{selectedPosition?.remaining}</span></p>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Candidates to Add
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={additionalCandidates}
                  onChange={(e) => setAdditionalCandidates(e.target.value)}
                  placeholder="Enter number (e.g., 5)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  New limit will be: {selectedPosition?.maxCandidate} + {additionalCandidates || 0} = {selectedPosition?.maxCandidate + (Number(additionalCandidates) || 0)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCandidates}
                  disabled={!additionalCandidates || Number(additionalCandidates) <= 0 || updating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Candidates
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSpocPositionStats;

