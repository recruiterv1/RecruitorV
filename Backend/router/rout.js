const express=require('express');
const router=express.Router();
const crypto=require('crypto')
const bcrypt=require('bcryptjs')
const brevo=require('@getbrevo/brevo');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');

const recruiter=require('../model_fire/recruiterF')


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
  try {

    const client=new brevo.TransactionalEmailsApi();

    client.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    )

    const emailData=new brevo.SendSmtpEmail();
  
    emailData.sender = {
      name: "Recruiter V",
      email: "admin@recruiterv.com",
    };
    emailData.to = [{ email }];
    emailData.subject = "RecruiterV OTP Code";
    emailData.htmlContent = `
      <p>Welcome to RecruiterV! Your one-time verification code is <strong>${otp}</strong>.</p>
      <p>Please enter this OTP on the registration page within 5 minutes to complete your signup.</p>
      <p>Do not share this code with anyone for your account's security.</p>
    `;

    const response = await client.sendTransacEmail(emailData);

  } catch (err) {
    console.error("❌ OTP Email Error:", err.message);
    throw new Error("EMAIL_FAILED");
  }
}






router.post('/register',async (req,res)=>{

    let {name,email,mobile,experienceCategory,password,roleCategory,planType,specialization,userType}=req.body;

    try{
        // Check user based on role - different collections for different roles
        let existingUser = null;
        
        if (roleCategory === "Recruiter") {
            existingUser = await recruiter.findRecruiterByEmail(email);
            if(existingUser && existingUser.isVerified){
                return res.status(400).json({message : "User Already Registered With Us!"});
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

        // Handle registration based on role
        if (roleCategory === "Coach") {
            // Create coach record
            const coach = require('../model_fire/coachF');
            const coachData = {
                name,
                email: email.toLowerCase(),
                mobile,
                specialization: specialization || '',
                userType: userType || 'free',
                password: hashPass,
                otp: hashedOtp,
                otpExpires,
                isVerified: false
            };
            
            const newCoach = await coach.createCoach(coachData);
            console.log("✅ Coach registered successfully:", newCoach.id);
            
            await sendOtp(email,otp);
            return res.json({ 
                message: `OTP Sent to your ${email}!`,
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
                userType: userType || 'free',
                password: hashPass,
                otp: hashedOtp,
                otpExpires,
                isVerified: false
            };
            
            const newExpert = await expert.createExpert(expertData);
            console.log("✅ Expert registered successfully:", newExpert.id);
            
            await sendOtp(email,otp);
            return res.json({ 
                message: `OTP Sent to your ${email}!`,
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
                password:hashPass,
                otp:hashedOtp,
                otpExpires,
                isVerified: false
            };

            // Add plan type fields only for Recruiters
            if (roleCategory === "Recruiter") {
                const registrationDate = new Date();
                // Fix: Use nullish coalescing to handle 0 correctly
                const selectedPlanType = planType !== undefined && planType !== null ? parseInt(planType) : 1;
                
                recruiterData.planType = selectedPlanType;
                recruiterData.registrationDate = registrationDate;
                
                if (selectedPlanType === 0) {
                    // Free plan: 2 positions max, 30 days limit
                    recruiterData.maxPositions = 2;
                    const expiryDate = new Date(registrationDate);
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    recruiterData.planExpiryDate = expiryDate;
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

            let user = await recruiter.createRecruiter(recruiterData);
            console.log("✅ Recruiter registered successfully:", user.id);

            await sendOtp(email,otp);
            res.json({ 
                message: `OTP Sent to your ${email}!`,
                roleCategory: roleCategory || "Recruiter"
            });
        }
    }
    catch(err){
        console.error("❌ Registration error:", err);
        res.status(500).json({error: err.message})
    }
})

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
    // Update based on collection
    if (userCollection === 'coach') {
      const coach = require('../model_fire/coachF');
      await coach.updateCoach(user.id, {
        isVerified: true,
        otp: null,
        otpExpires: null,
      });
      return res.json({ 
        message: "OTP verified successfully. Redirecting...",
        roleCategory: "Coach",
        userType: user.userType || 'free'
      });
    } else if (userCollection === 'expert') {
      const expert = require('../model_fire/expertF');
      await expert.updateExpert(user.id, {
        isVerified: true,
        otp: null,
        otpExpires: null,
      });
      return res.json({ 
        message: "OTP verified successfully. Redirecting...",
        roleCategory: "Expert",
        userType: user.userType || 'free'
      });
    } else {
      // Recruiter
      await recruiter.updateRecruiter(user.id, {
        isVerified: true,
        otp: null,
        otpExpires: null,
      });
      return res.json({ 
        message: "OTP verified successfully. Redirecting...",
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
                    {email: user.email}, 
                    process.env.SECKEY, 
                    { expiresIn: "1h" }
                );
                
                res.cookie("__session", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none", // Required for cross-site cookies
                    maxAge: 3600000, // 1 hour in milliseconds
                    path: "/",
                    domain: ".recruiterv.com" // Allow subdomain sharing
                });
                
                // Return user data based on collection type
                if (userCollection === 'coach') {
                    res.json({
                        message: "Login Successfully!",
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: "Coach",
                            specialization: user.specialization,
                            userType: user.userType
                        }
                    });
                } else if (userCollection === 'expert') {
                    res.json({
                        message: "Login Successfully!",
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: "Expert",
                            specialization: user.specialization,
                            userType: user.userType
                        }
                    });
                } else {
                    res.json({
                        message: "Login Successfully!",
                        user: {
                            name: user.name,
                            email: user.email,
                            roleCategory: user.roleCategory,
                            experienceCategory: user.experienceCategory,
                            planType: user.planType,
                            maxPositions: user.maxPositions,
                            planExpiryDate: user.planExpiryDate,
                            registrationDate: user.registrationDate
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
                        {email: user.email}, 
                        process.env.SECKEY, 
                        { expiresIn: "1h" }
                    );
                    
                    res.cookie("__session", token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "none", // Required for cross-site cookies
                        maxAge: 3600000, // 1 hour in milliseconds
                        path: "/",
                        domain: ".recruiterv.com" // Allow subdomain sharing
                    });
                    
                    // Return user data based on collection type
                    if (userCollection === 'coach') {
                        res.json({
                            message: "Login Successfully!",
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: "Coach",
                                specialization: user.specialization,
                                userType: user.userType
                            }
                        });
                    } else if (userCollection === 'expert') {
                        res.json({
                            message: "Login Successfully!",
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: "Expert",
                                specialization: user.specialization,
                                userType: user.userType
                            }
                        });
                    } else {
                        // Recruiter (existing behavior)
                        res.json({
                            message: "Login Successfully!",
                            user: {
                                name: user.name,
                                email: user.email,
                                roleCategory: user.roleCategory,  // undefined for old database users
                                experienceCategory: user.experienceCategory,
                                planType: user.planType,
                                maxPositions: user.maxPositions,
                                planExpiryDate: user.planExpiryDate,
                                registrationDate: user.registrationDate
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

        // Return user data based on collection type
        if (userCollection === 'coach') {
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,  // Include database ID for API calls
                    name: user.name,
                    email: user.email,
                    roleCategory: "Coach",
                    specialization: user.specialization,
                    userType: user.userType
                }
            });
        } else if (userCollection === 'expert') {
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,  // Include database ID for API calls
                    name: user.name,
                    email: user.email,
                    roleCategory: "Expert",
                    specialization: user.specialization,
                    userType: user.userType
                }
            });
        } else if (userCollection === 'clientspoc') {
            res.status(200).json({
                message: "User authenticated",
                user: {
                    uid: user.id,  // Include database ID for API calls
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
                    uid: user.id,  // Include database ID for API calls
                    name: user.name,
                    email: user.email,
                    roleCategory: user.roleCategory,
                    experienceCategory: user.experienceCategory,
                    planType: user.planType,
                    maxPositions: user.maxPositions,
                    planExpiryDate: user.planExpiryDate,
                    registrationDate: user.registrationDate
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
    res.clearCookie("__session", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    domain: ".recruiterv.com"
 });
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

        // Send email using Brevo
        const client = new brevo.TransactionalEmailsApi();
        client.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );

        const emailData = new brevo.SendSmtpEmail();
        emailData.sender = {
            name: "RecruiterV Admin",
            email: "admin@recruiterv.com",
        };
        emailData.to = [{ email: to }];
        emailData.subject = subject;
        emailData.htmlContent = body.replace(/\n/g, '<br>'); // Convert newlines to HTML breaks

        await client.sendTransacEmail(emailData);

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

        // Find user by email
        const user = await recruiter.findRecruiterByEmail(email);

        // Don't reveal whether user exists - just show success
        // This prevents email enumeration attacks
        if (!user) {
            // User not found, but don't reveal this to potential attacker
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest('hex');
        
        const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        // Store hashed token and expiry in user record
        await recruiter.updateRecruiter(user.id, {
            resetToken: hashedToken,
            resetExpires: resetExpires
        });

        // Build reset link
        const resetLink = `${process.env.FRONTURL || 'https://www.recruiterv.com'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send email with reset link using Brevo
        const client = new brevo.TransactionalEmailsApi();
        client.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );

        const emailData = new brevo.SendSmtpEmail();
        emailData.sender = {
            name: "RecruiterV",
            email: "admin@recruiterv.com",
        };
        emailData.to = [{ email: user.email }];
        emailData.subject = "Password Reset - RecruiterV";
        emailData.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>You requested to reset your password. Click the button below to create a new password:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: linear-gradient(to right, #2563eb, #f97316); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                    This link will expire in <strong>1 hour</strong> for security purposes.
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                    If you didn't request this password reset, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">
                    RecruiterV Team<br>
                    admin@recruiterv.com
                </p>
            </div>
        `;

        await client.sendTransacEmail(emailData);

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

        // Find user
        const user = await recruiter.findRecruiterByEmail(email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link'
            });
        }

        // Check if reset token exists and hasn't expired
        if (!user.resetToken || !user.resetExpires) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link'
            });
        }

        if (Number(user.resetExpires) < Date.now()) {
            // Clear expired token
            await recruiter.updateRecruiter(user.id, {
                resetToken: null,
                resetExpires: null
            });
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

        // Update user password and clear reset tokens
        await recruiter.updateRecruiter(user.id, {
            password: hashedPassword,
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
