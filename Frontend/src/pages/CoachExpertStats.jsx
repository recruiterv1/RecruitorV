import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  Users,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Phone,
  Mail,
  Briefcase,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Box, Chip, Tabs, Tab, TextField, InputAdornment, Typography, Paper, Grid, Card, CardContent } from '@mui/material';

const CoachExpertStats = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 = All, 1 = Coaches, 2 = Experts
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 1 ? 'coach' : activeTab === 2 ? 'expert' : undefined;
      const response = await axios.get('/api/coach-expert/stats/all', {
        params: typeParam ? { type: typeParam } : {},
        withCredentials: true
      });
      
      if (response.data.success) {
        setData(response.data.all);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, color: '#22c55e' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, color: '#eab308' };
      case 'waitlist':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle, color: '#3b82f6' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, color: '#ef4444' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, color: '#6b7280' };
    }
  };

  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    const lowerFilter = globalFilter.toLowerCase();
    return data.filter(item => 
      item.name?.toLowerCase().includes(lowerFilter) ||
      item.email?.toLowerCase().includes(lowerFilter) ||
      item.specialization?.toLowerCase().includes(lowerFilter) ||
      item.phone?.includes(lowerFilter)
    );
  }, [data, globalFilter]);

  const columns = [
    {
      id: 'expander',
      header: '',
      size: 50,
      Cell: ({ row }) => {
        const hasDetails = row.original.positionDetails?.length > 0;
        const isExpanded = expandedRows[row.original.id];
        
        return (
          <button
            onClick={() => hasDetails && toggleRowExpansion(row.original.id)}
            className={`p-1 rounded transition-colors ${hasDetails ? 'hover:bg-orange-100 cursor-pointer' : 'cursor-default'}`}
            disabled={!hasDetails}
          >
            {hasDetails ? (
              isExpanded ? (
                <ChevronUp size={20} className="text-orange-600" />
              ) : (
                <ChevronDown size={20} className="text-orange-600" />
              )
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </button>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 100,
      Cell: ({ cell }) => {
        const type = cell.getValue();
        return (
          <Chip
            label={type}
            size="small"
            sx={{
              background: type === 'Coach' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 200,
      Cell: ({ cell, row }) => {
        const name = cell.getValue();
        const type = row.original.type;
        const Icon = type === 'Coach' ? User : Users;
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              type === 'Coach' ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              <Icon size={16} className={type === 'Coach' ? 'text-orange-600' : 'text-blue-600'} />
            </div>
            <span className="font-medium text-gray-900">{name || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 150,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <span className="font-mono text-sm">{formatPhone(cell.getValue())}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 250,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600 truncate max-w-[200px]">{cell.getValue() || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      size: 150,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue() || 'N/A'}
          size="small"
          variant="outlined"
          sx={{ borderColor: '#f97316', color: '#ea580c' }}
        />
      ),
    },
    {
      accessorKey: 'positionCount',
      header: 'Positions',
      size: 100,
      Cell: ({ cell, row }) => {
        const count = cell.getValue();
        const type = row.original.type;
        
        return (
          <div className="flex items-center gap-1">
            <Briefcase size={14} className={type === 'Coach' ? 'text-orange-500' : 'text-blue-500'} />
            <span className="font-semibold">{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'recruiterCount',
      header: 'Recruiters',
      size: 100,
      Cell: ({ cell, row }) => {
        const count = cell.getValue();
        const type = row.original.type;
        
        return (
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className={type === 'Coach' ? 'text-orange-500' : 'text-blue-500'} />
            <span className="font-semibold">{count}</span>
          </div>
        );
      },
    },
    {
      id: 'statusCounts',
      header: 'Status',
      size: 200,
      Cell: ({ row }) => {
        const { statusCounts } = row.original;
        const accepted = statusCounts?.accepted || 0;
        const pending = statusCounts?.pending || 0;
        const waitlist = statusCounts?.waitlist || 0;
        const rejected = statusCounts?.rejected || 0;
        
        return (
          <div className="flex gap-1">
            {accepted > 0 && (
              <Chip
                icon={<CheckCircle size={12} />}
                label={accepted}
                size="small"
                sx={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', '& .MuiChip-icon': { color: '#22c55e' } }}
              />
            )}
            {pending > 0 && (
              <Chip
                icon={<Clock size={12} />}
                label={pending}
                size="small"
                sx={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.7rem', '& .MuiChip-icon': { color: '#eab308' } }}
              />
            )}
            {waitlist > 0 && (
              <Chip
                icon={<AlertCircle size={12} />}
                label={waitlist}
                size="small"
                sx={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.7rem', '& .MuiChip-icon': { color: '#3b82f6' } }}
              />
            )}
            {rejected > 0 && (
              <Chip
                icon={<XCircle size={12} />}
                label={rejected}
                size="small"
                sx={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', '& .MuiChip-icon': { color: '#ef4444' } }}
              />
            )}
          </div>
        );
      },
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    state: {
      isLoading: loading,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    enableExpanding: true,
    getRowId: (row) => row.id,
    renderDetailPanel: ({ row }) => {
      const { positionDetails } = row.original;
      
      if (!positionDetails || positionDetails.length === 0) {
        return (
          <div className="p-4 text-center text-gray-500">
            No position details available
          </div>
        );
      }

      return (
        <div className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Briefcase size={18} className="text-orange-500" />
            Position-wise Details
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Position</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Recruiter</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {positionDetails.map((detail, idx) => {
                  const statusStyle = getStatusColor(detail.status);
                  const StatusIcon = statusStyle.icon;
                  
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">{detail.positionTitle}</span>
                          <span className="text-xs text-gray-400">({detail.positionId})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{detail.recruiterName}</td>
                      <td className="px-3 py-2 text-gray-500">{detail.recruiterEmail}</td>
                      <td className="px-3 py-2">
                        <Chip
                          icon={<StatusIcon size={12} />}
                          label={detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                          size="small"
                          sx={{
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: statusStyle.color }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">{detail.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    },
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #ea580c, #f97316)',
        color: 'white',
        fontWeight: 'bold',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#fff7ed',
        },
      },
    },
    muiTableProps: {
      sx: {
        border: '1px solid #fed7aa',
        '& .MuiTableRow-root:hover': {
          backgroundColor: '#fff7ed',
        },
      },
    },
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'name', desc: false }],
    },
  });

  // Summary cards data
  const summaryCards = [
    {
      title: 'Coaches',
      value: summary.totalCoaches || 0,
      icon: User,
      color: 'orange',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    {
      title: 'Experts',
      value: summary.totalExperts || 0,
      icon: Users,
      color: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      title: 'Accepted',
      value: (summary.acceptedCoaches || 0) + (summary.acceptedExperts || 0),
      icon: CheckCircle,
      color: 'green',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    {
      title: 'Pending',
      value: (summary.pendingCoaches || 0) + (summary.pendingExperts || 0),
      icon: Clock,
      color: 'yellow',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    {
      title: 'Waitlist',
      value: (summary.waitlistCoaches || 0) + (summary.waitlistExperts || 0),
      icon: AlertCircle,
      color: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
  ];

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={28} className="text-orange-500" />
              Coach & Expert Statistics
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              View and manage coach and expert performance metrics
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: '2px solid #fed7aa',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              color: '#9ca3af',
              '&.Mui-selected': {
                color: '#ea580c',
              },
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(to right, #ea580c, #f97316)',
              height: 3,
            },
          }}
        >
          <Tab label="All" />
          <Tab label="Coaches" />
          <Tab label="Experts" />
        </Tabs>
      </div>

      {/* Summary Cards */}
      <Grid container spacing={3} className="mb-6">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Grid item xs={6} sm={4} md={2.4} key={idx}>
              <Card className={`${card.bg} border ${card.border}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      card.color === 'orange' ? 'bg-orange-100' :
                      card.color === 'blue' ? 'bg-blue-100' :
                      card.color === 'green' ? 'bg-green-100' :
                      'bg-yellow-100'
                    }`}>
                      <Icon size={20} className={
                        card.color === 'orange' ? 'text-orange-600' :
                        card.color === 'blue' ? 'text-blue-600' :
                        card.color === 'green' ? 'text-green-600' :
                        'text-yellow-600'
                      } />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Search */}
      <div className="mb-4">
        <TextField
          fullWidth
          placeholder="Search by name, email, specialization, or phone..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="text-gray-400" size={20} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '& fieldset': {
                borderColor: '#fed7aa',
              },
              '&:hover fieldset': {
                borderColor: '#f97316',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ea580c',
              },
            },
          }}
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
        <MaterialReactTable table={table} />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Accepted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Waitlist</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Rejected</span>
        </div>
      </div>
    </div>
  );
};

export default CoachExpertStats;

