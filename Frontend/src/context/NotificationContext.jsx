import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserStateContext } from './AuthPro';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(UserStateContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch notifications for the logged-in user
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user?.email) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (options.unreadOnly) {
        params.append('unreadOnly', 'true');
      }
      if (options.limit) {
        params.append('limit', options.limit);
      }
      if (options.offset) {
        params.append('offset', options.offset);
      }

      const response = await axios.get(`/api/notifications?${params.toString()}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.email) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await axios.get('/api/notifications/unread-count', {
        withCredentials: true
      });

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user?.email]);

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await axios.put('/api/notifications/read-all', {}, {
        withCredentials: true
      });

      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Refresh notifications (called after login or when switching pages)
  const refreshNotifications = useCallback(() => {
    fetchNotifications({ limit: 20 });
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Auto-refresh notifications when user changes
  useEffect(() => {
    if (user?.email) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.email, refreshNotifications]);

  // Set up interval to refresh unread count periodically (every 30 seconds)
  useEffect(() => {
    if (!user?.email) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.email, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    setIsDropdownOpen,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

