import { useState, useEffect, useRef } from "react";
import { isSuccessMessage } from '../utils/messageTone';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getRouteFromCategory } from "../../utils/routeMapping";
import { Mail, ShieldCheck, ArrowRight, Loader2, RotateCcw, Clock, CheckCircle } from "lucide-react";

const RESEND_COOLDOWN = 60;

// ── Under-review modal shown after successful OTP ─────────────────────────────
const PendingModal = ({ email, onClose }) => (
  <div style={{
    position:'fixed', inset:0, zIndex:9999,
    background:'rgba(15,23,42,0.65)', backdropFilter:'blur(6px)',
    display:'flex', alignItems:'center', justifyContent:'center', padding:16,
  }}>
    <div style={{
      background:'#fff', borderRadius:24, maxWidth:480, width:'100%',
      boxShadow:'0 24px 64px rgba(0,0,0,0.22)', overflow:'hidden',
      animation:'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Gradient header */}
      <div style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#f97316 100%)', padding:'32px 32px 28px', textAlign:'center', position:'relative' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.2)', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>
          🎉
        </div>
        <h2 style={{ margin:0, fontSize:'1.45rem', fontWeight:800, color:'#fff', lineHeight:1.25 }}>
          Registration Received!
        </h2>
        <p style={{ margin:'8px 0 0', fontSize:13, color:'rgba(255,255,255,0.85)' }}>
          Your account is now under review
        </p>
      </div>

      {/* Body */}
      <div style={{ padding:'28px 32px 24px' }}>
        <p style={{ margin:'0 0 20px', fontSize:15, color:'#374151', lineHeight:1.75, textAlign:'center' }}>
          Thank you for registering on <strong style={{ color:'#2563eb' }}>RecruiterV</strong>. We have received your registration request.
        </p>

        {/* Status badge */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:14, padding:'14px 18px', marginBottom:20 }}>
          <Clock size={22} color="#d97706" style={{ flexShrink:0 }} />
          <div>
            <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#92400e' }}>Under Review — 24 hours</p>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#a16207', lineHeight:1.5 }}>
              Our technical team is reviewing your details. You'll get an email at <strong>{email}</strong> once approved.
            </p>
          </div>
        </div>

        {/* Steps */}
        {[
          ['📧', 'Check your email', 'A confirmation email has been sent with details of next steps.'],
          ['✅', 'Admin approval', 'Once approved you will receive another email and can log in immediately.'],
          ['🚀', 'Get started', 'After approval, complete your profile and start using RecruiterV.'],
        ].map(([ico, title, desc], i) => (
          <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{ico}</span>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:13, color:'#1f2937' }}>{title}</p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'#6b7280', lineHeight:1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer button */}
      <div style={{ padding:'0 32px 28px' }}>
        <button
          onClick={onClose}
          style={{
            width:'100%', padding:'13px', borderRadius:12, border:'none', fontWeight:700, fontSize:15,
            background:'linear-gradient(135deg,#2563eb,#f97316)', color:'#fff', cursor:'pointer',
            boxShadow:'0 4px 14px rgba(37,99,235,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
        >
          <CheckCircle size={18} /> Got it — Back to Login
        </button>
      </div>
    </div>
    <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
  </div>
);

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingEmail");

  // Start countdown on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMessage("");
    try {
      await axios.post("/auth/resend_otp", { email });
      setMessage("A new OTP has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const cleanLocalStorage = () => {
    ["pendingEmail","experienceCategory","planType","roleCategory","userType","specialization"].forEach(k => localStorage.removeItem(k));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/auth/otp_verify/", { email, otp }, { withCredentials: true });

      if (res.data.showPendingModal) {
        cleanLocalStorage();
        setShowPendingModal(true);
      } else {
        // fallback for any non-pending response
        setMessage(res.data.message || "Verified successfully!");
        setTimeout(() => { cleanLocalStorage(); navigate("/log_rec"); }, 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleModalClose = () => {
    setShowPendingModal(false);
    navigate("/log_rec");
  };

  return (
    <>
    {showPendingModal && <PendingModal email={email} onClose={handleModalClose} />}
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
              isSuccessMessage(message)
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <div className="flex items-center justify-center gap-2">
                {isSuccessMessage(message) ? (
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

          {/* Resend Section */}
          <div className="mt-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span>Didn't receive the code?</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            {cooldown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend available in{" "}
                <span className="font-semibold text-blue-600">{formatTime(cooldown)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RotateCcw size={15} />
                )}
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}
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
    </>
  );
}

export default OtpVerification;
