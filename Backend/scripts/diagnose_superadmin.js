const adminCF = require('../model_fire/adminCF');
const recruiterF = require('../model_fire/recruiterF');
const { db } = require('../router/firebase_ad');

async function diagnoseSuperAdmin(email) {
  console.log(`🔍 DIAGNOSIS for email: ${email}`);
  
  // Test 1: adminCF.checkData
  console.log('\n1️⃣ Testing adminCF.checkData...');
  const adminResult = await adminCF.checkData(email);
  console.log('adminResult:', JSON.stringify(adminResult, null, 2));
  
  // Test 2: admin collection direct query
  console.log('\n2️⃣ Direct admin collection query...');
  const adminCol = db.collection('admin_db');
  const adminSnap = await adminCol.where('email', '==', email.toLowerCase()).get();
  console.log(`Admin docs found: ${adminSnap.size}`);
  adminSnap.docs.forEach(doc => {
    console.log('Admin doc:', doc.id, doc.data());
  });
  
  // Test 3: recruiterF fallback
  console.log('\n3️⃣ Testing recruiterF.findRecruiterByEmail...');
  const recruiterResult = await recruiterF.findRecruiterByEmail(email);
  console.log('recruiterResult:', JSON.stringify(recruiterResult, null, 2));
  
  // Test 4: All superadmins in recruiter_db
  console.log('\n4️⃣ All SuperAdmin in recruiter_db...');
  const recruiterSnap = await db.collection('recruiter_db')
    .where('role', '==', 'Super Admin')
    .get();
  console.log(`SuperAdmin count: ${recruiterSnap.size}`);
  recruiterSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log('SuperAdmin:', data.email, data.role, data.roleCategory);
  });
}

const SUPERADMIN_EMAILS = [
  // Add known superadmin emails here
  'admin@recruiterv.com', // example
  // Add your superadmin email
];

async function main() {
  console.log('🩺 SUPERADMIN AUTH DIAGNOSTIC');
  for (const email of SUPERADMIN_EMAILS) {
    await diagnoseSuperAdmin(email);
  }
  
  console.log('\n📋 USAGE: node diagnose_superadmin.js YOUR_EMAIL@example.com');
  console.log('   Or edit SUPERADMIN_EMAILS array above');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnoseSuperAdmin };

