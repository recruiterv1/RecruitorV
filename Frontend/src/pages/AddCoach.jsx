import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, User, Mail, Phone, Award, CheckCircle, X, AlertCircle, Tag, X as XIcon, Lock } from 'lucide-react';
import { Autocomplete, Chip, TextField } from '@mui/material';

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

const AddCoach = ({ onCoachAdded }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    userType: 'free',
    password: ''
  });
  const [specializationTags, setSpecializationTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationChange = (event, newValue) => {
    // Allow custom input
    if (newValue && typeof newValue === 'string') {
      setSpecializationTags([newValue]);
      setForm(prev => ({ ...prev, specialization: newValue }));
    } else if (Array.isArray(newValue)) {
      setSpecializationTags(newValue);
      if (newValue.length > 0) {
        setForm(prev => ({ ...prev, specialization: newValue[newValue.length - 1] }));
      } else {
        setForm(prev => ({ ...prev, specialization: '' }));
      }
    }
  };

  const handleSpecializationInputChange = (event, value, reason) => {
    if (reason === 'input') {
      setForm(prev => ({ ...prev, specialization: value }));
    }
  };

  const handleDeleteSpecialization = (tagToDelete) => {
    setSpecializationTags(prev => prev.filter(tag => tag !== tagToDelete));
    setForm(prev => ({ ...prev, specialization: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Join all selected specialization tags with comma separator
    const finalSpecialization = specializationTags.length > 0 
      ? specializationTags.join(', ')
      : form.specialization;

    if (!form.name || !form.email || !finalSpecialization || !form.userType || !form.password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (form.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const res = await axios.post('/api/coach-expert/coach/add', {
        ...form,
        specialization: finalSpecialization
      });
      
      setShowSuccess(true);
      setMessage({ type: 'success', text: 'Coach added successfully!' });
      
      // Reset form
      setForm({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        userType: 'free',
        password: ''
      });
      setSpecializationTags([]);

      // Call callback if provided
      if (onCoachAdded) {
        onCoachAdded(res.data.data);
      }

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('Error adding coach:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to add coach. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                Add New Coach
              </h3>
              <p className="text-blue-100 text-sm">
                Add a new coach to the system
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3 animate-fadeIn">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Coach Added Successfully!</p>
              <p className="text-sm text-green-700">The coach has been added to the database.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {message?.type === 'error' && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-fadeIn">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{message.text}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Basic Information */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-600" />
              <h4 className="text-lg font-bold text-gray-900">Coach Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Name */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter coach name"
                    className="w-full h-11 border-2 border-gray-200 rounded-xl pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full h-11 border-2 border-gray-200 rounded-xl pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full h-11 border-2 border-gray-200 rounded-xl pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password (min 6 characters)"
                    className="w-full h-11 border-2 border-gray-200 rounded-xl pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              {/* Specialization - Tag Input with Suggestions */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag size={18} className="absolute left-3 top-3 z-10 text-gray-400" />
                  <Autocomplete
                    freeSolo
                    multiple
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
                            borderColor: '#3b82f6',
                            color: '#1d4ed8',
                            '& .MuiChip-label': { color: '#1d4ed8' },
                            '& .MuiChip-deleteIcon': { color: '#3b82f6', '&:hover': { color: '#1d4ed8' } }
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#e5e7eb' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                            paddingLeft: '40px'
                          }
                        }}
                      />
                    )}
                    filterOptions={(options, params) => {
                      const filtered = options.filter(option =>
                        option.toLowerCase().includes(params.inputValue.toLowerCase())
                      );
                      // Add custom option at the end
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

              {/* User Type */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  User Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="userType"
                      value="free"
                      checked={form.userType === 'free'}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Free</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="userType"
                      value="paid"
                      checked={form.userType === 'paid'}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Paid</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t-2 border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle size={20} />
                  Add Coach
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      <style>{`
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
};

export default AddCoach;

