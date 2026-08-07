import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// In the native app the web view is served from https://localhost, so relative
// API calls must be pointed at the live backend. On the website this is a no-op
// (requests stay same-origin).
export const API_BASE = 'https://www.recruiterv.com';

export const isNativeApp = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

export const configureApiBase = () => {
  if (isNativeApp()) {
    axios.defaults.baseURL = API_BASE;
    try { document.documentElement.classList.add('native-app'); } catch { /* ignore */ }
  }
};

// The mobile app supports Recruiters / Coaches / Experts / ClientSPOC / Vendor.
// Admin, Super Admin and Referrer remain website-only.
const APP_BLOCKED_ROLES = [
  'super admin', 'superadmin', 'admin', 'referrer', 'referer',
];

export const isRoleAllowedInApp = (roleCategory) =>
  !APP_BLOCKED_ROLES.includes((roleCategory || '').toLowerCase().trim());
