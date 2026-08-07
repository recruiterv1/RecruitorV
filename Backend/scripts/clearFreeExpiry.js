/**
 * One-off migration: remove the 30-day free-plan expiry.
 *
 * For every free recruiter (planType === 0):
 *   - clears planExpiryDate (set to null)
 *   - sets maxPositions to 4 (the new free-plan working-positions limit)
 *
 * Run from the Backend directory:  node scripts/clearFreeExpiry.js
 * Requires Backend/serviceAccountKey.json (already used by firebase_ad.js).
 */
const { db } = require("../router/firebase_ad");

(async () => {
  try {
    const snap = await db.collection("recruiter_db").where("planType", "==", 0).get();
    console.log(`Found ${snap.size} free recruiters.`);

    let updated = 0;
    let batch = db.batch();
    let opsInBatch = 0;

    for (const doc of snap.docs) {
      batch.update(doc.ref, { planExpiryDate: null, maxPositions: 4 });
      opsInBatch++;
      updated++;
      // Firestore batches are capped at 500 ops
      if (opsInBatch === 450) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
        console.log(`  committed ${updated} so far...`);
      }
    }

    if (opsInBatch > 0) await batch.commit();

    console.log(`✅ Done. Cleared expiry / set maxPositions=4 for ${updated} free recruiters.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
