import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import { FileText, Upload, X, Download, Trash2, CheckCircle, Search, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarContext as SCtx } from '../context/Sidebarcontext';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase, BarChart2, Gift } from 'lucide-react';
import { useNavigate as useNav } from 'react-router-dom';

// Predefined specializations
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

const Profile = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useContext(UserStateContext);
  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        
        {/* ========== SIDEBAR - DESKTOP ========== */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          {<Sidebar />}
        </aside>

        {/* ========== SIDEBAR - MOBILE OVERLAY ========== */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              {<Sidebar />}
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA ========== */}
        <ProfileContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* ========== ANIMATIONS ========== */}
        <style>{`
          @keyframes slide-in {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
          }

          /* Smooth transition for all content */
          * {
            transition-property: margin, padding, width;
            transition-duration: 300ms;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

// Helper component to handle dynamic padding based on sidebar state
const ProfileContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  
  // Skills dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [specSearch, setSpecSearch] = useState('');
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const specDropdownRef = useRef(null);

  // Skill category state — 3-level hierarchy: [{parent, children: [{name, subChildren[]}]}]
  const [skillCategoryHierarchy, setSkillCategoryHierarchy] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentTitle: '',
    location: '',
    country: '',
    bio: '',
    linkedin: '',
    twitter: '',
    website: '',
    yearsOfExperience: '',
    skillCategory: [],
    skills: [],
    specializedAt: [],
    workExperience: [],
    availableToCreateTeam: true,
    // Payment / bank details (shown in the agreement PDF)
    accountHolderName: '',
    bankName: '',
    branchName: '',
    ifsc: '',
    accountNumber: '',
    accountType: '',
    upiId: '',
    pan: '',
  });

  const [newWorkExp, setNewWorkExp] = useState({
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  // skillCategory is now an array; normalise whatever comes from DB
  const selectedCats = Array.isArray(formData.skillCategory)
    ? formData.skillCategory
    : formData.skillCategory ? [formData.skillCategory] : [];

  // Max skill categories: 1 for Expert, 3 for Coach/Recruiter
  const isExpertRole = (user?.roleCategory || '').toLowerCase() === 'expert';
  const maxCats = isExpertRole ? 1 : 3;
  const atCatLimit = selectedCats.length >= maxCats;

  // Map: sub-category name → parent skill category
  const specializationToCatMap = {};
  skillCategoryHierarchy.forEach(cat => {
    (cat.children || []).forEach(ch => { specializationToCatMap[ch.name] = cat.parent; });
  });

  // Count selected specializations per skill category (max 2 each)
  const selectedSpecPerCat = {};
  formData.skills.forEach(s => {
    const cat = specializationToCatMap[s];
    if (cat) selectedSpecPerCat[cat] = (selectedSpecPerCat[cat] || 0) + 1;
  });

  // Map: specialization name → its sub-children array
  const specSubChildrenMap = {};
  skillCategoryHierarchy.forEach(cat => {
    (cat.children || []).forEach(ch => {
      if (ch.subChildren && ch.subChildren.length > 0) specSubChildrenMap[ch.name] = ch.subChildren;
    });
  });

  // Count selected sub-children per specialization (max 2 each)
  const selectedSubChildPerSpec = {};
  formData.specializedAt.forEach(sc => {
    formData.skills.forEach(s => {
      if ((specSubChildrenMap[s] || []).includes(sc))
        selectedSubChildPerSpec[s] = (selectedSubChildPerSpec[s] || 0) + 1;
    });
  });

  // Sub-categories available to add: from selected skill categories, not yet selected, not at per-cat limit
  const activeSpecializations = skillCategoryHierarchy
    .filter(c => selectedCats.includes(c.parent))
    .flatMap(c => (c.children || [])
      .filter(ch => !formData.skills.includes(ch.name) && (selectedSpecPerCat[c.parent] || 0) < 2)
      .map(ch => ch.name)
    );

  // Filter by search query
  const filteredSpecializations = activeSpecializations.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sub-children available for "Specialized At": from selected specializations, not yet selected, not at per-spec limit
  const activeSpecializedAt = formData.skills
    .filter(s => (specSubChildrenMap[s] || []).length > 0)
    .flatMap(s => (specSubChildrenMap[s] || [])
      .filter(sc => !formData.specializedAt.includes(sc) && (selectedSubChildPerSpec[s] || 0) < 2)
    );

  const filteredSpecializedAt = activeSpecializedAt.filter(sc =>
    sc.toLowerCase().includes(specSearch.toLowerCase())
  );

  useEffect(() => {
    fetchProfile();
    axios.get('/candidate/skill-categories-hierarchical')
      .then(res => { if (res.data.success) setSkillCategoryHierarchy(res.data.categories); })
      .catch(() => {});

    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (specDropdownRef.current && !specDropdownRef.current.contains(event.target)) setShowSpecDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile', { withCredentials: true });
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          currentCompany: userData.currentCompany || '',
          currentTitle: userData.currentTitle || '',
          location: userData.location || '',
          country: userData.country || '',
          bio: userData.bio || '',
          linkedin: userData.linkedin || '',
          twitter: userData.twitter || '',
          website: userData.website || '',
          yearsOfExperience: userData.yearsOfExperience || '',
          skillCategory: Array.isArray(userData.skillCategory)
            ? userData.skillCategory
            : userData.skillCategory ? [userData.skillCategory] : [],
          skills: userData.skills || [],
          specializedAt: Array.isArray(userData.specializedAt) ? userData.specializedAt : [],
          workExperience: userData.workExperience || [],
          availableToCreateTeam: userData.availableToCreateTeam !== false,
          accountHolderName: userData.accountHolderName || '',
          bankName: userData.bankName || '',
          branchName: userData.branchName || '',
          ifsc: userData.ifsc || '',
          accountNumber: userData.accountNumber || '',
          accountType: userData.accountType || '',
          upiId: userData.upiId || '',
          pan: userData.pan || userData.panNumber || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedCats.length) {
      toast.error('Please select at least one Skill Category in the Skills tab.');
      setActiveTab(2);
      return;
    }
    if (!formData.skills.length) {
      toast.error('Please select at least one Specialization in the Skills tab.');
      setActiveTab(2);
      return;
    }
    const hasSpecializedAtOptions = formData.skills.some(s => (specSubChildrenMap[s] || []).length > 0);
    if (hasSpecializedAtOptions && !formData.specializedAt.length) {
      toast.error('Please select at least one Specialized At in the Skills tab.');
      setActiveTab(2);
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post('/api/profile', formData, { withCredentials: true });
      if (response.data.success) {
        toast.success('Profile saved successfully!');
        fetchProfile();
      } else {
        toast.error(response.data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (skill) => {
    if (!skill || formData.skills.includes(skill)) return;
    const cat = specializationToCatMap[skill];
    if (cat && (selectedSpecPerCat[cat] || 0) >= 2) return;
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const subChildren = specSubChildrenMap[skillToRemove] || [];
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
      specializedAt: prev.specializedAt.filter(sc => !subChildren.includes(sc)),
    }));
  };

  const handleAddSpecializedAt = (sc) => {
    if (!sc || formData.specializedAt.includes(sc)) return;
    const parentSpec = formData.skills.find(s => (specSubChildrenMap[s] || []).includes(sc));
    if (parentSpec && (selectedSubChildPerSpec[parentSpec] || 0) >= 2) return;
    setFormData((prev) => ({ ...prev, specializedAt: [...prev.specializedAt, sc] }));
    setSpecSearch('');
    setShowSpecDropdown(false);
  };

  const handleRemoveSpecializedAt = (sc) => {
    setFormData((prev) => ({ ...prev, specializedAt: prev.specializedAt.filter(x => x !== sc) }));
  };

  const handleAddWorkExperience = () => {
    if (newWorkExp.company && newWorkExp.title) {
      setFormData((prev) => ({
        ...prev,
        workExperience: [...prev.workExperience, { ...newWorkExp, id: Date.now() }],
      }));
      setNewWorkExp({ company: '', title: '', startDate: '', endDate: '', description: '' });
    }
  };

  const handleRemoveWorkExperience = (id) => {
    setFormData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((exp) => exp.id !== id),
    }));
  };

  // Resume upload handlers
  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate PDF format only
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed!');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB!');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          const response = await axios.post('/api/profile/resume', {
            resumeData: base64Data,
            fileName: file.name,
            contentType: file.type
          }, { withCredentials: true });

          if (response.data.success) {
            toast.success('Resume uploaded successfully!');
            fetchProfile();
          } else {
            toast.error(response.data.message || 'Failed to upload resume');
          }
        } catch (uploadError) {
          console.error('Error uploading resume:', uploadError);
          toast.error(uploadError.response?.data?.message || 'Failed to upload resume');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploading(false);
      };
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
      setUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) return;

    try {
      const response = await axios.delete('/api/profile/resume', { withCredentials: true });
      if (response.data.success) {
        toast.success('Resume deleted successfully!');
        fetchProfile();
      } else {
        toast.error(response.data.message || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  const handleDownloadResume = () => {
    if (user?.resume) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${user.resume}`;
      link.download = user.resumeFileName || 'resume.pdf';
      link.click();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Updated tabs - removed Education, added Resume
  const tabs = [
    { label: 'Basic Info', icon: '👤' },
    { label: 'Professional', icon: '💼' },
    { label: 'Skills', icon: '🛠️' },
    { label: 'Experience', icon: '📋' },
    { label: 'Resume', icon: '📄' },
    { label: 'Payment', icon: '💳' },
  ];

  if (loading) {
    return (
      <div 
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}
    >
      {/* ========== HEADER (STICKY) ========== */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full transition-all duration-300">
          <ToastContainer position="top-right" autoClose={3000} />
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your personal information and professional details</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Changes'
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 rounded-t-xl overflow-hidden">
              <nav className="flex overflow-x-auto">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === index
                        ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="text"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., 5+ years"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your country"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="availableToCreateTeam"
                      checked={formData.availableToCreateTeam}
                      onChange={e => setFormData(prev => ({ ...prev, availableToCreateTeam: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="availableToCreateTeam" className="cursor-pointer select-none">
                      <span className="block text-sm font-semibold text-gray-800">Available to create Team</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Check this if you are open to building and managing a recruiter team.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Company</label>
                      <input
                        type="text"
                        name="currentCompany"
                        value={formData.currentCompany}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter current company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Title</label>
                      <input
                        type="text"
                        name="currentTitle"
                        value={formData.currentTitle}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your job title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Twitter Profile</label>
                      <input
                        type="url"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Tab - WITH PREDEFINED SPECIALIZATIONS */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  {/* Skill Category — multi-select checkboxes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skill Category <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${atCatLimit ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {selectedCats.length}/{maxCats} selected
                      </span>
                    </div>
                    {atCatLimit && (
                      <p className="text-xs text-red-500 mb-2">
                        Maximum {maxCats} skill {maxCats > 1 ? 'categories' : 'category'} allowed for {user?.roleCategory || 'your role'}.
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-52 overflow-y-auto">
                      {skillCategoryHierarchy.map(c => {
                        const isChecked = selectedCats.includes(c.parent);
                        const isDisabled = !isChecked && atCatLimit;
                        return (
                          <label
                            key={c.parent}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm
                              ${isChecked ? 'bg-orange-100 text-orange-800 font-medium' : isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white text-gray-700'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => {
                                if (isDisabled) return;
                                if (isChecked) {
                                  const catChildNames = (skillCategoryHierarchy.find(cat => cat.parent === c.parent)?.children || []).map(ch => ch.name);
                                  const removedSkills = formData.skills.filter(s => catChildNames.includes(s));
                                  const scToRemove = removedSkills.flatMap(s => specSubChildrenMap[s] || []);
                                  setFormData(prev => ({
                                    ...prev,
                                    skillCategory: selectedCats.filter(x => x !== c.parent),
                                    skills: prev.skills.filter(s => !catChildNames.includes(s)),
                                    specializedAt: prev.specializedAt.filter(sc => !scToRemove.includes(sc)),
                                  }));
                                } else {
                                  setFormData(prev => ({ ...prev, skillCategory: [...selectedCats, c.parent] }));
                                }
                                setSearchQuery('');
                                setShowDropdown(false);
                              }}
                              className="accent-orange-500 flex-shrink-0"
                            />
                            <span className="truncate">{c.parent}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedCats.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing specializations for: {selectedCats.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Select Specializations */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Specializations
                        {selectedCats.length === 0 && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">(select a Skill Category first)</span>
                        )}
                      </label>
                      <span className="text-xs text-gray-400">max 2 per category</span>
                    </div>

                    {/* Per-category usage counters */}
                    {selectedCats.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCats.map(cat => (
                          <span key={cat} className={`text-xs px-2 py-0.5 rounded-full font-medium ${(selectedSpecPerCat[cat] || 0) >= 2 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {cat}: {selectedSpecPerCat[cat] || 0}/2
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Search specializations..."
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    {showDropdown && filteredSpecializations.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        {filteredSpecializations.slice(0, 50).map((s, i) => (
                          <button key={i} onClick={() => handleAddSkill(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm">
                            {s}
                          </button>
                        ))}
                        {filteredSpecializations.length > 50 && (
                          <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                            Showing 50 of {filteredSpecializations.length} results. Keep typing to refine...
                          </div>
                        )}
                      </div>
                    )}
                    {showDropdown && selectedCats.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                        Please select a Skill Category first
                      </div>
                    )}
                    {showDropdown && selectedCats.length > 0 && activeSpecializations.length === 0 && !searchQuery && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                        {selectedCats.every(cat => (selectedSpecPerCat[cat] || 0) >= 2)
                          ? 'Maximum 2 specializations reached for all selected categories'
                          : 'No specializations available for selected categories'}
                      </div>
                    )}
                    {showDropdown && selectedCats.length > 0 && activeSpecializations.length > 0 && searchQuery && filteredSpecializations.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                        No matching specializations found
                      </div>
                    )}
                  </div>

                  {/* Selected Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Selected Specializations ({formData.skills.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} className="hover:text-orange-900">✕</button>
                        </span>
                      ))}
                      {formData.skills.length === 0 && (
                        <p className="text-gray-500 text-sm">No specializations selected yet. Search and select from the list above.</p>
                      )}
                    </div>
                  </div>

                  {/* Specialized At — shown only when selected specializations have sub-children */}
                  {formData.skills.some(s => (specSubChildrenMap[s] || []).length > 0) && (
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                      <div className="relative" ref={specDropdownRef}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Specialized At
                            <span className="ml-2 text-xs text-gray-400 font-normal">(max 2 per specialization)</span>
                          </label>
                          <span className="text-xs text-gray-400">max 2 per specialization</span>
                        </div>

                        {/* Per-specialization usage counters */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.skills.filter(s => (specSubChildrenMap[s] || []).length > 0).map(s => (
                            <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${(selectedSubChildPerSpec[s] || 0) >= 2 ? 'bg-red-100 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                              {s}: {selectedSubChildPerSpec[s] || 0}/2
                            </span>
                          ))}
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={specSearch}
                            onChange={(e) => { setSpecSearch(e.target.value); setShowSpecDropdown(true); }}
                            onFocus={() => setShowSpecDropdown(true)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Search specialized at..."
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        {showSpecDropdown && filteredSpecializedAt.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {filteredSpecializedAt.slice(0, 50).map((sc, i) => (
                              <button key={i} onClick={() => handleAddSpecializedAt(sc)}
                                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 hover:text-purple-700 transition-colors text-sm">
                                {sc}
                              </button>
                            ))}
                          </div>
                        )}
                        {showSpecDropdown && activeSpecializedAt.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                            {formData.skills.filter(s => (specSubChildrenMap[s] || []).length > 0).every(s => (selectedSubChildPerSpec[s] || 0) >= 2)
                              ? 'Maximum 2 selections per specialization reached'
                              : 'No sub-categories available'}
                          </div>
                        )}
                        {showSpecDropdown && activeSpecializedAt.length > 0 && specSearch && filteredSpecializedAt.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                            No matching sub-categories found
                          </div>
                        )}
                      </div>

                      {/* Selected Specialized At tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Specialized At ({formData.specializedAt.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.specializedAt.map((sc, i) => (
                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              {sc}
                              <button onClick={() => handleRemoveSpecializedAt(sc)} className="hover:text-purple-900">✕</button>
                            </span>
                          ))}
                          {formData.specializedAt.length === 0 && (
                            <p className="text-gray-500 text-sm">No sub-categories selected yet. Search and select from the list above.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Experience Tab */}
              {activeTab === 3 && (
                <div className="space-y-6">
                  {/* Add New Work Experience */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">Add Work Experience</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={newWorkExp.company}
                        onChange={(e) => setNewWorkExp({ ...newWorkExp, company: e.target.value })}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Company Name"
                      />
                      <input
                        type="text"
                        value={newWorkExp.title}
                        onChange={(e) => setNewWorkExp({ ...newWorkExp, title: e.target.value })}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Job Title"
                      />
                      <input
                        type="text"
                        value={newWorkExp.startDate}
                        onChange={(e) => setNewWorkExp({ ...newWorkExp, startDate: e.target.value })}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Start Date (e.g., Jan 2020)"
                      />
                      <input
                        type="text"
                        value={newWorkExp.endDate}
                        onChange={(e) => setNewWorkExp({ ...newWorkExp, endDate: e.target.value })}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="End Date (e.g., Present)"
                      />
                    </div>
                    <textarea
                      value={newWorkExp.description}
                      onChange={(e) => setNewWorkExp({ ...newWorkExp, description: e.target.value })}
                      className="w-full mt-4 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Job Description"
                      rows={3}
                    />
                    <button
                      onClick={handleAddWorkExperience}
                      className="mt-4 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      Add Experience
                    </button>
                  </div>

                  {/* List of Work Experiences */}
                  <div className="space-y-4">
                    {formData.workExperience.map((exp) => (
                      <div key={exp.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate}</p>
                            {exp.description && <p className="mt-2 text-gray-700">{exp.description}</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveWorkExperience(exp.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.workExperience.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No work experience added yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Resume Tab - NEW */}
              {activeTab === 4 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">📄 Upload Your Resume</h3>
                    <p className="text-sm text-blue-700">
                      Upload your resume in PDF format (max 5MB). Your resume will be visible to potential employers.
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                    {user?.resume ? (
                      <div className="space-y-4">
                        {/* Uploaded Resume Display */}
                        <div className="flex items-center justify-center">
                          <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5 text-orange-500" />
                            {user.resumeFileName || 'Resume.pdf'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Resume uploaded successfully</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3 mt-4">
                          <button
                            onClick={handleDownloadResume}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={triggerFileInput}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Replace
                          </button>
                          <button
                            onClick={handleDeleteResume}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="bg-orange-100 p-4 rounded-full">
                            <Upload className="w-8 h-8 text-orange-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium">Drag and drop your PDF here</p>
                          <p className="text-sm text-gray-500 mt-1">or</p>
                        </div>
                        <button
                          onClick={triggerFileInput}
                          disabled={uploading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Browse Files
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500">Only PDF files (max 5MB) are allowed</p>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Payment Tab — bank details for commission payouts, shown in the agreement PDF */}
              {activeTab === 5 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-1">💳 Payment / Bank Details</h3>
                    <p className="text-sm text-blue-800/80">Where your commission payments are credited. These appear in your signed agreement PDF; any field left blank shows as “Not filled”.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                      <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="As per bank records" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <input type="text" name="bankName" value={formData.bankName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                      <input type="text" name="branchName" value={formData.branchName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                      <input type="text" name="ifsc" value={formData.ifsc} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                      <select name="accountType" value={formData.accountType} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option value="">Select</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <input type="text" name="upiId" value={formData.upiId} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="name@bank" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                      <input type="text" name="pan" value={formData.pan} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase" placeholder="ABCDE1234F" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

export default Profile;
