import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Briefcase,
  Building2,
  UserCheck,
  FileText,
  TrendingUp,
  RefreshCw,
  X,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  XCircle
} from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Candidate Activity Table States
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [statuses, setStatuses] = useState([]);
  
  // Activity Table Filters
  const [activityFilters, setActivityFilters] = useState({
    position: '',
    status: '',
    lastUpdateDate: ''
  });
  
  // Activity Table Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch dashboard summary
  const fetchSummary = async (filter = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === 'all' 
        ? '/dashboardstats/summary'
        : `/dashboardstats/summary?filter=${filter}`;
      
      const response = await axios.get(url);
      if (response.data.success) {
        setSummary(response.data.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(activeFilter);
    fetchCandidates(1);
    fetchStatuses();
  }, [activeFilter]);

  // Fetch candidate activity data
  const fetchCandidates = async (page = 1) => {
    setCandidatesLoading(true);
    setCandidatesError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      // Add filters if they exist
      if (activityFilters.position) params.append('position', activityFilters.position);
      if (activityFilters.status) params.append('status', activityFilters.status);
      if (activityFilters.lastUpdateDate) params.append('lastUpdateDate', activityFilters.lastUpdateDate);
      
      const response = await axios.get(`/candidatestats/all?${params.toString()}`);
      if (response.data.success) {
        setCandidates(response.data.data.candidates);
        setPagination(response.data.data.pagination);
      } else {
        setCandidatesError('Failed to fetch candidate activity');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setCandidatesError(err.response?.data?.message || 'Failed to load candidate activity');
    } finally {
      setCandidatesLoading(false);
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

  // Handle activity filter change
  const handleActivityFilterChange = (key, value) => {
    setActivityFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply activity filters
  const applyActivityFilters = () => {
    setCurrentPage(1);
    fetchCandidates(1);
  };

  // Clear activity filters
  const clearActivityFilters = () => {
    setActivityFilters({
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

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={24} />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchSummary(activeFilter)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'clients',
      title: 'Total Clients',
      count: summary?.totalClients || 0,
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'recruiters',
      title: 'Total Recruiters',
      count: summary?.totalRecruiters || 0,
      breakdown: `(${summary?.totalFreeRecruiters || 0}F / ${summary?.totalPaidRecruiters || 0}P)`,
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'spocs',
      title: 'Total SPOCs',
      count: summary?.totalSpocs || 0,
      icon: UserCheck,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 'positions',
      title: 'Total Positions',
      count: summary?.totalPositions || 0,
      icon: Briefcase,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      id: 'hrs',
      title: 'Total HRs',
      count: summary?.totalHRs || 0,
      icon: UserCheck,
      gradient: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      id: 'candidates',
      title: 'Total Candidates',
      count: summary?.totalCandidates || 0,
      icon: FileText,
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">Real-time metrics and statistics</p>
          </div>
          
          <button
            onClick={() => fetchSummary(activeFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'today'
                ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveFilter('week')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'week'
                ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setActiveFilter('month')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'month'
                ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`${card.bgColor} rounded-xl p-6 shadow-lg border-2 border-gray-100 transition-all`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 ${card.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={card.iconColor} size={28} />
                </div>
              </div>
              
              <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  {card.count}
                </p>
                {card.breakdown && (
                  <p className="text-lg font-semibold text-gray-600">
                    {card.breakdown}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Activity Table Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              Recent Candidate Activity
            </h2>
            <p className="text-gray-600">Track candidate progress and updates</p>
          </div>
          
          <button
            onClick={() => fetchCandidates(currentPage)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Activity Filters */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position Name</label>
              <input
                type="text"
                value={activityFilters.position}
                onChange={(e) => handleActivityFilterChange('position', e.target.value)}
                placeholder="Search by position..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={activityFilters.status}
                onChange={(e) => handleActivityFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date (From)</label>
              <input
                type="date"
                value={activityFilters.lastUpdateDate}
                onChange={(e) => handleActivityFilterChange('lastUpdateDate', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={applyActivityFilters}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search size={18} />
              Apply Filters
            </button>
            <button
              onClick={clearActivityFilters}
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <XCircle size={18} />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Position Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Candidate Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Recruiter Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date Last Updated</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {candidatesLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                      <p className="text-gray-600">Loading candidate activity...</p>
                    </td>
                  </tr>
                ) : candidatesError ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                      <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
                      <p className="text-gray-600 text-sm">{candidatesError}</p>
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Users size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-500">No candidate activity found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate, index) => (
                    <tr key={candidate.id || index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-blue-600 flex-shrink-0" />
                          <span className="text-gray-900 font-medium">{candidate.position}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{candidate.recruiterName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={14} className="text-gray-400 flex-shrink-0" />
                          <span>{formatDate(candidate.lastUpdate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
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
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalRecords)} of {pagination.totalRecords} records
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
    </div>
  );
};

export default Dashboard;
