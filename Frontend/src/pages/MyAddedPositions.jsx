import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, User, RefreshCw, CheckCircle, AlertCircle, Calendar, MapPin,
  Eye, Copy, Edit, Pause, Play, Trash2, X
} from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import EditPositionModal from './EditPositionModal';
import ViewPositionModal from './ViewPositionModal';

// Custom Input component matching Add Position form style
const Input = ({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <input 
      {...props} 
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-white disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" 
    />
  </div>
);

// Custom Textarea component matching Add Position form style
const Textarea = ({ label, ...props }) => (
  <div className="col-span-1 sm:col-span-2">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 block">{label}</label>
    <textarea 
      {...props} 
      rows={3} 
      className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500" 
    />
  </div>
);

// Custom Select component matching Add Position form style
const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <select 
      {...props} 
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500"
    >
      <option value="">Select</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const PREFERRED_CATS = ['Immediate Hiring', 'Interview Drives', 'Fast Response', 'High Commission', 'New'];

const MyAddedPositions = () => {
  const [positions, setPositions] = useState([]);
  const [summary, setSummary] = useState({
    totalPositions: 0,
    totalCandidates: 0,
    totalRecruiters: 0,
    totalMaxCandidates: 0,
    totalRemaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'paused'
  const [catFilter, setCatFilter] = useState(''); // '' = all categories
  
  // Dialog states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  const fetchMyPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/candidate/pos/clientspoc/my-positions', {
        withCredentials: true
      });

      if (res.data.success) {
        setPositions(res.data.positions || []);
        setSummary(res.data.summary || {
          totalPositions: 0,
          totalCandidates: 0,
          totalRecruiters: 0,
          totalMaxCandidates: 0,
          totalRemaining: 0
        });
      } else {
        setError(res.data.message || 'Failed to fetch positions');
      }
    } catch (err) {
      console.error('Error fetching my positions:', err);
      setError(err.response?.data?.message || 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPositions();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Format date
  const formatDate = (dateData) => {
    if (!dateData?._seconds) return 'N/A';
    const date = new Date(dateData._seconds * 1000);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format number
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
  };

  // Handle VIEW - Open view modal with all details and share URL
  const handleView = (position) => {
    setSelectedPosition(position);
    setViewModalOpen(true);
  };

  // Handle EDIT - Open edit modal with same form as Add Position
  const handleEdit = (position) => {
    setSelectedPosition(position);
    setEditModalOpen(true);
  };

  // Handle COPY — save data to sessionStorage and open Add Position form pre-filled
  const handleCopy = (position) => {
    const copyData = {
      position: position.position || '',
      client: position.client || '',
      hr_name: position.hr_name || '',
      ctcStart: position.ctcStart || '',
      ctcEnd: position.ctcEnd || '',
      location: Array.isArray(position.location)
        ? position.location
        : (position.location ? position.location.split(',').map(s => s.trim()).filter(Boolean) : []),
      job_desc: position.job_desc || '',
      commison: position.commison || '',
      commission_type: position.commission_type || '',
      client_questions: Array.isArray(position.client_questions) ? position.client_questions : [],
      experience: position.experience || '',
      pos_cat: position.pos_cat || '',
      comp_view: position.comp_view || '',
      m_have: position.m_have || '',
      g_have: position.g_have || '',
      compet: position.compet || '',
      key_res: position.key_res || '',
    };
    sessionStorage.setItem('copiedPosition', JSON.stringify(copyData));
    navigate('/ad_panel#add-position');
  };

  // Handle PAUSE/UNPAUSE
  const handlePauseToggle = async () => {
    setActionLoading(true);
    try {
      const action = selectedPosition.status === 'paused' ? 'unpause' : 'pause';
      console.log(`Attempting to ${action} position:`, selectedPosition.id);
      
      const res = await axios.post(`/candidate/pos/pause/${selectedPosition.id}`, {
        action: action
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Pause response:', res.data);
      
      if (res.data.success) {
        showSuccess(res.data.message);
        setPauseDialogOpen(false);
        fetchMyPositions();
      } else {
        setError(res.data.message || 'Failed to update position status');
      }
    } catch (err) {
      console.error('Error pausing position:', err);
      console.error('Error response:', err.response);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to modify this position.');
      } else if (err.response?.status === 404) {
        setError('Position not found. It may have been deleted.');
      } else {
        const errorMessage = err.response?.data?.message || err.response?.statusText || 'Failed to update position status';
        setError(errorMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle DELETE
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      console.log("Attempting to delete position:", selectedPosition.id);
      
      const res = await axios.delete(`/candidate/pos/delete/${selectedPosition.id}`, {
        withCredentials: true
      });
      
      console.log('Delete response:', res.data);
      
      if (res.data.success) {
        showSuccess('Position deleted successfully!');
        setDeleteDialogOpen(false);
        fetchMyPositions();
      } else {
        setError(res.data.message || 'Failed to delete position');
      }
    } catch (err) {
      console.error('Error deleting position:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.response?.statusText || 'Failed to delete position';
      setError(`${errorMessage}. Please check if you have permission to delete this position.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 border-2 border-yellow-200 font-bold text-xs">
          <Pause size={12} />
          Paused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 border-2 border-green-200 font-bold text-xs">
        <CheckCircle size={12} />
        Active
      </span>
    );
  };

  // Action buttons shown at the bottom of every card
  const renderActions = (position) => (
    <div className="flex items-center justify-between gap-1.5 pt-3 mt-auto border-t border-gray-100">
      {/* VIEW */}
      <button
        onClick={() => handleView(position)}
        className="flex-1 flex flex-col items-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-[10px] font-semibold"
        title="View Details"
      >
        <Eye size={16} />
        View
      </button>

      {/* COPY */}
      <button
        onClick={() => handleCopy(position)}
        disabled={actionLoading}
        className="flex-1 flex flex-col items-center gap-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-[10px] font-semibold disabled:opacity-50"
        title="Copy Position"
      >
        <Copy size={16} />
        Copy
      </button>

      {/* MODIFY */}
      <button
        onClick={() => handleEdit(position)}
        className="flex-1 flex flex-col items-center gap-1 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors text-[10px] font-semibold"
        title="Modify Position"
      >
        <Edit size={16} />
        Modify
      </button>

      {/* PAUSE/UNPAUSE */}
      <button
        onClick={() => { setSelectedPosition(position); setPauseDialogOpen(true); }}
        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors text-[10px] font-semibold ${
          position.status === 'paused'
            ? 'bg-green-50 hover:bg-green-100 text-green-700'
            : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
        }`}
        title={position.status === 'paused' ? 'Activate Position' : 'Pause Position'}
      >
        {position.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
        {position.status === 'paused' ? 'Activate' : 'Pause'}
      </button>

      {/* DELETE */}
      <button
        onClick={() => { setSelectedPosition(position); setDeleteDialogOpen(true); }}
        className="flex-1 flex flex-col items-center gap-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-[10px] font-semibold"
        title="Delete Position"
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );

  const isActive = (position) => (position?.status || 'active') !== 'paused';

  // Status counts
  const statusCounts = useMemo(() => ({
    all: positions.length,
    active: positions.filter(isActive).length,
    paused: positions.filter(p => !isActive(p)).length,
  }), [positions]);

  // Category counts (by pos_cat), preserving a preferred order then any extras
  const categoryCounts = useMemo(() => {
    const counts = {};
    positions.forEach(p => {
      const c = p.pos_cat;
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    const ordered = [
      ...PREFERRED_CATS.filter(c => counts[c]),
      ...Object.keys(counts).filter(c => !PREFERRED_CATS.includes(c)).sort(),
    ];
    return ordered.map(c => ({ label: c, count: counts[c] }));
  }, [positions]);

  // Apply filters
  const filteredPositions = useMemo(() => {
    return positions.filter(p => {
      if (statusFilter === 'active' && !isActive(p)) return false;
      if (statusFilter === 'paused' && isActive(p)) return false;
      if (catFilter && p.pos_cat !== catFilter) return false;
      return true;
    });
  }, [positions, statusFilter, catFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your positions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md border-2 border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchMyPositions}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-orange-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                My Added Positions
              </h2>
              <p className="text-blue-100 text-sm">
                Manage your created positions with full control
              </p>
            </div>
            <button
              onClick={fetchMyPositions}
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

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Recruiters</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatNumber(summary.totalRecruiters)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
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

          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{formatNumber(summary.totalRemaining)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-yellow-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Briefcase className="text-blue-600 w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 mb-1">Position Management</p>
              <p className="text-sm text-blue-700">
                <strong>VIEW</strong> - See position details | 
                <strong> COPY</strong> - Create a duplicate position | 
                <strong> MODIFY</strong> - Edit position details | 
                <strong> PAUSE</strong> - Hide from recruiters | 
                <strong> DELETE</strong> - Remove position
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                  <Pause size={12} /> Paused
                </span> positions are hidden from recruiters and will not receive new candidates.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        {positions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Status filters */}
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                statusFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All <span className="ml-1 opacity-80">({statusCounts.all})</span>
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                statusFilter === 'active' ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              }`}
            >
              Active <span className="ml-1 opacity-80">({statusCounts.active})</span>
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                statusFilter === 'paused' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
              }`}
            >
              Paused <span className="ml-1 opacity-80">({statusCounts.paused})</span>
            </button>

            {/* Divider + category filters */}
            {categoryCounts.length > 0 && <span className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />}
            {categoryCounts.map(cat => (
              <button
                key={cat.label}
                onClick={() => setCatFilter(prev => prev === cat.label ? '' : cat.label)}
                className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                  catFilter === cat.label ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {cat.label} <span className="ml-1 opacity-80">({cat.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Positions Cards */}
        {positions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Positions Found</h3>
            <p className="text-gray-500 mb-4">You haven't created any positions yet.</p>
            <p className="text-sm text-gray-400">
              Create a position to see it listed here with all management options.
            </p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Positions Match</h3>
            <p className="text-gray-500">Try a different filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPositions.map((position) => {
              const loc = Array.isArray(position.location)
                ? position.location.filter(Boolean).slice(0, 2).join(', ') + (position.location.filter(Boolean).length > 2 ? '…' : '')
                : (position.location || '');
              return (
                <div
                  key={position.id}
                  className={`bg-white rounded-2xl shadow-sm border flex flex-col gap-3 p-4 transition-all hover:shadow-md ${
                    position.status === 'paused' ? 'border-yellow-200' : 'border-gray-200'
                  }`}
                >
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{position.position || '—'}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {position.pos_id}</p>
                    </div>
                    {getStatusBadge(position.status)}
                  </div>

                  {/* Client + HR */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Briefcase size={13} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate font-medium">{position.client || 'Confidential'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User size={13} className="text-purple-400 flex-shrink-0" />
                      <span className="truncate">HR: {position.hr_name || 'N/A'}</span>
                    </div>
                    {loc && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                        <span className="truncate">{loc}</span>
                      </div>
                    )}
                  </div>

                  {/* Counts */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                      (position.candidateCount || 0) > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <Users size={12} /> {position.candidateCount || 0} candidates
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
                      <User size={12} /> {position.recruitersCount || 0} recruiters
                    </span>
                  </div>

                  {/* Posted date */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={11} />
                    <span>{formatDate(position.datePosted)}</span>
                  </div>

                  {/* Action buttons at the bottom */}
                  {renderActions(position)}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* VIEW Modal - full position detail with share URL */}
      {viewModalOpen && selectedPosition && (
        <ViewPositionModal
          position={selectedPosition}
          onClose={() => { setViewModalOpen(false); setSelectedPosition(null); }}
        />
      )}

      {/* PAUSE Dialog */}
      <Dialog open={pauseDialogOpen} onClose={() => setPauseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <span>{selectedPosition?.status === 'paused' ? 'Activate Position' : 'Pause Position'}</span>
            <button onClick={() => setPauseDialogOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-6">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              selectedPosition?.status === 'paused' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              {selectedPosition?.status === 'paused' ? <Play size={32} /> : <Pause size={32} />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {selectedPosition?.status === 'paused' 
                ? 'Activate This Position?' 
                : 'Pause This Position?'}
            </h3>
            <p className="text-gray-600 mb-2">
              <strong>Position:</strong> {selectedPosition?.position}
            </p>
            <p className="text-gray-500 text-sm">
              {selectedPosition?.status === 'paused' 
                ? 'Once activated, recruiters will be able to see this position and submit candidates.'
                : 'Once paused, this position will be hidden from recruiters and will not receive new candidates. You can reactivate it anytime.'}
            </p>
          </div>
        </DialogContent>
        <DialogActions className="p-4 bg-gray-50 justify-center">
          <Button onClick={() => setPauseDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            onClick={handlePauseToggle} 
            variant="contained"
            disabled={actionLoading}
            className={selectedPosition?.status === 'paused' ? 'bg-green-600' : 'bg-yellow-500'}
          >
            {actionLoading ? 'Processing...' : (selectedPosition?.status === 'paused' ? 'Activate' : 'Pause')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT Modal - same form as Add Position, pre-filled with data */}
      {editModalOpen && selectedPosition && (
        <EditPositionModal
          position={selectedPosition}
          onClose={() => { setEditModalOpen(false); setSelectedPosition(null); }}
          onSuccess={() => { fetchMyPositions(); showSuccess('Position updated successfully!'); }}
        />
      )}

      {/* DELETE Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <span>Delete Position</span>
            <button onClick={() => setDeleteDialogOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete This Position?</h3>
            <p className="text-gray-600 mb-2">
              <strong>Position:</strong> {selectedPosition?.position}
            </p>
            <p className="text-red-500 text-sm">
              ⚠️ This action cannot be undone. All candidate data associated with this position will be lost.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="p-4 bg-gray-50 justify-center">
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disabled={actionLoading}
            className="bg-red-600"
          >
            {actionLoading ? 'Deleting...' : 'Delete Position'}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default MyAddedPositions;

