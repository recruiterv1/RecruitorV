import React, { useState, useEffect, useContext, useMemo } from 'react';
import CertifiedBadge from '../components/CertifiedBadge';
import { availabilityColumn, AvailabilityFilter, matchesAvailability } from '../components/AvailabilityColumn';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ChangeRoleControl from '../components/ChangeRoleControl';
import {
  Users, Mail, Phone, Clock, TrendingUp, X, Linkedin, Twitter, Globe, MapPin, Award, Eye,
  Building, Briefcase as WorkIcon, FileText, Star, User, ExternalLink, Download, LogIn
} from 'lucide-react';
import { Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, CircularProgress } from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Sidebar from './Sidebar';
import { useDeviceStatus, DeviceBadges } from '../components/DeviceStatus';

const AllRecruiters = ({ embedded = false }) => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isAdmin = user?.role === 'admin' || user?.roleCategory === 'Admin' || user?.roleCategory?.toLowerCase() === 'superadmin';
  const canViewContacts = embedded || isClientSpoc || isAdmin;
  const isCollapsed = isSidebarCollapsed || false;

  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recruiterModalOpen, setRecruiterModalOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [recruiterProfileLoading, setRecruiterProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [agreementFilter, setAgreementFilter] = useState('all');
  const [commisionFilter, setCommisionFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [skillCatFilter, setSkillCatFilter] = useState([]);
  const [availFilter, setAvailFilter] = useState('all');   // all | set | unset
  const [availSlot, setAvailSlot] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');   // all | joined | none
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [updatingId, setUpdatingId] = useState(null);

  const handleAccountStatus = async (recruiter, action) => {
    if (action === 'reject' && !window.confirm(`Delete recruiter "${recruiter.name}"? This cannot be undone.`)) return;
    if (action === 'block' && !window.confirm(`Decline access for "${recruiter.name}"?\n\nThey will be signed out and cannot log in until access is granted again.`)) return;
    setUpdatingId(recruiter.id);
    try {
      await axios.patch('/admin/user-account-status', { userId: recruiter.id, userType: 'recruiter', action }, { withCredentials: true });
      if (action === 'reject') {
        setRecruiters(prev => prev.filter(r => r.id !== recruiter.id));
      } else {
        const statusMap = { approve: 'approved', unblock: 'approved', block: 'blocked', waitlist: 'waitlist' };
        const newStatus = statusMap[action];
        setRecruiters(prev => prev.map(r => r.id === recruiter.id ? { ...r, accountStatus: newStatus } : r));
        // keep the open modal's button in sync
        setSelectedRecruiter(prev => (prev && prev.id === recruiter.id ? { ...prev, accountStatus: newStatus } : prev));
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
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length <= 4) return '****';
    return '****' + digits.slice(-4);
  };

  const formatDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      if (dateData._seconds) {
        return new Date(dateData._seconds * 1000).toLocaleDateString('en-US', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      } else if (dateData.seconds) {
        return new Date(dateData.seconds * 1000).toLocaleDateString('en-US', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      } else if (dateData.toDate) {
        return dateData.toDate().toLocaleDateString('en-US', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      }
      return new Date(dateData).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const fetchRecruiterProfile = async (recruiterId) => {
    if (!recruiterId) return;
    setRecruiterProfileLoading(true);
    try {
      const roleNorm = ((user?.roleCategory || user?.role || '')).toLowerCase().replace(/\s+/g, '');
      const isSuperAdmin = roleNorm === 'superadmin' || roleNorm === 'admin';
      const endpoint = embedded || isSuperAdmin
        ? `/api/profile/recruiter/${recruiterId}/admin`
        : `/api/profile/recruiter/${recruiterId}`;
      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
      if (response.data.success) {
        setRecruiterProfile(response.data.data);
      } else {
        setRecruiterProfile(null);
      }
    } catch (err) {
      setRecruiterProfile(null);
    } finally {
      setRecruiterProfileLoading(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedRecruiter(row);
    setRecruiterModalOpen(true);
    setActiveTab(0);
  };

  useEffect(() => {
    if (recruiterModalOpen && selectedRecruiter?.id) {
      fetchRecruiterProfile(selectedRecruiter.id);
    }
  }, [recruiterModalOpen, selectedRecruiter]);

  const [sweeping, setSweeping] = useState(false);
  const runSweep = async () => {
    if (sweeping) return;
    if (!window.confirm('Run the inactivity sweep now?\n\nRecruiters registered 45+ days ago with no assigned position, no submitted candidate, no referral and no direct applicants will be suspended (they can be re-activated any time).')) return;
    setSweeping(true);
    try {
      const res = await axios.post('/admin/suspend-inactive-recruiters', {}, { withCredentials: true });
      const d = res.data || {};
      alert(`Inactivity sweep complete.\n\nSuspended: ${d.suspended ?? 0}\nScanned (45+ days, approved): ${d.scanned ?? 0}\nTotal recruiters: ${d.total ?? 0}`);
      await fetchRecruiters();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run the sweep.');
    } finally {
      setSweeping(false);
    }
  };

  const fetchRecruiters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/recruiterstats/all', { withCredentials: true });
      if (res.data.success) {
        setRecruiters(res.data.recruiters || []);
      } else {
        setError(res.data.message || 'Failed to fetch recruiters');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recruiters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRecruiters();
  }, [user]);

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
    const rows = recruiters.map((r, i) => ({
      'S.No.': i + 1,
      'Name': r.name || 'N/A',
      'Email': r.email || 'N/A',
      'Phone': r.phone || r.mobile || r.mob || 'N/A',
      'Positions': r.positionCount || 0,
      'Candidates Submitted': r.candidatesSubmitted || 0,
      'Success Rate': r.successRate || 'N/A',
      'Joined Date': formatDate(r.registrationDate || r.createdAt || r.created_on || r.joinedAt),
      'Last Active': formatDateTime(r.lastActive),
      'Profile %': r.profileCompletion || 0,
      'Status': r.isActive !== false ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recruiters');
    XLSX.writeFile(wb, `all-recruiters-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toggleActive = async (recruiter) => {
    const newState = recruiter.isActive === false ? true : false;
    setTogglingId(recruiter.id);
    try {
      await axios.patch(`/recruiterstats/${recruiter.id}/active`, { isActive: newState }, { withCredentials: true });
      setRecruiters(prev => prev.map(r => r.id === recruiter.id ? { ...r, isActive: newState } : r));
    } catch (err) {
      console.error('Failed to toggle recruiter status:', err);
      alert('Failed to update recruiter status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  // Super Admin "Login as" — opens the recruiter's own dashboard as them.
  const impersonate = async (recruiter) => {
    if (!window.confirm(`Log in as ${recruiter.name || recruiter.email}?\n\nThis replaces your Super Admin session with theirs — you'll need to log back in as admin afterwards.`)) return;
    try {
      const res = await axios.post('/admin/impersonate', { email: recruiter.email }, { withCredentials: true });
      if (res.data?.success) window.location.href = res.data.redirect || '/dash_rec';
      else alert(res.data?.message || 'Could not log in as this user.');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not log in as this user.');
    }
  };

  const deviceMap = useDeviceStatus(recruiters.map(r => r.email));

  const columns = [
    {
      accessorKey: 'serialNumber',
      header: 'S.No.',
      size: 60,
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <span className="font-bold text-gray-700 text-xs bg-blue-50 px-2 py-1 rounded-full">
            {row.index + 1}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'name',
      header: 'Recruiter Name',
      size: 220,
      Cell: ({ cell, row }) => (
        <div className="cursor-default flex items-center gap-1.5">
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
              {row.original.accountStatus === 'blocked' && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  ACCESS DECLINED
                </span>
              )}
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
            <span className="font-medium text-gray-700 text-sm">{display || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 140,
      Cell: ({ cell, row }) => {
        const value = cell.getValue() || row.original?.mobile || row.original?.mob;
        const display = canViewContacts ? value : maskPhone(value);
        return (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="font-medium text-gray-700 text-sm">{display || 'N/A'}</span>
          </div>
        );
      },
    },
    availabilityColumn,
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
      accessorKey: 'positionCount',
      header: 'Positions',
      size: 110,
    },
    {
      accessorKey: 'candidatesSubmitted',
      header: 'Submitted',
      size: 120,
    },
    {
      accessorKey: 'successRate',
      header: 'Success Rate',
      size: 130,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2 text-gray-700">
          <TrendingUp size={14} className="text-green-600" />
          <span className="text-sm">{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorFn: (row) => {
        const d = row.registrationDate || row.createdAt || row.created_on || row.joinedAt || null;
        if (!d) return 0;
        if (d._seconds) return d._seconds * 1000;
        if (d.seconds) return d.seconds * 1000;
        if (d.toDate) return d.toDate().getTime();
        return new Date(d).getTime() || 0;
      },
      id: 'joinedAt',
      header: 'Joined',
      size: 120,
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={12} className="text-orange-500" />
          <span className="text-sm">{formatDate(row.original.registrationDate || row.original.createdAt || row.original.created_on || row.original.joinedAt)}</span>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.lastActive ? new Date(row.lastActive).getTime() : 0,
      id: 'lastActive',
      header: 'Last Active',
      size: 170,
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={12} className="text-orange-500" />
          <span className="text-sm">{formatDateTime(row.original.lastActive)}</span>
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
    {
      accessorKey: 'commisiontype',
      header: 'Commission Type',
      size: 180,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        if (!val) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
            val === 'Own Sourcing Tools'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      size: 120,
      enableSorting: true,
      Cell: ({ row }) => {
        const active = row.original.isActive !== false;
        const isToggling = togglingId === row.original.id;
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => toggleActive(row.original)}
              disabled={isToggling}
              title={active ? 'Click to deactivate' : 'Click to activate'}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-xs font-semibold ${active ? 'text-green-600' : 'text-gray-400'}`}>
              {isToggling ? '...' : active ? 'Active' : 'Inactive'}
            </span>
            {isAdmin && (
              <ChangeRoleControl userId={row.original.id} name={row.original.name} currentType="recruiter" onChanged={fetchRecruiters} />
            )}
            <button
              onClick={() => impersonate(row.original)}
              title="Log in as this recruiter"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
            >
              <LogIn size={13} /> Login as
            </button>
          </div>
        );
      },
    },
  ];

  const ACTIVITY_MS = { '24h': 86400000, '48h': 172800000, '72h': 259200000, 'week': 604800000, 'month': 2592000000 };
  const getLastActiveMs = (r) => {
    const v = r.lastActive || r.lastActiveDate;
    if (!v) return 0;
    const ms = v._seconds ? v._seconds * 1000 : typeof v === 'string' ? Date.parse(v) : new Date(v).getTime();
    return isNaN(ms) ? 0 : ms;
  };
  const isOnline = (r) => Date.now() - getLastActiveMs(r) < 15 * 60 * 1000;

  const skillCategories = useMemo(() =>
    [...new Set(recruiters.flatMap(r => {
      const v = r.skillCategory;
      return Array.isArray(v) ? v : (v ? [v] : []);
    }).filter(Boolean))].sort()
  , [recruiters]);

  const filteredRecruiters = useMemo(() => {
    const now = Date.now();
    return recruiters.filter(r => {
      // Hide only legacy pending/waitlist sign-ups. Users whose access has been
      // DECLINED must stay visible here — this is the screen an admin uses to
      // grant their access back.
      if (embedded && ['pending', 'waitlist'].includes((r.accountStatus || '').toLowerCase())) return false;
      if (agreementFilter === 'signed' && !r.agreementSigned) return false;
      if (agreementFilter === 'unsigned' && r.agreementSigned) return false;
      if (commisionFilter !== 'all' && r.commisiontype !== commisionFilter) return false;
      if (activityFilter !== 'all') {
        const ms = getLastActiveMs(r);
        if (!ms || now - ms > ACTIVITY_MS[activityFilter]) return false;
      }
      if (skillCatFilter.length > 0) {
        const v = r.skillCategory;
        const cats = Array.isArray(v) ? v : (v ? [v] : []);
        if (!skillCatFilter.some(f => cats.includes(f))) return false;
      }
      if (teamFilter === 'joined' && !r.joinedTeam) return false;
      if (teamFilter === 'none' && r.joinedTeam) return false;
      const inactive = r.isActive === false || r.accountStatus === 'suspended';
      if (statusFilter === 'active' && inactive) return false;
      if (statusFilter === 'inactive' && !inactive) return false;
      if (!matchesAvailability(r, availFilter, availSlot)) return false;
      return true;
    });
  }, [recruiters, agreementFilter, commisionFilter, activityFilter, skillCatFilter, teamFilter, statusFilter, embedded, availFilter, availSlot]);

  const table = useMaterialReactTable({
    columns,
    data: filteredRecruiters,
    state: { isLoading: loading, showAlertBanner: !!error },
    muiToolbarAlertBannerProps: error ? { color: 'error', children: error } : undefined,
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
    displayColumnDefOptions: {
      'mrt-row-actions': { size: 80, header: 'Actions' },
    },
    renderRowActions: ({ row }) => {
      const rec = row.original;
      return (
        <Box sx={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleRowClick(rec); }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-medium text-xs shadow-md"
            title="View recruiter"
          >
            <Eye size={12} /><span>View</span>
          </button>
        </Box>
      );
    },
    muiTableContainerProps: {
      sx: { maxHeight: 'calc(100vh - 400px)', minHeight: '400px' },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row.original),
      sx: { cursor: 'pointer' },
    }),
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading recruiters...</p>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="px-4 py-6">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">All Recruiters</h2>
                <p className="text-blue-100 text-sm">View all registered recruiters with activity stats</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-xs text-white/70">Total Recruiters</p>
                  <p className="text-lg font-bold">{recruiters.length}</p>
                </div>
                <button
                  onClick={runSweep}
                  disabled={sweeping}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                  title="Suspend recruiters inactive for 45+ days"
                >
                  <Clock size={18} />
                  {sweeping ? 'Running…' : 'Run inactivity sweep'}
                </button>
                <button
                  onClick={downloadExcel}
                  disabled={recruiters.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                  title="Download all recruiters as Excel"
                >
                  <Download size={18} />
                  Download Excel
                </button>
              </div>
            </div>
          </div>

          <RecruiterFilterBar
            availFilter={availFilter}
            setAvailFilter={setAvailFilter}
            availSlot={availSlot}
            setAvailSlot={setAvailSlot}
            agreementFilter={agreementFilter}
            setAgreementFilter={setAgreementFilter}
            commisionFilter={commisionFilter}
            setCommisionFilter={setCommisionFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            skillCatFilter={skillCatFilter}
            setSkillCatFilter={setSkillCatFilter}
            skillCategories={skillCategories}
            total={recruiters.length}
            filtered={filteredRecruiters.length}
          />
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden p-3">
            <MaterialReactTable table={table} />
          </div>
        {recruiterModalOpen && (
          <RecruiterProfileModal
            open={recruiterModalOpen}
            onClose={() => {
              setRecruiterModalOpen(false);
              setSelectedRecruiter(null);
              setRecruiterProfile(null);
            }}
            profile={recruiterProfile}
            loading={recruiterProfileLoading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            basicInfo={selectedRecruiter}
            resumeModalOpen={resumeModalOpen}
            setResumeModalOpen={setResumeModalOpen}
            onAccessChange={handleAccountStatus}
            accessSaving={updatingId === selectedRecruiter?.id}
            onImpersonate={impersonate}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
        {isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />}
      </aside>

      <div className={`transition-all duration-300 ${isClientSpoc ? (isCollapsed ? 'lg:pl-20' : 'lg:pl-5') : ''}`}>
        <div className="px-4 py-6">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">All Recruiters</h2>
                <p className="text-blue-100 text-sm">View all registered recruiters with activity stats</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-xs text-white/70">Total Recruiters</p>
                  <p className="text-lg font-bold">{recruiters.length}</p>
                </div>
                <button
                  onClick={runSweep}
                  disabled={sweeping}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                  title="Suspend recruiters inactive for 45+ days"
                >
                  <Clock size={18} />
                  {sweeping ? 'Running…' : 'Run inactivity sweep'}
                </button>
                <button
                  onClick={downloadExcel}
                  disabled={recruiters.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                  title="Download all recruiters as Excel"
                >
                  <Download size={18} />
                  Download Excel
                </button>
              </div>
            </div>
          </div>

          <RecruiterFilterBar
            availFilter={availFilter}
            setAvailFilter={setAvailFilter}
            availSlot={availSlot}
            setAvailSlot={setAvailSlot}
            agreementFilter={agreementFilter}
            setAgreementFilter={setAgreementFilter}
            commisionFilter={commisionFilter}
            setCommisionFilter={setCommisionFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            skillCatFilter={skillCatFilter}
            setSkillCatFilter={setSkillCatFilter}
            skillCategories={skillCategories}
            total={recruiters.length}
            filtered={filteredRecruiters.length}
          />
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden p-3">
            <MaterialReactTable table={table} />
          </div>
        </div>
      </div>
      {recruiterModalOpen && (
        <RecruiterProfileModal
          open={recruiterModalOpen}
          onClose={() => {
            setRecruiterModalOpen(false);
            setSelectedRecruiter(null);
            setRecruiterProfile(null);
          }}
          profile={recruiterProfile}
          loading={recruiterProfileLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          basicInfo={selectedRecruiter}
          resumeModalOpen={resumeModalOpen}
          setResumeModalOpen={setResumeModalOpen}
          onAccessChange={handleAccountStatus}
          accessSaving={updatingId === selectedRecruiter?.id}
        />
      )}
    </div>
  );
};

export default AllRecruiters;

const COMMISSION_OPTIONS = ['Own Sourcing Tools', 'Job Portal Access'];

const RecruiterFilterBar = ({ agreementFilter, setAgreementFilter, commisionFilter, setCommisionFilter, activityFilter, setActivityFilter, teamFilter, setTeamFilter, statusFilter, setStatusFilter, skillCatFilter, setSkillCatFilter, skillCategories = [], total, filtered , availFilter = 'all', setAvailFilter = () => {}, availSlot = '', setAvailSlot = () => {} }) => {
  const btn = (active, onClick, label, color = 'blue') => {
    const colors = {
      blue: active ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50',
      green: active ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-700 border border-green-300 hover:bg-green-50',
      red: active ? 'bg-red-500 text-white shadow-md' : 'bg-white text-red-600 border border-red-300 hover:bg-red-50',
      purple: active ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50',
    };
    return (
      <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${colors[color]}`}>
        {label}
      </button>
    );
  };

  const isFiltered = agreementFilter !== 'all' || commisionFilter !== 'all' || activityFilter !== 'all' || teamFilter !== 'all' || statusFilter !== 'all' || skillCatFilter.length > 0;
  const ACTIVITY_OPTIONS = [
    { key: 'all', label: 'All' }, { key: '24h', label: '24 Hours' }, { key: '48h', label: '48 Hours' },
    { key: '72h', label: '72 Hours' }, { key: 'week', label: 'Last Week' }, { key: 'month', label: 'Last Month' },
  ];

  return (
    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center gap-3">
      {/* Activity filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <span className="relative inline-flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/></span>
          Active:
        </span>
        {ACTIVITY_OPTIONS.map(o => btn(activityFilter === o.key, () => setActivityFilter(o.key), o.label, activityFilter === o.key ? 'green' : 'blue'))}
      </div>

      <div className="w-px h-6 bg-gray-300 hidden sm:block" />

      {/* Account status filter — includes auto-suspended (inactive) recruiters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status:</span>
        {btn(statusFilter === 'all', () => setStatusFilter('all'), 'All', 'blue')}
        {btn(statusFilter === 'active', () => setStatusFilter('active'), '● Active', 'green')}
        {btn(statusFilter === 'inactive', () => setStatusFilter('inactive'), '● Inactive', 'red')}
      </div>

      <div className="w-px h-6 bg-gray-300 hidden sm:block" />

      {/* Joined Team filter — recruiters who are members of a coach/expert team */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Joined Team:</span>
        {btn(teamFilter === 'all', () => setTeamFilter('all'), 'All', 'blue')}
        {btn(teamFilter === 'joined', () => setTeamFilter('joined'), '✓ In a team', 'green')}
        {btn(teamFilter === 'none', () => setTeamFilter('none'), 'No team', 'red')}
      </div>

      <div className="w-px h-6 bg-gray-300 hidden sm:block" />

      {/* Agreement filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Agreement:</span>
        {btn(agreementFilter === 'all', () => setAgreementFilter('all'), 'All', 'blue')}
        {btn(agreementFilter === 'signed', () => setAgreementFilter('signed'), '✓ Signed', 'green')}
        {btn(agreementFilter === 'unsigned', () => setAgreementFilter('unsigned'), '✗ Pending', 'red')}
      </div>

      <div className="w-px h-6 bg-gray-300 hidden sm:block" />

      {/* Commission type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Commission:</span>
        {btn(commisionFilter === 'all', () => setCommisionFilter('all'), 'All', 'blue')}
        {btn(commisionFilter === 'Own Sourcing Tools', () => setCommisionFilter('Own Sourcing Tools'), 'Own Sourcing', 'blue')}
        {btn(commisionFilter === 'Job Portal Access', () => setCommisionFilter('Job Portal Access'), 'Job Portal', 'purple')}
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

      {/* Result count */}
      <div className="w-px h-6 bg-gray-300 hidden sm:block" />
      <AvailabilityFilter mode={availFilter} setMode={setAvailFilter} slot={availSlot} setSlot={setAvailSlot} />
      <div className="ml-auto text-xs text-gray-500 font-medium">
        {isFiltered ? (
          <span>
            Showing <span className="font-bold text-blue-600">{filtered}</span> of {total}
            <button
              onClick={() => { setAgreementFilter('all'); setCommisionFilter('all'); setActivityFilter('all'); setSkillCatFilter([]); }}
              className="ml-2 text-red-500 hover:text-red-700 underline"
            >
              Clear
            </button>
          </span>
        ) : (
          <span>Showing all {total}</span>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="bg-white p-3 rounded-lg border flex items-start gap-3">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || 'N/A'}</p>
    </div>
  </div>
);

const RecruiterProfileModal = ({ open, onClose, profile, loading, activeTab, setActiveTab, basicInfo, resumeModalOpen, setResumeModalOpen, onAccessChange, accessSaving, onImpersonate }) => {
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Resume Modal Component
  const ResumeModal = () => {
    const isBase64 = !!profile?.resume;
    const iframeSrc = isBase64
      ? `data:application/pdf;base64,${profile.resume}`
      : (profile?.resumeUrl || '');
    return (
      <Dialog open={resumeModalOpen} onClose={() => setResumeModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-orange-500 text-white m-0 p-4">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h3 className="text-xl font-bold">Resume</h3>
              <p className="text-blue-100 text-sm">{profile?.resumeFileName || 'Resume.pdf'}</p>
            </div>
          </div>
          <button onClick={() => setResumeModalOpen(false)} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
            <X size={24} />
          </button>
        </DialogTitle>
        <DialogContent className="p-0 bg-gray-100">
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white m-4">
            <iframe
              src={iframeSrc}
              title="Resume Preview"
              className="w-full h-[60vh]"
            />
          </div>
        </DialogContent>
        <DialogActions className="bg-gray-50 p-4 border-t">
          <Button onClick={() => setResumeModalOpen(false)} variant="outlined">
            Close
          </Button>
          {isBase64 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download size={18} />}
              onClick={() => {
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${profile.resume}`;
                link.download = profile?.resumeFileName || 'resume.pdf';
                link.click();
              }}
            >
              Download Resume
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download size={18} />}
              href={profile?.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
            >
              Download Resume
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-orange-500 text-white m-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Recruiter Profile</h3>
              <p className="text-blue-100 text-sm">Click on recruiter row to view details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(basicInfo?.email) && onImpersonate && (
              <button
                onClick={() => onImpersonate(basicInfo)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Login as
              </button>
            )}
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
              <X size={24} />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="p-0 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <CircularProgress />
              <span className="ml-3 text-gray-600">Loading recruiter profile...</span>
            </div>
          ) : profile ? (
            <div>
              <div className="bg-white p-6 border-b">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-800">{profile.name || 'N/A'}</h4>
                    <p className="text-gray-500">{profile.experienceCategory || profile.currentTitle || 'Recruiter'}</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Profile Completion</span>
                        <span className="text-sm font-medium text-blue-600">{profile.profileCompletion || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getCompletionColor(profile.profileCompletion || 0)}`}
                          style={{ width: `${profile.profileCompletion || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Candidates</div>
                    <div className="text-2xl font-bold text-blue-600">{profile.totalCandidates || 0}</div>
                  </div>
                </div>
              </div>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} className="bg-white border-b" variant="fullWidth">
                <Tab label="Personal" icon={<User size={16} />} iconPosition="start" />
                <Tab label="Professional" icon={<WorkIcon size={16} />} iconPosition="start" />
                <Tab label="Skills" icon={<Star size={16} />} iconPosition="start" />
                <Tab label="Experience" icon={<WorkIcon size={16} />} iconPosition="start" />
              </Tabs>
              <div className="p-6">
                {activeTab === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={<Mail size={18} />} label="Email" value={profile.email} />
                      <InfoItem icon={<Phone size={18} />} label="Phone" value={profile.phone} />
                      <InfoItem icon={<MapPin size={18} />} label="Location" value={profile.location} />
                      <InfoItem icon={<Globe size={18} />} label="Country" value={profile.country} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={<Building size={18} />} label="Current Company" value={profile.currentCompany} />
                      <InfoItem icon={<WorkIcon size={18} />} label="Current Title" value={profile.currentTitle} />
                      <InfoItem icon={<Star size={18} />} label="Experience Category" value={profile.experienceCategory} />
                      <InfoItem icon={<Star size={18} />} label="Years of Experience" value={profile.yearsOfExperience} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={<Award size={18} />} label="Specialization" value={profile.specialization} />
                      <InfoItem icon={<Users size={18} />} label="Target Industries" value={(profile.targetIndustries || []).join(', ')} />
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <User size={16} />
                        Bio
                      </h5>
                      <p className="text-gray-600">{profile.bio || 'No bio provided'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700">
                          <Linkedin size={18} />
                          <span className="text-sm">LinkedIn Profile</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {profile.twitter && (
                        <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors text-sky-700">
                          <Twitter size={18} />
                          <span className="text-sm">Twitter Profile</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-purple-700">
                          <Globe size={18} />
                          <span className="text-sm">Website</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    {(profile.hasResume || profile.resumeUrl) && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3">
                        <FileText size={20} className="text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Resume Available</p>
                          <p className="text-sm text-green-600">{profile.resumeFileName || 'Resume.pdf'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <h5 className="text-sm text-gray-500 mb-1">Years of Experience</h5>
                        <p className="font-medium text-gray-800">{profile.yearsOfExperience || 'Not specified'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <h5 className="text-sm text-gray-500 mb-1">Current Position</h5>
                        <p className="font-medium text-gray-800">{profile.currentTitle || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="text-sm text-gray-500 mb-1">Education</h5>
                      {Array.isArray(profile.education) && profile.education.length > 0 ? (
                        <ul className="space-y-2">
                          {profile.education.map((edu, idx) => (
                            <li key={idx} className="text-sm text-gray-800">
                              {edu.degree || 'Degree'} - {edu.institutionName || 'Institution'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-medium text-gray-800">No education added</p>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 2 && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Star size={16} />
                      Skills &amp; Expertise
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.length > 0 ? (
                        profile.skills.map((skill, index) => (
                          <Chip key={index} label={skill} size="small" className="bg-blue-50 text-blue-700 hover:bg-blue-100" />
                        ))
                      ) : (
                        <span className="text-gray-500">No skills added yet</span>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 3 && (
                  <div className="space-y-4">
                    {profile.workExperience?.length > 0 ? (
                      profile.workExperience.map((exp, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-800">{exp.jobTitle || exp.position}</h5>
                              <p className="text-gray-600 flex items-center gap-1">
                                <Building size={14} />
                                {exp.companyName || exp.company}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                              </p>
                              {exp.location && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin size={12} />
                                  {exp.location}
                                </p>
                              )}
                            </div>
                          </div>
                          {exp.description && <p className="text-gray-600 mt-3 text-sm">{exp.description}</p>}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white p-8 rounded-lg border text-center">
                        <WorkIcon size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No work experience added yet</p>
                      </div>
                    )}
                  </div>
                )}
              
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-yellow-600" />
                </div>
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Profile Not Complete</h4>
                <p className="text-yellow-700 mb-4">
                  This recruiter has not completed their profile yet.
                </p>
                {basicInfo && (
                  <div className="bg-white rounded-lg p-4 text-left border border-yellow-200">
                    <h5 className="font-medium text-gray-800 mb-2">Recruiter Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium text-gray-800 ml-2">{basicInfo.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium text-gray-800 ml-2">{basicInfo.email}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="bg-gray-50 p-4 border-t">
          {/* Grant / decline dashboard access — takes effect immediately */}
          {onAccessChange && (
            <Button
              variant="contained"
              color={basicInfo?.accountStatus === 'blocked' ? 'success' : 'error'}
              disabled={accessSaving}
              onClick={() => onAccessChange(basicInfo, basicInfo?.accountStatus === 'blocked' ? 'unblock' : 'block')}
              sx={{ mr: 'auto' }}
            >
              {accessSaving
                ? 'Saving…'
                : basicInfo?.accountStatus === 'blocked' ? 'Grant Access' : 'Decline Access'}
            </Button>
          )}
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
          {(profile?.hasResume || profile?.resumeUrl) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileText size={18} />}
              onClick={() => setResumeModalOpen(true)}
            >
              View Resume
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {resumeModalOpen && (profile?.resume || profile?.resumeUrl) && <ResumeModal />}
    </>
  );
};
