/**
 * Migration Script: Add planType to Existing Recruiters
 * 
 * This script updates all existing recruiters in the database to have:
 * - planType: 1 (Paid plan)
 * - registrationDate: current date
 * - maxPositions: null (unlimited)
 * - planExpiryDate: null (no expiry)
 * 
 * Run this script once to migrate existing data.
 */

const { db } = require("../router/firebase_ad");
const recruiterCollection = db.collection('recruiter_db');

async function migratePlanType() {
    console.log("🚀 Starting migration: Adding planType to existing recruiters...\n");

    try {
        // Get all recruiters
        const snapshot = await recruiterCollection.get();
        
        if (snapshot.empty) {
            console.log("⚠️  No recruiters found in database.");
            return;
        }

        console.log(`📊 Found ${snapshot.size} recruiters to migrate.\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        // Process each recruiter
        for (const doc of snapshot.docs) {
            const recruiterData = doc.data();
            const recruiterId = doc.id;

            try {
                // Check if already has planType
                if (recruiterData.planType !== undefined) {
                    console.log(`⏭️  Skipping ${recruiterData.email} - already has planType: ${recruiterData.planType}`);
                    skipCount++;
                    continue;
                }

                // Update with paid plan (planType: 1)
                const updateData = {
                    planType: 1,
                    registrationDate: new Date(),
                    maxPositions: null,
                    planExpiryDate: null
                };

                await recruiterCollection.doc(recruiterId).update(updateData);

                console.log(`✅ Updated ${recruiterData.email} - Set to Paid Plan (planType: 1)`);
                successCount++;

            } catch (error) {
                console.error(`❌ Error updating ${recruiterData.email}:`, error.message);
                errorCount++;
            }
        }

        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("📈 MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`✅ Successfully updated: ${successCount}`);
        console.log(`⏭️  Skipped (already migrated): ${skipCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📊 Total processed: ${snapshot.size}`);
        console.log("=".repeat(60) + "\n");

        if (errorCount === 0) {
            console.log("🎉 Migration completed successfully!");
        } else {
            console.log("⚠️  Migration completed with some errors. Please review the logs above.");
        }

    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

// Run migration
if (require.main === module) {
    migratePlanType()
        .then(() => {
            console.log("\n✨ Migration script finished.");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Migration script failed:", error);
            process.exit(1);
        });
}

module.exports = { migratePlanType };
