import React, { useState, useContext } from 'react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase, BarChart2, UserPlus } from 'lucide-react';

import Dash_Pos from '../pages/Dash_Pos';

const Dash_Position = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useContext(UserStateContext);

  

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
        <SidebarContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <style>{`
          @keyframes slide-in {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
          * { transition-property: margin, padding, width; transition-duration: 300ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

// Orange sidebar for Coach/Expert users
const SidebarContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);

  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full transition-all duration-300">
          <div id="positions" className="mb-6 scroll-mt-20">
            <Dash_Pos />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dash_Position;
