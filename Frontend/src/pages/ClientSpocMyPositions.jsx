import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, User, RefreshCw, Clock, CheckCircle, AlertCircle,
  Menu, ArrowLeft
} from 'lucide-react';
import { Box } from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';

const ClientSpocMyPositions = () => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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
  const navigate = useNavigate();

  const isCollapsed = isSidebarCollapsed || false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Get status color
  const getStatusColor = (status) => {
    const successStatuses = ['Offer Accepted', 'Joining'];
    const rejectionStatuses = ['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject', 'Background Verification Reject', 'Negotiation Reject', 'Offer Declined', 'Test Reject', 'Client Drop', 'Candidate Drop', 'Duplicate'];

    if (successStatuses.includes(status)) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (rejectionStatuses.includes(status)) {
      return 'bg-red-100 text-red-700 border-red-200';
    } else {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  // Format number
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
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
      accessorKey: 'maxCandidate',
      header: 'Max Limit',
      size: 90,
      Cell: ({ cell }) => (
        <span className="font-semibold text-blue-700 text-sm">
          {cell.getValue() || 10}
        </span>
      ),
    },
    {
      accessorKey: 'remaining',
      header: 'Remaining',
      size: 90,
      Cell: ({ cell }) => {
        const remaining = cell.getValue() || 0;
        
        let bgColor = 'bg-green-100 text-green-700';
        if (remaining === 0) {
          bgColor = 'bg-red-100 text-red-700';
        } else if (remaining <= 3) {
          bgColor = 'bg-orange-100 text-orange-700';
        }
        
        return (
          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-sm font-bold ${bgColor}`}>
            {remaining}
          </span>
        );
      },
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: positions,
    enableExpanding: true,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: false,
    enableHiding: true,
    enableRowActions: false,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'position', desc: false }],
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
    muiExpandButtonProps: ({ row }) => ({
      sx: {
        color: '#2563eb',
        transform: row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
        },
      },
    }),
    renderDetailPanel: ({ row }) => {
      const position = row.original;
      
      if (!position.recruiters || position.recruiters.length === 0) {
        return (
          <Box sx={{ padding: '16px', backgroundColor: '#f9fafb', textAlign: 'center', borderRadius: '8px' }}>
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No candidates submitted yet</p>
            <p className="text-sm text-gray-400">Recruiters will appear here once they submit candidates</p>
          </Box>
        );
      }

      return (
        <Box sx={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Recruiter-wise Candidate Details
            </h4>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
              {position.recruiters.length} Recruiter{position.recruiters.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            {position.recruiters.map((recruiter, recIndex) => (
              <div 
                key={recIndex} 
                className="bg-white rounded-lg border-2 border-blue-100 overflow-hidden"
              >
                {/* Recruiter Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {recruiter.recruiterName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{recruiter.recruiterName}</p>
                        <p className="text-xs text-gray-500">{recruiter.recruiterEmail || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                        {recruiter.candidateCount} Candidate{recruiter.candidateCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidates List */}
                <div className="p-4">
                  {recruiter.candidates && recruiter.candidates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recruiter.candidates.map((candidate, candIndex) => (
                        <div 
                          key={candIndex} 
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {candidate.candidateName}
                              </p>
                              {candidate.dateAdded && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Clock size={12} className="text-gray-400" />
                                  <span>Submitted: {formatDate(candidate.dateAdded)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            <CheckCircle size={12} />
                            <span>{candidate.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No candidates found
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Box>
      );
    },
    state: {
      isLoading: loading,
    },
  });

  if (!isMounted || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
        <ClientSpocSidebar />
      </aside>

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
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
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
                <h1 className="text-lg font-bold text-gray-900">My Positions</h1>
                <p className="text-sm text-gray-500">Viewing as {user?.name || 'Client SPOC'}</p>
              </div>
            </div>
            <button
              onClick={fetchMyPositions}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen">
          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading your positions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md border-2 border-red-200">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchMyPositions}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full p-2 sm:p-4 lg:p-6">
              <div className="lg:max-w-[calc(100vw-320px)] mx-auto">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                        My Positions
                      </h2>
                      <p className="text-green-100 text-sm">
                        View your created positions with recruiter-wise candidate details
                      </p>
                    </div>
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
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 mb-1">How to view details</p>
                      <p className="text-sm text-green-700">
                        Click the expand icon (▼) in the first column to view recruiter-wise candidate details.
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
                    </div>
                  ) : (
                    <div className="p-2 sm:p-3 lg:p-4">
                      <MaterialReactTable table={table} />
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
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
    </div>
  );
};

export default ClientSpocMyPositions;

