const { db } = require("../router/firebase_ad");
const recruiter = db.collection('recruiter_db');
const candidate = db.collection("candidate_db");
const positions = db.collection("admin_AddPos");
const { findRecruiterByEmail } = require('./recruiterF');

// Helper function to calculate profile completion - matches Frontend Profile.jsx fields
const calculateProfileCompletion = (user) => {
  // Handle mobile -> phone mapping
  const phone = user.phone || user.mobile || '';
  
  // Map frontend field names to backend/user model field names
  const company = user.company || user.currentCompany || '';
  const designation = user.designation || user.currentTitle || '';
  
  const fields = {
    // Common fields (all users) - matching Frontend Profile.jsx
    name: { value: user.name, weight: 5 },
    email: { value: user.email, weight: 5 },
    phone: { value: phone, weight: 5 },
    yearsOfExperience: { value: user.yearsOfExperience, weight: 5 },
    location: { value: user.location, weight: 3 },
    country: { value: user.country, weight: 3 },
    bio: { value: user.bio, weight: 10 },
    // Professional tab fields
    currentCompany: { value: company, weight: 5 },
    currentTitle: { value: designation, weight: 5 },
    linkedin: { value: user.linkedin, weight: 2 },
    twitter: { value: user.twitter, weight: 1 },
    website: { value: user.website, weight: 1 },
    // Skills and Experience (arrays)
    skills: { value: user.skills, weight: 15, type: 'array' },
    workExperience: { value: user.workExperience, weight: 20, type: 'array' },
    // Profile photo
    profilePhoto: { value: user.profilePhoto, weight: 10 },
  };

  let totalWeight = 0;
  let filledWeight = 0;

  for (const [field, config] of Object.entries(fields)) {
    totalWeight += config.weight;
    
    const isFilled = config.type === 'array' 
      ? (config.value && Array.isArray(config.value) && config.value.length > 0)
      : (config.value && config.value.toString().trim() !== '');
    
    if (isFilled) {
      filledWeight += config.weight;
    }
  }

  return Math.round((filledWeight / totalWeight) * 100);
};

/**
 * Get recruiter statistics with position counts
 * Returns a list of all recruiters with the count of positions they're working on
 */
const getRecruiterStats = async () => {
  try {
    // 1. Get all recruiters
    const recruitersSnap = await recruiter.get();
    
    if (recruitersSnap.empty) {
      return [];
    }

    // 2. Get only the candidate fields needed to group by recruiter. Candidate docs also
    // carry resumeText/cv_data/matchTokens (tens of KB each); pulling those on every call
    // for all 15k+ candidates, then re-filtering that full list once per recruiter below
    // (O(recruiters * candidates)), is what was making this endpoint time out.
    const candidatesSnap = await candidate.select('recEmail', 'pos_id', 'statusa').get();

    // Group candidates by recruiter email once (O(candidates)) instead of re-scanning the
    // whole candidate list per recruiter (O(recruiters * candidates)).
    const candidatesByRecruiterEmail = new Map();
    candidatesSnap.docs.forEach(doc => {
      const c = doc.data();
      const email = c.recEmail ? String(c.recEmail).trim().toLowerCase() : '';
      if (!email) return;
      if (!candidatesByRecruiterEmail.has(email)) candidatesByRecruiterEmail.set(email, []);
      candidatesByRecruiterEmail.get(email).push(c);
    });

    // 2b. Team membership. A recruiter has "joined a team" when they have an
    // APPROVED coach_team_requests record (coaches AND experts store team
    // membership in this same collection). Map recruiterEmail → [coach/expert names].
    const teamsByRecruiterEmail = new Map();
    try {
      const teamSnap = await db.collection('coach_team_requests').where('status', '==', 'approved').get();
      teamSnap.docs.forEach(doc => {
        const t = doc.data();
        const email = t.recruiterEmail ? String(t.recruiterEmail).trim().toLowerCase() : '';
        if (!email) return;
        if (!teamsByRecruiterEmail.has(email)) teamsByRecruiterEmail.set(email, []);
        teamsByRecruiterEmail.get(email).push(t.coachName || t.coachEmail || 'Team');
      });
    } catch (e) {
      console.error('coach_team_requests lookup failed:', e.message); // never block the list
    }

    // 3. Build recruiter stats
    const recruiterStats = [];

    for (const recruiterDoc of recruitersSnap.docs) {
      const recruiterData = recruiterDoc.data();
      const recruiterId = recruiterDoc.id;
      const recruiterEmail = recruiterData.email;

      // FIX: Use case-insensitive comparison for recEmail matching
      const recruiterEmailLower = String(recruiterEmail).trim().toLowerCase();
      const recruiterCandidates = candidatesByRecruiterEmail.get(recruiterEmailLower) || [];

      // Get unique position IDs
      const uniquePositions = [...new Set(recruiterCandidates.map(c => c.pos_id))];
      const positionCount = uniquePositions.length;

      // Count candidates by status
      const submittedCount = recruiterCandidates.length;
      
      const successStatuses = ['Offer Accepted', 'Joining'];
      const rejectionStatuses = [
        'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject', 
        'HR Reject', 'Background Verification Reject', 
        'Negotiation Reject', 'Offer Declined'
      ];

      const successfulCount = recruiterCandidates.filter(c => 
        successStatuses.includes(c.statusa)
      ).length;

      const rejectedCount = recruiterCandidates.filter(c => 
        rejectionStatuses.includes(c.statusa)
      ).length;

      const onProcessCount = submittedCount - successfulCount - rejectedCount;

      // Handle lastActive timestamp conversion
      let lastActiveDate = null;
      if (recruiterData.lastActive) {
        if (recruiterData.lastActive._seconds) {
          // Firestore Timestamp format
          lastActiveDate = new Date(recruiterData.lastActive._seconds * 1000).toISOString();
        } else if (recruiterData.lastActive.seconds) {
          // Alternative Timestamp format
          lastActiveDate = new Date(recruiterData.lastActive.seconds * 1000).toISOString();
        } else if (recruiterData.lastActive.toDate) {
          // Firestore Timestamp object
          lastActiveDate = recruiterData.lastActive.toDate().toISOString();
        } else if (typeof recruiterData.lastActive === 'string') {
          lastActiveDate = recruiterData.lastActive;
        } else if (recruiterData.lastActive instanceof Date) {
          lastActiveDate = recruiterData.lastActive.toISOString();
        }
      }

      recruiterStats.push({
        id: recruiterId,
        name: recruiterData.name || 'N/A',
        email: recruiterEmail || 'N/A',
        phone: recruiterData.phone || recruiterData.mobile || recruiterData.mob || 'N/A',
        positionCount: positionCount,
        candidatesSubmitted: submittedCount,
        candidatesOnProcess: onProcessCount,
        candidatesSuccessful: successfulCount,
        candidatesRejected: rejectedCount,
        successRate: submittedCount > 0 
          ? ((successfulCount / submittedCount) * 100).toFixed(1) + '%'
          : '0%',
        registrationDate: recruiterData.registrationDate,
        createdAt: recruiterData.createdAt || null,
        lastActive: lastActiveDate,
        profileCompletion: calculateProfileCompletion(recruiterData),
        agreementSigned: !!recruiterData.agreementSigned,
        commisiontype: recruiterData.commisiontype || '',
        accountStatus: recruiterData.accountStatus || 'approved',
        // Active flag drives the Action column; a suspended account is inactive.
        isActive: recruiterData.isActive !== false && recruiterData.accountStatus !== 'suspended',
        suspendedReason: recruiterData.suspendedReason || '',
        mobile: recruiterData.mobile || recruiterData.phone || recruiterData.mob || '',
        experienceCategory: recruiterData.experienceCategory || '',
        // The two-hour windows they said they can be reached in.
        availability: Array.isArray(recruiterData.availability) ? recruiterData.availability : [],
        // Assessment standing. Omitted before, so the Certified badge on the
        // SuperAdmin recruiter list rendered from an undefined tier and never
        // appeared — the same gap that hid it on the dash_view coach card.
        eligibilityTier: recruiterData.eligibilityTier || null,
        certificateId: recruiterData.certificateId || '',
        planType: recruiterData.planType,
        resumeUrl: recruiterData.resumeUrl || '',
        // Team membership (coach/expert teams) — see step 2b above.
        teams: teamsByRecruiterEmail.get(recruiterEmailLower) || [],
        teamCount: (teamsByRecruiterEmail.get(recruiterEmailLower) || []).length,
        joinedTeam: (teamsByRecruiterEmail.get(recruiterEmailLower) || []).length > 0,
      });

    }

    // Sort by position count (descending)
    recruiterStats.sort((a, b) => b.positionCount - a.positionCount);

    return recruiterStats;

  } catch (error) {
    console.error("Error fetching recruiter stats:", error);
    throw error;
  }
};

/**
 * Get detailed stats for a specific recruiter
 */
const getRecruiterDetailedStats = async (recruiterId) => {
  try {
    // Get recruiter info
    const recruiterDoc = await recruiter.doc(recruiterId).get();

    if (!recruiterDoc.exists) {
      throw new Error("Recruiter not found");
    }

    const recruiterData = recruiterDoc.data();
    const recruiterEmail = recruiterData.email;

    // Get all candidates submitted by this recruiter using their email
    // FIX: Get ALL candidates first, then filter by recEmail (case-insensitive) to handle case mismatches
    const allCandidatesSnap = await candidate.get();
    const allCandidatesData = allCandidatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter candidates where recEmail matches the recruiter's email (case-insensitive)
    const recruiterEmailLower = String(recruiterEmail).trim().toLowerCase();
    const candidatesData = allCandidatesData.filter(c => {
      const candidateEmail = c.recEmail ? String(c.recEmail).trim().toLowerCase() : '';
      return candidateEmail === recruiterEmailLower;
    });

    console.log(`Found ${candidatesData.length} candidates for recruiter ${recruiterId}`);
    
    // Log first candidate to see structure
    if (candidatesData.length > 0) {
      console.log('Sample candidate data:', JSON.stringify(candidatesData[0], null, 2));
    }

    // Get unique position IDs
    const uniquePositionIds = [...new Set(candidatesData.map(c => c.pos_id).filter(Boolean))];

    // Fetch position details from admin_AddPos collection
    const positionDetailsMap = {};
    if (uniquePositionIds.length > 0) {
      // Firestore 'in' query limit is 10, so batch if needed
      for (let i = 0; i < uniquePositionIds.length; i += 10) {
        const batch = uniquePositionIds.slice(i, i + 10);
        const posSnap = await positions.where("pos_id", "in", batch).get();
        posSnap.docs.forEach(doc => {
          const data = doc.data();
          positionDetailsMap[data.pos_id] = {
            positionName: data.position || 'N/A',
            client: data.client || 'N/A'
          };
        });
      }
    }

    // Group candidates by position
    const positionBreakdown = {};
    candidatesData.forEach(c => {
      const posId = c.pos_id;
      if (!posId) return; // Skip if no position ID
      
      if (!positionBreakdown[posId]) {
        const posDetails = positionDetailsMap[posId] || { positionName: 'N/A', client: 'N/A' };
        positionBreakdown[posId] = {
          positionId: posId,
          positionName: posDetails.positionName,
          client: posDetails.client,
          candidateCount: 0,
          candidates: []
        };
      }
      
      positionBreakdown[posId].candidateCount++;
      
      // Handle date conversion
      let submittedDate = null;
      if (c.datePosted) {
        if (c.datePosted._seconds) {
          // Firestore Timestamp format
          submittedDate = new Date(c.datePosted._seconds * 1000).toISOString();
        } else if (c.datePosted.seconds) {
          // Alternative Timestamp format
          submittedDate = new Date(c.datePosted.seconds * 1000).toISOString();
        } else if (c.datePosted.toDate) {
          // Firestore Timestamp object
          submittedDate = c.datePosted.toDate().toISOString();
        } else if (typeof c.datePosted === 'string') {
          submittedDate = c.datePosted;
        } else if (c.datePosted instanceof Date) {
          submittedDate = c.datePosted.toISOString();
        }
      }
      
      // The field name in database is 'candidate'
      const candidateName = c.candidate || c.name || c.candidateName || 'N/A';
      
      console.log(`Candidate: ${candidateName}, Status: ${c.statusa}, Date: ${submittedDate}, Raw datePosted:`, c.datePosted);
      
      positionBreakdown[posId].candidates.push({
        name: candidateName,
        status: c.statusa || 'N/A',
        submittedDate: submittedDate
      });
    });

    return {
      recruiter: {
        id: recruiterId,
        name: recruiterData.name,
        email: recruiterData.email,
        phone: recruiterData.mob
      },
      totalPositions: uniquePositionIds.length,
      totalCandidates: candidatesData.length,
      positionBreakdown: Object.values(positionBreakdown)
    };

  } catch (error) {
    console.error("Error fetching recruiter detailed stats:", error);
    throw error;
  }
};

/**
 * Get dashboard statistics for a specific recruiter by email
 */
const getRecruiterDashboardStats = async (recruiterEmail) => {
  try {
    console.log(`Looking for recruiter with email: ${recruiterEmail}`);

    // Find recruiter by email
    const recruiterData = await findRecruiterByEmail(recruiterEmail);

    console.log(`Recruiter data found:`, recruiterData);

    if (!recruiterData) {
      console.log(`No recruiter found with email: ${recruiterEmail}`);
      throw new Error("Recruiter not found");
    }

    // Get all candidates submitted by this recruiter using recEmail
    // FIX: Get ALL candidates first, then filter by recEmail (case-insensitive) to handle case mismatches
    const allCandidatesSnap = await candidate.get();
    const allCandidatesData = allCandidatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter candidates where recEmail matches the recruiter's email (case-insensitive)
    const recruiterEmailLower = String(recruiterEmail).trim().toLowerCase();
    const candidatesData = allCandidatesData.filter(c => {
      const candidateEmail = c.recEmail ? String(c.recEmail).trim().toLowerCase() : '';
      return candidateEmail === recruiterEmailLower;
    });

    console.log(`Found ${candidatesData.length} candidates for recruiter ${recruiterEmail}`);
    
    // Debug: Enhanced logging for Total Positions calculation
    if (candidatesData.length > 0) {
      console.log(`Sample candidate recEmail values:`, candidatesData.slice(0, 5).map(c => ({
        id: c.id,
        recEmail: c.recEmail,
        pos_id: c.pos_id,
        candidate: c.candidate || c.name
      })));
    }

    // Get unique position IDs from candidates submitted by this recruiter
    // FIX: Use proper null/undefined check that handles 0 values correctly
    const allPositionIds = candidatesData.map(c => {
      const posId = c.pos_id;
      // Only return null/undefined, not 0 (0 is a valid position ID)
      if (posId === null || posId === undefined) {
        return null;
      }
      return String(posId).trim();
    });
    
    // FIX: Use explicit null/undefined check instead of falsy check
    const positionIdsWithNulls = allPositionIds.filter(id => id === null);
    const validPositionIds = allPositionIds.filter(id => id !== null);
    const uniquePositionIds = [...new Set(validPositionIds)];
    
    console.log(`Position ID breakdown:`);
    console.log(`  - Total candidates: ${candidatesData.length}`);
    console.log(`  - Candidates with pos_id: ${validPositionIds.length}`);
    console.log(`  - Candidates without pos_id: ${positionIdsWithNulls.length}`);
    console.log(`  - Unique position IDs: ${uniquePositionIds.length}`);
    console.log(`  - Unique position IDs list:`, uniquePositionIds.sort());
    
    // Total positions is the count of unique positions the recruiter has submitted candidates to
    const totalPositions = uniquePositionIds.length;
    
    console.log(`Recruiter ${recruiterEmail} has submitted candidates to ${totalPositions} unique positions`);

    // For "Positions Without Candidates", we need to get all positions from admin_AddPos
    // where hr_name matches the recruiter, then find which ones have no candidates
    console.log(`Looking for positions assigned to recruiter with hr_name: ${recruiterEmail}`);
    const allPositionsSnap = await positions.where("hr_name", "==", recruiterEmail).get();
    const allPositionsData = allPositionsSnap.docs.map(doc => doc.data());
    console.log(`Found ${allPositionsData.length} positions assigned to recruiter in admin_AddPos`);
    
    // Find positions without candidates
    // Normalize pos_id to string for comparison
    // FIX: Use proper null check instead of falsy check
    const positionsWithCandidates = new Set(uniquePositionIds);
    const positionsWithoutCandidates = allPositionsData.filter(pos => {
      const posId = pos.pos_id;
      // Only consider null/undefined as missing, not 0
      if (posId === null || posId === undefined) {
        return true; // No position ID at all
      }
      const posIdStr = String(posId).trim();
      return !positionsWithCandidates.has(posIdStr);
    }).length;

    // Count candidates by status
    const activeCandidates = candidatesData.filter(c =>
      !c.statusa?.toLowerCase().includes('reject')
    ).length;

    const scheduledCandidates = candidatesData.filter(c =>
      c.statusa?.toLowerCase().includes('schedule')
    ).length;

    const feedbackCandidates = candidatesData.filter(c =>
      c.statusa?.toLowerCase().includes('feedback')
    ).length;

    const positionsSubmitted = uniquePositionIds.length;

    // Calculate performance score out of 5 based on submitted vs rejected candidates
    const rejectedCount = candidatesData.filter(c =>
      c.statusa?.toLowerCase().includes('reject')
    ).length;

    let performanceScore = 0;
    const totalSubmitted = candidatesData.length;

    if (totalSubmitted > 0) {
      if (rejectedCount === 0) {
        // Perfect score - no rejections
        performanceScore = 5;
      } else {
        // Calculate score: 5 - (rejected / submitted) * 5
        performanceScore = Math.round(5 - (rejectedCount / totalSubmitted) * 5);
        // Ensure score is between 0 and 5
        performanceScore = Math.max(0, Math.min(5, performanceScore));
      }
    }

    return {
      activeCandidates,
      scheduledCandidates,
      feedbackCandidates,
      positionsSubmitted,
      performanceScore,
      totalSubmitted,
      totalRejected: rejectedCount,
      totalPositions,
      positionsWithoutCandidates
    };

  } catch (error) {
    console.error("Error fetching recruiter dashboard stats:", error);
    throw error;
  }
};

module.exports = {
  getRecruiterStats,
  getRecruiterDetailedStats,
  getRecruiterDashboardStats
};
