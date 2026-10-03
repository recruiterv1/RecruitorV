const { db } = require("../router/firebase_ad");

// Collection references
const expertDb = db.collection("expert_db");

/**
 * Create a new expert
 * @param {Object} expertData - Expert data
 * @returns {Object} Created expert document
 */
const createExpert = async (expertData) => {
  try {
    const docRef = await expertDb.add({
      ...expertData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error creating expert:", error);
    throw error;
  }
};

/**
 * Find expert by email
 * @param {string} email - Email address
 * @returns {Object|null} Expert document or null
 */
const findExpertByEmail = async (email) => {
  try {
    const snap = await expertDb.where("email", "==", email.toLowerCase()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data(), source: 'Expert' };
  } catch (error) {
    console.error("Error finding expert by email:", error);
    throw error;
  }
};

/**
 * Get all experts
 * @returns {Array} List of all experts
 */
// The fields a listing shows. Named explicitly so the heavy ones — the inline
// CV above all — are never fetched, and so the password hash and OTP cannot
// reach a list endpoint by accident.
const LIST_FIELDS = [
  'name', 'email', 'mobile', 'phone', 'specialization', 'skillCategory', 'userType',
  'accountStatus', 'isActive', 'agreementSigned', 'agreementVersion', 'agreementAcceptedAt',
  'positionExperience', 'selectedPositions', 'availability', 'availabilityUpdatedAt',
  'eligibilityTier', 'eligibilityPercent', 'eligibilityPassedAt', 'certificateId', 'certificateUrl',
  'resumeUrl', 'bio', 'experience', 'linkedin', 'city', 'state', 'country',
  'createdAt', 'updatedAt', 'suspendedAt', 'suspendedReason', 'lastLoginAt', 'photoUrl',
];

const getAllExperts = async () => {
  try {
    // The stored CV sits inline on each record at tens of kilobytes a head,
    // and a listing never shows it — asking Firestore not to send it turns a
    // 35MB read into a manageable one. resumeUrl points at the actual file.
    const snap = await expertDb.orderBy("createdAt", "desc")
      .select(...LIST_FIELDS).get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all experts:", error);
    throw error;
  }
};

/**
 * Get experts by specialization
 * @param {string} specialization - Specialization field
 * @returns {Array} List of experts with that specialization
 */
const getExpertsBySpecialization = async (specialization) => {
  try {
    const snap = await expertDb.where("specialization", "==", specialization).get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting experts by specialization:", error);
    throw error;
  }
};

/**
 * Get experts by userType (paid/free)
 * @param {string} userType - 'paid' or 'free'
 * @returns {Array} List of experts with that userType
 */
const getExpertsByUserType = async (userType) => {
  try {
    const snap = await expertDb.where("userType", "==", userType).get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting experts by userType:", error);
    throw error;
  }
};

/**
 * Update expert by ID
 * @param {string} id - Expert document ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated expert document
 */
const updateExpert = async (id, updateData) => {
  try {
    await expertDb.doc(id).update({
      ...updateData,
      updatedAt: new Date()
    });
    
    const doc = await expertDb.doc(id).get();
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error updating expert:", error);
    throw error;
  }
};

/**
 * Create or update expert (upsert) - handles both new and existing profiles
 * @param {string} id - Expert document ID
 * @param {Object} data - Data to create or update
 * @returns {Object} Created or updated expert document
 */
const createOrUpdateExpert = async (id, data) => {
  try {
    const docRef = expertDb.doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      // Document exists, do a regular update
      await docRef.update({ ...data, updatedAt: new Date() });
      console.log('[createOrUpdateExpert] Updated existing document:', id);
      const updatedDoc = await docRef.get();
      return { id, ...updatedDoc.data(), exists: true };
    } else {
      // Document doesn't exist, create new with set
      await docRef.set({ ...data, createdAt: new Date(), updatedAt: new Date() }, { merge: true });
      console.log('[createOrUpdateExpert] Created new document:', id);
      return { id, ...data, exists: false };
    }
  } catch (error) {
    console.error('[createOrUpdateExpert] Error:', error);
    throw error;
  }
};

/**
 * Delete expert by ID
 * @param {string} id - Expert document ID
 * @returns {Object} Success message
 */
const deleteExpert = async (id) => {
  try {
    await expertDb.doc(id).delete();
    return { success: true, message: "Expert deleted successfully" };
  } catch (error) {
    console.error("Error deleting expert:", error);
    throw error;
  }
};

/**
 * Get expert by ID
 * @param {string} id - Expert document ID
 * @returns {Object|null} Expert document or null
 */
const findExpertById = async (id) => {
  try {
    const doc = await expertDb.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error finding expert by ID:", error);
    throw error;
  }
};

module.exports = {
  createExpert,
  findExpertByEmail,
  getAllExperts,
  getExpertsBySpecialization,
  getExpertsByUserType,
  updateExpert,
  createOrUpdateExpert,
  deleteExpert,
  findExpertById,
  expertDb
};

