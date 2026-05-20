import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getRouteFromCategory } from "../../utils/routeMapping";
import { Mail, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingEmail");

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/auth/otp_verify/", {
        email,
        otp,
      }, { withCredentials: true });

      setMessage(res.data.message || "Verified successfully! Redirecting...");

      // Get role info from backend response and localStorage
      const roleCategory = res.data.roleCategory || localStorage.getItem("roleCategory");
      const userType = res.data.userType || localStorage.getItem("userType");

      // Determine redirect route based on role and userType
      let redirectRoute;

      if (roleCategory === "Coach") {
        if (userType === "free") {
          // Free Coach → Login page
          redirectRoute = "/log_rec";
          console.log("Free Coach user, redirecting to login page");
        } else {
          // Paid Coach → Coach dashboard with sidebar
          redirectRoute = "/coach";
          console.log("Paid Coach user, redirecting to Coach dashboard");
        }
      } else if (roleCategory === "Expert") {
        if (userType === "free") {
          // Free Expert → Login page
          redirectRoute = "/log_rec";
          console.log("Free Expert user, redirecting to login page");
        } else {
          // Paid Expert → Expert dashboard with sidebar
          redirectRoute = "/expert";
          console.log("Paid Expert user, redirecting to Expert dashboard");
        }
      } else {
        // Recruiter or other roles - use existing logic
        const planType = localStorage.getItem("planType");
        const experienceCategory = localStorage.getItem("experienceCategory");

        if (planType === "0") {
          redirectRoute = "/log_rec";
          console.log("Free plan user (planType: 0), redirecting to login page");
        } else if (experienceCategory === "N/A" || !experienceCategory) {
          redirectRoute = "/log_rec";
          console.log("Experience category is N/A, redirecting to login page");
        } else {
          redirectRoute = getRouteFromCategory(experienceCategory);
          console.log(`Paid plan user, redirecting to route for category: ${experienceCategory}`);
        }
      }

      setTimeout(() => {
        // Clean up localStorage
        localStorage.removeItem("pendingEmail");
        localStorage.removeItem("experienceCategory");
        localStorage.removeItem("planType");
        localStorage.removeItem("roleCategory");
        localStorage.removeItem("userType");
        localStorage.removeItem("specialization");

        // Navigate to the appropriate page
        navigate(redirectRoute);
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid or expired OTP \n Go Register Again");
    }

    setLoading(false);
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
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Verify Your Account
            </h2>
            <p className="text-blue-50 text-sm">Enter the verification code we sent to your email</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Email Display */}
          <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl border border-blue-200">
            <Mail size={18} className="text-blue-600" />
            <p className="text-center text-gray-700 text-sm">
              OTP sent to <span className="font-bold text-blue-600">{email}</span>
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`text-center text-sm mb-6 p-4 rounded-xl font-medium border-2 ${
              message.includes("success") || message.includes("Verified") || message.includes("Redirecting")
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <div className="flex items-center justify-center gap-2">
                {message.includes("success") || message.includes("Verified") ? (
                  <ShieldCheck size={18} className="text-green-600" />
                ) : null}
                <span>{message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-2xl tracking-[0.5em] font-bold text-gray-800 transition-all"
                placeholder="⚬ ⚬ ⚬ ⚬ ⚬ ⚬"
                required
              />
              <p className="text-xs text-gray-500 text-center">
                Please check your email inbox or spam folder
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="h-px flex-1 bg-gray-300"></div>
              <span>Need Help?</span>
              <div className="h-px flex-1 bg-gray-300"></div>
            </div>

            {/* <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={() => {
                  // Backend logic remains same - this is just UI
                  setMessage("Resend feature coming soon!");
                }}
                className="text-sm text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Resend OTP
              </button>
            </div> */}
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <ShieldCheck size={16} className="text-blue-600" />
            <span>Your information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;
