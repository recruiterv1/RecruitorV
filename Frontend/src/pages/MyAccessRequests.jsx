import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, Clock, CheckCircle, XCircle, AlertCircle, Users, Calendar, Trash2, RefreshCw, LogOut, Building } from 'lucide-react';
import { Box, Chip } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { SidebarProvider } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';

const MyAccessRequestsContent = () => {
  const { user } = useContext(UserStateContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [positionCount, setPositionCount] = useState(null);
  const [myPositions, setMyPositions] = useState([]);
  const [releasingId, setReleasingId] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchPositionCount();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsRes, statsRes, positionsRes] = await Promise.all([
        axios.get('/api/position-access/recruiter', { withCredentials: true }),
        axios.get('/api/position-access/recruiter/stats', { withCredentials: true }),
        axios.get('/api/position-access/my-positions', { withCredentials: true })
      ]);

      setRequests(requestsRes.data.data || []);
      setStats(statsRes.data.data);
      setMyPositions(positionsRes.data.data?.assignments || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error.response?.data?.message || 'Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionCount = async () => {
    try {
      const response = await axios.get('/api/position-access/recruiter/position-count', { withCredentials: true });
      setPositionCount(response.data.data);
    } catch (error) {
      console.error('Error fetching position count:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      case 'waitlist':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      case 'expired':
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle };
      case 'released':
        return { bg: 'bg-orange-100', text: 'text-orange-800', icon: LogOut };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    }
  };

  const handleCloseRequest = async (requestId) => {
    if (!confirm('Are you sure you want to close this position request?')) return;

    try {
      await axios.delete(`/api/position-access/${requestId}/close`, { withCredentials: true });
      await fetchRequests(); // Refresh data
      await fetchPositionCount();
    } catch (error) {
      console.error('Error closing request:', error);
      alert('Failed to close request. Please try again.');
    }
  };

  const handleReleasePosition = async (positionId, positionTitle) => {
    if (!confirm(`Are you sure you want to leave "${positionTitle}"? This will free up a position slot.`)) return;

    setReleasingId(positionId);
    try {
      await axios.post(`/api/position-access/release/${positionId}`, {}, { withCredentials: true });
      await fetchRequests();
      await fetchPositionCount();
      alert('Position released successfully! You can now assign a new position.');
    } catch (error) {
      console.error('Error releasing position:', error);
      alert(error.response?.data?.message || 'Failed to release position. Please try again.');
    } finally {
      setReleasingId(null);
    }
  };

  // Access Requests Table Columns
  const requestsColumns = [
    {
      accessorKey: 'positionTitle',
      header: 'Position',
      size: 200,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-blue-600" />
          <span className="font-medium">{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      size: 150,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      Cell: ({ cell }) => {
        const status = cell.getValue();
        const { bg, text, icon: Icon } = getStatusColor(status);
        return (
          <Chip
            icon={<Icon size={14} />}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size="small"
            className={`${bg} ${text}`}
            variant="outlined"
          />
        );
      },
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      size: 120,
      Cell: ({ cell }) => formatDate(cell.getValue()),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      size: 120,
      Cell: ({ cell }) => {
        const expiresAt = cell.getValue();
        if (!expiresAt) return 'N/A';

        const expiryDate = new Date(expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
          return <span className="text-red-600 font-medium">Expired</span>;
        } else if (daysLeft === 0) {
          return <span className="text-orange-600 font-medium">Today</span>;
        } else {
          return <span className="text-green-600 font-medium">{daysLeft} days</span>;
        }
      },
    },
  ];

  // My Positions Table Columns
  const positionsColumns = [
    {
      accessorKey: 'positionTitle',
      header: 'Position',
      size: 200,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Building size={16} className="text-green-600" />
          <span className="font-medium">{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      size: 150,
    },
    {
      accessorKey: 'requestedAt',
      header: 'Assigned On',
      size: 120,
      Cell: ({ cell }) => formatDate(cell.getValue()),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Valid Until',
      size: 120,
      Cell: ({ cell }) => formatDate(cell.getValue()),
    },
  ];

  const requestsTable = useMaterialReactTable({
    columns: requestsColumns,
    data: requests,
    enableRowActions: false, // Hide action column for free users
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #2563eb, #f97316)',
        color: 'white',
        fontWeight: 'bold',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#f8fafc',
        },
      },
    },
    state: {
      isLoading: loading,
    },
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: false,
    enableGlobalFilter: true,
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'requestedAt', desc: true }],
    },
  });

  const positionsTable = useMaterialReactTable({
    columns: positionsColumns,
    data: myPositions,
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleReleasePosition(row.original.positionId, row.original.positionTitle)}
          disabled={releasingId === row.original.positionId}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all font-medium text-sm disabled:opacity-50"
          title="Leave this position to free up a slot"
        >
          {releasingId === row.original.positionId ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <LogOut size={14} />
          )}
          {releasingId === row.original.positionId ? 'Releasing...' : 'Leave Position'}
        </button>
      </Box>
    ),
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #16a34a, #22c55e)',
        color: 'white',
        fontWeight: 'bold',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#f0fdf4',
        },
      },
    },
    state: {
      isLoading: loading,
    },
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: false,
    initialState: {
      pagination: { pageSize: 5 },
      sorting: [{ id: 'requestedAt', desc: true }],
    },
  });

  // Check if user is free plan
  const isFreePlan = positionCount?.isFreePlan;

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Position Count Card for Free Users */}
      {positionCount && isFreePlan && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Briefcase size={24} />
                My Position Count
              </h3>
              <p className="text-orange-100 text-sm mt-1">
                Free Plan - Maximum 4 positions allowed
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{positionCount.currentCount}</p>
                <p className="text-sm text-orange-100">Assigned</p>
              </div>
              <div className="text-2xl font-bold">/</div>
              <div className="text-center">
                <p className="text-4xl font-bold">{positionCount.maxPositions}</p>
                <p className="text-sm text-orange-100">Maximum</p>
              </div>
              
              <div className="ml-4 px-4 py-2 bg-white/20 rounded-xl text-center">
                <p className="text-2xl font-bold">{positionCount.positionsRemaining}</p>
                <p className="text-xs text-orange-100">Available</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Used</span>
              <span>Available</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${Math.min((positionCount.currentCount / positionCount.maxPositions) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Upgrade Message */}
          {positionCount.currentCount >= positionCount.maxPositions && (
            <div className="mt-4 bg-white/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="flex-shrink-0" />
              <div>
                <p className="font-semibold">You've reached your limit!</p>
                <p className="text-sm text-orange-100">
                  Upgrade your plan to assign more positions. Leave an existing position to free up a slot.
                </p>
              </div>
            </div>
          )}

          {/* Days Remaining */}
          {positionCount.daysRemaining !== undefined && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Calendar size={16} />
              <span>{positionCount.daysRemaining} days remaining in your free plan</span>
            </div>
          )}
        </div>
      )}

      {/* My Positions Section */}
      {myPositions.length > 0 && (
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">My Assigned Positions</h3>
                <p className="text-green-100 text-sm">
                  Positions you can work on - Click "Leave Position" to free up a slot
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <MaterialReactTable table={positionsTable} />
          </div>
        </div>
      )}

      {/* Access Requests Section */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">My Access Requests</h3>
              <p className="text-blue-100 text-sm">
                Track your position access requests and approvals
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.currentlyWorking ?? 0}/{stats.maxPositions ?? 4}</p>
              <p className="text-xs text-gray-600">Positions In Use</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{Math.max(0, (stats.maxPositions ?? 4) - (stats.currentlyWorking ?? 0))}</p>
              <p className="text-xs text-gray-600">Slots Remaining</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{requests.filter(r => r.status === 'released').length}</p>
              <p className="text-xs text-gray-600">Released</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{requests.length}</p>
              <p className="text-xs text-gray-600">Total (History)</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />
            <div className="text-blue-800">
              <p className="font-semibold">Free Plan:</p>
              <p>You can work on up to {stats?.maxPositions ?? 4} positions at a time (positions with at least 1 active candidate). Release a position any time to free a slot — your work history is preserved, and you can re-assign it later if a slot is free.</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          <MaterialReactTable table={requestsTable} />
        </div>

      </div>
    </div>
  );
};

const MyAccessRequests = () => {
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
          <main className="min-h-screen">
            <MyAccessRequestsContent />
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

export default MyAccessRequests;
