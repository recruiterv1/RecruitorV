// import React from "react";
// import { Check, X, Zap, Shield, DollarSign, Users, HeadphonesIcon, Award, Star } from "lucide-react";

// const WhyChooseUs = () => {
//   const benefits = [
//     {
//       icon: DollarSign,
//       title: "No Registration Fee",
//       description: "Start for free, no hidden costs",
//       highlight: "₹0 to join"
//     },
//     {
//       icon: Users,
//       title: "Direct Client Access",
//       description: "No middlemen, work directly with clients",
//       highlight: "100+ companies"
//     },
//     {
//       icon: Zap,
//       title: "Fast Payments",
//       description: "Get paid within 7 days of placement",
//       highlight: "7-day payout"
//     },
//     {
//       icon: HeadphonesIcon,
//       title: "Training & Support",
//       description: "Free resources and dedicated support",
//       highlight: "24/7 help"
//     },
//     {
//       icon: Shield,
//       title: "Flexible Work",
//       description: "Work from anywhere, anytime",
//       highlight: "100% remote"
//     },
//     {
//       icon: Award,
//       title: "Community",
//       description: "Connect with 1000+ recruiters",
//       highlight: "Active network"
//     }
//   ];

//   return (
//     <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 py-20 px-4 sm:px-6">
//       <div className="max-w-7xl mx-auto">
        
//         {/* Section Header */}
//         <div className="text-center mb-16">
//           <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
//             <Star className="w-4 h-4 fill-current" />
//             <span>Why We're Different</span>
//           </div>
//           <h2 className="text-4xl font-bold text-gray-900 mb-4">
//             Why Choose{" "}
//             <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
//               RecruiterV?
//             </span>
//           </h2>
//           <p className="text-gray-600 text-lg max-w-2xl mx-auto">
//             We're not just another recruitment platform. Here's what sets us apart
//           </p>
//         </div>

//         {/* Benefits Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
//           {benefits.map((benefit, index) => {
//             const Icon = benefit.icon;
//             const isBlue = index % 2 === 0;
            
//             return (
//               <div
//                 key={index}
//                 className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
//                 style={{
//                   animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
//                 }}
//               >
//                 {/* Icon */}
//                 <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 ${
//                   isBlue 
//                     ? "bg-gradient-to-br from-blue-100 to-blue-200" 
//                     : "bg-gradient-to-br from-orange-100 to-orange-200"
//                 } group-hover:scale-110 transition-transform`}>
//                   <Icon className={`w-7 h-7 ${isBlue ? "text-blue-600" : "text-orange-600"}`} />
//                 </div>

//                 {/* Content */}
//                 <h3 className="text-xl font-bold text-gray-900 mb-2">
//                   {benefit.title}
//                 </h3>
//                 <p className="text-gray-600 mb-4">
//                   {benefit.description}
//                 </p>

//                 {/* Highlight Badge */}
//                 <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
//                   isBlue 
//                     ? "bg-blue-100 text-blue-700" 
//                     : "bg-orange-100 text-orange-700"
//                 }`}>
//                   <Check size={16} />
//                   <span>{benefit.highlight}</span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Comparison Table */}
//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
//           <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center">
//             <h3 className="text-2xl font-bold text-white mb-2">
//               RecruiterV vs Traditional Platforms
//             </h3>
//             <p className="text-blue-50">See the difference yourself</p>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50">
//                   <th className="text-left p-4 font-semibold text-gray-700">Feature</th>
//                   <th className="text-center p-4 font-semibold text-blue-700">RecruiterV</th>
//                   <th className="text-center p-4 font-semibold text-gray-500">Others</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[
//                   { feature: "Registration Fee", recruiterV: "Free", others: "₹5,000 - ₹50,000" },
//                   { feature: "Commission Rate", recruiterV: "8-12%", others: "4-8%" },
//                   { feature: "Payment Time", recruiterV: "7 days", others: "30-45 days" },
//                   { feature: "Direct Client Access", recruiterV: true, others: false },
//                   { feature: "Free Training", recruiterV: true, others: false },
//                   { feature: "24/7 Support", recruiterV: true, others: false },
//                   { feature: "Community Access", recruiterV: true, others: false },
//                 ].map((row, index) => (
//                   <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
//                     <td className="p-4 font-medium text-gray-700">{row.feature}</td>
//                     <td className="p-4 text-center">
//                       {typeof row.recruiterV === 'boolean' ? (
//                         row.recruiterV ? (
//                           <Check size={24} className="mx-auto text-green-600" />
//                         ) : (
//                           <X size={24} className="mx-auto text-red-500" />
//                         )
//                       ) : (
//                         <span className="text-blue-700 font-semibold">{row.recruiterV}</span>
//                       )}
//                     </td>
//                     <td className="p-4 text-center">
//                       {typeof row.others === 'boolean' ? (
//                         row.others ? (
//                           <Check size={24} className="mx-auto text-green-600" />
//                         ) : (
//                           <X size={24} className="mx-auto text-red-500" />
//                         )
//                       ) : (
//                         <span className="text-gray-500 font-medium">{row.others}</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(30px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default WhyChooseUs;



import React from "react";
import { Link } from "react-router-dom";
import { Check, Zap, Shield, DollarSign, Users, HeadphonesIcon, Award, Star, TrendingUp, Target } from "lucide-react";

const WhyChooseUs = () => {
  const benefits = [
    {
      icon: Users,
      title: "No Business Development Required",
      description: "You don't need to find clients. We bring live mandates to you",
      highlight: "Clients provided"
    },
    {
      icon: HeadphonesIcon,
      title: "We Handle Client Coordination",
      description: "Once you submit a CV, we manage all client follow-ups and communication",
      highlight: "Focus on recruiting"
    },
    {
      icon: Zap,
      title: "Only Urgent, Active Positions",
      description: "We publish positions that clients are actively hiring for - no dormant roles",
      highlight: "Live mandates only"
    },
    {
      icon: DollarSign,
      title: "Faster Payouts for Recruiters",
      description: "Clients may pay us after 90 days, but you get paid within 30 days",
      highlight: "30-day payout"
    },
    {
      icon: Shield,
      title: "100% Transparent Revenue Sharing",
      description: "You know exactly how much the client pays and how much you earn",
      highlight: "Full transparency"
    },
    {
      icon: Target,
      title: "Candidate Ownership Protection",
      description: "Your candidate remains tagged to you for 3 months, even if you stop working with us",
      highlight: "3-month protection"
    },
    {
      icon: Users,
      title: "Free Dedicated Mentoring by Recruitment Coaches",
      description: "Get one-on-one guidance to improve screening, accuracy, and closures",
      highlight: "Expert coaching"
    },
    {
      icon: Award,
      title: "Free Mentoring by Domain Experts",
      description: "Understand roles, functions, and industries better before submitting profiles",
      highlight: "Domain guidance"
    },
    {
      icon: DollarSign,
      title: "Earn on Every CV Submitted",
      description: "Get 5% revenue if any of your CV is used by another recruiter who closes the role",
      highlight: "5% bonus earnings"
    },
    {
      icon: TrendingUp,
      title: "Higher Performance, Higher Earnings",
      description: "Better CV selection leads to higher payouts and more opportunities",
      highlight: "Performance-based"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span>Why We're Different</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              RecruiterV?
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Focus on what you do best - recruiting. We handle everything else.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isBlue = index % 2 === 0;
            
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl ${
                    isBlue 
                      ? "bg-gradient-to-br from-blue-100 to-blue-200" 
                      : "bg-gradient-to-br from-orange-100 to-orange-200"
                  } group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${isBlue ? "text-blue-600" : "text-orange-600"}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {benefit.description}
                    </p>

                    {/* Highlight Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      isBlue 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      <Check size={14} />
                      <span>{benefit.highlight}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* //CTA Section
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to experience the RecruiterV difference?
          </h3>
          <p className="text-blue-100 mb-6 text-sm sm:text-base max-w-2xl mx-auto">
            Join 1000+ recruiters who are already earning with live mandates, expert coaching, and transparent revenue sharing
          </p>
          <Link
            to="/reg"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span>Start Recruiting Today</span>
            <Check size={20} />
          </Link>
        </div> */}
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

export default WhyChooseUs;