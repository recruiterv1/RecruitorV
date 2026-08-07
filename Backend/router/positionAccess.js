const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const positionAccess = require('../model_fire/positionAccessF');
const recruiterModel = require('../model_fire/recruiterF');
const clientspocModel = require('../model_fire/clientspocF');
const notificationModel = require('../model_fire/notificationF');
const ad_Pos = require('../model_fire/adminF');
const { sendPushToEmails } = require('../utils/push');

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

/**
 * POST /api/position-access/request
 * Create a new position access request
 */
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { positionId } = req.body;
    const userEmail = req.user.email;

    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Try to find user in recruiter collection first
    let user = await recruiterModel.findRecruiterByEmail(userEmail);
    
    // If not found in recruiter collection, try clientspoc (admin_db) collection
    if (!user) {
      user = await clientspocModel.findClientSpocByEmail(userEmail);
    }
    
    // If still not found, return error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please ensure you are logged in."
      });
    }

    // Note: requesting/assigning a position is unrestricted. The free-plan limit of 4
    // only counts positions that have an active candidate, so it is enforced at
    // candidate submission time (see /addit/data/candi), not here.
    // (30-day expiry removed; access is auto-approved — no ClientSPOC approval.)

    // Create the request
    const result = await positionAccess.createAccessRequest(
      user.id,
      userEmail,
      positionId
    );

    // 🔔 Send notification to ClientSPOC about new access request
    try {
      // Get position details to find the ClientSPOC
      const position = await ad_Pos.findPositionByPosId(positionId);
      
      if (position && position.clientspoc) {
        // Get recruiter name
        const recruiterName = user.name || user.firstName || userEmail.split('@')[0];
        
        // Send notification to ClientSPOC
        await notificationModel.notifyClientSpocAccessRequestReceived({
          clientspocEmail: position.clientspoc,
          positionId: positionId,
          positionTitle: position.position,
          clientName: position.client,
          recruiterName: recruiterName,
          recruiterEmail: userEmail
        });
        
        console.log(`✅ Notification sent to ClientSPOC ${position.clientspoc} about new access request from ${userEmail}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending notification to ClientSPOC:", notificationError);
      // Don't fail the main request if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Access request created successfully",
      data: result
    });

  } catch (error) {
    console.error("Error creating access request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create access request"
    });
  }
});

/**
 * GET /api/position-access/recruiter
 * Get all requests for the logged-in recruiter
 */
router.get('/recruiter', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const requests = await positionAccess.getRecruiterRequests(userEmail);

    res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error("Error getting recruiter requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get requests"
    });
  }
});

/**
 * GET /api/position-access/recruiter/stats
 * Get access statistics for the logged-in recruiter
 */
router.get('/recruiter/stats', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const stats = await positionAccess.getRecruiterAccessStats(userEmail);

    // Try to find user in recruiter collection first
    let user = await recruiterModel.findRecruiterByEmail(userEmail);
    
    // If not found in recruiter collection, try clientspoc (admin_db) collection
    if (!user) {
      user = await clientspocModel.findClientSpocByEmail(userEmail);
    }
    
    // Set limits based on plan type. Free recruiters can work on max 4 positions,
    // where a "working" position has at least 1 active (non-rejected) candidate.
    const isFreePlan = user?.planType === 0;
    const maxPositions = isFreePlan ? 4 : 40;  // Free: 4, Paid: 40
    const maxApproved = isFreePlan ? 4 : 40;

    // Authoritative count used for the free-plan limit
    const { count: currentlyWorking } = await positionAccess.countActiveWorkingPositions(userEmail);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        maxPositions: maxPositions,
        maxApproved: maxApproved,
        currentlyWorking: currentlyWorking,
        // Expiry removed for free plan
        daysRemaining: null,
        planExpiryDate: null,
        isFreePlan: isFreePlan
      }
    });

  } catch (error) {
    console.error("Error getting recruiter stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get stats"
    });
  }
});

/**
 * GET /api/position-access/clientspoc
 * Get all requests for the logged-in ClientSPOC
 */
router.get('/clientspoc', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Verify user is ClientSPOC
    const clientspoc = await clientspocModel.findClientSpocByEmail(userEmail);
    
    if (!clientspoc) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only ClientSPOC can view these requests."
      });
    }

    const requests = await positionAccess.getClientSpocRequests(userEmail);

    res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error("Error getting ClientSPOC requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get requests"
    });
  }
});

/**
 * PUT /api/position-access/:requestId/status
 * Update request status (approve, waitlist, reject)
 */
router.put('/:requestId/status', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason } = req.body;
    const userEmail = req.user.email;

    if (!status || !['approved', 'waitlist', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved', 'waitlist', or 'rejected'"
      });
    }

    // Verify user is ClientSPOC
    const clientspoc = await clientspocModel.findClientSpocByEmail(userEmail);
    
    if (!clientspoc) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only ClientSPOC can update request status."
      });
    }

    const result = await positionAccess.updateRequestStatus(
      requestId,
      status,
      userEmail
    );

    // 🔔 Send notification to recruiter about status update
    try {
      // Get request details to find the recruiter
      const requestDetails = await positionAccess.getRequestById(requestId);
      
      if (requestDetails && requestDetails.recruiterEmail) {
        // Get position details
        let positionTitle = 'Unknown Position';
        let clientName = 'Unknown Client';
        
        if (requestDetails.positionId) {
          const position = await ad_Pos.findPositionByPosId(requestDetails.positionId);
          if (position) {
            positionTitle = position.position;
            clientName = position.client;
          }
        }

        // Send notification to recruiter
        await notificationModel.notifyRecruiterAccessRequestStatus({
          recruiterEmail: requestDetails.recruiterEmail,
          positionId: requestDetails.positionId,
          positionTitle: positionTitle,
          clientName: clientName,
          status: status === 'approved' ? 'accepted' : 'rejected',
          rejectionReason: rejectionReason
        });
        
        console.log(`✅ Notification sent to recruiter ${requestDetails.recruiterEmail} about ${status} request`);

        // 🔔 Push to the recruiter
        if (status === 'approved') {
          sendPushToEmails([requestDetails.recruiterEmail], {
            title: 'Request accepted',
            body: `Your access request for "${positionTitle}"${clientName ? ` · ${clientName}` : ''} was accepted.`,
            data: { type: 'access-approved', posId: requestDetails.positionId || '' },
          }).catch(() => {});
        }
      }
    } catch (notificationError) {
      console.error("❌ Error sending notification:", notificationError);
      // Don't fail the main request if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      data: result
    });

  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update request status"
    });
  }
});

/**
 * GET /api/position-access/check/:positionId
 * Check if recruiter has access to a position
 */
router.get('/check/:positionId', authMiddleware, async (req, res) => {
  try {
    const { positionId } = req.params;
    const userEmail = req.user.email;

    const accessCheck = await positionAccess.checkRecruiterAccess(userEmail, positionId);

    res.status(200).json({
      success: true,
      data: accessCheck
    });

  } catch (error) {
    console.error("Error checking access:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check access"
    });
  }
});

/**
 * DELETE /api/position-access/:requestId/close
 * Close/complete a position request
 */
router.delete('/:requestId/close', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userEmail = req.user.email;

    const result = await positionAccess.closePositionRequest(requestId, userEmail);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error("Error closing request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to close request"
    });
  }
});

/**
 * GET /api/position-access/my-positions
 * Get all assigned positions for the logged-in recruiter
 * Returns positions the recruiter can work on
 */
router.get('/my-positions', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Try to find user in recruiter collection first
    let user = await recruiterModel.findRecruiterByEmail(userEmail);
    
    // If not found in recruiter collection, try clientspoc (admin_db) collection
    if (!user) {
      user = await clientspocModel.findClientSpocByEmail(userEmail);
    }

    // Get all assignments (approved, non-expired)
    const assignments = await positionAccess.getRecruiterAssignments(userEmail);
    const assignmentCount = await positionAccess.getRecruiterAssignmentCount(userEmail);

    // Determine plan type and limits - Updated to 40 for paid plan
    const isFreePlan = user?.planType === 0;
    const maxPositions = isFreePlan ? 4 : 40;

    res.status(200).json({
      success: true,
      data: {
        assignments: assignments,
        count: assignments.length,
        totalAssigned: assignmentCount,
        maxPositions: maxPositions,
        isFreePlan: isFreePlan,
        positionsRemaining: Math.max(0, maxPositions - assignmentCount)
      }
    });

  } catch (error) {
    console.error("Error getting my positions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get positions"
    });
  }
});

/**
 * POST /api/position-access/release/:positionId
 * Release/leave a position assignment
 * Allows recruiter to free up a slot for a new position
 */
router.post('/release/:positionId', authMiddleware, async (req, res) => {
  try {
    const { positionId } = req.params;
    const userEmail = req.user.email;

    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    const result = await positionAccess.releasePositionAssignment(userEmail, positionId);

    res.status(200).json({
      success: true,
      message: "Position released successfully. You can now assign a new position.",
      data: result
    });

  } catch (error) {
    console.error("Error releasing position:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to release position"
    });
  }
});

/**
 * GET /api/position-access/recruiter/position-count
 * Get the current recruiter's position count with plan limits
 * Used to check if recruiter can request/assign new positions
 */
router.get('/recruiter/position-count', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Try to find user in recruiter collection first
    let user = await recruiterModel.findRecruiterByEmail(userEmail);
    
    // If not found in recruiter collection, try clientspoc (admin_db) collection
    if (!user) {
      user = await clientspocModel.findClientSpocByEmail(userEmail);
    }

    // Current count = positions the recruiter is actively working on
    // (≥1 active candidate, excluding released positions). No time-based expiry.
    const { count: currentCount } = await positionAccess.countActiveWorkingPositions(userEmail);

    const isFreePlan = user?.planType === 0;
    const maxPositions = isFreePlan ? 4 : 40;
    const remaining = Math.max(0, maxPositions - currentCount);

    res.status(200).json({
      success: true,
      data: {
        currentCount: currentCount,
        maxPositions: maxPositions,
        positionsRemaining: remaining,
        isFreePlan: isFreePlan,
        canAssignMore: currentCount < maxPositions
      }
    });

  } catch (error) {
    console.error("Error getting position count:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get position count"
    });
  }
});

/**
 * GET /api/position-access/:requestId
 * Get request details by ID
 */
router.get('/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await positionAccess.getRequestById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error("Error getting request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get request"
    });
  }
});

/**
 * POST /api/position-access/assign-request
 * Create a new position assignment request
 * Recruiter sends request to ClientSPOC to work on a position
 */
router.post('/assign-request', authMiddleware, async (req, res) => {
  try {
    const { positionId, message } = req.body;
    const userEmail = req.user.email;

    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Try to find user in recruiter collection first
    let user = await recruiterModel.findRecruiterByEmail(userEmail);
    
    // If not found in recruiter collection, try clientspoc (admin_db) collection
    if (!user) {
      user = await clientspocModel.findClientSpocByEmail(userEmail);
    }
    
    // If still not found, return error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please ensure you are logged in."
      });
    }

    // Create the assign request
    const result = await positionAccess.createAssignRequest(
      user.id,
      userEmail,
      positionId,
      message
    );

    // 🔔 Send notification to ClientSPOC about new assign request
    try {
      // Get position details to find the ClientSPOC
      const pos = await ad_Pos.findPositionByPosId(positionId);
      
      if (pos && pos.clientspoc) {
        // Get recruiter name
        const recruiterName = user.name || user.firstName || userEmail.split('@')[0];
        
        // Send notification to ClientSPOC
        await notificationModel.notifyClientSpocAssignRequestReceived({
          clientspocEmail: pos.clientspoc,
          positionId: positionId,
          positionTitle: pos.position,
          clientName: pos.client,
          recruiterName: recruiterName,
          recruiterEmail: userEmail,
          message: message
        });
        
        console.log(`✅ Assign request notification sent to ClientSPOC ${pos.clientspoc} from ${userEmail}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending assign request notification:", notificationError);
      // Don't fail the main request if notification fails
    }

    // Different messages based on status
    const responseMessage = result.status === "approved" 
      ? "You have been granted access to work on this position!"
      : "Assignment request sent to ClientSPOC for approval";

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        requestId: result.requestId,
        positionId: positionId,
        status: result.status
      }
    });

  } catch (error) {
    console.error("Error creating assign request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create assign request"
    });
  }
});

/**
 * GET /api/position-access/assign-requests
 * Get all assignment requests for the logged-in recruiter
 */
router.get('/assign-requests', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const requests = await positionAccess.getRecruiterAssignRequests(userEmail);

    // Group by status for easier frontend processing
    const grouped = {
      pending: requests.filter(r => r.status === "pending"),
      approved: requests.filter(r => r.status === "approved"),
      rejected: requests.filter(r => r.status === "rejected"),
      cancelled: requests.filter(r => r.status === "cancelled")
    };

    res.status(200).json({
      success: true,
      data: {
        all: requests,
        pending: grouped.pending,
        approved: grouped.approved,
        rejected: grouped.rejected,
        cancelled: grouped.cancelled,
        counts: {
          total: requests.length,
          pending: grouped.pending.length,
          approved: grouped.approved.length,
          rejected: grouped.rejected.length
        }
      }
    });

  } catch (error) {
    console.error("Error getting assign requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get assign requests"
    });
  }
});

/**
 * PUT /api/position-access/assign-requests/:requestId/status
 * Update assign request status (approve/reject) - ClientSPOC only
 */
router.put('/assign-requests/:requestId/status', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reason } = req.body;
    const userEmail = req.user.email;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'"
      });
    }

    // Verify user is ClientSPOC
    const clientspoc = await clientspocModel.findClientSpocByEmail(userEmail);
    
    if (!clientspoc) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only ClientSPOC can update assign request status."
      });
    }

    const result = await positionAccess.updateAssignRequestStatus(
      requestId,
      status,
      userEmail,
      reason
    );

    // 🔔 Send notification to recruiter about status update
    try {
      // Get request details
      const requestDetails = await positionAccess.getRequestById(requestId);
      
      if (requestDetails && requestDetails.recruiterEmail) {
        // Get position details
        let positionTitle = 'Unknown Position';
        let clientName = 'Unknown Client';
        
        if (requestDetails.positionId) {
          const pos = await ad_Pos.findPositionByPosId(requestDetails.positionId);
          if (pos) {
            positionTitle = pos.position;
            clientName = pos.client;
          }
        }

        // Send notification to recruiter
        await notificationModel.notifyRecruiterAssignRequestStatus({
          recruiterEmail: requestDetails.recruiterEmail,
          positionId: requestDetails.positionId,
          positionTitle: positionTitle,
          clientName: clientName,
          status: status === 'approved' ? 'approved' : 'rejected',
          reason: reason
        });
        
        console.log(`✅ Assign request status notification sent to ${requestDetails.recruiterEmail}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending assign request status notification:", notificationError);
      // Don't fail the main request if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      data: result
    });

  } catch (error) {
    console.error("Error updating assign request status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update assign request status"
    });
  }
});

/**
 * GET /api/position-access/assign-requests/for-clientspoc
 * Get all assignment requests for the logged-in ClientSPOC
 */
router.get('/assign-requests/for-clientspoc', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Verify user is ClientSPOC
    const clientspoc = await clientspocModel.findClientSpocByEmail(userEmail);
    
    if (!clientspoc) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only ClientSPOC can view these requests."
      });
    }

    const requests = await positionAccess.getClientSpocAssignRequests(userEmail);

    // Group by status
    const grouped = {
      pending: requests.filter(r => r.status === "pending"),
      approved: requests.filter(r => r.status === "approved"),
      rejected: requests.filter(r => r.status === "rejected")
    };

    res.status(200).json({
      success: true,
      data: {
        all: requests,
        pending: grouped.pending,
        approved: grouped.approved,
        rejected: grouped.rejected,
        counts: {
          total: requests.length,
          pending: grouped.pending.length,
          approved: grouped.approved.length,
          rejected: grouped.rejected.length
        }
      }
    });

  } catch (error) {
    console.error("Error getting ClientSPOC assign requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get assign requests"
    });
  }
});

/**
 * DELETE /api/position-access/assign-requests/:requestId/cancel
 * Cancel an assignment request (recruiter only)
 */
router.delete('/assign-requests/:requestId/cancel', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userEmail = req.user.email;

    const result = await positionAccess.cancelAssignRequest(requestId, userEmail);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error("Error cancelling assign request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel assign request"
    });
  }
});

/**
 * GET /api/position-access/assign-requests/position/:positionId/assignees
 * Get all approved assignees for a position
 */
router.get('/assign-requests/position/:positionId/assignees', authMiddleware, async (req, res) => {
  try {
    const { positionId } = req.params;

    const assignees = await positionAccess.getPositionAssignees(positionId);

    res.status(200).json({
      success: true,
      data: {
        positionId: positionId,
        assignees: assignees,
        count: assignees.length
      }
    });

  } catch (error) {
    console.error("Error getting position assignees:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get position assignees"
    });
  }
});

/**
 * GET /api/position-access/can-submit/:positionId
 * Check if recruiter can submit candidates for a position
 */
router.get('/can-submit/:positionId', authMiddleware, async (req, res) => {
  try {
    const { positionId } = req.params;
    const userEmail = req.user.email;

    const accessCheck = await positionAccess.canRecruiterSubmitForPosition(userEmail, positionId);

    res.status(200).json({
      success: true,
      data: accessCheck
    });

  } catch (error) {
    console.error("Error checking submission access:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check submission access"
    });
  }
});

module.exports = router;
