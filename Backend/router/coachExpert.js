const express = require('express');
const router = express.Router();

const coach = require('../model_fire/coachF');
const expert = require('../model_fire/expertF');
const { db } = require('./firebase_ad');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const { sendPushToEmails } = require('../utils/push');

// Collection reference for coach/expert requests
const coachExpertRequestsDb = db.collection("coach_expert_requests");
const positionsDb = db.collection("admin_AddPos");

// Specialization options
const specializations = [
  'Tech',
  'Banking',
  'Finance',
  'IT',
  'Database',
  'Testing',
  'Marketing',
  'HR',
  'Operations',
  'Sales',
  'Other'
];

// Helper function to calculate profile completion - matches Frontend Profile.jsx fields
const calculateProfileCompletion = (user) => {
  // Handle mobile -> phone mapping
  const phone = user.phone || user.mobile || '';
  
  // Map frontend field names to backend/user model field names
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
    // Skills no longer counted — field is being rebuilt by all users
    workExperience: { value: user.workExperience, weight: 20, type: 'array' },
    // Profile photo
    profilePhoto: { value: user.profilePhoto, weight: 10 },
  };

  let totalWeight = 0;
  let filledWeight = 0;

  for (const [field, config] of Object.entries(fields)) {
    totalWeight += config.weight;
    
    const isFilled = config.type === 'array' 
      ? (config.value && Array.isArray(config.value) && config.value.length > 0)
      : (config.value && config.value.toString().trim() !== '');
    
    if (isFilled) {
      filledWeight += config.weight;
    }
  }

  return Math.round((filledWeight / totalWeight) * 100);
};

// Simple auth middleware (matches profile.js)
function authMiddleware(req, res, next) {
  const token = req.cookies.__session;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized - No token found" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
}

// ==================== COACH ROUTES ====================

/**
 * POST /coach/add
 * Add a new coach
 */
router.post('/coach/add', async (req, res) => {
  try {
    const { name, email, phone, specialization, userType, password } = req.body;

    // Validation
    if (!name || !email || !specialization || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, specialization, and userType are required'
      });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters'
      });
    }

    // Validate specialization (allow comma-separated specializations)
    const coachSpecList = specialization.split(',').map(s => s.trim());
    const invalidCoachSpecs = coachSpecList.filter(spec => !specializations.includes(spec));
    if (invalidCoachSpecs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid specialization(s): ' + invalidCoachSpecs.join(', ') + '. Must be one of: ' + specializations.join(', ')
      });
    }

    // Validate userType
    if (!['paid', 'free'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType must be either "paid" or "free"'
      });
    }

    // Check if coach already exists
    const existingCoach = await coach.findCoachByEmail(email);
    if (existingCoach) {
      return res.status(400).json({
        success: false,
        message: 'Coach with this email already exists'
      });
    }

    // Create coach
    const coachData = {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      specialization,
      userType,
      password: password || '',
      availableToCreateTeam: true
    };

    const newCoach = await coach.createCoach(coachData);

    res.status(201).json({
      success: true,
      message: 'Coach added successfully!',
      data: newCoach
    });

  } catch (error) {
    console.error("Error adding coach:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add coach',
      error: error.message
    });
  }
});

/**
 * GET /coach/all
 * Get all coaches
 */
router.get('/coach/all', async (req, res) => {
  try {
    const { specialization, userType } = req.query;

    let coaches;
    if (specialization) {
      coaches = await coach.getCoachesBySpecialization(specialization);
    } else if (userType) {
      coaches = await coach.getCoachesByUserType(userType);
    } else {
      coaches = await coach.getAllCoaches();
    }

    // Fetch all requests once, then enrich each coach
    const allRequestsSnap = await coachExpertRequestsDb.get();
    const allRequests = allRequestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const enriched = coaches.map(coachData => {
      const reqs = allRequests.filter(r => r.coachExpertId === coachData.id && r.coachExpertType === 'Coach');
      const approved = reqs.filter(r => r.status === 'accepted').length;
      const pending  = reqs.filter(r => r.status === 'pending' || r.status === 'waitlist').length;
      const rejected = reqs.filter(r => r.status === 'rejected').length;

      let lastActiveMs = null;
      reqs.forEach(r => {
        const ts = r.createdAt;
        const ms = ts?._seconds ? ts._seconds * 1000
                 : ts?.seconds  ? ts.seconds * 1000
                 : ts?.toDate   ? ts.toDate().getTime()
                 : ts            ? new Date(ts).getTime() : null;
        if (ms && ms > (lastActiveMs || 0)) lastActiveMs = ms;
      });

      return {
        ...coachData,
        profileCompletion: calculateProfileCompletion(coachData),
        positionStats: { approved, pending, rejected, total: reqs.length },
        lastActiveDate: lastActiveMs ? new Date(lastActiveMs).toISOString() : null
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });

  } catch (error) {
    console.error("Error getting coaches:", error);
    res.status(500).json({ success: false, message: 'Failed to get coaches', error: error.message });
  }
});

/**
 * GET /coach/:id
 * Get coach by ID
 */
router.get('/coach/:id', async (req, res) => {
  try {
    const coachData = await coach.findCoachById(req.params.id);

    if (!coachData) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.json({
      success: true,
      data: coachData
    });

  } catch (error) {
    console.error("Error getting coach:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coach',
      error: error.message
    });
  }
});

/**
 * PATCH /coach/:id
 * Update coach by ID
 */
router.patch('/coach/:id', async (req, res) => {
  try {
    const { name, email, phone, specialization, userType } = req.body;

    // Validate specialization if provided
    if (specialization && !specializations.includes(specialization)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid specialization'
      });
    }

    // Validate userType if provided
    if (userType && !['paid', 'free'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType must be either "paid" or "free"'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (specialization) updateData.specialization = specialization;
    if (userType) updateData.userType = userType;

    const updatedCoach = await coach.updateCoach(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Coach updated successfully!',
      data: updatedCoach
    });

  } catch (error) {
    console.error("Error updating coach:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coach',
      error: error.message
    });
  }
});

/**
 * DELETE /coach/:id
 * Delete coach by ID
 */
router.delete('/coach/:id', async (req, res) => {
  try {
    await coach.deleteCoach(req.params.id);

    res.json({
      success: true,
      message: 'Coach deleted successfully!'
    });

  } catch (error) {
    console.error("Error deleting coach:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coach',
      error: error.message
    });
  }
});

// ==================== EXPERT ROUTES ====================

/**
 * POST /expert/add
 * Add a new expert
 */
router.post('/expert/add', async (req, res) => {
  try {
    const { name, email, phone, specialization, userType, password } = req.body;

    // Validation
    if (!name || !email || !specialization || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, specialization, and userType are required'
      });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters'
      });
    }

    // Validate specialization (allow comma-separated specializations)
    const expertSpecList = specialization.split(',').map(s => s.trim());
    const invalidExpertSpecs = expertSpecList.filter(spec => !specializations.includes(spec));
    if (invalidExpertSpecs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid specialization(s): ' + invalidExpertSpecs.join(', ') + '. Must be one of: ' + specializations.join(', ')
      });
    }

    // Validate userType
    if (!['paid', 'free'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType must be either "paid" or "free"'
      });
    }

    // Check if expert already exists
    const existingExpert = await expert.findExpertByEmail(email);
    if (existingExpert) {
      return res.status(400).json({
        success: false,
        message: 'Expert with this email already exists'
      });
    }

    // Create expert
    const expertData = {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      specialization,
      userType,
      password: password || '',
      availableToCreateTeam: true
    };

    const newExpert = await expert.createExpert(expertData);

    res.status(201).json({
      success: true,
      message: 'Expert added successfully!',
      data: newExpert
    });

  } catch (error) {
    console.error("Error adding expert:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expert',
      error: error.message
    });
  }
});

/**
 * GET /expert/all
 * Get all experts
 */
router.get('/expert/all', async (req, res) => {
  try {
    const { specialization, userType } = req.query;

    let experts;
    if (specialization) {
      experts = await expert.getExpertsBySpecialization(specialization);
    } else if (userType) {
      experts = await expert.getExpertsByUserType(userType);
    } else {
      experts = await expert.getAllExperts();
    }

    // Fetch all requests once, then enrich each expert
    const allRequestsSnap = await coachExpertRequestsDb.get();
    const allRequests = allRequestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const enriched = experts.map(expertData => {
      const reqs = allRequests.filter(r => r.coachExpertId === expertData.id && r.coachExpertType === 'Expert');
      const approved = reqs.filter(r => r.status === 'accepted').length;
      const pending  = reqs.filter(r => r.status === 'pending' || r.status === 'waitlist').length;
      const rejected = reqs.filter(r => r.status === 'rejected').length;

      let lastActiveMs = null;
      reqs.forEach(r => {
        const ts = r.createdAt;
        const ms = ts?._seconds ? ts._seconds * 1000
                 : ts?.seconds  ? ts.seconds * 1000
                 : ts?.toDate   ? ts.toDate().getTime()
                 : ts            ? new Date(ts).getTime() : null;
        if (ms && ms > (lastActiveMs || 0)) lastActiveMs = ms;
      });

      return {
        ...expertData,
        profileCompletion: calculateProfileCompletion(expertData),
        positionStats: { approved, pending, rejected, total: reqs.length },
        lastActiveDate: lastActiveMs ? new Date(lastActiveMs).toISOString() : null
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });

  } catch (error) {
    console.error("Error getting experts:", error);
    res.status(500).json({ success: false, message: 'Failed to get experts', error: error.message });
  }
});

/**
 * GET /expert/:id/admin
 * Get full expert profile for Admin/SuperAdmin modal view
 * Returns enriched data with profileCompletion and normalized phone
 */
router.get('/expert/:id/admin', async (req, res) => {
  try {
    const expertData = await expert.findExpertById(req.params.id);

    if (!expertData) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    // Normalize phone/mobile field and add profile completion
    const normalized = {
      ...expertData,
      phone: expertData.phone || expertData.mobile || '',
      profileCompletion: calculateProfileCompletion(expertData)
    };

    return res.json({
      success: true,
      data: normalized
    });
  } catch (error) {
    console.error("Error getting expert (admin):", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expert',
      error: error.message
    });
  }
});

/**
 * GET /expert/:id
 * Get expert by ID
 */
router.get('/expert/:id', async (req, res) => {
  try {
    const expertData = await expert.findExpertById(req.params.id);

    if (!expertData) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: expertData
    });

  } catch (error) {
    console.error("Error getting expert:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expert',
      error: error.message
    });
  }
});

/**
 * PATCH /expert/:id
 * Update expert by ID
 */
router.patch('/expert/:id', async (req, res) => {
  try {
    const { name, email, phone, specialization, userType } = req.body;

    // Validate specialization if provided
    if (specialization && !specializations.includes(specialization)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid specialization'
      });
    }

    // Validate userType if provided
    if (userType && !['paid', 'free'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType must be either "paid" or "free"'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (specialization) updateData.specialization = specialization;
    if (userType) updateData.userType = userType;

    const updatedExpert = await expert.updateExpert(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Expert updated successfully!',
      data: updatedExpert
    });

  } catch (error) {
    console.error("Error updating expert:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expert',
      error: error.message
    });
  }
});

/**
 * DELETE /expert/:id
 * Delete expert by ID
 */
router.delete('/expert/:id', async (req, res) => {
  try {
    await expert.deleteExpert(req.params.id);

    res.json({
      success: true,
      message: 'Expert deleted successfully!'
    });

  } catch (error) {
    console.error("Error deleting expert:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expert',
      error: error.message
    });
  }
});

// ==================== SHARED ROUTES ====================

/**
 * GET /specializations
 * Get all available specializations
 */
router.get('/specializations', (req, res) => {
  res.json({
    success: true,
    data: specializations
  });
});

/**
 * GET /stats/all
 * Get all coaches and experts with their request stats
 */
router.get('/stats/all', async (req, res) => {
  try {
    const { type } = req.query; // 'coach', 'expert', or undefined for both
    
    console.log(`[GET /stats/all] Fetching stats for type: ${type || 'all'}`);
    
    // Get all coaches if type is undefined or 'coach' — lean query (no resume/profilePhoto)
    let coaches = [];
    if (!type || type === 'coach') {
      const coachSnap = await db.collection('coach_db')
        .select('name','email','phone','mobile','specialization','userType','createdAt','location','country','bio','skills','yearsOfExperience','linkedin','website','twitter','currentCompany','currentTitle','workExperience','accountStatus','isActive','suspendedReason')
        .orderBy('createdAt', 'desc').get();
      coaches = coachSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`Found ${coaches.length} coaches`);
    }

    // Get all experts if type is undefined or 'expert' — lean query (no resume/profilePhoto)
    let experts = [];
    if (!type || type === 'expert') {
      const expertSnap = await db.collection('expert_db')
        .select('name','email','phone','mobile','specialization','userType','createdAt','location','country','bio','skills','yearsOfExperience','linkedin','website','twitter','currentCompany','currentTitle','workExperience','accountStatus','isActive','suspendedReason')
        .orderBy('createdAt', 'desc').get();
      experts = expertSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`Found ${experts.length} experts`);
    }
    
    // Get all coach/expert requests for stats calculation
    const allRequestsSnapshot = await coachExpertRequestsDb.get();
    const allRequests = allRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${allRequests.length} total requests`);
    
    // Build position map for client lookup
    const positionIds = [...new Set(allRequests.map(r => r.positionId).filter(Boolean))];
    const positionsMap = {};
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const posSnap = await positionsDb.where("pos_id", "in", batch).get();
      posSnap.docs.forEach(doc => {
        const d = doc.data();
        positionsMap[d.pos_id] = {
          positionName: d.position || 'N/A',
          client: d.client || 'N/A'
        };
      });
    }
    
    // Calculate stats for each coach
    const coachesWithStats = coaches.map(coachData => {
      const coachRequests = allRequests.filter(req => 
        req.coachExpertId === coachData.id && 
        req.coachExpertType === 'Coach'
      );
      
      // Count unique positions and recruiters
      const uniquePositions = new Set(coachRequests.map(r => r.positionId));
      const uniqueRecruiters = new Set(coachRequests.map(r => r.recruiterEmail));
      
      // Count by status
      const statusCounts = {
        pending: coachRequests.filter(r => r.status === 'pending').length,
        accepted: coachRequests.filter(r => r.status === 'accepted').length,
        rejected: coachRequests.filter(r => r.status === 'rejected').length,
        waitlist: coachRequests.filter(r => r.status === 'waitlist').length
      };
      
      // Get position-wise details
      const positionDetails = coachRequests.map(req => ({
        positionId: req.positionId,
        positionTitle: req.positionTitle || 'N/A',
        recruiterName: req.recruiterName || 'N/A',
        recruiterEmail: req.recruiterEmail || 'N/A',
        recruiterPhone: req.recruiterPhone || 'N/A',
        client: positionsMap[req.positionId]?.client || 'N/A',
        status: req.status,
        date: req.createdAt ? (req.createdAt.toDate ? req.createdAt.toDate().toLocaleDateString('en-GB') : new Date(req.createdAt).toLocaleDateString('en-GB')) : 'N/A'
      }));
      
      return {
        ...coachData,
        type: 'Coach',
        positionCount: uniquePositions.size,
        recruiterCount: uniqueRecruiters.size,
        totalRequests: coachRequests.length,
        statusCounts,
        positionDetails
      };
    });
    
    // Calculate stats for each expert
    const expertsWithStats = experts.map(expertData => {
      const expertRequests = allRequests.filter(req => 
        req.coachExpertId === expertData.id && 
        req.coachExpertType === 'Expert'
      );
      
      // Count unique positions and recruiters
      const uniquePositions = new Set(expertRequests.map(r => r.positionId));
      const uniqueRecruiters = new Set(expertRequests.map(r => r.recruiterEmail));
      
      // Count by status
      const statusCounts = {
        pending: expertRequests.filter(r => r.status === 'pending').length,
        accepted: expertRequests.filter(r => r.status === 'accepted').length,
        rejected: expertRequests.filter(r => r.status === 'rejected').length,
        waitlist: expertRequests.filter(r => r.status === 'waitlist').length
      };
      
      // Get position-wise details
      const positionDetails = expertRequests.map(req => ({
        positionId: req.positionId,
        positionTitle: req.positionTitle || 'N/A',
        recruiterName: req.recruiterName || 'N/A',
        recruiterEmail: req.recruiterEmail || 'N/A',
        recruiterPhone: req.recruiterPhone || 'N/A',
        client: positionsMap[req.positionId]?.client || 'N/A',
        status: req.status,
        date: req.createdAt ? (req.createdAt.toDate ? req.createdAt.toDate().toLocaleDateString('en-GB') : new Date(req.createdAt).toLocaleDateString('en-GB')) : 'N/A'
      }));
      
      return {
        ...expertData,
        type: 'Expert',
        positionCount: uniquePositions.size,
        recruiterCount: uniqueRecruiters.size,
        totalRequests: expertRequests.length,
        statusCounts,
        positionDetails
      };
    });
    
    // Combine results
    const allWithStats = [...coachesWithStats, ...expertsWithStats];
    
    // Calculate overall summary
    const summary = {
      totalCoaches: coaches.length,
      totalExperts: experts.length,
      totalCoachRequests: coachesWithStats.reduce((sum, c) => sum + c.totalRequests, 0),
      totalExpertRequests: expertsWithStats.reduce((sum, e) => sum + e.totalRequests, 0),
      acceptedCoaches: coachesWithStats.filter(c => c.statusCounts.accepted > 0).length,
      acceptedExperts: expertsWithStats.filter(e => e.statusCounts.accepted > 0).length,
      pendingCoaches: coachesWithStats.filter(c => c.statusCounts.pending > 0).length,
      pendingExperts: expertsWithStats.filter(e => e.statusCounts.pending > 0).length,
      waitlistCoaches: coachesWithStats.filter(c => c.statusCounts.waitlist > 0).length,
      waitlistExperts: expertsWithStats.filter(e => e.statusCounts.waitlist > 0).length
    };
    
    res.json({
      success: true,
      summary,
      coaches: coachesWithStats,
      experts: expertsWithStats,
      all: allWithStats,
      count: allWithStats.length
    });
    
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

// ==================== COACH/EXPERT REQUEST ROUTES ====================

/**
 * GET /requests/all
 * Get all coach/expert requests (SuperAdmin view)
 */
router.get('/requests/all', async (req, res) => {
  try {
    // Get all requests
    const allReqSnap = await coachExpertRequestsDb.orderBy('createdAt', 'desc').get();
    let requests = allReqSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Collect unique position IDs
    const posIds = [...new Set(requests.map(r => r.positionId).filter(Boolean))];
    
    // Fetch positions map
    const positionMap = {};
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
      const posSnap = await positionsDb.where('pos_id', 'in', batch).get();
      posSnap.docs.forEach(doc => {
        const d = doc.data();
        positionMap[d.pos_id] = {
          positionTitle: d.position || 'N/A',
          client: d.client || 'N/A'
        };
      });
    }
    
    // Enrich missing coach/expert phone numbers
    const phoneMap = {};
    for (const r of requests) {
      try {
        if ((!r.coachExpertPhone || String(r.coachExpertPhone).trim() === '') && r.coachExpertId) {
          if (r.coachExpertType === 'Coach' && !phoneMap[r.coachExpertId]) {
            const coachDoc = await coach.findCoachById(r.coachExpertId);
            if (coachDoc && coachDoc.phone) phoneMap[r.coachExpertId] = coachDoc.phone;
          }
          if (r.coachExpertType === 'Expert' && !phoneMap[r.coachExpertId]) {
            const expertDoc = await expert.findExpertById(r.coachExpertId);
            if (expertDoc && expertDoc.phone) phoneMap[r.coachExpertId] = expertDoc.phone;
          }
        }
      } catch (_) {}
    }
    
    // Build response items
    const items = requests.map(r => ({
      id: r.id,
      positionId: r.positionId,
      positionTitle: positionMap[r.positionId]?.positionTitle || r.positionTitle || 'N/A',
      client: positionMap[r.positionId]?.client || 'N/A',
      recruiterName: r.recruiterName || 'N/A',
      recruiterEmail: r.recruiterEmail || 'N/A',
      recruiterPhone: r.recruiterPhone || 'N/A',
      coachExpertType: r.coachExpertType || 'N/A',
      coachExpertName: r.coachExpertName || 'N/A',
      coachExpertEmail: r.coachExpertEmail || 'N/A',
      coachExpertPhone: (r.coachExpertPhone && String(r.coachExpertPhone).trim() !== '')
        ? r.coachExpertPhone
        : (r.coachExpertId ? phoneMap[r.coachExpertId] || 'N/A' : 'N/A'),
      status: r.status || 'pending',
      requestedAt: r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt ? new Date(r.createdAt) : null),
    }));
    
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("Error getting all coach/expert requests:", error);
    res.status(500).json({ success: false, message: 'Failed to get requests', error: error.message });
  }
});

/**
 * POST /request/create
 * Create a new "Get Help" request from recruiter to coach/expert
 */
router.post('/request/create', async (req, res) => {
  try {
    const {
      coachExpertId,
      coachExpertType, // 'coach' or 'expert'
      coachExpertName,
      coachExpertEmail,
      coachExpertPhone,
      recruiterId,
      recruiterName,
      recruiterEmail,
      recruiterPhone,
      positionId,
      positionTitle
    } = req.body;

    // Validation
    if (!coachExpertId || !coachExpertType || !recruiterEmail || !positionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if request already exists
    const existingRequest = await coachExpertRequestsDb
      .where("coachExpertId", "==", coachExpertId)
      .where("recruiterEmail", "==", recruiterEmail.toLowerCase())
      .where("positionId", "==", positionId)
      .get();

    if (!existingRequest.empty) {
      const existingData = existingRequest.docs[0].data();
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingData.status} request for this position`,
        existingStatus: existingData.status
      });
    }

    // Create the request
    const requestData = {
      coachExpertId,
      coachExpertType: coachExpertType.charAt(0).toUpperCase() + coachExpertType.slice(1), // Capitalize
      coachExpertName: coachExpertName || '',
      coachExpertEmail: coachExpertEmail?.toLowerCase() || '',
      coachExpertPhone: coachExpertPhone || '',
      recruiterId: recruiterId || '',
      recruiterName: recruiterName || '',
      recruiterEmail: recruiterEmail.toLowerCase(),
      recruiterPhone: recruiterPhone || '',
      positionId,
      positionTitle: positionTitle || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await coachExpertRequestsDb.add(requestData);

    res.status(201).json({
      success: true,
      message: 'Request sent successfully!',
      data: {
        id: docRef.id,
        ...requestData
      }
    });

  } catch (error) {
    console.error("Error creating coach/expert request:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request',
      error: error.message
    });
  }
});

/**
 * GET /requests
 * Get all requests for a coach or expert (based on their email)
 */
router.get('/requests', async (req, res) => {
  try {
    const { email, type } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`[GET /requests] Fetching requests for email: ${email}, type: ${type}`);
    let requests = [];
    let fallbackAttempted = false;

    // Build the base query
    let query = coachExpertRequestsDb.where("coachExpertEmail", "==", email.toLowerCase());
    
    // Add type filter if specified
    if (type === 'coach' || type === 'expert') {
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      query = query.where("coachExpertType", "==", capitalizedType);
    }
    
    // Try indexed query with ordering
    let snapshot;
    let useIndex = true;
    
    try {
      console.log(`[GET /requests] Attempting indexed query...`);
      snapshot = await query.orderBy("createdAt", "desc").get();
      console.log(`[GET /requests] Indexed query successful, found ${snapshot.docs.length} documents`);
    } catch (queryError) {
      // Check if this is an index error (error code 9)
      const errorCode = queryError.code || (queryError.message && queryError.message.includes('FAILED_PRECONDITION') ? 9 : null);
      
      console.warn(`[GET /requests] Query failed with code ${errorCode || 'unknown'}: ${queryError.message}`);
      
      if (errorCode === 9 || queryError.message.includes('requires an index')) {
        // This is an index error - use fallback
        console.log(`[GET /requests] Index error detected, using fallback...`);
        fallbackAttempted = true;
        useIndex = false;
      } else {
        // Some other error - rethrow
        throw queryError;
      }
    }
    
    if (useIndex) {
      // Use indexed query results
      requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else {
      // Use fallback - simple query without ordering
      try {
        const fallbackSnapshot = await coachExpertRequestsDb
          .where("coachExpertEmail", "==", email.toLowerCase())
          .get();
        
        let allRequests = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`[GET /requests] Fallback query found ${allRequests.length} documents`);
        
        // Filter by type in memory if needed
        if (type === 'coach' || type === 'expert') {
          const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
          requests = allRequests.filter(req => req.coachExpertType === capitalizedType);
          console.log(`[GET /requests] Filtered to ${requests.length} ${type} requests`);
        } else {
          requests = allRequests;
        }
        
        // Sort by createdAt in memory (newest first)
        requests.sort((a, b) => {
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return dateB - dateA;
        });
        console.log(`[GET /requests] Sorted ${requests.length} requests in memory`);
        
      } catch (fallbackError) {
        console.error(`[GET /requests] Fallback query failed: ${fallbackError.message}`);
        // Return empty array as last resort
        requests = [];
      }
    }

    res.json({
      success: true,
      count: requests.length,
      data: requests,
      ...(fallbackAttempted && { warning: "Using fallback query - composite indexes not yet deployed" })
    });

  } catch (error) {
    console.error("[GET /requests] Final error:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get requests',
      error: error.message
    });
  }
});

/**
 * GET /earnings
 * Get earnings for a coach or expert by email
 * Query: ?email=someone@example.com&type=coach|expert
 * Calculation: 1% of CTC Start for non-rejected requests on associated positions
 */
router.get('/earnings', async (req, res) => {
  try {
    const { email, type } = req.query;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailLower = String(email).trim().toLowerCase();
    const capitalizedType = type ? (type[0].toUpperCase() + type.slice(1).toLowerCase()) : null; // Coach/Expert

    // Fetch requests for this coach/expert
    let query = coachExpertRequestsDb.where("coachExpertEmail", "==", emailLower);
    if (capitalizedType === 'Coach' || capitalizedType === 'Expert') {
      query = query.where("coachExpertType", "==", capitalizedType);
    }
    const requestsSnap = await query.get();
    const allRequests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter non-rejected statuses (align with recruiter earnings semantics)
    const rejectedStatuses = ["Rejected", "Client Rejected", "Candidate Rejected"];
    const eligibleRequests = allRequests.filter(r => !rejectedStatuses.includes(r.status));

    if (eligibleRequests.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          earnings: [],
          totalEstimatedEarnings: 0,
          totalPositions: 0
        }
      });
    }

    // Collect unique position IDs
    const positionIds = [...new Set(eligibleRequests.map(r => r.positionId).filter(Boolean))];

    // Fetch positions in batches (limit 10 for 'in' queries)
    const positionsMap = {};
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const posSnap = await positionsDb.where("pos_id", "in", batch).get();
      posSnap.docs.forEach(doc => {
        const pos = doc.data();
        positionsMap[pos.pos_id] = {
          positionName: pos.position || 'N/A',
          client: pos.client || 'N/A',
          ctcStart: parseFloat(pos.ctcStart) || 0
        };
      });
    }

    // Build earnings with 1% of CTC
    const earnings = eligibleRequests.map(reqItem => {
      const pos = positionsMap[reqItem.positionId] || { positionName: 'Unknown', client: 'N/A', ctcStart: 0 };
      const ctcAmount = pos.ctcStart || 0;
      const commissionAmount = (ctcAmount * 1) / 100; // 1%
      return {
        requestId: reqItem.id,
        positionId: reqItem.positionId,
        positionName: pos.positionName,
        client: pos.client,
        ctcStart: ctcAmount,
        commissionPercent: 1,
        commissionAmount,
        status: reqItem.status
      };
    });

    const totalEstimatedEarnings = earnings.reduce((sum, e) => sum + (e.commissionAmount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        earnings,
        totalEstimatedEarnings,
        totalPositions: positionIds.length
      }
    });
  } catch (error) {
    console.error("Error getting coach/expert earnings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get earnings",
      error: error.message
    });
  }
});

/**
 * PUT /request/:id/status
 * Update request status (accept/reject/waitlist)
 */
router.put('/request/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'waitlist'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, accepted, rejected, or waitlist'
      });
    }

    const docRef = coachExpertRequestsDb.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const currentData = doc.data();

    // Enforce plan limits when accepting
    if (status === 'accepted') {
      const coachExpertId = currentData.coachExpertId;
      const coachExpertType = currentData.coachExpertType; // 'Coach' or 'Expert'

      // Determine plan limit based on userType in coach/expert collection
      let userDoc = null;
      let userType = 'free';
      if (coachExpertType === 'Coach') {
        userDoc = await coach.findCoachById(coachExpertId);
      } else if (coachExpertType === 'Expert') {
        userDoc = await expert.findExpertById(coachExpertId);
      }
      if (userDoc && (userDoc.userType === 'paid' || userDoc.userType === 'free')) {
        userType = userDoc.userType;
      }
      const limit = userType === 'paid' ? 10 : 5;

      // Count currently accepted requests for this coach/expert
      const acceptedSnap = await coachExpertRequestsDb
        .where("coachExpertId", "==", coachExpertId)
        .where("coachExpertType", "==", coachExpertType)
        .where("status", "==", "accepted")
        .get();

      // Exclude current doc if it is already accepted (avoids double-count on idempotent update)
      const acceptedCount = acceptedSnap.docs.filter(d => d.id !== id).length;

      if (acceptedCount >= limit) {
        return res.status(400).json({
          success: false,
          message: `Limit reached: ${coachExpertType} on ${userType} plan can accept up to ${limit} requests`
        });
      }
    }

    await docRef.update({
      status,
      updatedAt: new Date()
    });

    const updatedDoc = await docRef.get();

    res.json({
      success: true,
      message: 'Status updated successfully!',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });

  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

/**
 * GET /request/:id
 * Get a single request by ID
 */
router.get('/request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await coachExpertRequestsDb.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });

  } catch (error) {
    console.error("Error getting request:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get request',
      error: error.message
    });
  }
});

/**
 * GET /recruiter/coach-expert-requests
 * Get all requests made by a recruiter to coaches/experts
 */
router.get('/recruiter/coach-expert-requests', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter email is required'
      });
    }

    console.log(`[GET /recruiter/coach-expert-requests] Fetching requests for email: ${email}`);
    let requests = [];
    let fallbackAttempted = false;
    let useIndex = true;

    // Try indexed query with ordering
    try {
      console.log(`[GET /recruiter/coach-expert-requests] Attempting indexed query...`);
      const snapshot = await coachExpertRequestsDb
        .where("recruiterEmail", "==", email.toLowerCase())
        .orderBy("createdAt", "desc")
        .get();
      
      requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`[GET /recruiter/coach-expert-requests] Indexed query successful, found ${requests.length} documents`);
      
    } catch (queryError) {
      // Check if this is an index error (error code 9)
      const errorCode = queryError.code || (queryError.message && queryError.message.includes('FAILED_PRECONDITION') ? 9 : null);
      
      console.warn(`[GET /recruiter/coach-expert-requests] Query failed with code ${errorCode || 'unknown'}: ${queryError.message}`);
      
      if (errorCode === 9 || queryError.message.includes('requires an index')) {
        // This is an index error - use fallback
        console.log(`[GET /recruiter/coach-expert-requests] Index error detected, using fallback...`);
        fallbackAttempted = true;
        useIndex = false;
      } else {
        // Some other error - rethrow
        throw queryError;
      }
    }

    if (!useIndex) {
      // Use fallback - simple query without ordering
      try {
        const fallbackSnapshot = await coachExpertRequestsDb
          .where("recruiterEmail", "==", email.toLowerCase())
          .get();
        
        let allRequests = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`[GET /recruiter/coach-expert-requests] Fallback query found ${allRequests.length} documents`);
        
        // Sort by createdAt in memory (newest first)
        allRequests.sort((a, b) => {
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return dateB - dateA;
        });
        
        requests = allRequests;
        console.log(`[GET /recruiter/coach-expert-requests] Sorted ${requests.length} requests in memory`);
        
      } catch (fallbackError) {
        console.error(`[GET /recruiter/coach-expert-requests] Fallback query failed: ${fallbackError.message}`);
        // Return empty array as last resort
        requests = [];
      }
    }

    res.json({
      success: true,
      count: requests.length,
      data: requests,
      ...(fallbackAttempted && { warning: "Using fallback query - composite indexes not yet deployed" })
    });

  } catch (error) {
    console.error("[GET /recruiter/coach-expert-requests] Final error:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get requests',
      error: error.message
    });
  }
});

/**
 * GET /clientspoc/position-requests
 * Get coach/expert requests for positions created by the logged-in ClientSPOC
 */
router.get('/clientspoc/position-requests', async (req, res) => {
  try {
    const userEmail = ((req.query?.email || '')).toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find positions created by this ClientSPOC
    const posSnap = await positionsDb.where('clientspoc', '==', userEmail).get();
    const positions = posSnap.docs.map(doc => {
      const data = doc.data();
      return {
        pos_id: data.pos_id,
        positionTitle: data.position || 'N/A',
        client: data.client || 'N/A'
      };
    });

    if (positions.length === 0) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    // Collect requests for these positions in batches of 10 (Firestore 'in' limit)
    const posIds = positions.map(p => p.pos_id).filter(Boolean);
    const positionMap = {};
    positions.forEach(p => { positionMap[p.pos_id] = p; });

    let requests = [];
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
      const reqSnap = await coachExpertRequestsDb.where('positionId', 'in', batch).get();
      reqSnap.docs.forEach(doc => {
        const r = doc.data();
        const posInfo = positionMap[r.positionId] || {};
        requests.push({
          id: doc.id,
          positionId: r.positionId,
          positionTitle: posInfo.positionTitle || r.positionTitle || 'N/A',
          client: posInfo.client || 'N/A',
          coachExpertId: r.coachExpertId,
          coachExpertType: r.coachExpertType,
          coachExpertName: r.coachExpertName,
          coachExpertEmail: r.coachExpertEmail,
          coachExpertPhone: r.coachExpertPhone,
          recruiterName: r.recruiterName || '',
          recruiterEmail: r.recruiterEmail || '',
          recruiterPhone: r.recruiterPhone || '',
          status: r.status,
          requestedAt: r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt ? new Date(r.createdAt) : null)
        });
      });
    }

    // Enrich missing coach/expert phone numbers from their collections
    const missingEntries = requests.filter(r => !r.coachExpertPhone || String(r.coachExpertPhone).trim() === '');
    if (missingEntries.length > 0) {
      const phoneMap = {};
      // Fetch phones by ID where available
      for (const r of missingEntries) {
        try {
          if (r.coachExpertType === 'Coach' && r.coachExpertId && !phoneMap[r.coachExpertId]) {
            const coachDoc = await coach.findCoachById(r.coachExpertId);
            if (coachDoc && coachDoc.phone) {
              phoneMap[r.coachExpertId] = coachDoc.phone;
            }
          } else if (r.coachExpertType === 'Expert' && r.coachExpertId && !phoneMap[r.coachExpertId]) {
            const expertDoc = await expert.findExpertById(r.coachExpertId);
            if (expertDoc && expertDoc.phone) {
              phoneMap[r.coachExpertId] = expertDoc.phone;
            }
          }
        } catch (e) {
          // Silent fail for individual fetch errors
        }
      }
      // Apply enrichment
      requests = requests.map(reqItem => ({
        ...reqItem,
        coachExpertPhone: reqItem.coachExpertPhone && String(reqItem.coachExpertPhone).trim() !== ''
          ? reqItem.coachExpertPhone
          : (reqItem.coachExpertId ? phoneMap[reqItem.coachExpertId] || '' : '')
      }));
    }

    // Enrich missing recruiter fields (name/phone) from recruiter_db
    const recruiterMissing = requests.filter(r => !r.recruiterName || !r.recruiterPhone);
    if (recruiterMissing.length > 0) {
      const { findRecruiterByEmail } = require('../model_fire/recruiterF');
      const recruiterInfoMap = {};
      for (const r of recruiterMissing) {
        const email = (r.recruiterEmail || '').toLowerCase();
        if (!email || recruiterInfoMap[email]) continue;
        try {
          const rec = await findRecruiterByEmail(email);
          if (rec) {
            recruiterInfoMap[email] = {
              name: rec.name || rec.firstName || '',
              phone: rec.phone || rec.mobile || ''
            };
          }
        } catch {}
      }
      requests = requests.map(r => {
        const email = (r.recruiterEmail || '').toLowerCase();
        const info = recruiterInfoMap[email];
        return {
          ...r,
          recruiterName: r.recruiterName || (info ? info.name : ''),
          recruiterPhone: r.recruiterPhone || (info ? info.phone : '')
        };
      });
    }

    // Also include positions with no requests (optional)
    const positionsWithRequests = new Set(requests.map(r => r.positionId));
    positions.forEach(p => {
      if (!positionsWithRequests.has(p.pos_id)) {
        requests.push({
          id: null,
          positionId: p.pos_id,
          positionTitle: p.positionTitle,
          client: p.client,
          coachExpertId: null,
          coachExpertType: null,
          coachExpertName: null,
          coachExpertEmail: null,
          coachExpertPhone: null,
          status: 'No Request',
          requestedAt: null
        });
      }
    });

    // Sort by requestedAt desc, 'No Request' last
    requests.sort((a, b) => {
      if (!a.requestedAt && !b.requestedAt) return 0;
      if (!a.requestedAt) return 1;
      if (!b.requestedAt) return -1;
      return b.requestedAt - a.requestedAt;
    });

    return res.status(200).json({ success: true, data: requests, count: requests.length });
  } catch (error) {
    console.error("Error getting ClientSPOC position requests:", error);
    return res.status(500).json({ success: false, message: 'Failed to get position requests', error: error.message });
  }
});

/**
 * POST /request/:id/send-email
 * Send email notification to coach/expert about the request
 */
router.post('/request/:id/send-email', async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await coachExpertRequestsDb.doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    const requestData = doc.data();

    await sendEmail(
      requestData.coachExpertEmail,
      `New Help Request for ${requestData.positionTitle}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">New Help Request</h2>
        <p>Dear <strong>${requestData.coachExpertName || 'Coach/Expert'}</strong>,</p>
        <p>A recruiter has requested your assistance for the following position:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
          <div><strong>Position:</strong> ${requestData.positionTitle}</div>
          <div><strong>Recruiter:</strong> ${requestData.recruiterName}</div>
          <div><strong>Recruiter Email:</strong> ${requestData.recruiterEmail}</div>
        </div>
        <p>Please log in to RecruiterV to respond to this request.</p>
        <p style="color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} RecruiterV</p>
      </div>`,
      'admin@recruiterv.com', 'RecruiterV'
    );
    console.log("✅ Email sent to coach/expert:", requestData.coachExpertEmail);

    res.json({
      success: true,
      message: 'Email notification sent successfully!',
      data: {
        recipientEmail: requestData.coachExpertEmail,
        subject: `New Help Request for ${requestData.positionTitle}`
      }
    });
    
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * POST /send-help-email
 * Send email to coach/expert when recruiter clicks "Get Help" button
 */
router.post('/send-help-email', async (req, res) => {
  try {
    const {
      coachExpertEmail,
      coachExpertName,
      coachExpertType,
      recruiterName,
      recruiterEmail,
      recruiterPhone,
      positionId,
      positionTitle
    } = req.body;
    
    if (!coachExpertEmail || !recruiterEmail || !positionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    await sendEmail(
      coachExpertEmail,
      `New Help Request - ${positionTitle}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">New Help Request</h2>
        <p>Dear <strong>${coachExpertName || coachExpertType}</strong>,</p>
        <p>A recruiter needs your assistance. Here are the details:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
          <div><strong>Position:</strong> ${positionTitle}</div>
          <div><strong>Recruiter:</strong> ${recruiterName}</div>
          <div><strong>Recruiter Email:</strong> ${recruiterEmail}</div>
          ${recruiterPhone ? `<div><strong>Phone:</strong> ${recruiterPhone}</div>` : ''}
        </div>
        <p>Please log in to RecruiterV to respond to this request.</p>
        <p style="color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} RecruiterV</p>
      </div>`,
      'admin@recruiterv.com', 'RecruiterV'
    );
    console.log("✅ Help request email sent to:", coachExpertEmail);

    res.json({
      success: true,
      message: 'Help request email sent successfully!',
      data: {
        recipientEmail: coachExpertEmail,
        subject: `New Help Request for ${positionTitle}`,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error("Error sending help email:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to send help request email',
      error: error.message
    });
  }
});

/**
 * GET /get-by-name
 * Get coach or expert details by name (for "Get Help" functionality)
 */
router.get('/get-by-name', async (req, res) => {
  try {
    const { name, type } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    let result = null;
    let searchError = null;

    // Search in coaches if type is 'coach' or not specified
    if (!type || type === 'coach') {
      try {
        console.log(`Searching for coach with name: "${name}" in coach_db collection`);
        // Get all coaches and find by name - search in coach_db collection (correct collection)
        const coachesSnapshot = await db.collection("coach_db").where("name", "==", name).get();
        
        if (!coachesSnapshot.empty) {
          const coachDoc = coachesSnapshot.docs[0];
          console.log(`Found coach: ${coachDoc.data().name} (ID: ${coachDoc.id})`);
          result = {
            id: coachDoc.id,
            name: coachDoc.data().name,
            email: coachDoc.data().email,
            phone: coachDoc.data().phone || '',
            type: 'Coach'
          };
        } else {
          console.log(`No coach found with name: "${name}"`);
        }
      } catch (coachError) {
        console.error("Error searching coaches:", coachError.message);
        searchError = coachError;
      }
    }

    // If not found in coaches, search in experts
    if (!result && (!type || type === 'expert')) {
      try {
        console.log(`Searching for expert with name: "${name}" in expert_db collection`);
        // Search in expert_db collection (correct collection)
        const expertsSnapshot = await db.collection("expert_db").where("name", "==", name).get();
        
        if (!expertsSnapshot.empty) {
          const expertDoc = expertsSnapshot.docs[0];
          console.log(`Found expert: ${expertDoc.data().name} (ID: ${expertDoc.id})`);
          result = {
            id: expertDoc.id,
            name: expertDoc.data().name,
            email: expertDoc.data().email,
            phone: expertDoc.data().phone || '',
            type: 'Expert'
          };
        } else {
          console.log(`No expert found with name: "${name}"`);
        }
      } catch (expertError) {
        console.error("Error searching experts:", expertError.message);
        searchError = expertError;
      }
    }

    if (!result) {
      // Provide more helpful error message
      let suggestion = '';
      if (searchError) {
        suggestion = ` (Search error: ${searchError.message})`;
      } else {
        suggestion = '. Please check the spelling and try again.';
      }
      
      return res.status(404).json({
        success: false,
        message: `${type || 'Coach/Expert'} with name "${name}" not found${suggestion}`,
        searchedCollection: type ? (type === 'coach' ? 'coach_db' : 'expert_db') : 'coach_db and expert_db',
        searchedName: name
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error getting coach/expert by name:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coach/expert details',
      error: error.message
    });
  }
});

// ─── COACH → RECRUITER ASSIGNMENT FEATURE ────────────────────────────────────

// GET /api/coach-expert/recruiters/all — coach sees recruiters matching their skill categories
router.get('/recruiters/all', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;

    // Get coach's skill categories — try lowercase email and multiple field names
    const coachSnap = await db.collection('coach_db')
      .where('email', '==', coachEmail.toLowerCase())
      .limit(1).get();
    let coachCategories = [];
    if (!coachSnap.empty) {
      const coachData = coachSnap.docs[0].data();
      const val = coachData.skillCategory || coachData.skill_category || coachData.specialization;
      coachCategories = Array.isArray(val) ? val : (val ? [val] : []);
    }

    // Fetch recruiters and their approved position assignments in parallel
    const [recSnap, posSnap] = await Promise.all([
      db.collection('recruiter_db').get(),
      db.collection('position_access_requests').where('status', '==', 'approved').get(),
    ]);

    // Build a map: recruiterEmail → [{ positionId, positionTitle, client }]
    const positionsByEmail = {};
    posSnap.docs.forEach(d => {
      const data = d.data();
      const email = (data.recruiterEmail || '').toLowerCase();
      if (!email) return;
      if (!positionsByEmail[email]) positionsByEmail[email] = [];
      positionsByEmail[email].push({
        positionId: data.positionId || '',
        positionTitle: data.positionTitle || 'Untitled',
        client: data.client || '',
      });
    });

    const recruiters = recSnap.docs
      .map(d => {
        const data = d.data();
        const email = (data.email || '').toLowerCase();
        const positions = positionsByEmail[email] || [];
        return {
          id: d.id,
          isEmployee: !!data.isEmployee,
          accountStatus: data.accountStatus || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || data.mobile || data.mob || '',
          skillCategory: data.skillCategory || '',
          specialization: data.specialization || '',
          profileCompletion: data.profileCompletion || 0,
          isActive: data.isActive !== false,
          agreementSigned: data.agreementSigned || false,
          resume: data.resume || null,
          resumeUrl: data.resumeUrl || null,
          resumeFileName: data.resumeFileName || '',
          linkedin: data.linkedin || '',
          location: data.location || '',
          bio: data.bio || '',
          skills: data.skills || [],
          currentTitle: data.currentTitle || '',
          yearsOfExperience: data.yearsOfExperience || '',
          createdAt: data.createdAt || null,
          positionCount: positions.length,
          positions,
        };
      })
      .filter(r => {
        if (r.isEmployee) return false;                 // employees are not shown to coach/expert
        if (r.accountStatus === 'suspended' || r.isActive === false) return false; // hide suspended/inactive
        // If coach has no categories set, return ALL recruiters
        if (coachCategories.length === 0) return true;
        const rCats = Array.isArray(r.skillCategory)
          ? r.skillCategory
          : (r.skillCategory ? [r.skillCategory] : []);
        return rCats.some(c => coachCategories.includes(c));
      });

    return res.json({ success: true, recruiters, coachCategories });
  } catch (err) {
    console.error('coach get recruiters error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/matching-positions — positions matching coach's skill categories
router.get('/matching-positions', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;

    // Get coach's skill categories — try both case variants
    const coachSnap = await db.collection('coach_db')
      .where('email', '==', coachEmail.toLowerCase())
      .limit(1).get();
    let coachCategories = [];
    if (!coachSnap.empty) {
      const data = coachSnap.docs[0].data();
      const val = data.skillCategory || data.skill_category || data.specialization;
      coachCategories = Array.isArray(val) ? val : (val ? [val] : []);
    }

    const snap = await db.collection('admin_AddPos').get();
    const INACTIVE = ['paused', 'closed', 'on hold', 'hold', 'closed - filled', 'closed - cancelled'];

    const positions = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(pos => {
        const st = (pos.status || '').toLowerCase().trim();
        if (INACTIVE.some(s => st === s || st.includes(s))) return false;
        // If no categories set, return ALL active positions
        if (coachCategories.length === 0) return true;
        const posCat = (pos.skill_category || '').trim();
        return coachCategories.includes(posCat);
      })
      .map(pos => ({
        pos_id: pos.pos_id || pos.id,
        position: pos.position || '',
        client: pos.client || '',
        location: Array.isArray(pos.location) ? pos.location.join(', ') : (pos.location || ''),
        skill_category: pos.skill_category || '',
        status: pos.status || 'Active',
        experience: pos.experience || '',
      }));

    return res.json({ success: true, positions, coachCategories });
  } catch (err) {
    console.error('matching-positions error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coach-expert/recruiter-assignment — coach assigns recruiter to a position
router.post('/recruiter-assignment', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const { recruiterId, positionId, note } = req.body;
    if (!recruiterId || !positionId) {
      return res.status(400).json({ success: false, message: 'recruiterId and positionId are required' });
    }
    const { FieldValue } = require('firebase-admin/firestore');

    // Get coach/expert info (the assigner may be either).
    let coachDoc = null;
    const coachSnap = await db.collection('coach_db').where('email', '==', coachEmail).limit(1).get();
    if (!coachSnap.empty) coachDoc = coachSnap.docs[0];
    if (!coachDoc) {
      const expSnap = await db.collection('expert_db').where('email', '==', coachEmail).limit(1).get();
      if (!expSnap.empty) coachDoc = expSnap.docs[0];
    }
    if (!coachDoc) return res.status(404).json({ success: false, message: 'Coach/Expert not found' });
    const coachData = coachDoc.data();

    // Get recruiter info
    const recDoc = await db.collection('recruiter_db').doc(recruiterId).get();
    if (!recDoc.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });
    const recData = recDoc.data();

    // Get position info
    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', positionId).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found' });
    const posData = posSnap.docs[0].data();

    // Duplicate check
    const dupSnap = await db.collection('coach_recruiter_assignments')
      .where('coachEmail', '==', coachEmail)
      .where('recruiterId', '==', recruiterId)
      .where('positionId', '==', positionId)
      .limit(1).get();
    if (!dupSnap.empty) {
      return res.status(409).json({ success: false, message: 'You have already assigned this recruiter to this position' });
    }

    const ref = await db.collection('coach_recruiter_assignments').add({
      coachId: coachDoc.id,
      coachName: coachData.name || '',
      coachEmail,
      recruiterId,
      recruiterName: recData.name || '',
      recruiterEmail: recData.email || '',
      positionId,
      positionTitle: posData.position || '',
      client: posData.client || '',
      note: note || '',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Internal chat message to the recruiter — only when the SuperAdmin has made
    // that template live.
    try {
      const { notify } = require('../utils/internalMessage');
      await notify('positionAssigned', {
        fromEmail: coachEmail,
        toEmail: recData.email,
        vars: {
          recruiterName: recData.name || 'there',
          assignerName: coachData.name || '',
          assignerRole: coachData.userType || 'Coach',
          positionName: posData.position || '',
          positionId,
          clientName: posData.client || '',
          location: Array.isArray(posData.location) ? posData.location.join(', ') : (posData.location || ''),
        },
        senderRole: (coachData.userType || 'coach').toLowerCase().replace(/\s/g, ''),
        recipientRole: 'recruiter',
      });
    } catch (_) { /* never block the assignment */ }

    // Email to recruiter
    try {
      const { sendEmailFull, templates, renderEmail } = require('../utils/email');
      const dashUrl = `${process.env.FRONTURL || 'https://www.recruiterv.com'}/coach-assigned-positions`;
      const _title = posData.position || positionId;
      const _r = await renderEmail('positionDirectAssigned', {
        userName: recData.name || 'Recruiter', userType: 'Recruiter', positionTitle: _title,
        clientName: posData.client ? ` (${posData.client})` : '', dashboardUrl: dashUrl,
      }, {
        subject: `Position Assigned by Coach: ${_title}`,
        htmlContent: templates.positionDirectAssigned(_title, 'Recruiter', recData.name || 'Recruiter', dashUrl, posData.client || ''),
      });
      await sendEmailFull({
        to: recData.email,
        toName: recData.name || 'Recruiter',
        subject: _r.subject,
        htmlContent: _r.htmlContent,
      });
    } catch (emailErr) {
      console.error('Assignment email error:', emailErr.message);
    }

    // 🔔 Push to the assigned recruiter
    sendPushToEmails([recData.email], {
      title: 'New position assigned to you',
      body: `${coachData.name || 'A coach'} assigned you "${posData.position || positionId}"${posData.client ? ` · ${posData.client}` : ''}`,
      data: { type: 'assignment', posId: positionId },
    }).catch(() => {});

    return res.json({ success: true, id: ref.id, message: 'Recruiter assigned and notified by email' });
  } catch (err) {
    console.error('recruiter-assignment error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/my-recruiter-assignments — coach sees all their assignments + status
router.get('/my-recruiter-assignments', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const snap = await db.collection('coach_recruiter_assignments')
      .where('coachEmail', '==', coachEmail)
      .get();
    const assignments = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, assignments });
  } catch (err) {
    console.error('my-recruiter-assignments error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/recruiter-stats — coach/expert sees, per recruiter, the
// candidates submitted against the positions they assigned to that recruiter.
router.get('/recruiter-stats', authMiddleware, async (req, res) => {
  try {
    const assignerEmail = (req.user.email || '').toLowerCase();

    // 1. Positions this coach/expert assigned to recruiters
    const assignSnap = await db.collection('coach_recruiter_assignments')
      .where('coachEmail', '==', req.user.email)
      .get();
    const assignments = assignSnap.docs.map(d => d.data());
    // Also try lowercase match in case of casing differences
    if (assignments.length === 0 && req.user.email !== assignerEmail) {
      const altSnap = await db.collection('coach_recruiter_assignments')
        .where('coachEmail', '==', assignerEmail)
        .get();
      altSnap.docs.forEach(d => assignments.push(d.data()));
    }

    if (assignments.length === 0) {
      return res.json({ success: true, recruiters: [], totalCandidates: 0 });
    }

    // Build a lookup of (recruiterEmail|positionId) -> assignment meta
    const pairKey = (rEmail, pId) => `${(rEmail || '').toLowerCase()}|${pId}`;
    const pairMeta = {};
    const posIds = new Set();
    assignments.forEach(a => {
      if (!a.positionId) return;
      pairMeta[pairKey(a.recruiterEmail, a.positionId)] = a;
      posIds.add(a.positionId);
    });

    // 2. Position titles (for any assignment missing positionTitle)
    const posMap = {};
    const posIdArr = [...posIds];
    for (let i = 0; i < posIdArr.length; i += 10) {
      const batch = posIdArr.slice(i, i + 10);
      if (!batch.length) continue;
      const snap = await db.collection('admin_AddPos').where('pos_id', 'in', batch).get();
      snap.docs.forEach(d => { const p = d.data(); if (p.pos_id) posMap[p.pos_id] = p; });
    }

    // 3. Candidates for the assigned positions, then keep only those submitted by
    //    the recruiter that the coach assigned to that position.
    const fmt = (v) => {
      if (!v) return '';
      const d = v._seconds ? new Date(v._seconds * 1000) : (v.toDate ? v.toDate() : new Date(v));
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const byRecruiter = {}; // recruiterEmail -> { recruiterName, recruiterEmail, candidates: [] }
    let totalCandidates = 0;

    const candDb = db.collection('candidate_db');
    for (let i = 0; i < posIdArr.length; i += 10) {
      const batch = posIdArr.slice(i, i + 10);
      if (!batch.length) continue;
      const snap = await candDb.where('pos_id', 'in', batch).get();
      snap.docs.forEach(doc => {
        const c = doc.data();
        const meta = pairMeta[pairKey(c.recEmail, c.pos_id)];
        if (!meta) return; // candidate not from the recruiter the coach assigned to this position
        const recEmail = (c.recEmail || '').toLowerCase();
        if (!byRecruiter[recEmail]) {
          byRecruiter[recEmail] = {
            recruiterName: c.recName || meta.recruiterName || recEmail.split('@')[0],
            recruiterEmail: c.recEmail || meta.recruiterEmail || '',
            candidates: [],
          };
        }
        const pos = posMap[c.pos_id] || {};
        byRecruiter[recEmail].candidates.push({
          candidateId: doc.id,
          candidate: c.candidate || c.name || '',
          positionId: c.pos_id,
          positionTitle: pos.position || meta.positionTitle || '',
          client: pos.client || meta.client || c.client || '',
          status: c.statusa || 'Submitted',
          submittedOn: fmt(c.datePosted),
          statusUpdatedOn: fmt(c.statusChangedAt || c.statusaDate || c.updatedAt),
          cvUrl: c.cv_data || c.cv_url || '',
          // Extra details for the candidate modal
          email: c.emails || c.email || '',
          mobile: c.mob || c.mobile || '',
          relExp: c.rel_exp || '',
          totalExp: c.total_exp || '',
          currentCtc: c.current_ctc || '',
          expectedCtc: c.exp_ctc || '',
          currentLocation: c.curr_loc || '',
          preferredLocation: c.pref_loc || '',
          currentEmployer: c.curr_emp || '',
          noticePeriod: c.notice_period || '',
          offerInHand: c.offer_hand || '',
          highestEducation: c.highest_education || '',
          hrName: pos.hr_name || c.hr_name || '',
          matchPercent: (c.matchPercent === undefined || c.matchPercent === null) ? null : c.matchPercent,
          matchSummary: c.matchSummary || '',
          // Full candidate document for the "all details" modal (heavy/internal keys stripped)
          raw: (() => {
            const { cv_data, cv_url, ...rest } = c;
            return rest;
          })(),
        });
        totalCandidates++;
      });
    }

    const recruiters = Object.values(byRecruiter)
      .map(r => ({
        ...r,
        candidateCount: r.candidates.length,
        candidates: r.candidates.sort((a, b) => (a.positionTitle || '').localeCompare(b.positionTitle || '')),
      }))
      .sort((a, b) => b.candidateCount - a.candidateCount);

    return res.json({ success: true, recruiters, totalCandidates });
  } catch (err) {
    console.error('recruiter-stats error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/coach-assigned-positions — recruiter sees positions assigned to them by coaches
router.get('/coach-assigned-positions', authMiddleware, async (req, res) => {
  try {
    const recruiterEmail = req.user.email;
    const snap = await db.collection('coach_recruiter_assignments')
      .where('recruiterEmail', '==', recruiterEmail)
      .get();
    const assignments = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, assignments });
  } catch (err) {
    console.error('coach-assigned-positions error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/coach-expert/coach-assigned-positions/:id — recruiter accepts or rejects
router.patch('/coach-assigned-positions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be accepted or rejected' });
    }
    const { FieldValue } = require('firebase-admin/firestore');
    const docRef = db.collection('coach_recruiter_assignments').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (doc.data().recruiterEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await docRef.update({ status, updatedAt: FieldValue.serverTimestamp() });

    // 🔔 Push to the coach when the recruiter accepts their assignment
    if (status === 'accepted') {
      const a = doc.data();
      sendPushToEmails([a.coachEmail], {
        title: 'Assignment accepted',
        body: `${a.recruiterName || 'A recruiter'} accepted "${a.positionTitle || 'a position'}".`,
        data: { type: 'assignment-accepted', posId: a.positionId || '' },
      }).catch(() => {});
    }

    return res.json({ success: true, message: `Assignment ${status}` });
  } catch (err) {
    console.error('patch coach-assigned-positions error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── COACH VENDOR UPGRADE REQUESTS ─────────────────────────────────────────

// POST /api/coach-expert/vendor-upgrade-request
router.post('/vendor-upgrade-request', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const { FieldValue } = require('firebase-admin/firestore');
    const { sendEmailFull } = require('../utils/email');

    const coachSnap = await db.collection('coach_db').where('email', '==', coachEmail.toLowerCase()).limit(1).get();
    if (coachSnap.empty) return res.status(404).json({ success: false, message: 'Coach not found' });
    const coachDoc = coachSnap.docs[0];
    const coachData = coachDoc.data();

    // Prevent duplicate pending request
    const dupSnap = await db.collection('coach_vendor_requests')
      .where('coachEmail', '==', coachEmail)
      .where('status', '==', 'pending')
      .limit(1).get();
    if (!dupSnap.empty) return res.status(409).json({ success: false, message: 'You already have a pending vendor upgrade request' });

    await db.collection('coach_vendor_requests').add({
      coachId: coachDoc.id,
      coachName: coachData.name || '',
      coachEmail,
      coachPhone: coachData.phone || coachData.mobile || '',
      coachLocation: coachData.location || '',
      coachSkillCategory: coachData.skillCategory || coachData.skill_category || coachData.specialization || '',
      coachBio: coachData.bio || '',
      coachProfilePhoto: coachData.profilePhoto || '',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const adminEmails = [
      { email: 'roshan@freepathshala.org' },
      { email: 'ikumarmrigank@gmail.com' },
    ];
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;border-radius:12px;color:#fff;margin-bottom:20px">
          <h2 style="margin:0">New Vendor Upgrade Request</h2>
          <p style="margin:6px 0 0;opacity:.85">A coach has requested to become a vendor on RecruiterV</p>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:140px">Name</td><td style="padding:8px 0;font-weight:600;color:#111827">${coachData.name || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 0;color:#111827">${coachEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Phone</td><td style="padding:8px 0;color:#111827">${coachData.phone || coachData.mobile || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Location</td><td style="padding:8px 0;color:#111827">${coachData.location || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Skill Category</td><td style="padding:8px 0;color:#111827">${Array.isArray(coachData.skillCategory) ? coachData.skillCategory.join(', ') : (coachData.skillCategory || '—')}</td></tr>
          </table>
        </div>
        <div style="text-align:center">
          <a href="https://www.recruiterv.com/superadmin" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Review in Admin Panel</a>
        </div>
      </div>`;

    try {
      await sendEmailFull({ to: adminEmails, subject: `Vendor Upgrade Request — ${coachData.name || coachEmail}`, htmlContent: html });
    } catch (emailErr) {
      console.error('vendor-upgrade email error:', emailErr.message);
    }

    return res.json({ success: true, message: 'Request sent to administrators' });
  } catch (err) {
    console.error('vendor-upgrade-request error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/coach-vendor-requests — superadmin sees all vendor upgrade requests
router.get('/coach-vendor-requests', async (req, res) => {
  try {
    const snap = await db.collection('coach_vendor_requests').get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('coach-vendor-requests error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/coach-vendor-requests/:id — superadmin approves/rejects/waitlists
router.patch('/coach-vendor-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected', 'waitlist'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const { FieldValue } = require('firebase-admin/firestore');
    const docRef = db.collection('coach_vendor_requests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    await docRef.update({ status, updatedAt: FieldValue.serverTimestamp() });

    // Approving only flipped a flag before, so upgraded coaches never became real
    // vendors: they were missing from Vendor Management and every /vendor/*
    // endpoint (which resolves the caller out of admin_db) rejected them.
    // Create the vendor account here. Their coach_db record is left untouched —
    // /admin/authcheck refuses tokens carrying `portal: 'user'`, so signing in
    // through the coach portal still resolves them as a coach.
    if (status === 'approved') {
      try {
        const c = doc.data();
        const email = (c.coachEmail || '').toLowerCase().trim();
        if (email) {
          const existing = await db.collection('admin_db').where('email', '==', email).limit(1).get();
          const payload = {
            name: c.coachName || email.split('@')[0],
            email,
            phone: c.coachPhone || '',
            roleCategory: 'Vendor',
            role: 'Vendor',
            upgradedFromCoach: true,
            coachId: c.coachId || '',
            skillCategory: c.coachSkillCategory || [],
            accountStatus: 'approved',
          };
          if (existing.empty) {
            await db.collection('admin_db').add({
              ...payload, recruiterQuantity: 0, createdAt: FieldValue.serverTimestamp(),
            });
          } else {
            // Never downgrade an existing admin/SuperAdmin into a vendor.
            const cur = existing.docs[0].data();
            const curRole = (cur.roleCategory || cur.role || '').toLowerCase().replace(/\s/g, '');
            if (!curRole || curRole === 'vendor') {
              await existing.docs[0].ref.set(payload, { merge: true });
            }
          }
        }
      } catch (e) {
        console.error('coach->vendor upgrade: could not create vendor account:', e.message);
      }
    }

    return res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    console.error('patch coach-vendor-requests error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── COACH TEAM ────────────────────────────────────────────────────────────

// GET /api/coach-expert/team/eligible-recruiters
// Returns recruiters matching coach's skill categories, not vendor-associated, not already at team limit,
// active within last 72 hours, and profile completion > 50%
router.get('/team/eligible-recruiters', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    // scope=all → every joinable recruiter (non-employee) active in the last 72h,
    // any skill category. default → "Skill Fit": matching the coach's category.
    const isAll = String(req.query.scope || '').toLowerCase() === 'all';
    const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
    const now = Date.now();

    const toMs = (lastActive) => {
      if (!lastActive) return null;
      if (typeof lastActive._seconds === 'number') return lastActive._seconds * 1000;
      if (lastActive instanceof Date) return lastActive.getTime();
      if (typeof lastActive === 'string') return new Date(lastActive).getTime();
      return null;
    };

    // Get coach's skill categories (check both coach_db and expert_db)
    let coachCategories = [];
    const [coachSnap, expertSnap] = await Promise.all([
      db.collection('coach_db').where('email', '==', coachEmail.toLowerCase()).limit(1).get(),
      db.collection('expert_db').where('email', '==', coachEmail.toLowerCase()).limit(1).get(),
    ]);
    if (!coachSnap.empty) {
      const val = coachSnap.docs[0].data().skillCategory || coachSnap.docs[0].data().skill_category || coachSnap.docs[0].data().specialization;
      coachCategories = Array.isArray(val) ? val : (val ? [val] : []);
    } else if (!expertSnap.empty) {
      const val = expertSnap.docs[0].data().skillCategory || expertSnap.docs[0].data().skill_category || expertSnap.docs[0].data().specialization;
      coachCategories = Array.isArray(val) ? val : (val ? [val] : []);
    }

    // Get all approved team requests + all recruiters
    const [recSnap, teamSnap] = await Promise.all([
      db.collection('recruiter_db').get(),
      db.collection('coach_team_requests').where('status', '==', 'approved').get(),
    ]);

    // Count approved teams per recruiter — exclude those already at max 3
    const teamCount = {};
    teamSnap.docs.forEach(d => {
      const rid = d.data().recruiterId;
      if (rid) teamCount[rid] = (teamCount[rid] || 0) + 1;
    });

    const recruiters = recSnap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          _raw: data,
          _lastActiveMs: toMs(data.lastActive),
          teamsConnected: teamCount[d.id] || 0,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || data.mobile || '',
          skillCategory: data.skillCategory || '',
          specialization: data.specialization || '',
          location: data.location || '',
          bio: data.bio || '',
          skills: data.skills || [],
          currentTitle: data.currentTitle || '',
          yearsOfExperience: data.yearsOfExperience || '',
          linkedin: data.linkedin || '',
          profilePhoto: data.profilePhoto || '',
          workExperience: data.workExperience || [],
          education: data.education || [],
          resume: data.resume || null,
          resumeUrl: data.resumeUrl || null,
          resumeFileName: data.resumeFileName || '',
          vendorEmail: data.vendorEmail || null,
          lastActiveDate: toMs(data.lastActive) ? new Date(toMs(data.lastActive)).toISOString() : null,
        };
      })
      .filter(r => {
        // Functional join constraints apply to both tabs.
        if (r._raw.isEmployee) return false;                      // exclude employees from team building
        if (r._raw.accountStatus === 'suspended' || r._raw.isActive === false) return false; // hide suspended/inactive
        if (r.vendorEmail) return false;                          // exclude vendor-associated
        if ((teamCount[r.id] || 0) >= 3) return false;           // exclude recruiter already in 3 teams

        // "All" tab: every joinable recruiter with an active account, ANY skill
        // category. No last-login recency or profile gate — those over-filter and
        // hid genuinely active recruiters.
        if (isAll) return true;

        // Skill Fit: active within 72h + a matching skill category + a decent profile.
        if (!r._lastActiveMs || (now - r._lastActiveMs) > SEVENTY_TWO_HOURS_MS) return false;
        if (coachCategories.length === 0) return false;
        const rCats = Array.isArray(r.skillCategory) ? r.skillCategory : (r.skillCategory ? [r.skillCategory] : []);
        if (!rCats.some(c => coachCategories.includes(c))) return false;
        if (calculateProfileCompletion(r._raw) <= 50) return false;
        return true;
      })
      .map(({ _raw, _lastActiveMs, vendorEmail, ...rest }) => rest); // lastActiveDate is kept in rest

    return res.json({ success: true, recruiters, coachCategories });
  } catch (err) {
    console.error('team/eligible-recruiters error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/recruiter-profile/:recruiterId — full recruiter profile (incl. CV)
router.get('/recruiter-profile/:recruiterId', authMiddleware, async (req, res) => {
  try {
    const { recruiterId } = req.params;
    if (!recruiterId) return res.status(400).json({ success: false, message: 'recruiterId required' });

    let data = null;
    const docSnap = await db.collection('recruiter_db').doc(recruiterId).get();
    if (docSnap.exists) {
      data = docSnap.data();
    } else {
      // Fallback: treat the param as an email
      const emailSnap = await db.collection('recruiter_db').where('email', '==', recruiterId).limit(1).get();
      if (!emailSnap.empty) data = emailSnap.docs[0].data();
    }
    if (!data) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const profile = {
      id: docSnap.exists ? docSnap.id : recruiterId,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || data.mobile || '',
      skillCategory: data.skillCategory || '',
      specialization: data.specialization || '',
      location: data.location || '',
      bio: data.bio || '',
      skills: data.skills || [],
      currentTitle: data.currentTitle || '',
      yearsOfExperience: data.yearsOfExperience || '',
      linkedin: data.linkedin || '',
      profilePhoto: data.profilePhoto || '',
      workExperience: data.workExperience || [],
      education: data.education || [],
      resume: data.resume || null,
      resumeUrl: data.resumeUrl || null,
      resumeFileName: data.resumeFileName || '',
    };
    return res.json({ success: true, recruiter: profile });
  } catch (err) {
    console.error('recruiter-profile error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coach-expert/team/send-request — coach sends a team join request to a recruiter
router.post('/team/send-request', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const { recruiterId } = req.body;
    if (!recruiterId) return res.status(400).json({ success: false, message: 'recruiterId required' });
    const { FieldValue } = require('firebase-admin/firestore');

    const coachSnap = await db.collection('coach_db').where('email', '==', coachEmail.toLowerCase()).limit(1).get();
    if (coachSnap.empty) return res.status(404).json({ success: false, message: 'Coach not found' });
    const coachDoc = coachSnap.docs[0];
    const coachData = coachDoc.data();

    const recDoc = await db.collection('recruiter_db').doc(recruiterId).get();
    if (!recDoc.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });
    const recData = recDoc.data();

    // Check duplicate
    const dupSnap = await db.collection('coach_team_requests')
      .where('coachEmail', '==', coachEmail)
      .where('recruiterId', '==', recruiterId)
      .where('status', 'in', ['pending', 'approved'])
      .limit(1).get();
    if (!dupSnap.empty) {
      const existing = dupSnap.docs[0].data();
      return res.status(409).json({ success: false, message: existing.status === 'approved' ? 'Recruiter is already in your team' : 'Request already sent' });
    }

    // Check recruiter's team limit — max 3 approved teams across all coaches/experts
    const recTeamSnap = await db.collection('coach_team_requests')
      .where('recruiterId', '==', recruiterId)
      .where('status', '==', 'approved')
      .get();
    if (recTeamSnap.size >= 3) {
      return res.status(409).json({ success: false, message: 'This recruiter has already reached the maximum of 3 teams and cannot join another.' });
    }

    await db.collection('coach_team_requests').add({
      coachId: coachDoc.id,
      coachName: coachData.name || '',
      coachEmail,
      coachPhone: coachData.phone || coachData.mobile || '',
      coachSkillCategory: coachData.skillCategory || coachData.skill_category || coachData.specialization || '',
      coachBio: coachData.bio || '',
      coachLocation: coachData.location || '',
      coachProfilePhoto: coachData.profilePhoto || '',
      coachLinkedin: coachData.linkedin || '',
      coachYearsOfExperience: coachData.yearsOfExperience || '',
      coachCurrentTitle: coachData.currentTitle || '',
      coachSkills: coachData.skills || [],
      coachWorkExperience: coachData.workExperience || [],
      coachEducation: coachData.education || [],
      recruiterId,
      recruiterName: recData.name || '',
      recruiterEmail: recData.email || '',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Internal chat message — only when the SuperAdmin has made it live.
    try {
      const { notify } = require('../utils/internalMessage');
      await notify('teamJoinRequest', {
        fromEmail: coachEmail,
        toEmail: recData.email,
        vars: {
          recipientName: recData.name || 'there',
          senderName: coachData.name || '',
          senderRole: coachData.userType || 'Coach',
          direction: 'invited you to join their team',
        },
        senderRole: (coachData.userType || 'coach').toLowerCase().replace(/\s/g, ''),
        recipientRole: 'recruiter',
      });
    } catch (_) { /* never block the request */ }

    return res.json({ success: true, message: 'Request sent to recruiter' });
  } catch (err) {
    console.error('team/send-request error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/coach-expert/team/remove/:requestId — coach removes a recruiter (deletes the request doc)
router.delete('/team/remove/:requestId', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const docRef = db.collection('coach_team_requests').doc(req.params.requestId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.data().coachEmail !== coachEmail) return res.status(403).json({ success: false, message: 'Forbidden' });
    await docRef.delete();
    return res.json({ success: true });
  } catch (err) {
    console.error('team/remove error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/team/my-team — coach gets their approved team + all sent requests
router.get('/team/my-team', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const snap = await db.collection('coach_team_requests').where('coachEmail', '==', coachEmail).get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('team/my-team error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/team/join-requests — recruiter gets all team requests sent to them (enriched with coach profile)
router.get('/team/join-requests', authMiddleware, async (req, res) => {
  try {
    const recruiterEmail = req.user.email;
    const snap = await db.collection('coach_team_requests').where('recruiterEmail', '==', recruiterEmail).get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Only coach-initiated invitations (excludes recruiter-initiated join requests)
      .filter(d => d.initiatedBy !== 'recruiter')
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));

    // Enrich each request with full coach/expert profile
    const enriched = await Promise.all(requests.map(async r => {
      const coachEmail = r.coachEmail || '';
      if (!coachEmail) return r;
      // Try coach_db first, then expert_db
      let profileDoc = null;
      const coachSnap = await db.collection('coach_db').where('email', '==', coachEmail).limit(1).get();
      if (!coachSnap.empty) {
        profileDoc = coachSnap.docs[0].data();
      } else {
        const expertSnap = await db.collection('expert_db').where('email', '==', coachEmail).limit(1).get();
        if (!expertSnap.empty) profileDoc = expertSnap.docs[0].data();
      }
      if (!profileDoc) return r;
      return {
        ...r,
        coachName:            profileDoc.name            || r.coachName,
        coachProfilePhoto:    profileDoc.profilePhoto    || null,
        coachCurrentTitle:    profileDoc.currentTitle    || profileDoc.specialization || null,
        coachBio:             profileDoc.bio             || null,
        coachSkillCategory:   profileDoc.skillCategory   || null,
        coachSkills:          profileDoc.skills          || [],
        coachWorkExperience:  profileDoc.workExperience  || [],
        coachEducation:       profileDoc.education       || [],
        coachLinkedin:        profileDoc.linkedin        || null,
        coachPhone:           profileDoc.phone           || null,
        coachLocation:        profileDoc.location        || null,
        coachYearsOfExperience: profileDoc.yearsOfExperience || null,
      };
    }));

    return res.json({ success: true, requests: enriched });
  } catch (err) {
    console.error('team/join-requests error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/coach-expert/team/respond/:id — recruiter approves or rejects a team request
router.patch('/team/respond/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }
    const { FieldValue } = require('firebase-admin/firestore');
    const docRef = db.collection('coach_team_requests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.data().recruiterEmail !== req.user.email) return res.status(403).json({ success: false, message: 'Forbidden' });
    await docRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
    return res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    console.error('team/respond error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/coach-expert/team/leave/:requestId — recruiter leaves a coach-initiated team
router.delete('/team/leave/:requestId', authMiddleware, async (req, res) => {
  try {
    const recruiterEmail = req.user.email;
    const docRef = db.collection('coach_team_requests').doc(req.params.requestId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.data().recruiterEmail !== recruiterEmail) return res.status(403).json({ success: false, message: 'Forbidden' });
    await docRef.delete();
    return res.json({ success: true });
  } catch (err) {
    console.error('team/leave error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/team/my-team-members — approved team members for the
// assign-recruiter dropdown. Returns the FULL recruiter objects (resolved from
// recruiter_db, NOT filtered by skill category / employee flag) so every team
// member is selectable regardless of category.
router.get('/team/my-team-members', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email || '';
    // Case-tolerant match on coachEmail (requests may be stored in either case).
    const variants = [...new Set([coachEmail, coachEmail.toLowerCase(), coachEmail.trim()].filter(Boolean))];
    const reqs = {};
    for (const v of variants) {
      const snap = await db.collection('coach_team_requests')
        .where('coachEmail', '==', v)
        .where('status', '==', 'approved')
        .get();
      snap.docs.forEach(d => {
        const x = d.data();
        const key = (x.recruiterId || x.recruiterEmail || '').toString();
        if (key) reqs[key] = { recruiterId: x.recruiterId || '', recruiterEmail: x.recruiterEmail || '' };
      });
    }

    const memberIds = [];
    const recruiters = [];
    for (const e of Object.values(reqs)) {
      let rd = null;
      if (e.recruiterId) {
        const dd = await db.collection('recruiter_db').doc(e.recruiterId).get();
        if (dd.exists) rd = { id: dd.id, ...dd.data() };
      }
      if (!rd && e.recruiterEmail) {
        const q = await db.collection('recruiter_db').where('email', '==', e.recruiterEmail).limit(1).get();
        if (!q.empty) rd = { id: q.docs[0].id, ...q.docs[0].data() };
      }
      if (rd) {
        memberIds.push(rd.id);
        recruiters.push({
          id: rd.id,
          name: rd.name || '',
          email: rd.email || e.recruiterEmail || '',
          phone: rd.phone || rd.mobile || rd.mob || '',
          skillCategory: rd.skillCategory || '',
          specialization: rd.specialization || '',
          location: rd.location || '',
          isEmployee: !!rd.isEmployee,
        });
      } else if (e.recruiterId) {
        memberIds.push(e.recruiterId);
      }
    }

    return res.json({ success: true, memberIds, recruiters });
  } catch (err) {
    console.error('team/my-team-members error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── RECRUITER-INITIATED JOIN REQUESTS ───────────────────────────────────────

// GET /api/coach-expert/team/available-coaches
// Returns coaches + experts who:
//   • have availableToCreateTeam: true
//   • share a skill category with the recruiter
//   • logged in within the last 72 hours
//   • have profile completion > 50%
router.get('/team/available-coaches', authMiddleware, async (req, res) => {
  try {
    const recruiterEmail = req.user.email;
    // scope=all → every coach/expert of ANY skill category active in the last 48h.
    // default  → "Skill Fit": only those matching the recruiter's skill category.
    const isAll = String(req.query.scope || '').toLowerCase() === 'all';
    const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
    const now = Date.now();

    // Get recruiter's skill categories first
    const recSnap = await db.collection('recruiter_db').where('email', '==', recruiterEmail.toLowerCase()).limit(1).get();
    if (recSnap.empty) return res.json({ success: true, coaches: [], recruiterId: null });
    const recDoc = recSnap.docs[0];
    const recData = recDoc.data();
    const recCats = Array.isArray(recData.skillCategory)
      ? recData.skillCategory
      : recData.skillCategory ? [recData.skillCategory] : [];
    const recSkills = Array.isArray(recData.skills) ? recData.skills : [];
    const recSpecializedAt = Array.isArray(recData.specializedAt) ? recData.specializedAt : [];

    // Skill Fit needs a skill category; the "All" tab does not.
    if (!isAll && recCats.length === 0) {
      return res.json({ success: true, coaches: [], recruiterId: recDoc.id, hint: 'Set your skill category in your profile to see matching coaches.' });
    }

    // Fetch coaches + experts with availableToCreateTeam: true
    const [coachSnap, expertSnap] = await Promise.all([
      db.collection('coach_db').where('availableToCreateTeam', '==', true).get(),
      db.collection('expert_db').where('availableToCreateTeam', '==', true).get(),
    ]);

    const toMs = (lastActive) => {
      if (!lastActive) return null;
      if (typeof lastActive._seconds === 'number') return lastActive._seconds * 1000;
      if (lastActive instanceof Date) return lastActive.getTime();
      if (typeof lastActive === 'string') return new Date(lastActive).getTime();
      return null;
    };

    const mapDoc = (d, role) => {
      const data = d.data();
      return {
        id: d.id,
        role,
        _raw: data,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || data.mobile || '',
        skillCategory: data.skillCategory || '',
        location: data.location || '',
        bio: data.bio || '',
        skills: data.skills || [],
        specializedAt: data.specializedAt || [],
        currentTitle: data.currentTitle || '',
        yearsOfExperience: data.yearsOfExperience || '',
        linkedin: data.linkedin || '',
        profilePhoto: data.profilePhoto || '',
        workExperience: data.workExperience || [],
        education: data.education || [],
        resume: data.resume || null,
        resumeUrl: data.resumeUrl || null,
        resumeFileName: data.resumeFileName || '',
        lastActiveMs: toMs(data.lastActive),
        lastActiveDate: toMs(data.lastActive) ? new Date(toMs(data.lastActive)).toISOString() : null,
      };
    };

    const all = [
      ...coachSnap.docs.map(d => mapDoc(d, 'Coach')),
      ...expertSnap.docs.map(d => mapDoc(d, 'Expert')),
    ].filter(c => {
      // Suspended/inactive coaches & experts are hidden from recruiters.
      if (c._raw?.accountStatus === 'suspended' || c._raw?.isActive === false) return false;
      if (isAll) {
        // "All" tab: every coach/expert who is available to create a team (already
        // enforced by the query), ANY skill category — no last-login recency or
        // profile gate, which were hiding active coaches/experts.
        return true;
      }

      // 1. Must share at least one skill category with the recruiter
      const cCats = Array.isArray(c.skillCategory)
        ? c.skillCategory
        : c.skillCategory ? [c.skillCategory] : [];
      if (!cCats.some(cat => recCats.includes(cat))) return false;

      // 2. Must share at least one specialization (skills) with the recruiter
      if (recSkills.length > 0) {
        const cSkills = Array.isArray(c.skills) ? c.skills : [];
        if (!cSkills.some(s => recSkills.includes(s))) return false;
      }

      // 3. Must share at least one specializedAt with the recruiter
      if (recSpecializedAt.length > 0) {
        const cSpecAt = Array.isArray(c.specializedAt) ? c.specializedAt : [];
        if (!cSpecAt.some(s => recSpecializedAt.includes(s))) return false;
      }

      // 4. Must have logged in within the last 72 hours
      if (!c.lastActiveMs || (now - c.lastActiveMs) > SEVENTY_TWO_HOURS_MS) return false;

      // 5. Profile completion must be above 50%
      if (calculateProfileCompletion(c._raw) <= 50) return false;

      return true;
    });

    // Strip internal fields before sending to client
    const cleaned = all.map(({ _raw, lastActiveMs, ...rest }) => rest); // lastActiveDate is kept in rest

    // Mark already-requested coaches
    const sentSnap = await db.collection('coach_team_requests')
      .where('recruiterId', '==', recDoc.id)
      .where('initiatedBy', '==', 'recruiter')
      .where('status', 'in', ['pending', 'approved'])
      .get();
    const sentEmails = new Set(sentSnap.docs.map(d => d.data().coachEmail));

    const result = cleaned.map(c => ({ ...c, alreadyRequested: sentEmails.has(c.email) }));

    return res.json({ success: true, coaches: result, recruiterId: recDoc.id });
  } catch (err) {
    console.error('available-coaches error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coach-expert/team/recruiter-join-request
// Recruiter sends a request to join a coach/expert's team
router.post('/team/recruiter-join-request', authMiddleware, async (req, res) => {
  try {
    const { FieldValue } = require('firebase-admin/firestore');
    const recruiterEmail = req.user.email;
    const { coachId, coachEmail, coachRole } = req.body;
    if (!coachEmail) return res.status(400).json({ success: false, message: 'coachEmail required' });

    // Get recruiter details
    const recSnap = await db.collection('recruiter_db').where('email', '==', recruiterEmail.toLowerCase()).limit(1).get();
    if (recSnap.empty) return res.status(404).json({ success: false, message: 'Recruiter not found' });
    const recDoc = recSnap.docs[0];
    const recData = recDoc.data();

    // Get coach/expert details
    const collection = coachRole === 'Expert' ? 'expert_db' : 'coach_db';
    const cSnap = await db.collection(collection).where('email', '==', coachEmail.toLowerCase()).limit(1).get();
    if (cSnap.empty) return res.status(404).json({ success: false, message: 'Coach/Expert not found' });
    const cDoc = cSnap.docs[0];
    const cData = cDoc.data();

    // Duplicate check
    const dupSnap = await db.collection('coach_team_requests')
      .where('coachEmail', '==', coachEmail)
      .where('recruiterId', '==', recDoc.id)
      .where('initiatedBy', '==', 'recruiter')
      .where('status', 'in', ['pending', 'approved'])
      .limit(1).get();
    if (!dupSnap.empty) {
      const st = dupSnap.docs[0].data().status;
      return res.status(409).json({ success: false, message: st === 'approved' ? 'Already in this team' : 'Request already sent' });
    }

    // Team limit check for recruiter (max 3 teams)
    const recTeamSnap = await db.collection('coach_team_requests')
      .where('recruiterId', '==', recDoc.id)
      .where('status', '==', 'approved')
      .get();
    if (recTeamSnap.size >= 3) {
      return res.status(409).json({ success: false, message: 'You have already joined the maximum of 3 teams.' });
    }

    await db.collection('coach_team_requests').add({
      coachId: cDoc.id,
      coachName: cData.name || '',
      coachEmail: cData.email || coachEmail,
      coachRole: coachRole || 'Coach',
      coachPhone: cData.phone || cData.mobile || '',
      coachSkillCategory: cData.skillCategory || '',
      coachBio: cData.bio || '',
      coachLocation: cData.location || '',
      coachProfilePhoto: cData.profilePhoto || '',
      coachLinkedin: cData.linkedin || '',
      coachYearsOfExperience: cData.yearsOfExperience || '',
      coachCurrentTitle: cData.currentTitle || '',
      coachSkills: cData.skills || [],
      coachWorkExperience: cData.workExperience || [],
      coachEducation: cData.education || [],
      recruiterId: recDoc.id,
      recruiterName: recData.name || '',
      recruiterEmail: recData.email || '',
      status: 'pending',
      initiatedBy: 'recruiter',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Internal chat message the other way round — recruiter asking to join.
    try {
      const { notify } = require('../utils/internalMessage');
      await notify('teamJoinRequest', {
        fromEmail: recData.email,
        toEmail: cData.email || coachEmail,
        vars: {
          recipientName: cData.name || 'there',
          senderName: recData.name || '',
          senderRole: 'Recruiter',
          direction: 'has asked to join your team',
        },
        senderRole: 'recruiter',
        recipientRole: (coachRole || 'coach').toLowerCase().replace(/\s/g, ''),
      });
    } catch (_) { /* never block the request */ }

    return res.json({ success: true, message: 'Join request sent successfully' });
  } catch (err) {
    console.error('recruiter-join-request error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/team/recruiter-my-requests
// Recruiter gets all their self-initiated join requests
router.get('/team/recruiter-my-requests', authMiddleware, async (req, res) => {
  try {
    const recruiterEmail = req.user.email;
    const recSnap = await db.collection('recruiter_db').where('email', '==', recruiterEmail.toLowerCase()).limit(1).get();
    if (recSnap.empty) return res.json({ success: true, requests: [] });
    const recruiterId = recSnap.docs[0].id;
    const snap = await db.collection('coach_team_requests')
      .where('recruiterId', '==', recruiterId)
      .where('initiatedBy', '==', 'recruiter')
      .get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('recruiter-my-requests error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/team/incoming-join-requests
// Coach/Expert gets recruiter-initiated requests to join their team
router.get('/team/incoming-join-requests', authMiddleware, async (req, res) => {
  try {
    const coachEmail = req.user.email;
    const snap = await db.collection('coach_team_requests')
      .where('coachEmail', '==', coachEmail)
      .where('initiatedBy', '==', 'recruiter')
      .get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('incoming-join-requests error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/coach-expert/team/incoming-join-requests/:id
// Coach/Expert approves or rejects a recruiter-initiated join request
router.patch('/team/incoming-join-requests/:id', authMiddleware, async (req, res) => {
  try {
    const { FieldValue } = require('firebase-admin/firestore');
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }
    const docRef = db.collection('coach_team_requests').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.data().coachEmail !== req.user.email) return res.status(403).json({ success: false, message: 'Forbidden' });
    await docRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
    return res.json({ success: true });
  } catch (err) {
    console.error('incoming-join-requests patch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coach-expert/admin/migrate-available-to-create-team
// One-time migration: sets availableToCreateTeam: true on all coaches and experts that don't already have it set
router.post('/admin/migrate-available-to-create-team', authMiddleware, async (req, res) => {
  try {
    const [coachSnap, expertSnap] = await Promise.all([
      db.collection('coach_db').get(),
      db.collection('expert_db').get(),
    ]);

    const batch = db.batch();
    let count = 0;

    coachSnap.docs.forEach(doc => {
      if (doc.data().availableToCreateTeam !== true) {
        batch.update(doc.ref, { availableToCreateTeam: true });
        count++;
      }
    });
    expertSnap.docs.forEach(doc => {
      if (doc.data().availableToCreateTeam !== true) {
        batch.update(doc.ref, { availableToCreateTeam: true });
        count++;
      }
    });

    await batch.commit();
    return res.json({ success: true, updated: count });
  } catch (err) {
    console.error('migrate-available-to-create-team error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coach-expert/position-people — per-position list of recruiters and
// coach/experts associated with each position (for the Open Positions cards).
router.get('/position-people', authMiddleware, async (req, res) => {
  try {
    const lc = (s) => (s || '').toString().toLowerCase().trim();

    const recMap = {};   // pos_id -> Map(email -> { name, email, phone })
    const coachMap = {}; // pos_id -> Map(email -> { name, email, phone, type })
    const ensure = (m, pos) => (m[pos] = m[pos] || new Map());
    const addRec = (pos, email, name, phone) => {
      if (!pos || !email) return;
      const e = lc(email); const mp = ensure(recMap, pos);
      const cur = mp.get(e) || { email: e, name: '', phone: '' };
      if (name && !cur.name) cur.name = name;
      if (phone && !cur.phone) cur.phone = phone;
      mp.set(e, cur);
    };
    const addCoach = (pos, email, name, phone, type) => {
      if (!pos || !email) return;
      const e = lc(email); const mp = ensure(coachMap, pos);
      const cur = mp.get(e) || { email: e, name: '', phone: '', type: '' };
      if (name && !cur.name) cur.name = name;
      if (phone && !cur.phone) cur.phone = phone;
      if (type && !cur.type) cur.type = type;
      mp.set(e, cur);
    };

    const [cra, par, pas, ced] = await Promise.all([
      db.collection('coach_recruiter_assignments').get(),
      db.collection('position_access_requests').get(),
      db.collection('position_assignments').get(),
      db.collection('coach_expert_direct_requests').get(),
    ]);

    cra.forEach(d => {
      const a = d.data();
      const pos = a.pos_id || a.positionId;
      const st = lc(a.status);
      if (st === 'rejected' || st === 'released') return;
      addRec(pos, a.recruiterEmail, a.recruiterName, a.recruiterPhone);
      if (a.coachEmail) addCoach(pos, a.coachEmail, a.coachName, a.coachPhone, a.coachRole || 'Coach');
    });
    par.forEach(d => {
      const a = d.data();
      if (lc(a.status) !== 'approved') return;
      addRec(a.positionId || a.pos_id, a.recruiterEmail);
    });
    pas.forEach(d => {
      const a = d.data();
      if (a.assigned === false) return;
      addRec(a.pos_id || a.positionId, a.recruiterEmail, a.recruiterName, a.recruiterPhone);
    });
    ced.forEach(d => {
      const a = d.data();
      if (lc(a.status) !== 'approved') return;
      addCoach(a.positionId || a.pos_id, a.coachExpertEmail, a.coachExpertName, a.coachExpertPhone, a.coachExpertType);
    });

    // Resolve any missing names/phones from the profile collections
    const [recSnap, coachSnap, expSnap] = await Promise.all([
      db.collection('recruiter_db').get(),
      db.collection('coach_db').get(),
      db.collection('expert_db').get(),
    ]);
    const profByEmail = {};
    const idx = (snap, role) => snap.forEach(d => {
      const u = d.data(); const e = lc(u.email);
      if (e) profByEmail[e] = { name: u.name || '', phone: u.phone || u.mobile || '', role };
    });
    idx(recSnap, 'Recruiter'); idx(coachSnap, 'Coach'); idx(expSnap, 'Expert');

    const finalize = (mp, isCoach) => {
      const out = {};
      Object.keys(mp).forEach(pos => {
        out[pos] = [...mp[pos].values()].map(p => {
          const prof = profByEmail[p.email] || {};
          return {
            name: p.name || prof.name || p.email.split('@')[0],
            email: p.email,
            phone: p.phone || prof.phone || '',
            ...(isCoach ? { type: p.type || prof.role || 'Coach' } : {}),
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
      });
      return out;
    };

    const recruiters = finalize(recMap, false);
    const coaches = finalize(coachMap, true);

    const people = {};
    new Set([...Object.keys(recruiters), ...Object.keys(coaches)]).forEach(pos => {
      people[pos] = { recruiters: recruiters[pos] || [], coaches: coaches[pos] || [] };
    });

    res.json({ success: true, people });
  } catch (e) {
    console.error('position-people', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/coach-expert/position-access/:posId
// Does the signed-in coach/expert have access to submit candidates for this
// position? Access comes from EITHER collection:
//   • coach_expert_direct_requests — a direct request approved by the SPOC
//   • coach_expert_requests        — the coach/expert assigned it to themselves
// Checking only the first blocked every self-assigned coach from submitting.
router.get('/position-access/:posId', authMiddleware, async (req, res) => {
  try {
    const posId = String(req.params.posId);
    const emailLower = (req.user.email || '').toLowerCase();

    const [directSnap, assignSnap] = await Promise.all([
      db.collection('coach_expert_direct_requests')
        .where('coachExpertEmail', '==', emailLower)
        .where('positionId', '==', posId).get(),
      coachExpertRequestsDb
        .where('coachExpertEmail', '==', emailLower)
        .where('positionId', '==', posId).get(),
    ]);

    const viaDirect = directSnap.docs.some(d => d.data().status === 'approved');
    const viaAssign = assignSnap.docs.some(d => ['accepted', 'approved'].includes(d.data().status));

    return res.json({
      success: true,
      hasAccess: viaDirect || viaAssign,
      source: viaDirect ? 'direct_request' : (viaAssign ? 'self_assigned' : null),
    });
  } catch (err) {
    console.error('coach-expert position-access error:', err.message);
    return res.status(500).json({ success: false, hasAccess: false, message: err.message });
  }
});

// Position briefings moved to their own router (/api/briefing) and a single
// free-text briefing per position; see Backend/router/briefing.js.

// ─── Coach → Recruiter daily Follow-ups ───────────────────────────────────────
// A coach logs a daily follow-up (5-parameter rating + remarks) against a
// recruiter they assigned a position to. Allowed only for TODAY, and only while
// the pair is "open": position not paused, the recruiter hasn't yet submitted a
// candidate for it, and no candidate has joined on it. Stored in `coach_followups`.
const FOLLOWUP_PARAMS = [
  { key: 'sourcing',       label: 'Sourcing Effort' },
  { key: 'quality',        label: 'Candidate Quality' },
  { key: 'communication',  label: 'Communication' },
  { key: 'responsiveness', label: 'Responsiveness' },
  { key: 'adherence',      label: 'Process Adherence' },
];
const JOIN_STATUSES = new Set(['joined', 'offer accepted', 'onboarded']);
// Today's date in IST as YYYY-MM-DD.
const todayIST = () => {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

// Compute, for a coach's assignment pairs, which are still open for follow-up.
// Returns { openKeys:Set('posId|recEmail'), pausedPos:Set, joinedPos:Set, submittedPairs:Set }.
async function computeFollowupOpenState(coachEmail) {
  const aSnap = await db.collection('coach_recruiter_assignments').where('coachEmail', '==', coachEmail).get();
  const pairs = [];
  const seen = new Set();
  aSnap.docs.forEach(d => {
    const a = d.data();
    const pid = String(a.positionId || ''); const re = (a.recruiterEmail || '').toLowerCase();
    if (!pid || !re) return;
    const k = `${pid}|${re}`;
    if (seen.has(k)) return; seen.add(k);
    pairs.push({ key: k, positionId: pid, recruiterEmail: re, positionTitle: a.positionTitle || '', client: a.client || '', recruiterName: a.recruiterName || '' });
  });
  const posIds = [...new Set(pairs.map(p => p.positionId))];

  // Position status (paused/closed) + all candidates on these positions.
  const statusByPos = {}; const joinedPos = new Set(); const submittedPairs = new Set();
  for (let i = 0; i < posIds.length; i += 10) {
    const batch = posIds.slice(i, i + 10);
    if (!batch.length) continue;
    const [pSnap, cSnap] = await Promise.all([
      db.collection('admin_AddPos').where('pos_id', 'in', batch).get(),
      db.collection('candidate_db').where('pos_id', 'in', batch).get(),
    ]);
    pSnap.docs.forEach(d => { const p = d.data(); statusByPos[String(p.pos_id)] = (p.status || 'active').toLowerCase(); });
    cSnap.docs.forEach(d => {
      const c = d.data(); const pid = String(c.pos_id || ''); const st = (c.statusa || '').toLowerCase();
      if (JOIN_STATUSES.has(st)) joinedPos.add(pid);
      // any candidate the recruiter has submitted (not a rejection/drop) closes follow-up
      const re = (c.recEmail || '').toLowerCase();
      if (re && pid && !isRejectedStatus(c.statusa)) submittedPairs.add(`${pid}|${re}`);
    });
  }

  const openKeys = new Set();
  const open = [];
  pairs.forEach(p => {
    const status = statusByPos[p.positionId] || 'active';
    const paused = status === 'paused' || status === 'closed' || status === 'inactive';
    if (paused) return;
    if (joinedPos.has(p.positionId)) return;
    if (submittedPairs.has(p.key)) return;
    openKeys.add(p.key);
    open.push(p);
  });
  return { open, openKeys };
}

// Reuse the rejection-status test from the matcher util.
const { isRejectedStatus } = (() => {
  // Local mirror — the util doesn't export it; keep in sync with resumeBankMatch.
  const REJECTED_EXTRA = new Set(['client drop', 'candidate drop', 'duplicate', 'offer declined']);
  return { isRejectedStatus: (s) => { const x = (s || '').toString().toLowerCase().trim(); return x.includes('reject') || REJECTED_EXTRA.has(x); } };
})();

// GET /api/coach-expert/followups — the coach's follow-ups + today's eligible pairs.
router.get('/followups', authMiddleware, async (req, res) => {
  try {
    const emailLower = (req.user.email || '').toLowerCase();
    const [fSnap, state] = await Promise.all([
      db.collection('coach_followups').where('coachEmail', '==', emailLower).get(),
      computeFollowupOpenState(emailLower),
    ]);
    const followups = fSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    return res.json({ success: true, parameters: FOLLOWUP_PARAMS, today: todayIST(), eligible: state.open, followups });
  } catch (err) {
    console.error('followups get error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coach-expert/followups  { positionId, recruiterEmail, ratings{}, remarks }
router.post('/followups', authMiddleware, async (req, res) => {
  try {
    const emailLower = (req.user.email || '').toLowerCase();
    const positionId = String(req.body?.positionId || '');
    const recruiterEmail = (req.body?.recruiterEmail || '').toLowerCase();
    if (!positionId || !recruiterEmail) return res.status(400).json({ success: false, message: 'positionId and recruiterEmail are required' });

    // Must be an open pair the coach actually assigned.
    const state = await computeFollowupOpenState(emailLower);
    const pair = state.open.find(p => p.key === `${positionId}|${recruiterEmail}`);
    if (!pair) return res.status(400).json({ success: false, message: 'Follow-ups are closed for this position/recruiter (candidate submitted, joined, position paused, or not assigned by you).' });

    // Validate ratings (1–5 each; 0 = not rated).
    const ratings = {};
    FOLLOWUP_PARAMS.forEach(p => { const v = parseInt(req.body?.ratings?.[p.key], 10); ratings[p.key] = (v >= 1 && v <= 5) ? v : 0; });
    const remarks = String(req.body?.remarks || '').slice(0, 2000);
    const date = todayIST();

    // Coach info + upsert one follow-up per pair per day.
    let coachName = '';
    const cSnap = await db.collection('coach_db').where('email', '==', emailLower).limit(1).get();
    if (!cSnap.empty) coachName = cSnap.docs[0].data().name || '';
    else { const eSnap = await db.collection('expert_db').where('email', '==', emailLower).limit(1).get(); if (!eSnap.empty) coachName = eSnap.docs[0].data().name || ''; }

    const { FieldValue } = require('firebase-admin/firestore');
    const dupSnap = await db.collection('coach_followups')
      .where('coachEmail', '==', emailLower).where('positionId', '==', positionId)
      .where('recruiterEmail', '==', recruiterEmail).where('date', '==', date).limit(1).get();
    const payload = {
      coachEmail: emailLower, coachName,
      recruiterEmail, recruiterName: pair.recruiterName,
      positionId, positionTitle: pair.positionTitle, client: pair.client,
      date, ratings, remarks, updatedAt: FieldValue.serverTimestamp(),
    };
    if (!dupSnap.empty) {
      await dupSnap.docs[0].ref.set(payload, { merge: true });
    } else {
      await db.collection('coach_followups').add({ ...payload, createdAt: FieldValue.serverTimestamp() });
    }
    return res.json({ success: true, message: 'Follow-up saved' });
  } catch (err) {
    console.error('followups save error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
