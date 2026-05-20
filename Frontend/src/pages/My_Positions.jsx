import axios from 'axios';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, Users, User, Clock, CheckCircle, Filter, X, Search, Trash2, Copy, Edit } from 'lucide-react';
import { Box, Collapse } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { useNavigate } from 'react-router-dom';
import { EditJobModal } from './Ad_OpenPos';

const My_Positions = () => {
  const { user } = useContext(UserStateContext);
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('');
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Search states for dropdowns
  const [positionSearch, setPositionSearch] = useState('');
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const fetchMyPositions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/candidate/pos/my-positions", {
        withCredentials: true
      });
      setPositions(res.data);
    } catch (err) {
      console.error('Error fetching my positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPositions();
  }, []);

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  const getCommissionColor = (commission) => {
    if (commission >= 10) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (commission >= 5) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
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

  const uniqueRecruiters = useMemo(() => {
    const recruiters = new Set();
    positions.forEach(p => {
      if (p.candidates) {
        p.candidates.forEach(c => {
          if (c.recruiterName && c.recruiterName !== 'Unknown') {
            recruiters.add(c.recruiterName);
          }
        });
      }
    });
    return [...recruiters].sort();
  }, [positions]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    positions.forEach(p => {
      if (p.candidates) {
        p.candidates.forEach(c => {
          if (c.status && c.status !== 'Unknown') {
            statuses.add(c.status);
          }
        });
      }
    });
    return [...statuses].sort();
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

  const filteredRecruiterOptions = useMemo(() => {
    const filtered = uniqueRecruiters.filter(rec => 
      rec.toLowerCase().includes(recruiterSearch.toLowerCase())
    );
    return filtered.slice(0, 10);
  }, [uniqueRecruiters, recruiterSearch]);

  const filteredStatusOptions = useMemo(() => {
    const filtered = uniqueStatuses.filter(status => 
      status.toLowerCase().includes(statusSearch.toLowerCase())
    );
    return filtered.slice(0, 10);
  }, [uniqueStatuses, statusSearch]);

  // Filter positions based on selected filters
  const filteredPositions = useMemo(() => {
    return positions.filter(position => {
      // Filter by position name
      if (positionFilter && position.position !== positionFilter) {
        return false;
      }

      // Filter by client
      if (clientFilter && position.client !== clientFilter) {
        return false;
      }

      // Filter by recruiter name
      if (recruiterFilter) {
        const hasRecruiter = position.candidates?.some(c => 
          c.recruiterName === recruiterFilter
        );
        if (!hasRecruiter) return false;
      }

      // Filter by status
      if (statusFilter) {
        const hasStatus = position.candidates?.some(c => 
          c.status === statusFilter
        );
        if (!hasStatus) return false;
      }

      return true;
    });
  }, [positions, positionFilter, clientFilter, recruiterFilter, statusFilter]);

  const clearFilters = () => {
    setPositionFilter('');
    setClientFilter('');
    setRecruiterFilter('');
    setStatusFilter('');
    setPositionSearch('');
    setClientSearch('');
    setRecruiterSearch('');
    setStatusSearch('');
  };

  // Helper function to get user email
  const getUserEmail = () => {
    if (!user) return "";
    return (user.email || "").toLowerCase();
  };

  // Check if current user can delete this position
  const canDelete = (position) => {
    if (!user || !position) return false;
    
    const userEmail = getUserEmail();
    const positionCreatorEmail = (position.clientspoc || "").toLowerCase();
    
    // User can delete if they created it or if they're admin
    const isCreator = positionCreatorEmail === userEmail;
    const isAdmin = user?.role === 'admin' || user?.roleCategory === 'Admin';
    
    return isCreator || isAdmin;
  };

  // Handle delete position
  const handleDelete = async (position) => {
    if (!canDelete(position)) {
      alert("You don't have permission to delete this position.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this position?\n\n` +
      `Position: ${position.position}\n` +
      `Client: ${position.client || 'Confidential'}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(position.id);
      const res = await axios.delete(`/candidate/pos/delete/${position.id}`, {
        withCredentials: true
      });
      
      if (res.data.success) {
        alert("Position deleted successfully!");
        fetchMyPositions(); // Refresh the list
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 403) {
        alert(err.response.data.message || "You don't have permission to delete this position.");
      } else if (err.response?.status === 404) {
        alert("Position not found.");
      } else {
        alert("Failed to delete position. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Handle copy position
  const handleCopy = (position) => {
    // Prepare data for copying (exclude id and pos_id)
    const copiedPosition = {
      position: position.position,
      hr_name: position.hr_name,
      client: position.client,
      ctcStart: position.ctcStart,
      ctcEnd: position.ctcEnd,
      location: position.location,
      job_desc: position.job_desc,
      commison: position.commison,
      experience: position.experience,
      pos_cat: position.pos_cat,
      comp_view: position.comp_view,
      m_have: position.m_have,
      g_have: position.g_have,
      compet: position.compet,
      key_res: position.key_res,
      state: position.state
    };

    // Store copied data in sessionStorage
    sessionStorage.setItem('copiedPosition', JSON.stringify(copiedPosition));
    
    // Navigate to Add Position page
    navigate('/ad_panel');
  };

  // Handle edit position
  const handleEdit = (position) => {
    setSelectedJob(position);
    setIsOpen(true);
  };

  const columns = useMemo(
    () => [
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
        accessorKey: 'position',
        header: 'Position',
        size: 200,
        Cell: ({ cell, row }) => (
          <div>
            <p className="font-bold text-gray-900 text-xs sm:text-sm">{cell.getValue()}</p>
            <p className="text-xs text-gray-500">{row.original.pos_cat}</p>
          </div>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-medium text-gray-700 text-xs sm:text-sm">
            {cell.getValue() || 'Confidential'}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
            <MapPin size={14} className="text-blue-500 flex-shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {Array.isArray(cell.getValue()) 
                ? cell.getValue().slice(0, 2).join(", ") + (cell.getValue().length > 2 ? '...' : '')
                : cell.getValue()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'commison',
        header: 'Commission',
        size: 110,
        Cell: ({ cell }) => {
          const commission = cell.getValue();
          const colors = getCommissionColor(commission);
          
          return (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${colors.bg} ${colors.text} border-2 ${colors.border} font-bold text-xs`}>
              <BadgePercent size={12} />
              <span>{commission}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'candidateCount',
        header: 'Candidates',
        size: 120,
        Cell: ({ cell }) => {
          const count = cell.getValue() || 0;
          
          return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm ${
              count > 0 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              <Users size={16} />
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
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
            <Calendar size={12} className="text-orange-500 flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{formatDate(cell.getValue())}</span>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.datePosted?._seconds || 0;
          const dateB = rowB.original.datePosted?._seconds || 0;
          return dateA - dateB;
        },
      },
    ],
    [user]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredPositions,
    
    enableExpanding: true,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    enableRowActions: true,
    
    getRowId: (row) => row.pos_id,
    
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'datePosted', desc: true }],
    },
    
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '8px', minWidth: '200px', justifyContent: 'center' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row.original);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-medium text-xs shadow-md hover:shadow-lg"
          title="Edit this position"
        >
          <Edit size={14} />
          <span>Edit</span>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(row.original);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all font-medium text-xs shadow-md hover:shadow-lg"
          title="Copy this position"
        >
          <Copy size={14} />
          <span>Copy</span>
        </button>
        
        {canDelete(row.original) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
            disabled={deletingId === row.original.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium text-xs shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete this position (only creator can delete)"
          >
            <Trash2 size={14} />
            <span>{deletingId === row.original.id ? 'Deleting...' : 'Delete'}</span>
          </button>
        )}
      </Box>
    ),
    
    displayColumnDefOptions: {
      'mrt-row-actions': {
        size: 220,
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
        maxHeight: 'calc(100vh - 300px)',
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
    
    renderDetailPanel: ({ row }) => {
      if (!row.original.candidates || row.original.candidates.length === 0) {
        return null;
      }

      // Group candidates by recruiter
      const recruiterGroups = {};
      row.original.candidates.forEach(candidate => {
        const recruiterName = candidate.recruiterName || 'Unknown';
        if (!recruiterGroups[recruiterName]) {
          recruiterGroups[recruiterName] = [];
        }
        recruiterGroups[recruiterName].push(candidate);
      });

      return (
        <Box sx={{ padding: '16px', backgroundColor: '#f9fafb' }}>
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            Candidate Details by Recruiter
          </h4>
          
          <div className="space-y-3">
            {Object.entries(recruiterGroups).map(([recruiterName, candidates]) => (
              <div key={recruiterName} className="bg-white rounded-lg p-4 border-2 border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <span className="font-semibold text-gray-800">{recruiterName}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                      {candidates.length} candidate{candidates.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {candidates.map((candidate, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{candidate.candidateName}</p>
                          <div className="space-y-1 mt-1">
                            {candidate.dateAdded && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={12} />
                                <span className="font-medium">Submitted:</span>
                                <span>{formatDate(candidate.dateAdded)}</span>
                              </div>
                            )}
                            {candidate.lastUpdated && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Clock size={12} />
                                <span className="font-medium">Updated:</span>
                                <span>{formatDate(candidate.lastUpdated)}</span>
                              </div>
                            )}
                            {!candidate.dateAdded && !candidate.lastUpdated && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={12} />
                                <span className="italic">No date information</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 text-xs font-medium ${getStatusColor(candidate.status)}`}>
                        <CheckCircle size={12} />
                        <span>{candidate.status}</span>
                      </div>
                    </div>
                  ))}
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Briefcase size={20} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    My Positions
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    {positions.length} positions • Click candidate count to expand
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-blue-100">Total Candidates</p>
                  <p className="text-lg font-bold text-white">
                    {positions.reduce((sum, pos) => sum + (pos.candidateCount || 0), 0)}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-blue-100">Active Positions</p>
                  <p className="text-lg font-bold text-white">
                    {positions.filter(p => (p.candidateCount || 0) > 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-blue-600" />
              <h4 className="font-semibold text-gray-800">Filters</h4>
              {(positionFilter || clientFilter || recruiterFilter || statusFilter) && (
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              {/* Recruiter Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Recruiter Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search recruiters..."
                    value={recruiterSearch}
                    onChange={(e) => setRecruiterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={recruiterFilter}
                  onChange={(e) => setRecruiterFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  size="5"
                >
                  <option value="">All Recruiters</option>
                  {filteredRecruiterOptions.map(rec => (
                    <option key={rec} value={rec}>{rec}</option>
                  ))}
                  {uniqueRecruiters.length > 10 && filteredRecruiterOptions.length === 10 && (
                    <option disabled>... {uniqueRecruiters.length - 10} more (search to find)</option>
                  )}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Candidate Status
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search statuses..."
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  size="5"
                >
                  <option value="">All Statuses</option>
                  {filteredStatusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                  {uniqueStatuses.length > 10 && filteredStatusOptions.length === 10 && (
                    <option disabled>... {uniqueStatuses.length - 10} more (search to find)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(positionFilter || clientFilter || recruiterFilter || statusFilter) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {positionFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Position: {positionFilter}
                    <button onClick={() => { setPositionFilter(''); setPositionSearch(''); }} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {clientFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    Client: {clientFilter}
                    <button onClick={() => { setClientFilter(''); setClientSearch(''); }} className="hover:bg-yellow-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {recruiterFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Recruiter: {recruiterFilter}
                    <button onClick={() => { setRecruiterFilter(''); setRecruiterSearch(''); }} className="hover:bg-green-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    Status: {statusFilter}
                    <button onClick={() => { setStatusFilter(''); setStatusSearch(''); }} className="hover:bg-purple-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-b-2 border-blue-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Users size={16} className="text-blue-600 flex-shrink-0" />
              <p className="text-blue-800">
                <span className="font-semibold">Tip:</span> 
                <span className="hidden sm:inline"> Click the chevron icon (◀) in the first column to expand and see candidate details</span>
                <span className="sm:hidden"> Click chevron to expand details</span>
              </p>
            </div>
          </div>

          {/* Material React Table */}
          <div className="p-2 sm:p-3 lg:p-4">
            <MaterialReactTable table={table} />
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {isOpen && (
        <EditJobModal
          job={selectedJob}
          onClose={() => setIsOpen(false)}
          onUpdate={fetchMyPositions}
        />
      )}
    </div>
  );
};

export default My_Positions;
