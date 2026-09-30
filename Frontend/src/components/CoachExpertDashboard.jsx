import React, { useState, useContext, useEffect, useRef } from 'react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import axios from 'axios';
import MyCertificate from './MyCertificate';
import BriefingGaps from './BriefingGaps';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase, BarChart2, UserPlus, Inbox, AlertTriangle, X, Star, Zap, ArrowRight, Gift } from 'lucide-react';


const CoachExpertDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">

        {/* ========== SIDEBAR - DESKTOP ========== */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <Sidebar />
        </aside>

        {/* ========== SIDEBAR - MOBILE OVERLAY ========== */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <Sidebar />
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA ========== */}
        <CoachExpertContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* ========== ANIMATIONS ========== */}
        <style>{`
          @keyframes slide-in {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

// Coach/Expert Sidebar Component
// Main Content Wrapper
const CoachExpertContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const { user } = useContext(UserStateContext);
  const navigate = useNavigate();
  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';

  // Redirect based on current path
  useEffect(() => {
    if (isCoach && !window.location.pathname.includes('coach')) {
      navigate('/coach-dashboard');
    } else if (isExpert && !window.location.pathname.includes('expert')) {
      navigate('/expert-dashboard');
    }
  }, [isCoach, isExpert, navigate]);

  return (
    <div
      className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}
    >
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full">

          {/* Certification standing — renders nothing unless there is one.
              Serves coaches and experts alike; this component previously sat
              only on the recruiter dashboard, so a certified coach had a
              certificate issued and no way to reach it. */}
          <div className="mb-6"><MyCertificate /></div>

          {/* Assigned but unbriefed positions — silent unless there are some. */}
          <BriefingGaps />

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Welcome back, {user?.name || (isCoach ? 'Coach' : 'Expert')}!
                  </h3>
                  <p className="text-sm sm:text-base text-orange-100">
                    {isCoach
                      ? 'Track your coaching sessions and help professionals advance their careers.'
                      : 'Manage your expert consultations and share your industry knowledge.'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                    user?.userType === 'paid'
                      ? 'bg-white text-orange-600'
                      : 'bg-orange-400 text-white'
                  }`}>
                    {user?.userType === 'paid' ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span className="font-semibold">Premium</span>
                      </>
                    ) : (
                      <span className="font-semibold">Free Plan</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              value="Overview"
              color="blue"
            />
            <StatsCard
              icon={<ClipboardList size={20} />}
              label="All Requests"
              value="View All"
              color="orange"
            />
            <StatsCard
              icon={<DollarSign size={20} />}
              label="Earnings"
              value="₹0"
              color="green"
            />
            <StatsCard
              icon={<TrendingUp size={20} />}
              label="Status"
              value={user?.userType === 'paid' ? 'Premium' : 'Free'}
              color="purple"
            />
          </div>

          {/* Placeholder Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isCoach ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isCoach ? 'Coach Dashboard' : 'Expert Dashboard'}
            </h3>
            <p className="text-gray-600 mb-4">
              Your {isCoach ? 'coaching' : 'consultation'} requests and analytics will appear here.
            </p>
            <button className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all">
              <ClipboardList size={20} />
              View All Requests
            </button>
          </div>

        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default CoachExpertDashboard;
