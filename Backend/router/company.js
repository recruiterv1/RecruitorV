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
  'L1 To be Schedule', 'L2 To be Schedule', 'L3 To be Schedule', 'HR To be Schedule',
  'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 'HR Reject',
  'To Be Offered', 'Offer Accepted',
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
    if (!result.success) return res.status(400).json({ message: result.message });
    const c = result.company;
    const token = jwt.sign({ email: c.email, portal: 'company', companyId: c.id }, process.env.SECKEY, { expiresIn: '30d' });
    setSessionCookie(res, token);
    res.json({ message: 'Verified Successfully', company: { id: c.id, name: c.name, email: c.email }, token });
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
const companyPositions = async (company) => {
  const name = lc(company.name);
  const [byCompany, all] = await Promise.all([
    POS.where('postedByCompany', '==', company.id).get(),
    POS.get(),
  ]);
  const map = new Map();
  byCompany.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  all.docs.forEach(d => { const x = d.data(); if (lc(x.client) === name || lc(x.companyName) === name) map.set(d.id, { id: d.id, ...x }); });
  return [...map.values()];
};
const posGroup = (s) => { const v = (s || '').toLowerCase().trim() || 'active'; if (v === 'active') return 'live'; if (v === 'pending') return 'pending'; if (v === 'hold' || v === 'paused') return 'hold'; if (v === 'rejected' || v === 'closed') return 'rejected'; return 'other'; };
const CAND_REJECTS = new Set(['screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject', 'background verification reject', 'negotiation reject', 'test reject', 'client drop', 'candidate drop', 'duplicate', 'offer declined', 'position on hold', 'rejected']);

// ── GET /summary — dashboard aggregates ──────────────────────────────────────
router.get('/summary', companyAuth, async (req, res) => {
  try {
    const positions = await companyPositions(req.company);
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
    const data = {
      ...body,
      client: c.name,
      clientspoc: c.assignedClientspoc,
      clientspoc_name: c.assignedClientspocName || '',
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
    const list = [...map.values()].sort((a, b) => (b.datePosted?.toMillis?.() || 0) - (a.datePosted?.toMillis?.() || 0));
    res.json({ success: true, positions: list });
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
    const posIds = [...idSet];
    if (!posIds.length) return res.json({ success: true, candidates: [] });

    // Firestore 'in' supports up to 30 values per query — chunk it.
    const chunks = [];
    for (let i = 0; i < posIds.length; i += 30) chunks.push(posIds.slice(i, i + 30));
    const results = await Promise.all(chunks.map(ch => CAND.where('pos_id', 'in', ch).get()));
    // Return the full candidate doc (minus heavy internal blobs) so the detail
    // modal has everything; keep cv_data for the resume link.
    const candidates = results.flatMap(s => s.docs.map(d => {
      const { matchReasoning, matchSummary, ...rest } = d.data();
      return { id: d.id, ...rest };
    }));
    res.json({ success: true, candidates, allowedStatuses: COMPANY_STATUSES });
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
    const snap = await POS.where('clientspoc', '==', req.spocEmail).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(p => (p.postedByCompany || p.postedByFirm) && lc(p.status) === 'pending')
      .map(p => ({ id: p.id, pos_id: p.pos_id, position: p.position, companyName: p.companyName || p.consultingFirmName || p.client, skill_category: p.skill_category, location: p.location, state: p.state, datePosted: p.datePosted || null }));
    res.json({ success: true, positions: list });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/spoc/positions/:id/golive', spocAuth, async (req, res) => {
  try {
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || lc(doc.data().clientspoc) !== req.spocEmail || !(doc.data().postedByCompany || doc.data().postedByFirm)) {
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
    if (!doc.exists || lc(doc.data().clientspoc) !== req.spocEmail || !(doc.data().postedByCompany || doc.data().postedByFirm)) {
      return res.status(404).json({ message: 'Position not found.' });
    }
    await POS.doc(req.params.id).update({ status: 'rejected', rejectReason: reason, rejectedBy: req.spocEmail, rejectedAt: new Date() });
    res.json({ success: true, message: 'Position rejected.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
