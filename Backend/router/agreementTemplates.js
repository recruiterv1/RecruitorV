/**
 * Editable agreement text, per user type, plus per-vendor payment terms.
 *
 * The clause text used to live only in the frontend. It now lives in Firestore
 * (`agreement_templates/<role>`) so a SuperAdmin can change wording without a
 * release. If no template has been saved for a role, the agreement page keeps
 * using its built-in copy — nothing changes until someone edits it.
 *
 * Vendor agreements additionally carry the payment terms a SuperAdmin set when
 * approving that vendor, injected as a clause so the accepted copy and its PDF
 * state the terms that were actually agreed.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

const lc = (s) => String(s || '').toLowerCase().trim();
const MANAGER_ROLES = ['superadmin', 'super admin', 'admin'];
const TEMPLATES = db.collection('agreement_templates');

// The user types that have an agreement.
const ROLES = [
  { key: 'recruiter', label: 'Recruiter' },
  { key: 'coach', label: 'Coach' },
  { key: 'expert', label: 'Expert' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'consultingfirm', label: 'Consulting Firm' },
  { key: 'company', label: 'Company' },
];
const ROLE_KEYS = new Set(ROLES.map(r => r.key));

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

const isLoggedIn = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
};

// Keep a clause list to a sane shape — titles and lines only, nothing exotic.
const cleanClauses = (raw) => (Array.isArray(raw) ? raw : [])
  .map((c, i) => ({
    id: String(c.id || `clause${i + 1}`).slice(0, 40),
    title: String(c.title || '').trim().slice(0, 200),
    content: (Array.isArray(c.content) ? c.content : String(c.content || '').split('\n'))
      .map(l => String(l).trim()).filter(Boolean).slice(0, 60),
  }))
  .filter(c => c.title || c.content.length)
  .slice(0, 40);

/** Payment terms → a clause the agreement and its PDF can render. */
const paymentTermsClause = (terms) => {
  const rows = (Array.isArray(terms) ? terms : [])
    .filter(t => t && (t.percent !== '' && t.percent != null));
  if (!rows.length) return null;
  return {
    id: 'paymentTerms',
    title: 'Payment Terms',
    content: [
      'Payouts against this agreement are released as follows:',
      ...rows.map(t => `• ${t.percent}% payable ${Number(t.afterDays) === 0
        ? 'on joining'
        : `after ${t.afterDays} days of the candidate joining`}.`),
      'Each release is subject to the candidate remaining in employment on the due date and to realisation of payment from the client.',
    ],
  };
};

// ── SuperAdmin: edit the wording ─────────────────────────────────────────────

router.get('/', managerAuth, async (_req, res) => {
  try {
    const snap = await TEMPLATES.get();
    const saved = {};
    snap.docs.forEach(d => { saved[d.id] = d.data(); });
    res.json({
      success: true,
      roles: ROLES.map(r => ({
        ...r,
        hasTemplate: !!saved[r.key],
        enabled: saved[r.key]?.enabled === true,
        clauses: saved[r.key]?.clauses || [],
        intro: saved[r.key]?.intro || '',
        updatedAt: saved[r.key]?.updatedAt?.toDate?.()?.toISOString?.() || null,
        updatedBy: saved[r.key]?.updatedBy || '',
      })),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:role', managerAuth, async (req, res) => {
  try {
    const role = lc(req.params.role);
    if (!ROLE_KEYS.has(role)) return res.status(404).json({ success: false, message: 'Unknown user type.' });

    const clauses = cleanClauses(req.body?.clauses);
    const enabled = req.body?.enabled === true;
    if (enabled && !clauses.length) {
      return res.status(400).json({ success: false, message: 'Add at least one clause before making it live.' });
    }

    const { FieldValue } = require('firebase-admin/firestore');
    await TEMPLATES.doc(role).set({
      role, clauses, enabled,
      intro: String(req.body?.intro || '').trim().slice(0, 2000),
      updatedAt: FieldValue.serverTimestamp(), updatedBy: req.managerEmail,
    }, { merge: true });

    res.json({
      success: true,
      message: enabled ? 'Saved and live — new agreements will use this wording.' : 'Saved as draft.',
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── The agreement page asks what to show ─────────────────────────────────────
// Returns the SuperAdmin wording when one is live, otherwise nothing so the page
// falls back to its built-in copy. A vendor also gets their payment terms.
router.get('/for-me/:role', isLoggedIn, async (req, res) => {
  try {
    const role = lc(req.params.role);
    const email = lc(req.user.email);

    let clauses = [], intro = '', usingCustom = false;
    const doc = await TEMPLATES.doc(role).get();
    if (doc.exists && doc.data().enabled === true && (doc.data().clauses || []).length) {
      clauses = doc.data().clauses;
      intro = doc.data().intro || '';
      usingCustom = true;
    }

    // Payment terms are per vendor, agreed at approval.
    let paymentTerms = [];
    if (role === 'vendor') {
      const snap = await db.collection('admin_db').where('email', '==', email).limit(1).get();
      if (!snap.empty) paymentTerms = snap.docs[0].data().paymentTerms || [];
    }
    const ptClause = paymentTermsClause(paymentTerms);

    res.json({
      success: true, usingCustom, intro,
      clauses, paymentTerms,
      // Given separately so the page can slot it in even when using built-in copy.
      paymentTermsClause: ptClause,
    });
  } catch (e) {
    console.error('agreement/for-me:', e.message);
    // Never block someone from signing — fall back to the built-in copy.
    res.json({ success: true, usingCustom: false, clauses: [], paymentTerms: [], paymentTermsClause: null });
  }
});

module.exports = router;
module.exports.paymentTermsClause = paymentTermsClause;
module.exports.ROLES = ROLES;
