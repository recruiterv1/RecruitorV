/**
 * Fixes admin@recruiterv.com password hash in admin_db
 * Run with: node Backend/scripts/fixAdminPassword.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');

const EMAIL = 'admin@recruiterv.com';
const PASSWORD = 'Admin@54321';

async function fix() {
  const snap = await db.collection('admin_db').where('email', '==', EMAIL).limit(1).get();
  if (snap.empty) {
    console.log('❌ User not found:', EMAIL);
    process.exit(1);
  }

  const doc = snap.docs[0];
  const data = doc.data();
  console.log('Found admin:', data.email, '| role:', data.role, '| roleCategory:', data.roleCategory);
  console.log('Has codPass:', !!data.codPass);

  const salt = await bcrypt.genSalt(10);
  const codPass = await bcrypt.hash(PASSWORD, salt);

  await db.collection('admin_db').doc(doc.id).update({ codPass, role: 'Admin', roleCategory: 'Admin' });
  console.log('✅ Password updated for:', EMAIL);
  process.exit(0);
}

fix().catch(e => { console.error('❌', e.message); process.exit(1); });
