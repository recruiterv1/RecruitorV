const { db } = require("../router/firebase_ad");

const candidateDb = db.collection("candidate_db");
const positionsDb = db.collection("admin_AddPos");
const recruiterDb = db.collection("recruiter_db");

/**
 * Get earnings data for a specific recruiter
 * Shows candidates who have been submitted and are NOT rejected
 * Includes: "Offer Accepted", "Joining", "Joined", and all other pending statuses
 * EXCLUDES: "Rejected", "Client Rejected", "Candidate Rejected"
 * Calculates commission based on CTC and commission percentage
 */
const getRecruiterEarnings = async (recruiterId, recruiterEmail) => {
  try {
    // 1. Get all candidates submitted by this recruiter
    const candidatesSnap = await candidateDb
      .where("recId", "==", recruiterId)
      .get();

    if (candidatesSnap.empty) {
      return {
        earnings: [],
        totalEstimatedEarnings: 0,
        totalCandidates: 0
      };
    }

    // 2. Filter candidates: include all EXCEPT rejected statuses
    const rejectedStatuses = ["Rejected", "Client Rejected", "Candidate Rejected"];
    const eligibleCandidates = candidatesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(candidate => !rejectedStatuses.includes(candidate.statusa));

    if (eligibleCandidates.length === 0) {
      return {
        earnings: [],
        totalEstimatedEarnings: 0,
        totalCandidates: 0
      };
    }

    // 3. Get unique position IDs
    const positionIds = [...new Set(eligibleCandidates.map(c => c.pos_id))].filter(Boolean);

    // 4. Fetch position details (batch in groups of 10 due to Firestore limit)
    const positionsMap = {};
    
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const posSnap = await positionsDb.where("pos_id", "in", batch).get();
      
      posSnap.docs.forEach(doc => {
        const posData = doc.data();
        positionsMap[posData.pos_id] = {
          positionName: posData.position || "N/A",
          ctcStart: posData.ctcStart || 0,
          ctcEnd: posData.ctcEnd || 0,
          commission: posData.commison || 0
        };
      });
    }

    // 5. Build earnings data with commission calculations
    const earnings = eligibleCandidates.map(candidate => {
      const position = positionsMap[candidate.pos_id] || {
        positionName: "Unknown Position",
        ctcStart: 0,
        ctcEnd: 0,
        commission: 0
      };

      // Calculate commission amount: (CTC Start × Commission %) / 100
      const ctcAmount = parseFloat(position.ctcStart) || 0;
      const commissionPercent = parseFloat(position.commission) || 0;
      const commissionAmount = (ctcAmount * commissionPercent) / 100;

      return {
        candidateId: candidate.id,
        candidateName: candidate.candidate || candidate.name || "Unknown",
        positionId: candidate.pos_id,
        positionName: position.positionName,
        ctcStart: ctcAmount,
        ctcEnd: parseFloat(position.ctcEnd) || 0,
        commissionPercent: commissionPercent,
        commissionAmount: commissionAmount,
        status: candidate.statusa,
        dateAdded: candidate.datePosted || candidate.createdAt || null,
        statusUpdatedAt: candidate.statusaDate || candidate.updatedAt || null
      };
    });

    // 6. Calculate total estimated earnings
    const totalEstimatedEarnings = earnings.reduce((sum, item) => sum + item.commissionAmount, 0);

    // 7. Sort by commission amount (highest first)
    earnings.sort((a, b) => b.commissionAmount - a.commissionAmount);

    return {
      earnings,
      totalEstimatedEarnings,
      totalCandidates: earnings.length,
      recruiterInfo: {
        recruiterId,
        recruiterEmail
      }
    };

  } catch (error) {
    console.error("Error fetching recruiter earnings:", error);
    throw error;
  }
};

/**
 * Get earnings summary statistics for a recruiter
 */
const getEarningsSummary = async (recruiterId) => {
  try {
    const candidatesSnap = await candidateDb
      .where("recId", "==", recruiterId)
      .get();

    const candidates = candidatesSnap.docs.map(doc => doc.data());
    
    const successStatuses = ["Offer Accepted", "Joining"];
    const acceptedCount = candidates.filter(c => successStatuses.includes(c.statusa)).length;
    const totalSubmissions = candidates.length;

    return {
      totalSubmissions,
      acceptedOffers: acceptedCount,
      conversionRate: totalSubmissions > 0 
        ? ((acceptedCount / totalSubmissions) * 100).toFixed(1) 
        : "0.0"
    };

  } catch (error) {
    console.error("Error fetching earnings summary:", error);
    throw error;
  }
};

module.exports = {
  getRecruiterEarnings,
  getEarningsSummary
};
