#!/usr/bin/env node
// Move existing Firebase Storage files onto the server's disk store (utils/localBucket.js)
// and repoint the links saved in Firestore. Needs Blaze enabled while it runs.
//
//   node scripts/migrate/storage-to-disk.js download            — bucket -> ./migrated-storage
//   node scripts/migrate/storage-to-disk.js rewrite             — dry run: count Firestore links to change
//   node scripts/migrate/storage-to-disk.js rewrite --apply     — rewrite them for real
//
// Each file keeps its path and its original download token, so a link only changes host:
//   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=T
//   -> <FILES_ORIGIN>/v0/b/local/o/<path>?alt=media&token=T
// Upload ./migrated-storage to ~/recruiterv-storage on the server (rsync) before `rewrite --apply`.

const fs = require('fs');
const path = require('path');
const { admin, db } = require('../../router/firebase_ad');

const OUT = path.resolve(process.env.MIGRATE_OUT || path.join(__dirname, '../../migrated-storage'));
const ORIGIN = (process.env.FILES_ORIGIN || 'https://www.recruiterv.com').replace(/\/$/, '');
const LINK = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\//g;

const download = async () => {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();
  let n = 0, bytes = 0, skipped = 0, failed = 0;
  const queue = files.filter((f) => !f.name.endsWith('/'));
  const one = async (f) => {
    const dest = path.join(OUT, f.name);
    if (fs.existsSync(dest) && fs.existsSync(dest + '.meta.json')) { skipped++; return; }
    try {
      const [meta] = await f.getMetadata();
      const token = String(meta.metadata?.firebaseStorageDownloadTokens || '').split(',')[0] || null;
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await f.download({ destination: dest });
      await fs.promises.writeFile(dest + '.meta.json', JSON.stringify({ contentType: meta.contentType || 'application/octet-stream', token }));
      n++; bytes += Number(meta.size || 0);
      if (n % 200 === 0) console.log(`  ${n} files…`);
    } catch (e) { failed++; console.error('  failed:', f.name, e.message); }
  };
  // 24 downloads in flight at once; each file is a few round trips, so sequential is hours.
  await Promise.all(Array.from({ length: 24 }, async () => { while (queue.length) await one(queue.shift()); }));
  if (failed) console.log(`${failed} files failed — re-run to retry them.`);
  console.log(`Downloaded ${n} files (${(bytes / 1048576).toFixed(1)} MB), skipped ${skipped} already present, into ${OUT}`);
  const noToken = files.length ? 'Files without a token cannot be served until they get one.' : '';
  if (noToken) console.log(noToken);
};

// Replace links inside any string, array or map value; returns [newValue, changed].
const walk = (v) => {
  if (typeof v === 'string') {
    const out = v.replace(LINK, `${ORIGIN}/v0/b/local/o/`);
    return [out, out !== v];
  }
  if (Array.isArray(v)) {
    let ch = false;
    const out = v.map((x) => { const [y, c] = walk(x); ch = ch || c; return y; });
    return [out, ch];
  }
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    let ch = false;
    const out = {};
    for (const [k, x] of Object.entries(v)) { const [y, c] = walk(x); ch = ch || c; out[k] = y; }
    return [out, ch];
  }
  return [v, false];
};

const rewrite = async (apply) => {
  const backup = apply ? fs.createWriteStream(path.join(OUT, '..', 'link-rewrite-backup.ndjson'), { flags: 'a' }) : { write() {} };
  const cols = await db.listCollections();
  let docs = 0, changed = 0;
  for (const col of cols) {
    let last = null, colChanged = 0;
    for (;;) {
      let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(400);
      if (last) q = q.startAfter(last);
      const snap = await q.get();
      if (snap.empty) break;
      const batch = db.batch();
      let ops = 0;
      for (const d of snap.docs) {
        docs++;
        const orig = d.data();
        const [data, ch] = walk(orig);
        if (ch) {
          colChanged++; changed++;
          if (apply) {
            // Touch only the top-level fields that held a link (update, not set), and keep the
            // old values in a backup file so the change can be undone.
            const patch = {}, before = {};
            for (const k of Object.keys(orig)) if (walk(orig[k])[1]) { patch[k] = data[k]; before[k] = orig[k]; }
            backup.write(JSON.stringify({ path: d.ref.path, before }) + '\n');
            batch.update(d.ref, patch); ops++;
          }
        }
      }
      if (apply && ops) await batch.commit();
      last = snap.docs[snap.docs.length - 1];
    }
    if (colChanged) console.log(`  ${col.id}: ${colChanged} docs ${apply ? 'rewritten' : 'would change'}`);
  }
  if (apply) backup.end();
  console.log(`${apply ? 'Rewrote' : 'Dry run:'} ${changed} of ${docs} documents contain Firebase Storage links.`);
};

(async () => {
  const [cmd, flag] = process.argv.slice(2);
  if (cmd === 'download') await download();
  else if (cmd === 'rewrite') await rewrite(flag === '--apply');
  else console.log('usage: download | rewrite [--apply]');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
