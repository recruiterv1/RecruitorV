import { isNativeApp } from './apiBase';

// Native-app chrome: brand the status bar and hide the splash once the web view
// is ready. No-op on the website.
export const initNativeUI = async () => {
  if (!isNativeApp()) return;
  // Mark the document so mobile-only CSS fixes apply
  try { document.documentElement.classList.add('native-app'); } catch { /* ignore */ }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#0b0f1e' });
    await StatusBar.setStyle({ style: Style.Light });
  } catch { /* status bar plugin unavailable */ }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* splash plugin unavailable */ }

  // Hardware back button: navigate back through in-app history instead of
  // closing the app. Only exit when there's nothing left to go back to.
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch { /* app plugin unavailable */ }
};
