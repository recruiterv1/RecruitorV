import { useState, useEffect } from "react";
import { isSuccessMessage } from '../utils/messageTone';
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Phone, Mail, User, Lock, Briefcase, Shield, Users, UserCheck, BookOpen, Award, TrendingUp, Tag, FileText, Upload, Clock, X as XIcon } from "lucide-react";
import TermsModal from "./TermsModal";
import PositionPicker from "./PositionPicker";
import { readEligibilityPass } from "../utils/eligibilityPass";
import { buildRegistrationAgreementPDF, getRoleTerms } from "../lib/agreementTerms";

// How many roles of a kind someone has closed, and when they can be reached.
const MAX_SPECIALIZATIONS = 3;
const MAX_AVAILABILITY_SLOTS = 3;
const MAX_POSITIONS_PER_CATEGORY = 6;
const CLOSED_BANDS = ['0-2', '3-5', '6-10', '10+'];
// Two-hour windows across the working day and evening.
const TIME_SLOTS = [
  '6 AM - 8 AM', '8 AM - 10 AM', '10 AM - 12 PM', '12 PM - 2 PM',
  '2 PM - 4 PM', '4 PM - 6 PM', '6 PM - 8 PM', '8 PM - 10 PM', '10 PM - 12 AM',
];
export default function Register() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    roleCategory: "",
    experienceCategory: "N/A", // Default value to prevent empty Firestore entries
    planType: "1", // Default to paid plan
    specialization: [], // up to MAX_SPECIALIZATIONS categories
    userType: "free" // For Coach/Expert (paid/free)
  });

  // Live openings in the chosen specializations, and the one they picked.
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [posGroups, setPosGroups] = useState([]);          // [{category, positions}]
  const [selectedPosition, setSelectedPosition] = useState(null);  // exactly one
  const [selectedClosed, setSelectedClosed] = useState('');        // band for it
  const [availability, setAvailability] = useState([]);   // two-hour windows

  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    axios.get('/candidate/skill-categories')
      .then(res => { if (res.data.success) setSkillCategories(res.data.categories); })
      .catch(() => {});
  }, []);

  // The roles asked about follow the chosen specialization, so they are fetched
  // when it changes — and previous answers dropped, since they were about
  // different roles.
  const specKey = form.specialization.join('|');   // stable dep for the array
  useEffect(() => {
    const cats = form.specialization;
    if (!cats.length) { setPosGroups([]); setSelectedPosition(null); setSelectedClosed(''); return; }
    let live = true;
    setLoadingRoles(true);
    // Dropped rather than carried over: the previous choice belonged to a
    // specialization they have just changed.
    setSelectedPosition(null);
    setSelectedClosed('');
    Promise.all(cats.map(c =>
      axios.get('/api/direct-apply/latest-by-category', {
        params: { skill_category: c, limit: MAX_POSITIONS_PER_CATEGORY },
      })
        .then(r => ({ category: c, positions: r.data?.positions || [] }))
        .catch(() => ({ category: c, positions: [] }))
    ))
      .then(groups => { if (live) setPosGroups(groups); })
      .finally(() => { if (live) setLoadingRoles(false); });
    return () => { live = false; };
  }, [specKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone number validation - only allow digits and limit to 10
    if (name === "mobile") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setForm({ ...form, [name]: digitsOnly });
        // Clear error when user starts typing correctly
        if (digitsOnly.length === 10) {
          setErrors({ ...errors, mobile: "" });
        }
      }
      return;
    }

    // Handle role change
    if (name === "roleCategory") {
      setForm({
        ...form,
        [name]: value,
        experienceCategory: value === "Recruiter" ? "" : "N/A",
        planType: value === "Recruiter" ? form.planType : "1",
        userType: value === "Recruiter" ? "free" : form.userType
      });
    } else {
      setForm({ ...form, [name]: value });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle specialization autocomplete change
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (form.mobile.length !== 10) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }

    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.roleCategory) {
      newErrors.roleCategory = "Please select a role";
    }

    // Only validate experience category if role is Recruiter
    if (form.roleCategory === "Recruiter" && !form.experienceCategory) {
      newErrors.experienceCategory = "Please select an experience category";
    }

    // Validate specialization for all roles
    if (form.roleCategory && !form.specialization.length) {
      newErrors.specialization = "Please select at least one specialization";
    }

    // Resume is mandatory for all roles
    if (form.roleCategory && !resumeFile) {
      newErrors.resume = "Please upload your resume / CV (PDF)";
    }

    // Terms & Conditions acceptance is mandatory
    if (!agreeTerms) {
      newErrors.agreeTerms = "Please accept the Terms & Conditions to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Eligibility gate. A Coach, Expert or Recruiter has to clear the check
  // before they can register — the server enforces it, and this tells them
  // before they fill the whole form in.
  const [eligibility, setEligibility] = useState(null);   // null | {required, passed}
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    const role = form.roleCategory;
    const email = form.email.trim().toLowerCase();
    if (!['Recruiter', 'Coach', 'Expert'].includes(role)) { setEligibility(null); return; }

    // Nothing to look up until there is a full address to look up.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setEligibility(null); return; }

    let live = true;
    setCheckingEligibility(true);
    const t = setTimeout(() => {
      axios.get('/api/eligibility/public/status', { params: { role, email } })
        .then(r => { if (live) setEligibility(r.data); })
        .catch(() => { if (live) setEligibility(null); })
        .finally(() => { if (live) setCheckingEligibility(false); });
    }, 500);   // debounce while the email is being typed
    return () => { live = false; clearTimeout(t); };
  }, [form.roleCategory, form.email]);

  // Arriving from the eligibility check: carry the email and role across so the
  // pass matches the address being registered.
  const [passInfo, setPassInfo] = useState(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const remembered = readEligibilityPass();
    const email = p.get('email') || remembered?.email || '';
    const role = p.get('role') || remembered?.role || '';
    if (!email && !role) return;

    setForm(f => ({
      ...f,
      email: email || f.email,
      roleCategory: ['Recruiter', 'Coach', 'Expert'].includes(role) ? role : f.roleCategory,
    }));

    // Fill in what they already told us when they sat the check, so someone
    // coming back days later does not retype it.
    if (!email) return;
    axios.get('/api/eligibility/public/my-pass', { params: { email } })
      .then(r => {
        if (!r.data?.passed) return;
        setPassInfo(r.data);
        setForm(f => ({
          ...f,
          name: f.name || r.data.name || '',
          roleCategory: f.roleCategory || r.data.role || '',
          specialization: f.specialization.length
            ? f.specialization
            : (r.data.skillCategory ? [r.data.skillCategory] : []),
        }));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    // Upload resume if selected
    let resumeUrl = "";
    if (resumeFile) {
      setResumeUploading(true);
      try {
        const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(resumeFile);
        });
        const uploadRes = await axios.post("/auth/upload-resume", {
          fileBase64,
          filename: resumeFile.name,
        });
        resumeUrl = uploadRes.data.resumeUrl || "";
      } catch (uploadErr) {
        setMessage("Failed to upload resume. Please try again.");
        setLoading(false);
        setResumeUploading(false);
        return;
      }
      setResumeUploading(false);
    }

    const dataToSend = {
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),  // Normalize email to lowercase
      mobile: form.mobile,
      password: form.password,
      confirmPassword: form.confirmPassword,
      roleCategory: form.roleCategory,
      experienceCategory: form.experienceCategory || "N/A",
      planType: form.roleCategory === "Recruiter" ? parseInt(form.planType) : 1,
      skillCategory: form.specialization,   // array of up to 3
      agreementAccepted: true,   // ticked the mandatory Terms & Conditions checkbox
      // The one position they picked; assigned to them on account creation.
      selectedPosition: selectedPosition ? {
        pos_id: selectedPosition.pos_id,
        position: selectedPosition.position,
        closed: selectedClosed,
      } : null,
      availability,
      ...(resumeUrl ? { resumeUrl } : {}),
    };

    // Add Coach/Expert specific fields
    if (form.roleCategory === "Coach" || form.roleCategory === "Expert") {
      dataToSend.userType = form.userType;
    }

    console.log("Data being sent to backend:", dataToSend);

    try {
      const res = await axios.post("/auth/register", dataToSend, {
        withCredentials: true
      });

      console.log("Response from backend:", res.data);

      // Email the agreement acceptance record (PDF) for the user's role.
      // agreementSigned is already set by /auth/register, so this is best-effort:
      // a failure here must not block the user from reaching OTP verification.
      try {
        const terms = getRoleTerms(form.roleCategory);
        if (terms) {
          const acceptedUser = { name: form.name.trim(), email: form.email.toLowerCase().trim() };
          const timestamp = new Date().toISOString();
          let userIP = "";
          try {
            const ipRes = await axios.get("https://api.ipify.org?format=json");
            userIP = ipRes.data?.ip || "";
          } catch (_) { /* IP is optional */ }

          const doc = buildRegistrationAgreementPDF({ role: form.roleCategory, user: acceptedUser, timestamp, userIP });
          const b64 = doc.output("datauristring").split("base64,")[1];
          await axios.post("/api/agreement/submit", {
            role: terms.key,
            user: acceptedUser,
            meta: { timestamp, ip: userIP, version: "v1.0" },
            pdfBase64: b64,
            fileName: `${terms.label.replace(/[^A-Za-z]/g, "")}_Agreement_${acceptedUser.name.replace(/\s+/g, "_")}.pdf`,
          });
        }
      } catch (agrErr) {
        console.warn("Agreement record email failed (registration unaffected):", agrErr.message);
      }

      setMessage(res.data.message || res.data.error || "OTP Sent Successfully!");
      localStorage.setItem("pendingEmail", form.email);
      localStorage.setItem("experienceCategory", form.experienceCategory);
      localStorage.setItem("planType", form.planType);
      // Store role and userType for redirect logic
      localStorage.setItem("roleCategory", form.roleCategory);
      // Picked a position during sign-up: land them on it at first login.
      if (selectedPosition?.pos_id) {
        try { localStorage.setItem('rv_first_position', '1'); } catch { /* private mode */ }
      }
      localStorage.setItem("skillCategory", form.specialization.join(", "));
      if (form.roleCategory === "Coach" || form.roleCategory === "Expert") {
        localStorage.setItem("userType", form.userType);
      }
      setTimeout(() => navigate("/otp"), 1000);
    } catch (err) {
      console.error("Error details:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Full error:", err);

      if (err.response?.data?.errorCode === 'ELIGIBILITY_REQUIRED') {
        setEligibility({ required: true, passed: false });
      }
      setMessage(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong. Please check console for details."
      );
    }

    setLoading(false);
  };

  const roleOptions = [
    // { value: "RTS", icon: Shield, color: "from-purple-500 to-purple-600" },
    { value: "Recruiter", icon: UserCheck, color: "from-green-500 to-green-600" },
    { value: "Coach", icon: BookOpen, color: "from-orange-500 to-orange-600" },
    { value: "Expert", icon: Award, color: "from-red-500 to-red-600" }
  ];

  // Role display name mapping
  const roleDisplayLabelMap = {
    "Hiring Guru": "Coach",
    "Industry Expert": "Expert"
  };

  const isRoleSelected = (currentRole, optionValue) => {
    return (
      currentRole === optionValue ||
      roleDisplayLabelMap[currentRole] === optionValue
    );
  };
  const experienceOptions = [
    { value: "Part time freelancer", icon: "🚀" },
    { value: "Full-Time Freelancing", icon: "💻" },
    // { value: "Elite Partner Program", icon: "⭐" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Join RecruiterV
          </h2>
          <p className="text-blue-50 text-sm">Create your account and start your journey</p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div className={`text-center text-sm mb-6 p-3 rounded-lg font-medium ${
              isSuccessMessage(message)
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={`w-full border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email and Mobile - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email */}
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full border-2 ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Mobile */}
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" />
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={form.mobile}
                    onChange={handleChange}
                    className={`w-full border-2 ${errors.mobile ? 'border-red-300' : 'border-gray-200'} rounded-xl pl-14 pr-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                    placeholder="9876543210"
                    maxLength="10"
                  />
                </div>
                {errors.mobile && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
              </div>
            </div>

            {/* Password Fields - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Password */}
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Lock size={16} className="text-blue-600" />
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full border-2 ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
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
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Lock size={16} className="text-orange-500" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`w-full border-2 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Role Category */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" />
                Select Your Role
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  const selected = isRoleSelected(form.roleCategory, option.value);

                  return (
                    <label
                      key={option.value}
                      className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all group ${
                        selected
                          ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:scale-102"
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleCategory"
                        value={option.value}
                        checked={selected}
                        onChange={handleChange}
                        required
                        className="sr-only"
                      />

                      <div
                        className={`p-3 rounded-full bg-gradient-to-br ${option.color} transition-transform group-hover:scale-110`}
                      >
                        <IconComponent size={24} className="text-white" />
                      </div>

                      <span
                        className={`text-sm font-medium text-center ${
                          selected ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {roleDisplayLabelMap[option.value] || option.value}
                      </span>

                      {selected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
              {errors.roleCategory && (
                <p className="text-red-500 text-xs mt-2">{errors.roleCategory}</p>
              )}
            </div>

            {/* Experience Category - Only shown when Recruiter is selected */}
            {form.roleCategory === "Recruiter" && (
              <div className="relative animate-fadeIn">
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-green-600" />
                  Select your availability
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {experienceOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        form.experienceCategory === option.value
                          ? "border-green-500 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="experienceCategory"
                        value={option.value}
                        checked={form.experienceCategory === option.value}
                        onChange={handleChange}
                        required
                        className="sr-only"
                      />
                      <span className="text-2xl">{option.icon}</span>
                      <span className={`text-sm font-medium flex-1 ${
                        form.experienceCategory === option.value
                          ? "text-green-700"
                          : "text-gray-700"
                      }`}>
                        {option.value}
                      </span>
                      {form.experienceCategory === option.value && (
                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {errors.experienceCategory && (
                  <p className="text-red-500 text-xs mt-2">{errors.experienceCategory}</p>
                )}
              </div>
            )}

            {/* Specialization Field - shown for ALL roles once role is selected */}
            {form.roleCategory && (
              <div className="relative animate-fadeIn">
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-blue-600" />
                  Select Your Specialization
                  <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-400">(up to {MAX_SPECIALIZATIONS})</span>
                </label>
                <div className={`rounded-xl border-2 p-3 ${
                  errors.specialization ? 'border-red-300' : 'border-gray-200'}`}>
                  <div className="flex flex-wrap gap-2">
                    {skillCategories.map(cat => {
                      const on = form.specialization.includes(cat);
                      const full = form.specialization.length >= MAX_SPECIALIZATIONS;
                      return (
                        <button type="button" key={cat}
                          disabled={!on && full}
                          onClick={() => setForm(f => ({
                            ...f,
                            specialization: on
                              ? f.specialization.filter(c => c !== cat)
                              : (f.specialization.length >= MAX_SPECIALIZATIONS
                                  ? f.specialization
                                  : [...f.specialization, cat]),
                          }))}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                            on ? 'border-blue-500 bg-blue-50 text-blue-700'
                               : full ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                      : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'}`}>
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {form.specialization.length}/{MAX_SPECIALIZATIONS} selected
                    {form.specialization.length >= MAX_SPECIALIZATIONS && ' — deselect one to change'}
                  </p>
                </div>
                {errors.specialization && (
                  <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>
                )}
              </div>
            )}

            {/* Track record + availability. Both depend on the chosen
                specialization, so they sit directly after it. */}
            {form.specialization.length > 0 && (
              <div className="relative animate-fadeIn space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    Pick a position to start on
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Live openings in {form.specialization.join(', ')}. Choose one — it is
                    assigned to you as soon as your account is created, and waiting on your
                    Assigned Positions page. Where the client has recorded a briefing you can
                    hear it before you decide.
                  </p>

                  {loadingRoles ? (
                    <div className="text-sm text-gray-400 py-4">Loading open positions…</div>
                  ) : posGroups.every(g => !g.positions.length) ? (
                    <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      No live openings in {form.specialization.join(', ')} right now — you can skip this
                      and pick a position once you are in.
                    </div>
                  ) : (
                    <PositionPicker
                      groups={posGroups}
                      selected={selectedPosition}
                      onSelect={p => { setSelectedPosition(p); setSelectedClosed(''); }}
                      closed={selectedClosed}
                      onClosedChange={setSelectedClosed}
                      bands={CLOSED_BANDS}
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    Your available hours
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Which two-hour windows can you usually be reached in? Choose as many as apply.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const on = availability.includes(slot);
                      return (
                        <button type="button" key={slot}
                          onClick={() => setAvailability(a =>
                            on ? a.filter(x => x !== slot)
                               : (a.length >= MAX_AVAILABILITY_SLOTS ? a : [...a, slot]))}
                          disabled={!on && availability.length >= MAX_AVAILABILITY_SLOTS}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                            on ? 'border-orange-500 bg-orange-50 text-orange-700'
                               : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-gray-50'}`}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Resume Upload - mandatory for all roles */}
            {form.roleCategory && (
              <div className="relative animate-fadeIn">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Resume / CV
                  <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs font-normal">(PDF only · max 5 MB)</span>
                </label>
                {resumeFile ? (
                  <div className="flex items-center gap-3 border-2 border-green-400 bg-green-50 rounded-xl px-4 py-3">
                    <FileText size={20} className="text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-700 flex-1 truncate">{resumeFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="resume-upload"
                    className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${
                      errors.resume
                        ? 'border-red-400 bg-red-50 hover:border-red-500'
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <Upload size={24} className={errors.resume ? 'text-red-400' : 'text-gray-400'} />
                    <span className={`text-sm ${errors.resume ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      Click to upload your resume (PDF only)
                    </span>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.type === "application/pdf") {
                          setResumeFile(file);
                          setErrors(prev => ({ ...prev, resume: "" }));
                        } else if (file) {
                          alert("Only PDF files are allowed.");
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                )}
                {errors.resume && (
                  <p className="text-red-500 text-xs mt-1">{errors.resume}</p>
                )}
              </div>
            )}

            {/* Terms & Conditions — mandatory */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: "" });
                  }}
                  className="w-5 h-5 mt-0.5 accent-blue-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                    className="text-blue-600 font-semibold underline hover:text-blue-700"
                  >
                    Terms &amp; Conditions
                  </button>
                  <span className="text-red-500"> *</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {form.roleCategory
                      ? "Click to see what you earn as a " + form.roleCategory + " and to view the full agreement."
                      : "Select your role above to see the terms that apply to you."}
                  </span>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            {/* No "you must pass first" warning here: EligibilityGate only lets
                someone reach this page once the server has confirmed their pass,
                so the warning could only ever fire on a false negative — which it
                did, before an email had even been typed. */}
            {(passInfo?.passed || (eligibility?.required && eligibility?.passed)) && (
              <p className="rounded-xl border border-green-200 bg-green-50 text-green-800 text-[13px] font-semibold px-4 py-3 mb-4">
                ✓ You have passed the eligibility check
                {passInfo?.tierLabel ? ` — ${passInfo.tierLabel}` : ''}. Complete your registration below.
              </p>
            )}
            {checkingEligibility && (
              <p className="text-[12px] text-gray-500 mb-3">Checking your eligibility…</p>
            )}
            <button
              type="submit"
              disabled={loading || resumeUploading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {resumeUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Resume...
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Create Account & Send OTP"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-xs text-gray-500">
              By registering, you agree to our{" "}
              <Link
                to="/reg/con"
                className="text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Terms & Conditions
              </Link>
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-600">Already have an account?</span>
              <Link
                to="/log_rec"
                className="text-blue-600 hover:text-orange-500 font-semibold hover:underline transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {showTerms && (
        <TermsModal role={form.roleCategory} onClose={() => setShowTerms(false)} />
      )}
    </div>
  );
}

