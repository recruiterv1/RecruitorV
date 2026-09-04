import React from "react";
import { Link } from "react-router-dom";
import { Target, Shield, Zap, TrendingUp, Users, Award, CheckCircle} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Target,
      title: "Targeted Job Matching",
      description: "AI-powered matching connects you with the most relevant opportunities based on your expertise.",
      color: "blue"
    },
    {
      icon: TrendingUp,
      title: "Competitive Commissions",
      description: "Earn industry-leading commissions on every successful placement you make.",
      color: "orange"
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Get instant notifications for new job postings and application status changes.",
      color: "blue"
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "Protected transactions and transparent commission tracking give you peace of mind.",
      color: "orange"
    },
    {
      icon: Users,
      title: "Strong Network",
      description: "Join a community of 5000+ professional recruiters and share best practices.",
      color: "blue"
    },
    {
      icon: Award,
      title: "Recognition Programs",
      description: "Top performers get featured, bonuses, and exclusive access to premium clients.",
      color: "orange"
    }
  ];

  return (
    <div className="bg-white py-20 px-4 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <CheckCircle size={16} />
            <span>Platform Benefits</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              RecruiterV?
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Everything you need to succeed as a professional recruiter, all in one platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isBlue = feature.color === "blue";
            
            return (
              <div
                key={index}
                className={`
                  group relative bg-gradient-to-br ${
                    isBlue 
                      ? "from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400" 
                      : "from-orange-50 to-orange-100 border-orange-200 hover:border-orange-400"
                  }
                  border-2 rounded-2xl p-8
                  hover:shadow-2xl transform hover:-translate-y-2
                  transition-all duration-300 cursor-pointer overflow-hidden
                `}
                style={{
                  animation: `fadeInScale 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle, ${isBlue ? '#2563eb' : '#f97316'} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>

                {/* Icon */}
                <div className={`relative w-16 h-16 ${
                  isBlue ? "bg-blue-600" : "bg-orange-500"
                } bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg z-10`}>
                  <Icon className={`w-8 h-8 ${isBlue ? "text-blue-600" : "text-orange-600"}`} />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className={`absolute bottom-0 right-0 w-32 h-32 ${
                  isBlue ? "bg-blue-200" : "bg-orange-200"
                } rounded-full translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform duration-500 opacity-20`}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Experience These Benefits?
            </h3>
            <p className="mb-6 text-blue-50">
              Join thousands of recruiters who are already succeeding with RecruiterV
            </p>
            <Link
              to="/join"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>Get Started </span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Features;