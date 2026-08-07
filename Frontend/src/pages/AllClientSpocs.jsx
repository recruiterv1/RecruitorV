import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Users, Mail, Phone, Building, Download, Briefcase, Clock, UserCheck } from 'lucide-react';
import { Box } from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';
import { useDeviceStatus, DeviceBadges } from '../components/DeviceStatus';

const AllClientSpocs = ({ embedded = false }) => {
  const { user } = useContext(UserStateContext);

  const [clientSpocs, setClientSpocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');

  const ACTIVITY_MS = { '24h': 86400000, '48h': 172800000, '72h': 259200000, 'week': 604800000, 'month': 2592000000 };
  const getLastActiveMs = (r) => {
    const v = r.lastActiveDate || r.lastActive;
    if (!v) return 0;
    const ms = v._seconds ? v._seconds * 1000 : typeof v === 'string' ? Date.parse(v) : new Date(v).getTime();
    return isNaN(ms) ? 0 : ms;
  };
  const isOnline = (r) => Date.now() - getLastActiveMs(r) < 15 * 60 * 1000;

  const filteredClientSpocs = useMemo(() => {
    if (activityFilter === 'all') return clientSpocs;
    const now = Date.now();
    return clientSpocs.filter(r => {
      const ms = getLastActiveMs(r);
      return ms && now - ms <= ACTIVITY_MS[activityFilter];
    });
  }, [clientSpocs, activityFilter]);

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  const fetchClientSpocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/clientspoc/stats', { withCredentials: true });
      if (res.data.success) {
        setClientSpocs(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to fetch client SPOCs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch client SPOCs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchClientSpocs();
  }, [user]);

  const downloadExcel = () => {
    const rows = [];
    clientSpocs.forEach((r, i) => {
      rows.push({
        'S.No.': i + 1,
        'Name': r.name || 'N/A',
        'Email': r.email || 'N/A',
        'Phone': r.mobile || 'N/A',
        'Company': r.company || 'N/A',
        'Positions': r.positionCount || 0,
        'Last Active': r.lastActiveDate ? new Date(r.lastActiveDate).toLocaleString() : 'N/A',
        'Position Name': '',
        'Client': '',
        'Submissions': '',
        'Recruiters Working': '',
      });
      (r.positions || []).forEach(p => {
        rows.push({
          'S.No.': '',
          'Name': '',
          'Email': '',
          'Phone': '',
          'Company': '',
          'Positions': '',
          'Last Active': '',
          'Position Name': p.positionName,
          'Client': p.client,
          'Submissions': p.submissionCount,
          'Recruiters Working': p.recruiterCount,
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ClientSPOCs');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-clientspocs-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deviceMap = useDeviceStatus(clientSpocs.map(r => r.email));
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
      ),
    },
    {
      accessorKey: 'name',
      header: 'Client SPOC Name',
      size: 200,
      Cell: ({ cell, row }) => (
        <div className="flex items-center gap-1.5">
          {isOnline(row.original) && (
            <span className="relative inline-flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
          <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            {cell.getValue() || 'N/A'}
            <DeviceBadges status={deviceMap[(row.original.email || '').toLowerCase()]} size={14} />
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 230,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-gray-700 text-sm">{cell.getValue() || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'mobile',
      header: 'Phone',
      size: 140,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-gray-700 text-sm">{cell.getValue() || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      size: 180,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Building size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-gray-700 text-sm">{cell.getValue() || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'positionCount',
      header: 'Positions',
      size: 110,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-blue-500 shrink-0" />
          <span className="font-bold text-blue-700 text-sm">{cell.getValue() ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'activePositionCount',
      header: 'Active Positions',
      size: 140,
      Cell: ({ cell }) => {
        const count = cell.getValue() ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${count > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
              {count}
            </span>
          </div>
        );
      },
    },
    {
      accessorFn: (row) => row.lastActiveDate ? new Date(row.lastActiveDate).getTime() : 0,
      id: 'lastActiveDate',
      header: 'Last Active',
      size: 190,
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={13} className="text-orange-500 shrink-0" />
          <span className="text-sm">{formatDateTime(row.original.lastActiveDate)}</span>
        </div>
      ),
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: filteredClientSpocs,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    enableHiding: true,
    enableExpanding: true,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'lastActiveDate', desc: true }],
    },
    state: {
      isLoading: loading,
      showAlertBanner: !!error,
    },
    muiToolbarAlertBannerProps: error
      ? { color: 'error', children: error }
      : undefined,
    muiTableContainerProps: {
      sx: { maxHeight: 'calc(100vh - 400px)', minHeight: '400px' },
    },
    renderDetailPanel: ({ row }) => {
      const positions = row.original.positions || [];
      if (positions.length === 0) {
        return (
          <div className="px-6 py-4 text-gray-500 text-sm italic">
            No positions assigned to this Client SPOC.
          </div>
        );
      }
      return (
        <div className="px-6 py-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Positions ({positions.length})
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-xs">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Position Name</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Client</th>
                  <th className="text-center px-4 py-2 font-semibold text-xs">Total Submissions</th>
                  <th className="text-center px-4 py-2 font-semibold text-xs">Recruiters Working</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p, idx) => (
                  <tr
                    key={p.posId || idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-2 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{p.positionName}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{p.client}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-xs">
                        {p.submissionCount}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <UserCheck size={13} className="text-green-500" />
                        <span className="font-bold text-green-700 text-xs">{p.recruiterCount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Client SPOCs</h2>
            <p className="text-blue-100 text-sm">View all registered client SPOCs with position activity</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs text-white/70">Total Client SPOCs</p>
              <p className="text-lg font-bold">{clientSpocs.length}</p>
            </div>
            <button
              onClick={downloadExcel}
              disabled={clientSpocs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
              title="Download all client SPOCs as Excel"
            >
              <Download size={18} />
              Download Excel
            </button>
          </div>
        </div>
      </div>
      {/* Activity filter bar */}
      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <span className="relative inline-flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/></span>
          Active:
        </span>
        {[{ key: 'all', label: 'All' }, { key: '24h', label: '24 Hours' }, { key: '48h', label: '48 Hours' }, { key: '72h', label: '72 Hours' }, { key: 'week', label: 'Last Week' }, { key: 'month', label: 'Last Month' }].map(o => (
          <button key={o.key} onClick={() => setActivityFilter(o.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activityFilter === o.key ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'}`}>
            {o.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-500 font-medium">
          {activityFilter !== 'all'
            ? <span>Showing <span className="font-bold text-blue-600">{filteredClientSpocs.length}</span> of {clientSpocs.length} <button onClick={() => setActivityFilter('all')} className="ml-2 text-red-500 hover:text-red-700 underline">Clear</button></span>
            : <span>Showing all {clientSpocs.length}</span>}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden p-3">
        <MaterialReactTable table={table} />
      </div>
    </div>
  );
};

export default AllClientSpocs;
