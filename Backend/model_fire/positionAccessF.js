const { db } = require("../router/firebase_ad");
const adminModel = require("./adminF");
const positionAccessRequests = db.collection("position_access_requests");
const recruiterDb = db.collection("recruiter_db");
const adminPosDb = db.collection("admin_AddPos");
const candidateDb = db.collection("candidate_db");

/**
 * Set of positions the recruiter has currently released — i.e. they have a
 * "released" record and no active "approved" record for that position. A released
 * position keeps its candidate history but does NOT occupy a working slot.
 */
const getReleasedPositionIds = async (recruiterEmail) => {
  const normalizedEmail = (recruiterEmail || "").toLowerCase();
  const reqSnap = await positionAccessRequests
    .where("recruiterEmail", "==", normalizedEmail)
    .get();
  const approvedPos = new Set();
  const releasedPos = new Set();
  reqSnap.docs.forEach(doc => {
    const r = doc.data();
    if (!r.positionId) return;
    if (r.status === "approved") approvedPos.add(r.positionId);
    else if (r.status === "released") releasedPos.add(r.positionId);
  });
  // Released "now" = released and not re-assigned (no approved record)
  return new Set([...releasedPos].filter(p => !approvedPos.has(p)));
};

/**
 * Count the distinct positions a recruiter is actively working on. A position counts
 * toward the free-plan limit of 4 if EITHER:
 *   - the recruiter has at least 1 active (non-rejected) candidate on it, OR
 *   - it was assigned to them by a Coach and they accepted it.
 * Released positions are excluded (they free a slot).
 */
const countActiveWorkingPositions = async (recruiterEmail) => {
  const normalizedEmail = (recruiterEmail || "").toLowerCase();
  const emailVariants = [...new Set([normalizedEmail, recruiterEmail].filter(Boolean))];
  const [snap, releasedNow, coachSnap] = await Promise.all([
    candidateDb.where("recEmail", "==", normalizedEmail).get(),
    getReleasedPositionIds(normalizedEmail),
    db.collection("coach_recruiter_assignments").where("recruiterEmail", "in", emailVariants).get()
  ]);
  const posIds = new Set();
  // Positions with at least 1 active candidate submitted by this recruiter
  snap.docs.forEach(doc => {
    const c = doc.data();
    if (c.pos_id && !adminModel.REJECTION_STATUSES.includes(c.statusa) && !releasedNow.has(c.pos_id)) {
      posIds.add(c.pos_id);
    }
  });
  // Accepted coach-assigned positions also occupy a slot
  coachSnap.docs.forEach(doc => {
    const a = doc.data();
    if (a.status === "accepted" && a.positionId && !releasedNow.has(a.positionId)) {
      posIds.add(a.positionId);
    }
  });
  return { count: posIds.size, posIds };
};

/**
 * Re-engage a previously released position (e.g. when the recruiter assigns it
 * again or submits a new candidate). Flips any "released" records back to
 * "approved" so the position counts as a working slot again.
 */
const reengageReleasedPosition = async (recruiterEmail, positionId) => {
  const normalizedEmail = (recruiterEmail || "").toLowerCase();
  const snap = await positionAccessRequests
    .where("recruiterEmail", "==", normalizedEmail)
    .where("positionId", "==", positionId)
    .where("status", "==", "released")
    .get();
  if (snap.empty) return { reengaged: false };
  const batch = db.batch();
  snap.docs.forEach(doc => batch.update(doc.ref, {
    status: "approved",
    reengagedAt: new Date(),
    updatedAt: new Date()
  }));
  await batch.commit();
  return { reengaged: true, count: snap.size };
};

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

    // Plan/position limits are enforced at the Assign Me endpoint
    // (free recruiters: max 4 positions with at least 1 active candidate).
    // The 30-day free-plan expiry has been removed.

    // Access is granted immediately — no ClientSPOC approval required.
    const initialStatus = "approved";
    const initialRespondedAt = new Date();
    const initialRespondedBy = "auto-approved";
    const initialExpiresAt = null; // never expires

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
      .get();

    // Always check legacy fallbacks — even if a stale/expired/rejected request record exists
    const checkLegacyAccess = async () => {
      // Coach-assigned positions: recruiter accepted an assignment from a coach
      const coachAssignSnap = await db.collection("coach_recruiter_assignments")
        .where("recruiterEmail", "==", recruiterEmail)
        .where("positionId", "==", positionId)
        .where("status", "==", "accepted")
        .limit(1)
        .get();
      if (!coachAssignSnap.empty) {
        return { hasAccess: true, status: "approved", hasRequest: true, source: "coach_assignment" };
      }

      const assignSnap = await db.collection("position_assignments")
        .where("recruiterEmail", "==", recruiterEmail)
        .where("pos_id", "==", positionId)
        .where("assigned", "==", true)
        .limit(1)
        .get();
      if (!assignSnap.empty) {
        return { hasAccess: true, status: "approved", hasRequest: true, source: "assignment" };
      }

      const posSnap = await adminPosDb.where("pos_id", "==", positionId).limit(1).get();
      if (!posSnap.empty) {
        const posData = posSnap.docs[0].data();
        const hrName = (posData.hr_name || "").toLowerCase().trim();
        if (hrName && hrName === recruiterEmail.toLowerCase().trim()) {
          return { hasAccess: true, status: "approved", hasRequest: true, source: "hr_name" };
        }
      }
      return null;
    };

    if (snapshot.empty) {
      const legacy = await checkLegacyAccess();
      if (legacy) return legacy;
      return {
        hasAccess: false,
        status: null,
        hasRequest: false
      };
    }

    const now = new Date();

    // Multiple records can exist (e.g. one expired + one approved). Find the best one.
    let bestDoc = null;
    let bestRequest = null;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.status === "approved") {
        const exp = data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null);
        if (!exp || now <= exp) {
          // Valid approved record — use this immediately
          bestDoc = doc;
          bestRequest = data;
          break;
        }
        // Approved but expired — auto-expire it and keep looking
        await positionAccessRequests.doc(doc.id).update({ status: "expired", updatedAt: new Date() });
      } else if (!bestDoc) {
        // Keep the first non-approved record as fallback
        bestDoc = doc;
        bestRequest = data;
      }
    }

    if (bestRequest && bestRequest.status === "approved") {
      const exp = bestRequest.expiresAt?.toDate ? bestRequest.expiresAt.toDate() : (bestRequest.expiresAt ? new Date(bestRequest.expiresAt) : null);
      return {
        hasAccess: true,
        status: "approved",
        requestId: bestDoc.id,
        expiresAt: exp,
        hasRequest: true
      };
    }

    // No valid approved record — check legacy assignment systems before returning no-access
    const legacyResult = await checkLegacyAccess();
    if (legacyResult) return legacyResult;

    if (!bestRequest) {
      return { hasAccess: false, status: null, hasRequest: false };
    }

    const statusMessages = {
      rejected: "Your access request was rejected by the ClientSPOC",
      waitlist: "You are on the waitlist for this position",
      pending:  "Your access request is pending approval",
      expired:  "Your access to this position has expired",
    };

    return {
      hasAccess: false,
      status: bestRequest.status,
      message: statusMessages[bestRequest.status] || "Access not granted",
      hasRequest: true,
      requestId: bestDoc.id
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
    const seenPositions = new Set();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() :
                       (data.expiresAt ? new Date(data.expiresAt) : null);

      // Only include non-expired assignments, deduped by position
      // (a position can have both an "access" and an "assign" approved record).
      if ((!expiresAt || now <= expiresAt) && !seenPositions.has(data.positionId)) {
        seenPositions.add(data.positionId);
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

    // Positions assigned by a coach live in their own collection, so they never
    // appeared in "My Positions" even after the recruiter accepted them — which
    // also meant they could not be released. Merge them in here (deduped against
    // the access requests above, and skipping any the recruiter already released).
    try {
      const coachSnap = await db.collection("coach_recruiter_assignments")
        .where("recruiterEmail", "==", normalizedEmail)
        .where("status", "==", "accepted")
        .get();

      // Positions this recruiter has explicitly released — must stay hidden.
      const releasedSnap = await positionAccessRequests
        .where("recruiterEmail", "==", normalizedEmail)
        .where("status", "==", "released")
        .get();
      const releasedPositions = new Set(releasedSnap.docs.map(d => d.data().positionId));

      for (const doc of coachSnap.docs) {
        const data = doc.data();
        if (seenPositions.has(data.positionId) || releasedPositions.has(data.positionId)) continue;
        seenPositions.add(data.positionId);

        // Assignment docs don't always carry the position title/client — backfill
        // from the position record so the card renders properly.
        let positionTitle = data.positionTitle || "";
        let client = data.client || "";
        let clientspoc = data.clientspoc || "";
        if (!positionTitle || !client) {
          try {
            const posSnap = await adminPosDb.where("pos_id", "==", data.positionId).limit(1).get();
            if (!posSnap.empty) {
              const p = posSnap.docs[0].data();
              positionTitle = positionTitle || p.position || "";
              client = client || p.client || "";
              clientspoc = clientspoc || p.clientspoc || "";
            }
          } catch (_) { /* keep whatever we have */ }
        }

        assignments.push({
          id: doc.id,
          requestId: doc.id,
          positionId: data.positionId,
          positionTitle,
          client,
          clientspoc,
          status: "approved",
          source: "coach_assignment",
          assignedByCoach: data.coachEmail || data.coachName || "",
          requestedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt),
          expiresAt: null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        });
      }
    } catch (coachErr) {
      // Never let this break the main list
      console.error("coach assignment merge failed:", coachErr.message);
    }

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

    // Release ALL approved records (access + assign types) for this position so the
    // slot is fully freed. Candidate history in candidate_db is left untouched.
    const snapshot = await positionAccessRequests
      .where("recruiterEmail", "==", normalizedEmail)
      .where("positionId", "==", positionId)
      .where("status", "==", "approved")
      .get();

    const now = new Date();

    // A position can also come from a coach assignment (separate collection).
    // Release those too, otherwise the recruiter keeps access to a position they
    // just released and it reappears in their list.
    let coachReleased = 0;
    try {
      const coachSnap = await db.collection("coach_recruiter_assignments")
        .where("recruiterEmail", "==", normalizedEmail)
        .where("positionId", "==", positionId)
        .where("status", "==", "accepted")
        .get();
      if (!coachSnap.empty) {
        const cb = db.batch();
        coachSnap.docs.forEach(doc => cb.update(doc.ref, {
          status: "released",
          releasedAt: now,
          updatedAt: now
        }));
        await cb.commit();
        coachReleased = coachSnap.size;
      }
    } catch (coachErr) {
      console.error("coach assignment release failed:", coachErr.message);
    }

    if (snapshot.empty) {
      // No approved access record (e.g. coach-assigned or legacy data) — drop a
      // release marker so the slot still frees and the position stays hidden.
      await positionAccessRequests.add({
        type: "release-marker",
        recruiterEmail: normalizedEmail,
        positionId: positionId,
        status: "released",
        releasedAt: now,
        createdAt: now,
        updatedAt: now
      });
      return { success: true, message: "Position released successfully", positionId, releasedCount: coachReleased };
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.update(doc.ref, {
      status: "released",
      releasedAt: now,
      updatedAt: now
    }));
    await batch.commit();

    return {
      success: true,
      message: "Position released successfully",
      positionId: positionId,
      releasedCount: snapshot.size + coachReleased
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

    // Assignment is granted immediately — no ClientSPOC approval required.
    const initialStatus = "approved";
    const expiresAt = null; // never expires

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
      respondedAt: new Date(),
      respondedBy: "auto-approved",
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
  canRecruiterSubmitForPosition,
  countActiveWorkingPositions,
  getReleasedPositionIds,
  reengageReleasedPosition
};
