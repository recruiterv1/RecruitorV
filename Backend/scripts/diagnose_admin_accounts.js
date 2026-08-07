require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { db } = require('../router/firebase_ad');

async function run() {
  // Test the Jayashree account (mixed-case email)
  const mixedCaseEmail = 'Jayashree.prakash@changeleaders.in';
  const snap = await db.collection('admin_db').where('email', '==', mixedCaseEmail).limit(1).get();
  console.log('Mixed-case query (original case):', snap.empty ? 'NOT FOUND' : 'FOUND');

  const lowerEmail = mixedCaseEmail.toLowerCase();
  const snap2 = await db.collection('admin_db').where('email', '==', lowerEmail).limit(1).get();
  console.log('Lowercase query:', snap2.empty ? 'NOT FOUND' : 'FOUND');

  if (!snap.empty) {
    const d = snap.docs[0].data();
    console.log('Stored email:', d.email);
    console.log('codPass present:', !!d.codPass);
  }

  // Check superadmin account in admin_db
  const saSnap = await db.collection('admin_db').doc('superadmin').get();
  if (saSnap.exists) {
    const sa = saSnap.data();
    console.log('');
    console.log('SuperAdmin (admin_db) account:', sa.email);
    console.log('  codPass:', !!sa.codPass, '| password:', !!sa.password);
    if (!sa.codPass && !sa.password) {
      console.log('  => SuperAdmin has NO password -> would get Invalid Credentials!');
    }
  }

  // Check if superadmin exists in recruiter_db as fallback
  const recSnap = await db.collection('recruiter_db').where('email', '==', 'roshan@freepathshala.org').limit(1).get();
  if (!recSnap.empty) {
    const rec = recSnap.docs[0].data();
    console.log('');
    console.log('SuperAdmin in recruiter_db:', rec.email);
    console.log('  role:', rec.role, '| roleCategory:', rec.roleCategory);
    console.log('  password present:', !!rec.password, '| codPass:', !!rec.codPass);
  } else {
    console.log('');
    console.log('SuperAdmin NOT in recruiter_db');
  }

  // Check the ikumarmrigank@gmail.com SuperAdmin account
  const mrigSnap = await db.collection('admin_db').where('email', '==', 'ikumarmrigank@gmail.com').limit(1).get();
  if (!mrigSnap.empty) {
    const m = mrigSnap.docs[0].data();
    console.log('');
    console.log('Mrigank SuperAdmin (admin_db):', m.email);
    console.log('  role:', m.roleCategory || m.role);
    console.log('  codPass present:', !!m.codPass, '| password:', !!m.password);
  }

  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
