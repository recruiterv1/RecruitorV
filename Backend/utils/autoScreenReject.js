// ─────────────────────────────────────────────────────────────────────────────
// Auto Screen Reject sweep.
//
// A candidate nobody acts on shouldn't sit in a pipeline forever — it blocks the
// position's slots and keeps the person out of the Resume Bank, where they could be
// matched to other roles. So:
//   • 'Applied'   with no action for 48h  → Screen Reject
//   • 'Submitted' with no action for 72h  → Screen Reject
//
// "No action" = the status hasn't changed since it was set. We read the newest of
// statusaDate / statusChangedAt / updatedAt / datePosted as the last-touched time.
//
// Rows are tagged autoScreenRejected + autoRejectedFrom so the Manager report can
// separate automatic rejections from ones a human made.
//
// Thresholds are overridable in Firestore `app_config/auto_screen_reject`:
//   { enabled: bool, appliedHours: 48, submittedHours: 72 }
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = { enabled: true, appliedHours: 48, submittedHours: 72 };

const toMillis = (v) => {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v._seconds) return v._seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

// Newest timestamp we hold for the row — i.e. when it was last touched.
const lastTouched = (c) => Math.max(
  toMillis(c.statusaDate), toMillis(c.statusChangedAt),
  toMillis(c.updatedAt), toMillis(c.datePosted),
);

async function getConfig(db) {
  try {
    const doc = await db.collection('app_config').doc('auto_screen_reject').get();
    return doc.exists ? { ...DEFAULTS, ...doc.data() } : DEFAULTS;
  } catch (_) { return DEFAULTS; }
}

/**
 * Run the sweep.
 * @param {object} opts.dryRun  when true, report what would change without writing
 * @returns {{ enabled, scanned, applied, submitted, updated, skippedNoTimestamp }}
 */
async function runAutoScreenReject({ dryRun = false } = {}) {
  const { db } = require('../router/firebase_ad');
  const cfg = await getConfig(db);
  if (cfg.enabled === false) return { enabled: false, updated: 0 };

  const now = Date.now();
  const appliedCut = now - (Number(cfg.appliedHours) || 48) * 3600000;
  const submittedCut = now - (Number(cfg.submittedHours) || 72) * 3600000;

  // Only the two statuses in scope, whichever way the candidate entered the system.
  const snap = await db.collection('candidate_db')
    .where('statusa', 'in', ['Applied', 'Submitted'])
    .get();

  const due = [];
  let skippedNoTimestamp = 0;
  snap.docs.forEach(d => {
    const c = d.data();
    const status = (c.statusa || '').trim();
    const ts = lastTouched(c);
    if (!ts) { skippedNoTimestamp++; return; }        // never auto-reject on unknown age
    const cut = status === 'Applied' ? appliedCut : submittedCut;
    if (ts <= cut) due.push({ ref: d.ref, from: status });
  });

  const counts = { applied: 0, submitted: 0 };
  due.forEach(x => { x.from === 'Applied' ? counts.applied++ : counts.submitted++; });

  let updated = 0;
  if (!dryRun && due.length) {
    const stamp = new Date();
    // Firestore caps a batch at 500 writes.
    for (let i = 0; i < due.length; i += 450) {
      const batch = db.batch();
      due.slice(i, i + 450).forEach(({ ref, from }) => {
        batch.update(ref, {
          statusa: 'Screen Reject',
          statusaDate: stamp,
          statusChangedAt: stamp,
          updatedAt: stamp,
          statusChangedBy: 'system@recruiterv.com',
          statusChangedByName: 'Auto Screen Reject',
          rejectReason: `No action taken within ${from === 'Applied' ? cfg.appliedHours : cfg.submittedHours} hours of being ${from}.`,
          autoScreenRejected: true,
          autoRejectedFrom: from,
          autoRejectedAt: stamp,
        });
        updated++;
      });
      await batch.commit();
    }
    // The Resume Bank pool is cached — refresh so these people show up immediately.
    try { require('./resumeBankMatch').invalidateCache(); } catch (_) {}
  }

  return {
    enabled: true, dryRun,
    scanned: snap.size,
    applied: counts.applied,
    submitted: counts.submitted,
    updated: dryRun ? 0 : updated,
    skippedNoTimestamp,
    thresholds: { appliedHours: cfg.appliedHours, submittedHours: cfg.submittedHours },
  };
}

module.exports = { runAutoScreenReject };
