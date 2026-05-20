import axios from "axios";
import React, { createContext, useEffect, useReducer, useState } from "react";
import useInactivityLogout from "../hooks/useInactivityLogout";

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
      return { ...state, user: null };

    default:
      return state;
  }
};

const AuthPro = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isChecking, setIsChecking] = useState(true);

  // Handle auto-logout due to inactivity
  const handleInactivityLogout = async () => {
    try {
      // Call logout endpoint
      await axios.post("/auth/logout", {}, { withCredentials: true });
      
      // Update state
      dispatch({ type: "LOGOUT" });
      
      // Redirect to login page using window.location instead of navigate
      window.location.href = "/log_rec?inactivity=true";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, still logout locally
      dispatch({ type: "LOGOUT" });
      window.location.href = "/log_rec";
    }
  };

  // Activate inactivity tracking only for recruiters (not admins)
  const isRecruiterLoggedIn = state.user?.type === "recruiter" && !isChecking;
  
  // Use inactivity logout hook
  useInactivityLogout(handleInactivityLogout, isRecruiterLoggedIn);

  useEffect(() => {
  

    const checkAuth = async () => {
      setIsChecking(true);

      try {
        // -------- ADMIN CHECK --------
        try {
          const adminRes = await axios.get("/admin/authcheck", { withCredentials: true });

          if (adminRes.data?.user) {
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
            // Check if user is Coach or Expert (from roleCategory) or Recruiter
            const userRole = recRes.data.user.roleCategory;
            
            if (userRole === 'Coach' || userRole === 'Expert') {
              // Coach/Expert user
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: { ...recRes.data.user, type: userRole.toLowerCase() },
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

  return (
    <UserDispatchContext.Provider value={dispatch}>
      <UserStateContext.Provider value={state}>
        {children}
      </UserStateContext.Provider>
    </UserDispatchContext.Provider>
  );
};

export default AuthPro;
