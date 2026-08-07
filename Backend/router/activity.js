// ─────────────────────────────────────────────────────────────────────────────
// Lightweight user activity / session tracking.
//
// The app sends a heartbeat (POST /activity/ping) every few minutes while a user
// is signed in and the tab is visible. Each ping records "PING_MINUTES" of active
// time into that user's daily bucket + the current hour bucket (in IST), and
// stamps lastPing. From this we derive:
//   • hours active today / this week / this month
//   • the hour-slots the user is most often active in
//   • whether the user is ACTIVE NOW (pinged within the last few minutes)
//
// Storage: one doc per user in `user_activity/{emailLower}`:
//   { email, role, name, lastPing, daily: { 'YYYY-MM-DD': { m, h: { '0'..'23': min } } } }
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const PING_MINUTES = 3;                        // minutes credited per heartbeat
const ACTIVE_NOW_MS = 6 * 60 * 1000;           // "active now" if pinged within 6 min
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;    // Asia/Kolkata (no DST)

// Return { dateKey: 'YYYY-MM-DD', hour: 0..23 } for a Date, in IST.
function istParts(date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return { dateKey: `${y}-${m}-${d}`, hour: ist.getUTCHours() };
}

function emailKey(email) {
  return (email || '').toString().toLowerCase().trim();
}

// POST /activity/ping — heartbeat from an authenticated user.
router.post('/ping', async (req, res) => {
  try {
    const token = req.cookies?.__session;
    if (!token) return res.status(401).json({ ok: false });
    let decoded;
    try { decoded = jwt.verify(token, process.env.SECKEY); }
    catch { return res.status(401).json({ ok: false }); }

    const email = emailKey(decoded.email);
    if (!email) return res.status(400).json({ ok: false });

    const { db } = require('./firebase_ad');
    const { FieldValue } = require('firebase-admin/firestore');

    // Access revoked mid-session? The heartbeat is our fastest signal (runs every
    // few minutes and on every tab focus), so tell the client to sign out now
    // rather than letting a declined user keep working until their next refresh.
    try {
      for (const col of ['recruiter_db', 'coach_db', 'expert_db']) {
        const s = await db.collection(col).where('email', '==', email).limit(1).get();
        if (!s.empty) {
          if ((s.docs[0].data().accountStatus || '') === 'blocked') {
            return res.status(403).json({ ok: false, errorCode: 'ACCOUNT_BLOCKED', message: 'Your access has been put on hold by the administrator.' });
          }
          break;
        }
      }
    } catch (_) { /* never let the status probe break the heartbeat */ }
    const now = new Date();
    const { dateKey, hour } = istParts(now);

    // Which device the user is pinging from (mobile app / phone browser vs desktop).
    const device = ((req.body && req.body.device) || '').toString().toLowerCase() === 'mobile' ? 'mobile' : 'desktop';

    const ref = db.collection('user_activity').doc(email);
    await ref.set({
      email,
      lastPing: now,
      role: (req.body && req.body.role) || decoded.portal || '',
      devices: { [device]: now },   // per-device last-seen timestamp
      daily: {
        [dateKey]: {
          m: FieldValue.increment(PING_MINUTES),
          h: { [String(hour)]: FieldValue.increment(PING_MINUTES) },
        },
      },
    }, { merge: true });

    return res.json({ ok: true });
  } catch (err) {
    console.error('activity/ping error:', err.message);
    return res.status(500).json({ ok: false });
  }
});

// ── Helpers used by reports ──────────────────────────────────────────────────

const fmtHour = (h) => {
  const hr = ((h % 24) + 24) % 24;
  const ampm = hr < 12 ? 'AM' : 'PM';
  let display = hr % 12; if (display === 0) display = 12;
  return `${display}:00 ${ampm}`;
};

// Compute session stats from a user_activity document's data.
function computeStats(data, now = new Date()) {
  const empty = { activeNow: false, lastPing: null, hoursToday: 0, hoursWeek: 0, hoursMonth: 0, slots: [] };
  if (!data) return empty;

  const { dateKey: todayKey } = istParts(now);

  // Week (Mon–today) and month (YYYY-MM) boundaries in IST.
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const dow = istNow.getUTCDay();            // 0 Sun .. 6 Sat
  const sinceMon = (dow + 6) % 7;
  const weekStart = new Date(istNow.getTime() - sinceMon * 24 * 60 * 60 * 1000);
  const weekStartKey = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}-${String(weekStart.getUTCDate()).padStart(2, '0')}`;
  const monthPrefix = todayKey.slice(0, 7);

  const daily = data.daily || {};
  let minToday = 0, minWeek = 0, minMonth = 0;
  const hourAgg = {};          // hour -> minutes, aggregated over last ~30 days
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoffKey = istParts(cutoff).dateKey;

  Object.keys(daily).forEach(dk => {
    const day = daily[dk] || {};
    const m = Number(day.m) || 0;
    if (dk === todayKey) minToday += m;
    if (dk >= weekStartKey) minWeek += m;
    if (dk.startsWith(monthPrefix)) minMonth += m;
    if (dk >= cutoffKey && day.h) {
      Object.keys(day.h).forEach(hk => { hourAgg[hk] = (hourAgg[hk] || 0) + (Number(day.h[hk]) || 0); });
    }
  });

  // Peak active hour-slots: hours with activity >= 45% of the busiest hour.
  const hours = Array.from({ length: 24 }, (_, h) => hourAgg[String(h)] || 0);
  const maxVal = Math.max(...hours);
  let slots = [];
  if (maxVal > 0) {
    const threshold = Math.max(maxVal * 0.45, PING_MINUTES); // ignore trivial one-off hours
    const active = hours.map(v => v >= threshold);
    // Group contiguous active hours into [start, endInclusive] ranges.
    const ranges = [];
    let start = null;
    for (let h = 0; h < 24; h++) {
      if (active[h] && start === null) start = h;
      if ((!active[h] || h === 23) && start !== null) {
        const end = active[h] ? h : h - 1;
        const total = hours.slice(start, end + 1).reduce((a, b) => a + b, 0);
        ranges.push({ start, end, total });
        start = null;
      }
    }
    ranges.sort((a, b) => b.total - a.total);
    slots = ranges.slice(0, 2).map(r => `${fmtHour(r.start)} to ${fmtHour(r.end + 1)}`);
  }

  const lastPingMs = data.lastPing?._seconds ? data.lastPing._seconds * 1000
    : (data.lastPing ? new Date(data.lastPing).getTime() : 0);

  return {
    activeNow: lastPingMs > 0 && (now.getTime() - lastPingMs) <= ACTIVE_NOW_MS,
    lastPing: lastPingMs ? new Date(lastPingMs).toISOString() : null,
    hoursToday: Math.round((minToday / 60) * 10) / 10,
    hoursWeek:  Math.round((minWeek / 60) * 10) / 10,
    hoursMonth: Math.round((minMonth / 60) * 10) / 10,
    slots,
  };
}

// Batch-fetch activity stats for a list of emails → { emailLower: stats }.
async function fetchActivityMap(db, emails) {
  const keys = [...new Set((emails || []).map(emailKey).filter(Boolean))];
  const out = {};
  if (!keys.length) return out;
  const now = new Date();
  const refs = keys.map(k => db.collection('user_activity').doc(k));
  // getAll supports many refs in one round-trip.
  const CHUNK = 300;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const docs = await db.getAll(...refs.slice(i, i + CHUNK));
    docs.forEach(doc => {
      out[doc.id] = doc.exists ? computeStats(doc.data(), now) : computeStats(null, now);
    });
  }
  return out;
}

// ── Device usage (mobile / desktop) ──────────────────────────────────────────
const RECENT_DEVICE_MS = 7 * 24 * 60 * 60 * 1000;   // "uses this device" window
const toMs = (v) => v?._seconds ? v._seconds * 1000 : (v ? new Date(v).getTime() : 0);

function deviceFlags(data, now = Date.now()) {
  const d = (data && data.devices) || {};
  const mMs = toMs(d.mobile), dMs = toMs(d.desktop);
  return {
    mobile:      mMs > 0 && (now - mMs) <= RECENT_DEVICE_MS,
    desktop:     dMs > 0 && (now - dMs) <= RECENT_DEVICE_MS,
    mobileNow:   mMs > 0 && (now - mMs) <= ACTIVE_NOW_MS,
    desktopNow:  dMs > 0 && (now - dMs) <= ACTIVE_NOW_MS,
  };
}

async function fetchDeviceMap(db, emails) {
  const keys = [...new Set((emails || []).map(emailKey).filter(Boolean))];
  const out = {};
  if (!keys.length) return out;
  const now = Date.now();
  const refs = keys.map(k => db.collection('user_activity').doc(k));
  const CHUNK = 300;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const docs = await db.getAll(...refs.slice(i, i + CHUNK));
    docs.forEach(doc => { out[doc.id] = doc.exists ? deviceFlags(doc.data(), now) : deviceFlags(null, now); });
  }
  return out;
}

// Admin (or SuperAdmin in recruiter_db) gate for the device-status endpoint.
async function isAdminReq(req) {
  try {
    const token = req.cookies?.__session || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.SECKEY);
    const email = decoded.email;
    const { db } = require('./firebase_ad');
    const adm = await db.collection('admin_db').where('email', '==', email).limit(1).get();
    if (!adm.empty) return true;
    const rec = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
    if (!rec.empty) { const rc = (rec.docs[0].data().roleCategory || rec.docs[0].data().role || '').toLowerCase(); if (rc === 'super admin' || rc === 'superadmin') return true; }
    return false;
  } catch { return false; }
}

// POST /activity/device-status { emails:[...] } (admin) → per-email device flags.
router.post('/device-status', async (req, res) => {
  try {
    if (!(await isAdminReq(req))) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { db } = require('./firebase_ad');
    const map = await fetchDeviceMap(db, (req.body && req.body.emails) || []);
    return res.json({ success: true, devices: map });
  } catch (err) {
    console.error('device-status error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
module.exports.computeStats = computeStats;
module.exports.fetchActivityMap = fetchActivityMap;
module.exports.fetchDeviceMap = fetchDeviceMap;
