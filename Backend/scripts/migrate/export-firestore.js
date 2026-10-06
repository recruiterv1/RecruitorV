#!/usr/bin/env node
// Dump every Firestore collection to disk, ready to load into MongoDB.
//
//   node scripts/migrate/export-firestore.js            — everything
//   node scripts/migrate/export-firestore.js candidate_db
//
// Written as newline-delimited JSON, one document per line, so a 31,000-record
// collection never has to be held in memory at either end — and so a failed run
// can be resumed by collection rather than started again.
//
// Firestore types that have no JSON equivalent are tagged rather than flattened:
// a timestamp becomes {__t:'ts',v:…} and a reference {__t:'ref',v:…}, so the
// import can turn them back into real dates instead of guessing at strings.

const fs = require('fs');
const path = require('path');
const { db } = require('../../router/firebase_ad');

const OUT = path.join(__dirname, 'dump');
const BATCH = 1000;

const encode = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return v;
  if (typeof v.toDate === 'function') return { __t: 'ts', v: v.toDate().toISOString() };
  if (v._seconds !== undefined) return { __t: 'ts', v: new Date(v._seconds * 1000).toISOString() };
  if (v._firestore && v.path) return { __t: 'ref', v: v.path };
  if (Array.isArray(v)) return v.map(encode);
  const out = {};
  for (const [k, val] of Object.entries(v)) out[k] = encode(val);
  return out;
};

const listCollections = async () => (await db.listCollections()).map(c => c.id);

const dumpOne = async (name) => {
  const file = path.join(OUT, `${name}.ndjson`);
  const stream = fs.createWriteStream(file);
  let last = null, total = 0;

  for (;;) {
    // Paged by document id, so the read never holds a whole collection and a
    // collection larger than memory still exports.
    let q = db.collection(name).orderBy('__name__').limit(BATCH);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      stream.write(JSON.stringify({ _id: doc.id, ...encode(doc.data()) }) + '\n');
      total++;
    }
    last = snap.docs[snap.docs.length - 1].id;
    if (snap.size < BATCH) break;
    process.stdout.write(`\r  ${name}: ${total.toLocaleString()}`);
  }

  await new Promise(r => stream.end(r));
  const mb = (fs.statSync(file).size / 1048576).toFixed(1);
  console.log(`\r  ${name.padEnd(32)} ${String(total).padStart(8)} docs   ${mb.padStart(7)} MB`);
  return { name, total };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const names = (only.length ? only : await listCollections()).sort();

  console.log(`exporting ${names.length} collection(s) to ${OUT}\n`);
  const results = [];
  for (const n of names) {
    try { results.push(await dumpOne(n)); }
    catch (e) { console.error(`  ${n.padEnd(32)} FAILED: ${e.message}`); }
  }

  const docs = results.reduce((a, r) => a + r.total, 0);
  // A manifest, so the import can check it loaded everything that was exported.
  fs.writeFileSync(path.join(OUT, '_manifest.json'),
    JSON.stringify({ exportedAt: new Date().toISOString(), collections: results, docs }, null, 2));
  console.log(`\n${results.length} collections, ${docs.toLocaleString()} documents`);
  console.log(`manifest written — the import checks its counts against this`);
  process.exit(0);
})();
