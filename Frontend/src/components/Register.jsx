import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Phone, Mail, User, Lock, Briefcase, Shield, Users, UserCheck, BookOpen, Award, TrendingUp, Tag } from "lucide-react";
import { Autocomplete, Chip, TextField } from "@mui/material";

// Specialization options for Coach and Expert
const specializations = [
  // 1. Technology & Digital - Backend Engineering Languages
  'Node.js (Backend)',
  'Python (Backend)',
  'Java (Backend)',
  'C# (Backend)',
  'C++ (Backend)',
  'Go (Backend)',
  'Ruby (Backend)',
  'PHP (Backend)',
  'Kotlin (Backend)',
  'Scala (Backend)',
  'Rust (Backend)',
  // 1. Technology & Digital - Frontend Engineering Languages
  'React.js (Frontend)',
  'Angular (Frontend)',
  'Vue.js (Frontend)',
  'JavaScript (Frontend)',
  'TypeScript (Frontend)',
  'HTML/CSS (Frontend)',
  // 1. Technology & Digital - Full Stack Engineering
  'Full Stack Engineering',
  // 1. Technology & Digital - Mobile Engineering
  'Mobile Engineering (Android)',
  'Mobile Engineering (iOS)',
  'Mobile Engineering (Flutter)',
  'Mobile Engineering (React Native)',
  // 1. Technology & Digital - Platform & Infrastructure
  'DevOps / SRE',
  'Cloud Engineering (AWS)',
  'Cloud Engineering (Azure)',
  'Cloud Engineering (GCP)',
  'Platform Engineering',
  'Networking & Systems',
  // 1. Technology & Digital - Data & Intelligence
  'Data Engineering',
  'Data Science',
  'Machine Learning / AI',
  'Analytics & BI',
  // 1. Technology & Digital - Quality & Security
  'QA / Test Engineering (Manual)',
  'QA / Test Engineering (Automation)',
  'Performance Testing',
  'Cyber Security',
  'Application Security / GRC',
  // 2. Product, Design & Agile - Product Management
  'Product Managers (B2B)',
  'Product Managers (B2C)',
  'Product Managers (Platform)',
  'Technical Product Managers',
  'Growth Product',
  // 2. Product, Design & Agile - Design & Experience
  'UX / UI Design',
  'Product Design',
  'Interaction Design',
  'Design Research',
  // 2. Product, Design & Agile - Agile & Delivery
  'Scrum Masters',
  'Agile Coaches',
  'Delivery / Program Managers',
  // 3. Sales, Growth & Customer Roles - Revenue Generation
  'B2B Sales',
  'Enterprise Sales',
  'Inside Sales',
  'Channel / Partner Sales',
  // 3. Sales, Growth & Customer Roles - Pre & Post Sales
  'Presales / Solutions Consulting',
  'Customer Success',
  'Account Management',
  'Key Account Management',
  // 3. Sales, Growth & Customer Roles - Marketing & Growth
  'Digital Marketing',
  'Performance Marketing',
  'Brand & Content Marketing',
  'Growth & Lifecycle Marketing',
  // 4. BFSI & Financial Services - Banking Operations
  'Retail Banking Operations',
  'Corporate Banking Operations',
  'Trade Finance',
  'Branch Operations',
  // 4. BFSI & Financial Services - Risk, Compliance & Control
  'Credit Risk',
  'Market Risk',
  'Operational Risk',
  'Compliance / AML / KYC',
  // 4. BFSI & Financial Services - Finance & Accounting
  'Financial Planning & Analysis (FP&A)',
  'Accounting & Reporting',
  'Treasury',
  'Audit & Controls',
  // 5. HR, Talent & People Functions - Talent & Hiring
  'Recruitment / Talent Acquisition',
  'Campus Hiring',
  'Employer Branding',
  // 5. HR, Talent & People Functions - HR Operations
  'HR Operations',
  'Payroll & Compliance',
  'HR Shared Services',
  // 5. HR, Talent & People Functions - People Development
  'Learning & Development',
  'Performance Management',
  'OD / Culture',
  // 6. Operations, Supply Chain & Manufacturing - Manufacturing & Plant Roles
  'Production',
  'Maintenance',
  'Quality Control',
  'Industrial Engineering',
  // 6. Operations, Supply Chain & Manufacturing - Supply Chain
  'Procurement',
  'Logistics',
  'Warehouse Management',
  'Demand Planning',
  // 6. Operations, Supply Chain & Manufacturing - Operations Excellence
  'Lean / Six Sigma',
  'Process Excellence',
  'Business Operations',
  // 7. Media, Content & Creative - Content Creation
  'Journalism',
  'Editorial',
  'Script Writing',
  'Copywriting',
  // 7. Media, Content & Creative - Creative & Production
  'Video Production',
  'Film & TV Production',
  'Animation / VFX',
  // 7. Media, Content & Creative - Digital Media
  'Social Media',
  'Influencer Marketing',
  'Content Strategy',
  // 8. Leadership & Strategic Roles (Cross-Industry)
  'CXO Roles (CEO)',
  'CXO Roles (CTO)',
  'CXO Roles (CFO)',
  'CXO Roles (CHRO)',
  'Business Heads',
  'Practice Heads',
  'Transformation Leaders',
  'Strategy & Consulting',
  // 9. Support & Corporate Functions - Corporate Support
  'Legal & Compliance',
  'Admin & Facilities',
  'Corporate Communications',
  // 9. Support & Corporate Functions - IT & Internal Systems
  'IT Support',
  'ERP / SAP',
  'Internal Tools',
  // 10. Early Career & Volume Hiring
  'Freshers / Graduate Roles',
  'Sales Executives',
  'Operations Executives',
  'Support Staff',
  'Other'
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
    specialization: "", // For Coach/Expert
    userType: "free" // For Coach/Expert (paid/free)
  });

  const [specializationTags, setSpecializationTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

    // Handle role change - reset experience category if not Recruiter
    if (name === "roleCategory") {
      setForm({
        ...form,
        [name]: value,
        experienceCategory: value === "Recruiter" ? "" : "N/A",
        planType: value === "Recruiter" ? form.planType : "1",
        specialization: value === "Recruiter" ? "" : form.specialization,
        userType: value === "Recruiter" ? "free" : form.userType
      });
      // Reset specialization tags when role changes
      setSpecializationTags([]);
    } else {
      setForm({ ...form, [name]: value });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle specialization autocomplete change
  const handleSpecializationChange = (event, newValue) => {
    if (newValue && typeof newValue === "string") {
      setSpecializationTags([newValue]);
      setForm(prev => ({ ...prev, specialization: newValue }));
    } else if (Array.isArray(newValue)) {
      setSpecializationTags(newValue);
      if (newValue.length > 0) {
        setForm(prev => ({ ...prev, specialization: newValue[newValue.length - 1] }));
      } else {
        setForm(prev => ({ ...prev, specialization: "" }));
      }
    }
  };

  // Handle specialization input change
  const handleSpecializationInputChange = (event, value, reason) => {
    if (reason === 'input') {
      setForm(prev => ({ ...prev, specialization: value }));
    }
  };

  // Delete specialization tag
  const handleDeleteSpecialization = (tagToDelete) => {
    setSpecializationTags(prev => prev.filter(tag => tag !== tagToDelete));
    setForm(prev => ({ ...prev, specialization: "" }));
  };

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

    // Validate specialization for Coach/Expert
    if ((form.roleCategory === "Coach" || form.roleCategory === "Expert") && !form.specialization) {
      newErrors.specialization = "Please select or type a specialization";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    // Join all specialization tags with comma separator
    const finalSpecialization = specializationTags.length > 0
      ? specializationTags.join(", ")
      : form.specialization;

    const dataToSend = {
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),  // Normalize email to lowercase
      mobile: form.mobile,
      password: form.password,
      confirmPassword: form.confirmPassword,
      roleCategory: form.roleCategory,
      experienceCategory: form.experienceCategory || "N/A",
      planType: form.roleCategory === "Recruiter" ? parseInt(form.planType) : 1
    };

    // Add Coach/Expert specific fields
    if (form.roleCategory === "Coach" || form.roleCategory === "Expert") {
      dataToSend.specialization = finalSpecialization;
      dataToSend.userType = form.userType; // 'paid' or 'free'
    }

    console.log("Data being sent to backend:", dataToSend);

    try {
      const res = await axios.post("/auth/register", dataToSend, {
        withCredentials: true
      });

      console.log("Response from backend:", res.data);

      setMessage(res.data.message || res.data.error || "OTP Sent Successfully!");
      localStorage.setItem("pendingEmail", form.email);
      localStorage.setItem("experienceCategory", form.experienceCategory);
      localStorage.setItem("planType", form.planType);
      // Store role and userType for redirect logic
      localStorage.setItem("roleCategory", form.roleCategory);
      if (form.roleCategory === "Coach" || form.roleCategory === "Expert") {
        localStorage.setItem("userType", form.userType);
        localStorage.setItem("specialization", finalSpecialization);
      }
      setTimeout(() => navigate("/otp"), 1000);
    } catch (err) {
      console.error("Error details:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Full error:", err);

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
    { value: "Freshers & College Pass-outs", icon: "🎓" },
    { value: "Career Switchers", icon: "🔄" },
    { value: "Corporate Recruiters", icon: "💼" },
    { value: "Career Restart", icon: "🚀" },
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
              message.includes("Success") || message.includes("OTP Sent")
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
                  Select Your Experience Category
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

            {/* Plan Type Selection - Only shown when Recruiter is selected */}
            {form.roleCategory === "Recruiter" && (
              <div className="relative animate-fadeIn">
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Choose Your Plan
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Free Plan */}
                  <label
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      form.planType === "0"
                        ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="planType"
                      value="0"
                      checked={form.planType === "0"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-bold ${
                          form.planType === "0" ? "text-blue-700" : "text-gray-800"
                        }`}>
                          Free Plan
                        </h3>
                      </div>
                      {form.planType === "0" && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Perfect for trying out the platform</p>
                    </div>
                  </label>

                  {/* Paid Plan */}
                  <label
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      form.planType === "1"
                        ? "border-orange-500 bg-orange-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="planType"
                      value="1"
                      checked={form.planType === "1"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-bold ${
                            form.planType === "1" ? "text-orange-700" : "text-gray-800"
                          }`}>
                            Paid Plan
                          </h3>
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                            POPULAR
                          </span>
                        </div>
                      </div>
                      {form.planType === "1" && (
                        <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Best for professional recruiters</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Specialization Field - Only shown when Coach or Expert is selected */}
            {(form.roleCategory === "Coach" || form.roleCategory === "Expert") && (
              <div className="relative animate-fadeIn">
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-blue-600" />
                  Select Your Specialization
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Autocomplete
                    freeSolo
                    options={specializations}
                    value={specializationTags}
                    onChange={handleSpecializationChange}
                    inputValue={form.specialization}
                    onInputChange={handleSpecializationInputChange}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                          onDelete={() => handleDeleteSpecialization(option)}
                          key={option}
                          sx={{
                            borderColor: form.roleCategory === "Coach" ? '#f97316' : '#ef4444',
                            color: form.roleCategory === "Coach" ? '#ea580c' : '#dc2626',
                            '& .MuiChip-label': { color: form.roleCategory === "Coach" ? '#ea580c' : '#dc2626' },
                            '& .MuiChip-deleteIcon': {
                              color: form.roleCategory === "Coach" ? '#f97316' : '#ef4444',
                              '&:hover': { color: form.roleCategory === "Coach" ? '#ea580c' : '#dc2626' }
                            }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select or type specialization"
                        variant="outlined"
                        size="small"
                        error={!!errors.specialization}
                        helperText={errors.specialization}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: errors.specialization ? '#fca5a5' : '#e5e7eb' },
                            '&:hover fieldset': { borderColor: form.roleCategory === "Coach" ? '#f97316' : '#ef4444' },
                            '&.Mui-focused fieldset': { borderColor: form.roleCategory === "Coach" ? '#f97316' : '#ef4444' }
                          }
                        }}
                      />
                    )}
                    filterOptions={(options, params) => {
                      const filtered = options.filter(option =>
                        option.toLowerCase().includes(params.inputValue.toLowerCase())
                      );
                      if (params.inputValue && !filtered.includes(params.inputValue)) {
                        filtered.push(`Add "${params.inputValue}"`);
                      }
                      return filtered;
                    }}
                    getOptionLabel={(option) => option}
                    isOptionEqualToValue={(option, value) => option === value}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select from options or type your own specialization
                </p>
              </div>
            )}

            {/* User Type (Paid/Free) - Only shown when Coach or Expert is selected */}
            {(form.roleCategory === "Coach" || form.roleCategory === "Expert") && (
              <div className="relative animate-fadeIn">
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Choose Your Plan
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Free Plan */}
                  <label
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      form.userType === "free"
                        ? form.roleCategory === "Coach"
                          ? "border-orange-500 bg-orange-50 shadow-lg"
                          : "border-red-500 bg-red-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value="free"
                      checked={form.userType === "free"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-bold ${
                          form.userType === "free"
                            ? form.roleCategory === "Coach" ? "text-orange-700" : "text-red-700"
                            : "text-gray-800"
                        }`}>
                          Free Plan
                        </h3>
                      </div>
                      {form.userType === "free" && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          form.roleCategory === "Coach" ? "bg-orange-600" : "bg-red-600"
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Basic access to the platform</p>
                    </div>
                  </label>

                  {/* Paid Plan */}
                  <label
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      form.userType === "paid"
                        ? form.roleCategory === "Coach"
                          ? "border-orange-500 bg-orange-50 shadow-lg"
                          : "border-red-500 bg-red-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value="paid"
                      checked={form.userType === "paid"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-bold ${
                            form.userType === "paid"
                              ? form.roleCategory === "Coach" ? "text-orange-700" : "text-red-700"
                              : "text-gray-800"
                          }`}>
                            Paid Plan
                          </h3>
                          <span className={`px-2 py-1 text-white text-xs font-bold rounded ${
                            form.roleCategory === "Coach" ? "bg-orange-500" : "bg-red-500"
                          }`}>
                            POPULAR
                          </span>
                        </div>
                      </div>
                      {form.userType === "paid" && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          form.roleCategory === "Coach" ? "bg-orange-600" : "bg-red-600"
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Full access to all features</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
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
    </div>
  );
}

