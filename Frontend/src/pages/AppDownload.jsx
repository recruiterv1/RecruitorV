import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Smartphone, ShieldCheck, RefreshCw } from 'lucide-react';

// Public page where anyone can download the latest Android app (APK). The
// download URL + version come from /api/app/version, so publishing a new APK
// (and bumping the version) updates this page automatically.
export default function AppDownload() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    axios.get('/api/app/version').then(r => setInfo(r.data)).catch(() => setInfo(null));
  }, []);
  const url = info?.url || 'https://www.recruiterv.com/downloads/recruiterv.apk';
  const version = info?.version || '';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0b0f1e,#1e293b)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, margin: '0 auto 20px', background: 'linear-gradient(135deg,#2563eb,#f97316)',
          display: 'grid', placeItems: 'center', boxShadow: '0 12px 40px rgba(37,99,235,0.4)' }}>
          <Smartphone size={40} />
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>RecruiterV for Android</h1>
        <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 15 }}>Download and install the RecruiterV app on your phone.</p>
        {version && <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>Latest version: <strong style={{ color: '#cbd5e1' }}>v{version}</strong></p>}

        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#2563eb,#6366f1)',
            color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(37,99,235,0.4)' }}>
          <Download size={20} /> Download APK
        </a>

        <div style={{ marginTop: 34, textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={16} /> How to install</h3>
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
      </div>
    </div>
  );
}
