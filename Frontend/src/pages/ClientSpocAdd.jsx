import { useState } from "react";
import { isSuccessMessage } from '../utils/messageTone';
import axios from "axios";
import { Eye, EyeOff, Mail, User, Lock, ChevronDown, Hash } from "lucide-react";

const ClientSpocAdd = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    codPass: "",
    userType: "",
    recruiterQuantity: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (form.codPass.length < 6) newErrors.codPass = "Password must be at least 6 characters";
    if (!form.userType) newErrors.userType = "Please select a user type";
    if (form.userType === "Vendor") {
      const qty = parseInt(form.recruiterQuantity, 10);
      if (!qty || qty < 1) newErrors.recruiterQuantity = "Enter a valid recruiter quantity (minimum 1)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        codPass: form.codPass,
        userType: form.userType,
      };
      if (form.userType === "Vendor") {
        payload.recruiterQuantity = parseInt(form.recruiterQuantity, 10);
      }

      await axios.post("/clientspoc/add", payload, { withCredentials: true });

      setMessage(`${form.userType} added successfully!`);
      setForm({ name: "", email: "", codPass: "", userType: "", recruiterQuantity: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Add User</h2>
          <p className="text-blue-100 text-sm">Create an Admin, Client SPOC, or Vendor account</p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div className={`mb-4 p-4 rounded-xl ${
              isSuccessMessage(message)
                ? "bg-green-50 text-green-700 border-2 border-green-200"
                : "bg-red-50 text-red-700 border-2 border-red-200"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* User Type */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ChevronDown size={16} className="text-blue-600" />
                User Type *
              </label>
              <select
                name="userType"
                required
                value={form.userType}
                onChange={handleChange}
                className={`w-full border-2 ${errors.userType ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white`}
              >
                <option value="">Select user type...</option>
                <option value="Admin">Admin</option>
                <option value="ClientSPOC">ClientSPOC</option>
                <option value="Vendor">Vendor</option>
              </select>
              {errors.userType && <p className="text-red-500 text-xs mt-1">{errors.userType}</p>}
            </div>

            {/* Recruiter Quantity — only for Vendor */}
            {form.userType === "Vendor" && (
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Hash size={16} className="text-purple-600" />
                  Recruiter Quantity *
                </label>
                <input
                  type="number"
                  name="recruiterQuantity"
                  min="1"
                  required
                  value={form.recruiterQuantity}
                  onChange={handleChange}
                  className={`w-full border-2 ${errors.recruiterQuantity ? 'border-red-300' : 'border-purple-200'} rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all`}
                  placeholder="e.g. 10"
                />
                {errors.recruiterQuantity && <p className="text-red-500 text-xs mt-1">{errors.recruiterQuantity}</p>}
                <p className="text-xs text-gray-500 mt-1">Maximum number of paid recruiter accounts this vendor can create</p>
              </div>
            )}

            {/* Full Name */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={`w-full border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className={`w-full border-2 ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="user@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="codPass"
                  required
                  value={form.codPass}
                  onChange={handleChange}
                  className={`w-full border-2 ${errors.codPass ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
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
              {errors.codPass && <p className="text-red-500 text-xs mt-1">{errors.codPass}</p>}
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating {form.userType || 'User'}...
                </span>
              ) : (
                `Create ${form.userType || 'User'}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientSpocAdd;
