// Position briefings — one answer per briefing area, recorded against a position
// and played back item by item.
//
// Two kinds, same items and same storage:
//   • coach / expert / vendor — private to THEIR OWN team
//   • clientspoc              — visible to everyone working the position
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

// The five briefing areas. Each is its own input, saved under its own key and
// played back by its own speaker.
const BRIEFING_AREAS = [
  {
    key: 'requirement', icon: '🎯', n: '01',
    title: 'Understand the Real Requirement',
    prompt: 'What should recruiters understand beyond the JD?',
  },
  {
    key: 'sourcing', icon: '🔎', n: '02',
    title: 'Sourcing & Head-hunting Strategy',
    prompt: 'Where should recruiters find the right candidates?',
  },
  {
    key: 'watchouts', icon: '⚠️', n: '03',
    title: 'Hiring Watch-outs',
    prompt: 'What could make this position difficult to close?',
  },
  {
    key: 'assess', icon: '✅', n: '04',
    title: 'Assess & Decide',
    prompt: 'How should recruiters decide whether a candidate is worth submitting?',
  },
  {
    key: 'engage', icon: '🤝', n: '05',
    title: 'Engage & Close',
    prompt: 'How should recruiters keep the candidate interested?',
  },
];

// The closing item. Counted towards coverage and required to publish, like the
// five areas above it.
const WINNING_TIP = {
  key: 'winningTip', icon: '⭐', n: '06',
  title: 'Your Winning Tip',
  prompt: 'If you were personally recruiting this position, what is the ONE thing you would do differently?',
};

// Every briefing item, in order — the five areas plus the Winning Tip.
const BRIEFING_ITEMS = [...BRIEFING_AREAS, WINNING_TIP];

const AREA_KEYS = BRIEFING_AREAS.map(a => a.key);

const countWords = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

// Every item the author actually filled in. No guessing any more: each item has
// its own input, so "covered" simply means it has an answer.
const coverageOf = (answers) =>
  BRIEFING_ITEMS.filter(a => String(answers?.[a.key] || '').trim()).map(a => a.key);

const totalWords = (answers) =>
  BRIEFING_ITEMS.reduce((n, a) => n + countWords(answers?.[a.key]), 0);

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

// Resolves the caller to a briefing author: coach, expert, vendor or clientspoc.
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
    if (role === 'clientspoc') return { email: e, name: a.name || '', type: 'clientspoc' };
  }
  return null;
}

// A ClientSPOC's briefing is not team-private — every recruiter, coach, expert
// and vendor working that position can hear it.
const isPublicAuthor = (type) => type === 'clientspoc';

// Position ids the author may brief on. A coach/expert briefs positions they
// hold; a vendor briefs positions they took onto their own account.
async function authorPositionIds(author) {
  if (author.type === 'clientspoc') {
    const snap = await db.collection('admin_AddPos')
      .where('clientspoc', '==', author.email).get();
    return [...new Set(snap.docs.map(d => String(d.data().pos_id)).filter(Boolean))];
  }
  if (author.type === 'vendor') {
    const ids = new Set();
    // Positions the vendor posted themselves — briefable straight away, which is
    // what lets the briefing be captured on the Add Position form.
    try {
      const own = await db.collection('admin_AddPos')
        .where('postedByVendor', '==', author.email).get();
      own.docs.forEach(d => ids.add(String(d.data().pos_id)));
    } catch (_) { /* fall through to assignments */ }
    // Plus anything they took onto their own account.
    try {
      const positionAccess = require('../model_fire/positionAccessF');
      const reqs = await positionAccess.getRecruiterAssignments(author.email) || [];
      reqs.forEach(r => ids.add(String(r.positionId)));
    } catch (_) { /* own positions still apply */ }
    ids.delete('undefined');
    ids.delete('');
    return [...ids];
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
  // Read-time migration so nothing written before this change disappears:
  //  • the original six-question form  → mapped onto the five areas
  //  • the interim single free-text blob → shown under the first area
  let answers = data.answers;
  if (!answers) {
    answers = {};
    const legacy = {
      requirement: [data.exactPosition],
      sourcing: [data.sourcingTips, data.headhuntingTarget],
      watchouts: [data.challenges],
      assess: [data.assessmentQuestions],
      engage: [data.engagementPostSubmission],
    };
    Object.entries(legacy).forEach(([k, parts]) => {
      const v = parts.map(x => String(x || '').trim()).filter(Boolean).join('\n\n');
      if (v) answers[k] = v;
    });
    if (!Object.keys(answers).length && data.briefingText) {
      answers.requirement = data.briefingText;
    }
  }
  if (data.winningTip && !answers.winningTip) answers.winningTip = data.winningTip;

  const words = totalWords(answers);
  return {
    id,
    positionId: data.positionId || '',
    authorEmail: data.authorEmail || data.coachEmail || data.vendorEmail || '',
    authorName: data.authorName || data.coachName || '',
    authorType: data.authorType || 'coach',
    answers,
    winningTip: answers.winningTip || '',
    coverage: coverageOf(answers),
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
    areas: BRIEFING_ITEMS.map(({ key, icon, n, title, prompt }) => ({ key, icon, n, title, prompt })),
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
      areas: BRIEFING_ITEMS.map(({ key, icon, n, title, prompt }) => ({ key, icon, n, title, prompt })),
      progress: { ready, draft, pending: allowed.length - ready - draft, total: allowed.length },
    });
  } catch (err) {
    console.error('briefing/position error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/briefing/position/:posId  { answers: {areaKey: text}, status }
// status 'draft' saves privately; 'ready' publishes it to whoever may hear it.
router.post('/position/:posId', authMiddleware, async (req, res) => {
  try {
    const author = await resolveAuthor(req.user.email);
    if (!author) return res.status(403).json({ success: false, message: 'Your role cannot record a briefing.' });

    const posId = String(req.params.posId);
    const allowed = await authorPositionIds(author);
    if (!allowed.includes(posId)) {
      return res.status(403).json({ success: false, message: 'This position is not assigned to you.' });
    }

    const body = req.body?.answers || {};
    const answers = {};
    BRIEFING_ITEMS.forEach(({ key: k }) => {
      const v = String(body[k] || '').trim();
      if (v) answers[k] = v;
    });

    const status = req.body?.status === 'ready' ? 'ready' : 'draft';
    const coverage = coverageOf(answers);
    if (status === 'ready' && coverage.length < BRIEFING_ITEMS.length) {
      const missing = BRIEFING_ITEMS.filter(a => !coverage.includes(a.key)).map(a => a.title);
      return res.status(400).json({
        success: false,
        message: `Answer all ${BRIEFING_ITEMS.length} items before publishing. Still missing: ${missing.join(', ')}.`,
      });
    }

    const { FieldValue } = require('firebase-admin/firestore');
    const wordCount = totalWords(answers);
    const patch = {
      positionId: posId,
      authorEmail: author.email,
      authorName: author.name,
      authorType: author.type,
      // Mirrored for older readers and the SuperAdmin coach report, which key
      // briefings off coachEmail.
      coachEmail: author.email,
      coachName: author.name,
      answers,
      winningTip: answers.winningTip || '',
      coverage,
      wordCount,
      durationSec: estimateSeconds(wordCount),
      visibility: isPublicAuthor(author.type) ? 'all' : 'team',
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (status === 'ready') patch.publishedAt = FieldValue.serverTimestamp();

    await db.collection('position_coach_briefing').doc(`${posId}__${author.email}`).set(patch, { merge: true });
    res.json({
      success: true,
      status,
      coverage,
      message: status === 'ready'
        ? (isPublicAuthor(author.type)
            ? 'Briefing published — everyone working this position can hear it.'
            : 'Briefing published — your team can hear it now.')
        : 'Draft saved.',
    });
  } catch (err) {
    console.error('briefing/save error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Team-facing route ─────────────────────────────────────────────────────────

// GET /api/briefing/for-me/:posId — every briefing this viewer may hear on this
// position: the ones from their own coach/vendor (team-private), plus the
// ClientSPOC's briefing, which is open to everyone working the position.
router.get('/for-me/:posId', authMiddleware, async (req, res) => {
  try {
    const me = (req.user.email || '').toLowerCase();
    const posId = String(req.params.posId);

    const authors = new Set(await authorsVisibleTo(me, posId));

    // The position's own ClientSPOC — public to all.
    try {
      const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', posId).limit(1).get();
      if (!posSnap.empty) {
        const spoc = (posSnap.docs[0].data().clientspoc || '').toLowerCase();
        if (spoc) authors.add(spoc);
      }
    } catch (_) { /* team briefings still apply */ }

    if (!authors.size) return res.json({ success: true, briefings: [] });

    const docs = await Promise.all([...authors].map(a =>
      db.collection('position_coach_briefing').doc(`${posId}__${a}`).get()));

    const briefings = docs
      .filter(d => d.exists && (d.data().status || 'draft') === 'ready')
      .map(d => {
        const b = shape(d.data(), d.id);
        // One playable item per answered area, in the canonical order.
        const items = BRIEFING_ITEMS
          .filter(a => String(b.answers[a.key] || '').trim())
          .map(a => ({
            key: a.key, icon: a.icon, n: a.n, title: a.title,
            text: b.answers[a.key].trim(),
          }));
        return { ...b, items, isPublic: b.authorType === 'clientspoc' };
      })
      // The ClientSPOC's briefing is the client's own word — show it first.
      .sort((a, b) => Number(b.isPublic) - Number(a.isPublic));

    res.json({ success: true, briefings });
  } catch (err) {
    console.error('briefing/for-me error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/briefing/public/:posId — the ClientSPOC's briefing alone, with no
// login required. The client's own word on a position is open to everyone:
// no assignment, no team membership, and no account needed to hear it.
// Coach and vendor briefings are deliberately NOT served here — those stay
// private to their own team and remain behind /for-me.
router.get('/public/:posId', async (req, res) => {
  try {
    const posId = String(req.params.posId);

    const posSnap = await db.collection('admin_AddPos')
      .where('pos_id', '==', posId).limit(1).get();
    if (posSnap.empty) return res.json({ success: true, briefings: [] });

    const spoc = (posSnap.docs[0].data().clientspoc || '').toLowerCase();
    if (!spoc) return res.json({ success: true, briefings: [] });

    const doc = await db.collection('position_coach_briefing').doc(`${posId}__${spoc}`).get();
    if (!doc.exists || (doc.data().status || 'draft') !== 'ready') {
      return res.json({ success: true, briefings: [] });
    }

    const b = shape(doc.data(), doc.id);
    const items = BRIEFING_ITEMS
      .filter(a => String(b.answers[a.key] || '').trim())
      .map(a => ({ key: a.key, icon: a.icon, n: a.n, title: a.title, text: b.answers[a.key].trim() }));

    res.json({ success: true, briefings: [{ ...b, items, isPublic: true }] });
  } catch (err) {
    console.error('briefing/public error:', err.message);
    // A briefing failing to load must never take the position page down with it.
    res.json({ success: true, briefings: [] });
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
    let mayRead = await recruiterMayRead(me, posId, author);
    if (!mayRead) {
      // The position's ClientSPOC briefing is open to everyone working it.
      const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', posId).limit(1).get();
      mayRead = !posSnap.empty && (posSnap.docs[0].data().clientspoc || '').toLowerCase() === author;
    }
    if (!mayRead) {
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
module.exports.WINNING_TIP = WINNING_TIP;
module.exports.BRIEFING_ITEMS = BRIEFING_ITEMS;
