const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const derive = (name) => { const p=(name||'').trim().split(/\s+/); const f=(p[0]||'recruiter').toLowerCase().replace(/[^a-z0-9]/g,''); const l=(p[1]||'').toLowerCase().replace(/[^a-z0-9]/g,''); return l?`${f}.${l}@recruiterv.com`:`${f}@recruiterv.com`; };
(async () => {
  const ia = await db.collection('inbox_access').get();
  const paid = new Set(); ia.forEach(d=>{ if(d.data().enabled===true) paid.add(d.id.toLowerCase()); });
  console.log('Paid/enabled inbox_access holders:', paid.size);
  for (const col of ['recruiter_db','coach_db','expert_db']) {
    const snap = await db.collection(col).get();
    snap.forEach(doc=>{ const d=doc.data(); const login=(d.email||'').toLowerCase();
      if (paid.has(login) && d.isVerified===false) console.log(`  ⚠ [${col}] ${d.name} <${login}> isVerified=false → mail dropped (derived ${derive(d.name)})`);
    });
  }
  process.exit(0);
})();
