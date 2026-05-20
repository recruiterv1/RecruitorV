const admin = require("firebase-admin");

// Initialize Firebase Admin with default credentials (for production)
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: "recruitorv-1291c.appspot.com"
  });
}

const db = admin.firestore();

async function diagnoseLogin(email, password) {
  console.log("=".repeat(60));
  console.log("🔐 LOGIN DIAGNOSTIC");
  console.log("=".repeat(60));
  
  try {
    // Step 1: Check if user exists
    console.log(`\n📧 Step 1: Looking up user with email: ${email.toLowerCase()}`);
    const normalizedEmail = email.toLowerCase().trim();
    
    const snap = await db.collection('recruiter_db')
      .where('email', '==', normalizedEmail)
      .get();
    
    if (snap.empty) {
      console.log("❌ User NOT FOUND in recruiter_db collection");
      
      // Check if email exists with different casing
      console.log("\n🔍 Checking for case variations...");
      const allUsers = await db.collection('recruiter_db').get();
      const matches = [];
      allUsers.forEach(doc => {
        const userData = doc.data();
        if (userData.email && userData.email.toLowerCase() === normalizedEmail) {
          matches.push({
            id: doc.id,
            email: userData.email,
            storedLowercase: userData.email.toLowerCase()
          });
        }
      });
      
      if (matches.length > 0) {
        console.log("✅ Found user with different case storage:");
        matches.forEach(m => {
          console.log(`   Stored: "${m.email}" (ID: ${m.id})`);
          console.log(`   Normalized: "${m.storedLowercase}"`);
        });
      } else {
        console.log("❌ No user found with this email at all");
      }
      
      return { success: false, error: "USER_NOT_FOUND" };
    }
    
    // User found
    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };
    
    console.log("✅ User found:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   isVerified: ${user.isVerified}`);
    console.log(`   roleCategory: ${user.roleCategory}`);
    console.log(`   planType: ${user.planType}`);
    
    // Step 2: Check verification status
    console.log("\n🔐 Step 2: Checking verification status");
    if (user.isVerified === false || !user.isVerified) {
      console.log("❌ User is NOT verified (OTP verification required)");
      return { success: false, error: "NOT_VERIFIED" };
    }
    console.log("✅ User is verified");
    
    // Step 3: Check password
    console.log("\n🔑 Step 3: Checking password");
    const bcrypt = require('bcryptjs');
    const isBcryptHash = user.password && user.password.startsWith('$2') && user.password.length >= 60;
    
    if (isBcryptHash) {
      console.log("   Password is bcrypt hashed");
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        console.log("✅ Password matches (bcrypt)");
      } else {
        console.log("❌ Password does NOT match");
        return { success: false, error: "WRONG_PASSWORD" };
      }
    } else {
      console.log("   Password is stored as plain text");
      if (password === user.password) {
        console.log("✅ Password matches (plain text)");
      } else {
        console.log("❌ Password does NOT match");
        console.log(`   Input: "${password}"`);
        console.log(`   Stored: "${user.password}"`);
        return { success: false, error: "WRONG_PASSWORD" };
      }
    }
    
    console.log("\n✅ All checks passed - login should work!");
    return { success: true, user };
    
  } catch (error) {
    console.error("\n❌ Error during diagnosis:", error);
    return { success: false, error: error.message };
  }
}

// Run diagnostic with command line arguments
const email = process.argv[2] || "dhamichandan@yahoo.in";
const password = process.argv[3] || "testpassword123";

console.log(`Testing login for: ${email}`);
diagnoseLogin(email, password)
  .then(result => {
    console.log("\n" + "=".repeat(60));
    console.log("RESULT:", JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });

