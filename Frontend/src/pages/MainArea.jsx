import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const userTypes = [
  {
    icon: "🚀",
    title: "I want to freelance full-time",
    description: "Turn recruitment into a predictable, scalable, full-time income stream. Build a sustainable recruitment career with flexibility and control. Access fast-moving mandates selectively shared with a limited number of recruiters, ensuring reduced competition and higher closure potential. Earn performance-driven payouts, with higher rewards for quality submissions. Focus entirely on sourcing and candidate management without the pressure of business development. We operate as your extended team, managing client coordination, interview scheduling, and process follow-ups. Benefit from free support by Recruitment Coaches and Industry Experts to refine search strategies, improve candidate engagement, and enhance closure consistency within a structured, growth-focused ecosystem.",
    href: "/freelance"
  },
  {
    icon: "👜",
    title: "I'm a Corporate Recruiter (Side Income)",
    description: "Turn 1–2 hours a day into a meaningful additional income stream. If you can invest just a small part of your day, RecruiterV enables you to build a consistent side gig without disrupting your primary role. Work on curated mandates while our dedicated Client SPOC manages client coordination, interview scheduling, follow-ups, and offer-stage communication. You receive clear, structured role information in an easily accessible format. Benefit from free support by Recruitment Coaches and Industry Experts to refine your search and engagement strategies. Your focus remains simple — leverage your smart sourcing, candidate engagement skills, and time to generate measurable value and additional earnings.",
    href: "/corporate"
  },
  {
    icon: "🏆",
    title: "I'm a Recruitment Agency",
    description: "Expand your revenue, access quality mandates, and close faster. If your strength lies in sourcing excellence and team management but business development, client coordination, and follow-ups limit your growth, RecruiterV works in your favour. Access curated mandates while our structured ecosystem supports client communication, interview scheduling, and process tracking. Leverage free support from Recruitment Coaches and Industry Experts to sharpen search precision and candidate engagement. Focus your team on what you do best — sourcing and closures — while operational complexities are streamlined. Scale efficiently, diversify revenue streams, and enhance closure consistency without increasing overheads.",
    href: "/established"
  },
  {
    icon: "🔁",
    title: "I want to switch my career to Recruitment",
    description: "Transition confidently into recruitment with structured opportunities and expert guidance. Move into recruitment with clarity, stability, and reduced risk. Gain exposure to real mandates and practical workflows without the pressure of business development. RecruiterV supports you with curated opportunities while ensuring payouts within 30 days of candidate joining, helping you manage financial priorities during your transition. Receive free support from Recruitment Coaches and Industry Experts to develop effective search strategies and candidate engagement skills. Build capability, credibility, and income potential within a structured ecosystem designed to accelerate your recruitment career journey.",
    href: "/switch-career"
  },
  {
    icon: "⏸️",
    title: "I'm restarting after a career break",
    description: "Rebuild your professional identity with flexible, performance-driven work. Return to recruitment with flexibility, confidence, and relevance. Work at your pace on meaningful mandates with performance-based rewards. Access free guidance from Recruitment Coaches and Industry Experts to sharpen search techniques and engagement skills. Rebuild confidence, restore momentum, and re-establish credibility within a stable, outcomes-focused ecosystem.",
    href: "/restart"
  },
  {
    icon: "🎓",
    title: "I am a Fresher",
    description: "Start your first professional income with real roles, real learning, and real growth. Begin your recruitment journey with practical exposure instead of theory. Work on real mandates while building core hiring skills and market credibility. Receive coaching and guidance from Recruitment Coaches and experienced industry professionals to develop strong search strategies and effective candidate engagement. RecruiterV enables you to earn while pursuing your passions, exploring career paths, or preparing for higher studies. Build experience, confidence, and income simultaneously within a structured ecosystem designed to accelerate your professional journey.",
    href: "/fresher"
  },
  {
    icon: "⏳",
    title: "Short-Term Engagement",
    description: "Bridge your career transition with flexible, short-term recruitment opportunities. Engage with RecruiterV for interim assignments while exploring your next full-time role. Work on real mandates, generate income, and stay professionally active without long-term commitments. Benefit from free support by Recruitment Coaches and Industry Experts to refine search strategies and candidate engagement. You retain portal access even if you pause your activity, allowing you to track candidates and maintain continuity. The relationship remains entirely flexible — resume, pause, or re-engage anytime based on your career priorities.",
    href: "/short-term"
  }
];

const MainArea = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center px-4 py-10">
      <div className="text-center max-w-3xl mb-10">
        <h1 className="text-3xl font-semibold text-blue-600 tracking-wide">RecruiterV</h1>
        <h2 className="text-4xl md:text-5xl font-bold mt-6 text-slate-800">
          Who are you?
        </h2>
        <p className="mt-3 text-slate-500 text-lg">
          Let RecruiterV work for you.
        </p>
      </div>

      {/* Single Comprehensive Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-blue-100 shadow-lg rounded-3xl p-8 max-w-5xl w-full"
      >
        {/* User Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {userTypes.map((type, i) => (
            <Link key={i} to={type.href} className="block">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="h-full bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{type.icon}</span>
                  <h3 className="text-lg font-semibold text-slate-800">{type.title}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">{type.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="border-t border-blue-100 pt-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📋</span>
              </div>
              <h4 className="font-semibold text-slate-700 mb-2">Access verified, active hiring roles</h4>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎯</span>
              </div>
              <h4 className="font-semibold text-slate-700 mb-2">Choose one role at a time (or as many as you can do justice to)</h4>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">⚡</span>
              </div>
              <h4 className="font-semibold text-slate-700 mb-2">Work with consistency on the role you select</h4>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">✅</span>
              </div>
              <h4 className="font-semibold text-slate-700 mb-2">Submit carefully screened, role-relevant profiles</h4>
            </div>
          </div>
        </div>

        {/* Quality Policy */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h4 className="font-bold text-amber-800 mb-2">📌 Quality Policy</h4>
          <p className="text-amber-900">
            For every position, each recruiter may submit a maximum of <strong>3 CVs</strong>.
          </p>
        </div>

        {/* How You're Measured */}
        <div className="border-t border-blue-100 pt-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">How You're Measured</h3>
          <div className="text-center">
            <p className="text-slate-600 mb-3">
              Performance is measured through your <strong>CV Selection Ratio</strong> — the percentage of your submissions shortlisted by the client.
            </p>
            <p className="text-slate-500 text-lg font-medium">
              Fewer, better submissions lead to better outcomes.
            </p>
          </div>
        </div>

        {/* How You're Compensated */}
        <div className="border-t border-blue-100 pt-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">How You're Compensated</h3>
          <p className="text-slate-600 text-center mb-6">
            Recruiters earn <strong>30% – 50%</strong> of RecruiterV's realized client revenue (Typical client fees range between 6% – 15% of Annual Fixed CTC)
          </p>
          
          {/* Commission Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">50%</div>
              <p className="text-slate-700 font-medium">for 70%+ selection ratio</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
              <p className="text-slate-700 font-medium">for 60–69% selection ratio</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-slate-600 mb-2">30%</div>
              <p className="text-slate-700 font-medium">for 50–59% selection ratio</p>
            </div>
          </div>

          {/* Bonus Commission */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
            <p className="text-purple-900">
              🎯 <strong>2 or more candidate joinings in a month</strong> → additional 10% commission
            </p>
          </div>
        </div>

        {/* Payment Cycle */}
        <div className="border-t border-blue-100 pt-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Payment Cycle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-semibold text-slate-800">50% after the candidate completes 1 month</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold text-slate-800">50% after 90 days</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Link
        to="/pricing"
        className="mt-10 text-blue-600 hover:text-blue-700 font-medium"
      >
        Compare all plans and pricing →
      </Link>
    </div>
  );
};

export default MainArea;

