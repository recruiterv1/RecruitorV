const { db } = require("../router/firebase_ad");

// Collection references
const coachDb = db.collection("coach_db");

/**
 * Create a new coach
 * @param {Object} coachData - Coach data
 * @returns {Object} Created coach document
 */
const createCoach = async (coachData) => {
  try {
    const docRef = await coachDb.add({
      ...coachData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error creating coach:", error);
    throw error;
  }
};

/**
 * Find coach by email
 * @param {string} email - Email address
 * @returns {Object|null} Coach document or null
 */
const findCoachByEmail = async (email) => {
  try {
    const snap = await coachDb.where("email", "==", email.toLowerCase()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data(), source: 'Coach' };
  } catch (error) {
    console.error("Error finding coach by email:", error);
    throw error;
  }
};

/**
 * Get all coaches
 * @returns {Array} List of all coaches
 */
const getAllCoaches = async () => {
  try {
    const snap = await coachDb.orderBy("createdAt", "desc").get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all coaches:", error);
    throw error;
  }
};

/**
 * Get coaches by specialization
 * @param {string} specialization - Specialization field
 * @returns {Array} List of coaches with that specialization
 */
const getCoachesBySpecialization = async (specialization) => {
  try {
    const snap = await coachDb.where("specialization", "==", specialization).get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting coaches by specialization:", error);
    throw error;
  }
};

/**
 * Get coaches by userType (paid/free)
 * @param {string} userType - 'paid' or 'free'
 * @returns {Array} List of coaches with that userType
 */
const getCoachesByUserType = async (userType) => {
  try {
    const snap = await coachDb.where("userType", "==", userType).get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting coaches by userType:", error);
    throw error;
  }
};

/**
 * Update coach by ID
 * @param {string} id - Coach document ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated coach document
 */
const updateCoach = async (id, updateData) => {
  try {
    await coachDb.doc(id).update({
      ...updateData,
      updatedAt: new Date()
    });
    
    const doc = await coachDb.doc(id).get();
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error updating coach:", error);
    throw error;
  }
};

/**
 * Create or update coach (upsert) - handles both new and existing profiles
 * @param {string} id - Coach document ID
 * @param {Object} data - Data to create or update
 * @returns {Object} Created or updated coach document
 */
const createOrUpdateCoach = async (id, data) => {
  try {
    const docRef = coachDb.doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      // Document exists, do a regular update
      await docRef.update({ ...data, updatedAt: new Date() });
      console.log('[createOrUpdateCoach] Updated existing document:', id);
      const updatedDoc = await docRef.get();
      return { id, ...updatedDoc.data(), exists: true };
    } else {
      // Document doesn't exist, create new with set
      await docRef.set({ ...data, createdAt: new Date(), updatedAt: new Date() }, { merge: true });
      console.log('[createOrUpdateCoach] Created new document:', id);
      return { id, ...data, exists: false };
    }
  } catch (error) {
    console.error('[createOrUpdateCoach] Error:', error);
    throw error;
  }
};

/**
 * Delete coach by ID
 * @param {string} id - Coach document ID
 * @returns {Object} Success message
 */
const deleteCoach = async (id) => {
  try {
    await coachDb.doc(id).delete();
    return { success: true, message: "Coach deleted successfully" };
  } catch (error) {
    console.error("Error deleting coach:", error);
    throw error;
  }
};

/**
 * Get coach by ID
 * @param {string} id - Coach document ID
 * @returns {Object|null} Coach document or null
 */
const findCoachById = async (id) => {
  try {
    const doc = await coachDb.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error finding coach by ID:", error);
    throw error;
  }
};

module.exports = {
  createCoach,
  findCoachByEmail,
  getAllCoaches,
  getCoachesBySpecialization,
  getCoachesByUserType,
  updateCoach,
  createOrUpdateCoach,
  deleteCoach,
  findCoachById,
  coachDb
};

