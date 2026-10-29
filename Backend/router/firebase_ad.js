var admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    // Try to load service account for local development
    // This will fail gracefully in production (Firebase Functions)
    try {
      // Self-hosted: FIREBASE_SERVICE_ACCOUNT holds the service-account JSON (raw or base64).
      let serviceAccount;
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (raw) {
        serviceAccount = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
      } else {
        serviceAccount = require("../serviceAccountKey.json");
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "recruitorv-1291c.firebasestorage.app"
      });
      
      console.log("✅ Firebase Admin initialized with service account (local dev)");
    } catch (serviceAccountError) {
      // Fallback to default credentials (for Firebase Functions)
      // When running on Firebase, credentials are automatically provided
      admin.initializeApp({
        storageBucket: "recruitorv-1291c.firebasestorage.app"
      });
      
      console.log("✅ Firebase Admin initialized with default credentials (Firebase Functions)");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

const useMysql = (process.env.DB_DRIVER || 'firestore').toLowerCase() === 'mysql';
var db = useMysql ? require('../db/mysql').db : admin.firestore();
// Drop undefined fields silently instead of throwing (coaches/experts don't have all recruiter fields)
db.settings({ ignoreUndefinedProperties: true });

// Test Firestore connection - NON-BLOCKING
// Don't wait for this as it can cause startup delays with Eventarc/PubSub
if (!useMysql) setTimeout(() => {
  db.collection('_healthcheck').limit(1).get()
    .then(() => {
      console.log("✅ Firestore connection successful");
    })
    .catch(() => {});
}, 1000);

module.exports = { admin, db };
