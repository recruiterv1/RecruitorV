
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useChatNotify } from '../context/ChatNotify';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  TrendingUp,
  ClipboardList,
  Mic,
  PlusCircle,
  DollarSign,
  BarChart3,
  HelpCircle,
  Inbox,
  UserPlus,
  UserCheck,
  Gift,
  FolderOpen,
  BookOpen,
  Send,
  Lock,
  MessageSquare,
  Store,
  ClipboardCheck,
  Wallet,
  Bell,
} from 'lucide-react';
import { UserStateContext, UserDispatchContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import axios from 'axios';

// ── Recruiter menu definition ─────────────────────────────────────────────────
// Items with `children` render as accordion groups.
const buildRecruiterMenu = (planType) => [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/dash_rec' },
  { icon: Briefcase,       label: 'Open Positions',  path: '/dash_position' },
  {
    icon: FolderOpen,
    label: 'Your Positions',
    children: [
      { icon: TrendingUp,  label: 'My Positions Stats', path: '/recruiter-position-stats' },
      { icon: Briefcase,   label: 'Assigned Position',  path: '/assigned-positions' },
      { icon: UserCheck,   label: 'Coach Assigned',     path: '/coach-assigned-positions' },
    ],
  },
  { icon: BookOpen, label: 'Resume Bank', path: '/all-candidates' },
  {
    icon: Users,
    label: 'Candidates',
    children: [
      { icon: Users,     label: 'My Candidates',    path: '/dash_candidate' },
      { icon: UserCheck, label: 'Direct Applicants', path: '/recruiter-direct-applicants' },
    ],
  },
  { icon: BarChart3, label: 'My Report',  path: '/recruiter-reports' },
  { icon: Users,     label: 'Join Team',  path: '/recruiter-join-team' },
  {
    icon: Gift,
    label: 'Refer & Earn',
    path: '/refer-and-earn',
    children: [
      { icon: Store,          label: 'My Resume Bank', path: '/refer-and-earn/marketplace' },
      { icon: ClipboardCheck, label: 'My Referrals',  path: '/refer-and-earn/my-referrals' },
      { icon: Wallet,         label: 'Earnings',      path: '/refer-and-earn/earnings' },
    ],
  },
  {
    icon: ClipboardList,
    label: 'Request',
    children: [
      ...(planType !== 0
        ? [{ icon: FileText,     label: 'My Requests',        path: '/my-requests' }]
        : []),
      { icon: Lock,        label: 'My Access Requests', path: '/my-access-requests' },
      { icon: HelpCircle,  label: 'Coach/Expert Request', path: '/coach-expert-requests' },
    ],
  },
  { icon: DollarSign, label: 'My Earnings', path: '/my-earnings' },
];

// ── Coach menu ────────────────────────────────────────────────────────────────
const coachMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',           path: '/coach-dashboard' },
  { icon: Briefcase,       label: 'Open Positions',     path: '/coach-expert-positions' },
  { icon: Briefcase,       label: 'Assigned Positions', path: '/coach-expert-assigned-positions' },
  {
    icon: Mic,
    label: 'Position Briefings',
    children: [
      { icon: ClipboardList, label: 'My Briefings',  path: '/my-briefings' },
      { icon: Mic,           label: 'Add Briefing',  path: '/my-briefings#pending' },
    ],
  },
  { icon: UserPlus,        label: 'Direct Candidates',  path: '/coach-expert-direct-applicants' },
  { icon: Users,           label: 'Team',              path: '/coach-team' },
  {
    icon: Users,
    label: 'Recruiters',
    children: [
      { icon: UserPlus,  label: 'Assign Recruiter', path: '/coach-assign-recruiter' },
      { icon: BarChart3, label: 'Recruiter Stats',  path: '/coach-recruiter-stats' },
      { icon: ClipboardList, label: 'Follow-ups',   path: '/coach-followups' },
    ],
  },
  { icon: BarChart3,   label: 'My Position Stats', path: '/coach-expert-position-stats' },
  {
    icon: Gift,
    label: 'Refer & Earn',
    path: '/refer-and-earn',
    children: [
      { icon: Store,          label: 'My Resume Bank', path: '/refer-and-earn/marketplace' },
      { icon: ClipboardCheck, label: 'My Referrals',  path: '/refer-and-earn/my-referrals' },
      { icon: Wallet,         label: 'Earnings',      path: '/refer-and-earn/earnings' },
    ],
  },
  { icon: DollarSign, label: 'My Earnings', path: '/my-earnings' },
];

// ── Expert menu ───────────────────────────────────────────────────────────────
const expertMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        path: '/expert-dashboard' },
  { icon: Briefcase,       label: 'Open Positions',   path: '/coach-expert-positions' },
  {
    icon: Mic,
    label: 'Position Briefings',
    children: [
      { icon: ClipboardList, label: 'My Briefings',  path: '/my-briefings' },
      { icon: Mic,           label: 'Add Briefing',  path: '/my-briefings#pending' },
    ],
  },
  { icon: UserPlus,        label: 'Direct Candidates', path: '/coach-expert-direct-applicants' },
  { icon: BarChart3,       label: 'Recruiter Stats',  path: '/coach-recruiter-stats' },
  { icon: BarChart3,       label: 'My Position Stats', path: '/coach-expert-position-stats' },
  {
    icon: ClipboardList,
    label: 'Requests',
    children: [
      { icon: Users, label: 'Recruiter Requests', path: '/expert-requests' },
    ],
  },
  {
    icon: Gift,
    label: 'Refer & Earn',
    path: '/refer-and-earn',
    children: [
      { icon: Store,          label: 'My Resume Bank', path: '/refer-and-earn/marketplace' },
      { icon: ClipboardCheck, label: 'My Referrals',  path: '/refer-and-earn/my-referrals' },
      { icon: Wallet,         label: 'Earnings',      path: '/refer-and-earn/earnings' },
    ],
  },
  { icon: DollarSign, label: 'My Earnings', path: '/my-earnings' },
];

const Sidebar = () => {
  const location = useLocation();
  const { total: chatUnread } = useChatNotify();
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;
  const setIsCollapsed = setIsSidebarCollapsed || (() => {});

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      dispatch({ type: 'LOGOUT' });
      window.location.href = '/log_rec';
    }
  };

  // ── Role flags ───────────────────────────────────────────────────────────────
  const isClientSpoc   = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isCoach        = user?.roleCategory?.toLowerCase() === 'coach';
  const isExpert       = user?.roleCategory?.toLowerCase() === 'expert';
  const isCoachOrExpert = isCoach || isExpert;
  const isVendor       = user?.roleCategory?.toLowerCase() === 'vendor';
  const isAdmin        = user?.type === 'admin';
  const isManager      = !!user?.isEmployee && (user?.designation || '').toLowerCase() === 'manager';

  // ── Agreement / profile gates ────────────────────────────────────────────────
  // Agreement gate ENABLED — but only ever true for accounts created BEFORE the
  // Terms & Conditions checkbox existed on the sign-up form. New sign-ups accept
  // the Terms at registration (agreementSigned = true) and are never locked.
  const needsAgreement = user && !isAdmin && !isClientSpoc && !isVendor && !user?.agreementSigned;
  const agreementPath  = isCoach ? '/coach-agreement' : isExpert ? '/expert-agreement' : '/recruiter-agreement';
  const isGuardedRole  = (isCoachOrExpert || (!isClientSpoc && !isAdmin)) && !needsAgreement;

  const [profilePct,      setProfilePct]      = useState(null);
  const [hasSkillCategory, setHasSkillCategory] = useState(true);
  const [newPosCount,     setNewPosCount]     = useState(0);
  const [candPending,     setCandPending]     = useState(0);
  const [directChanged,   setDirectChanged]   = useState(0);
  const prevPath = useRef(location.pathname);

  // ClientSPOC sidebar counts:
  //  • All Candidates  → submitted candidates whose status has NOT been updated
  //  • Direct Applications → direct applicants whose status HAS been changed
  useEffect(() => {
    if (!user?.email || !isClientSpoc) { setCandPending(0); setDirectChanged(0); return; }
    let cancelled = false;
    const initial = new Set(['applied', 'submitted', '']);
    axios.get('/addit/show/clientspoc/candi', { withCredentials: true })
      .then(r => {
        if (cancelled) return;
        const rows = r.data || [];
        const st = (c) => (c.statusa || '').toLowerCase().trim();
        const isSelfApply = (c) => c.source === 'direct_apply' && c.recRole !== 'Recruiter';
        setCandPending(rows.filter(c => !isSelfApply(c) && initial.has(st(c))).length);
        setDirectChanged(rows.filter(c => isSelfApply(c) && !initial.has(st(c))).length);
      })
      .catch(() => { if (!cancelled) { setCandPending(0); setDirectChanged(0); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, isClientSpoc, location.pathname]);

  // Count open positions added in the last 48 hours (recruiter / coach / expert)
  useEffect(() => {
    if (!user?.email || isClientSpoc || isAdmin) { setNewPosCount(0); return; }
    let cancelled = false;
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const toMs = (d) => d?._seconds ? d._seconds * 1000 : (d?.seconds ? d.seconds * 1000 : (d ? new Date(d).getTime() : 0));
    axios.get('/candidate/pos/show-for-user', { withCredentials: true })
      .then(r => { if (!cancelled) setNewPosCount((r.data || []).filter(p => toMs(p.datePosted) >= cutoff).length); })
      .catch(() => { if (!cancelled) setNewPosCount(0); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, isClientSpoc, isAdmin]);

  const fetchProfilePct = () => {
    axios.get('/api/profile/profile-completion', { withCredentials: true })
      .then(res => {
        setProfilePct(res.data?.completion?.percentage ?? 100);
        setHasSkillCategory(res.data?.completion?.hasSkillCategory ?? true);
      })
      .catch(() => { setProfilePct(100); setHasSkillCategory(true); });
  };

  useEffect(() => {
    if (user && isGuardedRole) fetchProfilePct();
    else setProfilePct(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isGuardedRole]);

  useEffect(() => {
    if (prevPath.current === '/profile' && location.pathname !== '/profile' && isGuardedRole) {
      fetchProfilePct();
    }
    prevPath.current = location.pathname;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Profile-completion gate DISABLED (see ProfileGuard) — the sidebar no longer
  // locks menu items for users below the old 80% threshold. profilePct is still
  // fetched so the sidebar can display the completion indicator.
  const needsProfileCompletion = false;

  // ── Build menu ───────────────────────────────────────────────────────────────
  let menuItems;

  if (isCoachOrExpert) {
    menuItems = isCoach ? coachMenuItems : expertMenuItems;
  } else if (isVendor) {
    // Vendors have their own dashboard; without this they fell through to the
    // recruiter menu and saw someone else's items on shared pages like dash_view.
    // Mirrors the vendor dashboard's own nav so the sidebar looks the same on
    // shared pages like dash_view. Messages/Inbox stay out — they're the floating
    // buttons bottom-right.
    menuItems = [
      { icon: UserPlus, label: 'Register Recruiter', path: '/vendor-dashboard#register' },
      { icon: Users,    label: 'My Recruiters',      path: '/vendor-dashboard#recruiters' },
      {
        icon: FileText,
        label: 'Candidates',
        children: [
          { icon: FileText,  label: 'All Candidates',    path: '/vendor-dashboard#candidates' },
          { icon: UserCheck, label: 'Direct Applicants', path: '/vendor-dashboard#direct-applicants' },
        ],
      },
      {
        icon: Briefcase,
        label: 'Positions',
        children: [
          { icon: Briefcase,     label: 'Open Positions',     path: '/vendor-dashboard#positions' },
          { icon: ClipboardList, label: 'Assigned Positions', path: '/vendor-dashboard#assigned-positions' },
          { icon: PlusCircle,    label: 'Add Position',       path: '/vendor-dashboard#add-position' },
          { icon: FolderOpen,    label: 'Added Positions',    path: '/vendor-dashboard#added-positions' },
          { icon: Building2,     label: 'Companies',          path: '/vendor-dashboard#companies' },
        ],
      },
      {
        icon: Mic,
        label: 'Position Briefings',
        children: [
          { icon: ClipboardList, label: 'My Briefings', path: '/my-briefings' },
          { icon: Mic,           label: 'Add Briefing', path: '/my-briefings#pending' },
        ],
      },
      { icon: BarChart3, label: 'Reports', path: '/vendor-dashboard#reports' },
    ];
  } else if (isClientSpoc) {
    menuItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/ad_panel#dashboard' },
      {
        icon: Users,
        label: 'Candidates',
        children: [
          { icon: Users,    label: 'All Candidates',     path: '/ad_panel#candidates' },
          { icon: FileText, label: 'Direct Applications', path: '/clientspoc-direct-applications' },
          { icon: BarChart3, label: 'Candidate Stats',   path: '/ad_panel#position-stats' },
        ],
      },
      {
        icon: Briefcase,
        label: 'Positions',
        children: [
          { icon: UserPlus,  label: 'Add Position',       path: '/ad_panel#add-position' },
          { icon: Briefcase, label: 'My Added Positions', path: '/ad_panel#my-added-positions' },
          { icon: Mic,       label: 'Position Briefings', path: '/ad_panel#position-briefings' },
          { icon: TrendingUp, label: 'My Position Stats', path: '/ad_panel#clientspoc-my-positions' },
          { icon: Building2, label: 'Company Positions',  path: '/clientspoc-company-approvals' },
          { icon: Briefcase, label: 'All Positions',      path: '/ad_panel#positions' },
        ],
      },
      {
        icon: ClipboardList,
        label: 'Requests',
        children: [
          { icon: Users,    label: 'Recruiter Requests',         path: '/ad_panel#coach-expert-requests' },
          { icon: UserCheck, label: 'New Recruiter Requests',    path: '/ad_panel#access-requests' },
          { icon: Users,    label: 'Direct Coach/Expert Requests', path: '/ad_panel#direct-coach-expert-requests' },
          { icon: Users,    label: 'Coach-Recruiter Assignments', path: '/ad_panel#coach-recruiter-assignments' },
        ],
      },
      { icon: BarChart3, label: 'Reports', path: '/clientspoc-reports' },
      {
        icon: Users,
        label: 'Users',
        children: [
          { icon: UserPlus, label: 'Add Coach',   path: '/ad_panel#add-coach' },
          { icon: UserPlus, label: 'Add Expert',  path: '/ad_panel#add-expert' },
          { icon: Users,    label: 'Coach',       path: '/ad_panel#all-coaches' },
          { icon: Users,    label: 'Expert',      path: '/ad_panel#all-experts' },
          { icon: Users,    label: 'Recruiters',  path: '/ad_panel#all-recruiters' },
        ],
      },
      { icon: DollarSign, label: 'My Earnings', path: '/my-earnings' },
    ];
  } else {
    // Recruiter
    menuItems = buildRecruiterMenu(user?.planType ?? 1);
  }

  // Managers (employees with the "Manager" designation) get a Manager Panel.
  if (isManager && Array.isArray(menuItems)) {
    menuItems = [{ icon: UserCheck, label: 'Manager Panel', path: '/manager' }, ...menuItems];
  }

  const isActive = (path) => {
    if (path.includes('#')) {
      return location.pathname === path.split('#')[0] && location.hash === '#' + path.split('#')[1];
    }
    return location.pathname === path;
  };

  const childPaths = (item) => item.children?.map(c => c.path) ?? [];
  const isGroupActive = (item) => item.children?.some(c => isActive(c.path)) ?? false;

  // ── Accordion open state — auto-open groups whose child is active ────────────
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    // We don't have menuItems at init time for the lazy case, so default all groups open
    return initial;
  });

  // When location changes, auto-open the group containing the active route
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      menuItems.forEach(item => {
        if (item.children && item.children.some(c => isActive(c.path))) {
          next[item.label] = true;
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // ── Lock helpers ─────────────────────────────────────────────────────────────
  const lockReason = needsAgreement ? 'sign agreement first' : 'complete profile first';

  const pathAllowed = (path) => {
    if (needsAgreement)        return path === '/profile' || path === agreementPath;
    if (needsProfileCompletion) return path === '/profile';
    return true;
  };

  // ── Render helpers ───────────────────────────────────────────────────────────
  const renderLeaf = (item, indent = false) => {
    const Icon   = item.icon;
    const active = isActive(item.path);
    const allowed = pathAllowed(item.path);
    const showChatBadge = item.path === '/messages' && chatUnread > 0;
    const showNewPosBadge = item.label === 'Open Positions' && newPosCount > 0;
    const showCandBadge = item.path === '/ad_panel#candidates' && candPending > 0;
    const showDirectBadge = item.path === '/clientspoc-direct-applications' && directChanged > 0;

    if (!allowed) {
      return (
        <li key={item.path}>
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-30 cursor-not-allowed select-none ${indent ? 'pl-8' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? `${item.label} (${lockReason})` : ''}
          >
            <Icon size={18} className="flex-shrink-0 text-blue-300" />
            {!isCollapsed && <span className="font-medium text-sm flex-1 truncate text-blue-200">{item.label}</span>}
          </div>
        </li>
      );
    }

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
            active
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
          } ${indent && !isCollapsed ? 'pl-8' : ''} ${isCollapsed ? 'justify-center' : ''} ${showChatBadge ? 'animate-chat-blink' : ''}`}
          title={isCollapsed ? item.label : ''}
        >
          <span className="relative flex-shrink-0">
            <Icon size={18} />
            {showChatBadge && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-blue-800 animate-ping" />}
            {showChatBadge && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />}
            {showNewPosBadge && isCollapsed && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-blue-800" />}
            {showCandBadge && isCollapsed && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-blue-800" />}
            {showDirectBadge && isCollapsed && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-sky-400 rounded-full ring-2 ring-blue-800" />}
          </span>
          {!isCollapsed && (
            <span className="font-medium text-sm flex-1 truncate">{item.label}</span>
          )}
          {showChatBadge && !isCollapsed && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{chatUnread}</span>
          )}
          {showNewPosBadge && !isCollapsed && (
            <span title={`${newPosCount} new position${newPosCount > 1 ? 's' : ''} in the last 48 hours`}
              className="bg-emerald-400 text-emerald-950 text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">{newPosCount}</span>
          )}
          {showCandBadge && !isCollapsed && (
            <span title={`${candPending} candidate${candPending > 1 ? 's' : ''} with status not updated`}
              className="bg-amber-400 text-amber-950 text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">{candPending}</span>
          )}
          {showDirectBadge && !isCollapsed && (
            <span title={`${directChanged} direct applicant${directChanged > 1 ? 's' : ''} whose status has been changed`}
              className="bg-sky-400 text-sky-950 text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">{directChanged}</span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
              {item.label}
            </div>
          )}
        </Link>
      </li>
    );
  };

  // Aggregate count for a group header (so the number is visible even when the
  // accordion is collapsed). Sums the relevant child counts.
  const groupCount = (item) => {
    const paths = childPaths(item);
    let n = 0;
    if (paths.includes('/ad_panel#candidates')) n += candPending;
    if (paths.includes('/clientspoc-direct-applications')) n += directChanged;
    return n;
  };

  const renderGroup = (item) => {
    const Icon     = item.icon;
    const groupOpen = isCollapsed ? true : (openGroups[item.label] ?? isGroupActive(item));
    const anyActive = isGroupActive(item);
    const gCount = groupCount(item);

    if (isCollapsed) {
      // In collapsed mode render children directly as leaf icons with tooltips
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
          {gCount > 0 && !groupOpen && (
            <span className="bg-amber-400 text-amber-950 text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">{gCount}</span>
          )}
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
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-900 to-blue-800 transition-all duration-300 shadow-2xl flex flex-col`}
      style={{ height: '100%' }}
    >
      {/* ── Logo ── */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="w-auto object-contain" style={{ height: '100%' }} />
            </div>
          )}
          {isCollapsed && (
            <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="w-auto object-contain mx-auto" style={{ height: '100%' }} />
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0 ${isCollapsed ? 'mx-auto mt-4' : ''}`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* ── User info ── */}
      <div className="flex-shrink-0 p-4 border-b border-blue-700/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name || 'Recruiter'}</p>
              <p className="text-blue-300 text-xs truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Banners ── */}
      {needsAgreement && !isCollapsed && (
        <div className="flex-shrink-0 mx-3 mt-3 px-3 py-2 bg-orange-500/20 border border-orange-400/40 rounded-lg">
          <p className="text-orange-200 text-xs font-semibold leading-snug">Please sign your agreement to unlock all features.</p>
        </div>
      )}
      {needsProfileCompletion && !isCollapsed && (
        <div className="flex-shrink-0 mx-3 mt-3 px-3 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-lg">
          <p className="text-yellow-200 text-xs font-semibold leading-snug">
            {!hasSkillCategory
              ? 'Please select a Skill Category in your profile.'
              : `Profile ${profilePct}% complete. Reach 80% to unlock all features.`}
          </p>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900" style={{ minHeight: 0 }}>
        <ul className="space-y-1">
          {menuItems.map(item =>
            item.children ? renderGroup(item) : renderLeaf(item, false)
          )}

          {/* Inject agreement link if needed */}
          {needsAgreement && !menuItems.some(m => m.path === agreementPath) && (
            <li key="agreement-inject">
              <Link
                to={agreementPath}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive(agreementPath)
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'bg-orange-500/30 text-orange-200 hover:bg-orange-500/50 hover:text-white border border-orange-400/40'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? 'Sign Agreement' : ''}
              >
                <FileText size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm flex-1 truncate">Sign Agreement</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    Sign Agreement
                  </div>
                )}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* ── Logout ── */}
      <div className="flex-shrink-0 p-4 border-t border-blue-700/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
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

export default Sidebar;
