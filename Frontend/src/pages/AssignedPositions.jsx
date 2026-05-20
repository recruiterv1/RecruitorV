import axios from 'axios';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, Users, User, Clock, CheckCircle, Filter, X, Search, Users as UsersIcon, AlertTriangle } from 'lucide-react';
import { Box, Collapse, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { useNavigate } from 'react-router-dom';

const AssignedPositions = () => {
  const { user } = useContext(UserStateContext);
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [showFullModal, setShowFullModal] = useState(false);
  const [selectedFullPosition, setSelectedFullPosition] = useState(null);

  const fetchAssignedPositions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/candidate/pos/assigned-positions", {
        withCredentials: true
      });
      if (res.data.success) {
        setPositions(res.data.positions);
      }
    } catch (err) {
      console.error('Error fetching assigned positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPositions();
  }, []);

  // Handle row click
  const handleRowClick = (position) => {
    if (position.isFull) {
      // Show modal for full positions
      setSelectedFullPosition(position);
      setShowFullModal(true);
    } else {
      // Navigate to dash_view for available positions
      navigate(`/dash_view/${position.pos_id}`);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowFullModal(false);
    setSelectedFullPosition(null);
  };

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

      return true;
    });
  }, [positions, positionFilter, clientFilter]);

  const clearFilters = () => {
    setPositionFilter('');
    setClientFilter('');
    setPositionSearch('');
    setClientSearch('');
  };

  // Toggle row expansion
  const toggleRowExpansion = (posId) => {
    setExpandedRows(prev => ({
      ...prev,
      [posId]: !prev[posId]
    }));
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
        header: 'Total Candidates',
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
        accessorKey: 'myCandidateCount',
        header: 'My Candidates',
        size: 120,
        Cell: ({ cell }) => {
          const count = cell.getValue() || 0;
          
          return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm ${
              count > 0 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              <User size={16} />
              <span>{count}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'remaining',
        header: 'Remaining',
        size: 100,
        Cell: ({ cell, row }) => {
          const remaining = cell.getValue() || 0;
          const isFull = row.original.isFull;
          
          return (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              isFull 
                ? 'bg-red-100 text-red-700 border-2 border-red-200' 
                : 'bg-green-100 text-green-700 border-2 border-green-200'
            }`}>
              <span>{remaining}</span>
              <span className="text-xs">/ {row.original.maxCandidate || 10}</span>
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
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredPositions,
    
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    
    getRowId: (row) => row.pos_id,
    
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'datePosted', desc: true }],
    },
    
    state: {
      isLoading: loading,
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
    
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row.original),
      sx: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        transition: 'all 0.3s',
      },
    }),
    
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
      const posId = row.original.pos_id;
      const isExpanded = expandedRows[posId];
      const myCandidates = row.original.myCandidates || [];

      if (myCandidates.length === 0) {
        return (
          <Box sx={{ padding: '16px', backgroundColor: '#f9fafb' }}>
            <div className="text-center py-4">
              <UsersIcon size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">You haven't submitted any candidates for this position yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Go to Open Positions to find and submit candidates.
              </p>
            </div>
          </Box>
        );
      }

      return (
        <Box sx={{ padding: '16px', backgroundColor: '#f9fafb' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User size={16} className="text-green-600" />
              Your Candidates ({myCandidates.length})
            </h4>
            <button
              onClick={() => toggleRowExpansion(posId)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          <Collapse in={isExpanded || true}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {myCandidates.map((candidate, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border-2 border-green-100">
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
          </Collapse>
        </Box>
      );
    },
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-500 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Briefcase size={20} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    Assigned Positions
                  </h3>
                  <p className="text-green-100 text-xs sm:text-sm">
                    {positions.length} positions • Click to expand and see your candidates
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-green-100">Your Candidates</p>
                  <p className="text-lg font-bold text-white">
                    {positions.reduce((sum, pos) => sum + (pos.myCandidateCount || 0), 0)}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-green-100">Owned Positions</p>
                  <p className="text-lg font-bold text-white">
                    {positions.filter(p => p.isOwner).length}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-green-100">Available Slots</p>
                  <p className="text-lg font-bold text-white">
                    {positions.reduce((sum, pos) => sum + (pos.remaining || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-gradient-to-r from-gray-50 to-green-50 border-b-2 border-green-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-green-600" />
              <h4 className="font-semibold text-gray-800">Filters</h4>
              {(positionFilter || clientFilter) && (
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

              {/* Status Summary - Read Only */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Position Status
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Full Positions</span>
                    <span className="font-bold text-red-600">
                      {positions.filter(p => p.isFull).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Available</span>
                    <span className="font-bold text-green-600">
                      {positions.filter(p => !p.isFull).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ownership Badge */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ownership
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Owned by You</span>
                    <span className="font-bold text-green-600">
                      {positions.filter(p => p.isOwner).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Assigned to You</span>
                    <span className="font-bold text-blue-600">
                      {positions.filter(p => !p.isOwner).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(positionFilter || clientFilter) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {positionFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Position: {positionFilter}
                    <button onClick={() => { setPositionFilter(''); setPositionSearch(''); }} className="hover:bg-green-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {clientFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Client: {clientFilter}
                    <button onClick={() => { setClientFilter(''); setClientSearch(''); }} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-green-50 border-b-2 border-green-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Users size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                <span className="font-semibold">Tip:</span> 
                <span className="hidden sm:inline"> Click the expand icon in the first column to see your submitted candidates for each position</span>
                <span className="sm:hidden"> Click expand icon to see candidates</span>
              </p>
            </div>
          </div>

          {/* Material React Table */}
          <div className="p-2 sm:p-3 lg:p-4">
            <MaterialReactTable table={table} />
          </div>

        </div>
      </div>

      {/* Max Candidate Full Modal */}
      <Dialog
        open={showFullModal}
        onClose={handleCloseModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          Max Candidates Reached
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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
                <p className="text-gray-600 text-sm mt-2">
                  You cannot add more candidates to this position. Please check other available positions.
                </p>
              </div>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AssignedPositions;

