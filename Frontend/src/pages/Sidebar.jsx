
import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Trophy,
  TrendingUp,
  ClipboardList,
  DollarSign,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { UserStateContext, UserDispatchContext } from '../context/AuthPro';
import {SidebarContext} from '../context/Sidebarcontext';
import axios from 'axios';
import RecruiterPositionStats from './RecruiterPositionStats';
import ClientSpocMyPositions from './ClientSpocMyPositions';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  
  // Get collapse state from shared context
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;
  const setIsCollapsed = setIsSidebarCollapsed || (() => {});

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
      dispatch({ type: "LOGOUT" });
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

// Base menu items for all users
  const baseMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dash_rec',
      badge: null
    },
    {
      icon: Briefcase,
      label: 'Open Positions',
      path: '/dash_position',
      badge: null
    },
    {
      icon: Users,
      label: 'Candidates',
      path: '/dash_candidate',
      badge: null
    },
    {
      icon: TrendingUp,
      label: 'My Position Stats',
      path: '/recruiter-position-stats',
      badge: null
    },
    {
      icon: Briefcase,
      label: 'Assigned Positions',
      path: '/assigned-positions',
      badge: null
    },
    {
      icon: DollarSign,
      label: 'My Earnings',
      path: '/my-earnings',
      badge: null
    }
  ];

  // Coach/Expert menu items - different from recruiter
  const coachExpertMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: null, // Will be determined by role
      dynamicPath: true,
      badge: null
    },
    {
      icon: Users,
      label: 'My Requests',
      path: '/coach-requests',
      badge: null
    },
    {
      icon: DollarSign,
      label: 'My Earnings',
      path: '/my-earnings',
      badge: null
    }
  ];

  // Determine user role
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isCoach = user?.roleCategory?.toLowerCase() === 'coach';
  const isExpert = user?.roleCategory?.toLowerCase() === 'expert';
  const isCoachOrExpert = isCoach || isExpert;

  // Build menu items based on user type
  let menuItems;
  
  if (isCoachOrExpert) {
    // Coach/Expert gets different menu
    const dashboardPath = isCoach ? '/coach-dashboard' : '/expert-dashboard';
    menuItems = [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: dashboardPath,
        badge: null
      },
      {
        icon: Users,
        label: 'My Requests',
        path: '/coach-requests',
        badge: null
      },
      {
        icon: DollarSign,
        label: 'My Earnings',
        path: '/my-earnings',
        badge: null
      }
    ];
  } else if (isClientSpoc) {
    // ClientSPOC menu
    menuItems = [
      ...baseMenuItems,
      {
        icon: Briefcase,
        label: 'My Added Positions',
        path: '/my-added-positions',
        badge: null
      },
      {
        icon: Briefcase,
        label: 'My Positions',
        path: '/clientspoc-my-positions',
        badge: null
      },
      {
        icon: TrendingUp,
        label: 'Position Stats',
        path: '/clientspoc-position-stats',
        badge: null
      }
    ];
  } else {
    // Recruiter menu (default)
    // Add "My Positions" for ClientSPOC users
    const clientSpocMenuItem = isClientSpoc ? [{
      icon: Briefcase,
      label: 'My Positions',
      path: '/clientspoc-my-positions',
      badge: null
    }] : [];

    // Add "My Access Requests" for free users (planType = 0)
    // Hide "My Requests" for free users - all position management is on My Access Requests page
    menuItems = user?.planType === 0 
      ? [
          ...baseMenuItems,
          ...clientSpocMenuItem,
          {
            icon: HelpCircle,
            label: 'Coach / Expert Requests',
            path: '/coach-expert-requests',
            badge: null
          },
          {
            icon: ClipboardList,
            label: 'My Access Requests',
            path: '/my-access-requests',
            badge: null
          }
        ]
      : [
          ...baseMenuItems,
          ...clientSpocMenuItem,
          {
            icon: HelpCircle,
            label: 'Coach / Expert Requests',
            path: '/coach-expert-requests',
            badge: null
          },
          {
            icon: FileText,
            label: 'My Requests',
            path: '/my-requests',
            badge: null
          }
        ];
  }

  const isActive = (path) => {
    if (path.includes('#')) {
      return location.pathname === path.split('#')[0] && location.hash === '#' + path.split('#')[1];
    }
    return location.pathname === path;
  };

  return (
    <div 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-blue-900 to-blue-800 transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`}
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
                {user?.name || 'Recruiter'}
              </p>
              <p className="text-blue-300 text-xs truncate">
                {user?.email || 'recruiter@example.com'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== NAVIGATION MENU ========== */}
      <nav className="flex-1 py-4 sm:py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
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
                      
                      {item.badge && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
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
          <LogOut size={20} className="flex-shrink-0" />
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

export default Sidebar;