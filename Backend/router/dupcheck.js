const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

// Duplicate verification against a client's own hiring system.
//
// Some clients keep their own candidate database — LTIMindtree's sits in
// RippleHire — and only they know whether a candidate is already in their
// pipeline via another vendor or a direct application. We cannot reach that
// system from a server, so a check is raised here and answered by whoever holds
// a logged-in session: a person working the queue, or an extension on the
// machine that keeps the portal open.
//
// The recruiter presses "Check duplicate with company" on the Identity step and
// cannot go further until a verdict lands.
//
// Collections:
//   duplicate_check_requests — one per check, with the verdict once answered

const REQUESTS = () => db.collection('duplicate_check_requests');

// How long a verdict stands before the same candidate must be checked again.
const VERDICT_TTL_MINUTES = 60;
// A check nobody answers in this long stops blocking the recruiter.
const STALE_AFTER_MINUTES = 10;

const toIso = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const authed = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch (e) { return res.status(403).json({ success: false, message: 'Session expired.' }); }
};

// Only a SuperAdmin or a named checker may answer checks.
const checkerAuth = async (req, res, next) => {
  authed(req, res, async () => {
    const email = String(req.user.email || '').toLowerCase();
    try {
      const adminVerify = require('../model_fire/adminCF');
      const r = await adminVerify.checkData(email);
      if (r.success) { req.checker = email; return next(); }
      const cfg = await db.collection('app_config').doc('duplicate_check').get();
      const checkers = (cfg.exists ? cfg.data().checkers : []) || [];
      if (checkers.map(c => String(c).toLowerCase()).includes(email)) { req.checker = email; return next(); }
      return res.status(403).json({ success: false, message: 'You are not set up to answer duplicate checks.' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });
};

// PILOT ONLY — read this before switching anything on.
//
// This check is off for everyone. It turns on for one recruiter and one client
// at a time, and it never blocks a submission: a verdict that does not arrive
// lets the candidate through. The live submit path does not call into this file
// at all, so a fault here cannot stop a recruiter from submitting.
//
// Two independent switches must BOTH be set, in Firestore, with no deploy:
//   1. Company_Overview.<client>.externalDuplicateCheck === true
//   2. app_config/duplicate_check.pilotRecruiters contains the recruiter's email
//
// Leave either one unset and every recruiter sees exactly today's form.
const pilotConfig = async () => {
  try {
    const doc = await db.collection('app_config').doc('duplicate_check').get();
    return doc.exists ? (doc.data() || {}) : {};
  } catch (e) {
    console.error('pilotConfig failed:', e.message);
    return {};
  }
};

const inPilot = async (email) => {
  const who = String(email || '').toLowerCase();
  if (!who) return false;
  const cfg = await pilotConfig();
  if (cfg.enabled !== true) return false;
  const pilots = (cfg.pilotRecruiters || []).map(e => String(e).toLowerCase());
  return pilots.includes(who);
};

// Which clients are verified against their own system.
//
// Keyed on the position's own `client` string, NOT on a Company_Overview doc:
// 341 positions carry client "LTIMindtree" and no company doc of that name
// exists (the nearest is "LTM"), so a company-doc lookup would find nothing and
// silently report "not required" forever. The position's client string is the
// field that actually decides which portal a candidate goes to.
const companyNeedsCheck = async (client) => {
  const name = String(client || '').trim();
  if (!name) return null;
  const cfg = await pilotConfig();
  if (cfg.enabled !== true) return null;
  const clients = cfg.clients || {};
  const key = Object.keys(clients).find(k => k.toLowerCase() === name.toLowerCase());
  if (!key || clients[key]?.enabled !== true) return null;
  return {
    client: key,
    portalName: clients[key].portalName || 'the client portal',
    portalUrl: clients[key].portalUrl || '',
  };
};

// A verdict older than the TTL is not reused. Kept in code rather than as a
// Firestore range filter: combining a range with the two equality filters would
// demand a composite index, and without it the whole lookup throws.
const fresh = (r) => {
  const t = r.answeredAt?._seconds ? r.answeredAt._seconds * 1000
          : (typeof r.answeredAt?.toDate === 'function' ? r.answeredAt.toDate().getTime() : 0);
  return t > 0 && (Date.now() - t) < VERDICT_TTL_MINUTES * 60000;
};

// The job to search under in the client's portal. RippleHire's job id and our
// JR number are the same value, so either source will do — the position's own
// field when an admin has filled it in (only 9 of 341 LTIMindtree positions
// have), otherwise the JR the recruiter typed on the form.
const jobIdFor = (pos, body) =>
  String(pos?.ripplehire_job_id || body?.jr_number || body?.jobId || '').trim();

const identityOf = (b) => ({
  name: String(b?.candidate || b?.name || '').trim(),
  email: String(b?.emails || b?.email || '').trim().toLowerCase(),
  phone: String(b?.mob || b?.phone || '').replace(/\D/g, ''),
  pan: String(b?.pan_number || b?.pan || '').replace(/\s+/g, '').toUpperCase(),
  dob: String(b?.dob || '').trim(),
});

/* ── Recruiter side ───────────────────────────────────────────────────────── */

// GET /dupcheck/required?pos_id=  — does this position need the check at all?
router.get('/required', authed, async (req, res) => {
  try {
    const posId = String(req.query.pos_id || '');
    if (!posId) return res.json({ success: true, required: false });
    const snap = await db.collection('admin_AddPos').where('pos_id', '==', posId).limit(1).get();
    if (snap.empty) return res.json({ success: true, required: false });
    const pos = snap.docs[0].data();
    const company = (await inPilot(req.user.email)) ? await companyNeedsCheck(pos.client) : null;
    res.json({
      success: true,
      required: !!company,
      client: company?.client || pos.client || '',
      portalName: company?.portalName || '',
      jobId: jobIdFor(pos, {}),
    });
  } catch (e) {
    console.error('dupcheck/required error:', e.message);
    res.json({ success: true, required: false });   // fail open
  }
});

// POST /dupcheck/request { pos_id, candidate, emails, mob, pan_number, dob }
// Raises a check. If the same candidate was checked for this client recently,
// that verdict is reused rather than troubling the checker again.
router.post('/request', authed, async (req, res) => {
  try {
    const posId = String(req.body?.pos_id || '');
    if (!posId) return res.status(400).json({ success: false, message: 'pos_id is required.' });

    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', posId).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found.' });
    const pos = posSnap.docs[0].data();

    if (!(await inPilot(req.user.email))) {
      return res.json({ success: true, required: false, verdict: 'not_required' });
    }
    const company = await companyNeedsCheck(pos.client);
    if (!company) return res.json({ success: true, required: false, verdict: 'not_required' });

    const id = identityOf(req.body);
    if (!id.email && !id.phone && !id.pan) {
      return res.status(400).json({ success: false, message: 'Enter an email, phone or PAN before checking.' });
    }

    // Reuse a recent verdict for the same person at the same client.
    try {
      const recent = await REQUESTS()
        .where('client', '==', company.client)
        .where('status', '==', 'answered')
        .get();
      const hit = recent.docs.map(d => ({ id: d.id, ...d.data() })).filter(fresh).find(r =>
        (id.email && r.email === id.email) ||
        (id.phone && r.phone === id.phone) ||
        (id.pan && r.pan && r.pan === id.pan));
      if (hit) {
        return res.json({
          success: true, required: true, reused: true,
          requestId: hit.id, status: 'answered', verdict: hit.verdict, note: hit.note || '',
        });
      }
    } catch (e) {
      console.error('recent-verdict lookup skipped:', e.message);
    }

    const doc = await REQUESTS().add({
      ...id,
      pos_id: posId,
      pos_name: pos.position || '',
      client: company.client,
      jobId: jobIdFor(pos, req.body),
      requestedBy: String(req.user.email || '').toLowerCase(),
      status: 'pending',
      requestedAt: new Date(),
    });

    // Wake whoever answers these.
    try {
      const cfg = await db.collection('app_config').doc('duplicate_check').get();
      const checkers = (cfg.exists ? cfg.data().checkers : []) || [];
      if (checkers.length) {
        const { sendPushToEmails } = require('../utils/push');
        await sendPushToEmails(checkers, {
          title: `Duplicate check — ${company.client}`,
          body: `${id.name || id.email || id.phone} · ${pos.position || 'position ' + posId}`,
          data: { type: 'duplicate_check', requestId: doc.id },
        });
      }
    } catch (e) {
      console.error('checker push failed:', e.message);   // the queue still shows it
    }

    res.json({ success: true, required: true, requestId: doc.id, status: 'pending' });
  } catch (e) {
    console.error('dupcheck/request error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /dupcheck/status/:id — polled by the form while the recruiter waits.
router.get('/status/:id', authed, async (req, res) => {
  try {
    const doc = await REQUESTS().doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Check not found.' });
    const d = doc.data();

    // Nobody answered in time — stop holding the recruiter up. The submission
    // goes through marked for verification rather than being blocked by a
    // machine or a person they cannot see.
    const waitedMs = Date.now() - (d.requestedAt?._seconds ? d.requestedAt._seconds * 1000 : Date.now());
    const stale = d.status === 'pending' && waitedMs > STALE_AFTER_MINUTES * 60000;

    res.json({
      success: true,
      status: stale ? 'unanswered' : d.status,
      verdict: d.verdict || null,
      note: d.note || '',
      answeredBy: d.answeredBy || '',
      answeredAt: toIso(d.answeredAt),
      waitedSeconds: Math.round(waitedMs / 1000),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Checker side ─────────────────────────────────────────────────────────── */

// GET /dupcheck/queue — everything waiting to be answered.
router.get('/queue', checkerAuth, async (req, res) => {
  try {
    const snap = await REQUESTS().where('status', '==', 'pending').get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data(), requestedAt: toIso(d.data().requestedAt) }))
      .sort((a, b) => (a.requestedAt || '').localeCompare(b.requestedAt || ''));
    res.json({ success: true, count: rows.length, requests: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /dupcheck/:id/verdict { verdict: 'duplicate' | 'clear', note }
router.post('/:id/verdict', checkerAuth, async (req, res) => {
  try {
    const verdict = String(req.body?.verdict || '');
    if (!['duplicate', 'clear'].includes(verdict)) {
      return res.status(400).json({ success: false, message: "verdict must be 'duplicate' or 'clear'." });
    }
    const ref = REQUESTS().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Check not found.' });
    if (doc.data().status === 'answered') {
      return res.status(409).json({ success: false, message: 'This check has already been answered.' });
    }
    await ref.update({
      status: 'answered',
      verdict,
      note: String(req.body?.note || '').slice(0, 500),
      answeredBy: req.checker,
      answeredAt: new Date(),
    });
    res.json({ success: true, message: verdict === 'duplicate' ? 'Marked as duplicate.' : 'Marked clear.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Server-side enforcement, written but DELIBERATELY NOT CALLED. Nothing in the
// live submit path imports this. Wire it into candidate submit only once the
// pilot has shown the verdicts are trustworthy, or a bad verdict becomes a
// recruiter who cannot submit a legitimate candidate.
const verdictFor = async (client, identity) => {
  const company = await companyNeedsCheck(client);
  if (!company) return { required: false };
  try {
    const snap = await REQUESTS()
      .where('client', '==', company.client)
      .where('status', '==', 'answered')
      .get();
    const hit = snap.docs.map(d => d.data()).filter(fresh).find(r =>
      (identity.email && r.email === identity.email) ||
      (identity.phone && r.phone === identity.phone) ||
      (identity.pan && r.pan && r.pan === identity.pan));
    return { required: true, verdict: hit?.verdict || null, note: hit?.note || '' };
  } catch (e) {
    console.error('verdictFor failed:', e.message);
    return { required: true, verdict: null, error: true };
  }
};

module.exports = router;
module.exports.verdictFor = verdictFor;
module.exports.companyNeedsCheck = companyNeedsCheck;
module.exports.inPilot = inPilot;
module.exports.identityOf = identityOf;
