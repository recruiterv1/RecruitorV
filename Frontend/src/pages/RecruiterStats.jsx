import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  Mail,
  X,
  Send,
  AlertCircle
} from 'lucide-react';

const RecruiterStats = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState('all'); // 'all', 'free', 'paid'
  const [sortConfig, setSortConfig] = useState({ key: 'positionCount', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [recruiterDetails, setRecruiterDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [uniquePositionCount, setUniquePositionCount] = useState(0);
  
  // Email modal state
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    recruiter: null,
    subject: '',
    body: '',
    loading: false,
    error: null,
    success: false
  });

  // Check if recruiter is inactive (more than 3 days)
  const isInactive = (lastActive) => {
    if (!lastActive) {
      return true; // Never logged in - show as inactive
    }
    
    try {
      const date = new Date(lastActive);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / 86400000);
      const inactive = diffDays >= 3; // 3 days threshold
      
      // Debug logging
      console.log('Checking inactivity:', {
        lastActive,
        date: date.toISOString(),
        now: now.toISOString(),
        diffMs,
        diffDays,
        inactive
      });
      
      return inactive;
    } catch (err) {
      console.error('Error checking inactivity:', err);
      return false;
    }
  };

  // Format last active date/time
  const formatLastActive = (lastActive) => {
    if (!lastActive) {
      return 'Never';
    }

    try {
      const date = new Date(lastActive);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Less than 1 minute
      if (diffMins < 1) {
        return 'Just now';
      }
      // Less than 1 hour
      if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      }
      // Less than 24 hours
      if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      }
      // Less than 7 days
      if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }
      // More than 7 days - show full date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Fetch unique position count from Position Stats API
  const fetchUniquePositionCount = async () => {
    try {
      const response = await axios.get('/positionstats/all');
      if (response.data.success) {
        setUniquePositionCount(response.data.positions.length);
      }
    } catch (err) {
      console.error('Error fetching position count:', err);
      // Fallback to 0 if fetch fails
      setUniquePositionCount(0);
    }
  };

  // Fetch recruiter statistics
  const fetchRecruiterStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/recruiterstats/all');
      if (response.data.success) {
        setRecruiters(response.data.recruiters);
      } else {
        setError('Failed to fetch recruiter statistics');
      }
    } catch (err) {
      console.error('Error fetching recruiter stats:', err);
      setError(err.response?.data?.message || 'Failed to load recruiter statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed stats for a specific recruiter
  const fetchRecruiterDetails = async (recruiterId) => {
    if (recruiterDetails[recruiterId]) {
      return; // Already loaded
    }

    setLoadingDetails(prev => ({ ...prev, [recruiterId]: true }));
    try {
      const response = await axios.get(`/recruiterstats/${recruiterId}`);
      if (response.data.success) {
        setRecruiterDetails(prev => ({
          ...prev,
          [recruiterId]: response.data.data
        }));
      }
    } catch (err) {
      console.error('Error fetching recruiter details:', err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [recruiterId]: false }));
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (recruiterId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(recruiterId)) {
      newExpandedRows.delete(recruiterId);
    } else {
      newExpandedRows.add(recruiterId);
      fetchRecruiterDetails(recruiterId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Open email modal
  const openEmailModal = (recruiter) => {
    const defaultBody = `Dear ${recruiter.name},

We hope this message finds you well.

We noticed that you haven't been active on the RecruiterV platform recently. We wanted to reach out and see if there's anything we can help you with.

Your contributions are valuable to us, and we'd love to see you back on the platform. If you're facing any challenges or have any questions, please don't hesitate to reach out.

We're here to support you in your recruitment journey.

Best regards,
RecruiterV Team
admin@recruiterv.com`;

    setEmailModal({
      isOpen: true,
      recruiter: recruiter,
      subject: 'No Activity Found - Let\'s Connect',
      body: defaultBody,
      loading: false,
      error: null,
      success: false
    });
  };

  // Close email modal
  const closeEmailModal = () => {
    setEmailModal({
      isOpen: false,
      recruiter: null,
      subject: '',
      body: '',
      loading: false,
      error: null,
      success: false
    });
  };

  // Send email
  const sendEmail = async () => {
    setEmailModal(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await axios.post('/auth/send-recruiter-email', {
        to: emailModal.recruiter.email,
        subject: emailModal.subject,
        body: emailModal.body
      });

      if (response.data.success) {
        setEmailModal(prev => ({ ...prev, loading: false, success: true }));
        // Close modal after 2 seconds
        setTimeout(() => {
          closeEmailModal();
        }, 2000);
      } else {
        setEmailModal(prev => ({ 
          ...prev, 
          loading: false, 
          error: response.data.message || 'Failed to send email' 
        }));
      }
    } catch (err) {
      setEmailModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.response?.data?.message || 'Failed to send email. Please try again.' 
      }));
    }
  };

  useEffect(() => {
    fetchRecruiterStats();
    fetchUniquePositionCount();
  }, []);

  // Sort function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort recruiters
  const filteredAndSortedRecruiters = React.useMemo(() => {
    let filtered = recruiters.filter(recruiter => {
      // Search filter
      const matchesSearch = recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruiter.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Plan type filter
      const matchesPlanType = planTypeFilter === 'all' || 
        (planTypeFilter === 'free' && recruiter.planType === 0) ||
        (planTypeFilter === 'paid' && recruiter.planType === 1);
      
      return matchesSearch && matchesPlanType;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle percentage strings
        if (typeof aValue === 'string' && aValue.includes('%')) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        // Handle lastActive dates
        if (sortConfig.key === 'lastActive') {
          // Treat null/undefined as oldest date
          const aDate = aValue ? new Date(aValue).getTime() : 0;
          const bDate = bValue ? new Date(bValue).getTime() : 0;
          
          if (aDate < bDate) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aDate > bDate) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [recruiters, searchTerm, planTypeFilter, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedRecruiters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecruiters = filteredAndSortedRecruiters.slice(startIndex, endIndex);

  // Reset to page 1 when search, filter, or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planTypeFilter, sortConfig]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Last Active', 'Positions Working', 'Candidates Submitted', 'On Process', 'Successful', 'Rejected', 'Success Rate'];
    const csvData = filteredAndSortedRecruiters.map(r => [
      r.name,
      r.email,
      formatLastActive(r.lastActive),
      r.positionCount,
      r.candidatesSubmitted,
      r.candidatesOnProcess,
      r.candidatesSuccessful,
      r.candidatesRejected,
      r.successRate
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recruiter-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Summary statistics
  const summaryStats = React.useMemo(() => {
    const freeCount = recruiters.filter(r => r.planType === 0).length;
    const paidCount = recruiters.filter(r => r.planType === 1).length;
    
    return {
      totalRecruiters: recruiters.length,
      freeRecruiters: freeCount,
      paidRecruiters: paidCount,
      // Use unique position count from Position Stats API (not sum of recruiter positions)
      totalPositions: uniquePositionCount,
      totalCandidates: recruiters.reduce((sum, r) => sum + r.candidatesSubmitted, 0),
      avgPositionsPerRecruiter: recruiters.length > 0 
        ? (recruiters.reduce((sum, r) => sum + r.positionCount, 0) / recruiters.length).toFixed(1)
        : 0
    };
  }, [recruiters, uniquePositionCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading recruiter statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchRecruiterStats}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-4 sm:p-6 lg:p-8">
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              Recruiter Performance Dashboard
            </h1>
            <p className="text-gray-600">Track positions and performance metrics for all recruiters</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchRecruiterStats}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recruiters</p>
                <p className="text-3xl font-bold text-blue-600">{summaryStats.totalRecruiters}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Positions</p>
                <p className="text-3xl font-bold text-orange-600">{summaryStats.totalPositions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Briefcase className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                <p className="text-3xl font-bold text-green-600">{summaryStats.totalCandidates}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Positions/Recruiter</p>
                <p className="text-3xl font-bold text-purple-600">{summaryStats.avgPositionsPerRecruiter}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        {/* Plan Type Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Filter by Plan:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPlanTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                planTypeFilter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              All Recruiters
            </button>
            <button
              onClick={() => setPlanTypeFilter('free')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                planTypeFilter === 'free'
                  ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              Free Plan ({summaryStats.freeRecruiters})
            </button>
            <button
              onClick={() => setPlanTypeFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                planTypeFilter === 'paid'
                  ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              Paid Plan ({summaryStats.paidRecruiters})
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Recruiter Name
                    {sortConfig.key === 'name' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('positionCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Positions Working
                    {sortConfig.key === 'positionCount' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('candidatesSubmitted')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Submitted
                    {sortConfig.key === 'candidatesSubmitted' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('candidatesOnProcess')}
                >
                  <div className="flex items-center justify-center gap-2">
                    On Process
                    {sortConfig.key === 'candidatesOnProcess' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('candidatesSuccessful')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Successful
                    {sortConfig.key === 'candidatesSuccessful' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('candidatesRejected')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Rejected
                    {sortConfig.key === 'candidatesRejected' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('successRate')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Success Rate
                    {sortConfig.key === 'successRate' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedRecruiters.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-semibold">No recruiters found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecruiters.map((recruiter, index) => (
                  <React.Fragment key={recruiter.id}>
                    <tr 
                      onClick={() => toggleRowExpansion(recruiter.id)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(recruiter.id);
                            }}
                          >
                            {expandedRows.has(recruiter.id) ? (
                              <ChevronDown size={20} className="text-blue-600" />
                            ) : (
                              <ChevronRight size={20} />
                            )}
                          </button>
                          
                          {/* Avatar with inactive badge */}
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                              {recruiter.name.charAt(0).toUpperCase()}
                            </div>
                            {isInactive(recruiter.lastActive) && (
                              <div 
                                className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center shadow-lg"
                                title={`Inactive for 3+ days - Last active: ${formatLastActive(recruiter.lastActive)}`}
                                style={{ fontSize: '14px' }}
                              >
                                😔
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{recruiter.name}</p>
                              
                              {/* Plan Type Badge */}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                recruiter.planType === 0
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {recruiter.planType === 0 ? 'Free' : 'Paid'}
                              </span>
                              
                              {/* Email icon button - only show for inactive recruiters */}
                              {isInactive(recruiter.lastActive) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEmailModal(recruiter);
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded-full transition-colors group"
                                  title="Send email to inactive recruiter"
                                >
                                  <Mail size={16} className="text-gray-400 group-hover:text-blue-600" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              Last active: {formatLastActive(recruiter.lastActive)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{recruiter.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 rounded-full font-bold text-lg">
                          {recruiter.positionCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <FileText size={16} className="text-gray-500" />
                          <span className="font-semibold text-gray-900">{recruiter.candidatesSubmitted}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Clock size={16} className="text-yellow-500" />
                          <span className="font-semibold text-yellow-700">{recruiter.candidatesOnProcess}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <span className="font-semibold text-green-700">{recruiter.candidatesSuccessful}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <XCircle size={16} className="text-red-500" />
                          <span className="font-semibold text-red-700">{recruiter.candidatesRejected}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          parseFloat(recruiter.successRate) >= 50 
                            ? 'bg-green-100 text-green-700'
                            : parseFloat(recruiter.successRate) >= 25
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {recruiter.successRate}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRows.has(recruiter.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="px-6 py-4">
                          {loadingDetails[recruiter.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                              <span className="text-gray-600">Loading details...</span>
                            </div>
                          ) : recruiterDetails[recruiter.id] ? (
                            <div className="bg-white rounded-lg p-6 shadow-inner">
                              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-600" />
                                Position Breakdown
                              </h4>
                              
                              {recruiterDetails[recruiter.id].positionBreakdown.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No positions found</p>
                              ) : (
                                <div className="space-y-4">
                                  {recruiterDetails[recruiter.id].positionBreakdown.map((position, idx) => (
                                    <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-900 text-lg">{position.positionName}</h5>
                                          <p className="text-sm text-gray-500">Position ID: {position.positionId}</p>
                                        </div>
                                        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
                                          {position.candidateCount} {position.candidateCount === 1 ? 'Resume' : 'Resumes'}
                                        </div>
                                      </div>
                                      
                                      {/* Candidates Table */}
                                      <div className="mt-3 overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Candidate Name</th>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Submitted Date</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {position.candidates.map((candidate, cIdx) => (
                                              <tr key={cIdx} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-gray-900">{candidate.name || 'N/A'}</td>
                                                <td className="px-3 py-2">
                                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    ['Offer Accepted', 'Joining'].includes(candidate.status)
                                                      ? 'bg-green-100 text-green-700'
                                                      : candidate.status?.includes('Reject')
                                                      ? 'bg-red-100 text-red-700'
                                                      : 'bg-yellow-100 text-yellow-700'
                                                  }`}>
                                                    {candidate.status || 'N/A'}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">
                                                  {candidate.submittedDate 
                                                    ? new Date(candidate.submittedDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                      })
                                                    : 'N/A'}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              Failed to load details
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedRecruiters.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Items per page selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 font-medium">Rows per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedRecruiters.length)} of {filteredAndSortedRecruiters.length} recruiters
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="First page"
              >
                «
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Previous page"
              >
                ‹
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md'
                          : 'border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Next page"
              >
                ›
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Mail className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Send Email</h3>
                  <p className="text-sm text-gray-500">Contact recruiter directly</p>
                </div>
              </div>
              <button
                onClick={closeEmailModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={emailModal.loading}
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              {emailModal.success && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <div>
                    <p className="font-semibold text-green-800">Email sent successfully!</p>
                    <p className="text-sm text-green-600">The recruiter will receive your message shortly.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {emailModal.error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={24} />
                  <div>
                    <p className="font-semibold text-red-800">Failed to send email</p>
                    <p className="text-sm text-red-600">{emailModal.error}</p>
                  </div>
                </div>
              )}

              {/* To Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  To:
                </label>
                <input
                  type="email"
                  value={emailModal.recruiter?.email || ''}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* From Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From:
                </label>
                <input
                  type="email"
                  value="admin@recruiterv.com"
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject:
                </label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  disabled={emailModal.loading || emailModal.success}
                />
              </div>

              {/* Body Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message:
                </label>
                <textarea
                  value={emailModal.body}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                  disabled={emailModal.loading || emailModal.success}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200 bg-gray-50">
              <button
                onClick={closeEmailModal}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={emailModal.loading}
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailModal.loading || emailModal.success || !emailModal.subject || !emailModal.body}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg hover:from-blue-700 hover:to-orange-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailModal.loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterStats;
