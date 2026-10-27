#!/usr/bin/env node
// Load the Firestore export (scripts/migrate/dump/*.ndjson) into the MySQL document store, then
// verify every collection's row count against the export manifest.
//
//   DB_DRIVER=mysql MYSQL_HOST=… MYSQL_USER=… MYSQL_PASSWORD=… MYSQL_DATABASE=… \
//     node scripts/migrate/import-to-mysql.js [--truncate] [collection …]
//
// Idempotent: rows are upserted by (collection, id), so a failed run can simply be re-run.
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { db } = require('../../db/mysql');

const DUMP = path.join(__dirname, 'dump');
const BATCH = 200;

(async () => {
  const args = process.argv.slice(2);
  const truncate = args.includes('--truncate');
  const only = args.filter((a) => !a.startsWith('--'));
  const manifest = JSON.parse(fs.readFileSync(path.join(DUMP, '_manifest.json'), 'utf8'));
  const cols = manifest.collections.filter((c) => !only.length || only.includes(c.name));

  db._init();
  await db._ready;
  const pool = db._pool;
  if (truncate) { await pool.query('TRUNCATE TABLE docs'); console.log('docs truncated'); }

  let bad = 0;
  for (const c of cols) {
    const file = path.join(DUMP, `${c.name}.ndjson`);
    if (!fs.existsSync(file)) { console.log(`  ${c.name}: no file`); continue; }
    const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
    let rows = [], n = 0;
    const flush = async () => {
      if (!rows.length) return;
      const ph = rows.map(() => '(?,?,?)').join(',');
      await pool.query(`INSERT INTO docs (collection, id, data) VALUES ${ph} ON DUPLICATE KEY UPDATE data = VALUES(data)`, rows.flat());
      n += rows.length; rows = [];
    };
    for await (const line of rl) {
      if (!line.trim()) continue;
      const doc = JSON.parse(line);
      // the exporter writes {"_id": "...", ...fields}; keep every other field verbatim
      const { _id, ...data } = doc;
      rows.push([c.name, String(_id), JSON.stringify(data)]);
      if (rows.length >= BATCH) await flush();
    }
    await flush();
    const [[{ n: have }]] = await pool.query('SELECT COUNT(*) AS n FROM docs WHERE collection = ?', [c.name]);
    const ok = have === c.total;
    if (!ok) bad++;
    console.log(`  ${c.name.padEnd(34)} ${String(have).padStart(6)} / ${c.total}  ${ok ? 'ok' : 'MISMATCH'}`);
  }
  console.log(bad ? `${bad} collection(s) did not match the manifest` : 'All collection counts match the export manifest.');
  await db.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
