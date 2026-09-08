import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Smartphone, ShieldCheck, RefreshCw, Share, Plus, CheckCircle2 } from 'lucide-react';

// Public page for getting RecruiterV onto a phone.
//
// Android gets the APK, as before. iOS cannot: Apple allows no sideloading, and
// a native app would need an Apple Developer account and App Store review. What
// iOS does allow is Add to Home Screen — with the apple-touch-icon and
// apple-mobile-web-app-capable tags in index.html, that gives a real icon on the
// home screen opening full-screen with no Safari chrome.
//
// The page shows whichever route applies to the device it is opened on, and
// lets the reader switch if the detection is wrong.
export default function AppDownload() {
  const [info, setInfo] = useState(null);
  const [tab, setTab] = useState(null);          // 'ios' | 'android', null until detected
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    axios.get('/api/app/version').then(r => setInfo(r.data)).catch(() => setInfo(null));
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    // iPadOS 13+ reports itself as a Mac, so the touch-point check catches it.
    const isIOS = /iPad|iPhone|iPod/.test(ua)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setTab(isIOS ? 'ios' : 'android');
    // Already added to the home screen — say so instead of repeating the steps.
    setInstalled(window.navigator.standalone === true
      || window.matchMedia?.('(display-mode: standalone)').matches === true);
  }, []);

  const url = info?.url || 'https://www.recruiterv.com/downloads/recruiterv.apk';
  const version = info?.version || '';

  const card = { marginTop: 28, textAlign: 'left', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20 };
  const h3 = { margin: '0 0 14px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 };
  const tabBtn = (active) => ({
    flex: 1, padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
    fontSize: 13.5, fontWeight: 700, transition: 'all .15s',
    background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
    color: active ? '#fff' : '#94a3b8',
  });

  // One step of the iOS walkthrough.
  const Step = ({ n, icon, children }) => (
    <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
      <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: 'rgba(37,99,235,0.25)',
        border: '1px solid rgba(59,130,246,0.5)', color: '#93c5fd', fontSize: 12.5, fontWeight: 800,
        display: 'grid', placeItems: 'center' }}>{n}</span>
      <span style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.65 }}>
        {children}
        {icon && <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6,
          padding: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>{icon}</span>}
      </span>
    </li>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0b0f1e,#1e293b)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, margin: '0 auto 20px', background: 'linear-gradient(135deg,#2563eb,#f97316)',
          display: 'grid', placeItems: 'center', boxShadow: '0 12px 40px rgba(37,99,235,0.4)' }}>
          <Smartphone size={40} />
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>Get RecruiterV on your phone</h1>

        {installed ? (
          <p style={{ margin: '0 0 4px', color: '#4ade80', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <CheckCircle2 size={17} /> You're running the installed app.
          </p>
        ) : (
          <p style={{ margin: '0 0 22px', color: '#94a3b8', fontSize: 15 }}>
            {tab === 'ios' ? 'Add RecruiterV to your home screen — it opens like any other app.'
                           : 'Download and install the RecruiterV app.'}
          </p>
        )}

        {!installed && tab && (
          <>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: 5, marginBottom: 4 }}>
              <button style={tabBtn(tab === 'ios')} onClick={() => setTab('ios')}>iPhone / iPad</button>
              <button style={tabBtn(tab === 'android')} onClick={() => setTab('android')}>Android</button>
            </div>

            {tab === 'ios' ? (
              <div style={card}>
                <h3 style={h3}><Share size={16} /> Add to Home Screen</h3>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  <Step n="1" icon={<Share size={14} />}>
                    In <strong>Safari</strong>, tap the <strong>Share</strong> button — the square with an arrow
                    coming out of the top.
                  </Step>
                  <Step n="2" icon={<Plus size={14} />}>
                    Scroll down the list and tap <strong>“Add to Home Screen”</strong>.
                  </Step>
                  <Step n="3">
                    Tap <strong>Add</strong>. The RecruiterV icon appears on your home screen like any other app.
                  </Step>
                </ol>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12.5, lineHeight: 1.6 }}>
                  This must be done in Safari — Chrome on iPhone has no “Add to Home Screen”. Apple does not allow
                  apps to be installed from anywhere but the App Store, so this is how RecruiterV gets onto an iPhone.
                </p>
              </div>
            ) : (
              <div style={card}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#2563eb,#6366f1)',
                    color: '#fff', fontWeight: 700, fontSize: 16, padding: '13px 26px', borderRadius: 12, textDecoration: 'none',
                    boxShadow: '0 8px 30px rgba(37,99,235,0.4)', marginBottom: 18 }}>
                  <Download size={20} /> Download APK
                </a>
                {version && <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
                  Latest version: <strong style={{ color: '#cbd5e1' }}>v{version}</strong></p>}
                <h3 style={h3}><ShieldCheck size={16} /> How to install</h3>
                <ol style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.9 }}>
                  <li>Tap <strong>Download APK</strong> above.</li>
                  <li>Open the downloaded file. If prompted, allow <em>“Install from unknown sources”</em> for your browser.</li>
                  <li>Tap <strong>Install</strong>, then <strong>Open</strong>.</li>
                </ol>
                <p style={{ margin: '14px 0 0', color: '#64748b', fontSize: 12.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <RefreshCw size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  The app always shows the latest features automatically. You'll be prompted here when a new app version is available.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
