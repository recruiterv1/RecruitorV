const { db } = require("../router/firebase_ad");
const positionAccessRequests = db.collection("position_access_requests");
const recruiterDb = db.collection("recruiter_db");
const adminPosDb = db.collection("admin_AddPos");

/**
 * Create a new position access request
 */
const createAccessRequest = async (recruiterId, recruiterEmail, positionId) => {
  try {
    // Check if request already exists
    const existingRequest = await positionAccessRequests
      .where("recruiterEmail", "==", recruiterEmail)
      .where("positionId", "==", positionId)
      .where("status", "in", ["pending", "approved", "waitlist"])
      .get();

    if (!existingRequest.empty) {
      const existingStatus = existingRequest.docs[0].data().status;
      throw new Error(`You already have a ${existingStatus} request for this position`);
    }

    // Get position details
    const positionSnap = await adminPosDb.where("pos_id", "==", positionId).limit(1).get();
    if (positionSnap.empty) {
      throw new Error("Position not found");
    }
    const position = positionSnap.docs[0].data();

    // Get recruiter details
    const recruiterSnap = await recruiterDb.where("email", "==", recruiterEmail).limit(1).get();
    if (recruiterSnap.empty) {
      throw new Error("Recruiter not found");
    }
    const recruiter = recruiterSnap.docs[0].data();

    // Note: Plan limit checks are now handled in the router (positionAccess.js)
    // The router passes different limits based on planType
    // Free plan: max 4 requests, max 2 approved
    // Paid plan: max 20 requests, max 10 approved

    // Check if plan has expired (only for free plan)
    const isFreePlan = recruiter.planType === 0;
    if (isFreePlan) {
      const now = new Date();
      const expiryDate = recruiter.planExpiryDate?.toDate ? recruiter.planExpiryDate.toDate() : 
                        (recruiter.planExpiryDate ? new Date(recruiter.planExpiryDate) : null);
      
      if (expiryDate && now > expiryDate) {
        throw new Error("Your free plan has expired. Please upgrade to continue.");
      }
    }

    // Check if user is the position owner (clientspoc)
    const isPositionOwner = position.clientspoc && 
                            position.clientspoc.toLowerCase() === recruiterEmail.toLowerCase();

    // Auto-approve if user is the position owner
    const initialStatus = isPositionOwner ? "approved" : "pending";
    const initialRespondedAt = isPositionOwner ? new Date() : null;
    const initialRespondedBy = isPositionOwner ? recruiterEmail : null;
    let initialExpiresAt = null;
    if (isPositionOwner) {
      const expiryDateCalc = new Date();
      expiryDateCalc.setDate(expiryDateCalc.getDate() + 30);
      initialExpiresAt = expiryDateCalc;
    }

    // Create request
    const requestData = {
      recruiterId: recruiterId || recruiterEmail,
      recruiterEmail: recruiterEmail,
      recruiterName: recruiter.firstName || recruiter.name || recruiterEmail.split('@')[0],
      positionId: positionId,
      positionTitle: position.position,
      client: position.client,
      clientspoc: position.clientspoc,
      status: initialStatus,
      requestedAt: new Date(),
      respondedAt: initialRespondedAt,
      respondedBy: initialRespondedBy,
      expiresAt: initialExpiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await positionAccessRequests.add(requestData);
    
    return {
      success: true,
      requestId: docRef.id,
      ...requestData
    };

  } catch (error) {
    console.error("Error creating access request:", error);
    throw error;
  }
};

/**
 * Get all requests for a recruiter
 */
const getRecruiterRequests = async (recruiterEmail) => {
  try {
    let snapshot;
    
    try {
      // Try with orderBy first
      snapshot = await positionAccessRequests
        .where("recruiterEmail", "==", recruiterEmail)
        .orderBy("requestedAt", "desc")
        .get();
    } catch (indexError) {
      // If index doesn't exist, fetch without orderBy and sort in memory
      console.log("Firestore index not found, sorting in memory:", indexError.message);
      snapshot = await positionAccessRequests
        .where("recruiterEmail", "==", recruiterEmail)
        .get();
    }

    let requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate ? doc.data().requestedAt.toDate() : doc.data().requestedAt,
      respondedAt: doc.data().respondedAt?.toDate ? doc.data().respondedAt.toDate() : doc.data().respondedAt,
      expiresAt: doc.data().expiresAt?.toDate ? doc.data().expiresAt.toDate() : doc.data().expiresAt
    }));

    // Sort in memory if we couldn't use orderBy
    requests.sort((a, b) => {
      const dateA = a.requestedAt ? new Date(a.requestedAt) : new Date(0);
      const dateB = b.requestedAt ? new Date(b.requestedAt) : new Date(0);
      return dateB - dateA; // desc order
    });

    return requests;
  } catch (error) {
    console.error("Error getting recruiter requests:", error);
    throw error;
  }
};

/**
 * Get all requests for a ClientSPOC
 */
const getClientSpocRequests = async (clientspocEmail) => {
  try {
    const normalizedEmail = clientspocEmail.toLowerCase();
    let allRequests = [];
    
    // Primary query: Get requests where clientspoc field matches
    try {
      const snapshot = await positionAccessRequests
        .where("clientspoc", "==", normalizedEmail)
        .orderBy("requestedAt", "desc")
        .get();
      
      snapshot.docs.forEach(doc => {
        allRequests.push({
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate ? doc.data().requestedAt.toDate() : doc.data().requestedAt,
          respondedAt: doc.data().respondedAt?.toDate ? doc.data().respondedAt.toDate() : doc.data().respondedAt,
          expiresAt: doc.data().expiresAt?.toDate ? doc.data().expiresAt.toDate() : doc.data().expiresAt
        });
      });
    } catch (indexError) {
      console.log("Primary index not found, using fallback query");
      const snapshot = await positionAccessRequests
        .where("clientspoc", "==", normalizedEmail)
        .get();
      
      snapshot.docs.forEach(doc => {
        allRequests.push({
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate ? doc.data().requestedAt.toDate() : doc.data().requestedAt,
          respondedAt: doc.data().respondedAt?.toDate ? doc.data().respondedAt.toDate() : doc.data().respondedAt,
          expiresAt: doc.data().expiresAt?.toDate ? doc.data().expiresAt.toDate() : doc.data().expiresAt
        });
      });
    }

    // If no requests found via clientspoc field, try a fallback approach
    // This handles cases where clientspoc field might be empty but the position was created by this SPOC
    if (allRequests.length === 0) {
      console.log("No requests found via clientspoc field, checking all requests for positions owned by this SPOC");
      
      // Get all requests
      const allSnapshot = await positionAccessRequests.get();
      
      for (const doc of allSnapshot.docs) {
        const data = doc.data();
        
        // Check if the request's positionId belongs to a position created by this SPOC
        try {
          const positionSnap = await adminPosDb.where("pos_id", "==", data.positionId).limit(1).get();
          if (!positionSnap.empty) {
            const positionData = positionSnap.docs[0].data();
            if (positionData.clientspoc && positionData.clientspoc.toLowerCase() === normalizedEmail) {
              allRequests.push({
                id: doc.id,
                ...data,
                requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : data.requestedAt,
                respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : data.respondedAt,
                expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
              });
            }
          }
        } catch (posError) {
          console.warn("Error checking position for request:", posError.message);
        }
      }
    }

    // Remove duplicates based on request ID
    const uniqueRequests = allRequests.reduce((acc, curr) => {
      if (!acc.find(r => r.id === curr.id)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Sort by requested date (descending)
    uniqueRequests.sort((a, b) => {
      const dateA = a.requestedAt ? new Date(a.requestedAt) : new Date(0);
      const dateB = b.requestedAt ? new Date(b.requestedAt) : new Date(0);
      return dateB - dateA;
    });

    console.log(`Found ${uniqueRequests.length} requests for ClientSPOC: ${clientspocEmail}`);
    return uniqueRequests;
  } catch (error) {
    console.error("Error getting ClientSPOC requests:", error);
    throw error;
  }
};

/**
 * Update request status (approve, waitlist, reject)
 */
const updateRequestStatus = async (requestId, status, clientspocEmail) => {
  try {
    const docRef = positionAccessRequests.doc(requestId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Request not found");
    }

    const requestData = doc.data();

    // Verify ClientSPOC owns this position
    if (requestData.clientspoc.toLowerCase() !== clientspocEmail.toLowerCase()) {
      throw new Error("You don't have permission to update this request");
    }

    const updateData = {
      status: status,
      respondedAt: new Date(),
      respondedBy: clientspocEmail,
      updatedAt: new Date()
    };

    // If approving, set expiry date (30 days from now)
    if (status === "approved") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      updateData.expiresAt = expiryDate;
    }

    await docRef.update(updateData);

    return {
      success: true,
      requestId: requestId,
      status: status,
      ...updateData
    };

  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
};

/**
 * Check if recruiter has access to a position
 * Returns detailed info about any existing request (approved, rejected, waitlist, pending, expired)
 */
const checkRecruiterAccess = async (recruiterEmail, positionId) => {
  try {
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", recruiterEmail)
      .where("positionId", "==", positionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        hasAccess: false,
        status: null,
        hasRequest: false
      };
    }

    const request = snapshot.docs[0].data();
    const now = new Date();
    const expiresAt = request.expiresAt?.toDate ? request.expiresAt.toDate() : 
                     (request.expiresAt ? new Date(request.expiresAt) : null);

    // Handle different statuses
    if (request.status === "approved") {
      // Check if access has expired
      if (expiresAt && now > expiresAt) {
        // Auto-expire the request
        await positionAccessRequests.doc(snapshot.docs[0].id).update({
          status: "expired",
          updatedAt: new Date()
        });

        return {
          hasAccess: false,
          status: "expired",
          message: "Your access to this position has expired",
          hasRequest: true,
          requestId: snapshot.docs[0].id
        };
      }

      return {
        hasAccess: true,
        status: "approved",
        requestId: snapshot.docs[0].id,
        expiresAt: expiresAt,
        hasRequest: true
      };
    }

    if (request.status === "rejected") {
      return {
        hasAccess: false,
        status: "rejected",
        message: "Your access request was rejected by the ClientSPOC",
        hasRequest: true,
        requestId: snapshot.docs[0].id
      };
    }

    if (request.status === "waitlist") {
      return {
        hasAccess: false,
        status: "waitlist",
        message: "You are on the waitlist for this position",
        hasRequest: true,
        requestId: snapshot.docs[0].id
      };
    }

    if (request.status === "pending") {
      return {
        hasAccess: false,
        status: "pending",
        message: "Your access request is pending approval",
        hasRequest: true,
        requestId: snapshot.docs[0].id
      };
    }

    if (request.status === "expired") {
      return {
        hasAccess: false,
        status: "expired",
        message: "Your access to this position has expired",
        hasRequest: true,
        requestId: snapshot.docs[0].id
      };
    }

    // Default fallback
    return {
      hasAccess: false,
      status: request.status,
      hasRequest: true,
      requestId: snapshot.docs[0].id
    };

  } catch (error) {
    console.error("Error checking recruiter access:", error);
    throw error;
  }
};

/**
 * Get recruiter access statistics
 */
const getRecruiterAccessStats = async (recruiterEmail) => {
  try {
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", recruiterEmail)
      .get();

    const stats = {
      totalRequested: 0,
      currentlyApproved: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalWaitlist: 0,
      totalPending: 0,
      totalExpired: 0
    };

    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status;

      // Count total requests (excluding rejected and expired)
      if (status !== "rejected" && status !== "expired") {
        stats.totalRequested++;
      }

      // Count by status
      if (status === "approved") {
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : 
                         (data.expiresAt ? new Date(data.expiresAt) : null);
        
        // Check if still valid
        if (!expiresAt || now <= expiresAt) {
          stats.currentlyApproved++;
        }
        stats.totalApproved++;
      } else if (status === "rejected") {
        stats.totalRejected++;
      } else if (status === "waitlist") {
        stats.totalWaitlist++;
      } else if (status === "pending") {
        stats.totalPending++;
      } else if (status === "expired") {
        stats.totalExpired++;
      }
    });

    return stats;

  } catch (error) {
    console.error("Error getting recruiter access stats:", error);
    throw error;
  }
};

/**
 * Close/complete a position request
 */
const closePositionRequest = async (requestId, recruiterEmail) => {
  try {
    const docRef = positionAccessRequests.doc(requestId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Request not found");
    }

    const requestData = doc.data();

    // Verify recruiter owns this request
    if (requestData.recruiterEmail !== recruiterEmail) {
      throw new Error("You don't have permission to close this request");
    }

    await docRef.update({
      status: "closed",
      closedAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      message: "Position request closed successfully"
    };

  } catch (error) {
    console.error("Error closing position request:", error);
    throw error;
  }
};

/**
 * Get request by ID
 */
const getRequestById = async (requestId) => {
  try {
    const doc = await positionAccessRequests.doc(requestId).get();
    
    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error("Error getting request by ID:", error);
    throw error;
  }
};

/**
 * NEW: Get all assignments for a recruiter
 * Returns all positions assigned to the recruiter
 */
const getRecruiterAssignments = async (recruiterEmail) => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();
    
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("status", "==", "approved")
      .get();

    const assignments = [];
    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : 
                       (data.expiresAt ? new Date(data.expiresAt) : null);
      
      // Only include non-expired assignments
      if (!expiresAt || now <= expiresAt) {
        assignments.push({
          id: doc.id,
          requestId: doc.id,
          positionId: data.positionId,
          positionTitle: data.positionTitle,
          client: data.client,
          clientspoc: data.clientspoc,
          status: data.status,
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : data.requestedAt,
          expiresAt: expiresAt,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
        });
      }
    });

    // Sort by requested date (newest first)
    assignments.sort((a, b) => {
      const dateA = a.requestedAt ? new Date(a.requestedAt) : new Date(0);
      const dateB = b.requestedAt ? new Date(b.requestedAt) : new Date(0);
      return dateB - dateA;
    });

    return assignments;
  } catch (error) {
    console.error("Error getting recruiter assignments:", error);
    throw error;
  }
};

/**
 * NEW: Release/leave a position assignment
 * Sets the assignment status to 'released' and expires it
 */
const releasePositionAssignment = async (recruiterEmail, positionId) => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();
    
    // Find the assignment
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("positionId", "==", positionId)
      .where("status", "==", "approved")
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error("Assignment not found or you don't have access to this position");
    }

    const doc = snapshot.docs[0];
    
    // Update the assignment to released status
    await positionAccessRequests.doc(doc.id).update({
      status: "released",
      releasedAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      message: "Position released successfully",
      assignmentId: doc.id,
      positionId: positionId
    };
  } catch (error) {
    console.error("Error releasing position assignment:", error);
    throw error;
  }
};

/**
 * NEW: Get count of active (non-released, non-expired) assignments for a recruiter
 */
const getRecruiterAssignmentCount = async (recruiterEmail) => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();
    
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("status", "==", "approved")
      .get();

    const now = new Date();
    let activeCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : 
                       (data.expiresAt ? new Date(data.expiresAt) : null);
      
      // Count only non-expired assignments
      if (!expiresAt || now <= expiresAt) {
        activeCount++;
      }
    });

    return activeCount;
  } catch (error) {
    console.error("Error getting recruiter assignment count:", error);
    throw error;
  }
};

/**
 * NEW: Create a position assignment request
 * Recruiter sends request to ClientSPOC to work on a position
 * Multiple recruiters can request to work on the same position
 */
const createAssignRequest = async (recruiterId, recruiterEmail, positionId, message = '') => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();

    // Check if request already exists for this recruiter and position
    const existingRequest = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("positionId", "==", positionId)
      .where("type", "==", "assign")
      .where("status", "in", ["pending", "approved"])
      .get();

    if (!existingRequest.empty) {
      const existingStatus = existingRequest.docs[0].data().status;
      if (existingStatus === "approved") {
        throw new Error("You already have approval to work on this position");
      }
      throw new Error("You already have a pending request for this position");
    }

    // Get position details
    const positionSnap = await adminPosDb.where("pos_id", "==", positionId).limit(1).get();
    if (positionSnap.empty) {
      throw new Error("Position not found");
    }
    const position = positionSnap.docs[0].data();

    // Get recruiter details
    const recruiterSnap = await recruiterDb.where("email", "==", normalizedEmail).limit(1).get();
    let recruiter = null;
    if (!recruiterSnap.empty) {
      recruiter = recruiterSnap.docs[0].data();
    }

    // Check if user is the position owner (clientspoc) - auto-approve
    const isPositionOwner = position.clientspoc && 
                            position.clientspoc.toLowerCase() === normalizedEmail;

    const initialStatus = isPositionOwner ? "approved" : "pending";
    let expiresAt = null;
    
    if (isPositionOwner) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      expiresAt = expiryDate;
    }

    // Create the assign request
    const requestData = {
      type: "assign", // Distinguish from "access" type requests
      recruiterId: recruiterId || recruiterEmail,
      recruiterEmail: normalizedEmail,
      recruiterName: recruiter?.firstName || recruiter?.name || recruiterEmail.split('@')[0],
      positionId: positionId,
      positionTitle: position.position,
      client: position.client,
      clientspoc: position.clientspoc,
      status: initialStatus,
      message: message || '',
      requestedAt: new Date(),
      respondedAt: isPositionOwner ? new Date() : null,
      respondedBy: isPositionOwner ? normalizedEmail : null,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await positionAccessRequests.add(requestData);
    
    console.log(`✅ Assign request created: ${docRef.id} for position ${positionId} by ${normalizedEmail}`);
    
    return {
      success: true,
      requestId: docRef.id,
      status: initialStatus,
      ...requestData
    };

  } catch (error) {
    console.error("Error creating assign request:", error);
    throw error;
  }
};

/**
 * NEW: Get all assign requests for a recruiter
 */
const getRecruiterAssignRequests = async (recruiterEmail) => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();
    
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("type", "==", "assign")
      .orderBy("requestedAt", "desc")
      .get();

    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: "assign",
        positionId: data.positionId,
        positionTitle: data.positionTitle,
        client: data.client,
        clientspoc: data.clientspoc,
        status: data.status,
        message: data.message || '',
        requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : data.requestedAt,
        respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : data.respondedAt,
        respondedBy: data.respondedBy,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      };
    });

    return requests;
  } catch (error) {
    console.error("Error getting recruiter assign requests:", error);
    throw error;
  }
};

/**
 * NEW: Get all assign requests for a ClientSPOC (requests needing approval)
 */
const getClientSpocAssignRequests = async (clientspocEmail) => {
  try {
    const normalizedEmail = clientspocEmail.toLowerCase();
    
    // Get all pending assign requests where this SPOC is the clientspoc
    const snapshot = await positionAccessRequests
      .where("clientspoc", "==", normalizedEmail)
      .where("type", "==", "assign")
      .orderBy("requestedAt", "desc")
      .get();

    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: "assign",
        recruiterId: data.recruiterId,
        recruiterEmail: data.recruiterEmail,
        recruiterName: data.recruiterName,
        positionId: data.positionId,
        positionTitle: data.positionTitle,
        client: data.client,
        status: data.status,
        message: data.message || '',
        requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : data.requestedAt,
        respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : data.respondedAt,
        respondedBy: data.respondedBy
      };
    });

    console.log(`Found ${requests.length} assign requests for ClientSPOC: ${clientspocEmail}`);
    return requests;
  } catch (error) {
    console.error("Error getting ClientSPOC assign requests:", error);
    throw error;
  }
};

/**
 * NEW: Update assign request status (approve/reject)
 */
const updateAssignRequestStatus = async (requestId, status, clientspocEmail, reason = '') => {
  try {
    const docRef = positionAccessRequests.doc(requestId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Request not found");
    }

    const requestData = doc.data();

    // Verify this is an assign request
    if (requestData.type !== "assign") {
      throw new Error("Invalid request type");
    }

    // Verify ClientSPOC owns this position
    if (requestData.clientspoc.toLowerCase() !== clientspocEmail.toLowerCase()) {
      throw new Error("You don't have permission to update this request");
    }

    const updateData = {
      status: status,
      respondedAt: new Date(),
      respondedBy: clientspocEmail,
      updatedAt: new Date()
    };

    // If approving, set expiry date (30 days from now)
    if (status === "approved") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      updateData.expiresAt = expiryDate;
    }

    // Add rejection reason if provided
    if (status === "rejected" && reason) {
      updateData.rejectionReason = reason;
    }

    await docRef.update(updateData);

    console.log(`✅ Assign request ${requestId} ${status} by ${clientspocEmail}`);

    return {
      success: true,
      requestId: requestId,
      status: status,
      ...updateData
    };

  } catch (error) {
    console.error("Error updating assign request status:", error);
    throw error;
  }
};

/**
 * NEW: Get all approved assignees for a position
 * Returns list of recruiters approved to work on a position
 */
const getPositionAssignees = async (positionId) => {
  try {
    const snapshot = await positionAccessRequests
      .where("positionId", "==", positionId)
      .where("type", "==", "assign")
      .where("status", "==", "approved")
      .get();

    const assignees = [];
    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : 
                       (data.expiresAt ? new Date(data.expiresAt) : null);
      
      // Only include non-expired approvals
      if (!expiresAt || now <= expiresAt) {
        assignees.push({
          id: doc.id,
          recruiterId: data.recruiterId,
          recruiterEmail: data.recruiterEmail,
          recruiterName: data.recruiterName,
          assignedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : data.respondedAt,
          expiresAt: expiresAt
        });
      }
    });

    return assignees;
  } catch (error) {
    console.error("Error getting position assignees:", error);
    throw error;
  }
};

/**
 * NEW: Cancel an assign request
 */
const cancelAssignRequest = async (requestId, recruiterEmail) => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();
    const docRef = positionAccessRequests.doc(requestId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Request not found");
    }

    const requestData = doc.data();

    // Verify this is an assign request and belongs to the recruiter
    if (requestData.type !== "assign") {
      throw new Error("Invalid request type");
    }

    if (requestData.recruiterEmail.toLowerCase() !== normalizedEmail) {
      throw new Error("You don't have permission to cancel this request");
    }

    // Can only cancel pending requests
    if (requestData.status !== "pending") {
      throw new Error("Can only cancel pending requests");
    }

    await docRef.update({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Assign request ${requestId} cancelled by ${normalizedEmail}`);

    return {
      success: true,
      message: "Request cancelled successfully",
      requestId: requestId
    };

  } catch (error) {
    console.error("Error cancelling assign request:", error);
    throw error;
  }
};

/**
 * NEW: Check if recruiter can submit candidates for a position
 * Returns true if recruiter has approved assignment or owns the position
 */
const canRecruiterSubmitForPosition = async (recruiterEmail, positionId) => {
  try {
    const normalizedEmail = recruiterEmail.toLowerCase();

    // First check if recruiter owns the position (is the clientspoc)
    const positionSnap = await adminPosDb.where("pos_id", "==", positionId).limit(1).get();
    if (!positionSnap.empty) {
      const position = positionSnap.docs[0].data();
      if (position.clientspoc && position.clientspoc.toLowerCase() === normalizedEmail) {
        return { canSubmit: true, reason: "Position owner" };
      }
    }

    // Check for approved assign request
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("positionId", "==", positionId)
      .where("type", "==", "assign")
      .where("status", "==", "approved")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : 
                       (data.expiresAt ? new Date(data.expiresAt) : null);
      
      if (expiresAt && new Date() > expiresAt) {
        return { 
          canSubmit: false, 
          reason: "Your assignment has expired",
          status: "expired"
        };
      }

      return { 
        canSubmit: true, 
        reason: "Assignment approved",
        requestId: snapshot.docs[0].id
      };
    }

    // Check if there's a pending request
    const pendingSnapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("positionId", "==", positionId)
      .where("type", "==", "assign")
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!pendingSnapshot.empty) {
      return { 
        canSubmit: false, 
        reason: "Request pending approval",
        status: "pending",
        requestId: pendingSnapshot.docs[0].id
      };
    }

    // Check if rejected
    const rejectedSnapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("positionId", "==", positionId)
      .where("type", "==", "assign")
      .where("status", "==", "rejected")
      .limit(1)
      .get();

    if (!rejectedSnapshot.empty) {
      return { 
        canSubmit: false, 
        reason: "Request was rejected",
        status: "rejected"
      };
    }

    // No request exists
    return { 
      canSubmit: false, 
      reason: "Request approval required",
      status: "none"
    };

  } catch (error) {
    console.error("Error checking recruiter position access:", error);
    throw error;
  }
};

module.exports = {
  createAccessRequest,
  getRecruiterRequests,
  getClientSpocRequests,
  updateRequestStatus,
  checkRecruiterAccess,
  getRecruiterAccessStats,
  closePositionRequest,
  getRequestById,
  // New functions for position management
  getRecruiterAssignments,
  releasePositionAssignment,
  getRecruiterAssignmentCount,
  // New functions for assign requests (multi-recruiter feature)
  createAssignRequest,
  getRecruiterAssignRequests,
  getClientSpocAssignRequests,
  updateAssignRequestStatus,
  getPositionAssignees,
  cancelAssignRequest,
  canRecruiterSubmitForPosition
};
