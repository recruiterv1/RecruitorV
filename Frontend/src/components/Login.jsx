import { useContext, useState, useEffect } from "react";
import { isSuccessMessage } from '../utils/messageTone';
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
import { UserDispatchContext } from "../context/AuthPro";
import { setAuthToken, clearAuthToken } from "../lib/authToken";
import { isNativeApp, isRoleAllowedInApp } from "../lib/apiBase";

// A new joiner who picked a position while registering is taken straight to it
// the first time they sign in — the flag is set at registration and cleared
// here, so it only ever redirects once.
//
// Where they land differs by role: a recruiter works the position from Assigned
// Positions, while a coach or expert's first job on one is to record its
// briefing, so they go to My Briefings.
const firstLoginPositionRedirect = (role) => {
  try {
    if (localStorage.getItem('rv_first_position') !== '1') return null;
    localStorage.removeItem('rv_first_position');
    return (role === 'Coach' || role === 'Expert') ? '/my-briefings' : '/assigned-positions';
  } catch { return null; }
};

const APP_ROLE_BLOCKED_MSG =
  "This app is for Recruiters, Coaches and Experts only. Please sign in to this account on the website at recruiterv.com.";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UserCheck } from "lucide-react";

const Login = () => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useContext(UserDispatchContext);

  // Check for inactivity logout message
  useEffect(() => {
    if (searchParams.get('inactivity') === 'true') {
      setMessage('You have been logged out due to inactivity.');
      // Clear the query parameter
      searchParams.delete('inactivity');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('expired') === 'true') {
      setMessage('Your session has expired. Please log in again to continue.');
      searchParams.delete('expired');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('blocked') === 'true') {
      setMessage('Your access has been put on hold by the administrator. Please contact support for assistance.');
      searchParams.delete('blocked');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    dispatch({ type: "LOGIN_START" });

    try {
      const res = await axios.post("/auth/rec_verify/", {
        email: email.toLowerCase().trim(),  // Normalize email to lowercase
        password,
      }, { withCredentials: true });
      
      const userData = res.data.user;

      // Mobile app: allow only Recruiter / Coach / Expert
      if (isNativeApp() && !isRoleAllowedInApp(userData?.roleCategory)) {
        clearAuthToken();
        dispatch({ type: "LOGIN_FAILURE" });
        setMessage(APP_ROLE_BLOCKED_MSG);
        setLoading(false);
        return;
      }

      setMessage(res.data.message || "Verified successfully ✅");

      setAuthToken(res.data.token); // for the native app (header auth); harmless on web

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          name: userData?.name,
          email: userData?.email,
          roleCategory: userData?.roleCategory,
          experienceCategory: userData?.experienceCategory,
          agreementSigned: !!userData?.agreementSigned
        }
      });

      // ✅ ROUTING LOGIC — redirect to Open Positions if agreement signed + profile ≥ 80%
      setTimeout(async () => {
        const role = userData?.roleCategory;

        if (role === 'Super Admin') {
          navigate("/superadmin");
          return;
        }

        // For Recruiter / Coach / Expert: check agreement + profile before deciding destination
        const agreementSigned = !!userData?.agreementSigned;
        let profilePct = 0;
        if (agreementSigned) {
          try {
            const pcRes = await axios.get('/api/profile/profile-completion', { withCredentials: true });
            profilePct = pcRes.data?.completion?.percentage ?? 0;
          } catch (_) {}
        }
        const isVendorTeam = !!userData?.vendorEmail || !!userData?.consultingFirmId;
        const readyForPositions = isVendorTeam || (agreementSigned && profilePct >= 80);

        const firstPos = firstLoginPositionRedirect(role);
        if (firstPos) {
          navigate(firstPos);
        } else if (role === 'Coach') {
          navigate(readyForPositions ? "/coach-expert-positions" : "/coach-dashboard");
        } else if (role === 'Expert') {
          navigate(readyForPositions ? "/coach-expert-positions" : "/expert-dashboard");
        } else if (role === 'Referrer') {
          navigate("/referer-dashboard");
        } else {
          navigate(readyForPositions ? "/dash_position" : "/dash_rec");
        }
      }, 500);
      
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      
      // Parse error response for better messages
      const errorData = err.response?.data;
      const errorCode = errorData?.errorCode;
      const errorMessage = errorData?.message;
      const errorHint = errorData?.hint;
      
      // Build enhanced error message
      let displayMessage = errorMessage || "Invalid or Wrong Password";
      
      // Add hint if available
      if (errorHint) {
        displayMessage = `${displayMessage}\n\n💡 ${errorHint}`;
      }
      
      // Special handling for different error types
      if (errorCode === "USER_NOT_FOUND") {
        displayMessage = "No account found with this email.\n\n💡 Please check your email or register for a new account.";
      } else if (errorCode === "EMAIL_NOT_VERIFIED") {
        displayMessage = "Email not verified.\n\n💡 Check your email for the OTP code sent during registration.";
      } else if (errorCode === "INVALID_PASSWORD") {
        displayMessage = "Incorrect password.\n\n💡 Use 'Forgot Password' to reset your password if needed.";
      } else if (errorCode === "SERVER_ERROR") {
        displayMessage = "Server error. Please try again later.";
      }
      
      setMessage(displayMessage);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(result);

      const idToken = await result.user.getIdToken();

      const response = await axios.post("/api/googla/au_google", {}, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        }
      });

      const userData = response.data;

      // Mobile app: allow only Recruiter / Coach / Expert
      if (isNativeApp() && !isRoleAllowedInApp(userData?.roleCategory)) {
        clearAuthToken();
        dispatch({ type: "LOGIN_FAILURE" });
        setMessage(APP_ROLE_BLOCKED_MSG);
        return;
      }

      setAuthToken(response.data.token); // native-app header auth
      console.log("Backend response:", userData);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          name: userData?.name || result.user.displayName,
          email: userData?.email || result.user.email,
          roleCategory: userData?.roleCategory,
          experienceCategory: userData?.experienceCategory,
          agreementSigned: !!userData?.agreementSigned
        },
      });

      // ✅ ROUTING LOGIC (same as email login)
      const role = userData?.roleCategory;

      if (role === 'Super Admin') {
        navigate("/superadmin");
        return;
      }

      const agreementSigned = !!userData?.agreementSigned;
      let profilePct = 0;
      if (agreementSigned) {
        try {
          const pcRes = await axios.get('/api/profile/profile-completion', { withCredentials: true });
          profilePct = pcRes.data?.completion?.percentage ?? 0;
        } catch (_) {}
      }
      const isVendorTeam = !!userData?.vendorEmail || !!userData?.consultingFirmId;
      const readyForPositions = isVendorTeam || (agreementSigned && profilePct >= 80);

      if (role === 'Coach') {
        navigate(firstLoginPositionRedirect(role) || (readyForPositions ? "/coach-expert-positions" : "/coach-dashboard"));
      } else if (role === 'Expert') {
        navigate(firstLoginPositionRedirect(role) || (readyForPositions ? "/coach-expert-positions" : "/expert-dashboard"));
      } else {
        navigate(firstLoginPositionRedirect(role) || (readyForPositions ? "/dash_position" : "/dash_rec"));
      }
      
    } catch (error) {
      console.error("Google login error:", error);
      dispatch({ type: "LOGIN_FAILURE" });
      setMessage("Google login failed. Please try again.");
    }
  };

  const handleLinkedInLogin = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI,
      scope: 'openid email profile',
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
        
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <UserCheck size={32} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-blue-50 text-sm">Sign in to your account</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Message Display */}
          {message && (
            <div className={`text-center text-sm mb-6 p-3 rounded-xl font-medium border-2 ${
              isSuccessMessage(message)
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            {/* Email Input */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-orange-500 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 group"
            >
              <FcGoogle size={24} />
              <span className="text-gray-700 font-medium group-hover:text-gray-900">
                Continue with Google
              </span>
            </button>

            {/* LinkedIn Login */}
            <button
              onClick={handleLinkedInLogin}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group"
            >
              <FaLinkedin size={24} className="text-blue-600" />
              <span className="text-gray-700 font-medium group-hover:text-blue-700">
                Continue with LinkedIn
              </span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 space-y-3">
            <p className="text-center text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <Link
                to="/login/con"   //Login Conditions
                className="text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Terms & Conditions
              </Link>
            </p>

            <div className="flex items-center justify-center gap-2 text-sm pt-2">
              <span className="text-gray-600">Don't have an account?</span>
              <Link
                to="/join"
                className="text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Join Now
              </Link>
            </div>

            {/* Other account types */}
            <div className="pt-3 mt-2 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400 mb-2">Logging in as a different role?</p>
              <div className="flex items-center justify-center gap-3 text-sm">
                <Link
                  to="/clientspoc"
                  className="font-semibold text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                >
                  Client SPOC Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/vendor"
                  className="font-semibold text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                >
                  Vendor Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Lock size={14} className="text-blue-600" />
            <span>Secure login with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;