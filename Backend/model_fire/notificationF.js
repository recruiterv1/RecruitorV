const { db } = require("../router/firebase_ad");

// Notification collection reference
const notificationCollection = db.collection("notifications");

/**
 * Safely convert a date value to ISO string
 * Handles Firestore Timestamp, Date object, string, or plain object
 * @param {any} dateValue - The date value to convert
 * @returns {string|null} ISO string or null if invalid
 */
const safeConvertToISOString = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Case 1: Firestore Timestamp (has toDate method)
    if (typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toISOString();
    }
    
    // Case 2: JavaScript Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    // Case 3: Already a string
    if (typeof dateValue === 'string') {
      // Validate it's a valid ISO string
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      return dateValue; // Return as-is if not valid ISO
    }
    
    // Case 4: Plain object with _seconds (Firestore Timestamp serialized)
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toISOString();
      }
      // Try to convert the object to a Date
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error converting date to ISO string:", error);
    return null;
  }
};

/**
 * Notification Types:
 * 1. NEW_CANDIDATE_SUBMITTED - ClientSPOC gets notified when recruiter submits a candidate
 * 2. ACCESS_REQUEST_ACCEPTED - Recruiter gets notified when access request is accepted
 * 3. ACCESS_REQUEST_REJECTED - Recruiter gets notified when access request is rejected
 * 4. NEW_POSITION_AVAILABLE - Recruiters get notified when new positions are available
 * 5. NO_CANDIDATE_ALERT - ClientSPOC gets notified when position has no candidates
 * 6. POSITION_FULL - ClientSPOC gets notified when position reaches max candidates
 */

const NOTIFICATION_TYPES = {
  NEW_CANDIDATE_SUBMITTED: 'new_candidate_submitted',
  ACCESS_REQUEST_ACCEPTED: 'access_request_accepted',
  ACCESS_REQUEST_REJECTED: 'access_request_rejected',
  ACCESS_REQUEST_RECEIVED: 'access_request_received', // For ClientSPOC when recruiter requests access
  NEW_POSITION_AVAILABLE: 'new_position_available',
  NO_CANDIDATE_ALERT: 'no_candidate_alert',
  POSITION_FULL: 'position_full',
  // New types for multi-recruiter assign requests
  ASSIGN_REQUEST_RECEIVED: 'assign_request_received', // For ClientSPOC when recruiter requests assignment
  ASSIGN_REQUEST_APPROVED: 'assign_request_approved', // For recruiter when assignment is approved
  ASSIGN_REQUEST_REJECTED: 'assign_request_rejected'  // For recruiter when assignment is rejected
};

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @returns {Object} Created notification
 */
const createNotification = async (notificationData) => {
  try {
    const {
      recipientEmail,
      recipientType, // 'clientspoc' or 'recruiter'
      type,
      title,
      message,
      positionId,
      positionTitle,
      clientName,
      candidateName,
      candidateId,
      recruiterEmail,
      recruiterName,
      metadata = {}
    } = notificationData;

    // Validate required fields
    if (!recipientEmail || !type || !title || !message) {
      throw new Error("Missing required fields: recipientEmail, type, title, message");
    }

    // Create notification document
    const notificationDoc = await notificationCollection.add({
      recipientEmail: recipientEmail.toLowerCase(),
      recipientType: recipientType || 'clientspoc',
      type,
      title,
      message,
      positionId: positionId || null,
      positionTitle: positionTitle || null,
      clientName: clientName || null,
      candidateName: candidateName || null,
      candidateId: candidateId || null,
      recruiterEmail: recruiterEmail || null,
      recruiterName: recruiterName || null,
      metadata,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const notification = await notificationDoc.get();
    return {
      id: notification.id,
      ...notification.data()
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} email - User email
 * @param {Object} options - Query options
 * @returns {Array} List of notifications
 */
const getNotificationsByRecipient = async (email, options = {}) => {
  try {
    const {
      unreadOnly = false,
      limit = 50,
      offset = 0,
      type = null
    } = options;

    let query = notificationCollection
      .where('recipientEmail', '==', email.toLowerCase())
      .orderBy('createdAt', 'desc');

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    // Apply limit and offset
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeConvertToISOString(doc.data().createdAt),
      updatedAt: safeConvertToISOString(doc.data().updatedAt)
    })).map(notification => {
      // Debug log for notifications
      if (process.env.DEBUG_NOTIFICATIONS === 'true') {
        console.log(`[DEBUG] Notification for ${notification.recipientEmail}:`, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          createdAt: notification.createdAt
        });
      }
      return notification;
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} email - User email
 * @returns {number} Count of unread notifications
 */
const getUnreadCount = async (email) => {
  try {
    const snapshot = await notificationCollection
      .where('recipientEmail', '==', email.toLowerCase())
      .where('read', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Object} Updated notification
 */
const markAsRead = async (notificationId) => {
  try {
    const notificationRef = notificationCollection.doc(notificationId);
    const notification = await notificationRef.get();

    if (!notification.exists) {
      throw new Error("Notification not found");
    }

    await notificationRef.update({
      read: true,
      updatedAt: new Date()
    });

    const updatedNotification = await notificationRef.get();
    return {
      id: updatedNotification.id,
      ...updatedNotification.data()
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} email - User email
 * @returns {number} Number of notifications updated
 */
const markAllAsRead = async (email) => {
  try {
    const snapshot = await notificationCollection
      .where('recipientEmail', '==', email.toLowerCase())
      .where('read', '==', false)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: new Date()
      });
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Object} Success status
 */
const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = notificationCollection.doc(notificationId);
    const notification = await notificationRef.get();

    if (!notification.exists) {
      throw new Error("Notification not found");
    }

    await notificationRef.delete();
    return { success: true, message: "Notification deleted successfully" };
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Delete old notifications (older than specified days)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {number} Number of notifications deleted
 */
const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const snapshot = await notificationCollection
      .where('createdAt', '<', cutoffDate)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    throw error;
  }
};

/**
 * Create notification for ClientSPOC when new candidate is submitted
 * @param {Object} data - Candidate and position data
 */
const notifyClientSpocNewCandidate = async (data) => {
  const {
    clientspocEmail,
    clientspocName,
    positionId,
    positionTitle,
    clientName,
    candidateName,
    candidateId,
    recruiterEmail,
    recruiterName
  } = data;

  return await createNotification({
    recipientEmail: clientspocEmail,
    recipientType: 'clientspoc',
    type: NOTIFICATION_TYPES.NEW_CANDIDATE_SUBMITTED,
    title: 'New Candidate Submitted',
    message: `${recruiterName || 'A recruiter'} has submitted ${candidateName || 'a candidate'} for ${positionTitle || 'your position'}`,
    positionId,
    positionTitle,
    clientName,
    candidateName,
    candidateId,
    recruiterEmail,
    recruiterName
  });
};

/**
 * Create notification for Recruiter when access request is accepted/rejected
 * @param {Object} data - Access request data
 */
const notifyRecruiterAccessRequestStatus = async (data) => {
  const {
    recruiterEmail,
    recruiterName,
    positionId,
    positionTitle,
    clientName,
    status, // 'accepted' or 'rejected'
    rejectionReason
  } = data;

  const isAccepted = status === 'accepted';
  const type = isAccepted 
    ? NOTIFICATION_TYPES.ACCESS_REQUEST_ACCEPTED 
    : NOTIFICATION_TYPES.ACCESS_REQUEST_REJECTED;

  return await createNotification({
    recipientEmail: recruiterEmail,
    recipientType: 'recruiter',
    type,
    title: isAccepted ? 'Access Request Accepted' : 'Access Request Rejected',
    message: isAccepted
      ? `Your request to access position "${positionTitle}" for ${clientName} has been accepted.`
      : `Your request to access position "${positionTitle}" for ${clientName} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
    positionId,
    positionTitle,
    clientName
  });
};

/**
 * Create notification for Recruiter when new position is available
 * @param {Object} data - Position data
 */
const notifyRecruiterNewPosition = async (data) => {
  const {
    recruiterEmail,
    positionId,
    positionTitle,
    clientName,
    location,
    ctcRange
  } = data;

  return await createNotification({
    recipientEmail: recruiterEmail,
    recipientType: 'recruiter',
    type: NOTIFICATION_TYPES.NEW_POSITION_AVAILABLE,
    title: 'New Position Available',
    message: `New position "${positionTitle}" added for ${clientName}${location ? ` in ${Array.isArray(location) ? location.join(', ') : location}` : ''}`,
    positionId,
    positionTitle,
    clientName,
    metadata: { location, ctcRange }
  });
};

/**
 * Create alert notification for ClientSPOC when position has no candidates
 * @param {Object} data - Position data
 */
const notifyClientSpocNoCandidates = async (data) => {
  const {
    clientspocEmail,
    positionId,
    positionTitle,
    clientName,
    daysSincePosted
  } = data;

  return await createNotification({
    recipientEmail: clientspocEmail,
    recipientType: 'clientspoc',
    type: NOTIFICATION_TYPES.NO_CANDIDATE_ALERT,
    title: 'No Candidates Yet',
    message: `Your position "${positionTitle}" for ${clientName} has not received any candidates yet.${daysSincePosted ? ` It's been ${daysSincePosted} day(s) since posting.` : ''} Consider promoting this position to attract recruiters.`,
    positionId,
    positionTitle,
    clientName,
    metadata: { daysSincePosted }
  });
};

/**
 * Create notification for ClientSPOC when a recruiter requests access to their position
 * @param {Object} data - Access request data
 */
const notifyClientSpocAccessRequestReceived = async (data) => {
  const {
    clientspocEmail,
    positionId,
    positionTitle,
    clientName,
    recruiterName,
    recruiterEmail
  } = data;

  return await createNotification({
    recipientEmail: clientspocEmail,
    recipientType: 'clientspoc',
    type: NOTIFICATION_TYPES.ACCESS_REQUEST_RECEIVED,
    title: 'New Access Request',
    message: `${recruiterName || 'A recruiter'} (${recruiterEmail}) has requested access to your position "${positionTitle}" for ${clientName}. Please review and approve/reject the request.`,
    positionId,
    positionTitle,
    clientName,
    metadata: { recruiterName, recruiterEmail }
  });
};

/**
 * Create notification for ClientSPOC when a recruiter requests assignment to their position
 * @param {Object} data - Assign request data
 */
const notifyClientSpocAssignRequestReceived = async (data) => {
  const {
    clientspocEmail,
    positionId,
    positionTitle,
    clientName,
    recruiterName,
    recruiterEmail,
    message
  } = data;

  let fullMessage = `${recruiterName || 'A recruiter'} (${recruiterEmail}) has requested to work on your position "${positionTitle}" for ${clientName}.`;
  if (message) {
    fullMessage += `\n\nRecruiter's message: "${message}"`;
  }
  fullMessage += `\n\nPlease review and approve/reject the request.`;

  return await createNotification({
    recipientEmail: clientspocEmail,
    recipientType: 'clientspoc',
    type: NOTIFICATION_TYPES.ASSIGN_REQUEST_RECEIVED,
    title: 'New Assignment Request',
    message: fullMessage,
    positionId,
    positionTitle,
    clientName,
    metadata: { recruiterName, recruiterEmail, message }
  });
};

/**
 * Create notification for Recruiter when their assignment request is approved/rejected
 * @param {Object} data - Assign request status data
 */
const notifyRecruiterAssignRequestStatus = async (data) => {
  const {
    recruiterEmail,
    positionId,
    positionTitle,
    clientName,
    status, // 'approved' or 'rejected'
    reason
  } = data;

  const isApproved = status === 'approved';
  const type = isApproved 
    ? NOTIFICATION_TYPES.ASSIGN_REQUEST_APPROVED 
    : NOTIFICATION_TYPES.ASSIGN_REQUEST_REJECTED;

  let message;
  if (isApproved) {
    message = `Great news! Your request to work on position "${positionTitle}" for ${clientName} has been approved. You can now submit candidates for this position.`;
  } else {
    message = `Your request to work on position "${positionTitle}" for ${clientName} has been rejected.`;
    if (reason) {
      message += `\n\nReason: ${reason}`;
    }
  }

  return await createNotification({
    recipientEmail: recruiterEmail,
    recipientType: 'recruiter',
    type,
    title: isApproved ? 'Assignment Request Approved' : 'Assignment Request Rejected',
    message: message,
    positionId,
    positionTitle,
    clientName,
    metadata: { reason }
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getNotificationsByRecipient,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteOldNotifications,
  notifyClientSpocNewCandidate,
  notifyRecruiterAccessRequestStatus,
  notifyRecruiterNewPosition,
  notifyClientSpocNoCandidates,
  notifyClientSpocAccessRequestReceived,
  // New functions for multi-recruiter assign requests
  notifyClientSpocAssignRequestReceived,
  notifyRecruiterAssignRequestStatus
};

