/**
 * Role-wise announcement bar.
 *
 * A SuperAdmin writes announcements for one or more roles; each user sees the
 * ones aimed at their own role scrolling across the top of their dashboard.
 * Stored in Firestore `announcements`.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

const lc = (s) => String(s || '').toLowerCase().trim();
const MANAGER_ROLES = ['superadmin', 'super admin', 'admin'];

// Roles an announcement can target. 'all' is a shorthand for everyone.
const AUDIENCE_ROLES = [
  { key: 'all',            label: 'Everyone' },
  { key: 'recruiter',      label: 'Recruiter' },
  { key: 'coach',          label: 'Coach' },
  { key: 'expert',         label: 'Expert' },
  { key: 'clientspoc',     label: 'ClientSPOC' },
  { key: 'vendor',         label: 'Vendor' },
  { key: 'company',        label: 'Company' },
  { key: 'consultingfirm', label: 'Consulting Firm' },
  { key: 'admin',          label: 'Admin' },
  { key: 'superadmin',     label: 'SuperAdmin' },
];
const ROLE_KEYS = new Set(AUDIENCE_ROLES.map(r => r.key));

const TONES = ['info', 'success', 'warning', 'critical'];

const toDate = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000);
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

async function managerAuth(req, res, next) {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  let email;
  try { email = jwt.verify(token, process.env.SECKEY).email; }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
  try {
    const find = async (col) => {
      for (const v of [...new Set([email, lc(email)])]) {
        const s = await db.collection(col).where('email', '==', v).limit(1).get();
        if (!s.empty) return s.docs[0].data();
      }
      return null;
    };
    const u = (await find('admin_db')) || (await find('recruiter_db'));
    const role = lc(u?.roleCategory || u?.role);
    if (!u || !MANAGER_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    }
    req.managerEmail = email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

const shape = (doc) => {
  const a = doc.data();
  return {
    id: doc.id,
    text: a.text || '',
    roles: Array.isArray(a.roles) ? a.roles : [],
    tone: TONES.includes(a.tone) ? a.tone : 'info',
    link: a.link || '',
    enabled: a.enabled === true,
    startsAt: toDate(a.startsAt),
    endsAt: toDate(a.endsAt),
    createdAt: toDate(a.createdAt),
    updatedAt: toDate(a.updatedAt),
    updatedBy: a.updatedBy || '',
  };
};

// Is this announcement showing right now?
const isCurrent = (a, now = new Date()) => {
  if (!a.enabled || !a.text.trim()) return false;
  if (a.startsAt && a.startsAt > now) return false;
  if (a.endsAt && a.endsAt < now) return false;
  return true;
};

// ── SuperAdmin: manage ───────────────────────────────────────────────────────

router.get('/meta', managerAuth, (_req, res) => {
  res.json({ success: true, roles: AUDIENCE_ROLES, tones: TONES });
});

router.get('/', managerAuth, async (_req, res) => {
  try {
    const snap = await db.collection('announcements').get();
    const items = snap.docs.map(shape).sort((a, b) =>
      (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
    res.json({ success: true, announcements: items, roles: AUDIENCE_ROLES, tones: TONES });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

const readBody = (body, existing = {}) => {
  const roles = Array.isArray(body?.roles)
    ? [...new Set(body.roles.map(lc).filter(r => ROLE_KEYS.has(r)))]
    : (existing.roles || []);
  return {
    text: String(body?.text ?? existing.text ?? '').trim().slice(0, 500),
    roles,
    tone: TONES.includes(body?.tone) ? body.tone : (existing.tone || 'info'),
    link: String(body?.link ?? existing.link ?? '').trim().slice(0, 500),
    enabled: body?.enabled === undefined ? (existing.enabled === true) : body.enabled === true,
    startsAt: body?.startsAt ? new Date(body.startsAt) : (existing.startsAt || null),
    endsAt: body?.endsAt ? new Date(body.endsAt) : (existing.endsAt || null),
  };
};

router.post('/', managerAuth, async (req, res) => {
  try {
    const data = readBody(req.body);
    if (!data.text) return res.status(400).json({ success: false, message: 'Write the announcement text.' });
    if (!data.roles.length) return res.status(400).json({ success: false, message: 'Choose at least one role.' });

    const { FieldValue } = require('firebase-admin/firestore');
    const ref = await db.collection('announcements').add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.managerEmail,
    });
    res.json({ success: true, id: ref.id, message: 'Announcement created.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', managerAuth, async (req, res) => {
  try {
    const ref = db.collection('announcements').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Announcement not found.' });

    const data = readBody(req.body, shape(doc));
    if (!data.text) return res.status(400).json({ success: false, message: 'Write the announcement text.' });
    if (!data.roles.length) return res.status(400).json({ success: false, message: 'Choose at least one role.' });

    const { FieldValue } = require('firebase-admin/firestore');
    await ref.set({ ...data, updatedAt: FieldValue.serverTimestamp(), updatedBy: req.managerEmail }, { merge: true });
    res.json({ success: true, message: 'Saved.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', managerAuth, async (req, res) => {
  try {
    await db.collection('announcements').doc(req.params.id).delete();
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Everyone: what should scroll in my bar? ──────────────────────────────────
// Deliberately open to any signed-in user, and returns only what their own role
// is meant to see. Never 500s — a broken announcement bar must not break a
// dashboard, so failures come back as an empty list.
router.get('/mine', async (req, res) => {
  try {
    const token = req.cookies?.__session;
    if (!token) return res.json({ success: true, announcements: [] });

    let email;
    try { email = lc(jwt.verify(token, process.env.SECKEY).email); }
    catch { return res.json({ success: true, announcements: [] }); }
    if (!email) return res.json({ success: true, announcements: [] });

    // Work out the caller's role from wherever their account lives.
    let role = '';
    const lookups = [
      ['admin_db', null], ['recruiter_db', 'recruiter'],
      ['coach_db', 'coach'], ['expert_db', 'expert'],
    ];
    for (const [col, fallback] of lookups) {
      const s = await db.collection(col).where('email', '==', email).limit(1).get();
      if (!s.empty) {
        const d = s.docs[0].data();
        role = lc(d.roleCategory || d.role || fallback || '').replace(/\s/g, '');
        break;
      }
    }
    if (!role) return res.json({ success: true, announcements: [] });
    if (role === 'super admin') role = 'superadmin';

    const snap = await db.collection('announcements').where('enabled', '==', true).get();
    const now = new Date();
    const items = snap.docs.map(shape)
      .filter(a => isCurrent(a, now))
      .filter(a => a.roles.includes('all') || a.roles.includes(role))
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .map(({ id, text, tone, link }) => ({ id, text, tone, link }));

    res.json({ success: true, role, announcements: items });
  } catch (e) {
    console.error('announcements/mine:', e.message);
    res.json({ success: true, announcements: [] });
  }
});

module.exports = router;
