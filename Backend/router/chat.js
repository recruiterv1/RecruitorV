/**
 * 1:1 Chat system (polling-based, Firestore-backed).
 *
 * Role-aware contacts:
 *  - Recruiter  → Admin, ClientSPOCs (of positions they work on), Coaches/Experts (whose team they're in)
 *  - Coach/Expert → Admin, ClientSPOCs (of positions their team works on), their team Recruiters
 *  - Admin → Coaches/Experts, Recruiters
 *  - ClientSPOC → Admin, Recruiters working their positions, those recruiters' Coaches/Experts
 *
 * Collections:
 *  - chat_conversations: { participants:[a,b], pairKey, names:{}, roles:{}, lastMessage, lastMessageAt, lastSender, unread:{email:n} }
 *  - chat_messages:      { conversationId, senderEmail, senderName, text, createdAt }
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const { FieldValue } = require('firebase-admin/firestore');
const { sendPushToEmails, tokenDocId } = require('../utils/push');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const REJECTION = ['Screen Reject','L1 Reject','L2 Reject','L3 Reject','HR Reject','Background Verification Reject','Negotiation Reject','Offer Declined','Test Reject','Client Drop','Candidate Drop','Duplicate'];

function authMiddleware(req, res, next) {
  const token = req.cookies.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.SECKEY);
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
}

// ── Identity / role resolution ───────────────────────────────────────────────
const findByEmail = async (col, email) => {
  const variants = [...new Set([email, lc(email)])];
  for (const v of variants) {
    const snap = await db.collection(col).where('email', '==', v).limit(1).get();
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return null;
};

const ADMIN_ROLES = ['admin', 'super admin', 'superadmin'];

const resolveUser = async (email) => {
  const e = email;
  // Coach / Expert collections
  const coach = await findByEmail('coach_db', e);
  if (coach) return { email: coach.email || lc(e), name: coach.name || lc(e).split('@')[0], role: 'coach', skillCategory: coach.skillCategory || coach.specialization || '' };
  const expert = await findByEmail('expert_db', e);
  if (expert) return { email: expert.email || lc(e), name: expert.name || lc(e).split('@')[0], role: 'expert', skillCategory: expert.skillCategory || expert.specialization || '' };

  // recruiter_db (recruiters + some admins/coaches)
  const rec = await findByEmail('recruiter_db', e);
  if (rec) {
    const rcRaw = lc(rec.roleCategory || rec.role);
    if (ADMIN_ROLES.includes(rcRaw)) return { email: rec.email, name: rec.name || lc(e).split('@')[0], role: 'admin' };
    if (rcRaw === 'coach') return { email: rec.email, name: rec.name, role: 'coach', skillCategory: rec.skillCategory || '' };
    if (rcRaw === 'expert') return { email: rec.email, name: rec.name, role: 'expert', skillCategory: rec.skillCategory || '' };
    return { email: rec.email, name: rec.name || lc(e).split('@')[0], role: 'recruiter' };
  }

  // admin_db (clientspocs + admins)
  const adm = await findByEmail('admin_db', e);
  if (adm) {
    const rcRaw = lc(adm.roleCategory || adm.role);
    if (ADMIN_ROLES.includes(rcRaw)) return { email: adm.email, name: adm.name || lc(e).split('@')[0], role: 'admin' };
    if (rcRaw === 'vendor') return { email: adm.email, name: adm.name || lc(e).split('@')[0], role: 'vendor' };
    return { email: adm.email, name: adm.name || lc(e).split('@')[0], role: 'clientspoc' };
  }
  return { email: lc(e), name: lc(e).split('@')[0], role: 'unknown' };
};

// ── Shared lookups ───────────────────────────────────────────────────────────
// "Support" contacts shown in Messages. Only the plain 'admin' role — Super
// Admins are intentionally excluded from the messaging contact list.
const getAdmins = async () => {
  const out = {};
  const admSnap = await db.collection('admin_db').get();
  admSnap.docs.forEach(d => {
    const x = d.data();
    if (x.email && lc(x.roleCategory || x.role) === 'admin') {
      out[lc(x.email)] = { email: x.email, name: x.name || lc(x.email).split('@')[0], role: 'admin' };
    }
  });
  return Object.values(out);
};

// distinct positions a recruiter works on (approved access, accepted coach assign, or has a candidate)
const workingPositionIds = async (recEmail) => {
  const e = lc(recEmail);
  const ids = new Set();
  const [accSnap, coachSnap, candSnap] = await Promise.all([
    db.collection('position_access_requests').where('recruiterEmail', '==', e).get().catch(() => ({ docs: [] })),
    db.collection('coach_recruiter_assignments').where('recruiterEmail', '==', recEmail).get().catch(() => ({ docs: [] })),
    db.collection('candidate_db').where('recEmail', '==', e).get().catch(() => ({ docs: [] })),
  ]);
  accSnap.docs.forEach(d => { const x = d.data(); if (x.status === 'approved' && x.positionId) ids.add(x.positionId); });
  coachSnap.docs.forEach(d => { const x = d.data(); if (x.status === 'accepted' && x.positionId) ids.add(x.positionId); });
  candSnap.docs.forEach(d => { const x = d.data(); if (x.pos_id && !REJECTION.includes(x.statusa)) ids.add(x.pos_id); });
  return [...ids];
};

const clientspocsForPositionIds = async (posIds) => {
  if (!posIds.length) return [];
  const emails = new Set();
  for (let i = 0; i < posIds.length; i += 10) {
    const batch = posIds.slice(i, i + 10);
    const snap = await db.collection('admin_AddPos').where('pos_id', 'in', batch).get();
    snap.docs.forEach(d => { const x = d.data(); if (x.clientspoc) emails.add(lc(x.clientspoc)); });
  }
  // Resolve names from admin_db
  const out = {};
  for (const em of emails) {
    const a = await findByEmail('admin_db', em);
    out[em] = { email: a?.email || em, name: a?.name || em.split('@')[0], role: 'clientspoc' };
  }
  return Object.values(out);
};

const coachesForRecruiter = async (recEmail) => {
  const snap = await db.collection('coach_team_requests')
    .where('recruiterEmail', '==', recEmail)
    .where('status', '==', 'approved')
    .get().catch(() => ({ docs: [] }));
  const out = {};
  for (const d of snap.docs) {
    const x = d.data();
    if (!x.coachEmail) continue;
    const u = await resolveUser(x.coachEmail);
    out[lc(x.coachEmail)] = { email: u.email, name: u.name, role: u.role };
  }
  return Object.values(out);
};

const teamRecruitersForCoach = async (coachEmail) => {
  const snap = await db.collection('coach_team_requests')
    .where('coachEmail', '==', coachEmail)
    .where('status', '==', 'approved')
    .get().catch(() => ({ docs: [] }));
  const out = {};
  snap.docs.forEach(d => { const x = d.data(); if (x.recruiterEmail) out[lc(x.recruiterEmail)] = { email: x.recruiterEmail, name: x.recruiterName || lc(x.recruiterEmail).split('@')[0], role: 'recruiter' }; });
  return Object.values(out);
};

// ── Contacts per role ────────────────────────────────────────────────────────
const getContacts = async (me) => {
  const sections = [];
  const admins = await getAdmins();
  const addSection = (label, contacts) => {
    const filtered = (contacts || []).filter(c => c.email && lc(c.email) !== lc(me.email));
    if (filtered.length) sections.push({ label, contacts: filtered });
  };

  if (me.role === 'recruiter') {
    addSection('Support', admins);
    const posIds = await workingPositionIds(me.email);
    addSection('ClientSPOCs', await clientspocsForPositionIds(posIds));
    addSection('My Coach / Expert', await coachesForRecruiter(me.email));
    // The vendor who created this recruiter (so they can message back).
    const meRec = await findByEmail('recruiter_db', me.email);
    if (meRec?.vendorEmail) {
      const v = await resolveUser(meRec.vendorEmail);
      addSection('My Vendor', [{ email: v.email, name: v.name, role: v.role }]);
    }
  } else if (me.role === 'coach' || me.role === 'expert') {
    addSection('Support', admins);
    const team = await teamRecruitersForCoach(me.email);
    // ClientSPOCs of positions the team works on
    const allPos = new Set();
    for (const r of team) { (await workingPositionIds(r.email)).forEach(p => allPos.add(p)); }
    addSection('ClientSPOCs', await clientspocsForPositionIds([...allPos]));
    addSection('My Team Recruiters', team);
  } else if (me.role === 'admin') {
    // All coaches + experts
    const ces = {};
    const [cSnap, eSnap] = await Promise.all([db.collection('coach_db').get(), db.collection('expert_db').get()]);
    cSnap.docs.forEach(d => { const x = d.data(); if (x.email) ces[lc(x.email)] = { email: x.email, name: x.name || lc(x.email).split('@')[0], role: 'coach', skillCategory: x.skillCategory || x.specialization || '' }; });
    eSnap.docs.forEach(d => { const x = d.data(); if (x.email) ces[lc(x.email)] = { email: x.email, name: x.name || lc(x.email).split('@')[0], role: 'expert', skillCategory: x.skillCategory || x.specialization || '' }; });
    addSection('Coaches / Experts', Object.values(ces));
    // All recruiters
    const recSnap = await db.collection('recruiter_db').get();
    const recs = recSnap.docs.map(d => d.data())
      .filter(x => x.email && !ADMIN_ROLES.includes(lc(x.roleCategory || x.role)) && !['coach', 'expert'].includes(lc(x.roleCategory)))
      .map(x => ({ email: x.email, name: x.name || lc(x.email).split('@')[0], role: 'recruiter' }));
    addSection('Recruiters', recs);
  } else if (me.role === 'vendor') {
    addSection('Support', admins);
    // A vendor chats with the recruiters they created (recruiter_db.vendorEmail).
    const recSnap = await db.collection('recruiter_db').where('vendorEmail', '==', lc(me.email)).get().catch(() => ({ docs: [] }));
    const recs = recSnap.docs.map(d => d.data())
      .filter(x => x.email)
      .map(x => ({ email: x.email, name: x.name || lc(x.email).split('@')[0], role: 'recruiter' }));
    addSection('My Team Recruiters', recs);
  } else if (me.role === 'clientspoc') {
    addSection('Support', admins);
    // Positions owned by this ClientSPOC (case-tolerant match)
    const spocVariants = [...new Set([me.email, lc(me.email)].filter(Boolean))];
    const posSnap = await db.collection('admin_AddPos').where('clientspoc', 'in', spocVariants).get().catch(() => ({ docs: [] }));
    const myPosIds = posSnap.docs.map(d => d.data().pos_id).filter(Boolean);

    const recEmails = new Set();       // recruiters assigned/associated to these positions
    const directCoachEmails = new Set(); // coaches who assigned recruiters to these positions
    for (let i = 0; i < myPosIds.length; i += 10) {
      const batch = myPosIds.slice(i, i + 10);
      if (!batch.length) continue;
      const [acc, cand, coachAssign] = await Promise.all([
        db.collection('position_access_requests').where('positionId', 'in', batch).get().catch(() => ({ docs: [] })),
        db.collection('candidate_db').where('pos_id', 'in', batch).get().catch(() => ({ docs: [] })),
        db.collection('coach_recruiter_assignments').where('positionId', 'in', batch).get().catch(() => ({ docs: [] })),
      ]);
      acc.docs.forEach(d => { const x = d.data(); if (x.status === 'approved' && x.recruiterEmail) recEmails.add(lc(x.recruiterEmail)); });
      cand.docs.forEach(d => { const x = d.data(); if (x.recEmail && !REJECTION.includes(x.statusa)) recEmails.add(lc(x.recEmail)); });
      coachAssign.docs.forEach(d => {
        const x = d.data();
        if (x.recruiterEmail) recEmails.add(lc(x.recruiterEmail));   // assigned recruiter
        if (x.coachEmail) directCoachEmails.add(lc(x.coachEmail));   // associated coach/expert
      });
    }

    const recs = [];
    const coaches = {};
    // Run lookups concurrently (bounded) instead of one-by-one — a ClientSPOC
    // with many positions/recruiters was previously doing hundreds of sequential
    // Firestore reads, which made Messages hang on "loading".
    const runChunked = async (items, size, fn) => {
      for (let i = 0; i < items.length; i += size) {
        await Promise.all(items.slice(i, i + size).map(fn));
      }
    };

    // Coaches directly associated (assigned a recruiter on these positions)
    await runChunked([...directCoachEmails], 20, async (ce) => {
      const u = await resolveUser(ce);
      coaches[ce] = { email: u.email, name: u.name, role: u.role };
    });
    // Recruiters + the coaches whose team each recruiter belongs to
    await runChunked([...recEmails], 20, async (em) => {
      const r = await findByEmail('recruiter_db', em);
      recs.push({ email: r?.email || em, name: r?.name || em.split('@')[0], role: 'recruiter' });
      (await coachesForRecruiter(r?.email || em)).forEach(c => { coaches[lc(c.email)] = c; });
    });
    recs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    addSection('Recruiters', recs);
    addSection('Coaches / Experts', Object.values(coaches));
  }
  return sections;
};

// Short-lived cache for identity resolution — called on every chat request
// (incl. the 3s message poll and 5s conversation poll), so caching avoids
// re-reading 3-4 collections each time and keeps send/receive snappy.
const _userCache = new Map(); // emailLc -> { t, user }
const USER_TTL = 5 * 60 * 1000;
const resolveUserCached = async (email) => {
  const k = lc(email);
  const hit = _userCache.get(k);
  if (hit && (Date.now() - hit.t) < USER_TTL) return hit.user;
  const user = await resolveUser(email);
  _userCache.set(k, { t: Date.now(), user });
  return user;
};

const allowedEmails = (sections) => new Set(sections.flatMap(s => s.contacts.map(c => lc(c.email))));
const pairKeyOf = (a, b) => [lc(a), lc(b)].sort().join('|');

// ── Routes ───────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try { res.json({ success: true, user: await resolveUserCached(req.user.email) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    let sections = [];
    try { sections = await getContacts(me); }
    catch (inner) { console.error('chat/getContacts', inner); } // never let contact-building blank out the role
    res.json({ success: true, role: me.role, sections });
  } catch (e) { console.error('chat/contacts', e); res.status(500).json({ success: false, message: e.message }); }
});

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    const meLc = lc(me.email);
    const snap = await db.collection('chat_conversations').where('participants', 'array-contains', meLc).get();
    const items = snap.docs.map(d => {
      const c = d.data();
      const base = {
        id: d.id,
        lastMessage: c.lastMessage || '',
        lastMessageAt: c.lastMessageAt?._seconds ? c.lastMessageAt._seconds * 1000 : null,
        unread: (c.unread && c.unread[meLc]) || 0,
      };
      if (c.type === 'group') {
        return { ...base, isGroup: true, name: c.name || 'Group', memberCount: (c.participants || []).length };
      }
      const other = (c.participants || []).find(p => p !== meLc) || '';
      return {
        ...base,
        isGroup: false,
        otherEmail: other,
        otherName: (c.names && c.names[other]) || other.split('@')[0],
        otherRole: (c.roles && c.roles[other]) || '',
      };
    }).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    res.json({ success: true, conversations: items });
  } catch (e) { console.error('chat/conversations', e); res.status(500).json({ success: false, message: e.message }); }
});

router.post('/open', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    const withEmail = req.body.withEmail;
    if (!withEmail) return res.status(400).json({ success: false, message: 'withEmail required' });

    // Validate the contact is allowed for this user
    const sections = await getContacts(me);
    const allowed = allowedEmails(sections);
    if (!allowed.has(lc(withEmail))) return res.status(403).json({ success: false, message: 'You cannot chat with this user.' });

    // Resolve other user's display info from the contacts list
    let other = null;
    sections.forEach(s => s.contacts.forEach(c => { if (lc(c.email) === lc(withEmail)) other = c; }));
    other = other || await resolveUser(withEmail);

    const pairKey = pairKeyOf(me.email, withEmail);
    const existing = await db.collection('chat_conversations').where('pairKey', '==', pairKey).limit(1).get();
    if (!existing.empty) {
      const d = existing.docs[0];
      return res.json({ success: true, conversationId: d.id, other: { email: other.email, name: other.name, role: other.role } });
    }
    const meLc = lc(me.email), otherLc = lc(withEmail);
    const doc = await db.collection('chat_conversations').add({
      participants: [meLc, otherLc].sort(),
      pairKey,
      names: { [meLc]: me.name, [otherLc]: other.name },
      roles: { [meLc]: me.role, [otherLc]: other.role },
      lastMessage: '',
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSender: '',
      unread: { [meLc]: 0, [otherLc]: 0 },
      createdAt: FieldValue.serverTimestamp(),
    });
    res.json({ success: true, conversationId: doc.id, other: { email: other.email, name: other.name, role: other.role } });
  } catch (e) { console.error('chat/open', e); res.status(500).json({ success: false, message: e.message }); }
});

router.get('/messages/:conversationId', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    const meLc = lc(me.email);
    const convRef = db.collection('chat_conversations').doc(req.params.conversationId);
    const conv = await convRef.get();
    if (!conv.exists) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!(conv.data().participants || []).includes(meLc)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const msgSnap = await db.collection('chat_messages').where('conversationId', '==', req.params.conversationId).get();
    const messages = msgSnap.docs.map(d => {
      const m = d.data();
      return {
        id: d.id,
        senderEmail: m.senderEmail,
        senderName: m.senderName,
        text: m.text,
        attachment: m.attachment || null,
        mentions: m.mentions || [],
        mentionsMe: (m.mentions || []).includes(meLc),
        mine: lc(m.senderEmail) === meLc,
        createdAt: m.createdAt?._seconds ? m.createdAt._seconds * 1000 : null,
      };
    }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    // Mark my unread as read (rewrite the whole map — email keys contain dots)
    if ((conv.data().unread || {})[meLc]) {
      const cleared = { ...(conv.data().unread || {}), [meLc]: 0 };
      await convRef.update({ unread: cleared });
    }

    res.json({ success: true, messages });
  } catch (e) { console.error('chat/messages', e); res.status(500).json({ success: false, message: e.message }); }
});

// Lightweight unread summary for the global notifier (no heavy role resolution)
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const meLc = lc(req.user.email);
    const snap = await db.collection('chat_conversations').where('participants', 'array-contains', meLc).get();
    let total = 0;
    const items = [];
    snap.docs.forEach(d => {
      const c = d.data();
      const u = (c.unread && c.unread[meLc]) || 0;
      if (u > 0) {
        const isGroup = c.type === 'group';
        const other = (c.participants || []).find(p => p !== meLc) || '';
        items.push({
          id: d.id,
          unread: u,
          isGroup,
          otherName: isGroup ? (c.name || 'Group') : ((c.names && c.names[other]) || other.split('@')[0]),
          otherRole: isGroup ? 'group' : ((c.roles && c.roles[other]) || ''),
          lastMessage: c.lastMessage || '',
          lastMessageAt: c.lastMessageAt?._seconds ? c.lastMessageAt._seconds * 1000 : 0,
        });
        total += u;
      }
    });
    res.json({ success: true, total, items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Register / refresh this device's push token for the logged-in user (mobile app)
router.post('/push-token', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    const token = (req.body.token || '').toString().trim();
    if (!token) return res.status(400).json({ success: false, message: 'token required' });
    await db.collection('device_tokens').doc(tokenDocId(token)).set({
      email: lc(me.email),
      token,
      platform: (req.body.platform || 'android').toString(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ success: true });
  } catch (e) { console.error('chat/push-token', e); res.status(500).json({ success: false, message: e.message }); }
});

// Remove a device token (on logout)
router.post('/push-token/remove', authMiddleware, async (req, res) => {
  try {
    const token = (req.body.token || '').toString().trim();
    if (token) await db.collection('device_tokens').doc(tokenDocId(token)).delete().catch(() => {});
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    const meLc = lc(me.email);
    const { conversationId, text, attachment } = req.body;
    const hasText = text && text.trim();
    const att = attachment && attachment.url ? {
      url: attachment.url,
      name: (attachment.name || 'file').slice(0, 200),
      type: attachment.type || '',
      kind: attachment.kind === 'image' ? 'image' : 'file',
    } : null;
    if (!conversationId || (!hasText && !att)) return res.status(400).json({ success: false, message: 'conversationId and text/attachment required' });

    const convRef = db.collection('chat_conversations').doc(conversationId);
    const conv = await convRef.get();
    if (!conv.exists) return res.status(404).json({ success: false, message: 'Conversation not found' });
    const participants = conv.data().participants || [];
    if (!participants.includes(meLc)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const trimmed = (text || '').trim().slice(0, 4000);
    const mentions = Array.isArray(req.body.mentions)
      ? [...new Set(req.body.mentions.map(lc).filter(m => participants.includes(m) && m !== meLc))]
      : [];
    const now = FieldValue.serverTimestamp();
    const msg = await db.collection('chat_messages').add({
      conversationId, senderEmail: me.email, senderName: me.name, text: trimmed, attachment: att, mentions, createdAt: now,
    });
    const preview = att ? (att.kind === 'image' ? '📷 Photo' : `📎 ${att.name}`) : trimmed;
    // Rewrite the whole unread map (email keys contain dots, so per-key dot-path
    // updates would be interpreted as nested fields and silently miss the key).
    const newUnread = { ...(conv.data().unread || {}) };
    participants.forEach(p => { if (p !== meLc) newUnread[p] = (newUnread[p] || 0) + 1; });
    if (!(meLc in newUnread)) newUnread[meLc] = 0;
    await convRef.update({
      lastMessage: preview.slice(0, 120),
      lastMessageAt: now,
      lastSender: meLc,
      unread: newUnread,
    });

    // Best-effort push notification to the other participants' devices
    const isGroup = !!conv.data().isGroup;
    const recipients = participants.filter(p => p !== meLc);
    sendPushToEmails(recipients, {
      title: isGroup ? (conv.data().name || 'Group chat') : (me.name || 'New message'),
      body: isGroup ? `${me.name}: ${preview}` : preview,
      data: { type: 'chat', conversationId: conversationId || '' },
    }).catch(() => {});

    res.json({ success: true, id: msg.id });
  } catch (e) { console.error('chat/send', e); res.status(500).json({ success: false, message: e.message }); }
});

// ── Attachment upload (base64 JSON → Firebase Storage) ───────────────────────
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { filename, contentType, base64 } = req.body;
    if (!base64 || !filename) return res.status(400).json({ success: false, message: 'filename and base64 required' });
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 15 * 1024 * 1024) return res.status(413).json({ success: false, message: 'File too large (max 15MB)' });

    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const bucket = admin.storage().bucket();
    const token = uuidv4();
    const safe = filename.replace(/[^\w.\-]+/g, '_');
    const filepath = `chat/${lc(req.user.email)}/${Date.now()}_${safe}`;
    const fileRef = bucket.file(filepath);
    await fileRef.save(buffer, {
      contentType: contentType || 'application/octet-stream',
      resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filepath)}?alt=media&token=${token}`;
    const kind = (contentType || '').startsWith('image/') ? 'image' : 'file';
    res.json({ success: true, url, name: filename, type: contentType || '', kind });
  } catch (e) { console.error('chat/upload', e); res.status(500).json({ success: false, message: e.message }); }
});

// ── Group creation ───────────────────────────────────────────────────────────

// Write a message into a conversation and bump its unread counters — the same
// bookkeeping /send does, reused by the feedback-group flow.
async function postMessage(conversationId, me, text) {
  const meLc = lc(me.email);
  const convRef = db.collection('chat_conversations').doc(conversationId);
  const conv = await convRef.get();
  if (!conv.exists) throw new Error('Conversation not found');
  const participants = conv.data().participants || [];
  const trimmed = String(text || '').trim().slice(0, 4000);
  const now = FieldValue.serverTimestamp();

  await db.collection('chat_messages').add({
    conversationId, senderEmail: me.email, senderName: me.name,
    text: trimmed, attachment: null, mentions: [], createdAt: now,
  });

  const newUnread = { ...(conv.data().unread || {}) };
  participants.forEach(p => { if (p !== meLc) newUnread[p] = (newUnread[p] || 0) + 1; });
  newUnread[meLc] = 0;
  await convRef.update({
    lastMessage: trimmed.slice(0, 120), lastMessageAt: now, lastSender: meLc, unread: newUnread,
  });

  sendPushToEmails(participants.filter(p => p !== meLc), {
    title: conv.data().name || 'Candidate feedback',
    body: `${me.name}: ${trimmed}`.slice(0, 160),
    data: { type: 'chat', conversationId },
  }).catch(() => {});
}

// ── Team head of a recruiter ─────────────────────────────────────────────────
// A recruiter can sit under a coach/expert (an approved coach_team_requests row)
// or under a vendor (vendorEmail on their recruiter_db record). Returns every
// team head found, so a ClientSPOC can see who stands behind a submission.
async function teamHeadsForRecruiter(recEmail) {
  const e = lc(recEmail || '');
  if (!e) return [];
  const heads = {};

  try {
    const snap = await db.collection('coach_team_requests')
      .where('recruiterEmail', '==', e)
      .where('status', '==', 'approved')
      .get();
    for (const d of snap.docs) {
      const ce = lc(d.data().coachEmail || '');
      if (!ce) continue;
      const u = await resolveUser(ce);
      heads[ce] = {
        email: u.email, name: u.name,
        role: u.role === 'expert' ? 'Expert' : 'Coach',
        phone: u.phone || '',
      };
    }
  } catch (_) { /* fall through to the vendor check */ }

  try {
    const rSnap = await db.collection('recruiter_db').where('email', '==', e).limit(1).get();
    if (!rSnap.empty) {
      const ve = lc(rSnap.docs[0].data().vendorEmail || '');
      if (ve && !heads[ve]) {
        const vSnap = await db.collection('admin_db').where('email', '==', ve).limit(1).get();
        const v = vSnap.empty ? {} : vSnap.docs[0].data();
        heads[ve] = {
          email: ve, name: v.name || ve.split('@')[0], role: 'Vendor',
          phone: v.mobile || v.phone || '',
        };
      }
    }
  } catch (_) { /* no vendor */ }

  return Object.values(heads);
}

// GET /api/chat/team-head?email=<recruiter email>
// Used by the ClientSPOC candidate modal to show who the submitter reports to.
router.get('/team-head', authMiddleware, async (req, res) => {
  try {
    const heads = await teamHeadsForRecruiter(req.query.email);
    res.json({ success: true, heads });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/chat/feedback-group
//   { candidateId, candidateName, positionName, posId, recruiterEmail, message }
// One tap from the candidate modal: opens (or reuses) a group with the ClientSPOC,
// the recruiter who submitted, and that recruiter's team head(s), then posts the
// feedback as the first message. Keyed on candidate + SPOC so repeat feedback on
// the same candidate lands in the same thread rather than spawning new groups.
router.post('/feedback-group', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    if (!['clientspoc', 'admin'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Only a ClientSPOC can start a feedback group.' });
    }
    const meLc = lc(me.email);
    const recEmail = lc(req.body?.recruiterEmail || '');
    const message = String(req.body?.message || '').trim();
    const candidateId = String(req.body?.candidateId || '');
    if (!recEmail) return res.status(400).json({ success: false, message: 'recruiterEmail is required' });
    if (!message) return res.status(400).json({ success: false, message: 'Write your feedback first.' });

    const rec = await resolveUser(recEmail);
    const heads = await teamHeadsForRecruiter(recEmail);

    const candidateName = String(req.body?.candidateName || 'Candidate').trim();
    const positionName = String(req.body?.positionName || '').trim();
    const groupName = [candidateName, positionName].filter(Boolean).join(' · ').slice(0, 80);
    const feedbackKey = `${candidateId || groupName}__${meLc}`;

    // Reuse the existing thread for this candidate if there is one.
    const existing = await db.collection('chat_conversations')
      .where('feedbackKey', '==', feedbackKey).limit(1).get();

    let convId;
    if (!existing.empty) {
      convId = existing.docs[0].id;
    } else {
      const parts = { [meLc]: { name: me.name, role: me.role } };
      parts[recEmail] = { name: rec.name || recEmail.split('@')[0], role: rec.role || 'recruiter' };
      heads.forEach(h => { parts[lc(h.email)] = { name: h.name, role: (h.role || '').toLowerCase() }; });

      const participants = Object.keys(parts);
      const names = {}, roles = {}, unread = {};
      participants.forEach(p => { names[p] = parts[p].name; roles[p] = parts[p].role; unread[p] = 0; });

      const doc = await db.collection('chat_conversations').add({
        type: 'group',
        name: groupName || 'Candidate feedback',
        participants, names, roles, unread,
        createdBy: meLc,
        admins: [meLc],
        feedbackKey,
        candidateId: candidateId || '',
        positionId: String(req.body?.posId || ''),
        lastMessage: '',
        lastMessageAt: FieldValue.serverTimestamp(),
        lastSender: '',
        createdAt: FieldValue.serverTimestamp(),
      });
      convId = doc.id;
    }

    await postMessage(convId, me, message);
    const conv = await db.collection('chat_conversations').doc(convId).get();
    res.json({
      success: true,
      conversationId: convId,
      members: (conv.data().participants || []).length,
      teamHeads: heads,
    });
  } catch (e) {
    console.error('chat/feedback-group', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

const GROUP_CREATOR_ROLES = ['coach', 'expert', 'admin', 'clientspoc'];

router.post('/group/create', authMiddleware, async (req, res) => {
  try {
    const me = await resolveUserCached(req.user.email);
    if (!GROUP_CREATOR_ROLES.includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Your role cannot create groups.' });
    }
    const name = (req.body.name || '').trim().slice(0, 80);
    const members = Array.isArray(req.body.members) ? req.body.members : [];
    if (!name) return res.status(400).json({ success: false, message: 'Group name required' });
    if (members.length < 1) return res.status(400).json({ success: false, message: 'Select at least one member' });

    // Validate members against allowed contacts
    const sections = await getContacts(me);
    const allowed = allowedEmails(sections);
    const contactByEmail = {};
    sections.forEach(s => s.contacts.forEach(c => { contactByEmail[lc(c.email)] = c; }));

    const meLc = lc(me.email);
    const partSet = new Set([meLc]);
    const names = { [meLc]: me.name };
    const roles = { [meLc]: me.role };
    const unread = { [meLc]: 0 };
    for (const em of members) {
      const eLc = lc(em);
      if (eLc === meLc) continue;
      if (!allowed.has(eLc)) return res.status(403).json({ success: false, message: `You cannot add ${em} to a group.` });
      const c = contactByEmail[eLc] || await resolveUser(em);
      partSet.add(eLc);
      names[eLc] = c.name || eLc.split('@')[0];
      roles[eLc] = c.role || '';
      unread[eLc] = 0;
    }

    const doc = await db.collection('chat_conversations').add({
      type: 'group',
      name,
      participants: [...partSet],
      names, roles, unread,
      createdBy: meLc,
      admins: [meLc],
      lastMessage: '',
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSender: '',
      createdAt: FieldValue.serverTimestamp(),
    });
    res.json({ success: true, conversationId: doc.id, name });
  } catch (e) { console.error('chat/group/create', e); res.status(500).json({ success: false, message: e.message }); }
});

// ── Conversation meta (for group header / members) ───────────────────────────
router.get('/conversation/:id', authMiddleware, async (req, res) => {
  try {
    const meLc = lc(req.user.email);
    const conv = await db.collection('chat_conversations').doc(req.params.id).get();
    if (!conv.exists) return res.status(404).json({ success: false, message: 'Not found' });
    const c = conv.data();
    if (!(c.participants || []).includes(meLc)) return res.status(403).json({ success: false, message: 'Forbidden' });
    const members = (c.participants || []).map(p => ({ email: p, name: (c.names && c.names[p]) || p.split('@')[0], role: (c.roles && c.roles[p]) || '' }));
    res.json({
      success: true,
      conversation: {
        id: conv.id,
        isGroup: c.type === 'group',
        name: c.type === 'group' ? (c.name || 'Group') : '',
        members,
        createdBy: c.createdBy || '',
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
