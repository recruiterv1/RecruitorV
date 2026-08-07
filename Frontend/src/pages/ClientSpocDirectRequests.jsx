import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Box, Chip, Dialog, DialogTitle, DialogContent, IconButton, CircularProgress } from '@mui/material';
import { UserCheck, X, Check, Clock, Ban, Briefcase, Mail, Phone, Star, Calendar } from 'lucide-react';

const statusColors = {
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Pending' },
  approved: { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  label: 'Approved' },
  rejected: { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    label: 'Rejected' },
  waitlist: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Waitlist' },
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ClientSpocDirectRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // requestId being actioned
  const [toast, setToast] = useState(null);
  const [profileModal, setProfileModal] = useState(null); // { open, data, loading }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/direct-coach-request/clientspoc', { withCredentials: true });
      setRequests(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load requests', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openProfile = async (row) => {
    setProfileModal({ open: true, data: null, loading: true });
    try {
      const type = row.coachExpertType?.toLowerCase();
      const id   = row.coachExpertId;
      const endpoint = type === 'coach' ? `/api/coach-expert/coach/${id}` : `/api/coach-expert/expert/${id}`;
      const res = await axios.get(endpoint, { withCredentials: true });
      setProfileModal({ open: true, data: res.data?.data || res.data, loading: false });
    } catch {
      // Fallback: use inline data from the request row
      setProfileModal({
        open: true,
        loading: false,
        data: {
          name: row.coachExpertName,
          email: row.coachExpertEmail,
          phone: row.coachExpertPhone,
          specialization: row.coachExpertSpecialization,
          userType: null,
        },
      });
    }
  };

  const handleAction = async (requestId, status) => {
    setActionLoading(requestId + status);
    try {
      await axios.put(`/api/direct-coach-request/${requestId}/status`, { status }, { withCredentials: true });
      showToast(`Request ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'waitlisted'} successfully.`);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'coachExpertName',
      header: 'Name',
      size: 170,
      Cell: ({ cell, row }) => (
        <button
          onClick={() => openProfile(row.original)}
          className="font-semibold text-blue-600 hover:text-orange-500 hover:underline text-left transition-colors"
        >
          {cell.getValue()}
        </button>
      ),
    },
    {
      accessorKey: 'coachExpertType',
      header: 'Type',
      size: 100,
      Cell: ({ cell }) => {
        const v = cell.getValue();
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${v === 'Coach' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
            {v}
          </span>
        );
      },
    },
    {
      accessorKey: 'positionTitle',
      header: 'Position',
      size: 200,
      Cell: ({ cell }) => <span className="font-medium text-gray-800">{cell.getValue()}</span>,
    },
    {
      accessorKey: 'client',
      header: 'Client',
      size: 150,
    },
    {
      accessorKey: 'coachExpertEmail',
      header: 'Email',
      size: 200,
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested On',
      size: 130,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-1 text-gray-600 text-sm">
          <Calendar size={14} className="text-orange-500" />
          {formatDate(cell.getValue())}
        </div>
      ),
      sortingFn: (a, b) =>
        (a.original.createdAt?._seconds || 0) - (b.original.createdAt?._seconds || 0),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      Cell: ({ cell }) => {
        const s = cell.getValue();
        const c = statusColors[s] || statusColors.pending;
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
            {c.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 220,
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => {
        const r = row.original;
        if (r.status !== 'pending') return <span className="text-gray-400 text-sm italic">Actioned</span>;
        const busy = (s) => actionLoading === r.id + s;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAction(r.id, 'approved')}
              disabled={!!actionLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {busy('approved') ? <CircularProgress size={12} color="inherit" /> : <Check size={12} />}
              Approve
            </button>
            <button
              onClick={() => handleAction(r.id, 'waitlist')}
              disabled={!!actionLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {busy('waitlist') ? <CircularProgress size={12} color="inherit" /> : <Clock size={12} />}
              Waitlist
            </button>
            <button
              onClick={() => handleAction(r.id, 'rejected')}
              disabled={!!actionLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {busy('rejected') ? <CircularProgress size={12} color="inherit" /> : <Ban size={12} />}
              Reject
            </button>
          </div>
        );
      },
    },
  ], [actionLoading]);

  const table = useMaterialReactTable({
    columns,
    data: requests,
    enableColumnOrdering: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableGlobalFilter: true,
    enableDensityToggle: true,
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'comfortable',
      sorting: [{ id: 'createdAt', desc: true }],
    },
    state: { isLoading: loading },
    muiTableHeadCellProps: {
      sx: { background: 'linear-gradient(to right,#eff6ff,#fff7ed)', fontWeight: 600, color: '#1f2937', borderBottom: '2px solid #bfdbfe' },
    },
    muiTablePaperProps: { sx: { boxShadow: 'none', border: 'none' } },
    muiTopToolbarProps: {
      sx: {
        background: 'linear-gradient(to right,#2563eb,#f97316)',
        '& .MuiIconButton-root': { color: 'white' },
        '& .MuiInputBase-root': { color: 'white', '&::before': { borderBottomColor: 'rgba(255,255,255,0.5)' } },
      },
    },
    renderTopToolbarCustomActions: () => (
      <button
        onClick={fetchRequests}
        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-sm transition-all"
      >
        Refresh
      </button>
    ),
  });

  const ProfileModal = () => {
    if (!profileModal?.open) return null;
    const d = profileModal.data;
    return (
      <Dialog open maxWidth="sm" fullWidth onClose={() => setProfileModal(null)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right,#2563eb,#f97316)', color: 'white' }}>
          <span className="font-bold text-lg">Profile Details</span>
          <IconButton onClick={() => setProfileModal(null)} sx={{ color: 'white' }}><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {profileModal.loading ? (
            <div className="flex justify-center py-10"><CircularProgress /></div>
          ) : d ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {d.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{d.name}</h3>
                  <p className="text-sm text-gray-500">{d.userType === 'paid' ? '⭐ Paid' : 'Free'} Member</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: <Mail size={16} className="text-blue-500" />, label: 'Email', value: d.email },
                  { icon: <Phone size={16} className="text-green-500" />, label: 'Phone', value: d.phone || d.mobile || 'N/A' },
                  { icon: <Star size={16} className="text-orange-500" />, label: 'Specialization', value: Array.isArray(d.specialization) ? d.specialization.join(', ') : d.specialization || 'N/A' },
                  { icon: <Briefcase size={16} className="text-purple-500" />, label: 'Experience', value: d.yearsOfExperience ? `${d.yearsOfExperience} years` : 'N/A' },
                  { icon: <UserCheck size={16} className="text-teal-500" />, label: 'Current Title', value: d.currentTitle || 'N/A' },
                  { icon: <Briefcase size={16} className="text-gray-500" />, label: 'Company', value: d.currentCompany || 'N/A' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="mt-0.5">{icon}</div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}
                {d.bio && (
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{d.bio}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">Could not load profile.</p>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="w-full py-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm transition-all ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <ProfileModal />

      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <UserCheck size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Direct Coach/Expert Requests</h3>
              <p className="text-blue-100 text-sm">
                {requests.filter(r => r.status === 'pending').length} pending •{' '}
                {requests.filter(r => r.status === 'approved').length} approved
              </p>
            </div>
          </div>
        </div>

        <MaterialReactTable table={table} />
      </div>
    </div>
  );
}
