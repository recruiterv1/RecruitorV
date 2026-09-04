// import React from "react";
// import { Link } from "react-router-dom";
// import { ArrowRight, CheckCircle, Users, Briefcase, TrendingUp } from "lucide-react";

// const SearchBox = () => {
//   return (
//     <section className="relative bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
//       {/* Decorative Background Elements */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
//         <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
//         <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
//       </div>

//       {/* Main Content */}
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
//         <div className="grid lg:grid-cols-2 gap-12 items-center">
          
//           {/* Left Content */}
//           <div className="text-center lg:text-left space-y-8">
//             {/* Badge */}
//             <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
//               <TrendingUp size={16} />
//               <span>India's Fastest-Growing Recruiter Platform</span>
//             </div>

//             {/* Main Headline */}
//             <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
//               Connecting Recruiters with the{" "}
//               <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
//                 Power to Shape
//               </span>{" "}
//               Tomorrow's Workforce
//             </h1>

//             {/* Subheadline */}
//             <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
//               Build meaningful partnerships, access top-tier talent pipelines, and
//               elevate your recruitment success — all within a platform made
//               exclusively for professional recruiters.
//             </p>

//             {/* Trust Indicators */}
//             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-700">
//               <div className="flex items-center gap-2">
//                 <CheckCircle size={20} className="text-green-600" />
//                 <span className="font-medium">1000+ Active Recruiters</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <CheckCircle size={20} className="text-green-600" />
//                 <span className="font-medium">5000+ Positions Filled</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <CheckCircle size={20} className="text-green-600" />
//                 <span className="font-medium">100+ Hiring Partners</span>
//               </div>
//             </div>

//             {/* CTA Buttons */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
//               <Link
//                 to="/check-eligibility"
//                 className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
//               >
//                 <span>Start Your Career</span>
//                 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
//               </Link>
              
//               <Link
//                 to="/log_rec"
//                 className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
//               >
//                 <span>Sign In</span>
//               </Link>
//             </div>
//           </div>

//           {/* Right Image/Illustration */}
//           <div className="relative hidden lg:block">
//             <div className="relative rounded-2xl overflow-hidden shadow-2xl">
//               <img
//                 src="/homepage_banner.png"
//                 alt="Recruiter platform illustration"
//                 className="w-full h-auto object-cover rounded-2xl"
//               />
              
//               {/* Floating Cards */}
//               <div className="absolute top-8 -left-8 bg-white rounded-xl shadow-xl p-4 animate-float">
//                 <div className="flex items-center gap-3">
//                   <div className="bg-blue-100 p-3 rounded-lg">
//                     <Users className="text-blue-600" size={24} />
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-gray-900">1000+</div>
//                     <div className="text-xs text-gray-600">Active Recruiters</div>
//                   </div>
//                 </div>
//               </div>

//               <div className="absolute bottom-8 -right-8 bg-white rounded-xl shadow-xl p-4 animate-float animation-delay-2000">
//                 <div className="flex items-center gap-3">
//                   <div className="bg-orange-100 p-3 rounded-lg">
//                     <Briefcase className="text-orange-600" size={24} />
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-gray-900">5000+</div>
//                     <div className="text-xs text-gray-600">Jobs Posted</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes blob {
//           0%, 100% { transform: translate(0, 0) scale(1); }
//           33% { transform: translate(30px, -50px) scale(1.1); }
//           66% { transform: translate(-20px, 20px) scale(0.9); }
//         }

//         @keyframes float {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-20px); }
//         }

//         .animate-blob {
//           animation: blob 7s infinite;
//         }

//         .animate-float {
//           animation: float 3s ease-in-out infinite;
//         }

//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }

//         .animation-delay-4000 {
//           animation-delay: 4s;
//         }
//       `}</style>
//     </section>
//   );
// };

// export default SearchBox;


import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Users, Briefcase, TrendingUp } from "lucide-react";

const SearchBox = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden min-h-screen flex items-center">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm max-w-full">
              <TrendingUp size={16} className="flex-shrink-0" />
              <span className="leading-tight">RecruiterV is a governed freelance recruitment ecosystem designed for predictable hiring outcomes.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Verified. Virtual. Value.
              </span>
            </h1>

            {/* Subheadline - Stacked paragraphs */}
            <div className="space-y-4 sm:space-y-5">
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Unlike open marketplaces that prioritise volume, RecruiterV focuses on decision quality and process control. We integrate freelance recruiters with recruitment coaches and domain experts to ensure mandate clarity, accurate screening, and continuous feedback.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                RecruiterV manages client coordination, workflow governance, and transparent performance tracking, reducing noise and dependency on individual recruiters. The result is higher-quality shortlists, fewer rejections, and improved hiring confidence.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Built by Changeleaders, RecruiterV combines enterprise recruitment discipline with a flexible, freelance-first model—enabling organisations to scale hiring without compromising quality or accountability.
              </p>
            </div>

            {/* Trust Indicators */}
            {/* <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-gray-700 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">1K+ Active Recruiters</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">5K+ Positions Filled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">80+ Hiring Partners</span>
              </div>
            </div> */}

            {/* CTA Buttons - Commented out as per original */}
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/check-eligibility"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <span>Start Your Career</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/log_rec"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border-2 border-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>Sign In</span>
              </Link>
            </div> */}
          </div>

          {/* Right Image/Illustration */}
          <div className="relative order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/homepage_banner.png"
                alt="Recruiter platform illustration"
                className="w-full h-auto object-cover rounded-2xl"
              />
              
              {/* Floating Cards - Hidden on mobile, visible on tablet+ */}
              <div className="hidden md:block absolute top-4 lg:top-8 -left-4 lg:-left-8 bg-white rounded-xl shadow-xl p-3 lg:p-4 animate-float">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="text-xl lg:text-2xl font-bold text-gray-900">1K+</div>
                    <div className="text-[10px] lg:text-xs text-gray-600">Active Recruiters</div>
                  </div>
                </div>
              </div>

              <div className="hidden md:block absolute bottom-4 lg:bottom-8 -right-4 lg:-right-8 bg-white rounded-xl shadow-xl p-3 lg:p-4 animate-float animation-delay-2000">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
                    <Briefcase className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <div className="text-xl lg:text-2xl font-bold text-gray-900">5K+</div>
                    <div className="text-[10px] lg:text-xs text-gray-600">Jobs Posted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Ensure proper text wrapping on small screens */
        @media (max-width: 640px) {
          .animate-blob {
            animation: blob 10s infinite;
          }
        }
      `}</style>
      
    </section>
  );
};

export default SearchBox;