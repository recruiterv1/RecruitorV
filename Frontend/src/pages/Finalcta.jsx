import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Target, 
  Shield,
  Star
} from "lucide-react";

const Finalcta = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({ clients: 0, positions: 0 });
  
  useEffect(() => {
    setIsVisible(true);
    // Animate counts
    const duration = 2000;
    const steps = 60;
    const increment = 20 / steps;
    const increment2 = 500 / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setCounts({
        clients: Math.min(20, Math.round(currentStep * increment)),
        positions: Math.min(500, Math.round(currentStep * increment2))
      });
      if (currentStep >= steps) clearInterval(timer);
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, []);

  const benefits = [
    { icon: Target, text: "Work on verified, live hiring mandates", color: "from-green-400 to-green-600" },
    { icon: Shield, text: "Limited competition per role — no CV dumping", color: "from-blue-400 to-blue-600" },
    { icon: Star, text: "Submit fewer, higher-quality CVs", color: "from-orange-400 to-orange-600" },
    { icon: Sparkles, text: "Get easy support from recruitment coaches & industry experts", color: "from-purple-400 to-purple-600" }
  ];

  return (
    <div className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 overflow-hidden min-h-screen flex items-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Blobs */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-4xl opacity-15 animate-blob"></div>
        <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-orange-400 rounded-full mix-blend-multiply filter blur-4xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-4xl opacity-15 animate-blob animation-delay-4000"></div>
        
        {/* Additional Animated Particles */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-orange-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-60 animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-5 h-5 bg-white rounded-full animate-pulse opacity-40 animation-delay-200"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        {/* Badge */}
        <div className={`flex justify-center mb-8 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:scale-105 transition-transform duration-300 cursor-pointer">
            <Zap size={18} className="text-orange-400 animate-pulse" />
            <span>Join Team of Successful Recruiters</span>
            <Sparkles size={14} className="text-orange-400" />
          </div>
        </div>

        {/* Headline */}
        <h2 className={`text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight text-center mb-8 transition-all duration-1000 delay-200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          Recruitment Gigs <br />
          <span className="text-2xl">That Work for</span><br />
          <span className="relative inline-block">
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500">
              Recruiters & Hiring Companies
            </span>
            <span className="absolute bottom-0 left-0 w-full h-3 bg-orange-400/30 -z-0 transform -rotate-1"></span>
          </span>
        </h2>

        {/* Subheadline */}
        <p className={`text-xl text-blue-100 leading-relaxed text-center max-w-4xl mx-auto mb-12 transition-all duration-1000 delay-400 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          Join India's fastest-growing recruitment community where recruiters' submissions are capped, 
          recruitment coaches and domain experts screen CVs to ensure better shortlists and faster closures.
        </p>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className={`text-white space-y-8 transition-all duration-1000 delay-600 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Benefits List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/15 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
                  style={{
                    animation: `fadeInLeft 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon size={22} className="text-white" />
                  </div>
                  <span className="text-white font-medium text-sm lg:text-base leading-tight">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/check-eligibility"
                className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-white to-blue-50 text-blue-950 px-8 py-5 rounded-2xl font-bold text-lg hover:from-blue-50 hover:to-white transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Shine Effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                <span className="relative z-10 flex items-center gap-3">
                  <span>Get Started</span>
                  <ArrowRight size={24} className="group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
                </span>
              </Link>
              
              <Link
                to="/log_rec"
                className="group relative inline-flex items-center justify-center gap-3 bg-transparent border-2 border-white/40 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 backdrop-blur-sm"
              >
                <span className="relative z-10">Sign In</span>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
              </Link>
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center gap-6 pt-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 border-4 border-blue-950 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 hover:z-10 transition-transform duration-300 cursor-pointer"
                    style={{
                      transform: `translateX(-${i * 8}px)`
                    }}
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 border-4 border-blue-950 flex items-center justify-center text-white font-bold text-sm shadow-lg hover:scale-110 hover:z-10 transition-transform duration-300 cursor-pointer flex items-center justify-center">
                  <span className="text-xs">+2K</span>
                </div>
              </div>
              <div className="text-blue-100">
                <div className="font-bold text-white text-lg">Join our community</div>
                <div className="flex items-center gap-1 text-sm text-blue-200">
                  <Star size={14} className="text-orange-400 fill-orange-400" />
                  <span>2000+ recruiters already earning</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Stats Cards */}
          <div className="grid grid-cols-2 gap-5">
            {/* Stat Card 1 */}
            <div
              className="group relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-7 border border-white/20 hover:border-orange-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Users className="text-white" size={32} />
                </div>
                <div className="text-5xl font-bold text-white mb-2 tabular-nums">{counts.clients}+</div>
                <div className="text-blue-200 font-medium">Active Clients</div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-3 right-3 w-3 h-3 bg-orange-400/50 rounded-full animate-pulse"></div>
            </div>

            {/* Stat Card 2 */}
            <div
              className="group relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-7 border border-white/20 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <TrendingUp className="text-white" size={32} />
                </div>
                <div className="text-5xl font-bold text-white mb-2 tabular-nums">{counts.positions}+</div>
                <div className="text-blue-200 font-medium">Available Positions</div>
              </div>
              <div className="absolute top-3 right-3 w-3 h-3 bg-blue-400/50 rounded-full animate-pulse"></div>
            </div>

            {/* Stat Card 3 */}
            <div
              className="group relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-7 border border-white/20 hover:border-green-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <div className="text-5xl font-bold text-white mb-2">100%</div>
                <div className="text-blue-200 font-medium">Response in 24Hrs</div>
              </div>
              <div className="absolute top-3 right-3 w-3 h-3 bg-green-400/50 rounded-full animate-pulse"></div>
            </div>

            {/* Stat Card 4 */}
            <div
              className="group relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-7 border border-white/20 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-orange-400 to-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <Zap className="text-white" size={32} />
                </div>
                <div className="text-5xl font-bold text-white mb-2">₹6L to ₹60L</div>
                <div className="text-blue-200 font-medium">CTC Range</div>
              </div>
              <div className="absolute top-3 right-3 w-3 h-3 bg-orange-400/50 rounded-full animate-pulse"></div>
            </div>
          </div>

        </div>

        {/* Floating Card Effect */}
        <div className="absolute top-1/4 right-[-100px] hidden xl:block">
          <div className="bg-gradient-to-br from-orange-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <div className="font-bold">Quick Response</div>
                <div className="text-sm text-blue-200">Avg. 2 hours</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col items-center gap-2 text-white/50">
            <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-blob {
          animation: blob 10s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Finalcta;

