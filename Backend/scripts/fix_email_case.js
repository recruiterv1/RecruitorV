/**
 * Data Migration Script: Fix Email Case Consistency
 * 
 * This script fixes users whose emails are not lowercase in the database.
 * This was causing issues where profile saves would fail because
 * findUserByEmail normalizes to lowercase but the stored email was not lowercase.
 * 
 * Run with: node scripts/fix_email_case.js
 */

const { db } = require("../router/firebase_ad");

async function fixEmailCase() {
  console.log('🔧 Starting email case fix migration...\n');
  
  const collections = ['recruiter_db', 'coach_db', 'expert_db', 'clientspoc_db'];
  let totalFixed = 0;

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    
    console.log(`📂 Checking collection: ${collectionName}`);
    
    try {
      const snapshot = await collection.get();
      let collectionFixed = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentEmail = data.email;
        
        if (currentEmail && currentEmail !== currentEmail.toLowerCase()) {
          // Email is not lowercase - fix it
          const oldEmail = currentEmail;
          const newEmail = currentEmail.toLowerCase();
          
          console.log(`  ⚠️  Fixing: ${oldEmail} -> ${newEmail}`);
          
          await doc.ref.update({ email: newEmail });
          collectionFixed++;
          totalFixed++;
        }
      }
      
      console.log(`  ✅ Fixed ${collectionFixed} users in ${collectionName}\n`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${collectionName}:`, error.message);
    }
  }

  console.log('='.repeat(50));
  console.log(`🎉 Migration complete! Total fixed: ${totalFixed}`);
  console.log('='.repeat(50));
  
  if (totalFixed === 0) {
    console.log('✅ No emails needed fixing - all are already lowercase!');
  } else {
    console.log('\n⚠️  IMPORTANT: Users who were previously unable to login should now be able to login.');
    console.log('    Their email is now lowercase and will match the normalized search.');
  }
}

// Run the migration
fixEmailCase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

