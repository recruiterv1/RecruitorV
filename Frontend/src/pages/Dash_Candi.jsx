// import axios from 'axios';
// import React, { useState, useEffect, useMemo } from 'react';
// import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
// import { Users, Download, TrendingUp, Eye, Phone, Mail, MapPin, Calendar } from 'lucide-react';
// import { Box, IconButton, Tooltip } from '@mui/material';

// const Dash_Candi = () => {
//   const [particle, setParticle] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchCandidate = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("/addit/show/candi", { withCredentials: true });
//       setParticle(res.data);
//     } catch (err) {
//       console.error("Error fetching candidates:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCandidate();
//   }, []);

//   const formatDate = (datePosted) => {
//     if (!datePosted?._seconds) return "";
//     const postDate = new Date(datePosted._seconds * 1000);
//     const options = { day: "2-digit", month: "short", year: "numeric" };
//     return postDate.toLocaleDateString("en-GB", options);
//   };

//   const handleDownload = () => {
//     axios
//       .get('/download/bulkFile', { responseType: 'blob' })
//       .then((res) => {
//         const url = window.URL.createObjectURL(new Blob([res.data]));
//         const link = document.createElement("a");
//         link.href = url;
//         link.setAttribute("download", "candidate_data.xlsx");
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//       })
//       .catch((err) => console.log('Download the File:', err));
//   };

//   // Status badge color
//   const getStatusColor = (status) => {
//     const statusLower = status?.toLowerCase() || '';
//     if (statusLower.includes('accept') || statusLower.includes('selected') || statusLower.includes('joined')) {
//       return 'bg-green-100 text-green-700 border-green-200';
//     }
//     if (statusLower.includes('reject') || statusLower.includes('declined')) {
//       return 'bg-red-100 text-red-700 border-red-200';
//     }
//     if (statusLower.includes('interview') || statusLower.includes('shortlist')) {
//       return 'bg-blue-100 text-blue-700 border-blue-200';
//     }
//     if (statusLower.includes('pending') || statusLower.includes('review')) {
//       return 'bg-yellow-100 text-yellow-700 border-yellow-200';
//     }
//     return 'bg-gray-100 text-gray-700 border-gray-200';
//   };

//   // Define columns with Material React Table
//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: 'datePosted',
//         header: 'Submitted On',
//         size: 150,
//         Cell: ({ cell }) => (
//           <div className="flex items-center gap-2 text-gray-600">
//             <Calendar size={16} />
//             <span className="font-medium">{formatDate(cell.getValue())}</span>
//           </div>
//         ),
//         sortingFn: (rowA, rowB) => {
//           const dateA = rowA.original.datePosted?._seconds || 0;
//           const dateB = rowB.original.datePosted?._seconds || 0;
//           return dateA - dateB;
//         },
//       },
//       {
//         accessorKey: 'candidate',
//         header: 'Candidate',
//         size: 200,
//         Cell: ({ cell, row }) => (
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
//               {cell.getValue()?.charAt(0) || 'C'}
//             </div>
//             <div>
//               <p className="font-semibold text-gray-900">{cell.getValue()}</p>
//               <p className="text-xs text-gray-500">{row.original.hr_name}</p>
//             </div>
//           </div>
//         ),
//       },
//       {
//         accessorKey: 'pos_name',
//         header: 'Position',
//         size: 200,
//         Cell: ({ cell }) => (
//           <span className="font-medium text-gray-900">{cell.getValue()}</span>
//         ),
//       },
//       {
//         accessorKey: 'client',
//         header: 'Client',
//         size: 150,
//         Cell: ({ cell }) => (
//           <span className="text-gray-700">{cell.getValue()}</span>
//         ),
//       },
//       {
//         accessorKey: 'mob',
//         header: 'Phone',
//         size: 130,
//         Cell: ({ cell }) => (
//           <div className="flex items-center gap-2 text-gray-600">
//             <Phone size={14} />
//             <span>{cell.getValue()}</span>
//           </div>
//         ),
//       },
//       {
//         accessorKey: 'current_ctc',
//         header: 'Current CTC',
//         size: 130,
//         Cell: ({ cell }) => (
//           <span className="text-gray-700">{cell.getValue()}</span>
//         ),
//       },
//       {
//         accessorKey: 'exp_ctc',
//         header: 'Expected CTC',
//         size: 130,
//         Cell: ({ cell }) => (
//           <span className="text-gray-700 font-medium">{cell.getValue()}</span>
//         ),
//       },
//       {
//         accessorKey: 'curr_loc',
//         header: 'Location',
//         size: 150,
//         Cell: ({ cell }) => (
//           <div className="flex items-center gap-2 text-gray-600">
//             <MapPin size={14} />
//             <span>{cell.getValue()}</span>
//           </div>
//         ),
//       },
//       {
//         accessorKey: 'rel_exp',
//         header: 'Experience',
//         size: 120,
//         Cell: ({ cell }) => (
//           <span className="text-gray-700">{cell.getValue()}</span>
//         ),
//       },
//       {
//         accessorKey: 'notice_period',
//         header: 'Notice Period',
//         size: 130,
//         Cell: ({ cell }) => (
//           <span className="text-gray-700">{cell.getValue()}</span>
//         ),
//       },
//       {
//         accessorKey: 'statusa',
//         header: 'Status',
//         size: 140,
//         Cell: ({ cell }) => (
//           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(cell.getValue())}`}>
//             {cell.getValue()}
//           </span>
//         ),
//         filterVariant: 'select',
//         filterSelectOptions: [
//           { text: 'Pending', value: 'pending' },
//           { text: 'Shortlisted', value: 'shortlist' },
//           { text: 'Interview', value: 'interview' },
//           { text: 'Accepted', value: 'accept' },
//           { text: 'Rejected', value: 'reject' },
//         ],
//       },
//       {
//         accessorKey: 'cv_data',
//         header: 'CV',
//         size: 100,
//         enableSorting: false,
//         enableColumnFilter: false,
//         Cell: ({ cell }) => (
//           cell.getValue() ? (
//             <button
//               onClick={() => window.open(cell.getValue(), "_blank")}
//               className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all font-medium text-sm"
//             >
//               <Eye size={16} />
//               View
//             </button>
//           ) : (
//             <span className="text-gray-400 text-sm">No CV</span>
//           )
//         ),
//       },
//     ],
//     []
//   );

//   const table = useMaterialReactTable({
//     columns,
//     data: particle,
    
//     // Enable all features
//     enableColumnOrdering: true,
//     enableColumnResizing: true,
//     enableColumnFilters: true,
//     enableSorting: true,
//     enablePagination: true,
//     enableRowSelection: true,
//     enableDensityToggle: true,
//     enableFullScreenToggle: true,
//     enableGlobalFilter: true,
//     enableHiding: true,
//     enablePinning: true,
    
//     // Pagination
//     initialState: {
//       pagination: { pageSize: 10, pageIndex: 0 },
//       density: 'comfortable',
//     },
    
//     // Styling to match your theme
//     muiTableProps: {
//       sx: {
//         '& .MuiTableCell-root': {
//           borderBottom: '1px solid #e5e7eb',
//         },
//       },
//     },
//     muiTableHeadCellProps: {
//       sx: {
//         background: 'linear-gradient(to right, #eff6ff, #fff7ed)',
//         borderBottom: '2px solid #bfdbfe',
//         fontWeight: '600',
//         color: '#1f2937',
//         '& .Mui-TableHeadCell-Content': {
//           justifyContent: 'space-between',
//         },
//       },
//     },
//     muiTableBodyRowProps: ({ row }) => ({
//       sx: {
//         '&:hover': {
//           backgroundColor: '#eff6ff',
//         },
//         cursor: 'pointer',
//         transition: 'all 0.3s',
//       },
//     }),
//     muiTablePaperProps: {
//       sx: {
//         boxShadow: 'none',
//         border: 'none',
//       },
//     },
//     muiTopToolbarProps: {
//       sx: {
//         background: 'linear-gradient(to right, #2563eb, #f97316)',
//         '& .MuiBox-root': {
//           color: 'white',
//         },
//         '& .MuiIconButton-root': {
//           color: 'white',
//         },
//         '& .MuiInputBase-root': {
//           color: 'white',
//           '&::before': {
//             borderBottomColor: 'rgba(255,255,255,0.5)',
//           },
//         },
//       },
//     },
    
//     // Custom top toolbar actions
//     renderTopToolbarCustomActions: () => (
//       <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//         <button
//           onClick={fetchCandidate}
//           className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-semibold"
//         >
//           <TrendingUp size={18} />
//           Refresh
//         </button>
        
//         <button
//           onClick={handleDownload}
//           className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-xl transition-all font-semibold shadow-lg"
//         >
//           <Download size={18} />
//           Export Excel
//         </button>
//       </Box>
//     ),
    
//     state: {
//       isLoading: loading,
//     },
//   });

//   return (
//     <div className="w-full py-6">
//       <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        
//         {/* Custom Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
//           <div className="flex items-center gap-3">
//             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
//               <Users size={28} className="text-white" />
//             </div>
//             <div>
//               <h3 className="text-2xl font-bold text-white">
//                 My Candidates
//               </h3>
//               <p className="text-blue-100 text-sm">
//                 {particle.length} candidates submitted
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Material React Table */}
//         <MaterialReactTable table={table} />

//       </div>
//     </div>
//   );
// };

// export default Dash_Candi;

import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Users, Download, TrendingUp, Eye, Phone, Mail, MapPin, Calendar, Filter, X, RotateCcw } from 'lucide-react';
import { Box, IconButton, Tooltip } from '@mui/material';

const Dash_Candi = () => {
  const [particle, setParticle] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    date: null,
    position: '',
    client: '',
    location: '',
    status: 'active' // Default to 'active'
  });

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/addit/show/candi", { withCredentials: true });
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

  // Get unique values for dropdowns
  const getUniqueValues = (field) => {
    const values = particle.map(item => item[field]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    return particle.filter(candidate => {
      // Date filter - filter by specific date
      if (filters.date) {
        const candidateDate = new Date(candidate.datePosted?._seconds * 1000);
        const filterDate = new Date(filters.date);
        // Compare dates (ignoring time)
        return candidateDate.toDateString() === filterDate.toDateString();
      }

      // Position filter
      if (filters.position && candidate.pos_name !== filters.position) {
        return false;
      }

      // Client filter
      if (filters.client && candidate.client !== filters.client) {
        return false;
      }

      // Location filter
      if (filters.location && candidate.curr_loc !== filters.location) {
        return false;
      }

      // Status filter
      if (filters.status === 'active') {
        // Active: Exclude all statuses containing "reject"
        if (candidate.statusa?.toLowerCase().includes('reject')) {
          return false;
        }
      } else if (filters.status === 'reject') {
        // Reject: Include only statuses containing "reject"
        if (!candidate.statusa?.toLowerCase().includes('reject')) {
          return false;
        }
      }
      // 'all' shows everything

      return true;
    });
  }, [particle, filters]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      date: null,
      position: '',
      client: '',
      location: '',
      status: 'active'
    });
    setSearchTerms({
      position: '',
      client: '',
      location: ''
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
    data: filteredData,
    
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
                {filteredData.length} of {particle.length} candidates shown
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-800">Filters</h4>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-medium text-sm"
            >
              <RotateCcw size={16} />
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Date Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Date</label>
              <input
                type="date"
                value={filters.date ? filters.date.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('date', e.target.value ? new Date(e.target.value) : null)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select date"
              />
            </div>

            {/* Position Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Position</label>
              <select
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-h-100 overflow-y-auto"
              >
                <option value="">All Positions</option>
                {getUniqueValues('pos_name').map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Client Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Client</label>
              <select
                value={filters.client}
                onChange={(e) => handleFilterChange('client', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-h-100 overflow-y-auto"
              >
                <option value="">All Clients</option>
                {getUniqueValues('client').map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-h-100 overflow-y-auto"
              >
                <option value="">All Locations</option>
                {getUniqueValues('curr_loc').map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Show All</option>
                <option value="active">Active (No Reject)</option>
                <option value="reject">Reject (All)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.date || filters.position || filters.client || filters.location || filters.status !== 'active') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {filters.date && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Date: {filters.date.toLocaleDateString()}
                    <button onClick={() => handleFilterChange('date', null)}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.position && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Position: {filters.position}
                    <button onClick={() => handleFilterChange('position', '')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.client && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    Client: {filters.client}
                    <button onClick={() => handleFilterChange('client', '')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    Location: {filters.location}
                    <button onClick={() => handleFilterChange('location', '')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.status !== 'active' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    Status: {filters.status === 'all' ? 'Show All' : 'Reject'}
                    <button onClick={() => handleFilterChange('status', 'active')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Material React Table */}
        <MaterialReactTable table={table} />

      </div>
    </div>
  );
};

export default Dash_Candi;