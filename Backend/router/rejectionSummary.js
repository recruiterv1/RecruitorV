// Why this recruiter's candidates came back.
//
// A rejection arrives one at a time and reads as bad luck. The shape of a
// month's worth is the part worth acting on, and only we can see it — so this
// groups them, tells apart the ones that are feedback from the ones that are
// not, and attaches the guidance the reasons list already carries.

const express = require('express');
const jwt = require('jsonwebtoken');
const { workingCandidates } = require('./candidateIndex');

const router = express.Router();

const lc = (s) => String(s == null ? '' : s).toLowerCase().trim();
const msOf = (v) => (v?._seconds ? v._seconds * 1000 : (v?.seconds ? v.seconds * 1000 : 0));

const isRejected = (st) => /reject|drop|declined|duplicate/i.test(String(st || ''));

// Reasons are free text and it shows: 274 different spellings, some of them a
// whole rejection email pasted into the field. They are grouped so a summary
// reads as a handful of causes rather than a list of everything ever typed.
const groupReason = (raw) => {
  const r = String(raw || '').trim();
  if (!r) return { label: 'No reason recorded', kind: 'none' };

  // The auto-sweep's wording. Not feedback on the candidate at all — nobody
  // opened them — so it is never counted against the recruiter's judgement.
  if (/no action taken within/i.test(r)) return { label: 'Not reviewed in time', kind: 'system' };
  if (/^duplicate|duplicate in/i.test(r)) return { label: 'Duplicate', kind: 'process' };

  // A pasted email body: keep the part before the greeting, which is the reason.
  const firstLine = r.split(/[\r\n]/)[0].replace(/\s*:\s*$/, '').trim();
  const label = firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : (firstLine || r.slice(0, 48));
  return { label, kind: 'feedback' };
};

const authed = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch (e) { return res.status(403).json({ success: false, message: 'Session expired.' }); }
};

// GET / — the summary for the signed-in recruiter.
//   ?days=90   window; 0 or "all" for everything
router.get('/', authed, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const daysRaw = String(req.query.days || '90');
    const days = daysRaw === 'all' ? 0 : Math.min(Math.max(parseInt(daysRaw, 10) || 90, 1), 3650);
    const since = days ? Date.now() - days * 86400000 : 0;

    // Read from the warm index rather than the collection.
    const all = await workingCandidates();
    const mine = all.filter(c => lc(c.recEmail) === email
      && (!since || (msOf(c.datePosted) || msOf(c.createdAt) || 0) >= since));

    const rejected = mine.filter(c => isRejected(c.statusa));

    const groups = new Map();
    const byPosition = {};
    rejected.forEach(c => {
      const g = groupReason(c.rejectReason);
      const key = g.label;
      if (!groups.has(key)) groups.set(key, { label: g.label, kind: g.kind, count: 0, examples: [] });
      const row = groups.get(key);
      row.count += 1;
      if (row.examples.length < 3 && c.candidate) {
        row.examples.push({ candidate: c.candidate, position: c.pos_name || '', client: c.client || '' });
      }
      const p = c.pos_name || '—';
      byPosition[p] = (byPosition[p] || 0) + 1;
    });

    const reasons = [...groups.values()].sort((a, b) => b.count - a.count);

    // Guidance only exists for the reasons the list knows about, and only the
    // ones a recruiter can actually act on are worth attaching it to.
    const { guidanceFor } = require('./reviewReasons');
    await Promise.all(reasons.filter(r => r.kind === 'feedback').slice(0, 10).map(async (r) => {
      r.guidance = await guidanceFor(r.label);
    }));

    const countOf = (kind) => reasons.filter(r => r.kind === kind).reduce((a, r) => a + r.count, 0);

    res.json({
      success: true,
      days,
      submitted: mine.length,
      rejected: rejected.length,
      // Split apart on purpose. Being turned down on merit, never being looked
      // at, and being turned down with nothing written are three different
      // problems, and only the first is the recruiter's to fix.
      onFeedback: countOf('feedback'),
      notReviewed: countOf('system'),
      noReason: countOf('none'),
      duplicates: countOf('process'),
      reasons,
      byPosition: Object.entries(byPosition).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([position, count]) => ({ position, count })),
    });
  } catch (e) {
    console.error('rejection-summary error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
