const { db } = require("../router/firebase_ad");

async function diagnoseClientSpocPositions() {
  console.log("=".repeat(60));
  console.log("ClientSPOC Positions Diagnostic Tool");
  console.log("=".repeat(60));
  
  const testEmail = "chandan.dhami@changeleaders.in";
  console.log(`\nTesting for user: ${testEmail}`);
  console.log("-".repeat(60));
  
  try {
    // 1. Check if user exists in admin_db (ClientSPOC collection)
    console.log("\n1. Checking admin_db collection for user...");
    const adminDb = db.collection('admin_db');
    const userSnap = await adminDb.where('email', '==', testEmail).get();
    
    if (userSnap.empty) {
      console.log("❌ User NOT found in admin_db collection");
    } else {
      console.log("✅ User found in admin_db collection");
      const userData = userSnap.docs[0].data();
      console.log("   User data:", JSON.stringify({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        roleCategory: userData.roleCategory
      }, null, 2));
    }
    
    // 2. Check positions in admin_AddPos collection
    console.log("\n2. Checking admin_AddPos collection...");
    const positionsDb = db.collection('admin_AddPos');
    
    // Get all positions
    const allPositionsSnap = await positionsDb.get();
    console.log(`   Total positions in database: ${allPositionsSnap.size}`);
    
    // Check for exact match (lowercase)
    const exactMatchSnap = await positionsDb.where('clientspoc', '==', testEmail.toLowerCase()).get();
    console.log(`   Positions with clientspoc = "${testEmail.toLowerCase()}": ${exactMatchSnap.size}`);
    
    // Check for case variations
    const variations = [
      testEmail,
      testEmail.toLowerCase(),
      testEmail.toUpperCase(),
      "Chandan.dhami@changeleaders.in",
      "chandan.dhami@changeleaders.in",
      "CHANDAN.DHAMI@CHANGELEADERS.IN"
    ];
    
    console.log("\n3. Checking case variations...");
    for (const variation of variations) {
      const snap = await positionsDb.where('clientspoc', '==', variation).get();
      if (snap.size > 0) {
        console.log(`   ✅ Found ${snap.size} position(s) with clientspoc = "${variation}"`);
        snap.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`      Position ${index + 1}:`, {
            pos_id: data.pos_id,
            position: data.position,
            client: data.client,
            clientspoc: data.clientspoc
          });
        });
      }
    }
    
    // 4. Check for positions with similar emails
    console.log("\n4. Checking for positions with 'chandan' in clientspoc...");
    const allPos = await positionsDb.get();
    const chandanPositions = allPos.docs.filter(doc => {
      const clientspoc = doc.data().clientspoc || '';
      return clientspoc.toLowerCase().includes('chandan');
    });
    
    if (chandanPositions.length > 0) {
      console.log(`   Found ${chandanPositions.length} position(s) with 'chandan' in clientspoc:`);
      chandanPositions.forEach((doc, index) => {
        const data = doc.data();
        console.log(`      Position ${index + 1}:`, {
          pos_id: data.pos_id,
          position: data.position,
          clientspoc: data.clientspoc,
          clientspoc_type: typeof data.clientspoc,
          clientspoc_length: data.clientspoc ? data.clientspoc.length : 0
        });
      });
    } else {
      console.log("   ❌ No positions found with 'chandan' in clientspoc");
    }
    
    // 5. Sample some positions to see what clientspoc values look like
    console.log("\n5. Sample of clientspoc values in database:");
    const samplePositions = allPos.docs.slice(0, 10);
    samplePositions.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   Position ${index + 1}:`, {
        pos_id: data.pos_id,
        position: data.position,
        clientspoc: data.clientspoc,
        type: typeof data.clientspoc
      });
    });
    
    console.log("\n" + "=".repeat(60));
    console.log("Diagnostic Complete");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("Error during diagnosis:", error);
  }
  
  process.exit(0);
}

diagnoseClientSpocPositions();
