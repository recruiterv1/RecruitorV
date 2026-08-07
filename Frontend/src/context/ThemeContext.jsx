import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserStateContext } from './AuthPro';

// ─────────────────────────────────────────────────────────────────────────────
// Theme control.
//
// Dark mode is rolled out ROLE BY ROLE. A role listed in DARK_DEFAULT_ROLES
// lands in dark mode; everyone else stays light. Either way the user can flip
// it with the header toggle, and their choice is remembered per account.
//
// Rollout order (add roles here as each phase is signed off):
//   1. Coach   ← current phase
//   2. Expert
//   3. Recruiter
//   4. Vendor
//   5. ClientSPOC
//
// The theme is applied by putting data-theme="dark" on <html>; the override
// stylesheet (dark-theme.css) does the rest. No component logic depends on it,
// so nothing can break functionally by switching.
// ─────────────────────────────────────────────────────────────────────────────

const DARK_DEFAULT_ROLES = ['coach'];

export const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, canUseDark: false });

export const useTheme = () => useContext(ThemeContext);

const normRole = (user) =>
  (user?.roleCategory || user?.role || '').toLowerCase().replace(/\s+/g, '');

const storageKey = (user) => `rv_theme:${(user?.email || 'anon').toLowerCase()}`;

export const ThemeProvider = ({ children }) => {
  const { user } = useContext(UserStateContext);
  const [theme, setTheme] = useState('light');

  const role = normRole(user);
  // Only roles in the rollout can use dark mode at all.
  const canUseDark = DARK_DEFAULT_ROLES.includes(role);

  // Resolve the theme whenever the signed-in user changes.
  useEffect(() => {
    if (!user) { setTheme('light'); return; }
    if (!canUseDark) { setTheme('light'); return; }
    let saved = null;
    try { saved = localStorage.getItem(storageKey(user)); } catch (_) {}
    setTheme(saved === 'light' || saved === 'dark' ? saved : 'dark'); // default dark for rolled-out roles
  }, [user?.email, canUseDark]);

  // Reflect onto <html> so the stylesheet can scope everything off one attribute.
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'dark') el.setAttribute('data-theme', 'dark');
    else el.removeAttribute('data-theme');
    return () => el.removeAttribute('data-theme');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(storageKey(user), next); } catch (_) {}
      return next;
    });
  }, [user?.email]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, canUseDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
