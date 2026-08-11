import React, { useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const indiaStatesAndCities = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Tawang", "Ziro", "Roing", "Pasighat"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"
  ],
  "Bihar": [
    "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"
  ],
  "Chhattisgarh": [
    "Raipur", "Bilaspur", "Bhilai", "Korba", "Durg"
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"
  ],
  "Himachal Pradesh": [
    "Shimla", "Manali", "Dharamshala", "Kullu", "Solan"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belagavi"
  ],
  "Kerala": [
    "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"
  ],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"
  ],
  "Rajasthan": [
    "Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer"
  ],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Karimnagar"
  ],
  "Tripura": ["Agartala"],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Rishikesh", "Haldwani"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Noida", "Ghaziabad", "Kanpur", "Agra", "Varanasi"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"
  ],
  "Andaman & Nicobar": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Delhi": ["New Delhi"],
  "Jammu & Kashmir": ["Srinagar", "Jammu"],
  "Ladakh": ["Leh"],
  "Puducherry": ["Puducherry"]
};

const Dash_Form = ({ pos_id, clientspoc, pos_name, client, hr_name, prefill = null, onSubmitted = null }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [sameLocation, setSameLocation] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);
  const [accessCheckLoading, setAccessCheckLoading] = useState(false);
  const [positionStatus, setPositionStatus] = useState(null);
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [emailLookupMsg, setEmailLookupMsg] = useState(''); // '' | 'found' | 'not_found'
  const [positionValidationError, setPositionValidationError] = useState(null);
  const [photoRequired, setPhotoRequired] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  // Client-requirement questions — company-level (from Company_Overview) + this
  // position's own, shown so recruiters see them while submitting a candidate.
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [positionQuestions, setPositionQuestions] = useState([]);
  // Recruiter's answers to the merged [...companyQuestions, ...positionQuestions]
  // list, keyed by index. subjective → string, yesno → 'Yes'|'No', multiselect → string[].
  const [clientAnswers, setClientAnswers] = useState({});
  const clientRequirements = [...companyQuestions, ...positionQuestions];
  const setClientAnswer = (i, val) => setClientAnswers(a => ({ ...a, [i]: val }));
  const toggleClientMultiAnswer = (i, opt) => setClientAnswers(a => {
    const cur = Array.isArray(a[i]) ? a[i] : [];
    return { ...a, [i]: cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt] };
  });

  const defaultData = {
    pos_id: pos_id || "",
    pos_name: pos_name || "",
    hr_name: hr_name || "",
    clientspoc: clientspoc || "",
    candidate: "",
    client: client || "",
    current_ctc: "",
    exp_ctc: "",
    curr_state:"",
    curr_loc: "",
    pref_state:"",
    pref_loc: "",
    dob: "",
    jr_number: "",
    pan_number: "",
    rel_exp: "",
    total_exp:"",
    offer_hand: "",
    offer_amt: "",
    cv_data: "",
    curr_emp: "",
    rh_id: "",
    highest_education: "",
    skill_type: "",
    rel_exp_year:"",
    rel_exp_months:"",
    total_exp_year:"",
    total_exp_months:"",
    self_rate:"",
    notice_period:"",
    last_day:"",
    tech_category: "",
    tech_subcategory: "",
    tech_skill: [],
    tech_exp: [],
    nontech_category: "",
    nontech_subcategory: "",
    nontech_skill: [],
    nontech_exp: [],
    mob: "",
    emails: ""
  };



  const generateCTCOptions = () => {
    const options = [];
    for (let i = 1; i <= 99; i++) {
      options.push(`${i} LPA`);
    }
    return options;
  };

  const generateYears = () => Array.from({ length: 31 }, (_, i) => i);
  const generateMonths = () => Array.from({ length: 12 }, (_, i) => i);


  const [candi, setCandi] = useState(defaultData);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dupError, setDupError] = useState("");
  const [autoFilled, setAutoFilled] = useState("");

  // ── Skill selection driven by the skill_categories hierarchy ────────────────
  // The PARENT category comes from the position itself, so it is shown read-only.
  // The recruiter picks up to 2 children (limited to the children the position
  // selected) and up to 2 sub-children under each of those.
  const MAX_CHILDREN = 2;
  const MAX_SUBS_PER_CHILD = 2;

  const [skillHierarchy, setSkillHierarchy] = useState([]);   // [{ parent, children:[{name, subChildren:[]}] }]
  const [posSkill, setPosSkill] = useState({ parent: "", children: [] });  // from the position
  const [selChildren, setSelChildren] = useState([]);          // e.g. ['Development','Cloud']
  const [selSubs, setSelSubs] = useState({});                  // { [child]: string[] }
  const [subExp, setSubExp] = useState({});                    // { 'child||sub': 'experience' }

  // Load the category hierarchy (same source the position wizard uses)
  useEffect(() => {
    axios.get('/candidate/skill-categories-hierarchical')
      .then(res => { if (res.data?.success) setSkillHierarchy(res.data.categories || []); })
      .catch(err => console.error('Failed to fetch skill categories:', err));
  }, []);

  // Load this position's parent category + the children it was created with
  useEffect(() => {
    if (!pos_id) return;
    let live = true;
    axios.get(`/candidate/position/${pos_id}`)
      .then(res => {
        if (!live) return;
        const p = res.data || {};
        const toList = (v) => Array.isArray(v)
          ? v.map(x => String(x).trim()).filter(Boolean)
          : String(v || '').split(',').map(x => x.trim()).filter(Boolean);
        setPosSkill({ parent: p.skill_category || '', children: toList(p.skill_sub_category) });
      })
      .catch(() => {});
    return () => { live = false; };
  }, [pos_id]);

  // Child options = the position's children, resolved against the hierarchy so we
  // also get each child's subChildren list.
  const parentObj = skillHierarchy.find(c => c.parent === posSkill.parent);
  const childOptions = (parentObj?.children || []).filter(ch =>
    posSkill.children.some(pc => pc.toLowerCase() === String(ch.name || '').toLowerCase())
  );

  const toggleChild = (childName) => {
    setSelChildren(prev => {
      if (prev.includes(childName)) {
        // Deselecting a child clears its sub-children too
        setSelSubs(s => { const n = { ...s }; delete n[childName]; return n; });
        setSubExp(e => {
          const n = { ...e };
          Object.keys(n).forEach(k => { if (k.startsWith(childName + '||')) delete n[k]; });
          return n;
        });
        return prev.filter(c => c !== childName);
      }
      if (prev.length >= MAX_CHILDREN) {
        alert(`You can select up to ${MAX_CHILDREN} sub-categories only`);
        return prev;
      }
      return [...prev, childName];
    });
  };

  const toggleSub = (childName, subName) => {
    setSelSubs(prev => {
      const cur = prev[childName] || [];
      if (cur.includes(subName)) {
        setSubExp(e => { const n = { ...e }; delete n[`${childName}||${subName}`]; return n; });
        return { ...prev, [childName]: cur.filter(s => s !== subName) };
      }
      if (cur.length >= MAX_SUBS_PER_CHILD) {
        alert(`You can select up to ${MAX_SUBS_PER_CHILD} skills under "${childName}"`);
        return prev;
      }
      return { ...prev, [childName]: [...cur, subName] };
    });
  };

  // Flat list of the chosen sub-children, in child order — the source for the
  // experience inputs and for the tech_skill / tech_exp payload arrays.
  const selectedSubList = selChildren.flatMap(ch => (selSubs[ch] || []).map(sub => ({ child: ch, sub })));

  // Mirror the selections onto the candidate record so the existing submit
  // payload (tech_category / tech_subcategory / tech_skill / tech_exp) keeps working.
  useEffect(() => {
    setCandi(c => ({
      ...c,
      skill_type: 'tech',
      tech_category: posSkill.parent || '',
      tech_subcategory: selChildren.join(', '),
      tech_skill: selectedSubList.map(x => x.sub),
      tech_exp: selectedSubList.map(x => subExp[`${x.child}||${x.sub}`] || ''),
      nontech_category: '',
      nontech_subcategory: '',
      nontech_skill: [],
      nontech_exp: [],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posSkill.parent, selChildren, selSubs, subExp]);

  // Live duplicate check — flags if a candidate with the same email, phone or
  // PAN already exists in the system (runs on blur of those fields).
  const checkDuplicate = async () => {
    const emails = (candi.emails || '').trim().toLowerCase();
    const mob = String(candi.mob || '').trim();
    const pan_number = String(candi.pan_number || '').trim();
    if (!emails && !mob && !pan_number) { setDupError(''); setAutoFilled(''); return; }
    try {
      const res = await axios.post('/addit/data/check',
        { emails, mob, pan_number, pos_id }, { withCredentials: true });
      const d = res.data || {};

      // A clash on THIS position is the real blocker — the same candidate existing
      // elsewhere is expected (e.g. one they referred) and is what we autofill from.
      if (d.duplicateOnPosition) {
        const info = d.duplicateInfo || {};
        setDupError(`Already submitted for this position by ${info.submittedBy || 'another user'}${info.status ? ` (status: ${info.status})` : ''}. You cannot submit the same candidate again.`);
        setAutoFilled('');
        return;
      }
      setDupError('');

      // Known candidate → prefill everything we already have, leaving whatever the
      // user has typed untouched. They just complete the remaining fields.
      if (d.match) {
        const m = d.match;
        const filled = [];
        setCandi(prev => {
          const next = { ...prev };
          Object.entries(m).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined) return;
            if (k === 'source') return;
            const cur = next[k];
            const isEmpty = cur === '' || cur === null || cur === undefined ||
              (Array.isArray(cur) && cur.length === 0);
            if (isEmpty) { next[k] = v; filled.push(k); }
          });
          return next;
        });
        if (filled.length) {
          setAutoFilled(m.source === 'referred'
            ? 'Details auto-filled from the candidate you referred. Please complete the remaining fields.'
            : 'Details auto-filled from this candidate’s existing record. Please complete the remaining fields.');
        }
      } else {
        setAutoFilled('');
      }
    } catch { /* ignore network errors for the live check */ }
  };


  const handleCategoryChange = (e) => {
    setCandi({
      ...candi,
      tech_category: e.target.value,
      tech_subcategory: "",
      tech_skill: [],
      tech_exp: []
    });
  };

  const handleSubcategoryChange = (e) => {
    setCandi({
      ...candi,
      tech_subcategory: e.target.value,
      tech_skill: [],
      tech_exp: []
    });
  };

  const handleSkillSelect = (e) => {
    const selectedSkill = e.target.value;

    if (!selectedSkill) return;

    if (candi.tech_skill.length >= 10) {
      alert("You can select up to 10 skills only");
      return;
    }

    if (!candi.tech_skill.includes(selectedSkill)) {
      setCandi({
        ...candi,
        tech_skill: [...candi.tech_skill, selectedSkill],
        tech_exp: [...candi.tech_exp, ""]
      });
    }
  };

  const updateSkillExp = (index, value) => {
    const newExp = [...candi.tech_exp];
    newExp[index] = value;

    setCandi({
      ...candi,
      tech_exp: newExp
    });
  };

  const removeSkill = (index) => {
    const updatedSkills = [...candi.tech_skill];
    const updatedExp = [...candi.tech_exp];

    updatedSkills.splice(index, 1);
    updatedExp.splice(index, 1);

    setCandi({
      ...candi,
      tech_skill: updatedSkills,
      tech_exp: updatedExp
    });
  };

  // Upload a file via the backend (base64 JSON) instead of the Firebase Storage
  // client SDK. Recruiters signed in with the backend JWT (not Firebase Auth)
  // can't write to Storage directly — the server-side upload works for everyone.
  const uploadViaBackend = async (file, prefix = '') => {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // strip data:...;base64,
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await axios.post('/api/direct-apply/upload-cv', {
      filename: `${prefix}${file.name}`,
      contentType: file.type || 'application/octet-stream',
      base64,
    });
    if (!res.data?.success || !res.data.url) throw new Error(res.data?.message || 'Upload failed');
    return res.data.url;
  };

  const uploadCV = (file) => uploadViaBackend(file);
  const uploadPhoto = (file) => uploadViaBackend(file, 'photo_');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cv_data") {
      setCandi({ ...candi, cv_data: e.target.files[0] });
    } else {
      setCandi({ ...candi, [name]: value });
    }
    // Reset lookup message when email is edited
    if (name === "emails") setEmailLookupMsg('');
  };

  // Auto-fill form from candidate_db when email is entered
  const fetchCandidateByEmail = async (email) => {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    setEmailLookupLoading(true);
    setEmailLookupMsg('');
    try {
      const res = await axios.get(`/addit/lookup-by-email?email=${encodeURIComponent(trimmed)}`, { withCredentials: true });
      if (res.data.found && res.data.candidate) {
        const c = res.data.candidate;
        // Parse total_exp / rel_exp strings like "3 yr 2 mo" back into year/month parts
        const parseExp = (str) => {
          const yrMatch  = (str || '').match(/(\d+)\s*yr/i);
          const moMatch  = (str || '').match(/(\d+)\s*mo/i);
          return { year: yrMatch ? yrMatch[1] : '', months: moMatch ? moMatch[1] : '' };
        };
        const totalExp = parseExp(c.total_exp);
        const relExp   = parseExp(c.rel_exp);
        setCandi(prev => ({
          ...prev,
          candidate:        c.candidate        || prev.candidate,
          mob:              c.mob              || prev.mob,
          dob:              c.dob              || prev.dob,
          curr_emp:         c.curr_emp         || prev.curr_emp,
          highest_education: c.highest_education || prev.highest_education,
          current_ctc:      c.current_ctc      || prev.current_ctc,
          exp_ctc:          c.exp_ctc          || prev.exp_ctc,
          total_exp_year:   totalExp.year      || prev.total_exp_year,
          total_exp_months: totalExp.months    || prev.total_exp_months,
          rel_exp_year:     relExp.year        || prev.rel_exp_year,
          rel_exp_months:   relExp.months      || prev.rel_exp_months,
          notice_period:    c.notice_period    || prev.notice_period,
          curr_state:       c.curr_state       || prev.curr_state,
          curr_loc:         c.curr_loc         || prev.curr_loc,
          pref_state:       c.pref_state       || prev.pref_state,
          pref_loc:         c.pref_loc         || prev.pref_loc,
          skill_type:       c.skill_type       || prev.skill_type,
          tech_category:    c.tech_category    || prev.tech_category,
          tech_subcategory: c.tech_subcategory || prev.tech_subcategory,
          tech_skill:       c.tech_skill?.length ? c.tech_skill : prev.tech_skill,
          tech_exp:         c.tech_exp?.length  ? c.tech_exp  : prev.tech_exp,
          nontech_category:    c.nontech_category    || prev.nontech_category,
          nontech_subcategory: c.nontech_subcategory || prev.nontech_subcategory,
          nontech_skill:    c.nontech_skill?.length ? c.nontech_skill : prev.nontech_skill,
          nontech_exp:      c.nontech_exp?.length  ? c.nontech_exp  : prev.nontech_exp,
          self_rate:        c.self_rate        || prev.self_rate,
          pan_number:       c.pan_number       || prev.pan_number,
          cv_data:          c.cv_data          || prev.cv_data,
        }));
        setEmailLookupMsg('found');
      } else {
        setEmailLookupMsg('not_found');
      }
    } catch {
      setEmailLookupMsg('not_found');
    } finally {
      setEmailLookupLoading(false);
    }
  };

  // Prefill the form from an existing candidate (used by the "View details"
  // modal so the form is exactly the submission form, pre-populated).
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!prefill || prefilledRef.current) return;
    prefilledRef.current = true;
    const c = prefill;
    const parseExp = (str) => {
      const y = (String(str || '').match(/(\d+)\s*(?:y|yr|year)/i) || [])[1] || '';
      const m = (String(str || '').match(/(\d+)\s*(?:m|mo|month)/i) || [])[1] || '';
      return { year: y, months: m };
    };
    const totalExp = parseExp(c.total_exp);
    const relExp = parseExp(c.rel_exp);
    setCandi(prev => ({
      ...prev,
      candidate: c.candidate || prev.candidate,
      emails: c.emails || prev.emails,
      mob: c.mob || prev.mob,
      dob: c.dob || prev.dob,
      curr_emp: c.curr_emp || prev.curr_emp,
      highest_education: c.highest_education || prev.highest_education,
      current_ctc: c.current_ctc || prev.current_ctc,
      exp_ctc: c.exp_ctc || prev.exp_ctc,
      total_exp_year: totalExp.year || prev.total_exp_year,
      total_exp_months: totalExp.months || prev.total_exp_months,
      rel_exp_year: relExp.year || prev.rel_exp_year,
      rel_exp_months: relExp.months || prev.rel_exp_months,
      notice_period: c.notice_period || prev.notice_period,
      last_day: c.last_day || prev.last_day,
      offer_hand: c.offer_hand || prev.offer_hand,
      offer_amt: c.offer_amt || prev.offer_amt,
      self_rate: c.self_rate || prev.self_rate,
      curr_state: c.curr_state || prev.curr_state,
      curr_loc: c.curr_loc || prev.curr_loc,
      pref_state: c.pref_state || prev.pref_state,
      pref_loc: c.pref_loc || prev.pref_loc,
      skill_type: c.skill_type || prev.skill_type,
      tech_category: c.tech_category || prev.tech_category,
      tech_subcategory: c.tech_subcategory || prev.tech_subcategory,
      tech_skill: c.tech_skill?.length ? c.tech_skill : (c.skills?.length ? c.skills : prev.tech_skill),
      tech_exp: c.tech_exp?.length ? c.tech_exp : prev.tech_exp,
      nontech_category: c.nontech_category || prev.nontech_category,
      nontech_subcategory: c.nontech_subcategory || prev.nontech_subcategory,
      nontech_skill: c.nontech_skill?.length ? c.nontech_skill : prev.nontech_skill,
      nontech_exp: c.nontech_exp?.length ? c.nontech_exp : prev.nontech_exp,
      pan_number: c.pan_number || prev.pan_number,
      jr_number: c.jr_number || prev.jr_number,
      rh_id: c.rh_id || prev.rh_id,
      cv_data: c.cv_data || c.cv_url || prev.cv_data,
    }));

    // Prefilled fields never fire a blur, so run the duplicate check explicitly.
    // This is what surfaces the "already submitted for this position" banner when
    // a referred resume has already been used on this position by someone else.
    const emails = (c.emails || '').trim().toLowerCase();
    const mob = String(c.mob || '').trim();
    const pan_number = String(c.pan_number || '').trim();
    if (emails || mob || pan_number) {
      axios.post('/addit/data/check', { emails, mob, pan_number, pos_id }, { withCredentials: true })
        .then(({ data: d }) => {
          if (d?.duplicateOnPosition) {
            const info = d.duplicateInfo || {};
            setDupError(`Already submitted for this position by ${info.submittedBy || 'another user'}${info.status ? ` (status: ${info.status})` : ''}. You cannot submit the same candidate again.`);
          }
        })
        .catch(() => {});
    }
  }, [prefill]);

  useEffect(() => {
  if (sameLocation) {
    setCandi((prev) => ({
      ...prev,
      pref_state: prev.curr_state,
      pref_loc: prev.curr_loc,
    }));
  }
 }, [sameLocation, candi.curr_state, candi.curr_loc]);


  useEffect(() => {
    const auth = getAuth();
    let unsubscribe;
    let timeoutId;

    // Set a timeout to prevent infinite loading on mobile
    // If auth state doesn't resolve in 5 seconds, assume there's an issue
    timeoutId = setTimeout(() => {
      console.warn("Firebase auth check timed out after 5 seconds");
      setAuthTimeout(true);
      setLoading(false);
      
      // Check if we have a backend session as fallback
      checkBackendAuth();
    }, 5000);

    // Listen for Firebase auth state changes
    unsubscribe = onAuthStateChanged(auth, 
      (firebaseUser) => {
        console.log("Firebase auth state changed:", firebaseUser ? "User logged in" : "No user");
        clearTimeout(timeoutId);
        
        if (firebaseUser) {
          // Firebase user exists
          setUser(firebaseUser);
          setLoading(false);
          setAuthTimeout(false);
          setAuthError(null);
        } else {
          // No Firebase user, check backend session
          console.log("No Firebase user detected, checking backend session...");
          checkBackendAuth().finally(() => {
            setLoading(false);
          });
        }
      },
      (error) => {
        console.error("Firebase auth error:", error);
        clearTimeout(timeoutId);
        setAuthError(error.message);
        setLoading(false);
        
        // Try backend auth as fallback
        checkBackendAuth();
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Fallback: Check backend session auth if Firebase auth fails
  const checkBackendAuth = async () => {
    try {
      const response = await axios.get("/auth/check", { withCredentials: true });
      console.log("Backend auth check response:", response.data);
      
      if (response.data?.user) {
        console.log("✅ Backend auth verified, user is logged in via session");
        // Create a mock user object to enable the form
        const mockUser = { 
          uid: response.data.user.uid || response.data.user._id || "backend-user",
          email: response.data.user.email || response.data.user.emails,
          displayName: response.data.user.name,
          isBackendAuth: true // Flag to identify this is backend auth
        };
        setUser(mockUser);
        setAuthError(null);
        setAuthTimeout(false);
        console.log("Mock user object created:", mockUser);
      } else {
        console.warn("Backend auth check returned no user data");
      }
    } catch (error) {
      console.error("Backend auth check failed:", error.response?.status, error.message);
      if (error.response?.status === 401) {
        console.log("User is not logged in (401 from backend)");
      }
    }
  };

  // Retry auth check function for mobile users
  const retryAuthCheck = () => {
    setLoading(true);
    setAuthTimeout(false);
    setAuthError(null);
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
    } else {
      // Force a token refresh
      checkBackendAuth();
      setLoading(false);
    }
  };

  // Check if user has access to submit candidate for this position
  const checkAccessStatus = async (userEmail) => {
    if (!pos_id || !userEmail) return;

    setAccessCheckLoading(true);
    try {
      const response = await axios.get(`/api/position-access/check/${pos_id}`, {
        withCredentials: true
      });
      const accessData = response.data.data;
      setAccessStatus(accessData);
      console.log("Access status:", accessData);

      // Handle different access statuses
      if (accessData.status === 'rejected') {
        setPositionValidationError(`Your access request for this position was rejected by the ClientSPOC. Please contact the ClientSPOC if you believe this is an error.`);
      } else if (accessData.status === 'waitlist') {
        setPositionValidationError(`You are on the waitlist for this position. Please wait for ClientSPOC approval.`);
      } else if (accessData.status === 'pending') {
        setPositionValidationError(`Your access request is pending approval from the ClientSPOC.`);
      } else if (accessData.status === 'expired') {
        setPositionValidationError(`Your access to this position has expired. Please request access again.`);
      }
    } catch (error) {
      console.error("Error checking access status:", error);
      setAccessStatus({ hasAccess: false, status: 'unknown' });
    } finally {
      setAccessCheckLoading(false);
    }
  };

  // Check if position is active and can accept candidates
  const checkPositionStatus = async () => {
    if (!pos_id) return;

    try {
      const response = await axios.get(`/api/position/position/${pos_id}`, {
        withCredentials: true
      });

      if (response.data) {
        const position = response.data;
        setPositionStatus(position.status);

        // Check if position is in a closed/rejected/pending state
        const closedStatuses = ['rejected', 'pending', 'hold', 'closed', 'on hold', 'closed - filled', 'closed - cancelled'];
        const statusLower = (position.status || '').toLowerCase();
        const isClosed = closedStatuses.some(status => statusLower.includes(status.toLowerCase()));

        if (isClosed) {
          setPositionValidationError(`This position is currently "${position.status}" and cannot accept new candidates.`);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking position status:", error);
      // Don't block the form on position status check error - backend will validate on submit
    }

    // Also check if the recruiter has a rejected access request for this position
    try {
      const requestsResponse = await axios.get('/api/position-access/recruiter', {
        withCredentials: true
      });

      const requests = requestsResponse.data.data || [];
      const relevantRequest = requests.find(
        req => req.positionId === pos_id && req.status === 'rejected'
      );

      if (relevantRequest) {
        setPositionValidationError(`Your access request for this position was rejected by the ClientSPOC. Please contact the ClientSPOC if you believe this is an error.`);
      }
    } catch (requestError) {
      console.error("Error checking access requests:", requestError);
      // Don't block the form on access request check error - backend will validate on submit
    }
  };

  // Check access status and position status after auth is complete
  useEffect(() => {
    if (user && pos_id) {
      checkAccessStatus(user.email || user.emails);
      checkPositionStatus();
    }
  }, [user, pos_id]);

  // Fetch company settings (e.g. photoRequired) when the client/company is known
  useEffect(() => {
    if (!client) return;
    axios.get(`/clientspoc/company-settings?name=${encodeURIComponent(client)}`)
      .then(res => setPhotoRequired(res.data?.photoRequired === true))
      .catch(() => setPhotoRequired(false));
  }, [client]);

  // Fetch the company's client-requirement questions.
  useEffect(() => {
    if (!client) { setCompanyQuestions([]); return; }
    let live = true;
    axios.get(`/addit/overview/${encodeURIComponent(client)}`)
      .then(res => { if (live && res.data?.found) setCompanyQuestions(Array.isArray(res.data.data.questions) ? res.data.data.questions : []); })
      .catch(() => {});
    return () => { live = false; };
  }, [client]);

  // Fetch this position's own client-requirement questions.
  useEffect(() => {
    if (!pos_id) { setPositionQuestions([]); return; }
    let live = true;
    axios.get(`/candidate/position/${pos_id}`)
      .then(res => { if (live) setPositionQuestions(Array.isArray(res.data?.client_questions) ? res.data.client_questions : []); })
      .catch(() => {});
    return () => { live = false; };
  }, [pos_id]);

  


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submit triggered, checking user state...");
    console.log("Current user object:", user);
    console.log("User exists:", !!user);
    const relTotalMonths =
    Number(candi.rel_exp_year) * 12 +
    Number(candi.rel_exp_months);

    const totalMonths =
    Number(candi.total_exp_year) * 12 +
    Number(candi.total_exp_months);

   if (relTotalMonths > totalMonths) {
    alert("Relevant experience cannot be greater than total experience");
    setSubmitting(false);
    return;
   }

    
    // Double-check backend auth if user is null
    if (!user) {
      console.log("No user found, checking backend session one more time...");
      setSubmitting(true);
      
      try {
        const response = await axios.get("/auth/check", { withCredentials: true });
        if (response.data?.user) {
          console.log("Backend session found during submit, creating user object...");
          const mockUser = { 
            uid: response.data.user.uid || response.data.user._id || "backend-user",
            email: response.data.user.email || response.data.user.emails,
            displayName: response.data.user.name,
            isBackendAuth: true
          };
          setUser(mockUser);
          // Continue with submission using this user
          await submitForm(e, mockUser);
          return;
        }
      } catch (error) {
        console.error("Backend auth check failed during submit:", error);
      }
      
      setSubmitting(false);
      alert("You must be logged in to submit this form. Please log in and try again.");
      return;
    }

    // Prevent double submission
    if (submitting) return;

    setSubmitting(true);
    await submitForm(e, user);
  };

  const submitForm = async (e, currentUser) => {
    try {
      console.log("Starting form submission with user:", currentUser);
      
      // Only try to get Firebase token if user has the getIdToken method (real Firebase user)
      // If user is from backend auth fallback, skip this step
      if (currentUser.getIdToken && typeof currentUser.getIdToken === 'function') {
        try {
          const token = await currentUser.getIdToken(true);
          console.log("Firebase token refreshed successfully");
        } catch (tokenError) {
          console.warn("Failed to refresh Firebase token, continuing with backend auth:", tokenError);
        }
      } else {
        console.log("Using backend session authentication (no Firebase token)");
      }
      
      // Clear previous errors
      setEmailError("");
      setPhoneError("");

      // PAN number and resume are mandatory
      if (!String(candi.pan_number || '').trim()) {
        setDupError("PAN number is required.");
        alert("PAN number is required.");
        setSubmitting(false);
        return;
      }
      if (!candi.cv_data) {
        alert("Please attach the candidate's resume — it is required.");
        setSubmitting(false);
        return;
      }

      // Check for duplicate email/phone
      // Note: axios interceptor automatically adds Authorization header
      const check = await axios.post(
        "/addit/data/check",
        {
          emails: candi.emails.trim().toLowerCase(),
          mob: String(candi.mob).trim(),
          pan_number: String(candi.pan_number || '').trim(),
          pos_id,   // needed so the backend can tell if they're already ACTIVE on THIS position
        },
        { withCredentials: true }
      );

      // A candidate already in the system is fine to REUSE for this position —
      // existence elsewhere (or a rejected/inactive record) must not block the
      // submission. Only an ACTIVE record on THIS position blocks, and that is
      // enforced server-side (alreadySubmittedToPosition), which returns a clear
      // 409 handled below. So we no longer hard-stop on global existence here.
      if (check.data.duplicateOnPosition) {
        const info = check.data.duplicateInfo || {};
        setDupError(`This candidate is already active on this position (status: ${info.status || 'Submitted'}).`);
        alert(`This candidate is already on this position${info.status ? ` (status: ${info.status})` : ''} and can't be submitted again.`);
        setSubmitting(false);
        return;
      }

      console.log("CHECK RESPONSE:", check.data);

      // Upload CV to Firebase Storage
      let cv_url = "";
      if (candi.cv_data) {
        if (typeof candi.cv_data === "string") {
          // Already-uploaded CV URL (prefilled from an existing candidate) — use as-is.
          cv_url = candi.cv_data;
        } else {
          try {
            cv_url = await uploadCV(candi.cv_data);
            console.log("CV URL received:", cv_url);

            if (!cv_url) {
              throw new Error("CV upload did not return a URL");
            }
          } catch (uploadError) {
            console.error("CV upload failed:", uploadError);
            alert("Failed to upload CV. Please try again.");
            setSubmitting(false);
            return;
          }
        }
      }

      // Upload candidate photo if provided or required
      let photo_url = "";
      if (photoFile) {
        try {
          photo_url = await uploadPhoto(photoFile);
        } catch (photoErr) {
          console.error("Photo upload failed:", photoErr);
          alert("Failed to upload candidate photo. Please try again.");
          setSubmitting(false);
          return;
        }
      } else if (photoRequired) {
        alert("A candidate photo is required for this company. Please upload a photo before submitting.");
        setSubmitting(false);
        return;
      }

      // Prepare form payload - remove undefined values
      const payload = {
        pos_id: candi.pos_id || "",
        pos_name: candi.pos_name || "",
        candidate: candi.candidate || "",
        hr_name: candi.hr_name || "",
        clientspoc: candi.clientspoc || "",
        client: candi.client || "",
        current_ctc: candi.current_ctc || "",
        exp_ctc: candi.exp_ctc || "",
        curr_state: candi.curr_state || "",
        curr_loc: candi.curr_loc || "",
        pref_state: candi.pref_state || "",
        pref_loc: candi.pref_loc || "",
        rel_exp:  `${candi.rel_exp_year}Y ${candi.rel_exp_months}M`,
        total_exp: `${candi.total_exp_year}Y ${candi.total_exp_months}M`,
        self_rate: candi.self_rate || "",
        notice_period: candi.notice_period || "",
        last_day: candi.last_day || "",
        offer_hand: candi.offer_hand || "",
        offer_amt: candi.offer_amt || "",
        curr_emp: candi.curr_emp || "",
        rh_id: candi.rh_id || "",
        highest_education: candi.highest_education || "",
        skill_type: candi.skill_type || "",
        tech_category: candi.tech_category || "",
        tech_subcategory: candi.tech_subcategory || "",
        tech_skill: JSON.stringify(candi.tech_skill || []),
        tech_exp: JSON.stringify(candi.tech_exp || []),
        nontech_category: candi.nontech_category || "",
        nontech_subcategory: candi.nontech_subcategory || "",
        nontech_skill: JSON.stringify(candi.nontech_skill || []),
        nontech_exp: JSON.stringify(candi.nontech_exp || []),
        mob: candi.mob || "",
        emails: candi.emails || "",
cv_url: cv_url || "",
        photo_url: photo_url || "",
        dob: candi.dob || "",
        jr_number: candi.jr_number || "",
        pan_number: candi.pan_number || "",
        client_answers: JSON.stringify(clientRequirements.map((q, i) => ({
          question: q.question,
          type: q.type,
          answer: q.type === 'multiselect' ? (Array.isArray(clientAnswers[i]) ? clientAnswers[i] : []) : (clientAnswers[i] || ''),
        })))
      };

      console.log("Payload to be sent:", payload);

      // Submit candidate data
      // Note: axios interceptor automatically adds Authorization header
      await axios.post("/addit/data/candi", payload, {
        withCredentials: true
      });

      // Reset form on success
      setCandi({
        ...defaultData,
        pos_id: pos_id || "",
        pos_name: pos_name || "",
        dob: "",
        jr_number: "",
        pan_number: "",
        client: client || "",
        clientspoc: clientspoc || ""
      });
      setClientAnswers({});
      e.target.reset();
      alert("Candidate Added Successfully!");
      if (typeof onSubmitted === "function") onSubmitted();

    } catch (err) {
      console.error("Form Submission Error:", err);
      console.error("Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message
      });
      
      // Handle specific error cases
      if (err.response?.status === 403 &&
          (err.response?.data?.errorCode === 'REQUEST_LIMIT_REACHED' ||
           (err.response?.data?.message || '').toLowerCase().includes('free plan limit'))) {
        // Free-plan 4-position limit reached on submission
        alert(err.response.data.message);
      } else if (err.response?.status === 409) {
        // Candidate already submitted to this position
        alert(err.response?.data?.message || "This candidate has already been submitted to this position.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Authentication failed. Please log out and log in again, then try submitting the form.");
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message;
        // Check if it's a position status validation error
        if (errorMessage && errorMessage.includes('position has status')) {
          setPositionValidationError(errorMessage);
          alert(errorMessage);
        } else {
          alert(err.response?.data?.message || "Invalid form data. Please check your inputs.");
        }
      } else if (err.message.includes("auth")) {
        alert("Authentication error. Please refresh the page and try again.");
      } else {
        alert("Failed to submit form. Please try again or contact support if the issue persists.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-blue-200">
      <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Submit CV for {pos_name}
      </h2>

      {/* Position Status Validation Error */}
      {positionValidationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-800 font-semibold flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {positionValidationError}
          </p>
          <p className="text-sm text-red-600 mt-2">
            Please contact the Client SPOC if you believe this is an error.
          </p>
        </div>
      )}

      {dupError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-800 font-semibold flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {dupError}
          </p>
        </div>
      )}

      {!dupError && autoFilled && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            <span className="text-xl">✓</span>
            {autoFilled}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        style={{ opacity: positionValidationError ? 0.5 : 1, pointerEvents: positionValidationError ? 'none' : 'auto' }}
      >
        {/* Position ID */}
        <div>
          <label className="text-gray-700 font-medium">Position ID</label>
          <input
            type="text"
            name="pos_id"
            value={candi.pos_id}
            readOnly
            className="w-full mt-1 bg-blue-50 text-gray-600 border border-blue-300 rounded-lg p-2"
          />
        </div>

        {/* Position Name */}
        <div>
          <label className="text-gray-700 font-medium">Position Name</label>
          <input
            type="text"
            name="pos_name"
            value={candi.pos_name}
            readOnly
            className="w-full mt-1 bg-blue-50 text-gray-600 border border-blue-300 rounded-lg p-2"
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="text-gray-700 font-medium">Client Name</label>
          <input
            type="text"
            name="client"
            value={candi.client}
            readOnly
            className="w-full mt-1 bg-blue-50 text-gray-600 border border-blue-300 rounded-lg p-2"
          />
        </div>
        
        {/* HR Name */}
        <div>
          <label className="text-gray-700 font-medium">HR Name</label>
          <input
            type="text"
            name="hr_name"
            value={candi.hr_name}
            readOnly
            className="w-full mt-1 bg-blue-50 text-gray-600 border border-blue-300 rounded-lg p-2"
          />
        </div>

        <div>
          <label className="text-gray-700 font-medium">Client SPOC Name</label>
          <input
            type="text"
            name="clientspoc"
            value={candi.clientspoc}
            readOnly
            className="w-full mt-1 bg-blue-50 text-gray-600 border border-blue-300 rounded-lg p-2"
          />
        </div>

        {/* Candidate Name */}
        <div>
          <label className="text-gray-700 font-medium">Candidate Name *</label>
          <input
            type="text"
            name="candidate"
            required
            value={candi.candidate}
            onChange={handleChange}
            placeholder="Enter full name"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Contact */}
        <div>
        <label className="text-gray-700 font-medium">Contact Number *</label>

        {phoneError && (
         <p className="text-red-600 font-semibold mb-1">{phoneError}</p>
        )}

        <input
         type="text"
         name="mob"
         required
         value={candi.mob}
         onChange={(e) => {
          const value = e.target.value;

          // Allow only digits
          if (!/^\d*$/.test(value)) return;

      // Limit to 10 digits
          if (value.length > 10) return;

           setCandi({ ...candi, mob: value });
           setPhoneError(""); // Clear error while typing
          }}
         onBlur={() => {
      // Validate only on blur
           if (candi.mob.length !== 10) {
           setPhoneError("Phone number must be exactly 10 digits.");
          } else { checkDuplicate(); }
         }}
        placeholder="Enter 10-digit phone number"
        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
      />
      </div>


        {/* Email */}
        <div>
          <label className="text-gray-700 font-medium">Email *</label>
          {emailError && (
            <p className="text-red-600 font-semibold mb-1">{emailError}</p>
          )}
          <div className="relative">
            <input
              type="email"
              name="emails"
              required
              value={candi.emails}
              onChange={handleChange}
              onBlur={e => { fetchCandidateByEmail(e.target.value); checkDuplicate(); }}
              placeholder="Enter email — existing details will auto-fill"
              className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 pr-10"
            />
            {emailLookupLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </span>
            )}
          </div>
          {emailLookupMsg === 'found' && (
            <p className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
              ✅ Existing profile found — fields auto-filled. Review and update if needed.
            </p>
          )}
          {emailLookupMsg === 'not_found' && (
            <p className="mt-1 text-xs text-gray-400">No existing profile found — please fill in the details manually.</p>
          )}
        </div>

        {/* New Personal Details Fields - FIXED VISIBILITY */}
        {/* DOB */}
        <div className="md:col-span-1">
          <label className="text-gray-700 font-medium">Date of Birth *</label>
          <input
            type="date"
            name="dob"
            required
            value={candi.dob}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* JR # */}
        <div className="md:col-span-1">
          <label className="text-gray-700 font-medium">JR # *</label>
          <input
            type="text"
            name="jr_number"
            required
            value={candi.jr_number}
            onChange={handleChange}
            placeholder="Enter JR Number"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* PAN Number */}
        <div className="md:col-span-1">
          <label className="text-gray-700 font-medium">PAN Number *</label>
          <input
            type="text"
            name="pan_number"
            required
            value={candi.pan_number}
            onChange={handleChange}
            onBlur={checkDuplicate}
            placeholder="Enter PAN (e.g. ABCDE1234F)"
            maxLength="10"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* RH ID */}
        <div className="md:col-span-1">
          <label className="text-gray-700 font-medium">RH ID</label>
          <input
            type="text"
            name="rh_id"
            value={candi.rh_id}
            onChange={handleChange}
            placeholder="Enter RH ID"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Current Employer */}
        <div className="md:col-span-1">
          <label className="text-gray-700 font-medium">Current Employer</label>
          <input
            type="text"
            name="curr_emp"
            value={candi.curr_emp}
            onChange={handleChange}
            placeholder="Enter current employer"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Highest Education */}
        <div className="md:col-span-1">
          <label className="text-gray-700 font-medium">Highest Education</label>
          <input
            type="text"
            name="highest_education"
            value={candi.highest_education}
            onChange={handleChange}
            placeholder="e.g. B.Tech, MBA, MCA"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Upload CV — a prefilled candidate already has one attached. A file input
            can't be given a value by script, so show the existing resume instead of
            an empty (and `required`) picker the user can't satisfy. */}
        <div>
          <label className="text-gray-700 font-medium">Upload CV *</label>
          {typeof candi.cv_data === "string" && candi.cv_data ? (
            <div className="mt-1 border-2 border-green-300 bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-green-800 font-semibold flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Resume attached from the referred candidate
                </span>
                <div className="flex items-center gap-3">
                  <a href={candi.cv_data} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-700 underline font-medium">View</a>
                  <button type="button"
                    onClick={() => setCandi(prev => ({ ...prev, cv_data: "" }))}
                    className="text-sm text-red-600 underline font-medium">Replace</button>
                </div>
              </div>
            </div>
          ) : (
            <input
              type="file"
              name="cv_data"
              required
              onChange={handleChange}
              className="w-full mt-1 border border-dashed rounded-lg p-2"
            />
          )}
        </div>

        {/* Candidate Photo — shown only when the company requires it */}
        {photoRequired && (
          <div>
            <label className="text-gray-700 font-medium">
              Candidate Photo <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-blue-600 font-normal">(required by this company)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files[0] || null)}
              className="w-full mt-1 border border-dashed border-blue-400 rounded-lg p-2"
            />
            {photoFile && (
              <p className="text-xs text-green-600 mt-1">Selected: {photoFile.name}</p>
            )}
          </div>
        )}

        {/* Current CTC */}
        <div>
          <label className="text-gray-700 font-medium">Current CTC *</label>
          <select
            name="current_ctc"
            required
            value={candi.current_ctc}
            onChange={handleChange}
            className="w-full mt-1 border rounded-lg p-2"
          >
            <option value="">Select Current CTC</option>
            
                    {Array.from({ length: ((10000000 - 300000) / 50000) + 1 }, (_, i) => 300000 + i * 50000)
                      .map((val) => (
                        <option key={val} value={val}>₹{val.toLocaleString('en-IN')}</option>
                    ))}
          </select>
        </div>

        {/* Expected CTC */}
        <div>
          <label className="text-gray-700 font-medium">Expected CTC *</label>
          <select
            name="exp_ctc"
            required
            value={candi.exp_ctc}
            onChange={handleChange}
            className="w-full mt-1 border rounded-lg p-2"
          >
            <option value="">Select Expected CTC</option>

                    {Array.from({ length: ((10000000 - 300000) / 50000) + 1 }, (_, i) => 300000 + i * 50000)
                      .map((val) => (
                        <option key={val} value={val}>₹{val.toLocaleString('en-IN')}</option>
                      ))}
          </select>
        </div>

        {/* Current Location */}
<div className="flex flex-col">
  <label className="text-sm text-gray-600 mb-1">Current State</label>
  <select
    name="curr_state"
    required
    value={candi.curr_state || ""}
    onChange={(e) => {
      setCandi({ ...candi, curr_state: e.target.value, curr_loc: "" });
    }}
    className="h-11 border rounded-lg px-3"
  >
    <option value="">Select State</option>

    {Object.keys(indiaStatesAndCities).map((state, index) => (
      <option key={index} value={state}>{state}</option>
    ))}

  </select>
</div>

{/* City Dropdown */}
<div className="flex flex-col">
  <label className="text-sm text-gray-600 mb-1">Current City</label>
  <select
    name="curr_loc"
    required
    value={candi.curr_loc}
    onChange={handleChange}
    className="h-11 border rounded-lg px-3"
    disabled={!candi.curr_state}
  >
    <option value="">Select City</option>

    {candi.curr_state &&
      indiaStatesAndCities[candi.curr_state].map((city, index) => (
        <option key={index} value={city}>{city}</option>
      ))
    }

  </select>
</div>

    {/* Checkbox for Preferred Location */}
    <div className="md:col-span-2 flex items-center gap-2">
       <input
       type="checkbox"
       checked={sameLocation}
       onChange={(e) => setSameLocation(e.target.checked)}
      />
     <label className="text-gray-700 font-medium">
      Preferred Location same as Current Location
     </label>
    </div>

    

        {/* Preferred Location */}
<div className="flex flex-col">
  <label className="text-sm text-gray-600 mb-1">Preferred State</label>
  <select
    name="pref_state"
    required
    disabled={sameLocation}
    value={candi.pref_state || ""}
    onChange={(e) => {
      setCandi({ ...candi, pref_state: e.target.value, pref_loc: "" });
    }}
    className="h-11 border rounded-lg px-3"
  >
    <option value="">Select State</option>

    {Object.keys(indiaStatesAndCities).map((state, index) => (
      <option key={index} value={state}>{state}</option>
    ))}

  </select>
</div>

{/* City Dropdown */}
<div className="flex flex-col">
  <label className="text-sm text-gray-600 mb-1">Preferred City</label>
  <select
    name="pref_loc"
    required
    value={candi.pref_loc}
    onChange={handleChange}
    className="h-11 border rounded-lg px-3"
    disabled={sameLocation || !candi.pref_state}
  >
    <option value="">Select City</option>

    {candi.pref_state &&
      indiaStatesAndCities[candi.pref_state].map((city, index) => (
        <option key={index} value={city}>{city}</option>
      ))
    }

  </select>
</div>


        {/* Total Experience */}
<div>
  <label className="text-gray-700 font-medium">Total Experience *</label>

  <div className="flex gap-3 mt-1">
    <select
      name="total_exp_year"
      required
      value={candi.total_exp_year}
      onChange={handleChange}
      className="border rounded-lg p-2 w-1/2"
    >
      <option value="">Years</option>
      {generateYears().map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>

    <select
      name="total_exp_months"
      required
      value={candi.total_exp_months}
      onChange={handleChange}
      className="border rounded-lg p-2 w-1/2"
    >
      <option value="">Months</option>
      {generateMonths().map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
</div>


        {/* Relevant Experience */}
<div>
  <label className="text-gray-700 font-medium">Relevant Experience *</label>

  <div className="flex gap-3 mt-1">
    <select
      name="rel_exp_year"
      required
      value={candi.rel_exp_year}
      onChange={handleChange}
      className="border rounded-lg p-2 w-1/2"
    >
      <option value="">Years</option>
      {generateYears().map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>

    <select
      name="rel_exp_months"
      required
      value={candi.rel_exp_months}
      onChange={handleChange}
      className="border rounded-lg p-2 w-1/2"
    >
      <option value="">Months</option>
      {generateMonths().map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
</div>





        {/* ── Skill Category (parent — comes from the position) ─────────── */}
        <div className="md:col-span-2">
          <label className="text-gray-700 font-medium">Skill Category *</label>
          <div className="mt-1 border rounded-lg p-2 bg-gray-100 text-gray-700 text-sm">
            {posSkill.parent || "—"}
            <span className="ml-2 text-xs text-gray-500">(from this position)</span>
          </div>
        </div>

        {/* Child / sub-category — multi-select, limited to the position's children */}
        <div className="md:col-span-2">
          <label className="text-gray-700 font-medium">
            Sub-Category *{" "}
            <span className="text-xs font-normal text-gray-500">(select up to {MAX_CHILDREN})</span>
          </label>
          {childOptions.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400 italic">
              No sub-categories are configured for this position.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {childOptions.map((ch) => {
                const active = selChildren.includes(ch.name);
                return (
                  <button
                    type="button"
                    key={ch.name}
                    onClick={() => toggleChild(ch.name)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      active
                        ? "bg-blue-600 border-blue-600 text-white font-semibold"
                        : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    {ch.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sub-child / skills for each selected child — multi-select, max 2 each */}
        {selChildren.map((childName) => {
          const childObj = childOptions.find((c) => c.name === childName);
          const subs = childObj?.subChildren || [];
          const chosen = selSubs[childName] || [];
          return (
            <div className="md:col-span-2" key={childName}>
              <label className="text-gray-700 font-medium">
                {childName} — Skills *{" "}
                <span className="text-xs font-normal text-gray-500">
                  (select up to {MAX_SUBS_PER_CHILD})
                </span>
              </label>
              {subs.length === 0 ? (
                <p className="mt-1 text-sm text-gray-400 italic">
                  No skills are configured under {childName}.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {subs.map((sub) => {
                    const active = chosen.includes(sub);
                    return (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => toggleSub(childName, sub)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          active
                            ? "bg-green-600 border-green-600 text-white font-semibold"
                            : "bg-white border-gray-300 text-gray-700 hover:border-green-400"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Experience for each selected skill */}
        {selectedSubList.length > 0 && (
          <div className="md:col-span-2">
            <label className="text-gray-700 font-medium">Experience *</label>
            <div className="mt-2 space-y-3">
              {selectedSubList.map(({ child, sub }) => (
                <div key={`${child}||${sub}`} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-700">
                      {sub} <span className="text-xs font-normal text-gray-500">({child})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSub(child, sub)}
                      className="text-red-500 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder={`Experience in ${sub}`}
                    value={subExp[`${child}||${sub}`] || ""}
                    onChange={(e) =>
                      setSubExp((s) => ({ ...s, [`${child}||${sub}`]: e.target.value }))
                    }
                    className="border rounded-lg p-2 mt-2 w-full"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Offer In Hand */}
<div>
  <label className="text-gray-700 font-medium">Offer In Hand (If Any) *</label>

  <div className="flex gap-6 mt-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="offer_hand"
        value="yes"
        checked={candi.offer_hand === "yes"}
        onChange={handleChange}
        required
      />
      Yes
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="offer_hand"
        value="no"
        checked={candi.offer_hand === "no"}
        onChange={handleChange}
      />
      No
    </label>
  </div>
</div>


{/* Notice Period */}
<div>
  <label className="text-gray-700 font-medium">Notice Period *</label>
  <select
    name="notice_period"
    required
    value={candi.notice_period}
    onChange={handleChange}
    className="w-full mt-1 border rounded-lg p-2"
  >
    <option value="">Select</option>
    <option value="Immediate">Immediate</option>
    <option value="7">7 Days</option>
    <option value="15">15 Days</option>
    <option value="30">30 Days</option>
    <option value="45">45 Days</option>
    <option value="60">60 Days</option>
    <option value="90">90 Days</option>
    <option value="Serving">Serving Notice</option>
  </select>
</div>

{/* Last Working Day (Conditional) */}
{candi.notice_period === "Serving" && (
  <div>
    <label className="text-gray-700 font-medium">Last Working Day *</label>
    <input
      type="text"
      name="last_day"
      required
      value={candi.last_day}
      onChange={handleChange}
      className="w-full mt-1 border rounded-lg p-2"
    />
  </div>
)}



{/* Self Rating */}
<div className="md:col-span-2">
  <label className="text-gray-700 font-medium">Self Rating *</label>

  <div className="flex gap-6 mt-2">
    {[1,2,3,4,5].map((rate) => (
      <label key={rate} className="flex items-center gap-2">
        <input
          type="radio"
          name="self_rate"
          value={rate}
          checked={candi.self_rate === String(rate)}
          onChange={handleChange}
          required
        />
        {rate}
      </label>
    ))}
  </div>

  <p className="text-sm text-gray-500 mt-2">
    1 = Worst | 2 = Below Avg | 3 = Average | 4 = Good | 5 = Best
  </p>
</div>



        {/* Offer Amount & DOJ (optional) */}
        <div className="md:col-span-2">
          <label className="text-gray-700 font-medium">
            Offer Amount & Date of Joining (Optional)
          </label>
          <input
            type="text"
            name="offer_amt"
            value={candi.offer_amt}
            onChange={handleChange}
            placeholder="Enter amount & joining date (optional)"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Auth Status Messages for Mobile Users */}
        {(authTimeout || authError) && !user && (
          <div className="md:col-span-2 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-yellow-800 font-semibold mb-2">
              ⚠️ Authentication Issue Detected
            </p>
            <p className="text-sm text-yellow-700 mb-3">
              {authTimeout 
                ? "Authentication check is taking longer than expected. This can happen on mobile devices."
                : `Error: ${authError}`}
            </p>
            <button
              type="button"
              onClick={retryAuthCheck}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              Retry Authentication
            </button>
          </div>
        )}

        {/* Loading State Feedback */}
        {loading && (
          <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <p className="text-blue-800 font-semibold">
              🔄 Checking authentication status...
            </p>
            <p className="text-sm text-blue-600 mt-1">
              This should only take a few seconds. If it takes longer, please refresh the page.
            </p>
          </div>
        )}

        {/* Not Logged In Warning */}
        {!loading && !user && !authTimeout && (
          <div className="md:col-span-2 p-4 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-red-800 font-semibold mb-2">
              🔒 You must be logged in to submit this form
            </p>
            <p className="text-sm text-red-600">
              Please log in to your account and try again. If you're already logged in, try refreshing the page.
            </p>
          </div>
        )}

        {/* Client Requirements — answer the company's + position's own questions */}
        {clientRequirements.length > 0 && (
          <div className="md:col-span-2 mb-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-bold mb-3">Client Requirements</h3>
            <div className="space-y-4">
              {clientRequirements.map((q, i) => (
                <div key={i} className="bg-white border border-blue-100 rounded-lg p-3">
                  <p className="text-gray-800 font-medium mb-2">{q.question}</p>
                  {q.type === 'yesno' && (
                    <div className="flex gap-5">
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                          <input type="radio" name={`client-req-${i}`} checked={clientAnswers[i] === opt}
                            onChange={() => setClientAnswer(i, opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'multiselect' && (
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {(q.options || []).map((opt, oi) => (
                        <label key={oi} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={Array.isArray(clientAnswers[i]) && clientAnswers[i].includes(opt)}
                            onChange={() => toggleClientMultiAnswer(i, opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {(!q.type || q.type === 'subjective') && (
                    <textarea rows={3} value={clientAnswers[i] || ''} onChange={e => setClientAnswer(i, e.target.value)}
                      placeholder="Type your answer…"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!user || loading || submitting}
          className={`md:col-span-2 mt-4 py-3 rounded-lg font-semibold transition ${
            !user || loading || submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {submitting 
            ? "Submitting..." 
            : loading 
            ? "Checking Authentication..." 
            : !user 
            ? "Login Required to Submit" 
            : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default Dash_Form;
