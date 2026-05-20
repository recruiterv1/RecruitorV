/**
 * Migration Script: Update clientspoc field from first name to email
 * 
 * This script updates all positions in the admin_AddPos collection
 * to store full email addresses in the clientspoc field instead of just first names.
 * 
 * Run this script once to migrate existing data.
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: "recruitorv-1291c.appspot.com"
  });
}

const db = admin.firestore();
const positionsRef = db.collection("admin_AddPos");
const recruitersRef = db.collection("recruiter_db");

// Mapping of first names to emails (you'll need to provide this)
const firstNameToEmailMap = {
  "Chandan": "Chandan.dhami@changeleaders.in",
  "Manish": "manish.prasad@changeleaders.in",
  "Akansha": "akansha.chaudhary@changeleaders.in",
  // Add more mappings as needed
};

async function migrateClientSpocField() {
  try {
    console.log("🚀 Starting migration of clientspoc field...\n");

    // Get all positions
    const positionsSnap = await positionsRef.get();
    
    if (positionsSnap.empty) {
      console.log("❌ No positions found in database");
      return;
    }

    console.log(`📊 Found ${positionsSnap.size} positions to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each position
    for (const doc of positionsSnap.docs) {
      const data = doc.data();
      const currentClientSpoc = data.clientspoc;

      try {
        // Check if clientspoc already looks like an email
        if (currentClientSpoc && currentClientSpoc.includes('@')) {
          console.log(`⏭️  Skipping ${doc.id} - already has email: ${currentClientSpoc}`);
          skipped++;
          continue;
        }

        // Try to find matching email
        const email = firstNameToEmailMap[currentClientSpoc];

        if (email) {
          // Update the document
          await doc.ref.update({
            clientspoc: email,
            migratedAt: new Date(),
            previousClientSpoc: currentClientSpoc // Keep backup of old value
          });

          console.log(`✅ Updated ${doc.id}:`);
          console.log(`   ${currentClientSpoc} → ${email}`);
          console.log(`   Position: ${data.position || 'N/A'}`);
          console.log(`   Client: ${data.client || 'N/A'}\n`);
          updated++;
        } else {
          console.log(`⚠️  No email mapping found for: "${currentClientSpoc}" in position ${doc.id}`);
          console.log(`   Position: ${data.position || 'N/A'}`);
          console.log(`   Client: ${data.client || 'N/A'}`);
          console.log(`   Please add mapping to firstNameToEmailMap\n`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${doc.id}:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📈 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`⏭️  Skipped (already email): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${positionsSnap.size}`);
    console.log("=".repeat(50) + "\n");

    if (updated > 0) {
      console.log("🎉 Migration completed successfully!");
      console.log("💡 Tip: Deploy the updated backend to use email-based matching\n");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Alternative: Auto-discover emails from recruiter_db
async function autoDiscoverEmails() {
  try {
    console.log("🔍 Auto-discovering email mappings from recruiter_db...\n");

    const recruitersSnap = await recruitersRef.get();
    const emailMap = {};

    recruitersSnap.forEach(doc => {
      const data = doc.data();
      const firstName = data.firstName || data.name?.split(' ')[0] || data.email?.split('@')[0];
      const email = data.email;

      if (firstName && email) {
        emailMap[firstName] = email;
        console.log(`📧 Found: ${firstName} → ${email}`);
      }
    });

    console.log(`\n✅ Discovered ${Object.keys(emailMap).length} email mappings\n`);
    return emailMap;

  } catch (error) {
    console.error("❌ Error discovering emails:", error);
    return {};
  }
}

// Main execution
async function main() {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("🔄 CLIENT SPOC MIGRATION SCRIPT");
    console.log("=".repeat(50) + "\n");

    // Option 1: Use auto-discovery
    console.log("Option 1: Auto-discover emails from recruiter_db");
    const discoveredEmails = await autoDiscoverEmails();
    
    // Merge with manual mappings
    const finalMap = { ...firstNameToEmailMap, ...discoveredEmails };
    
    console.log("\n📋 Final email mappings:");
    Object.entries(finalMap).forEach(([name, email]) => {
      console.log(`   ${name} → ${email}`);
    });
    console.log();

    // Update the global map
    Object.assign(firstNameToEmailMap, finalMap);

    // Run migration
    await migrateClientSpocField();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateClientSpocField, autoDiscoverEmails };
