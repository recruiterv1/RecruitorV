/**
 * Paid plans for Vendor and Consulting Firm accounts.
 *
 * Two one-time plans; there is no auto-renewal — the account holder re-pays when
 * the term ends, exactly like the inbox plans in inboxPayment.js, whose Razorpay
 * credentials and signature scheme this reuses.
 *
 *   6 months  ₹6,999
 *  12 months  ₹12,999
 *
 * Access ends when `validUntil` passes. A SuperAdmin can grant free access or
 * extend a term without payment.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const { db } = require('./firebase_ad');

const lc = (s) => String(s || '').toLowerCase().trim();
const env = (k) => { const v = process.env[k]; return (v && v !== 'UNSET') ? v : ''; };
const SUBS = db.collection('portal_subscriptions');

const PLANS = {
  '6month': { key: '6month', label: '6 Months', months: 6, amountPaise: 699900 },
  '1year':  { key: '1year',  label: '12 Months', months: 12, amountPaise: 1299900 },
};
const planCatalog = () => Object.values(PLANS).map(({ key, label, months, amountPaise }) =>
  ({ key, label, months, amountPaise, amount: amountPaise / 100 }));

// Built lazily so a missing key never crashes boot.
const rzp = () => {
  const id = env('RAZORPAY_KEY_ID'), secret = env('RAZORPAY_KEY_SECRET');
  if (!id || !secret) return null;
  return new Razorpay({ key_id: id, key_secret: secret });
};

const toDate = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Is this account allowed in right now?
 * Free access granted by a SuperAdmin always wins; otherwise the paid term must
 * not have passed. Accounts with no subscription record at all are treated as
 * within a grace period so nothing that worked yesterday breaks today.
 */
const subscriptionState = (sub) => {
  if (!sub) return { active: true, reason: 'no-plan-yet', validUntil: null, free: false };
  if (sub.freeAccess === true) {
    const until = toDate(sub.freeUntil);
    if (!until || until > new Date()) {
      return { active: true, reason: 'free', validUntil: until, free: true };
    }
  }
  const until = toDate(sub.validUntil);
  if (!until) return { active: false, reason: 'never-paid', validUntil: null, free: false };
  return {
    active: until > new Date(),
    reason: until > new Date() ? 'paid' : 'expired',
    validUntil: until, free: false,
  };
};

const readSub = async (email) => {
  const d = await SUBS.doc(lc(email)).get();
  return d.exists ? d.data() : null;
};

/** Used by vendor/consulting login to refuse an expired account. */
async function assertSubscriptionActive(email) {
  const state = subscriptionState(await readSub(email));
  return state;
}

const isLoggedIn = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
};

// ── Plans + my status ────────────────────────────────────────────────────────
router.get('/plans', (_req, res) => {
  res.json({ success: true, plans: planCatalog(), configured: !!rzp(), keyId: env('RAZORPAY_KEY_ID') || '' });
});

router.get('/status', isLoggedIn, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const sub = await readSub(email);
    const state = subscriptionState(sub);
    res.json({
      success: true,
      plans: planCatalog(),
      keyId: env('RAZORPAY_KEY_ID') || '',
      subscription: {
        plan: sub?.plan || null,
        active: state.active, reason: state.reason, free: state.free,
        validUntil: state.validUntil ? state.validUntil.toISOString() : null,
        lastPaymentId: sub?.lastPaymentId || '',
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Pay ──────────────────────────────────────────────────────────────────────
// One-time order. The term is added on verify, so a failed payment grants nothing.
router.post('/order', isLoggedIn, async (req, res) => {
  try {
    const plan = PLANS[req.body?.plan];
    if (!plan) return res.status(400).json({ success: false, message: 'Choose a plan.' });
    const client = rzp();
    if (!client) return res.status(503).json({ success: false, message: 'Payments are not configured yet.' });

    const email = lc(req.user.email);
    const order = await client.orders.create({
      amount: plan.amountPaise,
      currency: env('RAZORPAY_CURRENCY') || 'INR',
      receipt: `portal_${Date.now()}`,
      notes: { email, plan: plan.key, purpose: 'portal_subscription' },
    });

    await SUBS.doc(email).set({
      email, plan: plan.key, months: plan.months,
      pendingOrderId: order.id, updatedAt: new Date(),
    }, { merge: true });

    res.json({
      success: true, orderId: order.id, amount: order.amount,
      currency: order.currency, keyId: env('RAZORPAY_KEY_ID'),
      plan: { key: plan.key, label: plan.label, months: plan.months },
    });
  } catch (e) {
    console.error('portal order error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Signature = HMAC(order_id|payment_id) — same scheme as the inbox plans.
router.post('/verify', isLoggedIn, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields.' });
    }
    const expected = crypto.createHmac('sha256', env('RAZORPAY_KEY_SECRET'))
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    const email = lc(req.user.email);
    const sub = await readSub(email);
    const months = sub?.months || PLANS[sub?.plan]?.months || 6;

    // Extend from whichever is later — the current expiry or today — so paying
    // early never costs the account the days it already has.
    const current = toDate(sub?.validUntil);
    const from = current && current > new Date() ? current : new Date();
    const validUntil = new Date(from.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    await SUBS.doc(email).set({
      email, plan: sub?.plan || '6month', months,
      validUntil, status: 'active',
      lastPaymentId: razorpay_payment_id, lastOrderId: razorpay_order_id,
      paidAt: new Date(), pendingOrderId: null, updatedAt: new Date(),
    }, { merge: true });

    res.json({ success: true, validUntil: validUntil.toISOString(), message: 'Payment received. Your account is active.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});


// ── SuperAdmin controls ──────────────────────────────────────────────────────
const MANAGER_ROLES = ['superadmin', 'super admin', 'admin'];

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
    if (!u || !MANAGER_ROLES.includes(lc(u.roleCategory || u.role))) {
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    }
    req.managerEmail = email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

// GET /admin/accounts — every vendor and consulting firm with its plan state.
router.get('/admin/accounts', managerAuth, async (_req, res) => {
  try {
    const [adminSnap, firmSnap, subSnap] = await Promise.all([
      db.collection('admin_db').get(),
      db.collection('consulting_firms').get(),
      SUBS.get(),
    ]);
    const subs = {};
    subSnap.docs.forEach(d => { subs[d.id] = d.data(); });

    const rows = [];
    adminSnap.docs.forEach(d => {
      const a = d.data();
      const role = lc(a.roleCategory || a.role || '').replace(/\s/g, '');
      if (role !== 'vendor') return;
      const email = lc(a.email);
      const st = subscriptionState(subs[email]);
      rows.push({
        email, name: a.name || '', type: 'Vendor',
        plan: subs[email]?.plan || null, free: st.free, active: st.active, reason: st.reason,
        validUntil: st.validUntil ? st.validUntil.toISOString() : null,
      });
    });
    firmSnap.docs.forEach(d => {
      const f = d.data();
      const email = lc(f.email);
      const st = subscriptionState(subs[email]);
      rows.push({
        email, name: f.name || '', type: 'Consulting Firm',
        plan: subs[email]?.plan || null, free: st.free, active: st.active, reason: st.reason,
        validUntil: st.validUntil ? st.validUntil.toISOString() : null,
      });
    });

    rows.sort((a, b) => Number(a.active) - Number(b.active) || a.name.localeCompare(b.name));
    res.json({ success: true, accounts: rows, plans: planCatalog() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/grant  { email, mode: 'free'|'extend'|'revoke', months, until }
// 'free' waives payment entirely; 'extend' adds paid time without a payment;
// 'revoke' removes free access and lets the paid term stand on its own.
router.post('/admin/grant', managerAuth, async (req, res) => {
  try {
    const email = lc(req.body?.email);
    const mode = String(req.body?.mode || 'free');
    if (!email) return res.status(400).json({ success: false, message: 'email is required.' });

    const sub = await readSub(email);
    const patch = { email, updatedAt: new Date(), grantedBy: req.managerEmail };

    if (mode === 'free') {
      patch.freeAccess = true;
      // No date means free for good; a date means free until then.
      patch.freeUntil = req.body?.until ? new Date(req.body.until) : null;
    } else if (mode === 'revoke') {
      patch.freeAccess = false;
      patch.freeUntil = null;
    } else if (mode === 'extend') {
      const months = Math.max(1, Math.min(60, parseInt(req.body?.months, 10) || 6));
      const current = toDate(sub?.validUntil);
      const from = current && current > new Date() ? current : new Date();
      patch.validUntil = new Date(from.getTime() + months * 30 * 24 * 60 * 60 * 1000);
      patch.months = months;
      patch.status = 'active';
    } else {
      return res.status(400).json({ success: false, message: 'Unknown mode.' });
    }

    await SUBS.doc(email).set(patch, { merge: true });
    const st = subscriptionState(await readSub(email));
    res.json({
      success: true,
      message: mode === 'free' ? 'Free access granted.'
        : mode === 'revoke' ? 'Free access removed.'
        : 'Access extended.',
      active: st.active,
      validUntil: st.validUntil ? st.validUntil.toISOString() : null,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
module.exports.assertSubscriptionActive = assertSubscriptionActive;
module.exports.subscriptionState = subscriptionState;
module.exports.PLANS = PLANS;
