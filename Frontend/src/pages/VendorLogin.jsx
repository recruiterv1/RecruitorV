import axios from 'axios';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { UserDispatchContext } from '../context/AuthPro';
import { setAuthToken } from '../lib/authToken';

const VendorLogin = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('/admin/login', { email, pass }, { withCredentials: true });

      const roleCategory = res.data.roleCategory;

      if (roleCategory !== 'Vendor') {
        setMessage('This portal is for Vendor accounts only. Please use the correct login URL.');
        setLoading(false);
        return;
      }

      setAuthToken(res.data.token); // native-app header auth; harmless on web

      dispatch({
        type: 'ADMIN_LOGIN_SUCCESS',
        payload: {
          email: res.data.email,
          name: res.data.name,
          type: 'admin',
          roleCategory: res.data.roleCategory,
          role: res.data.role,
          recruiterQuantity: res.data.recruiterQuantity,
        }
      });

      setMessage('Login successful! Redirecting…');
      setTimeout(() => navigate('/vendor-dashboard'), 800);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-blue-600 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Store size={32} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Vendor Login</h2>
            <p className="text-purple-100 text-sm">Access your vendor recruitment portal</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div className={`text-center text-sm mb-6 p-3 rounded-xl font-medium border-2 ${
              message.includes('success') || message.includes('Redirecting')
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-purple-600" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                placeholder="vendor@company.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} className="text-purple-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /><span>Verifying…</span></>
              ) : (
                <><span>Sign In</span><ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-gray-500">Need Help?</span></div>
            </div>
            <p className="text-center text-sm text-gray-600">
              Contact your administrator at{' '}
              <a href="mailto:support@recruiterv.com" className="text-purple-600 hover:text-blue-600 font-semibold transition-colors">
                support@recruiterv.com
              </a>
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                <span className="font-semibold text-purple-700">🏢 Vendor Portal</span><br />
                Exclusively for authorized Vendor accounts
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Lock size={14} className="text-purple-600" />
            <span>256-bit SSL encrypted connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
