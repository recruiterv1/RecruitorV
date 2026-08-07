require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');

const EMAIL = 'akansha.chaudhary@changeleaders.in';

async function check() {
  console.log('='.repeat(60));
  console.log('🔍 CHECKING FOR DUPLICATE CLIENTSPOC ACCOUNTS');
  console.log('='.repeat(60));

  // Get ALL docs, filter case-insensitively
  const all = await db.collection('admin_db').get();
  const matches = [];
  all.docs.forEach(doc => {
    const d = doc.data();
    if (d.email && String(d.email).toLowerCase().trim() === EMAIL.toLowerCase()) {
      matches.push({ id: doc.id, ...d });
    }
  });

  console.log(`\n📧 Found ${matches.length} account(s) for: ${EMAIL}`);
  matches.forEach((m, i) => {
    console.log(`\n─── Account ${i + 1} ───`);
    console.log(`   Doc ID: ${m.id}`);
    console.log(`   Name: ${m.name}`);
    console.log(`   Email (stored): "${m.email}"`);
    console.log(`   Role: ${m.roleCategory || m.role || 'N/A'}`);
    const stored = m.codPass || m.password;
    console.log(`   codPass: ${m.codPass ? '[BCRYPT]' : '[MISSING]'}`);
    console.log(`   password: ${m.password ? '[BCRYPT]' : '[MISSING]'}`);

    // Test the password
    if (stored) {
      const isBcrypt = String(stored).startsWith('$2') && String(stored).length >= 60;
      if (isBcrypt) {
        bcrypt.compare('345345', stored).then(match => {
          console.log(`   Password 345345 matches: ${match ? '✅ YES' : '❌ NO'}`);
        });
      } else {
        console.log(`   Stored plain: "${stored}" | matches 345345: ${stored === '345345' ? '✅ YES' : '❌ NO'}`);
      }
    } else {
      console.log('   ⚠️ NO PASSWORD FIELD — this account would fail login!');
    }
  });

  // Wait for async bcrypt compares
  setTimeout(() => process.exit(0), 2000);
}

check().catch(e => { console.error('Error:', e.message); process.exit(1); });
