import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  RefreshCw,
  X,
  CheckCircle,
  IndianRupee,
  BadgePercent,
  Award,
  Calendar
} from 'lucide-react';

const MyEarnings = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch earnings data
  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load profile for role/email
      let profile = userProfile;
      let profileCollection = null;
      if (!profile) {
        const profRes = await axios.get('/api/profile', { withCredentials: true });
        if (profRes.data?.success) {
          profile = profRes.data.user;
          profileCollection = profRes.data.collection;
          setUserProfile(profile);
        }
      }

      const role =
        profile?.roleCategory ||
        (profileCollection === 'coach' ? 'Coach' : profileCollection === 'expert' ? 'Expert' : 'Recruiter');
      const email = profile?.email;

      if (role === 'Recruiter') {
        const response = await axios.get('/api/recruiter-earnings', { withCredentials: true });
        if (response.data.success) {
          setEarningsData(response.data.data);
        } else {
          setError('Failed to fetch earnings data');
        }
      } else if (role === 'Coach' || role === 'Expert') {
        const response = await axios.get(`/api/coach-expert/earnings`, {
          params: { email, type: role.toLowerCase() },
          withCredentials: true
        });
        if (response.data.success) {
          setEarningsData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch earnings data');
        }
      } else {
        // Unknown role – default to recruiter logic
        const response = await axios.get('/api/recruiter-earnings', { withCredentials: true });
        if (response.data.success) {
          setEarningsData(response.data.data);
        } else {
          setError('Failed to fetch earnings data');
        }
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err.response?.data?.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    let dateObj;
    if (date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else if (date.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isCoachNotRecruiter = typeof error === 'string' && /recruiter not found/i.test(error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={24} />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">
            {isCoachNotRecruiter ? 'Earnings Not Available' : 'Error Loading Earnings'}
          </h3>
          <p className="text-red-600 mb-4">
            {isCoachNotRecruiter
              ? 'Earnings are available for recruiter accounts. As a Coach/Expert, this page does not apply.'
              : error}
          </p>
          <button
            onClick={fetchEarnings}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const earnings = earningsData?.earnings || [];
  const totalEarnings = earningsData?.totalEstimatedEarnings || 0;
  const totalCandidates = earningsData?.totalCandidates || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <DollarSign size={40} className="text-blue-600" />
              My Earnings
            </h1>
            <p className="text-gray-600">Track your commission from successful placements</p>
          </div>
          
          <button
            onClick={fetchEarnings}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Potential Earnings */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Award size={28} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2 text-green-100">Total Potential Earnings</h3>
            <p className="text-4xl font-bold">{formatCurrency(totalEarnings)}</p>
            <p className="text-xs text-green-200 mt-2">
              From {totalCandidates} submitted candidate{totalCandidates !== 1 ? 's' : ''} (non-rejected)
            </p>
          </div>

          {/* Total Candidates */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2 text-blue-100">Submitted Candidates</h3>
            <p className="text-4xl font-bold">{totalCandidates}</p>
          </div>

          {/* Average Commission */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <TrendingUp size={28} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2 text-orange-100">Avg. Commission</h3>
            <p className="text-4xl font-bold">
              {totalCandidates > 0 ? formatCurrency(totalEarnings / totalCandidates) : formatCurrency(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-4 border-b-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={24} className="text-blue-600" />
            Earnings Breakdown
          </h2>
        </div>

        {earnings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Earnings Yet</h3>
            <p className="text-gray-500">
              You don't have any submitted candidates yet.
            </p>
            <p className="text-gray-500 mt-2">
              Start submitting candidates to positions to earn commissions!
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Position Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Candidate Name</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">CTC (Lakhs)</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Commission %</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Commission Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {earnings.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-blue-600" />
                          <span className="font-medium text-gray-900">{item.positionName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-600" />
                          <span className="text-gray-700">{item.candidateName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IndianRupee size={16} className="text-gray-600" />
                          <span className="font-semibold text-gray-900">{item.ctcStart}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          <BadgePercent size={14} />
                          <span className="font-semibold">{item.commissionPercent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(item.commissionAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <CheckCircle size={14} />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-green-50 to-blue-50 border-t-2 border-green-200">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-gray-900">Total Estimated Earnings:</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalEarnings)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {earnings.map((item, index) => (
                <div key={index} className="p-4 hover:bg-blue-50/50 transition-colors">
                  <div className="space-y-3">
                    {/* Position & Candidate */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase size={16} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">{item.positionName}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <Users size={14} className="text-gray-600" />
                        <span className="text-sm text-gray-700">{item.candidateName}</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 ml-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">CTC</p>
                        <div className="flex items-center gap-1">
                          <IndianRupee size={14} className="text-gray-600" />
                          <span className="font-semibold text-gray-900">{item.ctcStart}L</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Commission %</p>
                        <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          <BadgePercent size={12} />
                          <span className="font-semibold text-sm">{item.commissionPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Commission Amount */}
                    <div className="ml-6 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Commission Amount</p>
                      <span className="font-bold text-green-600 text-lg">
                        {formatCurrency(item.commissionAmount)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="ml-6">
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        <CheckCircle size={12} />
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Total */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-t-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Estimated Earnings:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(totalEarnings)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Note */}
      {earnings.length > 0 && (
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle size={16} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">About Your Potential Earnings</h4>
              <p className="text-sm text-blue-800">
                These figures show potential earnings from all your submitted candidates who are not rejected. 
                This includes candidates with "Offer Accepted", "Joining", "Joined", and all other pending statuses. 
                The commission is calculated as: <span className="font-semibold">(CTC Start × Commission %)</span>. 
                Actual payouts will be processed when candidates reach "Joined" status.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEarnings;
