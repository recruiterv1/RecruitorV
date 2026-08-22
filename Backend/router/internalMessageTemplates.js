/**
 * SuperAdmin Internal Message Template designer.
 *
 * Four in-app events can send an automatic chat message. The wording lives in
 * Firestore (`internal_message_templates`, doc id = trigger key) and only goes
 * out once a SuperAdmin switches the template live — so making a template live
 * is what turns each notification on.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const {
  TRIGGERS, TRIGGER_MAP, substitute, sendInternalMessage,
  AUDIENCES, AUDIENCE_MAP, CUSTOM_VARIABLES, CUSTOM_VARIABLE_GROUPS,
  ROLE_TYPES, ROLE_MAP, TEMPLATE_EVENTS, EVENT_MAP,
  audienceMembers, varsFor,
} = require('../utils/internalMessage');

const lc = (s) => (s || '').toString().toLowerCase().trim();
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

// GET /api/internal-templates — every trigger with its saved template (if any).
router.get('/', managerAuth, async (req, res) => {
  try {
    const docs = await Promise.all(TRIGGERS.map(t =>
      db.collection('internal_message_templates').doc(t.key).get()));
    const saved = {};
    docs.forEach(d => { if (d.exists) saved[d.id] = d.data(); });

    const templates = TRIGGERS.map(t => {
      const s = saved[t.key] || {};
      return {
        ...t,
        body: s.body || '',
        enabled: s.enabled === true,
        exists: !!saved[t.key],
        updatedAt: s.updatedAt?.toDate?.()?.toISOString?.() || null,
        updatedBy: s.updatedBy || '',
      };
    });
    // Templates the SuperAdmin wrote themselves. These have no event to fire on,
    // so they are sent by hand from the designer.
    const customSnap = await db.collection('internal_message_templates')
      .where('custom', '==', true).get();
    const custom = customSnap.docs.map(d => {
      const c = d.data();
      return {
        key: d.id, name: c.name || 'Untitled', body: c.body || '',
        senderRole: c.senderRole || '', recipientRole: c.recipientRole || '',
        event: c.event || 'manual',
        enabled: c.enabled === true,
        audience: c.audience || 'recruiters',
        recipients: Array.isArray(c.recipients) ? c.recipients : [],
        custom: true,
        updatedAt: c.updatedAt?.toDate?.()?.toISOString?.() || null,
        updatedBy: c.updatedBy || '',
        lastSentAt: c.lastSentAt?.toDate?.()?.toISOString?.() || null,
        lastSentCount: c.lastSentCount || 0,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true, templates, custom,
      audiences: AUDIENCES.map(({ key, label }) => ({ key, label })),
      customVariables: CUSTOM_VARIABLES,
      variableGroups: CUSTOM_VARIABLE_GROUPS,
      roles: ROLE_TYPES.map(({ key, label }) => ({ key, label })),
      events: TEMPLATE_EVENTS.map(({ key, label, sender, recipient, variables }) =>
        ({ key, label, sender, recipient, variables })),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/internal-templates/:key  { body, enabled }
router.put('/:key', managerAuth, async (req, res) => {
  try {
    const trigger = TRIGGER_MAP[req.params.key];
    if (!trigger) return res.status(404).json({ success: false, message: 'Unknown trigger' });

    const body = String(req.body?.body || '').trim();
    const enabled = req.body?.enabled === true;
    if (enabled && !body) {
      return res.status(400).json({ success: false, message: 'Write the message before making it live.' });
    }

    const { FieldValue } = require('firebase-admin/firestore');
    await db.collection('internal_message_templates').doc(trigger.key).set({
      key: trigger.key, name: trigger.name, body, enabled,
      updatedAt: FieldValue.serverTimestamp(), updatedBy: req.managerEmail,
    }, { merge: true });

    res.json({
      success: true,
      message: enabled ? 'Template is live — this notification will now be sent.' : 'Saved. Not live yet.',
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/internal-templates/:key/preview  { body }
// Renders against the trigger's sample values, without sending anything.
router.post('/:key/preview', managerAuth, (req, res) => {
  const trigger = TRIGGER_MAP[req.params.key];
  if (!trigger) return res.status(404).json({ success: false, message: 'Unknown trigger' });
  res.json({ success: true, preview: substitute(req.body?.body || '', trigger.sample) });
});

// POST /api/internal-templates/:key/test  { body }
// Sends the rendered sample to the SuperAdmin's own Messages inbox.
router.post('/:key/test', managerAuth, async (req, res) => {
  try {
    const trigger = TRIGGER_MAP[req.params.key];
    if (!trigger) return res.status(404).json({ success: false, message: 'Unknown trigger' });
    const text = substitute(req.body?.body || '', trigger.sample).trim();
    if (!text) return res.status(400).json({ success: false, message: 'Nothing to send.' });
    // Sent from RecruiterV support so it appears as an incoming message.
    const ok = await sendInternalMessage({
      fromEmail: 'support@recruiterv.com', toEmail: req.managerEmail, text: `[TEST] ${text}`,
    });
    res.json({ success: ok, message: ok ? 'Test message sent to your Messages inbox.' : 'Could not send the test message.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});


// ── Custom templates ─────────────────────────────────────────────────────────

const slugKey = (name) =>
  'custom_' + lc(name).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
  + '_' + Date.now().toString(36);

// POST /api/internal-templates/custom  { name, body, audience, recipients }
router.post('/custom', managerAuth, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 80);
    const body = String(req.body?.body || '').trim();
    const senderRole = ROLE_MAP[req.body?.senderRole] ? req.body.senderRole : '';
    const recipientRole = ROLE_MAP[req.body?.recipientRole] ? req.body.recipientRole : '';
    const event = EVENT_MAP[req.body?.event] ? req.body.event : 'manual';
    const audience = AUDIENCE_MAP[req.body?.audience] ? req.body.audience : 'recruiters';
    const recipients = Array.isArray(req.body?.recipients)
      ? req.body.recipients.map(e => lc(e)).filter(Boolean) : [];
    if (!name) return res.status(400).json({ success: false, message: 'Give the template a title.' });
    if (!body) return res.status(400).json({ success: false, message: 'Write the message.' });
    if (!recipientRole) return res.status(400).json({ success: false, message: 'Choose who receives this message.' });
    if (!senderRole) return res.status(400).json({ success: false, message: 'Choose who it comes from.' });

    const { FieldValue } = require('firebase-admin/firestore');
    const key = slugKey(name);
    await db.collection('internal_message_templates').doc(key).set({
      key, name, body, senderRole, recipientRole, event, audience, recipients,
      custom: true, enabled: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.managerEmail,
    });
    res.json({ success: true, key, message: 'Template created.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/internal-templates/custom/:key
router.put('/custom/:key', managerAuth, async (req, res) => {
  try {
    const ref = db.collection('internal_message_templates').doc(req.params.key);
    const doc = await ref.get();
    if (!doc.exists || doc.data().custom !== true) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    const name = String(req.body?.name || '').trim().slice(0, 80);
    const body = String(req.body?.body || '').trim();
    if (!name || !body) return res.status(400).json({ success: false, message: 'Title and message are both required.' });

    const { FieldValue } = require('firebase-admin/firestore');
    await ref.set({
      name, body,
      senderRole: ROLE_MAP[req.body?.senderRole] ? req.body.senderRole : (doc.data().senderRole || ''),
      recipientRole: ROLE_MAP[req.body?.recipientRole] ? req.body.recipientRole : (doc.data().recipientRole || ''),
      event: EVENT_MAP[req.body?.event] ? req.body.event : (doc.data().event || 'manual'),
      enabled: req.body?.enabled === true,
      audience: AUDIENCE_MAP[req.body?.audience] ? req.body.audience : (doc.data().audience || 'recruiters'),
      recipients: Array.isArray(req.body?.recipients) ? req.body.recipients.map(e => lc(e)).filter(Boolean) : [],
      updatedAt: FieldValue.serverTimestamp(), updatedBy: req.managerEmail,
    }, { merge: true });
    res.json({ success: true, message: 'Saved.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/internal-templates/custom/:key
router.delete('/custom/:key', managerAuth, async (req, res) => {
  try {
    const ref = db.collection('internal_message_templates').doc(req.params.key);
    const doc = await ref.get();
    if (!doc.exists || doc.data().custom !== true) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    await ref.delete();
    res.json({ success: true, message: 'Template deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/internal-templates/custom/:key/audience — how many people this would
// reach, so the count can be shown before anything is sent.
router.get('/custom/:key/audience', managerAuth, async (req, res) => {
  try {
    const doc = await db.collection('internal_message_templates').doc(req.params.key).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Template not found.' });
    const c = doc.data();
    const people = await audienceMembers(c.audience, c.recipients || []);
    res.json({
      success: true, count: people.length,
      sample: people.slice(0, 5).map(p => p.name || p.email),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/internal-templates/custom/:key/send  { confirm: true, offset }
// Delivers to the audience in chunks. Each call sends up to CHUNK recipients and
// returns the next offset, so a 1,700-person audience never blocks one long
// request and the sender sees progress. `confirm` is required so a stray call
// can never message everyone.
const SEND_CHUNK = 150;

router.post('/custom/:key/send', managerAuth, async (req, res) => {
  try {
    if (req.body?.confirm !== true) {
      return res.status(400).json({ success: false, message: 'Confirmation required.' });
    }
    const ref = db.collection('internal_message_templates').doc(req.params.key);
    const doc = await ref.get();
    if (!doc.exists || doc.data().custom !== true) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    const c = doc.data();
    // A role-pair template goes to everyone holding the recipient role, unless
    // specific emails were entered.
    const audienceKey = (c.audience === 'custom')
      ? 'custom'
      : ({ recruiter: 'recruiters', coach: 'coaches', expert: 'experts',
           vendor: 'vendors', clientspoc: 'clientspocs' }[c.recipientRole] || c.audience);
    const people = await audienceMembers(audienceKey, c.recipients || []);
    if (!people.length) return res.status(400).json({ success: false, message: 'Nobody holds that role yet.' });

    // Who the message comes from, for {{senderName}} / {{senderEmail}}.
    const { personFrom } = require('../utils/internalMessage');
    let senderInfo = { name: 'RecruiterV', email: req.managerEmail };
    try {
      for (const col of ['admin_db', 'recruiter_db']) {
        const snap = await db.collection(col).where('email', '==', lc(req.managerEmail)).limit(1).get();
        if (!snap.empty) { senderInfo = personFrom(snap.docs[0].data()); break; }
      }
    } catch (_) { /* fall back to the email alone */ }

    const offset = Math.max(0, parseInt(req.body?.offset, 10) || 0);
    const slice = people.slice(offset, offset + SEND_CHUNK);

    let sent = 0, failed = 0;
    // Ten at a time — this writes two documents per recipient and must not
    // stampede Firestore.
    for (let i = 0; i < slice.length; i += 10) {
      const results = await Promise.all(slice.slice(i, i + 10).map(p =>
        sendInternalMessage({
          fromEmail: req.managerEmail,
          toEmail: p.email,
          text: substitute(c.body, varsFor(p, senderInfo)),
        }).catch(() => false)));
      results.forEach(ok => (ok ? sent++ : failed++));
    }

    const nextOffset = offset + slice.length;
    const done = nextOffset >= people.length;

    const { FieldValue } = require('firebase-admin/firestore');
    if (done) {
      await ref.set({
        lastSentAt: FieldValue.serverTimestamp(),
        lastSentCount: people.length, lastSentBy: req.managerEmail,
      }, { merge: true });
    }

    res.json({
      success: true, sent, failed, total: people.length,
      nextOffset: done ? null : nextOffset, done,
      message: done
        ? `Sent to ${people.length} ${people.length === 1 ? 'person' : 'people'}${failed ? `, ${failed} failed` : ''}.`
        : `Sent ${nextOffset} of ${people.length}…`,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
