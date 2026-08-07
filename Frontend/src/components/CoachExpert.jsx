import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStateContext, UserDispatchContext } from '../context/AuthPro';
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
  ChevronRight
} from 'lucide-react';

// Import your existing components
import Ce_Candi from '../pages/Ce_Candi';
import Ce_Pos from '../pages/Ce_Pos';
import Footer from '../pages/Footer';

const CoachExpert = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();

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
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch({ type: "LOGOUT" });
      window.location.href = '/log_rec';
    }
  };

  const menuItems = [
    // {
    //   id: 'dashboard',
    //   icon: LayoutDashboard,
    //   label: 'Dashboard',
    //   component: <Ad_Data />
    // },
    {
      id: 'candidates',
      icon: Users,
      label: 'Candidates',
      component: <Ce_Candi />
    },
    {
      id: 'positions',
      icon: Briefcase,
      label: 'Open Positions',
      component: <Ce_Pos />
    }
  ];

  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
      
      {/* ========== SIDEBAR - DESKTOP ========== */}
      <aside 
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl transition-all duration-300 ${
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
                    <h2 className="text-white font-bold text-lg truncate">Coach & Expert Panel</h2>
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
                <span className="text-white font-bold text-lg">C&E</span>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-blue-700/50">
          <div className={`flex items-center gap-3 ${!showExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'C&E'}
              </span>
            </div>
            
            {showExpanded && (
              <div className="flex-1 min-w-0 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
                <p className="text-white font-semibold text-sm truncate">
                  {user?.name || 'Coach & Expert'}
                </p>
                <p className="text-blue-300 text-xs truncate">Coach & Expert</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                      active
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                    } ${!showExpanded ? 'justify-center' : ''}`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    
                    {showExpanded && (
                      <span 
                        className="font-medium text-sm flex-1 truncate text-left opacity-0 animate-fadeIn" 
                        style={{ animationDelay: `${200 + index * 30}ms` }}
                      >
                        {item.label}
                      </span>
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
      </aside>

      {/* ========== SIDEBAR - MOBILE ========== */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl animate-slide-in">
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

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
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
      <div className={`transition-all duration-300 ${showExpanded ? 'lg:pl-64' : 'lg:pl-20'}`}>
        
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
              <div className="flex items-center gap-2 sm:gap-3">

                {/* Profile Avatar */}
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-orange-50 px-3 py-2 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-xs">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden lg:block">
                    {user?.name || 'Coach & Expert'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-h-screen">
          {activeMenuItem?.component}
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

export default CoachExpert;