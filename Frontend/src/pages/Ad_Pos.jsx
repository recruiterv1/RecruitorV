import React, { useState, useEffect, useContext } from 'react';
import axios from "axios";
import { PlusCircle, Briefcase, Building, Users, IndianRupee, MapPin, FileText, CheckCircle, X, Search, UserPlus, Award } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { useLocation } from 'react-router-dom';
import { Autocomplete, Chip, TextField } from '@mui/material';

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

// No need for separate CTC options - we'll generate them dynamically

const Ad_Pos = () => {
  const { user } = useContext(UserStateContext);
  const [submit, setSubmit] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCopiedPosition, setIsCopiedPosition] = useState(false);
  const [spocs, setSpocs] = useState([]);
  const [spocsLoading, setSpocsLoading] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);

  // Get user's first name for display
  const getUserFirstName = () => {
    if (!user) return "";
    
    // Try to get first name from user object
    if (user.firstName) return user.firstName;
    if (user.name) {
      // Extract first name from full name
      return user.name.split(' ')[0];
    }
    if (user.displayName) {
      // Extract first name from display name
      return user.displayName.split(' ')[0];
    }
    if (user.email) {
      // Extract name from email (before @)
      return user.email.split('@')[0];
    }
    
    return "";
  };

  // Get user's email for clientspoc field (stored in database)
  // Convert to lowercase for case-insensitive matching
  const getUserEmail = () => {
    if (!user) return "";
    return (user.email || "").toLowerCase();
  };

  // Check if we have copied position data from sessionStorage
  const getCopiedData = () => {
    const stored = sessionStorage.getItem('copiedPosition');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing copied position:', e);
        return null;
      }
    }
    return null;
  };

  const copiedData = getCopiedData();

  const [form, setForm] = useState({
    pos_id: "",
    position: copiedData?.position || "",
    clientspoc: getUserEmail(), // Store email in database
    clientspoc_name: getUserFirstName(), // Store name in database
    hr_name: copiedData?.hr_name || "",
    client: copiedData?.client || "",
    ctcStart: copiedData?.ctcStart || "",
    ctcEnd: copiedData?.ctcEnd || "",
    location: copiedData?.location || [],
    job_desc: copiedData?.job_desc || "",
    commison: copiedData?.commison || "",
    experience: copiedData?.experience || "",
    pos_cat: copiedData?.pos_cat || "",
    comp_view: copiedData?.comp_view || "",
    m_have: copiedData?.m_have || "",
    g_have: copiedData?.g_have || "",
    compet: copiedData?.compet || "",
    key_res: copiedData?.key_res || "",
    coach_ids: [], // Array of coach IDs/names (comma-separated for display)
    expert_ids: [] // Array of expert IDs/names (comma-separated for display)
  });

  const clientList = [
    "Tech Mahindra",
    "Know Max",
    "Acuvate",
    "Asian Paints",
    "AU Bank",
    "RBL Bank",
    "Tata Capital",
    "Aditya Birla Capital",
    "Muthoot Fincorp",
    "Dainik Bhaskar",
    "Brillio",
    "LTIMindtree",
    "Affine Analytics",
    "Shriram Wealth"
  ];

  const positionCategories = [
    "Immediate Hiring",
    "Interview Drives",
    "Fast Response",
    "High Commission",
    "New"
  ];

  const toggleCity = (city) => {
    setForm(prev => ({
      ...prev,
      location: prev.location.includes(city)
        ? prev.location.filter(c => c !== city)
        : [...prev.location, city]
    }));
  };

  // Fetch overview when client changes
  useEffect(() => {
    async function loadOverview() {
      if (!form.client) return;

      try {
        const res = await axios.get(`/addit/overview/${form.client}`);
        if (res.data.found) {
          setForm(prev => ({
            ...prev,
            comp_view: res.data.data.overview,
            commison: res.data.data.commisson
          }));
        } else {
          setForm(prev => ({ ...prev, comp_view: "", commison: "" }));
        }
      } catch (err) {
        console.error("Error fetching overview", err);
      }
    }

    loadOverview();
  }, [form.client]);

  // Fetch all SPOCs for dropdown
  useEffect(() => {
    async function fetchSpocs() {
      try {
        setSpocsLoading(true);
        const res = await axios.get('/clientspoc/all');
        if (res.data.success && Array.isArray(res.data.data)) {
          setSpocs(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching SPOCs:", err);
      } finally {
        setSpocsLoading(false);
      }
    }

    fetchSpocs();
  }, []);

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

  // Fetch current ID and set clientspoc
  useEffect(() => {
    async function loadCurrentId() {
      try {
        const res = await axios.get("/candidate/addPosition/currentId");
        setForm(prev => ({ 
          ...prev, 
          pos_id: String(res.data.currentId + 1),
          clientspoc: getUserEmail(), // Store email
          clientspoc_name: getUserFirstName() // Store name
        }));
      } catch (error) {
        console.error("Error fetching current ID:", error);
      }
    }

    loadCurrentId();
    
    // Check if this is a copied position
    if (copiedData) {
      setIsCopiedPosition(true);
      // Clear the sessionStorage after reading
      sessionStorage.removeItem('copiedPosition');
    }
  }, [user]); // Re-run when user changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle SPOC selection specially
    if (name === 'clientspocSelect') {
      const selectedSpoc = spocs.find(spoc => spoc.email === value);
      if (selectedSpoc) {
        setForm(prev => ({
          ...prev,
          clientspoc: selectedSpoc.email,
          clientspoc_name: selectedSpoc.name
        }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle coach selection from autocomplete
  const handleCoachChange = (event, newValue) => {
    // newValue is array of selected coach objects
    const selectedCoaches = newValue.map(coach => ({
      id: coach.id,
      name: coach.name,
      email: coach.email
    }));
    setForm(prev => ({ ...prev, coach_ids: selectedCoaches }));
  };

  // Handle expert selection from autocomplete
  const handleExpertChange = (event, newValue) => {
    // newValue is array of selected expert objects
    const selectedExperts = newValue.map(expert => ({
      id: expert.id,
      name: expert.name,
      email: expert.email
    }));
    setForm(prev => ({ ...prev, expert_ids: selectedExperts }));
  };

  // Delete a coach from selection
  const handleDeleteCoach = (coachToDelete) => {
    setForm(prev => ({
      ...prev,
      coach_ids: prev.coach_ids.filter(coach => coach.id !== coachToDelete.id)
    }));
  };

  // Delete an expert from selection
  const handleDeleteExpert = (expertToDelete) => {
    setForm(prev => ({
      ...prev,
      expert_ids: prev.expert_ids.filter(expert => expert.id !== expertToDelete.id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submit) return;

    // Validation (skip coach_ids and expert_ids as they are optional)
    const requiredFields = ['pos_id', 'position', 'clientspoc', 'hr_name', 'client', 'ctcStart', 'ctcEnd', 'job_desc', 'commison', 'experience', 'pos_cat', 'comp_view', 'm_have', 'g_have', 'compet', 'key_res'];
    for (const key of requiredFields) {
      const value = form[key];
      if (value === "" || value === null || (Array.isArray(value) && value.length === 0)) {
        alert(`Please fill required field: ${key}`);
        return;
      }
    }

    try {
      setSubmit(true);
      
      // Prepare data - convert coach_ids and expert_ids to comma-separated names
      const submitData = {
        ...form,
        // Store comma-separated names for display
        coach_ids: form.coach_ids.map(c => c.name).join(', '),
        expert_ids: form.expert_ids.map(e => e.name).join(', ')
      };
      
      // Send form data with authentication credentials
      const res = await axios.post('/candidate/pos', submitData, {
        withCredentials: true  // Send authentication cookies
      });
      console.log("Server Response:", res.data);
      
      // Check if response indicates success
      if (res.data.success === false) {
        // Handle plan limit or authentication errors
        if (res.data.limitReached) {
          alert(`Position limit reached! ${res.data.message}`);
        } else if (res.data.expired) {
          alert(`Plan expired! ${res.data.message}`);
        } else {
          alert(res.data.message || 'Failed to create position');
        }
        return;
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reset form - keep the selected SPOC
      setForm({
        pos_id: String(parseInt(form.pos_id) + 1),
        position: "",
        hr_name: "",
        client: "",
        clientspoc: form.clientspoc, // Keep selected SPOC email
        clientspoc_name: form.clientspoc_name, // Keep selected SPOC name
        ctcStart: "",
        ctcEnd: "",
        location: [],
        job_desc: "",
        commison: "",
        experience: "",
        pos_cat: "",
        comp_view: "",
        m_have: "",
        g_have: "",
        compet: "",
        key_res: "",
        coach_ids: [],
        expert_ids: []
      });
      
    } catch (error) {
      console.error("Submission error:", error);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          alert("Authentication required. Please login again.");
          // Optionally redirect to login
          // window.location.href = '/admin/login';
        } else if (status === 403) {
          alert(data.message || "You don't have permission to create positions.");
        } else if (status === 500) {
          alert("Server error. Please try again later.");
        } else {
          alert(data.message || "Failed to create position. Please try again.");
        }
      } else if (error.request) {
        alert("Network error. Please check your connection.");
      } else {
        alert("Failed to create position. Please try again.");
      }
    } finally {
      setSubmit(false);
    }
  };

  const filteredCities = indiaCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <PlusCircle size={20} className="sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Add New Position
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm">
                  Create a new job opening with proper CTC selection
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mx-3 sm:mx-4 lg:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start sm:items-center gap-2 sm:gap-3 animate-fadeIn">
              <CheckCircle size={20} className="sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-green-900 text-sm sm:text-base">Position Created Successfully!</p>
                <p className="text-xs sm:text-sm text-green-700">The position has been added and is now visible to recruiters.</p>
              </div>
            </div>
          )}

          {/* Copied Position Info Banner */}
          {isCopiedPosition && (
            <div className="mx-3 sm:mx-4 lg:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start sm:items-center gap-2 sm:gap-3">
              <PlusCircle size={20} className="sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-blue-900 text-sm sm:text-base">Creating Copy of Position</p>
                <p className="text-xs sm:text-sm text-blue-700">All fields have been pre-filled from the original position. A new Position ID will be assigned when you create this position.</p>
              </div>
              <button
                onClick={() => setIsCopiedPosition(false)}
                className="ml-auto p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6">
            
            {/* Basic Information */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Briefcase size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Position ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pos_id"
                    value={form.pos_id}
                    disabled
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-gray-100 text-gray-500 font-mono text-sm"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Position Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="e.g., Senior Software Engineer"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Position Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="pos_cat"
                    value={form.pos_cat}
                    onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  >
                    <option value="">Select Category</option>
                    {positionCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Client & HR Information */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Building size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Client & HR Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="client"
                    value={form.client}
                    onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  >
                    <option value="">Select Client</option>
                    {clientList.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    HR Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hr_name"
                    value={form.hr_name}
                    onChange={handleChange}
                    placeholder="HR Contact Person"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Client SPOC <span className="text-red-500">*</span>
                  </label>
                  {/* Hidden field with email (sent to backend) */}
                  <input
                    type="hidden"
                    name="clientspoc"
                    value={form.clientspoc}
                  />
                  {/* Dropdown for selecting SPOC */}
                  <select
                    name="clientspocSelect"
                    value={form.clientspoc}
                    onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  >
                    <option value="">Select SPOC</option>
                    {spocsLoading ? (
                      <option value="" disabled>Loading SPOCs...</option>
                    ) : spocs.length > 0 ? (
                      spocs.map(spoc => (
                        <option key={spoc.id} value={spoc.email}>
                          {spoc.name} ({spoc.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No SPOCs found</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a Client SPOC. Name and email will be stored with the position.
                  </p>
                </div>

                {/* Add Coach - Optional Field */}
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Add Coach <span className="text-gray-400">(Optional)</span>
                  </label>
                  <Autocomplete
                    multiple
                    options={coaches}
                    value={form.coach_ids}
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
                        placeholder={loadingCoaches ? "Loading..." : "Select coaches"}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {loadingCoaches ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#e5e7eb' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
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

              </div>
            </div>

            {/* Compensation */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <IndianRupee size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Compensation Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    CTC Start <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ctcStart"
                    value={form.ctcStart}
                    onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  >
                    <option value="">Starting From</option>
                    {Array.from({ length: ((10000000 - 300000) / 50000) + 1 }, (_, i) => 300000 + i * 50000)
                      .map((val) => (
                        <option key={val} value={val}>₹{val.toLocaleString('en-IN')}</option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    CTC End <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ctcEnd"
                    value={form.ctcEnd}
                    onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  >
                    <option value="">Ending At</option>
                    {Array.from({ length: ((10000000 - 300000) / 50000) + 1 }, (_, i) => 300000 + i * 50000)
                      .map((val) => (
                        <option key={val} value={val}>₹{val.toLocaleString('en-IN')}</option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Commission (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="commison"
                    value={form.commison}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    step="0.01"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

              </div>

              {/* CTC Preview */}
              {form.ctcStart && form.ctcEnd && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-semibold">CTC Range Preview:</span> 
                    <span className="ml-2 text-blue-700 font-bold">
                      ₹{Number(form.ctcStart).toLocaleString('en-IN')} - ₹{Number(form.ctcEnd).toLocaleString('en-IN')}
                    </span>
                  </p>
                  {form.commison && form.ctcStart && (
                    <p className="text-xs sm:text-sm text-gray-700 mt-2">
                      <span className="font-semibold">Commission Amount:</span>
                      <span className="ml-2 text-green-700 font-bold">
                        ₹{((parseFloat(form.ctcStart) * parseFloat(form.commison)) / 100).toLocaleString('en-IN')} ({form.commison}%)
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Users size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Experience Required</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="e.g., 5-8 years"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                {/* Add Expert - Optional Field */}
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Add Expert <span className="text-gray-400">(Optional)</span>
                  </label>
                  <Autocomplete
                    multiple
                    options={experts}
                    value={form.expert_ids}
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
                            borderColor: '#9333ea',
                            color: '#7c3aed',
                            '& .MuiChip-label': { color: '#7c3aed' },
                            '& .MuiChip-deleteIcon': { color: '#9333ea', '&:hover': { color: '#7c3aed' } }
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
                            '&:hover fieldset': { borderColor: '#9333ea' },
                            '&.Mui-focused fieldset': { borderColor: '#9333ea' }
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

            {/* Location */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <MapPin size={18} className="sm:w-5 sm:h-5 text-blue-600" />
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
                    className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Selected Cities */}
              {form.location.length > 0 && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Selected Cities ({form.location.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {form.location.map(city => (
                      <span
                        key={city}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium"
                      >
                        {city}
                        <button
                          type="button"
                          onClick={() => toggleCity(city)}
                          className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
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
                  {filteredCities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleCity(city)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        form.location.includes(city)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Requirements */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Briefcase size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Requirements</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Key Responsibilities <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="key_res"
                    value={form.key_res}
                    onChange={handleChange}
                    rows={4}
                    placeholder="List key responsibilities..."
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Must Have Skills <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="m_have"
                    value={form.m_have}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Required skills..."
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Good to Have Skills <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="g_have"
                    value={form.g_have}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Additional skills..."
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Competencies <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="compet"
                    value={form.compet}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Required competencies..."
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

              </div>
            </div>

            {/* Job Description */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <FileText size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Description</h4>
              </div>
              <div className="space-y-4 sm:space-y-6">
                
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Company Overview <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="comp_view"
                    value={form.comp_view}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Company overview and culture..."
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Job Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="job_desc"
                    value={form.job_desc}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Detailed job description..."
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    required
                  />
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base order-2 sm:order-1"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={submit}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
              >
                {submit ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} className="sm:w-5 sm:h-5" />
                    Create Position
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
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

export default Ad_Pos;
