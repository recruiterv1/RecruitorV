const express = require('express');
const router = express.Router();
const { db } = require("../router/firebase_ad");
const bcrypt = require('bcryptjs');

// Test endpoint to check user status without password
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔍 Checking user: ${normalizedEmail}`);

    // Check recruiter collection
    let snap = await db.collection('recruiter_db')
      .where('email', '==', normalizedEmail)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const user = { id: doc.id, ...doc.data() };
      
      // Check password format
      const password = doc.data().password;
      const isBcrypt = password && password.startsWith('$2') && password.length >= 60;
      
      return res.json({
        success: true,
        found: true,
        collection: 'recruiter_db',
        hasPassword: !!password,
        passwordLength: password ? password.length : 0,
        isBcryptHash: isBcrypt,
        passwordPreview: password ? password.substring(0, 10) + '...' : null,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          roleCategory: user.roleCategory,
          planType: user.planType
        }
      });
    }

    // Check coach collection
    snap = await db.collection('coach_db')
      .where('email', '==', normalizedEmail)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const password = doc.data().password;
      const isBcrypt = password && password.startsWith('$2') && password.length >= 60;
      
      return res.json({
        success: true,
        found: true,
        collection: 'coach_db',
        hasPassword: !!password,
        isBcryptHash: isBcrypt
      });
    }

    // Check expert collection
    snap = await db.collection('expert_db')
      .where('email', '==', normalizedEmail)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const password = doc.data().password;
      const isBcrypt = password && password.startsWith('$2') && password.length >= 60;
      
      return res.json({
        success: true,
        found: true,
        collection: 'expert_db',
        hasPassword: !!password,
        isBcryptHash: isBcrypt
      });
    }

    return res.json({
      success: false,
      found: false,
      message: "User not found in any collection"
    });

  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test password endpoint
router.post('/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check recruiter collection
    let snap = await db.collection('recruiter_db')
      .where('email', '==', normalizedEmail)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const userPassword = doc.data().password;
      const isBcrypt = userPassword && userPassword.startsWith('$2') && userPassword.length >= 60;
      
      let result;
      if (isBcrypt) {
        result = await bcrypt.compare(password, userPassword);
      } else {
        result = (password === userPassword);
      }
      
      return res.json({
        success: true,
        found: true,
        collection: 'recruiter_db',
        isBcryptHash: isBcrypt,
        passwordMatch: result
      });
    }

    return res.json({
      success: false,
      found: false,
      message: "User not found"
    });

  } catch (error) {
    console.error("Error testing password:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

