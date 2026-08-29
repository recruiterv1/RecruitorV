const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { db } = require('./firebase_ad');
const adminVerify = require('../model_fire/adminCF');
const recruiterModel = require('../model_fire/recruiterF');
const ad_Pos = require('../model_fire/adminF');

// Auth middleware: validates JWT and confirms user is in admin_db
const vendorAuth = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) {
    console.log('[vendorAuth] No token cookie found');
    return res.status(401).json({ success: false, message: 'Unauthorized - no session cookie' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    const email = decoded.email || '';
    console.log(`[vendorAuth] Token email: ${email}`);

    // Try exact email first, then lowercase
    let result = await adminVerify.getAdminByEmail(email);
    if (!result.success) {
      result = await adminVerify.getAdminByEmail(email.toLowerCase());
    }

    if (!result.success) {
      console.log(`[vendorAuth] Email not found in admin_db: ${email}`);
      return res.status(403).json({ success: false, message: 'Not found in admin_db' });
    }

    const admin = result.admin;
    console.log(`[vendorAuth] Found user: roleCategory="${admin.roleCategory}" role="${admin.role}" recruiterQuantity=${admin.recruiterQuantity}`);

    // Accept any admin_db user on vendor routes — vendor dashboard is already frontend-gated
    req.vendor = { ...admin, email: (admin.email || email).toLowerCase() };
    next();
  } catch (err) {
    console.error('[vendorAuth] Error:', err.message);
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// GET /vendor/me — vendor profile + usage stats
router.get('/me', vendorAuth, async (req, res) => {
  try {
    console.log(`[vendor/me] vendor: ${JSON.stringify({ email: req.vendor?.email, qty: req.vendor?.recruiterQuantity, rc: req.vendor?.roleCategory })}`);
    const vendor = req.vendor;
    const snap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', vendor.email.toLowerCase())
      .get();
    const used = snap.size;
    return res.json({
      success: true,
      data: {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        recruiterQuantity: vendor.recruiterQuantity || 0,
        recruitersUsed: used,
        recruitersRemaining: Math.max(0, (vendor.recruiterQuantity || 0) - used),
      }
    });
  } catch (err) {
    console.error('vendor/me error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/recruiters — list all recruiters created by this vendor
router.get('/recruiters', vendorAuth, async (req, res) => {
  try {
    const snap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', req.vendor.email.toLowerCase())
      .get();
    // Skip the vendor's own self-assign profile — it isn't a team member.
    const recruiters = snap.docs.filter(d => !d.data().isVendorSelf).map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        email: d.email,
        mobile: d.mobile || d.phone || '',
        roleCategory: d.roleCategory || 'Recruiter',
        planType: d.planType,
        accountStatus: d.accountStatus || 'approved',
        createdAt: d.createdAt || d.registrationDate || null,
        lastActive: d.lastActive || null,
      };
    });
    return res.json({ success: true, data: recruiters });
  } catch (err) {
    console.error('vendor/recruiters error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /vendor/recruiter-access — grant or decline a recruiter's dashboard access.
// Body: { recruiterId, action: 'block' | 'unblock' }
// A vendor may only change recruiters that belong to them (vendorEmail match).
router.post('/recruiter-access', vendorAuth, async (req, res) => {
  try {
    const { recruiterId, action } = req.body || {};
    if (!recruiterId || !['block', 'unblock'].includes(action)) {
      return res.status(400).json({ success: false, message: 'recruiterId and action (block|unblock) are required' });
    }
    const docRef = db.collection('recruiter_db').doc(recruiterId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    // Ownership check — never let a vendor touch someone else's recruiter.
    const rec = snap.data();
    if ((rec.vendorEmail || '').toLowerCase() !== req.vendor.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This recruiter does not belong to your account' });
    }

    const newStatus = action === 'block' ? 'blocked' : 'approved';
    await docRef.update({
      accountStatus: newStatus,
      accountStatusUpdatedAt: new Date(),
      ...(action === 'block'
        ? { accessBlockedAt: new Date(), accessBlockedBy: req.vendor.email }
        : { accessBlockedAt: null, accessBlockedBy: null }),
    });

    return res.json({
      success: true,
      accountStatus: newStatus,
      message: action === 'block' ? 'Access declined for this recruiter' : 'Access granted',
    });
  } catch (err) {
    console.error('vendor/recruiter-access error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /vendor/remove-recruiter — detach a recruiter from this vendor's group.
// Body: { recruiterId }
// The recruiter keeps their account and carries on as an independent recruiter:
// only the vendor link is cleared. This also frees a slot in the vendor's quota
// (which is counted by vendorEmail).
router.post('/remove-recruiter', vendorAuth, async (req, res) => {
  try {
    const { recruiterId } = req.body || {};
    if (!recruiterId) return res.status(400).json({ success: false, message: 'recruiterId is required' });

    const docRef = db.collection('recruiter_db').doc(recruiterId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const rec = snap.data();
    if ((rec.vendorEmail || '').toLowerCase() !== req.vendor.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This recruiter does not belong to your account' });
    }

    // Access status is deliberately NOT touched here. If the vendor had declined
    // this recruiter, that decline persists after they leave the group — only an
    // admin/superadmin can grant access back from the Users dashboard.
    const wasBlocked = (rec.accountStatus || '') === 'blocked';

    await docRef.update({
      vendorEmail: null,
      vendorName: null,
      removedFromVendorAt: new Date(),
      removedFromVendorBy: req.vendor.email,
    });

    return res.json({
      success: true,
      stillBlocked: wasBlocked,
      message: wasBlocked
        ? 'Recruiter removed from your group. Their access remains declined — only an admin can grant it back.'
        : 'Recruiter removed from your group. They continue as an independent recruiter.',
    });
  } catch (err) {
    console.error('vendor/remove-recruiter error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/candidates — all candidates submitted by this vendor's recruiters,
// in the same flat shape as the admin candidate panel (Ad_Candi table).
router.get('/candidates', vendorAuth, async (req, res) => {
  try {
    const recruiterSnap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', req.vendor.email.toLowerCase())
      .get();
    const emails = [...new Set(
      recruiterSnap.docs.map(d => (d.data().email || '').toLowerCase().trim()).filter(Boolean)
    )];
    if (!emails.length) return res.json([]);

    const byId = {};
    for (let i = 0; i < emails.length; i += 10) {
      const batch = emails.slice(i, i + 10);
      const snap = await db.collection('candidate_db').where('recEmail', 'in', batch).get();
      snap.docs.forEach(doc => { byId[doc.id] = { id: doc.id, ...doc.data() }; });
    }
    // Strip heavy fields (full resume text / match tokens) to keep the response small.
    const slim = Object.values(byId).map(({ resumeText, matchTokens, skillsTextTokens, ...rest }) => rest);
    return res.json(slim);
  } catch (err) {
    console.error('vendor/candidates error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /vendor/register-recruiter — create a new paid recruiter under this vendor
router.post('/register-recruiter', vendorAuth, async (req, res) => {
  try {
    const vendor = req.vendor;
    const { name, email, password, mobile, experienceCategory, specialization, skillCategory } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check quota
    const snap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', vendor.email.toLowerCase())
      .get();
    const used = snap.size;
    const allowed = vendor.recruiterQuantity || 0;
    if (used >= allowed) {
      return res.status(403).json({
        success: false,
        message: `Recruiter limit reached (${used}/${allowed}). Contact administrator to increase your quota.`,
        errorCode: 'RECRUITER_LIMIT_REACHED'
      });
    }

    // Check duplicate email
    const existing = await recruiterModel.findRecruiterByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'A recruiter with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const newRecruiter = await recruiterModel.createRecruiter({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashPass,
      mobile: mobile || '',
      experienceCategory: experienceCategory || '',
      skillCategory: Array.isArray(skillCategory) ? skillCategory : [],
      specialization: Array.isArray(skillCategory) && skillCategory.length ? skillCategory.join(', ') : (specialization || ''),
      roleCategory: 'Recruiter',
      role: 'recruiter',
      planType: 1, // paid
      userType: 'paid',
      isVerified: true,
      accountStatus: 'approved',
      vendorEmail: vendor.email.toLowerCase(),
      vendorId: vendor.id,
      vendorName: vendor.name || '',
      createdAt: new Date(),
    });

    // Send welcome email
    try {
      const { sendEmailFull, renderEmail } = require('../utils/email');
      const _fallbackHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#f97316 100%);padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">&#x1F4BC;</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">Welcome to RecruiterV!</h1>
          <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your Recruiter account has been created.</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="font-size:15px;color:#374151;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:15px;color:#374151;line-height:1.6;">
            Your recruiter account has been created by <strong>${vendor.name || vendor.email}</strong>. Your account is activated with a <strong>Paid plan</strong>.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:24px 0;">
            <p style="margin:0 0 6px;font-size:14px;color:#166534;font-weight:600;">Login Credentials</p>
            <p style="margin:0;font-size:13px;color:#374151;">Email: <strong>${email.toLowerCase().trim()}</strong></p>
            <p style="margin:4px 0 0;font-size:13px;color:#374151;">Password: <strong>${password}</strong></p>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="https://www.recruiterv.com/log_rec" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#f97316);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">Login Now</a>
          </div>
          <p style="font-size:13px;color:#9ca3af;margin-top:32px;text-align:center;">If you have questions, contact support at support@recruiterv.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
      const _v = await renderEmail('vendorWelcome', {
        name, email: email.toLowerCase().trim(), password,
        loginUrl: 'https://www.recruiterv.com/log_rec',
        vendorName: req.vendor?.name || 'your vendor',
      }, { subject: 'Your RecruiterV Recruiter Account is Ready', htmlContent: _fallbackHtml });
      await sendEmailFull({ to: email.toLowerCase().trim(), subject: _v.subject, htmlContent: _v.htmlContent });

      try {
        const { notify } = require('../utils/internalMessage');
        await notify('vendorRegisteredRecruiter', {
          fromEmail: req.vendor?.email || 'support@recruiterv.com',
          toEmail: email.toLowerCase().trim(),
          vars: {
            name: name || 'there', firstName: String(name || '').split(' ')[0],
            email: email.toLowerCase().trim(), senderName: req.vendor?.name || '',
          },
          senderRole: 'vendor', recipientRole: 'recruiter',
        });
      } catch (_) { /* never block registration */ }
    } catch (emailErr) { console.error('Vendor register-recruiter email failed:', emailErr.message); }

    return res.json({ success: true, message: 'Recruiter registered successfully', data: { id: newRecruiter.id, name, email: email.toLowerCase().trim() } });
  } catch (err) {
    console.error('vendor/register-recruiter error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/reports/positions — positions worked by vendor's recruiters (via access requests + candidate submissions)
router.get('/reports/positions', vendorAuth, async (req, res) => {
  try {
    // Step 1: get vendor's recruiters (by email, case-normalised)
    const recruiterSnap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', req.vendor.email.toLowerCase())
      .get();

    if (recruiterSnap.empty) return res.json({ success: true, data: [], count: 0 });

    const recruiterEmails = [
      ...new Set(
        recruiterSnap.docs
          .map(d => (d.data().email || '').toLowerCase().trim())
          .filter(Boolean)
      )
    ];

    if (!recruiterEmails.length) return res.json({ success: true, data: [], count: 0 });

    // Step 2: get distinct pos_ids from position_access_requests for these recruiters
    const posIdsFromAccess = new Set();
    for (let i = 0; i < recruiterEmails.length; i += 10) {
      const batch = recruiterEmails.slice(i, i + 10);
      const snap = await db.collection('position_access_requests')
        .where('recruiterEmail', 'in', batch)
        .get();
      snap.docs.forEach(doc => {
        const posId = doc.data().positionId;
        if (posId) posIdsFromAccess.add(posId);
      });
    }

    // Step 3: also collect pos_ids from candidate_db (handles recruiters added via 'associate' who may not have access records)
    const posIdsFromCandidates = new Set();
    for (let i = 0; i < recruiterEmails.length; i += 10) {
      const batch = recruiterEmails.slice(i, i + 10);
      const snap = await db.collection('candidate_db')
        .where('recEmail', 'in', batch)
        .select('pos_id')
        .limit(1000)
        .get();
      snap.docs.forEach(doc => {
        const posId = doc.data().pos_id;
        if (posId) posIdsFromCandidates.add(posId);
      });
    }

    // Union of both sets
    const allPosIds = new Set([...posIdsFromAccess, ...posIdsFromCandidates]);

    if (!allPosIds.size) return res.json({ success: true, data: [], count: 0 });

    // Step 4: fetch position details from admin_AddPos for the collected pos_ids
    const positionsMap = new Map();
    const posIdArr = Array.from(allPosIds);
    for (let i = 0; i < posIdArr.length; i += 10) {
      const batch = posIdArr.slice(i, i + 10);
      const snap = await db.collection('admin_AddPos').where('pos_id', 'in', batch).get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!positionsMap.has(d.pos_id)) {
          positionsMap.set(d.pos_id, {
            pos_id: d.pos_id,
            pos_name: d.position || 'Unnamed',
            client: d.client || 'N/A',
            clientspoc: d.clientspoc || 'N/A',
            status: d.status || 'active',
          });
        }
      });
    }

    return res.json({ success: true, data: Array.from(positionsMap.values()), count: positionsMap.size });
  } catch (err) {
    console.error('vendor/reports/positions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/reports/candidates — candidates submitted by vendor's recruiters, grouped by recruiter
router.get('/reports/candidates', vendorAuth, async (req, res) => {
  try {
    const { pos_id, pos_ids } = req.query;

    const recruiterSnap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', req.vendor.email.toLowerCase())
      .get();

    // Build a lowercase set for fast membership check
    const recruiterEmailSet = new Set(
      recruiterSnap.docs
        .map(d => (d.data().email || '').toLowerCase().trim())
        .filter(Boolean)
    );

    if (!recruiterEmailSet.size) return res.json({ success: true, data: [], totalCandidates: 0 });

    const posIdList = pos_ids
      ? pos_ids.split(',').map(s => s.trim()).filter(Boolean)
      : pos_id ? [pos_id] : [];

    let allCandidates = [];

    if (posIdList.length) {
      // Firestore only supports one `in` per query, so query by pos_id batches
      // and filter by recruiter email in memory.
      for (let j = 0; j < posIdList.length; j += 10) {
        const posBatch = posIdList.slice(j, j + 10);
        const snap = await db.collection('candidate_db')
          .where('pos_id', 'in', posBatch)
          .limit(1000)
          .get();
        snap.docs.forEach(doc => {
          const c = { id: doc.id, ...doc.data() };
          if (recruiterEmailSet.has((c.recEmail || '').toLowerCase().trim())) {
            allCandidates.push(c);
          }
        });
      }
    } else {
      // No position filter — query by recruiter email batches
      const recruiterEmails = Array.from(recruiterEmailSet);
      for (let i = 0; i < recruiterEmails.length; i += 10) {
        const emailBatch = recruiterEmails.slice(i, i + 10);
        const snap = await db.collection('candidate_db')
          .where('recEmail', 'in', emailBatch)
          .limit(500)
          .get();
        allCandidates = allCandidates.concat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }

    // Sort by submission date descending (in memory to avoid composite index requirement)
    allCandidates.sort((a, b) => {
      const aTs = a.datePosted?._seconds ?? 0;
      const bTs = b.datePosted?._seconds ?? 0;
      return bTs - aTs;
    });

    // Group by recruiter
    const groups = {};
    allCandidates.forEach(c => {
      const key = c.recName || c.recEmail || 'Unknown Recruiter';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });

    const mapCandidate = (c) => ({
      id: c.id,
      name: c.candidate,
      email: c.emails,
      phone: c.mob,
      currentCTC: c.current_ctc,
      expectedCTC: c.exp_ctc,
      experience: `${c.rel_exp || 'N/A'} (Total: ${c.total_exp || 'N/A'})`,
      status: c.statusa || 'Submitted',
      submittedDate: c.datePosted?._seconds ? new Date(c.datePosted._seconds * 1000).toLocaleDateString() : 'N/A',
      cvUrl: c.cv_data,
      pos_id: c.pos_id,
      pos_name: c.pos_name,
      client: c.client,
      hr_name: c.hr_name,
      skills: Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : (c.tech_skill || Array.isArray(c.nontech_skill) ? (c.nontech_skill || []).join(', ') : (c.nontech_skill || 'N/A')),
      notice_period: c.notice_period,
      last_day: c.last_day,
      curr_loc: c.curr_loc,
      curr_state: c.curr_state,
      pref_loc: c.pref_loc,
      pref_state: c.pref_state,
      self_rate: c.self_rate,
      offer_hand: c.offer_hand,
      offer_amt: c.offer_amt,
      curr_emp: c.curr_emp,
      rh_id: c.rh_id,
      highest_education: c.highest_education,
      skill_type: c.skill_type,
      tech_category: c.tech_category,
      tech_subcategory: c.tech_subcategory,
      tech_skill: c.tech_skill,
      tech_exp: c.tech_exp,
      nontech_category: c.nontech_category,
      nontech_subcategory: c.nontech_subcategory,
      nontech_skill: c.nontech_skill,
      nontech_exp: c.nontech_exp,
      dob: c.dob,
      jr_number: c.jr_number,
      pan_number: c.pan_number,
    });

    const data = Object.entries(groups).map(([recruiterName, candidates]) => ({
      recruiterName,
      candidateCount: candidates.length,
      candidates: candidates.map(mapCandidate)
    }));

    return res.json({ success: true, data, totalCandidates: allCandidates.length });
  } catch (err) {
    console.error('vendor/reports/candidates error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/skill-categories — parent category names for recruiter registration
router.get('/skill-categories', vendorAuth, async (req, res) => {
  try {
    const snap = await db.collection('skill_categories').get();
    const parents = snap.docs
      .map(d => d.data().parent)
      .filter(Boolean)
      .sort();
    return res.json({ success: true, data: [...new Set(parents)] });
  } catch (err) {
    console.error('vendor/skill-categories error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/open-positions — all visible positions for vendor to browse
router.get('/open-positions', vendorAuth, async (req, res) => {
  try {
    console.log(`[vendor/open-positions] Request from: ${req.vendor?.email}`);
    const all = await ad_Pos.getAllPosition();
    console.log(`[vendor/open-positions] getAllPosition returned ${all.length} positions`);

    // Collect unique clientspoc emails to batch-fetch their details
    const spocEmails = [...new Set(all.map(p => (p.clientspoc || '').toLowerCase()).filter(Boolean))];
    const spocMap = {};
    if (spocEmails.length) {
      for (let i = 0; i < spocEmails.length; i += 10) {
        const batch = spocEmails.slice(i, i + 10);
        const snap = await db.collection('admin_db').where('email', 'in', batch).get();
        snap.docs.forEach(doc => {
          const d = doc.data();
          const email = (d.email || '').toLowerCase();
          spocMap[email] = {
            name: d.name || '',
            email: d.email || '',
            phone: d.mobile || d.phone || d.contact || '',
          };
        });
      }
    }

    // What this vendor's side is allowed to see:
    //  - their own positions, always (including the private, team-only ones);
    //  - every other RecruiterV position only when the SuperAdmin has ticked
    //    "may work RecruiterV positions" on their vendor card.
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const allowPlatform = req.vendor.allowPlatformPositions !== false;   // default: allowed
    const visible = all.filter(p => {
      const owner = (p.postedByVendor || '').toLowerCase();
      if (owner === vendorEmail) return true;
      if (p.vendorPrivate === true) return false;     // another vendor's private role
      return allowPlatform;
    });

    const positions = visible.map(pos => {
      const spocEmail = (pos.clientspoc || '').toLowerCase();
      const spoc = spocMap[spocEmail] || null;
      return {
        id: pos.id,
        pos_id: pos.pos_id,
        position: pos.position,
        client: pos.client || 'N/A',
        hr_name: pos.hr_name || 'N/A',
        clientspoc: pos.clientspoc || '',
        clientspocName: spoc?.name || '',
        clientspocPhone: spoc?.phone || '',
        clientspocEmail: spoc?.email || pos.clientspoc || '',
        experience: pos.experience || '',
        ctcStart: pos.ctcStart || '',
        ctcEnd: pos.ctcEnd || '',
        state: pos.state || [],
        location: pos.location || [],
        job_desc: pos.job_desc || '',
        key_res: pos.key_res || '',
        m_have: pos.m_have || '',
        g_have: pos.g_have || '',
        pos_cat: pos.pos_cat || '',
        skill_category: pos.skill_category || '',
        maxCandidate: pos.maxCandidate || 10,
        status: pos.status || 'active',
        datePosted: pos.datePosted || null,
        postedByVendor: pos.postedByVendor || '',
        vendorPrivate: pos.vendorPrivate === true,
      };
    });
    return res.json({ success: true, data: positions, count: positions.length, allowPlatform });
  } catch (err) {
    console.error('vendor/open-positions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /vendor/assign-recruiter — assign one of vendor's recruiters to a position

// The vendor must hold the position on their own account before they can put a
// recruiter on it or write notes for the team. Self-assignment is the gate.
async function vendorSelfAssigned(vendorEmail, posId) {
  const email = (vendorEmail || '').toLowerCase();
  try {
    const positionAccess = require('../model_fire/positionAccessF');
    const reqs = await positionAccess.getRecruiterAssignments(email);
    return (reqs || []).some(r => String(r.positionId) === String(posId));
  } catch (_) { return false; }
}

router.post('/assign-recruiter', vendorAuth, async (req, res) => {
  try {
    const { pos_id, recruiterId } = req.body;
    if (!pos_id || !recruiterId) {
      return res.status(400).json({ success: false, message: 'pos_id and recruiterId are required' });
    }

    // Verify recruiter belongs to this vendor
    const recDoc = await db.collection('recruiter_db').doc(recruiterId).get();
    if (!recDoc.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });
    const recData = recDoc.data();
    if ((recData.vendorEmail || '').toLowerCase() !== req.vendor.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This recruiter is not under your vendor account' });
    }

    // Verify position exists
    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', pos_id).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found' });

    // A vendor has to take the position onto their own account first.
    if (!await vendorSelfAssigned(req.vendor.email, pos_id)) {
      return res.status(403).json({
        success: false, needsSelfAssign: true,
        message: 'Assign this position to yourself first — then you can put your recruiters on it.',
      });
    }

    // Use positionAccess model to create the assign request
    const positionAccess = require('../model_fire/positionAccessF');
    const assignRequest = await positionAccess.createAssignRequest(
      recruiterId,
      (recData.email || '').toLowerCase(),
      pos_id,
      `Assigned by vendor ${req.vendor.name || req.vendor.email}`
    );

    return res.json({
      success: true,
      message: assignRequest.status === 'approved'
        ? `${recData.name} has been assigned to this position`
        : `Assignment request sent for ${recData.name} — awaiting ClientSPOC approval`,
      status: assignRequest.status,
    });
  } catch (err) {
    if (err.message?.includes('already have')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('vendor/assign-recruiter error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /vendor/recruiter-detail?recruiterId=xxx — positions & candidates for one recruiter
router.get('/recruiter-detail', vendorAuth, async (req, res) => {
  try {
    const { recruiterId } = req.query;
    if (!recruiterId) return res.status(400).json({ success: false, message: 'recruiterId required' });

    const recDoc = await db.collection('recruiter_db').doc(recruiterId).get();
    if (!recDoc.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });
    const recData = recDoc.data();

    // Verify recruiter belongs to this vendor
    if ((recData.vendorEmail || '').toLowerCase() !== req.vendor.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This recruiter is not under your vendor account' });
    }

    const recruiterEmail = (recData.email || '').toLowerCase();

    // Get all candidates submitted by this recruiter
    // Note: no .orderBy() here to avoid requiring a composite index;
    // we sort in memory below instead.
    const snap = await db.collection('candidate_db')
      .where('recEmail', '==', recruiterEmail)
      .limit(1000)
      .get();
    const allCandidates = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTs = a.datePosted?._seconds ?? 0;
        const bTs = b.datePosted?._seconds ?? 0;
        return bTs - aTs;
      });

    // Group by position
    const posMap = {};
    allCandidates.forEach(c => {
      const posId = c.pos_id || 'Unknown';
      if (!posMap[posId]) {
        posMap[posId] = {
          pos_id: posId,
          pos_name: c.pos_name || c.position || 'N/A',
          client: c.client || 'N/A',
          candidates: [],
        };
      }
      posMap[posId].candidates.push({
        id: c.id,
        name: c.candidate || 'N/A',
        email: c.emails || 'N/A',
        phone: c.mob || 'N/A',
        status: c.statusa || 'Submitted',
        currentCTC: c.current_ctc || 'N/A',
        expectedCTC: c.exp_ctc || 'N/A',
        experience: `${c.rel_exp || 'N/A'} (Total: ${c.total_exp || 'N/A'})`,
        submittedDate: c.datePosted?._seconds ? new Date(c.datePosted._seconds * 1000).toLocaleDateString('en-IN') : 'N/A',
        skills: Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : (c.tech_skill || 'N/A'),
        cvUrl: c.cv_data || null,
        curr_loc: c.curr_loc || 'N/A',
        notice_period: c.notice_period || 'N/A',
      });
    });

    const positions = Object.values(posMap).sort((a, b) => b.candidates.length - a.candidates.length);

    // For each position, has this recruiter actually listened to the notes this
    // Briefing state per position: has the vendor briefed it, and has this
    // recruiter actually listened? Drives the light in the recruiter modal.
    try {
      const vendorEmail = (req.vendor.email || '').toLowerCase();
      const listenerEmail = (recData.email || '').toLowerCase();
      await Promise.all(positions.map(async (p) => {
        const pid = String(p.pos_id);
        const [briefDoc, listenDoc] = await Promise.all([
          db.collection('position_coach_briefing').doc(`${pid}__${vendorEmail}`).get(),
          db.collection('briefing_listens').doc(`${pid}__${vendorEmail}__${listenerEmail}`).get(),
        ]);
        const b = briefDoc.exists ? briefDoc.data() : null;
        const published = !!b && (b.status || 'draft') === 'ready';
        p.briefingState = !b ? 'pending' : (published ? 'ready' : 'draft');
        p.hasNotes = published;
        p.notesListened = published && listenDoc.exists;
        p.notesListenedAt = listenDoc.exists
          ? (listenDoc.data().lastListenedAt?.toDate?.()?.toISOString() || null) : null;
        p.briefingCoverage = Array.isArray(b?.coverage) ? b.coverage : [];
        p.briefingWords = b?.wordCount || 0;
      }));
    } catch (e) { console.error('briefing enrich failed:', e.message); }

    return res.json({
      success: true,
      recruiter: {
        id: recruiterId,
        name: recData.name,
        email: recData.email,
        mobile: recData.mobile || recData.phone || '',
        specialization: recData.specialization || '',
        skillCategory: recData.skillCategory || [],
        experienceCategory: recData.experienceCategory || '',
        planType: recData.planType,
        accountStatus: recData.accountStatus || 'approved',
        createdAt: recData.createdAt || null,
        lastActive: recData.lastActive || null,
      },
      positions,
      totalCandidates: allCandidates.length,
    });
  } catch (err) {
    console.error('vendor/recruiter-detail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Position briefings moved to their own router (/api/briefing) and a single
// free-text briefing per position; see Backend/router/briefing.js.

// POST /vendor/assign-me — the vendor takes a position onto their own account so
// they can submit candidates from their own login.
//
// Every downstream flow (position access, candidate submission, attribution) is
// keyed on a recruiter_db record, so we lazily create a "self" recruiter profile
// for the vendor the first time they do this. It is flagged isVendorSelf so it can
// be told apart from the recruiters they register, and excluded from team lists.
router.post('/assign-me', vendorAuth, async (req, res) => {
  try {
    const pos_id = String(req.body?.pos_id || '');
    if (!pos_id) return res.status(400).json({ success: false, message: 'pos_id is required' });

    const email = (req.vendor.email || '').toLowerCase();
    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', pos_id).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found' });

    // Find or create the vendor's own recruiter profile.
    let recId, recSnap = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
    if (!recSnap.empty) {
      recId = recSnap.docs[0].id;
    } else {
      const ref = await db.collection('recruiter_db').add({
        name: req.vendor.name || email.split('@')[0],
        email,
        phone: req.vendor.phone || req.vendor.mobile || '',
        roleCategory: 'Recruiter',
        isVendorSelf: true,               // this IS the vendor, not one of their hires
        vendorEmail: email,
        vendorName: req.vendor.name || '',
        isVerified: true,
        accountStatus: 'approved',
        agreementSigned: true,
        planType: 1,
        skillCategory: req.vendor.skillCategory || [],
        createdAt: new Date(),
        createdFromVendorSelfAssign: true,
      });
      recId = ref.id;
    }

    const positionAccess = require('../model_fire/positionAccessF');
    const r = await positionAccess.createAssignRequest(
      recId, email, pos_id, `Self-assigned by vendor ${req.vendor.name || email}`);

    return res.json({
      success: true,
      status: r.status,
      message: r.status === 'approved'
        ? 'Position assigned to you — you can now submit candidates.'
        : 'Assignment request sent — awaiting ClientSPOC approval.',
    });
  } catch (e) {
    const msg = e.message || 'Failed to assign';
    if (/already have/i.test(msg)) return res.status(400).json({ success: false, message: msg });
    console.error('vendor/assign-me error:', msg);
    return res.status(500).json({ success: false, message: msg });
  }
});

// GET /vendor/position-access/:posId — does the vendor hold this position on
// their own account? Drives Assign Me vs Submit Candidate on dash_view.
router.get('/position-access/:posId', vendorAuth, async (req, res) => {
  try {
    const hasAccess = await vendorSelfAssigned(req.vendor.email, req.params.posId);
    res.json({ success: true, hasAccess, status: hasAccess ? 'approved' : null });
  } catch (e) { res.status(500).json({ success: false, hasAccess: false, message: e.message }); }
});

// GET /vendor/position-access/:posId — does the vendor hold this position on
// their own account? Drives Assign Me vs Submit Candidate on dash_view.
router.get('/position-access/:posId', vendorAuth, async (req, res) => {
  try {
    const hasAccess = await vendorSelfAssigned(req.vendor.email, req.params.posId);
    res.json({ success: true, hasAccess, status: hasAccess ? 'approved' : null });
  } catch (e) { res.status(500).json({ success: false, hasAccess: false, message: e.message }); }
});

// ─── Positions: assigned to the vendor / their team, and vendor-added ────────

// GET /vendor/assigned-positions — every position the vendor or one of their
// recruiters is approved to work on, tagged with who holds it.
router.get('/assigned-positions', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const teamSnap = await db.collection('recruiter_db')
      .where('vendorEmail', '==', vendorEmail).get();

    // email -> display name ("Self" for the vendor's own profile)
    const holders = {};
    teamSnap.docs.forEach(d => {
      const r = d.data();
      const e = (r.email || '').toLowerCase();
      if (e) holders[e] = r.isVendorSelf ? 'Self' : (r.name || e.split('@')[0]);
    });
    holders[vendorEmail] = holders[vendorEmail] || 'Self';

    const positionAccess = require('../model_fire/positionAccessF');
    const byPos = {};
    await Promise.all(Object.keys(holders).map(async (email) => {
      let list = [];
      try { list = await positionAccess.getRecruiterAssignments(email) || []; } catch (_) {}
      list.forEach(a => {
        const pid = String(a.positionId || '');
        if (!pid) return;
        (byPos[pid] = byPos[pid] || new Set()).add(holders[email]);
      });
    }));

    const posIds = Object.keys(byPos);
    if (!posIds.length) return res.json({ success: true, positions: [] });

    const positions = [];
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
      const snap = await db.collection('admin_AddPos').where('pos_id', 'in', batch).get();
      snap.docs.forEach(d => {
        const p = d.data();
        positions.push({
          id: d.id, pos_id: p.pos_id, position: p.position, client: p.client,
          location: p.location || [], state: p.state || [],
          skill_category: p.skill_category || '', pos_cat: p.pos_cat || '',
          ctcStart: p.ctcStart || '', ctcEnd: p.ctcEnd || '',
          commison: p.commison || '', commission_type: p.commission_type || '',
          experience: p.experience || '', status: p.status || 'active',
          datePosted: p.datePosted || null,
          assignedTo: [...byPos[String(p.pos_id)]].sort(),
          selfAssigned: byPos[String(p.pos_id)].has('Self'),
        });
      });
    }
    positions.sort((a, b) => (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0));
    res.json({ success: true, positions });
  } catch (e) {
    console.error('vendor/assigned-positions error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /vendor/my-positions — positions this vendor posted.
router.get('/my-positions', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const snap = await db.collection('admin_AddPos').where('postedByVendor', '==', vendorEmail).get();
    const positions = snap.docs.map(d => {
      const p = d.data();
      // Editable only until the ClientSPOC makes it live.
      const status = (p.status || '').toLowerCase();
      return { id: d.id, ...p, canEdit: status === 'pending' || status === 'admin-pending' };
    }).sort((a, b) => (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0));
    res.json({ success: true, positions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /vendor/positions — vendor posts a position; it waits for ClientSPOC approval.
router.post('/positions', vendorAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!(body.position || '').toString().trim()) return res.status(400).json({ success: false, message: 'Position title is required.' });
    if (!(body.client || '').toString().trim()) return res.status(400).json({ success: false, message: 'Client is required.' });

    // Two kinds of vendor position:
    //  - publishToPlatform: goes to one of the vendor's ClientSPOCs to review and
    //    make live on RecruiterV.
    //  - private (default): never leaves the vendor — only their own team sees it
    //    and works on it, so no ClientSPOC is involved.
    const publishToPlatform = body.publishToPlatform === true || body.publishToPlatform === 'true';
    const mySpocs = Array.isArray(req.vendor.clientspocs) ? req.vendor.clientspocs : [];
    let spoc = null;
    if (publishToPlatform) {
      if (!mySpocs.length) {
        return res.status(400).json({ success: false, message: 'No ClientSPOC is attached to your vendor account yet. Please contact the administrator.' });
      }
      const chosen = (body.clientspoc || '').toString().toLowerCase().trim();
      spoc = mySpocs.find(x => (x.email || '').toLowerCase() === chosen);
      if (!spoc) {
        return res.status(400).json({ success: false, message: 'Select one of the ClientSPOCs attached to your account.' });
      }
    }

    // A company the vendor added themselves can only be used once approved.
    // Approval only gates going public — a vendor may work a pending company
    // privately with their own team in the meantime.
    const clientName = (body.client || '').toString().trim();
    if (publishToPlatform) {
      const compSnap = await db.collection('Company_Overview').where('lower', '==', clientName.toLowerCase()).limit(1).get();
      if (!compSnap.empty) {
        const c = compSnap.docs[0].data();
        if (c.addedByVendor && c.vendorApproved !== true) {
          return res.status(403).json({ success: false, message: 'This company is still awaiting SuperAdmin approval — you can publish positions against it once approved.' });
        }
      }
    }

    const adminF = require('../model_fire/adminF');
    const created = await adminF.CreatePosition({
      ...body,
      clientspoc: spoc ? spoc.email : '',
      clientspoc_name: spoc ? (spoc.name || '') : '',
      // 'pending' waits on the SPOC; a private position is live for the vendor's
      // own team straight away but never surfaces on the public platform.
      status: publishToPlatform ? 'pending' : 'active',
      publishToPlatform,
      vendorPrivate: !publishToPlatform,
      postedByVendor: (req.vendor.email || '').toLowerCase(),
      vendorName: req.vendor.name || '',
    });
    res.json({
      success: true,
      message: publishToPlatform
        ? 'Position submitted for ClientSPOC approval.'
        : 'Position created — visible to your team only.',
      data: created,
    });
  } catch (e) {
    console.error('vendor/positions error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /vendor/positions/:id — edit, allowed only before the SPOC approves.
router.put('/positions/:id', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const ref = db.collection('admin_AddPos').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || (doc.data().postedByVendor || '').toLowerCase() !== vendorEmail) {
      return res.status(404).json({ success: false, message: 'Position not found.' });
    }
    const status = (doc.data().status || '').toLowerCase();
    if (!['pending', 'admin-pending'].includes(status)) {
      return res.status(403).json({ success: false, message: 'This position has already been approved — it can no longer be edited.' });
    }
    const update = { ...req.body };
    ['pos_id', 'postedByVendor', 'datePosted', 'status'].forEach(k => delete update[k]);
    update.modifiedAt = new Date();
    await ref.update(update);
    res.json({ success: true, message: 'Position updated.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /vendor/positions/:id/hold — pause one of the vendor's own positions.
router.post('/positions/:id/hold', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const reason = (req.body?.reason || '').toString().trim();
    if (!reason) return res.status(400).json({ success: false, message: 'A reason is required.' });
    const ref = db.collection('admin_AddPos').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || (doc.data().postedByVendor || '').toLowerCase() !== vendorEmail) {
      return res.status(404).json({ success: false, message: 'Position not found.' });
    }
    await ref.update({ status: 'hold', holdReason: reason, holdAt: new Date(), holdBy: vendorEmail });
    res.json({ success: true, message: 'Position placed on hold.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── SuperAdmin: attach ClientSPOC(s) to a vendor ───────────────────────────
// A vendor can have several SPOCs; when they post a position they pick one, and
// only that SPOC can make it live.
const managerGate = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.SECKEY); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
  try {
    const r = await adminVerify.checkData(decoded.email);
    if (r.success) { req.managerEmail = decoded.email; return next(); }
    const recruiterF = require('../model_fire/recruiterF');
    const rec = await recruiterF.findRecruiterByEmail(decoded.email);
    if (rec && (rec.role === 'Super Admin' || rec.roleCategory === 'SuperAdmin')) {
      req.managerEmail = decoded.email; return next();
    }
    return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
};

// GET /vendor/admin/:vendorId/clientspocs — current attachments + all SPOCs to pick from
router.get('/admin/:vendorId/clientspocs', managerGate, async (req, res) => {
  try {
    const vDoc = await db.collection('admin_db').doc(req.params.vendorId).get();
    if (!vDoc.exists) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const all = await db.collection('admin_db').get();
    const clientspocs = all.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => ['clientspoc'].includes((x.roleCategory || x.role || '').toLowerCase().replace(/\s/g, '')))
      .map(x => ({ email: (x.email || '').toLowerCase(), name: x.name || (x.email || '').split('@')[0] }))
      .filter(x => x.email)
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      success: true,
      assigned: Array.isArray(vDoc.data().clientspocs) ? vDoc.data().clientspocs : [],
      clientspocs,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /vendor/admin/:vendorId/clientspocs  { clientspocs: [{email,name}] }
router.post('/admin/:vendorId/clientspocs', managerGate, async (req, res) => {
  try {
    const list = Array.isArray(req.body?.clientspocs) ? req.body.clientspocs : [];
    const seen = new Set();
    const clean = list
      .map(x => ({ email: (x.email || '').toLowerCase().trim(), name: (x.name || '').trim() }))
      .filter(x => x.email && !seen.has(x.email) && seen.add(x.email));
    await db.collection('admin_db').doc(req.params.vendorId)
      .set({ clientspocs: clean, clientspocsUpdatedAt: new Date(), clientspocsUpdatedBy: req.managerEmail }, { merge: true });
    res.json({ success: true, assigned: clean });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /vendor/my-clientspocs — the SPOCs a vendor may route positions to.
router.get('/my-clientspocs', vendorAuth, async (req, res) => {
  try {
    const list = Array.isArray(req.vendor.clientspocs) ? req.vendor.clientspocs : [];
    res.json({ success: true, clientspocs: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Vendor companies (SuperAdmin approves before they can be used) ─────────
router.get('/companies', vendorAuth, async (req, res) => {
  try {
    const email = (req.vendor.email || '').toLowerCase();
    const snap = await db.collection('Company_Overview').where('addedByVendor', '==', email).get();
    const mine = snap.docs.map(d => ({ ...d.data(), id: d.id, approved: d.data().vendorApproved === true,
      rejectedReason: d.data().vendorRejectReason || '' }));
    res.json({ success: true, companies: mine.sort((a, b) => a.name.localeCompare(b.name)) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Fields a vendor may set on a company. Same shape the SuperAdmin company form
// produces, minus anything that would let a vendor grant themselves commission
// terms — those stay with the SuperAdmin.
const VENDOR_COMPANY_FIELDS = [
  'name', 'lower', 'overview', 'candidateInstructions', 'audioText',
  'photoRequired', 'questions', 'requiredFields',
];

const pickCompanyFields = (body) => {
  const out = {};
  VENDOR_COMPANY_FIELDS.forEach(f => { if (body[f] !== undefined) out[f] = body[f]; });
  out.name = String(out.name || '').trim();
  out.lower = String(out.lower || out.name).toLowerCase().trim();
  return out;
};

// POST /vendor/companies — created unapproved; a SuperAdmin must approve before
// positions can be published against it.
router.post('/companies', vendorAuth, async (req, res) => {
  try {
    const email = (req.vendor.email || '').toLowerCase();
    const fields = pickCompanyFields(req.body || {});
    if (!fields.name) return res.status(400).json({ success: false, message: 'Company name is required.' });
    const dup = await db.collection('Company_Overview').where('lower', '==', fields.lower).limit(1).get();
    if (!dup.empty) return res.status(409).json({ success: false, message: 'A company with that name already exists.' });
    const ref = await db.collection('Company_Overview').add({
      ...fields,
      addedByVendor: email, vendorName: req.vendor.name || '',
      vendorApproved: false,
      createdAt: new Date(),
    });
    res.json({ success: true, id: ref.id, message: 'Company submitted — positions can be published against it once a SuperAdmin approves.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /vendor/companies/:id — editable only while still awaiting approval.
router.put('/companies/:id', vendorAuth, async (req, res) => {
  try {
    const email = (req.vendor.email || '').toLowerCase();
    const ref = db.collection('Company_Overview').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || (doc.data().addedByVendor || '').toLowerCase() !== email) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    if (doc.data().vendorApproved === true) {
      return res.status(403).json({ success: false, message: 'This company is already approved — contact the administrator to change it.' });
    }
    const fields = pickCompanyFields(req.body || {});
    if (!fields.name) return res.status(400).json({ success: false, message: 'Company name is required.' });
    const dup = await db.collection('Company_Overview').where('lower', '==', fields.lower).limit(1).get();
    if (!dup.empty && dup.docs[0].id !== req.params.id) {
      return res.status(409).json({ success: false, message: 'A company with that name already exists.' });
    }
    await ref.set({ ...fields, updatedAt: new Date() }, { merge: true });
    res.json({ success: true, message: 'Company updated.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// SuperAdmin: list + approve/reject vendor-added companies.
router.get('/admin/companies', managerGate, async (req, res) => {
  try {
    const snap = await db.collection('Company_Overview').where('addedByVendor', '!=', null).get();
    const rows = snap.docs.map(d => {
      const c = d.data();
      return { id: d.id, name: c.name, overview: c.overview || '', addedByVendor: c.addedByVendor,
        vendorName: c.vendorName || '', approved: c.vendorApproved === true, createdAt: c.createdAt || null };
    }).sort((a, b) => Number(a.approved) - Number(b.approved) || a.name.localeCompare(b.name));
    res.json({ success: true, companies: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/admin/companies/:id/decision', managerGate, async (req, res) => {
  try {
    const approve = req.body?.approve === true;
    await db.collection('Company_Overview').doc(req.params.id).set({
      vendorApproved: approve,
      vendorRejectReason: approve ? '' : (req.body?.reason || '').toString(),
      vendorDecisionBy: req.managerEmail, vendorDecisionAt: new Date(),
    }, { merge: true });
    res.json({ success: true, message: approve ? 'Company approved.' : 'Company rejected.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});


// GET /vendor/dashboard-stats — the vendor landing page.
// "Direct" means positions the vendor added themselves; "RecruiterV" means
// positions from the wider platform their side is working on.
router.get('/dashboard-stats', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();

    // The vendor plus every recruiter under them.
    const teamSnap = await db.collection('recruiter_db').where('vendorEmail', '==', vendorEmail).get();
    const teamEmails = [...new Set([vendorEmail, ...teamSnap.docs.map(d => (d.data().email || '').toLowerCase())])].filter(Boolean);

    // Positions the vendor posted themselves.
    const ownSnap = await db.collection('admin_AddPos').where('postedByVendor', '==', vendorEmail).get();
    const ownPos = ownSnap.docs.map(d => d.data());
    const ownIds = new Set(ownPos.map(p => String(p.pos_id)));

    // Everything the team holds, from the shared access model.
    const positionAccess = require('../model_fire/positionAccessF');
    const heldIds = new Set();
    await Promise.all(teamEmails.map(async (e) => {
      try {
        (await positionAccess.getRecruiterAssignments(e) || [])
          .forEach(a => { const pid = String(a.positionId || ''); if (pid) heldIds.add(pid); });
      } catch (_) { /* skip this member */ }
    }));

    // Details for held positions that the vendor did not post.
    const platformIds = [...heldIds].filter(id => !ownIds.has(id));
    const platformPos = [];
    for (let i = 0; i < platformIds.length; i += 10) {
      const snap = await db.collection('admin_AddPos').where('pos_id', 'in', platformIds.slice(i, i + 10)).get();
      snap.docs.forEach(d => platformPos.push(d.data()));
    }

    const isActive = (p) => String(p.status || 'active').toLowerCase().trim() === 'active';
    const activeOwn = ownPos.filter(isActive);
    const activePlatform = platformPos.filter(isActive);
    const activeAll = [...activeOwn, ...activePlatform];
    const activeIds = new Set(activeAll.map(p => String(p.pos_id)));

    // Candidates the team submitted. recEmail is indexed, so query in batches.
    const cands = [];
    for (let i = 0; i < teamEmails.length; i += 10) {
      const snap = await db.collection('candidate_db')
        .select('pos_id', 'statusa', 'recEmail', 'client', 'candidate')
        .where('recEmail', 'in', teamEmails.slice(i, i + 10)).get();
      snap.docs.forEach(d => cands.push(d.data()));
    }

    // "Active CV" = in play: not parked, rejected, dropped or duplicated.
    const DEAD = new Set(['resume bank', 'duplicate', 'client drop', 'candidate drop',
      'position on hold', 'offer declined', 'draft']);
    const isLiveCv = (c) => {
      const st = String(c.statusa || '').toLowerCase().trim();
      if (!st || st.includes('reject')) return false;
      return !DEAD.has(st);
    };
    const liveCvs = cands.filter(isLiveCv);
    const cvOnActive = liveCvs.filter(c => activeIds.has(String(c.pos_id)));

    // Positions with no live CV against them.
    const posWithCv = new Set(cvOnActive.map(c => String(c.pos_id)));
    const withoutCv = activeAll.filter(p => !posWithCv.has(String(p.pos_id)));

    // Interview-stage CVs — the ones with a drive coming up.
    const UPCOMING = ['to be schedule', 'scheduled', 'schedule interview'];
    const upcoming = cvOnActive.filter(c => {
      const st = String(c.statusa || '').toLowerCase();
      return UPCOMING.some(u => st.includes(u));
    });

    // Client-wise active positions, biggest first.
    const byClient = {};
    activeAll.forEach(p => {
      const k = (p.client || 'Unassigned').trim() || 'Unassigned';
      if (!byClient[k]) byClient[k] = { client: k, positions: 0, cvs: 0 };
      byClient[k].positions++;
    });
    cvOnActive.forEach(c => {
      const k = (c.client || '').trim();
      if (k && byClient[k]) byClient[k].cvs++;
    });
    const clientWise = Object.values(byClient).sort((a, b) => b.positions - a.positions);

    res.json({
      success: true,
      stats: {
        directActivePositions: activeOwn.length,
        platformActivePositions: activePlatform.length,
        activeCvs: liveCvs.length,
        cvsOnActivePositions: cvOnActive.length,
        positionsWithoutCv: withoutCv.length,
        cvsInUpcomingDrive: upcoming.length,
        teamSize: teamSnap.size,
      },
      clientWise,
    });
  } catch (e) {
    console.error('vendor/dashboard-stats error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});


// ── Refer & Earn and Direct Candidates, rolled up to the vendor ─────────────
// Both resolve two ways: by the vendorEmail stamped on the record at write time,
// and by current team membership. That way work done before stamping existed
// still appears, and a recruiter leaving the team does not erase what they did.
async function teamEmailsFor(vendorEmail) {
  const snap = await db.collection('recruiter_db').where('vendorEmail', '==', vendorEmail).get();
  return {
    emails: [...new Set([vendorEmail, ...snap.docs.map(d => (d.data().email || '').toLowerCase())])].filter(Boolean),
    names: Object.fromEntries(snap.docs.map(d => [(d.data().email || '').toLowerCase(), d.data().name || ''])),
  };
}

async function candidatesForVendor(vendorEmail, source) {
  const { emails, names } = await teamEmailsFor(vendorEmail);
  const byId = {};

  // Anything already attributed to this vendor.
  try {
    const stamped = await db.collection('candidate_db')
      .where('vendorEmail', '==', vendorEmail).where('source', '==', source).get();
    stamped.docs.forEach(d => { byId[d.id] = { id: d.id, ...d.data() }; });
  } catch (_) { /* fall back to team membership alone */ }

  // Plus anything by a current team member.
  for (let i = 0; i < emails.length; i += 10) {
    const snap = await db.collection('candidate_db')
      .where('recEmail', 'in', emails.slice(i, i + 10)).where('source', '==', source).get();
    snap.docs.forEach(d => { byId[d.id] = { id: d.id, ...d.data() }; });
  }
  return { rows: Object.values(byId), names, emails };
}

const stripHeavy = ({ resumeText, matchTokens, skillsTextTokens, ...rest }) => rest;

const toDateIso = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// GET /vendor/referrals — every Refer & Earn submission by the vendor's team.
router.get('/referrals', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const { rows, names } = await candidatesForVendor(vendorEmail, 'referred');

    // Per recruiter, so a vendor can see who is actually referring.
    const byRecruiter = {};
    rows.forEach(c => {
      const who = (c.referredBy || c.recEmail || '').toLowerCase();
      if (!byRecruiter[who]) {
        byRecruiter[who] = {
          email: who,
          name: c.referredByName || names[who] || who.split('@')[0],
          total: 0, placed: 0, inProcess: 0,
        };
      }
      const b = byRecruiter[who];
      b.total++;
      const st = String(c.statusa || '').toLowerCase();
      if (st.includes('joining') || st.includes('offer accepted') || st.includes('selected')) b.placed++;
      else if (st && !st.includes('reject') && st !== 'resume bank') b.inProcess++;
    });

    res.json({
      success: true,
      total: rows.length,
      byRecruiter: Object.values(byRecruiter).sort((a, b) => b.total - a.total),
      referrals: rows.map(c => ({
        id: c.id,
        candidate: c.candidate || '', emails: c.emails || '', mob: c.mob || '',
        referredBy: c.referredByName || names[(c.referredBy || '').toLowerCase()] || c.referredBy || '',
        referredByEmail: (c.referredBy || c.recEmail || '').toLowerCase(),
        statusa: c.statusa || '',
        curr_emp: c.curr_emp || '', total_exp: c.total_exp || '',
        referredAt: toDateIso(c.referredAt || c.datePosted),
      })).sort((a, b) => (b.referredAt || '').localeCompare(a.referredAt || '')),
    });
  } catch (e) {
    console.error('vendor/referrals error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /vendor/direct-candidates — direct applicants against positions the
// vendor's team shared, counted under the vendor's account.
router.get('/direct-candidates', vendorAuth, async (req, res) => {
  try {
    const vendorEmail = (req.vendor.email || '').toLowerCase();
    const { rows, names } = await candidatesForVendor(vendorEmail, 'direct_apply');

    const byRecruiter = {};
    rows.forEach(c => {
      const who = (c.recEmail || '').toLowerCase();
      if (!byRecruiter[who]) {
        byRecruiter[who] = { email: who, name: c.recName || names[who] || who.split('@')[0], total: 0, verified: 0 };
      }
      byRecruiter[who].total++;
      // 'Applied' is the unverified landing state; anything beyond it has been acted on.
      if (String(c.statusa || '').toLowerCase().trim() !== 'applied') byRecruiter[who].verified++;
    });

    res.json({
      success: true,
      total: rows.length,
      awaitingVerification: rows.filter(c => String(c.statusa || '').toLowerCase().trim() === 'applied').length,
      byRecruiter: Object.values(byRecruiter).sort((a, b) => b.total - a.total),
      candidates: rows.map(stripHeavy),
    });
  } catch (e) {
    console.error('vendor/direct-candidates error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
