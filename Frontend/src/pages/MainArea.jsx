import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";


const options = [
  {
    icon: "🎓",
    title: "I am a Fresher / College Pass-out",
    href: "/fresher"
  },
  {
    icon: "🔁",
    title: "I want to switch my career to Recruitment",
    href: "/switch-career"
  },
  {
    icon: "👜",
    title: "I'm a Corporate Recruiter (Side Income)",
    href: "/corporate"
  },
  {
    icon: "⏸️",
    title: "I'm restarting after a career break",
    href: "/restart"
  },
  {
    icon: "🚀",
    title: "I want to freelance full-time",
    href: "/freelance"
  },
  {
    icon: "🏆",
    title: "I'm an established freelance recruiter",
    href: "/established"
  },
];

const MainArea=()=>{
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center px-4 py-10">
      <div className="text-center max-w-3xl">
        <h1 className="text-3xl font-semibold text-blue-600 tracking-wide">RecruiterV</h1>
        <h2 className="text-4xl md:text-5xl font-bold mt-6 text-slate-800">
          Who are you?
        </h2>
        <p className="mt-3 text-slate-500 text-lg">
          Let RecruiterV work for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-6xl w-full">
        {options.map((opt, i) => (
        <Link
          key={i}
          to={opt.href}
          className="flex"
        >
          <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-5 bg-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 cursor-pointer w-full"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 text-2xl">
              {opt.icon}
            </div>
            <p className="text-slate-700 font-medium leading-snug">{opt.title}</p>
          </motion.div>
        </Link>
        ))}
      </div>

      <Link
        to="/pricing"
        className="mt-28 text-blue-600 hover:text-blue-700 font-medium"
      >
        Compare all plans and pricing →
      </Link>
    </div>
  );
}
export default MainArea;