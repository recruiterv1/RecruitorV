/**
 * Reset ClientSPOC password for akansha.chaudhary@changeleaders.in
 * Run with: node Backend/scripts/reset_client_spoc_password.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');

const EMAIL = 'akansha.chaudhary@changeleaders.in';
const PASSWORD = '345345';

async function reset() {
  const snap = await db.collection('admin_db').where('email', '==', EMAIL.toLowerCase()).limit(1).get();
  if (snap.empty) {
    console.log('❌ User not found:', EMAIL);
    process.exit(1);
  }

  const doc = snap.docs[0];
  const data = doc.data();
  console.log('Found user:', data.email, '| role:', data.role, '| roleCategory:', data.roleCategory);

  const salt = await bcrypt.genSalt(10);
  const codPass = await bcrypt.hash(PASSWORD, salt);

  await db.collection('admin_db').doc(doc.id).update({ codPass });
  console.log('✅ Password reset successfully for:', EMAIL);
  console.log('   New password:', PASSWORD);

  // Verify the new password works
  const match = await bcrypt.compare(PASSWORD, codPass);
  console.log('   Verification:', match ? '✅ PASS' : '❌ FAIL');
  process.exit(0);
}

reset().catch(e => { console.error('❌', e.message); process.exit(1); });
