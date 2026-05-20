const { db } = require("../router/firebase_ad");

const recruiterDb = db.collection('recruiter_db');
const adminDb = db.collection('admin_db');
const candidateDb = db.collection('candidate_db');
const companyDb = db.collection('Company_Overview');
const positionsDb = db.collection('admin_AddPos');

/**
 * Get date range based on filter type
 * @param {string} filter - 'today', 'week', or 'month'
 * @returns {Date} Start date for the filter
 */
const getDateRange = (filter) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return startOfDay;
    case 'week':
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - 7);
      return startOfWeek;
    case 'month':
      const startOfMonth = new Date(startOfDay);
      startOfMonth.setDate(startOfDay.getDate() - 30);
      return startOfMonth;
    default:
      return null;
  }
};

/**
 * Get summary statistics for dashboard
 * @param {string} filter - Optional: 'today', 'week', or 'month'
 * @returns {Object} Summary statistics
 * Updated: 2026-01-17 - Fixed SPOC and Position counting
 */
const getDashboardSummary = async (filter = null) => {
  try {
    const startDate = filter ? getDateRange(filter) : null;
    
    // Get all recruiters
    const recruitersSnap = await recruiterDb.get();
    let allRecruiters = recruitersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by date if needed
    if (startDate) {
      allRecruiters = allRecruiters.filter(r => {
        // Use registrationDate for recruiters
        const regDate = r.registrationDate?.toDate?.() || new Date(r.registrationDate || 0);
        return regDate >= startDate;
      });
    }
    
    // Separate recruiters by role
    const recruiters = allRecruiters.filter(r => r.roleCategory === 'Recruiter' || !r.roleCategory);
    const hrs = allRecruiters.filter(r => r.roleCategory === 'HR');
    
    // Count paid and free recruiters
    const paidRecruiters = recruiters.filter(r => r.planType === 1);
    const freeRecruiters = recruiters.filter(r => r.planType === 0);
    
    // Get all admin/client SPOCs (all records in admin_db are SPOCs)
    const adminSnap = await adminDb.get();
    let admins = adminSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by date if needed
    if (startDate) {
      admins = admins.filter(a => {
        const datePosted = a.datePosted?.toDate?.() || new Date(a.datePosted || 0);
        return datePosted >= startDate;
      });
    }
    
    // All records in admin_db are client SPOCs
    const clientSpocs = admins;
    
    // Get all companies/clients
    const companySnap = await companyDb.get();
    let companies = companySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by date if needed
    if (startDate) {
      companies = companies.filter(c => {
        const datePosted = c.datePosted?.toDate?.() || new Date(c.datePosted || 0);
        return datePosted >= startDate;
      });
    }
    
    // Get all candidates
    const candidateSnap = await candidateDb.get();
    let candidates = candidateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get unique positions from ALL candidates first (using pos_id)
    const allPositions = [...new Set(candidates.map(c => c.pos_id).filter(Boolean))];
    
    // Filter candidates by date if needed
    if (startDate) {
      candidates = candidates.filter(c => {
        const datePosted = c.datePosted?.toDate?.() || new Date(c.datePosted || 0);
        return datePosted >= startDate;
      });
    }
    
    // For positions, use all positions if no filter, or filter by date
    const uniquePositions = startDate 
      ? [...new Set(candidates.map(c => c.pos_id).filter(Boolean))]
      : allPositions;
    
    return {
      success: true,
      data: {
        totalClients: companies.length,
        totalRecruiters: recruiters.length,
        totalPaidRecruiters: paidRecruiters.length,
        totalFreeRecruiters: freeRecruiters.length,
        totalSpocs: clientSpocs.length,
        totalPositions: uniquePositions.length,
        totalHRs: hrs.length,
        totalCandidates: candidates.length,
        filter: filter || 'all'
      }
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    throw error;
  }
};

/**
 * Get detailed records for a specific metric type
 * @param {string} type - 'clients', 'recruiters', 'spocs', 'positions', 'hrs', or 'candidates'
 * @param {string} filter - Optional: 'today', 'week', or 'month'
 * @param {number} page - Page number for pagination
 * @param {number} limit - Items per page
 * @returns {Object} Detailed records
 */
const getDetailedRecords = async (type, filter = null, page = 1, limit = 50) => {
  try {
    const startDate = filter ? getDateRange(filter) : null;
    const offset = (page - 1) * limit;
    
    let records = [];
    let totalCount = 0;
    
    switch (type) {
      case 'clients':
        let companyQuery = companyDb;
        if (startDate) {
          companyQuery = companyQuery.where('datePosted', '>=', startDate);
        }
        const companySnap = await companyQuery.get();
        const allCompanies = companySnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          type: 'client'
        }));
        
        totalCount = allCompanies.length;
        records = allCompanies
          .sort((a, b) => {
            const dateA = a.datePosted?.toDate?.() || new Date(a.datePosted || 0);
            const dateB = b.datePosted?.toDate?.() || new Date(b.datePosted || 0);
            return dateB - dateA;
          })
          .slice(offset, offset + limit)
          .map(c => ({
            id: c.id,
            name: c.companyName || c.name || 'N/A',
            phone: c.phone || c.mobile || 'N/A',
            email: c.email || 'N/A',
            dateAdded: c.datePosted?.toDate?.() || new Date(c.datePosted || Date.now())
          }));
        break;
        
      case 'recruiters':
        const recruiterSnap = await recruiterDb.get();
        let allRecruitersDetail = recruiterSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Filter by date if needed
        if (startDate) {
          allRecruitersDetail = allRecruitersDetail.filter(r => {
            const regDate = r.registrationDate?.toDate?.() || new Date(r.registrationDate || 0);
            return regDate >= startDate;
          });
        }
        
        const recruitersOnly = allRecruitersDetail.filter(r => r.roleCategory === 'Recruiter' || !r.roleCategory);
        totalCount = recruitersOnly.length;
        records = recruitersOnly
          .sort((a, b) => {
            const dateA = a.registrationDate?.toDate?.() || new Date(a.registrationDate || 0);
            const dateB = b.registrationDate?.toDate?.() || new Date(b.registrationDate || 0);
            return dateB - dateA;
          })
          .slice(offset, offset + limit)
          .map(r => ({
            id: r.id,
            name: r.name || 'N/A',
            phone: r.mobile || 'N/A',
            email: r.email || 'N/A',
            dateAdded: r.registrationDate?.toDate?.() || new Date(r.registrationDate || Date.now())
          }));
        break;
        
      case 'spocs':
        const adminSnap = await adminDb.get();
        let allAdmins = adminSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Filter by date if needed
        if (startDate) {
          allAdmins = allAdmins.filter(a => {
            const datePosted = a.datePosted?.toDate?.() || new Date(a.datePosted || 0);
            return datePosted >= startDate;
          });
        }
        
        // All records in admin_db are SPOCs
        const spocsOnly = allAdmins;
        totalCount = spocsOnly.length;
        records = spocsOnly
          .sort((a, b) => {
            const dateA = a.datePosted?.toDate?.() || new Date(a.datePosted || 0);
            const dateB = b.datePosted?.toDate?.() || new Date(b.datePosted || 0);
            return dateB - dateA;
          })
          .slice(offset, offset + limit)
          .map(s => ({
            id: s.id,
            name: s.name || 'N/A',
            phone: s.mobile || s.phone || 'N/A',
            email: s.email || 'N/A',
            company: s.company || 'N/A',
            dateAdded: s.datePosted?.toDate?.() || new Date(s.datePosted || Date.now())
          }));
        break;
        
      case 'positions':
        const candidateSnap = await candidateDb.get();
        let allCandidates = candidateSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Group by position (using pos_id)
        const positionMap = new Map();
        allCandidates.forEach(c => {
          if (c.pos_id) {
            if (!positionMap.has(c.pos_id)) {
              positionMap.set(c.pos_id, {
                positionId: c.pos_id,
                client: c.client || 'N/A',
                candidateCount: 0,
                dateAdded: c.datePosted?.toDate?.() || new Date(c.datePosted || Date.now())
              });
            }
            const pos = positionMap.get(c.pos_id);
            pos.candidateCount++;
            // Keep the earliest date
            const currentDate = c.datePosted?.toDate?.() || new Date(c.datePosted || Date.now());
            if (currentDate < pos.dateAdded) {
              pos.dateAdded = currentDate;
            }
          }
        });
        
        const positions = Array.from(positionMap.values());
        totalCount = positions.length;
        
        // Get position names from admin_AddPos
        const positionIds = positions.slice(offset, offset + limit).map(p => p.positionId);
        const positionNamesMap = {};
        if (positionIds.length > 0) {
          for (let i = 0; i < positionIds.length; i += 10) {
            const batch = positionIds.slice(i, i + 10);
            const posSnap = await positionsDb.where("pos_id", "in", batch).get();
            posSnap.docs.forEach(doc => {
              const data = doc.data();
              positionNamesMap[data.pos_id] = data.position || 'N/A';
            });
          }
        }
        
        records = positions
          .sort((a, b) => b.dateAdded - a.dateAdded)
          .slice(offset, offset + limit)
          .map(p => ({
            name: positionNamesMap[p.positionId] || p.positionId,
            positionId: p.positionId,
            client: p.client,
            candidateCount: p.candidateCount,
            dateAdded: p.dateAdded
          }));
        break;
        
      case 'hrs':
        const hrSnap = await recruiterDb.get();
        let allHRs = hrSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Filter by date if needed
        if (startDate) {
          allHRs = allHRs.filter(r => {
            const regDate = r.registrationDate?.toDate?.() || new Date(r.registrationDate || 0);
            return regDate >= startDate;
          });
        }
        
        const hrsOnly = allHRs.filter(r => r.roleCategory === 'HR');
        totalCount = hrsOnly.length;
        records = hrsOnly
          .sort((a, b) => {
            const dateA = a.registrationDate?.toDate?.() || new Date(a.registrationDate || 0);
            const dateB = b.registrationDate?.toDate?.() || new Date(b.registrationDate || 0);
            return dateB - dateA;
          })
          .slice(offset, offset + limit)
          .map(h => ({
            id: h.id,
            name: h.name || 'N/A',
            phone: h.mobile || 'N/A',
            email: h.email || 'N/A',
            dateAdded: h.registrationDate?.toDate?.() || new Date(h.registrationDate || Date.now())
          }));
        break;
        
      case 'candidates':
        let candQuery = candidateDb;
        if (startDate) {
          candQuery = candQuery.where('datePosted', '>=', startDate);
        }
        const candSnap = await candQuery.get();
        const candidates = candSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        totalCount = candidates.length;
        const sortedCandidates = candidates.sort((a, b) => {
          const dateA = a.datePosted?.toDate?.() || new Date(a.datePosted || 0);
          const dateB = b.datePosted?.toDate?.() || new Date(b.datePosted || 0);
          return dateB - dateA;
        });
        
        const paginatedCandidates = sortedCandidates.slice(offset, offset + limit);
        
        // Get position names for paginated candidates
        const candPositionIds = [...new Set(paginatedCandidates.map(c => c.pos_id).filter(Boolean))];
        const candPositionNamesMap = {};
        if (candPositionIds.length > 0) {
          for (let i = 0; i < candPositionIds.length; i += 10) {
            const batch = candPositionIds.slice(i, i + 10);
            const posSnap = await positionsDb.where("pos_id", "in", batch).get();
            posSnap.docs.forEach(doc => {
              const data = doc.data();
              candPositionNamesMap[data.pos_id] = data.position || 'N/A';
            });
          }
        }
        
        records = paginatedCandidates.map(c => ({
          id: c.id,
          name: c.candidate || c.name || 'N/A',
          phone: c.mob || 'N/A',
          email: c.emails || 'N/A',
          position: candPositionNamesMap[c.pos_id] || c.pos_id || 'N/A',
          positionId: c.pos_id || 'N/A',
          dateAdded: c.datePosted?.toDate?.() || new Date(c.datePosted || Date.now())
        }));
        break;
        
      default:
        throw new Error('Invalid type specified');
    }
    
    return {
      success: true,
      data: {
        records,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          recordsPerPage: limit
        },
        filter: filter || 'all',
        type
      }
    };
  } catch (error) {
    console.error('Error getting detailed records:', error);
    throw error;
  }
};

module.exports = {
  getDashboardSummary,
  getDetailedRecords
};
