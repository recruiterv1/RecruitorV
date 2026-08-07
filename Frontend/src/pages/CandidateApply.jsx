import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

import { MapPin, Briefcase, Building, ChevronLeft, CheckCircle, Upload, Star, Search, X } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { RichTextView } from "../components/RichTextEditor";
import ClientQuestions, { buildClientAnswers, validateClientAnswers } from "../components/ClientQuestions";

const indiaStatesAndCities = {
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
  "Puducherry": ["Puducherry"],
};

const techData = {
  "Cloud & DevOps": {
    "Cloud Providers": ["Amazon Web Services (AWS)", "Microsoft Azure", "Google Cloud Platform (GCP)"],
    "AWS Services": ["EC2", "S3", "Lambda", "CloudFormation", "EKS", "RDS", "CloudWatch"],
    "Azure Services": ["Azure DevOps", "Azure Functions", "App Service", "AKS", "Blob Storage"],
    "GCP Services": ["Compute Engine", "BigQuery", "Cloud Storage", "Cloud Run", "Pub/Sub"],
    "DevOps Tools": ["Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI"],
    "CI/CD & Monitoring": ["CircleCI", "Prometheus", "Grafana", "ELK Stack", "Datadog"],
  },
  "Data Science & Analytics": {
    "Machine Learning": ["Scikit-learn", "TensorFlow", "PyTorch", "Keras", "spaCy", "NLTK", "Hugging Face"],
    "ML Ops": ["MLflow", "Kubeflow", "SageMaker", "OpenAI APIs", "LangChain", "Llama", "Gemini"],
    "Data Tools": ["Pandas", "NumPy", "Matplotlib", "Seaborn", "Apache Spark", "Hadoop", "Kafka", "Airflow"],
    "BI & Analytics": ["Power BI", "Tableau", "Looker", "Qlik", "Talend", "Informatica"],
  },
  "Web Development": {
    Frontend: ["React.js", "Angular", "Vue.js", "Svelte", "Next.js", "HTML5", "CSS3", "SCSS", "Tailwind CSS", "Bootstrap", "Material UI", "Redux", "MobX", "Zustand", "Webpack", "Vite", "Babel"],
    Backend: ["Spring", "Spring Boot", "Django", "Flask", "FastAPI", "Node.js", "Express.js", "NestJS", ".NET Core", "Ruby on Rails", "REST APIs", "GraphQL", "gRPC", "PHP", "CMS", "WordPress", "Shopify", "Drupal", "Magento"],
  },
  "Programming Languages": {
    "Programming Languages": ["Java", "Python", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Scala", "JavaScript", "TypeScript", "Swift", "PHP", "Dart", "Ruby", "Laravel", "MATLAB", "COBOL", "Fortran", "Perl", "VB.NET"],
  },
  "Mobile App Technologies": {
    "Mobile Development": ["Android (Java)", "Android (Kotlin)", "iOS (Swift)", "iOS (Objective-C)", "Flutter", "React Native", "Xamarin", "Ionic"],
  },
  "Database Technologies": {
    "Database Technologies": ["MySQL", "PostgreSQL", "Oracle", "MS SQL Server", "MongoDB", "Cassandra", "DynamoDB", "CouchDB", "Redis", "Memcached", "Snowflake", "BigQuery", "Redshift"],
  },
  "Testing & Quality Assurance": {
    "Testing Types": ["Functional Testing", "Regression Testing", "UAT"],
    "Test Automation": ["Selenium", "Cypress", "Playwright", "TestNG", "Postman", "RestAssured"],
    "Performance Testing": ["JMeter", "LoadRunner"],
  },
  "Security Technologies": {
    "Security Concepts": ["OWASP", "IAM", "OAuth", "SSO"],
    "Security Tools": ["Snyk", "Veracode", "Firewalls", "VPN", "IDS", "IPS", "Okta", "Prisma", "Wiz", "Aqua"],
  },
  "Enterprise Systems": {
    "ERP Systems": ["SAP S/4HANA", "ABAP", "Oracle ERP", "Microsoft Dynamics", "Workday", "SuccessFactors", "Darwinbox"],
    "CRM Systems": ["Salesforce", "Zoho", "HubSpot"],
  },
  "Emerging Technologies": {
    "Blockchain": ["Ethereum", "Solidity", "Hyperledger"],
    "IoT": ["MQTT", "Arduino", "Raspberry Pi"],
    "Game Development": ["Unity", "Unreal Engine"],
    "No-Code/Low-Code": ["OutSystems", "Mendix", "Power Apps"],
  },
};

const nonTechData = {
  "Banking & Financial Services": {
    "Liability Products": ["Current Account (CA) Management", "Savings Account (SA) Management", "CASA Operations", "Fixed Deposits / Term Deposits"],
    "Asset Products": ["Wealth Management", "Investment Products (MF, Bonds, PMS)", "Insurance Products (LI/GI/Health)", "Working Capital Loans", "Business Loans / SME Lending"],
    "Compliance": ["KYC / AML Compliance", "Customer Onboarding & Documentation", "Regulatory Compliance"],
    "Operations": ["Branch Banking Operations", "Retail Banking Processes", "Portfolio Management (Liability/Asset/AUM)"],
    "Sales & RM": ["Lead Generation & Sourcing", "Cross-selling & Up-selling", "Financial Planning & Advisory", "Sales Target Management", "Client Lifecycle Management"],
  },
  "Logistics / Supply Chain": {
    "Warehousing": ["Inventory Management", "Warehouse Management", "Warehouse Automation Tools"],
    "Transportation": ["Last-mile Delivery Operations", "Reverse Logistics", "Transportation / Fleet Management", "Route Optimization"],
    "Procurement / Vendor": ["Procurement & Vendor Management", "Sourcing & Negotiation", "Freight & Cargo Handling", "3PL / 4PL Coordination", "Customs Clearance & Export/Import Processes"],
    "Planning & Analytics": ["Supply Planning", "Demand Forecasting", "Supply Chain Analytics", "Stock Reconciliation", "Risk Management in Supply Chain", "Lean Logistics & Waste Reduction"],
  },
  "E-Commerce / Retail": {
    "Marketplace / Fulfillment": ["E-commerce Operations", "Order Processing & Tracking", "Returns/Refund/Replacement Operations", "D2C Fulfillment Processes", "Partner/Marketplace SLAs"],
    "Customer Experience": ["Customer Experience (CX)", "Traffic/Conversion Analytics", "Cart Abandonment Analysis"],
    "Catalog / Inventory": ["SKU & Catalogue Management", "Inventory Sync (Omni-channel)", "Product Listing (SEO-Optimized)"],
    "Payments & Finance": ["Digital Payments & Fraud Checks", "Payment Gateway Coordination"],
    "Marketing / Growth": ["Online Merchandising", "Pricing Strategy & Promotions", "Consumer Behavior Analysis", "Campaign Performance Reporting"],
  },
  "Manufacturing / Production": {
    "Production": ["Production Planning", "MRP (Material Requirements Planning)", "SAP PP / SAP MM Operations", "Factory Operations Management", "Workforce Scheduling", "Production Line Balancing"],
    "Quality": ["Quality Control (QC)", "Health & Safety Compliance", "ISO/GMP/HACCP Standards Knowledge"],
    "Materials / Costing": ["Raw Material Procurement", "Product Costing & BOM Analysis", "Inventory Control in Plants", "Vendor Development"],
    "Process Improvement": ["Process Improvement / Lean Manufacturing", "6S / Kaizen / TPM Methods", "Machine Efficiency (OEE) Improvement", "Maintenance & Utilities Monitoring"],
  },
  "Media / Digital / Marketing": {
    "Content": ["Content Strategy", "Copywriting", "Video Content Planning"],
    "Digital Marketing": ["Digital Marketing", "SEO (Search Engine Optimization)", "SEM / Google Ads", "Social Media Management", "Email/SMS Marketing", "Lead Generation", "Performance Marketing Optimization"],
    "Campaign / Brand": ["Brand Campaign Planning", "Influencer Coordination", "Creative Briefing & Content Calendar", "Media Buying & Budget Planning"],
    "Analytics / Research": ["Web Analytics (GA4 etc.)", "Market Research & Insights", "Audience Segmentation", "Ad Copy & Creative Optimization"],
  },
};

const generateCTCOptions = () => {
  const options = [];
  for (let i = 1; i <= 99; i++) options.push(`${i} LPA`);
  return options;
};

const noticePeriodOptions = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"];
const educationOptions = ["10th", "12th", "Diploma", "B.Sc", "B.Com", "B.A", "B.Tech / B.E", "BCA", "MBA", "MCA", "M.Tech", "M.Sc", "Ph.D", "Other"];

const defaultForm = {
  candidate: "", mob: "", emails: "", dob: "", pan_number: "",
  curr_emp: "", highest_education: "",
  current_ctc: "", exp_ctc: "",
  total_exp_year: "0", total_exp_months: "0",
  rel_exp_year: "0", rel_exp_months: "0",
  notice_period: "",
  curr_state: "", curr_loc: "",
  pref_state: "", pref_loc: "",
  skill_type: "Technical",
  tech_category: "", tech_subcategory: "",
  tech_skill: [], tech_exp: [],
  nontech_category: "", nontech_subcategory: "",
  nontech_skill: [], nontech_exp: [],
  self_rate: "",
};

export default function CandidateApply() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState("list"); // "list" | "detail" | "form" | "success"
  const [positions, setPositions] = useState([]);
  const [posLoading, setPosLoading] = useState(true);
  const [posError, setPosError] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [cvFile, setCvFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRequired, setPhotoRequired] = useState(false);
  const [clientAnswers, setClientAnswers] = useState({});   // client-requirement answers, keyed by question index
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Consent checkboxes
  const [consent1, setConsent1] = useState(true); // data collection
  const [consent2, setConsent2] = useState(true); // shared resume pool
  const [consent3, setConsent3] = useState(true); // 24-month retention
  const [consent4, setConsent4] = useState(true); // notifications
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSkillExp, setSelectedSkillExp] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(null); // { applied, status, canReapply }

  // Filters
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await axios.get("/api/direct-apply/positions");
        if (res.data.success) setPositions(res.data.positions);
        else setPosError(res.data.message || "Failed to load positions");
      } catch (err) {
        setPosError(err.response?.data?.message || "Failed to load positions");
      } finally {
        setPosLoading(false);
      }
    };
    fetchPositions();
  }, []);

  // If ?pos_id= is present (coming from a shareable position link), jump straight to that position
  useEffect(() => {
    const deepPosId = searchParams.get("pos_id");
    if (!deepPosId || posLoading) return;
    // Find the position in the loaded list
    const found = positions.find(p => String(p.pos_id) === String(deepPosId));
    if (found) {
      handleApplyNow(found);
    } else {
      // Fetch directly from the full-detail endpoint and go straight to form
      axios.get(`/api/direct-apply/position/${deepPosId}`)
        .then(res => {
          if (res.data.success) handleApplyNow(res.data.position);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posLoading, positions]);

  // Helper: normalise location to a clean array of city strings
  const locArray = (loc) => {
    if (!loc) return [];
    if (Array.isArray(loc)) return loc.filter(Boolean);
    // stored as comma-separated string fallback
    return loc.split(",").map(s => s.trim()).filter(Boolean);
  };

  // Derive unique filter options from loaded positions
  const uniqueClients    = [...new Set(positions.map(p => p.client).filter(Boolean))].sort();
  // Expand every position's location array into one flat unique list
  const uniqueLocations  = [...new Set(positions.flatMap(p => locArray(p.location)))].sort();
  const uniqueCategories = [...new Set(positions.map(p => p.skill_category).filter(Boolean))].sort();

  // Apply all filters
  const filteredPositions = positions.filter(p => {
    if (filterClient   && p.client !== filterClient)                                           return false;
    // location filter: check if any city in this position matches the selected city
    if (filterLocation && !locArray(p.location).includes(filterLocation))                      return false;
    if (filterCategory && p.skill_category !== filterCategory)                                 return false;
    if (search) {
      const q = search.toLowerCase();
      const locStr = locArray(p.location).join(" ").toLowerCase();
      if (
        !(p.position || "").toLowerCase().includes(q) &&
        !(p.client   || "").toLowerCase().includes(q) &&
        !locStr.includes(q) &&
        !(p.skill_category || "").toLowerCase().includes(q) &&
        !(p.description    || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSearch(""); setFilterClient(""); setFilterLocation(""); setFilterCategory("");
  };
  const hasFilters = search || filterClient || filterLocation || filterCategory;

  const [detailLoading, setDetailLoading] = useState(false);

  const handleViewDetail = async (pos) => {
    setView("detail");
    setSelectedPos(pos);        // show card data immediately while loading
    window.scrollTo(0, 0);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/direct-apply/position/${pos.pos_id}`);
      if (res.data.success) setSelectedPos(res.data.position);
    } catch (_) { /* keep card-level data on error */ }
    finally { setDetailLoading(false); }
  };

  const handleApplyNow = async (pos) => {
    setSelectedPos(pos);
    setForm(defaultForm);
    setCvFile(null);
    setPhotoFile(null);
    setSubmitError(null);
    setAlreadyApplied(null);
    setClientAnswers({});
    // Use photoRequired already on the position if present, else fetch it
    setPhotoRequired(pos?.photoRequired === true);
    setView("form");
    window.scrollTo(0, 0);
    // Ensure we have full detail (photoRequired + clientQuestions) for the form.
    if (pos?.photoRequired === undefined || pos?.clientQuestions === undefined) {
      try {
        const res = await axios.get(`/api/direct-apply/position/${pos.pos_id}`);
        if (res.data.success) {
          setSelectedPos(res.data.position);
          setPhotoRequired(res.data.position?.photoRequired === true);
        }
      } catch (_) { /* leave as-is */ }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Reset applied-check when email changes
    if (name === "emails") setAlreadyApplied(null);
  };

  // Check if this email already has an active application for the selected position
  const handleEmailBlur = async (e) => {
    const email = e.target.value.trim();
    if (!email || !selectedPos?.pos_id) return;
    try {
      const res = await axios.post("/api/direct-apply/check-applied", {
        pos_id: selectedPos.pos_id,
        emails: email,
      });
      setAlreadyApplied(res.data);
    } catch (_) { /* ignore — submit will catch it */ }
  };

  const handleCategoryChange = (e) => {
    setForm((f) => ({
      ...f,
      tech_category: e.target.value,
      tech_subcategory: "",
      tech_skill: [],
      tech_exp: [],
    }));
    setSelectedSkill("");
    setSelectedSkillExp("");
  };

  const handleNonTechCategoryChange = (e) => {
    setForm((f) => ({
      ...f,
      nontech_category: e.target.value,
      nontech_subcategory: "",
      nontech_skill: [],
      nontech_exp: [],
    }));
  };

  const handleAddSkill = () => {
    if (!selectedSkill || !selectedSkillExp) return;
    setForm((f) => ({
      ...f,
      tech_skill: [...f.tech_skill, selectedSkill],
      tech_exp: [...f.tech_exp, selectedSkillExp],
    }));
    setSelectedSkill("");
    setSelectedSkillExp("");
  };

  const handleRemoveSkill = (idx) => {
    setForm((f) => ({
      ...f,
      tech_skill: f.tech_skill.filter((_, i) => i !== idx),
      tech_exp: f.tech_exp.filter((_, i) => i !== idx),
    }));
  };

  const handleNonTechAddSkill = () => {
    const sub = form.nontech_subcategory;
    const cat = form.nontech_category;
    if (!sub || !cat) return;
    const skills = nonTechData[cat]?.[sub] || [];
    const skill = form._nontech_skill_select;
    const exp = form._nontech_exp_select;
    if (!skill || !exp) return;
    setForm((f) => ({
      ...f,
      nontech_skill: [...f.nontech_skill, skill],
      nontech_exp: [...f.nontech_exp, exp],
      _nontech_skill_select: "",
      _nontech_exp_select: "",
    }));
  };

  const handleRemoveNonTechSkill = (idx) => {
    setForm((f) => ({
      ...f,
      nontech_skill: f.nontech_skill.filter((_, i) => i !== idx),
      nontech_exp: f.nontech_exp.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.candidate || !form.mob || !form.emails) {
      setSubmitError("Name, email, and phone are required.");
      return;
    }
    if (!(form.pan_number || "").trim()) {
      setSubmitError("PAN number is required.");
      return;
    }
    if (!cvFile) {
      setSubmitError("Please upload your CV / Resume — it is required.");
      return;
    }
    if (!consent1 || !consent2 || !consent3) {
      setSubmitError("Please accept all required consents before submitting.");
      return;
    }
    if (photoRequired && !photoFile) {
      setSubmitError("A candidate photo is required for this position. Please upload a photo.");
      return;
    }
    const cqErr = validateClientAnswers(selectedPos?.clientQuestions, clientAnswers);
    if (cqErr) { setSubmitError(cqErr); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Upload candidate photo (if provided) via the same base64 JSON endpoint
      let photo_url = "";
      if (photoFile) {
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(photoFile);
          });
          const upRes = await axios.post("/api/direct-apply/upload-cv", {
            filename:    `photo_${photoFile.name}`,
            contentType: photoFile.type || "image/jpeg",
            base64,
          });
          if (upRes.data.success) photo_url = upRes.data.url;
        } catch (upErr) {
          console.warn("Photo upload failed:", upErr.message);
        }
      }
      if (photoRequired && !photo_url) {
        setSubmitError("Photo upload failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Upload CV via backend as base64 JSON (avoids multipart/Cloud Run stream issues)
      let cv_url = "";
      if (cvFile) {
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]); // strip data:...;base64,
            reader.onerror = reject;
            reader.readAsDataURL(cvFile);
          });
          const upRes = await axios.post("/api/direct-apply/upload-cv", {
            filename:    cvFile.name,
            contentType: cvFile.type || "application/octet-stream",
            base64,
          });
          if (upRes.data.success) cv_url = upRes.data.url;
        } catch (upErr) {
          console.warn("CV upload failed, continuing without CV:", upErr.message);
        }
      }

      const total_exp = `${form.total_exp_year || 0} yr ${form.total_exp_months || 0} mo`;
      const rel_exp = `${form.rel_exp_year || 0} yr ${form.rel_exp_months || 0} mo`;

      const payload = {
        pos_id: selectedPos.pos_id,
        rec: searchParams.get("rec") || "",   // recruiter email from share link
        // clientspoc, client, hr_name intentionally omitted — backend reads them from DB
        candidate: form.candidate,
        mob: form.mob,
        emails: form.emails,
        dob: form.dob,
        curr_emp: form.curr_emp,
        highest_education: form.highest_education,
        current_ctc: form.current_ctc,
        exp_ctc: form.exp_ctc,
        total_exp,
        rel_exp,
        notice_period: form.notice_period,
        curr_state: form.curr_state,
        curr_loc: form.curr_loc,
        pref_state: form.pref_state,
        pref_loc: form.pref_loc,
        skill_type: form.skill_type,
        tech_category: form.tech_category,
        tech_subcategory: form.tech_subcategory,
        tech_skill: JSON.stringify(form.tech_skill),
        tech_exp: JSON.stringify(form.tech_exp),
        nontech_category: form.nontech_category,
        nontech_subcategory: form.nontech_subcategory,
        nontech_skill: JSON.stringify(form.nontech_skill),
        nontech_exp: JSON.stringify(form.nontech_exp),
        self_rate: form.self_rate,
        cv_url,
        pan_number: (form.pan_number || "").trim().toUpperCase(),
        photo_url,
        client_answers: buildClientAnswers(selectedPos?.clientQuestions, clientAnswers),
      };

      const res = await axios.post("/api/direct-apply/submit", payload);
      if (res.data.success) {
        setView("success");
        window.scrollTo(0, 0);
      } else {
        setSubmitError(res.data.message || "Submission failed.");
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button for detail and form views */}
        {(view === "detail" || view === "form") && (
          <button
            onClick={() => setView(view === "form" ? "detail" : "list")}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500 transition-colors mb-4"
          >
            <ChevronLeft size={16} /> {view === "form" ? "Back to Position Details" : "Back to Positions"}
          </button>
        )}
        {/* SUCCESS VIEW */}
        {view === "success" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-600 mb-2">
                Thank you for applying for <strong>{selectedPos?.position}</strong> at <strong>{selectedPos?.client}</strong>.
              </p>
              <p className="text-gray-500 text-sm mb-6">We'll be in touch soon.</p>
              <button
                onClick={() => { setView("list"); setSelectedPos(null); }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Apply for Another Position
              </button>
            </div>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === "detail" && selectedPos && (
          <div className="max-w-6xl mx-auto flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {/* Hero card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              {/* Hero header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <h1 className="text-2xl font-bold mb-1">{selectedPos.position}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-orange-100 text-sm mt-1">
                  {selectedPos.client && <span className="flex items-center gap-1"><Building size={14} />{selectedPos.client}</span>}
                  {locArray(selectedPos.location).length > 0 && (
                    <span className="flex items-center gap-1"><MapPin size={14} />{locArray(selectedPos.location).join(", ")}</span>
                  )}
                  {selectedPos.experience && <span className="flex items-center gap-1"><Briefcase size={14} />{selectedPos.experience}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPos.skill_category && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{selectedPos.skill_category}</span>}
                  {selectedPos.pos_cat && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{selectedPos.pos_cat}</span>}
                </div>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
              <div className="p-6 space-y-6">

                {/* Key facts grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedPos.experience && (
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                      <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">Experience</p>
                      <p className="text-sm font-bold text-gray-800">{selectedPos.experience}</p>
                    </div>
                  )}
                  {(selectedPos.ctcStart || selectedPos.ctcEnd) && (
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                      <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">CTC Range</p>
                      <p className="text-sm font-bold text-gray-800">
                        {selectedPos.ctcStart && selectedPos.ctcEnd
                          ? `₹${Number(selectedPos.ctcStart).toLocaleString('en-IN')} – ₹${Number(selectedPos.ctcEnd).toLocaleString('en-IN')} LPA`
                          : selectedPos.ctcStart || selectedPos.ctcEnd}
                      </p>
                    </div>
                  )}
                  {locArray(selectedPos.location).length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 col-span-2 sm:col-span-3">
                      <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-2">Locations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {locArray(selectedPos.location).map(city => (
                          <span key={city} className="px-2.5 py-0.5 bg-white border border-orange-200 rounded-full text-xs font-semibold text-gray-700">{city}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Description */}
                {selectedPos.job_desc && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" />Job Description
                    </h3>
                    <div className="text-gray-700 text-sm bg-gray-50 rounded-xl p-4"><RichTextView value={selectedPos.job_desc} /></div>
                  </div>
                )}

                {/* Key Responsibilities */}
                {selectedPos.key_res && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" />Key Responsibilities
                    </h3>
                    <div className="text-gray-700 text-sm bg-gray-50 rounded-xl p-4"><RichTextView value={selectedPos.key_res} /></div>
                  </div>
                )}

                {/* Must Have */}
                {selectedPos.m_have && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-green-500 rounded-full inline-block" />Must Have Skills
                    </h3>
                    <div className="text-gray-700 text-sm bg-green-50 rounded-xl p-4 border border-green-100"><RichTextView value={selectedPos.m_have} /></div>
                  </div>
                )}

                {/* Good to Have */}
                {selectedPos.g_have && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-400 rounded-full inline-block" />Good to Have Skills
                    </h3>
                    <div className="text-gray-700 text-sm bg-blue-50 rounded-xl p-4 border border-blue-100"><RichTextView value={selectedPos.g_have} /></div>
                  </div>
                )}

                {/* Competencies */}
                {selectedPos.compet && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-purple-400 rounded-full inline-block" />Competencies
                    </h3>
                    <div className="text-gray-700 text-sm bg-purple-50 rounded-xl p-4 border border-purple-100"><RichTextView value={selectedPos.compet} /></div>
                  </div>
                )}

                {/* Candidate Instructions — shown before the company overview */}
                {selectedPos.candidate_instructions && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />Candidate Instructions
                    </h3>
                    <div className="text-gray-700 text-sm bg-blue-50/60 border border-blue-100 rounded-xl p-4"><RichTextView value={selectedPos.candidate_instructions} /></div>
                  </div>
                )}

                {/* Company Overview */}
                {selectedPos.comp_view && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gray-400 rounded-full inline-block" />About the Company
                    </h3>
                    <div className="text-gray-700 text-sm bg-gray-50 rounded-xl p-4"><RichTextView value={selectedPos.comp_view} /></div>
                  </div>
                )}

                {/* Apply CTA */}
                <button
                  onClick={() => handleApplyNow(selectedPos)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-base transition-colors"
                >
                  Apply Now
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Related Positions Sidebar */}
          {(() => {
            const related = positions
              .filter(p => p.skill_category === selectedPos.skill_category && String(p.pos_id) !== String(selectedPos.pos_id))
              .slice(0, 5);
            return (
              <div className="w-72 shrink-0 hidden lg:block sticky top-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
                    <h3 className="text-white font-bold text-base">Related Positions</h3>
                    {selectedPos.skill_category && (
                      <p className="text-orange-100 text-xs mt-0.5">{selectedPos.skill_category}</p>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {related.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No related positions found</p>
                    ) : related.map(pos => (
                      <button
                        key={pos.pos_id}
                        onClick={() => handleViewDetail(pos)}
                        className="block w-full text-left px-5 py-4 hover:bg-orange-50 transition-colors group"
                      >
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors line-clamp-2">{pos.position}</p>
                        {pos.client && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Building size={11} />{pos.client}</p>}
                        {pos.location && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={11} />
                            {Array.isArray(pos.location) ? pos.location.slice(0,2).join(', ') : pos.location}
                          </p>
                        )}
                        {pos.experience && <p className="text-xs text-orange-500 font-semibold mt-1">{pos.experience}</p>}
                      </button>
                    ))}
                  </div>
                  <div className="px-5 py-4 border-t border-gray-100">
                    <a
                      href="https://www.recruiterv.com/apply"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                    >
                      View All Positions
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Open Positions</h1>
              <p className="text-gray-500">Browse and apply directly — no account needed</p>
            </div>

            {/* ── Filter Bar ── */}
            {!posLoading && !posError && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Keyword search */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search positions…"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  {/* Client filter */}
                  <select
                    value={filterClient}
                    onChange={e => setFilterClient(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-600"
                  >
                    <option value="">All Companies</option>
                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {/* Location filter */}
                  <select
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-600"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>

                  {/* Skill Category filter */}
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-600"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Results count + clear */}
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>
                    Showing <strong className="text-gray-800">{filteredPositions.length}</strong> of <strong className="text-gray-800">{positions.length}</strong> positions
                  </span>
                  {hasFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-orange-500 hover:text-orange-700 font-medium">
                      <X size={14} /> Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {posLoading && (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {posError && (
              <div className="text-center py-20 text-red-500">{posError}</div>
            )}

            {!posLoading && !posError && filteredPositions.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                {hasFilters ? "No positions match your filters. Try adjusting them." : "No open positions at the moment. Check back soon!"}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md hover:border-orange-300 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{pos.position}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                      <Building size={14} />
                      <span>{pos.client || "Confidential"}</span>
                    </div>
                    {locArray(pos.location).length > 0 && (() => {
                      const cities = locArray(pos.location);
                      const shown  = cities.slice(0, 2);
                      const extra  = cities.length - 2;
                      return (
                        <div className="flex items-start gap-1 text-gray-500 text-sm mb-1">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                          <span>
                            {shown.join(", ")}
                            {extra > 0 && <span className="ml-1 text-orange-500 font-semibold">+{extra} more</span>}
                          </span>
                        </div>
                      );
                    })()}
                    {pos.experience && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                        <Briefcase size={14} />
                        <span>{pos.experience} experience</span>
                      </div>
                    )}
                    {pos.skill_category && (
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {pos.skill_category}
                      </span>
                    )}
                    {pos.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{pos.description}</p>
                    )}
                  </div>
                  {/* Two action buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleViewDetail(pos)}
                      className="flex-1 border border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold py-2 rounded-lg text-sm transition-colors"
                    >
                      View JD
                    </button>
                    <button
                      onClick={() => handleApplyNow(pos)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FORM VIEW */}
        {view === "form" && selectedPos && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 mb-6 shadow-lg">
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Applying for</div>
              <h2 className="text-2xl font-bold mb-1">{selectedPos.position}</h2>
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                <span className="flex items-center gap-1"><Building size={14} />{selectedPos.client || "Confidential"}</span>
                {selectedPos.location && <span className="flex items-center gap-1"><MapPin size={14} />{selectedPos.location}</span>}
                {selectedPos.experience && <span className="flex items-center gap-1"><Briefcase size={14} />{selectedPos.experience}</span>}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Personal Info */}
              <div className={sectionClass}>
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                    <input name="candidate" value={form.candidate} onChange={handleChange} className={inputClass} required placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                    <input name="emails" value={form.emails} onChange={handleChange} onBlur={handleEmailBlur} type="email" className={inputClass} required placeholder="your@email.com" />
                    {alreadyApplied?.applied && (
                      <div className="mt-2 flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
                        <span className="text-lg leading-none">⚠️</span>
                        <span>You have already applied for this position. Your current status is <strong>{alreadyApplied.status}</strong>. You can apply again only after your application is rejected.</span>
                      </div>
                    )}
                    {alreadyApplied?.canReapply && (
                      <div className="mt-2 flex items-start gap-2 bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-sm text-green-800">
                        <span className="text-lg leading-none">✅</span>
                        <span>Your previous application was <strong>{alreadyApplied.status}</strong>. You may re-apply.</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Phone <span className="text-red-500">*</span></label>
                    <input name="mob" value={form.mob} onChange={handleChange} className={inputClass} required placeholder="10-digit mobile" maxLength={10} />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input name="dob" value={form.dob} onChange={handleChange} type="date" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>PAN Number <span className="text-red-500">*</span></label>
                    <input name="pan_number" value={form.pan_number} onChange={handleChange} className={inputClass} required placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: "uppercase" }} />
                  </div>
                  <div>
                    <label className={labelClass}>Current Employer</label>
                    <input name="curr_emp" value={form.curr_emp} onChange={handleChange} className={inputClass} placeholder="Company name" />
                  </div>
                  <div>
                    <label className={labelClass}>Highest Education</label>
                    <select name="highest_education" value={form.highest_education} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      {educationOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Experience & CTC */}
              <div className={sectionClass}>
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">Experience & Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Total Experience</label>
                    <div className="flex gap-2">
                      <select name="total_exp_year" value={form.total_exp_year} onChange={handleChange} className={inputClass}>
                        {Array.from({ length: 31 }, (_, i) => i).map((y) => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                      <select name="total_exp_months" value={form.total_exp_months} onChange={handleChange} className={inputClass}>
                        {Array.from({ length: 12 }, (_, i) => i).map((m) => <option key={m} value={m}>{m} mo</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Relevant Experience</label>
                    <div className="flex gap-2">
                      <select name="rel_exp_year" value={form.rel_exp_year} onChange={handleChange} className={inputClass}>
                        {Array.from({ length: 31 }, (_, i) => i).map((y) => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                      <select name="rel_exp_months" value={form.rel_exp_months} onChange={handleChange} className={inputClass}>
                        {Array.from({ length: 12 }, (_, i) => i).map((m) => <option key={m} value={m}>{m} mo</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Current CTC</label>
                    <select name="current_ctc" value={form.current_ctc} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      {generateCTCOptions().map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Expected CTC</label>
                    <select name="exp_ctc" value={form.exp_ctc} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      {generateCTCOptions().map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Notice Period</label>
                    <select name="notice_period" value={form.notice_period} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      {noticePeriodOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className={sectionClass}>
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Current State</label>
                    <select name="curr_state" value={form.curr_state} onChange={handleChange} className={inputClass}>
                      <option value="">Select State</option>
                      {Object.keys(indiaStatesAndCities).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Current City</label>
                    <select name="curr_loc" value={form.curr_loc} onChange={handleChange} className={inputClass} disabled={!form.curr_state}>
                      <option value="">Select City</option>
                      {(indiaStatesAndCities[form.curr_state] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Preferred State</label>
                    <select name="pref_state" value={form.pref_state} onChange={handleChange} className={inputClass}>
                      <option value="">Select State</option>
                      {Object.keys(indiaStatesAndCities).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Preferred City</label>
                    <select name="pref_loc" value={form.pref_loc} onChange={handleChange} className={inputClass} disabled={!form.pref_state}>
                      <option value="">Select City</option>
                      {(indiaStatesAndCities[form.pref_state] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className={sectionClass}>
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">Skills</h3>
                <div className="mb-4">
                  <label className={labelClass}>Skill Type</label>
                  <div className="flex gap-4">
                    {["Technical", "Non-Technical"].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="skill_type" value={type} checked={form.skill_type === type} onChange={handleChange} className="accent-orange-500" />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.skill_type === "Technical" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>Category</label>
                        <select name="tech_category" value={form.tech_category} onChange={handleCategoryChange} className={inputClass}>
                          <option value="">Select Category</option>
                          {Object.keys(techData).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {form.tech_category && (
                        <div>
                          <label className={labelClass}>Sub-Category</label>
                          <select name="tech_subcategory" value={form.tech_subcategory} onChange={handleChange} className={inputClass}>
                            <option value="">Select Sub-Category</option>
                            {Object.keys(techData[form.tech_category] || {}).map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    {form.tech_subcategory && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} className={`${inputClass} flex-1 min-w-[150px]`}>
                          <option value="">Select Skill</option>
                          {(techData[form.tech_category]?.[form.tech_subcategory] || []).map((sk) => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                        <select value={selectedSkillExp} onChange={(e) => setSelectedSkillExp(e.target.value)} className={`${inputClass} w-28`}>
                          <option value="">Exp</option>
                          {Array.from({ length: 31 }, (_, i) => i).map((y) => <option key={y} value={`${y} yr`}>{y} yr</option>)}
                        </select>
                        <button type="button" onClick={handleAddSkill} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">Add</button>
                      </div>
                    )}
                    {form.tech_skill.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.tech_skill.map((sk, i) => (
                          <span key={i} className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            {sk} ({form.tech_exp[i]})
                            <button type="button" onClick={() => handleRemoveSkill(i)} className="ml-1 text-orange-400 hover:text-red-500 font-bold">x</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {form.skill_type === "Non-Technical" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>Category</label>
                        <select value={form.nontech_category} onChange={handleNonTechCategoryChange} className={inputClass}>
                          <option value="">Select Category</option>
                          {Object.keys(nonTechData).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {form.nontech_category && (
                        <div>
                          <label className={labelClass}>Sub-Category</label>
                          <select name="nontech_subcategory" value={form.nontech_subcategory} onChange={handleChange} className={inputClass}>
                            <option value="">Select Sub-Category</option>
                            {Object.keys(nonTechData[form.nontech_category] || {}).map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    {form.nontech_subcategory && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <select value={form._nontech_skill_select || ""} onChange={(e) => setForm((f) => ({ ...f, _nontech_skill_select: e.target.value }))} className={`${inputClass} flex-1 min-w-[150px]`}>
                          <option value="">Select Skill</option>
                          {(nonTechData[form.nontech_category]?.[form.nontech_subcategory] || []).map((sk) => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                        <select value={form._nontech_exp_select || ""} onChange={(e) => setForm((f) => ({ ...f, _nontech_exp_select: e.target.value }))} className={`${inputClass} w-28`}>
                          <option value="">Exp</option>
                          {Array.from({ length: 31 }, (_, i) => i).map((y) => <option key={y} value={`${y} yr`}>{y} yr</option>)}
                        </select>
                        <button type="button" onClick={handleNonTechAddSkill} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">Add</button>
                      </div>
                    )}
                    {form.nontech_skill.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.nontech_skill.map((sk, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            {sk} ({form.nontech_exp[i]})
                            <button type="button" onClick={() => handleRemoveNonTechSkill(i)} className="ml-1 text-blue-400 hover:text-red-500 font-bold">x</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4">
                  <label className={labelClass}>Self Rating (1-10)</label>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, self_rate: String(n) }))}
                        className={`w-9 h-9 rounded-lg border text-sm font-bold transition-colors ${form.self_rate === String(n) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className={sectionClass}>
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">Documents</h3>
                <div>
                  <label className={labelClass}>Upload CV / Resume <span className="text-red-500">*</span></label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-orange-400 transition-colors bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    {cvFile ? (
                      <span className="text-sm text-green-600 font-semibold">{cvFile.name}</span>
                    ) : (
                      <>
                        <span className="text-sm text-gray-500">Click to upload PDF, DOC, DOCX</span>
                        <span className="text-xs text-gray-400 mt-1">Max 10MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setCvFile(e.target.files[0] || null)}
                    />
                  </label>
                </div>

                {photoRequired && (
                  <div className="mt-5">
                    <label className={labelClass}>
                      Candidate Photo <span className="text-red-500">*</span>
                      <span className="ml-1 text-xs font-normal text-gray-400">(required for this position)</span>
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 transition-colors bg-blue-50">
                      <Upload className="w-8 h-8 text-blue-400 mb-2" />
                      {photoFile ? (
                        <span className="text-sm text-green-600 font-semibold">{photoFile.name}</span>
                      ) : (
                        <>
                          <span className="text-sm text-gray-500">Click to upload a passport-style photo</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG — Max 5MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setPhotoFile(e.target.files[0] || null)}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* ── Client Requirements ────────────────────────────────── */}
              {Array.isArray(selectedPos?.clientQuestions) && selectedPos.clientQuestions.length > 0 && (
                <div className={sectionClass}>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Client Requirements</h3>
                  <p className="text-xs text-gray-500 mb-4">Please answer the following questions from the client for this position.</p>
                  <ClientQuestions
                    questions={selectedPos.clientQuestions}
                    answers={clientAnswers}
                    setAnswers={setClientAnswers}
                    accent="orange"
                  />
                </div>
              )}

              {/* ── Consent Checkboxes ─────────────────────────────────── */}
              <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Privacy & Consent</p>
                {[
                  {
                    key: "c1", checked: consent1, setter: setConsent1, required: true,
                    title: "I agree to RecruiterV collecting and storing my profile, resume, and contact details to facilitate job opportunities through its recruiter network.",
                    sub: "This is required to use the platform. Your data is stored securely and never sold to third parties.",
                  },
                  {
                    key: "c2", checked: consent2, setter: setConsent2, required: true,
                    title: "I understand that if a recruiter marks my application as 'Not Matching', or does not update my status within 2 days, my profile will be moved to the RecruiterV shared Resume Database — visible to all verified recruiters on the platform.",
                    sub: "This helps other recruiters find you for roles that may be a better fit. You can withdraw from the shared pool at any time via Privacy Settings.",
                  },
                  {
                    key: "c3", checked: consent3, setter: setConsent3, required: true,
                    title: "I agree to my profile being retained on the RecruiterV platform for up to 24 months from my last activity date.",
                    sub: "You can request deletion at any time by writing to privacy@recruiterv.in",
                  },
                  {
                    key: "c4", checked: consent4, setter: setConsent4, required: false,
                    title: "I would like to receive job alerts and recruiter outreach notifications via email and WhatsApp.",
                    sub: "You can unsubscribe at any time from your notification settings.",
                  },
                ].map(({ key, checked, setter, required, title, sub }) => (
                  <div
                    key={key}
                    onClick={() => setter(v => !v)}
                    style={{
                      background: checked ? "#f0fdf4" : "#fff",
                      border: `1.5px solid ${checked ? "#86efac" : "#e2e8f0"}`,
                      borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                      display: "flex", gap: 12, alignItems: "flex-start",
                      transition: "all 0.18s",
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${checked ? "#22c55e" : "#cbd5e1"}`,
                      background: checked ? "#22c55e" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {checked && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0, lineHeight: 1.5 }}>
                        {title}
                      </p>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || alreadyApplied?.applied === true || !consent1 || !consent2 || !consent3}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
