const express=require('express')
const router=express.Router();
const jwt=require('jsonwebtoken')
const {admin}=require('../router/firebase_ad')
const googleF= require('../model_fire/googleF')

const SECRET_KEY = process.env.SECKEY || "fallback_secret_key_12345";

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing or malformed" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    // 3. USAGE FIX: usage changed from admina.auth() to admin.auth()
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid Firebase token" });
  }
};

// --- ROUTE ---
router.post('/au_google', verifyToken, async (req, res) => {
  try {
    const { uid, name, email, picture } = req.user;

    let user = await googleF.findByEmail(email);

    if (!user) {
      user = await googleF.createUser({ uid, name, email, picture });
    } else {
      // Update lastActive timestamp for existing users on login
      await googleF.updateRecruiter(user.id, { lastActive: new Date() });
    }

    // 4. CRITICAL ADDITION: Generate Session Token
    const token = jwt.sign({ email: user.email, portal: 'user' }, SECRET_KEY, { expiresIn: "30d" });

    // 5. CRITICAL ADDITION: Set the Cookie
    // Without this, your dashboard check will fail immediately.
    const isProduction = !!process.env.K_SERVICE;
    res.cookie("__session", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    console.log(`Google Login Success for: ${email}`);
    res.status(200).json({ ...user, token });

  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;