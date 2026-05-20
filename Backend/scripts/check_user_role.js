const { db } = require('./router/firebase_ad');
const adminDb = db.collection('admin_db');

async function checkUserRole() {
  console.log('Checking admin_db users...\n');
  
  try {
    // Get all admin users
    const allSnap = await adminDb.limit(10).get();
    console.log('Total admin users found:', allSnap.size);
    console.log('='.repeat(60));
    
    if (allSnap.empty) {
      console.log('No users found in admin_db collection');
      return;
    }
    
    allSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log('\nUser ID:', doc.id);
      console.log('Email:', data.email || 'N/A');
      console.log('role:', data.role || 'NOT SET');
      console.log('roleCategory:', data.roleCategory || 'NOT SET');
      console.log('-'.repeat(40));
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('NOTE: For "My Positions" menu to appear, roleCategory must be "ClientSPOC"');
    console.log('The sidebar checks: user?.roleCategory?.toLowerCase() === "clientspoc"');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserRole();

