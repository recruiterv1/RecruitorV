const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const notificationModel = require('../model_fire/notificationF');
const ad_Pos = require('../model_fire/adminF');
const recruiter = require('../model_fire/recruiterF');
const clientspoc = require('../model_fire/clientspocF');
const adminModel = require('../model_fire/adminCF');
const { db } = require('./firebase_ad');

// Middleware to check authentication
function authMiddleware(req, res, next) {
  const token = req.cookies.__session;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// ============ NOTIFICATION API ENDPOINTS ============

/**
 * GET /api/notifications
 * Get notifications for the logged-in user
 * Query params: ?unreadOnly=true&limit=20&offset=0&type=new_candidate_submitted
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      unreadOnly = false,
      limit = 50,
      offset = 0,
      type
    } = req.query;

    // Get user email
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    console.log(`[NOTIFICATIONS] Fetching for user: ${userEmail}`);

    const notifications = await notificationModel.getNotificationsByRecipient(userEmail, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset),
      type: type || null
    });

    console.log(`[NOTIFICATIONS] Found ${notifications.length} notifications for ${userEmail}`);

    const unreadCount = await notificationModel.getUnreadCount(userEmail);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the logged-in user
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const unreadCount = await notificationModel.getUnreadCount(userEmail);

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required"
      });
    }

    const updatedNotification = await notificationModel.markAsRead(id);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the logged-in user
 */
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const count = await notificationModel.markAllAsRead(userEmail);

    res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read`,
      updatedCount: count
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required"
      });
    }

    const result = await notificationModel.deleteNotification(id);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message
    });
  }
});

// ============ NOTIFICATION TRIGGER ENDPOINTS ============

/**
 * POST /api/notifications/notify-new-candidate
 * Trigger notification when new candidate is submitted
 * Called internally by candidate submission endpoint
 */
router.post('/trigger/new-candidate', authMiddleware, async (req, res) => {
  try {
    const { pos_id, candidateName, candidateId } = req.body;

    if (!pos_id) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Get position details
    const position = await ad_Pos.findPositionByPosId(pos_id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Get recruiter details
    let user = null;
    try {
      user = await recruiter.findRecruiterByEmail(req.user.email);
    } catch (err) {
      // Try admin model
      try {
        user = await adminModel.findAdminByEmail(req.user.email);
      } catch (e) {}
    }

    // Get ClientSPOC details
    let clientspocUser = null;
    if (position.clientspoc) {
      try {
        clientspocUser = await clientspoc.findClientSpocByEmail(position.clientspoc);
      } catch (err) {
        // Try admin model
        try {
          clientspocUser = await adminModel.findAdminByEmail(position.clientspoc);
        } catch (e) {}
      }
    }

    // Create notification for ClientSPOC
    if (clientspocUser && position.clientspoc) {
      await notificationModel.notifyClientSpocNewCandidate({
        clientspocEmail: position.clientspoc,
        clientspocName: clientspocUser.name || clientspocUser.firstName,
        positionId: pos_id,
        positionTitle: position.position,
        clientName: position.client,
        candidateName,
        candidateId,
        recruiterEmail: req.user.email,
        recruiterName: user?.name || user?.firstName || req.user.email.split('@')[0]
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification created successfully"
    });
  } catch (error) {
    console.error("Error creating new candidate notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/trigger/access-request-status
 * Trigger notification when access request status changes
 * Called internally by access request management endpoint
 */
router.post('/trigger/access-request-status', authMiddleware, async (req, res) => {
  try {
    const {
      recruiterEmail,
      positionId,
      positionTitle,
      clientName,
      status,
      rejectionReason
    } = req.body;

    if (!recruiterEmail || !positionId || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: recruiterEmail, positionId, status"
      });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'accepted' or 'rejected'"
      });
    }

    await notificationModel.notifyRecruiterAccessRequestStatus({
      recruiterEmail,
      positionId,
      positionTitle,
      clientName,
      status,
      rejectionReason
    });

    res.status(200).json({
      success: true,
      message: "Notification created successfully"
    });
  } catch (error) {
    console.error("Error creating access request notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/trigger/new-position
 * Trigger notification when new position is created
 * Called internally by position creation endpoint
 */
router.post('/trigger/new-position', authMiddleware, async (req, res) => {
  try {
    const { pos_id } = req.body;

    if (!pos_id) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required"
      });
    }

    // Get position details
    const position = await ad_Pos.findPositionByPosId(pos_id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Notify ClientSPOC about their new position
    if (position.clientspoc) {
      await notificationModel.createNotification({
        recipientEmail: position.clientspoc,
        recipientType: 'clientspoc',
        type: 'new_position_available',
        title: 'New Position Created',
        message: `You have successfully created a new position "${position.position}" for ${position.client || 'your organization'}`,
        positionId: pos_id,
        positionTitle: position.position,
        clientName: position.client
      });
    }

    // Notify all active recruiters about new position
    // In a real app, you might want to send to specific recruiters based on skills/location
    try {
      const recruiterSnap = await db.collection('recruiter_db').where('status', '==', 'active').get();
      
      if (!recruiterSnap.empty) {
        const notifications = [];
        recruiterSnap.docs.forEach(doc => {
          const recruiterData = doc.data();
          if (recruiterData.email && recruiterData.email !== position.clientspoc) {
            notifications.push({
              recipientEmail: recruiterData.email,
              recipientType: 'recruiter',
              type: 'new_position_available',
              title: 'New Position Available',
              message: `New position "${position.position}" added for ${position.client || 'a client'}${position.location ? ` in ${Array.isArray(position.location) ? position.location.join(', ') : position.location}` : ''}`,
              positionId: pos_id,
              positionTitle: position.position,
              clientName: position.client,
              metadata: {
                location: position.location,
                ctcRange: position.ctcStart && position.ctcEnd ? `${position.ctcStart}-${position.ctcEnd} LPA` : null
              }
            });
          }
        });

        // Create notifications in batch (limit to 50 to avoid overloading)
        const batchLimit = 50;
        for (let i = 0; i < Math.min(notifications.length, batchLimit); i++) {
          await notificationModel.createNotification(notifications[i]);
        }
      }
    } catch (recruiterError) {
      console.error("Error notifying recruiters:", recruiterError);
      // Don't fail the whole request if recruiter notification fails
    }

    res.status(200).json({
      success: true,
      message: "Notifications created successfully"
    });
  } catch (error) {
    console.error("Error creating new position notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notifications",
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/trigger/no-candidate-alert
 * Trigger alert for positions with no candidates
 * Can be called manually or via scheduled job
 */
router.post('/trigger/no-candidate-alert', authMiddleware, async (req, res) => {
  try {
    const { daysThreshold = 3 } = req.query; // Default: alert if no candidates after 3 days

    // Get all positions
    const positionsSnap = await db.collection('admin_AddPos').get();
    
    if (positionsSnap.empty) {
      return res.status(200).json({
        success: true,
        message: "No positions found",
        alertsCreated: 0
      });
    }

    const alertsCreated = [];
    const now = new Date();

    for (const posDoc of positionsSnap.docs) {
      const position = posDoc.data();
      const pos_id = position.pos_id;

      if (!position.clientspoc) continue;

      // Check if position already has candidates
      const candidatesSnap = await db.collection('candidate_db')
        .where('pos_id', '==', pos_id)
        .get();

      if (candidatesSnap.empty) {
        // Calculate days since posting
        let daysSincePosted = 0;
        if (position.datePosted) {
          const postedDate = position.datePosted._seconds 
            ? new Date(position.datePosted._seconds * 1000)
            : position.datePosted;
          daysSincePosted = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
        }

        if (daysSincePosted >= parseInt(daysThreshold)) {
          // Create alert notification
          const notification = await notificationModel.notifyClientSpocNoCandidates({
            clientspocEmail: position.clientspoc,
            positionId: pos_id,
            positionTitle: position.position,
            clientName: position.client,
            daysSincePosted
          });
          alertsCreated.push(notification);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${alertsCreated.length} no-candidate alerts`,
      alertsCreated: alertsCreated.length
    });
  } catch (error) {
    console.error("Error creating no-candidate alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create alerts",
      error: error.message
    });
  }
});

// ============ ADMIN ENDPOINTS ============

/**
 * DELETE /api/notifications/admin/cleanup
 * Delete old notifications (admin only)
 * Query params: ?daysOld=30
 */
router.delete('/admin/cleanup', authMiddleware, async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;

    // Verify admin privileges
    let user = null;
    try {
      user = await adminModel.findAdminByEmail(req.user.email);
    } catch (err) {
      // Try clientspoc
      try {
        user = await clientspoc.findClientSpocByEmail(req.user.email);
      } catch (e) {}
    }

    if (!user || (user.role !== 'admin' && user.roleCategory !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: "Only admins can perform this action"
      });
    }

    const deletedCount = await notificationModel.deleteOldNotifications(parseInt(daysOld));

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount} old notifications`,
      deletedCount
    });
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup notifications",
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/admin/debug
 * Debug endpoint to check notifications in database (admin only)
 */
router.get('/admin/debug', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;

    // Verify admin privileges
    let user = null;
    try {
      user = await adminModel.findAdminByEmail(req.user.email);
    } catch (err) {
      try {
        user = await clientspoc.findClientSpocByEmail(req.user.email);
      } catch (e) {}
    }

    if (!user || (user.role !== 'admin' && user.roleCategory !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: "Only admins can use this debug endpoint"
      });
    }

    let snapshot;
    if (email) {
      // Get notifications for specific email
      snapshot = await notificationCollection
        .where('recipientEmail', '==', email.toLowerCase())
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      res.status(200).json({
        success: true,
        message: `Notifications for ${email}`,
        count: snapshot.size,
        notifications: snapshot.docs.map(doc => ({
          id: doc.id,
          recipientEmail: doc.data().recipientEmail,
          type: doc.data().type,
          title: doc.data().title,
          message: doc.data().message,
          read: doc.data().read,
          createdAt: safeConvertToISOString(doc.data().createdAt)
        }))
      });
    } else {
      // Get all notifications (limited)
      snapshot = await notificationCollection
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      res.status(200).json({
        success: true,
        message: `All notifications (limited to 50)`,
        count: snapshot.size,
        notifications: snapshot.docs.map(doc => ({
          id: doc.id,
          recipientEmail: doc.data().recipientEmail,
          type: doc.data().type,
          title: doc.data().title,
          message: doc.data().message,
          read: doc.data().read,
          createdAt: safeConvertToISOString(doc.data().createdAt)
        }))
      });
    }
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Debug endpoint error",
      error: error.message
    });
  }
});

module.exports = router;

