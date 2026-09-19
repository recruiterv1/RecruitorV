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
// How many candidates one coach may hold at once. Claiming locks a candidate
// away from every other coach for an hour, so an unbounded claim is a way to
// corner the bin. Four is enough to work through without starving anyone else.
const MAX_OPEN_CLAIMS = 4;

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

// Which pilot role, if any, this person holds. The pilot spans three roles —
// the coach who reviews, the recruiter whose candidate it is, and the client who
// settles a dispute — so each is named separately in the config. Anyone not
// listed sees none of it.
const pilotRoleOf = async (email) => {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return null;
  const cfg = await config();
  if (cfg.enabled !== true) return null;
  const inList = (k) => (cfg[k] || []).map(x => String(x).toLowerCase()).includes(e);
  if (inList('coaches')) return 'coach';
  if (inList('recruiters')) return 'recruiter';
  if (inList('clientspocs')) return 'clientspoc';
  return null;
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
    rejectCategory: d.rejectCategory || '',
    approveCategory: d.approveCategory || '',
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
  const pilotRole = await pilotRoleOf(req.user.email);
  const c = pilotRole === 'coach' ? await pilotCoach(req.user.email) : null;
  res.json({
    success: true,
    enabled: !!pilotRole,
    pilotRole: pilotRole || '',      // coach | recruiter | clientspoc
    role: c?.role || '',             // Coach | Expert, for a reviewer
  });
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
    const heldByMe = rows.filter(r => r.claimedBy === req.coach.email).length;
    res.json({
      success: true, coach: req.coach, requests: rows, count: rows.length,
      held: heldByMe, maxClaims: MAX_OPEN_CLAIMS,
    });
  } catch (e) {
    console.error('coach-bin/available error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /:id/release — hand a claimed candidate back to the pool.
//
// A coach who claims the wrong CV would otherwise lock it away from everyone
// else for a full hour. Releasing returns it immediately, with whatever is left
// of its original 4-hour window — the window never restarts.
router.post('/:id/release', coachOnly, async (req, res) => {
  try {
    const ref = BIN().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found.' });
    const d = doc.data();

    if (['approved', 'rejected'].includes(d.status)) {
      return res.status(409).json({ success: false, message: 'This candidate has already been reviewed.' });
    }
    if (String(d.claimedBy || '').toLowerCase() !== req.coach.email) {
      return res.status(403).json({ success: false, message: 'You are not holding this candidate.' });
    }

    await ref.update({
      status: 'open',
      claimedBy: '',
      claimedAt: null,
      claimExpiresAt: null,
      // Kept so it is clear the candidate was handled, not ignored.
      lastReleasedBy: req.coach.email,
      lastReleasedAt: new Date(),
    });

    const left = Math.max(0, msOf(d.expiresAt) - Date.now());
    res.json({
      success: true,
      message: left > 0
        ? 'Released — back in the bin for anyone to claim.'
        : 'Released, but its 4-hour window has already closed.',
    });
  } catch (e) {
    console.error('coach-bin/release error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /:id/candidate — the candidate behind a bin entry: their details, their
// CV, and the position they were submitted against.
//
// The review modal had only a name and a job title, which is not enough to
// judge anyone. Served through the bin rather than the general candidate route
// so a coach sees exactly the candidates in their own bin and no others.
router.get('/:id/candidate', coachOnly, async (req, res) => {
  try {
    const doc = await BIN().doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found.' });
    const b = doc.data();

    // Their own bin only — an id from elsewhere must not open a candidate.
    if (req.coach.categories.length
      && !req.coach.categories.includes(String(b.skillCategory || '').toLowerCase().trim())) {
      return res.status(403).json({ success: false, message: 'This candidate is outside your categories.' });
    }

    const c = await db.collection('candidate_db').doc(b.candidateId).get();
    if (!c.exists) return res.json({ success: true, candidate: null, message: 'The candidate record is no longer available.' });
    const d = c.data();

    res.json({
      success: true,
      candidate: {
        name: d.candidate || b.candidateName || '',
        email: d.emails || '',
        phone: d.mob || '',
        currentEmployer: d.curr_emp || '',
        totalExp: d.total_exp || '',
        relevantExp: d.rel_exp || '',
        currentCtc: d.current_ctc || '',
        expectedCtc: d.exp_ctc || '',
        currentLocation: Array.isArray(d.curr_loc) ? d.curr_loc.join(', ') : (d.curr_loc || ''),
        preferredLocation: Array.isArray(d.pref_loc) ? d.pref_loc.join(', ') : (d.pref_loc || ''),
        noticePeriod: d.notice_period || '',
        education: Array.isArray(d.highest_education) ? d.highest_education.join(', ') : (d.highest_education || ''),
        skills: [d.tech_skill, d.nontech_skill].filter(Boolean).join(', '),
        photoUrl: d.photo_url || '',
        cvUrl: d.cv_data || '',            // where the uploaded CV lives
        matchPercent: d.matchPercent ?? b.matchPercent ?? null,
        matchSummary: d.matchSummary || '',
        status: d.statusa || '',
      },
      position: {
        pos_id: b.pos_id,
        title: b.positionTitle,
        client: b.client,
        // The full JD, opened in its own tab.
        url: `/position/${encodeURIComponent(b.pos_id)}`,
      },
    });
  } catch (e) {
    console.error('coach-bin candidate error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /:id/claim — lock a candidate to this coach for an hour.
router.post('/:id/claim', coachOnly, async (req, res) => {
  try {
    const ref = BIN().doc(req.params.id);
    // A transaction, because two coaches clicking Claim together must not both win.
    const out = await db.runTransaction(async (tx) => {
      // Counted inside the transaction, so two quick claims cannot both slip
      // past the cap by reading the same count.
      const held = await tx.get(BIN().where('claimedBy', '==', req.coach.email).where('status', '==', 'claimed'));
      const live = held.docs.filter(h => {
        const hd = h.data();
        if (h.id === req.params.id) return false;          // re-claiming one you hold
        const hr = resolve(hd);
        // A lapsed or expired claim is not held any more and must not count.
        return !hr.claimLapsed && !hr.expired;
      });
      if (live.length >= MAX_OPEN_CLAIMS) {
        return { error: `You are holding ${live.length} candidates already. Review or release one before claiming another (limit ${MAX_OPEN_CLAIMS}).` };
      }

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
    // A reason is required either way — the recruiter is shown it, and a
    // decision with no explanation teaches them nothing.
    //
    // The briefing is required only on a rejection. An approval sends the
    // candidate onward, where the client forms their own view; a rejection ends
    // the road there, so the recruiter needs to know what to do differently.
    const reason = String(req.body?.reason || '').trim();
    const briefing = String(req.body?.briefing || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'A reason is required.' });
    if (decision === 'reject' && !briefing) {
      return res.status(400).json({ success: false, message: 'A briefing against the position is required when rejecting.' });
    }

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
    // The client's own rejection category, so coach and client rejections can be
    // counted together. Only meaningful on a rejection.
    const rejectCategory = approved ? '' : String(req.body?.rejectCategory || '').trim().slice(0, 60);
    const approveCategory = approved ? String(req.body?.approveCategory || '').trim().slice(0, 60) : '';

    await ref.update({
      status: approved ? 'approved' : 'rejected',
      decision,
      rejectCategory,
      approveCategory,
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
        coachRejectCategory: rejectCategory,
        coachApproveCategory: approveCategory,
        // Mirrors the field a Client SPOC's own rejection writes, so existing
        // reporting on rejection reasons picks these up without change.
        ...(approved ? {} : { rejectReason: rejectCategory || reason.slice(0, 200) }),
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

/* ── Second review ────────────────────────────────────────────────────────── */
//
// A rejection is one person's read. When a recruiter believes their candidate
// was turned down wrongly they can ask for a second look, stating why — and it
// goes to the coach who rejected AND to the Client SPOC who owns the position,
// so the decision does not rest again with the same person alone.
//
// The coach's original reason and briefing travel with it, so the SPOC is
// deciding with the full picture rather than the recruiter's account of it.

const secondReviewShape = (doc) => {
  const d = doc.data();
  const sr = d.secondReview || {};
  return {
    id: doc.id,
    candidateId: d.candidateId,
    candidateName: d.candidateName,
    pos_id: d.pos_id,
    positionTitle: d.positionTitle,
    client: d.client,
    clientspoc: d.clientspoc,
    matchPercent: d.matchPercent,
    recruiterEmail: d.recruiterEmail,
    submittedAt: toIso(d.submittedAt),

    // What the coach decided first time, and why.
    originalDecision: d.decision || '',
    originalReason: d.reason || '',
    originalBriefing: d.briefing || '',
    originalComments: d.comments || '',
    reviewedBy: d.reviewedBy || '',
    reviewedByName: d.reviewedByName || '',
    reviewedAt: toIso(d.reviewedAt),

    // The recruiter's case for looking again.
    recruiterPoints: sr.recruiterPoints || '',
    requestedAt: toIso(sr.requestedAt),
    status: sr.status || '',
    coachFeedback: sr.coachFeedback || '',
    coachDecision: sr.coachDecision || '',
    coachRespondedAt: toIso(sr.coachRespondedAt),
    spocFeedback: sr.spocFeedback || '',
    spocDecision: sr.spocDecision || '',
    spocRespondedAt: toIso(sr.spocRespondedAt),
    outcome: sr.outcome || '',
  };
};

// POST /:id/second-review { points } — the recruiter asks for another look.
router.post('/:id/second-review', authed, async (req, res) => {
  try {
    if (await pilotRoleOf(req.user.email) !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Not enabled for this account.' });
    }
    const points = String(req.body?.points || '').trim();
    if (!points) return res.status(400).json({ success: false, message: 'Please say why this candidate should be looked at again.' });

    const ref = BIN().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found.' });
    const d = doc.data();

    // Only the recruiter who submitted may ask, and only about a rejection.
    if (String(d.recruiterEmail || '').toLowerCase() !== String(req.user.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This is not your candidate.' });
    }
    if (d.decision !== 'reject') {
      return res.status(409).json({ success: false, message: 'A second review can only be asked for on a rejected candidate.' });
    }
    if (d.secondReview?.status) {
      return res.status(409).json({ success: false, message: 'A second review has already been raised for this candidate.' });
    }

    const now = new Date();
    await ref.update({
      secondReview: {
        requestedBy: String(req.user.email).toLowerCase(),
        requestedAt: now,
        recruiterPoints: points.slice(0, 3000),
        status: 'open',
        coachFeedback: '', coachDecision: '', coachRespondedAt: null,
        spocFeedback: '', spocDecision: '', spocRespondedAt: null,
        outcome: '',
      },
    });

    // Tell the two people who have to look at it.
    try {
      const { sendPushToEmails } = require('../utils/push');
      const to = [d.reviewedBy, d.clientspoc].filter(Boolean);
      if (to.length) {
        await sendPushToEmails(to, {
          title: 'Second review requested',
          body: `${d.candidateName || 'A candidate'} · ${d.positionTitle || 'position ' + d.pos_id}`,
          data: { type: 'second_review', binId: req.params.id },
        });
      }
    } catch (e) {
      console.error('second-review notification failed:', e.message);   // the queues still show it
    }

    res.json({ success: true, message: 'Second review requested. The coach and the client will both take a look.' });
  } catch (e) {
    console.error('second-review error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /second-reviews — the coach's queue: candidates they rejected and were asked
// to reconsider.
router.get('/second-reviews', coachOnly, async (req, res) => {
  try {
    const snap = await BIN().where('reviewedBy', '==', req.coach.email).get();
    const rows = snap.docs
      .filter(d => d.data().secondReview?.status)
      .map(secondReviewShape)
      .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
    res.json({ success: true, requests: rows, count: rows.length });
  } catch (e) {
    console.error('coach second-reviews error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Resolves a Client SPOC from the session, for their own queue.
const spocOnly = (req, res, next) => authed(req, res, async () => {
  try {
    const email = String(req.user.email || '').toLowerCase();
    const snap = await db.collection('admin_db').where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(403).json({ success: false, message: 'Client SPOC only.' });
    const role = String(snap.docs[0].data().roleCategory || snap.docs[0].data().role || '')
      .toLowerCase().replace(/\s/g, '');
    if (!role.includes('clientspoc')) return res.status(403).json({ success: false, message: 'Client SPOC only.' });
    if (await pilotRoleOf(email) !== 'clientspoc') {
      return res.status(403).json({ success: false, message: 'Not enabled for this account.' });
    }
    req.spocEmail = email;
    next();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /spoc/second-reviews — the SPOC's queue, for their own positions. Carries
// the coach's original reason and briefing so the decision is informed.
router.get('/spoc/second-reviews', spocOnly, async (req, res) => {
  try {
    const snap = await BIN().where('clientspoc', '==', req.spocEmail).get();
    const rows = snap.docs
      .filter(d => d.data().secondReview?.status)
      .map(secondReviewShape)
      .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
    res.json({ success: true, requests: rows, count: rows.length });
  } catch (e) {
    console.error('spoc second-reviews error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /:id/second-review/feedback { feedback, decision }
// Either reviewer responds. 'uphold' leaves the rejection standing; 'overturn'
// releases the candidate to the client. Only the SPOC can overturn — the
// position is theirs, and asking the coach to reverse themselves is what the
// recruiter already disputed.
router.post('/:id/second-review/feedback', authed, async (req, res) => {
  try {
    const feedback = String(req.body?.feedback || '').trim();
    const decision = String(req.body?.decision || '').toLowerCase();
    if (!feedback) return res.status(400).json({ success: false, message: 'Feedback is required.' });
    if (decision && !['uphold', 'overturn'].includes(decision)) {
      return res.status(400).json({ success: false, message: "decision must be 'uphold' or 'overturn'." });
    }

    const ref = BIN().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found.' });
    const d = doc.data();
    if (!d.secondReview?.status) return res.status(409).json({ success: false, message: 'No second review was requested for this candidate.' });

    const email = String(req.user.email || '').toLowerCase();
    const isCoach = email === String(d.reviewedBy || '').toLowerCase();
    const isSpoc = email === String(d.clientspoc || '').toLowerCase();
    if (!isCoach && !isSpoc) {
      return res.status(403).json({ success: false, message: 'Only the reviewing coach or the position\'s Client SPOC can respond.' });
    }
    if (decision === 'overturn' && !isCoach && !isSpoc) {
      return res.status(403).json({ success: false, message: 'Not permitted.' });
    }

    const now = new Date();
    const patch = isCoach
      ? { 'secondReview.coachFeedback': feedback.slice(0, 3000),
          'secondReview.coachDecision': decision || '',
          'secondReview.coachRespondedAt': now }
      : { 'secondReview.spocFeedback': feedback.slice(0, 3000),
          'secondReview.spocDecision': decision || '',
          'secondReview.spocRespondedAt': now };

    // The client's word settles it: their position, their decision.
    if (isSpoc && decision) {
      patch['secondReview.status'] = 'resolved';
      patch['secondReview.outcome'] = decision;
      patch['secondReview.resolvedAt'] = now;
    }
    await ref.update(patch);

    // Overturned by the client — the candidate goes through after all.
    if (isSpoc && decision === 'overturn') {
      try {
        await db.collection('candidate_db').doc(d.candidateId).update({
          statusa: 'Submitted',
          statusaDate: now,
          statusChangedAt: now,
          statusChangedBy: email,
          statusChangedByName: 'Client SPOC (second review)',
          secondReviewOutcome: 'overturn',
          secondReviewSpocFeedback: feedback.slice(0, 3000),
          secondReviewAt: now,
        });
      } catch (e) {
        console.error('second-review overturn status update failed:', e.message);
        return res.status(500).json({ success: false, message: 'Feedback saved, but the candidate status could not be updated. Please tell an admin.' });
      }
    }

    res.json({
      success: true,
      message: isSpoc && decision === 'overturn' ? 'Rejection overturned — the candidate is now with you.'
        : isSpoc && decision === 'uphold' ? 'Rejection upheld.'
        : 'Feedback saved.',
    });
  } catch (e) {
    console.error('second-review feedback error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Recruiter side ───────────────────────────────────────────────────────── */

// GET /my-submissions — what happened to the candidates this recruiter sent.
router.get('/my-submissions', authed, async (req, res) => {
  try {
    const email = String(req.user.email || '').toLowerCase();
    // Pilot-only, like the bin itself: a recruiter outside it has nothing here
    // and should not be told the feature exists.
    if (await pilotRoleOf(email) !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Not enabled for this account.' });
    }
    const snap = await BIN().where('recruiterEmail', '==', email).get();
    const rows = snap.docs.map(shape).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    // Keyed by id, not position: rows are sorted and snap.docs are not, so
    // indexing into snap.docs attached each coach's remarks to the wrong
    // candidate.
    const rawById = {};
    snap.docs.forEach(d => { rawById[d.id] = d.data(); });
    await Promise.all(rows.map(async (r) => {
      try {
        const c = await db.collection('candidate_db').doc(r.candidateId).get();
        const cd = c.exists ? c.data() : {};
        r.currentStatus = cd.statusa || '';
        r.missedBriefing = cd.coachMissedBriefing || '';
      } catch (_) { r.currentStatus = ''; }
      // Who reviewed it and what they said — the recruiter is shown the reason
      // and the briefing, and whether a second review is running.
      const raw = rawById[r.id] || {};
      r.reviewedByName = raw.reviewedByName || '';
      r.comments = raw.comments || '';
      r.suitability = raw.suitability || '';
      const sr = raw.secondReview || {};
      r.secondReview = sr.status ? {
        status: sr.status,
        requestedAt: toIso(sr.requestedAt),
        recruiterPoints: sr.recruiterPoints || '',
        coachFeedback: sr.coachFeedback || '',
        coachDecision: sr.coachDecision || '',
        spocFeedback: sr.spocFeedback || '',
        spocDecision: sr.spocDecision || '',
        outcome: sr.outcome || '',
      } : null;
      // Only a standing rejection with no request yet can be appealed.
      r.canRequestSecondReview = raw.decision === 'reject' && !sr.status;
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
module.exports.pilotRoleOf = pilotRoleOf;
