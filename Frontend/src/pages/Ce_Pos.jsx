import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, TrendingUp, Eye } from 'lucide-react';
import { Box, Chip } from '@mui/material';
import { formatCommission } from '../lib/commission';

const Ce_Pos= () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchJobs();
  }, []);

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
        Cell: ({ cell, row }) => {
          const commission = cell.getValue();
          const colors = getCommissionColor(commission);
          return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} border-2 ${colors.border} font-bold`}>
              <BadgePercent size={16} />
              <span>{formatCommission(commission, row.original.commission_type)}</span>
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
    data: jobs,
    
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
    
    // Row click to view details
    // muiTableBodyRowProps: ({ row }) => ({
    //   onClick: () => navigate(`/dash_view/${row.original.pos_id}`),
    //   sx: {
    //     cursor: 'pointer',
    //     '&:hover': {
    //       backgroundColor: '#eff6ff',
    //     },
    //     transition: 'all 0.3s',
    //   },
    // }),
    
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
                {jobs.length} positions available
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

export default Ce_Pos;