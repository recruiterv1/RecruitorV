import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Smartphone, Monitor } from 'lucide-react';

// Fetch mobile/desktop usage flags for a list of user emails (SuperAdmin only).
export function useDeviceStatus(emails) {
  const [map, setMap] = useState({});
  const list = [...new Set((emails || []).filter(Boolean).map(e => String(e).toLowerCase().trim()))];
  const key = list.slice().sort().join(',');
  useEffect(() => {
    if (!list.length) { setMap({}); return; }
    let live = true;
    axios.post('/activity/device-status', { emails: list }, { withCredentials: true })
      .then(r => { if (live && r.data?.success) setMap(r.data.devices || {}); })
      .catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

// Green icon = active right now on that device; grey = used it in the last 7 days.
export function DeviceBadges({ status, size = 15 }) {
  const s = status || {};
  if (!s.mobile && !s.desktop) return <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {s.mobile && (
        <Smartphone size={size} color={s.mobileNow ? '#16a34a' : '#94a3b8'}
          title={s.mobileNow ? 'Active on mobile now' : 'Recently used mobile'} />
      )}
      {s.desktop && (
        <Monitor size={size} color={s.desktopNow ? '#16a34a' : '#94a3b8'}
          title={s.desktopNow ? 'Active on desktop now' : 'Recently used desktop'} />
      )}
    </span>
  );
}
