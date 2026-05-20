/**
 * Script to update all clientspoc fields to lowercase
 * This fixes the case-sensitivity issue where Firebase Auth emails are lowercase
 * but database might have mixed case emails
 * 
 * Run this script ONCE after deploying the case-sensitivity fix
 */

const { db } = require("../router/firebase_ad");

async function updateClientSpocToLowercase() {
  try {
    console.log("🔍 Fetching all positions...");
    const snapshot = await db.collection('admin_AddPos').get();
    console.log(`📊 Found ${snapshot.size} total positions`);

    const updates = [];
    const alreadyLowercase = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.clientspoc) {
        const lowercaseEmail = data.clientspoc.toLowerCase();
        
        if (data.clientspoc !== lowercaseEmail) {
          // Needs update
          updates.push({
            id: doc.id,
            pos_id: data.pos_id,
            position: data.position,
            current: data.clientspoc,
            new: lowercaseEmail
          });
        } else {
          // Already lowercase
          alreadyLowercase.push({
            id: doc.id,
            pos_id: data.pos_id,
            clientspoc: data.clientspoc
          });
        }
      }
    });

    console.log(`\n✅ Already lowercase: ${alreadyLowercase.length} positions`);
    console.log(`⚠️  Need update: ${updates.length} positions`);

    if (updates.length === 0) {
      console.log("\n🎉 All positions already have lowercase emails. No updates needed!");
      return;
    }

    console.log("\n📋 Positions that will be updated:");
    console.table(updates);

    // Perform batch update
    console.log("\n🔄 Starting batch update...");
    const batch = db.batch();
    
    updates.forEach(update => {
      const docRef = db.collection('admin_AddPos').doc(update.id);
      batch.update(docRef, {
        clientspoc: update.new,
        previousClientSpoc: update.current, // Backup original value
        caseFixedAt: new Date(),
        caseFixedBy: 'updateClientSpocToLowercase script'
      });
    });

    await batch.commit();
    console.log(`\n✅ Successfully updated ${updates.length} positions!`);
    
    console.log("\n📊 Summary:");
    console.log(`   - Total positions: ${snapshot.size}`);
    console.log(`   - Already lowercase: ${alreadyLowercase.length}`);
    console.log(`   - Updated to lowercase: ${updates.length}`);
    
    console.log("\n🎯 Next Steps:");
    console.log("   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)");
    console.log("   2. Test login with each Client SPOC user");
    console.log("   3. Verify 'My Positions' page shows positions for all users");
    
  } catch (error) {
    console.error("❌ Error updating positions:", error);
    throw error;
  }
}

// Run the script
console.log("🚀 Starting Client SPOC Email Case-Sensitivity Fix\n");
console.log("This script will:");
console.log("  1. Find all positions with mixed-case clientspoc emails");
console.log("  2. Convert them to lowercase");
console.log("  3. Keep a backup of the original value\n");

updateClientSpocToLowercase()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
