import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Phone, Mail, User, Lock, Briefcase, Shield, Users, UserCheck, BookOpen, Award } from "lucide-react";

const ClientSpocCompany=()=> {
  
  
  const [form, setForm] = useState({
    commisson:"",
    lower:"",
    name:"",
    overview:""
  });

  const [message, setMessage] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Add validateForm function
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = "Company name is required";
    }
    
    if (!form.lower.trim()) {
      newErrors.lower = "Lower case company name is required";
    } else if (!/^[a-z\s]+$/.test(form.lower)) {
      newErrors.lower = "Only lowercase letters and spaces allowed";
    }
    
    if (!form.commisson.trim()) {
      newErrors.commisson = "Commission is required";
    }
    
    if (!form.overview.trim()) {
      newErrors.overview = "Company overview is required";
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

    const dataToSend = {
          commisson:form.commisson.trim(),
          lower:form.lower.trim(),
          name:form.name.trim(),
          overview:form.overview.trim()
    };

    console.log("Data being sent to backend:", dataToSend);

    try {
      const res = await axios.post("/clientspoc/companyAdd", dataToSend, {
        withCredentials: true
      });
      
      setMessage("Company added successfully!");
      setForm({ commisson:"", lower:"", name:"", overview:"" });
      
    } catch (err) {
      console.error("Full error:", err);
      
      setMessage(
        err.response?.data?.message || "Something went wrong. Please check console for details."
      );
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Add New Company
          </h2>
        </div>

        <div className="p-6 sm:p-8">
            {message && (
              <div className={`mb-4 p-4 rounded-xl ${
                message.includes("successfully") 
                  ? "bg-green-50 text-green-700 border-2 border-green-200" 
                  : "bg-red-50 text-red-700 border-2 border-red-200"
                }`}>
                    {message}
              </div>
            )}


          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Company Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={`w-full border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter Company Name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Lower Name */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Company Name (*Only Alphabet Lower)
              </label>
              <input
                type="text"
                name="lower"
                required
                value={form.lower}
                onChange={handleChange}
                className={`w-full border-2 ${errors.lower ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter Lower Name (e.g. 'accuvate', 'know max')"
              />
              {errors.lower && (
                <p className="text-red-500 text-xs mt-1">{errors.lower}</p>
              )}
            </div>

            {/* Commission */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Commission
              </label>
              <input
                type="text"
                name="commisson"
                required
                value={form.commisson}
                onChange={handleChange}
                className={`w-full border-2 ${errors.commisson ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter Commission"
              />
              {errors.commisson && (
                <p className="text-red-500 text-xs mt-1">{errors.commisson}</p>
              )}
            </div>

            {/* OverView - Changed to textarea */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Company Overview
              </label>
              <textarea
                name="overview"
                required
                value={form.overview}
                onChange={handleChange}
                rows="4"
                className={`w-full border-2 ${errors.overview ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-vertical`}
                placeholder="Enter Company Overview"
              />
              {errors.overview && (
                <p className="text-red-500 text-xs mt-1">{errors.overview}</p>
              )}
            </div>
                          
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
                  Adding New Company...
                </span>
              ) : (
                "Add New Company"
              )}
            </button>
          </form>

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

export default ClientSpocCompany;