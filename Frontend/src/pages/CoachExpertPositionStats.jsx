import React, { useState, useContext } from 'react';
import Sidebar from '../pages/Sidebar';
import { RecruiterPositionStatsContent } from './RecruiterPositionStats';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase, BarChart2, UserPlus } from 'lucide-react';

const CoachExpertPositionStats = () => {
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
        <PositionStatsContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <style>{`
          @keyframes slide-in {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

const PositionStatsContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const { user } = useContext(UserStateContext);
  const isCoach = user?.roleCategory === 'Coach';

  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                My Position Statistics
              </h3>
              <p className="text-sm sm:text-base text-orange-100">
                Positions where you've submitted candidates as {isCoach ? 'Coach' : 'Expert'}
              </p>
            </div>
          </div>

          <RecruiterPositionStatsContent />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CoachExpertPositionStats;
