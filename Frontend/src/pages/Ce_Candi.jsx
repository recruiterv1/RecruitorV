import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Users, Download, TrendingUp, Eye, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Box, IconButton, Tooltip } from '@mui/material';

const Ce_Candi = () => {
  const [particle, setParticle] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/addit/show/all/candi", { withCredentials: true });
      setParticle(res.data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, []);

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  const handleDownload = () => {
    axios
      .get('/download/bulkFile', { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "candidate_data.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => console.log('Download the File:', err));
  };

  // Status badge color
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('accept') || statusLower.includes('selected') || statusLower.includes('joined')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (statusLower.includes('reject') || statusLower.includes('declined')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (statusLower.includes('interview') || statusLower.includes('shortlist')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (statusLower.includes('pending') || statusLower.includes('review')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Define columns with Material React Table
  const columns = useMemo(
    () => [
      {
        accessorKey: 'datePosted',
        header: 'Submitted On',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
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
        accessorKey: 'candidate',
        header: 'Candidate',
        size: 200,
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
              {cell.getValue()?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{cell.getValue()}</p>
              <p className="text-xs text-gray-500">{row.original.hr_name}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'pos_name',
        header: 'Position',
        size: 200,
        Cell: ({ cell }) => (
          <span className="font-medium text-gray-900">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-gray-700">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'mob',
        header: 'Phone',
        size: 130,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} />
            <span>{cell.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'current_ctc',
        header: 'Current CTC',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'exp_ctc',
        header: 'Expected CTC',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700 font-medium">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'curr_loc',
        header: 'Location',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} />
            <span>{cell.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'rel_exp',
        header: 'Experience',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-gray-700">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'notice_period',
        header: 'Notice Period',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'statusa',
        header: 'Status',
        size: 140,
        Cell: ({ cell }) => (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(cell.getValue())}`}>
            {cell.getValue()}
          </span>
        ),
        filterVariant: 'select',
        filterSelectOptions: [
          { text: 'Pending', value: 'pending' },
          { text: 'Shortlisted', value: 'shortlist' },
          { text: 'Interview', value: 'interview' },
          { text: 'Accepted', value: 'accept' },
          { text: 'Rejected', value: 'reject' },
        ],
      },
      {
        accessorKey: 'cv_data',
        header: 'CV',
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          cell.getValue() ? (
            <button
              onClick={() => window.open(cell.getValue(), "_blank")}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all font-medium text-sm"
            >
              <Eye size={16} />
              View
            </button>
          ) : (
            <span className="text-gray-400 text-sm">No CV</span>
          )
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: particle,
    
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
      pagination: { pageSize: 10, pageIndex: 0 },
      density: 'comfortable',
    },
    
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
        '& .Mui-TableHeadCell-Content': {
          justifyContent: 'space-between',
        },
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        '&:hover': {
          backgroundColor: '#eff6ff',
        },
        cursor: 'pointer',
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
          onClick={fetchCandidate}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-semibold"
        >
          <TrendingUp size={18} />
          Refresh
        </button>
        
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-xl transition-all font-semibold shadow-lg"
        >
          <Download size={18} />
          Export Excel
        </button>
      </Box>
    ),
    
    state: {
      isLoading: loading,
    },
  });

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        
        {/* Custom Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                My Candidates
              </h3>
              <p className="text-blue-100 text-sm">
                {particle.length} candidates submitted
              </p>
            </div>
          </div>
        </div>

        {/* Material React Table */}
        <MaterialReactTable table={table} />

      </div>
    </div>
  );
};

export default Ce_Candi;