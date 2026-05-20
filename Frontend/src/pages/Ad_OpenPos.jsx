import axios from 'axios';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, TrendingUp, Edit, X, Download, FileSpreadsheet, Hash, Trash2, Copy } from 'lucide-react';
import { Box } from '@mui/material';
import { indiaStatesAndCities } from "./Ad_Pos";
import * as XLSX from 'xlsx';
import { UserStateContext } from '../context/AuthPro';

const Ad_OpenPos = () => {
  const [jobs, setJobs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/candidate/pos/show");
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching positions:', err);
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

  const getCommissionColor = (commission) => {
    if (commission >= 10) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (commission >= 5) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  };

  // Smart download based on current table arrangement, sorting, and selection
  const handleSmartDownload = (table, type = 'all') => {
    try {
      const visibleColumns = table.getVisibleLeafColumns();
      const allRows = table.getSortedRowModel().rows;
      const selectedRows = table.getSelectedRowModel().rows;
      
      const rowsToExport = type === 'selected' ? selectedRows : allRows;
      
      if (type === 'selected' && rowsToExport.length === 0) {
        alert('Please select positions to download');
        return;
      }
      
      const exportData = rowsToExport.map((row, index) => {
        const rowData = {};
        
        visibleColumns.forEach(column => {
          const columnId = column.id;
          
          if (columnId === 'mrt-row-select' || columnId === 'mrt-row-actions') return;
          
          if (columnId === 'serialNumber') {
            rowData['S.No.'] = index + 1;
            return;
          }
          
          let value = row.getValue(columnId);
          
          if (columnId === 'pos_id') {
            rowData['Position ID'] = value;
          } else if (columnId === 'position') {
            rowData['Position'] = value;
            rowData['Category'] = row.original.pos_cat || '';
          } else if (columnId === 'client') {
            rowData['Client'] = value || 'Confidential';
          } else if (columnId === 'hr_name') {
            rowData['HR Name'] = value;
          } else if (columnId === 'location') {
            rowData['Location'] = Array.isArray(value) ? value.join(", ") : value;
          } else if (columnId === 'experience') {
            rowData['Experience'] = value;
          } else if (columnId === 'ctcStart') {
            const ctcEnd = row.original.ctcEnd;
            rowData['CTC Start'] = Number(value || 0).toLocaleString('en-IN');
            rowData['CTC End'] = Number(ctcEnd || 0).toLocaleString('en-IN');
            rowData['CTC Range'] = `₹${Number(value || 0).toLocaleString('en-IN')} - ₹${Number(ctcEnd || 0).toLocaleString('en-IN')}`;
          } else if (columnId === 'commison') {
            const ctcStart = row.original.ctcStart;
            const commissionAmount = ctcStart ? ((Number(ctcStart) * Number(value)) / 100) : 0;
            rowData['Commission %'] = `${value}%`;
            rowData['Commission Amount'] = `₹${Number(commissionAmount).toLocaleString('en-IN')}`;
          } else if (columnId === 'datePosted') {
            rowData['Posted On'] = formatDate(value);
          }
        });
        
        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Positions");
      
      const filename = type === 'selected' 
        ? `Selected_Positions_${new Date().toLocaleDateString()}.xlsx`
        : `Open_Positions_${new Date().toLocaleDateString()}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download file');
    }
  };

  const handleDownloadCSV = (table) => {
    try {
      const visibleColumns = table.getVisibleLeafColumns();
      const sortedRows = table.getSortedRowModel().rows;
      
      const exportData = sortedRows.map((row, index) => {
        const rowData = {};
        
        visibleColumns.forEach(column => {
          const columnId = column.id;
          if (columnId === 'mrt-row-select' || columnId === 'mrt-row-actions') return;
          
          if (columnId === 'serialNumber') {
            rowData['S.No.'] = index + 1;
            return;
          }
          
          let value = row.getValue(columnId);
          
          if (columnId === 'pos_id') {
            rowData['Position ID'] = value;
          } else if (columnId === 'position') {
            rowData['Position'] = value;
            rowData['Category'] = row.original.pos_cat || '';
          } else if (columnId === 'client') {
            rowData['Client'] = value || 'Confidential';
          } else if (columnId === 'hr_name') {
            rowData['HR Name'] = value;
          } else if (columnId === 'location') {
            rowData['Location'] = Array.isArray(value) ? value.join("; ") : value;
          } else if (columnId === 'experience') {
            rowData['Experience'] = value;
          } else if (columnId === 'ctcStart') {
            const ctcEnd = row.original.ctcEnd;
            rowData['CTC Range'] = `${Number(value || 0).toLocaleString('en-IN')} - ${Number(ctcEnd || 0).toLocaleString('en-IN')}`;
          } else if (columnId === 'commison') {
            const ctcStart = row.original.ctcStart;
            const commissionAmount = ctcStart ? ((Number(ctcStart) * Number(value)) / 100) : 0;
            rowData['Commission'] = `${value}% (₹${Number(commissionAmount).toLocaleString('en-IN')})`;
          } else if (columnId === 'datePosted') {
            rowData['Posted On'] = formatDate(value);
          }
        });
        
        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Open_Positions_${new Date().toLocaleDateString()}.csv`;
      link.click();
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV file');
    }
  };

  const columns = useMemo(
    () => [
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
        accessorKey: 'pos_id',
        header: 'Position ID',
        size: 110,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {cell.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'position',
        header: 'Position',
        size: 200,
        Cell: ({ cell, row }) => (
          <div>
            <p className="font-bold text-gray-900 text-xs sm:text-sm">{cell.getValue()}</p>
            <p className="text-xs text-gray-500">{row.original.pos_cat}</p>
          </div>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-medium text-gray-700 text-xs sm:text-sm">
            {cell.getValue() || 'Confidential'}
          </span>
        ),
      },
      {
        accessorKey: 'hr_name',
        header: 'HR Name',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-xs sm:text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 170,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
            <MapPin size={14} className="text-blue-500 flex-shrink-0" />
            <span className="truncate text-xs sm:text-sm">
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
        size: 110,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-xs sm:text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'ctcStart',
        header: 'CTC Range',
        size: 140,
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-1 text-gray-700">
            <IndianRupee size={12} className="text-green-600 flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm">
              {Number(cell.getValue() || 0).toLocaleString('en-IN')} - {Number(row.original.ctcEnd || 0).toLocaleString('en-IN')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'commison',
        header: 'Commission',
        size: 130,
        Cell: ({ cell, row }) => {
          const commission = cell.getValue();
          const colors = getCommissionColor(commission);
          const ctcStart = row.original.ctcStart;
          const commissionAmount = ctcStart ? ((Number(ctcStart) * Number(commission)) / 100) : 0;
          
          return (
            <div>
              <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-full ${colors.bg} ${colors.text} border-2 ${colors.border} font-bold text-xs`}>
                <BadgePercent size={12} />
                <span>{commission}%</span>
              </div>
              {ctcStart && (
                <p className="text-xs text-gray-500 mt-1">
                  ₹{commissionAmount.toLocaleString('en-IN')}
                </p>
              )}
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
        size: 120,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
            <Calendar size={12} className="text-orange-500 flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{formatDate(cell.getValue())}</span>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.datePosted?._seconds || 0;
          const dateB = rowB.original.datePosted?._seconds || 0;
          return dateA - dateB;
        },
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: jobs,
    
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
    
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      density: 'compact',
      sorting: [{ id: 'datePosted', desc: true }],
      columnPinning: { left: ['mrt-row-select', 'serialNumber'] },
    },
    
    // Responsive table props
    muiTableContainerProps: {
      sx: {
        maxHeight: 'calc(100vh - 300px)',
        minHeight: '400px',
      },
    },
    
    muiTableProps: {
      sx: {
        '& .MuiTableCell-root': {
          borderBottom: '1px solid #e5e7eb',
          padding: '8px 12px',
          '@media (max-width: 768px)': {
            padding: '6px 8px',
            fontSize: '0.75rem',
          },
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
        '@media (max-width: 768px)': {
          padding: '8px',
          fontSize: '0.75rem',
        },
      },
    },
    
    muiTableBodyRowProps: {
      sx: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#eff6ff',
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
        '@media (max-width: 768px)': {
          padding: '8px',
        },
        '& .MuiBox-root': {
          color: 'white',
        },
        '& .MuiIconButton-root': {
          color: 'white',
          padding: '8px',
        },
        '& .MuiInputBase-root': {
          color: 'white',
          fontSize: '0.875rem',
          '&::before': {
            borderBottomColor: 'rgba(255,255,255,0.5)',
          },
        },
      },
    },
    
    muiBottomToolbarProps: {
      sx: {
        '@media (max-width: 768px)': {
          flexDirection: 'column',
          gap: '8px',
          '& .MuiTablePagination-root': {
            overflow: 'visible',
          },
          '& .MuiTablePagination-selectLabel': {
            marginBottom: 0,
          },
        },
      },
    },
    
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: '4px', sm: '8px' }, 
        alignItems: 'center', 
        flexWrap: 'wrap',
        width: '100%',
      }}>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg sm:rounded-xl transition-all font-semibold text-xs sm:text-sm"
        >
          <TrendingUp size={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        
        <button
          onClick={() => handleSmartDownload(table, 'all')}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-green-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all font-semibold shadow-lg text-xs sm:text-sm"
          title="Download all positions"
        >
          <FileSpreadsheet size={16} />
          <span className="hidden sm:inline">Excel</span>
          <span className="sm:hidden">XLS</span>
        </button>

        <button
          onClick={() => handleDownloadCSV(table)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all font-semibold shadow-lg text-xs sm:text-sm"
          title="Download as CSV"
        >
          <Download size={16} />
          <span className="hidden sm:inline">CSV</span>
        </button>

        <button
          onClick={() => handleSmartDownload(table, 'selected')}
          disabled={table.getSelectedRowModel().rows.length === 0}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg sm:rounded-xl transition-all font-semibold shadow-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download selected rows"
        >
          <Download size={16} />
          <span className="hidden md:inline">Selected</span>
          <span className="font-bold">({table.getSelectedRowModel().rows.length})</span>
        </button>
      </Box>
    ),
    
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '4px', minWidth: '80px', justifyContent: 'center' }}>
        <span className="text-xs text-gray-500 italic">Use My Positions</span>
      </Box>
    ),
    displayColumnDefOptions: {
      'mrt-row-actions': {
        size: 100,
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
    
    state: {
      isLoading: loading,
    },
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Briefcase size={20} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    All Positions
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    {jobs.length} positions • Smart export
                  </p>
                </div>
              </div>

              {/* Quick Stats - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-blue-100">High Commission</p>
                  <p className="text-lg font-bold text-white">
                    {jobs.filter(j => j.commison >= 10).length}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-blue-100">This Week</p>
                  <p className="text-lg font-bold text-white">
                    {jobs.filter(j => {
                      const weekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
                      return (j.datePosted?._seconds || 0) > weekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-b-2 border-blue-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Hash size={16} className="text-blue-600 flex-shrink-0" />
              <p className="text-blue-800">
                <span className="font-semibold">Smart Export:</span> 
                <span className="hidden sm:inline"> Serial numbers • Current column order • Current sorting • Selected rows</span>
                <span className="sm:hidden"> Respects order & sorting</span>
              </p>
            </div>
          </div>

          {/* Material React Table */}
          <div className="p-2 sm:p-3 lg:p-4">
            <MaterialReactTable table={table} />
          </div>

        </div>
      </div>

      {isOpen && (
        <EditJobModal
          job={selectedJob}
          onClose={() => setIsOpen(false)}
          onUpdate={fetchJobs}
        />
      )}
    </div>
  );
};

// Edit Modal Component with Responsive Design
export const EditJobModal = ({ job, onClose, onUpdate }) => {
  if (!job) return null;

  const { user } = useContext(UserStateContext);
  const [submit, setSubmit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    id: job.id,
    pos_id: job.pos_id || "",
    position: job.position || "",
    hr_name: job.hr_name || "",
    state: job.state || [],
    client: job.client || "",
    clientspoc: job.clientspoc || "",  // Add clientspoc field
    ctcStart: job.ctcStart || "",
    ctcEnd: job.ctcEnd || "",
    location: job.location || [],
    job_desc: job.job_desc || "",
    commison: job.commison || "",
    experience: job.experience || "",
    pos_cat: job.pos_cat || "",
    comp_view: job.comp_view || "",
    m_have: job.m_have || "",
    g_have: job.g_have || "",
    compet: job.compet || "",
    key_res: job.key_res || ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submit) return;

    try {
      setSubmit(true);
      const payload = {
        ...form,
        pos_id: undefined,
        client: undefined,
        position: undefined
      };
      await axios.put(`/candidate/pos/update/${form.id}`, payload);
      alert("Position updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed!");
    } finally {
      setSubmit(false);
    }
  };

  const handleDelete = async () => {
    // Confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this position?\n\n` +
      `Position: ${form.position}\n` +
      `Position ID: ${form.pos_id}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      const res = await axios.delete(`/candidate/pos/delete/${form.id}`, {
        withCredentials: true
      });
      
      if (res.data.success) {
        alert("Position deleted successfully!");
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 403) {
        alert(err.response.data.message || "You don't have permission to delete this position.");
      } else if (err.response?.status === 404) {
        alert("Position not found.");
      } else {
        alert("Failed to delete position. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = () => {
    // Prepare data for copying (exclude id and pos_id)
    const copiedPosition = {
      position: form.position,
      hr_name: form.hr_name,
      client: form.client,
      ctcStart: form.ctcStart,
      ctcEnd: form.ctcEnd,
      location: form.location,
      job_desc: form.job_desc,
      commison: form.commison,
      experience: form.experience,
      pos_cat: form.pos_cat,
      comp_view: form.comp_view,
      m_have: form.m_have,
      g_have: form.g_have,
      compet: form.compet,
      key_res: form.key_res
    };

    // Store copied data in sessionStorage for the Add Position tab
    sessionStorage.setItem('copiedPosition', JSON.stringify(copiedPosition));
    
    // Close modal and trigger parent to switch to add-position tab
    onClose();
    
    // Dispatch custom event to notify Admin component to switch tabs
    window.dispatchEvent(new CustomEvent('switchToAddPosition', { 
      detail: { copiedPosition } 
    }));
  };

  // Check if current user can delete this position
  const getUserFirstName = () => {
    if (!user) return "";
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(' ')[0];
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    return "";
  };

  const canDelete = () => {
    // Check if user is admin or creator
    const userFirstName = getUserFirstName();
    const positionCreator = form.clientspoc || job.clientspoc || "";
    
    console.log("Delete permission check:", {
      userFirstName,
      positionCreator,
      userRole: user?.role,
      userRoleCategory: user?.roleCategory,
      match: positionCreator === userFirstName
    });
    
    const isCreator = positionCreator === userFirstName;
    const isAdmin = user?.role === 'admin' || user?.roleCategory === 'Admin';
    
    return isCreator || isAdmin;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto flex justify-center items-start p-2 sm:p-4 lg:py-8">
      <div className="bg-white w-full max-w-6xl rounded-xl sm:rounded-2xl shadow-2xl my-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-orange-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg">
              <Edit size={16} className="sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">Edit Position</h2>
              <p className="text-xs sm:text-sm text-gray-600">{form.position} (ID: {form.pos_id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            <Input label="Position Name" name="position" value={form.position} disabled />
            <Input label="Position ID" name="pos_id" value={form.pos_id} disabled />
            <Input label="HR Name" name="hr_name" value={form.hr_name} onChange={handleChange} />
            <Input label="Client" name="client" value={form.client} disabled />
            <Input label="Key Responsibilities" name="key_res" value={form.key_res} onChange={handleChange} />
            <Input label="Must Have" name="m_have" value={form.m_have} onChange={handleChange} />
            <Input label="Good To Have" name="g_have" value={form.g_have} onChange={handleChange} />
            <Input label="Competencies" name="compet" value={form.compet} onChange={handleChange} />
            <Input label="Experience" name="experience" value={form.experience} onChange={handleChange} />
            <Input label="Commission (%)" name="commison" value={form.commison} onChange={handleChange} />

            <MultiSelect
              label="State"
              name="state"
              value={form.state}
              options={Object.keys(indiaStatesAndCities)}
              onChange={(states) => setForm({ ...form, state: states, location: [] })}
            />

            <MultiSelect
              label="City"
              name="location"
              value={form.location}
              options={form.state.flatMap(state => indiaStatesAndCities[state] || [])}
              onChange={(cities) => setForm({ ...form, location: cities })}
            />

            <Textarea label="Company Overview" name="comp_view" value={form.comp_view} onChange={handleChange} />
            <Textarea label="Job Summary" name="job_desc" value={form.job_desc} onChange={handleChange} />

            <Select
              label="Position Category"
              name="pos_cat"
              value={form.pos_cat}
              options={["Immediate Hiring", "Interview Drives", "Fast Response", "High Commission", "New"]}
              onChange={handleChange}
            />

            <Input label="CTC Start" name="ctcStart" value={form.ctcStart} onChange={handleChange} />
            <Input label="CTC End" name="ctcEnd" value={form.ctcEnd} onChange={handleChange} />

          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200">
            
            {/* Left side - Delete and Copy buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-2 sm:order-1">
              {canDelete() && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  title="Delete this position (only creator or admin)"
                >
                  <Trash2 size={18} />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
              
              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                title="Create a copy of this position"
              >
                <Copy size={18} />
                Copy Position
              </button>
            </div>

            {/* Right side - Cancel and Update buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submit}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 text-sm sm:text-base"
              >
                {submit ? "Updating..." : "Update Position"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <input 
      {...props} 
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-white disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" 
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="col-span-1 sm:col-span-2">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 block">{label}</label>
    <textarea 
      {...props} 
      rows={3} 
      className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" 
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <select 
      {...props} 
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    >
      <option value="">Select</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const MultiSelect = ({ label, options, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <select
      multiple
      value={value}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions, o => o.value))}
      className="h-24 sm:h-32 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default Ad_OpenPos;