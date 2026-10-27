const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

// ── Auth middleware ───────────────────────────────────────────────────────────
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

// ── POST /api/referer/submit ──────────────────────────────────────────────────
router.post('/submit', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { FieldValue } = require('../db');

    const refererEmail = (req.user.email || '').toLowerCase().trim();

    // Look up referrer in referer_db
    const snap = await db.collection('referer_db').where('email', '==', refererEmail).limit(1).get();
    let refererId = '', refererName = refererEmail, refererPhone = '';
    if (!snap.empty) {
      const d = snap.docs[0];
      refererId  = d.id;
      refererName  = d.data().name  || refererEmail;
      refererPhone = d.data().mob   || d.data().mobile || d.data().phone || '';
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

    let techSkillParsed    = typeof tech_skill    === 'string' ? JSON.parse(tech_skill    || '[]') : (tech_skill    || []);
    let techExpParsed      = typeof tech_exp      === 'string' ? JSON.parse(tech_exp      || '[]') : (tech_exp      || []);
    let nontechSkillParsed = typeof nontech_skill === 'string' ? JSON.parse(nontech_skill || '[]') : (nontech_skill || []);
    let nontechExpParsed   = typeof nontech_exp   === 'string' ? JSON.parse(nontech_exp   || '[]') : (nontech_exp   || []);

    const docRef = await db.collection('candidate_db').add({
      source:             'referer_submitted',
      referredBy:         refererEmail,
      referredById:       refererId,
      referredByName:     refererName,
      referredByRole:     'Referrer',
      referredByPhone:    refererPhone,
      referrerProfile: {
        id:         refererId,
        name:       refererName,
        email:      refererEmail,
        phone:      refererPhone,
        role:       'Referrer',
        collection: 'referer_db',
      },
      referredAt:   FieldValue.serverTimestamp(),
      candidateConsentConfirmed: true,
      pos_id:       '',
      pos_name:     '',
      recEmail:     refererEmail,
      recName:      refererName,
      recRole:      'Referrer',
      recId:        refererId || 'referer',
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
      statusa:          'Available',
      datePosted:       FieldValue.serverTimestamp(),
      updatedAt:        FieldValue.serverTimestamp(),
      jr_number:        '',
      pan_number:       '',
      rh_id:            '',
    });

    return res.json({ success: true, message: 'Candidate submitted successfully!', id: docRef.id });
  } catch (err) {
    console.error('referer/submit error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/referer/my-candidates ───────────────────────────────────────────
router.get('/my-candidates', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const refererEmail = (req.user.email || '').toLowerCase().trim();

    const snap = await db.collection('candidate_db')
      .where('source', '==', 'referer_submitted')
      .where('referredBy', '==', refererEmail)
      .get();

    const candidates = snap.docs.map(doc => {
      const d = doc.data();
      const referredAt = d.referredAt?._seconds
        ? new Date(d.referredAt._seconds * 1000).toISOString()
        : (d.datePosted?._seconds ? new Date(d.datePosted._seconds * 1000).toISOString() : null);
      return {
        id:               doc.id,
        candidate:        d.candidate || '',
        emails:           d.emails    || '',
        mob:              d.mob       || '',
        curr_emp:         d.curr_emp  || '',
        curr_loc:         d.curr_loc  || '',
        curr_state:       d.curr_state || '',
        skill_type:       d.skill_type || '',
        tech_category:    d.tech_category || '',
        nontech_category: d.nontech_category || '',
        tech_skill:       d.tech_skill  || [],
        nontech_skill:    d.nontech_skill || [],
        cv_data:          d.cv_data  || '',
        statusa:          d.statusa  || 'Available',
        pos_id:           d.pos_id   || '',
        pos_name:         d.pos_name || '',
        client:           d.client   || '',
        usedBy:           d.usedBy   || '',
        usedByName:       d.usedByName || '',
        usedAt:           d.usedAt?._seconds ? new Date(d.usedAt._seconds * 1000).toISOString() : null,
        referredAt,
      };
    });

    candidates.sort((a, b) => (b.referredAt || '') > (a.referredAt || '') ? 1 : -1);

    const total      = candidates.length;
    const used       = candidates.filter(c => c.pos_id).length;
    const available  = candidates.filter(c => !c.pos_id).length;
    const shortlisted = candidates.filter(c => ['shortlisted','selected','offered','joined'].includes((c.statusa || '').toLowerCase())).length;

    return res.json({ success: true, candidates, summary: { total, used, available, shortlisted } });
  } catch (err) {
    console.error('referer/my-candidates error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
