import axios from 'axios';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { UserDispatchContext } from '../context/AuthPro';

const Ad_login = () => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/admin/ad", {
        email,
        pass
      }, {withCredentials: true});

      dispatch({
        type: "ADMIN_LOGIN_SUCCESS",
        payload: {
          email: res.data.email,
          name: res.data.name,
          type: "admin",
          roleCategory: res.data.roleCategory,
          role: res.data.role
        }
      });

      setMessage(res.data.message || "Verified Successfully!");
      setTimeout(() => {
        navigate("/ad_panel");
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid Credentials');
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
              Client SPOC Login
            </h2>
            <p className="text-blue-50 text-sm">Access your organization's recruitment portal</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Message Display */}
          {message && (
            <div className={`text-center text-sm mb-6 p-3 rounded-xl font-medium border-2 ${
              message.includes("Success") || message.includes("Verified")
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="admin@company.com"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="pass" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="pass"
                  name="pass"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
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

          {/* Footer Note */}
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Need Help?</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Need access?{" "}
              <a 
                href="mailto:admin@recruiterv.com" 
                className="text-blue-600 hover:text-orange-500 font-semibold transition-colors"
              >
                Contact Administrator
              </a>
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                <span className="font-semibold text-blue-700">🔒 Secure Access</span><br/>
                This portal is exclusively for authorized Client SPOCs
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Lock size={14} className="text-blue-600" />
            <span>256-bit SSL encrypted connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ad_login;
