import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, Clock, CheckCircle, XCircle, AlertCircle, Users, Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { Box, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { useNavigate } from 'react-router-dom';

const CoachExpertRequests = () => {
  const { user } = useContext(UserStateContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';

  useEffect(() => {
    fetchRequests();
  }, [user?.email, isCoach, isExpert]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const type = isCoach ? 'coach' : 'expert';
      const response = await axios.get('/api/coach-expert/requests', {
        params: {
          email: user?.email,
          type: type
        },
        withCredentials: true
      });
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    setUpdatingStatus(requestId);
    try {
      await axios.put(`/api/coach-expert/request/${requestId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status: newStatus, updatedAt: new Date() }
            : req
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update request status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      case 'waitlist':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    }
  };

  const maskPhone = (phone) => {
    if (!phone) return '****';
    return '****' + phone.slice(-4);
  };

  const maskEmail = (email) => {
    if (!email) return '****@***.***';
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '****';
    return `${maskedLocal}@${domain}`;
  };

  const isRecruiterInfoVisible = (status) => {
    return status === 'accepted';
  };

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(req => req.status === statusFilter);

  const columns = [
    {
      accessorKey: 'positionTitle',
      header: 'Position',
      size: 200,
      Cell: ({ cell, row }) => {
        const positionTitle = cell.getValue();
        const positionId = row.original.positionId;
        
        return (
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-green-600" />
            <div>
              <button
                onClick={() => navigate(`/dash_view/${positionId}`)}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
              >
                {positionTitle || 'N/A'}
              </button>
              <div className="text-xs text-gray-500">ID: {positionId}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'recruiterName',
      header: 'Recruiter Name',
      size: 180,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-600" />
          <span className="font-medium">{cell.getValue() || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'recruiterPhone',
      header: 'Phone',
      size: 140,
      Cell: ({ cell, row }) => {
        const phone = cell.getValue();
        const status = row.original.status;
        const [showPhone, setShowPhone] = useState(false);

        if (!isRecruiterInfoVisible(status)) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <Phone size={16} />
              <span className="font-mono">****</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-green-600" />
            {showPhone ? (
              <span className="font-mono text-green-600">{phone || 'N/A'}</span>
            ) : (
              <span className="font-mono">{maskPhone(phone)}</span>
            )}
            <button
              onClick={() => setShowPhone(!showPhone)}
              className="p-1 hover:bg-gray-100 rounded"
              title={showPhone ? 'Hide' : 'Show'}
            >
              {showPhone ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'recruiterEmail',
      header: 'Email',
      size: 200,
      Cell: ({ cell, row }) => {
        const email = cell.getValue();
        const status = row.original.status;
        const [showEmail, setShowEmail] = useState(false);

        if (!isRecruiterInfoVisible(status)) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <Mail size={16} />
              <span className="font-mono">****@***.***</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-green-600" />
            {showEmail ? (
              <span className="font-mono text-green-600 text-sm">{email}</span>
            ) : (
              <span className="font-mono text-sm">{maskEmail(email)}</span>
            )}
            <button
              onClick={() => setShowEmail(!showEmail)}
              className="p-1 hover:bg-gray-100 rounded"
              title={showEmail ? 'Hide' : 'Show'}
            >
              {showEmail ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140,
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
      accessorKey: 'createdAt',
      header: 'Requested',
      size: 140,
      Cell: ({ cell }) => formatDate(cell.getValue()),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      size: 180,
      Cell: ({ cell }) => {
        const request = cell.row.original;
        const isUpdating = updatingStatus === request.id;

        return (
          <div className="flex items-center gap-2">
            <FormControl size="small" style={{ minWidth: 120 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value=""
                label="Action"
                disabled={isUpdating}
                onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
              >
                <MenuItem value="accepted">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600" />
                    Accept
                  </div>
                </MenuItem>
                <MenuItem value="waitlist">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-600" />
                    Waitlist
                  </div>
                </MenuItem>
                <MenuItem value="rejected">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-600" />
                    Reject
                  </div>
                </MenuItem>
              </Select>
            </FormControl>
            {isUpdating && <div className="text-xs text-gray-500">Updating...</div>}
          </div>
        );
      },
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: filteredRequests,
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
    state: {
      isLoading: loading,
    },
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: false,
    enableGlobalFilter: true,
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'createdAt', desc: true }],
    },
  });

  const getStatusCounts = () => {
    const counts = {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      waitlist: requests.filter(r => r.status === 'waitlist').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {isCoach ? 'Coach' : 'Expert'} Requests
              </h3>
              <p className="text-orange-100 text-sm">
                Manage help requests from recruiters
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 border-b border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
               onClick={() => setStatusFilter('all')}>
            <p className="text-2xl font-bold text-gray-600">{statusCounts.all}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center cursor-pointer hover:bg-yellow-100 transition-colors"
               onClick={() => setStatusFilter('pending')}>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => setStatusFilter('accepted')}>
            <p className="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
            <p className="text-xs text-gray-600">Accepted</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-100 transition-colors"
               onClick={() => setStatusFilter('waitlist')}>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.waitlist}</p>
            <p className="text-xs text-gray-600">Waitlist</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center cursor-pointer hover:bg-red-100 transition-colors"
               onClick={() => setStatusFilter('rejected')}>
            <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            <p className="text-xs text-gray-600">Rejected</p>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <FormControl size="small" style={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Requests ({statusCounts.all})</MenuItem>
                <MenuItem value="pending">Pending ({statusCounts.pending})</MenuItem>
                <MenuItem value="accepted">Accepted ({statusCounts.accepted})</MenuItem>
                <MenuItem value="waitlist">Waitlist ({statusCounts.waitlist})</MenuItem>
                <MenuItem value="rejected">Rejected ({statusCounts.rejected})</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4">
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-blue-800">
              <p className="font-semibold">Important:</p>
              <p>Recruiter phone and email are hidden (****) until you accept the request. Once accepted, you can view the full contact details.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <MaterialReactTable table={table} />
        </div>
      </div>
    </div>
  );
};

export default CoachExpertRequests;

