import React, { useState, useEffect, useContext, useMemo } from 'react';
import CertifiedBadge from '../components/CertifiedBadge';
import { availabilityColumn, AvailabilityFilter, matchesAvailability } from '../components/AvailabilityColumn';
import ChangeRoleControl from '../components/ChangeRoleControl';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Briefcase, Users, User, RefreshCw, Clock, CheckCircle, AlertCircle,
  Eye, Edit, Trash2, Mail, Phone, Award, X, MapPin, Globe, Linkedin, FileText, Download
} from 'lucide-react';
import { Box } from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Sidebar from '../pages/Sidebar';
import { useDeviceStatus, DeviceBadges } from '../components/DeviceStatus';

const AllCoaches = ({ embedded = false }) => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isAdmin = user?.role === 'admin' || user?.roleCategory === 'Admin' || user?.roleCategory?.toLowerCase() === 'superadmin';
  const canViewContacts = embedded || isClientSpoc || isAdmin;
  const isCollapsed = isSidebarCollapsed || false;
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [coachProfile, setCoachProfile] = useState(null);
  const [coachProfileLoading, setCoachProfileLoading] = useState(false);
  const [agreementFilter, setAgreementFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [skillCatFilter, setSkillCatFilter] = useState([]);
  const [availFilter, setAvailFilter] = useState('all');   // all | set | unset
  const [availSlot, setAvailSlot] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const impersonate = async (row) => {
    if (!window.confirm(`Log in as ${row.name || row.email}?\n\nThis replaces your Super Admin session with theirs — log back in as admin afterwards.`)) return;
    try {
      const res = await axios.post('/admin/impersonate', { email: row.email }, { withCredentials: true });
      if (res.data?.success) window.location.href = res.data.redirect || '/coach-dashboard';
      else alert(res.data?.message || 'Could not log in as this user.');
    } catch (err) { alert(err.response?.data?.message || 'Could not log in as this user.'); }
  };
  const [updatingId, setUpdatingId] = useState(null);

  const handleAccountStatus = async (coach, action) => {
    if (action === 'reject' && !window.confirm(`Delete coach "${coach.name}"? This cannot be undone.`)) return;
    if (action === 'block' && !window.confirm(`Decline access for "${coach.name}"?\n\nThey will be signed out and cannot log in until access is granted again.`)) return;
    setUpdatingId(coach.id);
    try {
      await axios.patch('/admin/user-account-status', { userId: coach.id, userType: 'coach', action }, { withCredentials: true });
      if (action === 'reject') {
        setCoaches(prev => prev.filter(c => c.id !== coach.id));
      } else {
        const statusMap = { approve: 'approved', unblock: 'approved', block: 'blocked', waitlist: 'waitlist' };
        const newStatus = statusMap[action];
        setCoaches(prev => prev.map(c => c.id === coach.id ? { ...c, accountStatus: newStatus } : c));
        setSelectedCoach(prev => (prev && prev.id === coach.id ? { ...prev, accountStatus: newStatus } : prev));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [name, domain] = email.split('@');
    if (!domain || name.length <= 2) return '***@' + (domain || '');
    return name[0] + '***' + name[name.length - 1] + '@' + domain;
    };
  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '****';
    return '****' + digits.slice(-4);
  };

  const fetchCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/coach-expert/coach/all', {
        withCredentials: true
      });

      if (res.data.success) {
        setCoaches(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to fetch coaches');
      }
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError(err.response?.data?.message || 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when user is loaded
    if (user) {
      fetchCoaches();
    }
  }, [user]);

  useEffect(() => {
    const fetchCoachProfile = async (id) => {
      if (!id) return;
      setCoachProfileLoading(true);
      try {
        const res = await axios.get(`/api/coach-expert/coach/${id}`, { withCredentials: true });
        if (res.data.success) {
          setCoachProfile(res.data.data);
        } else {
          setCoachProfile(null);
        }
      } catch {
        setCoachProfile(null);
      } finally {
        setCoachProfileLoading(false);
      }
    };
    if (viewModalOpen && selectedCoach?.id) {
      fetchCoachProfile(selectedCoach.id);
    }
  }, [viewModalOpen, selectedCoach]);

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

  // Handle delete coach
  const handleDelete = async (coach) => {
    if (!canDelete()) {
      alert("You don't have permission to delete coaches.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this coach?\n\n` +
      `Name: ${coach.name}\n` +
      `Email: ${coach.email}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(coach.id);
      const res = await axios.delete(`/api/coach-expert/coach/${coach.id}`, {
        withCredentials: true
      });

      if (res.data.success) {
        alert("Coach deleted successfully!");
        fetchCoaches();
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 403) {
        alert(err.response.data.message || "You don't have permission to delete this coach.");
      } else if (err.response?.status === 404) {
        alert("Coach not found.");
      } else {
        alert("Failed to delete coach. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Format number
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return 'N/A'; }
  };

  const downloadExcel = () => {
    const rows = coaches.map((c, i) => ({
      'S.No.': i + 1,
      'Name': c.name || 'N/A',
      'Email': c.email || 'N/A',
      'Phone': c.phone || c.mobile || 'N/A',
      'Specialization': c.specialization || 'N/A',
      'Skill Category': c.skillCategory || 'N/A',
      'Type': c.userType === 'paid' ? 'Paid' : 'Free',
      'Positions Approved': c.positionStats?.approved ?? 0,
      'Positions Pending': c.positionStats?.pending ?? 0,
      'Positions Rejected': c.positionStats?.rejected ?? 0,
      'Last Active': formatDateTime(c.lastActiveDate),
      'Added On': formatDate(c.createdAt),
      'Profile %': c.profileCompletion || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Coaches');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-coaches-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Table columns
  const deviceMap = useDeviceStatus(coaches.map(c => c.email));
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
      accessorKey: 'name',
      header: 'Coach Name',
      size: 200,
      Cell: ({ cell, row }) => (
        <div
          className="cursor-pointer hover:text-blue-600 flex items-center gap-1.5"
          onClick={() => {
            setSelectedCoach(row.original);
            setViewModalOpen(true);
          }}
        >
          {isOnline(row.original) && (
            <span className="relative inline-flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
          <div>
            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              {cell.getValue()}
              <CertifiedBadge tier={row.original.eligibilityTier} size="xs" withLabel={false} />
              <DeviceBadges status={deviceMap[(row.original.email || '').toLowerCase()]} size={14} />
            </p>
            <p className="text-xs text-gray-500 hidden">{row.original.id}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 220,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        const display = canViewContacts ? value : maskEmail(value);
        return (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400" />
            <span className="font-medium text-gray-700 text-sm">
              {display || 'N/A'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 140,
      Cell: ({ cell, row }) => {
        const value = cell.getValue() || row.original?.mobile;
        const display = canViewContacts ? value : maskPhone(value);
        return (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="font-medium text-gray-700 text-sm">
              {display || 'N/A'}
            </span>
          </div>
        );
      },
    },
    availabilityColumn,
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      size: 200,
      Cell: ({ cell }) => (
        <div className="flex flex-wrap gap-1">
          {cell.getValue()?.split(',').map((spec, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
            >
              <Award size={10} className="mr-1" />
              {spec.trim()}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorFn: (row) => row.skillCategory || '',
      id: 'skillCategory',
      header: 'Skill Category',
      size: 150,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        return val
          ? <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{val}</span>
          : <span className="text-gray-400 text-xs">—</span>;
      },
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
    {
      accessorKey: 'positionStats',
      header: 'Positions',
      size: 220,
      enableSorting: false,
      Cell: ({ row }) => {
        const ps = row.original.positionStats || {};
        return (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              ✓ {ps.approved ?? 0} Approved
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              ⏳ {ps.pending ?? 0} Pending
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              ✗ {ps.rejected ?? 0} Rejected
            </span>
          </div>
        );
      },
    },
    {
      accessorFn: (row) => row.lastActiveDate ? new Date(row.lastActiveDate).getTime() : 0,
      id: 'lastActiveDate',
      header: 'Last Active',
      size: 170,
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={12} className="text-orange-500" />
          <span className="text-sm">{formatDateTime(row.original.lastActiveDate)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'profileCompletion',
      header: 'Profile %',
      size: 120,
      Cell: ({ cell }) => {
        const percentage = cell.getValue() || 0;
        const getColor = (p) => {
          if (p >= 80) return 'bg-green-500';
          if (p >= 50) return 'bg-blue-500';
          if (p >= 25) return 'bg-yellow-500';
          return 'bg-red-500';
        };
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getColor(percentage)}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">{percentage}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'agreementSigned',
      header: 'Agreement',
      size: 130,
      Cell: ({ cell }) => {
        const signed = cell.getValue();
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
            signed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {signed ? '✓ Signed' : '✗ Pending'}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      id: 'roleActions',
      header: 'Role',
      size: 150,
      enableSorting: false,
      Cell: ({ row }) => (
        <ChangeRoleControl userId={row.original.id} name={row.original.name} currentType="coach" onChanged={fetchCoaches} />
      ),
    }] : []),
  ];

  const ACTIVITY_MS = { '24h': 86400000, '48h': 172800000, '72h': 259200000, 'week': 604800000, 'month': 2592000000 };
  const getLastActiveMs = (c) => {
    const v = c.lastActiveDate || c.lastActive;
    if (!v) return 0;
    const ms = v._seconds ? v._seconds * 1000 : typeof v === 'string' ? Date.parse(v) : new Date(v).getTime();
    return isNaN(ms) ? 0 : ms;
  };
  const isOnline = (c) => Date.now() - getLastActiveMs(c) < 15 * 60 * 1000;

  const skillCategories = useMemo(() =>
    [...new Set(coaches.flatMap(c => {
      const v = c.skillCategory;
      return Array.isArray(v) ? v : (v ? [v] : []);
    }).filter(Boolean))].sort()
  , [coaches]);

  const filteredCoaches = useMemo(() => {
    const now = Date.now();
    return coaches.filter(c => {
      // Hide only legacy pending/waitlist sign-ups. Users whose access has been
      // DECLINED must stay visible here — this is the screen an admin uses to
      // grant their access back.
      if (embedded && ['pending', 'waitlist'].includes((c.accountStatus || '').toLowerCase())) return false;
      if (agreementFilter === 'signed' && !c.agreementSigned) return false;
      if (agreementFilter === 'unsigned' && c.agreementSigned) return false;
      if (activityFilter !== 'all') {
        const ms = getLastActiveMs(c);
        if (!ms || now - ms > ACTIVITY_MS[activityFilter]) return false;
      }
      if (skillCatFilter.length > 0) {
        const v = c.skillCategory;
        const cats = Array.isArray(v) ? v : (v ? [v] : []);
        if (!skillCatFilter.some(f => cats.includes(f))) return false;
      }
      const inactive = c.isActive === false || c.accountStatus === 'suspended';
      if (statusFilter === 'active' && inactive) return false;
      if (statusFilter === 'inactive' && !inactive) return false;
      if (!matchesAvailability(c, availFilter, availSlot)) return false;
      return true;
    });
  }, [coaches, agreementFilter, activityFilter, skillCatFilter, statusFilter, embedded, availFilter, availSlot]);

  const table = useMaterialReactTable({
    columns,
    data: filteredCoaches,
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

    renderRowActions: ({ row }) => {
      const coach = row.original;
      return (
        <Box sx={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedCoach(coach); setViewModalOpen(true); }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-medium text-xs shadow-md"
            title="View coach"
          >
            <Eye size={12} /><span>View</span>
          </button>
          {!embedded && canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(coach); }}
              disabled={deletingId === coach.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium text-xs shadow-md disabled:opacity-50"
            >
              <Trash2 size={12} /><span>{deletingId === coach.id ? '...' : 'Delete'}</span>
            </button>
          )}
        </Box>
      );
    },

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

    state: {
      isLoading: loading,
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading coaches...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading coaches...</p>
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
            onClick={fetchCoaches}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-orange-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
        <div className="w-full max-w-full mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">All Coaches</h2>
                <p className="text-blue-100 text-sm">View all registered coaches with their details</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCoaches}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                <button
                  onClick={downloadExcel}
                  disabled={coaches.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                  title="Download all coaches as Excel"
                >
                  <Download size={18} />
                  Download Excel
                </button>
              </div>
            </div>
          </div>
          <CoachFilterBar
            availFilter={availFilter}
            setAvailFilter={setAvailFilter}
            availSlot={availSlot}
            setAvailSlot={setAvailSlot}
            agreementFilter={agreementFilter}
            setAgreementFilter={setAgreementFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            skillCatFilter={skillCatFilter}
            setSkillCatFilter={setSkillCatFilter}
            skillCategories={skillCategories}
            total={coaches.length}
            filtered={filteredCoaches.length}
          />
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
            {coaches.length === 0 ? (
              <div className="p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Coaches Found</h3>
                <p className="text-gray-500 mb-4">No coaches have been registered yet.</p>
              </div>
            ) : (
              <div className="p-2 sm:p-3 lg:p-4">
                <MaterialReactTable table={table} />
              </div>
            )}
          </div>
        </div>
        {viewModalOpen && selectedCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setViewModalOpen(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{(coachProfile?.name) || selectedCoach.name}</h2>
                      <p className="text-blue-100">Coach Details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => impersonate(selectedCoach)}
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      Login as
                    </button>
                    <button
                      onClick={() => handleAccountStatus(selectedCoach, ['blocked', 'suspended'].includes(selectedCoach.accountStatus) ? 'unblock' : 'block')}
                      disabled={updatingId === selectedCoach.id}
                      title={['blocked', 'suspended'].includes(selectedCoach.accountStatus) ? 'Allow this user to log in again' : 'Stop this user from accessing the dashboard'}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                        ['blocked', 'suspended'].includes(selectedCoach.accountStatus)
                          ? 'bg-white text-green-700 hover:bg-green-50'
                          : 'bg-white text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {updatingId === selectedCoach.id
                        ? 'Saving…'
                        : selectedCoach.accountStatus === 'suspended' ? 'Reactivate Access' : selectedCoach.accountStatus === 'blocked' ? 'Grant Access' : 'Decline Access'}
                    </button>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{(coachProfile?.email) || selectedCoach.email || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{(coachProfile?.phone || coachProfile?.mobile) || (selectedCoach.phone || selectedCoach.mobile) || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Plan Type</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        (coachProfile?.userType || selectedCoach.userType) === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {(coachProfile?.userType || selectedCoach.userType) === 'paid' ? 'Paid' : 'Free'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Joined Date</p>
                      <p className="font-medium text-gray-900">{formatDate(coachProfile?.createdAt || selectedCoach.createdAt)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-900">{coachProfile?.location || selectedCoach.location || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="font-medium text-gray-900">{coachProfile?.country || selectedCoach.country || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Professional Information
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">Specialization</p>
                      <div className="flex flex-wrap gap-2">
                        {(coachProfile?.specialization || selectedCoach.specialization || '')
                          .split(',')
                          .filter(s => s && s.trim())
                          .map((spec, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              <Award size={14} className="mr-1" />
                              {spec.trim()}
                            </span>
                          ))}
                        {!(coachProfile?.specialization || selectedCoach.specialization) && <p className="text-gray-500">Not specified</p>}
                      </div>
                    </div>
                    {(coachProfile?.bio || selectedCoach.bio) && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Bio</p>
                        <p className="text-gray-700">{coachProfile?.bio || selectedCoach.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Social & Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(coachProfile?.linkedin || selectedCoach.linkedin) && (
                      <a href={coachProfile?.linkedin || selectedCoach.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700">
                        <Linkedin size={18} />
                        <span className="text-sm">LinkedIn Profile</span>
                      </a>
                    )}
                    {(coachProfile?.website || selectedCoach.website) && (
                      <a href={coachProfile?.website || selectedCoach.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700">
                        <Globe size={18} />
                        <span className="text-sm">Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
        {isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />}
      </aside>

      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-5'}`}>
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
          <div className="w-full max-w-full mx-auto">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    All Coaches
                  </h2>
                  <p className="text-blue-100 text-sm">
                    View all registered coaches with their details
                  </p>
                </div>
                <button
                  onClick={fetchCoaches}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Coaches</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatNumber(coaches.length)}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Paid Coaches</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">
                      {formatNumber(coaches.filter(c => c.userType === 'paid').length)}
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
                    <p className="text-xs text-gray-500 mb-1">Free Coaches</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-600">
                      {formatNumber(coaches.filter(c => c.userType === 'free').length)}
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
                      {formatNumber(coaches.filter(c => c.phone && c.phone.trim()).length)}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Phone className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Coaches Table */}
            <CoachFilterBar
            availFilter={availFilter}
            setAvailFilter={setAvailFilter}
            availSlot={availSlot}
            setAvailSlot={setAvailSlot}
              agreementFilter={agreementFilter}
              setAgreementFilter={setAgreementFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              total={coaches.length}
              filtered={filteredCoaches.length}
            />
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
              {coaches.length === 0 ? (
                <div className="p-12 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No Coaches Found</h3>
                  <p className="text-gray-500 mb-4">No coaches have been registered yet.</p>
                  <p className="text-sm text-gray-400">
                    Coaches will appear here once they are added to the system.
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

      {/* Coach Details Modal */}
      {viewModalOpen && selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setViewModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCoach.name}</h2>
                    <p className="text-blue-100">Coach Details</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccountStatus(selectedCoach, ['blocked', 'suspended'].includes(selectedCoach.accountStatus) ? 'unblock' : 'block')}
                    disabled={updatingId === selectedCoach.id}
                    title={['blocked', 'suspended'].includes(selectedCoach.accountStatus) ? 'Allow this user to log in again' : 'Stop this user from accessing the dashboard'}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                      ['blocked', 'suspended'].includes(selectedCoach.accountStatus)
                        ? 'bg-white text-green-700 hover:bg-green-50'
                        : 'bg-white text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {updatingId === selectedCoach.id
                      ? 'Saving…'
                      : selectedCoach.accountStatus === 'suspended' ? 'Reactivate Access' : selectedCoach.accountStatus === 'blocked' ? 'Grant Access' : 'Decline Access'}
                  </button>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{canViewContacts ? (selectedCoach.email || 'N/A') : maskEmail(selectedCoach.email)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{canViewContacts ? ((selectedCoach.phone || selectedCoach.mobile) || 'N/A') : maskPhone(selectedCoach.phone || selectedCoach.mobile)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Plan Type</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      selectedCoach.userType === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedCoach.userType === 'paid' ? 'Paid' : 'Free'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Joined Date</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedCoach.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Professional Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">Specialization</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCoach.specialization?.split(',').map((spec, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          <Award size={14} className="mr-1" />
                          {spec.trim()}
                        </span>
                      ))}
                      {!selectedCoach.specialization && <p className="text-gray-500">Not specified</p>}
                    </div>
                  </div>
                  {selectedCoach.bio && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">Bio</p>
                      <p className="text-gray-700">{selectedCoach.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Location */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location & Social
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCoach.location && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        {selectedCoach.location}
                      </p>
                    </div>
                  )}
                  {selectedCoach.country && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Globe size={16} className="text-gray-400" />
                        {selectedCoach.country}
                      </p>
                    </div>
                  )}
                  {selectedCoach.linkedin && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">LinkedIn</p>
                      <a 
                        href={selectedCoach.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 flex items-center gap-2 hover:underline"
                      >
                        <Linkedin size={16} />
                        View Profile
                      </a>
                    </div>
                  )}
                  {selectedCoach.website && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Website</p>
                      <a 
                        href={selectedCoach.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 flex items-center gap-2 hover:underline"
                      >
                        <Globe size={16} />
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {selectedCoach.skills && selectedCoach.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCoach.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              {(selectedCoach.resume || selectedCoach.resumeUrl || selectedCoach.cv_data) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Resume
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                    {selectedCoach.resume ? (
                      <>
                        {/* Resume Preview in Iframe */}
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                          <iframe
                            src={`data:application/pdf;base64,${selectedCoach.resume}`}
                            title="Resume Preview"
                            className="w-full h-96"
                          />
                        </div>
                        {/* Download Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `data:application/pdf;base64,${selectedCoach.resume}`;
                              link.download = selectedCoach.resumeFileName || 'resume.pdf';
                              link.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Download size={16} />
                            Download Resume
                          </button>
                        </div>
                      </>
                    ) : selectedCoach.resumeUrl || selectedCoach.cv_data ? (
                      <>
                        {/* Resume Preview in Iframe for URL */}
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                          <iframe
                            src={selectedCoach.resumeUrl || selectedCoach.cv_data}
                            title="Resume Preview"
                            className="w-full h-96"
                          />
                        </div>
                        {/* Download Button */}
                        <div className="flex justify-end">
                          <a 
                            href={selectedCoach.resumeUrl || selectedCoach.cv_data}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Download size={16} />
                            Download Resume
                          </a>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-orange-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCoaches;

const CoachFilterBar = ({ agreementFilter, setAgreementFilter, activityFilter, setActivityFilter, statusFilter = 'all', setStatusFilter = () => {}, skillCatFilter, setSkillCatFilter, skillCategories = [], total, filtered , availFilter = 'all', setAvailFilter = () => {}, availSlot = '', setAvailSlot = () => {} }) => {
  const isFiltered = agreementFilter !== 'all' || activityFilter !== 'all' || statusFilter !== 'all' || (skillCatFilter?.length || 0) > 0;
  const ACTIVITY_OPTIONS = [
    { key: 'all', label: 'All' }, { key: '24h', label: '24 Hours' }, { key: '48h', label: '48 Hours' },
    { key: '72h', label: '72 Hours' }, { key: 'week', label: 'Last Week' }, { key: 'month', label: 'Last Month' },
  ];
  const btn = (active, onClick, label, activeClass, inactiveClass) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? activeClass : inactiveClass}`}>{label}</button>
  );
  return (
    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <span className="relative inline-flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/></span>
          Active:
        </span>
        {ACTIVITY_OPTIONS.map(o => btn(activityFilter === o.key, () => setActivityFilter(o.key), o.label,
          'bg-green-600 text-white shadow-md', 'bg-white text-green-700 border border-green-300 hover:bg-green-50'))}
      </div>
      <div className="w-px h-6 bg-gray-300 hidden sm:block" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status:</span>
        {btn(statusFilter === 'all', () => setStatusFilter('all'), 'All', 'bg-blue-600 text-white shadow-md', 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50')}
        {btn(statusFilter === 'active', () => setStatusFilter('active'), '● Active', 'bg-green-600 text-white shadow-md', 'bg-white text-green-700 border border-green-300 hover:bg-green-50')}
        {btn(statusFilter === 'inactive', () => setStatusFilter('inactive'), '● Inactive', 'bg-red-500 text-white shadow-md', 'bg-white text-red-600 border border-red-300 hover:bg-red-50')}
      </div>
      <div className="w-px h-6 bg-gray-300 hidden sm:block" />
      <AvailabilityFilter mode={availFilter} setMode={setAvailFilter} slot={availSlot} setSlot={setAvailSlot} />
      <div className="w-px h-6 bg-gray-300 hidden sm:block" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Agreement:</span>
        {btn(agreementFilter === 'all', () => setAgreementFilter('all'), 'All', 'bg-blue-600 text-white shadow-md', 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50')}
        {btn(agreementFilter === 'signed', () => setAgreementFilter('signed'), '✓ Signed', 'bg-green-600 text-white shadow-md', 'bg-white text-green-700 border border-green-300 hover:bg-green-50')}
        {btn(agreementFilter === 'unsigned', () => setAgreementFilter('unsigned'), '✗ Pending', 'bg-red-500 text-white shadow-md', 'bg-white text-red-600 border border-red-300 hover:bg-red-50')}
      </div>
      {skillCategories.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-300 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Skill Category:</span>
            {skillCategories.map(c => {
              const active = skillCatFilter.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => setSkillCatFilter(prev => active ? prev.filter(x => x !== c) : [...prev, c])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="ml-auto text-xs text-gray-500 font-medium">
        {isFiltered ? (
          <span>Showing <span className="font-bold text-blue-600">{filtered}</span> of {total}
            <button onClick={() => { setAgreementFilter('all'); setActivityFilter('all'); setSkillCatFilter([]); }} className="ml-2 text-red-500 hover:text-red-700 underline">Clear</button>
          </span>
        ) : <span>Showing all {total}</span>}
      </div>
    </div>
  );
};
