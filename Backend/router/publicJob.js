/**
 * Public "Post a Job" funnel.
 *
 * Anyone can post a job from a public page (same Ad_Pos form; Client Requirements
 * uses the add-questions module). The post lands as status 'admin-pending' on the
 * SuperAdmin "Public Job Requests" page. On approval the admin:
 *   - auto-creates the company (Company_Overview) if it doesn't exist,
 *   - sets its portal login (email + password to share) and assigns a ClientSPOC,
 *   - flips the position to 'pending' + postedByCompany so it shows on the SPOC's
 *     Company Approvals page → SPOC makes it live for recruiters.
 * If the company already has a portal login, the public page instead sends them to
 * the company login (/company).
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const companyF = require('../model_fire/companyF');
const adminF = require('../model_fire/adminF');
const adminVerify = require('../model_fire/adminCF');
const recruiterF = require('../model_fire/recruiterF');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const POS = db.collection('admin_AddPos');
const COMPANY = db.collection('Company_Overview');

// Find a company doc (with id) by name, case-insensitive.
const findCompanyByName = async (name) => {
  const n = lc(name);
  if (!n) return null;
  const byLower = await COMPANY.where('lower', '==', n).limit(1).get();
  if (!byLower.empty) return { id: byLower.docs[0].id, ...byLower.docs[0].data() };
  const all = await COMPANY.get();
  const hit = all.docs.find(d => lc(d.data().name) === n);
  return hit ? { id: hit.id, ...hit.data() } : null;
};

// ── SuperAdmin/Admin gate (mirrors router/admin.js) ──────────────────────────
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

// ── POST /check-company  (public) ────────────────────────────────────────────
// Tells the public page whether the entered company already has a portal login
// (→ send them to /company) or is new (→ show the post-a-job form).
router.post('/check-company', async (req, res) => {
  try {
    const c = await findCompanyByName(req.body?.name);
    res.json({ success: true, exists: !!c, hasLogin: !!(c && c.codPass && c.portalEnabled !== false) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /submit  (public) ───────────────────────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const body = req.body || {};
    const companyName = (body.client || body.companyName || '').toString().trim();
    if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required.' });
    if (!(body.position || '').toString().trim()) return res.status(400).json({ success: false, message: 'Position title is required.' });

    // If the company already has a portal login, they must post from their own login.
    const existing = await findCompanyByName(companyName);
    if (existing && existing.codPass && existing.portalEnabled !== false) {
      return res.status(409).json({ success: false, redirect: 'company-login', message: 'This company already has an account. Please log in to post.' });
    }

    const data = {
      ...body,
      client: companyName,
      companyName,
      status: 'admin-pending',            // awaits SuperAdmin review
      isPublicPost: true,
      posterEmail: lc(body.posterEmail),
      posterName: (body.posterName || '').toString().trim(),
      posterPhone: (body.posterPhone || '').toString().trim(),
      clientspoc: '',                     // assigned by admin on approval
      clientspoc_name: '',
    };
    const created = await adminF.CreatePosition(data);

    // Confirmation email to the employer who posted (fire-and-forget).
    try {
      if (data.posterEmail) {
        const { sendEmailFull } = require('../utils/email');
        await sendEmailFull({
          to: data.posterEmail,
          toName: data.posterName || 'there',
          subject: 'We received your position — RecruiterV',
          htmlContent: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6">
            <p>Hi ${data.posterName || 'there'},</p>
            <p>Thank you for posting <b>${data.position}</b> for <b>${companyName}</b> on RecruiterV.
            Your application has been <b>received</b> and is pending review by our team.</p>
            <p>Once it's <b>approved</b>, we'll email you the login details so you can manage this position and its candidates at recruiterv.com/company.</p>
            <p>Regards,<br/>Team RecruiterV</p>
          </div>`,
        });
      }
    } catch (mailErr) { console.error('employer confirmation email failed:', mailErr.message); }

    res.json({ success: true, message: 'Your job has been submitted for review.', pos_id: created.pos_id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin: review queue ──────────────────────────────────────────────────────
router.get('/admin/pending', managerAuth, async (req, res) => {
  try {
    const snap = await POS.where('status', 'in', ['admin-pending', 'waitlist']).get();
    const list = snap.docs.map(d => {
      const x = d.data();
      return {
        id: d.id, pos_id: x.pos_id, position: x.position, companyName: x.companyName || x.client,
        skill_category: x.skill_category, location: x.location, state: x.state,
        posterName: x.posterName || '', posterEmail: x.posterEmail || '', posterPhone: x.posterPhone || '',
        ctcStart: x.ctcStart, ctcEnd: x.ctcEnd, experience: x.experience,
        status: x.status, waitlisted: x.status === 'waitlist',
        client_questions: Array.isArray(x.client_questions) ? x.client_questions : [],
        job_desc: x.job_desc || '', datePosted: x.datePosted || null,
      };
    }).sort((a, b) => (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0));
    res.json({ success: true, positions: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/admin/clientspocs', managerAuth, async (req, res) => {
  try {
    const snap = await db.collection('admin_db').get();
    const spocs = snap.docs.map(d => d.data())
      .filter(d => lc(d.roleCategory || d.role) === 'clientspoc')
      .map(d => ({ email: lc(d.email), name: d.name || d.email })).filter(s => s.email)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json({ success: true, clientspocs: spocs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/approve/:id — create/find company, set its login + assigned SPOC,
// carry the poster's questions onto the company, and route the position to the SPOC.
router.post('/admin/approve/:id', managerAuth, async (req, res) => {
  try {
    const { clientspocEmail, clientspocName, companyEmail, password } = req.body || {};
    if (!clientspocEmail) return res.status(400).json({ success: false, message: 'Assign a ClientSPOC.' });
    if (!companyEmail || !password) return res.status(400).json({ success: false, message: 'Company login email and password are required.' });

    const posDoc = await POS.doc(req.params.id).get();
    if (!posDoc.exists || !['admin-pending', 'waitlist'].includes(posDoc.data().status)) {
      return res.status(404).json({ success: false, message: 'Job request not found.' });
    }
    const pos = posDoc.data();
    const companyName = pos.companyName || pos.client;

    // The login email must not collide with a different company.
    const emailClash = await companyF.findCompanyByEmail(companyEmail);
    let company = await findCompanyByName(companyName);
    if (emailClash && (!company || emailClash.id !== company.id)) {
      return res.status(409).json({ success: false, message: 'That login email is already used by another company.' });
    }

    // Create the company if it doesn't exist yet.
    if (!company) {
      const ref = COMPANY.doc();
      await ref.set({
        name: companyName, lower: lc(companyName),
        questions: Array.isArray(pos.client_questions) ? pos.client_questions : [],
        createdAt: new Date(), createdFromPublicPost: true,
      });
      company = { id: ref.id, name: companyName };
    } else if ((!company.questions || !company.questions.length) && Array.isArray(pos.client_questions) && pos.client_questions.length) {
      await companyF.updateCompany(company.id, { questions: pos.client_questions });
    }

    // Set the portal login + assign the SPOC.
    await companyF.setCompanyPortalAccess(company.id, {
      email: companyEmail, password,
      clientspocEmail, clientspocName: clientspocName || '', portalEnabled: true,
    });

    // Route the position to the SPOC's approval queue.
    await adminF.updatePositionById(req.params.id, {
      status: 'pending', postedByCompany: company.id,
      clientspoc: lc(clientspocEmail), clientspoc_name: clientspocName || '',
      approvedByAdmin: req.managerEmail, approvedByAdminAt: new Date(),
    });

    // Emails: company gets its login + SPOC details; the SPOC gets the assignment.
    try {
      const clientspocF = require('../model_fire/clientspocF');
      const { sendEmailFull } = require('../utils/email');
      let spocName = clientspocName || '', spocPhone = '';
      try { const s = await clientspocF.findClientSpocByEmail(clientspocEmail); if (s) { spocName = spocName || s.name || ''; spocPhone = s.phone || s.mobile || s.mob || s.contact || ''; } } catch (_) {}

      await sendEmailFull({
        to: lc(companyEmail), toName: companyName,
        subject: 'Your RecruiterV company account is approved',
        htmlContent: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6">
          <p>Hello ${companyName},</p>
          <p>Your position on RecruiterV has been <b>approved</b>. You can now log in to manage your positions and candidates.</p>
          <p><b>Login:</b> https://www.recruiterv.com/company<br/>
          <b>Email:</b> ${lc(companyEmail)}<br/>
          <b>Password:</b> ${password}</p>
          <p><b>Your dedicated Client SPOC</b><br/>
          Name: ${spocName || '—'}<br/>Email: ${lc(clientspocEmail)}<br/>Phone: ${spocPhone || '—'}</p>
          <p>Please change your password after your first login.</p>
          <p>Regards,<br/>Team RecruiterV</p>
        </div>`,
      });

      await sendEmailFull({
        to: lc(clientspocEmail), toName: spocName || 'Client SPOC',
        subject: `You've been assigned to ${companyName}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6">
          <p>Hi ${spocName || 'there'},</p>
          <p>You've been assigned as the <b>Client SPOC</b> for <b>${companyName}</b>. A position they posted (<b>${pos.position}</b>) is now in your approval queue — review and make it live from your dashboard.</p>
          <p><b>Company:</b> ${companyName}<br/>
          <b>Company login email:</b> ${lc(companyEmail)}<br/>
          <b>Posted by:</b> ${pos.posterName || '—'}${pos.posterPhone ? ' · ' + pos.posterPhone : ''}${pos.posterEmail ? ' · ' + pos.posterEmail : ''}</p>
          <p>Regards,<br/>Team RecruiterV</p>
        </div>`,
      });
    } catch (mailErr) { console.error('approve emails failed:', mailErr.message); }

    res.json({ success: true, message: 'Approved. Company created and routed to the ClientSPOC.', credentials: { email: lc(companyEmail), password }, companyId: company.id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/waitlist/:id — hold a request for later (stays in the review queue).
router.post('/admin/waitlist/:id', managerAuth, async (req, res) => {
  try {
    const reason = (req.body?.reason || '').toString().trim();
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || !['admin-pending', 'waitlist'].includes(doc.data().status)) {
      return res.status(404).json({ success: false, message: 'Job request not found.' });
    }
    await adminF.updatePositionById(req.params.id, { status: 'waitlist', waitlistReason: reason, waitlistedBy: req.managerEmail, waitlistedAt: new Date() });
    res.json({ success: true, message: 'Moved to waitlist.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/admin/reject/:id', managerAuth, async (req, res) => {
  try {
    const reason = (req.body?.reason || '').toString().trim();
    if (!reason) return res.status(400).json({ success: false, message: 'A reason is required.' });
    const doc = await POS.doc(req.params.id).get();
    if (!doc.exists || !['admin-pending', 'waitlist'].includes(doc.data().status)) return res.status(404).json({ success: false, message: 'Job request not found.' });
    await adminF.updatePositionById(req.params.id, { status: 'rejected', rejectReason: reason, rejectedBy: req.managerEmail, rejectedAt: new Date() });
    res.json({ success: true, message: 'Rejected.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
