import React, { useState } from "react";
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

const Dash_Form = ({ pos_id, clientspoc, pos_name, client, hr_name }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [sameLocation, setSameLocation] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);
  const [accessCheckLoading, setAccessCheckLoading] = useState(false);
  const [positionStatus, setPositionStatus] = useState(null);
  const [positionValidationError, setPositionValidationError] = useState(null);

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
    rel_exp: "",
    total_exp:"",
    offer_hand: "",
    offer_amt: "",
    cv_data: "",
    curr_emp: "",
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


  const nonTechCategoryData = { 
    "Banking & Financial Services": { 
      "Liability Products": [ "Current Account (CA) Management", "Savings Account (SA) Management", "CASA Operations", "Fixed Deposits / Term Deposits" ], 
      "Asset Products": [ "Wealth Management", "Investment Products (MF, Bonds, PMS)", "Insurance Products (LI/GI/Health)", "Working Capital Loans", "Business Loans / SME Lending" ], 
      "Compliance": [ "KYC / AML Compliance", "Customer Onboarding & Documentation", "Regulatory Compliance" ],
      "Operations": [ "Branch Banking Operations", "Retail Banking Processes", "Portfolio Management (Liability/Asset/AUM)" ],
      "Sales & RM": [ "Lead Generation & Sourcing", "Cross-selling & Up-selling", "Financial Planning & Advisory", "Sales Target Management", "Client Lifecycle Management" ] },
    "Logistics / Supply Chain": {
       "Warehousing": [ "Inventory Management", "Warehouse Management", "Warehouse Automation Tools" ],
       "Transportation": [ "Last-mile Delivery Operations", "Reverse Logistics", "Transportation / Fleet Management", "Route Optimization" ], 
       "Procurement / Vendor": [ "Procurement & Vendor Management", "Sourcing & Negotiation", "Freight & Cargo Handling", "3PL / 4PL Coordination", "Customs Clearance & Export/Import Processes" ],
       "Planning & Analytics": [ "Supply Planning", "Demand Forecasting", "Supply Chain Analytics", "Stock Reconciliation", "Risk Management in Supply Chain", "Lean Logistics & Waste Reduction" ] },
    "E-Commerce / Retail": { 
       "Marketplace / Fulfillment": [ "E-commerce Operations", "Order Processing & Tracking", "Returns/Refund/Replacement Operations", "D2C Fulfillment Processes", "Partner/Marketplace SLAs" ], 
       "Customer Experience": [ "Customer Experience (CX)", "Traffic/Conversion Analytics", "Cart Abandonment Analysis" ],
       "Catalog / Inventory": [ "SKU & Catalogue Management", "Inventory Sync (Omni-channel)", "Product Listing (SEO-Optimized)" ],
       "Payments & Finance": [ "Digital Payments & Fraud Checks", "Payment Gateway Coordination" ],
       "Marketing / Growth": [ "Online Merchandising", "Pricing Strategy & Promotions", "Consumer Behavior Analysis", "Campaign Performance Reporting" ] }, 
     "Manufacturing / Production": { 
        "Production": [ "Production Planning", "MRP (Material Requirements Planning)", "SAP PP / SAP MM Operations", "Factory Operations Management", "Workforce Scheduling", "Production Line Balancing" ],
        "Quality": [ "Quality Control (QC)", "Health & Safety Compliance", "ISO/GMP/HACCP Standards Knowledge" ], 
        "Materials / Costing": [ "Raw Material Procurement", "Product Costing & BOM Analysis", "Inventory Control in Plants", "Vendor Development" ],
       "Process Improvement": [ "Process Improvement / Lean Manufacturing", "6S / Kaizen / TPM Methods", "Machine Efficiency (OEE) Improvement", "Maintenance & Utilities Monitoring" ] },
      "Media / Digital / Marketing": { 
        "Content": [ "Content Strategy", "Copywriting", "Video Content Planning" ],
        "Digital Marketing": [ "Digital Marketing", "SEO (Search Engine Optimization)", "SEM / Google Ads", "Social Media Management", "Email/SMS Marketing", "Lead Generation", "Performance Marketing Optimization" ],
        "Campaign / Brand": [ "Brand Campaign Planning", "Influencer Coordination", "Creative Briefing & Content Calendar", "Media Buying & Budget Planning" ], 
        "Analytics / Research": [ "Web Analytics (GA4 etc.)", "Market Research & Insights", "Audience Segmentation", "Ad Copy & Creative Optimization" ] } 
      };
  

  const techData = {
    "Cloud & DevOps": {
      "Cloud Providers": ["Amazon Web Services (AWS)", "Microsoft Azure", "Google Cloud Platform (GCP)"],
      "AWS Services": ["EC2", "S3", "Lambda", "CloudFormation", "EKS", "RDS", "CloudWatch"],
      "Azure Services": ["Azure DevOps", "Azure Functions", "App Service", "AKS", "Blob Storage"],
      "GCP Services": ["Compute Engine", "BigQuery", "Cloud Storage", "Cloud Run", "Pub/Sub"],
      "DevOps Tools": ["Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI"],
      "CI/CD & Monitoring": ["CircleCI", "Prometheus", "Grafana", "ELK Stack", "Datadog"]
    },
    "Data Science & Analytics": {
      "Machine Learning": ["Scikit-learn", "TensorFlow", "PyTorch", "Keras", "spaCy", "NLTK", "Hugging Face"],
      "ML Ops": ["MLflow", "Kubeflow", "SageMaker", "OpenAI APIs", "LangChain", "Llama", "Gemini"],
      "Data Tools": ["Pandas", "NumPy", "Matplotlib", "Seaborn", "Apache Spark", "Hadoop", "Kafka", "Airflow"],
      "BI & Analytics": ["Power BI", "Tableau", "Looker", "Qlik", "Talend", "Informatica"]
    },
    "Web Development": {
      Frontend: ["React.js", "Angular", "Vue.js", "Svelte", "Next.js", "HTML5", "CSS3", "SCSS","Tailwind CSS", "Bootstrap", "Material UI", "Redux", "MobX", "Zustand", "Webpack", "Vite", "Babel"],
      Backend: ["Spring", "Spring Boot", "Django", "Flask", "FastAPI", "Node.js", "Express.js", "NestJS", ".NET Core", "Ruby on Rails", "REST APIs", "GraphQL", "gRPC", "PHP", "CMS", "WordPress", "Shopify", "Drupal", "Magento"]
    },
    "Programming Languages": {
      "Prgramming Languages": ["Java","Python","C","C++","C#","Go","Rust","Kotlin","Scala","JavaScript","TypeScript","Swift","PHP","Dart","Ruby","Laravel","MATLAB","COBOL","Fortran","Perl","VB.NET"]
    },
    "Mobile App Technologies": {
      "Mobile Development": ["Android (Java)", "Android (Kotlin)", "iOS (Swift)", "iOS (Objective-C)", "Flutter", "React Native", "Xamarin", "Ionic"]
    },
    "Database Technologies": {
      "Database Technologies": ["MySQL", "PostgreSQL", "Oracle", "MS SQL Server", "MongoDB", "Cassandra", "DynamoDB", "CouchDB", "Redis", "Memcached", "Snowflake", "BigQuery", "Redshift"]
    },
    "Testing & Quality Assurance": {
      "Testing Types": ["Functional Testing", "Regression Testing", "UAT"],
      "Test Automation": ["Selenium", "Cypress", "Playwright", "TestNG", "Postman", "RestAssured"],
      "Performance Testing": ["JMeter", "LoadRunner"]
    },
    "Security Technologies": {
      "Security Concepts": ["OWASP", "IAM", "OAuth", "SSO"],
      "Security Tools": ["Snyk", "Veracode", "Firewalls", "VPN", "IDS", "IPS", "Okta", "Prisma", "Wiz", "Aqua"]
    },
    "Enterprise Systems": {
      "ERP Systems": ["SAP S/4HANA", "ABAP", "Oracle ERP", "Microsoft Dynamics", "Workday", "SuccessFactors", "Darwinbox"],
      "CRM Systems": ["Salesforce", "Zoho", "HubSpot"]
    },
    "Emerging Technologies": {
      "Blockchain": ["Ethereum", "Solidity", "Hyperledger"],
      "IoT": ["MQTT", "Arduino", "Raspberry Pi"],
      "Game Development": ["Unity", "Unreal Engine"],
      "No-Code/Low-Code": ["OutSystems", "Mendix", "Power Apps"]
    }
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

  const uploadCV = async (file) => {
    // Try backend endpoint first (if deployed)
    const storage = getStorage();
  const fileRef = ref(storage, `resumes/${Date.now()}_${file.name}`);

  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cv_data") {
      setCandi({ ...candi, cv_data: e.target.files[0] });
    } else {
      setCandi({ ...candi, [name]: value });
    }
  };

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

      // Check for duplicate email/phone
      // Note: axios interceptor automatically adds Authorization header
      const check = await axios.post(
        "/addit/data/check",
        { 
          emails: candi.emails.trim().toLowerCase(), 
          mob: String(candi.mob).trim() 
        },
        { withCredentials: true }
      );

      if (check.data.emailExists) {
        setEmailError("Email already exists!");
        alert("Email Already Exists!");
        setSubmitting(false);
        return;
      }

      if (check.data.phoneExists) {
        setPhoneError("Phone number already exists!");
        alert("Phone number Already Exists!");
        setSubmitting(false);
        return;
      }

      console.log("CHECK RESPONSE:", check.data);

      // Upload CV to Firebase Storage
      let cv_url = "";
      if (candi.cv_data) {
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
        cv_url: cv_url || ""
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
        client: client || "",
        clientspoc: clientspoc || ""
      });
      e.target.reset();
      alert("Candidate Added Successfully!");

    } catch (err) {
      console.error("Form Submission Error:", err);
      console.error("Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message
      });
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
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
          }
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

          <input
            type="email"
            name="emails"
            required
            value={candi.emails}
            onChange={handleChange}
            placeholder="Enter email"
            className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Upload CV */}
        <div>
          <label className="text-gray-700 font-medium">Upload CV *</label>
          <input
            type="file"
            name="cv_data"
            required
            onChange={handleChange}
            className="w-full mt-1 border border-dashed rounded-lg p-2"
          />
        </div>

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





        {/* Technical Category */}
{/* Skill Type (Tech / Non Tech) */}
<div className="md:col-span-2">
  <label className="text-gray-700 font-medium">Skill Type *</label>

  <div className="flex gap-6 mt-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="skill_type"
        value="tech"
        checked={candi.skill_type === "tech"}
        onChange={handleChange}
      />
      Technical
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="skill_type"
        value="nontech"
        checked={candi.skill_type === "nontech"}
        onChange={handleChange}
      />
      Non-Technical
    </label>
  </div>
</div>



{/* ----------- TECHNICAL SECTION ----------- */}
{candi.skill_type === "tech" && (
  <>
    {/* Technical Category */}
    <div>
      <label className="text-gray-700 font-medium">Technical Category *</label>
      <select
        name="tech_category"
        required={candi.skill_type === "tech"}
        value={candi.tech_category}
        onChange={handleCategoryChange}
        className="w-full mt-1 border rounded-lg p-2"
      >
        <option value="">Select Category</option>
        {Object.keys(techData).map((cat) => (
          <option key={cat}>{cat}</option>
        ))}
      </select>
    </div>

    {/* Subcategory */}
    {candi.tech_category && (
      <div>
        <label className="text-gray-700 font-medium">Subcategory *</label>
        <select
          name="tech_subcategory"
          required={candi.skill_type === "tech"}
          value={candi.tech_subcategory}
          onChange={handleSubcategoryChange}
          className="w-full mt-1 border rounded-lg p-2"
        >
          <option value="">Select Subcategory</option>
          {Object.keys(techData[candi.tech_category]).map((sub) => (
            <option key={sub}>{sub}</option>
          ))}
        </select>
      </div>
    )}

    {/* Multi Skill Selector */}
    {candi.tech_subcategory && (
      <div className="md:col-span-2">
        <label className="text-gray-700 font-medium">Select Skill (up to 10)</label>
        <select
          onChange={handleSkillSelect}
          className="w-full mt-1 border rounded-lg p-2"
        >
          <option value="">Select Skill</option>
          {techData[candi.tech_category][candi.tech_subcategory].map((skill) => (
            <option key={skill}>{skill}</option>
          ))}
        </select>

        {/* Selected Skills */}
        <div className="mt-3 space-y-3">
          {candi.tech_skill.map((skill, index) => (
            <div key={index} className="p-3 border rounded-lg bg-gray-50">
              <div className="flex justify-between">
                <span className="font-semibold text-blue-700">{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder={`Experience in ${skill}`}
                value={candi.tech_exp[index]}
                onChange={(e) => updateSkillExp(index, e.target.value)}
                className="border rounded-lg p-2"
                required={candi.skill_type === "tech"}
              />
            </div>
          ))}
        </div>
      </div>
    )}
  </>
)}


{/* ----------- NON-TECHNICAL SECTION ----------- */}
{candi.skill_type === "nontech" && (
  <>
    {/* Non-Tech Category */}
    <div>
      <label className="text-gray-700 font-medium">Non-Technical Category *</label>
      <select
        name="nontech_category"
        required={candi.skill_type === "nontech"}
        value={candi.nontech_category}
        onChange={(e) =>
          setCandi({
            ...candi,
            nontech_category: e.target.value,
            nontech_subcategory: "",
            nontech_skill: [],
            nontech_exp: []
          })
        }
        className="w-full mt-1 border rounded-lg p-2"
      >
        <option value="">Select Category</option>
        {Object.keys(nonTechCategoryData).map((cat) => (
          <option key={cat}>{cat}</option>
        ))}
      </select>
    </div>

    {/* Non-Tech Subcategory */}
    {candi.nontech_category && (
      <div>
        <label className="text-gray-700 font-medium">Subcategory *</label>
        <select
          name="nontech_subcategory"
          required={candi.skill_type === "nontech"}
          value={candi.nontech_subcategory}
          onChange={(e) =>
            setCandi({
              ...candi,
              nontech_subcategory: e.target.value,
              nontech_skill: [],
              nontech_exp: []
            })
          }
          className="w-full mt-1 border rounded-lg p-2"
        >
          <option value="">Select Subcategory</option>
          {Object.keys(
            nonTechCategoryData[candi.nontech_category]
          ).map((sub) => (
            <option key={sub}>{sub}</option>
          ))}
        </select>
      </div>
    )}

    {/* Non-Tech Skills */}
    {candi.nontech_subcategory && (
      <div className="md:col-span-2">
        <label className="text-gray-700 font-medium">Select Skill (up to 10)</label>
        <select
          onChange={(e) => {
            const sk = e.target.value;
            if (!candi.nontech_skill.includes(sk)) {
              setCandi({
                ...candi,
                nontech_skill: [...candi.nontech_skill, sk],
                nontech_exp: [...candi.nontech_exp, ""]
              });
            }
          }}
          className="w-full mt-1 border rounded-lg p-2"
        >
          <option value="">Select Skill</option>
          {nonTechCategoryData[candi.nontech_category][
            candi.nontech_subcategory
          ].map((skill) => (
            <option key={skill}>{skill}</option>
          ))}
        </select>

        <div className="mt-3 space-y-3">
          {candi.nontech_skill.map((skill, index) => (
            <div key={index} className="p-3 border rounded-lg bg-gray-50">
              <div className="flex justify-between">
                <span className="font-semibold text-blue-700">{skill}</span>
                <button
                  type="button"
                  onClick={() => {
                    let ns = [...candi.nontech_skill];
                    let ne = [...candi.nontech_exp];
                    ns.splice(index, 1);
                    ne.splice(index, 1);
                    setCandi({ ...candi, nontech_skill: ns, nontech_exp: ne });
                  }}
                  className="text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder={`Experience in ${skill}`}
                value={candi.nontech_exp[index]}
                onChange={(e) => {
                  let ne = [...candi.nontech_exp];
                  ne[index] = e.target.value;
                  setCandi({ ...candi, nontech_exp: ne });
                }}
                className="border rounded-lg p-2"
                required={candi.skill_type === "nontech"}
              />
            </div>
          ))}
        </div>
      </div>
    )}
  </>
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
