/**
 * One-time script: creates the Admin user in admin_db
 * Run with: node Backend/scripts/seedAdminUser.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');

const EMAIL = 'admin@recruiterv.com';
const PASSWORD = 'Admin@54321';
const NAME = 'Admin';
const ROLE = 'Admin';

async function seed() {
  try {
    const adminData = db.collection('admin_db');

    // Check if already exists
    const snap = await adminData.where('email', '==', EMAIL).limit(1).get();
    if (!snap.empty) {
      console.log('Admin user already exists:', EMAIL);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const codPass = await bcrypt.hash(PASSWORD, salt);

    await adminData.add({
      email: EMAIL,
      name: NAME,
      role: ROLE,
      roleCategory: ROLE,
      codPass,
      createdAt: new Date()
    });

    console.log('✅ Admin user created:', EMAIL);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
