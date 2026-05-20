import axios from 'axios';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, TrendingUp, Eye, Lock, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { Box, Chip } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';

const Dash_Pos= () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState(null);
  const [accessStats, setAccessStats] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/candidate/pos/show");
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching positions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch approved assignments to filter out assigned positions
  const fetchMyAssignments = async () => {
    try {
      const res = await axios.get("/api/position-access/my-positions", {
        withCredentials: true
      });
      if (res.data.success) {
        setMyAssignments(res.data.data.assignments || []);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      // Fallback to old endpoint if new one fails
      try {
        const oldRes = await axios.get("/candidate/pos/assign/my-assignments", {
          withCredentials: true
        });
        if (oldRes.data.success) {
          setMyAssignments(oldRes.data.assignments || []);
        }
      } catch (e) {
        console.error("Error fetching old assignments:", e);
      }
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMyAssignments();
  }, []);

  // Fetch plan limits and access stats for free users
  useEffect(() => {
    const fetchPlanInfo = async () => {
      if (user?.planType === 0) {
        try {
          const [planResponse, statsResponse] = await Promise.all([
            axios.get('/auth/check-plan-limits', { withCredentials: true }),
            axios.get('/api/position-access/recruiter/stats', { withCredentials: true })
          ]);
          
          if (planResponse.data.success) {
            setPlanInfo(planResponse.data.planInfo);
          }
          
          if (statsResponse.data.success) {
            setAccessStats(statsResponse.data.data);
          }
        } catch (error) {
          console.error('Error fetching plan info:', error);
        }
      }
    };
    
    fetchPlanInfo();
  }, [user]);

  // Get set of position IDs that are already assigned/approved
  const assignedPositionIds = useMemo(() => {
    return new Set(myAssignments.map(a => a.positionId || a.pos_id));
  }, [myAssignments]);

  // Filter out positions that the recruiter is already approved for
  const availableJobs = useMemo(() => {
    return jobs.filter(job => !assignedPositionIds.has(job.pos_id));
  }, [jobs, assignedPositionIds]);

  // Check if user can select positions
  // For free users: check both old limit system and new access request system
  const canSelectPosition = useMemo(() => {
    if (user?.planType !== 0) return true; // Paid users can always select
    
    // Check old system (canCreatePosition)
    if (planInfo?.canCreatePosition === false) return false;
    
    // Check new access request system
    if (accessStats) {
      // Can't request more if already at max (4 total)
      if (accessStats.totalRequested >= 4) return false;
      
      // Can't request more if already have 2 approved
      if (accessStats.currentlyApproved >= 2) return false;
    }
    
    return true;
  }, [user, planInfo, accessStats]);

  // Get limit message for free users
  const getLimitMessage = () => {
    if (user?.planType !== 0) return null;
    
    if (!accessStats) return null;
    
    if (accessStats.totalRequested >= 4) {
      return {
        type: 'error',
        message: 'You have reached the maximum limit of 4 position requests. Please close a completed position to request another.'
      };
    }
    
    if (accessStats.currentlyApproved >= 2) {
      return {
        type: 'warning',
        message: 'You have 2 approved positions (maximum allowed). Please close one to request access to another position.'
      };
    }
    
    if (planInfo?.canCreatePosition === false) {
      return {
        type: 'error',
        message: 'You have reached your Free Plan limit. Please upgrade to Paid Plan to work on more positions.'
      };
    }
    
    return null;
  };

  const limitMessage = getLimitMessage();

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  // Get commission badge color
  const getCommissionColor = (commission) => {
    if (commission >= 10) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (commission >= 5) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  };

  // Define columns with Material React Table
  const columns = useMemo(
    () => [
      {
        accessorKey: 'pos_id',
        header: 'Position ID',
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {cell.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'position',
        header: 'Position',
        size: 250,
        Cell: ({ cell, row }) => (
          <div>
            <p className="font-bold text-gray-900 text-base">{cell.getValue()}</p>
            <p className="text-xs text-gray-500">{row.original.pos_cat}</p>
          </div>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        size: 180,
        Cell: ({ cell }) => (
          <span className="font-medium text-gray-700">{cell.getValue() || 'Confidential'}</span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 200,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} className="text-blue-500 flex-shrink-0" />
            <span className="truncate">
              {Array.isArray(cell.getValue()) 
                ? cell.getValue().join(", ") 
                : cell.getValue()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'experience',
        header: 'Experience',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'ctcStart',
        header: 'CTC Range',
        size: 180,
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-1 text-gray-700">
            <IndianRupee size={14} className="text-green-600" />
            <span className="font-medium">
              {cell.getValue()} - {row.original.ctcEnd}
            </span>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const valA = parseFloat(rowA.original.ctcStart) || 0;
          const valB = parseFloat(rowB.original.ctcStart) || 0;
          return valA - valB;
        },
      },
      {
        accessorKey: 'commison',
        header: 'Commission',
        size: 150,
        Cell: ({ cell }) => {
          const commission = cell.getValue();
          const colors = getCommissionColor(commission);
          return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} border-2 ${colors.border} font-bold`}>
              <BadgePercent size={16} />
              <span>{commission}%</span>
            </div>
          );
        },
        filterVariant: 'select',
        filterSelectOptions: [
          { text: 'High (10%+)', value: 'high' },
          { text: 'Medium (5-10%)', value: 'medium' },
          { text: 'Low (<5%)', value: 'low' },
        ],
        filterFn: (row, id, filterValue) => {
          const commission = row.getValue(id);
          if (filterValue === 'high') return commission >= 10;
          if (filterValue === 'medium') return commission >= 5 && commission < 10;
          if (filterValue === 'low') return commission < 5;
          return true;
        },
      },
      {
        accessorKey: 'datePosted',
        header: 'Posted On',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} className="text-orange-500" />
            <span className="font-medium">{formatDate(cell.getValue())}</span>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.datePosted?._seconds || 0;
          const dateB = rowB.original.datePosted?._seconds || 0;
          return dateA - dateB;
        },
      },
      {
        accessorKey: 'hr_name',
        header: 'HR Contact',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-gray-700">{cell.getValue()}</span>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: availableJobs,
    
    // Enable all features
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableRowSelection: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    enablePinning: true,
    
    // Pagination
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'comfortable',
      sorting: [{ id: 'datePosted', desc: true }], // Sort by newest first
    },
    
    // Row click to view details - disabled for free users with exhausted credits
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        if (!canSelectPosition) {
          const message = limitMessage?.message || 'You have reached your position limit. Please upgrade or close a position to continue.';
          alert(message);
          return;
        }
        navigate(`/dash_view/${row.original.pos_id}`);
      },
      sx: {
        cursor: canSelectPosition ? 'pointer' : 'not-allowed',
        opacity: canSelectPosition ? 1 : 0.6,
        '&:hover': {
          backgroundColor: canSelectPosition ? '#eff6ff' : '#fee2e2',
        },
        transition: 'all 0.3s',
      },
    }),
    
    // Styling to match your theme
    muiTableProps: {
      sx: {
        '& .MuiTableCell-root': {
          borderBottom: '1px solid #e5e7eb',
        },
      },
    },
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #eff6ff, #fff7ed)',
        borderBottom: '2px solid #bfdbfe',
        fontWeight: '600',
        color: '#1f2937',
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
    
    // Custom top toolbar actions
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-semibold"
        >
          <TrendingUp size={18} />
          Refresh
        </button>
      </Box>
    ),
    
    state: {
      isLoading: loading,
    },
    
    // Enable row actions
    //enableRowActions: true,
    // renderRowActions: ({ row }) => (
    //   <Box sx={{ display: 'flex', gap: '8px' }}>
    //     <button
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         navigate(`/dash_view/${row.original.pos_id}`);
    //       }}
    //       className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all font-medium text-sm"
    //     >
    //       <Eye size={14} />
    //       View
    //     </button>
    //   </Box>
    // ),
    //positionActionsColumn: 'last',
  });

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        
        {/* Custom Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Briefcase size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                Open Positions
              </h3>
              <p className="text-blue-100 text-sm">
                {availableJobs.length} positions available • {myAssignments.length} assigned to you
              </p>
            </div>
          </div>
        </div>

        {/* Free User Limits Banner */}
        {user?.planType === 0 && accessStats && (
          <div className="border-b-2 border-blue-200">
            {/* Stats Display */}
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">
                    {accessStats.totalRequested}/4
                  </p>
                  <p className="text-xs text-gray-600">Total Requested</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                    {accessStats.currentlyApproved}/2
                  </p>
                  <p className="text-xs text-gray-600">Currently Approved</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-yellow-600">
                    {accessStats.totalPending}
                  </p>
                  <p className="text-xs text-gray-600">Pending Approval</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-purple-600">
                    {accessStats.daysRemaining}
                  </p>
                  <p className="text-xs text-gray-600">Days Remaining</p>
                </div>
              </div>
            </div>

            {/* Limit Warning/Error Message */}
            {limitMessage && (
              <div className={`px-6 py-4 ${
                limitMessage.type === 'error' 
                  ? 'bg-red-50 border-b-2 border-red-200' 
                  : 'bg-yellow-50 border-b-2 border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  <AlertCircle 
                    size={20} 
                    className={limitMessage.type === 'error' ? 'text-red-600' : 'text-yellow-600'} 
                  />
                  <div className={limitMessage.type === 'error' ? 'text-red-800' : 'text-yellow-800'}>
                    <p className="font-semibold text-sm">{limitMessage.message}</p>
                    <p className="text-xs mt-1">
                      Visit <a href="/my-access-requests" className="underline font-medium">My Access Requests</a> to manage your positions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Banner */}
            {!limitMessage && (
              <div className="bg-blue-50 px-6 py-4">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle size={16} className="text-blue-600 flex-shrink-0" />
                  <div className="text-blue-800">
                    <p className="font-semibold">Free Plan Active</p>
                    <p className="text-xs">
                      You can request up to 4 positions total, with a maximum of 2 approved at any time. 
                      Click on a position to request access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Material React Table */}
        <MaterialReactTable table={table} />

      </div>
    </div>
  );
};

export default Dash_Pos;