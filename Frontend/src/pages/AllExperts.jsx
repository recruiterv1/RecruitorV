import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Briefcase, Users, User, RefreshCw, Clock, CheckCircle, AlertCircle,
  Eye, Edit, Trash2, Mail, Phone, Award
} from 'lucide-react';
import { Box } from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Sidebar from '../pages/Sidebar';

const AllExperts = () => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isCollapsed = isSidebarCollapsed || false;
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchExperts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/coach-expert/expert/all', {
        withCredentials: true
      });

      if (res.data.success) {
        setExperts(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to fetch experts');
      }
    } catch (err) {
      console.error('Error fetching experts:', err);
      setError(err.response?.data?.message || 'Failed to fetch experts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when user is loaded
    if (user) {
      fetchExperts();
    }
  }, [user]);

  // Format date
  const formatDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      if (dateData._seconds) {
        return new Date(dateData._seconds * 1000).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } else if (dateData.toDate) {
        return dateData.toDate().toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      return new Date(dateData).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Check if current user can delete
  const canDelete = () => {
    if (!user) return false;
    const isAdmin = user?.role === 'admin' || user?.roleCategory === 'Admin';
    return isAdmin;
  };

  // Handle delete expert
  const handleDelete = async (expert) => {
    if (!canDelete()) {
      alert("You don't have permission to delete experts.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this expert?\n\n` +
      `Name: ${expert.name}\n` +
      `Email: ${expert.email}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(expert.id);
      const res = await axios.delete(`/api/coach-expert/expert/${expert.id}`, {
        withCredentials: true
      });

      if (res.data.success) {
        alert("Expert deleted successfully!");
        fetchExperts();
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 403) {
        alert(err.response.data.message || "You don't have permission to delete this expert.");
      } else if (err.response?.status === 404) {
        alert("Expert not found.");
      } else {
        alert("Failed to delete expert. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Format number
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // Table columns
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
          <span className="font-bold text-gray-700 text-xs sm:text-sm bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
            {row.index + 1}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Expert Name',
      size: 200,
      Cell: ({ cell, row }) => (
        <div>
          <p className="font-bold text-gray-900 text-sm">{cell.getValue()}</p>
          <p className="text-xs text-gray-500">{row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 220,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          <span className="font-medium text-gray-700 text-sm">
            {cell.getValue() || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 140,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <span className="font-medium text-gray-700 text-sm">
            {cell.getValue() || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      size: 200,
      Cell: ({ cell }) => (
        <div className="flex flex-wrap gap-1">
          {cell.getValue()?.split(',').map((spec, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
            >
              <Award size={10} className="mr-1" />
              {spec.trim()}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'userType',
      header: 'Type',
      size: 100,
      Cell: ({ cell }) => {
        const type = cell.getValue();
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
            type === 'paid'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {type === 'paid' ? 'Paid' : 'Free'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      size: 120,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={12} className="text-orange-500" />
          <span className="text-sm">{formatDate(cell.getValue())}</span>
        </div>
      ),
    },
  ];

  // Loading state - shows while checking auth
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-orange-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading experts...</p>
        </div>
      </div>
    );
  }

  const table = useMaterialReactTable({
    columns,
    data: experts,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    enableRowActions: true,
    getRowId: (row) => row.id,

    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'name', desc: false }],
    },

    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '8px', minWidth: '100px', justifyContent: 'center' }}>
        {canDelete() && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
            disabled={deletingId === row.original.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium text-xs shadow-md disabled:opacity-50"
            title="Delete expert"
          >
            <Trash2 size={14} />
            <span>{deletingId === row.original.id ? '...' : 'Delete'}</span>
          </button>
        )}
      </Box>
    ),

    displayColumnDefOptions: {
      'mrt-row-actions': {
        size: 120,
        header: 'Actions',
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
    },

    positionActionsColumn: 'last',

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
        background: 'linear-gradient(to right, #f5f3ff, #fff7ed)',
        borderBottom: '2px solid #ddd6fe',
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

    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
        border: 'none',
      },
    },

    muiTopToolbarProps: {
      sx: {
        background: 'linear-gradient(to right, #9333ea, #f97316)',
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-orange-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading experts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-orange-50/30">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md border-2 border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchExperts}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
        {isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />}
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
          <div className="w-full max-w-full mx-auto">

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    All Experts
                  </h2>
                  <p className="text-purple-100 text-sm">
                    View all registered experts with their details
                  </p>
                </div>
                <button
                  onClick={fetchExperts}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Experts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatNumber(experts.length)}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Paid Experts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">
                      {formatNumber(experts.filter(e => e.userType === 'paid').length)}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Free Experts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-600">
                      {formatNumber(experts.filter(e => e.userType === 'free').length)}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="text-gray-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">With Phone</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                      {formatNumber(experts.filter(e => e.phone && e.phone.trim()).length)}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Phone className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Experts Table */}
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
              {experts.length === 0 ? (
                <div className="p-12 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No Experts Found</h3>
                  <p className="text-gray-500 mb-4">No experts have been registered yet.</p>
                  <p className="text-sm text-gray-400">
                    Experts will appear here once they are added to the system.
                  </p>
                </div>
              ) : (
                <div className="p-2 sm:p-3 lg:p-4">
                  <MaterialReactTable table={table} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AllExperts;

