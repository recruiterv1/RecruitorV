import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Search,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Eye,
  User,
  Clock
} from 'lucide-react';

const ClientStats = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    spocName: '',
    recruiterName: '',
    status: '',
    clientName: '',
    date: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    spocNames: [],
    clientNames: [],
    recruiterNames: [],
    statuses: []
  });
  const [sortConfig, setSortConfig] = useState({ key: 'candidateCount', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [clientDetails, setClientDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  // Track which recruiter cards have all candidates expanded
  const [expandedRecruiters, setExpandedRecruiters] = useState(new Set());

  // Fetch all client statistics
  const fetchClientStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.spocName) params.append('spocName', filters.spocName);
      if (filters.recruiterName) params.append('recruiterName', filters.recruiterName);
      if (filters.status) params.append('status', filters.status);
      if (filters.clientName) params.append('clientName', filters.clientName);
      if (filters.date) params.append('date', filters.date);

      const response = await axios.get(`/clientstats/all?${params.toString()}`, { withCredentials: true });
      if (response.data.success) {
        setClients(response.data.clients);
      } else {
        setError('Failed to fetch client statistics');
      }
    } catch (err) {
      console.error('Error fetching client stats:', err);
      setError(err.response?.data?.message || 'Failed to load client statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get('/clientstats/filters/options', { withCredentials: true });
      console.log('Filter options response:', response.data);
      if (response.data.success) {
        setFilterOptions(response.data.filters);
        console.log('Filter options set:', response.data.filters);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  // Fetch detailed stats for a specific client
  const fetchClientDetails = async (clientId) => {
    if (clientDetails[clientId]) {
      return; // Already loaded
    }

    setLoadingDetails(prev => ({ ...prev, [clientId]: true }));
    try {
      const response = await axios.get(`/clientstats/${clientId}`, { withCredentials: true });
      if (response.data.success) {
        setClientDetails(prev => ({
          ...prev,
          [clientId]: response.data.data
        }));
      }
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [clientId]: false }));
    }
  };

  useEffect(() => {
    fetchClientStats();
    fetchFilterOptions();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchClientStats();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [filters.spocName, filters.recruiterName, filters.status, filters.clientName, filters.date]);

  // Toggle row expansion
  const toggleRowExpansion = (clientId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(clientId)) {
      newExpandedRows.delete(clientId);
    } else {
      newExpandedRows.add(clientId);
      fetchClientDetails(clientId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Toggle recruiter card expansion to show all candidates
  const toggleRecruiterExpansion = (clientId, positionId, recruiterName) => {
    const key = `${clientId}-${positionId}-${recruiterName}`;
    const newExpanded = new Set(expandedRecruiters);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRecruiters(newExpanded);
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Frontend filtering is now handled by backend
    // This useMemo is only for sorting now
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [clients, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig]);

  // Clear filters
  const clearFilters = () => {
    setFilters({
      spocName: '',
      recruiterName: '',
      status: '',
      clientName: '',
      date: ''
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Client Name', 'Positions', 'Candidates', 'Recruiters', 'SPOC Name'];
    const csvData = filteredAndSortedClients.map(c => [
      c.clientName,
      c.positionCount,
      c.candidateCount,
      c.recruiterCount,
      c.spocName
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    return {
      totalClients: clients.length,
      totalPositions: clients.reduce((sum, c) => sum + c.positionCount, 0),
      totalCandidates: clients.reduce((sum, c) => sum + c.candidateCount, 0),
      totalRecruiters: clients.reduce((sum, c) => sum + c.recruiterCount, 0)
    };
  }, [clients]);

  // Get status color
  const getStatusColor = (status) => {
    const successStatuses = ['Offer Accepted', 'Joining'];
    const rejectionStatuses = ['Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject', 'Background Verification Reject', 'Negotiation Reject', 'Offer Declined'];
    
    if (successStatuses.includes(status)) return 'bg-green-100 text-green-700';
    if (rejectionStatuses.includes(status)) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading client statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchClientStats}
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
              Clients Statistics
            </h1>
            <p className="text-gray-600">Track positions, candidates, and recruiter performance across all clients</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchClientStats}
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
                <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-blue-600">{summaryStats.totalClients}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Positions</p>
                <p className="text-3xl font-bold text-purple-600">{summaryStats.totalPositions}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Briefcase className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                <p className="text-3xl font-bold text-orange-600">{summaryStats.totalCandidates}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recruiters</p>
                <p className="text-3xl font-bold text-green-600">{summaryStats.totalRecruiters}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {(filters.spocName || filters.recruiterName || filters.status || filters.clientName || filters.date) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Client Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                placeholder="Search client..."
                value={filters.clientName}
                onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              />
            </div>

            {/* SPOC Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SPOC Name</label>
              <select
                value={filters.spocName}
                onChange={(e) => setFilters(prev => ({ ...prev, spocName: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              >
                <option value="">All SPOCs</option>
                {filterOptions.spocNames.map(spoc => (
                  <option key={spoc} value={spoc}>{spoc}</option>
                ))}
              </select>
            </div>

            {/* Recruiters Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recruiters</label>
              <select
                value={filters.recruiterName}
                onChange={(e) => setFilters(prev => ({ ...prev, recruiterName: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              >
                <option value="">All Recruiters</option>
                {filterOptions.recruiterNames.map(rec => (
                  <option key={rec} value={rec}>{rec}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              >
                <option value="">All Statuses</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Quick search by client name..."
            value={filters.clientName}
            onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
              <tr>
                <th className="w-10"></th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center gap-2">
                    Client Name
                    {sortConfig.key === 'clientName' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('positionCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Positions
                    {sortConfig.key === 'positionCount' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('candidateCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Candidates
                    {sortConfig.key === 'candidateCount' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('recruiterCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Recruiters
                    {sortConfig.key === 'recruiterCount' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  SPOC Name
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Building2 size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-semibold">No clients found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <React.Fragment key={client.id}>
                    <tr 
                      onClick={() => toggleRowExpansion(client.id)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <td className="px-2 py-4">
                        <button
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(client.id);
                          }}
                        >
                          {expandedRows.has(client.id) ? (
                            <ChevronDown size={20} className="text-blue-600" />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            {client.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{client.clientName}</p>
                            <p className="text-xs text-gray-500">
                              {client.positionBreakdown?.length || 0} positions
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-700 rounded-full font-bold text-lg">
                          {client.positionCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-700 rounded-full font-bold text-lg">
                          {client.candidateCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-700 rounded-full font-bold text-lg">
                          {client.recruiterCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{client.spocName}</span>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRows.has(client.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-6 py-4">
                          {loadingDetails[client.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                              <span className="text-gray-600">Loading details...</span>
                            </div>
                          ) : clientDetails[client.id] ? (
                            <div className="bg-white rounded-lg p-6 shadow-inner">
                              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-600" />
                                Position-wise Breakdown
                              </h4>
                              
                              {clientDetails[client.id].positions?.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No positions found</p>
                              ) : (
                                <div className="space-y-4">
                                  {clientDetails[client.id].positions?.map((position, idx) => (
                                    <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                            <Briefcase size={18} className="text-purple-600" />
                                            {position.positionName}
                                          </h5>
                                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                              <User size={14} />
                                              HR: {position.hrName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Users size={14} />
                                              SPOC: {position.spocName}
                                            </span>
                                            {position.positionDate && (
                                              <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                Created: {new Date(position.positionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold">
                                          {position.candidateCount} {position.candidateCount === 1 ? 'Candidate' : 'Candidates'}
                                        </div>
                                      </div>
                                      
                                      {/* Recruiter-wise breakdown */}
                                      {position.recruiters?.length > 0 && (
                                        <div className="mt-4">
                                          <h6 className="text-sm font-semibold text-gray-700 mb-2">Recruiter Performance</h6>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {position.recruiters.map((recruiter, rIdx) => {
                                              const expandKey = `${client.id}-${position.positionId}-${recruiter.recruiterName}`;
                                              const isExpanded = expandedRecruiters.has(expandKey);
                                              const displayedCandidates = isExpanded ? recruiter.candidates : recruiter.candidates.slice(0, 3);
                                              
                                              return (
                                                <div key={rIdx} className="bg-gray-100 rounded-lg p-3">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-900 text-sm">{recruiter.recruiterName}</span>
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                      {recruiter.candidateCount}
                                                    </span>
                                                  </div>
                                                  {/* Candidate list */}
                                                  <div className="space-y-1 mt-2">
                                                    {displayedCandidates.map((cand, cIdx) => (
                                                      <div key={cIdx} className="flex items-center justify-between text-xs">
                                                        <div className="flex flex-col">
                                                          <span className="text-gray-600 truncate max-w-[120px]">{cand.name}</span>
                                                          {cand.lastUpdated && (
                                                            <span className="text-gray-400 text-[10px]">
                                                              Updated: {new Date(cand.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(cand.status)}`}>
                                                          {cand.status}
                                                        </span>
                                                      </div>
                                                    ))}
                                                    {recruiter.candidates.length > 3 && (
                                                      <button
                                                        onClick={() => toggleRecruiterExpansion(client.id, position.positionId, recruiter.recruiterName)}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium italic mt-1 cursor-pointer text-left"
                                                      >
                                                        {isExpanded ? `Show less` : `+${recruiter.candidates.length - 3} more`}
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <button
                                onClick={() => fetchClientDetails(client.id)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Load Details
                              </button>
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
      {filteredAndSortedClients.length > 0 && (
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
              </select>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedClients.length)} of {filteredAndSortedClients.length} clients
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
    </div>
  );
};

export default ClientStats;

