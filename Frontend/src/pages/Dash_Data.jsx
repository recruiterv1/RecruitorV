import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Award, Target, AlertCircle, Briefcase, Users } from "lucide-react";
import { UserStateContext } from "../context/AuthPro";

const Dash_Data = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(UserStateContext);

  useEffect(() => {
    if (user?.email) {
      axios.get("/recruiterstats/dashboard", {
        withCredentials: true,
        params: { recruiterId: user.email }
      })
      .then(res => {
        // Extract the actual stats data from the response
        if (res.data && res.data.success && res.data.data) {
          setStats(res.data.data);
          setError(null);
        } else {
          setError("Invalid response format from server");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stats:", err);
        // Extract error message from response if available
        const errorMessage = err.response?.data?.message || err.message || "Failed to load stats";
        setError(errorMessage);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-center text-gray-700 font-medium mb-2">Unable to load stats</p>
        <p className="text-center text-gray-500 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return <p className="text-center py-10 text-gray-500">No stats available</p>;

  // Generate star rating for performance score
  const generateStars = (score) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < score) {
        stars.push(<Award key={i} size={16} className="fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<Award key={i} size={16} className="fill-gray-300 text-gray-300" />);
      }
    }
    return stars;
  };

  const cardData = [
    {
      title: "Active Candidates",
      value: stats.activeCandidates || 0,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "+12%",
      changeType: "increase"
    },
    {
      title: "To be Scheduled",
      value: stats.scheduledCandidates || 0,
      icon: Target,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+8%",
      changeType: "increase"
    },
    {
      title: "Feedback Pending",
      value: stats.feedbackCandidates || 0,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "+5%",
      changeType: "increase"
    },
    {
      title: "Positions Submitted",
      value: stats.positionsSubmitted || 0,
      icon: Briefcase,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      change: "+15%",
      changeType: "increase"
    },
    {
      title: "Total Positions",
      value: stats.totalPositions || 0,
      icon: TrendingUp,
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      change: "+10%",
      changeType: "increase"
    },
    {
      title: "Positions Without Candidates",
      value: stats.positionsWithoutCandidates || 0,
      icon: XCircle,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      change: "-5%",
      changeType: "decrease"
    },
  ];

  return (
    <div className="w-full py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cardData.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
            >
              {/* Gradient Top Bar */}
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
              
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg}`}>
                    <Icon className={`${card.iconColor} w-6 h-6`} />
                  </div>
                  
                  {/* Change Indicator */}
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.changeType === 'increase' ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    <span>{card.change}</span>
                  </div>
                </div>

                {/* Value */}
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>

                {/* Title */}
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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

export default Dash_Data;
