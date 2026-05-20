// Use the existing Firebase admin setup from the project
const { admin, db } = require('../router/firebase_ad');

async function fixUserPlanExpiryDate(userEmail) {
  try {
    console.log(`\n🔍 Looking for user: ${userEmail}`);
    
    // Find user by email
    const recruiterSnapshot = await db.collection('recruiter_db')
      .where('email', '==', userEmail)
      .get();
    
    if (recruiterSnapshot.empty) {
      console.log('❌ User not found');
      return;
    }
    
    const userDoc = recruiterSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('\n📋 Current User Data:');
    console.log('- Email:', userData.email);
    console.log('- Plan Type:', userData.planType);
    console.log('- Registration Date:', userData.registrationDate?.toDate?.() || userData.registrationDate || 'NOT SET');
    console.log('- Plan Expiry Date:', userData.planExpiryDate?.toDate?.() || userData.planExpiryDate || 'NOT SET');
    console.log('- Max Positions:', userData.maxPositions);
    
    // Check if planExpiryDate is missing
    if (!userData.planExpiryDate && userData.planType === 0) {
      console.log('\n⚠️  planExpiryDate is missing! Setting it now...');
      
      // Use registrationDate if available, otherwise use current date
      const registrationDate = userData.registrationDate?.toDate?.() || 
                              (userData.registrationDate ? new Date(userData.registrationDate) : new Date());
      
      // Calculate expiry date (30 days from registration)
      const expiryDate = new Date(registrationDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Update the user record
      await db.collection('recruiter_db').doc(userDoc.id).update({
        planExpiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        registrationDate: admin.firestore.Timestamp.fromDate(registrationDate)
      });
      
      console.log('\n✅ Updated successfully!');
      console.log('- Registration Date:', registrationDate.toISOString());
      console.log('- Plan Expiry Date:', expiryDate.toISOString());
      console.log('- Days from now:', Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)));
      
    } else if (userData.planExpiryDate) {
      const expiryDate = userData.planExpiryDate.toDate();
      const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      console.log('\n✅ planExpiryDate already set');
      console.log('- Expiry Date:', expiryDate.toISOString());
      console.log('- Days Remaining:', Math.max(0, daysRemaining));
    } else {
      console.log('\n✅ User is on paid plan, no expiry date needed');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node fixUserPlanExpiryDate.js <user-email>');
  console.log('Example: node fixUserPlanExpiryDate.js user@example.com');
  process.exit(1);
}

fixUserPlanExpiryDate(userEmail)
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
