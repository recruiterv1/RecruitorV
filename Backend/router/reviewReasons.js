const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

// ─────────────────────────────────────────────────────────────────────────────
// Rejection and approval reasons, editable by an admin.
//
// These were fifteen strings hard-coded in the candidate modal, each paired with
// a multi-paragraph guidance email in utils/screenRejectReasons.js keyed by the
// exact label. Renaming one there silently broke its email; adding one left it
// with none.
//
// So the label and its guidance are stored together, in `review_reasons`, and
// edited together. The file remains the seed: the collection is populated from
// it on first read, so nothing is lost and behaviour is unchanged until someone
// actually edits something.
// ─────────────────────────────────────────────────────────────────────────────

const COL = () => db.collection('review_reasons');
const KINDS = ['reject', 'approve'];

const authed = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch (e) { return res.status(403).json({ success: false, message: 'Session expired.' }); }
};

const adminOnly = (req, res, next) => authed(req, res, async () => {
  try {
    const adminVerify = require('../model_fire/adminCF');
    const r = await adminVerify.checkData(String(req.user.email || '').toLowerCase());
    if (!r.success) return res.status(403).json({ success: false, message: 'Admins only.' });
    req.adminEmail = String(req.user.email).toLowerCase();
    next();
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Populate from the existing hard-coded list the first time this is read, so the
// fifteen reasons and their guidance carry over exactly as they are.
let seeded = false;
const seedIfEmpty = async () => {
  if (seeded) return;
  const existing = await COL().limit(1).get();
  if (!existing.empty) { seeded = true; return; }
  try {
    const { REASON_TEXTS } = require('../utils/screenRejectReasons');
    const labels = [
      'Experience Short', 'Experience High', 'Skill Mismatch', 'Notice Period',
      'Budget Mismatch', 'Notice Verification', 'Relevant Experience', 'Job Stability',
      'Recent Switch', 'Employer Concern', 'Employment Gap', 'Location Mismatch',
      'Industry Mismatch', 'Communication', 'Skills Not Evident',
    ];
    const batch = db.batch();
    labels.forEach((label, i) => {
      batch.set(COL().doc(), {
        kind: 'reject',
        label,
        guidance: REASON_TEXTS?.[label] || '',
        active: true,
        order: i,
        createdAt: new Date(),
        updatedBy: 'seed',
      });
    });
    await batch.commit();
    console.log('review_reasons seeded with the original 15 rejection reasons');
  } catch (e) {
    console.error('review_reasons seed failed:', e.message);
  }
  seeded = true;
};

const shape = (d) => ({
  id: d.id,
  kind: d.data().kind,
  label: d.data().label || '',
  guidance: d.data().guidance || '',
  active: d.data().active !== false,
  order: d.data().order ?? 999,
});

// GET / — the lists. Read by the candidate modal and the coach review bin, so
// any signed-in user may read; only admins may change them.
router.get('/', authed, async (req, res) => {
  try {
    await seedIfEmpty();
    const snap = await COL().get();
    const all = snap.docs.map(shape).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    res.json({
      success: true,
      reject: all.filter(r => r.kind === 'reject' && r.active),
      approve: all.filter(r => r.kind === 'approve' && r.active),
    });
  } catch (e) {
    console.error('review-reasons list error:', e.message);
    // A fault here must not stop anyone reviewing — the client falls back to
    // its built-in list.
    res.json({ success: true, reject: [], approve: [], error: e.message });
  }
});

// GET /admin — everything, including what has been switched off.
router.get('/admin', adminOnly, async (req, res) => {
  try {
    await seedIfEmpty();
    const snap = await COL().get();
    const all = snap.docs.map(shape).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    res.json({ success: true, reasons: all, kinds: KINDS });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/admin', adminOnly, async (req, res) => {
  try {
    const kind = String(req.body?.kind || '').toLowerCase();
    const label = String(req.body?.label || '').trim();
    if (!KINDS.includes(kind)) return res.status(400).json({ success: false, message: "kind must be 'reject' or 'approve'." });
    if (!label) return res.status(400).json({ success: false, message: 'A label is required.' });

    // Two reasons with the same label would be indistinguishable on the dropdown
    // and would each claim the other's guidance.
    const clash = await COL().where('kind', '==', kind).where('label', '==', label).limit(1).get();
    if (!clash.empty) return res.status(409).json({ success: false, message: 'That reason already exists.' });

    const ref = await COL().add({
      kind, label,
      guidance: String(req.body?.guidance || '').slice(0, 8000),
      active: req.body?.active !== false,
      order: Number(req.body?.order) || 999,
      createdAt: new Date(),
      updatedBy: req.adminEmail,
    });
    res.json({ success: true, id: ref.id, message: 'Reason added.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/admin/:id', adminOnly, async (req, res) => {
  try {
    const ref = COL().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Reason not found.' });

    const patch = { updatedAt: new Date(), updatedBy: req.adminEmail };
    if (req.body?.label !== undefined) {
      const label = String(req.body.label).trim();
      if (!label) return res.status(400).json({ success: false, message: 'A label is required.' });
      patch.label = label;
    }
    if (req.body?.guidance !== undefined) patch.guidance = String(req.body.guidance).slice(0, 8000);
    if (req.body?.active !== undefined) patch.active = req.body.active === true;
    if (req.body?.order !== undefined) patch.order = Number(req.body.order) || 0;

    await ref.update(patch);
    res.json({ success: true, message: 'Reason updated.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /admin/:id — removes it outright. Candidates already rejected keep the
// label they were given; it simply stops being offered.
router.delete('/admin/:id', adminOnly, async (req, res) => {
  try {
    const ref = COL().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Reason not found.' });
    const label = doc.data().label;

    // How many rejections already carry this label, so the admin is told what
    // they are removing rather than finding out from a report later.
    let used = 0;
    try {
      const snap = await db.collection('candidate_db').where('rejectReason', '==', label).get();
      used = snap.size;
    } catch (_) { /* the count is a courtesy, not a gate */ }

    await ref.delete();
    res.json({
      success: true,
      message: used
        ? `Removed. ${used} candidate${used === 1 ? '' : 's'} already rejected for this reason keep the label.`
        : 'Reason removed.',
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// The guidance for a label, read by the rejection email. Falls back to the file
// so an email is never lost if the collection is unreachable.
const guidanceFor = async (label) => {
  try {
    const snap = await COL().where('kind', '==', 'reject').where('label', '==', label).limit(1).get();
    if (!snap.empty) {
      const g = snap.docs[0].data().guidance;
      if (g) return g;
    }
  } catch (e) {
    console.error('guidanceFor lookup failed:', e.message);
  }
  try {
    const { REASON_TEXTS } = require('../utils/screenRejectReasons');
    return REASON_TEXTS?.[label] || '';
  } catch (_) { return ''; }
};

module.exports = router;
module.exports.guidanceFor = guidanceFor;
