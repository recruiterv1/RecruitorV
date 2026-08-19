// RippleHire duplicate-check endpoint.
// The recruiter never sees RippleHire's login — the server signs in with the
// vendor credentials held in Firebase secrets and reports the verdict back.
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Any signed-in RecruiterV user may run a check.
const isLoggedIn = (req, res, next) => {
  const token = req.cookies?.__session
    || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
};

// POST /api/ripplehire/check  { pos_id | jobId, candidate, emails, mob, pan_number, dob }
router.post('/check', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const b = req.body || {};
    let jobId = (b.jobId || '').toString().trim();

    // Resolve the job id from the position when not passed explicitly.
    if (!jobId && b.pos_id) {
      const snap = await db.collection('admin_AddPos').where('pos_id', '==', String(b.pos_id)).limit(1).get();
      if (!snap.empty) jobId = (snap.docs[0].data().ripplehire_job_id || '').toString().trim();
    }
    if (!jobId) {
      return res.json({ success: false, message: 'No RippleHire Job ID is set on this position. Add it via Edit Position.' });
    }

    const { checkDuplicate } = require('../utils/ripplehire');
    const result = await checkDuplicate({
      jobId,
      name: b.candidate || '',
      email: (b.emails || '').toString().trim().toLowerCase(),
      phone: (b.mob || '').toString().replace(/\D/g, ''),
      pan: (b.pan_number || '').toString().trim().toUpperCase(),
      dob: b.dob || '',
    });

    return res.json({ success: !!result.ok, ...result });
  } catch (e) {
    console.error('ripplehire/check error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
