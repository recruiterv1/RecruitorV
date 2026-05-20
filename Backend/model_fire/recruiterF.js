const { db } = require("../router/firebase_ad");
const recruiter=db.collection('recruiter_db');

const createRecruiter= async (data)=>{
    const add= await recruiter.add(data);
    return { id: add.id, ...data} 

}


const findRecruiterByEmail= async (email)=>{
    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.toLowerCase();
    console.log(`🔍 Searching for recruiter with email: ${email} (normalized: ${normalizedEmail})`);
    const snap= await recruiter.where('email','==',normalizedEmail).get()
    console.log(`📊 Query result - empty: ${snap.empty}, docs count: ${snap.docs.length}`);

    if(snap.empty) {
        console.log(`❌ No recruiter found with email: ${normalizedEmail}`);
        return null;
    }

    const doc=snap.docs[0]
    const data = doc.data();
    console.log(`✅ Recruiter found: ${doc.id}, email: ${data.email}, role: ${data.roleCategory}`);
    return { id: doc.id, ...data, source: "Emailwa" }
}

const updateRecruiter= async (id,data)=>{
    await recruiter.doc(id).update(data)
    
}

// Create or update recruiter (upsert) - handles both new and existing profiles
const createOrUpdateRecruiter = async (id, data) => {
    try {
        const docRef = recruiter.doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
            // Document exists, do a regular update
            await docRef.update(data);
            console.log('[createOrUpdateRecruiter] Updated existing document:', id);
            return { id, ...data, exists: true };
        } else {
            // Document doesn't exist, create new with set
            await docRef.set(data, { merge: true });
            console.log('[createOrUpdateRecruiter] Created new document:', id);
            return { id, ...data, exists: false };
        }
    } catch (error) {
        console.error('[createOrUpdateRecruiter] Error:', error);
        throw error;
    }
}

// Get recruiter by ID
const findRecruiterById= async (id)=>{
    const doc = await recruiter.doc(id).get();
    if(!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

// Get recruiter profile for ClientSPOC view
// Returns public profile info without sensitive data
const getRecruiterPublicProfile = async (recruiterId) => {
    try {
        const doc = await recruiter.doc(recruiterId).get();
        
        if (!doc.exists) {
            return null;
        }
        
        const data = doc.data();
        
        // Return only public/non-sensitive information
        return {
            id: doc.id,
            name: data.name || data.firstName || '',
            email: data.email || '',
            phone: data.phone || data.mobile || '',
            bio: data.bio || '',
            location: data.location || '',
            country: data.country || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            website: data.website || '',
            profilePhoto: data.profilePhoto || null,
            // Professional details
            specialization: data.specialization || data.specialisation || '',
            targetIndustries: data.targetIndustries || [],
            recruitmentMethods: data.recruitmentMethods || [],
            currentCompany: data.currentCompany || '',
            currentTitle: data.currentTitle || '',
            yearsOfExperience: data.yearsOfExperience || '',
            // Skills
            skills: data.skills || [],
            // Work experience
            workExperience: data.workExperience || [],
            // Education
            education: data.education || [],
            // Resume
            hasResume: !!data.resume,
            resumeFileName: data.resumeFileName || null,
            // Profile completion
            profileCompletion: calculateProfileCompletion(data),
            // Activity stats
            totalPositions: data.totalPositions || 0,
            totalCandidates: data.totalCandidates || 0,
            createdAt: data.createdAt || null
        };
    } catch (error) {
        console.error("Error getting recruiter public profile:", error);
        throw error;
    }
};

// Helper to calculate profile completion for recruiter
function calculateProfileCompletion(data) {
    const requiredFields = [
        'name', 'email', 'phone', 'bio', 'profilePhoto',
        'skills', 'workExperience', 'education', 'specialization'
    ];
    
    let filledFields = 0;
    
    requiredFields.forEach(field => {
        if (field === 'skills' || field === 'workExperience' || field === 'education') {
            if (data[field] && Array.isArray(data[field]) && data[field].length > 0) {
                filledFields++;
            }
        } else if (data[field]) {
            filledFields++;
        }
    });
    
    return Math.round((filledFields / requiredFields.length) * 100);
}

// Check plan limits for free users
const checkPlanLimits= async (recruiterId)=>{
    try {
        const recruiterDoc = await findRecruiterById(recruiterId);
        
        if (!recruiterDoc) {
            return { 
                canCreatePosition: false, 
                message: "Recruiter not found" 
            };
        }

        // If paid plan (planType === 1) or no planType (existing users), allow unlimited
        if (recruiterDoc.planType === 1 || recruiterDoc.planType === undefined) {
            return { 
                canCreatePosition: true, 
                isPaid: true,
                planType: recruiterDoc.planType || 1
            };
        }

        // Free plan (planType === 0) - check limits
        if (recruiterDoc.planType === 0) {
            const now = new Date();
            const expiryDate = recruiterDoc.planExpiryDate?.toDate ? recruiterDoc.planExpiryDate.toDate() : 
                              (recruiterDoc.planExpiryDate ? new Date(recruiterDoc.planExpiryDate) : null);

            // Check if plan expired
            if (expiryDate && now > expiryDate) {
                return { 
                    canCreatePosition: false, 
                    message: "Your free plan has expired (30 days limit). Please upgrade to continue.",
                    expired: true,
                    planType: 0,
                    currentPositionCount: await getRecruiterPositionCount(recruiterDoc.email),
                    daysRemaining: 0
                };
            }

            // Check position count - Free plan (planType === 0) has max 4 positions
            const positionCount = await getRecruiterPositionCount(recruiterDoc.email);
            const maxPositions = recruiterDoc.maxPositions || 4;

            if (positionCount >= maxPositions) {
                const daysRemaining = expiryDate ? Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))) : 0;
                
                return { 
                    canCreatePosition: false, 
                    message: `You have reached the maximum limit of ${maxPositions} positions for the free plan. Please upgrade to add more positions.`,
                    limitReached: true,
                    planType: 0,
                    currentPositionCount: positionCount,
                    maxPositions: maxPositions,
                    daysRemaining: daysRemaining
                };
            }

            // Calculate days remaining - ensure it's never negative
            const daysRemaining = expiryDate ? Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))) : 30;

            return { 
                canCreatePosition: true, 
                isPaid: false,
                planType: 0,
                currentPositionCount: positionCount,
                positionsRemaining: maxPositions - positionCount,
                maxPositions: maxPositions,
                daysRemaining: daysRemaining
            };
        }

        return { canCreatePosition: true };
    } catch (error) {
        console.error("Error checking plan limits:", error);
        return { canCreatePosition: false, message: "Error checking plan limits" };
    }
}

// Get count of positions created by recruiter
const getRecruiterPositionCount= async (recruiterEmail)=>{
    try {
        const positionsCollection = db.collection('position_db');
        const snapshot = await positionsCollection.where('hr_name', '==', recruiterEmail).get();
        return snapshot.size;
    } catch (error) {
        console.error("Error getting recruiter position count:", error);
        return 0;
    }
}

// Get all recruiters (for migration)
const getAllRecruiters= async ()=>{
    try {
        const snapshot = await recruiter.get();
        const recruiters = [];
        snapshot.forEach(doc => {
            recruiters.push({ id: doc.id, ...doc.data() });
        });
        return recruiters;
    } catch (error) {
        console.error("Error getting all recruiters:", error);
        return [];
    }
}


module.exports={ 
    createRecruiter, 
    findRecruiterByEmail, 
    updateRecruiter,
    createOrUpdateRecruiter,
    findRecruiterById,
    getRecruiterPublicProfile,
    checkPlanLimits,
    getRecruiterPositionCount,
    getAllRecruiters
}


