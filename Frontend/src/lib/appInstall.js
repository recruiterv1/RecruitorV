// Native-app install tracking + update check. All no-ops on the plain website.
import axios from 'axios';
import { isNativeApp } from './apiBase';

const DEVICE_KEY = 'rv_device_id';

const genId = () => {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return 'd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
};

const getDeviceId = () => {
  let id = '';
  try { id = localStorage.getItem(DEVICE_KEY) || ''; } catch (_) {}
  if (!id) { id = genId(); try { localStorage.setItem(DEVICE_KEY, id); } catch (_) {} }
  return id;
};

// Read installed app version/build via @capacitor/app (native only).
const getAppInfo = async () => {
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return { version: info.version || '', build: parseInt(info.build, 10) || 0 };
  } catch (_) { return { version: '', build: 0 }; }
};

// Report this install to the backend (once per launch).
export const registerInstall = async () => {
  if (!isNativeApp()) return;
  try {
    const { version, build } = await getAppInfo();
    let platform = 'android';
    try { const { Capacitor } = await import('@capacitor/core'); platform = Capacitor.getPlatform(); } catch (_) {}
    await axios.post('/api/app/register-install', {
      deviceId: getDeviceId(), platform, appVersion: version, appBuild: build,
    }, { withCredentials: true });
  } catch (_) { /* ignore */ }
};

// Returns { updateAvailable, url, notes, mandatory, latestVersion } or null.
export const checkForUpdate = async () => {
  if (!isNativeApp()) return null;
  try {
    const [{ build }, res] = await Promise.all([getAppInfo(), axios.get('/api/app/version')]);
    const latest = res.data || {};
    const latestCode = Number(latest.versionCode) || 0;
    if (latestCode > (build || 0)) {
      return { updateAvailable: true, url: latest.url, notes: latest.notes || '', mandatory: !!latest.mandatory, latestVersion: latest.version };
    }
  } catch (_) {}
  return null;
};
