const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
(async () => {
  for (const col of ['recruiter_db','coach_db','expert_db']) {
    const snap = await db.collection(col).get();
    let unv=0, unvApproved=0, tot=0;
    snap.forEach(d=>{const p=d.data();tot++;if(p.isVerified===false){unv++;const st=(p.accountStatus||'').toLowerCase();if(st==='approved')unvApproved++;}});
    console.log(`${col}: total=${tot} | isVerified=false: ${unv} (approved: ${unvApproved})`);
  }
  process.exit(0);
})();
