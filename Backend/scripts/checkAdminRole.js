require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { db } = require('../router/firebase_ad');

async function check() {
  const snap = await db.collection('admin_db').where('email','==','admin@recruiterv.com').get();
  if (snap.empty) { console.log('NOT FOUND'); }
  else {
    const d = snap.docs[0].data();
    console.log('role:', d.role, '| roleCategory:', d.roleCategory, '| name:', d.name);
  }
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
