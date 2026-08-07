const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

// ── Auth middleware (same pattern as candidate.js) ────────────────────────────
const isLoggedIn = async (req, res, next) => {
  try {
    const jwtToken = req.cookies?.__session;
    if (jwtToken) {
      try {
        const data = jwt.verify(jwtToken, process.env.SECKEY);
        req.user = data;
        return next();
      } catch (_) {}
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Not authenticated' });
    const admin = require('firebase-admin');
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// ── POST /api/referral/submit ─────────────────────────────────────────────────
// Referring recruiter/coach/expert submits a candidate to the referral pool.
// Stored in candidate_db with source:'referred' so it appears in All Candidates.
router.post('/submit', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { FieldValue } = require('firebase-admin/firestore');
    const candida = require('../model_fire/candidateF');

    const referrerEmail = (req.user.email || '').toLowerCase().trim();
    let referrerName    = req.user.name || req.user.email || '';
    let referrerRole    = req.user.roleCategory || req.user.role || 'Recruiter';

    // ── Fetch full referrer profile for commission tracking ───────────────────
    // Try recruiter_db first, then coach_db, then expert_db
    let referrerId    = '';
    let referrerPhone = '';
    let referrerPlan  = '';
    let referrerProfile = {};

    const dbCollections = ['recruiter_db', 'coach_db', 'expert_db'];
    for (const col of dbCollections) {
      try {
        const snap = await db.collection(col).where('email', '==', referrerEmail).limit(1).get();
        if (!snap.empty) {
          const d = snap.docs[0].data();
          referrerId      = snap.docs[0].id;
          referrerName    = d.name    || referrerName;
          referrerRole    = d.roleCategory || d.role || referrerRole;
          referrerPhone   = d.mob     || d.phone || '';
          referrerPlan    = d.planType !== undefined ? String(d.planType) : '';
          referrerProfile = {
            id:           referrerId,
            name:         referrerName,
            email:        referrerEmail,
            phone:        referrerPhone,
            role:         referrerRole,
            planType:     referrerPlan,
            collection:   col,
          };
          break;
        }
      } catch (_) {}
    }

    const {
      candidate, mob, emails, dob,
      curr_emp, highest_education,
      current_ctc, exp_ctc,
      total_exp, rel_exp,
      notice_period,
      curr_state, curr_loc, pref_state, pref_loc,
      skill_type,
      tech_category, tech_subcategory, tech_skill, tech_exp,
      nontech_category, nontech_subcategory, nontech_skill, nontech_exp,
      self_rate, cv_url,
    } = req.body;

    if (!candidate || !mob || !emails) {
      return res.status(400).json({ success: false, message: 'Name, mobile, and email are required.' });
    }

    // ── Duplicate guard ──────────────────────────────────────────────────────
    // Stop the same person being referred twice. Matching on email OR phone,
    // because a resume re-uploaded later often has one of them changed.
    const emailLc = String(emails).trim().toLowerCase();
    const mobTrim = String(mob).trim();
    try {
      const [byEmail, byPhone] = await Promise.all([
        db.collection('candidate_db').where('source', '==', 'referred').where('emails', '==', emailLc).limit(5).get(),
        db.collection('candidate_db').where('source', '==', 'referred').where('mob', '==', mobTrim).limit(5).get(),
      ]);
      const hits = [];
      const seen = new Set();
      [byEmail, byPhone].forEach(sn => sn.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); hits.push(d.data()); } }));

      if (hits.length) {
        const mine = hits.find(h => (h.referredBy || '').toLowerCase() === referrerEmail);
        if (mine) {
          return res.status(409).json({
            success: false,
            duplicate: 'self',
            message: `You have already referred ${mine.candidate || 'this candidate'}. Each candidate can only be referred once.`,
          });
        }
        // Referred by somebody else — the first referrer owns the reward, so block.
        return res.status(409).json({
          success: false,
          duplicate: 'other',
          referredByName: hits[0].referredByName || 'another user',
          message: `This candidate has already been referred by ${hits[0].referredByName || 'another user'}. Duplicate referrals are not accepted.`,
        });
      }
    } catch (dupErr) {
      console.error('referral duplicate check failed:', dupErr.message);
      // Never block a genuine referral because the check itself failed.
    }

    let techSkillParsed    = typeof tech_skill    === 'string' ? JSON.parse(tech_skill    || '[]') : (tech_skill    || []);
    let techExpParsed      = typeof tech_exp      === 'string' ? JSON.parse(tech_exp      || '[]') : (tech_exp      || []);
    let nontechSkillParsed = typeof nontech_skill === 'string' ? JSON.parse(nontech_skill || '[]') : (nontech_skill || []);
    let nontechExpParsed   = typeof nontech_exp   === 'string' ? JSON.parse(nontech_exp   || '[]') : (nontech_exp   || []);

    // Store in candidate_db with source:'referred'
    const docRef = await db.collection('candidate_db').add({
      source:         'referred',
      // ── Referrer identity (full snapshot for commission tracking) ─────────
      referredBy:     referrerEmail,
      referredById:   referrerId,
      referredByName: referrerName,
      referredByRole: referrerRole,
      referredByPhone: referrerPhone,
      referredByPlan:  referrerPlan,
      referrerProfile,            // full object — single source of truth for commissions
      referredAt:     FieldValue.serverTimestamp(),
      candidateConsentConfirmed: true,   // recruiter ticked the consent checkbox
      // ── Standard candidate fields (no pos_id yet — not applied to any position) ──
      pos_id:       '',
      pos_name:     '',
      recEmail:     referrerEmail,
      recName:      referrerName,
      recRole:      referrerRole,
      recId:        referrerId || 'referred',
      client:       '',
      clientspoc:   '',
      hr_name:      '',
      candidate,
      mob,
      emails,
      dob:              dob              || '',
      curr_emp:         curr_emp         || '',
      highest_education: highest_education || '',
      current_ctc:      current_ctc      || '',
      exp_ctc:          exp_ctc          || '',
      total_exp:        total_exp        || '',
      rel_exp:          rel_exp          || '',
      notice_period:    notice_period    || '',
      curr_state:       curr_state       || '',
      curr_loc:         curr_loc         || '',
      pref_state:       pref_state       || '',
      pref_loc:         pref_loc         || '',
      skill_type:       skill_type       || '',
      tech_category:    tech_category    || '',
      tech_subcategory: tech_subcategory || '',
      tech_skill:       techSkillParsed,
      tech_exp:         techExpParsed,
      nontech_category:    nontech_category    || '',
      nontech_subcategory: nontech_subcategory || '',
      nontech_skill:    nontechSkillParsed,
      nontech_exp:      nontechExpParsed,
      self_rate:        self_rate        || '',
      cv_data:          cv_url           || '',
      statusa:          'Available',     // referred candidate starts as Available
      datePosted:       FieldValue.serverTimestamp(),
      updatedAt:        FieldValue.serverTimestamp(),
      jr_number:        '',
      pan_number:       '',
      rh_id:            '',
    });

    return res.json({ success: true, message: 'Candidate referred successfully!', id: docRef.id });
  } catch (err) {
    console.error('referral/submit error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/referral/my-referrals ────────────────────────────────────────────
// Returns all candidates referred by the logged-in user, enriched with
// usage info: if the candidate was later submitted against a position by
// any recruiter (candidate_db entry with same emails, non-empty pos_id),
// attach that info.
router.get('/my-referrals', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const referrerEmail = (req.user.email || '').toLowerCase().trim();

    // Fetch all candidates referred by this user — both manual marketplace
    // uploads (source:'referred') and direct applicants who arrived via this
    // recruiter's share link (source:'direct_apply' with referredViaDirectApply).
    // A single equality query on referredBy covers both (no composite index needed).
    const snap = await db.collection('candidate_db')
      .where('referredBy', '==', referrerEmail)
      .get();

    const referrals = snap.docs.map(doc => {
      const d = doc.data();
      const referredAt = d.referredAt?._seconds
        ? new Date(d.referredAt._seconds * 1000).toISOString()
        : (d.datePosted?._seconds ? new Date(d.datePosted._seconds * 1000).toISOString() : null);
      const updatedAt = d.updatedAt?._seconds
        ? new Date(d.updatedAt._seconds * 1000).toISOString() : null;
      return {
        id:               doc.id,
        candidate:        d.candidate || '',
        emails:           d.emails || '',
        mob:              d.mob || '',
        curr_emp:         d.curr_emp || '',
        curr_loc:         d.curr_loc || '',
        curr_state:       d.curr_state || '',
        // Detail fields shown on the marketplace card — these were missing, so
        // Experience / Notice / CTC always rendered empty no matter what was entered.
        total_exp:         d.total_exp || '',
        rel_exp:           d.rel_exp || '',
        notice_period:     d.notice_period || '',
        current_ctc:       d.current_ctc || '',
        exp_ctc:           d.exp_ctc || '',
        highest_education: d.highest_education || '',
        dob:               d.dob || '',
        pan_number:        d.pan_number || '',
        tech_subcategory:  d.tech_subcategory || '',
        nontech_subcategory: d.nontech_subcategory || '',
        tech_exp:          d.tech_exp || [],
        nontech_exp:       d.nontech_exp || [],
        skill_type:       d.skill_type || '',
        tech_category:    d.tech_category || '',
        nontech_category: d.nontech_category || '',
        tech_skill:       d.tech_skill || [],
        nontech_skill:    d.nontech_skill || [],
        cv_data:          d.cv_data || '',
        statusa:          d.statusa || 'Available',
        pos_id:           d.pos_id || '',
        pos_name:         d.pos_name || '',
        client:           d.client || '',
        usedBy:           d.usedBy || '',
        usedByName:       d.usedByName || '',
        usedAt:           d.usedAt?._seconds ? new Date(d.usedAt._seconds * 1000).toISOString() : null,
        // Commission tracking fields
        referredById:     d.referredById || '',
        referredByPhone:  d.referredByPhone || '',
        referredByRole:   d.referredByRole || '',
        referredByPlan:   d.referredByPlan || '',
        referrerProfile:  d.referrerProfile || {},
        candidateConsentConfirmed: d.candidateConsentConfirmed || false,
        source:           d.source || '',
        referredViaDirectApply: d.referredViaDirectApply || false,
        referredAt,
        updatedAt,
      };
    });

    // Sort newest first
    referrals.sort((a, b) => (b.referredAt || '') > (a.referredAt || '') ? 1 : -1);

    // Summary stats
    const total    = referrals.length;
    const used     = referrals.filter(r => r.pos_id).length;
    const available = referrals.filter(r => !r.pos_id).length;
    const shortlisted = referrals.filter(r => ['shortlisted','selected','offered','joined'].includes((r.statusa || '').toLowerCase())).length;

    return res.json({ success: true, referrals, summary: { total, used, available, shortlisted } });
  } catch (err) {
    console.error('referral/my-referrals error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/referral/:id ──────────────────────────────────────────────────
// Remove a referral from the marketplace pool.
//
// Guarded twice: the caller must own the referral, and a referral that has
// already been picked up onto a position cannot be deleted — that record is now
// part of a live hiring pipeline (and any reward claim attached to it).
router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const referrerEmail = (req.user.email || '').toLowerCase().trim();
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Referral id is required.' });

    const ref = db.collection('candidate_db').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Referral not found.' });

    const d = snap.data();
    if (d.source !== 'referred') {
      return res.status(400).json({ success: false, message: 'This candidate is not a referral.' });
    }
    if ((d.referredBy || '').toLowerCase() !== referrerEmail) {
      return res.status(403).json({ success: false, message: 'You can only delete resumes you referred.' });
    }
    if (d.pos_id) {
      return res.status(409).json({
        success: false,
        message: `${d.candidate || 'This candidate'} has already been submitted to a position and can no longer be removed.`,
      });
    }

    await ref.delete();
    return res.json({ success: true, message: 'Resume removed from the marketplace.' });
  } catch (err) {
    console.error('referral delete error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/referral/stats ───────────────────────────────────────────────────
// Real referral metrics for the Refer & Earn dashboard. Everything here is
// derived from actual candidate_db records — nothing is estimated or mocked.
//
// NOTE: view tracking, match scoring and a rewards/payout ledger do not exist
// yet, so `viewed`, `matched` and the reward figures report 0 (with
// `available:false` flags) rather than inventing numbers. When those systems are
// built, fill them in here and the UI picks them up automatically.
const REFERRAL_STAGES = {
  submitted:   ['submitted', 'applied', 'screening', 'screen select'],
  shortlisted: ['shortlisted', 'client shortlisted', 'l1 select', 'l2 select', 'l3 select'],
  interview:   ['interview', 'l1 interview', 'l2 interview', 'l3 interview', 'interview scheduled'],
  offer:       ['offered', 'offer', 'offer released'],
  joined:      ['joined', 'placed'],
  rejected:    ['screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject', 'rejected',
                'client drop', 'candidate drop', 'duplicate', 'offer declined', 'negotiation reject',
                'background verification reject', 'test reject'],
};

const stageOf = (statusa) => {
  const s = (statusa || '').toLowerCase().trim();
  for (const [stage, list] of Object.entries(REFERRAL_STAGES)) {
    if (list.includes(s)) return stage;
  }
  return s && s !== 'available' ? 'submitted' : 'available';
};

router.get('/stats', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const referrerEmail = (req.user.email || '').toLowerCase().trim();

    const snap = await db.collection('candidate_db')
      .where('source', '==', 'referred')
      .where('referredBy', '==', referrerEmail)
      .get();

    const counts = { available: 0, submitted: 0, shortlisted: 0, interview: 0, offer: 0, joined: 0, rejected: 0 };
    const activity = [];

    snap.docs.forEach(doc => {
      const d = doc.data();
      const stage = stageOf(d.statusa);
      counts[stage] = (counts[stage] || 0) + 1;

      const when = d.updatedAt?._seconds ? d.updatedAt._seconds
        : (d.referredAt?._seconds ? d.referredAt._seconds : null);
      if (d.pos_id || (d.statusa && d.statusa.toLowerCase() !== 'available')) {
        activity.push({
          candidate: d.candidate || '',
          status: d.statusa || '',
          stage,
          posName: d.pos_name || '',
          client: d.client || '',
          usedByName: d.usedByName || d.recName || '',
          at: when ? new Date(when * 1000).toISOString() : null,
        });
      }
    });

    activity.sort((a, b) => (b.at || '').localeCompare(a.at || ''));

    const totalUploaded = snap.size;
    // "Used" = the referral was actually picked up onto a position.
    const used = snap.docs.filter(d => !!d.data().pos_id).length;
    const inPipeline = counts.submitted + counts.shortlisted + counts.interview + counts.offer + counts.joined;

    return res.json({
      success: true,
      stats: {
        totalUploaded,
        used,
        available: counts.available,
        submitted: counts.submitted,
        shortlisted: counts.shortlisted,
        interview: counts.interview,
        offer: counts.offer,
        joined: counts.joined,
        rejected: counts.rejected,
        inPipeline,
        // Conversion = uploaded → joined
        conversionRate: totalUploaded ? Number(((counts.joined / totalUploaded) * 100).toFixed(1)) : 0,
      },
      // Systems that don't exist yet — reported as unavailable so the UI can show
      // a neutral placeholder instead of a misleading zero.
      unavailable: {
        viewed: true,
        matched: true,
        rewardsGenerated: true,
        rewardsPaid: true,
      },
      activity: activity.slice(0, 12),
    });
  } catch (err) {
    console.error('referral stats error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
