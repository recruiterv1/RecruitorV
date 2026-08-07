import axios from 'axios';
import { isNativeApp } from './apiBase';

// JWT auth token for the native mobile app. On the website auth still rides on
// the `__session` cookie; in the Capacitor web view (cross-site cookies are
// blocked) we send this token as an `Authorization: Bearer` header instead.
const KEY = 'rv_auth_token';

export const getAuthToken = () => {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};

// IMPORTANT: only persist the bearer token inside the native app. On the website
// auth is cookie-based and the token is not needed — storing it there would arm
// the response interceptor below, which would then log the user out on ANY 401
// (including authorization 401s from admin-only endpoints), not just real session
// expiry. That was silently logging Admin / Super Admin out on every refresh.
export const setAuthToken = (t) => {
  try { if (t && isNativeApp()) localStorage.setItem(KEY, t); } catch { /* ignore */ }
};

export const clearAuthToken = () => {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
};

// Attach the bearer token to every axios request (no-op on web if absent).
let installed = false;
export const installAuthInterceptor = () => {
  if (installed) return;
  installed = true;

  // Purge any bearer token that was mistakenly stored on the website during the
  // period when web logins persisted it. Without this, users who logged in then
  // keep arming the 401 auto-logout until they sign out. Native app keeps its token.
  if (!isNativeApp()) clearAuthToken();
  axios.interceptors.request.use((config) => {
    const t = getAuthToken();
    if (t) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });

  // The login token is short-lived (1h). When it expires mid-session the app
  // would otherwise stay "logged in" while every authenticated action silently
  // fails ("action failed"). Catch the expired/invalid-token response, clear the
  // stored token and send the user back to login so they re-authenticate —
  // exactly how the website behaves when its session cookie expires.
  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      try {
        const status = error?.response?.status;
        const msg = (error?.response?.data?.message || '').toLowerCase();
        const url = (error?.config?.url || '').toString();
        // The auth-resolution probes legitimately return 401 during normal login
        // resolution — e.g. /admin/authcheck 401s for every NON-admin user while
        // AuthPro figures out their role on page load. These must NOT be treated
        // as a session expiry, or every non-admin gets logged out on refresh.
        const isAuthProbe = /\/(admin\/authcheck|auth\/check)(\?|$)/.test(url);
        const tokenIssue =
          status === 401 ||
          (status === 403 &&
            (msg.includes('invalid or expired token') ||
              msg.includes('no token found') ||
              msg.includes('expired')));
        // Only act when we actually thought we were signed in (a token exists),
        // so genuine "forbidden action" 403s and logged-out states are untouched.
        if (tokenIssue && getAuthToken() && !isAuthProbe) {
          clearAuthToken();
          const path = (typeof window !== 'undefined' && window.location.pathname) || '';
          const onAuthPage = /^\/(log_rec|reg|forgot|reset|otp)/.test(path);
          if (!onAuthPage) {
            window.location.href = '/log_rec?expired=true';
          }
        }
      } catch {
        /* ignore */
      }
      return Promise.reject(error);
    }
  );
};
