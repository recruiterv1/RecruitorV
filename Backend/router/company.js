/**
 * Company portal (recruiterv.com/company).
 *
 * Companies (Company_Overview) become a login-capable user type. SuperAdmin sets
 * their email+password and assigns ONE ClientSPOC. Companies can:
 *   - post positions (created 'pending' → the assigned ClientSPOC makes them live)
 *   - hold their own positions (reason required)
 *   - change a submitted candidate's status to a restricted set (reason required)
 *   - edit the client-requirement questions shown in the submit-candidate form
 * They do NOT see the recruiter roster (unlike vendors).
 *
 * The assigned ClientSPOC reviews pending company positions and makes them live
 * (status 'active') or rejects them; until live they are invisible to recruiters.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const companyF = require('../model_fire/companyF');
const clientspocF = require('../model_fire/clientspocF');
const candidateF = require('../model_fire/candidateF');
const adminF = require('../model_fire/adminF');
const adminVerify = require('../model_fire/adminCF');
const recruiterF = require('../model_fire/recruiterF');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const POS = db.collection('admin_AddPos');
const CAND = db.collection('candidate_db');

// Statuses a company may set on a submitted candidate (each requires a reason).
const COMPANY_STATUSES = [
  'Schedule Interview',
  'L1 To be Schedule', 'L2 To be Schedule', 'L3 To be Schedule', 'HR To be Schedule',
  'Selected', 'To Be Offered', 'Offer Accepted',
  'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject',
  'Position On Hold', 'Client Drop',
];
const COMPANY_STATUS_SET = new Set(COMPANY_STATUSES.map(lc));

// ── Auth ─────────────────────────────────────────────────────────────────────
const companyAuth = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.SECKEY); }
  catch { return res.status(403).json({ message: 'Invalid token' }); }
  if (decoded.portal !== 'company' || !decoded.companyId) {
    return res.status(403).json({ message: 'Not a company session' });
  }
  const c = await companyF.getCompanyById(decoded.companyId);
  if (!c) return res.status(404).json({ message: 'Company not found' });
  req.company = c;

  // An HR session carries hrId. Resolving it here means every route below can
  // scope to that HR's skill categories without repeating the lookup.
  if (decoded.hrId) {
    const hrDoc = await db.collection('company_hr').doc(decoded.hrId).get();
    if (!hrDoc.exists || hrDoc.data().companyId !== decoded.companyId) {
      return res.status(403).json({ message: 'HR account not found for this company.' });
    }
    if ((hrDoc.data().accountStatus || 'approved') === 'blocked') {
      return res.status(403).json({ message: 'Your access has been put on hold by your company.' });
    }
    req.hr = { id: hrDoc.id, ...hrDoc.data() };
  }
  next();
};

// SuperAdmin/Admin gate (mirrors router/admin.js — any admin_db record, or a
// recruiter_db Super Admin).
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
    maxAge: 30 * 24 * 60 * 60 * 1000, path: '/',
    ...(isLocal ? {} : { domain: '.recruiterv.com' }),
  });
};

// ── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, pass } = req.body || {};
    const result = await companyF.checkCompanyCredentials(email, pass);
    if (result.success) {
      const c = result.company;
      const token = jwt.sign({ email: c.email, portal: 'company', companyId: c.id }, process.env.SECKEY, { expiresIn: '30d' });
      setSessionCookie(res, token);
      return res.json({ message: 'Verified Successfully', company: { id: c.id, name: c.name, email: c.email }, token });
    }

    // Not the company account — it may be one of that company's HRs, who sign in
    // through the same door and get a session scoped to their skill categories.
    const bcryptLogin = require('bcryptjs');
    const hrSnap = await db.collection('company_hr').where('email', '==', lc(email)).limit(1).get();
    if (!hrSnap.empty) {
      const h = hrSnap.docs[0].data();
      if ((h.accountStatus || 'approved') === 'blocked') {
        return res.status(403).json({ message: 'Your access has been put on hold by your company.' });
      }
      if (h.password && await bcryptLogin.compare(String(pass || ''), h.password)) {
        const token = jwt.sign(
          { email: h.email, portal: 'company', companyId: h.companyId, hrId: hrSnap.docs[0].id },
          process.env.SECKEY, { expiresIn: '30d' });
        setSessionCookie(res, token);
        return res.json({
          message: 'Verified Successfully',
          company: { id: h.companyId, name: h.companyName || '', email: h.email },
          hr: { id: hrSnap.docs[0].id, name: h.name, skillCategories: h.skillCategories || [] },
          token,
        });
      }
    }

    return res.status(400).json({ message: result.message || 'Invalid credentials' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/logout', (req, res) => {
  const isLocal = !process.env.K_SERVICE;
  res.clearCookie('__session', { httpOnly: true, secure: !isLocal, sameSite: isLocal ? 'lax' : 'none', path: '/', ...(isLocal ? {} : { domain: '.recruiterv.com' }) });
  res.json({ message: 'Logged out' });
});

// ── GET /me ──────────────────────────────────────────────────────────────────
router.get('/me', companyAuth, (req, res) => {
  const c = req.company;
  if (req.hr) {
    return res.json({
      success: true,
      company: { id: c.id, name: c.name, email: c.email },
      hr: { id: req.hr.id, name: req.hr.name, email: req.hr.email, skillCategories: req.hr.skillCategories || [] },
      isHr: true,
    });
  }
  res.json({
    success: true,
    id: c.id, name: c.name, email: c.email,
    assignedClientspoc: c.assignedClientspoc || null,
    assignedClientspocName: c.assignedClientspocName || null,
    photoRequired: !!c.photoRequired,
    allowedStatuses: COMPANY_STATUSES,
  });
});

// All positions belonging to a company: posted through the portal + pre-existing
// ones whose client matches the company name.
const companyPositions = async (company, hr = null) => {
  const name = lc(company.name);
  const [byCompany, all] = await Promise.all([
    POS.where('postedByCompany', '==', company.id).get(),
    POS.get(),
  ]);
  const map = new Map();
  byCompany.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  all.docs.forEach(d => { const x = d.data(); if (lc(x.client) === name || lc(x.companyName) === name) map.set(d.id, { id: d.id, ...x }); });
  const positions = [...map.values()];
  // An HR only ever sees the positions in their own skill categories.
  if (!hr) return positions;
  const { positionMatchesSkills } = require('../utils/skillMatch');
  const cats = hr.skillCategories || [];
  if (!cats.length) return [];
  return positions.filter(p => positionMatchesSkills(p, cats));
};
const posGroup = (s) => { const v = (s || '').toLowerCase().trim() || 'active'; if (v === 'active') return 'live'; if (v === 'pending') return 'pending'; if (v === 'hold' || v === 'paused') return 'hold'; if (v === 'rejected' || v === 'closed') return 'rejected'; return 'other'; };
const CAND_REJECTS = new Set(['screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject', 'background verification reject', 'negotiation reject', 'test reject', 'client drop', 'candidate drop', 'duplicate', 'offer declined', 'position on hold', 'rejected']);

// ── GET /summary — dashboard aggregates ──────────────────────────────────────
router.get('/summary', companyAuth, async (req, res) => {
  try {
    const positions = await companyPositions(req.company, req.hr);
    const posByGroup = { live: 0, pending: 0, hold: 0, rejected: 0, other: 0 };
    positions.forEach(p => { posByGroup[posGroup(p.status)]++; });

    const posIds = [...new Set(positions.map(p => p.pos_id).filter(Boolean))];
    const byStatus = {}; let candTotal = 0, candRejected = 0;
    if (posIds.length) {
      const chunks = [];
      for (let i = 0; i < posIds.length; i += 30) chunks.push(posIds.slice(i, i + 30));
      const results = await Promise.all(chunks.map(ch => CAND.where('pos_id', 'in', ch).get()));
      results.forEach(s => s.docs.forEach(d => {
        const st = d.data().statusa || 'Submitted';
        candTotal++; byStatus[st] = (byStatus[st] || 0) + 1;
        if (CAND_REJECTS.has(st.toLowerCase().trim())) candRejected++;
      }));
    }
    res.json({
      success: true,
      positions: { total: positions.length, ...posByGroup },
      candidates: { total: candTotal, rejected: candRejected, inProcess: candTotal - candRejected, byStatus },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Positions ────────────────────────────────────────────────────────────────
// POST /positions — create a position (pending until the assigned SPOC makes it live).
router.post('/positions', companyAuth, async (req, res) => {
  try {
    const c = req.company;
    if (!c.assignedClientspoc) {
      return res.status(400).json({ message: 'No ClientSPOC is assigned to your company yet. Please contact the administrator.' });
    }
    const body = req.body || {};
    if (!(body.position || '').toString().trim()) return res.status(400).json({ message: 'Position title is required.' });
    if (!(body.skill_category || '').toString().trim()) return res.status(400).json({ message: 'Skill category is required.' });

    // Force company-owned + pending; route to the assigned SPOC; brand as this company.
    const spocEmails = Array.isArray(c.assignedClientspocs) && c.assignedClientspocs.length
      ? c.assignedClientspocs.map(s => lc(s.email)).filter(Boolean)
      : (c.assignedClientspoc ? [lc(c.assignedClientspoc)] : []);
    const data = {
      ...body,
      client: c.name,
      clientspoc: c.assignedClientspoc,
      clientspoc_name: c.assignedClientspocName || '',
      clientspocs: spocEmails,
      status: 'pending',                 // hidden from recruiters until SPOC makes it live
      postedByCompany: c.id,
      companyEmail: c.email,
      companyName: c.name,
    };
    const created = await adminF.CreatePosition(data);
    res.json({ success: true, message: 'Position submitted for ClientSPOC approval.', data: created });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /positions — this company's positions: ones posted through the portal
// (postedByCompany) AND any pre-existing positions whose client == the company name.
router.get('/positions', companyAuth, async (req, res) => {
  try {
    const name = lc(req.company.name);
    const [byCompany, all] = await Promise.all([
      POS.where('postedByCompany', '==', req.company.id).get(),
      POS.get(),
    ]);
    const map = new Map();
    byCompany.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    all.docs.forEach(d => {
      const x = d.data();
      if (lc(x.client) === name || lc(x.companyName) === name) map.set(d.id, { id: d.id, ...x });
    });
    let list = [...map.values()].sort((a, b) => (b.datePosted?.toMillis?.() || 0) - (a.datePosted?.toMillis?.() || 0));
    // An HR only sees positions in the skill categories they own.
    if (req.hr) {
      const { positionMatchesSkills } = require('../utils/skillMatch');
      const cats = req.hr.skillCategories || [];
      list = cats.length ? list.filter(p => positionMatchesSkills(p, cats)) : [];
    }
    res.json({ success: true, positions: list, scopedToHr: !!req.hr });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /positions/:id/hold — hold one of the company's own positions (reason required).
router.post('/positions/:id/hold', companyAuth, async (req, res) => {
  try {
    const reason = (req.body?.reason || '').toString().trim();
    if (!reason) return res.status(400).json({ message: 'A reason is required to hold a position.' });
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || doc.data().postedByCompany !== req.company.id) {
      return res.status(404).json({ message: 'Position not found.' });
    }
    await POS.doc(req.params.id).update({ status: 'hold', holdReason: reason, holdAt: new Date(), holdBy: req.company.email });
    res.json({ success: true, message: 'Position placed on hold.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Candidates ───────────────────────────────────────────────────────────────
// Candidates submitted against this company's positions.
router.get('/candidates', companyAuth, async (req, res) => {
  try {
    const name = lc(req.company.name);
    const [byCompany, all] = await Promise.all([
      POS.where('postedByCompany', '==', req.company.id).get(),
      POS.get(),
    ]);
    const idSet = new Set();
    byCompany.docs.forEach(d => { if (d.data().pos_id) idSet.add(d.data().pos_id); });
    all.docs.forEach(d => { const x = d.data(); if ((lc(x.client) === name || lc(x.companyName) === name) && x.pos_id) idSet.add(x.pos_id); });
    // Narrow to the HR's skill categories BEFORE fetching candidates, so a
    // candidate outside their remit is never even loaded.
    let posIds = [...idSet];
    if (req.hr) {
      const { positionMatchesSkills } = require('../utils/skillMatch');
      const cats = req.hr.skillCategories || [];
      if (!cats.length) return res.json({ success: true, candidates: [] });
      const allowed = new Set();
      byCompany.docs.forEach(d => { const x = d.data(); if (x.pos_id && positionMatchesSkills(x, cats)) allowed.add(x.pos_id); });
      all.docs.forEach(d => {
        const x = d.data();
        if ((lc(x.client) === name || lc(x.companyName) === name) && x.pos_id && positionMatchesSkills(x, cats)) allowed.add(x.pos_id);
      });
      posIds = posIds.filter(id => allowed.has(id));
    }
    if (!posIds.length) return res.json({ success: true, candidates: [] });

    // Firestore 'in' supports up to 30 values per query — chunk it.
    const chunks = [];
    for (let i = 0; i < posIds.length; i += 30) chunks.push(posIds.slice(i, i + 30));
    const results = await Promise.all(chunks.map(ch => CAND.where('pos_id', 'in', ch).get()));
    // Return the full candidate doc (minus heavy internal blobs) so the detail
    // modal has everything; keep cv_data for the resume link.
    // Only candidates actually SUBMITTED against the company are shown — hide raw
    // direct-applies ("Applied"), resume-bank entries and bulk uploads.
    const HIDE_STATUSES = new Set(['applied', 'resume bank', 'draft', 'incomplete']);
    const candidates = results.flatMap(s => s.docs.map(d => {
      const { matchReasoning, matchSummary, ...rest } = d.data();
      return { id: d.id, ...rest };
    })).filter(c => {
      if (c.source === 'clientspoc_bulk') return false;
      if (HIDE_STATUSES.has(lc(c.statusa))) return false;
      return true;
    });
    res.json({ success: true, candidates, allowedStatuses: COMPANY_STATUSES });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /pocs — ClientSPOCs engaged on this company's positions, with the positions
// each one is on. name/phone enriched from the ClientSPOC's own record.
router.get('/pocs', companyAuth, async (req, res) => {
  try {
    const name = lc(req.company.name);
    const [byCompany, all] = await Promise.all([
      POS.where('postedByCompany', '==', req.company.id).get(),
      POS.get(),
    ]);
    const map = new Map();
    const add = (p) => {
      const email = lc(p.clientspoc);
      if (!email) return;
      if (!map.has(email)) map.set(email, { email, name: p.clientspoc_name || '', positions: new Set() });
      const e = map.get(email);
      if (!e.name && p.clientspoc_name) e.name = p.clientspoc_name;
      if (p.position) e.positions.add(p.position);
    };
    byCompany.docs.forEach(d => add(d.data()));
    all.docs.forEach(d => { const x = d.data(); if (lc(x.client) === name || lc(x.companyName) === name) add(x); });

    const pocs = [];
    for (const p of map.values()) {
      let phone = '', pname = p.name;
      try { const s = await clientspocF.findClientSpocByEmail(p.email); if (s) { phone = s.phone || s.mobile || s.mob || s.contact || ''; pname = pname || s.name || ''; } } catch (_) {}
      pocs.push({ email: p.email, name: pname || p.email.split('@')[0], phone, positions: [...p.positions].sort() });
    }
    pocs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json({ success: true, pocs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /candidates/:id/status — restricted status change with a mandatory reason.
router.post('/candidates/:id/status', companyAuth, async (req, res) => {
  try {
    const statusa = (req.body?.statusa || '').toString().trim();
    const reason = (req.body?.reason || '').toString().trim();
    if (!statusa) return res.status(400).json({ message: 'Status is required.' });
    if (!COMPANY_STATUS_SET.has(lc(statusa))) {
      return res.status(403).json({ message: 'You are not allowed to set this status.' });
    }
    if (!reason) return res.status(400).json({ message: 'A reason is required for this status change.' });

    // Verify the candidate belongs to one of this company's positions.
    const candDoc = await CAND.doc(req.params.id).get();
    if (!candDoc.exists) return res.status(404).json({ message: 'Candidate not found.' });
    const posId = candDoc.data().pos_id;
    const own = await POS.where('postedByCompany', '==', req.company.id).where('pos_id', '==', posId).limit(1).get();
    if (own.empty) return res.status(403).json({ message: 'This candidate is not on one of your positions.' });

    await candidateF.updatePositionStatus(req.params.id, statusa, {
      changedBy: req.company.email, changedByName: req.company.name, rejectReason: reason,
    });
    res.json({ success: true, message: 'Status updated.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Client-requirement questions ─────────────────────────────────────────────
router.get('/questions', companyAuth, async (req, res) => {
  const c = await companyF.getCompanyById(req.company.id);
  res.json({ success: true, questions: Array.isArray(c.questions) ? c.questions : [] });
});

router.put('/questions', companyAuth, async (req, res) => {
  try {
    const raw = Array.isArray(req.body?.questions) ? req.body.questions : [];
    // Canonical shape (matches QuestionsEditor / Company_Overview): { type, question, options }
    const questions = raw.map(q => {
      const type = ['subjective', 'yesno', 'multiselect'].includes(lc(q?.type)) ? lc(q.type) : 'subjective';
      const text = (q?.question ?? q?.label ?? '').toString().trim();
      const out = { type, question: text, options: [] };
      if (type === 'multiselect') out.options = Array.isArray(q?.options) ? q.options.map(o => o.toString().trim()).filter(Boolean) : [];
      return out;
    }).filter(q => q.question);
    await companyF.updateCompany(req.company.id, { questions });
    res.json({ success: true, questions });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Profile: full details + edit + change password ───────────────────────────
router.get('/profile', companyAuth, async (req, res) => {
  try {
    const c = await companyF.getCompanyById(req.company.id);
    const { codPass, ...rest } = c || {};
    res.json({ success: true, company: { ...rest, hasLogin: !!codPass, allowedStatuses: COMPANY_STATUSES } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Company can edit descriptive profile fields (not name/login/commission/SPOC — those
// are keyed to positions or admin-controlled).
const EDITABLE_PROFILE = ['overview', 'website', 'address', 'city', 'state', 'contactPerson', 'contactPhone', 'industry', 'about', 'logoUrl'];
router.put('/profile', companyAuth, async (req, res) => {
  try {
    const patch = {};
    for (const k of EDITABLE_PROFILE) if (req.body[k] !== undefined) patch[k] = typeof req.body[k] === 'string' ? req.body[k].trim() : req.body[k];
    if (req.body.photoRequired !== undefined) patch.photoRequired = !!req.body.photoRequired;
    if (!Object.keys(patch).length) return res.status(400).json({ message: 'Nothing to update.' });
    const updated = await companyF.updateCompany(req.company.id, patch);
    const { codPass, ...rest } = updated || {};
    res.json({ success: true, company: rest });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/change-password', companyAuth, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    const c = await companyF.getCompanyById(req.company.id);
    if (c.codPass) {
      const ok = await bcrypt.compare(String(currentPassword || ''), c.codPass);
      if (!ok) return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const codPass = await bcrypt.hash(String(newPassword), 10);
    await companyF.updateCompany(req.company.id, { codPass });
    res.json({ success: true, message: 'Password updated.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Admin: assign ClientSPOC + set portal credentials ────────────────────────
router.get('/admin/list', managerAuth, async (req, res) => {
  try {
    const companies = await companyF.getAllCompanies();
    res.json({
      success: true,
      companies: companies.map(c => ({
        id: c.id, name: c.name, email: c.email || null,
        portalEnabled: c.portalEnabled !== false && !!c.email,
        hasLogin: !!c.codPass,
        assignedClientspoc: c.assignedClientspoc || null,
        assignedClientspocName: c.assignedClientspocName || null,
      })).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/admin/clientspocs', managerAuth, async (req, res) => {
  try {
    const snap = await db.collection('admin_db').get();
    const spocs = snap.docs.map(d => d.data())
      .filter(d => lc(d.roleCategory || d.role) === 'clientspoc')
      .map(d => ({ email: lc(d.email), name: d.name || d.email }))
      .filter(s => s.email)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json({ success: true, clientspocs: spocs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/admin/access', managerAuth, async (req, res) => {
  try {
    const { companyId, email, password, clientspocEmail, clientspocName, portalEnabled } = req.body || {};
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId is required.' });
    if (email !== undefined && email) {
      const clash = await companyF.findCompanyByEmail(email);
      if (clash && clash.id !== companyId) return res.status(409).json({ success: false, message: 'That login email is already used by another company.' });
    }
    const updated = await companyF.setCompanyPortalAccess(companyId, { email, password, clientspocEmail, clientspocName, portalEnabled });
    res.json({ success: true, company: { id: updated.id, name: updated.name, email: updated.email, assignedClientspoc: updated.assignedClientspoc, assignedClientspocName: updated.assignedClientspocName, portalEnabled: updated.portalEnabled } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ClientSPOC: review & make company positions live ─────────────────────────
const spocAuth = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.SECKEY); }
  catch { return res.status(403).json({ message: 'Invalid token' }); }
  const spoc = await clientspocF.findClientSpocByEmail(decoded.email);
  if (!spoc) return res.status(403).json({ message: 'ClientSPOC access required' });
  req.spocEmail = lc(decoded.email);
  req.spoc = spoc;
  next();
};

// Pending company-posted positions routed to this SPOC.
router.get('/spoc/pending', spocAuth, async (req, res) => {
  try {
    // A position may name this SPOC as the primary (clientspoc) or one of several (clientspocs[]).
    const [byPrimary, byArray] = await Promise.all([
      POS.where('clientspoc', '==', req.spocEmail).get(),
      POS.where('clientspocs', 'array-contains', req.spocEmail).get().catch(() => ({ docs: [] })),
    ]);
    const byId = {};
    [...byPrimary.docs, ...byArray.docs].forEach(d => { byId[d.id] = { id: d.id, ...d.data() }; });
    // Return the FULL position so the SPOC's edit form can pre-fill every field.
    const list = Object.values(byId)
      .filter(p => (p.postedByCompany || p.postedByFirm || (p.postedByVendor && p.vendorPrivate !== true)) && lc(p.status) === 'pending')
      .map(p => ({ ...p, companyName: p.companyName || p.consultingFirmName || p.client }));
    res.json({ success: true, positions: list });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

const spocOwns = (p, spocEmail) => lc(p.clientspoc) === spocEmail || (Array.isArray(p.clientspocs) && p.clientspocs.map(lc).includes(spocEmail));

router.post('/spoc/positions/:id/golive', spocAuth, async (req, res) => {
  try {
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || !spocOwns(doc.data(), req.spocEmail) || !(doc.data().postedByCompany || doc.data().postedByFirm || (doc.data().postedByVendor && doc.data().vendorPrivate !== true))) {
      return res.status(404).json({ message: 'Position not found.' });
    }
    await POS.doc(req.params.id).update({ status: 'active', wentLiveAt: new Date(), approvedBy: req.spocEmail });
    try { await adminF.updatePositionVisibility(doc.data().pos_id); } catch (_) {}
    // 🔗 A Client SPOC just made this position live → push to LinkedIn via Zapier.
    try {
      const { postPositionToZapier } = require('../utils/postPositionToZapier');
      postPositionToZapier({ ...doc.data(), status: 'active' }).catch(() => {});
    } catch (_) {}
    res.json({ success: true, message: 'Position is now live for recruiters.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/spoc/positions/:id/reject', spocAuth, async (req, res) => {
  try {
    const reason = (req.body?.reason || '').toString().trim();
    if (!reason) return res.status(400).json({ message: 'A reason is required to reject a position.' });
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || !spocOwns(doc.data(), req.spocEmail) || !(doc.data().postedByCompany || doc.data().postedByFirm || (doc.data().postedByVendor && doc.data().vendorPrivate !== true))) {
      return res.status(404).json({ message: 'Position not found.' });
    }
    await POS.doc(req.params.id).update({ status: 'rejected', rejectReason: reason, rejectedBy: req.spocEmail, rejectedAt: new Date() });
    res.json({ success: true, message: 'Position rejected.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});


// ── Company HR sub-users ─────────────────────────────────────────────────────
// A company can add HRs and give each the skill categories they own. An HR signs
// in with the same /company login and sees only the positions and candidates in
// their categories — the company owner sees everything.
//
// Stored in `company_hr`, keyed by the company they belong to.
const HR = db.collection('company_hr');
const bcryptHr = require('bcryptjs');

const hrShape = (doc) => {
  const h = doc.data();
  return {
    id: doc.id, companyId: h.companyId, name: h.name || '', email: h.email || '',
    phone: h.phone || '', skillCategories: Array.isArray(h.skillCategories) ? h.skillCategories : [],
    accountStatus: h.accountStatus || 'approved',
    createdAt: h.createdAt || null,
  };
};

// Does this position fall in the HR's skill categories? Reuses the shared
// matcher, so an HR set to "Technology" also sees an IT position.
const hrOwnsPosition = (hr, pos) => {
  if (!hr) return true;                                   // the company owner
  const cats = hr.skillCategories || [];
  if (!cats.length) return false;                          // no categories = nothing
  const { positionMatchesSkills } = require('../utils/skillMatch');
  return positionMatchesSkills(pos, cats);
};

// ── Company owner: manage HRs ────────────────────────────────────────────────
router.get('/hrs', companyAuth, async (req, res) => {
  try {
    if (req.hr) return res.status(403).json({ message: 'Only the company account can manage HRs.' });
    const snap = await HR.where('companyId', '==', req.company.id).get();
    res.json({ success: true, hrs: snap.docs.map(hrShape).sort((a, b) => a.name.localeCompare(b.name)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/hrs', companyAuth, async (req, res) => {
  try {
    if (req.hr) return res.status(403).json({ message: 'Only the company account can add HRs.' });
    const name = String(req.body?.name || '').trim();
    const email = lc(req.body?.email);
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');
    const skillCategories = Array.isArray(req.body?.skillCategories)
      ? [...new Set(req.body.skillCategories.map(x => String(x).trim()).filter(Boolean))] : [];

    if (!name) return res.status(400).json({ message: 'Name is required.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (!skillCategories.length) return res.status(400).json({ message: 'Give this HR at least one skill category.' });

    const dup = await HR.where('email', '==', email).limit(1).get();
    if (!dup.empty) return res.status(409).json({ message: 'An HR with that email already exists.' });
    const dupCompany = await db.collection('admin_db').where('email', '==', email).limit(1).get();
    if (!dupCompany.empty) return res.status(409).json({ message: 'That email already belongs to another account.' });

    const ref = await HR.add({
      companyId: req.company.id, companyName: req.company.name || '',
      name, email, phone,
      password: await bcryptHr.hash(password, 10),
      skillCategories, accountStatus: 'approved',
      createdAt: new Date(), createdBy: req.company.email || '',
    });

    try {
      const { sendEmailFull } = require('../utils/email');
      await sendEmailFull({
        to: email,
        subject: `Your RecruiterV HR account for ${req.company.name || 'your company'}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
          <p>Hi ${name},</p>
          <p>An HR account has been created for you on RecruiterV for
          <b>${req.company.name || 'your company'}</b>.</p>
          <p><b>Sign in:</b> https://www.recruiterv.com/company<br/>
             <b>Email:</b> ${email}<br/><b>Password:</b> ${password}</p>
          <p>You'll see the positions and candidates in your skill areas:
          <b>${skillCategories.join(', ')}</b>.</p>
          <p>Please change your password after your first sign-in.</p>
          <p>Regards,<br/>Team RecruiterV</p></div>`,
      });
    } catch (e) { console.error('HR welcome email failed:', e.message); }

    res.json({ success: true, id: ref.id, message: 'HR added. Their sign-in details have been emailed.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/hrs/:id', companyAuth, async (req, res) => {
  try {
    if (req.hr) return res.status(403).json({ message: 'Only the company account can edit HRs.' });
    const ref = HR.doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().companyId !== req.company.id) {
      return res.status(404).json({ message: 'HR not found.' });
    }
    const patch = {};
    if (req.body?.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body?.phone !== undefined) patch.phone = String(req.body.phone).trim();
    if (req.body?.accountStatus !== undefined) {
      patch.accountStatus = req.body.accountStatus === 'blocked' ? 'blocked' : 'approved';
    }
    if (Array.isArray(req.body?.skillCategories)) {
      const cats = [...new Set(req.body.skillCategories.map(x => String(x).trim()).filter(Boolean))];
      if (!cats.length) return res.status(400).json({ message: 'Give this HR at least one skill category.' });
      patch.skillCategories = cats;
    }
    if (req.body?.password) {
      if (String(req.body.password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      patch.password = await bcryptHr.hash(String(req.body.password), 10);
    }
    patch.updatedAt = new Date();
    await ref.set(patch, { merge: true });
    res.json({ success: true, message: 'HR updated.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/hrs/:id', companyAuth, async (req, res) => {
  try {
    if (req.hr) return res.status(403).json({ message: 'Only the company account can remove HRs.' });
    const doc = await HR.doc(req.params.id).get();
    if (!doc.exists || doc.data().companyId !== req.company.id) {
      return res.status(404).json({ message: 'HR not found.' });
    }
    await doc.ref.delete();
    res.json({ success: true, message: 'HR removed.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
