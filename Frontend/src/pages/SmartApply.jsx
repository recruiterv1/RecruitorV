import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Upload, CheckCircle, X, Briefcase, Building, MapPin, FileText,
  ChevronLeft, Zap, Star, Search, AlertCircle, Loader2, ArrowRight,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import ClientQuestions, { buildClientAnswers, validateClientAnswers } from "../components/ClientQuestions";

// ── Static data (same as CandidateApply) ─────────────────────────────────────
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
    "DevOps Tools": ["Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI"],
    "CI/CD & Monitoring": ["CircleCI", "Prometheus", "Grafana", "ELK Stack", "Datadog"],
  },
  "Data Science & Analytics": {
    "Machine Learning": ["Scikit-learn", "TensorFlow", "PyTorch", "Keras", "spaCy", "Hugging Face"],
    "ML Ops": ["MLflow", "Kubeflow", "SageMaker", "OpenAI APIs", "LangChain"],
    "Data Tools": ["Pandas", "NumPy", "Apache Spark", "Hadoop", "Kafka", "Airflow"],
    "BI & Analytics": ["Power BI", "Tableau", "Looker", "Qlik", "Talend"],
  },
  "Web Development": {
    Frontend: ["React.js", "Angular", "Vue.js", "Next.js", "Tailwind CSS", "Redux"],
    Backend: ["Spring Boot", "Django", "Flask", "Node.js", "Express.js", "NestJS", ".NET Core"],
  },
  "Programming Languages": {
    "Programming Languages": ["Java", "Python", "C", "C++", "C#", "Go", "Rust", "Kotlin", "JavaScript", "TypeScript", "Swift"],
  },
  "Mobile App Technologies": {
    "Mobile Development": ["Android (Java)", "Android (Kotlin)", "iOS (Swift)", "Flutter", "React Native"],
  },
  "Database Technologies": {
    "Database Technologies": ["MySQL", "PostgreSQL", "Oracle", "MS SQL Server", "MongoDB", "Redis", "Snowflake"],
  },
  "Testing & Quality Assurance": {
    "Test Automation": ["Selenium", "Cypress", "Playwright", "TestNG", "Postman"],
  },
  "Enterprise Systems": {
    "ERP Systems": ["SAP S/4HANA", "ABAP", "Oracle ERP", "Microsoft Dynamics", "Workday"],
    "CRM Systems": ["Salesforce", "Zoho", "HubSpot"],
  },
};

const nonTechData = {
  "Banking & Financial Services": {
    "Sales & RM": ["Lead Generation & Sourcing", "Cross-selling & Up-selling", "Financial Planning & Advisory", "Sales Target Management"],
    "Compliance": ["KYC / AML Compliance", "Customer Onboarding & Documentation"],
  },
  "Logistics / Supply Chain": {
    "Warehousing": ["Inventory Management", "Warehouse Management"],
    "Transportation": ["Last-mile Delivery Operations", "Transportation / Fleet Management"],
  },
  "E-Commerce / Retail": {
    "Marketplace / Fulfillment": ["E-commerce Operations", "Order Processing & Tracking"],
    "Marketing / Growth": ["Performance Marketing Optimization", "Campaign Performance Reporting"],
  },
  "Manufacturing / Production": {
    "Production": ["Production Planning", "Factory Operations Management"],
    "Quality": ["Quality Control (QC)", "ISO/GMP/HACCP Standards Knowledge"],
  },
  "Media / Digital / Marketing": {
    "Digital Marketing": ["SEO (Search Engine Optimization)", "SEM / Google Ads", "Social Media Management", "Lead Generation"],
    "Content": ["Content Strategy", "Copywriting"],
  },
};

const generateCTCOptions = () => Array.from({ length: 99 }, (_, i) => `${i + 1} LPA`);
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

const MAX_SELECT = 3;

// ── Shared style objects (must be defined before component) ───────────────────
const inputClassStyle = {
  width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, outline: "none", background: "#fff",
  color: "#1e293b", fontFamily: "inherit", boxSizing: "border-box",
};
const inputStyleObj = {
  width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, outline: "none", background: "#fff",
  color: "#1e293b", fontFamily: "inherit", boxSizing: "border-box",
};
const labelStyleObj = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5,
};

const locArray = (loc) => {
  if (!loc) return [];
  if (Array.isArray(loc)) return loc.filter(Boolean);
  return loc.split(",").map(s => s.trim()).filter(Boolean);
};

// ── Match score bar ───────────────────────────────────────────────────────────
function MatchBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
  const color = pct >= 60 ? "#16a34a" : pct >= 30 ? "#f97316" : "#94a3b8";
  const label = pct >= 60 ? "Strong Match" : pct >= 30 ? "Good Match" : "Possible Match";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Position Card ─────────────────────────────────────────────────────────────
function PositionCard({ pos, selected, onToggle, maxScore, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const cities = locArray(pos.location);

  return (
    <div
      onClick={() => !disabled && onToggle(pos)}
      style={{
        border: selected ? "2.5px solid #f97316" : "1.5px solid #e2e8f0",
        borderRadius: 16,
        background: selected ? "#fff7ed" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all 0.2s",
        boxShadow: selected ? "0 4px 20px rgba(249,115,22,0.18)" : "0 1px 6px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Selection indicator */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        width: 22, height: 22, borderRadius: "50%",
        border: selected ? "none" : "2px solid #cbd5e1",
        background: selected ? "#f97316" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0,
      }}>
        {selected && <CheckCircle size={14} color="#fff" strokeWidth={3} />}
      </div>

      <div style={{ padding: "16px 44px 16px 16px" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.3 }}>
          {pos.position}
        </h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 7 }}>
          {pos.client && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b" }}>
              <Building size={12} /> {pos.client}
            </span>
          )}
          {cities.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b" }}>
              <MapPin size={12} /> {cities.slice(0, 2).join(", ")}{cities.length > 2 && ` +${cities.length - 2}`}
            </span>
          )}
          {pos.experience && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b" }}>
              <Briefcase size={12} /> {pos.experience}
            </span>
          )}
        </div>

        {pos.skill_category && (
          <span style={{
            display: "inline-block", marginTop: 8, background: selected ? "#fed7aa" : "#f1f5f9",
            color: selected ? "#c2410c" : "#475569", fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 99,
          }}>
            {pos.skill_category}
          </span>
        )}

        <MatchBar score={pos.matchScore || 0} maxScore={maxScore} />

        {/* Description expand */}
        {pos.description && (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, color: "#f97316", fontWeight: 700,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              {expanded ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> View details</>}
            </button>
            {expanded && (
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {pos.description.slice(0, 400)}{pos.description.length > 400 ? "…" : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SmartApply() {
  // Upload + matching state
  const [uploadFile, setUploadFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [positions, setPositions] = useState(null);   // null = not yet fetched
  const [cvUrl, setCvUrl] = useState("");              // uploaded URL after CV upload
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [extractedInfo, setExtractedInfo] = useState({});  // auto-filled fields from CV

  // Selection state
  const [selected, setSelected] = useState([]);        // array of pos objects
  // Client-requirement answers per selected position: { [pos_id]: { [qIdx]: answer } }
  const [posAnswers, setPosAnswers] = useState({});
  const setPosAnswer = (posId, updater) =>
    setPosAnswers(prev => ({ ...prev, [posId]: typeof updater === 'function' ? updater(prev[posId] || {}) : updater }));

  // Application form
  const [view, setView] = useState("upload");          // "upload" | "select" | "form" | "success"
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResults, setSubmitResults] = useState([]);  // per-position results
  // Consent checkboxes
  const [consent1, setConsent1] = useState(true); // data collection
  const [consent2, setConsent2] = useState(true); // shared resume pool
  const [consent3, setConsent3] = useState(true); // 24-month retention
  const [consent4, setConsent4] = useState(true); // notifications

  // Skill form helpers
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSkillExp, setSelectedSkillExp] = useState("");

  const fileInputRef = useRef(null);

  // ── File handling ─────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) { setMatchError("File too large. Max 10 MB."); return; }
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.some(t => file.type === t) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setMatchError("Only PDF, DOC, or DOCX files are supported.");
      return;
    }
    setUploadFile(file);
    setMatchError("");
    setMatching(true);
    setPositions(null);
    setSelected([]);
    setExtractedInfo({});
    setForm(defaultForm);
    setPhotoFile(null);
    setView("select");

    try {
      // Read as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload CV first (so we have the URL ready for apply)
      axios.post("/api/direct-apply/upload-cv", {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        base64,
      }).then(r => { if (r.data.success) setCvUrl(r.data.url); }).catch(() => {});

      // Match positions
      const res = await axios.post("/api/direct-apply/match-positions", {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        base64,
      });

      if (res.data.success) {
        setPositions(res.data.positions);
        // Pre-fill form with whatever was extracted from the CV
        if (res.data.extractedInfo) {
          setExtractedInfo(res.data.extractedInfo);
          setForm(f => ({
            ...f,
            candidate: res.data.extractedInfo.candidate || f.candidate,
            emails:    res.data.extractedInfo.emails    || f.emails,
            mob:       res.data.extractedInfo.mob       || f.mob,
            dob:       res.data.extractedInfo.dob       || f.dob,
            curr_emp:  res.data.extractedInfo.curr_emp  || f.curr_emp,
          }));
        }
      } else {
        setMatchError(res.data.message || "Could not analyse resume. Showing all positions.");
        setPositions([]);
      }
    } catch (err) {
      setMatchError("Could not parse resume — showing all positions.");
      // fallback: load all positions
      try {
        const fallback = await axios.get("/api/direct-apply/positions");
        if (fallback.data.success) setPositions(fallback.data.positions.map(p => ({ ...p, matchScore: 0 })));
        else setPositions([]);
      } catch { setPositions([]); }
    } finally {
      setMatching(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback(() => setDragging(false), []);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (pos) => {
    setSelected(prev => {
      const idx = prev.findIndex(p => p.pos_id === pos.pos_id);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, pos];
    });
  };

  const isSelected = (pos) => selected.some(p => p.pos_id === pos.pos_id);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddSkill = () => {
    if (!selectedSkill || !selectedSkillExp) return;
    setForm(f => ({ ...f, tech_skill: [...f.tech_skill, selectedSkill], tech_exp: [...f.tech_exp, selectedSkillExp] }));
    setSelectedSkill(""); setSelectedSkillExp("");
  };
  const handleRemoveSkill = (i) => setForm(f => ({
    ...f, tech_skill: f.tech_skill.filter((_, j) => j !== i), tech_exp: f.tech_exp.filter((_, j) => j !== i),
  }));
  const handleNonTechAddSkill = () => {
    const skill = form._nontech_skill_select;
    const exp   = form._nontech_exp_select;
    if (!skill || !exp) return;
    setForm(f => ({ ...f, nontech_skill: [...f.nontech_skill, skill], nontech_exp: [...f.nontech_exp, exp], _nontech_skill_select: "", _nontech_exp_select: "" }));
  };
  const handleRemoveNonTechSkill = (i) => setForm(f => ({
    ...f, nontech_skill: f.nontech_skill.filter((_, j) => j !== i), nontech_exp: f.nontech_exp.filter((_, j) => j !== i),
  }));

  // ── Submit to all selected positions ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.candidate || !form.mob || !form.emails) {
      setSubmitError("Name, email and phone are required.");
      return;
    }
    if (!(form.pan_number || "").trim()) {
      setSubmitError("PAN number is required.");
      return;
    }
    if (!cvUrl) {
      setSubmitError("A resume is required. Please upload your resume to continue.");
      return;
    }
    if (selected.length === 0) {
      setSubmitError("Please select at least one position.");
      return;
    }
    if (!consent1 || !consent2 || !consent3) {
      setSubmitError("Please accept all required consents before submitting.");
      return;
    }
    const photoNeeded = selected.some(p => p.photoRequired === true);
    if (photoNeeded && !photoFile) {
      setSubmitError("One or more selected positions require a candidate photo. Please upload a photo.");
      return;
    }
    // Validate client-requirement answers for every selected position that has questions.
    for (const pos of selected) {
      const qs = pos.clientQuestions || [];
      if (qs.length) {
        const err = validateClientAnswers(qs, posAnswers[pos.pos_id] || {});
        if (err) { setSubmitError(`${pos.position}: ${err}`); return; }
      }
    }
    setSubmitting(true);
    setSubmitError("");

    // Upload candidate photo (if provided) via the base64 JSON endpoint
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
    if (photoNeeded && !photo_url) {
      setSubmitError("Photo upload failed. Please try again.");
      setSubmitting(false);
      return;
    }

    const total_exp = `${form.total_exp_year || 0} yr ${form.total_exp_months || 0} mo`;
    const rel_exp   = `${form.rel_exp_year || 0} yr ${form.rel_exp_months || 0} mo`;

    const basePayload = {
      rec: "",
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
      cv_url: cvUrl,
      pan_number: (form.pan_number || "").trim().toUpperCase(),
      photo_url,
    };

    // Fire all submissions in parallel
    const results = await Promise.allSettled(
      selected.map(pos =>
        axios.post("/api/direct-apply/submit", {
          ...basePayload,
          pos_id: pos.pos_id,
          client_answers: buildClientAnswers(pos.clientQuestions || [], posAnswers[pos.pos_id] || {}),
        })
          .then(r => ({ pos, success: r.data.success, message: r.data.message }))
          .catch(err => ({ pos, success: false, message: err.response?.data?.message || "Submission failed" }))
      )
    );

    const finalResults = results.map(r => r.value || r.reason);
    setSubmitResults(finalResults);
    setSubmitting(false);
    setView("success");
    window.scrollTo(0, 0);
  };

  // ── Filter + sort positions ────────────────────────────────────────────────
  // maxScore MUST be declared first — used by displayPositions and hasStrongMatches below
  const maxScore = Math.max(...(positions || []).map(p => p.matchScore || 0), 1);
  const uniqueCategories = [...new Set((positions || []).map(p => p.skill_category).filter(Boolean))].sort();

  const applyTextFilter = (p) => {
    if (filterCategory && p.skill_category !== filterCategory) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        (p.position || "").toLowerCase().includes(q) ||
        (p.client || "").toLowerCase().includes(q) ||
        (p.skill_category || "").toLowerCase().includes(q) ||
        locArray(p.location).join(" ").toLowerCase().includes(q)
      );
    }
    return true;
  };

  const hasStrongMatches = (positions || []).some(
    p => maxScore > 0 && Math.round(((p.matchScore || 0) / maxScore) * 100) >= 60
  );

  const displayPositionsFinal = (positions || []).filter(p => {
    if (hasStrongMatches) {
      const pct = maxScore > 0 ? Math.round(((p.matchScore || 0) / maxScore) * 100) : 0;
      if (pct < 60) return false;
    }
    return applyTextFilter(p);
  });


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 55%,#f97316 100%)",
        padding: "48px 24px 56px",
        textAlign: "center",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "6px 16px", marginBottom: 18 }}>
          <Zap size={14} color="#fbbf24" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>AI-MATCHED APPLY</span>
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
          Upload Your Resume.<br />
          <span style={{ color: "#fdba74" }}>We'll Find Your Best Matches.</span>
        </h1>
        <p style={{ margin: "0 auto", maxWidth: 520, fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
          Drop your CV and instantly see which open positions fit your profile. Select up to 3 and apply in one click.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>

        {/* ── UPLOAD VIEW ─────────────────────────────────────────────────── */}
        {view === "upload" && (
          <div style={{ marginTop: -32 }}>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2.5px dashed ${dragging ? "#f97316" : "#cbd5e1"}`,
                borderRadius: 24,
                background: dragging ? "#fff7ed" : "#fff",
                padding: "60px 24px",
                textAlign: "center",
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                transition: "all 0.2s",
              }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
                background: "linear-gradient(135deg,#fff7ed,#fed7aa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(249,115,22,0.2)",
              }}>
                <Upload size={34} color="#f97316" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "1.4rem", fontWeight: 800, color: "#1e293b" }}>
                Drop Your Resume Here
              </h2>
              <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 15 }}>
                or click to browse your files
              </p>
              <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {["PDF", "DOC", "DOCX"].map(ext => (
                  <span key={ext} style={{
                    background: "#f8fafc", border: "1.5px solid #e2e8f0",
                    borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#64748b",
                  }}>{ext}</span>
                ))}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>Max 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={e => processFile(e.target.files?.[0])}
              />
            </div>
            {matchError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginTop: 16, color: "#991b1b", fontSize: 13 }}>
                <AlertCircle size={16} /> {matchError}
              </div>
            )}

            {/* Browse all positions link */}
            <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#94a3b8" }}>
              Prefer to browse all openings?{" "}
              <a href="/apply" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>View All Positions →</a>
            </p>
          </div>
        )}

        {/* ── SELECT VIEW ─────────────────────────────────────────────────── */}
        {view === "select" && (
          <div style={{ marginTop: 32 }}>
            {/* Back */}
            <button
              onClick={() => { setView("upload"); setPositions(null); setSelected([]); setUploadFile(null); setCvUrl(""); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}
            >
              <ChevronLeft size={16} /> Upload a different resume
            </button>

            {/* File badge */}
            {uploadFile && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", marginBottom: 20, fontSize: 13, color: "#374151" }}>
                <FileText size={16} color="#f97316" />
                <span style={{ fontWeight: 700 }}>{uploadFile.name}</span>
                <span style={{ color: "#94a3b8" }}>({(uploadFile.size / 1024).toFixed(0)} KB)</span>
              </div>
            )}

            {/* Loading state */}
            {matching && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", border: "4px solid #fed7aa", borderTopColor: "#f97316",
                  margin: "0 auto 20px", animation: "spin 0.8s linear infinite",
                }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>Analysing Your Resume…</h3>
                <p style={{ color: "#64748b", fontSize: 14 }}>Matching your skills to open positions</p>
              </div>
            )}

            {!matching && positions !== null && (
              <>
                {matchError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 12, padding: "10px 14px", marginBottom: 16, color: "#92400e", fontSize: 13 }}>
                    <AlertCircle size={15} /> {matchError}
                  </div>
                )}

                {/* Heading + counter */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 800, color: "#1e293b" }}>
                      {displayPositionsFinal.length} Strong Match{displayPositionsFinal.length !== 1 ? "es" : ""} Found
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                      {hasStrongMatches
                        ? <>Showing only <strong style={{ color: "#16a34a" }}>strong matches</strong> from your resume. Select up to <strong>3</strong> to apply at once.</>
                        : <>Select up to <strong>3</strong> positions to apply at once.</>}
                    </p>
                  </div>

                  {/* Floating selected pill */}
                  {selected.length > 0 && (
                    <button
                      onClick={() => { setView("form"); window.scrollTo(0, 0); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff",
                        border: "none", borderRadius: 12, padding: "12px 20px", cursor: "pointer",
                        fontWeight: 800, fontSize: 14, boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                      }}
                    >
                      <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                        {selected.length}
                      </span>
                      Apply to {selected.length} Position{selected.length > 1 ? "s" : ""} <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {/* Filter bar */}
                <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: "1 1 200px" }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      placeholder="Search positions…"
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      style={{ ...inputClassStyle, paddingLeft: 32 }}
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ ...inputClassStyle, flex: "1 1 180px" }}
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {(searchText || filterCategory) && (
                    <button onClick={() => { setSearchText(""); setFilterCategory(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#f97316", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                      <X size={14} style={{ verticalAlign: "middle" }} /> Clear
                    </button>
                  )}
                </div>

                {/* Selection count bar */}
                <div style={{ background: selected.length === MAX_SELECT ? "#fff7ed" : "#f8fafc", border: `1.5px solid ${selected.length === MAX_SELECT ? "#fed7aa" : "#e2e8f0"}`, borderRadius: 12, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                    {selected.length === 0
                      ? "Click any card below to select a position"
                      : `${selected.length} / ${MAX_SELECT} positions selected`}
                  </span>
                  {selected.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {selected.map(p => (
                        <span key={p.pos_id} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: "#fff", border: "1.5px solid #fed7aa", borderRadius: 99,
                          padding: "2px 10px 2px 8px", fontSize: 11, fontWeight: 700, color: "#c2410c",
                        }}>
                          {p.position?.slice(0, 22)}{p.position?.length > 22 ? "…" : ""}
                          <button type="button" onClick={() => toggleSelect(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f97316", lineHeight: 1, padding: 0 }}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cards grid */}
                {displayPositionsFinal.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                    No positions found. Try clearing filters.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
                    {displayPositionsFinal.map(pos => (
                      <PositionCard
                        key={pos.pos_id || pos.id}
                        pos={pos}
                        selected={isSelected(pos)}
                        onToggle={toggleSelect}
                        maxScore={maxScore}
                        disabled={!isSelected(pos) && selected.length >= MAX_SELECT}
                      />
                    ))}
                  </div>
                )}

                {/* Bottom CTA */}
                {selected.length > 0 && (
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <button
                      onClick={() => { setView("form"); window.scrollTo(0, 0); }}
                      style={{
                        background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff",
                        border: "none", borderRadius: 14, padding: "16px 40px", cursor: "pointer",
                        fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
                      }}
                    >
                      Apply to {selected.length} Position{selected.length > 1 ? "s" : ""} →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── FORM VIEW ─────────────────────────────────────────────────────── */}
        {view === "form" && (
          <div style={{ maxWidth: 720, margin: "32px auto 0" }}>
            <button
              onClick={() => setView("select")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}
            >
              <ChevronLeft size={16} /> Back to positions
            </button>

            {/* Applied-for summary */}
            <div style={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, color: "#fff" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.7, textTransform: "uppercase", marginBottom: 8 }}>Applying for</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selected.map((p, i) => (
                  <div key={p.pos_id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(4px)" }}>
                    <span style={{ fontSize: 11, opacity: 0.7, marginRight: 6 }}>#{i + 1}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{p.position}</span>
                    {p.client && <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 6 }}>· {p.client}</span>}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* ── Client Requirements (per selected position) ────────────── */}
              {selected.some(p => (p.clientQuestions || []).length > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Client Requirements</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {selected.filter(p => (p.clientQuestions || []).length > 0).map(pos => (
                      <div key={pos.pos_id} style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{pos.position}</p>
                        {pos.client && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{pos.client}</p>}
                        <ClientQuestions
                          questions={pos.clientQuestions}
                          answers={posAnswers[pos.pos_id] || {}}
                          setAnswers={(updater) => setPosAnswer(pos.pos_id, updater)}
                          accent="blue"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Consent Checkboxes ─────────────────────────────────────── */}
              <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Privacy & Consent</p>
                {[
                  {
                    key: "c1", checked: consent1, setter: setConsent1,
                    title: "I agree to RecruiterV collecting and storing my profile, resume, and contact details to facilitate job opportunities through its recruiter network.",
                    sub: "This is required to use the platform. Your data is stored securely and never sold to third parties.",
                  },
                  {
                    key: "c2", checked: consent2, setter: setConsent2,
                    title: "I understand that if a recruiter marks my application as 'Not Matching', or does not update my status within 2 days, my profile will be moved to the RecruiterV shared Resume Database — visible to all verified recruiters on the platform.",
                    sub: "This helps other recruiters find you for roles that may be a better fit. You can withdraw from the shared pool at any time via Privacy Settings.",
                  },
                  {
                    key: "c3", checked: consent3, setter: setConsent3,
                    title: "I agree to my profile being retained on the RecruiterV platform for up to 24 months from my last activity date.",
                    sub: "You can request deletion at any time by writing to privacy@recruiterv.in",
                  },
                  {
                    key: "c4", checked: consent4, setter: setConsent4,
                    title: "I would like to receive job alerts and recruiter outreach notifications via email and WhatsApp.",
                    sub: "You can unsubscribe at any time from your notification settings.",
                  },
                ].map(({ key, checked, setter, title, sub }) => (
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0, lineHeight: 1.5 }}>{title}</p>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Personal Info */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "24px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Personal Information</h3>
                  {Object.keys(extractedInfo).length > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 99, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                      ✨ {Object.keys(extractedInfo).length} field{Object.keys(extractedInfo).length !== 1 ? "s" : ""} auto-filled from your CV
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  {[
                    { key: "candidate", label: "Full Name",        required: true,  type: "text",  placeholder: "Your full name" },
                    { key: "emails",    label: "Email",            required: true,  type: "email", placeholder: "your@email.com" },
                    { key: "mob",       label: "Phone",            required: true,  type: "text",  placeholder: "10-digit mobile", maxLength: 10 },
                    { key: "dob",       label: "Date of Birth",    required: false, type: "date" },
                    { key: "pan_number",label: "PAN Number",       required: true,  type: "text",  placeholder: "ABCDE1234F", maxLength: 10 },
                    { key: "curr_emp",  label: "Current Employer", required: false, type: "text",  placeholder: "Company name" },
                  ].map(({ key, label, required, type, placeholder, maxLength }) => {
                    const autoFilled = !!extractedInfo[key];
                    return (
                      <div key={key}>
                        <label style={labelStyleObj}>
                          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
                          {autoFilled && (
                            <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, color: "#16a34a", background: "#dcfce7", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.3 }}>
                              FROM CV
                            </span>
                          )}
                        </label>
                        <input
                          name={key}
                          value={form[key]}
                          onChange={handleChange}
                          type={type}
                          required={required}
                          placeholder={placeholder}
                          maxLength={maxLength}
                          style={{
                            ...inputStyleObj,
                            border: `1.5px solid ${autoFilled ? "#86efac" : "#e2e8f0"}`,
                            background: autoFilled ? "#f0fdf4" : "#fff",
                            transition: "border-color 0.2s, background 0.2s",
                          }}
                        />
                      </div>
                    );
                  })}
                  <div>
                    <label style={labelStyleObj}>Highest Education</label>
                    <select name="highest_education" value={form.highest_education} onChange={handleChange} style={inputStyleObj}>
                      <option value="">Select</option>
                      {educationOptions.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                {selected.some(p => p.photoRequired === true) && (
                  <div style={{ marginTop: 18 }}>
                    <label style={labelStyleObj}>
                      Candidate Photo <span style={{ color: "#ef4444" }}>*</span>
                      <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>(required for one or more selected positions)</span>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #93c5fd", borderRadius: 12, padding: 20, cursor: "pointer", background: "#eff6ff" }}>
                      {photoFile ? (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{photoFile.name}</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 13, color: "#64748b" }}>Click to upload a passport-style photo</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>JPG, PNG — Max 5MB</span>
                        </>
                      )}
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setPhotoFile(e.target.files[0] || null)} />
                    </label>
                  </div>
                )}
              </div>

              {/* Experience & CTC */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "24px", marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#1e293b", paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>Experience & Compensation</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  <div>
                    <label style={labelStyleObj}>Total Experience</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select name="total_exp_year" value={form.total_exp_year} onChange={handleChange} style={inputStyleObj}>
                        {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                      <select name="total_exp_months" value={form.total_exp_months} onChange={handleChange} style={inputStyleObj}>
                        {Array.from({ length: 12 }, (_, i) => i).map(m => <option key={m} value={m}>{m} mo</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Relevant Experience</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select name="rel_exp_year" value={form.rel_exp_year} onChange={handleChange} style={inputStyleObj}>
                        {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                      <select name="rel_exp_months" value={form.rel_exp_months} onChange={handleChange} style={inputStyleObj}>
                        {Array.from({ length: 12 }, (_, i) => i).map(m => <option key={m} value={m}>{m} mo</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Current CTC</label>
                    <select name="current_ctc" value={form.current_ctc} onChange={handleChange} style={inputStyleObj}>
                      <option value="">Select</option>
                      {generateCTCOptions().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Expected CTC</label>
                    <select name="exp_ctc" value={form.exp_ctc} onChange={handleChange} style={inputStyleObj}>
                      <option value="">Select</option>
                      {generateCTCOptions().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Notice Period</label>
                    <select name="notice_period" value={form.notice_period} onChange={handleChange} style={inputStyleObj}>
                      <option value="">Select</option>
                      {noticePeriodOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "24px", marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#1e293b", paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>Location</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  <div>
                    <label style={labelStyleObj}>Current State</label>
                    <select name="curr_state" value={form.curr_state} onChange={handleChange} style={inputStyleObj}>
                      <option value="">Select State</option>
                      {Object.keys(indiaStatesAndCities).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Current City</label>
                    <select name="curr_loc" value={form.curr_loc} onChange={handleChange} style={inputStyleObj} disabled={!form.curr_state}>
                      <option value="">Select City</option>
                      {(indiaStatesAndCities[form.curr_state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Preferred State</label>
                    <select name="pref_state" value={form.pref_state} onChange={handleChange} style={inputStyleObj}>
                      <option value="">Select State</option>
                      {Object.keys(indiaStatesAndCities).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyleObj}>Preferred City</label>
                    <select name="pref_loc" value={form.pref_loc} onChange={handleChange} style={inputStyleObj} disabled={!form.pref_state}>
                      <option value="">Select City</option>
                      {(indiaStatesAndCities[form.pref_state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "24px", marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#1e293b", paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>Skills</h3>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyleObj}>Skill Type</label>
                  <div style={{ display: "flex", gap: 20 }}>
                    {["Technical", "Non-Technical"].map(type => (
                      <label key={type} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                        <input type="radio" name="skill_type" value={type} checked={form.skill_type === type} onChange={handleChange} style={{ accentColor: "#f97316" }} />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {form.skill_type === "Technical" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyleObj}>Category</label>
                        <select name="tech_category" value={form.tech_category} onChange={e => setForm(f => ({ ...f, tech_category: e.target.value, tech_subcategory: "", tech_skill: [], tech_exp: [] }))} style={inputStyleObj}>
                          <option value="">Select Category</option>
                          {Object.keys(techData).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {form.tech_category && (
                        <div>
                          <label style={labelStyleObj}>Sub-Category</label>
                          <select name="tech_subcategory" value={form.tech_subcategory} onChange={handleChange} style={inputStyleObj}>
                            <option value="">Select</option>
                            {Object.keys(techData[form.tech_category] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    {form.tech_subcategory && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} style={{ ...inputStyleObj, flex: "1 1 150px" }}>
                          <option value="">Select Skill</option>
                          {(techData[form.tech_category]?.[form.tech_subcategory] || []).map(sk => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                        <select value={selectedSkillExp} onChange={e => setSelectedSkillExp(e.target.value)} style={{ ...inputStyleObj, width: 100 }}>
                          <option value="">Exp</option>
                          {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={`${y} yr`}>{y} yr</option>)}
                        </select>
                        <button type="button" onClick={handleAddSkill} style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
                      </div>
                    )}
                    {form.tech_skill.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {form.tech_skill.map((sk, i) => (
                          <span key={i} style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 99, padding: "3px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            {sk} ({form.tech_exp[i]})
                            <button type="button" onClick={() => handleRemoveSkill(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f97316", fontWeight: 900, padding: 0, lineHeight: 1 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {form.skill_type === "Non-Technical" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyleObj}>Category</label>
                        <select value={form.nontech_category} onChange={e => setForm(f => ({ ...f, nontech_category: e.target.value, nontech_subcategory: "", nontech_skill: [], nontech_exp: [] }))} style={inputStyleObj}>
                          <option value="">Select Category</option>
                          {Object.keys(nonTechData).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {form.nontech_category && (
                        <div>
                          <label style={labelStyleObj}>Sub-Category</label>
                          <select name="nontech_subcategory" value={form.nontech_subcategory} onChange={handleChange} style={inputStyleObj}>
                            <option value="">Select</option>
                            {Object.keys(nonTechData[form.nontech_category] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    {form.nontech_subcategory && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        <select value={form._nontech_skill_select || ""} onChange={e => setForm(f => ({ ...f, _nontech_skill_select: e.target.value }))} style={{ ...inputStyleObj, flex: "1 1 150px" }}>
                          <option value="">Select Skill</option>
                          {(nonTechData[form.nontech_category]?.[form.nontech_subcategory] || []).map(sk => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                        <select value={form._nontech_exp_select || ""} onChange={e => setForm(f => ({ ...f, _nontech_exp_select: e.target.value }))} style={{ ...inputStyleObj, width: 100 }}>
                          <option value="">Exp</option>
                          {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={`${y} yr`}>{y} yr</option>)}
                        </select>
                        <button type="button" onClick={handleNonTechAddSkill} style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add</button>
                      </div>
                    )}
                    {form.nontech_skill.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {form.nontech_skill.map((sk, i) => (
                          <span key={i} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 99, padding: "3px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            {sk} ({form.nontech_exp[i]})
                            <button type="button" onClick={() => handleRemoveNonTechSkill(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontWeight: 900, padding: 0, lineHeight: 1 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div style={{ marginTop: 18 }}>
                  <label style={labelStyleObj}>Self Rating (1–10)</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, self_rate: String(n) }))}
                        style={{
                          width: 36, height: 36, borderRadius: 8, border: form.self_rate === String(n) ? "none" : "1.5px solid #e2e8f0",
                          background: form.self_rate === String(n) ? "#f97316" : "#fff", color: form.self_rate === String(n) ? "#fff" : "#374151",
                          fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CV upload note */}
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={18} color="#16a34a" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                    {cvUrl ? "Resume uploaded successfully" : uploadFile ? "Resume being uploaded…" : "No resume attached"}
                  </div>
                  {uploadFile && <div style={{ fontSize: 12, color: "#16a34a" }}>{uploadFile.name}</div>}
                </div>
              </div>

              {submitError && (
                <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#991b1b", fontSize: 13 }}>
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !consent1 || !consent2 || !consent3}
                style={{
                  width: "100%", background: (submitting || !consent1 || !consent2 || !consent3) ? "#fdba74" : "linear-gradient(135deg,#f97316,#ea580c)",
                  color: "#fff", border: "none", borderRadius: 14, padding: "18px 24px",
                  fontSize: 16, fontWeight: 800, cursor: (submitting || !consent1 || !consent2 || !consent3) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: "0 4px 14px rgba(249,115,22,0.35)", transition: "all 0.2s",
                }}
              >
                {submitting ? (
                  <><Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Submitting to {selected.length} position{selected.length > 1 ? "s" : ""}…</>
                ) : (
                  <>Submit to {selected.length} Position{selected.length > 1 ? "s" : ""} <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── SUCCESS VIEW ──────────────────────────────────────────────────── */}
        {view === "success" && (
          <div style={{ maxWidth: 620, margin: "48px auto 0", textAlign: "center" }}>
            <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.1)", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)", padding: "36px 32px 32px" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle size={36} color="#fff" />
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: "1.6rem", fontWeight: 900, color: "#fff" }}>
                  Applications Submitted!
                </h2>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 15 }}>
                  You've applied to {submitResults.filter(r => r.success).length} position{submitResults.filter(r => r.success).length !== 1 ? "s" : ""}. We'll be in touch soon.
                </p>
              </div>

              {/* Per-position results */}
              <div style={{ padding: "24px 28px" }}>
                {submitResults.map((result, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 12, marginBottom: 10,
                    background: result.success ? "#f0fdf4" : "#fef2f2",
                    border: `1.5px solid ${result.success ? "#86efac" : "#fca5a5"}`,
                  }}>
                    {result.success
                      ? <CheckCircle size={18} color="#16a34a" />
                      : <AlertCircle size={18} color="#dc2626" />}
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: result.success ? "#166534" : "#991b1b" }}>
                        {result.pos.position}
                      </div>
                      {result.pos.client && <div style={{ fontSize: 12, color: "#64748b" }}>{result.pos.client}</div>}
                      {!result.success && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>{result.message}</div>}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                      background: result.success ? "#dcfce7" : "#fee2e2",
                      color: result.success ? "#16a34a" : "#dc2626",
                    }}>
                      {result.success ? "Submitted ✓" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "0 28px 28px", display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => { setView("upload"); setPositions(null); setSelected([]); setUploadFile(null); setPhotoFile(null); setCvUrl(""); setForm(defaultForm); setSubmitResults([]); setConsent1(true); setConsent2(true); setConsent3(true); setConsent4(true); window.scrollTo(0, 0); }}
                  style={{ flex: 1, background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Apply to More Positions
                </button>
                <a
                  href="/apply"
                  style={{ flex: 1, background: "#f8fafc", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 20px", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Browse All Openings
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}

