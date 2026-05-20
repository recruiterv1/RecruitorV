import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import axios from 'axios';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowLeft,
  Edit,
  Save,
  X,
  FileText,
  Share2,
  CheckCircle,
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  PlusCircle,
  Search
} from 'lucide-react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';

// India cities data - same as Ad_Pos.jsx
export const indiaStatesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Roing", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Bhilai", "Korba", "Durg"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Solan"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belagavi"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Tripura": ["Agartala"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Kanpur", "Agra", "Varanasi"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
  "Andaman & Nicobar": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Delhi": ["New Delhi"],
  "Jammu & Kashmir": ["Srinagar", "Jammu"],
  "Ladakh": ["Leh"],
  "Puducherry": ["Puducherry"]
};

export const indiaCities = Object.values(indiaStatesAndCities).flat().sort();

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading position details...</p>
    </div>
  </div>
);

// Custom Input component matching Add Position form style
const Input = ({ label, required, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      {...props} 
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" 
    />
  </div>
);

// Custom Textarea component matching Add Position form style
const Textarea = ({ label, required, rows = 3, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea 
      {...props} 
      rows={rows}
      className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" 
    />
  </div>
);

// Custom Select component matching Add Position form style
const Select = ({ label, required, options, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select 
      {...props} 
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    >
      <option value="">Select</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// Main Page Component
const ClientSpocDashView = () => {
  const { pos_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Edit mode states
  const isEditMode = searchParams.get('mode') === 'edit';
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editNotification, setEditNotification] = useState(null);

  // Coach and Expert selection states
  const [coaches, setCoaches] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const isCollapsed = isSidebarCollapsed || false;
  const toggleCollapse = () => setIsSidebarCollapsed(!isCollapsed);

  // Helper function to parse comma-separated names to objects for autocomplete
  const parseCoachExpertNames = (namesString) => {
    if (!namesString) return [];
    if (Array.isArray(namesString)) return namesString;
    return namesString.split(', ').map(name => ({ name: name.trim(), id: name.trim(), email: '' }));
  };

  // Helper function to convert selected objects back to comma-separated names for API
  const formatCoachExpertForSave = (idsArray) => {
    if (!Array.isArray(idsArray) || idsArray.length === 0) return '';
    return idsArray.map(item => item.name).join(', ');
  };

  // Toggle city selection
  const toggleCity = (city) => {
    setEditData(prev => ({
      ...prev,
      location: prev.location?.includes(city)
        ? prev.location.filter(c => c !== city)
        : [...(prev.location || []), city]
    }));
  };

  // Handle coach selection from autocomplete
  const handleCoachChange = (event, newValue) => {
    setEditData(prev => ({ ...prev, coach_ids: newValue }));
  };

  // Handle expert selection from autocomplete
  const handleExpertChange = (event, newValue) => {
    setEditData(prev => ({ ...prev, expert_ids: newValue }));
  };

  // Delete a coach from selection
  const handleDeleteCoach = (coachToDelete) => {
    setEditData(prev => ({
      ...prev,
      coach_ids: prev.coach_ids?.filter(coach => coach.id !== coachToDelete.id) || []
    }));
  };

  // Delete an expert from selection
  const handleDeleteExpert = (expertToDelete) => {
    setEditData(prev => ({
      ...prev,
      expert_ids: prev.expert_ids?.filter(expert => expert.id !== expertToDelete.id) || []
    }));
  };

  // Fetch all coaches for dropdown
  useEffect(() => {
    async function fetchCoaches() {
      try {
        setLoadingCoaches(true);
        const res = await axios.get('/api/coach-expert/coach/all');
        if (res.data.success && Array.isArray(res.data.data)) {
          setCoaches(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching coaches:", err);
      } finally {
        setLoadingCoaches(false);
      }
    }

    fetchCoaches();
  }, []);

  // Fetch all experts for dropdown
  useEffect(() => {
    async function fetchExperts() {
      try {
        setLoadingExperts(true);
        const res = await axios.get('/api/coach-expert/expert/all');
        if (res.data.success && Array.isArray(res.data.data)) {
          setExperts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoadingExperts(false);
      }
    }

    fetchExperts();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchPosition = async () => {
      if (!pos_id) return;
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching position:", pos_id);
        const res = await axios.get(`/candidate/position/${pos_id}`, {
          withCredentials: true
        });
        console.log("Position data received:", res.data);
        setPosition(res.data);
        
        // Initialize edit data when position is loaded
        if (res.data) {
          setEditData({
            position: res.data.position || '',
            client: res.data.client || '',
            hr_name: res.data.hr_name || '',
            ctcStart: res.data.ctcStart || '',
            ctcEnd: res.data.ctcEnd || '',
            experience: res.data.experience || '',
            // Store location as array for city selection grid
            location: Array.isArray(res.data.location) ? res.data.location : (res.data.location ? res.data.location.split(', ') : []),
            job_desc: res.data.job_desc || '',
            commison: res.data.commison || 0,
            key_res: res.data.key_res || '',
            m_have: res.data.m_have || '',
            g_have: res.data.g_have || '',
            compet: res.data.compet || '',
            comp_view: res.data.comp_view || '',
            pos_cat: res.data.pos_cat || '',
            // Coach and Expert fields
            coach_ids: parseCoachExpertNames(res.data.coach_ids),
            expert_ids: parseCoachExpertNames(res.data.expert_ids)
          });
        }
      } catch (err) {
        console.error("Error fetching position:", err);
        console.error("Error response:", err.response);
        setError(err.response?.data?.message || err.response?.statusText || 'Failed to load position. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosition();
  }, [pos_id]);

  // Show success message and auto-hide after 3 seconds
  useEffect(() => {
    if (successMessage || editNotification) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setEditNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, editNotification]);

  if (!isMounted || !user) {
    return <LoadingSpinner />;
  }

  // Format date
  const formatDate = (dateData) => {
    if (!dateData?._seconds) return 'N/A';
    const date = new Date(dateData._seconds * 1000);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    return `₹${amount}`;
  };

  // Handle share click
  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/position/${pos_id}?view=share`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSuccessMessage('Share link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try again.');
    });
  };

  // Handle save edits
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      // Prepare data - convert arrays to comma-separated strings for API
      const submitData = {
        ...editData,
        // Convert location array to comma-separated string
        location: Array.isArray(editData.location) ? editData.location.join(', ') : editData.location,
        // Convert coach_ids and expert_ids to comma-separated names
        coach_ids: formatCoachExpertForSave(editData.coach_ids),
        expert_ids: formatCoachExpertForSave(editData.expert_ids)
      };
      
      const res = await axios.put(`/candidate/pos/modify/${position.id}`, submitData, {
        withCredentials: true
      });
      
      if (res.data.success) {
        setEditNotification({ type: 'success', message: 'Position updated successfully!' });
        
        // Refresh position data
        const refreshRes = await axios.get(`/candidate/position/${pos_id}`);
        setPosition(refreshRes.data);
        
        // Navigate back to view mode (remove ?mode=edit from URL)
        navigate(`/clientspoc-dash-view/${pos_id}`, { replace: true });
      } else {
        setEditNotification({ type: 'error', message: res.data.message || 'Failed to update position' });
      }
    } catch (err) {
      console.error('Error saving position:', err);
      setEditNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update position' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Navigate back to view mode
    navigate(`/clientspoc-dash-view/${pos_id}`, { replace: true });
  };

  // Handle back to My Added Positions
  const handleBackToMyPositions = () => {
    navigate('/my-added-positions');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Edit Notification */}
      {editNotification && (
        <div className={`fixed top-4 right-4 z-50 ${editNotification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in`}>
          <CheckCircle size={20} />
          <span>{editNotification.message}</span>
        </div>
      )}

      {/* Sidebar - Desktop - Using proper ClientSpocSidebar with green gradient */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
        <ClientSpocSidebar />
      </aside>

      {/* Sidebar - Mobile */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <ClientSpocSidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={handleBackToMyPositions} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Back to My Added Positions">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {isEditMode ? 'Edit Position' : 'Position Details'}
                </h1>
                <p className="text-sm text-gray-500">Viewing as {user?.name || 'Client SPOC'}</p>
              </div>
            </div>
            
            {/* Action buttons - View Mode Only */}
            {!isEditMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Copy Share Link"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={() => navigate(`/clientspoc-dash-view/${pos_id}?mode=edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  title="Edit Position"
                >
                  <Edit size={18} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Edit Mode - Make changes and click Save to update</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="min-h-screen">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md border-2 border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Position</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={handleBackToMyPositions} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold">
                  Back to My Added Positions
                </button>
              </div>
            </div>
          ) : (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full">
              
              {/* Position Header - View Mode */}
              {!isEditMode && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <FileText size={16} />
                      <span>Position ID: {pos_id}</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{position?.position}</h1>
                    <p className="text-xl text-green-100 mb-6">{position?.client || 'Confidential'}</p>
                    
                    <div className="flex flex-wrap gap-6">
                      {/* CTC Range */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                        <p className="text-xs text-green-100">CTC Range</p>
                        <p className="font-bold text-lg">{formatCurrency(position?.ctcStart)} - {formatCurrency(position?.ctcEnd)}</p>
                      </div>
                      
                      {/* Experience */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                        <p className="text-xs text-green-100">Experience</p>
                        <p className="font-bold text-lg">{position?.experience || 'Not specified'}</p>
                      </div>
                      
                      {/* Location */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                        <p className="text-xs text-green-100">Location</p>
                        <p className="font-bold text-lg">{Array.isArray(position?.location) ? position.location.join(', ') : position?.location || 'Not specified'}</p>
                      </div>
                      
                      {/* Posted On */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                        <p className="text-xs text-green-100">Posted On</p>
                        <p className="font-bold text-lg">{formatDate(position?.datePosted)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Position Details Form - Now with proper styling matching Ad_Pos.jsx */}
              <div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 overflow-hidden">
                
                {/* VIEW MODE: Position Details */}
                {!isEditMode && (
                  <div className="p-8 space-y-8">
                    
                    {/* Job Description */}
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Job Description</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                        {position?.job_desc || 'Not specified'}
                      </div>
                    </div>

                    {/* Key Responsibilities */}
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Key Responsibilities</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                        {position?.key_res || 'Not specified'}
                      </div>
                    </div>

                    {/* Must Have Skills */}
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Must Have Skills</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                        {position?.m_have || 'Not specified'}
                      </div>
                    </div>

                    {/* Good to Have Skills */}
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Good to Have Skills</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                        {position?.g_have || 'Not specified'}
                      </div>
                    </div>

                    {/* Competencies */}
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Competencies</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                        {position?.compet || 'Not specified'}
                      </div>
                    </div>

                    {/* Company Overview */}
                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Company Overview</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                        {position?.comp_view || 'Not specified'}
                      </div>
                    </div>
                  </div>
                )}

                {/* EDIT MODE: Form with proper Ad_Pos.jsx styling */}
                {isEditMode && (
                  <div className="p-3 sm:p-4 lg:p-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                      
                      {/* Basic Information */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <Briefcase size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Basic Information</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          <Input
                            label="Position Name"
                            required
                            value={editData.position || ''}
                            onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                            placeholder="e.g., Senior Software Engineer"
                          />
                          <Input
                            label="HR Name"
                            required
                            value={editData.hr_name || ''}
                            onChange={(e) => setEditData({ ...editData, hr_name: e.target.value })}
                            placeholder="HR Contact Person"
                          />
                          <Select
                            label="Position Category"
                            required
                            value={editData.pos_cat || ''}
                            onChange={(e) => setEditData({ ...editData, pos_cat: e.target.value })}
                            options={["Immediate Hiring", "Interview Drives", "Fast Response", "High Commission", "New"]}
                          />
                        </div>
                      </div>

                      {/* Client & HR Information */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <Building size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Client & HR Information</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <Input
                            label="Client Name"
                            required
                            value={editData.client || ''}
                            onChange={(e) => setEditData({ ...editData, client: e.target.value })}
                            placeholder="Client Company Name"
                          />
                          <Input
                            label="Commission (%)"
                            required
                            type="number"
                            step="0.01"
                            value={editData.commison || ''}
                            onChange={(e) => setEditData({ ...editData, commison: e.target.value })}
                            placeholder="e.g., 10"
                          />
                        </div>
                      </div>

                      {/* Compensation */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <IndianRupee size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Compensation Details</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          <Input
                            label="CTC Start (₹)"
                            required
                            type="number"
                            value={editData.ctcStart || ''}
                            onChange={(e) => setEditData({ ...editData, ctcStart: e.target.value })}
                            placeholder="Starting CTC"
                          />
                          <Input
                            label="CTC End (₹)"
                            required
                            type="number"
                            value={editData.ctcEnd || ''}
                            onChange={(e) => setEditData({ ...editData, ctcEnd: e.target.value })}
                            placeholder="Maximum CTC"
                          />
                          <Input
                            label="Experience"
                            required
                            value={editData.experience || ''}
                            onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
                            placeholder="e.g., 5-8 years"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <MapPin size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Location</h4>
                        </div>

                        {/* Search Box */}
                        <div className="mb-3 sm:mb-4">
                          <div className="relative">
                            <Search size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search cities..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm"
                            />
                          </div>
                        </div>

                        {/* Selected Cities */}
                        {editData.location?.length > 0 && (
                          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 rounded-xl border-2 border-green-200">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                              Selected Cities ({editData.location.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {editData.location.map(city => (
                                <span
                                  key={city}
                                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium"
                                >
                                  {city}
                                  <button
                                    type="button"
                                    onClick={() => toggleCity(city)}
                                    className="hover:bg-green-700 rounded-full p-0.5 transition-colors"
                                  >
                                    <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cities Grid */}
                        <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 max-h-56 sm:max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {indiaCities.filter(city =>
                              city.toLowerCase().includes(citySearch.toLowerCase())
                            ).map(city => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => toggleCity(city)}
                                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                  editData.location?.includes(city)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {city}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Coach & Expert Assignment */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <Users size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Coach & Expert Assignment</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                          {/* Add Coach - Optional Field */}
                          <div className="flex flex-col">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                              Add Coach <span className="text-gray-400">(Optional)</span>
                            </label>
                            <Autocomplete
                              multiple
                              options={coaches}
                              value={editData.coach_ids || []}
                              onChange={handleCoachChange}
                              getOptionLabel={(option) => option?.name ? `${option.name} (${option.specialization || ''})` : ''}
                              isOptionEqualToValue={(option, value) => option?.id === value?.id}
                              loading={loadingCoaches}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    variant="outlined"
                                    label={option.name}
                                    size="small"
                                    {...getTagProps({ index })}
                                    onDelete={() => handleDeleteCoach(option)}
                                    key={option.id}
                                    sx={{
                                      borderColor: '#16a34a',
                                      color: '#15803d',
                                      '& .MuiChip-label': { color: '#15803d' },
                                      '& .MuiChip-deleteIcon': { color: '#16a34a', '&:hover': { color: '#15803d' } }
                                    }}
                                  />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder={loadingCoaches ? "Loading..." : "Select coaches"}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <React.Fragment>
                                        {loadingCoaches ? (
                                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </React.Fragment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': { borderColor: '#e5e7eb' },
                                      '&:hover fieldset': { borderColor: '#16a34a' },
                                      '&.Mui-focused fieldset': { borderColor: '#16a34a' }
                                    }
                                  }}
                                />
                              )}
                              filterOptions={(options, params) => {
                                const filtered = options.filter(option =>
                                  option.name?.toLowerCase().includes(params.inputValue.toLowerCase()) ||
                                  option.specialization?.toLowerCase().includes(params.inputValue.toLowerCase())
                                );
                                return filtered;
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Search by name or specialization. Select multiple coaches.
                            </p>
                          </div>

                          {/* Add Expert - Optional Field */}
                          <div className="flex flex-col">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                              Add Expert <span className="text-gray-400">(Optional)</span>
                            </label>
                            <Autocomplete
                              multiple
                              options={experts}
                              value={editData.expert_ids || []}
                              onChange={handleExpertChange}
                              getOptionLabel={(option) => option?.name ? `${option.name} (${option.specialization || ''})` : ''}
                              isOptionEqualToValue={(option, value) => option?.id === value?.id}
                              loading={loadingExperts}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    variant="outlined"
                                    label={option.name}
                                    size="small"
                                    {...getTagProps({ index })}
                                    onDelete={() => handleDeleteExpert(option)}
                                    key={option.id}
                                    sx={{
                                      borderColor: '#7c3aed',
                                      color: '#6d28d9',
                                      '& .MuiChip-label': { color: '#6d28d9' },
                                      '& .MuiChip-deleteIcon': { color: '#7c3aed', '&:hover': { color: '#6d28d9' } }
                                    }}
                                  />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder={loadingExperts ? "Loading..." : "Select experts"}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <React.Fragment>
                                        {loadingExperts ? (
                                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </React.Fragment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': { borderColor: '#e5e7eb' },
                                      '&:hover fieldset': { borderColor: '#7c3aed' },
                                      '&.Mui-focused fieldset': { borderColor: '#7c3aed' }
                                    }
                                  }}
                                />
                              )}
                              filterOptions={(options, params) => {
                                const filtered = options.filter(option =>
                                  option.name?.toLowerCase().includes(params.inputValue.toLowerCase()) ||
                                  option.specialization?.toLowerCase().includes(params.inputValue.toLowerCase())
                                );
                                return filtered;
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Search by name or specialization. Select multiple experts.
                            </p>
                          </div>

                        </div>
                      </div>

                      {/* Job Requirements */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <Users size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Requirements</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <Textarea
                            label="Key Responsibilities"
                            required
                            rows={4}
                            value={editData.key_res || ''}
                            onChange={(e) => setEditData({ ...editData, key_res: e.target.value })}
                            placeholder="List key responsibilities..."
                          />
                          <Textarea
                            label="Must Have Skills"
                            required
                            rows={4}
                            value={editData.m_have || ''}
                            onChange={(e) => setEditData({ ...editData, m_have: e.target.value })}
                            placeholder="Required skills..."
                          />
                          <Textarea
                            label="Good to Have Skills"
                            required
                            rows={4}
                            value={editData.g_have || ''}
                            onChange={(e) => setEditData({ ...editData, g_have: e.target.value })}
                            placeholder="Additional skills..."
                          />
                          <Textarea
                            label="Competencies"
                            required
                            rows={4}
                            value={editData.compet || ''}
                            onChange={(e) => setEditData({ ...editData, compet: e.target.value })}
                            placeholder="Required competencies..."
                          />
                        </div>
                      </div>

                      {/* Job Description */}
                      <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <FileText size={18} className="sm:w-5 sm:h-5 text-green-600" />
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Description</h4>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                          <Textarea
                            label="Company Overview"
                            required
                            rows={4}
                            value={editData.comp_view || ''}
                            onChange={(e) => setEditData({ ...editData, comp_view: e.target.value })}
                            placeholder="Company overview and culture..."
                          />
                          <Textarea
                            label="Job Summary"
                            required
                            rows={6}
                            value={editData.job_desc || ''}
                            onChange={(e) => setEditData({ ...editData, job_desc: e.target.value })}
                            placeholder="Detailed job description..."
                          />
                        </div>
                      </div>

                      {/* Save Buttons */}
                      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={18} className="sm:w-5 sm:h-5" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="h-6 w-auto" />
              <span className="text-sm text-gray-500">© 2024 RecruiterV. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ClientSpocDashView;

