require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const adminCF = require('../model_fire/adminCF');

async function verify() {
  console.log('='.repeat(60));
  console.log('🔐 VERIFY ADMIN LOGIN FIX');
  console.log('='.repeat(60));

  // Test 1: Main admin account with correct password
  console.log('\n1️⃣ Testing main admin account (admin@recruiterv.com)...');
  const adminRes = await adminCF.checkCredentials('admin@recruiterv.com', 'Admin@54321');
  console.log('   checkCredentials:', adminRes.success ? '✅ SUCCESS' : '❌ FAILED - ' + adminRes.message);
  if (adminRes.success) console.log('   Admin:', adminRes.admin.name, '| role:', adminRes.admin.roleCategory);

  // Test 2: Mixed-case email account (Jayashree) — the key fix
  console.log('\n2️⃣ Testing mixed-case email account (Jayashree.prakash@...)...');
  console.log('   NOTE: Password unknown for this test account — only verifying lookup path works.');
  const jayRes = await adminCF.checkData('Jayashree.prakash@changeleaders.in');
  console.log('   checkData(mixed-case):', jayRes.success ? '✅ FOUND' : '❌ NOT FOUND');
  if (jayRes.success) console.log('   Found:', jayRes.admin.name, '| email:', jayRes.admin.email);

  // Test 3: SuperAdmin fallback (roshan@freepathshala.org) — admin_db has no password, recruiter_db does
  console.log('\n3️⃣ Testing SuperAdmin fallback (roshan@freepathshala.org)...');
  const saRes = await adminCF.checkData('roshan@freepathshala.org');
  console.log('   checkData(superadmin):', saRes.success ? '✅ FOUND' : '❌ NOT FOUND');
  if (saRes.success) console.log('   Found:', saRes.admin.name, '| email:', saRes.admin.email);

  // Test 4: Vendor account lookup
  console.log('\n4️⃣ Testing vendor account lookup (testvendor@yopmail.com)...');
  const vendorRes = await adminCF.checkData('testvendor@yopmail.com');
  console.log('   checkData(vendor):', vendorRes.success ? '✅ FOUND' : '❌ NOT FOUND');
  if (vendorRes.success) console.log('   Found:', vendorRes.admin.name, '| email:', vendorRes.admin.email);

  // Test 5: Wrong password should fail
  console.log('\n5️⃣ Testing wrong password (should fail)...');
  const wrongRes = await adminCF.checkCredentials('admin@recruiterv.com', 'WrongPass123');
  console.log('   checkCredentials(wrong pass):', wrongRes.success ? '❌ SHOULD HAVE FAILED' : '✅ Correctly rejected');

  process.exit(0);
}

verify().catch(e => { console.error('Error:', e.message); process.exit(1); });
