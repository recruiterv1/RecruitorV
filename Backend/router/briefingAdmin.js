/**
 * SuperAdmin → Briefings.
 *
 * Five views over who has briefed what, and who has listened:
 *   positions   — per position, one light per briefing item for coach, ClientSPOC and vendor
 *   recruiters  — per recruiter, whether they have heard each author's briefing
 *   coaches     — per coach, one light per item they have answered
 *   clientspocs — the same for ClientSPOCs
 *   companies   — whether a company has an audio note on its profile
 *
 * A light is green when the thing exists, red when it does not. The item list is
 * the one in utils/internalMessage's sibling — briefing.js — so the lights always
 * match the questions actually asked.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

const lc = (s) => String(s || '').toLowerCase().trim();
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
    if (!u || !MANAGER_ROLES.includes(lc(u.roleCategory || u.role))) {
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    }
    req.managerEmail = email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

// The briefing items, taken from the same catalogue the forms use.
const { BRIEFING_AREAS, WINNING_TIP } = (() => {
  try {
    const b = require('./briefing');
    return { BRIEFING_AREAS: b.BRIEFING_AREAS || [], WINNING_TIP: b.WINNING_TIP || null };
  } catch (_) { return { BRIEFING_AREAS: [], WINNING_TIP: null }; }
})();

// Fall back to the known six if the catalogue is not exported.
const ITEMS = (BRIEFING_AREAS.length ? [...BRIEFING_AREAS, WINNING_TIP].filter(Boolean) : [
  { key: 'requirement', title: 'Understand the Real Requirement' },
  { key: 'sourcing', title: 'Sourcing & Head-hunting Strategy' },
  { key: 'watchouts', title: 'Hiring Watch-outs' },
  { key: 'assess', title: 'Assess & Decide' },
  { key: 'engage', title: 'Engage & Close' },
  { key: 'winningTip', title: 'Your Winning Tip' },
]).map(({ key, title }) => ({ key, title }));

const toIso = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// Legacy briefings stored six named fields; map them onto the current items so
// older work still lights up.
const answersOf = (b) => {
  if (b.answers && Object.keys(b.answers).length) return b.answers;
  const legacy = {
    requirement: b.exactPosition,
    sourcing: [b.sourcingTips, b.headhuntingTarget].filter(Boolean).join('\n\n'),
    watchouts: b.challenges,
    assess: b.assessmentQuestions,
    engage: b.engagementPostSubmission,
    winningTip: b.winningTip,
  };
  const out = {};
  Object.entries(legacy).forEach(([k, v]) => { if (String(v || '').trim()) out[k] = v; });
  if (!Object.keys(out).length && b.briefingText) out.requirement = b.briefingText;
  return out;
};

/** One boolean per item — the lights. */
const lightsFor = (answers) => ITEMS.map(i => ({
  key: i.key, title: i.title, on: !!String(answers?.[i.key] || '').trim(),
}));

// Everything the five views need, read once.
async function loadAll() {
  const [briefSnap, posSnap, listenSnap, recSnap, coachSnap, expertSnap, adminSnap, compSnap] =
    await Promise.all([
      db.collection('position_coach_briefing').get(),
      db.collection('admin_AddPos').select('pos_id', 'position', 'client', 'status', 'clientspoc', 'skill_category', 'datePosted').get(),
      db.collection('briefing_listens').get(),
      db.collection('recruiter_db').select('name', 'email', 'vendorEmail', 'consultingFirmId').get(),
      db.collection('coach_db').select('name', 'email').get(),
      db.collection('expert_db').select('name', 'email').get(),
      db.collection('admin_db').select('name', 'email', 'roleCategory', 'role').get(),
      db.collection('Company_Overview').select('name', 'audioText').get(),
    ]);

  const briefings = briefSnap.docs.map(d => {
    const b = d.data();
    return {
      id: d.id,
      positionId: String(b.positionId || d.id.split('__')[0] || ''),
      authorEmail: lc(b.authorEmail || b.coachEmail || b.vendorEmail || d.id.split('__')[1] || ''),
      authorName: b.authorName || b.coachName || '',
      authorType: b.authorType || 'coach',
      status: b.status || 'draft',
      answers: answersOf(b),
      updatedAt: toIso(b.updatedAt),
    };
  });

  return { briefings, posSnap, listenSnap, recSnap, coachSnap, expertSnap, adminSnap, compSnap };
}

// Who is a coach / expert / vendor / clientspoc, by email.
const buildRoleMap = ({ coachSnap, expertSnap, adminSnap }) => {
  const m = {};
  coachSnap.docs.forEach(d => { m[lc(d.data().email)] = { type: 'coach', name: d.data().name || '' }; });
  expertSnap.docs.forEach(d => { m[lc(d.data().email)] = { type: 'expert', name: d.data().name || '' }; });
  adminSnap.docs.forEach(d => {
    const a = d.data();
    const r = lc(a.roleCategory || a.role || '').replace(/\s/g, '');
    if (r === 'vendor' || r === 'clientspoc') m[lc(a.email)] = { type: r, name: a.name || '' };
  });
  return m;
};

// ── 1. Positions ─────────────────────────────────────────────────────────────
router.get('/positions', managerAuth, async (req, res) => {
  try {
    const data = await loadAll();
    const roles = buildRoleMap(data);

    // Briefings grouped by position and by who wrote them.
    const byPos = {};
    data.briefings.forEach(b => {
      if (!b.positionId) return;
      const type = roles[b.authorEmail]?.type || b.authorType;
      const slot = type === 'expert' ? 'coach' : type;      // experts brief as coaches do
      if (!['coach', 'clientspoc', 'vendor'].includes(slot)) return;
      (byPos[b.positionId] = byPos[b.positionId] || {})[slot] = b;
    });

    const rows = data.posSnap.docs.map(d => {
      const p = d.data();
      const pid = String(p.pos_id);
      const g = byPos[pid] || {};
      const slot = (k) => ({
        author: g[k]?.authorName || roles[g[k]?.authorEmail]?.name || '',
        status: g[k]?.status || null,
        lights: lightsFor(g[k]?.answers),
        done: g[k] ? lightsFor(g[k].answers).filter(l => l.on).length : 0,
      });
      return {
        pos_id: pid,
        position: p.position || '',
        client: p.client || '',
        status: p.status || 'active',
        skill_category: p.skill_category || '',
        datePosted: toIso(p.datePosted),
        coach: slot('coach'),
        clientspoc: slot('clientspoc'),
        vendor: slot('vendor'),
      };
    }).sort((a, b) => (b.datePosted || '').localeCompare(a.datePosted || ''));

    res.json({
      success: true, items: ITEMS, rows,
      filters: {
        clients: [...new Set(rows.map(r => r.client).filter(Boolean))].sort(),
        categories: [...new Set(rows.map(r => r.skill_category).filter(Boolean))].sort(),
        statuses: [...new Set(rows.map(r => r.status).filter(Boolean))].sort(),
      },
    });
  } catch (e) {
    console.error('briefing-admin/positions:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── 2. Recruiters ────────────────────────────────────────────────────────────
// One row per recruiter per author-type they were briefed by.
router.get('/recruiters', managerAuth, async (req, res) => {
  try {
    const data = await loadAll();
    const roles = buildRoleMap(data);

    const briefById = {};
    data.briefings.forEach(b => { briefById[`${b.positionId}__${b.authorEmail}`] = b; });

    // Who listened to what.
    const listened = new Set();
    data.listenSnap.docs.forEach(d => {
      const l = d.data();
      listened.add(`${l.positionId}__${lc(l.authorEmail || l.coachEmail)}__${lc(l.listenerEmail)}`);
    });

    // A recruiter is expected to hear a briefing when they hold that position.
    const positionAccess = require('../model_fire/positionAccessF');
    const recruiters = data.recSnap.docs.map(d => d.data()).filter(r => r.email);

    const rows = [];
    await Promise.all(recruiters.map(async (r) => {
      const email = lc(r.email);
      let held = [];
      try { held = (await positionAccess.getRecruiterAssignments(email) || []).map(a => String(a.positionId)); }
      catch (_) { return; }
      if (!held.length) return;

      // Group the briefings on those positions by who wrote them.
      const byType = { coach: [], clientspoc: [], vendor: [] };
      held.forEach(pid => {
        Object.values(briefById)
          .filter(b => b.positionId === pid && b.status === 'ready')
          .forEach(b => {
            const t = roles[b.authorEmail]?.type || b.authorType;
            const slot = t === 'expert' ? 'coach' : t;
            if (byType[slot]) byType[slot].push(b);
          });
      });

      Object.entries(byType).forEach(([slot, list]) => {
        if (!list.length) return;
        const heard = list.filter(b => listened.has(`${b.positionId}__${b.authorEmail}__${email}`)).length;
        rows.push({
          recruiter: r.name || email, email,
          source: slot === 'clientspoc' ? 'ClientSPOC briefing'
            : slot === 'vendor' ? 'Company briefing' : 'Coach briefing',
          sourceKey: slot,
          briefings: list.length,
          listened: heard,
          // All-heard turns the whole row green.
          lights: list.map(b => ({
            key: `${b.positionId}__${b.authorEmail}`,
            title: `Position ${b.positionId} — ${b.authorName || b.authorEmail}`,
            on: listened.has(`${b.positionId}__${b.authorEmail}__${email}`),
          })),
        });
      });
    }));

    rows.sort((a, b) => a.recruiter.localeCompare(b.recruiter) || a.source.localeCompare(b.source));
    res.json({ success: true, rows, sources: ['Coach briefing', 'ClientSPOC briefing', 'Company briefing'] });
  } catch (e) {
    console.error('briefing-admin/recruiters:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── 3 & 4. Coaches and ClientSPOCs ───────────────────────────────────────────
// One row per author per position, with a light per item they answered.
const authorView = (want) => async (req, res) => {
  try {
    const data = await loadAll();
    const roles = buildRoleMap(data);
    const posName = {};
    data.posSnap.docs.forEach(d => { posName[String(d.data().pos_id)] = d.data(); });

    const rows = data.briefings
      .filter(b => {
        const t = roles[b.authorEmail]?.type || b.authorType;
        return want === 'coach' ? (t === 'coach' || t === 'expert') : t === want;
      })
      .map(b => {
        const lights = lightsFor(b.answers);
        const p = posName[b.positionId] || {};
        return {
          author: b.authorName || roles[b.authorEmail]?.name || b.authorEmail,
          email: b.authorEmail,
          role: roles[b.authorEmail]?.type || b.authorType,
          pos_id: b.positionId,
          position: p.position || '',
          client: p.client || '',
          status: b.status,
          answered: lights.filter(l => l.on).length,
          total: lights.length,
          lights,
          updatedAt: b.updatedAt,
        };
      })
      .sort((a, b) => a.author.localeCompare(b.author) || String(a.pos_id).localeCompare(String(b.pos_id)));

    res.json({
      success: true, items: ITEMS, rows,
      filters: {
        authors: [...new Set(rows.map(r => r.author))].sort(),
        clients: [...new Set(rows.map(r => r.client).filter(Boolean))].sort(),
      },
    });
  } catch (e) {
    console.error('briefing-admin/author:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};
router.get('/coaches', managerAuth, authorView('coach'));
router.get('/clientspocs', managerAuth, authorView('clientspoc'));

// ── 5. Companies ─────────────────────────────────────────────────────────────
// Green when the company profile carries an audio note.
router.get('/companies', managerAuth, async (req, res) => {
  try {
    const snap = await db.collection('Company_Overview').select('name', 'audioText').get();
    const rows = snap.docs.map(d => {
      const c = d.data();
      const text = String(c.audioText || '').trim();
      return {
        id: d.id, company: c.name || '',
        hasAudio: !!text,
        preview: text.slice(0, 140),
        length: text.length,
      };
    }).sort((a, b) => Number(a.hasAudio) - Number(b.hasAudio) || a.company.localeCompare(b.company));

    res.json({
      success: true, rows,
      summary: { total: rows.length, withAudio: rows.filter(r => r.hasAudio).length },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
