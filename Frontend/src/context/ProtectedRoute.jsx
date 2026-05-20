import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserStateContext } from "../context/AuthPro";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(UserStateContext);

  // wait for auth check
  if (loading) return null;

  // NOT LOGGED IN
  if (!user) {
    // recruiter route → recruiter login
    if (role === "recruiter") {
      return <Navigate to="/log_rec" replace />;
    }

    // admin route → admin login
    if (role === "admin") {
      return <Navigate to="/clientspoc" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
