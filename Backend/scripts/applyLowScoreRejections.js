/**
 * Apply the "score <= 50 => Screen Reject" rule to existing direct applications
 * that already have a Match% but were left at an active status (Applied /
 * Submitted) because they were scored under the older "needs-review" logic.
 *
 * Sets statusa = Screen Reject and emails the candidate, matching what the live
 * evaluator now does for any low score.
 *
 * Usage:
 *   node scripts/applyLowScoreRejections.js          # DRY RUN (counts only)
 *   node scripts/applyLowScoreRejections.js --apply  # LIVE (status + emails)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const { db } = require('../router/firebase_ad');
const { sendEmailFull } = require('../utils/email');
const { rejectionEmailHtml, REJECT_STATUS, MATCH_THRESHOLD } = require('../utils/cvMatch');

const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const lc = (s) => (s || '').toString().toLowerCase().trim();

const REJECTED_STATUSES = new Set([
  'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
  'background verification reject', 'negotiation reject', 'test reject',
  'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
]);

(async () => {
  console.log(`\n=== Apply low-score rejections (<=${MATCH_THRESHOLD}%) — ${APPLY ? 'LIVE (--apply)' : 'DRY RUN'} ===\n`);

  const snap = await db.collection('candidate_db').where('source', '==', 'direct_apply').get();

  const targets = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c =>
    typeof c.matchPercent === 'number' &&
    c.matchPercent <= MATCH_THRESHOLD &&
    !REJECTED_STATUSES.has(lc(c.statusa))         // not already rejected
  );

  console.log(`Direct applications        : ${snap.size}`);
  console.log(`Low score & still active   : ${targets.length}   <- will be rejected + emailed\n`);

  if (!APPLY) {
    targets.slice(0, 15).forEach(c =>
      console.log(`  • ${c.candidate || '—'} | ${c.matchPercent}% | status=${c.statusa || '(blank)'} | ${c.emails || '—'}`));
    console.log(`\nDRY RUN — no changes made. Re-run with --apply to execute.\n`);
    process.exit(0);
  }

  let rejected = 0, emailed = 0, errors = 0;
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    const now = new Date();
    try {
      await db.collection('candidate_db').doc(c.id).update({
        statusa: REJECT_STATUS,
        statusaDate: now,
        statusChangedAt: now,
        statusChangedBy: 'auto-screening',
        statusChangedByName: 'Auto Screening',
        updatedAt: now,
      });
      rejected++;

      const to = c.emails || c.email;
      if (to) {
        try {
          await sendEmailFull({
            to,
            subject: `Update on your application${c.pos_name ? ` — ${c.pos_name}` : ''}`,
            htmlContent: rejectionEmailHtml(c.candidate || c.name, c.pos_name),
          });
          emailed++;
        } catch (e) { console.error(`  email failed for ${to}: ${e.message}`); }
      }
      console.log(`[${i + 1}/${targets.length}] ${c.candidate || '—'} ${c.matchPercent}% → Screen Reject${to ? ' + email' : ''}`);
    } catch (e) {
      errors++;
      console.error(`[${i + 1}/${targets.length}] ${c.candidate || '—'} → ERROR: ${e.message}`);
    }
    await sleep(300);
  }

  console.log(`\n=== Done ===`);
  console.log(`Rejected : ${rejected}`);
  console.log(`Emailed  : ${emailed}`);
  console.log(`Errors   : ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
