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
    const emailLc = String(email || '').toLowerCase().trim();

    // ── A Google account is not a RecruiterV account ─────────────────────────
    // This route used to issue a 30-day session to anyone who could sign in with
    // Google, whether or not they had ever registered. 242 of 583 Google
    // sign-ins had no platform account: they reached a dashboard, were stopped
    // by the mandatory agreement, and could not accept it because there was no
    // record to write to — a dead end with no way out.
    //
    // So the platform account is now what decides. Without one, no session is
    // issued and they are sent to the eligibility check, which is the same
    // entry every other new member goes through.
    const { db } = require('./firebase_ad');
    const findPlatformAccount = async () => {
      for (const [col, role] of [
        ['recruiter_db', 'Recruiter'], ['coach_db', 'Coach'],
        ['expert_db', 'Expert'], ['admin_db', 'Admin'],
      ]) {
        const snap = await db.collection(col).where('email', '==', emailLc).limit(1).get();
        if (!snap.empty) return { role, doc: snap.docs[0].data() };
      }
      return null;
    };

    const account = await findPlatformAccount();
    if (!account) {
      // Has this address already cleared the check? If so they only need to
      // finish registering; if not, they start at the check.
      let passedRole = null;
      try {
        const eligibility = require('./eligibility');
        passedRole = await eligibility.passedRoleFor(emailLc);
      } catch (e) {
        console.error('google login: eligibility lookup failed:', e.message);
      }

      console.log(`Google login refused for ${emailLc} — no platform account (passed: ${passedRole || 'no'})`);
      return res.status(403).json({
        success: false,
        errorCode: passedRole ? 'REGISTRATION_INCOMPLETE' : 'ELIGIBILITY_REQUIRED',
        message: passedRole
          ? `You have cleared the ${passedRole} eligibility check. Please finish registering to continue.`
          : 'There is no RecruiterV account for this Google address. Please clear the eligibility check to join.',
        redirectTo: passedRole
          ? `/reg?email=${encodeURIComponent(emailLc)}&role=${encodeURIComponent(passedRole)}`
          : '/check-eligibility',
        name: name || '',
        email: emailLc,
      });
    }

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

    console.log(`Google Login Success for: ${email} (${account.role})`);
    // The platform account is the source of truth for role, agreement and team,
    // not the Google profile — which holds none of them.
    res.status(200).json({
      ...user,
      token,
      roleCategory: account.doc.roleCategory || account.role,
      experienceCategory: account.doc.experienceCategory || '',
      agreementSigned: !!account.doc.agreementSigned,
      vendorEmail: account.doc.vendorEmail || null,
      consultingFirmId: account.doc.consultingFirmId || null,
    });

  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;