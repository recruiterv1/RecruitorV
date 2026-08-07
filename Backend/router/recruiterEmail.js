const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sendEmailFull } = require('../utils/email');
const { db, admin } = require('./firebase_ad');
const recruiterF = require('../model_fire/recruiterF');
const googleF = require('../model_fire/googleF');
const clientspocF = require('../model_fire/clientspocF');
const coachF = require('../model_fire/coachF');
const expertF = require('../model_fire/expertF');
const emailModel = require('../model_fire/recruiterEmailF');
const multer = require('multer');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mailInbound = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// Store one attachment in Firebase Storage; returns { name, size, contentType, url }.
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;   // 10 MB per file
const storeAttachment = async (buffer, filename, contentType) => {
  const token = uuidv4();
  const safe = String(filename || 'file').replace(/[^\w.\-]+/g, '_').slice(0, 120);
  const path = `email-attachments/${Date.now()}_${uuidv4()}_${safe}`;
  const bucket = admin.storage().bucket();
  const file = bucket.file(path);
  await file.save(buffer, { resumable: false, contentType: contentType || 'application/octet-stream' });
  await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  return {
    name: filename || safe,
    size: buffer.length,
    contentType: contentType || 'application/octet-stream',
    url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
  };
};

// ── Auth middleware ──────────────────────────────────────────────────────────
const isLoggedIn = async (req, res, next) => {
  try {
    const jwtToken = req.cookies?.__session;
    if (jwtToken) {
      try { req.user = jwt.verify(jwtToken, process.env.SECKEY); return next(); } catch (_) {}
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    req.user = await admin.auth().verifyIdToken(idToken);
    return next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// ── Resolve user across all role collections ─────────────────────────────────
// Returns: { id, name, role, ownerEmail, senderEmail, senderName, replyTo }
//   ownerEmail  — key used to store/retrieve emails in Firestore
//   senderEmail — Brevo "from" address (must be verified domain)
//   replyTo     — address replies go to (null for recruiters, real email for others)
const getSenderEmailForRecruiter = (name) => {
  const parts = (name || '').trim().split(/\s+/);
  const first = (parts[0] || 'recruiter').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last  = (parts[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return last ? `${first}.${last}@recruiterv.com` : `${first}@recruiterv.com`;
};

const resolveUser = async (loginEmail) => {
  // 1. Recruiter
  const rec = (await recruiterF.findRecruiterByEmail(loginEmail)) || (await googleF.findByEmail(loginEmail));
  if (rec) {
    const senderEmail = getSenderEmailForRecruiter(rec.name);
    // replyTo = tagged Gmail address for polling; displayEmail = @recruiterv.com shown in UI
    return { id: rec.id, name: rec.name, phone: rec.phone || rec.mobile || rec.mob || rec.contact || '', role: 'recruiter', ownerEmail: senderEmail, senderEmail, senderName: rec.name, replyTo: `recruiterv.replies+${rec.id}@gmail.com`, displayEmail: senderEmail };
  }

  // 2. admin_db holds ClientSPOCs AND Vendors (and admins) — distinguish by roleCategory.
  const spoc = await clientspocF.findClientSpocByEmail(loginEmail);
  if (spoc) {
    const rc = (spoc.roleCategory || spoc.role || '').toLowerCase();
    if (rc === 'vendor') {
      const vendorEmail = getSenderEmailForRecruiter(spoc.name);
      return { id: spoc.id, name: spoc.name, phone: spoc.phone || spoc.mobile || spoc.mob || spoc.contact || '', role: 'vendor', ownerEmail: vendorEmail, senderEmail: 'noreply@recruiterv.com', senderName: spoc.name, replyTo: `recruiterv.replies+${spoc.id}@gmail.com`, displayEmail: vendorEmail };
    }
    return { id: spoc.id, name: spoc.name, phone: spoc.phone || spoc.mobile || spoc.mob || spoc.contact || '', role: 'clientspoc', ownerEmail: loginEmail.toLowerCase(), senderEmail: 'noreply@recruiterv.com', senderName: spoc.name, replyTo: loginEmail.toLowerCase() };
  }

  // 3. Coach
  const coach = await coachF.findCoachByEmail(loginEmail);
  if (coach) {
    const coachEmail = getSenderEmailForRecruiter(coach.name);
    return { id: coach.id, name: coach.name, phone: coach.phone || coach.mobile || coach.mob || coach.contact || '', role: 'coach', ownerEmail: coachEmail, senderEmail: 'noreply@recruiterv.com', senderName: coach.name, replyTo: `recruiterv.replies+${coach.id}@gmail.com`, displayEmail: coachEmail };
  }

  // 4. Expert
  const expert = await expertF.findExpertByEmail(loginEmail);
  if (expert) {
    const expertEmail = getSenderEmailForRecruiter(expert.name);
    return { id: expert.id, name: expert.name, phone: expert.phone || expert.mobile || expert.mob || expert.contact || '', role: 'expert', ownerEmail: expertEmail, senderEmail: 'noreply@recruiterv.com', senderName: expert.name, replyTo: `recruiterv.replies+${expert.id}@gmail.com`, displayEmail: expertEmail };
  }

  return null;
};


// The sidebar Inbox is a PAID feature (collection inbox_access, doc id = lowercased
// login email). Access is granted either by a SuperAdmin "free" toggle (source
// 'admin', no expiry) OR a paid Razorpay subscription (source 'subscription',
// carries validUntil = current period end). Returns true only when currently valid.
const hasInboxAccess = async (loginEmail) => {
  try {
    const doc = await db.collection('inbox_access').doc((loginEmail || '').toLowerCase().trim()).get();
    if (!doc.exists) return false;
    const d = doc.data();
    if (d.enabled !== true) return false;
    if (d.validUntil) {   // subscription grant — must not be expired
      const ms = d.validUntil.toMillis ? d.validUntil.toMillis() : new Date(d.validUntil).getTime();
      return ms > Date.now();
    }
    return true;          // free / admin grant — no expiry
  } catch (_) { return false; }
};

// Guard for the inbox data endpoints — 403 (not 404) so the UI can show the
// "contact your administrator" screen without breaking.
const requireInboxAccess = async (req, res, next) => {
  if (await hasInboxAccess(req.user.email)) return next();
  return res.status(403).json({ message: 'Inbox access not enabled', code: 'INBOX_NO_ACCESS' });
};

// ── GET /me ──────────────────────────────────────────────────────────────────
router.get('/me', isLoggedIn, async (req, res) => {
  try {
    const user = await resolveUser(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      success: true,
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      ownerEmail: user.ownerEmail,       // used as identity key in storage
      displayEmail: user.displayEmail || user.replyTo || user.senderEmail, // shown in UI "From:" line
      inboxAccess: await hasInboxAccess(req.user.email), // paid-feature gate
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /folder/:folder ──────────────────────────────────────────────────────
router.get('/folder/:folder', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const folder = req.params.folder;
    if (!['inbox', 'sent', 'draft'].includes(folder)) {
      return res.status(400).json({ message: 'Invalid folder' });
    }
    const user = await resolveUser(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const list = await emailModel.getEmailsByFolder(user.ownerEmail, folder);
    res.json({ success: true, emails: list, ownerEmail: user.ownerEmail, displayEmail: user.replyTo || user.senderEmail });
  } catch (err) {
    console.error('Get folder error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /contacts  search contacts (role-aware) ──────────────────────────────
router.get('/contacts', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const user = await resolveUser(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const q = (req.query.q || '').toLowerCase();
    let contacts = [];

    const addFromSnap = (snap, nameField, emailField, type) => {
      snap.docs.forEach(d => {
        const data = d.data();
        const name = data[nameField] || '';
        const email = data[emailField] || '';
        if (email) contacts.push({ id: d.id, name, email, type });
      });
    };

    // Recruiter → candidates + clientspocs + coaches + experts
    if (user.role === 'recruiter') {
      const [candSnap, spocSnap, coachSnap, expertSnap] = await Promise.all([
        db.collection('candidate_db').limit(200).get(),
        db.collection('admin_db').limit(100).get(),
        db.collection('coach_db').limit(100).get(),
        db.collection('expert_db').limit(100).get(),
      ]);
      addFromSnap(candSnap, 'candidate', 'emails', 'Candidate');
      addFromSnap(spocSnap, 'name', 'email', 'ClientSPOC');
      addFromSnap(coachSnap, 'name', 'email', 'Coach');
      addFromSnap(expertSnap, 'name', 'email', 'Expert');
    }

    // ClientSPOC / Coach / Expert → candidates + clientspocs + coaches + experts (all in-system)
    if (['clientspoc', 'coach', 'expert'].includes(user.role)) {
      const [candSnap, spocSnap, coachSnap, expertSnap] = await Promise.all([
        db.collection('candidate_db').limit(200).get(),
        db.collection('admin_db').limit(100).get(),
        db.collection('coach_db').limit(100).get(),
        db.collection('expert_db').limit(100).get(),
      ]);
      addFromSnap(candSnap, 'candidate', 'emails', 'Candidate');
      addFromSnap(spocSnap, 'name', 'email', 'ClientSPOC');
      addFromSnap(coachSnap, 'name', 'email', 'Coach');
      addFromSnap(expertSnap, 'name', 'email', 'Expert');
    }

    // Filter by query
    if (q) {
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }

    // Deduplicate by email
    const seen = new Set();
    contacts = contacts.filter(c => {
      if (!c.email || seen.has(c.email)) return false;
      seen.add(c.email);
      return true;
    });

    res.json({ success: true, contacts: contacts.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /jd-positions ────────────────────────────────────────────────────────
// Positions the logged-in user can send a JD for:
//   ClientSPOC → only positions they posted; others → their assigned positions.
// Returns full JD fields so the client can build the email body directly.
const jdShape = (p) => ({
  id: p.id, pos_id: p.pos_id, position: p.position, client: p.client,
  location: p.location, state: p.state, experience: p.experience,
  min_exp: p.min_exp, max_exp: p.max_exp, ctcStart: p.ctcStart, ctcEnd: p.ctcEnd,
  skill_category: p.skill_category, pos_cat: p.pos_cat, employment_type: p.employment_type,
  work_mode: p.work_mode, no_of_positions: p.no_of_positions, req_education: p.req_education,
  job_desc: p.job_desc || p.description || '', key_res: p.key_res, m_have: p.m_have,
  g_have: p.g_have, compet: p.compet, comp_view: p.comp_view,
});
const isActivePos = (p) => { const st = (p.status || 'active').toLowerCase().trim(); return st === '' || st.includes('active'); };

router.get('/jd-positions', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const user = await resolveUser(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const email = (req.user.email || '').toLowerCase().trim();
    const POS = db.collection('admin_AddPos');
    let positions = [];

    if (user.role === 'clientspoc') {
      const snap = await POS.where('clientspoc', '==', email).get();
      positions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      // recruiter / coach / expert → assigned positions (by pos_id)
      const posIds = new Set();
      try {
        const positionAccessF = require('../model_fire/positionAccessF');
        const assigns = await positionAccessF.getRecruiterAssignments(email);
        assigns.forEach(a => { if (a.positionId) posIds.add(String(a.positionId)); });
      } catch (_) {}
      // Coach/Expert self-assigned + direct-request approvals
      for (const [col, okStatuses] of [['coach_expert_requests', ['accepted', 'approved']], ['coach_expert_direct_requests', ['approved']]]) {
        try {
          const snap = await db.collection(col).where('coachExpertEmail', '==', email).get();
          snap.docs.forEach(d => { const x = d.data(); if (okStatuses.includes((x.status || '').toLowerCase()) && x.positionId) posIds.add(String(x.positionId)); });
        } catch (_) {}
      }
      if (posIds.size) {
        const all = await POS.get();
        positions = all.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => posIds.has(String(p.pos_id)));
      }
    }

    const list = positions.filter(isActivePos)
      .sort((a, b) => (b.datePosted?.toMillis?.() || 0) - (a.datePosted?.toMillis?.() || 0))
      .map(jdShape);
    res.json({ success: true, positions: list });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /send ───────────────────────────────────────────────────────────────
router.post('/send', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const { to, toName, subject, body, draftId, attachments, recipients, htmlBody } = req.body;

    // Build the recipient list. Prefer the new `recipients:[{email,name}]` array;
    // fall back to legacy single `to`/`toName` (also handles comma-joined strings).
    let recipientList = [];
    if (Array.isArray(recipients) && recipients.length) {
      recipientList = recipients
        .map(r => ({ email: String(r?.email || '').trim(), name: String(r?.name || '').trim() }))
        .filter(r => r.email);
    } else if (to) {
      const emails = String(to).split(',').map(s => s.trim()).filter(Boolean);
      const names = String(toName || '').split(',').map(s => s.trim());
      recipientList = emails.map((email, i) => ({ email, name: (names[i] && names[i] !== email) ? names[i] : '' }));
    }
    if (recipientList.length === 0 || !subject || (!body && !htmlBody)) {
      return res.status(400).json({ message: 'At least one recipient, subject and body are required' });
    }

    const toJoined = recipientList.map(r => r.email).join(', ');
    const toNameJoined = recipientList.map(r => r.name || r.email).join(', ');

    const user = await resolveUser(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!process.env.BREVO_API_KEY) return res.status(500).json({ message: 'Email service not configured' });

    // Attachments arrive as [{ name, contentType, base64 }]. Send them to Brevo
    // (base64) and also keep a copy in Storage so they're viewable in "Sent".
    const brevoAttach = [];
    const storedAttach = [];
    if (Array.isArray(attachments) && attachments.length) {
      for (const a of attachments.slice(0, 10)) {
        if (!a || !a.base64 || !a.name) continue;
        const buf = Buffer.from(a.base64, 'base64');
        if (buf.length > MAX_ATTACH_BYTES) {
          return res.status(400).json({ message: `Attachment "${a.name}" exceeds the 10 MB limit.` });
        }
        brevoAttach.push({ name: a.name, content: a.base64 });
        try { storedAttach.push(await storeAttachment(buf, a.name, a.contentType)); }
        catch (_) { storedAttach.push({ name: a.name, size: buf.length, contentType: a.contentType || '', url: '' }); }
      }
    }

    // Always send from the verified Brevo sender; set reply-to so replies reach the user.
    // A designed HTML body (htmlBody, e.g. the "Send JD" email) is used as-is;
    // otherwise the plain-text body is escaped + newlines → <br>.
    const effectiveReplyTo = user.replyTo || null;

    // Auto signature (non-editable) appended to every outbound email.
    const sigEmail = user.displayEmail || user.replyTo || user.senderEmail || '';
    const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const sigRows = [
      user.name && esc(user.name),
      user.phone && esc(user.phone),
      sigEmail && `<a href="mailto:${esc(sigEmail)}" style="color:#2563eb;text-decoration:none;">${esc(sigEmail)}</a>`,
      `LinkedIn: <a href="https://www.linkedin.com/company/recruiterv/" style="color:#2563eb;text-decoration:none;">https://www.linkedin.com/company/recruiterv/</a>`,
    ].filter(Boolean);
    const signatureHtml = `<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#374151;margin-top:22px;padding-top:14px;border-top:1px solid #e5e7eb;"><div style="margin-bottom:8px;">Best Regards,</div>${
      sigRows.map(r => `<div>${r}</div>`).join('')
    }</div>`;

    const htmlContent = (htmlBody
      ? String(htmlBody)
      : `<div style="font-family:Arial,sans-serif;line-height:1.6;">${
          body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')
        }</div>`) + signatureHtml;
    // Stored copy: keep the full rendered HTML (incl. signature) so "Sent" matches what was sent.
    const storedBody = htmlContent;

    const result = await sendEmailFull({
      to: recipientList.map(r => (r.name ? { email: r.email, name: r.name } : { email: r.email })),
      subject,
      htmlContent,
      fromEmail: 'noreply@recruiterv.com',
      fromName: user.senderName || 'RecruiterV',
      replyTo: effectiveReplyTo || undefined,
      attachment: brevoAttach.length ? brevoAttach : undefined,
    });
    const messageId = result?.messageId || null;

    await emailModel.createEmail({
      ownerId: user.id,
      ownerEmail: user.ownerEmail,
      folder: 'sent',
      from: user.replyTo || user.senderEmail,
      fromName: user.senderName,
      to: toJoined,
      toName: toNameJoined,
      subject,
      body: storedBody,
      read: true,
      brevoMessageId: messageId,
      attachments: storedAttach,
    });

    if (draftId) { try { await emailModel.deleteEmail(draftId); } catch (_) {} }

    console.log(`✅ [${user.role}] Email sent from ${user.replyTo || user.senderEmail} to ${toJoined}`);
    res.json({ success: true, message: 'Email sent', messageId });
  } catch (err) {
    console.error('Send email error:', err.response?.body || err.message);
    res.status(500).json({ message: 'Failed to send email', error: err.response?.body?.message || err.message });
  }
});

// ── POST /draft ──────────────────────────────────────────────────────────────
router.post('/draft', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const { to, toName, subject, body } = req.body;
    const user = await resolveUser(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const doc = await emailModel.createEmail({
      ownerId: user.id,
      ownerEmail: user.ownerEmail,
      folder: 'draft',
      from: user.replyTo || user.senderEmail,
      fromName: user.senderName,
      to: to || '', toName: toName || '', subject: subject || '', body: body || '',
      read: true, brevoMessageId: null,
    });
    res.json({ success: true, draft: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /draft/:id ───────────────────────────────────────────────────────────
router.put('/draft/:id', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const { to, toName, subject, body } = req.body;
    await emailModel.updateEmail(req.params.id, { to: to || '', toName: toName || '', subject: subject || '', body: body || '' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /:id/read ─────────────────────────────────────────────────────────────
router.put('/:id/read', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    await emailModel.updateEmail(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
router.delete('/:id', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    await emailModel.deleteEmail(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /fetch-inbox  Pull unseen replies from Gmail into recruiter inboxes ──
router.post('/fetch-inbox', isLoggedIn, requireInboxAccess, async (req, res) => {
  try {
    const { fetchGmailReplies } = require('../utils/gmailPoller');
    const replies = await fetchGmailReplies();

    if (replies.length === 0) return res.json({ success: true, added: 0 });

    // Build case-insensitive ID map across all role collections (Gmail lowercases the +tag)
    const [rSnap, gSnap, cSnap, eSnap] = await Promise.all([
      db.collection('recruiter_db').get(),
      db.collection('google_users').get(),
      db.collection('coach_db').get(),
      db.collection('expert_db').get(),
    ]);
    const idMap = {};
    rSnap.docs.forEach(d => { idMap[d.id.toLowerCase()] = { doc: d, col: 'recruiter' }; });
    gSnap.docs.forEach(d => { idMap[d.id.toLowerCase()] = { doc: d, col: 'recruiter' }; });
    cSnap.docs.forEach(d => { idMap[d.id.toLowerCase()] = { doc: d, col: 'coach' }; });
    eSnap.docs.forEach(d => { idMap[d.id.toLowerCase()] = { doc: d, col: 'expert' }; });

    let added = 0;
    for (const reply of replies) {
      const entry = idMap[reply.recruiterId.toLowerCase()];
      if (!entry) { console.log('fetch-inbox: no doc for id', reply.recruiterId); continue; }
      const { doc } = entry;
      const data = doc.data();
      // All roles use derived @recruiterv.com address (same as resolveUser)
      const ownerEmail = getSenderEmailForRecruiter(data.name);
      if (!ownerEmail) continue;
      await emailModel.createEmail({
        ownerId: doc.id, ownerEmail, folder: 'inbox',
        from: reply.from, fromName: reply.fromName,
        to: ownerEmail, toName: data.name || '',
        subject: reply.subject, body: reply.body,
        read: false, brevoMessageId: reply.messageId,
      });
      added++;
    }

    res.json({ success: true, added });
  } catch (err) {
    console.error('fetch-inbox error:', err);
    res.status(500).json({ message: 'Failed to fetch inbox', error: err.message });
  }
});

// ── Shared inbound router ─────────────────────────────────────────────────────
// Given one parsed inbound message, find whose app-inbox it belongs to and store
// it. Handles the derived @recruiterv.com addresses (recruiter / coach / expert),
// the @inbound.recruiterv.com reply-threading alias, and any real login email.
const deliverInbound = async ({ toAddress, fromAddr, fromName, subject, htmlBody, messageId, attachments = [] }) => {
  const addr = (toAddress || '').toLowerCase().trim();
  if (!addr) return false;

  const store = async (ownerId, ownerEmail, toName) => {
    await emailModel.createEmail({
      ownerId, ownerEmail, folder: 'inbox',
      from: fromAddr, fromName, to: addr, toName: toName || '',
      subject, body: htmlBody, read: false, brevoMessageId: messageId,
      attachments: Array.isArray(attachments) ? attachments : [],
    });
    console.log(`📥 Inbound → ${ownerEmail} from ${fromAddr}`);
    return true;
  };

  // Match a derived @recruiterv.com address across recruiter / coach / expert.
  // (Previously only recruiter_db was searched, so mail to a coach's or expert's
  //  @recruiterv.com address was silently dropped.)
  const matchDerived = async (wanted) => {
    const cols = [
      { snap: await db.collection('recruiter_db').get() },
      { snap: await db.collection('coach_db').get() },
      { snap: await db.collection('expert_db').get() },
    ];
    for (const { snap } of cols) {
      for (const doc of snap.docs) {
        const d = doc.data();
        if (d.isVerified === false) continue;
        if (getSenderEmailForRecruiter(d.name) === wanted) {
          return store(doc.id, wanted, d.name);
        }
      }
    }
    return false;
  };

  // Reply-threading alias: atul.kumar@inbound.recruiterv.com → atul.kumar@recruiterv.com
  if (addr.endsWith('@inbound.recruiterv.com')) {
    return matchDerived(`${addr.split('@')[0]}@recruiterv.com`);
  }
  // Direct mail to a derived platform address
  if (addr.endsWith('@recruiterv.com')) {
    if (await matchDerived(addr)) return true;
    // ClientSPOCs use their real email as their address — fall through to resolveUser
  }
  // Any real login email (ClientSPOC, or a user whose login IS an @recruiterv.com)
  const resolved = await resolveUser(addr);
  if (resolved) return store(resolved.id, resolved.ownerEmail, resolved.name);

  console.warn(`⚠️ Inbound mail to ${addr} matched no user — dropped.`);
  return false;
};

// Normalise Mailgun's inbound-route payload (form fields) into our shape.
// Mailgun posts application/x-www-form-urlencoded (no attachments) or
// multipart/form-data, with fields recipient / sender / subject / body-html …
const parseMailgun = (b) => {
  if (!b || (!b.recipient && !b['body-plain'] && !b['stripped-text'] && !b['message-headers'])) return null;
  const recipients = String(b.recipient || b.To || b.to || '')
    .split(',').map(x => x.trim().replace(/^.*<|>.*$/g, '')).filter(Boolean);
  return {
    recipients,
    fromAddr: (b.sender || b.from || b.From || '').replace(/^.*<|>.*$/g, '').trim(),
    fromName: b.from || b.From || b.sender || '',
    subject: b.subject || b.Subject || '(no subject)',
    htmlBody: b['stripped-html'] || b['body-html'] || b['stripped-text'] || b['body-plain'] || '',
    messageId: b['Message-Id'] || b['message-id'] || null,
  };
};

// Normalise Resend's inbound webhook (JSON) into our shape. Resend posts
// application/json, event type like "email.received"/"inbound.email.received",
// with the message under `data` (from / to / subject / html / text).
const parseResend = (b) => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  const d = b.data && typeof b.data === 'object' ? b.data : b;
  const looksResend =
    (b.type && String(b.type).toLowerCase().includes('email')) ||
    (d.from && (d.to || d.html || d.text) && d.subject !== undefined);
  if (!looksResend) return null;

  const toRaw = d.to ?? d.To ?? [];
  const recipients = (Array.isArray(toRaw) ? toRaw : String(toRaw).split(','))
    .map(x => (typeof x === 'object' ? (x.email || x.address || '') : String(x)))
    .map(x => x.trim().replace(/^.*<|>.*$/g, '')).filter(Boolean);

  const fromRaw = d.from ?? d.From ?? d.sender ?? '';
  const fromAddr = (typeof fromRaw === 'object' ? (fromRaw.email || fromRaw.address || '') : String(fromRaw))
    .replace(/^.*<|>.*$/g, '').trim();
  const fromName = typeof fromRaw === 'object' ? (fromRaw.name || fromAddr) : String(fromRaw);

  return {
    recipients,
    fromAddr, fromName,
    subject: d.subject || d.Subject || '(no subject)',
    htmlBody: d.html || d.htmlBody || d.text || d.textBody || '',
    messageId: d.email_id || d.id || d.message_id || b.id || null,
    emailId: d.email_id || d.id || null,
    // Attachment metadata Resend includes in the webhook (content fetched below)
    attachmentsMeta: Array.isArray(d.attachments) ? d.attachments : [],
  };
};

// Resend's inbound webhook is metadata-only: the body and attachment CONTENT must
// be pulled from Resend's API with the account key. Best-effort — returns
// { htmlBody, attachments[] } when RESEND_API_KEY is set, else nulls so we keep
// whatever the webhook gave. No-op (and never throws) without the key.
const fetchResendEmail = async (emailId) => {
  const key = process.env.RESEND_API_KEY;
  if (!key || !emailId) return { htmlBody: null, attachments: [] };
  const auth = { headers: { Authorization: `Bearer ${key}` }, timeout: 8000, validateStatus: () => true };

  // 1) Body: GET /emails/receiving/{id} → html / text
  let htmlBody = null;
  try {
    const r = await axios.get(`https://api.resend.com/emails/receiving/${emailId}`, auth);
    if (r.status === 200 && r.data) htmlBody = r.data.html || r.data.text || null;
    else console.warn(`Resend retrieve-email ${emailId} → ${r.status}`, r.data && r.data.message);
  } catch (e) { console.warn('Resend retrieve-email failed:', e.message); }

  // 2) Attachments: GET /emails/receiving/{id}/attachments → each has a short-lived
  //    download_url. Fetch each and re-host in Storage (the download_url expires).
  const attachments = [];
  try {
    const r = await axios.get(`https://api.resend.com/emails/receiving/${emailId}/attachments`, auth);
    const list = r.status === 200 ? (Array.isArray(r.data) ? r.data : (r.data?.data || [])) : [];
    if (r.status !== 200) console.warn(`Resend list-attachments ${emailId} → ${r.status}`, r.data && r.data.message);
    for (const at of list) {
      const url = at.download_url || at.url;
      if (!url) continue;
      try {
        const f = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        const buf = Buffer.from(f.data);
        if (buf.length && buf.length <= MAX_ATTACH_BYTES) {
          attachments.push(await storeAttachment(buf, at.filename || at.name || 'attachment', at.content_type || at.contentType));
        }
      } catch (e) { console.warn('Resend attachment download failed:', at.filename, e.message); }
    }
  } catch (e) { console.warn('Resend list-attachments failed:', e.message); }

  return { htmlBody, attachments };
};

// ── POST /inbound  inbound-email webhook (no auth) ───────────────────────────
// Accepts Resend, Mailgun and Brevo inbound formats. recruiterv.com's inbound
// mail is handled by Resend — point your Resend inbound webhook at this URL.
// Outbound email is unaffected by this endpoint (that stays on Brevo, /send).
router.post('/inbound', mailInbound.any(), async (req, res) => {
  try {
    // Mailgun sends attachments as multipart files (captured by multer as
    // req.files); store them so the recipient can download them from their inbox.
    const uploadedFiles = async () => {
      const out = [];
      for (const f of (req.files || [])) {
        if (!f.buffer || f.buffer.length > MAX_ATTACH_BYTES) continue;
        try { out.push(await storeAttachment(f.buffer, f.originalname, f.mimetype)); } catch (_) {}
      }
      return out;
    };

    // 1) Mailgun form-encoded / multipart
    const mg = parseMailgun(req.body);
    if (mg && mg.recipients.length) {
      const attachments = await uploadedFiles();
      for (const to of mg.recipients) {
        await deliverInbound({ toAddress: to, fromAddr: mg.fromAddr, fromName: mg.fromName, subject: mg.subject, htmlBody: mg.htmlBody, messageId: mg.messageId, attachments });
      }
      return res.status(200).json({ success: true });
    }

    // 2) Resend inbound JSON. The webhook carries only metadata, so pull the body
    //    and attachment content from Resend's API (needs RESEND_API_KEY).
    const rs = parseResend(req.body);
    if (rs && rs.recipients.length) {
      const enriched = await fetchResendEmail(rs.emailId);
      const htmlBody = enriched.htmlBody || rs.htmlBody || '';
      const attachments = enriched.attachments.length
        ? enriched.attachments
        : (rs.attachmentsMeta || []).map(a => ({ name: a.filename || a.name || 'attachment', size: a.size || 0, contentType: a.content_type || '', url: '' }));
      for (const to of rs.recipients) {
        await deliverInbound({ toAddress: to, fromAddr: rs.fromAddr, fromName: rs.fromName, subject: rs.subject, htmlBody, messageId: rs.messageId, attachments });
      }
      return res.status(200).json({ success: true });
    }

    // 3) Brevo inbound-parse JSON (array or single object)
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const fromAddr = item.From?.Address || item.From?.address || '';
      const fromName = item.From?.Name || item.From?.name || fromAddr;
      const subject = item.Subject || item.subject || '(no subject)';
      const htmlBody = item.RawHtmlBody || item.HtmlBody || item.TextBody || item.RawTextBody || '';
      const messageId = item.MessageId || item.Uuid?.[0] || null;
      // Brevo inbound attachments arrive as base64 (Attachments[].Content)
      const brevoAttach = [];
      for (const at of (item.Attachments || item.attachments || [])) {
        const b64 = at.Content || at.content || at.DownloadToken; if (!b64) continue;
        try {
          const buf = Buffer.from(b64, 'base64');
          if (buf.length <= MAX_ATTACH_BYTES) brevoAttach.push(await storeAttachment(buf, at.Name || at.name || 'attachment', at.ContentType || at.contentType));
        } catch (_) {}
      }
      for (const recipient of (item.To || [])) {
        await deliverInbound({
          toAddress: recipient.Address || recipient.address || '',
          fromAddr, fromName, subject, htmlBody, messageId, attachments: brevoAttach,
        });
      }
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Inbound webhook error:', err);
    // Always 200 so the provider does not retry-storm on our error.
    res.status(200).json({ success: true });
  }
});

// Keep old /candidates endpoint as alias for backwards compat
router.get('/candidates', isLoggedIn, requireInboxAccess, async (req, res) => {
  req.url = '/contacts' + (req.query.q ? `?q=${req.query.q}` : '');
  router.handle(req, res, () => {});
});

module.exports = router;
