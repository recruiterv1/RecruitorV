/**
 * Diagnostic script to test admin/clientspoc/vendor login
 * Run with: node Backend/scripts/diagnose_admin_login.js <email> <password>
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');

async function diagnose(email, pass) {
  console.log('='.repeat(60));
  console.log('🔐 ADMIN/CLIENTSPOC/VENDOR LOGIN DIAGNOSTIC');
  console.log('='.repeat(60));
  
  const normalizedEmail = (email || '').toLowerCase().trim();
  console.log(`\n📧 Looking up: "${normalizedEmail}" in admin_db`);
  
  // 1. Exact lowercase query
  const snap = await db.collection('admin_db').where('email', '==', normalizedEmail).limit(1).get();
  console.log(`   Exact lowercase query: ${snap.empty ? 'NOT FOUND' : 'FOUND'}`);
  
  if (snap.empty) {
    // 2. Try with original case (not normalized)
    const snap2 = await db.collection('admin_db').where('email', '==', email).limit(1).get();
    console.log(`   Original-case query: ${snap2.empty ? 'NOT FOUND' : 'FOUND'}`);
    
    if (!snap2.empty) {
      const doc = snap2.docs[0];
      const data = doc.data();
      console.log(`\n⚠️  FOUND with original case but NOT with lowercase!`);
      console.log(`   Stored email: "${data.email}"`);
      console.log(`   Input email: "${email}"`);
      console.log(`   Lowercase input: "${normalizedEmail}"`);
      console.log('\n   This is the ROOT CAUSE: email case mismatch.');
      console.log('   The stored email has different casing than the lookup.');
      
      // Check password fields
      console.log('\n🔑 Password fields:');
      console.log(`   codPass: ${data.codPass ? (data.codPass.startsWith('$2') ? '[BCRYPT_HASH]' : '[PLAIN:' + data.codPass + ']') : '[MISSING]'}`);
      console.log(`   password: ${data.password ? (data.password.startsWith('$2') ? '[BCRYPT_HASH]' : '[PLAIN:' + data.password + ']') : '[MISSING]'}`);
      
      // Test password
      const storedPass = data.codPass || data.password;
      if (storedPass) {
        const isBcrypt = storedPass.startsWith('$2') && storedPass.length >= 60;
        if (isBcrypt) {
          const match = await bcrypt.compare(pass, storedPass);
          console.log(`   Password match (bcrypt): ${match ? '✅ YES' : '❌ NO'}`);
        } else {
          console.log(`   Password match (plain): ${pass === storedPass ? '✅ YES' : '❌ NO'}`);
        }
      }
      
      return;
    }
    
    // 3. Check all docs in admin_db to see the email formats
    console.log('\n📋 All admin_db email formats:');
    const allSnap = await db.collection('admin_db').get();
    allSnap.docs.forEach(doc => {
      const d = doc.data();
      const isLower = d.email === d.email?.toLowerCase();
      console.log(`   - "${d.email}" (${isLower ? 'lowercase' : 'MIXED CASE'}) | role: ${d.roleCategory || d.role || 'N/A'}`);
    });
  } else {
    const doc = snap.docs[0];
    const data = doc.data();
    console.log(`\n✅ User found with lowercase query`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Role: ${data.roleCategory || data.role || 'N/A'}`);
    
    // Check password fields
    console.log('\n🔑 Password fields:');
    console.log(`   codPass: ${data.codPass ? (data.codPass.startsWith('$2') ? '[BCRYPT_HASH]' : '[PLAIN:' + data.codPass + ']') : '[MISSING]'}`);
    console.log(`   password: ${data.password ? (data.password.startsWith('$2') ? '[BCRYPT_HASH]' : '[PLAIN:' + data.password + ']') : '[MISSING]'}`);
    
    const storedPass = data.codPass || data.password;
    if (!storedPass) {
      console.log('\n❌ NO PASSWORD FIELD FOUND!');
      console.log('   Neither codPass nor password is set.');
      return;
    }
    
    // Test password
    const isBcrypt = storedPass.startsWith('$2') && storedPass.length >= 60;
    if (isBcrypt) {
      const match = await bcrypt.compare(pass, storedPass);
      console.log(`\n🔐 Password match (bcrypt): ${match ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`\n🔐 Password match (plain): ${pass === storedPass ? '✅ YES' : '❌ NO'}`);
    }
  }
}

const email = process.argv[2] || 'admin@recruiterv.com';
const pass = process.argv[3] || 'Admin@54321';

diagnose(email, pass)
  .then(() => process.exit(0))
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
