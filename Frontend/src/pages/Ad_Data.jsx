import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Users, FileText, Clock, XCircle, CheckCircle, Award, RefreshCw } from 'lucide-react';

const Ad_Data = ({ client = null, hrName = null }) => {
  const [stats, setStats] = useState({
    totalPositions: 0,
    totalSubmitted: 0,
    onProcess: 0,
    rejected: 0,
    successful: 0,
    overallScore: "0%"
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics from API
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (client) params.client = client;
      if (hrName) params.hr_name = hrName;

      const response = await axios.get('/candidate/stats', { params });

      if (response.data.success) {
        setStats(response.data.data);
      }

    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [client, hrName]);

  const cardData = [
    { 
      title: "Total Positions", 
      value: stats.totalPositions, 
      color: "from-blue-500 to-blue-600", 
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      icon: FileText,
      trend: "+12%"
    },
    { 
      title: "Total Submitted", 
      value: stats.totalSubmitted, 
      color: "from-purple-500 to-purple-600", 
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      icon: Users,
      trend: "+8%"
    },
    { 
      title: "On Process", 
      value: stats.onProcess, 
      color: "from-orange-500 to-orange-600", 
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      icon: Clock,
      trend: "+15%"
    },
    { 
      title: "Rejected", 
      value: stats.rejected, 
      color: "from-red-500 to-red-600", 
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      icon: XCircle,
      trend: "-5%"
    },
    { 
      title: "Successful", 
      value: stats.successful, 
      color: "from-green-500 to-green-600", 
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      icon: CheckCircle,
      trend: "+20%"
    },
    { 
      title: "Overall Score", 
      value: stats.overallScore, 
      color: "from-yellow-500 to-yellow-600", 
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      icon: Award,
      trend: "+10%"
    }
  ];

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-white border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-700 mb-2">Error Loading Statistics</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      
      {/* Header with Filter Info */}
      {(client || hrName) && (
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Filtered View</h2>
              <div className="flex flex-wrap gap-3">
                {client && (
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Users size={16} />
                    Client: {client}
                  </span>
                )}
                {hrName && (
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Users size={16} />
                    HR: {hrName}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={fetchStats}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all"
            >
              <RefreshCw size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardData.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <div
              key={card.title}
              className="group bg-white shadow-lg hover:shadow-2xl rounded-2xl border-2 border-gray-100 hover:border-blue-200 p-6 transition-all duration-300 transform hover:-translate-y-2"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${card.textColor} uppercase tracking-wide`}>
                  {card.title}
                </h3>
                <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>

              {/* Value */}
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {card.value}
              </p>

              {/* Trend */}
              <div className="flex items-center gap-2">
                {card.trend.startsWith('+') ? (
                  <TrendingUp size={16} className="text-green-600" />
                ) : (
                  <TrendingDown size={16} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.trend} from last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Conversion Metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Conversion Metrics
          </h3>
          <div className="space-y-4">
            {/* Acceptance Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Acceptance Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.totalSubmitted > 0 
                    ? ((stats.successful / stats.totalSubmitted) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalSubmitted > 0 ? ((stats.successful / stats.totalSubmitted) * 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Rejection Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Rejection Rate</span>
                <span className="text-lg font-bold text-red-600">
                  {stats.totalSubmitted > 0 
                    ? ((stats.rejected / stats.totalSubmitted) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalSubmitted > 0 ? ((stats.rejected / stats.totalSubmitted) * 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* In Process Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">In Process</span>
                <span className="text-lg font-bold text-orange-600">
                  {stats.totalSubmitted > 0 
                    ? ((stats.onProcess / stats.totalSubmitted) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalSubmitted > 0 ? ((stats.onProcess / stats.totalSubmitted) * 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-blue-600 to-orange-500 rounded-2xl p-6 shadow-lg text-white">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Award size={20} />
            Quick Insights
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide opacity-90 mb-2">Avg per Position</p>
              <p className="text-3xl font-bold">
                {stats.totalPositions > 0 
                  ? (stats.totalSubmitted / stats.totalPositions).toFixed(1) 
                  : 0}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide opacity-90 mb-2">Success Rate</p>
              <p className="text-3xl font-bold">
                {stats.totalSubmitted > 0 
                  ? ((stats.successful / stats.totalSubmitted) * 100).toFixed(0) 
                  : 0}%
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide opacity-90 mb-2">Active Pipeline</p>
              <p className="text-3xl font-bold">{stats.onProcess}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide opacity-90 mb-2">Overall Score</p>
              <p className="text-3xl font-bold">{stats.overallScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Ad_Data;