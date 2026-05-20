import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  RefreshCw,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Building2,
  XCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const CandidateStats = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [statuses, setStatuses] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    phone: '',
    email: '',
    position: '',
    status: '',
    lastUpdateDate: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fetch candidates
  const fetchCandidates = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      // Add filters if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      
      const response = await axios.get(`/candidatestats/all?${params.toString()}`);
      if (response.data.success) {
        setCandidates(response.data.data.candidates);
        setPagination(response.data.data.pagination);
      } else {
        setError('Failed to fetch candidates');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/candidatestats/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  // Fetch available statuses
  const fetchStatuses = async () => {
    try {
      const response = await axios.get('/candidatestats/statuses');
      if (response.data.success) {
        setStatuses(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  useEffect(() => {
    fetchCandidates(1);
    fetchStatistics();
    fetchStatuses();
  }, []);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchCandidates(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      name: '',
      phone: '',
      email: '',
      position: '',
      status: '',
      lastUpdateDate: ''
    });
    setCurrentPage(1);
    setTimeout(() => fetchCandidates(1), 100);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchCandidates(newPage);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Position', 'Client', 'Status', 'Date Added', 'Last Update', 'Recruiter'];
    const csvData = candidates.map(c => [
      c.name,
      c.phone,
      c.email,
      c.position,
      c.client,
      c.status,
      formatDate(c.dateAdded),
      formatDate(c.lastUpdate),
      c.recruiterName
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const successStatuses = ['Offer Accepted', 'Joining', 'Joined'];
    const rejectedStatuses = ['Rejected', 'Client Rejected', 'Candidate Rejected'];
    
    if (successStatuses.some(s => status?.includes(s))) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (rejectedStatuses.some(s => status?.includes(s))) {
      return 'bg-red-100 text-red-700 border-red-200';
    } else {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  if (loading && !candidates.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading candidate statistics...</p>
        </div>
      </div>
    );
  }

  if (error && !candidates.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchCandidates(currentPage)}
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
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              Candidate Statistics
            </h1>
            <p className="text-gray-600">Comprehensive candidate data with advanced filtering</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => fetchCandidates(currentPage)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={exportToCSV}
              disabled={candidates.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Statistics Summary Cards */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalCandidates}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-orange-100">
              <p className="text-sm text-gray-600 mb-1">Unique Positions</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.uniquePositions}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-100">
              <p className="text-sm text-gray-600 mb-1">Unique Clients</p>
              <p className="text-2xl font-bold text-green-600">{statistics.uniqueClients}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-100">
              <p className="text-sm text-gray-600 mb-1">Recent (7 days)</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.recentCandidates}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="Search by phone..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="text"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Search by email..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <input
                type="text"
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                placeholder="Search by position..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Update Date</label>
              <input
                type="date"
                value={filters.lastUpdateDate}
                onChange={(e) => handleFilterChange('lastUpdateDate', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search size={18} />
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <XCircle size={18} />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Position</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Client</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Dates</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Recruiter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-gray-600">Loading...</p>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-500">No candidates found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                candidates.map((candidate, index) => (
                  <tr key={candidate.id || index} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{candidate.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{candidate.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{candidate.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-blue-600 flex-shrink-0" />
                        <span className="text-gray-900 font-medium truncate">{candidate.position}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-green-600 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{candidate.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Added: {formatDate(candidate.dateAdded)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Updated: {formatDate(candidate.lastUpdate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 truncate">{candidate.recruiterName}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 font-medium">Rows per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                  setTimeout(() => fetchCandidates(1), 100);
                }}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalRecords)} of {pagination.totalRecords} candidates
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                «
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium">
                {currentPage}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>

              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

export default CandidateStats;
