import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserStateContext, UserDispatchContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import NotificationContext from '../context/NotificationContext';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PlusCircle,
  Database,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  BarChart3,
  TrendingUp,
  Check,
  CheckCheck,
  UserPlus,
  Award,
  Users as UsersIcon,
  FileText,
  MessageSquare
} from 'lucide-react';
import ChatPanel from './ChatPanel';
import { useChatNotify } from '../context/ChatNotify';

// Import your existing components
import Ad_Data from '../pages/Ad_Data';
import Ad_Candi from '../pages/Ad_Candi';
import Ad_OpenPos from '../pages/Ad_OpenPos';
import Ad_Pos from '../pages/Ad_Pos';
import My_Positions from '../pages/My_Positions';
import AccessRequestsManagement from '../pages/AccessRequestsManagement';
import ClientSpocPositionStats from '../pages/ClientSpocPositionStats';
import ClientSpocSidebar from './Dash_View_ClientSpocSidebar';
import ClientSpocMyPositions from '../pages/ClientSpocMyPositions';
import MyAddedPositions from '../pages/MyAddedPositions';
import RecruiterPositionStats from '../pages/RecruiterPositionStats';
import Footer from '../pages/Footer';
import AddCoach from '../pages/AddCoach';
import AddExpert from '../pages/AddExpert';
import AllCoaches from '../pages/AllCoaches';
import AllExperts from '../pages/AllExperts';
import AllRecruiters from '../pages/AllRecruiters';
import ClientSpocCoachExpertRequests from '../pages/ClientSpocCoachExpertRequests';
import CoachRecruiterAssignmentsAdmin from '../pages/CoachRecruiterAssignmentsAdmin';
import ClientSpocDirectRequests from '../pages/ClientSpocDirectRequests';
import SuperAdminReports from '../pages/SuperAdminReports';
import RecruiterReports from '../pages/RecruiterReports';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);
  
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const { isSidebarCollapsed: ctxSidebarCollapsed } = useContext(SidebarContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { total: chatUnread } = useChatNotify();

  // Check if user is a recruiter (not ClientSPOC or Admin)
  // Show menu items for recruiters only
  const isRecruiter = user?.roleCategory === 'Recruiter';
  
  // Check if user is ClientSPOC (case-insensitive check)
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  
  // Check if user is Admin or SuperAdmin
  const isAdmin = user?.roleCategory === 'Admin' || user?.roleCategory === 'SuperAdmin';

  // Handle hash-based navigation from ClientSpocSidebar
  useEffect(() => {
    if (location.hash) {
      const tabId = location.hash.slice(1);
      // ClientSPOC tabs that should be accessible via hash
      const clientSpocTabs = [
        'dashboard', 'messages', 'candidates', 'positions',
        'clientspoc-my-positions', 'my-added-positions', 'position-stats',
        'access-requests', 'add-position', 'add-coach', 'add-expert',
        'all-coaches', 'all-experts', 'all-recruiters', 'coach-expert-requests',
        'direct-coach-expert-requests', 'coach-recruiter-assignments'
      ];
      // Recruiter tabs
      const recruiterTabs = [
        'dashboard', 'messages', 'candidates', 'positions', 'my-positions',
        'recruiter-position-stats', 'recruiter-reports', 'access-requests', 'add-position'
      ];
      // Admin tabs
      const adminTabs = [
        'dashboard', 'messages', 'candidates', 'positions',
        'position-stats', 'access-requests', 'add-position',
        'add-coach', 'add-expert', 'all-coaches', 'all-experts', 'all-recruiters'
      ];

      let validTabs = [];
      if (isClientSpoc) {
        validTabs = clientSpocTabs;
      } else if (isRecruiter) {
        validTabs = recruiterTabs;
      } else if (isAdmin) {
        validTabs = adminTabs;
      }

      if (validTabs.includes(tabId)) {
        setActiveTab(tabId);
      }
    }
  }, [location.hash, isClientSpoc, isRecruiter, isAdmin]);

  // Notification context
  const {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    setIsDropdownOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useContext(NotificationContext);

  // Listen for copy position event
  React.useEffect(() => {
    const handleSwitchToAddPosition = (event) => {
      setActiveTab('add-position');
    };

    window.addEventListener('switchToAddPosition', handleSwitchToAddPosition);
    
    return () => {
      window.removeEventListener('switchToAddPosition', handleSwitchToAddPosition);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  // Determine if sidebar should show as expanded
  const showExpanded = !isSidebarCollapsed || isHovered;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = async () => {
    try {
      await axios.post("/admin/adlogout", {}, { withCredentials: true });
      dispatch({ type: "LOGOUT" });
      navigate('/clientspoc', { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      fetchNotifications({ limit: 20 });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      component: <Ad_Data />
    },
    {
      id: 'candidates',
      icon: Users,
      label: 'Candidates',
      component: <Ad_Candi clientSpocView={isClientSpoc} recruiterView={isRecruiter} />
    },
    // Direct Applications — only for ClientSPOC, navigates to standalone page
    ...(isClientSpoc ? [{
      id: 'direct-applications-link',
      icon: FileText,
      label: 'Direct Applications',
      navigateTo: '/clientspoc-direct-applications',
      clientspocOnly: true
    }] : []),
    {
      id: 'positions',
      icon: Briefcase,
      label: 'All Positions',
      component: <Ad_OpenPos />
    },
    {
      id: 'my-positions',
      icon: User,
      label: 'My Positions',
      component: <My_Positions />,
      recruiterOnly: true
    },
// Recruiter Position Stats - Only visible for recruiters
    ...(isRecruiter ? [{
      id: 'recruiter-position-stats',
      icon: TrendingUp,
      label: 'My Position Stats',
      component: <RecruiterPositionStats />
    }] : []),
    // Recruiter Reports - Only visible for recruiters
    ...(isRecruiter ? [{
      id: 'recruiter-reports',
      icon: BarChart3,
      label: 'My Reports',
      component: <RecruiterReports />
    }] : []),
// ClientSPOC My Positions - Only visible for ClientSPOC
    ...(isClientSpoc ? [{
      id: 'clientspoc-my-positions',
      icon: Briefcase,
      label: 'My Positions Stat',
      component: <ClientSpocMyPositions />,
      clientspocOnly: true
    }] : []),
    // My Added Positions - Only visible for ClientSPOC
    ...(isClientSpoc ? [{
      id: 'my-added-positions',
      icon: PlusCircle,
      label: 'My Added Positions',
      component: <MyAddedPositions />,
      clientspocOnly: true
    }] : []),
    // Coach/Expert Requests - Visible for ClientSPOC
    ...(isClientSpoc ? [{
      id: 'coach-expert-requests',
      icon: Users,
      label: 'Recuiters Requests',
      component: <ClientSpocCoachExpertRequests />,
      clientspocOnly: true
    }] : []),
    // Direct Coach/Expert Requests (Assign Me) - Visible for ClientSPOC
    ...(isClientSpoc ? [{
      id: 'direct-coach-expert-requests',
      icon: UserCheck,
      label: 'Direct Coach/Expert Request',
      component: <ClientSpocDirectRequests />,
      clientspocOnly: true
    }] : []),
    {
      id: 'position-stats',
      icon: BarChart3,
      label: 'Candidate Stats',
      component: <ClientSpocPositionStats />
    },
    // ClientSPOC Reports (navigates to separate route)
    ...(isClientSpoc ? [{
      id: 'clientspoc-reports-link',
      icon: BarChart3,
      label: 'Reports',
      navigateTo: '/clientspoc-reports',
      clientspocOnly: true
    }] : []),
    {
      id: 'access-requests',
      icon: UserCheck,
      label: 'Access Requests',
      component: <AccessRequestsManagement />
    },
    {
      id: 'coach-recruiter-assignments',
      icon: UserCheck,
      label: 'Coach→Recruiter Assignments',
      component: <CoachRecruiterAssignmentsAdmin />,
      adminOnly: true
    },
    {
      id: 'add-position',
      icon: PlusCircle,
      label: 'Add Position',
      component: <Ad_Pos />
    },
    // Admin & ClientSPOC Menu Items - Add Coach and Add Expert
    ...((isAdmin || isClientSpoc) ? [{
      id: 'add-coach',
      icon: UserPlus,
      label: 'Add Coach',
      component: <AddCoach />,
      adminOnly: true
    }] : []),
    ...((isAdmin || isClientSpoc) ? [{
      id: 'add-expert',
      icon: Award,
      label: 'Add Expert',
      component: <AddExpert />,
      adminOnly: true
    }] : []),
    // All Coaches - Visible for Admin & ClientSPOC
    ...((isAdmin || isClientSpoc) ? [{
      id: 'all-coaches',
      icon: UsersIcon,
      label: 'All Coaches',
      component: <AllCoaches />,
      adminOnly: true,
      isRoute: false
    }] : []),
    // All Experts - Visible for Admin & ClientSPOC
    ...((isAdmin || isClientSpoc) ? [{
      id: 'all-experts',
      icon: UsersIcon,
      label: 'All Experts',
      component: <AllExperts embedded={true} />,
      adminOnly: true,
      isRoute: false
    }] : []),
    // All Recruiters - Visible for Admin & ClientSPOC
    ...((isAdmin || isClientSpoc) ? [{
      id: 'all-recruiters',
      icon: UsersIcon,
      label: 'All Recruiters',
      component: <AllRecruiters embedded={true} />,
      adminOnly: true,
      isRoute: false
    }] : []),
    {
      id: 'messages',
      icon: MessageSquare,
      label: 'Messages',
      component: <ChatPanel />
    },
    // Reports - Visible for Admin only
    ...(isAdmin ? [{
      id: 'reports',
      icon: BarChart3,
      label: 'Reports',
      component: <SuperAdminReports />,
      adminOnly: true,
    }] : [])
  ];

  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
      
      {/* ========== SIDEBAR - DESKTOP ========== */}
      {isClientSpoc && (
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <ClientSpocSidebar />
        </aside>
      )}
      {!isClientSpoc && <aside
        className={`hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl transition-all duration-300 ${
          showExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-blue-700/50">
          <div className="flex items-center justify-between">
            {showExpanded ? (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div className="min-w-0 flex-1 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-white font-bold text-lg truncate">Admin Panel</h2>
                    <p className="text-blue-300 text-xs truncate">RecruiterV</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
                  title={isSidebarCollapsed ? 'Pin expanded' : 'Pin collapsed'}
                >
                  {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
              </>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-blue-700/50">
          <div className={`flex items-center gap-3 ${!showExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            
            {showExpanded && (
              <div className="flex-1 min-w-0 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
                <p className="text-white font-semibold text-sm truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-blue-300 text-xs truncate">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 min-h-0 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
          <ul className="space-y-2">
{menuItems
              .filter(item => !item.recruiterOnly || isRecruiter)
              .filter(item => !item.clientspocOnly || isClientSpoc)
              .filter(item => !item.adminOnly || isAdmin || isClientSpoc)
              .map((item, index) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (item.navigateTo) {
                        navigate(item.navigateTo);
                      } else {
                        setActiveTab(item.id);
                      }
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                      active
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                    } ${!showExpanded ? 'justify-center' : ''}`}
                  >
                    <span className="relative flex-shrink-0">
                      <Icon size={20} />
                      {item.id === 'messages' && chatUnread > 0 && (
                        <>
                          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                        </>
                      )}
                    </span>

                    {showExpanded && (
                      <span
                        className="font-medium text-sm flex-1 truncate text-left opacity-0 animate-fadeIn"
                        style={{ animationDelay: `${200 + index * 30}ms` }}
                      >
                        {item.label}
                      </span>
                    )}
                    {item.id === 'messages' && chatUnread > 0 && showExpanded && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center animate-chat-blink">{chatUnread}</span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {!showExpanded && !isHovered && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                        {item.label}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}

            {/* Resume Database Link */}
            {/* <li>
              <button
                onClick={() => navigate('/cv_repo')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative text-blue-100 hover:bg-blue-700/50 hover:text-white ${
                  !showExpanded ? 'justify-center' : ''
                }`}
              >
                <Database size={20} className="flex-shrink-0" />
                
                {showExpanded && (
                  <span className="font-medium text-sm flex-1 truncate text-left opacity-0 animate-fadeIn" style={{ animationDelay: '350ms' }}>
                    Resume Database
                  </span>
                )}

                {!showExpanded && !isHovered && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    Resume Database
                  </div>
                )}
              </button>
            </li> */}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-700/50">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${
              !showExpanded ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {showExpanded && (
              <span className="font-medium text-sm opacity-0 animate-fadeIn" style={{ animationDelay: '300ms' }}>
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>}

      {/* ========== SIDEBAR - MOBILE ========== */}
      {isMobileSidebarOpen && isClientSpoc && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in"><ClientSpocSidebar /></aside>
        </div>
      )}
      {isMobileSidebarOpen && !isClientSpoc && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl animate-slide-in">
            {/* Logo */}
            <div className="p-6 border-b border-blue-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Admin Panel</h2>
                    <p className="text-blue-300 text-xs">RecruiterV</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-white hover:text-orange-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-b border-blue-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name || 'Admin'}</p>
                  <p className="text-blue-300 text-xs">Administrator</p>
                </div>
              </div>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 min-h-0 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
              <ul className="space-y-2">
{menuItems
                  .filter(item => !item.recruiterOnly || isRecruiter)
                  .filter(item => !item.clientspocOnly || isClientSpoc)
                  .filter(item => !item.adminOnly || isAdmin || isClientSpoc)
                  .map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (item.navigateTo) {
                            navigate(item.navigateTo);
                            setIsMobileSidebarOpen(false);
                            return;
                          }
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                          active
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                            : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    </li>
                  );
                })}

                <li>
                  <button
                    onClick={() => {
                      navigate('/cv_repo');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-blue-700/50 hover:text-white transition-all"
                  >
                    <Database size={20} />
                    <span className="font-medium text-sm">Resume Database</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-blue-700/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div className={`transition-all duration-300 ${isClientSpoc ? (ctxSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64') : (showExpanded ? 'lg:pl-64' : 'lg:pl-20')}`}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-md border-b-2 border-blue-100">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              
              {/* Left: Hamburger + Greeting */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}! 👋
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activeMenuItem?.label || 'Dashboard'}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
                {/* Search (Desktop) */}
                {/* <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Search size={18} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Search...</span>
                </button> */}

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="relative p-2 sm:p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      {/* Header */}
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-orange-500">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-white/80 hover:text-white text-xs flex items-center gap-1"
                            >
                              <CheckCheck size={14} />
                              Mark all read
                            </button>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <p className="text-white/80 text-xs mt-1">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                          <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-gray-500 text-sm">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell className="text-gray-400 w-6 h-6" />
                            </div>
                            <p className="text-gray-600 font-medium">No notifications</p>
                            <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                !notification.read ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Notification Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </p>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>

                                  {/* Position/Client info if available */}
                                  {(notification.positionTitle || notification.clientName) && (
                                    <div className="mt-2 flex items-center gap-2">
                                      {notification.positionTitle && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                          {notification.positionTitle}
                                        </span>
                                      )}
                                      {notification.clientName && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                          {notification.clientName}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 mt-3">
                                    {!notification.read && (
                                      <button
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                                      >
                                        <Check size={12} />
                                        Mark as read
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDelete(notification.id)}
                                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </div>

                                {/* Unread indicator */}
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                          <button
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                          >
                            View All Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings */}
                {/* <button className="hidden sm:block p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Settings size={20} />
                </button> */}

{/* Profile Avatar */}
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-orange-50 px-3 py-2 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-xs">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden lg:block">
                    {user?.name || 'Admin'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-h-screen">
          <React.Fragment key={activeTab}>
            {activeMenuItem?.component}
          </React.Fragment>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

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

export default Admin;
