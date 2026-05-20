import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook to handle auto-logout after 30 minutes of inactivity
 * @param {Function} onLogout - Callback function to execute when user should be logged out
 * @param {boolean} isActive - Whether the hook should be active (only for logged-in recruiters)
 */
const useInactivityLogout = (onLogout, isActive = false) => {
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // Update backend every 5 minutes when active
  const CHECK_INTERVAL = 60 * 1000; // Check inactivity every 1 minute

  const lastActivityTime = useRef(Date.now());
  const activityUpdateTimer = useRef(null);
  const inactivityCheckTimer = useRef(null);
  const hasUpdatedActivity = useRef(false);

  // Update lastActive on backend
  const updateBackendActivity = useCallback(async () => {
    if (!isActive) return;
    
    try {
      await axios.post('/auth/update-activity', {}, { withCredentials: true });
      console.log('Activity updated on backend');
    } catch (error) {
      console.error('Failed to update activity:', error);
      // If update fails due to auth error, trigger logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        onLogout();
      }
    }
  }, [isActive, onLogout]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!isActive) return;

    const now = Date.now();
    lastActivityTime.current = now;

    // Clear existing timer
    if (activityUpdateTimer.current) {
      clearTimeout(activityUpdateTimer.current);
    }

    // Schedule backend update if not done recently
    if (!hasUpdatedActivity.current) {
      hasUpdatedActivity.current = true;
      updateBackendActivity();

      // Reset flag after interval
      activityUpdateTimer.current = setTimeout(() => {
        hasUpdatedActivity.current = false;
      }, ACTIVITY_UPDATE_INTERVAL);
    }
  }, [isActive, updateBackendActivity, ACTIVITY_UPDATE_INTERVAL]);

  // Check for inactivity
  const checkInactivity = useCallback(() => {
    if (!isActive) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      console.log('User inactive for 30 minutes, logging out...');
      onLogout();
    }
  }, [isActive, onLogout, INACTIVITY_TIMEOUT]);

  useEffect(() => {
    if (!isActive) {
      // Clean up timers if hook becomes inactive
      if (activityUpdateTimer.current) {
        clearTimeout(activityUpdateTimer.current);
      }
      if (inactivityCheckTimer.current) {
        clearInterval(inactivityCheckTimer.current);
      }
      return;
    }

    // Initialize last activity time
    lastActivityTime.current = Date.now();

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add throttling to avoid too many calls
    let throttleTimer = null;
    const throttledHandleActivity = () => {
      if (!throttleTimer) {
        handleActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Attach event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledHandleActivity, { passive: true });
    });

    // Start inactivity check interval
    inactivityCheckTimer.current = setInterval(checkInactivity, CHECK_INTERVAL);

    // Initial activity update
    updateBackendActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledHandleActivity);
      });

      if (activityUpdateTimer.current) {
        clearTimeout(activityUpdateTimer.current);
      }

      if (inactivityCheckTimer.current) {
        clearInterval(inactivityCheckTimer.current);
      }

      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isActive, handleActivity, checkInactivity, updateBackendActivity, CHECK_INTERVAL]);

  return null;
};

export default useInactivityLogout;
