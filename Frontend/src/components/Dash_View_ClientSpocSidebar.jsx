import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import { useChatNotify } from '../context/ChatNotify';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  BarChart3,
  UserCheck,
  PlusCircle,
  UserPlus,
  ClipboardList,
  Inbox,
  FileText,
  MessageSquare,
  UploadCloud,
  Building2,
  BookOpen,
} from 'lucide-react';

const clientSpocMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/ad_panel#dashboard' },
  {
    icon: Users,
    label: 'Candidates',
    children: [
      { icon: Users,       label: 'All Candidates',          path: '/ad_panel#candidates' },
      { icon: FileText,    label: 'Direct Applications',     path: '/clientspoc-direct-applications' },
      { icon: UploadCloud, label: 'Bulk Resume Upload',      path: '/clientspoc-bulk-resumes' },
      { icon: BarChart3,   label: 'Candidate Stats',         path: '/ad_panel#position-stats' },
    ],
  },
  {
    icon: Briefcase,
    label: 'Positions',
    children: [
      { icon: PlusCircle, label: 'Add Position',       path: '/ad_panel#add-position' },
      { icon: Briefcase,  label: 'My Added Positions', path: '/ad_panel#my-added-positions' },
      { icon: TrendingUp, label: 'My Position Stats',  path: '/ad_panel#clientspoc-my-positions' },
      { icon: Building2,  label: 'Company Positions',  path: '/clientspoc-company-approvals' },
      { icon: Briefcase,  label: 'All Positions',      path: '/ad_panel#positions' },
    ],
  },
  {
    icon: ClipboardList,
    label: 'Requests',
    children: [
      { icon: Users,     label: 'Recruiter Requests',          path: '/ad_panel#coach-expert-requests' },
      { icon: UserCheck, label: 'New Recruiter Requests',      path: '/ad_panel#access-requests' },
      { icon: Users,     label: 'Direct Coach/Expert Requests', path: '/ad_panel#direct-coach-expert-requests' },
      { icon: Users,     label: 'Coach-Recruiter Assignments',  path: '/ad_panel#coach-recruiter-assignments' },
    ],
  },
  { icon: BarChart3, label: 'Reports', path: '/clientspoc-reports' },
  {
    icon: Users,
    label: 'Users',
    children: [
      { icon: UserPlus, label: 'Add Coach',  path: '/ad_panel#add-coach' },
      { icon: UserPlus, label: 'Add Expert', path: '/ad_panel#add-expert' },
      { icon: Users,    label: 'Coach',      path: '/ad_panel#all-coaches' },
      { icon: Users,    label: 'Expert',     path: '/ad_panel#all-experts' },
      { icon: Users,    label: 'Recruiters', path: '/ad_panel#all-recruiters' },
    ],
  },
  { icon: DollarSign, label: 'My Earnings', path: '/my-earnings' },
  // Last entry, matching every other user type's sidebar.
  { icon: BookOpen, label: 'Training Manual', path: '/training-manual' },
];

const ClientSpocSidebar = () => {
  const { total: chatUnread } = useChatNotify();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;

  // Managers (employees with the "Manager" designation) get a Manager Panel.
  const isManager = !!user?.isEmployee && (user?.designation || '').toLowerCase() === 'manager';
  const menuItems = isManager
    ? [{ icon: UserCheck, label: 'Manager Panel', path: '/manager' }, ...clientSpocMenuItems]
    : clientSpocMenuItems;

  const isActive = (path) => {
    if (path.includes('#')) {
      return location.pathname === path.split('#')[0] && location.hash === '#' + path.split('#')[1];
    }
    return location.pathname === path;
  };

  const isGroupActive = (item) => item.children?.some(c => isActive(c.path)) ?? false;

  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      clientSpocMenuItems.forEach(item => {
        if (item.children && item.children.some(c => isActive(c.path))) {
          next[item.label] = true;
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash]);

  const toggleGroup = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
    } catch {}
    window.location.href = '/log_rec';
  };

  const renderLeaf = (item, indent = false) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const showChatBadge = item.path === '/ad_panel#messages' && chatUnread > 0;
    return (
      <li key={item.path}>
        <button
          onClick={() => handleMenuClick(item.path)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative w-full text-left ${
            active
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
          } ${indent && !isCollapsed ? 'pl-8' : ''} ${isCollapsed ? 'justify-center' : ''} ${showChatBadge ? 'animate-chat-blink' : ''}`}
          title={isCollapsed ? item.label : ''}
        >
          <span className="relative flex-shrink-0">
            <Icon size={18} />
            {showChatBadge && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
            {showChatBadge && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />}
          </span>
          {!isCollapsed && <span className="font-medium text-sm flex-1 truncate">{item.label}</span>}
          {showChatBadge && !isCollapsed && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{chatUnread}</span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
              {item.label}
            </div>
          )}
        </button>
      </li>
    );
  };

  const renderGroup = (item) => {
    const Icon = item.icon;
    const groupOpen = isCollapsed ? true : (openGroups[item.label] ?? isGroupActive(item));
    const anyActive = isGroupActive(item);

    if (isCollapsed) {
      return item.children.map(child => renderLeaf(child, false));
    }

    return (
      <li key={item.label}>
        <button
          onClick={() => toggleGroup(item.label)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            anyActive && !groupOpen
              ? 'bg-blue-700/60 text-white'
              : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
          }`}
        >
          <Icon size={18} className="flex-shrink-0" />
          <span className="font-medium text-sm flex-1 text-left truncate">{item.label}</span>
          <ChevronDown
            size={15}
            className={`flex-shrink-0 transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {groupOpen && (
          <ul className="mt-1 space-y-0.5 border-l border-blue-600/40 ml-5">
            {item.children.map(child => renderLeaf(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`}
      style={{ height: '100%' }}
    >
      {/* Logo */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="w-auto object-contain" style={{ height: '100%' }} />
          )}
          {isCollapsed && (
            <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="w-auto object-contain mx-auto" style={{ height: '100%' }} />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isCollapsed)}
            className={`p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0 ${isCollapsed ? 'mx-auto mt-4' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* User */}
      <div className="flex-shrink-0 p-4 border-b border-blue-700/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name || 'Client SPOC'}</p>
              <p className="text-blue-300 text-xs truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
        <ul className="space-y-1.5">
          {menuItems.map(item =>
            item.children ? renderGroup(item) : renderLeaf(item, false)
          )}
        </ul>
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 p-4 border-t border-blue-700/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
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

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(30,58,138,0.3); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.5); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.7); }
      `}</style>
    </div>
  );
};

export default ClientSpocSidebar;
