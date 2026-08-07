/**
 * One-time backfill: compute and store a compact `matchTokens` blob for every
 * "available" candidate with a CV (CV present, not in an active pipeline on an
 * active position). This is the field the assigned-positions resume-bank match
 * counter uses, so the full available talent pool (~2.3k) becomes matchable.
 *
 * For each candidate it uses the already-stored resumeText if present, otherwise
 * downloads + parses the CV once. Stores both resumeText (capped) and matchTokens.
 *
 * Usage:
 *   node scripts/backfillMatchTokens.js          # DRY RUN (counts only)
 *   node scripts/backfillMatchTokens.js --apply  # LIVE
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const { db } = require('../router/firebase_ad');
const { fetchCv, extractCvText } = require('../utils/cvMatch');
const { computeMatchTokens, isActivePos, TERMINAL_STATUSES } = require('../utils/resumeBankMatch');

const APPLY = process.argv.includes('--apply');
const lc = (s) => (s || '').toString().toLowerCase().trim();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log(`\n=== Backfill matchTokens for available pool — ${APPLY ? 'LIVE' : 'DRY RUN'} ===\n`);

  // Active positions → set of active pos_ids.
  const posSnap = await db.collection('admin_AddPos').get();
  const activePos = new Set();
  posSnap.docs.forEach(d => { const p = d.data(); if (isActivePos(p.status) && p.pos_id) activePos.add(p.pos_id); });

  const snap = await db.collection('candidate_db').get();
  const todo = snap.docs.filter(d => {
    const c = d.data();
    if (!(c.cv_data || c.cv_url)) return false;
    if (c.matchTokens && c.matchTokens.length > 0) return false;       // already done
    const terminal = TERMINAL_STATUSES.has(lc(c.statusa));
    const inUse = !terminal && c.pos_id && activePos.has(c.pos_id);
    return !inUse;                                                     // available only
  });

  console.log(`Total candidates : ${snap.size}`);
  console.log(`To backfill      : ${todo.length}\n`);
  if (!APPLY) { console.log('DRY RUN — re-run with --apply to execute.\n'); process.exit(0); }

  let fromText = 0, fromCv = 0, empty = 0, errors = 0;
  for (let i = 0; i < todo.length; i++) {
    const d = todo[i];
    const c = d.data();
    try {
      let text = (c.resumeText && c.resumeText.length > 30) ? c.resumeText : '';
      let parsed = false;
      if (!text) {
        const fetched = await fetchCv(c.cv_data || c.cv_url);
        if (fetched) { text = await extractCvText(fetched); parsed = true; }
      }
      const tokens = computeMatchTokens(text, c);
      const update = { matchTokens: tokens };
      if (parsed && text && text.length > 30) update.resumeText = text.slice(0, 12000);
      await d.ref.update(update);
      if (text && text.length > 30) { parsed ? fromCv++ : fromText++; } else { empty++; }
      if ((i + 1) % 50 === 0 || i === todo.length - 1) {
        console.log(`[${i + 1}/${todo.length}] processed (fromText:${fromText} fromCV:${fromCv} empty:${empty} err:${errors})`);
      }
    } catch (e) {
      errors++;
      if (errors <= 20) console.error(`[${i + 1}] ${c.candidate || '—'} ERROR: ${e.message}`);
    }
    await sleep(120);
  }

  console.log(`\n=== Done ===\nFrom stored text: ${fromText}\nParsed from CV  : ${fromCv}\nNo readable text: ${empty}\nErrors          : ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
