import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, ClipboardList, MessageSquare, BarChart3, UserCheck, Users, UserPlus, FileText } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { isNativeApp } from '../lib/apiBase';

// Role-specific quick-access tabs. Shown ONLY in the native mobile app, ONLY
// after login. Five items each.
const NAVS = {
  recruiter: [
    { icon: Briefcase,      label: 'Open',      path: '/dash_position' },
    { icon: ClipboardList,  label: 'Assigned',  path: '/assigned-positions' },
    { icon: MessageSquare,  label: 'Messages',  path: '/messages' },
    { icon: BarChart3,      label: 'Reports',   path: '/recruiter-reports' },
    { icon: UserCheck,      label: 'Direct',    path: '/recruiter-direct-applicants' },
  ],
  coach: [
    { icon: Briefcase,      label: 'Open',      path: '/coach-expert-positions' },
    { icon: ClipboardList,  label: 'Assigned',  path: '/coach-expert-assigned-positions' },
    { icon: MessageSquare,  label: 'Messages',  path: '/messages' },
    { icon: Users,          label: 'My Team',   path: '/coach-team' },
    { icon: UserPlus,       label: 'Assign',    path: '/coach-assign-recruiter' },
  ],
  clientspoc: [
    { icon: FileText,       label: 'Applies',   path: '/clientspoc-direct-applications' },
    { icon: Briefcase,      label: 'Positions', path: '/ad_panel#my-added-positions' },
    { icon: MessageSquare,  label: 'Messages',  path: '/ad_panel#messages' },
    { icon: BarChart3,      label: 'Reports',   path: '/clientspoc-reports' },
    { icon: Users,          label: 'Candidates',path: '/ad_panel#candidates' },
  ],
};

const MobileBottomNav = () => {
  const ctx = useContext(UserStateContext);
  const navigate = useNavigate();
  const location = useLocation();
  const user = ctx?.user;

  // Pick the nav set from the signed-in role. Check type, roleCategory and role
  // (different login paths populate different fields).
  let key = null;
  if (user) {
    const rc = (user.roleCategory || user.role || '').toLowerCase().replace(/\s/g, '');
    if (user.type === 'recruiter' || rc === 'recruiter') key = 'recruiter';
    else if (user.type === 'coach' || user.type === 'expert' || rc === 'coach' || rc === 'expert') key = 'coach';
    else if (rc === 'clientspoc' || rc === 'clientspocs') key = 'clientspoc';
  }
  const visible = isNativeApp() && !!key;

  // Reserve space so the fixed bar never covers page content (incl. iOS safe area).
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = 'calc(62px + env(safe-area-inset-bottom, 0px))';
    return () => { document.body.style.paddingBottom = prev; };
  }, [visible]);

  if (!visible) return null;

  const items = NAVS[key];
  const isActive = (path) => {
    const [p, h] = path.split('#');
    if (h) return location.pathname === p && location.hash === `#${h}`;
    return location.pathname === p;
  };

  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999,
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        background: '#ffffff', borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = isActive(it.path);
        const color = active ? '#2563eb' : '#6b7280';
        return (
          <button
            key={it.path}
            type="button"
            onClick={() => navigate(it.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '8px 2px 9px', background: 'transparent', border: 'none', cursor: 'pointer',
              minWidth: 0,
            }}
          >
            <Icon size={21} color={color} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color, lineHeight: 1, whiteSpace: 'nowrap' }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
