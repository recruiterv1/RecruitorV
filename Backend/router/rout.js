const express=require('express');
const router=express.Router();
const crypto=require('crypto')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const multer=require('multer');
const { v4: uuidv4 }=require('uuid');
const { admin }=require('./firebase_ad');

const recruiter=require('../model_fire/recruiterF')
const { SENDER, sendEmail, sendEmailFull, templates, renderEmail } = require('../utils/email');

// Accept all file types here; validate extension server-side so browser MIME quirks don't break the upload
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

const isProduction = !!process.env.K_SERVICE;
// Session lifetime — long-lived so a page refresh never logs an active user out.
// Recruiters additionally have a client-side inactivity auto-logout for security.
const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const cookieOptions = isProduction
  ? { httpOnly: true, secure: true, sameSite: "none", maxAge: SESSION_MS, path: "/", domain: ".recruiterv.com" }
  : { httpOnly: true, secure: false, sameSite: "lax", maxAge: SESSION_MS, path: "/" };
// clearCookie must NOT include maxAge — maxAge overrides the past-expiry that clearCookie sets
const clearCookieOptions = isProduction
  ? { httpOnly: true, secure: true, sameSite: "none", path: "/", domain: ".recruiterv.com" }
  : { httpOnly: true, secure: false, sameSite: "lax", path: "/" };


function authMiddleware(req, res, next) {
  const token = req.cookies.__session;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.user = decoded;  
    next();             
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
} 



async function sendOtp(email, otp) {

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#2563eb;">Your RecruiterV Verification Code</h2>
      <p>Welcome to RecruiterV! Use the code below to complete your registration:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;
                  padding:20px;background:#eff6ff;border-radius:12px;color:#1d4ed8;margin:24px 0;">
        ${otp}
      </div>
      <p style="color:#6b7280;font-size:14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
      <p style="color:#6b7280;font-size:14px;">— RecruiterV Team</p>
    </div>
  `;

  const _r = await renderEmail('otpCode', { otp }, { subject: 'Your RecruiterV OTP Code', htmlContent: html });
  try {
    await sendEmail(email, _r.subject, _r.htmlContent, SENDER.email, SENDER.name);
    console.log(`✅ OTP sent to ${email}`);
  } catch (firstErr) {
    console.error(`❌ OTP Email Error (attempt 1) to ${email}:`, firstErr.message);
    try {
      await new Promise(r => setTimeout(r, 1500));
      await sendEmail(email, _r.subject, _r.htmlContent, SENDER.email, SENDER.name);
      console.log(`✅ OTP sent to ${email} (retry)`);
    } catch (retryErr) {
      console.error(`❌ OTP Email Error (attempt 2) to ${email}:`, retryErr.message);
      throw new Error("EMAIL_FAILED");
    }
  }
}






// Accepts base64-encoded file in JSON body — avoids multipart stream issues on Cloud Run
router.post('/upload-resume', async (req, res) => {
  try {
    const { fileBase64, filename: origName } = req.body;
    if (!fileBase64) return res.status(400).json({ message: 'No file provided' });
    if (!(origName || '').toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 6 * 1024 * 1024) {
      return res.status(400).json({ message: 'File too large (max 6MB)' });
    }
    const token = uuidv4();
    const filename = `resumes/${Date.now()}_${uuidv4()}.pdf`;
    const bucket = require('../utils/localBucket').bucket();
    const storageFile = bucket.file(filename);
    await storageFile.save(buffer, {
      resumable: false,
      contentType: 'application/pdf',
    });
    await storageFile.setMetadata({
      metadata: { firebaseStorageDownloadTokens: token }
    });
    const resumeUrl = `${bucket.base}/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${token}`;
    return res.json({ success: true, resumeUrl });
  } catch (err) {
    console.error('Resume upload error:', err);
    return res.status(500).json({ message: 'Failed to upload resume. ' + err.message });
  }
});

// The positions picked during sign-up — one per specialization — become
// theirs immediately, so they are waiting when they first sign in. Recruiters and coaches/experts are assigned
// through their own existing routes — both are already auto-approved, so this
// only saves the new joiner going to find the position again.
//
// A failure here is logged and swallowed: it must never cost someone the
// account they have just created, and they can still assign it themselves.
async function assignChosenPositions(user, roleCategory, email, chosen) {
    if (!user || !Array.isArray(chosen) || !chosen.length) return;
    // Assigned one at a time: one position failing must not cost them the rest.
    for (const p of chosen) {
        const posId = String(p.pos_id || '');
        if (!posId) continue;
        try {
            if (roleCategory === 'Recruiter') {
                const positionAccess = require('../model_fire/positionAccessF');
                await positionAccess.createAssignRequest(
                    user.id, String(email).toLowerCase(), posId, 'Chosen during registration',
                );
            } else if (roleCategory === 'Coach' || roleCategory === 'Expert') {
                const { assignCoachExpertToPosition } = require('./directCoachRequest');
                await assignCoachExpertToPosition({
                    userDoc: { ...user, email },
                    roleCategory,
                    positionId: posId,
                    note: 'Chosen during registration',
                });
            } else {
                return;
            }
            console.log(`assigned position ${posId} to ${email} (${roleCategory})`);
        } catch (assignErr) {
            console.error(`registration assign skipped for ${posId}:`, assignErr.message);
        }
    }
}

router.post('/register',async (req,res)=>{

    let {name,email,mobile,experienceCategory,password,roleCategory,planType,specialization,skillCategory,userType,resumeUrl,agreementAccepted,positionExperience,availability,selectedPositions}=req.body;

    // Coach and Expert are switched off at app_config/features.coachExpert.
    // Refused here as well as hidden in the form, because a form is only a
    // suggestion — the role arrives in the request body and can be anything.
    try {
      const { openRoles } = require('../utils/featureFlags');
      const allowed = await openRoles();
      if (roleCategory && !allowed.includes(roleCategory) && ['Coach','Expert'].includes(roleCategory)) {
        return res.status(403).json({
          success: false,
          message: 'Coach and Expert registration is closed at the moment. You can register as a Recruiter.',
        });
      }
    } catch (e) { console.error('role gate check failed:', e.message); }

    // The user ticks "I agree to the Terms & Conditions" on the registration
    // form, so the account is created already marked as having signed the
    // agreement for their role. Set here (rather than only in /agreement/submit)
    // so the flag is guaranteed even if the PDF confirmation email fails.
    const agreementFields = agreementAccepted === true || agreementAccepted === 'true'
      ? {
          agreementSigned: true,
          agreementRole: roleCategory,
          agreementSignedAt: new Date(),
          agreementVersion: 'v1.0',
          agreementAcceptedAt: 'registration',
          ...(roleCategory === 'Recruiter' ? { commisiontype: 'Standard 35% + 5% Variable' } : {}),
        }
      : {};

    // A Coach, Expert or Recruiter must have cleared the eligibility check for
    // their role before they can register. Enforced here as well as in the form,
    // so it cannot be skipped by posting straight to this endpoint.
    const REQUIRE_ELIGIBILITY_TO_REGISTER = true;

    // Set when the eligibility gate finds a pass, and merged onto the new account.
    let eligibilityStamp = {};

    try{
        // ── Eligibility gate ────────────────────────────────────────────────
        // Looks up whether this person has passed the eligibility check, so a
        // pass can be carried onto the new account as their tier, badge and
        // certificate. Whether a pass is *required* is REQUIRE_ELIGIBILITY_TO_REGISTER
        // above; with it off this only stamps, and never refuses.
        //
        // Accounts created by an admin, vendor or consulting firm go through
        // their own routes and are unaffected. A role with no active questions
        // is not gated — hasPassed's caller checks that first.
        if (['Recruiter', 'Coach', 'Expert'].includes(roleCategory)) {
            try {
                const eligibility = require('./eligibility');
                const { db } = require('./firebase_ad');
                const qSnap = await db.collection('eligibility_questions')
                    .where('role', '==', roleCategory).where('active', '==', true).limit(1).get();

                // Someone who has cleared the check for one role must register as
                // that role. Without this, switching the role on the form let
                // them register as a role they were never assessed for — and
                // Expert, which has no questions, skipped the block below
                // entirely, so it was the free way in.
                const passedRole = await eligibility.passedRoleFor(email);
                if (passedRole && passedRole !== roleCategory) {
                    return res.status(403).json({
                        message: `You cleared the eligibility check as a ${passedRole}. Please register as a ${passedRole}, or take the ${roleCategory} check first.`,
                        errorCode: 'ELIGIBILITY_ROLE_MISMATCH',
                        role: passedRole,
                        checkUrl: '/check-eligibility',
                    });
                }

                if (!qSnap.empty) {                       // a check exists for this role
                    const pass = await eligibility.hasPassed(email, roleCategory);
                    if (pass) {
                        // Carry the assessment outcome onto the account being created,
                        // so a Certified recruiter can be badged and can download their
                        // certificate without the attempt having to be looked up again.
                        eligibilityStamp = {
                            eligibilityTier: pass.tier || 'certified',
                            eligibilityPercent: pass.percent ?? null,
                            eligibilityAttemptId: pass.attemptId || '',
                            eligibilityPassedAt: pass.passedAt ? new Date(pass.passedAt) : new Date(),
                            ...(pass.certificateId ? { certificateId: pass.certificateId } : {}),
                            ...(pass.certificateUrl ? { certificateUrl: pass.certificateUrl } : {}),
                            ...(pass.positionCap ? { positionCap: pass.positionCap } : {}),
                        };
                    }
                    if (!pass && REQUIRE_ELIGIBILITY_TO_REGISTER) {
                        return res.status(403).json({
                            message: `Please clear the ${roleCategory} eligibility check before registering.`,
                            errorCode: 'ELIGIBILITY_REQUIRED',
                            role: roleCategory,
                            checkUrl: '/check-eligibility',
                        });
                    }
                }
            } catch (gateErr) {
                // Never let a fault in the gate block legitimate sign-ups.
                console.error('eligibility gate skipped:', gateErr.message);
            }
        }

        // Check user based on role - different collections for different roles
        let existingUser = null;
        
        if (roleCategory === "Recruiter") {
            existingUser = await recruiter.findRecruiterByEmail(email);
            if(existingUser && existingUser.isVerified){
                return res.status(400).json({message : "User Already Registered With Us!"});
            }
            // Block if phone is already tied to a different verified recruiter account
            if (mobile) {
                const phoneOwner = await recruiter.findVerifiedRecruiterByPhone(mobile);
                if (phoneOwner && phoneOwner.email.toLowerCase() !== email.toLowerCase()) {
                    return res.status(400).json({ message: "This phone number is already registered with another account." });
                }
            }
        } else if (roleCategory === "Coach") {
            // Check coach collection
            const coach = require('../model_fire/coachF');
            existingUser = await coach.findCoachByEmail(email);
            if(existingUser){
                return res.status(400).json({message : "Coach with this email already exists!"});
            }
        } else if (roleCategory === "Expert") {
            // Check expert collection
            const expert = require('../model_fire/expertF');
            existingUser = await expert.findExpertByEmail(email);
            if(existingUser){
                return res.status(400).json({message : "Expert with this email already exists!"});
            }
        } else {
            // For other roles (like RTS), check recruiter collection
            existingUser = await recruiter.findRecruiterByEmail(email);
            if(existingUser && existingUser.isVerified){
                return res.status(400).json({message : "User Already Registered With Us!"});
            }
        }

        const salt= await bcrypt.genSalt(10);
        const hashPass= await bcrypt.hash(password,salt);

        const otp=Math.floor(100000 + Math.random()*900000);
        const hashedOtp=crypto.createHash("sha256").update(String(otp)).digest('hex');
        const otpExpires=Date.now()+ 60*5*1000;

        // Track record and availability, collected on the sign-up form.
        //
        // positionExperience is how many roles of each kind they have closed,
        // asked against the live positions in their skill category:
        //   [{ pos_id, position, closed: '0-2' | '3-5' | '6-10' | '10+' }]
        // availability is the two-hour windows they can be reached in.
        // Both are optional — an account is never refused for lacking them.
        const CLOSED_BANDS = ['0-2', '3-5', '6-10', '10+'];
        const cleanExperience = Array.isArray(positionExperience)
            ? positionExperience
                .filter(r => r && r.position && CLOSED_BANDS.includes(r.closed))
                .slice(0, 10)
                .map(r => ({
                    pos_id: String(r.pos_id || ''),
                    position: String(r.position).slice(0, 200),
                    closed: r.closed,
                }))
            : [];
        const cleanAvailability = Array.isArray(availability)
            ? [...new Set(availability.map(v => String(v).slice(0, 20)))].slice(0, 12)
            : [];
        // One position per specialization they chose, with how many like it they
        // have closed. Capped at the number of specializations allowed.
        const chosen = (Array.isArray(selectedPositions) ? selectedPositions : [])
            .filter(p => p && p.pos_id)
            .slice(0, 3)
            .map(p => ({
                pos_id: String(p.pos_id),
                position: String(p.position || '').slice(0, 200),
                category: String(p.category || '').slice(0, 60),
                closed: CLOSED_BANDS.includes(p.closed) ? p.closed : '',
            }));

        const profileFields = {
            positionExperience: cleanExperience,
            availability: cleanAvailability,
            ...(chosen.length ? { selectedPositions: chosen } : {}),
        };

        // Handle registration based on role
        if (roleCategory === "Coach") {
            // Create coach record
            const coach = require('../model_fire/coachF');
            const coachData = {
                name,
                email: email.toLowerCase(),
                mobile,
                specialization: specialization || '',
                skillCategory: skillCategory || '',
                userType: userType || 'free',
                password: hashPass,
                otp: hashedOtp,
                otpExpires,
                isVerified: false,
                // New sign-ups are live immediately — no admin/superadmin approval
                // needed. Admins can revoke access later (accountStatus: 'blocked').
                accountStatus: 'approved',
                ...agreementFields,
                ...profileFields,
                ...eligibilityStamp,
                ...(resumeUrl ? { resumeUrl } : {}),
            };
            
            const newCoach = await coach.createCoach(coachData);
            console.log("✅ Coach registered successfully:", newCoach.id);
            await assignChosenPositions(newCoach, "Coach", email, chosen);

            let coachEmailSent = true;
            try {
                await sendOtp(email, otp);
            } catch (emailErr) {
                console.error("⚠️ Coach OTP email failed (account kept for retry):", emailErr.message);
                coachEmailSent = false;
                // Keep the account — user can resend OTP from the OTP page
            }
            return res.json({
                message: coachEmailSent
                    ? `OTP Sent to your ${email}!`
                    : `Account created! If you don't receive an OTP email, use the 'Resend OTP' button on the next page.`,
                roleCategory: "Coach",
                userType: userType || 'free'
            });
            
        } else if (roleCategory === "Expert") {
            // Create expert record
            const expert = require('../model_fire/expertF');
            const expertData = {
                name,
                email: email.toLowerCase(),
                mobile,
                specialization: specialization || '',
                skillCategory: skillCategory || '',
                userType: userType || 'free',
                password: hashPass,
                otp: hashedOtp,
                otpExpires,
                isVerified: false,
                // New sign-ups are live immediately — no admin/superadmin approval
                // needed. Admins can revoke access later (accountStatus: 'blocked').
                accountStatus: 'approved',
                ...agreementFields,
                ...profileFields,
                ...eligibilityStamp,
                ...(resumeUrl ? { resumeUrl } : {}),
            };
            
            const newExpert = await expert.createExpert(expertData);
            console.log("✅ Expert registered successfully:", newExpert.id);
            await assignChosenPositions(newExpert, "Expert", email, chosen);

            let expertEmailSent = true;
            try {
                await sendOtp(email, otp);
            } catch (emailErr) {
                console.error("⚠️ Expert OTP email failed (account kept for retry):", emailErr.message);
                expertEmailSent = false;
                // Keep the account — user can resend OTP from the OTP page
            }
            return res.json({
                message: expertEmailSent
                    ? `OTP Sent to your ${email}!`
                    : `Account created! If you don't receive an OTP email, use the 'Resend OTP' button on the next page.`,
                roleCategory: "Expert",
                userType: userType || 'free'
            });
            
        } else {
            // Recruiter registration (existing behavior)
            // Prepare recruiter data - ALWAYS lowercase email for consistency
            const recruiterData = {
                name,
                email: email.toLowerCase(), // Always lowercase for consistent database lookups
                mobile,
                experienceCategory,
                roleCategory,
                skillCategory: skillCategory || '',
                password:hashPass,
                otp:hashedOtp,
                otpExpires,
                isVerified: false,
                // New sign-ups are live immediately — no admin/superadmin approval
                // needed. Admins can revoke access later (accountStatus: 'blocked').
                accountStatus: 'approved',
                ...agreementFields,
                ...profileFields,
                ...eligibilityStamp,
                ...(resumeUrl ? { resumeUrl } : {}),
            };

            // Add plan type fields only for Recruiters
            if (roleCategory === "Recruiter") {
                const registrationDate = new Date();
                // Fix: Use nullish coalescing to handle 0 correctly
                const selectedPlanType = planType !== undefined && planType !== null ? parseInt(planType) : 1;
                
                recruiterData.planType = selectedPlanType;
                recruiterData.registrationDate = registrationDate;
                
                if (selectedPlanType === 0) {
                    // Free plan: can work on max 4 positions (those with an active
                    // candidate). No time-based expiry.
                    recruiterData.maxPositions = 4;
                    recruiterData.planExpiryDate = null;
                } else {
                    // Paid plan: unlimited positions, no expiry
                    recruiterData.maxPositions = null;
                    recruiterData.planExpiryDate = null;
                }
            } else {
                // For non-recruiters (Coach, Expert), set default paid plan
                recruiterData.planType = 1;
                recruiterData.registrationDate = new Date();
                recruiterData.maxPositions = null;
                recruiterData.planExpiryDate = null;
            }

            let user;
            if (existingUser && !existingUser.isVerified) {
                // Update the existing unverified record with new OTP instead of creating a duplicate
                await recruiter.updateRecruiter(existingUser.id, {
                    name, mobile, experienceCategory, roleCategory,
                    skillCategory: skillCategory || '',
                    password: hashPass,
                    otp: hashedOtp,
                    otpExpires,
                    ...(recruiterData.planType !== undefined ? { planType: recruiterData.planType } : {}),
                    ...(recruiterData.registrationDate ? { registrationDate: recruiterData.registrationDate } : {}),
                    ...(recruiterData.maxPositions !== undefined ? { maxPositions: recruiterData.maxPositions } : {}),
                    ...(recruiterData.planExpiryDate !== undefined ? { planExpiryDate: recruiterData.planExpiryDate } : {}),
                });
                user = { id: existingUser.id, ...recruiterData };
                console.log("✅ Recruiter OTP refreshed (existing unverified):", existingUser.id);
            } else {
                user = await recruiter.createRecruiter(recruiterData);
                console.log("✅ Recruiter registered successfully:", user.id);
            }

            await assignChosenPositions(user, 'Recruiter', email, chosen);

            let recruiterEmailSent = true;
            try {
                await sendOtp(email, otp);
            } catch (emailErr) {
                console.error("⚠️ Recruiter OTP email failed (account kept for retry):", emailErr.message);
                recruiterEmailSent = false;
                // Keep the account — user can resend OTP from the OTP page
            }
            res.json({
                message: recruiterEmailSent
                    ? `OTP Sent to your ${email}!`
                    : `Account created! If you don't receive an OTP email, use the 'Resend OTP' button on the next page.`,
                roleCategory: roleCategory || "Recruiter"
            });
        }
    }
    catch(err){
        console.error("❌ Registration error:", err);
        if (err.message === "EMAIL_FAILED") {
            return res.status(503).json({
                error: "EMAIL_FAILED",
                message: "Registration saved but we could not send the OTP email. Please try again in a moment or contact support."
            });
        }
        res.status(500).json({ error: err.message });
    }
})

router.post("/resend_otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Find user across all collections
    let user = await recruiter.findRecruiterByEmail(email);
    let userCollection = 'recruiter';

    if (!user) {
      const coach = require('../model_fire/coachF');
      user = await coach.findCoachByEmail(email);
      userCollection = 'coach';
    }
    if (!user) {
      const expert = require('../model_fire/expertF');
      user = await expert.findExpertByEmail(email);
      userCollection = 'expert';
    }

    if (!user) return res.status(404).json({ message: "No account found for this email" });
    if (user.isVerified) return res.status(400).json({ message: "Account is already verified. Please login." });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = crypto.createHash("sha256").update(String(otp)).digest('hex');
    const otpExpires = Date.now() + 60 * 5 * 1000;

    if (userCollection === 'coach') {
      const coach = require('../model_fire/coachF');
      await coach.updateCoach(user.id, { otp: hashedOtp, otpExpires });
    } else if (userCollection === 'expert') {
      const expert = require('../model_fire/expertF');
      await expert.updateExpert(user.id, { otp: hashedOtp, otpExpires });
    } else {
      await recruiter.updateRecruiter(user.id, { otp: hashedOtp, otpExpires });
    }

    await sendOtp(email, otp);
    console.log(`✅ OTP resent to ${email}`);
    res.json({ message: `OTP resent to ${email}` });

  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    if (err.message === "EMAIL_FAILED") {
      return res.status(503).json({ message: "Failed to send email. Please try again." });
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/otp_verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Check in recruiter collection first
    let user = await recruiter.findRecruiterByEmail(email);
    let userCollection = 'recruiter';

    // If not found in recruiter, check coach collection
    if (!user) {
      const coach = require('../model_fire/coachF');
      user = await coach.findCoachByEmail(email);
      userCollection = 'coach';
    }

    // If not found in coach, check expert collection
    if (!user) {
      const expert = require('../model_fire/expertF');
      user = await expert.findExpertByEmail(email);
      userCollection = 'expert';
    }

    if (!user) return res.status(400).json({ message: "Invalid Email" });

    // Hash received OTP
    const hashedOtp = crypto
      .createHash("sha256")
      .update(String(otp).trim())
      .digest("hex");

    // Read expiry (already in milliseconds)
    const expiresAt = Number(user.otpExpires);

    // ---- CHECKS ----
    if (user.otp !== hashedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!expiresAt || expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    // ---- SUCCESS ----
    // Each user type gets its own editable template (registrationPendingRecruiter /
    // …Coach / …Expert) so SuperAdmin can word them differently. If a role-specific
    // template hasn't been published, this falls back to the shared one.
    const sendPendingEmail = async (name, role, toEmail) => {
      try {
        const r = (role || '').toString().toLowerCase();
        const roleKey = r.includes('coach') ? 'registrationPendingCoach'
          : r.includes('expert') ? 'registrationPendingExpert'
          : 'registrationPendingRecruiter';
        const vars = { name, userType: role };
        const fallback = {
          subject: `We've received your RecruiterV registration — under review`,
          htmlContent: templates.registrationPending(name, role),
        };
        // Role-specific first; if unpublished, renderEmail returns the fallback —
        // in that case try the shared template before using the built-in HTML.
        let _r = await renderEmail(roleKey, vars, { subject: '', htmlContent: '' });
        if (!_r.htmlContent) _r = await renderEmail('registrationPending', vars, fallback);
        await sendEmailFull({ to: toEmail, subject: _r.subject, htmlContent: _r.htmlContent, fromEmail: 'noreply@recruiterv.com', fromName: 'RecruiterV' });

        try {
          const { notify } = require('../utils/internalMessage');
          await notify('registrationReceived', {
            fromEmail: 'support@recruiterv.com',
            toEmail,
            vars: {
              name: name || 'there', firstName: String(name || '').split(' ')[0],
              email: toEmail, role: role || '',
            },
            recipientRole: String(role || '').toLowerCase().replace(/\s/g, ''),
          });
        } catch (_) { /* never block registration */ }
      } catch (err) { console.error('Registration pending email failed:', err); }
    };

    if (userCollection === 'coach') {
      const coach = require('../model_fire/coachF');
      await coach.updateCoach(user.id, { isVerified: true, otp: null, otpExpires: null });
      sendPendingEmail(user.name || user.email, 'Coach', user.email);
      return res.json({
        message: "OTP verified successfully.",
        showPendingModal: true,
        roleCategory: "Coach",
        userType: user.userType || 'free'
      });
    } else if (userCollection === 'expert') {
      const expert = require('../model_fire/expertF');
      await expert.updateExpert(user.id, { isVerified: true, otp: null, otpExpires: null });
      sendPendingEmail(user.name || user.email, 'Expert', user.email);
      return res.json({
        message: "OTP verified successfully.",
        showPendingModal: true,
        roleCategory: "Expert",
        userType: user.userType || 'free'
      });
    } else {
      // Recruiter
      await recruiter.updateRecruiter(user.id, { isVerified: true, otp: null, otpExpires: null });
      sendPendingEmail(user.name || user.email, user.roleCategory || 'Recruiter', user.email);
      return res.json({
        message: "OTP verified successfully.",
        showPendingModal: true,
        roleCategory: user.roleCategory || "Recruiter",
        planType: user.planType
      });
    }

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    return res.status(500).json({ message: "Server error verifying OTP" });
  }
});


// ✅ UPDATED: Login with support for Recruiter, Coach, and Expert
router.post('/rec_verify',async (req,res)=>{
    let {email,password}=req.body;

    // Normalize email to lowercase for consistent matching
    email = email.toLowerCase().trim();

    console.log(`🔐 LOGIN ATTEMPT: ${email}`);
    console.log(`📋 Request body:`, { ...req.body, password: '[HIDDEN]' });

    try {
        // Initialize variables
        let user = null;
        let userCollection = 'recruiter';

        // 1. Check recruiter collection first
        console.log(`🔍 Searching recruiter collection for: ${email}`);
        user = await recruiter.findRecruiterByEmail(email);

        // While the Coach/Expert side is closed, nobody signs in as one.
        //
        // Recruiter is checked first either way, so the 194 who were converted
        // land on their recruiter account regardless. This is about the rest:
        // without it they would still be handed a coach session and arrive on a
        // dashboard whose menus have been taken away.
        const { coachExpertEnabled } = require('../utils/featureFlags');
        const coachSideOpen = await coachExpertEnabled();

        if (coachSideOpen) {
            // 2. If not found, check coach collection
            if (!user) {
                console.log(`🔍 Recruiter not found, searching coach collection...`);
                const coach = require('../model_fire/coachF');
                user = await coach.findCoachByEmail(email);
                userCollection = 'coach';
            }

            // 3. If not found, check expert collection
            if (!user) {
                console.log(`🔍 Coach not found, searching expert collection...`);
                const expert = require('../model_fire/expertF');
                user = await expert.findExpertByEmail(email);
                userCollection = 'expert';
            }
        } else if (!user) {
            // Say what has actually happened rather than "no account found",
            // which would read as though their account had been deleted.
            try {
                const coach = require('../model_fire/coachF');
                const expert = require('../model_fire/expertF');
                const asCoach = (await coach.findCoachByEmail(email)) || (await expert.findExpertByEmail(email));
                if (asCoach) {
                    return res.status(403).json({
                        success: false,
                        message: 'Coach and Expert sign-in is closed at the moment. If you also work as a recruiter, '
                               + 'please sign in with your recruiter account, or contact support@recruiterv.com.',
                    });
                }
            } catch (e) { console.error('coach lookup during closed sign-in:', e.message); }
        }

        // 4. If not found, check referer collection
        if (!user) {
            console.log(`🔍 Expert not found, searching referer collection...`);
            const { db } = require('./firebase_ad');
            const refSnap = await db.collection('referer_db').where('email', '==', email).limit(1).get();
            if (!refSnap.empty) {
                const d = refSnap.docs[0];
                user = { id: d.id, ...d.data() };
                userCollection = 'referer';
            }
        }

        // User not found in any collection
        if(!user) {
            console.log(`❌ User not found in any collection`);
            // Return specific error message to help diagnose
            return res.status(400).json({
                success: false,
                message: "No account found with this email. Please check your email or register first.",
                errorCode: "USER_NOT_FOUND",
                hint: "Make sure you're using the same email you registered with"
            });
        }
        
        console.log(`✅ User found in ${userCollection} collection, ID: ${user.id}`);
        console.log(`📧 User email in DB: ${user.email}`);
        console.log(`🔑 Password in DB: ${user.password ? (user.password.startsWith('$2') ? '[BCRYPT_HASH]' : '[PLAIN_TEXT]') : '[MISSING]'}`);
        console.log(`✓ isVerified: ${user.isVerified}`);

        // Block login unless account is explicitly approved (or has no status = legacy pre-migration user).
        // New sign-ups are 'approved' automatically; 'blocked' is set by an admin/
        // superadmin (or the recruiter's vendor) to revoke access at any time.
        if (user.accountStatus && user.accountStatus !== 'approved') {
            const { SUSPENSION_MESSAGE } = require('../model_fire/inactivityF');
            const msgs = {
                pending:  "Your account is pending admin approval. You will receive an email once approved.",
                waitlist: "Your account is on the waitlist. Please wait for admin approval before logging in.",
                blocked:  "Your access has been put on hold by the administrator. Please contact support for assistance.",
                suspended: SUSPENSION_MESSAGE,
            };
            return res.status(403).json({
                success: false,
                message: msgs[user.accountStatus] || "Your account has not been approved. Please contact support.",
                errorCode: "ACCOUNT_" + user.accountStatus.toUpperCase(),
            });
        }

        // Auto-suspend inactive recruiters at login (safety net between daily sweeps):
        // registered ≥45 days ago with zero activity (no assignment, no submission,
        // no referral, no direct applicants) → suspend now and block this login.
        if (userCollection === 'recruiter' && (!user.accountStatus || user.accountStatus === 'approved')) {
            try {
                const { isRecruiterInactiveByEmail, SUSPENSION_MESSAGE } = require('../model_fire/inactivityF');
                if (await isRecruiterInactiveByEmail(user.email, user)) {
                    await recruiter.updateRecruiter(user.id, {
                        accountStatus: 'suspended', isActive: false,
                        suspendedAt: new Date(), suspendedReason: 'inactivity',
                    });
                    return res.status(403).json({ success: false, message: SUSPENSION_MESSAGE, errorCode: 'ACCOUNT_SUSPENDED' });
                }
            } catch (e) {
                console.error('Inactivity check failed (allowing login):', e.message);
            }
        }

        // Same inactivity gate for coaches/experts (+ "no team created" condition).
        if ((userCollection === 'coach' || userCollection === 'expert') && (!user.accountStatus || user.accountStatus === 'approved')) {
            try {
                const { isCoachExpertInactiveByEmail, SUSPENSION_MESSAGE } = require('../model_fire/inactivityF');
                if (await isCoachExpertInactiveByEmail(user.email, user)) {
                    const model = userCollection === 'coach' ? require('../model_fire/coachF') : require('../model_fire/expertF');
                    const updateFn = userCollection === 'coach' ? model.updateCoach : model.updateExpert;
                    await updateFn(user.id, {
                        accountStatus: 'suspended', isActive: false,
                        suspendedAt: new Date(), suspendedReason: 'inactivity',
                    });
                    return res.status(403).json({ success: false, message: SUSPENSION_MESSAGE, errorCode: 'ACCOUNT_SUSPENDED' });
                }
            } catch (e) {
                console.error('Coach/Expert inactivity check failed (allowing login):', e.message);
            }
        }

        // Check if user is verified (OTP verified)
        // For coaches/experts added via admin panel, isVerified might not be set
        // They should be able to login without OTP verification
        const requiresOtpVerification = userCollection === 'recruiter' && user.isVerified === false;
        if (requiresOtpVerification) {
            console.log(`⚠️ User is not OTP verified, rejecting login`);
            return res.status(403).json({ 
                success: false,
                message: "Email not verified. Please complete OTP verification sent to your email during registration.",
                errorCode: "EMAIL_NOT_VERIFIED",
                hint: "Check your email for the OTP code or request a new OTP"
            });
        }

        // Password validation
        // Check if password is a bcrypt hash (starts with $2) or plain text
        const isBcryptHash = user.password && user.password.startsWith('$2') && user.password.length >= 60;
        
        if (!isBcryptHash) {
            // Plain text password comparison (legacy users or admin-created users)
            if (password === user.password) {
                console.log(`✅ Plain text login successful for: ${email}, collection: ${userCollection}`);
                // Update lastActive timestamp on successful login
                const lastActiveUpdate = { lastActive: new Date() };
                
                if (userCollection === 'recruiter') {
                    await recruiter.updateRecruiter(user.id, lastActiveUpdate);
                } else if (userCollection === 'coach') {
                    const coach = require('../model_fire/coachF');
                    await coach.updateCoach(user.id, lastActiveUpdate);
                } else if (userCollection === 'expert') {
                    const expert = require('../model_fire/expertF');
                    await expert.updateExpert(user.id, lastActiveUpdate);
                }

                let token = jwt.sign(
                    {email: user.email, portal: 'user'},
                    process.env.SECKEY,
                    { expiresIn: "30d" }
                );
                
                res.cookie("__session", token, cookieOptions);

                // Return user data based on collection type
                if (userCollection === 'coach') {
                    res.json({
                        message: "Login Successfully!",
                        token,
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: "Coach",
                            specialization: user.specialization,
                            skillCategory: user.skillCategory || '',
                            userType: user.userType,
                            agreementSigned: !!user.agreementSigned
                        }
                    });
                } else if (userCollection === 'expert') {
                    res.json({
                        message: "Login Successfully!",
                        token,
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: "Expert",
                            specialization: user.specialization,
                            skillCategory: user.skillCategory || '',
                            userType: user.userType,
                            agreementSigned: !!user.agreementSigned
                        }
                    });
                } else if (userCollection === 'referer') {
                    res.json({
                        message: "Login Successfully!",
                        token,
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: "Referrer",
                            skillCategory: user.skillCategory || '',
                            agreementSigned: true
                        }
                    });
                } else {
                    res.json({
                        message: "Login Successfully!",
                        token,
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: user.roleCategory,
                            experienceCategory: user.experienceCategory,
                            skillCategory: user.skillCategory || '',
                            planType: user.planType,
                            maxPositions: user.maxPositions,
                            planExpiryDate: user.planExpiryDate,
                            registrationDate: user.registrationDate,
                            agreementSigned: !!user.agreementSigned
                        }
                    });
                }
            } else {
                console.log(`❌ Password mismatch for: ${email}`);
                res.status(400).json({
                    success: false,
                    message: "Incorrect password. Please try again or use 'Forgot Password' to reset.",
                    errorCode: "INVALID_PASSWORD",
                    hint: "Make sure Caps Lock is off and try again"
                });
            }
        } else {
            // Use bcrypt comparison for hashed passwords
            bcrypt.compare(password, user.password, async function(err, result){
                if(result){
                    // Update lastActive timestamp on successful login
                    const lastActiveUpdate = { lastActive: new Date() };

                    if (userCollection === 'recruiter') {
                        await recruiter.updateRecruiter(user.id, lastActiveUpdate);
                    } else if (userCollection === 'coach') {
                        const coach = require('../model_fire/coachF');
                        await coach.updateCoach(user.id, lastActiveUpdate);
                    } else if (userCollection === 'expert') {
                        const expert = require('../model_fire/expertF');
                        await expert.updateExpert(user.id, lastActiveUpdate);
                    }

                    let token = jwt.sign(
                        {email: user.email, portal: 'user'},
                        process.env.SECKEY,
                        { expiresIn: "30d" }
                    );

                    res.cookie("__session", token, cookieOptions);

                    // Return user data based on collection type
                    if (userCollection === 'coach') {
                        res.json({
                            message: "Login Successfully!",
                        token,
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: "Coach",
                                specialization: user.specialization,
                                skillCategory: user.skillCategory || '',
                                userType: user.userType,
                                agreementSigned: !!user.agreementSigned
                            }
                        });
                    } else if (userCollection === 'expert') {
                        res.json({
                            message: "Login Successfully!",
                        token,
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: "Expert",
                                specialization: user.specialization,
                                skillCategory: user.skillCategory || '',
                                userType: user.userType,
                                agreementSigned: !!user.agreementSigned
                            }
                        });
                    } else if (userCollection === 'referer') {
                        res.json({
                            message: "Login Successfully!",
                        token,
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: "Referrer",
                                skillCategory: user.skillCategory || '',
                                agreementSigned: true
                            }
                        });
                    } else {
                        res.json({
                            message: "Login Successfully!",
                        token,
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: user.roleCategory,
                                experienceCategory: user.experienceCategory,
                                skillCategory: user.skillCategory || '',
                                planType: user.planType,
                                maxPositions: user.maxPositions,
                                planExpiryDate: user.planExpiryDate,
                                registrationDate: user.registrationDate,
                                agreementSigned: !!user.agreementSigned
                            }
                        });
                    }
                }
                else {
                    console.log(`❌ Password mismatch for: ${email}`);
                    res.status(400).json({
                        success: false,
                        message: "Incorrect password. Please try again or use 'Forgot Password' to reset.",
                        errorCode: "INVALID_PASSWORD",
                        hint: "Make sure Caps Lock is off and try again"
                    });
                }
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login. Please try again later.",
            errorCode: "SERVER_ERROR"
        });
    }
})

// ✅ Session check with support for Recruiter, Coach, Expert, and ClientSPOC
router.get('/check', authMiddleware, async (req,res)=>{
    try{
        const token = req.cookies.__session;

        if(!token){
            return res.status(401).json({ message: "Not logged in" });
        }

        const decode = jwt.verify(token, process.env.SECKEY);

        // NOTE: We intentionally do NOT reject `portal: 'admin'` tokens here.
        // AuthPro calls /admin/authcheck FIRST — a genuine admin/clientspoc is
        // already resolved there. We only reach this point when /admin/authcheck
        // failed, which means the user is NOT a resolvable admin and SHOULD be
        // resolved as a recruiter/coach/expert/superadmin (e.g. a SuperAdmin who
        // lives in recruiter_db but signs in via the admin portal). Rejecting
        // here would log those users out on refresh. Dual-account disambiguation
        // is handled entirely by the /admin/authcheck `portal: 'user'` gate.

        // Check all four collections
        let user = await recruiter.findRecruiterByEmail(decode.email);
        let userCollection = 'recruiter';

        if (!user) {
            const coach = require('../model_fire/coachF');
            user = await coach.findCoachByEmail(decode.email);
            userCollection = 'coach';
        }

        if (!user) {
            const expert = require('../model_fire/expertF');
            user = await expert.findExpertByEmail(decode.email);
            userCollection = 'expert';
        }

        // Check ClientSPOC collection (admin_db)
        if (!user) {
            const clientspoc = require('../model_fire/clientspocF');
            user = await clientspoc.findClientSpocByEmail(decode.email);
            userCollection = 'clientspoc';
        }

        if (!user) return res.status(404).json({ message: "User not found" });

        // Access revoked by an admin/superadmin (or the recruiter's vendor) —
        // reject here too, so an already-signed-in user loses access on their next
        // page load instead of keeping a working session until the token expires.
        if ((user.accountStatus || '') === 'blocked') {
            return res.status(403).json({
                message: "Your access has been put on hold by the administrator.",
                errorCode: "ACCOUNT_BLOCKED",
            });
        }

        // Return user data based on collection type
        if (userCollection === 'coach') {
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,
                    name: user.name,
                    email: user.email,
                    roleCategory: "Coach",
                    specialization: user.specialization,
                    skillCategory: user.skillCategory || '',
                    userType: user.userType,
                    isEmployee: !!user.isEmployee,
                    designation: user.designation || '',
                    agreementSigned: !!user.agreementSigned
                }
            });
        } else if (userCollection === 'expert') {
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,
                    name: user.name,
                    email: user.email,
                    roleCategory: "Expert",
                    specialization: user.specialization,
                    skillCategory: user.skillCategory || '',
                    userType: user.userType,
                    isEmployee: !!user.isEmployee,
                    designation: user.designation || '',
                    agreementSigned: !!user.agreementSigned
                }
            });
        } else if (userCollection === 'clientspoc') {
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,
                    name: user.name,
                    email: user.email,
                    roleCategory: "ClientSPOC",
                    company: user.company,
                    designation: user.designation
                }
            });
        } else {
            // Recruiter (existing behavior)
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,
                    name: user.name,
                    email: user.email,
                    roleCategory: user.roleCategory,
                    role: user.role,
                    experienceCategory: user.experienceCategory,
                    skillCategory: user.skillCategory || '',
                    isEmployee: !!user.isEmployee,
                    designation: user.designation || '',
                    planType: user.planType,
                    maxPositions: user.maxPositions,
                    planExpiryDate: user.planExpiryDate,
                    registrationDate: user.registrationDate,
                    agreementSigned: !!user.agreementSigned,
                    // Set when the recruiter belongs to a vendor's team. The
                    // dash_view page uses it to hide the Coach/Expert section,
                    // which is not relevant to a vendor's own recruiters.
                    vendorEmail: user.vendorEmail || '',
                    isVendorSelf: !!user.isVendorSelf,
                    // Set for a consulting firm's own recruiters — they work
                    // under the firm's agreement, same as a vendor's team.
                    consultingFirmId: user.consultingFirmId || ''
                }
            });
        }

    }
    catch(err){
        console.error("Session check error:", err.message);
        res.status(403).json({ message: "Invalid or expired token" });
    }
})



// ✅ Update activity timestamp (for inactivity tracking)
router.post('/update-activity', authMiddleware, async (req, res) => {
    try {
        const user = await recruiter.findRecruiterByEmail(req.user.email);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update lastActive timestamp
        await recruiter.updateRecruiter(user.id, { 
            lastActive: new Date() 
        });

        res.status(200).json({ 
            message: "Activity updated successfully",
            lastActive: new Date()
        });
    } catch (error) {
        console.error("Update activity error:", error);
        res.status(500).json({ 
            message: "Failed to update activity" 
        });
    }
});

// Check plan limits for recruiter
router.get('/check-plan-limits', authMiddleware, async (req, res) => {
    try {
        const user = await recruiter.findRecruiterByEmail(req.user.email);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const planCheck = await recruiter.checkPlanLimits(user.id);

        res.status(200).json({
            success: true,
            planInfo: planCheck,
            user: {
                planType: user.planType,
                maxPositions: user.maxPositions,
                planExpiryDate: user.planExpiryDate,
                registrationDate: user.registrationDate
            }
        });
    } catch (error) {
        console.error("Check plan limits error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to check plan limits" 
        });
    }
});

router.post('/logout', (req,res)=>{
    res.clearCookie("__session", clearCookieOptions);
    res.status(200).json({ "message" : "Loggedout Successfully!" })
})


// Send email to recruiter (for admin use)
router.post('/send-recruiter-email', async (req, res) => {
    try {
        const { to, subject, body } = req.body;

        // Validate required fields
        if (!to || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: to, subject, body'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        await sendEmail(to, subject, body.replace(/\n/g, '<br>'), SENDER.email, SENDER.name);

        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
});


// Admin endpoint to fix user's plan expiry date
router.post('/admin/fix-user-plan-expiry', async (req, res) => {
    try {
        const { userEmail } = req.body;
        
        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'User email is required'
            });
        }
        
        // Find user
        const user = await recruiter.findRecruiterByEmail(userEmail);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user is on free plan
        if (user.planType !== 0) {
            return res.status(400).json({
                success: false,
                message: 'User is not on free plan',
                currentPlanType: user.planType
            });
        }
        
        // Check if planExpiryDate already exists
        if (user.planExpiryDate) {
            return res.status(200).json({
                success: true,
                message: 'User already has planExpiryDate set',
                planExpiryDate: user.planExpiryDate,
                alreadyFixed: true
            });
        }
        
        // Set registration date and expiry date
        const now = new Date();
        const registrationDate = user.registrationDate || now;
        const expiryDate = new Date(registrationDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        // Update user record
        await recruiter.updateRecruiter(user.id, {
            registrationDate: registrationDate,
            planExpiryDate: expiryDate
        });
        
        res.status(200).json({
            success: true,
            message: 'User plan expiry date fixed successfully',
            registrationDate: registrationDate,
            planExpiryDate: expiryDate,
            daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
        });
        
    } catch (error) {
        console.error('Error fixing user plan expiry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix user plan expiry',
            error: error.message
        });
    }
});



// Password reset has to reach every kind of login, not just the three recruiter
// collections. Admin-side accounts (ClientSPOC, Vendor, Admin, SuperAdmin) live
// in admin_db and store their hash in `codPass` rather than `password`, so the
// lookup returns which field to write back to.
//
// Returns { user, passwordField, update } or null.
const findAccountForReset = async (email) => {
  const lc = String(email || '').toLowerCase().trim();
  if (!lc) return null;

  const coach = require('../model_fire/coachF');
  const expert = require('../model_fire/expertF');

  const rec = await recruiter.findRecruiterByEmail(lc);
  if (rec) return { user: rec, passwordField: 'password', kind: 'recruiter',
    update: (id, data) => recruiter.updateRecruiter(id, data) };

  const cch = await coach.findCoachByEmail(lc);
  if (cch) return { user: cch, passwordField: 'password', kind: 'coach',
    update: (id, data) => coach.updateCoach(id, data) };

  const exp = await expert.findExpertByEmail(lc);
  if (exp) return { user: exp, passwordField: 'password', kind: 'expert',
    update: (id, data) => expert.updateExpert(id, data) };

  // admin_db — ClientSPOC / Vendor / Admin / SuperAdmin
  const { db } = require('./firebase_ad');
  const snap = await db.collection('admin_db').where('email', '==', lc).limit(1).get();
  if (!snap.empty) {
    const d = snap.docs[0];
    return {
      user: { id: d.id, ...d.data() },
      passwordField: 'codPass',
      kind: (d.data().roleCategory || 'admin'),
      update: (id, data) => db.collection('admin_db').doc(id).update(data),
    };
  }
  return null;
};

// Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const account = await findAccountForReset(email);
        if (!account) {
            console.log(`ℹ️  Password reset requested for an address with no account: ${email}`);
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }
        const { user } = account;
        const updateFn = account.update;

        // Generate reset token (valid for 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest('hex');

        const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        await updateFn(user.id, {
            resetToken: hashedToken,
            resetExpires: resetExpires
        });

        // Build reset link
        const resetLink = `${process.env.FRONTURL || 'https://www.recruiterv.com'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // The one email that must never be paused, but it should still be
        // editable like the rest — it was the only template whose own key was
        // never rendered.
        const { templates: emailTemplates } = require('../utils/email');
        const _fp = await renderEmail('forgotPassword',
          { userName: user.name || '', resetLink },
          { subject: 'Password Reset — RecruiterV',
            htmlContent: emailTemplates.forgotPassword(resetLink, user.name) });
        await sendEmail(user.email, _fp.subject, _fp.htmlContent, SENDER.email, SENDER.name);

        console.log(`✅ Password reset email sent to ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    }
});


// Reset Password with Token
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, token, and new password are required'
            });
        }

        const account = await findAccountForReset(email);
        if (!account) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link'
            });
        }
        const { user, passwordField } = account;
        const updateFn = account.update;

        // Check if reset token exists and hasn't expired
        if (!user.resetToken || !user.resetExpires) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link'
            });
        }

        if (Number(user.resetExpires) < Date.now()) {
            await updateFn(user.id, { resetToken: null, resetExpires: null });
            return res.status(400).json({
                success: false,
                message: 'Reset link has expired. Please request a new one.'
            });
        }

        // Verify token
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest('hex');

        if (user.resetToken !== hashedToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // admin-side accounts keep their hash in codPass, everyone else in password
        await updateFn(user.id, {
            [passwordField]: hashedPassword,
            resetToken: null,
            resetExpires: null
        });

        console.log(`✅ Password reset successful for ${email}`);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
});


module.exports=router;
