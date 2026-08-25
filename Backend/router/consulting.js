/**
 * Consulting Firm portal (recruiterv.com/consulting).
 *
 * A consulting firm is a private tenant. It can add companies, positions,
 * recruiters and ClientSPOCs — all tagged `consultingFirmId` and visible only to
 * that firm (and SuperAdmin). Each is capped by an admin-set quota. Firm positions
 * go through the firm's own ClientSPOC for go-live. Firms register/login separately.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./firebase_ad');
const firmF = require('../model_fire/consultingFirmF');
const companyF = require('../model_fire/companyF');
const recruiterF = require('../model_fire/recruiterF');
const adminF = require('../model_fire/adminF');
const adminVerify = require('../model_fire/adminCF');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const POS = db.collection('admin_AddPos');
const CAND = db.collection('candidate_db');
const COMPANY = db.collection('Company_Overview');
const REC = db.collection('recruiter_db');
const ADMIN = db.collection('admin_db');

// ── Auth ─────────────────────────────────────────────────────────────────────
const firmAuth = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.SECKEY); }
  catch { return res.status(403).json({ message: 'Invalid token' }); }
  if (decoded.portal !== 'consulting' || !decoded.firmId) return res.status(403).json({ message: 'Not a consulting-firm session' });
  const f = await firmF.getFirmById(decoded.firmId);
  if (!f) return res.status(404).json({ message: 'Firm not found' });
  req.firm = f;
  next();
};

async function managerAuth(req, res, next) {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.SECKEY); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
  try {
    let result = await adminVerify.checkData(decoded.email);
    const fromAdminDb = result.success;
    let acct = result.admin;
    if (!result.success) {
      const rec = await recruiterF.findRecruiterByEmail(decoded.email);
      if (rec && (rec.role === 'Super Admin' || rec.roleCategory === 'SuperAdmin')) { acct = rec; result.success = true; }
    }
    if (!result.success) return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    if (!fromAdminDb && acct.role !== 'Super Admin' && acct.roleCategory !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    }
    req.managerEmail = decoded.email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

const setSessionCookie = (res, token) => {
  const isLocal = !process.env.K_SERVICE;
  res.cookie('__session', token, {
    httpOnly: true, secure: !isLocal, sameSite: isLocal ? 'lax' : 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000, path: '/', ...(isLocal ? {} : { domain: '.recruiterv.com' }),
  });
};

// Current usage counts (for quota enforcement + dashboard).
const firmCounts = async (firmId) => {
  const [companies, positions, recruiters, spocs] = await Promise.all([
    COMPANY.where('consultingFirmId', '==', firmId).get(),
    POS.where('consultingFirmId', '==', firmId).get(),
    REC.where('consultingFirmId', '==', firmId).get(),
    ADMIN.where('consultingFirmId', '==', firmId).get(),
  ]);
  return {
    companies: companies.size,
    positions: positions.size,
    recruiters: recruiters.size,
    clientspocs: spocs.docs.filter(d => lc(d.data().roleCategory || d.data().role) === 'clientspoc').length,
  };
};

// ── Register / Login / Me ────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (await firmF.findFirmByEmail(email)) return res.status(409).json({ success: false, message: 'A firm with this email already exists.' });
    const codPass = await bcrypt.hash(String(password), 10);
    await firmF.createFirm({ name, email, phone, codPass, status: 'pending',
      chosenPlan: ['6month', '1year'].includes(req.body?.plan) ? req.body.plan : '6month' });
    res.json({ success: true, message: 'Registration received. Your account is pending administrator approval.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, pass } = req.body || {};
    const result = await firmF.checkFirmCredentials(email, pass);
    if (!result.success) return res.status(400).json({ message: result.message });
    const f = result.firm;

    // A firm on a paid plan is refused once the term has lapsed. A failure in
    // the check must never lock out a firm that has paid, so it fails open.
    try {
      const { assertSubscriptionActive } = require('./portalSubscription');
      const st = await assertSubscriptionActive(f.email);
      if (!st.active) {
        return res.status(402).json({
          expired: true,
          message: st.reason === 'never-paid'
            ? 'Your subscription has not been activated yet. Please complete the payment to sign in.'
            : 'Your subscription has expired. Please renew to sign in again.',
        });
      }
    } catch (e) { console.error('firm subscription check failed:', e.message); }

    const token = jwt.sign({ email: f.email, portal: 'consulting', firmId: f.id }, process.env.SECKEY, { expiresIn: '30d' });
    setSessionCookie(res, token);
    res.json({ message: 'Verified Successfully', firm: { id: f.id, name: f.name, email: f.email, status: f.status }, token });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/logout', (req, res) => {
  const isLocal = !process.env.K_SERVICE;
  res.clearCookie('__session', { httpOnly: true, secure: !isLocal, sameSite: isLocal ? 'lax' : 'none', path: '/', ...(isLocal ? {} : { domain: '.recruiterv.com' }) });
  res.json({ message: 'Logged out' });
});

router.get('/me', firmAuth, async (req, res) => {
  const f = req.firm;
  const counts = await firmCounts(f.id);
  res.json({
    success: true, id: f.id, name: f.name, email: f.email, phone: f.phone || '',
    status: f.status, quotas: f.quotas || firmF.DEFAULT_QUOTAS, usage: counts,
    canPostOpenToAll: f.canPostOpenToAll === true,
  });
});

// Block portal actions until approved.
const requireApproved = (req, res, next) => {
  if (req.firm.status !== 'approved') return res.status(403).json({ message: 'Your firm account is pending administrator approval.', code: 'FIRM_PENDING' });
  next();
};

// Quota guard factory.
const withinQuota = (key, quotaKey) => async (req, res, next) => {
  const counts = await firmCounts(req.firm.id);
  const max = (req.firm.quotas || {})[quotaKey] || 0;
  if (counts[key] >= max) return res.status(403).json({ message: `${quotaKey} limit reached (${counts[key]}/${max}). Contact the administrator to increase your quota.`, code: 'QUOTA_REACHED' });
  next();
};

// ── Companies ────────────────────────────────────────────────────────────────
router.post('/companies', firmAuth, requireApproved, withinQuota('companies', 'maxCompanies'), async (req, res) => {
  try {
    const { name, overview, candidateInstructions, photoRequired, questions, commissionPercentage, logoUrl } = req.body || {};
    if (!(name || '').trim()) return res.status(400).json({ message: 'Company name is required.' });
    const pct = commissionPercentage !== undefined && commissionPercentage !== '' ? String(commissionPercentage) : '';
    const ref = COMPANY.doc();
    await ref.set({
      name: name.trim(), lower: lc(name),
      overview: overview || '', candidateInstructions: candidateInstructions || '',
      photoRequired: photoRequired === true || photoRequired === 'true',
      questions: Array.isArray(questions) ? questions : [],
      logoUrl: logoUrl || '',
      // Commission stored in the shape Ad_Pos auto-fills from (commisson + type).
      ...(pct ? { commisson: pct, commissionType: 'percentage' } : {}),
      consultingFirmId: req.firm.id, consultingFirmName: req.firm.name,
      createdAt: new Date(),
    });
    res.json({ success: true, id: ref.id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/companies', firmAuth, async (req, res) => {
  try {
    const snap = await COMPANY.where('consultingFirmId', '==', req.firm.id).get();
    res.json({ success: true, companies: snap.docs.map(d => ({ id: d.id, ...d.data(), codPass: undefined })) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Edit one of the firm's own companies.
router.put('/companies/:id', firmAuth, requireApproved, async (req, res) => {
  try {
    const doc = await COMPANY.doc(req.params.id).get();
    if (!doc.exists || doc.data().consultingFirmId !== req.firm.id) return res.status(404).json({ message: 'Company not found.' });
    const { name, overview, candidateInstructions, photoRequired, questions, commissionPercentage, logoUrl } = req.body || {};
    const patch = { updatedAt: new Date() };
    if (name !== undefined) { patch.name = String(name).trim(); patch.lower = lc(name); }
    if (overview !== undefined) patch.overview = overview;
    if (candidateInstructions !== undefined) patch.candidateInstructions = candidateInstructions;
    if (photoRequired !== undefined) patch.photoRequired = photoRequired === true || photoRequired === 'true';
    if (Array.isArray(questions)) patch.questions = questions;
    if (logoUrl !== undefined) patch.logoUrl = logoUrl;
    if (commissionPercentage !== undefined) {
      const pct = commissionPercentage === '' ? '' : String(commissionPercentage);
      patch.commisson = pct; patch.commissionType = pct ? 'percentage' : '';
    }
    await COMPANY.doc(req.params.id).set(patch, { merge: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Upload a logo for one of the firm's companies.
router.post('/companies/:id/logo', firmAuth, requireApproved, async (req, res) => {
  try {
    const doc = await COMPANY.doc(req.params.id).get();
    if (!doc.exists || doc.data().consultingFirmId !== req.firm.id) return res.status(404).json({ message: 'Company not found.' });
    const { filename, contentType, base64 } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ message: 'filename and base64 are required.' });
    if (!(contentType || '').startsWith('image/')) return res.status(400).json({ message: 'Please upload an image file.' });
    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 3 * 1024 * 1024) return res.status(400).json({ message: 'Logo must be under 3 MB.' });
    const bucket = admin.storage().bucket();
    const token = uuidv4();
    const safe = filename.replace(/[^\w.\-]+/g, '_');
    const filepath = `company-logos/${req.params.id}/${Date.now()}_${safe}`;
    await bucket.file(filepath).save(buffer, { contentType, resumable: false, metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filepath)}?alt=media&token=${token}`;
    await COMPANY.doc(req.params.id).set({ logoUrl: url }, { merge: true });
    res.json({ success: true, url });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Generic image upload for the firm (company logos etc.) → returns a URL.
router.post('/upload-image', firmAuth, requireApproved, async (req, res) => {
  try {
    const { filename, contentType, base64 } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ message: 'filename and base64 are required.' });
    if (!(contentType || '').startsWith('image/')) return res.status(400).json({ message: 'Please upload an image file.' });
    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 3 * 1024 * 1024) return res.status(400).json({ message: 'Image must be under 3 MB.' });
    const bucket = admin.storage().bucket();
    const token = uuidv4();
    const safe = filename.replace(/[^\w.\-]+/g, '_');
    const filepath = `firm-images/${req.firm.id}/${Date.now()}_${safe}`;
    await bucket.file(filepath).save(buffer, { contentType, resumable: false, metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
    res.json({ success: true, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filepath)}?alt=media&token=${token}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Recruiters ───────────────────────────────────────────────────────────────
router.post('/recruiters', firmAuth, requireApproved, withinQuota('recruiters', 'maxRecruiters'), async (req, res) => {
  try {
    const { name, email, password, mobile, skillCategory } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (await recruiterF.findRecruiterByEmail(lc(email))) return res.status(409).json({ message: 'A recruiter with this email already exists.' });
    const hashPass = await bcrypt.hash(String(password), 10);
    await recruiterF.createRecruiter({
      name: name.trim(), email: lc(email), password: hashPass, mobile: mobile || '',
      skillCategory: Array.isArray(skillCategory) ? skillCategory : [],
      roleCategory: 'Recruiter', role: 'recruiter', planType: 1, userType: 'paid',
      isVerified: true, accountStatus: 'approved',
      consultingFirmId: req.firm.id, consultingFirmName: req.firm.name,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/recruiters', firmAuth, async (req, res) => {
  try {
    const snap = await REC.where('consultingFirmId', '==', req.firm.id).get();
    res.json({ success: true, recruiters: snap.docs.map(d => { const x = d.data(); return { id: d.id, name: x.name, email: x.email, mobile: x.mobile || '', accountStatus: x.accountStatus || 'approved', skillCategory: x.skillCategory || [], createdAt: x.createdAt || null }; }) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/recruiters/:id/status', firmAuth, requireApproved, async (req, res) => {
  try {
    const doc = await REC.doc(req.params.id).get();
    if (!doc.exists || doc.data().consultingFirmId !== req.firm.id) return res.status(404).json({ message: 'Recruiter not found.' });
    const status = lc(req.body?.status) === 'blocked' ? 'blocked' : 'approved';
    await REC.doc(req.params.id).update({ accountStatus: status, accountStatusUpdatedAt: new Date() });
    res.json({ success: true, status });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── ClientSPOCs ──────────────────────────────────────────────────────────────
router.post('/clientspocs', firmAuth, requireApproved, withinQuota('clientspocs', 'maxClientspocs'), async (req, res) => {
  try {
    const { name, email, password, mobile, skillCategory } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    const dup = await ADMIN.where('email', '==', lc(email)).limit(1).get();
    if (!dup.empty) return res.status(409).json({ message: 'An account with this email already exists.' });
    const codPass = await bcrypt.hash(String(password), 10);
    const ref = ADMIN.doc();
    await ref.set({
      name: name.trim(), email: lc(email), codPass, mobile: mobile || '',
      role: 'ClientSPOC', roleCategory: 'ClientSpoc',
      skillCategory: Array.isArray(skillCategory) ? skillCategory : [],
      consultingFirmId: req.firm.id, consultingFirmName: req.firm.name,
      createdAt: new Date(),
    });
    res.json({ success: true, id: ref.id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/clientspocs', firmAuth, async (req, res) => {
  try {
    const snap = await ADMIN.where('consultingFirmId', '==', req.firm.id).get();
    const spocs = snap.docs.filter(d => lc(d.data().roleCategory || d.data().role) === 'clientspoc')
      .map(d => { const x = d.data(); return { id: d.id, name: x.name, email: x.email, mobile: x.mobile || '', skillCategory: x.skillCategory || [], createdAt: x.createdAt || null }; });
    res.json({ success: true, clientspocs: spocs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Positions ────────────────────────────────────────────────────────────────
router.post('/positions', firmAuth, requireApproved, withinQuota('positions', 'maxPositions'), async (req, res) => {
  try {
    const body = req.body || {};
    if (!(body.position || '').toString().trim()) return res.status(400).json({ message: 'Position title is required.' });
    if (!(body.clientspoc || '').toString().trim()) return res.status(400).json({ message: 'Select a ClientSPOC to approve this position.' });
    // The SPOC must belong to this firm.
    const spocSnap = await ADMIN.where('email', '==', lc(body.clientspoc)).limit(1).get();
    if (spocSnap.empty || spocSnap.docs[0].data().consultingFirmId !== req.firm.id) {
      return res.status(400).json({ message: 'That ClientSPOC does not belong to your firm.' });
    }
    // "Open to all" (visible to every recruiter) only if the admin permits this firm.
    const openToAll = req.firm.canPostOpenToAll === true && (body.openToAll === true || body.openToAll === 'true');
    const data = {
      ...body,
      clientspoc: lc(body.clientspoc),
      clientspoc_name: spocSnap.docs[0].data().name || '',
      // Firm posts go live immediately — no ClientSPOC approval required.
      status: 'active',
      consultingFirmId: req.firm.id, consultingFirmName: req.firm.name, postedByFirm: req.firm.id,
      openToAll,
    };
    const created = await adminF.CreatePosition(data);
    try { await adminF.updatePositionVisibility(created.pos_id); } catch (_) {}
    res.json({ success: true, message: 'Position posted and live.', data: created });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

const firmPositions = async (firmId) => {
  const snap = await POS.where('consultingFirmId', '==', firmId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
const firmCandidates = async (firmId) => {
  const positions = await firmPositions(firmId);
  const posIds = [...new Set(positions.map(p => p.pos_id).filter(Boolean))];
  if (!posIds.length) return [];
  const chunks = [];
  for (let i = 0; i < posIds.length; i += 30) chunks.push(posIds.slice(i, i + 30));
  const snaps = await Promise.all(chunks.map(ch => CAND.where('pos_id', 'in', ch).get()));
  return snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
};

// Returns FULL position docs (the firm's own) so the edit form has every field.
router.get('/positions', firmAuth, async (req, res) => {
  try {
    res.json({ success: true, positions: await firmPositions(req.firm.id) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Edit one of the firm's own positions (same Ad_Pos form). Preserves pos_id,
// consultingFirmId and status; honors openToAll only if the firm is permitted.
router.put('/positions/:id', firmAuth, requireApproved, async (req, res) => {
  try {
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || doc.data().consultingFirmId !== req.firm.id) return res.status(404).json({ message: 'Position not found.' });
    const body = { ...req.body };
    delete body.pos_id; delete body.id; delete body.consultingFirmId; delete body.status; delete body.postedByFirm;
    if (body.clientspoc) {
      const spocSnap = await ADMIN.where('email', '==', lc(body.clientspoc)).limit(1).get();
      if (spocSnap.empty || spocSnap.docs[0].data().consultingFirmId !== req.firm.id) return res.status(400).json({ message: 'That ClientSPOC does not belong to your firm.' });
      body.clientspoc = lc(body.clientspoc); body.clientspoc_name = spocSnap.docs[0].data().name || '';
    }
    body.openToAll = req.firm.canPostOpenToAll === true && (body.openToAll === true || body.openToAll === 'true');
    await adminF.updatePositionById(req.params.id, body);
    try { await adminF.updatePositionVisibility(doc.data().pos_id); } catch (_) {}
    res.json({ success: true, message: 'Position updated.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Dashboard summary ────────────────────────────────────────────────────────
const CAND_REJECTS = new Set(['screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject', 'background verification reject', 'negotiation reject', 'test reject', 'client drop', 'candidate drop', 'duplicate', 'offer declined', 'position on hold', 'rejected']);
const posGroup = (s) => { const v = lc(s) || 'active'; if (v === 'active') return 'live'; if (v === 'pending') return 'pending'; if (v === 'hold' || v === 'paused') return 'hold'; if (v === 'rejected' || v === 'closed') return 'rejected'; return 'other'; };

router.get('/summary', firmAuth, async (req, res) => {
  try {
    const [positions, candidates, counts] = await Promise.all([firmPositions(req.firm.id), firmCandidates(req.firm.id), firmCounts(req.firm.id)]);
    const posByGroup = { live: 0, pending: 0, hold: 0, rejected: 0, other: 0 };
    positions.forEach(p => { posByGroup[posGroup(p.status)]++; });
    const candByStatus = {};
    let rejected = 0;
    candidates.forEach(c => { const s = c.statusa || 'Submitted'; candByStatus[s] = (candByStatus[s] || 0) + 1; if (CAND_REJECTS.has(lc(s))) rejected++; });
    res.json({
      success: true,
      quotas: req.firm.quotas || firmF.DEFAULT_QUOTAS,
      usage: counts,
      positions: { total: positions.length, byGroup: posByGroup },
      candidates: { total: candidates.length, rejected, inProcess: candidates.length - rejected, byStatus: candByStatus },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Reports (CSV download) ───────────────────────────────────────────────────
const csv = (rows) => rows.map(r => r.map(v => {
  const s = (v === undefined || v === null) ? '' : (Array.isArray(v) ? v.join('; ') : String(v));
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n');

router.get('/report/:type', firmAuth, async (req, res) => {
  try {
    const t = req.params.type;
    let rows = [];
    if (t === 'recruiters') {
      const snap = await REC.where('consultingFirmId', '==', req.firm.id).get();
      rows.push(['Name', 'Email', 'Mobile', 'Status', 'Skill Category', 'Created']);
      snap.docs.forEach(d => { const x = d.data(); rows.push([x.name, x.email, x.mobile, x.accountStatus || 'approved', x.skillCategory, x.createdAt?.toDate?.().toISOString() || '']); });
    } else if (t === 'clientspocs') {
      const snap = await ADMIN.where('consultingFirmId', '==', req.firm.id).get();
      rows.push(['Name', 'Email', 'Mobile', 'Skill Category', 'Created']);
      snap.docs.filter(d => lc(d.data().roleCategory || d.data().role) === 'clientspoc').forEach(d => { const x = d.data(); rows.push([x.name, x.email, x.mobile, x.skillCategory, x.createdAt?.toDate?.().toISOString() || '']); });
    } else if (t === 'positions') {
      const list = await firmPositions(req.firm.id);
      rows.push(['Pos ID', 'Position', 'Company', 'Skill Category', 'Status', 'ClientSPOC', 'Location']);
      list.forEach(p => rows.push([p.pos_id, p.position, p.client, p.skill_category, p.status, p.clientspoc_name || p.clientspoc, Array.isArray(p.location) ? p.location.join('; ') : p.location]));
    } else if (t === 'candidates') {
      const list = await firmCandidates(req.firm.id);
      rows.push(['Candidate', 'Email', 'Mobile', 'Position', 'Status', 'Recruiter', 'Total Exp', 'Current CTC', 'Expected CTC']);
      list.forEach(c => rows.push([c.candidate, c.emails, c.mob, c.pos_name, c.statusa || 'Submitted', c.recName, c.total_exp, c.current_ctc, c.exp_ctc]));
    } else {
      return res.status(400).json({ message: 'Unknown report type.' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${t}-${req.firm.lower || 'firm'}.csv"`);
    res.send(csv(rows));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Firm public profile / landing ────────────────────────────────────────────
const PROFILE_FIELDS = ['about', 'logoUrl', 'website', 'city', 'state', 'phone', 'linkedin'];
router.put('/profile', firmAuth, async (req, res) => {
  try {
    const patch = {};
    for (const k of PROFILE_FIELDS) if (req.body[k] !== undefined) patch[k] = typeof req.body[k] === 'string' ? req.body[k].trim() : req.body[k];
    const updated = await firmF.updateFirm(req.firm.id, patch);
    res.json({ success: true, firm: { id: updated.id, name: updated.name, about: updated.about, logoUrl: updated.logoUrl, website: updated.website, city: updated.city, state: updated.state, phone: updated.phone, linkedin: updated.linkedin } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/profile', firmAuth, async (req, res) => {
  const f = await firmF.getFirmById(req.firm.id);
  const { codPass, ...rest } = f || {};
  res.json({ success: true, firm: rest });
});

// Upload a logo image (JSON base64 — avoids multipart issues on Cloud Run).
router.post('/logo', firmAuth, async (req, res) => {
  try {
    const { filename, contentType, base64 } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ message: 'filename and base64 are required.' });
    if (!(contentType || '').startsWith('image/')) return res.status(400).json({ message: 'Please upload an image file.' });
    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 3 * 1024 * 1024) return res.status(400).json({ message: 'Logo must be under 3 MB.' });
    const bucket = admin.storage().bucket();
    const token = uuidv4();
    const safe = filename.replace(/[^\w.\-]+/g, '_');
    const filepath = `firm-logos/${req.firm.id}/${Date.now()}_${safe}`;
    await bucket.file(filepath).save(buffer, { contentType, resumable: false, metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filepath)}?alt=media&token=${token}`;
    await firmF.updateFirm(req.firm.id, { logoUrl: url });
    res.json({ success: true, url });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

const slugify = (s) => (s || '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Public landing page data: firm details, its clients (companies) + active positions.
// :slug is the firm-name slug (falls back to matching the firm id for old links).
router.get('/public/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    let f = null;
    const all = await firmF.getAllFirms();
    f = all.find(x => slugify(x.name) === lc(slug)) || all.find(x => x.id === slug) || null;
    if (!f) return res.status(404).json({ success: false, message: 'Firm not found.' });
    const [companies, positions] = await Promise.all([
      COMPANY.where('consultingFirmId', '==', f.id).get(),
      POS.where('consultingFirmId', '==', f.id).get(),
    ]);
    const active = positions.docs.map(d => d.data()).filter(p => (p.status || '').toLowerCase() === 'active');
    res.json({
      success: true,
      firm: { id: f.id, name: f.name, about: f.about || '', logoUrl: f.logoUrl || '', website: f.website || '', city: f.city || '', state: f.state || '', linkedin: f.linkedin || '', email: f.email || '', phone: f.phone || '' },
      clients: companies.docs.map(d => ({ name: d.data().name, overview: d.data().overview || '', logoUrl: d.data().logoUrl || '' })),
      positions: active.map(p => ({ pos_id: p.pos_id, position: p.position, client: p.client, skill_category: p.skill_category, location: p.location, experience: p.experience })),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin management ─────────────────────────────────────────────────────────
router.get('/admin/list', managerAuth, async (req, res) => {
  try {
    const firms = await firmF.getAllFirms();
    const withCounts = await Promise.all(firms.map(async f => ({
      id: f.id, name: f.name, email: f.email, phone: f.phone || '', status: f.status,
      quotas: f.quotas || firmF.DEFAULT_QUOTAS, usage: await firmCounts(f.id),
      canPostOpenToAll: f.canPostOpenToAll === true,
    })));
    withCounts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json({ success: true, firms: withCounts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Approve/update: set status, quotas, and optionally (re)set the login password.
router.post('/admin/update/:id', managerAuth, async (req, res) => {
  try {
    const { status, quotas, password, name, phone, canPostOpenToAll } = req.body || {};
    const patch = {};
    if (status) patch.status = status;
    if (name !== undefined) patch.name = name;
    if (phone !== undefined) patch.phone = phone;
    if (canPostOpenToAll !== undefined) patch.canPostOpenToAll = !!canPostOpenToAll;
    if (quotas && typeof quotas === 'object') {
      patch.quotas = {
        maxCompanies: Math.max(0, parseInt(quotas.maxCompanies) || 0),
        maxPositions: Math.max(0, parseInt(quotas.maxPositions) || 0),
        maxClientspocs: Math.max(0, parseInt(quotas.maxClientspocs) || 0),
        maxRecruiters: Math.max(0, parseInt(quotas.maxRecruiters) || 0),
      };
    }
    const updated = await firmF.updateFirm(req.params.id, patch);
    if (password) await firmF.setFirmPassword(req.params.id, String(password));
    res.json({ success: true, firm: { id: updated.id, name: updated.name, email: updated.email, status: updated.status, quotas: updated.quotas } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin can also create a firm directly (with credentials + quotas).
router.post('/admin/create', managerAuth, async (req, res) => {
  try {
    const { name, email, password, phone, quotas } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (await firmF.findFirmByEmail(email)) return res.status(409).json({ success: false, message: 'A firm with this email already exists.' });
    const codPass = await bcrypt.hash(String(password), 10);
    const firm = await firmF.createFirm({ name, email, phone, codPass, status: 'approved', quotas });
    res.json({ success: true, id: firm.id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
