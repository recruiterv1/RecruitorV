import React from "react";
import { Link } from "react-router-dom";
import { Users, Award, Lightbulb, Building2, ArrowRight, CheckCircle } from "lucide-react";

const WhoWeServe = () => {
  const roles = [
    {
      icon: Users,
      title: "Recruiter",
      description: "RecruiterV supports freelance recruiters with structure, coaching and clear mandates, handling clients and payouts, linking performance to outcomes, and turning rejections into learning to build accuracy, confidence and long-term capability.",
      knowMoreLink: "/main/area",
      registerLink: "/reg",
      gradient: "from-blue-500 to-blue-600",
      iconBg: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600",
      hoverBorder: "hover:border-blue-400"
    },
    {
      icon: Award,
      title: "Hiring Guru",
      description: "RecruiterV makes coaching core, letting senior recruiters guide mandate clarity, screening and performance, measured by outcomes and closures, while scaling expertise independently across multiple mandates in a structured freelance ecosystem.",
      knowMoreLink: "/coach",
      registerLink: "/reg",
      gradient: "from-orange-500 to-orange-600",
      iconBg: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
      hoverBorder: "hover:border-orange-400"
    },
    {
      icon: Lightbulb,
      title: "Industry Expert",
      description: "RecruiterV embeds industry experts into hiring workflows to validate role fit and expectations, reducing mismatches, improving shortlist quality, and monetising expertise selectively without sourcing involvement, strengthening recruiter and corporate trust.",
      knowMoreLink: "/expert",
      registerLink: "/reg",
      gradient: "from-blue-600 to-purple-600",
      iconBg: "from-blue-100 to-purple-100",
      iconColor: "text-purple-600",
      hoverBorder: "hover:border-purple-400"
    },
    {
      icon: Building2,
      title: "Corporate TA Team",
      description: "RecruiterV provides corporates a governed recruitment ecosystem, coaching freelance recruiters with domain experts, reducing noise, improving shortlist quality and predictability, while managing coordination and accountability with enterprise-grade discipline and freelance flexibility.",
      knowMoreLink: "/corporate",
      registerLink: "/become-partner",
      gradient: "from-orange-600 to-red-600",
      iconBg: "from-orange-100 to-red-100",
      iconColor: "text-red-600",
      hoverBorder: "hover:border-red-400"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <CheckCircle className="w-4 h-4" />
            <span>Built for Everyone</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Who We{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Serve
            </span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            A skill-first recruitment ecosystem designed for recruiters, coaches, domain experts, and companies
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {roles.map((role, index) => {
            const Icon = role.icon;
            
            return (
              <div
                key={index}
                className={`group bg-white rounded-2xl p-6 border-2 border-gray-100 ${role.hoverBorder} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full`}
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`
                }}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${role.iconBg} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 ${role.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {role.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                  {role.description}
                </p>

                {/* Buttons */}
                <div className="space-y-3 mt-auto">
                  {/* Know More Button */}
                  <Link
                    to={role.knowMoreLink}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50`}
                  >
                    <span>Know More</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Register Button */}
                  <Link
                    to={role.registerLink}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${role.gradient} hover:shadow-lg transition-all transform hover:scale-105`}
                  >
                    <span>Register Now</span>
                    <CheckCircle size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {/* <div className="text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Not sure which role fits you?{" "}
            <Link to="/help" className="text-blue-600 hover:text-orange-500 font-semibold underline">
              Get personalized guidance
            </Link>
          </p>
        </div> */}
      </div>

      {/* Animation Styles */}
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
    </section>
  );
};

export default WhoWeServe;
