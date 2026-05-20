import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, Users, TrendingUp, TrendingDown, Search, RefreshCw, Download,
  Calendar, ChevronDown, ChevronRight, Clock, XCircle, Loader2, FileText
} from 'lucide-react';

const PositionStats = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [isDateSearch, setIsDateSearch] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'lastUpdated', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [positionDetails, setPositionDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Get API base URL - use Firebase Function URL in production
  const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return ''; // Use proxy in development
    }
    return 'https://api-myh3hnbr6q-uc.a.run.app'; // Firebase Function URL
  };

  const fetchPositionStats = async () => {
    setLoading(true);
    setError(null);
    setIsDateSearch(false);
    try {
      const apiUrl = getApiUrl();
      console.log('Fetching from:', `${apiUrl}/positionstats/all`);
      const response = await axios.get(`${apiUrl}/positionstats/all`);
      console.log('Response:', response.data);
      if (response.data.success) {
        setPositions(response.data.positions);
        console.log('Positions set:', response.data.positions.length);
      } else {
        console.error('API returned success: false');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load position statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionsByDate = async (date) => {
    if (!date) {
      fetchPositionStats();
      return;
    }
    setLoading(true);
    setError(null);
    setIsDateSearch(true);
    try {
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/positionstats/date/${date}`);
      if (response.data.success) {
        setPositions(response.data.positions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionDetails = async (posId) => {
    if (positionDetails[posId]) return;
    setLoadingDetails(prev => ({ ...prev, [posId]: true }));
    try {
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/positionstats/${posId}`);
      if (response.data.success) {
        setPositionDetails(prev => ({ ...prev, [posId]: response.data.data }));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [posId]: false }));
    }
  };

  const toggleRowExpansion = (posId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(posId)) {
      newExpandedRows.delete(posId);
    } else {
      newExpandedRows.add(posId);
      fetchPositionDetails(posId);
    }
    setExpandedRows(newExpandedRows);
  };

  useEffect(() => {
    fetchPositionStats();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPositions = React.useMemo(() => {
    let sorted = [...positions];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (sortConfig.key === 'lastUpdated' || sortConfig.key === 'datePosted') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [positions, sortConfig]);

  const totalPages = Math.ceil(sortedPositions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPositions = sortedPositions.slice(startIndex, endIndex);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const exportToCSV = () => {
    const headers = ['Position', 'Client', 'HR', 'Recruiters', 'Submissions', 'Success Rate', 'Last Updated'];
    const csvData = sortedPositions.map(p => [
      p.positionName, p.client, p.hrName, p.recruiterCount, p.totalSubmissions, p.successRate, formatDate(p.lastUpdated)
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `position-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading position statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchPositionStats} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
              Position Statistics
            </h1>
            <p className="text-gray-600">Track position-wise recruiter activity and submissions</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchPositionStats} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {positions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Positions</p>
                  <p className="text-3xl font-bold text-blue-600">{positions.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Briefcase className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Recruiters</p>
                  <p className="text-3xl font-bold text-orange-600">{positions.reduce((sum, p) => sum + p.recruiterCount, 0)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                  <p className="text-3xl font-bold text-green-600">{positions.reduce((sum, p) => sum + p.totalSubmissions, 0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Success Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(positions.reduce((sum, p) => sum + parseFloat(p.successRate), 0) / positions.length).toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
          <button onClick={() => fetchPositionsByDate(searchDate)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Search size={20} />
            Search
          </button>
          {isDateSearch && (
            <button onClick={() => { setSearchDate(''); fetchPositionStats(); }} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 flex items-center gap-2">
              <XCircle size={20} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700" onClick={() => handleSort('positionName')}>
                  Position {sortConfig.key === 'positionName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Client</th>
                <th className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700" onClick={() => handleSort('recruiterCount')}>
                  Recruiters {sortConfig.key === 'recruiterCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700" onClick={() => handleSort('totalSubmissions')}>
                  Submissions {sortConfig.key === 'totalSubmissions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700" onClick={() => handleSort('successRate')}>
                  Success Rate {sortConfig.key === 'successRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700" onClick={() => handleSort('lastUpdated')}>
                  Last Updated {sortConfig.key === 'lastUpdated' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPositions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No positions found</td>
                </tr>
              ) : (
                paginatedPositions.map((position) => (
                  <React.Fragment key={position.posId}>
                    <tr className="hover:bg-blue-50 cursor-pointer" onClick={() => toggleRowExpansion(position.posId)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleRowExpansion(position.posId); }}>
                            {expandedRows.has(position.posId) ? <ChevronDown size={20} className="text-blue-600" /> : <ChevronRight size={20} />}
                          </button>
                          <div>
                            <p className="font-semibold text-gray-900">{position.positionName}</p>
                            <p className="text-xs text-gray-500">ID: {position.posId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{position.client}</p>
                        <p className="text-xs text-gray-500">{position.hrName}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          <Users size={14} />
                          {position.recruiterCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold">{position.totalSubmissions}</span>
                          <div className="flex gap-1 text-xs">
                            <span className="text-green-600">✓{position.successful}</span>
                            <span className="text-yellow-600">⏳{position.onProcess}</span>
                            <span className="text-red-600">✗{position.rejected}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          parseFloat(position.successRate) >= 50 ? 'bg-green-100 text-green-700' :
                          parseFloat(position.successRate) >= 25 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {position.successRate}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={14} className="text-gray-400" />
                          {formatRelativeTime(position.lastUpdated)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={(e) => { e.stopPropagation(); toggleRowExpansion(position.posId); }} className="p-2 hover:bg-blue-100 rounded-lg">
                          {expandedRows.has(position.posId) ? <ChevronDown size={20} className="text-blue-600" /> : <ChevronRight size={20} />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(position.posId) && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="px-6 py-4">
                          {loadingDetails[position.posId] ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                              <span>Loading details...</span>
                            </div>
                          ) : positionDetails[position.posId] ? (
                            <div className="bg-white rounded-lg p-6 space-y-4">
                              <h4 className="text-lg font-bold flex items-center gap-2">
                                <Users size={20} className="text-orange-600" />
                                Recruiter Breakdown ({positionDetails[position.posId].totalRecruiters} Recruiters)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {positionDetails[position.posId].recruiterBreakdown.map((rec) => (
                                  <div key={rec.recruiterId} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-100">
                                    <div className="flex justify-between items-center mb-2">
                                      <p className="font-semibold text-sm">{rec.recruiterName}</p>
                                      <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">{rec.submissionCount}</span>
                                    </div>
                                    <p className="text-xs text-gray-600">{rec.recruiterEmail}</p>
                                  </div>
                                ))}
                              </div>
                              <h4 className="text-lg font-bold mt-6">All Submissions ({positionDetails[position.posId].totalSubmissions})</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Candidate</th>
                                      <th className="px-3 py-2 text-left">Recruiter</th>
                                      <th className="px-3 py-2 text-left">Status</th>
                                      <th className="px-3 py-2 text-left">Submitted</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {positionDetails[position.posId].submissions.map((sub, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">{sub.candidateName}</td>
                                        <td className="px-3 py-2">{sub.recruiterName}</td>
                                        <td className="px-3 py-2">
                                          <span className={`px-2 py-1 rounded-full text-xs ${
                                            ['Offer Accepted', 'Joining'].includes(sub.status) ? 'bg-green-100 text-green-700' :
                                            sub.status?.includes('Reject') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {sub.status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{formatDate(sub.submittedDate)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">Failed to load details</div>
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

      {/* Pagination */}
      {sortedPositions.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Rows:</label>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 border-2 rounded-lg">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedPositions.length)} of {sortedPositions.length}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-2 border-2 rounded-lg hover:bg-blue-50 disabled:opacity-50">«</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 border-2 rounded-lg hover:bg-blue-50 disabled:opacity-50">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-2 rounded-lg ${currentPage === pageNum ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white' : 'border-2 hover:bg-blue-50'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 border-2 rounded-lg hover:bg-blue-50 disabled:opacity-50">›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-2 border-2 rounded-lg hover:bg-blue-50 disabled:opacity-50">»</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionStats;
