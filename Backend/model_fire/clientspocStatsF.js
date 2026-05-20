const { db } = require("../router/firebase_ad");
const clientspocDb = db.collection('admin_db');
const positions = db.collection("admin_AddPos");
const candidate = db.collection("candidate_db");

/**
 * Get Client SPOC statistics with position and recruiter counts
 * Returns a list of all Client SPOCs with their statistics
 */
const getClientSpocStats = async () => {
  try {
    // 1. Get all Client SPOCs
    const spocsSnap = await clientspocDb.get();
    
    if (spocsSnap.empty) {
      return [];
    }

    // 2. Get all positions
    const positionsSnap = await positions.get();
    const positionsData = positionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. Get all candidates
    const candidatesSnap = await candidate.get();
    const candidatesData = candidatesSnap.docs.map(doc => doc.data());

    // 4. Build SPOC stats
    const spocStats = [];

    for (const spocDoc of spocsSnap.docs) {
      const spocData = spocDoc.data();
      const spocId = spocDoc.id;
      const spocEmail = (spocData.email || "").toLowerCase();
      const spocName = spocData.firstName && spocData.lastName 
        ? `${spocData.firstName} ${spocData.lastName}`
        : spocData.name || spocEmail;

      // Get positions created by this SPOC (match by email)
      const spocPositions = positionsData.filter(p => 
        (p.clientspoc || "").toLowerCase() === spocEmail
      );
      const positionCount = spocPositions.length;

      // Get unique clients from positions
      const uniqueClients = [...new Set(spocPositions.map(p => p.client).filter(Boolean))];
      const clientCount = uniqueClients.length;

      // Get position IDs for this SPOC
      const positionIds = spocPositions.map(p => p.pos_id);

      // Get candidates for these positions
      const spocCandidates = candidatesData.filter(c => positionIds.includes(c.pos_id));

      // Get unique recruiters from candidates
      const uniqueRecruiters = [...new Set(spocCandidates.map(c => c.recId).filter(Boolean))];
      const recruiterCount = uniqueRecruiters.length;

      // Count candidates by status
      const submittedCount = spocCandidates.length;
      
      const successStatuses = ['Offer Accepted', 'Joining'];
      const rejectionStatuses = [
        'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 
        'HR Reject', 'Background Verification Reject', 
        'Negotiation Reject', 'Offer Declined'
      ];

      const successfulCount = spocCandidates.filter(c => 
        successStatuses.includes(c.statusa)
      ).length;

      const rejectedCount = spocCandidates.filter(c => 
        rejectionStatuses.includes(c.statusa)
      ).length;

      const onProcessCount = submittedCount - successfulCount - rejectedCount;

      // Handle lastActive timestamp conversion
      let lastActiveDate = null;
      if (spocData.lastActive) {
        if (spocData.lastActive._seconds) {
          lastActiveDate = new Date(spocData.lastActive._seconds * 1000).toISOString();
        } else if (spocData.lastActive.seconds) {
          lastActiveDate = new Date(spocData.lastActive.seconds * 1000).toISOString();
        } else if (spocData.lastActive.toDate) {
          lastActiveDate = spocData.lastActive.toDate().toISOString();
        } else if (typeof spocData.lastActive === 'string') {
          lastActiveDate = spocData.lastActive;
        } else if (spocData.lastActive instanceof Date) {
          lastActiveDate = spocData.lastActive.toISOString();
        }
      }

      spocStats.push({
        id: spocId,
        name: spocData.name || 'N/A',
        email: spocEmail || 'N/A',
        clientCount: clientCount,
        positionCount: positionCount,
        recruiterCount: recruiterCount,
        candidatesSubmitted: submittedCount,
        candidatesOnProcess: onProcessCount,
        candidatesSuccessful: successfulCount,
        candidatesRejected: rejectedCount,
        successRate: submittedCount > 0 
          ? ((successfulCount / submittedCount) * 100).toFixed(1) + '%'
          : '0%',
        lastActive: lastActiveDate,
        createdAt: spocData.createdAt || null
      });
    }

    // Sort by position count (descending)
    spocStats.sort((a, b) => b.positionCount - a.positionCount);

    return spocStats;

  } catch (error) {
    console.error("Error fetching Client SPOC stats:", error);
    throw error;
  }
};

/**
 * Get detailed statistics for a specific Client SPOC
 * Returns client-wise breakdown of positions and candidates
 */
const getClientSpocDetailedStats = async (spocId) => {
  try {
    // 1. Get SPOC data
    const spocDoc = await clientspocDb.doc(spocId).get();
    
    if (!spocDoc.exists) {
      throw new Error('Client SPOC not found');
    }

    const spocData = spocDoc.data();
    const spocEmail = (spocData.email || "").toLowerCase();
    const spocName = spocData.firstName && spocData.lastName 
      ? `${spocData.firstName} ${spocData.lastName}`
      : spocData.name || spocEmail;

    // 2. Get all positions created by this SPOC (match by email)
    const positionsSnap = await positions.where('clientspoc', '==', spocEmail).get();
    
    if (positionsSnap.empty) {
      return {
        spoc: {
          id: spocId,
          name: spocData.name,
          email: spocData.email
        },
        totalClients: 0,
        totalPositions: 0,
        totalCandidates: 0,
        clientBreakdown: []
      };
    }

    const positionsData = positionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. Get all candidates for these positions
    const positionIds = positionsData.map(p => p.pos_id);
    let candidatesData = [];

    // Batch queries in groups of 10 (Firestore limit)
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const snap = await candidate.where('pos_id', 'in', batch).get();
      candidatesData.push(...snap.docs.map(doc => doc.data()));
    }

    // 4. Group by client
    const clientMap = {};

    positionsData.forEach(pos => {
      const clientName = pos.client || 'Unknown Client';
      
      if (!clientMap[clientName]) {
        clientMap[clientName] = {
          clientName: clientName,
          positionCount: 0,
          positions: []
        };
      }

      // Get candidates for this position
      const positionCandidates = candidatesData.filter(c => c.pos_id === pos.pos_id);

      // Handle date conversion
      let datePosted = null;
      if (pos.datePosted) {
        if (pos.datePosted._seconds) {
          datePosted = new Date(pos.datePosted._seconds * 1000).toISOString();
        } else if (pos.datePosted.seconds) {
          datePosted = new Date(pos.datePosted.seconds * 1000).toISOString();
        } else if (pos.datePosted.toDate) {
          datePosted = pos.datePosted.toDate().toISOString();
        } else if (typeof pos.datePosted === 'string') {
          datePosted = pos.datePosted;
        } else if (pos.datePosted instanceof Date) {
          datePosted = pos.datePosted.toISOString();
        }
      }

      clientMap[clientName].positionCount++;
      clientMap[clientName].positions.push({
        positionId: pos.pos_id,
        positionName: pos.position || 'N/A',
        hrName: pos.hr_name || 'N/A',
        candidateCount: positionCandidates.length,
        datePosted: datePosted,
        candidates: positionCandidates.map(c => ({
          name: c.candidate || c.name || 'N/A',
          recruiterName: c.recName || 'N/A',
          status: c.statusa || 'N/A',
          submittedDate: c.datePosted ? 
            (c.datePosted._seconds ? new Date(c.datePosted._seconds * 1000).toISOString() :
             c.datePosted.seconds ? new Date(c.datePosted.seconds * 1000).toISOString() :
             c.datePosted.toDate ? c.datePosted.toDate().toISOString() :
             c.datePosted) : null
        }))
      });
    });

    return {
      spoc: {
        id: spocId,
        name: spocData.name,
        email: spocData.email
      },
      totalClients: Object.keys(clientMap).length,
      totalPositions: positionsData.length,
      totalCandidates: candidatesData.length,
      clientBreakdown: Object.values(clientMap)
    };

  } catch (error) {
    console.error("Error fetching Client SPOC detailed stats:", error);
    throw error;
  }
};

module.exports = {
  getClientSpocStats,
  getClientSpocDetailedStats
};
