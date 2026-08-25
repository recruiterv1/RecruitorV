/**
 * Self-registration for Company and Vendor accounts.
 *
 * Both land in `admin_db` with accountStatus 'pending'. A SuperAdmin approves
 * them from the Newly Registered screen; only then can they sign in. This
 * mirrors the consulting-firm flow, which already worked this way.
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('./firebase_ad');

const lc = (s) => String(s || '').toLowerCase().trim();

// Personal mailboxes are not accepted for a company or vendor account.
const FREE_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.in', 'hotmail.com', 'outlook.com', 'live.com',
  'rediffmail.com', 'ymail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com',
]);

const PORTALS = {
  company: { roleCategory: 'Company', label: 'Company', requireWorkEmail: true },
  vendor:  { roleCategory: 'Vendor',  label: 'Vendor',  requireWorkEmail: true },
};

router.post('/:portal/register', async (req, res) => {
  try {
    const portal = PORTALS[lc(req.params.portal)];
    if (!portal) return res.status(404).json({ success: false, message: 'Unknown portal.' });

    const name = String(req.body?.name || '').trim();
    const contactName = String(req.body?.contactName || '').trim();
    const email = lc(req.body?.email);
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');

    if (!name) return res.status(400).json({ success: false, message: `${portal.label} name is required.` });
    if (!contactName) return res.status(400).json({ success: false, message: 'Contact person name is required.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (portal.requireWorkEmail && FREE_DOMAINS.has(email.split('@')[1])) {
      return res.status(400).json({ success: false, message: 'Please use your work email address, not a personal one.' });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // One account per email, across every collection that can sign in.
    for (const col of ['admin_db', 'recruiter_db', 'coach_db', 'expert_db']) {
      const dup = await db.collection(col).where('email', '==', email).limit(1).get();
      if (!dup.empty) {
        return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
      }
    }

    const ref = await db.collection('admin_db').add({
      name, contactName, email, phone,
      mobile: phone,
      password: await bcrypt.hash(password, 10),
      roleCategory: portal.roleCategory,
      role: portal.roleCategory,
      // Pending until a SuperAdmin approves — login is refused before that.
      accountStatus: 'pending',
      selfRegistered: true,
      registrationDate: new Date(),
      createdAt: new Date(),
    });

    // Tell the applicant, and let the SuperAdmin know someone is waiting.
    try {
      const { sendEmailFull, renderEmail } = require('../utils/email');
      const _r = await renderEmail('registrationPending',
        { name: contactName || name, userType: portal.label },
        {
          subject: `We've received your ${portal.label} registration — under review`,
          htmlContent: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
            <p>Hi ${contactName || name},</p>
            <p>Thanks for registering <b>${name}</b> on RecruiterV. Your ${portal.label.toLowerCase()}
            account is with our team for review.</p>
            <p>We'll email you as soon as it's approved, and you'll be able to sign in and get started.</p>
            <p>Regards,<br/>Team RecruiterV</p></div>`,
        });
      await sendEmailFull({ to: email, subject: _r.subject, htmlContent: _r.htmlContent });
    } catch (e) { console.error('portal register email failed:', e.message); }

    res.json({
      success: true, id: ref.id,
      message: `Registration received. Your ${portal.label.toLowerCase()} account is pending approval — we'll email you once it's approved.`,
    });
  } catch (e) {
    console.error('portal register error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});


// ── SuperAdmin: approve the portal accounts ──────────────────────────────────
// Company and Vendor live in admin_db; a consulting firm has its own collection.
// Both are surfaced together so a SuperAdmin has one place to approve from.
const jwt = require('jsonwebtoken');
const MANAGER_ROLES = ['superadmin', 'super admin', 'admin'];

async function managerAuth(req, res, next) {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  let email;
  try { email = jwt.verify(token, process.env.SECKEY).email; }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
  try {
    const find = async (col) => {
      for (const v of [...new Set([email, lc(email)])]) {
        const s = await db.collection(col).where('email', '==', v).limit(1).get();
        if (!s.empty) return s.docs[0].data();
      }
      return null;
    };
    const u = (await find('admin_db')) || (await find('recruiter_db'));
    const role = lc(u?.roleCategory || u?.role);
    if (!u || !MANAGER_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    }
    req.managerEmail = email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

const toIso = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// GET /api/portal/pending?type=company|vendor|consultingfirm|all
router.get('/pending', managerAuth, async (req, res) => {
  try {
    const want = lc(req.query.type || 'all');
    const out = [];

    if (want === 'all' || want === 'company' || want === 'vendor') {
      const snap = await db.collection('admin_db').where('accountStatus', '==', 'pending').get();
      snap.docs.forEach(d => {
        const a = d.data();
        const role = lc(a.roleCategory || a.role || '').replace(/\s/g, '');
        if (role !== 'company' && role !== 'vendor') return;
        if (want !== 'all' && role !== want) return;
        out.push({
          id: d.id, type: role, source: 'admin_db',
          name: a.name || '', contactName: a.contactName || '',
          email: a.email || '', phone: a.phone || a.mobile || '',
          registeredAt: toIso(a.registrationDate || a.createdAt),
        });
      });
    }

    if (want === 'all' || want === 'consultingfirm') {
      const snap = await db.collection('consulting_firms').where('status', '==', 'pending').get();
      snap.docs.forEach(d => {
        const f = d.data();
        out.push({
          id: d.id, type: 'consultingfirm', source: 'consulting_firms',
          name: f.name || '', contactName: f.contactName || '',
          email: f.email || '', phone: f.phone || '',
          registeredAt: toIso(f.createdAt),
        });
      });
    }

    out.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
    res.json({ success: true, pending: out });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/portal/pending/:id/decision  { source, approve, reason }
router.post('/pending/:id/decision', managerAuth, async (req, res) => {
  try {
    const source = req.body?.source === 'consulting_firms' ? 'consulting_firms' : 'admin_db';
    const approve = req.body?.approve === true;
    const ref = db.collection(source).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Account not found.' });
    const a = doc.data();

    // consulting_firms tracks `status`; admin_db tracks `accountStatus`.
    const field = source === 'consulting_firms' ? 'status' : 'accountStatus';
    await ref.set({
      [field]: approve ? 'approved' : 'rejected',
      approvalDecidedBy: req.managerEmail,
      approvalDecidedAt: new Date(),
      approvalReason: approve ? '' : String(req.body?.reason || '').trim(),
    }, { merge: true });

    // Tell them either way — an approval is useless if they never learn of it.
    try {
      const { sendEmailFull } = require('../utils/email');
      const who = a.contactName || a.name || 'there';
      const loginUrl = source === 'consulting_firms'
        ? 'https://www.recruiterv.com/consulting'
        : (lc(a.roleCategory || a.role) === 'vendor'
            ? 'https://www.recruiterv.com/vendor'
            : 'https://www.recruiterv.com/company');
      await sendEmailFull({
        to: a.email,
        subject: approve ? 'Your RecruiterV account is approved' : 'Update on your RecruiterV registration',
        htmlContent: approve
          ? `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
               <p>Hi ${who},</p>
               <p>Good news — <b>${a.name || ''}</b> has been approved on RecruiterV.</p>
               <p>You can sign in here: <a href="${loginUrl}">${loginUrl}</a></p>
               <p>Regards,<br/>Team RecruiterV</p></div>`
          : `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
               <p>Hi ${who},</p>
               <p>Thanks for your interest in RecruiterV. We are not able to approve
               <b>${a.name || 'your account'}</b> at this time.</p>
               ${req.body?.reason ? `<p><b>Note from our team:</b> ${String(req.body.reason).trim()}</p>` : ''}
               <p>You are welcome to get in touch if you would like to discuss it.</p>
               <p>Regards,<br/>Team RecruiterV</p></div>`,
      });
    } catch (e) { console.error('portal decision email failed:', e.message); }

    res.json({ success: true, message: approve ? 'Account approved — they can sign in now.' : 'Account rejected.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
