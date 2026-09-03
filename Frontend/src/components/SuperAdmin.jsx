import React, { useState, useContext } from 'react';
import AnnouncementBar from './AnnouncementBar';
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
  ChevronRight,
  BookOpen,
  Building2,
  UserCheck,
  ClipboardList,
  Wrench,
  BarChart2,
  FileBarChart2,
  Layers,
  List,
  UserPlus,
  Store,
  Crown,
  Mail,
  Inbox,
  Landmark,
  Sparkles,
  MessageSquare,
  BadgeCheck, Megaphone, ShieldCheck, CreditCard, FileSignature, Mic, ClipboardCheck, Clock
} from 'lucide-react';
import SuperAdminAIReports from '../pages/SuperAdminAIReports';
import ChatPanel from './ChatPanel';
import { useChatNotify } from '../context/ChatNotify';

import ClientSpocAdd from '../pages/ClientSpocAdd';
import Footer from '../pages/Footer';
import ClientSpocCompany from '../pages/ClientSpocCompany';
import AllCompanies from '../pages/AllCompanies';
import BlogManagement from '../pages/BlogManagement';
import RecruiterStats from '../pages/RecruiterStats';
import PositionStats from '../pages/PositionStats';
// import ClientSpocStats from '../pages/ClientSpocStats';
import ClientStats from '../pages/ClientStats';
import Dashboard from '../pages/Dashboard';
import CandidateStats from '../pages/CandidateStats';
import CoachExpertStats from '../pages/CoachExpertStats';
import AllCoaches from '../pages/AllCoaches';
import AllExperts from '../pages/AllExperts';
import AllRecruiters from '../pages/AllRecruiters';
import AllClientSpocs from '../pages/AllClientSpocs';
import SuperAdminCoachExpertRequests from '../pages/SuperAdminCoachExpertRequests';
import CoachRecruiterAssignmentsAdmin from '../pages/CoachRecruiterAssignmentsAdmin';
import { PendingUsersPanel, VendorManagement } from './AdminDashboard';
import AllVendors from '../pages/AllVendors';
import InternalMessageTemplates from '../pages/InternalMessageTemplates';
import AnnouncementsAdmin from '../pages/AnnouncementsAdmin';
import PortalApprovals from '../pages/PortalApprovals';
import PortalSubscriptions from '../pages/PortalSubscriptions';
import AgreementTemplates from '../pages/AgreementTemplates';
import { EligibilityQuestions, EligibilitySettings, EligibilityResults } from '../pages/EligibilityAdmin';
import TrainingManualsAdmin from '../pages/TrainingManualsAdmin';
import { BriefingPositions, BriefingRecruiters, BriefingCoaches, BriefingClientSpocs, BriefingCompanies } from '../pages/BriefingsAdmin';
import { AllCandidatesPanel, DirectCandidatesPanel, ActiveCandidatesPanel } from '../pages/SuperAdminCandidates';
import SuperAdminAssignedPositions from '../pages/SuperAdminAssignedPositions';
import CoachVendorRequests from '../pages/CoachVendorRequests';
import SuperAdminReports from '../pages/SuperAdminReports';
import RecruiterReport from '../pages/RecruiterReport';
import CoachReport from '../pages/CoachReport';
import ExpertReport from '../pages/ExpertReport';
import ClientSpocReport from '../pages/ClientSpocReport';
import PositionReport from '../pages/PositionReport';
import AdminRegistrationReport from '../pages/AdminRegistrationReport';
import VendorReport from '../pages/VendorReport';
import CategoryCreate from '../pages/CategoryCreate';
import CategoryList from '../pages/CategoryList';
import AllPositions from '../pages/AllPositions';
import SuperAdminTeams from '../pages/SuperAdminTeams';
import SuperAdminEmployees from '../pages/SuperAdminEmployees';
import DirectApplicants from '../pages/DirectApplicants';
import SuperAdminSendEmail from '../pages/SuperAdminSendEmail';
import SuperAdminEmailTemplates from '../pages/SuperAdminEmailTemplates';
import SuperAdminInboxAccess from '../pages/SuperAdminInboxAccess';
import SuperAdminCompanyAccess from '../pages/SuperAdminCompanyAccess';
import SuperAdminPublicJobs from '../pages/SuperAdminPublicJobs';
import SuperAdminConsultingFirms from '../pages/SuperAdminConsultingFirms';

// ─── Admin Tools (inline) ─────────────────────────────────────────────────────
const AdminTools = () => {
  const [status, setStatus] = React.useState(null);
  const [running, setRunning] = React.useState(false);

  const runCleanup = async () => {
    if (!window.confirm('This will permanently delete duplicate recruiter records (same email + phone). Continue?')) return;
    setRunning(true);
    setStatus(null);
    try {
      const res = await axios.post('/admin/cleanup-duplicate-recruiters', {}, { withCredentials: true });
      setStatus({ ok: true, data: res.data });
    } catch (err) {
      setStatus({ ok: false, msg: err.response?.data?.message || err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Tools</h2>

      {/* Cleanup card */}
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1">Remove Duplicate Recruiters</h3>
        <p className="text-sm text-gray-500 mb-4">
          Scans the recruiter database for records that share the same email <em>and</em> phone number.
          Keeps the best record (verified first, then newest) and permanently deletes the duplicates.
        </p>
        <button
          onClick={runCleanup}
          disabled={running}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          {running ? 'Running…' : 'Run Cleanup'}
        </button>

        {status && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${status.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {status.ok ? (
              <>
                <p className="font-semibold mb-2">{status.data.message}</p>
                {status.data.deleted.length > 0 && (
                  <ul className="list-disc pl-5 space-y-0.5 text-xs">
                    {status.data.deleted.map(d => (
                      <li key={d.id}>{d.email} — <span className="font-mono">{d.id}</span> {d.isVerified ? '(verified)' : '(unverified)'}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p>{status.msg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SuperAdmin = () => {
  const { total: chatUnread } = useChatNotify();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openGroups, setOpenGroups] = useState({});
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
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', component: <Dashboard /> },
    {
      id: 'menu-people', icon: Users, label: 'People',
      children: [
      {
        id: 'grp-all-users', icon: Users, label: 'All Users',
        children: [
        { id: 'users-all-recruiters', icon: Users, label: 'All Recruiter', component: <AllRecruiters embedded /> },
        { id: 'users-all-coaches', icon: UserCheck, label: 'All Coach', component: <AllCoaches embedded /> },
        { id: 'users-all-experts', icon: User, label: 'All Experts', component: <AllExperts embedded /> },
        { id: 'users-all-clientspocs', icon: Building2, label: 'All ClientSPOC', component: <AllClientSpocs embedded /> },
        { id: 'users-all-vendors', icon: Store, label: 'All Vendor', component: <AllVendors embedded /> },
        ]
      },
      {
        id: 'grp-newly', icon: UserPlus, label: 'Newly Registered',
        children: [
        { id: 'newly-registered-recruiters', icon: Users, label: 'Recruiters', component: <PendingUsersPanel userType="recruiter" /> },
        { id: 'newly-registered-coaches', icon: UserCheck, label: 'Coaches', component: <PendingUsersPanel userType="coach" /> },
        { id: 'newly-registered-experts', icon: User, label: 'Experts', component: <PendingUsersPanel userType="expert" /> },
        ]
      },
      {
        id: 'grp-requests', icon: ClipboardList, label: 'Requests & Assignments',
        children: [
        { id: 'superadmin-coach-expert-requests', icon: ClipboardList, label: 'Coach/Expert Request', component: <SuperAdminCoachExpertRequests /> },
        { id: 'vendor-upgrade-requests', icon: Crown, label: 'New Vendor Request', component: <CoachVendorRequests /> },
        { id: 'coach-recruiter-assignments', icon: UserCheck, label: 'Coach→Recruiter Assignments', component: <CoachRecruiterAssignmentsAdmin /> },
        ]
      },
      { id: 'portal-approvals', icon: ShieldCheck, label: 'Portal Approvals', component: <PortalApprovals /> },
      { id: 'teams', icon: Users, label: 'Teams', component: <SuperAdminTeams /> },
      { id: 'employees', icon: BadgeCheck, label: 'Employees', component: <SuperAdminEmployees /> },
      { id: 'clientspoc', icon: PlusCircle, label: 'Add User', component: <ClientSpocAdd /> },
      ]
    },
    {
      id: 'menu-candidates', icon: UserCheck, label: 'Candidates',
      children: [
      { id: 'candidates-all', icon: Users, label: 'All Candidates', component: <AllCandidatesPanel /> },
      { id: 'candidates-direct', icon: UserPlus, label: 'Direct Candidate', component: <DirectCandidatesPanel /> },
      { id: 'candidates-active', icon: Briefcase, label: 'Active Candidates', component: <ActiveCandidatesPanel /> },
      { id: 'direct-applicants', icon: UserPlus, label: 'Direct Applicants', component: <DirectApplicants /> },
      ]
    },
    {
      id: 'menu-positions', icon: Briefcase, label: 'Positions',
      children: [
      { id: 'all-positions', icon: Briefcase, label: 'All Positions', component: <AllPositions /> },
      { id: 'assigned-positions', icon: Users, label: 'All Assigned Positions', component: <SuperAdminAssignedPositions /> },
      ]
    },
    {
      id: 'menu-briefings', icon: Mic, label: 'Briefings',
      children: [
        { id: 'briefings-positions', icon: Briefcase, label: 'Positions', component: <BriefingPositions /> },
        { id: 'briefings-recruiters', icon: Users, label: 'Recruiter', component: <BriefingRecruiters /> },
        { id: 'briefings-coaches', icon: UserCheck, label: 'Coach', component: <BriefingCoaches /> },
        { id: 'briefings-clientspocs', icon: Building2, label: 'ClientSPOC', component: <BriefingClientSpocs /> },
        { id: 'briefings-companies', icon: Building2, label: 'Company', component: <BriefingCompanies /> },
      ]
    },
    {
      id: 'menu-clients', icon: Building2, label: 'Clients & Vendors',
      children: [
      {
        id: 'grp-companies', icon: Building2, label: 'Companies',
        children: [
        { id: 'company-add', icon: PlusCircle, label: 'Add New Company', component: <ClientSpocCompany/> },
        { id: 'company-all', icon: Building2, label: 'All Companies', component: <AllCompanies/> },
        ]
      },
      { id: 'vendor-management', icon: Store, label: 'Vendor Management', component: <VendorManagement /> },
      { id: 'portal-subscriptions', icon: CreditCard, label: 'Subscriptions', component: <PortalSubscriptions /> },

      { id: 'consulting-firms', icon: Landmark, label: 'Consulting Firms', component: <SuperAdminConsultingFirms /> },
      { id: 'public-jobs', icon: Briefcase, label: 'Public Job Requests', component: <SuperAdminPublicJobs /> },
      { id: 'company-access', icon: Building2, label: 'Company Access', component: <SuperAdminCompanyAccess /> },
      ]
    },
    {
      id: 'menu-analytics', icon: BarChart2, label: 'Analytics & Reports',
      children: [
      { id: 'ai-reports', icon: Sparkles, label: 'AI Reports', component: <SuperAdminAIReports /> },
      {
        id: 'grp-stats', icon: BarChart2, label: 'Statistics',
        children: [
        { id: 'candidatestats', icon: Users, label: 'Candidate Statistics', component: <CandidateStats /> },
        { id: 'recruiterstats', icon: Database, label: 'Recruiter Statistics', component: <RecruiterStats /> },
        { id: 'clientstats', icon: Building2, label: 'Client Statistics', component: <ClientStats /> },
        { id: 'positionstats', icon: Briefcase, label: 'Position Statistics', component: <PositionStats /> },
        { id: 'coach-expert-stats', icon: UserCheck, label: 'Coach & Expert Stats', component: <CoachExpertStats /> },
        ]
      },
      {
        id: 'grp-reports', icon: FileBarChart2, label: 'Reports',
        children: [
        { id: 'report-candidate', icon: FileBarChart2, label: 'Candidate Report', component: <SuperAdminReports /> },
        { id: 'report-recruiter', icon: FileBarChart2, label: 'Recruiter Report', component: <RecruiterReport /> },
        { id: 'report-coach', icon: FileBarChart2, label: 'Coach Report', component: <CoachReport /> },
        { id: 'report-expert', icon: FileBarChart2, label: 'Expert Report', component: <ExpertReport /> },
        { id: 'report-clientspoc', icon: FileBarChart2, label: 'Client SPOC Report', component: <ClientSpocReport /> },
        { id: 'report-position', icon: FileBarChart2, label: 'Position Report', component: <PositionReport /> },
        { id: 'report-admin', icon: FileBarChart2, label: 'Admin Report', component: <AdminRegistrationReport /> },
        { id: 'report-vendor', icon: FileBarChart2, label: 'Vendor Report', component: <VendorReport /> },
        ]
      },
      ]
    },
    {
      id: 'menu-comms', icon: MessageSquare, label: 'Communication',
      children: [
      { id: 'messages', icon: MessageSquare, label: 'Messages', component: <ChatPanel /> },
      { id: 'send-email', icon: Mail, label: 'Send Email', component: <SuperAdminSendEmail /> },
      { id: 'email-templates', icon: Mail, label: 'Email Templates', component: <SuperAdminEmailTemplates /> },
      { id: 'internal-message-templates', icon: MessageSquare, label: 'Internal Message Templates', component: <InternalMessageTemplates /> },
      { id: 'announcements', icon: Megaphone, label: 'Announcements', component: <AnnouncementsAdmin /> },
      { id: 'inbox-access', icon: Inbox, label: 'Inbox Access', component: <SuperAdminInboxAccess /> },
      ]
    },
    {
      id: 'menu-content', icon: Layers, label: 'Content & Menus',
      children: [
      { id: 'agreement-templates', icon: FileSignature, label: 'Agreements', component: <AgreementTemplates /> },
      { id: 'blogs', icon: BookOpen, label: 'Blog Management', component: <BlogManagement /> },
      { id: 'category-create', icon: PlusCircle, label: 'Create Menu', component: <CategoryCreate /> },
      { id: 'category-list', icon: List, label: 'All Menu', component: <CategoryList /> },
      ]
    },
    {
      id: 'menu-eligibility', icon: ClipboardCheck, label: 'Eligibility Checks',
      children: [
        { id: 'eligibility-questions', icon: List, label: 'Questions', component: <EligibilityQuestions /> },
        { id: 'eligibility-settings', icon: Clock, label: 'Timer & Messages', component: <EligibilitySettings /> },
        { id: 'eligibility-results', icon: ClipboardCheck, label: 'Results', component: <EligibilityResults /> },
      ],
    },
    { id: 'training-manuals', icon: BookOpen, label: 'Training Manuals', component: <TrainingManualsAdmin /> },
    { id: 'admin-tools', icon: Wrench, label: 'Admin Tools', component: <AdminTools /> },
  ];



  // Walk the whole tree, at any depth, to find the selected item.
  const findNode = (nodes, id) => {
    for (const n of nodes || []) {
      if (n.id === id) return n;
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
    return null;
  };
  const activeMenuItem = findNode(menuItems, activeTab);

  // Sidebar nodes render recursively so the menu can nest to three levels:
  // Menu → sub-menu → child. A node with `children` is a collapsible group at
  // any depth; anything else is a selectable leaf.
  const renderNode = (item, depth = 0, index = 0) => {
    const Icon = item.icon;
    const pad = depth === 0 ? '' : depth === 1 ? 'ml-3' : 'ml-6';

    if (item.children && Array.isArray(item.children)) {
      // A group opens when it is explicitly toggled, or when it contains the tab
      // being viewed — otherwise every group is shut on load and the whole menu
      // reads as empty.
      const containsActive = (n) => (n.children || []).some(c => c.id === activeTab || containsActive(c));
      const isOpen = openGroups[item.id] !== undefined ? openGroups[item.id] : containsActive(item);
      return (
        <li key={item.id} className={pad}>
          <button
            onClick={() => setOpenGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
            className={`w-full flex items-center gap-3 px-3 ${depth === 0 ? 'py-2' : 'py-1.5'} rounded-lg text-blue-100 hover:bg-blue-700/50 hover:text-white transition-all ${!showExpanded ? 'justify-center' : ''}`}
          >
            <Icon size={depth === 0 ? 18 : 16} className="flex-shrink-0" />
            {showExpanded && (
              <span className={`${depth === 0 ? 'font-semibold text-sm' : 'text-[13px]'} flex-1 truncate text-left`}>
                {item.label}
              </span>
            )}
            {showExpanded && <span className="text-xs">{isOpen ? '▾' : '▸'}</span>}
          </button>
          <ul className={`mt-1 space-y-1 ${isOpen ? '' : 'hidden'}`}>
            {item.children.map((child, i) => renderNode(child, depth + 1, i))}
          </ul>
        </li>
      );
    }

    const active = activeTab === item.id;
    return (
      <li key={item.id} className={pad}>
        <button
          onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 ${depth === 0 ? 'py-3' : 'py-2'} rounded-lg transition-all duration-200 group relative ${
            active
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
          } ${!showExpanded ? 'justify-center' : ''}`}
        >
          <span className="relative flex-shrink-0">
            <Icon size={depth === 0 ? 20 : 17} />
            {item.id === 'messages' && chatUnread > 0 && (
              <>
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </>
            )}
          </span>
          {showExpanded && (
            <span
              className={`${depth === 0 ? 'font-medium text-sm' : 'text-[13px]'} flex-1 truncate text-left opacity-0 animate-fadeIn`}
              style={{ animationDelay: `${200 + index * 30}ms` }}
            >
              {item.label}
            </span>
          )}
          {item.id === 'messages' && chatUnread > 0 && showExpanded && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center animate-chat-blink">{chatUnread}</span>
          )}
          {!showExpanded && !isHovered && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
              {item.label}
            </div>
          )}
        </button>
      </li>
    );
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
      
      {/* ========== SIDEBAR - DESKTOP ========== */}
      <aside
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
                  <img 
                    src="https://www.recruiterv.com/recruitorV.png" 
                    alt="RecruiterV Logo" 
                    className="w-auto object-contain opacity-0 animate-fadeIn"
                    style={{ height: '100%', animationDelay: '100ms' }}
                  />
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
              <img 
                src="https://www.recruiterv.com/recruitorV.png" 
                alt="RecruiterV Logo" 
                className="w-auto object-contain mx-auto"
                style={{ height: '100%' }}
              />
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
                  {user?.name || 'Super Admin'}
                </p>
                <p className="text-blue-300 text-xs truncate">Super Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 min-h-0 py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
          <ul className="space-y-2">
            {menuItems.map((item, index) => renderNode(item, 0, index))}
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
          <aside className="absolute inset-y-0 left-0 w-64 flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl animate-slide-in">
            {/* Logo */}
            <div className="p-6 border-b border-blue-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://www.recruiterv.com/recruitorV.png" 
                    alt="RecruiterV Logo" 
                    className="w-auto object-contain"
                    style={{ height: '100%' }}
                  />
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
                    {user?.name?.charAt(0) || 'SA'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name || 'Super Admin'}</p>
                  <p className="text-blue-300 text-xs">Super Administrator</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 min-h-0 py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
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
          <AnnouncementBar />
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

                <button
                  onClick={() => navigate('/profile')}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-orange-50 px-3 py-2 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-xs">
                      {user?.name?.charAt(0) || 'SA'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden lg:block">
                    {user?.name || 'Super Admin'}
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

export default SuperAdmin;
