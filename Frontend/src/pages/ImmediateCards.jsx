import React, { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, BadgePercent, MapPin, IndianRupee, Timer, TrendingUp, Zap } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

const ImmediateCards = () => {
  const [timea, setTimea] = useState([]);
  const [drives, setDrives] = useState([]);
  const [fastres, setFastres] = useState([]);
  const [commison, setCommison] = useState([]);
  const [activeTab, setActiveTab] = useState("immediate");
  const [openPOP, setOpenPOP] = useState(false);

  useEffect(() => {
    // Immediate Resume Requests
    axios.get("/candidate/time/candi")
      .then((res) => setTimea(res.data))
      .catch((error) => console.log(error));

    // Interview Drives
    axios.get("/candidate/drives/candi")
      .then((res) => setDrives(res.data))
      .catch((error) => console.log(error));

    // Fast Response
    axios.get("/candidate/fastresponse/candi")
      .then((res) => setFastres(res.data))
      .catch((error) => console.log(error));

    // High Commission
    axios.get("/candidate/commison/candi")
      .then((res) => setCommison(res.data))
      .catch((error) => console.log(error));
  }, []);

  const formatCommission = (job) => {
    if (!job.commison) return null;
    if (job.ctcStart) {
      const commissionValue = ((Number(job.ctcStart) * Number(job.commison)) / 100).toLocaleString("en-IN");
      return `₹${commissionValue}`;
    }
    return `${job.commison}% Commission`;
  };

  const tabs = [
    { id: "immediate", label: "Immediate Hiring", icon: AlertTriangle, count: timea.length },
    { id: "drives", label: "Interview Drives", icon: CalendarDays, count: drives.length },
    { id: "fastresponse", label: "Fast Response", icon: Timer, count: fastres.length },
    { id: "highcommission", label: "High Commission", icon: TrendingUp, count: commison.length },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case "immediate": return timea;
      case "drives": return drives;
      case "fastresponse": return fastres;
      case "highcommission": return commison;
      default: return [];
    }
  };

  const getTabIcon = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.icon || AlertTriangle;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-3">
            <Zap size={16} />
            <span>Urgent Opportunities</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Act Fast, Earn{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              More
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Time-sensitive positions with premium commissions
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? "bg-white/20" : "bg-blue-100 text-blue-700"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getActiveData().map((job, index) => {
            const Icon = getTabIcon();
            
            return (
              <div
                key={job.id}
                onClick={() => setOpenPOP(true)}
                className="group bg-white border-2 border-gray-100 hover:border-orange-300 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden"
                style={{
                  animation: `fadeInSlide 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Urgent Badge */}
                <div className="absolute top-0 right-0 bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl flex items-center gap-1">
                  <Icon size={12} />
                  <span>URGENT</span>
                </div>

                {/* Position */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 pr-24 line-clamp-1">
                  {job.position}
                </h3>

                {/* Client */}
                {job.client && (
                  <div className="text-blue-600 text-sm font-semibold mb-4">
                    {job.client}
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Location */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <span className="truncate">{job.location.join(", ")}</span>
                  </div>

                  {/* Salary */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <IndianRupee size={16} className="text-green-600" />
                    </div>
                    <span className="truncate">
                      ₹{Number(job.ctcStart).toLocaleString("en-IN")} – ₹{Number(job.ctcEnd).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Commission */}
                {job.commison && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-center text-orange-700 font-bold">
                      <BadgePercent size={20} className="mr-2" />
                      <span className="text-lg">{formatCommission(job)}</span>
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                  Apply Now
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {getActiveData().length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No positions available
            </h3>
            <p className="text-gray-500">
              Check back soon for new opportunities
            </p>
          </div>
        )}
      </div>

      {/* Registration Popup */}
      {openPOP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl text-center transform scale-100 animate-popIn">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-orange-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Are you registered?
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in to apply for this urgent position
            </p>

            <div className="flex flex-col gap-3">
              <Link
                to="/log_rec"
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Yes, I'm Registered
              </Link>

              <Link
                to="/reg"
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                No, Register Me
              </Link>
            </div>

            <button
              onClick={() => setOpenPOP(false)}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-popIn {
          animation: popIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImmediateCards;