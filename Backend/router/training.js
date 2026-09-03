const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const adminVerify = require('../model_fire/adminCF');

// Training manuals — a step-by-step guide per user type, written by the
// SuperAdmin and shown in that user type's own sidebar.
//
// Collections:
//   training_manuals — one doc per role: title, intro, published
//   training_steps   — the steps, each with an optional screenshot and the
//                      menu path it refers to ("Dashboard → Open Positions")

const ROLES = ['Recruiter', 'Coach', 'Expert', 'Vendor', 'ClientSPOC', 'Company', 'ConsultingFirm'];
const ROLE_LABEL = {
  Recruiter: 'Recruiter', Coach: 'Coach', Expert: 'Expert', Vendor: 'Vendor',
  ClientSPOC: 'Client SPOC', Company: 'Company / HR', ConsultingFirm: 'Consulting Firm',
};

const MANUALS = () => db.collection('training_manuals');
const STEPS = () => db.collection('training_steps');

const isRole = (r) => ROLES.includes(String(r || '').trim());

// Map whatever a session says about itself onto one of the manual roles.
const roleOf = (user = {}) => {
  const rc = String(user.roleCategory || '').toLowerCase().replace(/[\s_-]/g, '');
  const r = String(user.role || '').toLowerCase().replace(/[\s_-]/g, '');
  const both = `${rc}|${r}`;
  if (both.includes('clientspoc')) return 'ClientSPOC';
  if (both.includes('consulting')) return 'ConsultingFirm';
  if (both.includes('vendor')) return 'Vendor';
  if (both.includes('coach')) return 'Coach';
  if (both.includes('expert')) return 'Expert';
  if (both.includes('company')) return 'Company';
  return 'Recruiter';
};

const toIso = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// Any signed-in user — the manual is for whoever is logged in.
const userAuth = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try {
    req.user = jwt.verify(token, process.env.SECKEY);
    next();
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Session expired.' });
  }
};

const adminAuth = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'No admin session' });
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    const result = await adminVerify.checkData(decoded.email);
    if (result.success) { req.admin = result.admin; return next(); }
    const recruiterF = require('../model_fire/recruiterF');
    const rec = await recruiterF.findRecruiterByEmail(decoded.email);
    if (rec && (rec.role === 'Super Admin' || rec.roleCategory === 'SuperAdmin')) {
      req.admin = rec; return next();
    }
    return res.status(403).json({ success: false, message: 'Not authorised' });
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session' });
  }
};

// Read a whole manual — meta plus steps grouped into sections, in order.
const readManual = async (role) => {
  const [metaDoc, stepSnap] = await Promise.all([
    MANUALS().doc(role).get(),
    STEPS().where('role', '==', role).get(),
  ]);
  const meta = metaDoc.exists ? metaDoc.data() : {};
  const steps = stepSnap.docs
    .map(d => ({ id: d.id, ...d.data(), createdAt: toIso(d.data().createdAt) }));

  // Group into sections. A handbook has to read in order, so sections are
  // ordered by their lowest step number rather than alphabetically — otherwise
  // "Getting started" lands in the middle.
  const byName = {};
  steps.forEach(s => {
    const name = s.section || 'Getting started';
    if (!byName[name]) byName[name] = { section: name, steps: [] };
    byName[name].steps.push(s);
  });
  const sections = Object.values(byName)
    .map(sec => ({
      ...sec,
      steps: sec.steps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      _first: Math.min(...sec.steps.map(x => x.order ?? 0)),
    }))
    .sort((a, b) => a._first - b._first)
    .map(({ _first, ...sec }) => sec);

  return {
    role,
    label: ROLE_LABEL[role] || role,
    title: meta.title || `${ROLE_LABEL[role] || role} Training Manual`,
    intro: meta.intro || '',
    published: meta.published !== false,
    updatedAt: toIso(meta.updatedAt),
    sections,
    stepCount: steps.length,
  };
};

/* ── For the signed-in user ───────────────────────────────────────────────── */

// GET /training/my — the manual for whoever is logged in.
router.get('/my', userAuth, async (req, res) => {
  try {
    const role = roleOf(req.user);
    const manual = await readManual(role);
    if (!manual.published || !manual.stepCount) {
      return res.json({ success: true, role, label: manual.label, empty: true, manual: null });
    }
    res.json({ success: true, role, label: manual.label, empty: false, manual });
  } catch (e) {
    console.error('training/my error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── SuperAdmin ───────────────────────────────────────────────────────────── */

// Every manual with its step count, for the console's overview.
router.get('/admin/manuals', adminAuth, async (req, res) => {
  try {
    const out = [];
    for (const role of ROLES) out.push(await readManual(role));
    res.json({ success: true, roles: ROLES, labels: ROLE_LABEL, manuals: out });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/admin/manual/:role', adminAuth, async (req, res) => {
  try {
    if (!isRole(req.params.role)) return res.status(400).json({ success: false, message: 'Unknown role.' });
    res.json({ success: true, manual: await readManual(req.params.role) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Manual title / intro / published state.
router.put('/admin/manual/:role', adminAuth, async (req, res) => {
  try {
    const role = req.params.role;
    if (!isRole(role)) return res.status(400).json({ success: false, message: 'Unknown role.' });
    const patch = { role, updatedAt: new Date() };
    if (req.body.title !== undefined) patch.title = String(req.body.title).slice(0, 200);
    if (req.body.intro !== undefined) patch.intro = String(req.body.intro).slice(0, 4000);
    if (req.body.published !== undefined) patch.published = req.body.published !== false;
    await MANUALS().doc(role).set(patch, { merge: true });
    res.json({ success: true, message: 'Manual saved.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

const validateStep = (b) => {
  if (!isRole(b?.role)) return 'Choose a valid user type.';
  if (!String(b?.title || '').trim()) return 'The step needs a title.';
  return null;
};

router.post('/admin/steps', adminAuth, async (req, res) => {
  try {
    const err = validateStep(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    const { role, section, title, body, menuPath, imageUrl, order } = req.body;
    const ref = await STEPS().add({
      role,
      section: String(section || 'Getting started').trim().slice(0, 120),
      title: String(title).trim().slice(0, 200),
      body: String(body || '').slice(0, 6000),
      menuPath: String(menuPath || '').trim().slice(0, 300),
      imageUrl: String(imageUrl || '').trim(),
      order: parseInt(order, 10) || 0,
      createdAt: new Date(),
    });
    await MANUALS().doc(role).set({ role, updatedAt: new Date() }, { merge: true });
    res.json({ success: true, id: ref.id, message: 'Step added.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/admin/steps/:id', adminAuth, async (req, res) => {
  try {
    const err = validateStep(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    const { role, section, title, body, menuPath, imageUrl, order } = req.body;
    await STEPS().doc(req.params.id).update({
      role,
      section: String(section || 'Getting started').trim().slice(0, 120),
      title: String(title).trim().slice(0, 200),
      body: String(body || '').slice(0, 6000),
      menuPath: String(menuPath || '').trim().slice(0, 300),
      imageUrl: String(imageUrl || '').trim(),
      order: parseInt(order, 10) || 0,
      updatedAt: new Date(),
    });
    await MANUALS().doc(role).set({ role, updatedAt: new Date() }, { merge: true });
    res.json({ success: true, message: 'Step updated.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/admin/steps/:id', adminAuth, async (req, res) => {
  try {
    await STEPS().doc(req.params.id).delete();
    res.json({ success: true, message: 'Step deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Screenshot upload — base64, same approach as the other image uploads here.
router.post('/admin/screenshot', adminAuth, async (req, res) => {
  try {
    const { filename, contentType, base64 } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ success: false, message: 'filename and base64 are required.' });
    if (!(contentType || '').startsWith('image/')) return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ success: false, message: 'Screenshot must be under 5 MB.' });
    const bucket = admin.storage().bucket();
    const token = uuidv4();
    const safe = filename.replace(/[^\w.\-]+/g, '_');
    const filepath = `training-manuals/${Date.now()}_${safe}`;
    await bucket.file(filepath).save(buffer, {
      contentType, resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filepath)}?alt=media&token=${token}`;
    res.json({ success: true, url });
  } catch (e) {
    console.error('training/screenshot error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
