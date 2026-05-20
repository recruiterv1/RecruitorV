import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, RefreshCw, Building2, Rocket, Laptop, Star, ArrowRight } from "lucide-react";

const CategoryShowCase = () => {
  const categories = [
    {
      icon: GraduationCap,
      emoji: "🎓",
      title: "Freshers & College Pass-outs",
      description: "Perfect for recent graduates entering the recruitment industry with guided onboarding and mentorship.",
      features: ["Free Training", "Mentorship", "Entry-Level Positions"],
      route: "/fresher",
      color: "blue"
    },
    {
      icon: RefreshCw,
      emoji: "🔄",
      title: "Career Switchers",
      description: "Tailored for professionals transitioning into recruitment with skill translation workshops.",
      features: ["Skill Translation", "Industry Insights", "Accelerated Learning"],
      route: "/switch-career",
      color: "orange"
    },
    {
      icon: Building2,
      emoji: "💼",
      title: "Corporate Recruiters",
      description: "Built for in-house recruitment teams with ATS integration and bulk hiring capabilities.",
      features: ["ATS Integration", "Bulk Hiring", "Team Management"],
      route: "/corporate",
      color: "blue"
    },
    {
      icon: Rocket,
      emoji: "🚀",
      title: "Career Restart",
      description: "Supporting professionals returning to recruitment with refresher programs and market updates.",
      features: ["Refresher Programs", "Market Updates", "Flexible Hours"],
      route: "/restart",
      color: "orange"
    },
    {
      icon: Laptop,
      emoji: "💻",
      title: "Full-Time Freelancing",
      description: "Complete freelance infrastructure with client management, invoicing, and project tracking.",
      features: ["Client Management", "Invoicing System", "Networking"],
      route: "/freelance",
      color: "blue"
    },
    {
      icon: Star,
      emoji: "⭐",
      title: "Elite Partner Program",
      description: "Exclusive partnership for established firms with white-label solutions and API access.",
      features: ["White-Label", "API Access", "Dedicated Support"],
      route: "/established",
      color: "orange"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span>Choose Your Path</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Recruiter Category
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We cater to recruiters at every stage of their career journey
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isBlue = category.color === "blue";
            
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-300 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Icon & Emoji */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${
                    isBlue 
                      ? "bg-gradient-to-br from-blue-100 to-blue-200" 
                      : "bg-gradient-to-br from-orange-100 to-orange-200"
                  } group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${isBlue ? "text-blue-600" : "text-orange-600"}`} />
                  </div>
                  <span className="text-4xl">{category.emoji}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {category.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {category.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {category.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isBlue ? "bg-blue-500" : "bg-orange-500"
                      }`}></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to={category.route}
                  className={`group/btn inline-flex items-center gap-2 w-full justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isBlue
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  <span>Learn More</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Not sure which category is right for you?
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-orange-500 font-semibold transition-colors"
          >
            <span>Take Quick Explore </span>
            <ArrowRight size={18} />
          </Link>
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

export default CategoryShowCase;