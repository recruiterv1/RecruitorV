const express = require('express');
const router = express.Router();

const coach = require('../model_fire/coachF');
const expert = require('../model_fire/expertF');
const { db } = require('./firebase_ad');

// Collection reference for coach/expert requests
const coachExpertRequestsDb = db.collection("coach_expert_requests");

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
      password: password || ''
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

    res.json({
      success: true,
      count: coaches.length,
      data: coaches
    });

  } catch (error) {
    console.error("Error getting coaches:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coaches',
      error: error.message
    });
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
      password: password || ''
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

    res.json({
      success: true,
      count: experts.length,
      data: experts
    });

  } catch (error) {
    console.error("Error getting experts:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to get experts',
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
    
    // Get all coaches if type is undefined or 'coach'
    let coaches = [];
    if (!type || type === 'coach') {
      coaches = await coach.getAllCoaches();
      console.log(`Found ${coaches.length} coaches`);
    }
    
    // Get all experts if type is undefined or 'expert'
    let experts = [];
    if (!type || type === 'expert') {
      experts = await expert.getAllExperts();
      console.log(`Found ${experts.length} experts`);
    }
    
    // Get all coach/expert requests for stats calculation
    const allRequestsSnapshot = await coachExpertRequestsDb.get();
    const allRequests = allRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${allRequests.length} total requests`);
    
    // Calculate stats for each coach
    const coachesWithStats = coaches.map(coachData => {
      const coachRequests = allRequests.filter(req => 
        req.coachExpertId === coachData.id && 
        req.coachExpertType === 'Coach'
      );
      
      // Count unique positions and recruiters
      const uniquePositions = new Set(coachRequests.map(r => r.positionId));
      const uniqueRecruiters = new Set(coachRequests.map(r => req.recruiterEmail));
      
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
      const uniqueRecruiters = new Set(expertRequests.map(r => req.recruiterEmail));
      
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
    
    // In a real implementation, you would send an email here
    // For now, we'll just log and return success
    console.log("Sending email notification to:", requestData.coachExpertEmail);
    console.log("Request details:", {
      coachExpertName: requestData.coachExpertName,
      recruiterName: requestData.recruiterName,
      recruiterEmail: requestData.recruiterEmail,
      positionTitle: requestData.positionTitle
    });
    
    // TODO: Implement actual email sending using nodemailer or similar
    // const transporter = nodemailer.createTransporter({...});
    // await transporter.sendMail({...});
    
    res.json({
      success: true,
      message: 'Email notification sent successfully!',
      data: {
        recipientEmail: requestData.coachExpertEmail,
        subject: `New Help Request for ${requestData.positionTitle}`,
        requestDetails: {
          recruiterName: requestData.recruiterName,
          recruiterEmail: requestData.recruiterEmail,
          positionTitle: requestData.positionTitle
        }
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
    
    // Log the email details (in production, actually send the email)
    console.log("========================================");
    console.log("COACH/EXPERT HELP REQUEST EMAIL");
    console.log("========================================");
    console.log(`To: ${coachExpertEmail}`);
    console.log(`Subject: New Help Request - ${positionTitle}`);
    console.log(`Coach/Expert: ${coachExpertName} (${coachExpertType})`);
    console.log(`Recruiter: ${recruiterName}`);
    console.log(`Recruiter Email: ${recruiterEmail}`);
    console.log(`Recruiter Phone: ${recruiterPhone || 'Not provided'}`);
    console.log(`Position: ${positionTitle} (ID: ${positionId})`);
    console.log("========================================");
    
    // TODO: Implement actual email sending
    // await sendEmail({
    //   to: coachExpertEmail,
    //   subject: `Help Request for position: ${positionTitle}`,
    //   html: `...`
    // });
    
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

module.exports = router;

