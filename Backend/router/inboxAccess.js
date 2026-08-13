/**
 * Inbox Access management (SuperAdmin/Admin only).
 *
 * The sidebar "Inbox" is a PAID feature. The menu stays visible for everyone, but
 * the Inbox page only works for users a SuperAdmin/Admin has granted access to.
 * Access is stored in Firestore collection `inbox_access`, doc id = lowercased
 * login email, `{ email, enabled, name, role, updatedAt, updatedBy }`.
 * enabled === true means access; absent or false means no access.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const adminVerify = require('../model_fire/adminCF');
const recruiterF = require('../model_fire/recruiterF');

const lc = (s) => (s || '').toString().toLowerCase().trim();

// Mirror the proven SuperAdmin gate from router/admin.js: any admin_db record is a
// valid manager, OR a recruiter_db user with Super Admin role. (The panel's own
// account may be stored in admin_db with a non-admin roleCategory, so role must NOT
// be over-checked here — presence in admin_db is what authorizes the panel.)
async function managerAuth(req, res, next) {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.SECKEY); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
  try {
    let result = await adminVerify.checkData(decoded.email);
    const fromAdminDb = result.success;
    let acct = result.admin;
    if (!result.success) {
      const rec = await recruiterF.findRecruiterByEmail(decoded.email);
      if (rec && (rec.role === 'Super Admin' || rec.roleCategory === 'SuperAdmin')) { acct = rec; result.success = true; }
    }
    if (!result.success) return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    if (!fromAdminDb && acct.role !== 'Super Admin' && acct.roleCategory !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    }
    req.managerEmail = decoded.email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

// Roles that use the sidebar Inbox and can therefore be granted access.
const INBOX_ROLES = ['recruiter', 'coach', 'expert', 'clientspoc', 'client spoc', 'vendor'];

const toIso = (v) => v ? (v.toDate ? v.toDate().toISOString() : new Date(v).toISOString()) : null;
const accessActive = (a) => {
  if (!a || a.enabled !== true) return false;
  if (a.validUntil) { const ms = a.validUntil.toMillis ? a.validUntil.toMillis() : new Date(a.validUntil).getTime(); return ms > Date.now(); }
  return true;
};

// Building the combined user list means scanning 4 collections, which is slow. Cache
// the result for a short TTL so pagination + search hit memory, not Firestore. The
// list carries live access info; /toggle invalidates it so grants show immediately.
let _usersCache = { ts: 0, list: [] };
const USERS_TTL = 60 * 1000;
const invalidateUsersCache = () => { _usersCache.ts = 0; };

const buildUserList = async () => {
  // .select() fetches only the fields we need → far less data than full docs.
  const F = ['email', 'name', 'firstName', 'role', 'roleCategory',
             'phone', 'mobile', 'mob', 'isVerified',
             'createdAt', 'date', 'datePosted', 'timestamp', 'created_at'];
  const [recSnap, coachSnap, expertSnap, adminSnap, accessSnap] = await Promise.all([
    db.collection('recruiter_db').select(...F).get(),
    db.collection('coach_db').select(...F).get(),
    db.collection('expert_db').select(...F).get(),
    db.collection('admin_db').select(...F).get(),
    db.collection('inbox_access').get(),
  ]);
  const access = {};
  accessSnap.docs.forEach(d => { access[d.id] = d.data(); });

  const seen = new Set();
  const out = [];
  const push = (data, defaultRole) => {
    const email = lc(data.email);
    if (!email || seen.has(email)) return;
    const role = lc(data.roleCategory || data.role || defaultRole);
    if (!INBOX_ROLES.includes(role)) return; // skip admins/superadmins
    seen.add(email);
    const a = access[email];
    // "Clicked but didn't purchase": a payment was started (order/subscription
    // created when they clicked a plan) but never completed (no lastPaymentId)
    // and access isn't active. The plan they picked is the intent.
    const clickedNoPurchase = !!(a && !accessActive(a) && (a.orderId || a.subscriptionId) && !a.lastPaymentId);
    out.push({
      email,
      name: data.name || data.firstName || email.split('@')[0],
      phone: data.phone || data.mobile || data.mob || '',
      registeredOn: toIso(data.createdAt || data.created_at || data.date || data.datePosted || data.timestamp || null),
      role: role === 'client spoc' ? 'clientspoc' : role,
      enabled: accessActive(a),
      source: a?.source || (a?.enabled ? 'admin' : null),
      freeDuration: a?.freeDuration || null,
      validUntil: toIso(a?.validUntil),
      subscriptionStatus: a?.subscriptionStatus || null,
      plan: a?.plan || null,
      months: a?.months || null,
      autopay: a?.autopay || false,
      clickedPlan: clickedNoPurchase ? (a.plan || null) : null,   // '6month' | '1year' | null
      // isVerified === false makes the inbound-mail handler DROP mail to this user's
      // derived @recruiterv.com address (recruiterEmail.js matchDerived). Surface it
      // so a SuperAdmin can fix a paid user who "can't receive email".
      verified: data.isVerified !== false,
    });
  };
  recSnap.docs.forEach(d => push(d.data(), 'recruiter'));
  coachSnap.docs.forEach(d => push(d.data(), 'coach'));
  expertSnap.docs.forEach(d => push(d.data(), 'expert'));
  adminSnap.docs.forEach(d => push(d.data(), '')); // admin_db holds ClientSPOCs + Vendors
  out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return out;
};

const getUserList = async () => {
  if (Date.now() - _usersCache.ts < USERS_TTL && _usersCache.list.length) return _usersCache.list;
  const list = await buildUserList();
  _usersCache = { ts: Date.now(), list };
  return list;
};

// GET /users?q=&page=&pageSize= — paginated, searchable inbox-capable users.
router.get('/users', managerAuth, async (req, res) => {
  try {
    const q = lc(req.query.q);
    const status = lc(req.query.status || 'all');   // all | paid | free | clicked | noaccess
    const plan = lc(req.query.plan || '');           // '' | 6month | 1year
    const fromMs = req.query.from ? new Date(req.query.from).getTime() : null;
    const toMs = req.query.to ? new Date(req.query.to).getTime() + (24 * 60 * 60 * 1000 - 1) : null; // include the whole "to" day
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(req.query.pageSize, 10) || 25));

    const all = await getUserList();
    const grantedCount = all.reduce((n, u) => n + (u.enabled ? 1 : 0), 0);

    let filtered = q ? all.filter(u => u.email.includes(q) || (u.name || '').toLowerCase().includes(q)) : all.slice();
    if (status !== 'all') {
      filtered = filtered.filter(u => {
        if (status === 'paid') return u.enabled && u.source === 'subscription';
        if (status === 'free') return u.enabled && u.source === 'admin';
        if (status === 'clicked') return !!u.clickedPlan;             // clicked a plan, didn't pay
        if (status === 'noaccess') return !u.enabled && !u.clickedPlan;
        return true;
      });
    }
    if (plan) filtered = filtered.filter(u => u.plan === plan || u.clickedPlan === plan);
    if (fromMs != null) filtered = filtered.filter(u => u.registeredOn && new Date(u.registeredOn).getTime() >= fromMs);
    if (toMs != null)   filtered = filtered.filter(u => u.registeredOn && new Date(u.registeredOn).getTime() <= toMs);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const users = filtered.slice(start, start + pageSize);

    res.json({ success: true, users, total, page, pageSize, totalPages, grantedCount, totalUsers: all.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Free-grant durations a SuperAdmin can pick (days; lifetime = no expiry).
const FREE_DURATIONS = { '1month': 30, 'quarterly': 90, 'halfyearly': 180, 'lifetime': null };

// POST /toggle  { email, enabled, duration?, name?, role? } — grant/revoke free access.
// duration ∈ 1month | quarterly | halfyearly | lifetime (default lifetime).
router.post('/toggle', managerAuth, async (req, res) => {
  try {
    const email = lc(req.body?.email);
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });
    const enabled = !!req.body?.enabled;
    const duration = enabled ? (req.body?.duration || 'lifetime') : null;
    if (enabled && !(duration in FREE_DURATIONS)) {
      return res.status(400).json({ success: false, message: 'Invalid duration.' });
    }
    // Admin grant = a "free" comp: source 'admin'. Lifetime has no expiry; the
    // others set validUntil so the same expiry check applies as paid subs.
    let validUntil = null;
    if (enabled) {
      const days = FREE_DURATIONS[duration];
      validUntil = days == null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    await db.collection('inbox_access').doc(email).set({
      email, enabled,
      source: 'admin',
      freeDuration: enabled ? duration : null,
      validUntil,
      name: (req.body?.name || '').toString(),
      role: lc(req.body?.role || ''),
      updatedAt: new Date(),
      updatedBy: req.managerEmail,
    }, { merge: true });
    invalidateUsersCache();   // so the change shows on the next /users load
    res.json({ success: true, email, enabled, duration });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /verify-user  { email } — set isVerified:true on the user's role record.
// A user with isVerified === false has inbound mail to their derived
// @recruiterv.com address silently dropped, so a paid Inbox is never delivered.
// This lets a SuperAdmin flip that flag. Searches the three derived-address
// collections (recruiter/coach/expert); ClientSPOCs/Vendors use their real login
// email and aren't affected by the derived-address verification gate.
router.post('/verify-user', managerAuth, async (req, res) => {
  try {
    const email = lc(req.body?.email);
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });
    let updated = null;
    for (const col of ['recruiter_db', 'coach_db', 'expert_db']) {
      const snap = await db.collection(col).where('email', '==', email).limit(1).get();
      if (!snap.empty) { await snap.docs[0].ref.update({ isVerified: true }); updated = col; break; }
    }
    if (!updated) return res.status(404).json({ success: false, message: 'No recruiter/coach/expert record found for that email.' });
    invalidateUsersCache();   // so the verified badge clears on the next /users load
    res.json({ success: true, email, collection: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
