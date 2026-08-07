const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function run() {
  const [recruiterSnap, coachSnap, expertSnap] = await Promise.all([
    db.collection('recruiter_db').get(),
    db.collection('coach_db').get(),
    db.collection('expert_db').get(),
  ]);

  // Firestore batches max 500 ops — chunk if needed
  const allDocs = [
    ...recruiterSnap.docs.map(d => ({ ref: d.ref, col: 'recruiter_db' })),
    ...coachSnap.docs.map(d => ({ ref: d.ref, col: 'coach_db' })),
    ...expertSnap.docs.map(d => ({ ref: d.ref, col: 'expert_db' })),
  ];

  let total = 0;
  const CHUNK = 490;

  for (let i = 0; i < allDocs.length; i += CHUNK) {
    const batch = db.batch();
    const chunk = allDocs.slice(i, i + CHUNK);
    chunk.forEach(({ ref, col }) => {
      batch.update(ref, { skills: [], specializedAt: [] });
      total++;
    });
    await batch.commit();
    console.log(`Committed ${Math.min(i + CHUNK, allDocs.length)} / ${allDocs.length}`);
  }

  console.log(`Done. Cleared skills & specializedAt on ${total} documents.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
