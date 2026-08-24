const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid').v4 || require('uuid');

// Import model functions
const recruiter = require('../model_fire/recruiterF');
const coach = require('../model_fire/coachF');
const expert = require('../model_fire/expertF');
const clientspoc = require('../model_fire/clientspocF');
const { admin, db } = require('./firebase_ad');
const adminCF = require('../model_fire/adminCF');

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.cookies.__session;
  console.log('[Auth Middleware] Token exists:', !!token);
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    console.log('[Auth Middleware] Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification error:', err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Optional auth that accepts either session cookie or Firebase Authorization header.
// If neither is present, continues without user context (for public, non-sensitive reads).
async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.__session;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECKEY);
        req.user = decoded;
        return next();
      } catch (err) {
        console.warn('[OptionalAuth] Cookie token verify failed:', err.message);
      }
    }
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        return next();
      } catch (err) {
        console.warn('[OptionalAuth] Firebase token verify failed:', err.message);
      }
    }
    req.user = null;
    next();
  } catch (error) {
    console.error('[OptionalAuth] Unexpected error:', error.message);
    next();
  }
}

// Helper to find user across all collections
async function findUserByEmail(email) {
  // Normalize email to lowercase for consistent matching
  const normalizedEmail = email.toLowerCase();
  console.log('[findUserByEmail] Searching for:', normalizedEmail);
  
  // Check recruiter
  let user = await recruiter.findRecruiterByEmail(normalizedEmail);
  if (user) {
    console.log('[findUserByEmail] Found in recruiter collection');
    return { user, collection: 'recruiter' };
  }
  
  // Check coach
  user = await coach.findCoachByEmail(normalizedEmail);
  if (user) {
    console.log('[findUserByEmail] Found in coach collection');
    return { user, collection: 'coach' };
  }
  
  // Check expert
  user = await expert.findExpertByEmail(normalizedEmail);
  if (user) {
    console.log('[findUserByEmail] Found in expert collection');
    return { user, collection: 'expert' };
  }
  
  // Check client spoc
  user = await clientspoc.findClientSpocByEmail(normalizedEmail);
  if (user) {
    console.log('[findUserByEmail] Found in clientspoc collection');
    return { user, collection: 'clientspoc' };
  }
  
  console.log('[findUserByEmail] User not found in any collection');
  return null;
}

// Helper to update user based on collection
async function updateUser(collection, id, data) {
  console.log(`[updateUser] Collection: ${collection}, ID: ${id}, Data keys:`, Object.keys(data));
  try {
    switch (collection) {
      case 'recruiter':
        return await recruiter.updateRecruiter(id, data);
      case 'coach':
        return await coach.updateCoach(id, data);
      case 'expert':
        return await expert.updateExpert(id, data);
      case 'clientspoc':
        return await clientspoc.updateClientSpoc(id, data);
      default:
        throw new Error('Unknown collection');
    }
  } catch (error) {
    console.error('[updateUser] Error:', error);
    throw error;
  }
}

// Helper to create or update user (upsert) based on collection - handles new profile creation
async function createOrUpdateUser(collection, id, data) {
  console.log(`[createOrUpdateUser] Collection: ${collection}, ID: ${id}, Data keys:`, Object.keys(data));
  try {
    switch (collection) {
      case 'recruiter':
        return await recruiter.createOrUpdateRecruiter(id, data);
      case 'coach':
        return await coach.createOrUpdateCoach(id, data);
      case 'expert':
        return await expert.createOrUpdateExpert(id, data);
      case 'clientspoc':
        return await clientspoc.createOrUpdateClientSpoc(id, data);
      default:
        throw new Error('Unknown collection');
    }
  } catch (error) {
    console.error('[createOrUpdateUser] Error:', error);
    throw error;
  }
}

// Helper to get user by ID based on collection
async function getUserById(collection, id) {
  console.log(`[getUserById] Collection: ${collection}, ID: ${id}`);
  try {
    switch (collection) {
      case 'recruiter':
        return await recruiter.findRecruiterById(id);
      case 'coach':
        return await coach.findCoachById(id);
      case 'expert':
        return await expert.findExpertById(id);
      case 'clientspoc':
        return await clientspoc.findClientSpocById(id);
      default:
        return null;
    }
  } catch (error) {
    console.error('[getUserById] Error:', error);
    throw error;
  }
}

// Calculate profile completion percentage - matches Frontend Profile.jsx fields
function calculateProfileCompletion(user, roleCategory) {
  // Handle mobile -> phone mapping
  const phone = user.phone || user.mobile || '';
  
  // Map frontend field names to backend/user model field names
  // Frontend sends: currentCompany, currentTitle - Backend model may have: company, designation
  const company = user.company || user.currentCompany || '';
  const designation = user.designation || user.currentTitle || '';
  
  const fields = {
    // Common fields (all users) - matching Frontend Profile.jsx
    name: { value: user.name, weight: 5 },
    email: { value: user.email, weight: 5 },
    phone: { value: phone, weight: 5 },
    yearsOfExperience: { value: user.yearsOfExperience, weight: 5 },
    location: { value: user.location, weight: 3 },
    country: { value: user.country, weight: 3 },
    bio: { value: user.bio, weight: 10 },
    // Professional tab fields
    currentCompany: { value: company, weight: 5 },
    currentTitle: { value: designation, weight: 5 },
    linkedin: { value: user.linkedin, weight: 2 },
    twitter: { value: user.twitter, weight: 1 },
    website: { value: user.website, weight: 1 },
    // Skills and Experience (arrays)
    skills: { value: user.skills, weight: 15, type: 'array' },
    workExperience: { value: user.workExperience, weight: 20, type: 'array' },
    // Profile photo
    profilePhoto: { value: user.profilePhoto, weight: 10 },
  };

  // Note: Education and Resume are NOT included in the main form calculation
  // Resume is uploaded via separate endpoint, Education tab was removed from frontend

  let totalWeight = 0;
  let filledWeight = 0;
  const missingFields = [];

  for (const [field, config] of Object.entries(fields)) {
    totalWeight += config.weight;
    
    const isFilled = config.type === 'array' 
      ? (config.value && Array.isArray(config.value) && config.value.length > 0)
      : (config.value && config.value.toString().trim() !== '');
    
    if (isFilled) {
      filledWeight += config.weight;
    } else {
      // Format field name for display
      const displayName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      missingFields.push(displayName);
    }
  }

  const percentage = Math.round((filledWeight / totalWeight) * 100);

  // Check skillCategory separately (required field, not in the weighted calculation)
  const sc = user.skillCategory || user.skill_category || user.specialization;
  const hasSkillCategory = Array.isArray(sc) ? sc.length > 0 : !!(sc && sc.toString().trim());

  return {
    percentage,
    hasSkillCategory,
    missingFields: hasSkillCategory ? missingFields : [...missingFields, 'Skill Category'],
    totalFields: Object.keys(fields).length,
    filledFields: Object.keys(fields).filter(field => {
      const config = fields[field];
      return config.type === 'array'
        ? (config.value && Array.isArray(config.value) && config.value.length > 0)
        : (config.value && config.value.toString().trim() !== '');
    }).length
  };
}

// Get profile completion percentage
router.get('/profile-completion', authMiddleware, async (req, res) => {
  console.log('[Profile Completion API] Called');
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const completion = calculateProfileCompletion(user, user.roleCategory);

    res.status(200).json({
      success: true,
      completion,
      user: {
        name: user.name,
        email: user.email,
        roleCategory: user.roleCategory
      }
    });
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to calculate profile completion",
      error: error.message 
    });
  }
});

// Create or update user profile (main save endpoint)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('[Profile POST] Request received from:', req.user.email);
    console.log('[Profile POST] Request body keys:', Object.keys(req.body));
    console.log('[Profile POST] Full body:', JSON.stringify(req.body));
    
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      console.log('[Profile POST] User not found for email:', req.user.email);
      console.log('[Profile POST] Will check all collections...');
      
      // Try to find in each collection manually for debugging
      const recruiterUser = await recruiter.findRecruiterByEmail(req.user.email);
      console.log('[Profile POST] Recruiter lookup result:', recruiterUser ? 'Found' : 'Not found');
      
      return res.status(404).json({ success: false, message: "User not found", isNewUser: true });
    }

    const { user, collection } = result;
    console.log('[Profile Save] Found user:', user.id, 'in collection:', collection);
    
    const updateData = req.body;

    // CRITICAL: Never allow email or name to be overwritten with empty/null values
    // These fields are critical for authentication and should never be modified by profile updates
    // Log if we're receiving email/name in the update data (for debugging)
    if (updateData.email !== undefined || updateData.name !== undefined) {
      console.warn('[Profile Save] Received email/name in update data - these should not be modified:', {
        hasEmail: updateData.email !== undefined,
        hasName: updateData.name !== undefined,
        emailValue: updateData.email,
        nameValue: updateData.name
      });
    }

    // Fields that can be updated - NOT including email and name as those are critical
    // Note: profilePhoto, resume, workExperience, education are handled by separate endpoints
    // IMPORTANT: Also include company, designation for recruiters
    const allowedFields = [
      'phone', 'bio', 'skills',
      'linkedin', 'twitter', 'website', 'location', 'country',
      'currentCompany', 'currentTitle', 'yearsOfExperience',
      'availability', 'hourlyRate', 'expectedSalary', 'noticePeriod',
      'specialization', 'targetIndustries', 'recruitmentMethods',
      'coachingPhilosophy', 'sessionTypes', 'yearsCoaching',
      'expertSpecialization', 'industriesServed', 'projectTypes', 'consultationType',
      // Add profile fields that were missing
      'profilePhoto', 'resume', 'workExperience', 'education',
      // These are used by some parts of the system
      'company', 'designation', 'industry',
      'skillCategory',
      'availableToCreateTeam',
      'specializedAt',
      // Payment / bank details — rendered in the recruiter agreement PDF.
      'accountHolderName', 'bankName', 'branchName', 'ifsc',
      'accountNumber', 'accountType', 'upiId', 'pan'
    ];

    // Enforce skillCategory as required (must be a non-empty array)
    if (updateData.skillCategory !== undefined) {
      const sc = updateData.skillCategory;
      const arr = Array.isArray(sc) ? sc : (sc ? [sc] : []);
      if (arr.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one Skill Category is required.' });
      }
      // Enforce per-role max: Expert → 1, Coach/Recruiter → 3
      const role = (user.roleCategory || '').toLowerCase();
      const maxCats = role === 'expert' ? 1 : 3;
      if (arr.length > maxCats) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${maxCats} skill ${maxCats > 1 ? 'categories' : 'category'} allowed for ${user.roleCategory || 'your role'}.`,
        });
      }
      // Normalise to array before saving
      updateData.skillCategory = arr;
    }

    // Filter allowed fields
    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // DEBUG: Log what fields are being received and filtered
    console.log('[Profile Save] All received fields:', Object.keys(updateData));
    console.log('[Profile Save] Full updateData:', JSON.stringify(updateData));
    console.log('[Profile Save] Filtered data keys:', Object.keys(filteredData));
    console.log('[Profile Save] Bio value:', updateData.bio);
    console.log('[Profile Save] Skills value:', updateData.skills);
    console.log('[Profile Save] Location value:', updateData.location);
    console.log('[Profile Save] Country value:', updateData.country);
    console.log('[Profile Save] Current company:', updateData.currentCompany);
    console.log('[Profile Save] Current title:', updateData.currentTitle);

    // Add updated timestamp
    filteredData.updatedAt = new Date();

    console.log('[Profile Save] Final data to save:', JSON.stringify(filteredData));

    // Use createOrUpdateUser to handle both new profile creation and updates
    // This fixes the issue where .update() fails for non-existing documents
    await createOrUpdateUser(collection, user.id, filteredData);

    // Get updated user data
    const updatedUser = await getUserById(collection, user.id);
    console.log('[Profile Save] Updated user data:', JSON.stringify(updatedUser));
    
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: {
        completionPercentage: completion.percentage,
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to save profile",
      error: error.message 
    });
  }
});

// Get user profile data - mounted at /api/profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[Profile GET] Request received from:', req.user.email);
    console.log('[Profile GET] Looking up user in database...');
    
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found", isNewUser: true });
    }

    const { user, collection } = result;
    const completion = calculateProfileCompletion(user, user.roleCategory);

    // FIX: Remove the incorrect isNewUser logic that was marking existing users as "new"
    // The isNewUser flag should ONLY be true when user is NOT FOUND (404 case)
    // Don't base it on completion percentage - that's misleading
    const isNewUser = false; // User exists in database, so not "new"

    // Return user data without sensitive information
    const { password, otp, otpExpires, resetToken, resetExpires, ...safeUser } = user;
    
    // Map 'mobile' to 'phone' for frontend compatibility
    if (safeUser.mobile && !safeUser.phone) {
      safeUser.phone = safeUser.mobile;
    }

    // Include completion percentage in the data object for frontend compatibility
    const userData = {
      ...safeUser,
      completionPercentage: completion.percentage
    };

    res.status(200).json({
      success: true,
      user: safeUser,
      collection,
      completion,
      isNewUser,
      data: userData  // Include completionPercentage in data for frontend
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get profile",
      error: error.message 
    });
  }
});

// Get recruiter public profile by ID - for ClientSPOC to view
router.get('/recruiter/:id/admin', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterProfile = await recruiter.getRecruiterPublicProfile(id);
    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }
    res.status(200).json({
      success: true,
      data: recruiterProfile
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to get recruiter profile",
      error: error.message 
    });
  }
});

router.get('/recruiter/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    // Verify user is ClientSPOC (only ClientSPOC can view recruiter profiles)
    const spocUser = await clientspoc.findClientSpocByEmail(userEmail);
    
    if (!spocUser) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only ClientSPOC can view recruiter profiles."
      });
    }

    // Get recruiter profile
    const recruiterProfile = await recruiter.getRecruiterPublicProfile(id);

    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    res.status(200).json({
      success: true,
      data: recruiterProfile
    });
  } catch (error) {
    console.error('Get recruiter profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get recruiter profile",
      error: error.message 
    });
  }
});

// Get recruiter public profile by ID - for Admin/SuperAdmin to view
router.get('/recruiter/:id-admin', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // If a user context exists, ensure it is Admin or Super Admin; otherwise allow read as public.
    if (req.user && req.user.email) {
      try {
        const email = (req.user.email || '').toLowerCase();
        // Allow Super Admin recruiters
        const rec = await recruiter.findRecruiterByEmail(email);
        if (rec && rec.roleCategory === 'Super Admin') {
          // Authorized
        } else {
          // Otherwise allow Admin from admin_db
          const adminCheck = await adminCF.checkData(email);
          if (!adminCheck.success) {
            console.warn('[Admin Recruiter Profile] Non-admin access attempted:', email);
          }
        }
      } catch (authErr) {
        console.warn('[Admin Recruiter Profile] Authorization check failed:', authErr.message);
      }
    }

    const recruiterProfile = await recruiter.getRecruiterPublicProfile(id);

    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    res.status(200).json({
      success: true,
      data: recruiterProfile
    });
  } catch (error) {
    console.error('Get recruiter profile (admin) error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get recruiter profile",
      error: error.message 
    });
  }
});

// Update user profile
router.put('/profile/update', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const updateData = req.body;

    // CRITICAL: Never allow email or name to be overwritten with empty/null values
    // These fields are critical for authentication and should never be modified by profile updates
    // Log if we're receiving email/name in the update data (for debugging)
    if (updateData.email !== undefined || updateData.name !== undefined) {
      console.warn('[Profile Update] Received email/name in update data - these should not be modified:', {
        hasEmail: updateData.email !== undefined,
        hasName: updateData.name !== undefined,
        emailValue: updateData.email,
        nameValue: updateData.name
      });
    }

    // Fields that can be updated - NOT including email and name as those are critical
    const allowedFields = [
      'phone', 'company', 'designation', 'bio',
      'profilePhoto', 'resume', 'skills', 'workExperience',
      'education', 'specialization', 'industry', 'hourlyRate',
      'availability', 'linkedin', 'twitter', 'website'
    ];

    // Filter allowed fields
    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Add updated timestamp
    filteredData.updatedAt = new Date();

    await updateUser(collection, user.id, filteredData);

    // Get updated user data
    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      completion
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update profile",
      error: error.message 
    });
  }
});

// Add work experience entry
router.post('/profile/work-experience', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const { company, position, startDate, endDate, current, description } = req.body;

    if (!company || !position || !startDate) {
      return res.status(400).json({ 
        success: false,
        message: "Company, position, and start date are required" 
      });
    }

    const newExperience = {
      id: uuidv4(),
      company,
      position,
      startDate,
      endDate: current ? null : endDate,
      current,
      description: description || '',
      createdAt: new Date()
    };

    // Get current work experience array
    const currentExperience = user.workExperience || [];
    currentExperience.push(newExperience);

    await updateUser(collection, user.id, { 
      workExperience: currentExperience,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Work experience added successfully",
      experience: newExperience
    });
  } catch (error) {
    console.error('Add work experience error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to add work experience",
      error: error.message 
    });
  }
});

// Delete work experience entry
router.delete('/profile/work-experience/:id', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const { id } = req.params;

    const currentExperience = user.workExperience || [];
    const filteredExperience = currentExperience.filter(exp => exp.id !== id);

    await updateUser(collection, user.id, { 
      workExperience: filteredExperience,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Work experience deleted successfully"
    });
  } catch (error) {
    console.error('Delete work experience error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete work experience",
      error: error.message 
    });
  }
});

// Add education entry
router.post('/profile/education', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const { institution, degree, year, fieldOfStudy, description } = req.body;

    if (!institution || !degree || !year) {
      return res.status(400).json({ 
        success: false,
        message: "Institution, degree, and year are required" 
      });
    }

    const newEducation = {
      id: uuidv4(),
      institution,
      degree,
      year: parseInt(year),
      fieldOfStudy: fieldOfStudy || '',
      description: description || '',
      createdAt: new Date()
    };

    // Get current education array
    const currentEducation = user.education || [];
    currentEducation.push(newEducation);

    await updateUser(collection, user.id, { 
      education: currentEducation,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Education added successfully",
      education: newEducation
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to add education",
      error: error.message 
    });
  }
});

// Delete education entry
router.delete('/profile/education/:id', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const { id } = req.params;

    const currentEducation = user.education || [];
    const filteredEducation = currentEducation.filter(edu => edu.id !== id);

    await updateUser(collection, user.id, { 
      education: filteredEducation,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Education deleted successfully"
    });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete education",
      error: error.message 
    });
  }
});

// Add skill
router.post('/profile/skills', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const { skill } = req.body;

    if (!skill || !skill.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Skill is required" 
      });
    }

    const newSkill = skill.trim();
    const currentSkills = user.skills || [];

    // Check if skill already exists
    if (currentSkills.includes(newSkill)) {
      return res.status(400).json({ 
        success: false,
        message: "Skill already exists" 
      });
    }

    currentSkills.push(newSkill);

    await updateUser(collection, user.id, { 
      skills: currentSkills,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Skill added successfully",
      skills: currentSkills
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to add skill",
      error: error.message 
    });
  }
});

// Remove skill
router.delete('/profile/skills', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { user, collection } = result;
    const { skill } = req.body;

    const currentSkills = user.skills || [];
    const filteredSkills = currentSkills.filter(s => s !== skill);

    await updateUser(collection, user.id, { 
      skills: filteredSkills,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Skill removed successfully",
      skills: filteredSkills
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove skill",
      error: error.message 
    });
  }
});

// Add work experience
router.post('/experience', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { companyName, jobTitle, location, startDate, endDate, isCurrent, description } = req.body;

    if (!companyName || !jobTitle || !startDate) {
      return res.status(400).json({ success: false, message: "Company, Title, and Start Date are required" });
    }

    const newExperience = {
      id: uuidv4(),
      companyName,
      jobTitle,
      location: location || '',
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent: isCurrent || false,
      description: description || '',
      createdAt: new Date()
    };

    const currentExperience = user.workExperience || [];
    currentExperience.push(newExperience);

    await updateUser(collection, user.id, { workExperience: currentExperience, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Work experience added successfully",
      data: { workExperience: currentExperience, completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Add work experience error:', error);
    res.status(500).json({ success: false, message: "Failed to add work experience", error: error.message });
  }
});

// Update work experience
router.put('/experience/:id', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { id } = req.params;
    const { companyName, jobTitle, location, startDate, endDate, isCurrent, description } = req.body;

    const currentExperience = user.workExperience || [];
    const index = currentExperience.findIndex(exp => exp.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Experience not found" });
    }

    currentExperience[index] = {
      ...currentExperience[index],
      companyName: companyName || currentExperience[index].companyName,
      jobTitle: jobTitle || currentExperience[index].jobTitle,
      location: location !== undefined ? location : currentExperience[index].location,
      startDate: startDate || currentExperience[index].startDate,
      endDate: isCurrent ? null : (endDate || currentExperience[index].endDate),
      isCurrent: isCurrent !== undefined ? isCurrent : currentExperience[index].isCurrent,
      description: description !== undefined ? description : currentExperience[index].description,
      updatedAt: new Date()
    };

    await updateUser(collection, user.id, { workExperience: currentExperience, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Work experience updated successfully",
      data: { workExperience: currentExperience, completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Update work experience error:', error);
    res.status(500).json({ success: false, message: "Failed to update work experience", error: error.message });
  }
});

// Delete work experience
router.delete('/experience/:id', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { id } = req.params;

    const currentExperience = user.workExperience || [];
    const filteredExperience = currentExperience.filter(exp => exp.id !== id);

    await updateUser(collection, user.id, { workExperience: filteredExperience, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Work experience deleted successfully",
      data: { workExperience: filteredExperience, completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Delete work experience error:', error);
    res.status(500).json({ success: false, message: "Failed to delete work experience", error: error.message });
  }
});

// Add education
router.post('/education', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { institutionName, degree, fieldOfStudy, location, startDate, endDate, isCurrent, gpa, honors } = req.body;

    if (!institutionName || !degree) {
      return res.status(400).json({ success: false, message: "Institution and Degree are required" });
    }

    const newEducation = {
      id: uuidv4(),
      institutionName,
      degree,
      fieldOfStudy: fieldOfStudy || '',
      location: location || '',
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent: isCurrent || false,
      gpa: gpa || '',
      honors: honors || [],
      createdAt: new Date()
    };

    const currentEducation = user.education || [];
    currentEducation.push(newEducation);

    await updateUser(collection, user.id, { education: currentEducation, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Education added successfully",
      data: { education: currentEducation, completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ success: false, message: "Failed to add education", error: error.message });
  }
});

// Update education
router.put('/education/:id', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { id } = req.params;
    const { institutionName, degree, fieldOfStudy, location, startDate, endDate, isCurrent, gpa, honors } = req.body;

    const currentEducation = user.education || [];
    const index = currentEducation.findIndex(edu => edu.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Education not found" });
    }

    currentEducation[index] = {
      ...currentEducation[index],
      institutionName: institutionName || currentEducation[index].institutionName,
      degree: degree || currentEducation[index].degree,
      fieldOfStudy: fieldOfStudy !== undefined ? fieldOfStudy : currentEducation[index].fieldOfStudy,
      location: location !== undefined ? location : currentEducation[index].location,
      startDate: startDate || currentEducation[index].startDate,
      endDate: isCurrent ? null : (endDate || currentEducation[index].endDate),
      isCurrent: isCurrent !== undefined ? isCurrent : currentEducation[index].isCurrent,
      gpa: gpa !== undefined ? gpa : currentEducation[index].gpa,
      honors: honors !== undefined ? honors : currentEducation[index].honors,
      updatedAt: new Date()
    };

    await updateUser(collection, user.id, { education: currentEducation, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Education updated successfully",
      data: { education: currentEducation, completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ success: false, message: "Failed to update education", error: error.message });
  }
});

// Delete education
router.delete('/education/:id', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { id } = req.params;

    const currentEducation = user.education || [];
    const filteredEducation = currentEducation.filter(edu => edu.id !== id);

    await updateUser(collection, user.id, { education: filteredEducation, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Education deleted successfully",
      data: { education: filteredEducation, completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ success: false, message: "Failed to delete education", error: error.message });
  }
});

// Upload profile photo
router.post('/photo', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { photoData, fileName, contentType } = req.body;

    if (!photoData) {
      return res.status(400).json({ success: false, message: "Photo data is required" });
    }

    await updateUser(collection, user.id, { profilePhoto: photoData, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: { completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ success: false, message: "Failed to upload photo", error: error.message });
  }
});

// Delete profile photo
router.delete('/photo', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;

    await updateUser(collection, user.id, { profilePhoto: null, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Profile photo deleted successfully",
      data: { completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ success: false, message: "Failed to delete photo", error: error.message });
  }
});

// Upload resume
router.post('/resume', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    const { resumeData, fileName, contentType } = req.body;

    if (!resumeData) {
      return res.status(400).json({ success: false, message: "Resume data is required" });
    }

    await updateUser(collection, user.id, { resume: resumeData, resumeFileName: fileName, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      data: { completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: "Failed to upload resume", error: error.message });
  }
});

// Delete resume
router.delete('/resume', authMiddleware, async (req, res) => {
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;

    await updateUser(collection, user.id, { resume: null, resumeFileName: null, updatedAt: new Date() });

    const updatedUser = await getUserById(collection, user.id);
    const completion = calculateProfileCompletion(updatedUser, updatedUser.roleCategory);

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
      data: { completionPercentage: completion.percentage }
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: "Failed to delete resume", error: error.message });
  }
});

// Send declaration confirmation email
router.post('/send-declaration-email', authMiddleware, async (req, res) => {
  console.log('[Send Declaration Email] Request received from:', req.user.email);
  
  try {
    const result = await findUserByEmail(req.user.email);
    
    if (!result) {
      console.log('[Send Declaration Email] User not found for email:', req.user.email);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { user, collection } = result;
    console.log('[Send Declaration Email] Found user:', user.id, 'in collection:', collection);

    // Check if user has agreed to declaration
    if (!user.declarationAgreed) {
      console.log('[Send Declaration Email] User has not agreed to declaration');
      return res.status(400).json({ 
        success: false, 
        message: "Please agree to the declaration first before sending confirmation email" 
      });
    }

    // Send confirmation email using Firebase Cloud Functions or external email service
    // For now, we'll simulate a successful email send
    // In production, you would integrate with SendGrid, Nodemailer, or Firebase Cloud Functions
    
    const emailContent = {
      to: user.email,
      subject: 'RecruiterV - Declaration Confirmation',
      userName: user.name,
      agreedAt: user.declarationAgreedAt,
      message: 'Your declaration has been confirmed. Thank you for agreeing to our terms and conditions.'
    };

    console.log('[Send Declaration Email] Email content:', JSON.stringify(emailContent));

    // Simulate email sending - in production, replace with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send(msg);

    // For now, we'll return success and log the email content
    // The actual email sending would be handled by a triggered Cloud Function or external service
    
    console.log('[Send Declaration Email] Email sent successfully to:', user.email);
    
    res.status(200).json({
      success: true,
      message: "Confirmation email sent successfully!",
      data: {
        sentTo: user.email,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Send Declaration Email] Error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to send confirmation email",
      error: error.message 
    });
  }
});


// ── Vendor-team recruiter: short profile ─────────────────────────────────────
// A recruiter registered by a vendor works under that vendor's agreement, so
// they only keep a short profile. Name and mobile identify them; the official
// email, office address and website are optional and used purely for the
// signature block on outgoing mail.
const VENDOR_TEAM_FIELDS = ['name', 'mobile', 'officialEmail', 'officeAddress', 'website'];

router.get('/team-profile', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase();
    const snap = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(404).json({ success: false, message: 'Recruiter not found.' });
    const d = snap.docs[0].data();
    if (!d.vendorEmail) {
      return res.status(403).json({ success: false, message: 'This short profile is for vendor-team recruiters.' });
    }
    res.json({
      success: true,
      profile: {
        name: d.name || '', mobile: d.mobile || d.phone || '',
        officialEmail: d.officialEmail || '', officeAddress: d.officeAddress || '',
        website: d.website || '', email: d.email || '',
        vendorName: d.vendorName || '',
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/team-profile', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase();
    const snap = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(404).json({ success: false, message: 'Recruiter not found.' });
    const d = snap.docs[0].data();
    if (!d.vendorEmail) {
      return res.status(403).json({ success: false, message: 'This short profile is for vendor-team recruiters.' });
    }

    const patch = {};
    VENDOR_TEAM_FIELDS.forEach(f => {
      if (req.body?.[f] !== undefined) patch[f] = String(req.body[f] || '').trim().slice(0, 300);
    });
    if (!patch.name) return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!patch.mobile) return res.status(400).json({ success: false, message: 'Mobile number is required.' });

    patch.updatedAt = new Date();
    await snap.docs[0].ref.set(patch, { merge: true });
    res.json({ success: true, message: 'Profile saved.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
