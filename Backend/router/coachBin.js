const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

// ─────────────────────────────────────────────────────────────────────────────
// Coach/Expert Bin — a holding pool where a coach reviews a recruiter's
// candidate before it reaches the Client SPOC.
//
//   submitted → In Review → (claim) → approve/reject → Client SPOC
//
// Two timers, both anchored on the ORIGINAL submission time:
//   • 4 hours — how long a candidate can be claimed by any eligible coach
//   • 1 hour  — how long a claim holds before it lapses back to the pool
// After 4 hours the candidate goes to the SPOC regardless and is recorded as a
// missed CV.
//
// ── Scope, and why it is doubly gated ───────────────────────────────────────
// Holding a candidate back delays a real person's application. The pilot coach's
// own categories (Technology, Finance, Banking) span 510 of 604 positions, so
// scoping on the coach alone would put roughly 12 real candidates a day behind a
// 4-hour wait. A candidate therefore enters the Bin only when BOTH hold:
//   1. an eligible coach covers its position's skill category, AND
//   2. its position is in app_config/coach_bin.positions
// With no positions listed, nothing enters the Bin and every candidate follows
// exactly today's path to the SPOC.
// ─────────────────────────────────────────────────────────────────────────────

const BIN = () => db.collection('coach_bin');
const AVAILABLE_HOURS = 4;
const CLAIM_HOURS = 1;

const msOf = (v) => v?._seconds ? v._seconds * 1000
  : (typeof v?.toDate === 'function' ? v.toDate().getTime()
  : (v ? new Date(v).getTime() : 0));
const toIso = (v) => { const m = msOf(v); return m ? new Date(m).toISOString() : null; };

const config = async () => {
  try {
    const d = await db.collection('app_config').doc('coach_bin').get();
    return d.exists ? (d.data() || {}) : {};
  } catch (e) {
    console.error('coach_bin config failed:', e.message);
    return {};
  }
};

// Is this person a pilot reviewer? Returns their record, or null.
const pilotCoach = async (email) => {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return null;
  const cfg = await config();
  if (cfg.enabled !== true) return null;
  const allowed = (cfg.coaches || []).map(x => String(x).toLowerCase());
  if (!allowed.includes(e)) return null;
  for (const [col, role] of [['coach_db', 'Coach'], ['expert_db', 'Expert']]) {
    const s = await db.collection(col).where('email', '==', e).limit(1).get();
    if (!s.empty) {
      const d = s.docs[0].data();
      const cats = (Array.isArray(d.skillCategory) ? d.skillCategory : [d.skillCategory])
        .filter(Boolean).map(x => String(x).toLowerCase().trim());
      return {
        email: e, name: d.name || '', role, id: s.docs[0].id, categories: cats,
        phone: d.phone || d.mobile || d.mob || '',
      };
    }
  }
  return null;
};

// Should this candidate be held for review at all? Called from the submit path.
const shouldHold = async (position) => {
  const cfg = await config();
  if (cfg.enabled !== true) return false;
  const positions = (cfg.positions || []).map(String);
  // No allowlist means no holding — never infer a wide scope from a narrow one.
  if (!positions.length) return false;
  if (!positions.includes(String(position?.pos_id))) return false;

  // And at least one pilot coach must actually cover this category, or the
  // candidate would be held for a reviewer who can never see them.
  const cat = String(position?.skill_category || '').toLowerCase().trim();
  for (const email of (cfg.coaches || [])) {
    const c = await pilotCoach(email);
    if (c && (!c.categories.length || c.categories.includes(cat))) return true;
  }
  return false;
};

// Put a freshly submitted candidate into the pool.
const addToBin = async ({ candidateId, candidate, position, recruiterEmail }) => {
  const now = new Date();
  await BIN().add({
    candidateId,
    candidateName: candidate?.candidate || '',
    pos_id: String(position?.pos_id || ''),
    positionTitle: position?.position || '',
    client: position?.client || '',
    skillCategory: position?.skill_category || '',
    clientspoc: position?.clientspoc || '',
    recruiterEmail: String(recruiterEmail || '').toLowerCase(),
    matchPercent: candidate?.matchPercent ?? null,
    // Both windows hang off this, never off the claim time.
    submittedAt: now,
    expiresAt: new Date(now.getTime() + AVAILABLE_HOURS * 3600 * 1000),
    status: 'open',
    claimedBy: '', claimedAt: null, claimExpiresAt: null,
    decision: '', reason: '', briefing: '', reviewedBy: '', reviewedAt: null,
    createdAt: now,
  });
};

// The live state of an entry, with lapsed claims and expiry resolved on read.
// Deriving rather than storing means a missed sweep can never leave a candidate
// wrongly locked.
const resolve = (d) => {
  const now = Date.now();
  const expired = msOf(d.expiresAt) && now > msOf(d.expiresAt);
  const claimLapsed = d.status === 'claimed' && msOf(d.claimExpiresAt) && now > msOf(d.claimExpiresAt);
  let state = d.status;
  if (['approved', 'rejected'].includes(d.status)) state = d.status;
  else if (expired) state = 'missed';
  else if (claimLapsed) state = 'open';
  return {
    state,
    expired,
    claimLapsed,
    msLeftAvailable: Math.max(0, msOf(d.expiresAt) - now),
    msLeftClaim: d.status === 'claimed' ? Math.max(0, msOf(d.claimExpiresAt) - now) : 0,
  };
};

const shape = (doc) => {
  const d = doc.data();
  const r = resolve(d);
  return {
    id: doc.id,
    candidateId: d.candidateId,
    candidateName: d.candidateName,
    pos_id: d.pos_id,
    positionTitle: d.positionTitle,
    client: d.client,
    skillCategory: d.skillCategory,
    recruiterEmail: d.recruiterEmail,
    matchPercent: d.matchPercent,
    submittedAt: toIso(d.submittedAt),
    expiresAt: toIso(d.expiresAt),
    claimedBy: r.claimLapsed ? '' : (d.claimedBy || ''),
    claimExpiresAt: r.claimLapsed ? null : toIso(d.claimExpiresAt),
    decision: d.decision || '',
    reason: d.reason || '',
    briefing: d.briefing || '',
    reviewedBy: d.reviewedBy || '',
    reviewedAt: toIso(d.reviewedAt),
    ...r,
  };
};

const authed = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch (e) { return res.status(403).json({ success: false, message: 'Session expired.' }); }
};

const coachOnly = (req, res, next) => authed(req, res, async () => {
  const c = await pilotCoach(req.user.email);
  if (!c) return res.status(403).json({ success: false, message: 'The review bin is not enabled for this account.' });
  req.coach = c;
  next();
});

/* ── Coach side ───────────────────────────────────────────────────────────── */

// Does this account get the Bin at all? Drives the sidebar entry.
router.get('/enabled', authed, async (req, res) => {
  const c = await pilotCoach(req.user.email);
  res.json({ success: true, enabled: !!c, role: c?.role || '' });
});

// GET /available — everything claimable right now, plus anything this coach holds.
router.get('/available', coachOnly, async (req, res) => {
  try {
    const snap = await BIN().where('status', 'in', ['open', 'claimed']).get();
    const rows = snap.docs.map(shape)
      .filter(r => !r.expired)
      .filter(r => !req.coach.categories.length
        || req.coach.categories.includes(String(r.skillCategory || '').toLowerCase().trim()))
      // Someone else's live claim is not shown as available.
      .filter(r => !r.claimedBy || r.claimedBy === req.coach.email)
      .sort((a, b) => a.msLeftAvailable - b.msLeftAvailable);   // most urgent first
    res.json({ success: true, coach: req.coach, requests: rows, count: rows.length });
  } catch (e) {
    console.error('coach-bin/available error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /:id/claim — lock a candidate to this coach for an hour.
router.post('/:id/claim', coachOnly, async (req, res) => {
  try {
    const ref = BIN().doc(req.params.id);
    // A transaction, because two coaches clicking Claim together must not both win.
    const out = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) return { error: 'That candidate is no longer in the bin.' };
      const d = doc.data();
      const r = resolve(d);
      if (r.expired) return { error: 'The 4-hour window for this candidate has passed.' };
      if (['approved', 'rejected'].includes(d.status)) return { error: 'This candidate has already been reviewed.' };
      if (d.claimedBy && d.claimedBy !== req.coach.email && !r.claimLapsed) {
        return { error: 'Another coach is reviewing this candidate.' };
      }
      const now = new Date();
      // The claim never runs past the candidate's own 4-hour window.
      const claimEnd = Math.min(now.getTime() + CLAIM_HOURS * 3600 * 1000, msOf(d.expiresAt));
      tx.update(ref, {
        status: 'claimed',
        claimedBy: req.coach.email,
        claimedAt: now,
        claimExpiresAt: new Date(claimEnd),
      });
      return { ok: true, claimExpiresAt: new Date(claimEnd).toISOString() };
    });
    if (out.error) return res.status(409).json({ success: false, message: out.error });
    res.json({ success: true, ...out });
  } catch (e) {
    console.error('coach-bin/claim error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});


// POST /:id/review { decision: 'approve' | 'reject', reason, briefing, comments,
//                    suitability }
// The decision that releases the candidate to the Client SPOC, or stops them.
router.post('/:id/review', coachOnly, async (req, res) => {
  try {
    const decision = String(req.body?.decision || '').toLowerCase();
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: "decision must be 'approve' or 'reject'." });
    }
    // Reason and briefing are required either way — the recruiter is shown both,
    // and a decision with no explanation teaches them nothing.
    const reason = String(req.body?.reason || '').trim();
    const briefing = String(req.body?.briefing || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'A reason is required.' });
    if (!briefing) return res.status(400).json({ success: false, message: 'A briefing against the position is required.' });

    const ref = BIN().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found.' });
    const d = doc.data();
    const r = resolve(d);

    if (['approved', 'rejected'].includes(d.status)) {
      return res.status(409).json({ success: false, message: 'This candidate has already been reviewed.' });
    }
    // Past 4 hours the candidate has gone to the SPOC; a late verdict must not
    // change a status the SPOC may already have acted on.
    if (r.expired) {
      return res.status(409).json({ success: false, message: 'The 4-hour window has passed — this candidate can no longer be approved or rejected.' });
    }
    if (d.claimedBy !== req.coach.email || r.claimLapsed) {
      return res.status(409).json({ success: false, message: 'Claim this candidate before reviewing.' });
    }

    const now = new Date();
    const approved = decision === 'approve';
    await ref.update({
      status: approved ? 'approved' : 'rejected',
      decision,
      reason: reason.slice(0, 2000),
      briefing: briefing.slice(0, 5000),
      comments: String(req.body?.comments || '').trim().slice(0, 2000),
      suitability: String(req.body?.suitability || '').trim().slice(0, 500),
      reviewedBy: req.coach.email,
      reviewedByName: req.coach.name,
      reviewedAt: now,
    });

    // Release to the Client SPOC, or stop the candidate here.
    try {
      await db.collection('candidate_db').doc(d.candidateId).update({
        statusa: approved ? 'Submitted' : 'Rejected',
        statusaDate: now,
        statusChangedAt: now,
        statusChangedBy: req.coach.email,
        statusChangedByName: `${req.coach.name} (${req.coach.role})`,
        coachReviewDecision: decision,
        coachReviewReason: reason.slice(0, 2000),
        coachReviewBriefing: briefing.slice(0, 5000),
        coachReviewBy: req.coach.email,
        coachReviewByName: req.coach.name,
        coachReviewByPhone: req.coach.phone,
        coachReviewByRole: req.coach.role,
        coachReviewAt: now,
      });
    } catch (e) {
      console.error('coach-bin: candidate status update failed:', e.message);
      return res.status(500).json({ success: false, message: 'Reviewed, but the candidate status could not be updated. Please tell an admin.' });
    }

    res.json({ success: true, message: approved ? 'Approved and sent to the Client SPOC.' : 'Rejected.' });
  } catch (e) {
    console.error('coach-bin/review error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /reviewed — what this coach has already decided, and where those
// candidates got to afterwards. Without it a coach approves someone and never
// sees them again, so there is no way to tell an approval actually landed.
router.get('/reviewed', coachOnly, async (req, res) => {
  try {
    const snap = await BIN().where('reviewedBy', '==', req.coach.email).get();
    const rows = snap.docs.map(shape)
      .sort((a, b) => (b.reviewedAt || '').localeCompare(a.reviewedAt || ''));

    // The candidate's status now — a SPOC may have moved them on since.
    await Promise.all(rows.map(async (r) => {
      try {
        const c = await db.collection('candidate_db').doc(r.candidateId).get();
        r.currentStatus = c.exists ? (c.data().statusa || '') : '(candidate removed)';
      } catch (_) { r.currentStatus = ''; }
    }));

    res.json({
      success: true,
      requests: rows,
      count: rows.length,
      approved: rows.filter(r => r.decision === 'approve').length,
      rejected: rows.filter(r => r.decision === 'reject').length,
    });
  } catch (e) {
    console.error('coach-bin/reviewed error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /missed — past the 4-hour window: visible, never actionable.
router.get('/missed', coachOnly, async (req, res) => {
  try {
    const snap = await BIN().get();
    const rows = snap.docs.map(shape)
      .filter(r => r.expired && !['approved', 'rejected'].includes(r.decision ? r.state : r.state))
      .filter(r => !req.coach.categories.length
        || req.coach.categories.includes(String(r.skillCategory || '').toLowerCase().trim()))
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));

    // What became of each one, so the coach can see whether anyone else acted.
    await Promise.all(rows.map(async (r) => {
      try {
        const c = await db.collection('candidate_db').doc(r.candidateId).get();
        const cd = c.exists ? c.data() : {};
        r.currentStatus = cd.statusa || '';
        r.reviewedByOther = !!cd.coachReviewBy && cd.coachReviewBy !== req.coach.email;
        r.otherCoachReason = cd.coachReviewReason || '';
        r.otherCoachBriefing = cd.coachReviewBriefing || '';
      } catch (_) { r.currentStatus = ''; }
    }));

    res.json({ success: true, requests: rows, count: rows.length });
  } catch (e) {
    console.error('coach-bin/missed error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /missed/:id/briefing { briefing }
// A missed candidate can still be briefed on — often the most useful moment,
// when someone was rejected and the recruiter needs to know why.
router.post('/missed/:id/briefing', coachOnly, async (req, res) => {
  try {
    const briefing = String(req.body?.briefing || '').trim();
    if (!briefing) return res.status(400).json({ success: false, message: 'A briefing is required.' });
    const ref = BIN().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found.' });

    const now = new Date();
    await ref.update({
      missedBriefing: briefing.slice(0, 5000),
      missedBriefingBy: req.coach.email,
      missedBriefingByName: req.coach.name,
      missedBriefingAt: now,
    });
    // Carried onto the candidate so the recruiter sees it with everything else.
    try {
      await db.collection('candidate_db').doc(doc.data().candidateId).update({
        coachMissedBriefing: briefing.slice(0, 5000),
        coachMissedBriefingBy: req.coach.email,
        coachMissedBriefingAt: now,
      });
    } catch (_) { /* the bin record still holds it */ }
    res.json({ success: true, message: 'Briefing saved — the recruiter can see it.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Recruiter side ───────────────────────────────────────────────────────── */

// GET /my-submissions — what happened to the candidates this recruiter sent.
router.get('/my-submissions', authed, async (req, res) => {
  try {
    const email = String(req.user.email || '').toLowerCase();
    const snap = await BIN().where('recruiterEmail', '==', email).get();
    const rows = snap.docs.map(shape).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    await Promise.all(rows.map(async (r) => {
      try {
        const c = await db.collection('candidate_db').doc(r.candidateId).get();
        const cd = c.exists ? c.data() : {};
        r.currentStatus = cd.statusa || '';
        r.missedBriefing = cd.coachMissedBriefing || '';
      } catch (_) { r.currentStatus = ''; }
    }));
    res.json({ success: true, submissions: rows, count: rows.length });
  } catch (e) {
    console.error('coach-bin/my-submissions error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
module.exports.shouldHold = shouldHold;
module.exports.addToBin = addToBin;
module.exports.pilotCoach = pilotCoach;
