const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function run() {
  const [coachSnap, expertSnap] = await Promise.all([
    db.collection('coach_db').get(),
    db.collection('expert_db').get(),
  ]);

  const batch = db.batch();
  let count = 0;

  coachSnap.docs.forEach(doc => {
    if (doc.data().availableToCreateTeam !== true) {
      batch.update(doc.ref, { availableToCreateTeam: true });
      count++;
    }
  });

  expertSnap.docs.forEach(doc => {
    if (doc.data().availableToCreateTeam !== true) {
      batch.update(doc.ref, { availableToCreateTeam: true });
      count++;
    }
  });

  if (count === 0) {
    console.log('All coaches/experts already have availableToCreateTeam: true. Nothing to update.');
    process.exit(0);
  }

  await batch.commit();
  console.log(`Done. Updated ${count} record(s) (coaches + experts) to availableToCreateTeam: true.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
