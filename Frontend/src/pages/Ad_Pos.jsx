import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from "axios";
import { PlusCircle, Briefcase, Building, Users, IndianRupee, MapPin, FileText, CheckCircle, X, Search, UserPlus, Award, Plus } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { useLocation } from 'react-router-dom';
import { Autocomplete, Chip, TextField } from '@mui/material';
import RichTextEditor, { isHtmlEmpty } from '../components/RichTextEditor';
import QuestionsEditor, { QuestionsList, validateQuestions } from '../components/QuestionsEditor';

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

// `companyMode` (optional): when a Company portal user posts a position, reuse this
// exact form but pre-fill the assigned ClientSPOC + company, and submit through the
// company endpoint (which forces status 'pending' + routes to the assigned SPOC).
// `publicMode` (optional): unauthenticated "Post a Job" page. Company (client) is a
// fixed free-text name, ClientSPOC is assigned later by admin, and the form submits
// to the public endpoint (lands as 'admin-pending' for SuperAdmin review).
// `firmMode` (optional): a consulting firm posting a position — client list and
// SPOC list are the firm's own; submits to the consulting endpoint (server tags
// consultingFirmId + routes to the firm's SPOC as 'pending').
const Ad_Pos = ({ companyMode = null, publicMode = null, firmMode = null } = {}) => {
  const { user } = useContext(UserStateContext);
  const [submit, setSubmit] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [customCities, setCustomCities] = useState([]);
  // Selected client's tier-based commission config (from Company_Overview)
  const [companyCommission, setCompanyCommission] = useState({ type: '', tiers: [] });
  // Client-requirement questions set on the company profile (read-only here)
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCopiedPosition, setIsCopiedPosition] = useState(false);
  const [spocs, setSpocs] = useState([]);
  const [spocsLoading, setSpocsLoading] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [clientList, setClientList] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [skillCategoryHierarchy, setSkillCategoryHierarchy] = useState([]);
  const [skillCatsLoading, setSkillCatsLoading] = useState(false);
  const [overviewAutoFilled, setOverviewAutoFilled] = useState(false);

  // Get user's first name for display
  const getUserFirstName = () => {
    if (companyMode) return companyMode.spocName || "";
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
    if (publicMode) return "unassigned";   // SPOC assigned by admin on approval
    if (companyMode) return (companyMode.spocEmail || "").toLowerCase();
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

  // Editing an existing firm position reuses this exact form (firmMode.editPosition).
  const editData = firmMode?.editPosition || null;
  const skipOverviewOverwrite = useRef(!!editData);
  const copiedData = editData || getCopiedData();

  const [form, setForm] = useState({
    pos_id: editData?.pos_id || "",
    position: copiedData?.position || "",
    clientspoc: editData?.clientspoc || getUserEmail(), // Store email in database
    clientspoc_name: editData?.clientspoc_name || getUserFirstName(), // Store name in database
    hr_name: copiedData?.hr_name || "",
    client: companyMode?.companyName || publicMode?.companyName || copiedData?.client || "",
    ctcStart: copiedData?.ctcStart || "",
    ctcEnd: copiedData?.ctcEnd || "",
    location: copiedData?.location || [],
    job_desc: copiedData?.job_desc || "",
    commison: copiedData?.commison || "",
    position_tier: copiedData?.position_tier || "",
    commission_type: copiedData?.commission_type || "",
    client_questions: Array.isArray(copiedData?.client_questions) ? copiedData.client_questions : [],
    experience: copiedData?.experience || "",
    pos_cat: copiedData?.pos_cat || "",
    skill_category: copiedData?.skill_category || "",
    skill_sub_category: Array.isArray(copiedData?.skill_sub_category)
      ? copiedData.skill_sub_category
      : (copiedData?.skill_sub_category ? String(copiedData.skill_sub_category).split(',').map(s => s.trim()).filter(Boolean) : []),
    specialization: Array.isArray(copiedData?.specialization)
      ? copiedData.specialization
      : (copiedData?.specialization ? String(copiedData.specialization).split(',').map(s => s.trim()).filter(Boolean) : []),
    comp_view: copiedData?.comp_view || "",
    m_have: copiedData?.m_have || "",
    g_have: copiedData?.g_have || "",
    compet: copiedData?.compet || "",
    key_res: copiedData?.key_res || "",
    coach_ids: [], // Array of coach IDs/names (comma-separated for display)
    expert_ids: [], // Array of expert IDs/names (comma-separated for display)
    // ── New structured fields ──
    employment_type: copiedData?.employment_type || "Full Time",
    no_of_positions: copiedData?.no_of_positions || 1,
    work_mode: copiedData?.work_mode || "On-site",
    min_exp: copiedData?.min_exp || "",
    max_exp: copiedData?.max_exp || "",
    min_rel_exp: copiedData?.min_rel_exp || "",
    team_handling: copiedData?.team_handling || "No",
    req_education: copiedData?.req_education || "",
    pref_education: copiedData?.pref_education || "",
    certifications: copiedData?.certifications || [],
    budget_type: copiedData?.budget_type || "Fixed",
    variable_pay_pct: copiedData?.variable_pay_pct || "",
    variable_criteria: copiedData?.variable_criteria || "",
    variable_freq: copiedData?.variable_freq || "Annual",
    joining_bonus: copiedData?.joining_bonus || "No",
    interview_mode: copiedData?.interview_mode || "Mixed",
    interview_rounds: copiedData?.interview_rounds || [],
    candidate_instructions: copiedData?.candidate_instructions || "",
    open_to_all: editData ? (editData.openToAll === true || editData.open_to_all === true) : false,
  });

  // ── Wizard state + new-field helpers ──
  const WIZARD_STEPS = ["Role basics", "Client & pay", "Experience & education", "Role details", "Recruitment process", "Client requirements", "Candidate Instructions"];
  const [step, setStep] = useState(0);
  const [certInput, setCertInput] = useState("");
  const addCert = () => {
    const v = certInput.trim();
    if (v && !form.certifications.includes(v)) setForm(p => ({ ...p, certifications: [...p.certifications, v] }));
    setCertInput("");
  };
  const removeCert = (i) => setForm(p => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }));
  const addRound = () => setForm(p => ({ ...p, interview_rounds: [...p.interview_rounds, { name: "", duration: "", mode: "Virtual" }] }));
  const removeRound = (i) => setForm(p => ({ ...p, interview_rounds: p.interview_rounds.filter((_, idx) => idx !== i) }));
  const updateRound = (i, key, val) => setForm(p => ({ ...p, interview_rounds: p.interview_rounds.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));
  const Seg = ({ name, options }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button type="button" key={o} onClick={() => setForm(p => ({ ...p, [name]: o }))}
          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${form[name] === o ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
          {o}
        </button>
      ))}
    </div>
  );

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

  // Fetch client list from Company_Overview collection (or firm-scoped list).
  useEffect(() => {
    if (firmMode) { setClientList(firmMode.companies || []); return; }
    setClientsLoading(true);
    axios.get('/clientspoc/companies')
      .then(res => { if (res.data.success) setClientList(res.data.companies); })
      .catch(err => console.error('Failed to fetch clients:', err))
      .finally(() => setClientsLoading(false));
  }, []);

  // Fetch skill categories (hierarchical)
  useEffect(() => {
    setSkillCatsLoading(true);
    axios.get('/candidate/skill-categories-hierarchical')
      .then(res => { if (res.data.success) setSkillCategoryHierarchy(res.data.categories); })
      .catch(err => console.error('Failed to fetch skill categories:', err))
      .finally(() => setSkillCatsLoading(false));
  }, []);

  // Fetch commission + company overview when client changes
  useEffect(() => {
    if (!form.client) {
      setOverviewAutoFilled(false);
      return;
    }
    async function loadOverview() {
      setOverviewLoading(true);
      setOverviewAutoFilled(false);
      try {
        const res = await axios.get(`/addit/overview/${encodeURIComponent(form.client)}`);
        if (res.data.found) {
          const c = res.data.data;
          const tiers = Array.isArray(c.commissionTiers) ? c.commissionTiers : [];
          setCompanyCommission({ type: c.commissionType || '', tiers });
          setCompanyQuestions(Array.isArray(c.questions) ? c.questions : []);
          // When editing, the first auto-load must NOT clobber the position's own
          // saved values — only fill fields that are empty. On later client changes
          // (or when adding), overwrite with the selected company's details.
          const keepExisting = skipOverviewOverwrite.current;
          skipOverviewOverwrite.current = false;
          setForm(prev => ({
            ...prev,
            comp_view: keepExisting ? (prev.comp_view || c.overview || '') : (c.overview || ''),
            commison: keepExisting ? (prev.commison || c.commisson || '') : (c.commisson || ''),
            commission_type: keepExisting ? (prev.commission_type || c.commissionType || '') : (c.commissionType || ''),
            position_tier: keepExisting ? prev.position_tier : '',
            candidate_instructions: prev.candidate_instructions || c.candidateInstructions || '',
          }));
          setOverviewAutoFilled(true);
        } else {
          setCompanyCommission({ type: '', tiers: [] });
          setCompanyQuestions([]);
          setForm(prev => ({ ...prev, comp_view: '', commison: '', commission_type: '', position_tier: '' }));
        }
      } catch (err) {
        console.error('Error fetching client overview:', err);
      } finally {
        setOverviewLoading(false);
      }
    }
    loadOverview();
  }, [form.client]);

  // Fetch all SPOCs for dropdown (or firm-scoped list).
  useEffect(() => {
    if (firmMode) { setSpocs(firmMode.spocs || []); return; }
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
        const [res, statsRes] = await Promise.all([
          axios.get('/api/coach-expert/coach/all'),
          axios.get('/api/coach-expert/stats/all', { params: { type: 'coach' } })
        ]);
        if (res.data.success && Array.isArray(res.data.data)) {
          let base = res.data.data;
          if (statsRes.data?.success) {
            const statsList = statsRes.data.coaches || [];
            const statsById = {};
            statsList.forEach(s => {
              statsById[s.id] = {
                positionCount: s.positionCount || 0,
                acceptedCount: s.statusCounts?.accepted || 0
              };
            });
            base = base.map(c => ({
              ...c,
              positionCount: statsById[c.id]?.positionCount || 0,
              acceptedCount: statsById[c.id]?.acceptedCount || 0
            }));
          }
          setCoaches(base);
        } else {
          setCoaches([]);
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
        const [res, statsRes] = await Promise.all([
          axios.get('/api/coach-expert/expert/all'),
          axios.get('/api/coach-expert/stats/all', { params: { type: 'expert' } })
        ]);
        if (res.data.success && Array.isArray(res.data.data)) {
          let base = res.data.data;
          if (statsRes.data?.success) {
            const statsList = statsRes.data.experts || [];
            const statsById = {};
            statsList.forEach(s => {
              statsById[s.id] = {
                positionCount: s.positionCount || 0,
                acceptedCount: s.statusCounts?.accepted || 0
              };
            });
            base = base.map(e => ({
              ...e,
              positionCount: statsById[e.id]?.positionCount || 0,
              acceptedCount: statsById[e.id]?.acceptedCount || 0
            }));
          }
          setExperts(base);
        }
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoadingExperts(false);
      }
    }

    fetchExperts();
  }, []);

  // Fetch current ID and set clientspoc (skip when editing — keep the existing pos_id)
  useEffect(() => {
    if (editData) return;
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
    } else if (name === 'skill_category') {
      setForm(prev => ({ ...prev, skill_category: value, skill_sub_category: [], specialization: [] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Sub Skill Category: multi-select, max 2 children of the chosen parent.
  const MAX_SUB_CATS = 2;
  const toggleSubCat = (name) => {
    setForm(prev => {
      const has = prev.skill_sub_category.includes(name);
      if (!has && prev.skill_sub_category.length >= MAX_SUB_CATS) return prev; // cap at 2
      const nextSubs = has
        ? prev.skill_sub_category.filter(s => s !== name)
        : [...prev.skill_sub_category, name];
      // Keep only specializations that still belong to a selected sub-category
      const catObj = skillCategoryHierarchy.find(c => c.parent === prev.skill_category);
      const validSpecs = new Set(
        (catObj?.children || [])
          .filter(ch => nextSubs.includes(ch.name))
          .flatMap(ch => ch.subChildren || [])
      );
      return { ...prev, skill_sub_category: nextSubs, specialization: prev.specialization.filter(s => validSpecs.has(s)) };
    });
  };
  // Specialization: multi-select, unlimited.
  const toggleSpec = (name) => {
    setForm(prev => ({
      ...prev,
      specialization: prev.specialization.includes(name)
        ? prev.specialization.filter(s => s !== name)
        : [...prev.specialization, name],
    }));
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
    // Map each required field to the wizard step it lives on, so we can jump there.
    const fieldStep = {
      pos_id: 0, position: 0, pos_cat: 0, skill_category: 0, skill_sub_category: 0,
      employment_type: 0, work_mode: 0, no_of_positions: 0,
      clientspoc: 1, hr_name: 1, client: 1, ctcStart: 1, ctcEnd: 1, commison: 1,
      experience: 2, min_exp: 2, req_education: 2,
      m_have: 3, g_have: 3, compet: 3, key_res: 3, comp_view: 3, job_desc: 3, location: 3,
    };
    const requiredFields = [
      'pos_id', 'position', 'clientspoc', 'hr_name', 'client', 'ctcStart', 'ctcEnd', 'job_desc',
      'commison', 'experience', 'pos_cat', 'skill_category', 'skill_sub_category',
      'comp_view', 'm_have', 'g_have', 'compet', 'key_res',
      'employment_type', 'work_mode', 'no_of_positions', 'min_exp', 'req_education', 'location',
    ];
    const labels = { no_of_positions: 'no. of positions', employment_type: 'employment type', work_mode: 'work mode', min_exp: 'minimum experience', req_education: 'required education', skill_sub_category: 'skill sub category', comp_view: 'company overview', job_desc: 'job summary', m_have: 'must-have skills', g_have: 'good-to-have skills', compet: 'competencies', key_res: 'key responsibilities' };
    const richFields = ['key_res', 'm_have', 'g_have', 'compet', 'job_desc'];
    for (const key of requiredFields) {
      const value = form[key];
      const empty = richFields.includes(key)
        ? isHtmlEmpty(value)
        : (value === "" || value === null || value === undefined || (Array.isArray(value) && value.length === 0));
      if (empty) {
        if (fieldStep[key] !== undefined) setStep(fieldStep[key]);
        alert(`Please fill required field: ${labels[key] || key.replace(/_/g, ' ')}`);
        return;
      }
    }

    // Specialization is required only when the selected sub-category has sub-children
    const selectedCatObj = skillCategoryHierarchy.find(c => c.parent === form.skill_category);
    const availableSpecs = (selectedCatObj?.children || [])
      .filter(ch => form.skill_sub_category.includes(ch.name))
      .flatMap(ch => ch.subChildren || []);
    if (availableSpecs.length > 0 && form.specialization.length === 0) {
      setStep(0);
      alert('Please fill required field: specialization');
      return;
    }

    // Position-specific client-requirement questions must be complete.
    const qErr = validateQuestions(form.client_questions);
    if (qErr) {
      setStep(5);
      alert(`Client requirements — ${qErr}`);
      return;
    }

    try {
      setSubmit(true);
      
      // Prepare data - convert coach_ids and expert_ids to comma-separated names
      const submitData = {
        ...form,
        // Store comma-separated names for display
        coach_ids: form.coach_ids.map(c => c.name).join(', '),
        expert_ids: form.expert_ids.map(e => e.name).join(', '),
        // Multi-select skill fields → comma-separated strings (DB-compatible)
        skill_sub_category: form.skill_sub_category.join(', '),
        specialization: form.specialization.join(', '),
        // Store certifications as comma-separated text + keep the count of rounds
        certifications: Array.isArray(form.certifications) ? form.certifications.join(', ') : (form.certifications || ''),
        num_interview_rounds: form.interview_rounds.length,
      };
      
      // Public posters submit to the public funnel (lands as 'admin-pending');
      // company-portal users post through the company endpoint; everyone else the
      // normal position endpoint.
      if (publicMode) {
        submitData.posterEmail = publicMode.posterEmail || '';
        submitData.posterName = publicMode.posterName || '';
        submitData.posterPhone = publicMode.posterPhone || '';
        submitData.client = publicMode.companyName || submitData.client;
      }
      if (firmMode) submitData.openToAll = !!form.open_to_all;
      // Editing a firm position → PUT to the firm edit endpoint; otherwise create.
      let res;
      if (editData) {
        res = await axios.put(`/api/consulting/positions/${editData.id}`, submitData, { withCredentials: true });
      } else {
        const postUrl = publicMode ? '/api/public-job/submit' : firmMode ? '/api/consulting/positions' : companyMode ? '/api/company/positions' : '/candidate/pos';
        res = await axios.post(postUrl, submitData, { withCredentials: true });
      }
      console.log("Server Response:", res.data);
      if (publicMode && typeof publicMode.onPosted === 'function') { try { publicMode.onPosted(res.data); } catch (_) {} }
      if (companyMode && typeof companyMode.onPosted === 'function') { try { companyMode.onPosted(); } catch (_) {} }
      if (firmMode && typeof firmMode.onPosted === 'function') { try { firmMode.onPosted(); } catch (_) {} }
      // (openToAll is carried in submitData below via the ...form spread)
      
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
        position_tier: "",
        commission_type: "",
        client_questions: [],
        experience: "",
        pos_cat: "",
        skill_category: "",
        skill_sub_category: [],
        specialization: [],
        comp_view: "",
        m_have: "",
        g_have: "",
        compet: "",
        key_res: "",
        coach_ids: [],
        expert_ids: [],
        employment_type: "Full Time",
        no_of_positions: 1,
        work_mode: "On-site",
        min_exp: "",
        max_exp: "",
        min_rel_exp: "",
        team_handling: "No",
        req_education: "",
        pref_education: "",
        certifications: [],
        budget_type: "Fixed",
        variable_pay_pct: "",
        variable_criteria: "",
        variable_freq: "Annual",
        joining_bonus: "No",
        interview_mode: "Mixed",
        interview_rounds: [],
      });
      setStep(0);

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

  // Full city list = built-in India cities + any custom ones the user added.
  const allCityList = [...customCities, ...indiaCities];
  const filteredCities = allCityList.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );
  // Whether the typed search is a brand-new location not already in the list.
  const trimmedCity = citySearch.trim();
  const cityExists = trimmedCity && allCityList.some(c => c.toLowerCase() === trimmedCity.toLowerCase());
  const canAddCity = trimmedCity.length > 0 && !cityExists;

  // Add the typed location: no duplicates (case-insensitive); if it already
  // exists just select it, otherwise register it and select it.
  const addCustomCity = () => {
    const name = citySearch.trim();
    if (!name) return;
    const match = allCityList.find(c => c.toLowerCase() === name.toLowerCase());
    const cityToUse = match || name;
    if (!match) setCustomCities(prev => [...prev, name]);
    setForm(prev => ({
      ...prev,
      location: prev.location.some(c => c.toLowerCase() === cityToUse.toLowerCase())
        ? prev.location
        : [...prev.location, cityToUse],
    }));
    setCitySearch("");
  };

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

            {/* Wizard progress */}
            <div className="flex items-center gap-1 sm:gap-2 mb-6 overflow-x-auto pb-1">
              {WIZARD_STEPS.map((label, i) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => setStep(i)}
                  className={`flex-1 min-w-[110px] text-left px-2 pb-2 border-b-2 transition-all ${i <= step ? 'border-blue-600' : 'border-gray-200'}`}
                >
                  <span className={`text-[11px] font-bold ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>STEP {i + 1}</span>
                  <span className={`block text-xs sm:text-sm font-semibold ${i === step ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
                </button>
              ))}
            </div>

            {step === 0 && (<>
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

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Skill Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="skill_category"
                    value={form.skill_category}
                    onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    disabled={skillCatsLoading}
                    required
                  >
                    <option value="">{skillCatsLoading ? 'Loading…' : 'Select Skill Category'}</option>
                    {skillCategoryHierarchy.map(cat => (
                      <option key={cat.parent} value={cat.parent}>{cat.parent}</option>
                    ))}
                  </select>
                </div>

                {/* Skill Sub Category — children of selected parent (multi-select, max 2) */}
                {(() => {
                  const selectedCatObj = skillCategoryHierarchy.find(c => c.parent === form.skill_category);
                  const subCats = selectedCatObj ? (selectedCatObj.children || []) : [];
                  if (!form.skill_category) return null;
                  const atMax = form.skill_sub_category.length >= MAX_SUB_CATS;
                  return (
                    <div className="flex flex-col sm:col-span-2 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        Sub Skill Category <span className="text-red-500">*</span>
                        <span className="ml-2 font-normal text-gray-400">select up to 2 ({form.skill_sub_category.length}/2)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {subCats.map(ch => {
                          const on = form.skill_sub_category.includes(ch.name);
                          const disabled = !on && atMax;
                          return (
                            <button type="button" key={ch.name} onClick={() => toggleSubCat(ch.name)} disabled={disabled}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${on ? 'bg-blue-50 border-blue-500 text-blue-700' : disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {ch.name}
                            </button>
                          );
                        })}
                        {subCats.length === 0 && <span className="text-xs text-gray-400">No sub categories for this parent.</span>}
                      </div>
                    </div>
                  );
                })()}

                {/* Specialization — subChildren of the selected sub categories (multi-select, no limit) */}
                {(() => {
                  const selectedCatObj = skillCategoryHierarchy.find(c => c.parent === form.skill_category);
                  const specs = [...new Set(
                    (selectedCatObj?.children || [])
                      .filter(ch => form.skill_sub_category.includes(ch.name))
                      .flatMap(ch => ch.subChildren || [])
                  )];
                  if (form.skill_sub_category.length === 0 || specs.length === 0) return null;
                  return (
                    <div className="flex flex-col sm:col-span-2 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        Specialization <span className="text-red-500">*</span>
                        <span className="ml-2 font-normal text-gray-400">select any ({form.specialization.length} selected)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {specs.map(sc => {
                          const on = form.specialization.includes(sc);
                          return (
                            <button type="button" key={sc} onClick={() => toggleSpec(sc)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${on ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {sc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Role classification (new) */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Briefcase size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Role classification</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Employment type <span className="text-red-500">*</span></label>
                  <Seg name="employment_type" options={["Full Time", "Part Time", "Contractual", "Internship"]} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">No. of positions <span className="text-red-500">*</span></label>
                  <input type="number" min="1" name="no_of_positions" value={form.no_of_positions} onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Work mode <span className="text-red-500">*</span></label>
                  <Seg name="work_mode" options={["On-site", "Work from home", "Hybrid"]} />
                </div>
              </div>
            </div>
            </>)}

            {step === 1 && (<>
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
                  {(companyMode || publicMode) ? (
                    // Company/public poster: client is fixed to their company name.
                    <input type="text" name="client" value={form.client} readOnly
                      className="h-9 sm:h-11 border-2 border-gray-200 bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4 text-sm" />
                  ) : (
                    <select
                      name="client"
                      value={form.client}
                      onChange={handleChange}
                      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                      required
                      disabled={clientsLoading}
                    >
                      <option value="">{clientsLoading ? 'Loading clients...' : 'Select Client'}</option>
                      {clientList.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  )}
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

                {publicMode ? (
                  // Public poster: SPOC is assigned by the admin after approval.
                  <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Client SPOC</label>
                    <div className="h-9 sm:h-11 border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4 flex items-center text-sm text-gray-500">
                      Assigned by admin after approval
                    </div>
                  </div>
                ) : (
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
                )}

                {/* Consulting-firm "Open to all" — only when the admin has allowed it */}
                {firmMode && firmMode.canPostOpenToAll && (
                  <label className="sm:col-span-2 flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={!!form.open_to_all} onChange={(e) => setForm(prev => ({ ...prev, open_to_all: e.target.checked }))} className="w-5 h-5 accent-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-700">Open to all recruiters
                      <span className="block text-xs font-normal text-gray-500 mt-0.5">By default this position is visible only to your firm's recruiters. Check this to make it visible to all recruiters on the platform.</span>
                    </span>
                  </label>
                )}

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
                    getOptionLabel={(option) => {
                      if (!option?.name) return '';
                      const plan = (option.userType || 'free').toLowerCase() === 'paid' ? 'P' : 'F';
                      const assigned = option.positionCount || 0;
                      const accepted = option.acceptedCount || 0;
                      const extra = `${plan} - ${assigned}/${accepted}`;
                      return `${option.name} ${option.specialization ? `(${option.specialization})` : ''}  • ${extra}`;
                    }}
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

                {/* Position Tier — from the client's tier-based commission config */}
                {companyCommission.tiers.length > 0 && (
                  <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                      Position Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="position_tier"
                      value={form.position_tier}
                      onChange={(e) => {
                        const t = companyCommission.tiers.find(x => x.tier === e.target.value);
                        setForm(prev => ({
                          ...prev,
                          position_tier: e.target.value,
                          commison: t ? t.value : prev.commison,
                          commission_type: (t && t.type) || companyCommission.type || 'percentage',
                        }));
                      }}
                      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white"
                    >
                      <option value="">Select tier</option>
                      {companyCommission.tiers.map(t => (
                        <option key={t.tier} value={t.tier}>
                          {t.tier} — {(t.type || companyCommission.type) === 'fixed' ? `Rs. ${Number(t.value).toLocaleString('en-IN')}` : `${t.value}%`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    Commission {form.commission_type === 'fixed' ? '(Rs.)' : '(%)'} <span className="text-red-500">*</span>
                    {overviewLoading && <span className="text-xs text-blue-500 animate-pulse">Fetching...</span>}
                    {form.position_tier && !overviewLoading && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">From tier: {form.position_tier}</span>}
                    {!form.position_tier && overviewAutoFilled && !overviewLoading && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">Auto-filled</span>}
                  </label>
                  <div className="relative">
                    {form.commission_type === 'fixed' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rs.</span>
                    )}
                    <input
                      type="number"
                      name="commison"
                      value={form.commison}
                      onChange={handleChange}
                      placeholder={form.commission_type === 'fixed' ? 'e.g., 50000' : 'e.g., 10'}
                      step="0.01"
                      className={`w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl ${form.commission_type === 'fixed' ? 'pl-10 sm:pl-11' : 'px-3 sm:px-4'} pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm`}
                      required
                    />
                    {form.commission_type !== 'fixed' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                    )}
                  </div>
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
                        {form.commission_type === 'fixed'
                          ? `Rs. ${Number(form.commison).toLocaleString('en-IN')} (Fixed)`
                          : `₹${((parseFloat(form.ctcStart) * parseFloat(form.commison)) / 100).toLocaleString('en-IN')} (${form.commison}%)`}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Compensation structure (new) */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <IndianRupee size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Budget & variable pay</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Budget type</label>
                  <Seg name="budget_type" options={["Fixed", "Negotiable", "Open"]} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Variable pay (%)</label>
                  <input type="number" min="0" name="variable_pay_pct" value={form.variable_pay_pct} onChange={handleChange} placeholder="e.g. 10"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Variable payout frequency</label>
                  <select name="variable_freq" value={form.variable_freq} onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm">
                    {["Monthly", "Quarterly", "Half-yearly", "Annual", "Partially monthly", "Partially half-yearly"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Variable payout criteria</label>
                  <input type="text" name="variable_criteria" value={form.variable_criteria} onChange={handleChange} placeholder="e.g. Individual + company performance"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Joining bonus?</label>
                  <Seg name="joining_bonus" options={["Yes", "No"]} />
                </div>
              </div>
            </div>
            </>)}

            {step === 2 && (<>
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
                    getOptionLabel={(option) => {
                      if (!option?.name) return '';
                      const plan = (option.userType || 'free').toLowerCase() === 'paid' ? 'P' : 'F';
                      const assigned = option.positionCount || 0;
                      const accepted = option.acceptedCount || 0;
                      const extra = `${plan} - ${assigned}/${accepted}`;
                      return `${option.name} ${option.specialization ? `(${option.specialization})` : ''}  • ${extra}`;
                    }}
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

            {/* Experience detail + education (new) */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Award size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Experience & education detail</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Minimum experience (yrs) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" name="min_exp" value={form.min_exp} onChange={handleChange} placeholder="e.g. 4"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Maximum experience (yrs)</label>
                  <input type="number" min="0" name="max_exp" value={form.max_exp} onChange={handleChange} placeholder="e.g. 8"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Min relevant experience (yrs)</label>
                  <input type="number" min="0" name="min_rel_exp" value={form.min_rel_exp} onChange={handleChange} placeholder="e.g. 3"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col sm:col-span-3">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Team handling experience required?</label>
                  <Seg name="team_handling" options={["Yes", "No"]} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Required education <span className="text-red-500">*</span></label>
                  <input type="text" name="req_education" value={form.req_education} onChange={handleChange} placeholder="e.g. B.Tech / B.E."
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Preferred education</label>
                  <input type="text" name="pref_education" value={form.pref_education} onChange={handleChange} placeholder="e.g. M.Tech (optional)"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col sm:col-span-1">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Mandatory certifications</label>
                  <input type="text" value={certInput} onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                    placeholder="Type & press Enter"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
              </div>
              {form.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.certifications.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {c}
                      <button type="button" onClick={() => removeCert(i)} className="text-blue-400 hover:text-blue-700"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            </>)}

            {step === 3 && (<>
            {/* Location */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <MapPin size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Location <span className="text-red-500">*</span></h4>
              </div>
              
              {/* Search Box */}
              <div className="mb-3 sm:mb-4">
                <div className="relative">
                  <Search size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search or add a city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (canAddCity) addCustomCity(); } }}
                    className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  />
                </div>
                {/* Add-new-city option when the typed city isn't in the list */}
                {canAddCity && (
                  <button
                    type="button"
                    onClick={addCustomCity}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all"
                  >
                    <Plus size={15} /> Add “{trimmedCity}” as a new city
                  </button>
                )}
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
                  <RichTextEditor value={form.key_res} onChange={(html) => setForm(p => ({ ...p, key_res: html }))} placeholder="List key responsibilities…" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Must Have Skills <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={form.m_have} onChange={(html) => setForm(p => ({ ...p, m_have: html }))} placeholder="Required skills…" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Good to Have Skills <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={form.g_have} onChange={(html) => setForm(p => ({ ...p, g_have: html }))} placeholder="Additional skills…" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Competencies <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={form.compet} onChange={(html) => setForm(p => ({ ...p, compet: html }))} placeholder="Required competencies…" />
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
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    Company Overview <span className="text-red-500">*</span>
                    {overviewLoading && <span className="text-xs text-blue-500 animate-pulse">Fetching...</span>}
                    {overviewAutoFilled && !overviewLoading && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">Auto-filled</span>}
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
                  <RichTextEditor value={form.job_desc} onChange={(html) => setForm(p => ({ ...p, job_desc: html }))} placeholder="Detailed job description…" minHeight={160} />
                </div>

              </div>
            </div>

            </>)}

            {step === 4 && (<>
            {/* Recruitment process (new) */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                  <h4 className="text-base sm:text-lg font-bold text-gray-900">Recruitment process</h4>
                </div>
                <span className="text-xs text-gray-500">Rounds: <b className="text-gray-800">{form.interview_rounds.length}</b></span>
              </div>
              <div className="flex flex-col mb-4">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Overall interview mode</label>
                <Seg name="interview_mode" options={["Virtual", "Face-to-face", "Mixed"]} />
              </div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 block">Interview rounds</label>
              {form.interview_rounds.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-semibold">Round {i + 1}</span>
                    <button type="button" onClick={() => removeRound(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={r.name} onChange={(e) => updateRound(i, 'name', e.target.value)} placeholder="Round name (e.g. Technical)"
                      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                    <input type="text" value={r.duration} onChange={(e) => updateRound(i, 'duration', e.target.value)} placeholder="Duration (e.g. 60 min)"
                      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                    <select value={r.mode} onChange={(e) => updateRound(i, 'mode', e.target.value)}
                      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm">
                      {["AI based", "Virtual", "Face-to-face"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {form.interview_rounds.length === 0 && (
                <p className="text-sm text-gray-400 mb-3">No rounds added yet — add the interview rounds for this role.</p>
              )}
              <button type="button" onClick={addRound}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all text-sm font-semibold">
                <PlusCircle size={16} /> Add round
              </button>
            </div>
            </>)}

            {step === 5 && (<>
            {/* Client requirements — company questions + position-specific ones */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <FileText size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Client requirements</h4>
              </div>

              {/* Questions from the company profile (read-only here) */}
              <div className="bg-blue-50/60 border-2 border-blue-100 rounded-xl p-4 mb-5">
                <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">
                  From company profile{form.client ? ` — ${form.client}` : ''}
                </p>
                <p className="text-xs text-gray-500 mb-3">These were added when the company was created and apply to all its positions. Edit them from SuperAdmin → All Companies.</p>
                <QuestionsList questions={companyQuestions}
                  emptyText={form.client ? 'No questions set on this company yet.' : 'Select a client in "Client & pay" to see its questions.'} />
              </div>

              {/* Position-specific questions */}
              <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">Additional questions for this position</p>
              <p className="text-xs text-gray-500 mb-3">Add position-specific requirements — subjective, yes/no, or multiple select (with options).</p>
              <QuestionsEditor
                questions={form.client_questions}
                onChange={(qs) => setForm(prev => ({ ...prev, client_questions: qs }))}
              />
            </div>
            </>)}

            {step === 6 && (<>
            {/* Candidate Instructions — shown to candidates before the company overview */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Candidate Instructions</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Instructions shown to candidates before the company overview (on the apply and shared-position pages).
                {form.client ? ' Pre-filled from the company profile — edit for this position if needed.' : ''}
              </p>
              <RichTextEditor
                value={form.candidate_instructions}
                onChange={(html) => setForm(prev => ({ ...prev, candidate_instructions: html }))}
                placeholder="e.g. Please keep your updated resume and ID proof ready, be available for a call between 10am–6pm…"
                minHeight={160}
              />
            </div>
            </>)}

            {/* Wizard navigation */}
            <div className="flex justify-between items-center gap-3 pt-4 sm:pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base"
                >
                  Reset
                </button>
                {step < WIZARD_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(s => Math.min(WIZARD_STEPS.length - 1, s + 1))}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submit}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {submit ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={18} className="sm:w-5 sm:h-5" />
                        {editData ? 'Save Changes' : 'Create Position'}
                      </>
                    )}
                  </button>
                )}
              </div>
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
