/**
 * One-time maintenance: re-evaluate direct applications that never got a real
 * Match% (they were stamped matchEvaluated=true during the Anthropic no-credit
 * outage, so the auto-evaluator skips them forever).
 *
 * Runs the NEW hybrid scorer (utils/cvMatch.runMatchEvaluation):
 *   - free heuristic decides clear pass / clear junk,
 *   - AI only for the borderline middle band (falls back to heuristic if AI down),
 *   - confident low scores are auto-rejected AND the candidate is emailed.
 *
 * Usage:
 *   node scripts/reevaluateStuckDirectApplications.js          # DRY RUN (counts only, no writes/emails)
 *   node scripts/reevaluateStuckDirectApplications.js --apply  # LIVE (re-scores, auto-rejects, sends emails)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const { db } = require('../router/firebase_ad');
const { runMatchEvaluation } = require('../utils/cvMatch');

const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const isNum = (v) => typeof v === 'number' && !isNaN(v);

(async () => {
  console.log(`\n=== Re-evaluate stuck direct applications — ${APPLY ? 'LIVE (--apply)' : 'DRY RUN'} ===\n`);

  const snap = await db.collection('candidate_db').where('source', '==', 'direct_apply').get();

  // Stuck = a direct application that has no real numeric Match% yet.
  const stuck = snap.docs.filter(d => {
    const c = d.data();
    return !isNum(c.matchPercent) && (c.cv_data || c.cv_url);   // has a CV but no score
  });
  const noCv = snap.docs.filter(d => { const c = d.data(); return !isNum(c.matchPercent) && !(c.cv_data || c.cv_url); });

  console.log(`Total direct applications : ${snap.size}`);
  console.log(`Already scored            : ${snap.docs.filter(d => isNum(d.data().matchPercent)).length}`);
  console.log(`Stuck (CV, no score)      : ${stuck.length}   <- will be re-evaluated`);
  console.log(`No CV attached (skipped)  : ${noCv.length}\n`);

  if (!APPLY) {
    console.log('DRY RUN — no changes made. Sample of stuck candidates:');
    stuck.slice(0, 10).forEach(d => {
      const c = d.data();
      console.log(`  • ${c.candidate || '—'} | ${c.pos_name || c.pos_id || '—'} | ${c.emails || '—'} | note=${c.matchNote || '—'}`);
    });
    console.log(`\nRe-run with --apply to execute.\n`);
    process.exit(0);
  }

  let pass = 0, rejected = 0, unreadable = 0, retry = 0, errors = 0;
  for (let i = 0; i < stuck.length; i++) {
    const d = stuck[i];
    const c = d.data();
    try {
      const r = await runMatchEvaluation({ candidateId: d.id });
      let tag;
      if (!r.ok && r.reason === 'service-error') { retry++; tag = 'service-error (will retry)'; }
      else if (!r.ok && r.reason === 'no-score') { unreadable++; tag = 'CV not readable'; }
      else if (r.autoRejected) { rejected++; tag = `REJECTED ${r.score}% (${r.method}) — email sent`; }
      else if (r.ok) { pass++; tag = `kept ${r.score}% (${r.method})`; }
      else { tag = `other: ${r.reason}`; }
      console.log(`[${i + 1}/${stuck.length}] ${c.candidate || '—'} → ${tag}`);
    } catch (e) {
      errors++;
      console.error(`[${i + 1}/${stuck.length}] ${c.candidate || '—'} → ERROR: ${e.message}`);
    }
    await sleep(400); // gentle pacing
  }

  console.log(`\n=== Done ===`);
  console.log(`Kept/passed       : ${pass}`);
  console.log(`Auto-rejected+email: ${rejected}`);
  console.log(`CV not readable   : ${unreadable}`);
  console.log(`Left to retry     : ${retry}`);
  console.log(`Errors            : ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
