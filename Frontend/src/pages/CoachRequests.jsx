import React, { useState, useContext, useEffect } from 'react';
import CoachExpertRequests from '../components/CoachExpertRequests';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase, BarChart2, UserPlus } from 'lucide-react';

const CoachRequests = () => {
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
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <Sidebar />
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA ========== */}
        <CoachRequestsContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

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
// Main Content Wrapper for Requests Page
const CoachRequestsContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const { user } = useContext(UserStateContext);
  
  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';

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

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {isCoach ? 'Coach' : 'Expert'} Requests
                  </h3>
                  <p className="text-sm sm:text-base text-orange-100">
                    Manage help requests from recruiters. Accept or reject requests based on your availability.
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

          {/* Coach Expert Requests Component */}
          <CoachExpertRequests />

        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

export default CoachRequests;
