import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { registerInstall, checkForUpdate } from '../lib/appInstall';
import { isNativeApp } from '../lib/apiBase';

// Native-app-only: registers the install on launch and shows an "update
// available" banner when a newer APK is published. Renders nothing on the web.
export default function MobileAppGate() {
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    registerInstall();
    checkForUpdate().then((u) => { if (u?.updateAvailable) setUpdate(u); });
  }, []);

  if (!update || (dismissed && !update.mandatory)) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg,#2563eb,#6366f1)', color: '#fff',
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          Update available{update.latestVersion ? ` (v${update.latestVersion})` : ''}
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {update.notes || 'A newer version of the app is ready to install.'}
        </div>
      </div>
      <a href={update.url} target="_blank" rel="noopener noreferrer"
        onClick={(e) => { try { window.open(update.url, '_system'); } catch (_) {} }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#2563eb',
          fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 9, textDecoration: 'none', flexShrink: 0 }}>
        <Download size={15} /> Update
      </a>
      {!update.mandatory && (
        <button onClick={() => setDismissed(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
