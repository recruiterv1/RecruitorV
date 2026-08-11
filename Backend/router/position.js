const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ad_Pos= require('../model_fire/adminF')
const recruiter = require('../model_fire/recruiterF')
const adminModel = require('../model_fire/adminCF')
const clientspoc = require('../model_fire/clientspocF')
const candidateModel = require('../model_fire/candidateF')
const companyModel = require('../model_fire/companyF');
const { REJECTION_STATUSES } = require('../model_fire/adminF');
const { sendPushToAll } = require('../utils/push');

// Statuses excluded from "Active Candidates" count (rejected + on hold)
const ACTIVE_EXCLUDE_STATUSES = [
  ...REJECTION_STATUSES,
  'On Hold', 'Hold', 'Client Hold', 'Candidate Hold', 'on hold', 'hold',
];
const { db } = require('./firebase_ad');
const { resumeBankMatchCounts, getMatchingCandidates } = require('../utils/resumeBankMatch');
const notificationModel = require('../model_fire/notificationF');
const positionAccess = require('../model_fire/positionAccessF');
const { sendEmail } = require('../utils/email');
// Use db directly to get the positions collection
const positionsCollection = db.collection("admin_AddPos");

// Build a map of client name (lowercased) → commission from Company_Overview
const buildCommissionMap = async () => {
  try {
    const companies = await companyModel.getAllCompanies();
    const map = {};
    companies.forEach(c => {
      const val = Number(c.commisson) || 0;
      if (val === 0) return;
      if (c.lower) map[c.lower.trim()] = val;
      if (c.name)  map[c.name.toLowerCase().trim()] = val;
    });
    return map;
  } catch (_) {
    return {};
  }
};

// Apply current commission from company map to a positions array — only for
// legacy positions with no explicit commission_type, so a position's own
// chosen tier (fixed amount or percentage) is never overwritten.
const applyCommission = (positions, commMap) =>
  positions.map(pos => {
    if (pos.commission_type) return pos;
    const key = (pos.client || '').toLowerCase().trim();
    const val = key ? commMap[key] : undefined;
    return val ? { ...pos, commison: val } : pos;
  });

// Get candidate_db collection safely - get inside route handlers to avoid initialization issues
const getCandidateDb = () => {
  // First, try to use the imported db from firebase_ad.js
  if (db && typeof db.collection === 'function') {
    return db.collection("candidate_db");
  }
  
  // If db is undefined or doesn't have collection method, try firebase-admin
  try {
    const admin = require('firebase-admin');
    if (admin && admin.firestore && typeof admin.firestore === 'function') {
      const firestore = admin.firestore();
      if (firestore && typeof firestore.collection === 'function') {
        console.warn("getCandidateDb: Using fallback firebase-admin firestore instance");
        return firestore.collection("candidate_db");
      }
    }
  } catch (error) {
    console.error("getCandidateDb: Failed to get firebase-admin firestore:", error.message);
  }
  
  // If we still can't get a valid firestore, throw a descriptive error
  throw new Error("Firestore is not initialized. Please check firebase_ad.js configuration.");
};

// Middleware to check authentication
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


router.get('/pos/show', async (req,res)=>{
  try {
    let show = await ad_Pos.getAllPosition();
    const commMap = await buildCommissionMap();
    show = applyCommission(show, commMap);
    res.status(200).json(show);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
})

// Authenticated version — returns only positions matching the logged-in user's skillCategory
router.get('/pos/show-for-user', authMiddleware, async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();

    // Look up the user across recruiter, coach, and expert collections
    let userDoc = null;
    userDoc = await recruiter.findRecruiterByEmail(email);
    if (!userDoc) {
      const coachModel = require('../model_fire/coachF');
      userDoc = await coachModel.findCoachByEmail(email);
    }
    if (!userDoc) {
      const expertModel = require('../model_fire/expertF');
      userDoc = await expertModel.findExpertByEmail(email);
    }

    let show = await ad_Pos.getAllPosition();
    const commMap = await buildCommissionMap();
    show = applyCommission(show, commMap);

    // Only show active positions
    show = show.filter(pos => {
      const st = (pos.status || 'active').toLowerCase().trim();
      return st === 'active';
    });

    // Consulting-firm scoping. A firm position is private to that firm's recruiters
    // UNLESS it's flagged openToAll (visible to every recruiter). So:
    //   - firm recruiter: their firm's positions + any open-to-all position
    //   - non-firm recruiter: platform positions + any open-to-all firm position
    const firmId = userDoc?.consultingFirmId || null;
    if (firmId) {
      show = show.filter(pos => pos.consultingFirmId === firmId || pos.openToAll === true);
    } else {
      show = show.filter(pos => !pos.consultingFirmId || pos.openToAll === true);
    }

    // Filter by skillCategory — only show positions whose skill_category matches.
    // scope=all skips this (the "All" tab) but keeps the active + firm scoping above.
    const scopeAll = (req.query.scope || '').toLowerCase() === 'all';
    if (userDoc && !scopeAll) {
      const sc = userDoc.skillCategory;
      // Normalise to array of lowercase strings
      const userCats = (Array.isArray(sc) ? sc : sc ? [sc] : [])
        .map(s => s.toLowerCase().trim())
        .filter(Boolean);

      if (userCats.length) {
        show = show.filter(pos => {
          const posCat = (pos.skill_category || '').toLowerCase().trim();
          // Strict match: position must have a skill_category AND it must be in the user's list
          return posCat && userCats.includes(posCat);
        });
      }
    }

    res.status(200).json(show);
  } catch (err) {
    console.error('pos/show-for-user error:', err.message);
    res.status(500).json({ error: err.message });
  }
})

// GET my positions (filtered by clientspoc or all for admin)
router.get('/pos/my-positions', authMiddleware, async (req, res) => {
  try {
    let user = null;
    
    // Try to find user in recruiter collection first
    user = await recruiter.findRecruiterByEmail(req.user.email);
    
    // If not found in recruiter collection, try clientspoc (admin_db) collection
    if (!user) {
      user = await clientspoc.findClientSpocByEmail(req.user.email);
    }
    
    // If still not found, return 404
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    let myPositions = await ad_Pos.getMyPositions(user);
    const commMap = await buildCommissionMap();
    myPositions = applyCommission(myPositions, commMap);
    res.status(200).json(myPositions);
    
  } catch (err) {
    console.error("Error fetching my positions:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});


// router.post('/pos', async (req,res)=>{

//     let {pos_id,hr_name,position,client,ctcStart,ctcEnd,state,location,job_desc,experience,commison,pos_cat,comp_view,m_have,g_have,compet,key_res,}= req.body;


//     try{
//         usr=await ad_Pos.CreatePosition({
//         pos_id,
//         position,
//         hr_name,
//         client,
//         state,
//         ctcStart,
//         ctcEnd,
//         location,
//         job_desc,
//         commison,
//         experience,
//         pos_cat,
//         comp_view,
//         m_have,
//         g_have,
//         compet,
//         key_res,
//     })
    
//     res.status(200).json({
//         message : "Position Added Successfully",
//         data : usr
//     })


//     } catch (err){ res.status(500).json({error : err.message})}

// })  

router.post('/pos', authMiddleware, async (req,res)=>{

  try{
    let user = null;
    let userType = null;

    // Try to find user in recruiter collection first
    try {
      user = await recruiter.findRecruiterByEmail(req.user.email);
      if (user) {
        userType = 'recruiter';
      }
    } catch (err) {
      console.log("User not found in recruiter collection, checking admin...");
    }

    // If not found in recruiter, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
        if (user) {
          userType = 'admin';
        }
      } catch (err) {
        console.log("User not found in admin collection either");
      }
    }

    // If still not found, allow position creation anyway (for backward compatibility)
    if (!user) {
      console.log(`Creating position for authenticated user ${req.user.email} (not found in database)`);
      // Create the position without user validation
      const usr = await ad_Pos.CreatePosition(req.body);
      try {
        const { postPositionToLinkedIn } = require('../utils/linkedinPost');
        postPositionToLinkedIn(usr).catch(() => {});
      } catch (_) { /* ignore */ }
      return res.status(200).json({
        success: true,
        message : "Position Added Successfully",
        data : usr
      });
    }

    // Check plan limits for recruiters only (not for Client SPOCs or Admins)
    if (userType === 'recruiter' && user.roleCategory === "Recruiter") {
      const planCheck = await recruiter.checkPlanLimits(user.id);
      
      if (!planCheck.canCreatePosition) {
        return res.status(403).json({
          success: false,
          errorCode: planCheck.expired ? "PLAN_EXPIRED" : "POSITION_LIMIT_REACHED",
          message: planCheck.message,
          limitReached: planCheck.limitReached || false,
          expired: planCheck.expired || false,
          planInfo: {
            planType: user.planType,
            currentCount: planCheck.currentPositionCount,
            maxPositions: planCheck.maxPositions,
            daysRemaining: planCheck.daysRemaining || 0,
            suggestion: planCheck.expired
              ? "Your free plan has expired. Please upgrade to continue creating positions."
              : `You've reached the maximum of ${planCheck.maxPositions} positions. Upgrade to paid plan for unlimited positions.`
          }
        });
      }

      // If free plan, show warning about remaining positions
      if (!planCheck.isPaid && planCheck.positionsRemaining !== undefined) {
        console.log(`Free plan user ${user.email} creating position. Remaining: ${planCheck.positionsRemaining}, Days left: ${planCheck.daysRemaining}`);
      }
    }

    // Client SPOCs and Admins have no limits - create the position
    // Regular recruiters also proceed here after passing plan checks
    const usr = await ad_Pos.CreatePosition(req.body);

    // 🔔 Push: broadcast the new position to all app users
    try {
      const locTxt = usr?.location ? (Array.isArray(usr.location) ? usr.location.join(', ') : usr.location) : '';
      sendPushToAll({
        title: 'New position available',
        body: `${usr?.position || 'A new position'}${usr?.client ? ` · ${usr.client}` : ''}${locTxt ? ` · ${locTxt}` : ''}`,
        data: { type: 'position', posId: usr?.pos_id || '' },
      }).catch(() => {});
    } catch (_) { /* ignore */ }

    // 🔗 Auto-post the new position to the RecruiterV LinkedIn company page
    // (fire-and-forget; no-op until LinkedIn is configured in app_config/linkedin).
    try {
      const { postPositionToLinkedIn } = require('../utils/linkedinPost');
      postPositionToLinkedIn(usr).catch(() => {});
    } catch (_) { /* ignore */ }

    // 🔗 When a Client SPOC posts a position, also push it to LinkedIn via Zapier
    // (fire-and-forget; no-op until app_config/zapier is configured).
    try {
      const roleLc = (user?.roleCategory || user?.role || '').toString().toLowerCase().replace(/\s/g, '');
      if (roleLc.includes('clientspoc')) {
        const { postPositionToZapier } = require('../utils/postPositionToZapier');
        postPositionToZapier(usr).catch(() => {});
      }
    } catch (_) { /* ignore */ }

    // 🔔 Send notification about new position
    try {
      // Get the created position details
      const createdPosition = usr;
      
      // Notify ClientSPOC about their new position
      if (createdPosition && createdPosition.clientspoc) {
        await notificationModel.createNotification({
          recipientEmail: createdPosition.clientspoc,
          recipientType: 'clientspoc',
          type: 'new_position_available',
          title: 'New Position Created',
          message: `You have successfully created a new position "${createdPosition.position}" for ${createdPosition.client || 'your organization'}`,
          positionId: createdPosition.pos_id,
          positionTitle: createdPosition.position,
          clientName: createdPosition.client
        });
        console.log(`✅ Notification sent to ClientSPOC ${createdPosition.clientspoc} about new position ${createdPosition.pos_id}`);
      }

      // Notify all active recruiters about new position (limited to 50)
      try {
        const recruiterSnap = await db.collection('recruiter_db')
          .where('status', '==', 'active')
          .limit(50)
          .get();

        if (!recruiterSnap.empty) {
          const notifications = [];
          recruiterSnap.docs.forEach(doc => {
            const recruiterData = doc.data();
            // Don't notify the position creator if they're a recruiter
            if (recruiterData.email && recruiterData.email !== createdPosition.clientspoc) {
              notifications.push({
                recipientEmail: recruiterData.email,
                recipientType: 'recruiter',
                type: 'new_position_available',
                title: 'New Position Available',
                message: `New position "${createdPosition.position}" added for ${createdPosition.client || 'a client'}${createdPosition.location ? ` in ${Array.isArray(createdPosition.location) ? createdPosition.location.join(', ') : createdPosition.location}` : ''}`,
                positionId: createdPosition.pos_id,
                positionTitle: createdPosition.position,
                clientName: createdPosition.client,
                metadata: {
                  location: createdPosition.location,
                  ctcRange: createdPosition.ctcStart && createdPosition.ctcEnd ? `${createdPosition.ctcStart}-${createdPosition.ctcEnd} LPA` : null
                }
              });
            }
          });

          // Create notifications (limit to 50)
          for (let i = 0; i < Math.min(notifications.length, 50); i++) {
            try {
              await notificationModel.createNotification(notifications[i]);
            } catch (notifError) {
              console.error("Error creating recruiter notification:", notifError);
            }
          }
          console.log(`✅ Sent ${Math.min(notifications.length, 50)} notifications to recruiters about new position`);
        }
      } catch (recruiterError) {
        console.error("Error notifying recruiters:", recruiterError);
        // Don't fail the main request if recruiter notification fails
      }

    } catch (notificationError) {
      console.error("❌ Error sending notifications:", notificationError);
      // Don't fail the main request if notification fails
    }

    res.status(200).json({
      success: true,
      message : "Position Added Successfully",
      data : usr,
      userType: userType
    });

  } catch (err){
    console.error("Error creating position:", err);
    res.status(500).json({
      success: false,
      error : err.message
    });
  }

});






router.get('/latest/candi', async (req, res) => {
  try {
    const latest = await ad_Pos.getLatestPosition();   
    res.json(latest);
  } catch (error) {
    console.error("ðŸ”¥ Error in /latest/candi:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


router.get('/time/candi', async (req,res)=>{
  try{
    const timea=await ad_Pos.getPositionByTime()
    return res.json(timea)

  } catch(error){
    console.error("Error in /time/candi:",error)
    res.status(500).json({ message : "Server Error", error: error.message })

  }

})


router.get('/commison/candi', async (req,res)=>{
  try{
    const commison= await ad_Pos.getPositionByCommison()
    return res.json(commison)

  } catch(error){
    console.error("Error in /time/candi:",error)
    res.status(500).json({ message : "Server Error", error: error.message })
  }

})

router.get('/drives/candi', async (req,res)=>{
  try{
    const drives= await ad_Pos.getPositionByDrives()
    return res.json(drives)

  } catch(error){
    console.error("Error in /time/candi:",error)
    res.status(500).json({ message : "Server Error", error: error.message })
  }

})


router.get('/fastresponse/candi', async (req,res)=>{
  try{
    const fastres= await ad_Pos.getPositionByFastResponse()
    return res.json(fastres)

  } catch(error){
    console.error("Error in /time/candi:",error)
    res.status(500).json({ message : "Server Error", error: error.message })
  }

})


// GET a single position by pos_id
router.get('/position/:pos_id', async (req, res) => {
  try {
    const { pos_id } = req.params;
    const position = await ad_Pos.findPositionByPosId(pos_id);
    if (!position) {
      return res.status(404).json({ message: "Position not found" });
    }

    // Use the current commission from Company_Overview as source of truth —
    // but only for legacy positions with no explicit commission_type, so a
    // position's own chosen tier (fixed amount or percentage) is never overwritten.
    if (position.client && !position.commission_type) {
      try {
        const companyData = await companyModel.fetchCompanyOverview(position.client);
        if (companyData?.commisson) {
          position.commison = Number(companyData.commisson);
        }
      } catch (_) { /* ignore — return position as-is */ }
    }

    res.status(200).json(position);
  } catch (err) {
    console.error("Error fetching single position:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// GET /candidate/position/:pos_id/signal — submission stats + top rejection
// reasons for a position (drives the "Submission Signal" card on dash_view_v2).
router.get('/position/:pos_id/signal', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { pos_id } = req.params;
    const REJ = new Set([
      'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
      'background verification reject', 'negotiation reject', 'test reject',
      'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
    ]);
    const snap = await db.collection('candidate_db').where('pos_id', '==', pos_id).get();
    let submitted = 0, rejected = 0;
    const reasons = {};
    snap.docs.forEach(d => {
      const x = d.data();
      submitted++;
      const s = (x.statusa || '').toLowerCase().trim();
      if (REJ.has(s)) {
        rejected++;
        let r = (x.rejectReason || '').toString().trim();
        if (r) {
          if (r.length > 60) r = r.slice(0, 57) + '…';   // keep free-text reasons short
          reasons[r] = (reasons[r] || 0) + 1;
        }
      }
    });
    const topReasons = Object.entries(reasons)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return res.json({ success: true, submitted, rejected, inProcess: submitted - rejected, topReasons });
  } catch (err) {
    console.error('position signal error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});


// router.get("/addPosition/nextId", async (req, res) => {
//   try {
//     const nextId = await ad_Pos.getNextPositionId();
//     res.json({ nextId });
//   } catch (err) {
//     console.log("Error generating ID:", err);
//     res.status(500).json({ error: "Failed to generate ID" });
//   }
// });


// GET current position ID
router.get("/addPosition/currentId", async (req, res) => {
  try {
    const currentId = await ad_Pos.getCurrentPositionId();
    res.json({ currentId });
  } catch (err) {
    console.error("Error fetching current position ID:", err);
    res.status(500).json({ error: err.message });
  }
});



// UPDATE position (EDIT)
router.put('/pos/update/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedPosition = await ad_Pos.updatePositionById(id, req.body);

    res.status(200).json({
      message: "Position updated successfully",
      data: updatedPosition
    });
  } catch (err) {
    console.error("Error updating position:", err);
    res.status(400).json({
      message: "Failed to update position",
      error: err.message
    });
  }
});


// UPDATE maxCandidate for a position (ClientSPOC can increase candidate limit)
router.put('/pos/update-max-candidate/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalCandidates } = req.body;

    if (!additionalCandidates || isNaN(additionalCandidates) || additionalCandidates < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid positive number for additional candidates"
      });
    }

    // Find the position first
    const position = await ad_Pos.findPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Get current maxCandidate (default to 10 if not set)
    const currentMaxCandidate = position.maxCandidate || 10;
    const newMaxCandidate = currentMaxCandidate + Number(additionalCandidates);

    // Update the position with new maxCandidate
    const updatedPosition = await ad_Pos.updatePositionById(id, {
      maxCandidate: newMaxCandidate
    });

    res.status(200).json({
      success: true,
      message: `Max candidate count updated from ${currentMaxCandidate} to ${newMaxCandidate}`,
      data: {
        id: updatedPosition.id,
        pos_id: updatedPosition.pos_id,
        position: updatedPosition.position,
        client: updatedPosition.client,
        maxCandidate: newMaxCandidate,
        additionalAdded: Number(additionalCandidates)
      }
    });

  } catch (err) {
    console.error("Error updating max candidate:", err);
    res.status(400).json({
      success: false,
      message: "Failed to update max candidate",
      error: err.message
    });
  }
});


// GET positions statistics for ClientSPOC dashboard
router.get('/pos/clientspoc-stats', authMiddleware, async (req, res) => {
  try {
    // Find the clientSPOC user
    let user = null;
    
    // Try to find user in clientspoc collection first
    try {
      user = await clientspoc.findClientSpocByEmail(req.user.email);
    } catch (err) {
      console.log("User not found in clientspoc collection");
    }

    // If not found, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Use the helper function from adminF to get positions
    const userEmail = (req.user.email || "").toLowerCase();
    const positions = await ad_Pos.getPositionsByClientSPOC(userEmail);
    
    if (positions.length === 0) {
      return res.status(200).json({
        success: true,
        positions: [],
        summary: {
          totalPositions: 0,
          totalCandidates: 0,
          totalMaxCandidates: 0,
          totalRemaining: 0
        }
      });
    }

    // Get all candidates for these positions using the helper function
    const candidatesData = await ad_Pos.getCandidatesByClientSPOC(userEmail);

    // Process positions with stats
    const processedPositions = positions.map(pos => {
      const posId = pos.pos_id;

      // All submitted candidates for this position
      const allCandidates = candidatesData.filter(c => c.pos_id === posId);

      // Non-rejected candidates (for Candidates column / max limit tracking)
      const nonRejected = allCandidates.filter(c => !REJECTION_STATUSES.includes(c.statusa));

      // Active candidates (exclude rejected AND hold statuses)
      const activeCandidates = allCandidates.filter(c => !ACTIVE_EXCLUDE_STATUSES.includes(c.statusa));

      const currentCount = nonRejected.length;
      const activeCount  = activeCandidates.length;
      const maxCandidate = pos.maxCandidate || 10;
      const remaining    = Math.max(0, maxCandidate - currentCount);

      return {
        id: pos.id,
        pos_id: posId,
        position: pos.position,
        client: pos.client,
        hr_name: pos.hr_name,
        candidateCount: currentCount,
        activeCount,
        maxCandidate,
        remaining,
        isFull: currentCount >= maxCandidate
      };
    });

    // Calculate summary
    const summary = {
      totalPositions: processedPositions.length,
      totalCandidates: processedPositions.reduce((sum, p) => sum + p.candidateCount, 0),
      totalActiveCandidates: processedPositions.reduce((sum, p) => sum + p.activeCount, 0),
      totalMaxCandidates: processedPositions.reduce((sum, p) => sum + p.maxCandidate, 0),
      totalRemaining: processedPositions.reduce((sum, p) => sum + p.remaining, 0)
    };

    res.status(200).json({
      success: true,
      positions: processedPositions,
      summary
    });

  } catch (err) {
    console.error("Error fetching ClientSPOC position stats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch position statistics",
      error: err.message
    });
  }
});


// DELETE position
router.delete('/pos/delete/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the position to check ownership
    const position = await ad_Pos.findPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Check if user has permission to delete
    let user = null;
    let userType = null;

    // Try to find user in recruiter collection
    try {
      user = await recruiter.findRecruiterByEmail(req.user.email);
      if (user) {
        userType = 'recruiter';
      }
    } catch (err) {
      console.log("User not found in recruiter collection, checking admin...");
    }

    // If not found in recruiter, try admin collection (ClientSPOC)
    if (!user) {
      try {
        user = await clientspoc.findClientSpocByEmail(req.user.email);
        if (user) {
          userType = 'clientspoc';
        }
      } catch (err) {
        console.log("User not found in clientspoc collection, checking admin...");
      }
    }

    // If still not found, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
        if (user) {
          userType = 'admin';
        }
      } catch (err) {
        console.log("User not found in admin collection either");
      }
    }

    // Check permission by email (case-insensitive)
    const userEmail = (req.user.email || "").toLowerCase();
    const positionCreatorEmail = (position.clientspoc || "").toLowerCase();
    const isOwner = positionCreatorEmail === userEmail;
    const isAdmin = userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this position. Only the creator or admin can delete."
      });
    }

    // Delete the position
    await ad_Pos.deletePositionById(id);

    res.status(200).json({
      success: true,
      message: "Position deleted successfully",
      deletedBy: userType
    });

  } catch (err) {
    console.error("Error deleting position:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete position",
      error: err.message
    });
  }
});


// ==================== CANDIDATE DETAILS ENDPOINT ====================

/**
 * GET /candidate/pos/:pos_id/candidates
 * Get all candidates for a specific position (non-rejected only)
 * Used for expandable row details in position stats pages
 */
router.get('/pos/:pos_id/candidates', authMiddleware, async (req, res) => {
  try {
    const { pos_id } = req.params;

    if (!pos_id) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Fetch all candidates for this position
    const candidatesSnap = await getCandidateDb().where('pos_id', '==', pos_id).get();
    
    if (candidatesSnap.empty) {
      return res.status(200).json({
        success: true,
        candidates: []
      });
    }

    const candidatesData = candidatesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.candidate || data.name || 'N/A',
        status: data.statusa || 'N/A',
        submittedDate: formatDate(data.datePosted),
        lastUpdated: formatDate(data.updatedAt) || formatDate(data.statusaDate) || formatDate(data.datePosted),
        recEmail: data.recEmail || 'N/A',
        recName: data.recName || 'N/A'
      };
    });

    res.status(200).json({
      success: true,
      candidates: candidatesData
    });

  } catch (err) {
    console.error("Error fetching position candidates:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: err.message
    });
  }
});

// Helper function to format date
function formatDate(dateData) {
  if (!dateData) return null;
  
  try {
    if (dateData._seconds) {
      return new Date(dateData._seconds * 1000).toISOString();
    } else if (dateData.seconds) {
      return new Date(dateData.seconds * 1000).toISOString();
    } else if (dateData.toDate) {
      return dateData.toDate().toISOString();
    } else if (typeof dateData === 'string') {
      return dateData;
    } else if (dateData instanceof Date) {
      return dateData.toISOString();
    }
  } catch (err) {
    console.error("Date format error:", err);
  }
  return null;
}

// ==================== ASSIGNED POSITIONS ROUTES ====================

/**
 * GET /candidate/pos/assigned-positions
 * Get positions assigned to the logged-in recruiter
 * Returns positions where:
 * 1. Recruiter created them (clientspoc matches recruiter email) - OWNED positions
 * 2. Recruiter has submitted candidates (recEmail matches) - ASSIGNED positions
 * 
 * Used by Assigned Positions page - allows adding candidates up to maxCandidate
 */
router.get('/pos/assigned-positions', authMiddleware, async (req, res) => {
  try {
    // Find the recruiter user
    let user = null;
    
    // Try to find user in recruiter collection first
    try {
      user = await recruiter.findRecruiterByEmail(req.user.email);
    } catch (err) {
      console.log("User not found in recruiter collection");
    }

    // If not found, try admin collection (for hybrid users)
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const recruiterEmail = (req.user.email || "").toLowerCase();
    
    console.log(`[AssignedPositions] Fetching for recruiter: ${recruiterEmail}`);
    
    // Step 1: Get all positions created by this recruiter (owned positions)
    const ownedPositions = await ad_Pos.getMyPositions(user);
    console.log(`[AssignedPositions] Owned positions count: ${ownedPositions.length}`);
    
    // Step 2: Get positions assigned to this recruiter via the assignment system
    const assignmentRef = db.collection("position_assignments");
    const assignmentsSnap = await assignmentRef
      .where('recruiterEmail', '==', recruiterEmail)
      .where('assigned', '==', true)
      .get();

    let assignedPositionIds = new Set();
    let assignedPositionsData = [];
    
    if (!assignmentsSnap.empty) {
      // Collect position IDs from assignments
      assignmentsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.pos_id) {
          assignedPositionIds.add(data.pos_id);
          assignedPositionsData.push({
            assignmentId: doc.id,
            ...data
          });
        }
      });
      console.log(`[AssignedPositions] Assignments found: ${assignedPositionsData.length}, pos_ids: ${Array.from(assignedPositionIds)}`);
    } else {
      console.log(`[AssignedPositions] No assignments found in position_assignments collection`);
    }

    // Step 3: Get positions where recruiter has submitted candidates
    const candidatesSnap = await getCandidateDb().where('recEmail', '==', recruiterEmail).get();
    
    if (!candidatesSnap.empty) {
      candidatesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.pos_id) {
          assignedPositionIds.add(data.pos_id);
        }
      });
      console.log(`[AssignedPositions] Candidates found for ${candidatesSnap.docs.length} candidates, position IDs: ${Array.from(assignedPositionIds)}`);
    } else {
      console.log(`[AssignedPositions] No candidates found`);
    }

    // Step 4: Get positions from the position_assignments collection (assigned positions)
    const positionsFromAssignments = [];
    if (assignedPositionsData.length > 0) {
      // Fetch positions in batches (Firestore limit is 10 items per 'in' query)
      const assignedPosIds = [...new Set(assignedPositionsData.map(a => a.pos_id))];
      console.log(`[AssignedPositions] Fetching ${assignedPosIds.length} assigned positions from admin_AddPos`);
      
      for (let i = 0; i < assignedPosIds.length; i += 10) {
        const batch = assignedPosIds.slice(i, i + 10);
        const posSnap = await positionsCollection.where('pos_id', 'in', batch).get();
        console.log(`[AssignedPositions] Fetched ${posSnap.docs.length} positions for batch`);
        
        posSnap.docs.forEach(doc => {
          const posData = doc.data();
          const assignmentInfo = assignedPositionsData.find(a => a.pos_id === posData.pos_id);
          
          // Check if not already in owned positions (to avoid duplicates)
          const isOwned = ownedPositions.some(p => p.pos_id === posData.pos_id);
          
          if (!isOwned) {
            positionsFromAssignments.push({
              id: doc.id,
              ...posData,
              isOwner: false,
              assignedAt: assignmentInfo?.assignedAt,
              assignmentId: assignmentInfo?.assignmentId
            });
            console.log(`[AssignedPositions] Added position: ${posData.pos_id} - ${posData.position}`);
          }
        });
      }
    }

    // Step 5: Get positions where recruiter has submitted candidates (assigned positions)
    const positionsFromCandidates = [];
    if (assignedPositionIds.size > 0) {
      const positionIdsArray = Array.from(assignedPositionIds);
      console.log(`[AssignedPositions] Fetching ${positionIdsArray.length} positions from candidates`);
      
      // Fetch positions in batches (Firestore limit is 10 items per 'in' query)
      for (let i = 0; i < positionIdsArray.length; i += 10) {
        const batch = positionIdsArray.slice(i, i + 10);
        const posSnap = await positionsCollection.where('pos_id', 'in', batch).get();
        console.log(`[AssignedPositions] Fetched ${posSnap.docs.length} positions for candidate batch`);
        
        posSnap.docs.forEach(doc => {
          const posData = doc.data();
          // Check if not already in owned positions or already added from assignments
          const isOwned = ownedPositions.some(p => p.pos_id === posData.pos_id);
          const isFromAssignment = positionsFromAssignments.some(p => p.pos_id === posData.pos_id);
          
          if (!isOwned && !isFromAssignment) {
            positionsFromCandidates.push({
              id: doc.id,
              ...posData,
              isOwner: false // Not owned by this recruiter
            });
            console.log(`[AssignedPositions] Added position from candidates: ${posData.pos_id} - ${posData.position}`);
          }
        });
      }
    }

    // Step 6: NEW - Get positions from approved assign requests (new multi-recruiter system)
    const positionsFromAssignRequests = [];
    try {
      const assignRequests = await positionAccess.getRecruiterAssignments(recruiterEmail);
      console.log(`[AssignedPositions] Found ${assignRequests.length} approved assign requests`);
      
      if (assignRequests.length > 0) {
        const assignRequestPosIds = [...new Set(assignRequests.map(a => a.positionId))];
        console.log(`[AssignedPositions] Fetching ${assignRequestPosIds.length} positions from assign requests`);
        
        // Fetch positions in batches
        for (let i = 0; i < assignRequestPosIds.length; i += 10) {
          const batch = assignRequestPosIds.slice(i, i + 10);
          const posSnap = await positionsCollection.where('pos_id', 'in', batch).get();
          
          posSnap.docs.forEach(doc => {
            const posData = doc.data();
            const assignInfo = assignRequests.find(a => a.positionId === posData.pos_id);
            
            // Check if not already in owned positions, assignments, or candidates
            const isOwned = ownedPositions.some(p => p.pos_id === posData.pos_id);
            const isFromAssignment = positionsFromAssignments.some(p => p.pos_id === posData.pos_id);
            const isFromCandidates = positionsFromCandidates.some(p => p.pos_id === posData.pos_id);
            
            if (!isOwned && !isFromAssignment && !isFromCandidates) {
              positionsFromAssignRequests.push({
                id: doc.id,
                ...posData,
                isOwner: false,
                assignedAt: assignInfo?.requestedAt,
                assignmentId: assignInfo?.id,
                fromAssignRequest: true // Mark as from new assign request system
              });
              console.log(`[AssignedPositions] Added position from assign request: ${posData.pos_id} - ${posData.position}`);
            }
          });
        }
      }
    } catch (assignError) {
      console.error("Error fetching assign requests:", assignError);
    }

    // Step 6b: NEW - Get positions assigned to this recruiter by a Coach/Expert
    // that the recruiter has ACCEPTED (coach_recruiter_assignments, status 'accepted').
    const positionsFromCoach = [];
    try {
      const coachSnap = await db.collection('coach_recruiter_assignments')
        .where('recruiterEmail', '==', req.user.email)
        .get();
      const acceptedCoachPosIds = [...new Set(
        coachSnap.docs
          .map(d => d.data())
          .filter(a => a.status === 'accepted' && a.positionId)
          .map(a => a.positionId)
      )];
      console.log(`[AssignedPositions] Found ${acceptedCoachPosIds.length} accepted coach assignments`);

      for (let i = 0; i < acceptedCoachPosIds.length; i += 10) {
        const batch = acceptedCoachPosIds.slice(i, i + 10);
        const posSnap = await positionsCollection.where('pos_id', 'in', batch).get();
        posSnap.docs.forEach(doc => {
          const posData = doc.data();
          const isOwned = ownedPositions.some(p => p.pos_id === posData.pos_id);
          const isFromAssignment = positionsFromAssignments.some(p => p.pos_id === posData.pos_id);
          const isFromCandidates = positionsFromCandidates.some(p => p.pos_id === posData.pos_id);
          const isFromAssignReq = positionsFromAssignRequests.some(p => p.pos_id === posData.pos_id);
          if (!isOwned && !isFromAssignment && !isFromCandidates && !isFromAssignReq) {
            positionsFromCoach.push({
              id: doc.id,
              ...posData,
              isOwner: false,
              fromCoachAssignment: true
            });
            console.log(`[AssignedPositions] Added position from coach assignment: ${posData.pos_id} - ${posData.position}`);
          }
        });
      }
    } catch (coachError) {
      console.error("Error fetching coach assignments:", coachError);
    }

    // Step 7: Mark owned positions
    const processedOwnedPositions = ownedPositions.map(pos => ({
      ...pos,
      isOwner: true // Mark as owned
    }));

    // Step 8: Combine owned, assigned (assignment system), candidates, assign requests, coach assignments
    const commMap = await buildCommissionMap();
    const allAssignedPositions = applyCommission([
      ...processedOwnedPositions,
      ...positionsFromAssignments,
      ...positionsFromCandidates,
      ...positionsFromAssignRequests,
      ...positionsFromCoach
    ], commMap);
    console.log(`[AssignedPositions] Total positions to return: ${allAssignedPositions.length}`);

    // Step 6: Get all candidate counts for these positions
    // (Firestore 'in' rejects an empty array, so guard for the no-positions case.)
    const allPositionIds = allAssignedPositions.map(p => p.pos_id).filter(Boolean);
    let allCandidatesData = [];
    for (let i = 0; i < allPositionIds.length; i += 10) {
      const batch = allPositionIds.slice(i, i + 10);
      if (!batch.length) continue;
      const snap = await getCandidateDb().where('pos_id', 'in', batch).get();
      allCandidatesData.push(...snap.docs.map(doc => doc.data()));
    }

    // Resume-bank match counts — candidates in the bank matching each JD >= 75%.
    let resumeBankCounts = {};
    try {
      resumeBankCounts = await resumeBankMatchCounts(db, allAssignedPositions, 75);
    } catch (e) { console.error('resumeBankMatchCounts error:', e.message); }

    // Step 7: Enrich positions with candidate counts and recruiter's candidates
    const enrichedPositions = allAssignedPositions.map(position => {
      const posId = position.pos_id;
      
      // Get all candidates for this position (excluding rejections)
      const positionCandidates = allCandidatesData.filter(c => 
        c.pos_id === posId && 
        !REJECTION_STATUSES.includes(c.statusa)
      );

      // Get only this recruiter's candidates for this position
      const myCandidates = positionCandidates.filter(c => 
        (c.recEmail || "").toLowerCase() === recruiterEmail
      );

      const totalCount = positionCandidates.length;
      const myCount = myCandidates.length;
      const maxCandidate = position.maxCandidate || 10;
      const remaining = Math.max(0, maxCandidate - totalCount);

      return {
        id: position.id,
        pos_id: posId,
        position: position.position,
        client: position.client,
        hr_name: position.hr_name,
        location: position.location,
        experience: position.experience,
        ctcStart: position.ctcStart,
        ctcEnd: position.ctcEnd,
        commison: position.commison,
        commission_type: position.commission_type || '',
        datePosted: position.datePosted,
        pos_cat: position.pos_cat,
        job_desc: position.job_desc,
        state: position.state,
        status: position.status || 'active',
        maxCandidate: maxCandidate,
        candidateCount: totalCount,
        myCandidateCount: myCount,
        remaining: remaining,
        isFull: totalCount >= maxCandidate,
        isOwner: position.isOwner,
        resumeBankMatchCount: resumeBankCounts[posId] || 0,
        // Store my candidates for expandable view
        myCandidates: myCandidates.map(c => ({
          id: c.id || c.candidateId,
          candidateName: c.candidate || c.name || 'N/A',
          status: c.statusa || 'N/A',
          dateAdded: c.datePosted,
          lastUpdated: c.updatedAt || c.statusaDate || c.datePosted
        }))
      };
    });

    // Sort by date posted (newest first)
    enrichedPositions.sort((a, b) => {
      const dateA = a.datePosted?._seconds || 0;
      const dateB = b.datePosted?._seconds || 0;
      return dateB - dateA;
    });

    // Calculate summary
    const summary = {
      totalPositions: enrichedPositions.length,
      ownedCount: processedOwnedPositions.length,
      assignedCount: positionsFromAssignments.length + positionsFromCandidates.length,
      totalCandidates: enrichedPositions.reduce((sum, p) => sum + p.candidateCount, 0),
      myTotalCandidates: enrichedPositions.reduce((sum, p) => sum + p.myCandidateCount, 0),
      totalMaxCandidates: enrichedPositions.reduce((sum, p) => sum + p.maxCandidate, 0),
      totalRemaining: enrichedPositions.reduce((sum, p) => sum + p.remaining, 0),
      fullPositions: enrichedPositions.filter(p => p.isFull).length
    };

    res.status(200).json({
      success: true,
      positions: enrichedPositions,
      summary
    });

  } catch (err) {
    console.error("Error fetching assigned positions:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned positions",
      error: err.message
    });
  }
});

/**
 * GET /candidate/pos/:pos_id/matching-bank
 * Resume-bank (available pool) candidates matching this position's JD >= 75%,
 * each with a match percent and matched/missing-skill reason. Used by the
 * "Matching Candidates" tab of the Submit Candidate modal.
 */
router.get('/pos/:pos_id/matching-bank', authMiddleware, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', pos_id).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found' });
    const position = posSnap.docs[0].data();
    const threshold = Math.min(100, Math.max(0, Number(req.query.threshold) || 75));
    const candidates = await getMatchingCandidates(db, position, threshold);
    res.json({ success: true, candidates, threshold });
  } catch (err) {
    console.error('matching-bank error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /candidate/pos/:pos_id/validate-add-candidate
 * Validate if recruiter can add a candidate to this position
 * Returns { canAdd: boolean, message: string, currentCount: number, maxCandidate: number, remaining: number }
 */
router.get('/pos/:pos_id/validate-add-candidate', authMiddleware, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const recruiterEmail = (req.user.email || "").toLowerCase();

    // Get the position
    const position = await ad_Pos.findPositionByPosId(pos_id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        canAdd: false,
        message: "Position not found"
      });
    }

    const maxCandidate = position.maxCandidate || 10;

    // Get all candidates for this position (excluding rejections)
    const candidatesSnap = await getCandidateDb().where('pos_id', '==', pos_id).get();
    
    let totalCount = 0;
    if (!candidatesSnap.empty) {
      candidatesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!REJECTION_STATUSES.includes(data.statusa)) {
          totalCount++;
        }
      });
    }

    const remaining = Math.max(0, maxCandidate - totalCount);
    const canAdd = totalCount < maxCandidate;

    res.status(200).json({
      success: true,
      canAdd,
      message: canAdd 
        ? `You can add candidates. ${remaining} slot(s) remaining.`
        : `Position has reached maximum limit of ${maxCandidate} candidates.`,
      currentCount: totalCount,
      maxCandidate,
      remaining
    });

  } catch (err) {
    console.error("Error validating add candidate:", err);
    res.status(500).json({
      success: false,
      canAdd: false,
      message: "Failed to validate",
      error: err.message
    });
  }
});

// ==================== RECRUITER POSITION STATS ROUTES ====================

/**
 * GET /candidate/pos/recruiter-stats
 * Get position statistics for the logged-in recruiter
 * Returns positions where the recruiter has submitted candidates
 * WITHOUT "More Candidate" column - read-only view
 */
router.get('/pos/recruiter-stats', authMiddleware, async (req, res) => {
  try {
    // Find the user across recruiter, admin, coach, and expert collections
    let user = null;

    try { user = await recruiter.findRecruiterByEmail(req.user.email); } catch (_) {}

    if (!user) {
      try { user = await adminModel.findAdminByEmail(req.user.email); } catch (_) {}
    }

    if (!user) {
      const coachModel = require('../model_fire/coachF');
      try { user = await coachModel.findCoachByEmail(req.user.email); } catch (_) {}
    }

    if (!user) {
      const expertModel = require('../model_fire/expertF');
      try { user = await expertModel.findExpertByEmail(req.user.email); } catch (_) {}
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const recruiterEmail = (req.user.email || "").toLowerCase();
    
    // Get all candidates submitted by this recruiter
    const candidatesSnap = await getCandidateDb().where('recEmail', '==', recruiterEmail).get();
    
    if (candidatesSnap.empty) {
      return res.status(200).json({
        success: true,
        positions: [],
        summary: {
          totalPositions: 0,
          totalCandidates: 0,
          totalMaxCandidates: 0,
          totalRemaining: 0
        }
      });
    }

    const candidatesData = candidatesSnap.docs.map(doc => doc.data());
    
    // Get unique position IDs
    const positionIds = [...new Set(candidatesData.map(c => c.pos_id).filter(Boolean))];
    
    if (positionIds.length === 0) {
      return res.status(200).json({
        success: true,
        positions: [],
        summary: {
          totalPositions: 0,
          totalCandidates: 0,
          totalMaxCandidates: 0,
          totalRemaining: 0
        }
      });
    }

    // Fetch positions in batches (Firestore limit is 10 items per 'in' query)
    const positionsData = [];
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const posSnap = await positionsCollection.where('pos_id', 'in', batch).get();
      posSnap.docs.forEach(doc => {
        positionsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }

    // Get all candidates for these positions to calculate counts
    // (Firestore 'in' rejects an empty array, so guard for the no-positions case.)
    const safePositionIds = (positionIds || []).filter(Boolean);
    let allCandidatesData = [];
    for (let i = 0; i < safePositionIds.length; i += 10) {
      const batch = safePositionIds.slice(i, i + 10);
      if (!batch.length) continue;
      const snap = await getCandidateDb().where('pos_id', 'in', batch).get();
      allCandidatesData.push(...snap.docs.map(doc => doc.data()));
    }

    // Build a map of position data for quick lookup
    const positionMap = {};
    positionsData.forEach(pos => {
      positionMap[pos.pos_id] = pos;
    });

    // Process positions with stats (only for positions where recruiter has candidates)
    const processedPositions = [];
    
    for (const posId of positionIds) {
      const pos = positionMap[posId];
      if (!pos) continue; // Skip if position not found
      
      // Get candidates for this position (excluding rejections)
      const positionCandidates = allCandidatesData.filter(c => 
        c.pos_id === posId && 
        !REJECTION_STATUSES.includes(c.statusa)
      );
      
      // Get only this recruiter's candidates for this position
      const recruiterCandidates = positionCandidates.filter(c => 
        (c.recEmail || "").toLowerCase() === recruiterEmail
      );

      const myCount = recruiterCandidates.length;
      const totalCount = positionCandidates.length;
      const maxCandidate = pos.maxCandidate || 10;
      const remaining = Math.max(0, maxCandidate - totalCount);

      processedPositions.push({
        id: pos.id,
        pos_id: posId,
        position: pos.position,
        client: pos.client,
        hr_name: pos.hr_name,
        candidateCount: myCount,        // Recruiter's own candidates
        totalCandidates: totalCount,    // All candidates for this position
        maxCandidate: maxCandidate,
        remaining: remaining,
        isFull: totalCount >= maxCandidate,
        location: pos.location,
        ctcStart: pos.ctcStart,
        ctcEnd: pos.ctcEnd
      });
    }

    // Sort by position name
    processedPositions.sort((a, b) => (a.position || "").localeCompare(b.position || ""));

    // Calculate summary
    const summary = {
      totalPositions: processedPositions.length,
      totalCandidates: processedPositions.reduce((sum, p) => sum + p.candidateCount, 0),
      totalAllCandidates: processedPositions.reduce((sum, p) => sum + (p.totalCandidates || 0), 0),
      totalMaxCandidates: processedPositions.reduce((sum, p) => sum + p.maxCandidate, 0),
      totalRemaining: processedPositions.reduce((sum, p) => sum + p.remaining, 0)
    };

    res.status(200).json({
      success: true,
      positions: processedPositions,
      summary
    });

  } catch (err) {
    console.error("Error fetching recruiter position stats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch position statistics",
      error: err.message
    });
  }
});

// ==================== STATISTICS ROUTES ====================

/**
 * GET /admin/stats
 * Get overall admin statistics
 * Query params: ?client=LTIMindtree&hr_name=Karishma
 */
router.get('/stats', async (req, res) => {
  try {
    const { client, hr_name } = req.query;

    const stats = await ad_Pos.getAdminStats(client, hr_name);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/**
 * GET /admin/stats/detailed
 * Get detailed breakdown
 */
router.get('/stats/detailed', async (req, res) => {
  try {
    const { client, hr_name } = req.query;

    const detailedStats = await ad_Pos.getDetailedStats(client, hr_name);

    res.status(200).json({
      success: true,
      data: detailedStats
    });

  } catch (err) {
    console.error("Error fetching detailed stats:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/**
 * GET /admin/stats/client/:clientName
 */
router.get('/stats/client/:clientName', async (req, res) => {
  try {
    const { clientName } = req.params;
    const stats = await ad_Pos.getAdminStats(clientName, null);

    res.status(200).json({
      success: true,
      client: clientName,
      data: stats
    });

  } catch (err) {
    console.error("Error fetching client stats:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ==================== POSITION VISIBILITY ROUTES ====================

/**
 * POST /pos/refresh-visibility/:pos_id
 * Manually refresh position visibility based on active candidate count
 * Useful for initial migration or when candidates are updated directly in DB
 */
router.post('/pos/refresh-visibility/:pos_id', async (req, res) => {
  try {
    const { pos_id } = req.params;

    if (!pos_id) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    const result = await ad_Pos.updatePositionVisibility(pos_id);

    res.status(200).json({
      success: true,
      message: result.isHidden 
        ? `Position has ${result.activeCandidateCount} active candidates and is now hidden from open positions`
        : `Position is visible with ${result.activeCandidateCount} active candidates`,
      data: result
    });

  } catch (err) {
    console.error("Error refreshing position visibility:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * POST /pos/batch-refresh-visibility
 * Batch refresh visibility for all positions
 * Useful for initial migration
 */
router.post('/pos/batch-refresh-visibility', async (req, res) => {
  try {
    const result = await ad_Pos.batchUpdateAllPositionsVisibility();

    res.status(200).json({
      success: true,
      message: `Batch update complete: ${result.updated} positions updated, ${result.skipped} skipped`,
      data: result
    });

  } catch (err) {
    console.error("Error in batch position visibility refresh:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ==================== CLIENTSPOC MY POSITIONS ROUTES ====================

/**
 * GET /candidate/pos/clientspoc/my-positions
 * Get positions created by ClientSPOC with recruiter-wise candidate breakdown
 * Returns:
 * - Position details (name, client, HR name, max candidate limit)
 * - Candidate added count
 * - Recruiters count (unique recruiters who submitted candidates)
 * - Remaining count
 * - Expandable recruiter-wise candidate details
 */
router.get('/pos/clientspoc/my-positions', authMiddleware, async (req, res) => {
  try {
    // Find the clientSPOC user
    let user = null;
    
    // Try to find user in clientspoc collection first
    try {
      user = await clientspoc.findClientSpocByEmail(req.user.email);
    } catch (err) {
      console.log("User not found in clientspoc collection");
    }

    // If not found, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userEmail = (req.user.email || "").toLowerCase();
    
    // Get all positions created by this ClientSPOC (including PAUSED)
    const positions = await ad_Pos.getPositionsByClientSPOC(userEmail);
    
    if (positions.length === 0) {
      return res.status(200).json({
        success: true,
        positions: [],
        summary: {
          totalPositions: 0,
          totalCandidates: 0,
          totalRecruiters: 0,
          totalMaxCandidates: 0,
          totalRemaining: 0
        }
      });
    }

    // Get all candidates for these positions
    const candidatesData = await ad_Pos.getCandidatesByClientSPOC(userEmail);

    // Build a vendor map: recruiterEmail → { vendorEmail, vendorName } in one batch
    const allRecruiterEmails = [...new Set(candidatesData.map(c => (c.recEmail || '').toLowerCase()).filter(Boolean))];
    const vendorMap = {};
    for (let i = 0; i < allRecruiterEmails.length; i += 30) {
      const batch = allRecruiterEmails.slice(i, i + 30);
      const snap = await db.collection('recruiter_db').where('email', 'in', batch).get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.vendorEmail) {
          vendorMap[(d.email || '').toLowerCase()] = {
            vendorEmail: d.vendorEmail,
            vendorName: d.vendorName || d.vendorEmail,
          };
        }
      });
    }

    // Apply current commission from Company_Overview before processing
    const commMap = await buildCommissionMap();
    const enrichedPositions = applyCommission(positions, commMap);

    // Process positions with recruiter-wise breakdown
    const processedPositions = enrichedPositions.map(pos => {
      const posId = pos.pos_id;
      
      // Get all candidates for this position (excluding rejections)
      const positionCandidates = candidatesData.filter(c => 
        c.pos_id === posId && 
        !REJECTION_STATUSES.includes(c.statusa)
      );

      // Group candidates by recruiter
      const recruiterGroups = {};
      positionCandidates.forEach(candidate => {
        const recruiterName = candidate.recName || candidate.recruiterName || candidate.recruiter_name || 'Unknown';
        const recruiterEmail = candidate.recEmail || '';
        const recruiterRole = candidate.recRole || 'Recruiter';

        if (!recruiterGroups[recruiterEmail]) {
          const vendorInfo = vendorMap[(recruiterEmail || '').toLowerCase()] || null;
          recruiterGroups[recruiterEmail] = {
            recruiterName: recruiterName,
            recruiterEmail: recruiterEmail,
            recruiterRole: recruiterRole,
            vendorEmail: vendorInfo?.vendorEmail || null,
            vendorName: vendorInfo?.vendorName || null,
            candidates: []
          };
        }
        
        recruiterGroups[recruiterEmail].candidates.push({
          id: candidate.id,
          candidateName: candidate.candidate || candidate.name || 'N/A',
          status: candidate.statusa || 'N/A',
          dateAdded: candidate.datePosted || candidate.dateAdded,
          lastUpdated: candidate.statusaDate || candidate.updatedAt
        });
      });

      const currentCount = positionCandidates.length;
      const maxCandidate = pos.maxCandidate || 10;
      const remaining = Math.max(0, maxCandidate - currentCount);
      const recruitersCount = Object.keys(recruiterGroups).length;

      return {
        id: pos.id,
        pos_id: posId,
        position: pos.position,
        client: pos.client || 'Confidential',
        hr_name: pos.hr_name || 'N/A',
        // Include ALL fields from the database
        ctcStart: pos.ctcStart || '',
        ctcEnd: pos.ctcEnd || '',
        experience: pos.experience || '',
        commison: pos.commison || 0,
        commission_type: pos.commission_type || '',
        position_tier: pos.position_tier || '',
        client_questions: Array.isArray(pos.client_questions) ? pos.client_questions : [],
        job_desc: pos.job_desc || '',
        state: pos.state || [],
        location: pos.location || [],
        key_res: pos.key_res || '',
        m_have: pos.m_have || '',
        g_have: pos.g_have || '',
        compet: pos.compet || '',
        comp_view: pos.comp_view || '',
        pos_cat: pos.pos_cat || '',
        skill_category: pos.skill_category || '',
        maxCandidate: maxCandidate,
        candidateCount: currentCount,
        recruitersCount: recruitersCount,
        remaining: remaining,
        isFull: currentCount >= maxCandidate,
        datePosted: pos.datePosted,
        status: pos.status || 'active',
        // Recruiter-wise breakdown
        recruiters: Object.values(recruiterGroups).map(group => ({
          recruiterName: group.recruiterName,
          recruiterEmail: group.recruiterEmail,
          recruiterRole: group.recruiterRole,
          vendorEmail: group.vendorEmail || null,
          vendorName: group.vendorName || null,
          candidateCount: group.candidates.length,
          candidates: group.candidates
        }))
      };
    });

    // Sort by date posted (newest first)
    processedPositions.sort((a, b) => {
      const dateA = a.datePosted?._seconds || 0;
      const dateB = b.datePosted?._seconds || 0;
      return dateB - dateA;
    });

    // Calculate summary
    const summary = {
      totalPositions: processedPositions.length,
      totalCandidates: processedPositions.reduce((sum, p) => sum + p.candidateCount, 0),
      totalRecruiters: new Set(
        processedPositions.flatMap(p => p.recruiters.map(r => r.recruiterEmail))
      ).size,
      totalMaxCandidates: processedPositions.reduce((sum, p) => sum + p.maxCandidate, 0),
      totalRemaining: processedPositions.reduce((sum, p) => sum + p.remaining, 0)
    };

    res.status(200).json({
      success: true,
      positions: processedPositions,
      summary
    });

  } catch (err) {
    console.error("Error fetching ClientSPOC my positions:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch positions",
      error: err.message
    });
  }
});

/**
 * POST /pos/pause/:id
 * Toggle position pause status
 * PAUSED positions are hidden from recruiters in Open Positions
 */
router.post('/pos/pause/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'pause' or 'unpause'

    // Find the position
    const position = await ad_Pos.findPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Check if user has permission (owner or admin)
    let user = null;
    let userType = null;

    // Try to find user in clientspoc collection
    try {
      user = await clientspoc.findClientSpocByEmail(req.user.email);
      if (user) userType = 'clientspoc';
    } catch (err) {
      console.log("User not found in clientspoc collection");
    }

    // If not found, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
        if (user) userType = 'admin';
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    // Check permission
    const userEmail = (req.user.email || "").toLowerCase();
    const positionCreatorEmail = (position.clientspoc || "").toLowerCase();
    const isOwner = positionCreatorEmail === userEmail;
    const isAdmin = userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to modify this position"
      });
    }

    // Determine new status
    const newStatus = action === 'pause' ? 'paused' : 'active';

    // Build update payload — record reactivatedAt when going active
    const statusUpdate = {
      status: newStatus,
      statusChangedAt: new Date(),
      statusChangedBy: userEmail,
      ...(newStatus === 'active' ? { reactivatedAt: new Date() } : {}),
    };

    // Update position status
    const updatedPosition = await ad_Pos.updatePositionById(id, statusUpdate);

    const pos_id = position.pos_id;
    const positionTitle = position.position || 'Position';
    const clientName = position.client || '';

    // On reactivation: restore expired access records and notify assigned users
    if (newStatus === 'active' && pos_id) {
      const frontUrl = process.env.FRONTURL || 'https://www.recruiterv.com';
      const positionLink = `${frontUrl}/dash_view/${pos_id}`;
      const freshExpiry = new Date();
      freshExpiry.setDate(freshExpiry.getDate() + 30);

      const notifiedEmails = new Set();

      // Restore recruiter access records (approved + expired → re-approved)
      try {
        const accessSnap = await db.collection('position_access_requests')
          .where('positionId', '==', pos_id)
          .get();

        const batch = db.batch();
        accessSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'approved' || data.status === 'expired') {
            batch.update(doc.ref, {
              status: 'approved',
              expiresAt: freshExpiry,
              updatedAt: new Date()
            });
            if (data.recruiterEmail) notifiedEmails.add(data.recruiterEmail.toLowerCase());
          }
        });
        await batch.commit();
      } catch (e) {
        console.error('Failed to restore recruiter access records on reactivation:', e.message);
      }

      // Collect coach/expert emails from approved direct requests
      try {
        const ceSnap = await db.collection('coach_expert_direct_requests')
          .where('positionId', '==', pos_id)
          .where('status', '==', 'approved')
          .get();
        ceSnap.docs.forEach(doc => {
          const email = doc.data().coachExpertEmail;
          if (email) notifiedEmails.add(email.toLowerCase());
        });
      } catch (e) {
        console.error('Failed to fetch coach/expert emails on reactivation:', e.message);
      }

      // Send reactivation email to each unique assigned user
      const emailHtml = (recipientEmail) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px;">
          <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Position Reactivated</h1>
          </div>
          <div style="background:#fff;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
            <p style="color:#374151;font-size:15px;">Hello,</p>
            <p style="color:#374151;font-size:15px;">
              Good news! The position you are assigned to has been <strong style="color:#16a34a;">reactivated</strong> and is now accepting candidates again.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f3f4f6;border-radius:8px;">
              <tr><td style="padding:10px 14px;font-weight:bold;color:#374151;width:40%;">Position</td><td style="padding:10px 14px;color:#1d4ed8;">${positionTitle}</td></tr>
              ${clientName ? `<tr style="background:#fff;"><td style="padding:10px 14px;font-weight:bold;color:#374151;">Client</td><td style="padding:10px 14px;color:#374151;">${clientName}</td></tr>` : ''}
            </table>
            <div style="text-align:center;margin:28px 0;">
              <a href="${positionLink}" style="background:#2563eb;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
                View Position &amp; Submit Candidates
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;text-align:center;">
              Your access has been refreshed. You can log in and start submitting candidates immediately.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#6b7280;font-size:13px;text-align:center;">Best regards,<br><strong>RecruiterV Team</strong></p>
          </div>
        </div>`;

      for (const email of notifiedEmails) {
        try {
          await sendEmail(
            email,
            `Position Reactivated: ${positionTitle}${clientName ? ` — ${clientName}` : ''}`,
            emailHtml(email),
            'noreply@recruiterv.com',
            'RecruiterV'
          );
        } catch (e) {
          console.error(`Failed to send reactivation email to ${email}:`, e.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: newStatus === 'paused'
        ? "Position paused successfully. It will no longer be visible to recruiters."
        : "Position activated successfully. Recruiters can now see this position.",
      data: {
        id: updatedPosition.id,
        pos_id: updatedPosition.pos_id,
        position: updatedPosition.position,
        status: newStatus
      }
    });

  } catch (err) {
    console.error("Error pausing/unpausing position:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update position status",
      error: err.message
    });
  }
});

/**
 * POST /pos/copy/:id
 * Create a copy of an existing position with a new position ID
 */
router.post('/pos/copy/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the original position
    const position = await ad_Pos.findPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Check if user has permission (owner or admin)
    let user = null;
    let userType = null;

    // Try to find user in clientspoc collection
    try {
      user = await clientspoc.findClientSpocByEmail(req.user.email);
      if (user) userType = 'clientspoc';
    } catch (err) {
      console.log("User not found in clientspoc collection");
    }

    // If not found, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
        if (user) userType = 'admin';
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    // Check permission
    const userEmail = (req.user.email || "").toLowerCase();
    const positionCreatorEmail = (position.clientspoc || "").toLowerCase();
    const isOwner = positionCreatorEmail === userEmail;
    const isAdmin = userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to copy this position"
      });
    }

    // Get new position ID
    const newPosId = await ad_Pos.getCurrentPositionId();

    // Create copy of position data (exclude id, created fields)
    const positionData = {
      position: position.position,
      client: position.client,
      hr_name: position.hr_name,
      ctcStart: position.ctcStart,
      ctcEnd: position.ctcEnd,
      state: position.state || [],
      location: position.location || [],
      job_desc: position.job_desc,
      experience: position.experience,
      commison: position.commison,
      commission_type: position.commission_type || '',
      position_tier: position.position_tier || '',
      client_questions: Array.isArray(position.client_questions) ? position.client_questions : [],
      pos_cat: position.pos_cat || 'General',
      comp_view: position.comp_view,
      m_have: position.m_have,
      g_have: position.g_have,
      compet: position.compet,
      key_res: position.key_res,
      clientspoc: position.clientspoc,
      clientspoc_name: position.clientspoc_name,
      pos_id: newPosId.toString(),
      datePosted: new Date(),
      status: 'active',
      isCopy: true,
      copiedFromPosId: position.pos_id
    };

    // Add the new position
    const newPosRef = await ad_Pos.add(positionData);
    const newPosDoc = await newPosRef.get();

    res.status(201).json({
      success: true,
      message: "Position copied successfully",
      data: {
        id: newPosDoc.id,
        pos_id: newPosDoc.data().pos_id,
        position: newPosDoc.data().position,
        client: newPosDoc.data().client,
        originalPositionId: position.pos_id
      }
    });

  } catch (err) {
    console.error("Error copying position:", err);
    res.status(500).json({
      success: false,
      message: "Failed to copy position",
      error: err.message
    });
  }
});

/**
 * PUT /pos/modify/:id
 * Modify position details
 */
router.put('/pos/modify/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the position
    const position = await ad_Pos.findPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Check if user has permission (owner or admin)
    let user = null;
    let userType = null;

    // Try to find user in clientspoc collection
    try {
      user = await clientspoc.findClientSpocByEmail(req.user.email);
      if (user) userType = 'clientspoc';
    } catch (err) {
      console.log("User not found in clientspoc collection");
    }

    // If not found, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
        if (user) userType = 'admin';
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    // Check permission
    const userEmail = (req.user.email || "").toLowerCase();
    const positionCreatorEmail = (position.clientspoc || "").toLowerCase();
    const isOwner = positionCreatorEmail === userEmail;
    const isAdmin = userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to modify this position"
      });
    }

    // Fields that cannot be modified
    const protectedFields = ['pos_id', 'clientspoc', 'datePosted', 'isCopy', 'copiedFromPosId'];
    protectedFields.forEach(field => {
      delete updateData[field];
    });

    // Add modification metadata
    updateData.modifiedAt = new Date();
    updateData.modifiedBy = userEmail;

    // Update the position
    const updatedPosition = await ad_Pos.updatePositionById(id, updateData);

    res.status(200).json({
      success: true,
      message: "Position updated successfully",
      data: {
        id: updatedPosition.id,
        pos_id: updatedPosition.pos_id,
        position: updatedPosition.position,
        client: updatedPosition.client
      }
    });

  } catch (err) {
    console.error("Error modifying position:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update position",
      error: err.message
    });
  }
});

/**
 * DELETE /pos/delete/:id
 * Delete a position (already exists, but ensure it checks ownership)
 * Note: Using the existing delete endpoint which already has ownership checks
 */


// ==================== CLIENT STATISTICS ROUTES ====================

/**
 * GET /admin/clientstats
 * Get client statistics with detailed breakdown
 * Query params: ?spocName=email&recruiterName=name&status=pending&clientName=Company
 */
router.get('/clientstats', authMiddleware, async (req, res) => {
  try {
    const { spocName, recruiterName, status, clientName } = req.query;

    const filters = {
      spocName: spocName || null,
      recruiterName: recruiterName || null,
      status: status || null,
      clientName: clientName || null
    };

    const stats = await ad_Pos.getClientStats(filters);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error("Error fetching client stats:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/**
 * GET /admin/clientstats/filters/spocs
 * Get all SPOCs for filter dropdown
 */
router.get('/clientstats/filters/spocs', authMiddleware, async (req, res) => {
  try {
    const spocs = await ad_Pos.getAllSpocs();

    res.status(200).json({
      success: true,
      data: spocs
    });

  } catch (err) {
    console.error("Error fetching SPOCs:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/**
 * GET /admin/clientstats/filters/recruiters
 * Get all recruiter names for filter dropdown
 */
router.get('/clientstats/filters/recruiters', authMiddleware, async (req, res) => {
  try {
    const recruiters = await ad_Pos.getAllRecruiterNames();

    res.status(200).json({
      success: true,
      data: recruiters
    });

  } catch (err) {
    console.error("Error fetching recruiter names:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/**
 * GET /admin/clientstats/filters/clients
 * Get all client names for filter dropdown
 */
router.get('/clientstats/filters/clients', authMiddleware, async (req, res) => {
  try {
    const clients = await ad_Pos.getAllClientNames();

    res.status(200).json({
      success: true,
      data: clients
    });

  } catch (err) {
    console.error("Error fetching client names:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==================== ASSIGN POSITION ROUTE ====================

/**
 * POST /candidate/pos/assign/:pos_id
 * Request assignment to a position
 * Creates an assign request to ClientSPOC for approval
 * Multiple recruiters can work on the same position after approval
 */
router.post('/pos/assign/:pos_id', authMiddleware, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const { message } = req.body;
    const recruiterEmail = (req.user.email || "").toLowerCase();

    // Validate position ID
    if (!pos_id) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Find the position
    const position = await ad_Pos.findPositionByPosId(pos_id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Get recruiter details
    let user = null;
    let userType = null;
    
    try {
      user = await recruiter.findRecruiterByEmail(req.user.email);
      if (user) {
        userType = 'recruiter';
      }
    } catch (err) {
      console.log("User not found in recruiter collection");
    }

    // If not found in recruiter, try admin collection
    if (!user) {
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
        if (user) {
          userType = 'admin';
        }
      } catch (err) {
        console.log("User not found in admin collection");
      }
    }

    // If still not found, return error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please ensure you are logged in."
      });
    }

    // Note: assigning a position is unrestricted. The free-plan limit of 4 positions
    // only counts positions that actually have an active candidate, so it is enforced
    // at candidate submission time (see /addit/data/candi), not here.

    // Create assign request (access is granted immediately — no approval needed)
    const assignRequest = await positionAccess.createAssignRequest(
      user.id,
      recruiterEmail,
      pos_id,
      message
    );

    // Send notification to ClientSPOC if request is pending
    if (assignRequest.status === "pending") {
      try {
        const recruiterName = user.name || user.firstName || req.user.email.split('@')[0];
        
        await notificationModel.notifyClientSpocAssignRequestReceived({
          clientspocEmail: position.clientspoc,
          positionId: pos_id,
          positionTitle: position.position,
          clientName: position.client,
          recruiterName: recruiterName,
          recruiterEmail: recruiterEmail,
          message: message
        });
        
        console.log(`✅ Assign request notification sent to ClientSPOC ${position.clientspoc}`);
      } catch (notificationError) {
        console.error("❌ Error sending assign request notification:", notificationError);
        // Don't fail the main request if notification fails
      }
    }

    // Different response messages based on status
    if (assignRequest.status === "approved") {
      res.status(200).json({
        success: true,
        message: "You have been granted access to work on this position!",
        data: {
          assignmentId: assignRequest.requestId,
          pos_id: pos_id,
          position: position.position,
          status: "approved"
        }
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Assignment request sent to ClientSPOC for approval",
        data: {
          requestId: assignRequest.requestId,
          pos_id: pos_id,
          position: position.position,
          status: "pending"
        }
      });
    }

  } catch (err) {
    console.error("Error creating assign request:", err);
    
    // Handle specific errors
    if (err.message.includes("already have")) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create assign request",
      error: err.message
    });
  }
});

/**
 * GET /candidate/pos/assign/check/:pos_id
 * Check assignment/request status for a position
 */
router.get('/pos/assign/check/:pos_id', authMiddleware, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const recruiterEmail = (req.user.email || "").toLowerCase();

    if (!pos_id) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Check if recruiter can submit for this position
    const accessCheck = await positionAccess.canRecruiterSubmitForPosition(recruiterEmail, pos_id);

    res.status(200).json({
      success: true,
      data: accessCheck
    });

  } catch (err) {
    console.error("Error checking assignment:", err);
    res.status(500).json({
      success: false,
      message: "Failed to check assignment",
      error: err.message
    });
  }
});

/**
 * GET /candidate/pos/assign/my-assignments
 * Get all positions the recruiter can work on (approved assignments)
 */
router.get('/pos/assign/my-assignments', authMiddleware, async (req, res) => {
  try {
    const recruiterEmail = (req.user.email || "").toLowerCase();

    // Get all approved assignments
    const assignments = await positionAccess.getRecruiterAssignments(recruiterEmail);

    res.status(200).json({
      success: true,
      assignments,
      count: assignments.length
    });

  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
      error: err.message
    });
  }
});

// ==================== CANDIDATE STATUS UPDATE ROUTES ====================

/**
 * PUT /candidate/pos/:pos_id/candidate/:candidateId/status
 * Update candidate status (used by ClientSPOC dashboard)
 */
router.put('/candidate/pos/:pos_id/candidate/:candidateId/status', authMiddleware, async (req, res) => {
  try {
    const { pos_id, candidateId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID is required"
      });
    }

    // Validate status is one of the allowed options
    const validStatuses = [
      // Original statuses
      'Screen Reject', 'CV Feedback Pending', 'Submitted', 'L1 To be Schedule', 'L1 Scheduled',
      'L1 Feedback Pending', 'L1 Reject', 'L2 To be Schedule', 'L2 Scheduled', 'L2 Feedback Pending',
      'L2 Reject', 'L3 To be Schedule', 'L3 Scheduled', 'L3 Feedback Pending', 'L3 Reject',
      'HR To be Schedule', 'HR Scheduled', 'HR Feedback Pending', 'HR Reject',
      'Background Verification Pending', 'Background Verification Reject', 'Negotiation Scheduled',
      'Negotiation Reject', 'To Be Offered', 'Offer Declined', 'Offer Accepted', 'Joining',
      // NEW status options
      'Test Assigned', 'Test Select', 'Test Reject', 'Client Drop', 'Candidate Drop', 'Duplicate'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${validStatuses.join(', ')}`
      });
    }

    // Find the candidate
    const candidateDoc = await getCandidateDb().doc(candidateId).get();
    
    if (!candidateDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const candidateData = candidateDoc.data();
    
    // Verify the candidate belongs to the specified position
    if (candidateData.pos_id !== pos_id) {
      return res.status(400).json({
        success: false,
        message: "Candidate does not belong to the specified position"
      });
    }

    // Update the candidate status (record who changed it)
    const changedByEmail = req.user?.email || '';
    const changedByName = req.user?.name || (changedByEmail ? changedByEmail.split('@')[0] : '');
    await getCandidateDb().doc(candidateId).update({
      statusa: status,
      statusaDate: new Date(),
      statusChangedAt: new Date(),
      ...(changedByEmail ? { statusChangedBy: changedByEmail } : {}),
      ...(changedByName ? { statusChangedByName: changedByName } : {}),
      updatedAt: new Date()
    });

    // Update position visibility if needed
    try {
      await ad_Pos.updatePositionVisibility(pos_id);
    } catch (visibilityError) {
      console.error("Error updating position visibility:", visibilityError);
      // Don't fail the main request if visibility update fails
    }

    res.status(200).json({
      success: true,
      message: "Candidate status updated successfully",
      data: {
        id: candidateId,
        pos_id: pos_id,
        candidateName: candidateData.candidate || candidateData.name,
        newStatus: status,
        isRejection: REJECTION_STATUSES.includes(status)
      }
    });

  } catch (err) {
    console.error("Error updating candidate status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update candidate status",
      error: err.message
    });
  }
});

/**
 * PUT /candidate/pos/:pos_id/candidate/:candidateId/duplicate
 * Mark candidate as duplicate (excluded from counts)
 */
router.put('/candidate/pos/:pos_id/candidate/:candidateId/duplicate', authMiddleware, async (req, res) => {
  try {
    const { pos_id, candidateId } = req.params;
    const { reason } = req.body; // Optional reason for marking as duplicate

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID is required"
      });
    }

    // Find the candidate
    const candidateDoc = await getCandidateDb().doc(candidateId).get();
    
    if (!candidateDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const candidateData = candidateDoc.data();
    
    // Verify the candidate belongs to the specified position
    if (candidateData.pos_id !== pos_id) {
      return res.status(400).json({
        success: false,
        message: "Candidate does not belong to the specified position"
      });
    }

    // Update the candidate as Duplicate
    await getCandidateDb().doc(candidateId).update({
      statusa: 'Duplicate',
      statusaDate: new Date(),
      updatedAt: new Date(),
      duplicateReason: reason || 'Marked as duplicate',
      duplicateMarkedBy: req.user.email,
      duplicateMarkedAt: new Date()
    });

    // Update position visibility
    try {
      await ad_Pos.updatePositionVisibility(pos_id);
    } catch (visibilityError) {
      console.error("Error updating position visibility:", visibilityError);
    }

    res.status(200).json({
      success: true,
      message: "Candidate marked as duplicate",
      data: {
        id: candidateId,
        pos_id: pos_id,
        candidateName: candidateData.candidate || candidateData.name,
        isDuplicate: true
      }
    });

  } catch (err) {
    console.error("Error marking candidate as duplicate:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark candidate as duplicate",
      error: err.message
    });
  }
});

// Public endpoint — returns all skill category parent names
router.get('/skill-categories', async (req, res) => {
  try {
    const snap = await db.collection('skill_categories').get();
    const parents = snap.docs
      .map(d => d.data().parent)
      .filter(Boolean)
      .sort();
    return res.json({ success: true, categories: parents });
  } catch (err) {
    console.error('skill-categories fetch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Returns full skill category data: parent + flat list of specialization names
// children can be strings OR objects {name, subChildren[]}
router.get('/skill-categories-full', async (req, res) => {
  try {
    const snap = await db.collection('skill_categories').get();
    const categories = snap.docs
      .filter(d => d.data().parent)
      .map(d => {
        const raw = d.data().children || [];
        const specializations = [];
        raw.forEach(c => {
          if (typeof c === 'string' && c.trim()) {
            specializations.push(c.trim());
          } else if (c && typeof c === 'object') {
            if (c.name && typeof c.name === 'string') specializations.push(c.name.trim());
            (c.subChildren || []).forEach(s => {
              if (typeof s === 'string' && s.trim()) specializations.push(s.trim());
            });
          }
        });
        return { parent: d.data().parent, children: [...new Set(specializations)] };
      })
      .sort((a, b) => a.parent.localeCompare(b.parent));
    return res.json({ success: true, categories });
  } catch (err) {
    console.error('skill-categories-full fetch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /skill-categories-hierarchical — 3-level tree: parent → [{name, subChildren[]}]
router.get('/skill-categories-hierarchical', async (req, res) => {
  try {
    const snap = await db.collection('skill_categories').get();
    const categories = snap.docs
      .filter(d => d.data().parent)
      .map(d => {
        const raw = d.data().children || [];
        const children = raw.map(c => {
          if (typeof c === 'string' && c.trim()) {
            return { name: c.trim(), subChildren: [] };
          } else if (c && typeof c === 'object' && c.name) {
            return {
              name: c.name.trim(),
              subChildren: (c.subChildren || [])
                .filter(s => typeof s === 'string' && s.trim())
                .map(s => s.trim()),
            };
          }
          return null;
        }).filter(Boolean);
        return { parent: d.data().parent, children };
      })
      .sort((a, b) => a.parent.localeCompare(b.parent));
    return res.json({ success: true, categories });
  } catch (err) {
    console.error('skill-categories-hierarchical fetch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports=router;
