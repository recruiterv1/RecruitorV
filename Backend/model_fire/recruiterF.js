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

    // Prefer verified record; among unverified, return the one with latest otpExpires
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const verified = docs.find(d => d.isVerified);
    if (verified) {
        console.log(`✅ Recruiter found (verified): ${verified.id}, email: ${verified.email}`);
        return { ...verified, source: "Emailwa" };
    }
    docs.sort((a, b) => (Number(b.otpExpires) || 0) - (Number(a.otpExpires) || 0));
    const doc = docs[0];
    console.log(`✅ Recruiter found (unverified, latest): ${doc.id}, email: ${doc.email}, role: ${doc.roleCategory}`);
    return { ...doc, source: "Emailwa" };
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
            experienceCategory: data.experienceCategory || data.experience_category || '',
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
            resume: data.resume || null,
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
        // No time-based expiry. Free recruiters can work on max 4 positions.
        if (recruiterDoc.planType === 0) {
            const positionCount = await getRecruiterPositionCount(recruiterDoc.email);
            const maxPositions = recruiterDoc.maxPositions || 4;

            if (positionCount >= maxPositions) {
                return {
                    canCreatePosition: false,
                    message: `You have reached the maximum limit of ${maxPositions} positions for the free plan. Please upgrade to add more positions.`,
                    limitReached: true,
                    planType: 0,
                    currentPositionCount: positionCount,
                    maxPositions: maxPositions
                };
            }

            return {
                canCreatePosition: true,
                isPaid: false,
                planType: 0,
                currentPositionCount: positionCount,
                positionsRemaining: maxPositions - positionCount,
                maxPositions: maxPositions
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


// Normalise phone: strip non-digits, take last 10 digits
const normalisePhone = (phone) => {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : null;
};

// Find a VERIFIED recruiter by phone number (any of mobile / phone / mob fields)
const findVerifiedRecruiterByPhone = async (rawPhone) => {
    const norm = normalisePhone(rawPhone);
    if (!norm) return null;

    const allDocs = await recruiter.where('isVerified', '==', true).get();
    for (const doc of allDocs.docs) {
        const d = doc.data();
        const stored = normalisePhone(d.mobile || d.phone || d.mob || '');
        if (stored && stored === norm) {
            return { id: doc.id, ...d };
        }
    }
    return null;
};

// Delete a recruiter document by ID
const deleteRecruiter = async (id) => {
    await recruiter.doc(id).delete();
};

module.exports={
    createRecruiter,
    findRecruiterByEmail,
    updateRecruiter,
    createOrUpdateRecruiter,
    findRecruiterById,
    getRecruiterPublicProfile,
    checkPlanLimits,
    getRecruiterPositionCount,
    getAllRecruiters,
    findVerifiedRecruiterByPhone,
    deleteRecruiter,
    normalisePhone
}

