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
const { TRIGGERS, TRIGGER_MAP, substitute, sendInternalMessage } = require('../utils/internalMessage');

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
    res.json({ success: true, templates });
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

module.exports = router;
