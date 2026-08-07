const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');
const adminData = db.collection('admin_db');

async function createSuperAdmin() {
  const email = 'roshan@freepathshala.org';
  const name = 'Roshan';
  
  console.log(`🛠️  Creating SuperAdmin for: ${email}`);
  
  // Check if already exists
  const existing = await adminData.where('email', '==', email.toLowerCase()).get();
  if (!existing.empty) {
    console.log('✅ SuperAdmin already exists:', existing.docs[0].data());
    return;
  }
  
  // Generate simple password hash (admin123 - change later)
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create superadmin record
  await adminData.add({
    email: email.toLowerCase(),
    name: name,
    role: 'Super Admin',
    roleCategory: 'SuperAdmin',
    phone: 'N/A',
    codPass: hashedPassword,
    lastActive: new Date(),
    createdAt: new Date()
  });
  
  console.log('✅ SuperAdmin CREATED!');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Name: ${name}`);
  console.log(`🔐 Password: admin123 (change via admin panel)`);
  console.log('🔄 REFRESH superadmin page - table will work!');
}

createSuperAdmin().catch(console.error);

