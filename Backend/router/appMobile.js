// ─────────────────────────────────────────────────────────────────────────────
// Mobile app support: install tracking + version/update info.
//
//  • POST /api/app/register-install  — the native app reports itself on launch
//    (one doc per device in `app_installs`), so we can count installs.
//  • GET  /api/app/stats            — install counts (admin only).
//  • GET  /api/app/version          — latest APK version + download URL, used by
//    the app to show an "update available" banner.
//  • POST /api/app/version          — superadmin sets the latest version (admin).
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Fallback latest-version info (overridden by the app_config/mobile doc).
const DEFAULT_VERSION = {
  version: '1.0',
  versionCode: 1,
  url: 'https://www.recruiterv.com/downloads/recruiterv.apk',
  notes: '',
  mandatory: false,
};

const isAdmin = async (req) => {
  try {
    const token = req.cookies?.__session || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.SECKEY);
    const email = decoded.email;
    // 1) admin_db (admins / super admins stored there)
    const adminVerify = require('../model_fire/adminCF');
    const r = await adminVerify.checkData(email);
    if (r && r.success) return true;
    // 2) recruiter_db fallback — SuperAdmin lives in recruiter_db
    const { db } = require('./firebase_ad');
    const snap = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
    if (!snap.empty) {
      const u = snap.docs[0].data();
      const rc = (u.roleCategory || u.role || '').toString().toLowerCase();
      if (rc === 'super admin' || rc === 'superadmin') return true;
    }
    return false;
  } catch { return false; }
};

// POST /api/app/register-install — public; called by the native app on launch.
router.post('/register-install', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { deviceId, platform, appVersion, model } = req.body || {};
    if (!deviceId) return res.status(400).json({ success: false, message: 'deviceId required' });
    const id = String(deviceId).slice(0, 200);
    const now = new Date();
    const ref = db.collection('app_installs').doc(id);
    const snap = await ref.get();
    // Best-effort identify the signed-in user (for install→user mapping)
    let userEmail = '';
    try { const t = req.cookies?.__session; if (t) userEmail = (jwt.verify(t, process.env.SECKEY).email || ''); } catch (_) {}
    await ref.set({
      deviceId: id,
      platform: platform || 'android',
      appVersion: appVersion || '',
      model: model || '',
      lastSeen: now,
      lastUserEmail: userEmail || undefined,
      ...(snap.exists ? {} : { firstSeen: now }),
    }, { merge: true });
    return res.json({ success: true, firstInstall: !snap.exists });
  } catch (err) {
    console.error('register-install error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/app/stats — install counts (admin).
router.get('/stats', async (req, res) => {
  try {
    if (!(await isAdmin(req))) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { db } = require('./firebase_ad');
    const snap = await db.collection('app_installs').get();
    const now = Date.now();
    const D30 = 30 * 24 * 60 * 60 * 1000, D7 = 7 * 24 * 60 * 60 * 1000;
    const lc = (s) => (s || '').toString().toLowerCase().trim();

    // Build a lowercased email → user-type map (only the fields we need).
    const typeMap = {};
    const put = (email, t) => { const e = lc(email); if (e && !typeMap[e]) typeMap[e] = t; };
    const recType = (x) => { const rc = lc(x.roleCategory || x.role); if (rc.includes('super') || rc === 'admin') return 'admin'; if (rc === 'coach') return 'coach'; if (rc === 'expert') return 'expert'; return 'recruiter'; };
    const admType = (x) => { const rc = lc(x.roleCategory || x.role); if (rc === 'vendor') return 'vendor'; if (rc.includes('super') || rc === 'admin') return 'admin'; return 'clientspoc'; };
    try {
      const [recS, coS, exS, adS] = await Promise.all([
        db.collection('recruiter_db').select('email', 'roleCategory', 'role').get(),
        db.collection('coach_db').select('email').get(),
        db.collection('expert_db').select('email').get(),
        db.collection('admin_db').select('email', 'roleCategory', 'role').get(),
      ]);
      recS.docs.forEach(d => put(d.data().email, recType(d.data())));
      coS.docs.forEach(d => put(d.data().email, 'coach'));
      exS.docs.forEach(d => put(d.data().email, 'expert'));
      adS.docs.forEach(d => put(d.data().email, admType(d.data())));
    } catch (e) { console.error('app/stats type map error:', e.message); }

    let total = 0, active30 = 0, active7 = 0;
    const byPlatform = {};
    const blank = () => ({ total: 0, active: 0 });
    const byType = { recruiter: blank(), coach: blank(), clientspoc: blank(), expert: blank(), vendor: blank(), admin: blank(), unknown: blank() };
    snap.docs.forEach(d => {
      const x = d.data();
      total++;
      const ms = x.lastSeen?._seconds ? x.lastSeen._seconds * 1000 : 0;
      const isActive30 = ms && now - ms <= D30;
      if (isActive30) active30++;
      if (ms && now - ms <= D7) active7++;
      const p = x.platform || 'android';
      byPlatform[p] = (byPlatform[p] || 0) + 1;
      const t = typeMap[lc(x.lastUserEmail)] || 'unknown';
      byType[t].total++;
      if (isActive30) byType[t].active++;
    });
    return res.json({ success: true, total, active30, active7, byPlatform, byType });
  } catch (err) {
    console.error('app/stats error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/app/version — latest version info (public).
router.get('/version', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const doc = await db.collection('app_config').doc('mobile').get();
    const data = doc.exists ? { ...DEFAULT_VERSION, ...doc.data() } : DEFAULT_VERSION;
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.json({ success: true, ...DEFAULT_VERSION });
  }
});

// POST /api/app/version — set latest version info (admin).
router.post('/version', async (req, res) => {
  try {
    if (!(await isAdmin(req))) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { db } = require('./firebase_ad');
    const { version, versionCode, url, notes, mandatory } = req.body || {};
    const payload = {
      ...(version !== undefined && { version: String(version) }),
      ...(versionCode !== undefined && { versionCode: Number(versionCode) }),
      ...(url !== undefined && { url: String(url) }),
      ...(notes !== undefined && { notes: String(notes) }),
      ...(mandatory !== undefined && { mandatory: !!mandatory }),
      updatedAt: new Date(),
    };
    await db.collection('app_config').doc('mobile').set(payload, { merge: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('app/version POST error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── LinkedIn auto-post configuration (admin) ─────────────────────────────────
// GET  /api/app/linkedin-config — current status (token never returned in full)
router.get('/linkedin-config', async (req, res) => {
  try {
    if (!(await isAdmin(req))) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { db } = require('./firebase_ad');
    const doc = await db.collection('app_config').doc('linkedin').get();
    const c = doc.exists ? doc.data() : {};
    return res.json({
      success: true,
      enabled: !!c.enabled,
      orgId: c.orgId || '',
      hasToken: !!c.accessToken,
      tokenPreview: c.accessToken ? `…${String(c.accessToken).slice(-6)}` : '',
      lastPostAt: c.lastPostAt || null,
      lastPostId: c.lastPostId || '',
      lastPostPosId: c.lastPostPosId || '',
    });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/app/linkedin-config — set { enabled, accessToken?, orgId? }
router.post('/linkedin-config', async (req, res) => {
  try {
    if (!(await isAdmin(req))) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { db } = require('./firebase_ad');
    const { enabled, accessToken, orgId } = req.body || {};
    const payload = { updatedAt: new Date() };
    if (enabled !== undefined) payload.enabled = !!enabled;
    if (accessToken) payload.accessToken = String(accessToken).trim();
    if (orgId !== undefined) payload.orgId = String(orgId).replace(/\D/g, '');
    await db.collection('app_config').doc('linkedin').set(payload, { merge: true });
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

// ── LinkedIn OAuth (one-time page-admin authorization) ───────────────────────
const LI_REDIRECT = 'https://www.recruiterv.com/api/app/linkedin/callback';

// GET /api/app/linkedin/auth — redirects the browser to LinkedIn's consent page.
router.get('/linkedin/auth', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const doc = await db.collection('app_config').doc('linkedin').get();
    const c = doc.exists ? doc.data() : {};
    if (!c.clientId) return res.status(400).send('LinkedIn clientId not configured.');
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await db.collection('app_config').doc('linkedin').set({ oauthState: state }, { merge: true });
    // Scope is configurable so we can adjust without a redeploy. Default to just
    // w_organization_social (post as the company page) — the org id is provided
    // manually, so we don't need rw_organization_admin for auto-detection.
    const scope = (c.scope || 'w_organization_social').trim();
    const url = 'https://www.linkedin.com/oauth/v2/authorization' +
      `?response_type=code&client_id=${encodeURIComponent(c.clientId)}` +
      `&redirect_uri=${encodeURIComponent(LI_REDIRECT)}` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(scope)}`;
    return res.redirect(url);
  } catch (err) { return res.status(500).send('Error: ' + err.message); }
});

// GET /api/app/linkedin/callback — exchanges the code, stores the token, and
// auto-detects the organization id the signed-in member administers.
router.get('/linkedin/callback', async (req, res) => {
  const page = (title, body, ok) => res.send(`<!doctype html><html><body style="font-family:system-ui;max-width:560px;margin:60px auto;padding:0 20px">
    <h2 style="color:${ok ? '#16a34a' : '#dc2626'}">${title}</h2><div style="color:#374151;line-height:1.6">${body}</div></body></html>`);
  try {
    const { db } = require('./firebase_ad');
    const { code, state, error, error_description } = req.query;
    if (error) return page('LinkedIn authorization failed', `${error}: ${error_description || ''}<br/><br/>If the error mentions scope, the app is missing the <b>Community Management API</b> product.`, false);
    const doc = await db.collection('app_config').doc('linkedin').get();
    const c = doc.exists ? doc.data() : {};
    if (!c.clientId || !c.clientSecret) return page('Not configured', 'clientId/clientSecret missing.', false);
    if (!state || state !== c.oauthState) return page('Invalid state', 'Please restart from /api/app/linkedin/auth.', false);

    // Exchange authorization code → access token
    const tokenResp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        redirect_uri: LI_REDIRECT,
        client_id: c.clientId, client_secret: c.clientSecret,
      }),
    });
    const tok = await tokenResp.json();
    if (!tokenResp.ok || !tok.access_token) return page('Token exchange failed', JSON.stringify(tok).slice(0, 400), false);

    // Auto-detect administered organizations
    let orgId = c.orgId || '';
    let orgNames = [];
    try {
      const aclResp = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED', {
        headers: { 'Authorization': `Bearer ${tok.access_token}`, 'X-Restli-Protocol-Version': '2.0.0' },
      });
      const acl = await aclResp.json();
      const orgs = (acl.elements || []).map(e => (e.organization || '').split(':').pop()).filter(Boolean);
      if (orgs.length) orgId = orgs[0];
      // Resolve names for display
      for (const id of orgs.slice(0, 5)) {
        try {
          const oResp = await fetch(`https://api.linkedin.com/v2/organizations/${id}`, {
            headers: { 'Authorization': `Bearer ${tok.access_token}`, 'X-Restli-Protocol-Version': '2.0.0' },
          });
          const o = await oResp.json();
          orgNames.push(`${o.localizedName || id} (id ${id})`);
        } catch (_) { orgNames.push(`id ${id}`); }
      }
    } catch (_) { /* org detection is best-effort */ }

    await db.collection('app_config').doc('linkedin').set({
      accessToken: tok.access_token,
      tokenExpiresAt: new Date(Date.now() + (tok.expires_in || 5184000) * 1000),
      ...(orgId ? { orgId } : {}),
      enabled: !!orgId,
      oauthState: '',
      updatedAt: new Date(),
    }, { merge: true });

    return page('✓ LinkedIn connected',
      `Access token stored (expires in ~${Math.round((tok.expires_in || 5184000) / 86400)} days).<br/>` +
      (orgId
        ? `Auto-posting is now <b>enabled</b> for organization <b>${orgNames[0] || orgId}</b>.<br/>${orgNames.length > 1 ? 'Other pages you admin: ' + orgNames.slice(1).join(', ') : ''}<br/><br/>Every new position will now be posted to the page automatically.`
        : `Could not auto-detect your organization id — set it via /api/app/linkedin-config, then enable.`),
      true);
  } catch (err) { return page('Error', err.message, false); }
});

// POST /api/app/linkedin-test — publish a test post to verify the integration
router.post('/linkedin-test', async (req, res) => {
  try {
    if (!(await isAdmin(req))) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { postPositionToLinkedIn } = require('../utils/linkedinPost');
    const result = await postPositionToLinkedIn({
      pos_id: 'test',
      position: 'RecruiterV LinkedIn Integration Test',
      client: '',
      location: [],
      experience: '',
    });
    return res.json({ success: result.posted, ...result });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
