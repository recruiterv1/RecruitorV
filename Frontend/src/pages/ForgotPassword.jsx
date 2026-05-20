import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setSuccess(false);

    try {
      // Call backend to initiate password reset
      const res = await axios.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setSuccess(true);
      setMessage(res.data.message || "Password reset instructions sent to your email!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to send password reset email. Please try again."
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Forgot Password
            </h2>
            <p className="text-blue-50 text-sm">
              Enter your email to reset your password
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={20} />
                <span className="font-medium">Success!</span>
              </div>
              <p className="text-green-600 text-sm mt-2">
                {message}
              </p>
              <p className="text-green-600 text-sm mt-2">
                Please check your email inbox and spam folder for the reset link.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-600 text-sm mt-2">{error}</p>
            </div>
          )}

          {/* Form - Hidden after success */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2 text-sm pt-2">
              <span className="text-gray-600">Remember your password?</span>
              <Link
                to="/log_rec"
                className="text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-600">Don't have an account?</span>
              <Link
                to="/reg"
                className="text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Reset link will expire in 1 hour for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

