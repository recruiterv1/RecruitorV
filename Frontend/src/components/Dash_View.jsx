import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Dash_See from '../pages/Dash_See';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import ClientSpocSidebar from './Dash_View_ClientSpocSidebar';
import axios from 'axios';
import { LayoutDashboard, ClipboardList } from 'lucide-react';

// Coach/Expert Sidebar Component (copied from CoachExpertDashboard)
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

const Dash_View = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isShareView = searchParams.get('view') === 'share';
  const { user } = useContext(UserStateContext);
  const [isSidebarMounted, setIsSidebarMounted] = useState(false);

  // Check if user is Coach or Expert or ClientSPOC
  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isCoachOrExpert = isCoach || isExpert;

  // Set mounted state after hydration to avoid SSR issues
  useEffect(() => {
    setIsSidebarMounted(true);
  }, []);

  // Determine which sidebar to render - use regular sidebar while loading
  const renderSidebar = () => {
    if (!isSidebarMounted || !user) {
      // Show regular sidebar while loading or no user
      return <Sidebar />;
    }
    if (isClientSpoc) {
      return <ClientSpocSidebar />;
    }
    if (isCoachOrExpert) {
      return <CoachExpertSidebar />;
    }
    return <Sidebar />;
  };

  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-gray-50 relative ${isShareView ? '' : ''}`}>
        
        {/* ========== SIDEBAR - DESKTOP (HIDE IN SHARE VIEW ONLY) ========== */}
        {!isShareView && (
          <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
            {renderSidebar()}
          </aside>
        )}

        {/* ========== SIDEBAR - MOBILE OVERLAY (HIDE IN SHARE VIEW ONLY) ========== */}
        {!isShareView && isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              {renderSidebar()}
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA (SYNCED WITH SIDEBAR) ========== */}
        <SidebarContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isShareView={isShareView} isCoachOrExpert={isCoachOrExpert} isClientSpoc={isClientSpoc} />

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

          /* Smooth transition for all content */
          * {
            transition-property: margin, padding, width;
            transition-duration: 300ms;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

// Helper component to handle dynamic padding based on sidebar state
const SidebarContentWrapper = ({ isSidebarOpen, setIsSidebarOpen, isShareView, isCoachOrExpert, isClientSpoc }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  
  return (
    <div 
      className={`transition-all duration-300 ${
        isShareView ? '' : (isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')
      }`}
    >
      {/* ========== HEADER (STICKY) - HIDE IN SHARE VIEW ONLY ========== */}
      {!isShareView && (
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen">
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full transition-all duration-300 ${isShareView ? 'py-4' : ''}`}>
          
          <div className={isShareView ? '' : 'mb-6'}>
            <Dash_See />
          </div>

        </div>
      </main>

      {/* ========== FOOTER (HIDE IN SHARE VIEW ONLY) ========== */}
      {!isShareView && <Footer />}
    </div>
  );
};

export default Dash_View;


