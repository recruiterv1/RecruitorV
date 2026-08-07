import { createRoot } from 'react-dom/client'
import './index.css'
import './dark-theme.css'
// Initialise the default Firebase app FIRST — App.jsx and many pages call
// getAuth()/getStorage() on the default app, which throws "No Firebase App
// '[DEFAULT]'" if init hasn't run. It previously only ran when a lazy chunk that
// imports ./firebase happened to load, so routes without it (e.g. SuperAdmin
// dashboard) broke. Importing here guarantees init before anything renders.
import './firebase.js'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import AuthPro from './context/AuthPro.jsx'

// After a new deploy, tabs still running the old build reference lazy chunks whose
// hashes no longer exist, so a route change throws "error loading dynamically
// imported module" (the Application Error page). Recover automatically by reloading
// once to pull the fresh index.html + chunks. Guarded so it never loops.
const recoverFromStaleChunk = (evt) => {
  const msg = String(evt?.reason?.message || evt?.message || '');
  if (!/dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(msg)) return;
  if (sessionStorage.getItem('rv_chunk_reloaded')) return; // already tried once this session
  sessionStorage.setItem('rv_chunk_reloaded', '1');
  window.location.reload();
};
window.addEventListener('vite:preloadError', recoverFromStaleChunk);
window.addEventListener('unhandledrejection', recoverFromStaleChunk);
// Clear the guard on a clean load so a genuinely-broken chunk still surfaces later.
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('rv_chunk_reloaded'), 4000));

createRoot(document.getElementById('root')).render(

  
  <AuthPro>
    <BrowserRouter>
  
    <App />
  
  </BrowserRouter>
  </AuthPro>


)

// Remove the branded boot splash once the app has mounted
if (typeof window !== 'undefined' && typeof window.__hideBootSplash === 'function') {
  requestAnimationFrame(() => window.__hideBootSplash());
}
