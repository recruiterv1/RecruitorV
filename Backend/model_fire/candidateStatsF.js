const { db } = require("../router/firebase_ad");

const candidateDb = db.collection('candidate_db');
const positionsDb = db.collection('admin_AddPos');

// getAllCandidates/getCandidateStatistics/getUniqueStatuses each independently read
// the entire candidate_db collection on every call. A single dashboard load fires
// several of these back to back (list + statuses, then again on every filter/page
// change), so on a large collection that repeated full scan was slow enough to
// time out ("Failed to load candidate activity"). Cache the raw snapshot briefly
// so those calls share one Firestore read instead of one each.
const CANDIDATES_CACHE_TTL_MS = 30 * 1000;
let candidatesCache = { data: null, timestamp: 0 };

const getCachedCandidates = async () => {
  const now = Date.now();
  if (candidatesCache.data && (now - candidatesCache.timestamp) < CANDIDATES_CACHE_TTL_MS) {
    return candidatesCache.data;
  }
  // Candidate docs also carry resumeText/cv_data/matchTokens (many KB each); none of the
  // stats/list functions below use them, so project down to just what they read.
  const snapshot = await candidateDb
    .select('candidate', 'name', 'mob', 'emails', 'pos_id', 'statusa', 'client', 'datePosted', 'updatedAt', 'recName', 'recId')
    .get();
  const candidates = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  candidatesCache = { data: candidates, timestamp: now };
  return candidates;
};

/**
 * Get all candidates with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Candidates with pagination info
 */
const getAllCandidates = async (filters = {}, page = 1, limit = 50) => {
  try {
    const offset = (page - 1) * limit;

    // Get all candidates first (copy so filter/sort below never mutates the shared cache)
    let candidates = [...(await getCachedCandidates())];

    // Apply filters
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      candidates = candidates.filter(c => 
        (c.candidate?.toLowerCase().includes(searchTerm) || c.name?.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.phone) {
      const searchPhone = filters.phone.toLowerCase();
      candidates = candidates.filter(c => 
        c.mob?.toLowerCase().includes(searchPhone)
      );
    }
    
    if (filters.email) {
      const searchEmail = filters.email.toLowerCase();
      candidates = candidates.filter(c => 
        c.emails?.toLowerCase().includes(searchEmail)
      );
    }
    
    if (filters.position) {
      const searchPosition = filters.position.toLowerCase();
      candidates = candidates.filter(c => 
        c.pos_id?.toLowerCase().includes(searchPosition)
      );
    }
    
    if (filters.status) {
      candidates = candidates.filter(c => 
        c.statusa === filters.status
      );
    }
    
    if (filters.lastUpdateDate) {
      const filterDate = new Date(filters.lastUpdateDate);
      filterDate.setHours(0, 0, 0, 0);
      
      candidates = candidates.filter(c => {
        const updateDate = c.updatedAt?.toDate?.() || c.datePosted?.toDate?.() || new Date(c.datePosted || 0);
        updateDate.setHours(0, 0, 0, 0);
        return updateDate >= filterDate;
      });
    }
    
    // Sort by most recent first (using updatedAt or datePosted)
    candidates.sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || a.datePosted?.toDate?.() || new Date(a.datePosted || 0);
      const dateB = b.updatedAt?.toDate?.() || b.datePosted?.toDate?.() || new Date(b.datePosted || 0);
      return dateB - dateA;
    });
    
    const totalCount = candidates.length;
    const paginatedCandidates = candidates.slice(offset, offset + limit);
    
    // Get unique position IDs from paginated candidates
    const uniquePositionIds = [...new Set(paginatedCandidates.map(c => c.pos_id).filter(Boolean))];
    
    // Fetch position details from admin_AddPos collection
    const positionDetailsMap = {};
    if (uniquePositionIds.length > 0) {
      // Firestore 'in' query limit is 10, so batch if needed
      for (let i = 0; i < uniquePositionIds.length; i += 10) {
        const batch = uniquePositionIds.slice(i, i + 10);
        const posSnap = await positionsDb.where("pos_id", "in", batch).get();
        posSnap.docs.forEach(doc => {
          const data = doc.data();
          positionDetailsMap[data.pos_id] = data.position || 'N/A';
        });
      }
    }
    
    // Format candidates for response
    const formattedCandidates = paginatedCandidates.map(c => ({
      id: c.id,
      name: c.candidate || c.name || 'N/A',
      phone: c.mob || 'N/A',
      email: c.emails || 'N/A',
      positionId: c.pos_id || 'N/A',
      position: positionDetailsMap[c.pos_id] || c.pos_id || 'N/A', // Position name from admin_AddPos
      client: c.client || 'N/A',
      status: c.statusa || 'N/A',
      dateAdded: c.datePosted?.toDate?.() || new Date(c.datePosted || Date.now()),
      lastUpdate: c.updatedAt?.toDate?.() || c.datePosted?.toDate?.() || new Date(c.datePosted || Date.now()),
      recruiterName: c.recName || 'N/A',
      recruiterId: c.recId || 'N/A'
    }));
    
    return {
      success: true,
      data: {
        candidates: formattedCandidates,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          recordsPerPage: limit
        },
        filters
      }
    };
  } catch (error) {
    console.error('Error getting candidates:', error);
    throw error;
  }
};

/**
 * Get candidate statistics summary
 * @returns {Object} Statistics summary
 */
const getCandidateStatistics = async () => {
  try {
    const candidates = await getCachedCandidates();

    // Calculate statistics
    const totalCandidates = candidates.length;
    
    // Status breakdown
    const statusCounts = {};
    candidates.forEach(c => {
      const status = c.statusa || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Position breakdown (by pos_id)
    const positionCounts = {};
    candidates.forEach(c => {
      const position = c.pos_id || 'Unknown';
      positionCounts[position] = (positionCounts[position] || 0) + 1;
    });
    
    // Get unique positions (by pos_id)
    const uniquePositions = [...new Set(candidates.map(c => c.pos_id).filter(Boolean))];
    
    // Get unique clients
    const uniqueClients = [...new Set(candidates.map(c => c.client).filter(Boolean))];
    
    // Recent candidates (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCandidates = candidates.filter(c => {
      const date = c.datePosted?.toDate?.() || new Date(c.datePosted || 0);
      return date >= sevenDaysAgo;
    });
    
    return {
      success: true,
      data: {
        totalCandidates,
        uniquePositions: uniquePositions.length,
        uniqueClients: uniqueClients.length,
        recentCandidates: recentCandidates.length,
        statusBreakdown: statusCounts,
        topPositions: Object.entries(positionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([position, count]) => ({ position, count }))
      }
    };
  } catch (error) {
    console.error('Error getting candidate statistics:', error);
    throw error;
  }
};

/**
 * Get unique status values
 * @returns {Array} List of unique status values
 */
const getUniqueStatuses = async () => {
  try {
    const candidates = await getCachedCandidates();
    const statuses = new Set();

    candidates.forEach(c => {
      if (c.statusa) {
        statuses.add(c.statusa);
      }
    });

    return {
      success: true,
      data: Array.from(statuses).sort()
    };
  } catch (error) {
    console.error('Error getting unique statuses:', error);
    throw error;
  }
};

module.exports = {
  getAllCandidates,
  getCandidateStatistics,
  getUniqueStatuses
};
