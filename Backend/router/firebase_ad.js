var admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    // Try to load service account for local development
    // This will fail gracefully in production (Firebase Functions)
    try {
      const serviceAccount = require("../serviceAccountKey.json");
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "recruitorv-1291c.appspot.com"
      });
      
      console.log("✅ Firebase Admin initialized with service account (local dev)");
    } catch (serviceAccountError) {
      // Fallback to default credentials (for Firebase Functions)
      // When running on Firebase, credentials are automatically provided
      admin.initializeApp({
        storageBucket: "recruitorv-1291c.appspot.com"
      });
      
      console.log("✅ Firebase Admin initialized with default credentials (Firebase Functions)");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

var db = admin.firestore();

// Test Firestore connection - NON-BLOCKING
// Don't wait for this as it can cause startup delays with Eventarc/PubSub
setTimeout(() => {
  db.collection('_healthcheck').limit(1).get()
    .then(() => {
      console.log("✅ Firestore connection successful");
    })
    .catch(err => {
      console.warn("⚠️ Firestore connection check failed (will retry on actual requests):", err.message);
      // This is normal during cold starts - actual requests will trigger proper connection
    });
}, 1000);

module.exports = { admin, db };
