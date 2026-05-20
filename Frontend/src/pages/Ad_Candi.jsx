import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Users, Download, TrendingUp, Eye, Calendar, MapPin, Phone, Mail, Award, Send, Filter, X, FileSpreadsheet } from 'lucide-react';
import { Box, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, Autocomplete, Chip } from '@mui/material';
import * as XLSX from 'xlsx';

const Ad_Candi = () => {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    recruiterName: [],
    clientName: [],
    status: [],
    hrName: []
  });

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    notifyRecruiter: false,
    notifyHR: false
  });

  const statusOptions = [
    'Screen Reject',
    'CV Feedback Pending',
    'Submitted',
    'L1 To be Schedule',
    'L1 Scheduled',
    'L1 Feedback Pending',
    'L1 Reject',
    'L2 To be Schedule',
    'L2 Scheduled',
    'L2 Feedback Pending',
    'L2 Reject',
    'L3 To be Schedule',
    'L3 Scheduled',
    'L3 Feedback Pending',
    'L3 Reject',
    'HR To be Schedule',
    'HR Scheduled',
    'HR Feedback Pending',
    'HR Reject',
    'Background Verification Pending',
    'Background Verification Reject',
    'Negotiation Scheduled',
    'Negotiation Reject',
    'To Be Offered',
    'Offer Declined',
    'Offer Accepted',
    'Joining',
    // NEW status options
    'Test Assigned',
    'Test Select',
    'Test Reject',
    'Client Drop',
    'Candidate Drop',
    'Duplicate'
  ];

  const updateStatus = async (id, statusa) => {
    try {
      await axios.patch(`/addit/update/status/${id}`, { statusa });
      setAll(prev =>
        prev.map(item =>
          item.id === id ? { ...item, statusa } : item
        )
      );
      
      // Optionally send auto-notification email on status change
      const candidate = all.find(item => item.id === id);
      if (candidate && candidate.email) {
        // You can uncomment this to auto-send emails on status change
        // sendStatusUpdateEmail(candidate, statusa);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/addit/show/all/candi");
      setAll(res.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  // Get unique values for filter dropdowns
  const uniqueRecruiters = useMemo(() => {
    return [...new Set(all.map(c => c.recName).filter(Boolean))].sort();
  }, [all]);

  const uniqueClients = useMemo(() => {
    return [...new Set(all.map(c => c.client).filter(Boolean))].sort();
  }, [all]);

  const uniqueHRNames = useMemo(() => {
    return [...new Set(all.map(c => c.hr_name).filter(Boolean))].sort();
  }, [all]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    let filtered = [...all];

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => {
        if (!item.datePosted?._seconds) return false;
        const itemDate = new Date(item.datePosted._seconds * 1000);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        if (!item.datePosted?._seconds) return false;
        const itemDate = new Date(item.datePosted._seconds * 1000);
        return itemDate <= toDate;
      });
    }

    // Recruiter filter
    if (filters.recruiterName.length > 0) {
      filtered = filtered.filter(item => 
        filters.recruiterName.includes(item.recName)
      );
    }

    // Client filter
    if (filters.clientName.length > 0) {
      filtered = filtered.filter(item => 
        filters.clientName.includes(item.client)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(item => 
        filters.status.includes(item.statusa)
      );
    }

    // HR Name filter
    if (filters.hrName.length > 0) {
      filtered = filtered.filter(item => 
        filters.hrName.includes(item.hr_name)
      );
    }

    return filtered;
  }, [all, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      recruiterName: [],
      clientName: [],
      status: [],
      hrName: []
    });
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return filters.dateFrom || filters.dateTo || 
           filters.recruiterName.length > 0 || 
           filters.clientName.length > 0 || 
           filters.status.length > 0 || 
           filters.hrName.length > 0;
  }, [filters]);

  // Enhanced Excel Export with filters
  const handleDownloadExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredData.map(item => ({
        'Submitted Date': formatDate(item.datePosted),
        'Candidate Name': item.candidate || 'N/A',
        'Email': item.email || 'N/A',
        'Phone': item.mob || 'N/A',
        'Recruiter Name': item.recName || 'N/A',
        'Position': item.pos_name || 'N/A',
        'Client': item.client || 'N/A',
        'HR Name': item.hr_name || 'N/A',
        'Current CTC': item.current_ctc || 'N/A',
        'Expected CTC': item.exp_ctc || 'N/A',
        'Current Location': item.curr_loc || 'N/A',
        'Preferred Location': item.pref_loc || 'N/A',
        'Experience': item.rel_exp || 'N/A',
        'Offer in Hand': item.offer_hand || 'N/A',
        'Offer & DOJ': item.offer_amt || 'N/A',
        'Status': item.statusa || 'N/A'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Submitted Date
        { wch: 20 }, // Candidate Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Recruiter Name
        { wch: 25 }, // Position
        { wch: 20 }, // Client
        { wch: 20 }, // HR Name
        { wch: 12 }, // Current CTC
        { wch: 12 }, // Expected CTC
        { wch: 18 }, // Current Location
        { wch: 18 }, // Preferred Location
        { wch: 12 }, // Experience
        { wch: 15 }, // Offer in Hand
        { wch: 15 }, // Offer & DOJ
        { wch: 20 }  // Status
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `Candidates_${date}${hasActiveFilters ? '_Filtered' : ''}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Email Functions
  const openEmailDialog = (candidate, emailType = 'custom') => {
    setSelectedCandidate(candidate);
    
    let subject = '';
    let message = '';
    
    if (emailType === 'status') {
      subject = `Status Update for ${candidate.pos_name} of ${candidate.candidate} on ${candidate.client}`;
      message = `Dear ${candidate.recName},\n\nYour Applicant ${candidate.candidate} status for ${candidate.pos_name} at ${candidate.client} has been updated to: ${candidate.statusa}\n\nBest regards,\nRecruitment Team`;
    } else if (emailType === 'schedule') {
      subject = `Interview Schedule for ${candidate.pos_name} of ${candidate.candidate} on ${candidate.client}`;
      message = `Dear ${candidate.recName},\n\nYour Applicant ${candidate.candidate} interview schedule for the ${candidate.pos_name} position at ${candidate.client}.\n\nPlease check your availability.\n\nBest regards,\nRecruitment Team`;
    } else {
      subject = `${candidate.pos_name} | ${candidate.candidate} | ${candidate.client}`;
      message = `Dear ${candidate.recName},\n\n`;
    }
    
    setEmailData({
      to: candidate.recEmail || '',
      subject: subject,
      message: message,
      notifyRecruiter: false,
      notifyHR: false
    });
    
    setEmailDialogOpen(true);
  };

  const sendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.message) {
      alert('Please fill in all email fields');
      return;
    }

    try {
      const emailPayload = {
        to: selectedCandidate.recEmail,
        subject: emailData.subject,
        message: emailData.message,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.candidate,
        position: selectedCandidate.pos_name,
        client: selectedCandidate.client,
        recName: selectedCandidate.recName,
        ccRecruiter: emailData.notifyRecruiter ? selectedCandidate.recEmail : null,
        ccHR: emailData.notifyHR ? selectedCandidate.hrEmail : null
      };

      // Replace with your actual email API endpoint
      await axios.post('/addit/send/email', emailPayload);
      
      alert('Email sent successfully!');
      setEmailDialogOpen(false);
      resetEmailDialog();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const sendStatusUpdateEmail = async (candidate, newStatus) => {
    if (!candidate.recEmail) return;
    
    try {
      await axios.post('/addit/send/email', {
        to: candidate.recEmail,
        subject: `Status Update - ${candidate.pos_name}`,
        message: `Dear ${candidate.recName} Your Candidate ${candidate.candidate},\n\n Application status has been updated to: ${newStatus}\n\nBest regards,\nRecruitment Team`,
        candidateId: candidate.id
      });
    } catch (error) {
      console.error('Error sending status update email:', error);
    }
  };

  const resetEmailDialog = () => {
    setSelectedCandidate(null);
    setEmailData({
      to: '',
      subject: '',
      message: '',
      notifyRecruiter: false,
      notifyHR: false
    });
  };

  // Status color coding
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('accept') || statusLower.includes('joining')) {
      return 'bg-green-100 text-green-700 border-green-300';
    }
    if (statusLower.includes('reject') || statusLower.includes('decline')) {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    if (statusLower.includes('schedule') || statusLower.includes('pending')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
    if (statusLower.includes('submitted') || statusLower.includes('l1') || statusLower.includes('l2') || statusLower.includes('l3') || statusLower.includes('hr')) {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    }
    if (statusLower.includes('offered') || statusLower.includes('negotiation')) {
      return 'bg-purple-100 text-purple-700 border-purple-300';
    }
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const columns = useMemo(() => [
      {
        accessorKey: 'datePosted',
        header: 'Submitted On',
        size: 130,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} className="text-orange-500" />
            <span className="font-medium text-sm">{formatDate(cell.getValue())}</span>
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
        size: 180,
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {cell.getValue()?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{cell.getValue()}</p>
              {row.original.email && (
                <p className="text-xs text-gray-500">{row.original.email}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'recName',
        header: 'Recruiter',
        size: 180,
        Cell: ({ cell, row }) => (
          <span className="font-medium text-gray-900 text-sm">{row.original.recName}</span>
        ),
      },
      
      {
        accessorKey: 'pos_name',
        header: 'Position',
        size: 180,
        Cell: ({ cell }) => (
          <span className="font-medium text-gray-900 text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'hr_name',
        header: 'HR Name',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'current_ctc',
        header: 'Current CTC',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm font-medium">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'exp_ctc',
        header: 'Expected CTC',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm font-medium">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'curr_loc',
        header: 'Current Location',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} className="text-blue-500" />
            <span className="text-sm">{cell.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'pref_loc',
        header: 'Preferred Location',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} className="text-orange-500" />
            <span className="text-sm">{cell.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'rel_exp',
        header: 'Experience',
        size: 110,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'offer_hand',
        header: 'Offer in Hand',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'offer_amt',
        header: 'Offer & DOJ',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-gray-700 text-sm">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'statusa',
        header: 'Status',
        size: 180,
        Cell: ({ cell, row }) => (
          <select
            className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${getStatusColor(cell.getValue())}`}
            value={cell.getValue() || 'Applied'}
            onChange={(e) => {
              e.stopPropagation();
              updateStatus(row.original.id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option disabled>Select Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ),
        filterVariant: 'select',
        filterSelectOptions: statusOptions.map(s => ({ text: s, value: s })),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        size: 150,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.cv_data && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(row.original.cv_data, "_blank");
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all font-medium text-xs"
              >
                <Eye size={14} />
                CV
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEmailDialog(row.original, 'custom');
              }}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all font-medium text-xs"
              title="Send Email"
            >
              <Mail size={14} />
              Email
            </button>
          </div>
        ),
      },
    ],
    [statusOptions, filteredData]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredData,

    
    // Enable features
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
      // pagination: { pageSize: 15, pageIndex: 0 },
      density: 'comfortable',
      sorting: [{ id: 'datePosted', desc: true }],
    },
    
    // Styling
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
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#eff6ff',
        },
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
    
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={fetchCandidates}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-semibold"
        >
          <TrendingUp size={18} />
          Refresh
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-lg ${
            showFilters || hasActiveFilters
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-white text-blue-600 hover:bg-gray-100'
          }`}
        >
          <Filter size={18} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-white text-orange-600 rounded-full text-xs font-bold">
              {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length}
            </span>
          )}
        </button>
        
        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 hover:bg-gray-100 rounded-xl transition-all font-semibold shadow-lg"
        >
          <FileSpreadsheet size={18} />
          Export Excel
          {hasActiveFilters && <span className="text-xs">(Filtered)</span>}
        </button>

        {table.getSelectedRowModel().rows.length > 0 && (
          <button
            onClick={() => {
              const selected = table.getSelectedRowModel().rows[0].original;
              openEmailDialog(selected, 'custom');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 hover:bg-gray-100 rounded-xl transition-all font-semibold shadow-lg"
          >
            <Send size={18} />
            Email Selected
          </button>
        )}
      </Box>
    ),
    
  onPaginationChange: setPagination,

  state: {
    isLoading: loading,
    pagination,
  },

  
  autoResetPageIndex: false,
  });

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  All Candidates
                </h3>
                <p className="text-blue-100 text-sm">
                  {hasActiveFilters ? (
                    <>
                      Showing {filteredData.length} of {all.length} candidates
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        Filtered
                      </span>
                    </>
                  ) : (
                    `${all.length} candidates submitted`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter size={20} className="text-blue-600" />
                Advanced Filters
              </h4>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Submitted Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Submitted Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              {/* Recruiter Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recruiter Name
                </label>
                <Autocomplete
                  multiple
                  options={uniqueRecruiters}
                  value={filters.recruiterName}
                  onChange={(e, newValue) => setFilters({ ...filters, recruiterName: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Select recruiters..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        color="primary"
                      />
                    ))
                  }
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Name
                </label>
                <Autocomplete
                  multiple
                  options={uniqueClients}
                  value={filters.clientName}
                  onChange={(e, newValue) => setFilters({ ...filters, clientName: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Select clients..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        color="secondary"
                      />
                    ))
                  }
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <Autocomplete
                  multiple
                  options={statusOptions}
                  value={filters.status}
                  onChange={(e, newValue) => setFilters({ ...filters, status: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Select status..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        color="success"
                      />
                    ))
                  }
                />
              </div>

              {/* HR Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  HR Name
                </label>
                <Autocomplete
                  multiple
                  options={uniqueHRNames}
                  value={filters.hrName}
                  onChange={(e, newValue) => setFilters({ ...filters, hrName: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Select HR names..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        color="warning"
                      />
                    ))
                  }
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-gray-200">
              <div className="text-sm text-gray-600">
                {hasActiveFilters ? (
                  <span className="font-semibold text-blue-600">
                    {filteredData.length} candidates match your filters
                  </span>
                ) : (
                  <span>No filters applied</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Material React Table */}
        <MaterialReactTable table={table} />

      </div>

      {/* Email Dialog */}
      <Dialog 
        open={emailDialogOpen} 
        onClose={() => {
          setEmailDialogOpen(false);
          resetEmailDialog();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
          <div className="flex items-center gap-2">
            <Mail size={24} />
            <span>Send Email to {selectedCandidate?.recName}</span>
          </div>
        </DialogTitle>
        
        <DialogContent className="mt-4">
          <div className="space-y-4">
            <TextField
              fullWidth
              label="To"
              value={emailData.to}
              onChange={(e) => setEmailData({...emailData, to: e.target.value})}
              variant="outlined"
            
            />
            
            <TextField
              fullWidth
              label="Subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Message"
              value={emailData.message}
              onChange={(e) => setEmailData({...emailData, message: e.target.value})}
              variant="outlined"
              multiline
              rows={8}
            />

            {/* <div className="flex gap-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emailData.notifyRecruiter}
                    onChange={(e) => setEmailData({...emailData, notifyRecruiter: e.target.checked})}
                  />
                }
                label={`CC Recruiter (${selectedCandidate?.recName})`}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emailData.notifyHR}
                    onChange={(e) => setEmailData({...emailData, notifyHR: e.target.checked})}
                  />
                }
                label={`CC HR (${selectedCandidate?.hr_name})`}
              />
            </div> */}

            {/* Quick Templates */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openEmailDialog(selectedCandidate, 'status')}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
              >
                Status Update Template
              </button>
              <button
                onClick={() => openEmailDialog(selectedCandidate, 'schedule')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
              >
                Schedule Template
              </button>
            </div>
          </div>
        </DialogContent>
        
        <DialogActions className="p-4">
          <Button 
            onClick={() => {
              setEmailDialogOpen(false);
              resetEmailDialog();
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={sendEmail}
            variant="contained"
            className="bg-gradient-to-r from-blue-600 to-orange-500"
            startIcon={<Send size={18} />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Ad_Candi;