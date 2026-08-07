const { db } = require("../router/firebase_ad");
const ad_pos=db.collection("admin_AddPos");
const counterRef = db.collection("meta").doc("pXiWCqqo4GDuh8qjocNn"); 
const candidate = db.collection("candidate_db");
const recruiterDb = db.collection('recruiter_db');

/**
 * Get Client Statistics with detailed breakdown
 * Returns list of clients with positions, candidates, and recruiters counts
 * Supports filtering by spoc, recruiter, status, and client name
 */
const getClientStats = async (filters = {}) => {
  try {
    const { spocName, recruiterName, status, clientName } = filters;

    // 1. Get all positions (with optional filters)
    let posQuery = ad_pos;
    
    if (clientName) {
      posQuery = posQuery.where("client", "==", clientName);
    }
    if (spocName) {
      posQuery = posQuery.where("clientspoc", "==", spocName.toLowerCase());
    }
    
    const positionsSnap = await posQuery.get();
    const positions = positionsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        pos_id: data.pos_id,
        position: data.position,
        client: data.client,
        hr_name: data.hr_name,
        clientspoc: data.clientspoc,
        clientspoc_name: data.clientspoc_name
      };
    });

    if (positions.length === 0) {
      return { clients: [], totalClients: 0, totalPositions: 0, totalCandidates: 0, totalRecruiters: 0 };
    }

    // 2. Get all position IDs
    const positionIds = positions.map(p => p.pos_id);

    // 3. Get all candidates for these positions (batch in groups of 10)
    let allCandidates = [];
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const snap = await candidate.where("pos_id", "in", batch).get();
      allCandidates.push(...snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          pos_id: data.pos_id,
          recEmail: data.recEmail,
          candidate: data.candidate || data.name,
          statusa: data.statusa,
          statusaDate: data.statusaDate,
          recName: data.recName || data.recruiterName || data.recruiter_name
        };
      }));
    }

    // 4. Apply recruiter name filter if provided
    if (recruiterName) {
      const normalizedRecruiterName = recruiterName.toLowerCase();
      allCandidates = allCandidates.filter(c => 
        (c.recEmail && c.recEmail.toLowerCase().includes(normalizedRecruiterName)) ||
        (c.recName && c.recName.toLowerCase().includes(normalizedRecruiterName))
      );
      
      // Also filter positions that have matching candidates
      const matchingPosIds = new Set(allCandidates.map(c => c.pos_id));
      positions = positions.filter(p => matchingPosIds.has(p.pos_id));
    }

    // 5. Apply status filter if provided
    if (status) {
      allCandidates = allCandidates.filter(c => 
        c.statusa && c.statusa.toLowerCase().includes(status.toLowerCase())
      );
      
      // Also filter positions that have matching candidates
      const matchingPosIds = new Set(allCandidates.map(c => c.pos_id));
      positions = positions.filter(p => matchingPosIds.has(p.pos_id));
    }

    // 6. Group by client and calculate stats
    const clientMap = {};

    positions.forEach(position => {
      const clientName = position.client || 'Unknown';
      
      if (!clientMap[clientName]) {
        clientMap[clientName] = {
          clientName,
          positions: [],
          totalCandidates: 0,
          totalRecruiters: new Set(),
          positionMap: new Map()
        };
      }

      const clientData = clientMap[clientName];
      
      // Add position if not already added
      if (!clientData.positionMap.has(position.pos_id)) {
        clientData.positionMap.set(position.pos_id, {
          pos_id: position.pos_id,
          positionName: position.position,
          hr_name: position.hr_name,
          clientspoc: position.clientspoc,
          clientspoc_name: position.clientspoc_name,
          candidates: []
        });
        clientData.positions.push(clientData.positionMap.get(position.pos_id));
      }
    });

    // 7. Add candidates to positions
    allCandidates.forEach(candidate => {
      const position = positions.find(p => p.pos_id === candidate.pos_id);
      if (!position) return;

      const clientName = position.client || 'Unknown';
      const clientData = clientMap[clientName];
      if (!clientData) return;

      const posData = clientData.positionMap.get(candidate.pos_id);
      if (!posData) return;

      // Add candidate to position
      posData.candidates.push({
        id: candidate.id,
        name: candidate.candidate,
        recruiterName: candidate.recName || 'Unknown',
        recruiterEmail: candidate.recEmail,
        status: candidate.statusa,
        lastUpdated: candidate.statusaDate
      });

      // Update counts
      clientData.totalCandidates++;
      if (candidate.recEmail) {
        clientData.totalRecruiters.add(candidate.recEmail);
      }
    });

    // 8. Convert to final format
    const clients = Object.values(clientMap).map(client => ({
      clientName: client.clientName,
      totalPositions: client.positionMap.size,
      totalCandidates: client.totalCandidates,
      totalRecruiters: client.totalRecruiters.size,
      positions: client.positions.map(pos => ({
        pos_id: pos.pos_id,
        positionName: pos.positionName,
        hr_name: pos.hr_name,
        clientspoc: pos.clientspoc,
        clientspoc_name: pos.clientspoc_name,
        candidateCount: pos.candidates.length,
        candidates: pos.candidates
      }))
    }));

    // Sort by total candidates (descending)
    clients.sort((a, b) => b.totalCandidates - a.totalCandidates);

    return {
      clients,
      totalClients: clients.length,
      totalPositions: clients.reduce((sum, c) => sum + c.totalPositions, 0),
      totalCandidates: clients.reduce((sum, c) => sum + c.totalCandidates, 0),
      totalRecruiters: clients.reduce((sum, c) => sum + c.totalRecruiters, 0)
    };

  } catch (error) {
    console.error("Error fetching client stats:", error);
    throw error;
  }
};

/**
 * Get all unique SPOC names for filter dropdown
 */
const getAllSpocs = async () => {
  try {
    const spocsSnap = await ad_pos.get();
    const spocs = new Map();
    
    spocsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.clientspoc) {
        const email = data.clientspoc.toLowerCase();
        if (!spocs.has(email)) {
          spocs.set(email, {
            email: data.clientspoc,
            name: data.clientspoc_name || email.split('@')[0]
          });
        }
      }
    });

    return Array.from(spocs.values());
  } catch (error) {
    console.error("Error fetching SPOCs:", error);
    throw error;
  }
};

/**
 * Get all unique recruiter names for filter dropdown
 */
const getAllRecruiterNames = async () => {
  try {
    const candidatesSnap = await candidate.get();
    const recruiters = new Map();
    
    candidatesSnap.docs.forEach(doc => {
      const data = doc.data();
      const recEmail = data.recEmail;
      const recName = data.recName || data.recruiterName || data.recruiter_name;
      
      if (recEmail && !recruiters.has(recEmail)) {
        recruiters.set(recEmail, {
          email: recEmail,
          name: recName || recEmail.split('@')[0]
        });
      }
    });

    return Array.from(recruiters.values());
  } catch (error) {
    console.error("Error fetching recruiter names:", error);
    throw error;
  }
};

/**
 * Get all unique client names for filter dropdown
 */
const getAllClientNames = async () => {
  try {
    const positionsSnap = await ad_pos.get();
    const clients = new Set();
    
    positionsSnap.docs.forEach(doc => {
      const client = doc.data().client;
      if (client) {
        clients.add(client);
      }
    });

    return Array.from(clients).sort();
  } catch (error) {
    console.error("Error fetching client names:", error);
    throw error;
  }
};

/**
 * Get statistics for admin dashboard
 */
const getAdminStats = async (clientName = null, hrName = null) => {
  try {
    // 1️⃣ Get all positions (optionally filtered)
    let posQuery = ad_pos;
    
    if (clientName) {
      posQuery = posQuery.where("client", "==", clientName);
    }
    if (hrName) {
      posQuery = posQuery.where("hr_name", "==", hrName);
    }
    
    const positionsSnap = await posQuery.get();
    const totalPositions = positionsSnap.size;
    
    // Get all position IDs
    const positionIds = positionsSnap.docs.map(doc => doc.data().pos_id);

    // 2️⃣ Get all candidates for these positions
    let candidatesData = [];
    
    if (positionIds.length > 0) {
      // Firestore 'in' query limit is 10, so batch if needed
      const batches = [];
      for (let i = 0; i < positionIds.length; i += 10) {
        const batch = positionIds.slice(i, i + 10);
        const snap = await candidate.where("pos_id", "in", batch).get();
        batches.push(...snap.docs.map(doc => doc.data()));
      }
      candidatesData = batches;
    }

    // 3️⃣ Define status categories
    const rejectionStatuses = [
      'Screen Reject',
      'L1 Reject',
      'L2 Reject',
      'L3 Reject',
      'HR Reject',
      'Background Verification Reject',
      'Negotiation Reject',
      'Offer Declined'
    ];

    const successStatuses = [
      'Offer Accepted',
      'Joining'
    ];

    const onProcessStatuses = [
      'Submitted',
      'CV Feedback Pending',
      'L1 To be Schedule',
      'L1 Scheduled',
      'L1 Feedback Pending',
      'L2 To be Schedule',
      'L2 Scheduled',
      'L2 Feedback Pending',
      'L3 To be Schedule',
      'L3 Scheduled',
      'L3 Feedback Pending',
      'HR To be Schedule',
      'HR Scheduled',
      'HR Feedback Pending',
      'Background Verification Pending',
      'Negotiation Scheduled',
      'To Be Offered'
    ];

    // 4️⃣ Count candidates by status
    const totalSubmitted = candidatesData.length;
    const rejected = candidatesData.filter(c => 
      rejectionStatuses.includes(c.statusa)
    ).length;
    
    const onProcess = candidatesData.filter(c => 
      onProcessStatuses.includes(c.statusa)
    ).length;
    
    const successful = candidatesData.filter(c => 
      successStatuses.includes(c.statusa)
    ).length;

    // 5️⃣ Calculate overall score
    const overallScore = totalSubmitted > 0 
      ? ((successful / totalSubmitted) * 100).toFixed(1) + "%"
      : "0%";

    return {
      totalPositions,
      totalSubmitted,
      onProcess,
      rejected,
      successful,
      overallScore
    };

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
}; 


/**
 * Get detailed breakdown of candidate statuses
 */
const getDetailedStats = async (clientName = null, hrName = null) => {
  try {
    let posQuery = ad_pos;
    if (clientName) posQuery = posQuery.where("client", "==", clientName);
    if (hrName) posQuery = posQuery.where("hr_name", "==", hrName);
    
    const positionsSnap = await posQuery.get();
    const positionIds = positionsSnap.docs.map(doc => doc.data().pos_id);

    let candidatesData = [];
    if (positionIds.length > 0) {
      for (let i = 0; i < positionIds.length; i += 10) {
        const batch = positionIds.slice(i, i + 10);
        const snap = await candidate.where("pos_id", "in", batch).get();
        candidatesData.push(...snap.docs.map(doc => doc.data()));
      }
    }

    const statusCounts = {};
    candidatesData.forEach(c => {
      const status = c.statusa || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      totalCandidates: candidatesData.length,
      statusBreakdown: statusCounts,
      positions: positionsSnap.docs.map(doc => ({
        id: doc.id,
        pos_id: doc.data().pos_id,
        position: doc.data().position,
        client: doc.data().client,
        hr_name: doc.data().hr_name
      }))
    };

  } catch (error) {
    console.error("Error fetching detailed stats:", error);
    throw error;
  }
};

/**
 * 🆕 NEW FUNCTION: Get all positions created by a specific client SPOC
 */
const getPositionsByClientSPOC = async (clientspoc) => {
  try {
    if (!clientspoc) {
      throw new Error("Client SPOC is required");
    }

    // Convert to lowercase for case-insensitive matching
    const normalizedEmail = clientspoc.toLowerCase();
    const snap = await ad_pos.where("clientspoc", "==", normalizedEmail).get();
    return snap.docs.map(doc => ({
      id: doc.id,
      pos_id: doc.data().pos_id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching positions by client SPOC:", error);
    throw error;
  }
};

/**
 * 🆕 NEW FUNCTION: Get all candidates for positions created by a specific client SPOC
 */
const getCandidatesByClientSPOC = async (clientspoc) => {
  try {
    if (!clientspoc) {
      throw new Error("Client SPOC is required");
    }

    // Step 1: Get all positions created by this client SPOC
    // Convert to lowercase for case-insensitive matching
    const normalizedEmail = clientspoc.toLowerCase();
    const positionsSnap = await ad_pos.where("clientspoc", "==", normalizedEmail).get();
    
    if (positionsSnap.empty) {
      return []; // No positions found for this SPOC
    }

    // Step 2: Extract position IDs
    const positionIds = positionsSnap.docs.map(doc => doc.data().pos_id);

    // Step 3: Get all candidates for these positions (batch in groups of 10)
    let candidatesData = [];
    
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const snap = await candidate.where("pos_id", "in", batch).get();
      const batchData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      candidatesData.push(...batchData);
    }

    return candidatesData;

  } catch (error) {
    console.error("Error fetching candidates by client SPOC:", error);
    throw error;
  }
};

const normalizePosition = (doc) => {
  const data = doc.data();

  return {
    id: doc.id,
    ...data,
    state: Array.isArray(data.state)
      ? data.state
      : data.state
      ? [data.state]
      : [],
    location: Array.isArray(data.location)
      ? data.location
      : data.location
      ? [data.location]
      : [],
  };
};

// ==================== ACTIVE CANDIDATE LIMIT FEATURE ====================

/**
 * Rejection statuses that exclude a candidate from being "active"
 * NEW: Added Test Reject, Client Drop, Candidate Drop, Duplicate
 */
const REJECTION_STATUSES = [
  'Screen Reject',
  'L1 Reject',
  'L2 Reject',
  'L3 Reject',
  'HR Reject',
  'Background Verification Reject',
  'Negotiation Reject',
  'Offer Declined',
  // New rejection statuses
  'Test Reject',
  'Client Drop',
  'Candidate Drop',
  'Duplicate'
];

/**
 * Statuses that indicate a position is closed/hold
 */
const CLOSED_STATUSES = [
  'hold',
  'closed',
  'on hold',
  'closed - filled',
  'closed - cancelled'
];

/**
 * Get count of active (non-rejected) candidates for a position
 * @param {string} pos_id - Position ID
 * @param {number} maxCandidate - Maximum candidates allowed (defaults to 10)
 * @returns {number} Count of active candidates
 */
const getActiveCandidateCount = async (pos_id, maxCandidate = 10) => {
  try {
    // If no position ID provided, return 0
    if (!pos_id) return 0;

    // Get position data to get maxCandidate
    const posSnap = await ad_pos.where('pos_id', '==', pos_id).limit(1).get();
    if (!posSnap.empty) {
      maxCandidate = posSnap.docs[0].data().maxCandidate || 10;
    }

    // Get all candidates for this position
    const candidatesSnap = await candidate.where('pos_id', '==', pos_id).get();
    
    if (candidatesSnap.empty) return 0;

    // Count non-rejected candidates
    let activeCount = 0;
    candidatesSnap.docs.forEach(doc => {
      const data = doc.data();
      const status = data.statusa;
      
      // Only count if status is NOT a rejection
      if (status && !REJECTION_STATUSES.includes(status)) {
        activeCount++;
      }
    });

    return {
      count: activeCount,
      maxCandidate: maxCandidate,
      isFull: activeCount >= maxCandidate,
      remaining: Math.max(0, maxCandidate - activeCount)
    };
  } catch (error) {
    console.error(`Error getting active candidate count for position ${pos_id}:`, error);
    return { count: 0, maxCandidate: 10, isFull: false, remaining: 10 };
  }
};

/**
 * Update position visibility based on active candidate count
 * If active count >= maxCandidate and position is not hold/closed, hide the position
 * If active count < maxCandidate and position is not hold/closed, show the position
 * @param {string} pos_id - Position ID
 * @returns {object} Result with updated position data
 */
const updatePositionVisibility = async (pos_id) => {
  try {
    if (!pos_id) {
      throw new Error("Position ID is required");
    }

    // Find the position document
    const posSnap = await ad_pos.where('pos_id', '==', pos_id).limit(1).get();
    
    if (posSnap.empty) {
      throw new Error("Position not found");
    }

    const posDoc = posSnap.docs[0];
    const posData = posDoc.data();
    const positionStatus = (posData.status || '').toLowerCase();

    // Check if position is on hold or closed
    const isOnHoldOrClosed = CLOSED_STATUSES.some(status => 
      positionStatus.includes(status.toLowerCase())
    );

    // Get active candidate count info (now returns object with count and maxCandidate)
    const candidateInfo = await getActiveCandidateCount(pos_id);

    // Determine if position should be hidden
    // Hide if: active count >= maxCandidate AND position is NOT hold/closed
    const shouldHide = candidateInfo.isFull && !isOnHoldOrClosed;

    // Check current visibility state
    const currentHideStatus = posData.hideFromOpen || false;

    // Only update if there's a change
    if (currentHideStatus !== shouldHide) {
      await ad_pos.doc(posDoc.id).update({
        hideFromOpen: shouldHide,
        activeCandidateCount: candidateInfo.count,
        maxCandidate: candidateInfo.maxCandidate,
        visibilityUpdatedAt: new Date()
      });

      console.log(`Position ${pos_id}: Active count=${candidateInfo.count}/${candidateInfo.maxCandidate}, Should hide=${shouldHide}, Status=${posData.status}`);
    } else {
      // Just update the counts
      await ad_pos.doc(posDoc.id).update({
        activeCandidateCount: candidateInfo.count,
        maxCandidate: candidateInfo.maxCandidate,
        visibilityUpdatedAt: new Date()
      });
    }

    // Return updated position
    const updatedDoc = await ad_pos.doc(posDoc.id).get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      activeCandidateCount: candidateInfo.count,
      maxCandidate: candidateInfo.maxCandidate,
      isHidden: shouldHide
    };
  } catch (error) {
    console.error(`Error updating position visibility for ${pos_id}:`, error);
    throw error;
  }
};

/**
 * Get all positions with visibility filtering
 * Positions with >= 10 active candidates (and not hold/closed) are hidden
 * PAUSED positions are also hidden from recruiters
 * @param {boolean} includeHidden - Whether to include hidden positions (default: false)
 * @returns {Array} List of positions
 */
const getAllPosition = async (includeHidden = false) => {
  try {
    const snap = await ad_pos.get();
    let positions = snap.docs.map(normalizePosition);

    if (!includeHidden) {
      // Filter out positions that should be hidden
      // A position should be hidden if:
      // 1. status is 'paused' (PAUSED positions not visible to recruiters), OR
      // 2. hideFromOpen is true, OR
      // 3. activeCandidateCount >= 10 AND status is NOT hold/closed
      
      positions = positions.filter(pos => {
        // If status is paused, hide from recruiters
        if ((pos.status || '').toLowerCase() === 'paused') {
          return false;
        }

        // If explicitly marked as hidden, don't show
        if (pos.hideFromOpen === true) {
          return false;
        }

        // If activeCandidateCount >= maxCandidate and not hold/closed, hide
        const status = (pos.status || '').toLowerCase();
        const isOnHoldOrClosed = CLOSED_STATUSES.some(s => status.includes(s.toLowerCase()));
        const maxCandidateLimit = pos.maxCandidate || 10;
        
        if (!isOnHoldOrClosed && (pos.activeCandidateCount || 0) >= maxCandidateLimit) {
          return false;
        }

        return true;
      });
    }

    return positions;
  } catch (error) {
    console.error("Error getting all positions:", error);
    return [];
  }
};

/**
 * Get positions for a specific client SPOC with visibility filtering
 * @param {string} clientspoc - Client SPOC email
 * @param {boolean} includeHidden - Whether to include hidden positions
 * @returns {Array} List of positions
 */
const getPositionsByClientSPOCWithVisibility = async (clientspoc, includeHidden = false) => {
  try {
    if (!clientspoc) {
      throw new Error("Client SPOC is required");
    }

    const normalizedEmail = clientspoc.toLowerCase();
    const snap = await ad_pos.where("clientspoc", "==", normalizedEmail).get();
    
    let positions = snap.docs.map(doc => ({
      id: doc.id,
      pos_id: doc.data().pos_id,
      ...doc.data()
    }));

    if (!includeHidden) {
      positions = positions.filter(pos => {
        if (pos.hideFromOpen === true) {
          return false;
        }

        const status = (pos.status || '').toLowerCase();
        const isOnHoldOrClosed = CLOSED_STATUSES.some(s => status.includes(s.toLowerCase()));
        const maxCandidateLimit = pos.maxCandidate || 10;
        
        if (!isOnHoldOrClosed && (pos.activeCandidateCount || 0) >= maxCandidateLimit) {
          return false;
        }

        return true;
      });
    }

    return positions;
  } catch (error) {
    console.error("Error fetching positions by client SPOC:", error);
    throw error;
  }
};

/**
 * Batch update visibility for all positions
 * Useful for initial migration or scheduled cleanup
 */
const batchUpdateAllPositionsVisibility = async () => {
  try {
    const snap = await ad_pos.get();
    const positions = snap.docs.map(doc => ({
      id: doc.id,
      pos_id: doc.data().pos_id,
      status: doc.data().status,
      activeCandidateCount: doc.data().activeCandidateCount,
      hideFromOpen: doc.data().hideFromOpen
    }));

    let updated = 0;
    let skipped = 0;

    for (const pos of positions) {
      const status = (pos.status || '').toLowerCase();
      const isOnHoldOrClosed = CLOSED_STATUSES.some(s => status.includes(s.toLowerCase()));
      
      // Get fresh active count info
      const candidateInfo = await getActiveCandidateCount(pos.pos_id);
      const shouldHide = candidateInfo.isFull && !isOnHoldOrClosed;
      
      if (pos.hideFromOpen !== shouldHide || (pos.activeCandidateCount || 0) !== candidateInfo.count) {
        await ad_pos.doc(pos.id).update({
          hideFromOpen: shouldHide,
          activeCandidateCount: candidateInfo.count,
          maxCandidate: candidateInfo.maxCandidate,
          visibilityUpdatedAt: new Date()
        });
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`Batch update complete: ${updated} positions updated, ${skipped} skipped`);
    return { updated, skipped, total: positions.length };
  } catch (error) {
    console.error("Error in batch update:", error);
    throw error;
  }
};

// ==================== ORIGINAL POSITION FUNCTIONS ====================

const CreatePosition = async (data) => {
  const newPosId = (await getCurrentPositionId()).toString();


  const posAdd = await ad_pos.add({
    ...data,
    pos_id: newPosId,
    state: Array.isArray(data.state)
      ? data.state
      : typeof data.state === 'string'
      ? data.state.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    location: Array.isArray(data.location)
      ? data.location
      : typeof data.location === 'string'
      ? data.location.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    datePosted: new Date(),
    commison: Number(data.commison)
  });

  const pos = await posAdd.get();
  return { id: pos.id, ...pos.data() };
};



const updatePositionById = async (id, data) => {
  const docRef = ad_pos.doc(id);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new Error("Position not found");
  }

  // 🔒 Protect non-editable fields
  delete data.pos_id;
  delete data.client;
  delete data.position;
  delete data.datePosted;

  // Normalize arrays
  const payload = {
    ...data,
    state: Array.isArray(data.state)
      ? data.state
      : typeof data.state === 'string'
      ? data.state.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    location: Array.isArray(data.location)
      ? data.location
      : typeof data.location === 'string'
      ? data.location.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    commison: (data.commison !== undefined && data.commison !== null && data.commison !== '')
      ? Number(data.commison)
      : (snap.data().commison ?? 0),
    updatedAt: new Date()
  };

  await docRef.update(payload);

  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};


const getLatestPosition= async ()=>{

    const latPos= await ad_pos.orderBy('datePosted','desc').limit(4).get()
    return latPos.docs.map(normalizePosition)
    
}



const getPositionByTime = async ()=>{
    const v4="Immediate Hiring"
    const posTime= await ad_pos.where('pos_cat','==',v4).orderBy('pos_cat','desc').limit(3).get()
    return posTime.docs.map(normalizePosition)
}

const getPositionByCommison = async ()=>{
    const v3="High Commission"
    const posTime= await ad_pos.where('pos_cat','==',v3).orderBy('pos_cat','desc').limit(3).get()
    return posTime.docs.map(normalizePosition)
}




const getPositionByDrives = async ()=>{
    const v1="Interview Drives"
    const posTime= await ad_pos.where('pos_cat','==',v1).orderBy('pos_cat','desc').limit(3).get()
    return posTime.docs.map(normalizePosition)
}



const getPositionByFastResponse = async ()=>{
    const v2="Fast Response"
    const fastTime= await ad_pos.where('pos_cat','==',v2).orderBy('pos_cat','desc').limit(3).get()
    return fastTime.docs.map(normalizePosition)
}


const findPositionByPosId = async (pos_id) => {
  const snap = await ad_pos.where("pos_id", "==", pos_id).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

const findPositionById = async (id) => {
  const doc = await ad_pos.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const deletePositionById = async (id) => {
  await ad_pos.doc(id).delete();
  return { success: true, message: "Position deleted successfully" };
};

const getCurrentPositionId = async () => {
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);

    let lastId = 1000;

    if (doc.exists && typeof doc.data().lastId === "number") {
      lastId = doc.data().lastId;
    }

    const nextId = lastId + 1;

    if (doc.exists) {
      transaction.update(counterRef, { lastId: nextId });
    } else {
      transaction.set(counterRef, { lastId: nextId });
    }

    return nextId;
  });
};

/**
 * Get positions created by user (filtered by clientspoc) with candidate counts
 */
const getMyPositions = async (user) => {
  try {
    // Check if user is admin
    const isAdmin = user.role === 'admin' || user.roleCategory === 'Admin';
    
    // Query positions
    let posQuery = ad_pos;
    
    // Filter by clientspoc if not admin
    // Use email for matching since clientspoc field stores email addresses
    // Convert to lowercase for case-insensitive matching
    if (!isAdmin) {
      const userEmail = (user.email || "").toLowerCase();
      posQuery = posQuery.where("clientspoc", "==", userEmail);
    }
    
    const positionsSnap = await posQuery.get();
    
    if (positionsSnap.empty) {
      return [];
    }
    
    // Get all position IDs
    const positionIds = positionsSnap.docs.map(doc => doc.data().pos_id);
    
    // Get candidates for these positions
    let candidatesData = [];
    
    if (positionIds.length > 0) {
      // Firestore 'in' query limit is 10, so batch if needed
      for (let i = 0; i < positionIds.length; i += 10) {
        const batch = positionIds.slice(i, i + 10);
        const snap = await candidate.where("pos_id", "in", batch).get();
        candidatesData.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }
    
    // Build result with candidate counts and details
    const result = positionsSnap.docs.map(doc => {
      const position = { id: doc.id, ...doc.data() };
      
      // Get candidates for this position
      const positionCandidates = candidatesData.filter(c => c.pos_id === position.pos_id);
      
      // Format candidate details
      const candidates = positionCandidates.map(c => ({
        candidateName: c.candidate || c.name || 'Unknown',
        recruiterName: c.recName || c.recruiterName || c.recruiter_name || 'Unknown',
        dateAdded: c.datePosted || c.dateAdded || c.date_added || c.createdAt,
        lastUpdated: c.statusaDate || c.statusUpdatedAt || c.lastUpdated || c.updatedAt,
        status: c.statusa || c.status || 'Unknown'
      }));
      
      return {
        ...position,
        candidateCount: positionCandidates.length,
        candidates: candidates
      };
    });
    
    return result;
    
  } catch (error) {
    console.error("Error in getMyPositions:", error);
    throw error;
  }
};

// ==================== EXPORTS ====================

module.exports={
  getDetailedStats,
  getAdminStats, 
  updatePositionById, 
  getCurrentPositionId,
  getAllPosition, 
  findPositionByPosId,
  findPositionById,
  deletePositionById,
  CreatePosition, 
  getLatestPosition, 
  getPositionByCommison, 
  getPositionByDrives, 
  getPositionByFastResponse,
  getPositionByTime,
  getPositionsByClientSPOC, 
  getCandidatesByClientSPOC,
  getMyPositions,
  getClientStats,
  getAllSpocs,
  getAllRecruiterNames,
  getAllClientNames,
  // New exports for active candidate limit feature
  getActiveCandidateCount,
  updatePositionVisibility,
  getPositionsByClientSPOCWithVisibility,
  batchUpdateAllPositionsVisibility,
  REJECTION_STATUSES,
  CLOSED_STATUSES
}
