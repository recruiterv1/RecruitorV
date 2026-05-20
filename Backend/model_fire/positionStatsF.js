const { db } = require("../router/firebase_ad");
const positions = db.collection('admin_AddPos');
const candidates = db.collection("candidate_db");
const recruiters = db.collection('recruiter_db');

/**
 * Get position statistics with recruiter counts and submission data
 * Returns a list of all positions with statistics
 */
const getPositionStats = async () => {
  try {
    // 1. Get all positions
    const positionsSnap = await positions.get();
    
    if (positionsSnap.empty) {
      return [];
    }

    // 2. Get all candidates
    const candidatesSnap = await candidates.get();
    const candidatesData = candidatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. Get all recruiters for name mapping
    const recruitersSnap = await recruiters.get();
    const recruiterMap = {};
    recruitersSnap.docs.forEach(doc => {
      recruiterMap[doc.id] = doc.data().name || 'Unknown';
    });

    // 4. Build position stats
    const positionStats = [];

    for (const posDoc of positionsSnap.docs) {
      const posData = posDoc.data();
      const posId = posData.pos_id;

      // Get candidates for this position
      const posCandidates = candidatesData.filter(c => c.pos_id === posId);
      
      // Get unique recruiters working on this position
      const uniqueRecruiters = [...new Set(posCandidates.map(c => c.recId))].filter(Boolean);
      const recruiterCount = uniqueRecruiters.length;

      // Count submissions
      const totalSubmissions = posCandidates.length;

      // Count by status
      const successStatuses = ['Offer Accepted', 'Joining'];
      const rejectionStatuses = [
        'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 
        'HR Reject', 'Background Verification Reject', 
        'Negotiation Reject', 'Offer Declined'
      ];

      const successfulCount = posCandidates.filter(c => 
        successStatuses.includes(c.statusa)
      ).length;

      const rejectedCount = posCandidates.filter(c => 
        rejectionStatuses.includes(c.statusa)
      ).length;

      const onProcessCount = totalSubmissions - successfulCount - rejectedCount;

      // Calculate success rate
      const successRate = totalSubmissions > 0 
        ? ((successfulCount / totalSubmissions) * 100).toFixed(1) + '%'
        : '0%';

      // Get last updated date (most recent submission or status change)
      let lastUpdated = null;
      if (posCandidates.length > 0) {
        const dates = posCandidates.map(c => {
          if (c.updatedAt) {
            if (c.updatedAt._seconds) {
              return new Date(c.updatedAt._seconds * 1000);
            } else if (c.updatedAt.seconds) {
              return new Date(c.updatedAt.seconds * 1000);
            } else if (c.updatedAt.toDate) {
              return c.updatedAt.toDate();
            } else if (typeof c.updatedAt === 'string') {
              return new Date(c.updatedAt);
            } else if (c.updatedAt instanceof Date) {
              return c.updatedAt;
            }
          }
          // Fallback to datePosted
          if (c.datePosted) {
            if (c.datePosted._seconds) {
              return new Date(c.datePosted._seconds * 1000);
            } else if (c.datePosted.seconds) {
              return new Date(c.datePosted.seconds * 1000);
            } else if (c.datePosted.toDate) {
              return c.datePosted.toDate();
            } else if (typeof c.datePosted === 'string') {
              return new Date(c.datePosted);
            } else if (c.datePosted instanceof Date) {
              return c.datePosted;
            }
          }
          return null;
        }).filter(Boolean);

        if (dates.length > 0) {
          lastUpdated = new Date(Math.max(...dates)).toISOString();
        }
      }

      positionStats.push({
        id: posDoc.id,
        posId: posId,
        positionName: posData.position || 'N/A',
        client: posData.client || 'N/A',
        hrName: posData.hr_name || 'N/A',
        recruiterCount: recruiterCount,
        totalSubmissions: totalSubmissions,
        onProcess: onProcessCount,
        successful: successfulCount,
        rejected: rejectedCount,
        successRate: successRate,
        lastUpdated: lastUpdated,
        datePosted: posData.datePosted ? 
          (posData.datePosted._seconds ? new Date(posData.datePosted._seconds * 1000).toISOString() :
           posData.datePosted.seconds ? new Date(posData.datePosted.seconds * 1000).toISOString() :
           posData.datePosted.toDate ? posData.datePosted.toDate().toISOString() :
           typeof posData.datePosted === 'string' ? posData.datePosted :
           posData.datePosted instanceof Date ? posData.datePosted.toISOString() : null) : null
      });
    }

    // Sort by last updated (most recent first)
    positionStats.sort((a, b) => {
      if (!a.lastUpdated) return 1;
      if (!b.lastUpdated) return -1;
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    });

    return positionStats;

  } catch (error) {
    console.error("Error fetching position stats:", error);
    throw error;
  }
};

/**
 * Get detailed statistics for a specific position
 * Includes all submissions with recruiter names, dates, and statuses
 */
const getPositionDetailedStats = async (posId) => {
  try {
    // 1. Get position details
    const posSnap = await positions.where('pos_id', '==', posId).limit(1).get();
    
    if (posSnap.empty) {
      throw new Error('Position not found');
    }

    const posDoc = posSnap.docs[0];
    const posData = posDoc.data();

    // 2. Get all candidates for this position
    const candidatesSnap = await candidates.where('pos_id', '==', posId).get();
    const candidatesData = candidatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. Get recruiter details
    const recruiterIds = [...new Set(candidatesData.map(c => c.recId))].filter(Boolean);
    const recruiterMap = {};
    
    for (const recId of recruiterIds) {
      const recDoc = await recruiters.doc(recId).get();
      if (recDoc.exists) {
        recruiterMap[recId] = {
          name: recDoc.data().name || 'Unknown',
          email: recDoc.data().email || 'N/A'
        };
      } else {
        recruiterMap[recId] = {
          name: 'Unknown',
          email: 'N/A'
        };
      }
    }

    // 4. Build submission details
    const submissions = candidatesData.map(c => {
      // Handle date conversion
      let submittedDate = null;
      if (c.datePosted) {
        if (c.datePosted._seconds) {
          submittedDate = new Date(c.datePosted._seconds * 1000).toISOString();
        } else if (c.datePosted.seconds) {
          submittedDate = new Date(c.datePosted.seconds * 1000).toISOString();
        } else if (c.datePosted.toDate) {
          submittedDate = c.datePosted.toDate().toISOString();
        } else if (typeof c.datePosted === 'string') {
          submittedDate = c.datePosted;
        } else if (c.datePosted instanceof Date) {
          submittedDate = c.datePosted.toISOString();
        }
      }

      let updatedDate = null;
      if (c.updatedAt) {
        if (c.updatedAt._seconds) {
          updatedDate = new Date(c.updatedAt._seconds * 1000).toISOString();
        } else if (c.updatedAt.seconds) {
          updatedDate = new Date(c.updatedAt.seconds * 1000).toISOString();
        } else if (c.updatedAt.toDate) {
          updatedDate = c.updatedAt.toDate().toISOString();
        } else if (typeof c.updatedAt === 'string') {
          updatedDate = c.updatedAt;
        } else if (c.updatedAt instanceof Date) {
          updatedDate = c.updatedAt.toISOString();
        }
      }

      const recruiterInfo = recruiterMap[c.recId] || { name: 'Unknown', email: 'N/A' };

      return {
        candidateId: c.id,
        candidateName: c.candidate || c.name || 'N/A',
        recruiterName: recruiterInfo.name,
        recruiterEmail: recruiterInfo.email,
        recruiterId: c.recId || 'N/A',
        status: c.statusa || 'N/A',
        submittedDate: submittedDate,
        lastUpdated: updatedDate || submittedDate,
        email: c.emails || 'N/A',
        phone: c.mob || 'N/A'
      };
    });

    // Sort by submission date (most recent first)
    submissions.sort((a, b) => {
      if (!a.submittedDate) return 1;
      if (!b.submittedDate) return -1;
      return new Date(b.submittedDate) - new Date(a.submittedDate);
    });

    // 5. Group submissions by recruiter
    const recruiterBreakdown = {};
    submissions.forEach(sub => {
      const recId = sub.recruiterId;
      if (!recruiterBreakdown[recId]) {
        recruiterBreakdown[recId] = {
          recruiterId: recId,
          recruiterName: sub.recruiterName,
          recruiterEmail: sub.recruiterEmail,
          submissionCount: 0,
          submissions: []
        };
      }
      recruiterBreakdown[recId].submissionCount++;
      recruiterBreakdown[recId].submissions.push(sub);
    });

    return {
      position: {
        id: posDoc.id,
        posId: posId,
        positionName: posData.position || 'N/A',
        client: posData.client || 'N/A',
        hrName: posData.hr_name || 'N/A',
        datePosted: posData.datePosted ? 
          (posData.datePosted._seconds ? new Date(posData.datePosted._seconds * 1000).toISOString() :
           posData.datePosted.seconds ? new Date(posData.datePosted.seconds * 1000).toISOString() :
           posData.datePosted.toDate ? posData.datePosted.toDate().toISOString() :
           typeof posData.datePosted === 'string' ? posData.datePosted :
           posData.datePosted instanceof Date ? posData.datePosted.toISOString() : null) : null
      },
      totalRecruiters: Object.keys(recruiterBreakdown).length,
      totalSubmissions: submissions.length,
      submissions: submissions,
      recruiterBreakdown: Object.values(recruiterBreakdown)
    };

  } catch (error) {
    console.error("Error fetching position detailed stats:", error);
    throw error;
  }
};

/**
 * Get positions that had activity on a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 */
const getPositionsByDate = async (date) => {
  try {
    // Parse the date to get start and end of day
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // Get all candidates submitted or updated on this date
    const candidatesSnap = await candidates.get();
    const candidatesData = candidatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter candidates by date
    const filteredCandidates = candidatesData.filter(c => {
      let candidateDate = null;
      
      // Check updatedAt first
      if (c.updatedAt) {
        if (c.updatedAt._seconds) {
          candidateDate = new Date(c.updatedAt._seconds * 1000);
        } else if (c.updatedAt.seconds) {
          candidateDate = new Date(c.updatedAt.seconds * 1000);
        } else if (c.updatedAt.toDate) {
          candidateDate = c.updatedAt.toDate();
        } else if (typeof c.updatedAt === 'string') {
          candidateDate = new Date(c.updatedAt);
        } else if (c.updatedAt instanceof Date) {
          candidateDate = c.updatedAt;
        }
      }
      
      // Fallback to datePosted
      if (!candidateDate && c.datePosted) {
        if (c.datePosted._seconds) {
          candidateDate = new Date(c.datePosted._seconds * 1000);
        } else if (c.datePosted.seconds) {
          candidateDate = new Date(c.datePosted.seconds * 1000);
        } else if (c.datePosted.toDate) {
          candidateDate = c.datePosted.toDate();
        } else if (typeof c.datePosted === 'string') {
          candidateDate = new Date(c.datePosted);
        } else if (c.datePosted instanceof Date) {
          candidateDate = c.datePosted;
        }
      }

      return candidateDate && candidateDate >= startOfDay && candidateDate <= endOfDay;
    });

    // Get unique position IDs
    const positionIds = [...new Set(filteredCandidates.map(c => c.pos_id))].filter(Boolean);

    if (positionIds.length === 0) {
      return [];
    }

    // Get position details
    const positionStats = [];
    const recruiterMap = {};

    // Get recruiter names
    const recruiterIds = [...new Set(filteredCandidates.map(c => c.recId))].filter(Boolean);
    for (const recId of recruiterIds) {
      const recDoc = await recruiters.doc(recId).get();
      if (recDoc.exists) {
        recruiterMap[recId] = recDoc.data().name || 'Unknown';
      }
    }

    for (const posId of positionIds) {
      const posSnap = await positions.where('pos_id', '==', posId).limit(1).get();
      
      if (!posSnap.empty) {
        const posData = posSnap.docs[0].data();
        const posCandidates = filteredCandidates.filter(c => c.pos_id === posId);
        const uniqueRecruiters = [...new Set(posCandidates.map(c => c.recId))].filter(Boolean);

        positionStats.push({
          posId: posId,
          positionName: posData.position || 'N/A',
          client: posData.client || 'N/A',
          recruiterCount: uniqueRecruiters.length,
          recruiters: uniqueRecruiters.map(recId => ({
            id: recId,
            name: recruiterMap[recId] || 'Unknown'
          })),
          submissionsOnDate: posCandidates.length,
          submissions: posCandidates.map(c => ({
            candidateName: c.candidate || 'N/A',
            recruiterName: recruiterMap[c.recId] || 'Unknown',
            status: c.statusa || 'N/A'
          }))
        });
      }
    }

    return positionStats;

  } catch (error) {
    console.error("Error fetching positions by date:", error);
    throw error;
  }
};

module.exports = {
  getPositionStats,
  getPositionDetailedStats,
  getPositionsByDate
};
