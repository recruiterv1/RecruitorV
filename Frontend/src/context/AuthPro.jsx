import axios from "axios";
import React, { createContext, useEffect, useReducer, useState } from "react";
import useInactivityLogout from "../hooks/useInactivityLogout";
import { clearAuthToken } from "../lib/authToken";
import { isNativeApp, isRoleAllowedInApp } from "../lib/apiBase";
import { initPush, teardownPush } from "../lib/push";

export const UserStateContext = createContext();
export const UserDispatchContext = createContext();

const initialState = {
  user: null,
  loading: false,
  error: null,
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };

    case "LOGIN_SUCCESS":
      return { ...state, user: action.payload, loading: false, error: null };

    case "ADMIN_LOGIN_SUCCESS":
      return { ...state, user: action.payload, loading: false, error: null };

    case "LOGIN_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "LOGOUT":
      clearAuthToken();
      teardownPush();
      return { ...state, user: null };

    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };

    default:
      return state;
  }
};

const AuthPro = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isChecking, setIsChecking] = useState(true);

  // Handle auto-logout due to inactivity
  const handleInactivityLogout = async () => {
    // Admins / ClientSPOCs sign in at /clientspoc; everyone else at /log_rec.
    const loginPath = state.user?.type === "admin" ? "/clientspoc" : "/log_rec";
    try {
      // Call logout endpoint
      await axios.post("/auth/logout", {}, { withCredentials: true });

      // Update state
      dispatch({ type: "LOGOUT" });

      // Redirect to login page using window.location instead of navigate
      window.location.href = `${loginPath}?inactivity=true`;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, still logout locally
      dispatch({ type: "LOGOUT" });
      window.location.href = loginPath;
    }
  };

  // Activate inactivity tracking for any signed-in user (30 min idle → logout).
  const isUserLoggedIn = !!state.user && !isChecking;

  // Use inactivity logout hook
  useInactivityLogout(handleInactivityLogout, isUserLoggedIn);

  useEffect(() => {
  

    const checkAuth = async () => {
      setIsChecking(true);

      try {
        // -------- ADMIN CHECK --------
        try {
          const adminRes = await axios.get("/admin/authcheck", { withCredentials: true });

          if (adminRes.data?.user) {
            // In the mobile app, only ClientSPOC / Vendor are allowed through this
            // (admin) auth path; Admin / Super Admin remain website-only.
            if (isNativeApp() && !isRoleAllowedInApp(adminRes.data.user.roleCategory || adminRes.data.user.role)) {
              clearAuthToken();
              dispatch({ type: "LOGOUT" });
              setIsChecking(false);
              return;
            }
            dispatch({
              type: "ADMIN_LOGIN_SUCCESS",
              payload: { ...adminRes.data.user, type: "admin" },
            });
            setIsChecking(false);
            return;
          }
        } catch (err) {
          // no admin session or invalid token
        }

        // -------- RECRUITER CHECK --------
        try {
          const recRes = await axios.get("/auth/check", { withCredentials: true });

          if (recRes.data?.user) {
            // Mobile app: only Recruiter / Coach / Expert may stay signed in
            if (isNativeApp() && !isRoleAllowedInApp(recRes.data.user.roleCategory || recRes.data.user.role)) {
              clearAuthToken();
              dispatch({ type: "LOGOUT" });
              setIsChecking(false);
              return;
            }
            // Check if user is Coach or Expert (from roleCategory) or Recruiter
            const userRole = (recRes.data.user.roleCategory || '').toLowerCase().replace(/\s/g, '');
            const userRoleRaw = (recRes.data.user.role || '').toLowerCase().replace(/\s/g, '');
            const isSuperAdmin = userRole === 'superadmin' || userRoleRaw === 'superadmin';

            if (isSuperAdmin) {
              // SuperAdmin stored in recruiter_db
              dispatch({
                type: "ADMIN_LOGIN_SUCCESS",
                payload: { ...recRes.data.user, type: "admin" },
              });
            } else if (userRole === 'coach' || userRole === 'expert') {
              // Coach/Expert user
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: { ...recRes.data.user, type: userRole },
              });
            } else {
              // Recruiter user (default)
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: { ...recRes.data.user, type: "recruiter" },
              });
            }
            setIsChecking(false);
            return;
          }
        } catch (err) {
        
        }

        // -------- NO USER --------
        dispatch({ type: "LOGOUT" });
        setIsChecking(false);
      } catch (err) {
        dispatch({ type: "LOGOUT" });
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Register for native push once a user is signed in (mobile app only)
  useEffect(() => {
    if (state.user && isNativeApp()) initPush();
  }, [state.user?.email]);

  // Activity heartbeat — while signed in and the tab is visible, ping the server
  // every few minutes so we can report session hours / active slots / active-now.
  useEffect(() => {
    if (!state.user?.email) return;
    const role = state.user?.type || '';
    // Which device the user is on: native app or a phone browser → mobile; else desktop.
    const isMobileDevice = isNativeApp() ||
      (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent || ''));
    const device = isMobileDevice ? 'mobile' : 'desktop';
    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      axios.post('/activity/ping', { role, device }, { withCredentials: true })
        .catch((err) => {
          // An admin/superadmin (or the recruiter's vendor) revoked access while the
          // user was signed in — sign them out now instead of letting them keep
          // working until their next refresh.
          if (err?.response?.status === 403 && err.response.data?.errorCode === 'ACCOUNT_BLOCKED') {
            clearAuthToken();
            axios.post('/auth/logout', {}, { withCredentials: true })
              .catch(() => {})
              .finally(() => {
                dispatch({ type: 'LOGOUT' });
                window.location.href = '/log_rec?blocked=true';
              });
          }
          // other ping failures are non-fatal
        });
    };
    ping(); // immediate on login / mount
    const id = setInterval(ping, 3 * 60 * 1000); // every 3 minutes
    const onVis = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [state.user?.email, state.user?.type]);

  return (
    <UserDispatchContext.Provider value={dispatch}>
      <UserStateContext.Provider value={{ ...state, isChecking }}>
        {children}
      </UserStateContext.Provider>
    </UserDispatchContext.Provider>
  );
};

export default AuthPro;
