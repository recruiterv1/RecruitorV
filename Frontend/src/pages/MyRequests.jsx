import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Box } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { SidebarProvider } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';

const MyRequestsContent = () => {
  const { user } = useContext(UserStateContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/position-access/recruiter', { withCredentials: true });
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: Clock };
      case 'waitlist':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: AlertCircle };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: XCircle };
      case 'expired':
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: AlertCircle };
    }
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const columns = [
    {
      accessorKey: 'serialNumber',
      header: 'S.No.',
      size: 70,
      enableColumnOrdering: false,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
      Cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <span className="font-bold text-gray-700 text-xs sm:text-sm bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
            {row.index + 1}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'positionTitle',
      header: 'Position',
      size: 200,
      Cell: ({ cell, row }) => (
        <div>
          <p className="font-bold text-gray-900 text-xs sm:text-sm">{cell.getValue()}</p>
          <p className="text-xs text-gray-500">{row.original.client}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      Cell: ({ cell }) => {
        const status = cell.getValue();
        const { bg, text, border, icon: Icon } = getStatusColor(status);
        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${bg} ${text} ${border}`}>
            <Icon size={12} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      size: 120,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Calendar size={12} className="text-blue-500" />
          <span className="text-xs sm:text-sm">{formatDate(cell.getValue())}</span>
        </div>
      ),
    },
    {
      accessorKey: 'respondedAt',
      header: 'Responded',
      size: 120,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={12} className="text-orange-500" />
          <span className="text-xs sm:text-sm">{formatDate(cell.getValue()) || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      size: 120,
      Cell: ({ cell }) => {
        const expiresAt = cell.getValue();
        if (!expiresAt) return <span className="text-gray-400 text-xs">N/A</span>;

        const expiryDate = new Date(expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        let colorClass = 'text-green-600';
        if (daysLeft < 0) colorClass = 'text-red-600';
        else if (daysLeft <= 3) colorClass = 'text-orange-600';

        return (
          <span className={`font-medium text-xs ${colorClass}`}>
            {daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
          </span>
        );
      },
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: filteredRequests,
    enableRowActions: true,
    enableColumnOrdering: true,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    muiTableContainerProps: {
      sx: {
        maxHeight: 'calc(100vh - 500px)',
        minHeight: '300px',
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
        background: 'linear-gradient(to right, #2563eb, #f97316)',
        color: 'white',
        fontWeight: 'bold',
        padding: '12px',
      },
    },
    muiTableBodyRowProps: {
      sx: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        transition: 'all 0.3s',
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
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: 'requestedAt', desc: true }],
    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        width: '100%',
      }}>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all font-semibold text-sm"
          title="Refresh requests"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium border-2 border-white/30 focus:border-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="waitlist">Waitlist</option>
          <option value="expired">Expired</option>
        </select>
      </Box>
    ),
  });

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    waitlist: requests.filter(r => r.status === 'waitlist').length,
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">My Requests</h3>
                  <p className="text-blue-100 text-sm">
                    {requests.length} request{requests.length !== 1 ? 's' : ''} • Track your position access requests
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-blue-100">Total</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-yellow-300">{stats.pending}</p>
                  <p className="text-xs text-blue-100">Pending</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-green-300">{stats.approved}</p>
                  <p className="text-xs text-blue-100">Approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-100 px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-gray-600">
                <Filter size={16} />
                <span className="font-medium text-sm">Filter by Status:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All', count: stats.total },
                  { value: 'pending', label: 'Pending', count: stats.pending, color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'approved', label: 'Approved', count: stats.approved, color: 'bg-green-100 text-green-800' },
                  { value: 'rejected', label: 'Rejected', count: stats.rejected, color: 'bg-red-100 text-red-800' },
                  { value: 'waitlist', label: 'Waitlist', count: stats.waitlist, color: 'bg-blue-100 text-blue-800' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === filter.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {filter.label}
                    {filter.count !== undefined && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                        statusFilter === filter.value ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-b-2 border-blue-200 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <AlertCircle size={16} className="flex-shrink-0" />
              <p>
                <span className="font-semibold">Note:</span> Requests are valid for the duration of your free plan. 
                Approved requests allow you to submit candidates to the respective positions.
              </p>
            </div>
          </div>

          {/* Material React Table */}
          <div className="p-2 sm:p-3 lg:p-4">
            <MaterialReactTable table={table} />
          </div>

        </div>
      </div>
    </div>
  );
};

const MyRequests = () => {
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
            <MyRequestsContent />
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

export default MyRequests;

