import axios from 'axios';
import { isNativeApp } from './apiBase';

// Registers this device for FCM push and sends the token to the backend so the
// server can notify the logged-in user about new chat messages. No-op on web.
let started = false;
let currentToken = '';

export const initPush = async () => {
  if (!isNativeApp() || started) return;
  started = true;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    await PushNotifications.register();

    // Ensure the "chat" channel exists so notifications display as heads-up
    try {
      await PushNotifications.createChannel({
        id: 'chat', name: 'Chat', description: 'New chat messages',
        importance: 5, visibility: 1, sound: 'default',
      });
    } catch { /* ignore (older Android) */ }

    PushNotifications.addListener('registration', async (token) => {
      currentToken = token.value;
      try {
        await axios.post('/api/chat/push-token', { token: token.value, platform: 'android' }, { withCredentials: true });
      } catch (e) { /* ignore */ }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error', err);
    });

    // Tapped a notification → route to the relevant screen
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      try {
        const type = action?.notification?.data?.type || '';
        const dest = {
          chat: '/messages',
          candidate: '/coach-recruiter-stats',
          'assignment-accepted': '/coach-recruiter-stats',
          'request-approved': '/coach-expert-positions',
          assignment: '/coach-assigned-positions',
          'access-approved': '/assigned-positions',
        }[type];
        if (dest) window.location.href = dest;
      } catch { /* ignore */ }
    });
  } catch (e) {
    console.error('initPush failed', e);
  }
};

// Called on logout so the device stops receiving this user's pushes.
export const teardownPush = async () => {
  if (!isNativeApp()) return;
  try {
    if (currentToken) {
      await axios.post('/api/chat/push-token/remove', { token: currentToken }, { withCredentials: true }).catch(() => {});
    }
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
  } catch (e) { /* ignore */ }
  started = false;
  currentToken = '';
};
