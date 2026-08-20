/**
 * Manager Panel endpoints.
 * A "manager" is an employee (recruiter/coach/expert) whose designation is
 * "Manager". Managers can view all ClientSPOCs, their positions (active/inactive),
 * the candidates submitted against those positions (and change their status via
 * the shared /addit/update/status endpoint), and generate per-ClientSPOC reports.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const isActivePos = (st) => { const s = lc(st); return s === '' || s.includes('active'); };
const REJECT = new Set([
  'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
  'background verification reject', 'negotiation reject', 'test reject',
  'client drop', 'candidate drop', 'duplicate', 'offer declined', 'position on hold',
]);

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
    const u = (await find('recruiter_db')) || (await find('coach_db')) || (await find('expert_db')) || (await find('admin_db'));
    if (!u || !u.isEmployee || lc(u.designation) !== 'manager') {
      return res.status(403).json({ success: false, message: 'Manager access required' });
    }
    req.managerEmail = email;
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

// GET /api/manager/clientspocs — all ClientSPOCs (+ position counts).
router.get('/clientspocs', managerAuth, async (req, res) => {
  try {
    const [admSnap, posSnap] = await Promise.all([
      db.collection('admin_db').get(),
      db.collection('admin_AddPos').select('clientspoc', 'status').get(),
    ]);
    const posBySpoc = {};
    posSnap.docs.forEach(d => {
      const p = d.data(); const k = lc(p.clientspoc);
      if (!k) return;
      posBySpoc[k] = posBySpoc[k] || { total: 0, active: 0 };
      posBySpoc[k].total++; if (isActivePos(p.status)) posBySpoc[k].active++;
    });
    const clientspocs = admSnap.docs.map(d => d.data())
      .filter(x => lc(x.roleCategory || x.role) === 'clientspoc' && x.email)
      .map(x => {
        const k = lc(x.email); const c = posBySpoc[k] || { total: 0, active: 0 };
        return { email: x.email, name: x.name || x.email.split('@')[0], company: x.company || '', totalPositions: c.total, activePositions: c.active };
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json({ success: true, clientspocs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/manager/positions?clientspoc=email — positions for a ClientSPOC with
// active/inactive flag + candidate counts.
router.get('/positions', managerAuth, async (req, res) => {
  try {
    const spoc = lc(req.query.clientspoc);
    if (!spoc) return res.status(400).json({ success: false, message: 'clientspoc is required' });
    const posSnap = await db.collection('admin_AddPos').get();
    const positions = posSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => lc(p.clientspoc) === spoc);
    const posIds = positions.map(p => p.pos_id).filter(Boolean);

    const counts = {};
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
      if (!batch.length) continue;
      const snap = await db.collection('candidate_db').where('pos_id', 'in', batch).get();
      snap.docs.forEach(d => {
        const c = d.data(); const pid = c.pos_id;
        counts[pid] = counts[pid] || { total: 0, active: 0 };
        counts[pid].total++;
        if (!REJECT.has(lc(c.statusa))) counts[pid].active++;
      });
    }

    const out = positions.map(p => ({
      id: p.id, pos_id: p.pos_id, position: p.position || '', client: p.client || '',
      location: p.location || '', experience: p.experience || '', skill_category: p.skill_category || '',
      status: p.status || 'Active', active: isActivePos(p.status),
      datePosted: p.datePosted || null,
      candidateCount: counts[p.pos_id]?.total || 0, activeCandidateCount: counts[p.pos_id]?.active || 0,
    })).sort((a, b) => (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0));
    res.json({ success: true, positions: out });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/manager/position/:pos_id/candidates — candidates on a position.
router.get('/position/:pos_id/candidates', managerAuth, async (req, res) => {
  try {
    const snap = await db.collection('candidate_db').where('pos_id', '==', req.params.pos_id).get();
    const candidates = snap.docs.map(d => {
      const c = d.data();
      return {
        id: d.id, candidate: c.candidate || '', emails: c.emails || '', mob: c.mob || '',
        recName: c.recName || '', statusa: c.statusa || '', rejectReason: c.rejectReason || '',
        curr_loc: c.curr_loc || '', total_exp: c.total_exp || '', rel_exp: c.rel_exp || '',
        cv_data: c.cv_data || c.cv_url || '', datePosted: c.datePosted || null,
        pos_name: c.pos_name || '', client: c.client || '',
      };
    }).sort((a, b) => (b.datePosted?._seconds || 0) - (a.datePosted?._seconds || 0));
    res.json({ success: true, candidates });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/manager/report?clientspoc=email — aggregated report for a ClientSPOC.
router.get('/report', managerAuth, async (req, res) => {
  try {
    const spoc = lc(req.query.clientspoc);
    if (!spoc) return res.status(400).json({ success: false, message: 'clientspoc is required' });
    const posSnap = await db.collection('admin_AddPos').get();
    const positions = posSnap.docs.map(d => d.data()).filter(p => lc(p.clientspoc) === spoc);
    const posIds = positions.map(p => p.pos_id).filter(Boolean);
    const posMap = {}; positions.forEach(p => { posMap[p.pos_id] = p; });

    const byStatus = {}; const perPosition = {}; let totalCandidates = 0;
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
      if (!batch.length) continue;
      const snap = await db.collection('candidate_db').where('pos_id', 'in', batch).get();
      snap.docs.forEach(d => {
        const c = d.data(); totalCandidates++;
        byStatus[c.statusa || '(none)'] = (byStatus[c.statusa || '(none)'] || 0) + 1;
        perPosition[c.pos_id] = perPosition[c.pos_id] || { candidates: 0 };
        perPosition[c.pos_id].candidates++;
      });
    }
    const positionRows = positions.map(p => ({
      pos_id: p.pos_id, position: p.position || '', client: p.client || '',
      status: p.status || 'Active', active: isActivePos(p.status),
      candidates: perPosition[p.pos_id]?.candidates || 0,
    })).sort((a, b) => (b.candidates - a.candidates));

    res.json({
      success: true,
      report: {
        clientspoc: spoc,
        totalPositions: positions.length,
        activePositions: positions.filter(p => isActivePos(p.status)).length,
        inactivePositions: positions.filter(p => !isActivePos(p.status)).length,
        totalCandidates,
        byStatus,
        positions: positionRows,
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Statuses that count as "selected".
const SELECTED = new Set(['offer accepted', 'joining', 'to be offered', 'test select', 'selected']);

const inRange = (c, fromMs, toMs) => {
  const ts = c.datePosted?._seconds ? c.datePosted._seconds * 1000 : 0;
  if (fromMs && ts < fromMs) return false;
  if (toMs && ts > toMs) return false;
  return true;
};
const dateMsOf = (v) => (v && v._seconds) ? v._seconds * 1000 : (v ? Date.parse(v) || 0 : 0);

// GET /api/manager/recruiters?from=&to= — per-recruiter aggregates.
router.get('/recruiters', managerAuth, async (req, res) => {
  try {
    const fromMs = req.query.from ? Date.parse(req.query.from) : null;
    const toMs = req.query.to ? Date.parse(req.query.to) + 86400000 : null; // inclusive end of day
    const snap = await db.collection('candidate_db').get();
    const byRec = {};
    snap.docs.forEach(d => {
      const c = d.data();
      if (c.source === 'clientspoc_bulk') return;        // skip resume-bank templates
      const key = lc(c.recEmail);
      if (!key) return;
      if (!inRange(c, fromMs, toMs)) return;
      const r = byRec[key] = byRec[key] || { recEmail: c.recEmail || key, recName: c.recName || key.split('@')[0], positions: new Set(), submitted: 0, rejected: 0, selected: 0 };
      r.submitted++;
      if (c.pos_id) r.positions.add(c.pos_id);
      const st = lc(c.statusa);
      if (REJECT.has(st)) r.rejected++;
      if (SELECTED.has(st)) r.selected++;
    });
    const recruiters = Object.values(byRec)
      .map(r => ({ recEmail: r.recEmail, recName: r.recName, positionCount: r.positions.size, submitted: r.submitted, rejected: r.rejected, selected: r.selected }))
      .sort((a, b) => b.submitted - a.submitted);
    res.json({ success: true, recruiters });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/manager/recruiter-candidates?recEmail=&from=&to= — that recruiter's
// candidates with submission + status-change dates (for the expand + export).
router.get('/recruiter-candidates', managerAuth, async (req, res) => {
  try {
    const raw = (req.query.recEmail || '').toString().trim();
    if (!raw) return res.status(400).json({ success: false, message: 'recEmail is required' });
    const fromMs = req.query.from ? Date.parse(req.query.from) : null;
    const toMs = req.query.to ? Date.parse(req.query.to) + 86400000 : null;
    const variants = [...new Set([raw, lc(raw)])];
    const snap = await db.collection('candidate_db').where('recEmail', 'in', variants).get();
    const candidates = snap.docs.map(d => {
      const c = d.data();
      return {
        id: d.id, candidate: c.candidate || '', emails: c.emails || '', mob: c.mob || '',
        pos_id: c.pos_id || '', pos_name: c.pos_name || '', client: c.client || '',
        statusa: c.statusa || '', rejectReason: c.rejectReason || '',
        submittedMs: c.datePosted?._seconds ? c.datePosted._seconds * 1000 : 0,
        statusChangeMs: dateMsOf(c.statusaDate) || dateMsOf(c.statusChangedAt) || dateMsOf(c.updatedAt) || 0,
        cv_data: c.cv_data || c.cv_url || '',
      };
    }).filter(c => {
      if (fromMs && c.submittedMs < fromMs) return false;
      if (toMs && c.submittedMs > toMs) return false;
      return c.pos_id ? true : true;
    }).sort((a, b) => b.submittedMs - a.submittedMs);
    res.json({ success: true, candidates });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/manager/spoc-activity?from=YYYY-MM-DD&to=YYYY-MM-DD
// Per ClientSPOC per day: how many candidates arrived (direct applicants vs from
// recruiters), how many the SPOC has actioned, and how many were auto Screen
// Rejected by the 48h/72h sweep. Powers the Manager "SPOC Activity" tab.
router.get('/spoc-activity', managerAuth, async (req, res) => {
  try {
    const toMs = (v) => {
      if (!v) return 0;
      if (typeof v.toMillis === 'function') return v.toMillis();
      if (v._seconds) return v._seconds * 1000;
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    // Day key in IST so the report lines up with the working day.
    const dayKey = (ms) => new Date(ms + 5.5 * 3600000).toISOString().slice(0, 10);

    const fromMs = req.query.from ? new Date(req.query.from + 'T00:00:00Z').getTime() - 5.5 * 3600000 : 0;
    const toMsLimit = req.query.to ? new Date(req.query.to + 'T23:59:59Z').getTime() - 5.5 * 3600000 : Infinity;

    // Map every position to the SPOC that owns it.
    const posSnap = await db.collection('admin_AddPos').select('pos_id', 'clientspoc', 'clientspoc_name').get();
    const spocOf = {}, nameOf = {};
    posSnap.docs.forEach(d => {
      const p = d.data();
      if (!p.pos_id) return;
      spocOf[String(p.pos_id)] = lc(p.clientspoc);
      if (p.clientspoc_name) nameOf[lc(p.clientspoc)] = p.clientspoc_name;
    });

    const candSnap = await db.collection('candidate_db')
      .select('pos_id', 'clientspoc', 'statusa', 'source', 'recRole', 'datePosted',
              'statusaDate', 'statusChangedAt', 'statusChangedBy', 'autoScreenRejected')
      .get();

    // rows keyed by "spoc|date"
    const rows = {};
    candSnap.docs.forEach(d => {
      const c = d.data();
      const created = toMs(c.datePosted);
      if (!created || created < fromMs || created > toMsLimit) return;

      const spoc = lc(c.clientspoc) || spocOf[String(c.pos_id)] || '';
      if (!spoc) return;
      const key = spoc + '|' + dayKey(created);
      const r = rows[key] || (rows[key] = {
        clientspoc: spoc, clientspocName: nameOf[spoc] || spoc.split('@')[0], date: dayKey(created),
        directReceived: 0, directActioned: 0,
        recruiterReceived: 0, recruiterActioned: 0,
        autoScreenRejected: 0, total: 0,
      });

      const isDirect = c.source === 'direct_apply';
      const status = (c.statusa || '').trim();
      // "Actioned" = moved past the entry statuses by a human (not the sweep).
      const actioned = !!status && status !== 'Applied' && status !== 'Submitted' && !c.autoScreenRejected;

      r.total++;
      if (isDirect) { r.directReceived++; if (actioned) r.directActioned++; }
      else { r.recruiterReceived++; if (actioned) r.recruiterActioned++; }
      if (c.autoScreenRejected) r.autoScreenRejected++;
    });

    const list = Object.values(rows).sort((a, b) =>
      b.date.localeCompare(a.date) || a.clientspocName.localeCompare(b.clientspocName));

    const totals = list.reduce((t, r) => ({
      directReceived: t.directReceived + r.directReceived,
      directActioned: t.directActioned + r.directActioned,
      recruiterReceived: t.recruiterReceived + r.recruiterReceived,
      recruiterActioned: t.recruiterActioned + r.recruiterActioned,
      autoScreenRejected: t.autoScreenRejected + r.autoScreenRejected,
      total: t.total + r.total,
    }), { directReceived: 0, directActioned: 0, recruiterReceived: 0, recruiterActioned: 0, autoScreenRejected: 0, total: 0 });

    res.json({ success: true, rows: list, totals });
  } catch (e) {
    console.error('spoc-activity error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
