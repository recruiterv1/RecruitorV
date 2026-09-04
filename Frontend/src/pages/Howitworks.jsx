import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, Search, Upload, DollarSign, ArrowRight } from "lucide-react";

const Howitworks = () => {
  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Register as Recruiter",
      description: "Choose your experience category and create your profile in minutes. It's completely free to join.",
      color: "blue"
    },
    {
      icon: Search,
      step: "02",
      title: "Browse Opportunities",
      description: "Access exclusive job openings from top companies. Filter by location, commission, and urgency.",
      color: "orange"
    },
    {
      icon: Upload,
      step: "03",
      title: "Submit Candidates",
      description: "Upload CVs from your database and submit qualified candidates for positions that match their skills.",
      color: "blue"
    },
    {
      icon: DollarSign,
      step: "04",
      title: "Earn & Grow",
      description: "Get paid competitive commissions for successful placements. Track your earnings in real-time.",
      color: "orange"
    }
  ];

  return (
    <div className="bg-white py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span>Simple Process</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Start your recruitment journey in 4 simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Lines (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1">
            <div className="h-full bg-gradient-to-r from-blue-300 via-orange-300 to-blue-300 opacity-30"></div>
          </div>

          {steps.map((item, index) => {
            const Icon = item.icon;
            const isBlue = item.color === "blue";
            
            return (
              <div
                key={index}
                className="relative group"
                style={{
                  animation: `fadeInScale 0.6s ease-out ${index * 0.15}s both`
                }}
              >
                {/* Step Card */}
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 relative z-10">
                  
                  {/* Step Number Badge */}
                  <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full ${
                    isBlue 
                      ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                      : "bg-gradient-to-br from-orange-500 to-orange-600"
                  } text-white flex items-center justify-center font-bold text-lg shadow-lg`}>
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                    isBlue 
                      ? "bg-gradient-to-br from-blue-100 to-blue-200" 
                      : "bg-gradient-to-br from-orange-100 to-orange-200"
                  } group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${isBlue ? "text-blue-600" : "text-orange-600"}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Arrow (Desktop Only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-8 z-20">
                    <ArrowRight className="w-8 h-8 text-blue-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-8 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Access live hiring needs without chasing clients
            </p>
            <Link
              to="/join"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <span>Register Now</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
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

export default Howitworks;