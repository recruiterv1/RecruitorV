import React, { useState, useContext, useEffect } from 'react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase } from 'lucide-react';

const CoachExpertDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">

        {/* ========== SIDEBAR - DESKTOP ========== */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <CoachExpertSidebar />
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
              <CoachExpertSidebar />
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
const CoachExpertSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleCollapse = () => {
    setIsSidebarCollapsed(!isCollapsed);
  };

  const isActive = (path) => location.pathname === path;

  // Determine if user is Coach or Expert
  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';

  // Menu items for Coach/Expert
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: isCoach ? '/coach-dashboard' : '/expert-dashboard',
      badge: null
    },
    {
      icon: ClipboardList,
      label: 'All Requests',
      path: isCoach ? '/coach-requests' : '/expert-requests',
      badge: null
    }
  ];

  return (
    <div
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-orange-600 to-orange-800 transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`}
      style={{ height: '100%' }}
    >
      {/* ========== LOGO SECTION ========== */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-orange-500/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src="https://www.recruiterv.com/recruitorV.png"
                alt="RecruiterV Logo"
                className="w-auto object-contain"
                style={{ height: '100%' }}
              />
            </div>
          )}

          {isCollapsed && (
            <img
              src="https://www.recruiterv.com/recruitorV.png"
              alt="RecruiterV Logo"
              className="w-auto object-contain mx-auto"
              style={{ height: '100%' }}
            />
          )}

          <button
            onClick={toggleCollapse}
            className={`p-2 text-white hover:bg-orange-500 rounded-lg transition-colors flex-shrink-0 ${
              isCollapsed ? 'mx-auto mt-4' : ''
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ========== USER PROFILE SECTION ========== */}
      <div className="flex-shrink-0 p-4 border-b border-orange-500/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user?.name || (isCoach ? 'Coach' : 'Expert')}
              </p>
              <p className="text-orange-200 text-xs truncate">
                {isCoach ? 'Career Coach' : 'Industry Expert'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== NAVIGATION MENU ========== */}
      <nav className="flex-1 py-4 sm:py-6 px-3 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative w-full text-left ${
                    active
                      ? 'bg-white text-orange-600 shadow-lg'
                      : 'text-orange-100 hover:bg-orange-500/50 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />

                  {!isCollapsed && (
                    <span className="font-medium text-sm flex-1 truncate">
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ========== LOGOUT BUTTON ========== */}
      <div className="flex-shrink-0 p-4 border-t border-orange-500/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-orange-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

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

// Import useLocation for the Sidebar component
import { useLocation } from 'react-router-dom';

export default CoachExpertDashboard;

