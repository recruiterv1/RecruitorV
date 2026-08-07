/**
 * CV-match evaluation endpoints (ClientSPOC / Admin).
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const { runMatchEvaluation } = require('../utils/cvMatch');

const lc = (s) => (s || '').toString().toLowerCase().trim();

function authMiddleware(req, res, next) {
  const token = req.cookies.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch { return res.status(403).json({ success: false, message: 'Invalid token' }); }
}

// Render a .docx CV as HTML so it can be previewed in-app (the public Office
// viewer can't reliably fetch Firebase Storage URLs). PDFs are handled by the
// browser directly, so this is only used for Word documents.
router.get('/preview', authMiddleware, async (req, res) => {
  try {
    const url = (req.query.url || '').toString();
    if (!url) return res.status(400).json({ success: false, message: 'Missing url' });

    // SSRF guard — only allow Firebase / Google Storage URLs
    let host = '';
    try { host = new URL(url).hostname; } catch { return res.status(400).json({ success: false, message: 'Invalid url' }); }
    if (!/(^|\.)googleapis\.com$/.test(host)) {
      return res.status(403).json({ success: false, message: 'URL not allowed' });
    }

    const isDocx = /\.docx(\?|$)/i.test(url);
    if (!isDocx) return res.json({ success: true, type: 'redirect', url });

    const resp = await fetch(url);
    if (!resp.ok) return res.status(404).json({ success: false, message: 'CV file not found' });
    const buf = Buffer.from(await resp.arrayBuffer());

    const mammoth = require('mammoth');
    const out = await mammoth.convertToHtml({ buffer: buf });
    return res.json({ success: true, type: 'html', html: out.value || '<p>(empty document)</p>' });
  } catch (e) {
    console.error('cv-match/preview', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Evaluate a single candidate by id
router.post('/evaluate/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await db.collection('candidate_db').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Candidate not found' });
    const result = await runMatchEvaluation({ candidateId: doc.id, candidate: doc.data() });
    if (!result.ok) {
      if (result.reason === 'service-error') {
        return res.status(503).json({ success: false, message: `AI evaluation service unavailable: ${result.message || 'please try again later'}` });
      }
      return res.status(422).json({ success: false, message: result.reason === 'no-score' ? 'Could not read CV (PDF required)' : result.reason });
    }
    res.json({ success: true, ...result });
  } catch (e) { console.error('cv-match/evaluate', e); res.status(500).json({ success: false, message: e.message }); }
});

// Evaluate pending direct applications for the logged-in ClientSPOC's positions
router.post('/evaluate-batch', authMiddleware, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const limit = Math.min(Number(req.body?.limit) || 6, 10);

    // ClientSPOC's positions (case-insensitive)
    const posSnap = await db.collection('admin_AddPos').get();
    const myPosIds = new Set(posSnap.docs.map(d => d.data()).filter(p => lc(p.clientspoc) === email).map(p => p.pos_id).filter(Boolean));
    if (myPosIds.size === 0) return res.json({ success: true, evaluated: [], remaining: 0 });

    // Direct applications on those positions without a match score yet
    const pending = [];
    const ids = [...myPosIds];
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      const snap = await db.collection('candidate_db').where('pos_id', 'in', batch).get();
      snap.docs.forEach(d => {
        const c = d.data();
        if (
          c.source === 'direct_apply' &&
          (c.matchPercent === undefined || c.matchPercent === null) &&
          !c.matchEvaluated &&                       // never attempted before
          (c.cv_data || c.cv_url)
        ) {
          pending.push({ id: d.id });
        }
      });
    }

    const toRun = pending.slice(0, limit);
    const evaluated = [];
    for (const p of toRun) {
      const r = await runMatchEvaluation({ candidateId: p.id });
      evaluated.push({ id: p.id, ...r });
    }
    res.json({ success: true, evaluated, remaining: Math.max(0, pending.length - toRun.length) });
  } catch (e) { console.error('cv-match/evaluate-batch', e); res.status(500).json({ success: false, message: e.message }); }
});

// Evaluate pending direct applicants for the logged-in RECRUITER's shared-link applications.
// Same Match% + auto-reject (≤50%) + candidate email behaviour as the ClientSPOC batch.
router.post('/evaluate-batch-recruiter', authMiddleware, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const limit = Math.min(Number(req.body?.limit) || 6, 10);

    // Direct applicants who applied via this recruiter's shared link (recEmail stored lowercased)
    const snap = await db.collection('candidate_db').where('recEmail', '==', email).get();
    const pending = [];
    snap.docs.forEach(d => {
      const c = d.data();
      if (
        c.source === 'direct_apply' &&
        (c.matchPercent === undefined || c.matchPercent === null) &&
        !c.matchEvaluated &&
        (c.cv_data || c.cv_url)
      ) {
        pending.push({ id: d.id });
      }
    });

    const toRun = pending.slice(0, limit);
    const evaluated = [];
    for (const p of toRun) {
      const r = await runMatchEvaluation({ candidateId: p.id });
      evaluated.push({ id: p.id, ...r });
    }
    res.json({ success: true, evaluated, remaining: Math.max(0, pending.length - toRun.length) });
  } catch (e) { console.error('cv-match/evaluate-batch-recruiter', e); res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
