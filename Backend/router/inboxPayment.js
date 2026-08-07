/**
 * Inbox subscription payments (Razorpay Subscriptions / autopay).
 *
 * The sidebar Inbox is a paid feature. Recruiter/Coach/Expert/Vendor can subscribe
 * (₹ per 30-day cycle, auto-charged) to get access; ClientSPOCs are free/admin-only.
 * A successful charge writes inbox_access/{loginEmail} with source 'subscription' and
 * validUntil = the Razorpay period end, which is exactly what recruiterEmail.js
 * hasInboxAccess() checks — so access flips on/off automatically and shows up in the
 * SuperAdmin "Inbox Access" page with no manual step.
 *
 * Env (Firebase secrets): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID,
 * RAZORPAY_WEBHOOK_SECRET, RAZORPAY_AMOUNT_PAISE (display), RAZORPAY_CURRENCY (display).
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const { db } = require('./firebase_ad');

const lc = (s) => (s || '').toString().toLowerCase().trim();
// Secrets are pre-created as the placeholder 'UNSET' so the function can deploy
// before real Razorpay keys exist; treat that (and empty) as "not configured".
const env = (k) => { const v = process.env[k]; return (v && v !== 'UNSET') ? v : ''; };
const ELIGIBLE_ROLES = ['recruiter', 'coach', 'expert', 'vendor'];
const ACCESS = db.collection('inbox_access');

// Two fixed inbox plans (autopay). Each maps to a Razorpay plan created with that
// interval; the plan id comes from a secret.
// totalCount = max billing cycles ("until cancelled"), within Razorpay's caps
// (monthly ≤ 120, yearly ≤ 100).
const PLANS = {
  '6month': { label: '6 Months', months: 6, amountPaise: 69900, planEnv: 'RAZORPAY_PLAN_6MONTH', totalCount: 120 },
  '1year':  { label: '1 Year',  months: 12, amountPaise: 129900, planEnv: 'RAZORPAY_PLAN_1YEAR', totalCount: 100 },
};
const planId = (key) => env(PLANS[key]?.planEnv);
const plansConfigured = () => Object.keys(PLANS).every(k => !!planId(k));
const planCatalog = () => Object.entries(PLANS).map(([key, p]) => ({ key, label: p.label, months: p.months, amountPaise: p.amountPaise }));
const planMonths = (key) => PLANS[key]?.months || 6;

// Lazily build the client so a missing key doesn't crash boot.
const rzp = () => {
  const id = env('RAZORPAY_KEY_ID'), secret = env('RAZORPAY_KEY_SECRET');
  if (!id || !secret) return null;
  return new Razorpay({ key_id: id, key_secret: secret });
};

// Auth: any logged-in user (cookie __session or Bearer handled elsewhere; here cookie).
const isLoggedIn = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
};

// Resolve an eligible payer across the four billable roles.
const resolvePayUser = async (loginEmail) => {
  const email = lc(loginEmail);
  const first = async (col, role) => {
    const s = await db.collection(col).where('email', '==', email).limit(1).get();
    if (s.empty) return null;
    return { id: s.docs[0].id, ...s.docs[0].data(), role };
  };
  const rec = await first('recruiter_db', 'recruiter'); if (rec) return rec;
  const coach = await first('coach_db', 'coach'); if (coach) return coach;
  const expert = await first('expert_db', 'expert'); if (expert) return expert;
  // Vendors live in admin_db (roleCategory Vendor)
  const a = await db.collection('admin_db').where('email', '==', email).limit(1).get();
  if (!a.empty) {
    const d = a.docs[0].data();
    if (lc(d.roleCategory || d.role) === 'vendor') return { id: a.docs[0].id, ...d, role: 'vendor' };
  }
  return null;
};

const readAccess = async (email) => {
  const doc = await ACCESS.doc(lc(email)).get();
  return doc.exists ? doc.data() : null;
};
const activeNow = (a) => {
  if (!a || a.enabled !== true) return false;
  if (a.validUntil) { const ms = a.validUntil.toMillis ? a.validUntil.toMillis() : new Date(a.validUntil).getTime(); return ms > Date.now(); }
  return true;
};
const toIso = (v) => v ? (v.toDate ? v.toDate().toISOString() : new Date(v).toISOString()) : null;

// ── GET /status ───────────────────────────────────────────────────────────────
// Current user's eligibility + subscription state (for the paywall UI).
router.get('/status', isLoggedIn, async (req, res) => {
  try {
    const user = await resolvePayUser(req.user.email);
    const a = await readAccess(req.user.email);
    const eligible = !!user && ELIGIBLE_ROLES.includes(user.role);
    res.json({
      success: true,
      eligible,
      role: user?.role || null,
      hasAccess: activeNow(a),
      source: a?.source || null,               // 'admin' (free) | 'subscription'
      status: a?.subscriptionStatus || null,   // razorpay subscription status
      autopay: a?.autopay || false,
      validUntil: toIso(a?.validUntil),
      plan: a?.plan || null,                    // which plan they're on (6month / 1year)
      months: a?.months || null,
      configured: !!(env('RAZORPAY_KEY_ID') && plansConfigured()),
      keyId: env('RAZORPAY_KEY_ID') || null,
      currency: env('RAZORPAY_CURRENCY') || 'INR',
      plans: planCatalog(),                     // [{ key, label, months, amountPaise }]
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /subscribe ─────────────────────────────────────────────────────────
// Create (or re-create, for "resume") a Razorpay subscription for this user.
// Returns { subscriptionId, keyId } for Razorpay Checkout.
router.post('/subscribe', isLoggedIn, async (req, res) => {
  try {
    const client = rzp();
    const plan = lc(req.body?.plan) || '6month';
    if (!client || !PLANS[plan] || !planId(plan)) {
      return res.status(503).json({ success: false, message: 'Payments are not configured yet. Please contact the administrator.' });
    }
    const user = await resolvePayUser(req.user.email);
    if (!user || !ELIGIBLE_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'This account is not eligible for an Inbox subscription.' });
    }
    const email = lc(req.user.email);
    const months = planMonths(plan);

    const sub = await client.subscriptions.create({
      plan_id: planId(plan),
      total_count: PLANS[plan].totalCount,   // within Razorpay's per-period cap
      customer_notify: 1,
      notes: { email, role: user.role, name: user.name || '', plan, months: String(months) },
    });

    // Record the pending subscription so the webhook/verify can reconcile it.
    await ACCESS.doc(email).set({
      email, role: user.role, name: user.name || '',
      source: 'subscription', plan, months,
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,     // 'created'
      autopay: true,
      updatedAt: new Date(),
    }, { merge: true });

    res.json({ success: true, subscriptionId: sub.id, keyId: env('RAZORPAY_KEY_ID'), plan, months });
  } catch (e) {
    console.error('subscribe error:', e?.error || e.message);
    res.status(500).json({ success: false, message: e?.error?.description || e.message });
  }
});

// ── POST /order ───────────────────────────────────────────────────────────────
// One-time payment for a plan term (autopay paused). A Razorpay Order supports
// ALL methods — UPI, cards, netbanking, wallets — unlike a recurring
// subscription (which only offers auto-debit methods). Access is granted for the
// plan's term on verify; there is no auto-renewal, the user re-pays when it ends.
router.post('/order', isLoggedIn, async (req, res) => {
  try {
    const client = rzp();
    const plan = lc(req.body?.plan) || '6month';
    if (!client || !PLANS[plan]) {
      return res.status(503).json({ success: false, message: 'Payments are not configured yet. Please contact the administrator.' });
    }
    const user = await resolvePayUser(req.user.email);
    if (!user || !ELIGIBLE_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'This account is not eligible for an Inbox subscription.' });
    }
    const email = lc(req.user.email);
    const months = planMonths(plan);
    const receipt = `inbox_${Date.now()}`.slice(0, 40);

    const order = await client.orders.create({
      amount: PLANS[plan].amountPaise,
      currency: env('RAZORPAY_CURRENCY') || 'INR',
      receipt,
      notes: { email, role: user.role, name: user.name || '', plan, months: String(months), kind: 'inbox_onetime' },
    });

    // Record the pending order so verify/webhook can reconcile it.
    await ACCESS.doc(email).set({
      email, role: user.role, name: user.name || '',
      source: 'subscription', plan, months,
      orderId: order.id,
      autopay: false,                 // one-time — no recurring debit
      updatedAt: new Date(),
    }, { merge: true });

    res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: env('RAZORPAY_KEY_ID'), plan, months });
  } catch (e) {
    console.error('order error:', e?.error || e.message);
    res.status(500).json({ success: false, message: e?.error?.description || e.message });
  }
});

// ── POST /verify-order ──────────────────────────────────────────────────────
// Confirm a one-time order. Signature = HMAC(order_id|payment_id). Grants access
// for the plan's term (no auto-renewal).
router.post('/verify-order', isLoggedIn, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }
    const expected = crypto.createHmac('sha256', env('RAZORPAY_KEY_SECRET'))
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }
    const email = lc(req.user.email);
    const a = await readAccess(email);
    const months = a?.months || planMonths(a?.plan) || 6;
    const validUntil = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    await ACCESS.doc(email).set({
      email, enabled: true, source: 'subscription',
      orderId: razorpay_order_id, subscriptionStatus: 'active', autopay: false,
      validUntil, lastPaymentId: razorpay_payment_id, updatedAt: new Date(),
    }, { merge: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /verify ──────────────────────────────────────────────────────────────
// Client-side confirmation after Checkout. Signature = HMAC(payment_id|subscription_id).
// The webhook is authoritative for access; this just gives instant feedback.
router.post('/verify', isLoggedIn, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body || {};
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }
    const expected = crypto.createHmac('sha256', env('RAZORPAY_KEY_SECRET'))
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }
    // Optimistically grant for the plan length; webhook sets the exact period end.
    const email = lc(req.user.email);
    const a = await readAccess(email);
    const months = a?.months || planMonths(a?.plan) || 6;
    const provisional = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    await ACCESS.doc(email).set({
      email, enabled: true, source: 'subscription',
      subscriptionId: razorpay_subscription_id, subscriptionStatus: 'active', autopay: true,
      validUntil: provisional, lastPaymentId: razorpay_payment_id, updatedAt: new Date(),
    }, { merge: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /cancel ──────────────────────────────────────────────────────────────
// Turn off autopay. Access continues until the current period end.
router.post('/cancel', isLoggedIn, async (req, res) => {
  try {
    const client = rzp();
    const email = lc(req.user.email);
    const a = await readAccess(email);
    if (!a?.subscriptionId || !client) {
      return res.status(400).json({ success: false, message: 'No active subscription to cancel.' });
    }
    await client.subscriptions.cancel(a.subscriptionId, { cancel_at_cycle_end: 1 });
    await ACCESS.doc(email).set({ subscriptionStatus: 'cancelled', autopay: false, updatedAt: new Date() }, { merge: true });
    res.json({ success: true, message: 'Autopay cancelled. Access continues until the current period ends.' });
  } catch (e) {
    console.error('cancel error:', e?.error || e.message);
    res.status(500).json({ success: false, message: e?.error?.description || e.message });
  }
});

// ── POST /webhook  (no auth — Razorpay signs with RAZORPAY_WEBHOOK_SECRET) ──────
router.post('/webhook', async (req, res) => {
  try {
    const secret = env('RAZORPAY_WEBHOOK_SECRET');
    const signature = req.headers['x-razorpay-signature'];
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      if (expected !== signature) { console.warn('razorpay webhook: bad signature'); return res.status(400).json({ ok: false }); }
    }
    const event = req.body?.event;
    const sub = req.body?.payload?.subscription?.entity;
    if (sub) {
      const email = lc(sub.notes?.email);
      if (email) {
        const periodEnd = sub.current_end ? new Date(sub.current_end * 1000) : null;
        const patch = {
          email, source: 'subscription', subscriptionId: sub.id,
          subscriptionStatus: sub.status, updatedAt: new Date(),
        };
        if (sub.notes?.plan) patch.plan = sub.notes.plan;
        if (sub.notes?.months) patch.months = Number(sub.notes.months);
        if (['subscription.activated', 'subscription.charged', 'subscription.resumed'].includes(event)) {
          patch.enabled = true; patch.autopay = true;
          if (periodEnd) patch.validUntil = periodEnd;
        } else if (event === 'subscription.cancelled') {
          patch.autopay = false;                     // keep access until validUntil
        } else if (['subscription.halted', 'subscription.completed', 'subscription.expired'].includes(event)) {
          patch.autopay = false;                     // access lapses at validUntil
        } else if (event === 'subscription.pending') {
          patch.autopay = false;
        }
        await ACCESS.doc(email).set(patch, { merge: true });
        console.log(`razorpay webhook ${event} → ${email} (${sub.status})`);
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('razorpay webhook error:', e.message);
    res.status(200).json({ ok: true }); // 200 so Razorpay doesn't retry-storm on our bug
  }
});

module.exports = router;
