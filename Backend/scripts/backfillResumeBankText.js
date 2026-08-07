/**
 * One-time backfill: extract and store `resumeText` for existing Resume-Bank
 * candidates (source: clientspoc_bulk) that don't have it yet, so the
 * assigned-positions match counter can compare against the actual CV.
 *
 * Usage: node scripts/backfillResumeBankText.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const { db } = require('../router/firebase_ad');
const { fetchCv, extractCvText } = require('../utils/cvMatch');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('\n=== Backfill resumeText for Resume-Bank candidates ===\n');
  const snap = await db.collection('candidate_db').where('source', '==', 'clientspoc_bulk').get();
  const todo = snap.docs.filter(d => {
    const c = d.data();
    return (c.cv_data) && !(c.resumeText && c.resumeText.length > 30);
  });
  console.log(`Total resume-bank : ${snap.size}`);
  console.log(`Need backfill     : ${todo.length}\n`);

  let done = 0, empty = 0, errors = 0;
  for (let i = 0; i < todo.length; i++) {
    const d = todo[i];
    const c = d.data();
    try {
      const fetched = await fetchCv(c.cv_data);
      let text = '';
      if (fetched) text = await extractCvText(fetched);
      if (text && text.trim().length > 30) {
        await d.ref.update({ resumeText: text.slice(0, 20000) });
        done++;
        console.log(`[${i + 1}/${todo.length}] ${c.candidate || '—'} → stored ${text.length} chars`);
      } else {
        empty++;
        console.log(`[${i + 1}/${todo.length}] ${c.candidate || '—'} → no readable text`);
      }
    } catch (e) {
      errors++;
      console.error(`[${i + 1}/${todo.length}] ${c.candidate || '—'} → ERROR: ${e.message}`);
    }
    await sleep(200);
  }

  console.log(`\n=== Done ===\nStored: ${done}\nNo text: ${empty}\nErrors: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
