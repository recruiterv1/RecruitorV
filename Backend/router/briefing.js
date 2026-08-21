// Position briefings — a coach, expert or vendor records one briefing per
// position, and only the recruiters on THEIR OWN team can read or hear it.
//
// This replaces the earlier six-question form. Authors now write a single
// natural briefing; the five areas below are prompts, and coverage is detected
// from what they wrote rather than being six separate inputs.
//
// Stored in `position_coach_briefing`, doc id `${positionId}__${authorEmail}`.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

function authMiddleware(req, res, next) {
  const token = req.cookies.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.SECKEY);
    next();
  } catch (_) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

// The five areas an author is prompted to think about. `match` drives automatic
// coverage detection — an area counts as covered when the briefing mentions at
// least two of its terms, which is a deliberately loose signal: coverage is
// guidance for the author, never a gate on saving.
const BRIEFING_AREAS = [
  {
    key: 'requirement', icon: '🎯', n: '01',
    title: 'Understand the Real Requirement',
    prompt: 'What should recruiters understand beyond the JD?',
    match: ['requirement', 'jd', 'role', 'actually', 'really', 'looking for', 'must have',
      'background', 'profile', 'experience', 'client wants', 'expectation', 'mandate'],
  },
  {
    key: 'sourcing', icon: '🔎', n: '02',
    title: 'Sourcing & Head-hunting Strategy',
    prompt: 'Where should recruiters find the right candidates?',
    match: ['source', 'sourcing', 'headhunt', 'head-hunt', 'target', 'competitor', 'company',
      'linkedin', 'naukri', 'referral', 'portal', 'market', 'talent pool', 'poach', 'search'],
  },
  {
    key: 'watchouts', icon: '⚠️', n: '03',
    title: 'Hiring Watch-outs',
    prompt: 'What could make this position difficult to close?',
    match: ['watch', 'avoid', 'careful', 'difficult', 'challenge', 'risk', 'reject', 'issue',
      'problem', 'budget', 'notice period', 'location', 'constraint', 'red flag', 'do not'],
  },
  {
    key: 'assess', icon: '✅', n: '04',
    title: 'Assess & Decide',
    prompt: 'How should recruiters decide whether a candidate is worth submitting?',
    match: ['assess', 'evaluate', 'screen', 'check', 'ask', 'question', 'judge', 'decide',
      'submit', 'shortlist', 'criteria', 'benchmark', 'validate', 'probe'],
  },
  {
    key: 'engage', icon: '🤝', n: '05',
    title: 'Engage & Close',
    prompt: 'How should recruiters keep the candidate interested?',
    match: ['engage', 'close', 'pitch', 'sell', 'convince', 'follow up', 'followup', 'interest',
      'offer', 'counter', 'negotiat', 'growth', 'career', 'motivat', 'keep warm'],
  },
];

const AREA_KEYS = BRIEFING_AREAS.map(a => a.key);

const countWords = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

function detectCoverage(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return [];
  return BRIEFING_AREAS
    .filter(a => a.match.filter(m => t.includes(m)).length >= 2)
    .map(a => a.key);
}

// Spoken audio runs at roughly 150 words a minute; used for the duration shown
// against a ready briefing.
const estimateSeconds = (words) => Math.max(15, Math.round((Number(words) || 0) / 150 * 60));

const fmtDuration = (secs) => {
  const s = Math.max(0, Math.round(secs || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const toDate = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000);
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// ── Who is calling, and what may they brief on? ───────────────────────────────

// Resolves the caller to a briefing author: a coach, an expert, or a vendor.
async function resolveAuthor(email) {
  const e = (email || '').toLowerCase();

  const [coachSnap, expertSnap, adminSnap] = await Promise.all([
    db.collection('coach_db').where('email', '==', e).limit(1).get(),
    db.collection('expert_db').where('email', '==', e).limit(1).get(),
    db.collection('admin_db').where('email', '==', e).limit(1).get(),
  ]);

  if (!coachSnap.empty) return { email: e, name: coachSnap.docs[0].data().name || '', type: 'coach' };
  if (!expertSnap.empty) return { email: e, name: expertSnap.docs[0].data().name || '', type: 'expert' };
  if (!adminSnap.empty) {
    const a = adminSnap.docs[0].data();
    const role = (a.roleCategory || a.role || '').toLowerCase().replace(/\s/g, '');
    if (role === 'vendor') return { email: e, name: a.name || '', type: 'vendor' };
  }
  return null;
}

// Position ids the author may brief on. A coach/expert briefs positions they
// hold; a vendor briefs positions they took onto their own account.
async function authorPositionIds(author) {
  if (author.type === 'vendor') {
    const positionAccess = require('../model_fire/positionAccessF');
    try {
      const reqs = await positionAccess.getRecruiterAssignments(author.email) || [];
      return [...new Set(reqs.map(r => String(r.positionId)).filter(Boolean))];
    } catch (_) { return []; }
  }
  const [directSnap, assignSnap] = await Promise.all([
    db.collection('coach_expert_direct_requests').where('coachExpertEmail', '==', author.email).get(),
    db.collection('coach_expert_requests').where('coachExpertEmail', '==', author.email).get(),
  ]);
  const ids = new Set();
  directSnap.docs.forEach(d => {
    if (d.data().status === 'approved') ids.add(String(d.data().positionId));
  });
  assignSnap.docs.forEach(d => {
    if (['accepted', 'approved'].includes(d.data().status)) ids.add(String(d.data().positionId));
  });
  ids.delete('undefined');
  ids.delete('');
  return [...ids];
}

// ── Team scoping — the whole point of the feature ─────────────────────────────
// A briefing is private to the author's own team. A recruiter may read it only
// when the author personally put them on this position (coach/expert) or the
// recruiter belongs to the author's vendor account.
async function recruiterMayRead(recruiterEmail, positionId, authorEmail) {
  const rec = (recruiterEmail || '').toLowerCase();
  const author = (authorEmail || '').toLowerCase();
  if (!rec || !author) return false;
  if (rec === author) return true;                    // the author themselves

  const asnSnap = await db.collection('coach_recruiter_assignments')
    .where('recruiterEmail', '==', rec)
    .where('positionId', '==', String(positionId))
    .get();
  if (asnSnap.docs.some(d => (d.data().coachEmail || '').toLowerCase() === author)) return true;

  const recSnap = await db.collection('recruiter_db').where('email', '==', rec).limit(1).get();
  if (!recSnap.empty && (recSnap.docs[0].data().vendorEmail || '').toLowerCase() === author) return true;

  return false;
}

// Every author whose briefing this recruiter is entitled to on a position. A
// recruiter can be on one coach's team and under a vendor at the same time.
async function authorsVisibleTo(recruiterEmail, positionId) {
  const rec = (recruiterEmail || '').toLowerCase();
  const out = new Set();

  const asnSnap = await db.collection('coach_recruiter_assignments')
    .where('recruiterEmail', '==', rec)
    .where('positionId', '==', String(positionId))
    .get();
  asnSnap.docs.forEach(d => {
    const ce = (d.data().coachEmail || '').toLowerCase();
    if (ce) out.add(ce);
  });

  const recSnap = await db.collection('recruiter_db').where('email', '==', rec).limit(1).get();
  if (!recSnap.empty) {
    const ve = (recSnap.docs[0].data().vendorEmail || '').toLowerCase();
    if (ve) out.add(ve);
  }
  return [...out];
}

const shape = (data, id) => {
  if (!data) return null;
  const words = data.wordCount || countWords(data.briefingText);
  return {
    id,
    positionId: data.positionId || '',
    authorEmail: data.authorEmail || data.coachEmail || data.vendorEmail || '',
    authorName: data.authorName || data.coachName || '',
    authorType: data.authorType || 'coach',
    briefingText: data.briefingText || '',
    winningTip: data.winningTip || '',
    coverage: Array.isArray(data.coverage) ? data.coverage : [],
    wordCount: words,
    status: data.status || 'draft',
    durationSec: data.durationSec || estimateSeconds(words),
    updatedAt: toDate(data.updatedAt),
    publishedAt: toDate(data.publishedAt),
  };
};

// ── Author-facing routes ──────────────────────────────────────────────────────

// GET /api/briefing/areas — the five prompts, so the UI and the detector agree.
router.get('/areas', (_req, res) => {
  res.json({
    success: true,
    areas: BRIEFING_AREAS.map(({ key, icon, n, title, prompt }) => ({ key, icon, n, title, prompt })),
  });
});

// GET /api/briefing/my-positions — the summary screen: every position the author
// can brief on, with its briefing status and the header counts.
router.get('/my-positions', authMiddleware, async (req, res) => {
  try {
    const author = await resolveAuthor(req.user.email);
    if (!author) return res.status(403).json({ success: false, message: 'Only a coach, expert or vendor has briefings.' });

    const posIds = await authorPositionIds(author);
    if (!posIds.length) {
      return res.json({ success: true, author, positions: [], stats: { pending: 0, draft: 0, ready: 0, total: 0, completion: 0 } });
    }

    // Positions, in batches of 10 (Firestore 'in' limit), run together.
    const batches = [];
    for (let i = 0; i < posIds.length; i += 10) batches.push(posIds.slice(i, i + 10));
    const posMap = {};
    await Promise.all(batches.map(async (batch) => {
      const snap = await db.collection('admin_AddPos').where('pos_id', 'in', batch).get();
      snap.docs.forEach(d => {
        const p = d.data();
        posMap[String(p.pos_id)] = {
          pos_id: String(p.pos_id),
          position: p.position || '',
          client: p.client || '',
          location: Array.isArray(p.location) ? p.location.join(', ') : (p.location || ''),
          experience: p.experience || '',
          skill_category: p.skill_category || '',
          status: p.status || 'active',
          datePosted: toDate(p.datePosted),
        };
      });
    }));

    const briefSnaps = await Promise.all(posIds.map(pid =>
      db.collection('position_coach_briefing').doc(`${pid}__${author.email}`).get()));
    const briefMap = {};
    briefSnaps.forEach(d => { if (d.exists) briefMap[String(d.data().positionId)] = shape(d.data(), d.id); });

    const positions = posIds
      .filter(pid => posMap[pid])
      .map(pid => {
        const b = briefMap[pid] || null;
        const state = !b ? 'pending' : (b.status === 'ready' ? 'ready' : 'draft');
        return {
          ...posMap[pid],
          briefingState: state,
          briefingUpdatedAt: b?.updatedAt || null,
          durationLabel: state === 'ready' ? fmtDuration(b.durationSec) : null,
          coverage: b?.coverage || [],
          wordCount: b?.wordCount || 0,
        };
      })
      .sort((a, b) => {
        const rank = { pending: 0, draft: 1, ready: 2 };
        if (rank[a.briefingState] !== rank[b.briefingState]) return rank[a.briefingState] - rank[b.briefingState];
        return (b.datePosted?.getTime() || 0) - (a.datePosted?.getTime() || 0);
      });

    const stats = {
      pending: positions.filter(p => p.briefingState === 'pending').length,
      draft: positions.filter(p => p.briefingState === 'draft').length,
      ready: positions.filter(p => p.briefingState === 'ready').length,
      total: positions.length,
    };
    stats.completion = stats.total ? Math.round((stats.ready / stats.total) * 100) : 0;

    res.json({ success: true, author, positions, stats });
  } catch (err) {
    console.error('briefing/my-positions error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/briefing/position/:posId — the entry screen: position snapshot, the
// author's own briefing, and their overall progress for the sticky header.
router.get('/position/:posId', authMiddleware, async (req, res) => {
  try {
    const author = await resolveAuthor(req.user.email);
    if (!author) return res.status(403).json({ success: false, message: 'Only a coach, expert or vendor can brief.' });

    const posId = String(req.params.posId);
    const allowed = await authorPositionIds(author);
    if (!allowed.includes(posId)) {
      return res.status(403).json({ success: false, message: 'This position is not assigned to you.' });
    }

    const [posSnap, briefDoc] = await Promise.all([
      db.collection('admin_AddPos').where('pos_id', '==', posId).limit(1).get(),
      db.collection('position_coach_briefing').doc(`${posId}__${author.email}`).get(),
    ]);
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found' });
    const p = posSnap.docs[0].data();

    // Progress across everything the author can brief on.
    const progressSnaps = await Promise.all(allowed.map(pid =>
      db.collection('position_coach_briefing').doc(`${pid}__${author.email}`).get()));
    let ready = 0, draft = 0;
    progressSnaps.forEach(d => {
      if (!d.exists) return;
      if ((d.data().status || 'draft') === 'ready') ready++; else draft++;
    });

    res.json({
      success: true,
      author,
      position: {
        pos_id: posId,
        position: p.position || '',
        client: p.client || '',
        location: Array.isArray(p.location) ? p.location.join(', ') : (p.location || ''),
        experience: p.experience || '',
        skill_category: p.skill_category || '',
        pos_cat: p.pos_cat || '',
        priority: p.priority || '',
        openings: p.no_of_positions || p.openings || '',
      },
      briefing: briefDoc.exists ? shape(briefDoc.data(), briefDoc.id) : null,
      areas: BRIEFING_AREAS.map(({ key, icon, n, title, prompt }) => ({ key, icon, n, title, prompt })),
      progress: { ready, draft, pending: allowed.length - ready - draft, total: allowed.length },
    });
  } catch (err) {
    console.error('briefing/position error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/briefing/position/:posId  { briefingText, winningTip, status }
// status 'draft' saves privately; 'ready' publishes it to the author's own team.
router.post('/position/:posId', authMiddleware, async (req, res) => {
  try {
    const author = await resolveAuthor(req.user.email);
    if (!author) return res.status(403).json({ success: false, message: 'Only a coach, expert or vendor can brief.' });

    const posId = String(req.params.posId);
    const allowed = await authorPositionIds(author);
    if (!allowed.includes(posId)) {
      return res.status(403).json({ success: false, message: 'This position is not assigned to you.' });
    }

    const briefingText = String(req.body?.briefingText || '').trim();
    const winningTip = String(req.body?.winningTip || '').trim();
    const status = req.body?.status === 'ready' ? 'ready' : 'draft';
    if (status === 'ready' && countWords(briefingText) < 30) {
      return res.status(400).json({ success: false, message: 'Write at least 30 words before creating the voice briefing.' });
    }

    const { FieldValue } = require('firebase-admin/firestore');
    const wordCount = countWords(briefingText);
    const patch = {
      positionId: posId,
      authorEmail: author.email,
      authorName: author.name,
      authorType: author.type,
      // Mirrored for older readers and the SuperAdmin coach report, which key
      // briefings off coachEmail.
      coachEmail: author.email,
      coachName: author.name,
      briefingText, winningTip,
      coverage: detectCoverage(`${briefingText} ${winningTip}`),
      wordCount,
      durationSec: estimateSeconds(wordCount),
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (status === 'ready') patch.publishedAt = FieldValue.serverTimestamp();

    await db.collection('position_coach_briefing').doc(`${posId}__${author.email}`).set(patch, { merge: true });
    res.json({
      success: true,
      status,
      coverage: patch.coverage,
      message: status === 'ready'
        ? 'Voice briefing created — your team can hear it now.'
        : 'Draft saved.',
    });
  } catch (err) {
    console.error('briefing/save error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Team-facing route ─────────────────────────────────────────────────────────

// GET /api/briefing/for-me/:posId — the briefing(s) a recruiter is entitled to
// on this position. Only published ones, and only from their own coach/vendor.
router.get('/for-me/:posId', authMiddleware, async (req, res) => {
  try {
    const me = (req.user.email || '').toLowerCase();
    const posId = String(req.params.posId);

    const authors = await authorsVisibleTo(me, posId);
    if (!authors.length) return res.json({ success: true, briefings: [] });

    const docs = await Promise.all(authors.map(a =>
      db.collection('position_coach_briefing').doc(`${posId}__${a}`).get()));

    const briefings = docs
      .filter(d => d.exists && (d.data().status || 'draft') === 'ready')
      .map(d => {
        const b = shape(d.data(), d.id);
        return {
          ...b,
          areas: BRIEFING_AREAS.filter(a => b.coverage.includes(a.key))
            .map(({ key, icon, title }) => ({ key, icon, title })),
        };
      });

    res.json({ success: true, briefings });
  } catch (err) {
    console.error('briefing/for-me error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/briefing/for-me/:posId/listened { authorEmail }
// Records that this recruiter actually played the briefing, so the author can
// see who has heard it. Idempotent — repeat plays bump the counter.
router.post('/for-me/:posId/listened', authMiddleware, async (req, res) => {
  try {
    const me = (req.user.email || '').toLowerCase();
    const posId = String(req.params.posId);
    const author = String(req.body?.authorEmail || '').toLowerCase();
    if (!author) return res.status(400).json({ success: false, message: 'authorEmail is required' });
    if (!(await recruiterMayRead(me, posId, author))) {
      return res.status(403).json({ success: false, message: 'This briefing is not shared with you.' });
    }

    const { FieldValue } = require('firebase-admin/firestore');
    const ref = db.collection('briefing_listens').doc(`${posId}__${author}__${me}`);
    const existing = await ref.get();
    await ref.set({
      positionId: posId, authorEmail: author, coachEmail: author, listenerEmail: me,
      plays: FieldValue.increment(1),
      firstListenedAt: existing.exists ? existing.data().firstListenedAt : FieldValue.serverTimestamp(),
      lastListenedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ success: true });
  } catch (err) {
    console.error('briefing/listened error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
module.exports.BRIEFING_AREAS = BRIEFING_AREAS;
module.exports.AREA_KEYS = AREA_KEYS;
