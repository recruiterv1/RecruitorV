import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, User, RefreshCw, Clock, CheckCircle, AlertCircle,
  Eye, Copy, Edit, Pause, Play, Trash2, X, Check
} from 'lucide-react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';

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

const MyAddedPositions = () => {
  const { user } = useContext(UserStateContext);
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
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
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

  // Handle VIEW - Navigate to ClientSPOC-specific page in read-only SPOC mode
  const handleView = (position) => {
    navigate(`/clientspoc-dash-view/${position.pos_id}`);
  };

  // Handle EDIT - Navigate to ClientSpocDashView in editable mode (same as Add Position form)
  const handleEdit = (position) => {
    navigate(`/clientspoc-dash-view/${position.pos_id}?mode=edit`);
  };

  // Handle COPY
  const handleCopy = async (position) => {
    if (!window.confirm(`Are you sure you want to copy position "${position.position}"?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      console.log("Attempting to copy position:", position.id);
      
      const res = await axios.post(`/candidate/pos/copy/${position.id}`, {}, {
        withCredentials: true
      });
      
      console.log('Copy response:', res.data);
      
      if (res.data.success) {
        showSuccess(`Position copied successfully! New Position ID: ${res.data.data.pos_id}`);
        fetchMyPositions();
      } else {
        setError(res.data.message || 'Failed to copy position');
      }
    } catch (err) {
      console.error('Error copying position:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to copy position');
    } finally {
      setActionLoading(false);
    }
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

  // Table columns
  const columns = [
    {
      accessorKey: 'position',
      header: 'Position',
      size: 200,
      Cell: ({ cell, row }) => (
        <div>
          <p className="font-bold text-gray-900 text-sm">{cell.getValue()}</p>
          <p className="text-xs text-gray-500">ID: {row.original.pos_id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      Cell: ({ cell }) => getStatusBadge(cell.getValue()),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      size: 140,
      Cell: ({ cell }) => (
        <span className="font-medium text-gray-700 text-sm">
          {cell.getValue() || 'Confidential'}
        </span>
      ),
    },
    {
      accessorKey: 'hr_name',
      header: 'HR Name',
      size: 130,
      Cell: ({ cell }) => (
        <span className="font-medium text-gray-700 text-sm">
          {cell.getValue() || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'candidateCount',
      header: 'Candidates',
      size: 100,
      Cell: ({ cell }) => {
        const count = cell.getValue() || 0;
        return (
          <div className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-sm font-bold ${
            count > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            <Users size={14} className="mr-1" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'recruitersCount',
      header: 'Recruiters',
      size: 100,
      Cell: ({ cell }) => {
        const count = cell.getValue() || 0;
        return (
          <div className="inline-flex items-center justify-center px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">
            <User size={14} className="mr-1" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'datePosted',
      header: 'Posted On',
      size: 120,
      Cell: ({ cell }) => (
        <span className="text-gray-600 text-sm">
          {formatDate(cell.getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      size: 220,
      Cell: ({ row }) => {
        const position = row.original;
        return (
          <div className="flex items-center gap-1">
            {/* VIEW */}
            <button
              onClick={() => handleView(position)}
              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            
            {/* COPY */}
            <button
              onClick={() => handleCopy(position)}
              disabled={actionLoading}
              className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
              title="Copy Position"
            >
              <Copy size={16} />
            </button>
            
            {/* MODIFY */}
            <button
              onClick={() => handleEdit(position)}
              className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
              title="Modify Position"
            >
              <Edit size={16} />
            </button>
            
            {/* PAUSE/UNPAUSE */}
            <button
              onClick={() => {
                setSelectedPosition(position);
                setPauseDialogOpen(true);
              }}
              className={`p-2 rounded-lg transition-colors ${
                position.status === 'paused' 
                  ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                  : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
              }`}
              title={position.status === 'paused' ? 'Activate Position' : 'Pause Position'}
            >
              {position.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            </button>
            
            {/* DELETE */}
            <button
              onClick={() => {
                setSelectedPosition(position);
                setDeleteDialogOpen(true);
              }}
              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              title="Delete Position"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: positions,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    enableRowActions: false,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'datePosted', desc: true }],
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: 'calc(100vh - 400px)',
        minHeight: '400px',
      },
    },
    muiTableProps: {
      sx: {
        '& .MuiTableCell-root': {
          borderBottom: '1px solid #e5e7eb',
          padding: '8px 12px',
        },
      },
    },
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #eff6ff, #fff7ed)',
        borderBottom: '2px solid #bfdbfe',
        fontWeight: '600',
        color: '#1f2937',
        padding: '12px',
      },
    },
    muiTableBodyRowProps: {
      sx: {
        cursor: 'default',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        transition: 'all 0.3s',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        padding: '12px 16px',
      },
    },
    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
        border: 'none',
      },
    },
    muiTopToolbarProps: {
      sx: {
        background: 'linear-gradient(to right, #2563eb, #f97316)',
        padding: '12px',
        '& .MuiBox-root': {
          color: 'white',
        },
        '& .MuiIconButton-root': {
          color: 'white',
        },
        '& .MuiInputBase-root': {
          color: 'white',
          '&::before': {
            borderBottomColor: 'rgba(255,255,255,0.5)',
          },
        },
      },
    },
    state: {
      isLoading: loading,
    },
  });

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

        {/* Positions Table */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
          {positions.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No Positions Found</h3>
              <p className="text-gray-500 mb-4">You haven't created any positions yet.</p>
              <p className="text-sm text-gray-400">
                Create a position to see it listed here with all management options.
              </p>
            </div>
          ) : (
            <div className="p-2 sm:p-3 lg:p-4">
              <MaterialReactTable table={table} />
            </div>
          )}
        </div>

      </div>

      {/* VIEW Dialog - Same form as Add Position but readonly */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <span>Position Details (Read Only)</span>
            <button onClick={() => setViewDialogOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-6">
          {selectedPosition && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Position Name"
                  name="position"
                  value={selectedPosition.position || ''}
                  disabled
                />
                <Input
                  label="Position ID"
                  name="pos_id"
                  value={selectedPosition.pos_id || ''}
                  disabled
                />
                <Input
                  label="HR Name"
                  name="hr_name"
                  value={selectedPosition.hr_name || ''}
                  disabled
                />
                <Input
                  label="Client"
                  name="client"
                  value={selectedPosition.client || ''}
                  disabled
                />
                <Input
                  label="Key Responsibilities"
                  name="key_res"
                  value={selectedPosition.key_res || ''}
                  disabled
                />
                <Input
                  label="Must Have"
                  name="m_have"
                  value={selectedPosition.m_have || ''}
                  disabled
                />
                <Input
                  label="Good To Have"
                  name="g_have"
                  value={selectedPosition.g_have || ''}
                  disabled
                />
                <Input
                  label="Competencies"
                  name="compet"
                  value={selectedPosition.compet || ''}
                  disabled
                />
                <Input
                  label="Experience"
                  name="experience"
                  value={selectedPosition.experience || ''}
                  disabled
                />
                <Input
                  label="Commission (%)"
                  name="commison"
                  type="number"
                  value={selectedPosition.commison || ''}
                  disabled
                />
                <Input
                  label="State"
                  name="state"
                  value={Array.isArray(selectedPosition.state) ? selectedPosition.state.join(', ') : selectedPosition.state || ''}
                  disabled
                />
                <Input
                  label="City"
                  name="location"
                  value={Array.isArray(selectedPosition.location) ? selectedPosition.location.join(', ') : selectedPosition.location || ''}
                  disabled
                />
                <Textarea
                  label="Company Overview"
                  name="comp_view"
                  value={selectedPosition.comp_view || ''}
                  disabled
                />
                <Input
                  label="CTC Start"
                  name="ctcStart"
                  value={selectedPosition.ctcStart || ''}
                  disabled
                />
                <Input
                  label="CTC End"
                  name="ctcEnd"
                  value={selectedPosition.ctcEnd || ''}
                  disabled
                />
                <Select
                  label="Position Category"
                  name="pos_cat"
                  value={selectedPosition.pos_cat || ''}
                  options={["Immediate Hiring", "Interview Drives", "Fast Response", "High Commission", "New"]}
                  disabled
                />
                <Textarea
                  label="Job Summary"
                  name="job_desc"
                  value={selectedPosition.job_desc || ''}
                  disabled
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-4 bg-gray-50">
          <Button onClick={() => setViewDialogOpen(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

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

