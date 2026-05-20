import React from "react";
import { Users, Briefcase, Building2, TrendingUp, Award, Clock } from "lucide-react";

const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      value: "1000+",
      label: "Active Recruiters",
      color: "blue",
      description: "Trusted professionals"
    },
    {
      icon: Briefcase,
      value: "5000+",
      label: "Positions Filled",
      color: "orange",
      description: "Successful placements"
    },
    {
      icon: Building2,
      value: "100+",
      label: "Hiring Partners",
      color: "blue",
      description: "Top companies"
    },
    {
      icon: Clock,
      value: "15 Days",
      label: "Avg. Placement Time",
      color: "orange",
      description: "Fast & efficient"
    },
    {
      icon: TrendingUp,
      value: "₹50Cr+",
      label: "Commissions Paid",
      color: "blue",
      description: "To our recruiters"
    },
    {
      icon: Award,
      value: "4.8/5",
      label: "Average Rating",
      color: "orange",
      description: "Customer satisfaction"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands of{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Recruiters
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join India's fastest-growing recruitment community and achieve your career goals
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isBlue = stat.color === "blue";
            
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${
                  isBlue 
                    ? "bg-gradient-to-br from-blue-100 to-blue-200" 
                    : "bg-gradient-to-br from-orange-100 to-orange-200"
                } group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${isBlue ? "text-blue-600" : "text-orange-600"}`} />
                </div>

                {/* Value */}
                <div className={`text-3xl font-bold mb-2 ${
                  isBlue ? "text-blue-700" : "text-orange-700"
                }`}>
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>

                {/* Description */}
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Message */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            <span className="font-semibold text-blue-600">98% of our recruiters</span> recommend RecruiterV to their peers
          </p>
        </div>
      </div>

      <style jsx>{`
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

export default StatsSection;