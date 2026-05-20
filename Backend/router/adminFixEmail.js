/**
 * Admin endpoint to fix email case consistency
 * Run this once by calling: curl -X POST https://api-myh3hnbr6q-uc.a.run.app/admin/fix-email-case
 * Or access via: https://recruitorv-1291c.web.app/admin/fix-email-case (if you add this route)
 */

const express = require('express');
const router = express.Router();
const { db } = require('../router/firebase_ad');

// Admin middleware to protect this endpoint
function adminMiddleware(req, res, next) {
  // Add your admin verification logic here
  // For now, we'll add a simple secret check
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'recruiterv-admin-2024') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// Fix email case for all users across all collections
router.post('/admin/fix-email-case', adminMiddleware, async (req, res) => {
  console.log('🔧 Starting email case fix migration...');
  
  const collections = ['recruiter_db', 'coach_db', 'expert_db', 'clientspoc_db'];
  let totalFixed = 0;
  const results = [];

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    
    console.log(`📂 Checking collection: ${collectionName}`);
    let collectionFixed = 0;
    
    try {
      const snapshot = await collection.get();
      
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
      
      results.push({ collection: collectionName, fixed: collectionFixed });
      console.log(`  ✅ Fixed ${collectionFixed} users in ${collectionName}`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${collectionName}:`, error.message);
      results.push({ collection: collectionName, error: error.message });
    }
  }

  console.log('='.repeat(50));
  console.log(`🎉 Migration complete! Total fixed: ${totalFixed}`);
  console.log('='.repeat(50));

  res.status(200).json({
    success: true,
    message: `Migration complete! Fixed ${totalFixed} users.`,
    totalFixed,
    results
  });
});

module.exports = router;

