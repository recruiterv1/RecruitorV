const { db } = require("../router/firebase_ad");
const companyDb = db.collection('Company_Overview');
const positions = db.collection("admin_AddPos");
const candidate = db.collection("candidate_db");
const clientspocDb = db.collection('admin_db');

/**
 * Get all clients with their statistics
 * Returns client-wise position, candidate, and recruiter counts
 */
const getClientStats = async (filters = {}) => {
  try {
    // 1. Get all companies/clients
    const companiesSnap = await companyDb.get();
    
    if (companiesSnap.empty) {
      return [];
    }

    const companiesData = companiesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 2. Get all positions
    const positionsSnap = await positions.get();
    const positionsData = positionsSnap.docs.map(doc => ({
      id: doc.id,
      pos_id: doc.data().pos_id,
      ...doc.data()
    }));

    // 3. Get all candidates
    const candidatesSnap = await candidate.get();
    const candidatesData = candidatesSnap.docs.map(doc => doc.data());

    // 4. Get all SPOCs for SPOC name lookup
    const spocsSnap = await clientspocDb.get();
    const spocsData = spocsSnap.docs.map(doc => ({
      id: doc.id,
      email: (doc.data().email || "").toLowerCase(),
      name: doc.data().name || 'N/A'
    }));

    // 5. Build SPOC lookup map by email
    const spocByEmail = {};
    spocsData.forEach(spoc => {
      spocByEmail[spoc.email] = spoc;
    });

    // 6. Build client stats
    const clientStats = [];

    companiesData.forEach(company => {
      // Get positions for this client
      const clientPositions = positionsData.filter(p => 
        (p.client || "").toLowerCase() === (company.name || "").toLowerCase()
      );
      const positionCount = clientPositions.length;

      // Get position IDs
      const positionIds = clientPositions.map(p => p.pos_id);

      // Get candidates for these positions
      const clientCandidates = candidatesData.filter(c => positionIds.includes(c.pos_id));
      const candidateCount = clientCandidates.length;

      // Get unique recruiters from candidates
      const uniqueRecruiters = [...new Set(clientCandidates.map(c => c.recName).filter(Boolean))];
      const recruiterCount = uniqueRecruiters.length;

      // Get SPOC email from positions and find SPOC name
      const spocEmails = [...new Set(clientPositions.map(p => (p.clientspoc || "").toLowerCase()).filter(Boolean))];
      const spocNames = spocEmails.map(email => spocByEmail[email]?.name || email).join(', ');

      // Build position-wise breakdown for details
      const positionBreakdown = clientPositions.map(pos => {
        const posCandidates = candidatesData.filter(c => c.pos_id === pos.pos_id);
        
        // Group candidates by recruiter
        const recruiterMap = {};
        posCandidates.forEach(cand => {
          const recName = cand.recName || 'Unknown';
          if (!recruiterMap[recName]) {
            recruiterMap[recName] = {
              recruiterName: recName,
              candidateCount: 0,
              candidates: []
            };
          }
          recruiterMap[recName].candidateCount++;
          recruiterMap[recName].candidates.push({
            name: cand.candidate || cand.name || 'N/A',
            status: cand.statusa || 'N/A',
            submittedDate: formatDate(cand.datePosted),
            lastUpdated: formatDate(cand.updatedAt) || formatDate(cand.statusaDate) || formatDate(cand.datePosted)
          });
        });

        return {
          positionId: pos.pos_id,
          positionName: pos.position || 'N/A',
          hrName: pos.hr_name || 'N/A',
          spocName: spocByEmail[(pos.clientspoc || "").toLowerCase()]?.name || pos.clientspoc || 'N/A',
          candidateCount: posCandidates.length,
          recruiters: Object.values(recruiterMap),
          positionDate: formatDate(pos.datePosted)
        };
      });

      // Count candidates by status
      const statusCounts = {};
      clientCandidates.forEach(cand => {
        const status = cand.statusa || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Filter by SPOC name if specified
      if (filters.spocName && !spocNames.toLowerCase().includes(filters.spocName.toLowerCase())) {
        return;
      }

      // Filter by client name if specified
      if (filters.clientName && !(company.name || "").toLowerCase().includes(filters.clientName.toLowerCase())) {
        return;
      }

      // Filter by recruiter name if specified
      if (filters.recruiterName) {
        const hasRecruiter = uniqueRecruiters.some(r => 
          (r || "").toLowerCase().includes(filters.recruiterName.toLowerCase())
        );
        if (!hasRecruiter) return;
      }

      // Filter by status if specified
      if (filters.status) {
        const statusKey = filters.status.toLowerCase();
        const hasStatus = Object.keys(statusCounts).some(s => 
          s.toLowerCase().includes(statusKey)
        );
        if (!hasStatus) return;
      }

      // Filter by date if specified (single date filter)
      if (filters.date) {
        const filterDate = new Date(filters.date);
        filterDate.setHours(0, 0, 0, 0);
        
        const clientDate = client.positionDate ? new Date(client.positionDate) : null;
        if (!clientDate || clientDate.getTime() === 0) return;
        
        // Check if client date matches the selected date
        const clientDateNormalized = new Date(clientDate);
        clientDateNormalized.setHours(0, 0, 0, 0);
        
        if (clientDateNormalized.getTime() !== filterDate.getTime()) return;
      }

      clientStats.push({
        id: company.id,
        clientName: company.name || 'N/A',
        positionCount: positionCount,
        candidateCount: candidateCount,
        recruiterCount: recruiterCount,
        spocName: spocNames || 'N/A',
        positionBreakdown: positionBreakdown,
        statusCounts: statusCounts,
        createdAt: company.createdAt || null,
        lastUpdated: company.lastUpdated || company.datePosted || null,
        // Get the earliest position creation date for this client
        positionDate: clientPositions.length > 0 
          ? Math.min(...clientPositions.map(p => p.datePosted ? new Date(p.datePosted).getTime() : 0))
          : null
      });
    });

    // Sort by candidate count (descending) by default
    clientStats.sort((a, b) => b.candidateCount - a.candidateCount);

    return clientStats;

  } catch (error) {
    console.error("Error fetching client stats:", error);
    throw error;
  }
};

/**
 * Get detailed statistics for a specific client
 */
const getClientDetailedStats = async (clientId) => {
  try {
    const companyDoc = await companyDb.doc(clientId).get();
    
    if (!companyDoc.exists) {
      throw new Error('Client not found');
    }

    const companyData = companyDoc.data();
    const clientName = companyData.name || 'N/A';

    // Get positions for this client
    const positionsSnap = await positions.get();
    const positionsData = positionsSnap.docs.map(doc => ({
      id: doc.id,
      pos_id: doc.data().pos_id,
      ...doc.data()
    }));

    const clientPositions = positionsData.filter(p => 
      (p.client || "").toLowerCase() === clientName.toLowerCase()
    );

    const positionIds = clientPositions.map(p => p.pos_id);

    // Get all candidates for these positions
    let candidatesData = [];
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const snap = await candidate.where('pos_id', 'in', batch).get();
      candidatesData.push(...snap.docs.map(doc => doc.data()));
    }

    // Get SPOCs
    const spocsSnap = await clientspocDb.get();
    const spocsData = spocsSnap.docs.map(doc => ({
      id: doc.id,
      email: (doc.data().email || "").toLowerCase(),
      name: doc.data().name || 'N/A'
    }));
    const spocByEmail = {};
    spocsData.forEach(spoc => {
      spocByEmail[spoc.email] = spoc;
    });

    // Build detailed breakdown
    const positionsBreakdown = clientPositions.map(pos => {
      const posCandidates = candidatesData.filter(c => c.pos_id === pos.pos_id);
      
      // Group by recruiter
      const recruiterMap = {};
      posCandidates.forEach(cand => {
        const recName = cand.recName || 'Unknown';
        if (!recruiterMap[recName]) {
          recruiterMap[recName] = {
            recruiterName: recName,
            candidateCount: 0,
            candidates: []
          };
        }
        recruiterMap[recName].candidateCount++;
        recruiterMap[recName].candidates.push({
          name: cand.candidate || cand.name || 'N/A',
          status: cand.statusa || 'N/A',
          submittedDate: formatDate(cand.datePosted),
          lastUpdated: formatDate(cand.updatedAt) || formatDate(cand.statusaDate) || formatDate(cand.datePosted)
        });
      });

      return {
        positionId: pos.pos_id,
        positionName: pos.position || 'N/A',
        hrName: pos.hr_name || 'N/A',
        spocName: spocByEmail[(pos.clientspoc || "").toLowerCase()]?.name || pos.clientspoc || 'N/A',
        candidateCount: posCandidates.length,
        recruiters: Object.values(recruiterMap),
        positionDate: formatDate(pos.datePosted)
      };
    });

    // Calculate overall status counts
    const statusCounts = {};
    candidatesData.forEach(cand => {
      const status = cand.statusa || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Get unique recruiters
    const uniqueRecruiters = [...new Set(candidatesData.map(c => c.recName).filter(Boolean))];

    return {
      clientId: clientId,
      clientName: clientName,
      totalPositions: clientPositions.length,
      totalCandidates: candidatesData.length,
      totalRecruiters: uniqueRecruiters.length,
      statusCounts: statusCounts,
      positions: positionsBreakdown
    };

  } catch (error) {
    console.error("Error fetching client detailed stats:", error);
    throw error;
  }
};

/**
 * Helper function to format date
 */
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

module.exports = {
  getClientStats,
  getClientDetailedStats
};

