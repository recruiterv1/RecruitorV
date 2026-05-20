import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  BarChart3,
  UserCheck,
  PlusCircle,
  UserPlus,
  Award,
  GraduationCap,
  UserCog
} from 'lucide-react';

const ClientSpocSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;

  // Handle hash-based navigation to switch tabs in Admin.jsx
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && location.pathname === '/ad_panel') {
      // Hash navigation is handled by Admin.jsx
    }
  }, [location.pathname]);

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

  // Check if a path is active (handles hash-based routes)
  const isActive = (path) => {
    if (path.startsWith('/ad_panel#')) {
      const tabId = path.split('#')[1];
      return location.pathname === '/ad_panel' && location.hash === `#${tabId}`;
    }
    return location.pathname === path;
  };

  // Handle menu item click with hash-based navigation
  const handleMenuClick = (path) => {
    if (path.startsWith('/ad_panel#')) {
      const tabId = path.split('#')[1];
      navigate(`/ad_panel#${tabId}`);
    } else {
      navigate(path);
    }
  };

  // ClientSPOC menu items - using /ad_panel#hash format for tab navigation
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/ad_panel#dashboard'
    },
    {
      icon: Users,
      label: 'Candidates',
      path: '/ad_panel#candidates'
    },
    {
      icon: Briefcase,
      label: 'All Positions',
      path: '/ad_panel#positions'
    },
    {
      icon: Briefcase,
      label: 'My Positions Stat',
      path: '/ad_panel#clientspoc-my-positions'
    },
    {
      icon: PlusCircle,
      label: 'My Added Positions',
      path: '/ad_panel#my-added-positions'
    },
    {
      icon: BarChart3,
      label: 'Candidate Stats',
      path: '/ad_panel#position-stats'
    },
    {
      icon: UserCheck,
      label: 'Access Requests',
      path: '/ad_panel#access-requests'
    },
    {
      icon: PlusCircle,
      label: 'Add Position',
      path: '/ad_panel#add-position'
    },
    {
      icon: UserPlus,
      label: 'Add Coach',
      path: '/ad_panel#add-coach'
    },
    {
      icon: Award,
      label: 'Add Expert',
      path: '/ad_panel#add-expert'
    },
    {
      icon: DollarSign,
      label: 'My Earnings',
      path: '/my-earnings'
    },
    {
      icon: GraduationCap,
      label: 'All Coaches',
      path: '/ad_panel#all-coaches'
    },
    {
      icon: UserCog,
      label: 'All Experts',
      path: '/ad_panel#all-experts'
    }
  ];

  return (
    <div
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`}
      style={{ height: '100%' }}
    >
      {/* ========== LOGO SECTION ========== */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-blue-700/50">
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
            className={`p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0 ${
              isCollapsed ? 'mx-auto mt-4' : ''
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* ========== USER PROFILE SECTION ========== */}
      <div className="flex-shrink-0 p-4 border-b border-blue-700/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-white" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user?.name || 'Client SPOC'}
              </p>
              <p className="text-blue-300 text-xs truncate">
                {user?.email || 'client@example.com'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== NAVIGATION MENU - Scrollable ========== */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative w-full text-left ${
                    active
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />

                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1 truncate">
                        {item.label}
                      </span>
                    </>
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
      <div className="flex-shrink-0 p-4 border-t border-blue-700/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${
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

      {/* ========== CUSTOM SCROLLBAR STYLES ========== */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.3);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default ClientSpocSidebar;

