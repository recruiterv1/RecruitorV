const { db } = require('../router/firebase_ad');
const adminDb = db.collection('admin_db');

async function updateUserRole() {
  const targetEmail = 'chandan.dhami@changeleaders.in';
  
  console.log('Looking for user:', targetEmail);
  
  try {
    // Find the user
    const snap = await adminDb.where('email', '==', targetEmail).limit(1).get();
    
    if (snap.empty) {
      console.log('User not found with email:', targetEmail);
      
      // Try to find users with 'clientspoc' in email
      console.log('\nSearching for ClientSPOC users...');
      const allSnap = await adminDb.limit(20).get();
      console.log(`Found ${allSnap.size} users in admin_db`);
      
      allSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.email}: role=${data.role}, roleCategory=${data.roleCategory}`);
      });
      return;
    }
    
    const docId = snap.docs[0].id;
    const data = snap.docs[0].data();
    
    console.log('\nUser found:', docId);
    console.log('Current role:', data.role);
    console.log('Current roleCategory:', data.roleCategory);
    
    // Update roleCategory to 'ClientSPOC'
    const newRoleCategory = 'ClientSPOC';
    
    await adminDb.doc(docId).update({
      roleCategory: newRoleCategory,
      role: data.role || newRoleCategory
    });
    
    console.log(`\n✅ Updated roleCategory to: ${newRoleCategory}`);
    
    // Verify the update
    const updatedDoc = await adminDb.doc(docId).get();
    const updatedData = updatedDoc.data();
    console.log('\nVerification after update:');
    console.log('role:', updatedData.role);
    console.log('roleCategory:', updatedData.roleCategory);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateUserRole();

