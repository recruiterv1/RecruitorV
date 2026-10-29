#!/usr/bin/env node
// Run the same queries on Firestore and on the MySQL store and compare the results.
// Needs FIREBASE_SERVICE_ACCOUNT (Firestore) and MYSQL_* (MySQL). Read-only on both sides.
const admin = require('firebase-admin');
const { db: sql, Timestamp } = require('../../db/mysql');

const svc = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(svc) });
const fs = admin.firestore();

const ids = (s) => s.docs.map((d) => d.id);
const sortKeys = (x) => (Array.isArray(x) ? x.map(sortKeys) : x && typeof x === 'object' && !x.toDate ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])])) : x);
const norm = (v) => JSON.stringify(sortKeys(v), (k, x) => (x && x._seconds !== undefined && x.toDate ? { ts: x.toDate().toISOString() } : x && x._seconds !== undefined ? { ts: new Date(x._seconds * 1000 + Math.floor(x._nanoseconds / 1e6)).toISOString() } : x));

let pass = 0, fail = 0;
const check = async (name, build, { ordered = false, data = false } = {}) => {
  try {
    const [a, b] = await Promise.all([build(fs, admin.firestore.Timestamp).get(), build(sql, Timestamp).get()]);
    let A = ids(a), B = ids(b);
    let ok;
    if (ordered) ok = JSON.stringify(A) === JSON.stringify(B);
    else { ok = A.length === B.length && JSON.stringify([...A].sort()) === JSON.stringify([...B].sort()); }
    if (ok && data) ok = a.docs.every((d, i) => { const m = b.docs.find((x) => x.id === d.id); return m && norm(d.data()) === norm(m.data()); });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${A.length} vs ${B.length})`);
    ok ? pass++ : fail++;
  } catch (e) { fail++; console.log(`FAIL  ${name}  error: ${String(e.message).slice(0, 120)}`); }
};

(async () => {
  const sample = async (col, field) => { const s = await fs.collection(col).limit(30).get(); const d = s.docs.find((x) => x.get(field)); return d ? d.get(field) : null; };
  const email = await sample('recruiter_db', 'email');
  const cemail = await sample('candidate_db', 'email');
  const posId = await sample('candidate_db', 'pos_id');

  await check('recruiter by email ==', (d) => d.collection('recruiter_db').where('email', '==', email), { data: true });
  await check('recruiter by email, wrong case (must be empty)', (d) => d.collection('recruiter_db').where('email', '==', String(email).toUpperCase()));
  await check('candidate by email ==', (d) => d.collection('candidate_db').where('email', '==', cemail), { data: true });
  if (posId) await check('candidate by pos_id ==', (d) => d.collection('candidate_db').where('pos_id', '==', posId));
  await check('candidate status in [..]', (d) => d.collection('candidate_db').where('status', 'in', ['Applied', 'Submitted']));
  await check('candidate status == + limit 25 (unordered)', (d) => d.collection('candidate_db').where('status', '==', 'Screen Reject').limit(25), { ordered: true });
  await check('recruiter_db orderBy createdAt desc limit 20', (d) => d.collection('recruiter_db').orderBy('createdAt', 'desc').limit(20), { ordered: true });
  await check('notifications orderBy createdAt desc limit 50', (d) => d.collection('notifications').orderBy('createdAt', 'desc').limit(50), { ordered: true });
  await check('notifications orderBy desc limit 10 offset 10', (d) => d.collection('notifications').orderBy('createdAt', 'desc').limit(10).offset(10), { ordered: true });
  await check('admin_AddPos orderBy datePosted desc', (d) => d.collection('admin_AddPos').orderBy('datePosted', 'desc'), { ordered: true });
  await check('email_templates all', (d) => d.collection('email_templates'));
  await check('google_users all', (d) => d.collection('google_users'));
  await check('timestamp >= (createdAt on recruiter_db)', (d, T) => d.collection('recruiter_db').where('createdAt', '>=', T.fromDate(new Date('2026-09-01T00:00:00Z'))));
  await check('timestamp < (expiresAt on candidate_drafts)', (d, T) => d.collection('candidate_drafts').where('expiresAt', '<', T.fromDate(new Date())));
  await check('status != ', (d) => d.collection('admin_AddPos').where('status', '!=', 'Closed'));
  await check('select() projection', (d) => d.collection('recruiter_db').where('email', '==', email).select('email', 'name'), { data: true });
  await check('array-contains', (d) => d.collection('coach_db').where('skillCategory', 'array-contains', 'Finance'));

  const cf = (await fs.collection('candidate_db').where('status', '==', 'Applied').count().get()).data().count;
  const cs = (await sql.collection('candidate_db').where('status', '==', 'Applied').count().get()).data().count;
  console.log(`${cf === cs ? 'PASS' : 'FAIL'}  count() candidate_db status==Applied  (${cf} vs ${cs})`); cf === cs ? pass++ : fail++;

  // doc get by id
  const one = (await fs.collection('recruiter_db').limit(1).get()).docs[0];
  const g = await sql.collection('recruiter_db').doc(one.id).get();
  const same = g.exists && norm(g.data()) === norm(one.data());
  console.log(`${same ? 'PASS' : 'FAIL'}  doc(id).get() round trip`); same ? pass++ : fail++;

  console.log(`\n${pass} passed, ${fail} failed`);
  await sql.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('parity test failed:', String(e.message).slice(0, 200)); process.exit(1); });
