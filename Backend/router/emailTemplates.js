/**
 * SuperAdmin Email Template Designer endpoints.
 * Templates live in Firestore (email_templates). Code "system" templates come
 * from utils/emailTemplates and are wired to triggers; admins can also create
 * their own "custom" templates (stored entirely in the DB).
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const { TEMPLATES, TEMPLATE_MAP, substitute, RECIPIENT_OPTIONS, VARIABLE_CATALOG } = require('../utils/emailTemplates');
const { sendEmailFull } = require('../utils/email');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const MANAGER_ROLES = ['superadmin', 'super admin', 'admin'];

// Unique {{variables}} found in subject + body.
const detectVars = (subject, body) => {
  const set = new Set();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let m;
  for (const s of [subject || '', body || '']) { re.lastIndex = 0; while ((m = re.exec(s))) set.add(m[1]); }
  return [...set];
};

const slugKey = (name) =>
  'custom_' + lc(name).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) + '_' + Date.now().toString(36);

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

// GET /meta — recipient options + master variable catalog (for the designer).
router.get('/meta', managerAuth, (req, res) => {
  res.json({ success: true, recipients: RECIPIENT_OPTIONS, variables: VARIABLE_CATALOG });
});

// GET /list — system templates (with override state) + custom templates.
router.get('/list', managerAuth, async (req, res) => {
  try {
    const snap = await db.collection('email_templates').get();
    const overrides = {};
    snap.docs.forEach(d => { overrides[d.id] = d.data(); });
    const list = TEMPLATES.map(t => {
      const o = overrides[t.key] || {};
      return {
        key: t.key, name: t.name, recipient: t.recipient,
        subject: o.subject || t.subject, variables: t.variables,
        enabled: !!o.enabled, customized: !!overrides[t.key], custom: false,
        updatedAt: o.updatedAt || null,
      };
    });
    // Custom (admin-created) templates — DB docs with no code default.
    Object.values(overrides).forEach(o => {
      if (o.custom && !TEMPLATE_MAP[o.key]) {
        list.push({
          key: o.key, name: o.name || o.key, recipient: o.recipient || 'Custom',
          subject: o.subject || '', variables: o.variables || detectVars(o.subject, o.htmlBody),
          enabled: !!o.enabled, customized: true, custom: true, updatedAt: o.updatedAt || null,
        });
      }
    });
    res.json({ success: true, templates: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /:key — full editable template (system or custom).
router.get('/:key', managerAuth, async (req, res) => {
  try {
    const doc = await db.collection('email_templates').doc(req.params.key).get();
    const o = doc.exists ? doc.data() : {};
    const def = TEMPLATE_MAP[req.params.key];
    if (!def && !doc.exists) return res.status(404).json({ success: false, message: 'Unknown template' });
    if (def) {
      return res.json({ success: true, template: {
        key: def.key, name: def.name, recipient: def.recipient, custom: false,
        subject: o.subject || def.subject, htmlBody: o.htmlBody || def.body,
        variables: def.variables, sample: def.sample || {}, enabled: !!o.enabled,
        customized: doc.exists, defaultSubject: def.subject, defaultBody: def.body,
      } });
    }
    // custom
    res.json({ success: true, template: {
      key: o.key, name: o.name || o.key, recipient: o.recipient || 'Custom', custom: true,
      subject: o.subject || '', htmlBody: o.htmlBody || '',
      variables: o.variables || detectVars(o.subject, o.htmlBody), sample: o.sample || {},
      enabled: !!o.enabled, customized: true,
    } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /create — create a new custom template.
router.post('/create', managerAuth, async (req, res) => {
  try {
    const { name, recipient, subject, htmlBody } = req.body || {};
    if (!(name || '').trim()) return res.status(400).json({ success: false, message: 'Template name is required.' });
    if (!(htmlBody || '').trim()) return res.status(400).json({ success: false, message: 'Template body is required.' });
    const key = slugKey(name);
    const variables = detectVars(subject, htmlBody);
    await db.collection('email_templates').doc(key).set({
      key, name: name.trim(), recipient: (recipient || 'Custom').trim(),
      subject: (subject || '').toString(), htmlBody: (htmlBody || '').toString(),
      variables, custom: true, enabled: true,
      updatedAt: new Date(), updatedBy: req.managerEmail,
    });
    res.json({ success: true, key });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /:key — save subject / htmlBody / enabled (and name/recipient for custom).
router.put('/:key', managerAuth, async (req, res) => {
  try {
    const def = TEMPLATE_MAP[req.params.key];
    const doc = await db.collection('email_templates').doc(req.params.key).get();
    if (!def && !doc.exists) return res.status(404).json({ success: false, message: 'Unknown template' });
    const { subject, htmlBody, enabled, name, recipient } = req.body || {};
    if (enabled && !(htmlBody || '').trim()) {
      return res.status(400).json({ success: false, message: 'Body is required to enable a template.' });
    }
    const isCustom = !def;
    const payload = {
      key: req.params.key,
      subject: (subject || '').toString(),
      htmlBody: (htmlBody || '').toString(),
      enabled: !!enabled,
      updatedAt: new Date(), updatedBy: req.managerEmail,
    };
    if (isCustom) {
      payload.custom = true;
      if (name !== undefined) payload.name = name.toString().trim();
      if (recipient !== undefined) payload.recipient = recipient.toString().trim();
      payload.variables = detectVars(subject, htmlBody);
    }
    await db.collection('email_templates').doc(req.params.key).set(payload, { merge: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /:key/reset — system templates revert to code default (delete override).
router.post('/:key/reset', managerAuth, async (req, res) => {
  try {
    if (!TEMPLATE_MAP[req.params.key]) {
      return res.status(400).json({ success: false, message: 'Custom templates cannot be reset — delete them instead.' });
    }
    await db.collection('email_templates').doc(req.params.key).delete().catch(() => {});
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /:key — delete a custom template (system templates use reset instead).
router.delete('/:key', managerAuth, async (req, res) => {
  try {
    if (TEMPLATE_MAP[req.params.key]) {
      return res.status(400).json({ success: false, message: 'System templates cannot be deleted — use reset.' });
    }
    await db.collection('email_templates').doc(req.params.key).delete().catch(() => {});
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /:key/test — send a test email using the current/draft body + sample vars.
router.post('/:key/test', managerAuth, async (req, res) => {
  try {
    const def = TEMPLATE_MAP[req.params.key];
    const doc = await db.collection('email_templates').doc(req.params.key).get();
    if (!def && !doc.exists) return res.status(404).json({ success: false, message: 'Unknown template' });
    const to = (req.body?.to || req.managerEmail || '').toString().trim();
    if (!to) return res.status(400).json({ success: false, message: 'Recipient email required.' });
    const o = doc.exists ? doc.data() : {};
    const subject = req.body?.subject || o.subject || def?.subject || 'Test email';
    const htmlBody = req.body?.htmlBody || o.htmlBody || def?.body || '';
    const sample = def?.sample || o.sample || {};
    const vars = { ...sample, ...(req.body?.vars || {}) };
    await sendEmailFull({ to, subject: '[TEST] ' + substitute(subject, vars), htmlContent: substitute(htmlBody, vars) });
    res.json({ success: true, message: 'Test email sent to ' + to });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
