/**
 * Script to fix a specific free plan user's record
 * This adds the missing maxPositions and planExpiryDate fields
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.log('Please ensure serviceAccountKey.json exists in the Backend directory');
    process.exit(1);
  }
}

const db = admin.firestore();

async function fixFreeUserRecord(userEmail) {
  try {
    console.log(`\n🔍 Searching for user: ${userEmail}`);
    
    // Find the user by email
    const snapshot = await db.collection('recruiter_db')
      .where('email', '==', userEmail)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ User not found with email:', userEmail);
      return;
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('\n📊 Current user data:');
    console.log('- planType:', userData.planType);
    console.log('- maxPositions:', userData.maxPositions);
    console.log('- planExpiryDate:', userData.planExpiryDate);
    console.log('- registrationDate:', userData.registrationDate);
    
    // Check if planType is 0 (Free Plan)
    if (userData.planType === 0) {
      console.log('\n✅ User has Free Plan (planType: 0)');
      
      // Calculate expiry date (30 days from registration or now)
      const registrationDate = userData.registrationDate?.toDate() || new Date();
      const expiryDate = new Date(registrationDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Update the user record
      const updateData = {
        maxPositions: 2,
        planExpiryDate: admin.firestore.Timestamp.fromDate(expiryDate)
      };
      
      // Add registrationDate if missing
      if (!userData.registrationDate) {
        updateData.registrationDate = admin.firestore.Timestamp.fromDate(new Date());
      }
      
      await db.collection('recruiter_db').doc(userDoc.id).update(updateData);
      
      console.log('\n✅ User record updated successfully!');
      console.log('Updated fields:');
      console.log('- maxPositions: 2');
      console.log('- planExpiryDate:', expiryDate.toISOString());
      if (!userData.registrationDate) {
        console.log('- registrationDate:', new Date().toISOString());
      }
      
    } else {
      console.log(`\n⚠️  User has planType: ${userData.planType} (not Free Plan)`);
      console.log('No changes needed.');
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing user record:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Free Plan User Record Fixer');
  console.log('================================\n');
  
  // Get email from command line argument
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.log('❌ Please provide user email as argument');
    console.log('\nUsage: node fixFreeUserRecord.js user@example.com');
    process.exit(1);
  }
  
  await fixFreeUserRecord(userEmail);
  
  console.log('\n✅ Script completed!');
  process.exit(0);
}

main();
