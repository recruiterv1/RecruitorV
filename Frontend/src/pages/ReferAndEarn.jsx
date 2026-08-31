import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Gift, Upload, Users, CheckCircle, Clock, Briefcase, Building,
  MapPin, Mail, Phone, Eye, Download, Search, X, ChevronDown,
  AlertCircle, Loader2, FileText, TrendingUp, Star, DollarSign,
  Calendar, ExternalLink,
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';

// ── Static data ───────────────────────────────────────────────────────────────
const indiaStatesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati"],
  "Assam": ["Guwahati","Silchar","Dibrugarh"],
  "Bihar": ["Patna","Gaya","Muzaffarpur"],
  "Chhattisgarh": ["Raipur","Bilaspur","Bhilai"],
  "Goa": ["Panaji","Margao"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Ambala","Hisar"],
  "Himachal Pradesh": ["Shimla","Dharamshala"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad"],
  "Karnataka": ["Bengaluru","Mysuru","Mangalore","Hubli"],
  "Kerala": ["Kochi","Thiruvananthapuram","Kozhikode","Thrissur"],
  "Madhya Pradesh": ["Indore","Bhopal","Gwalior","Jabalpur"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Thane"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Mohali"],
  "Rajasthan": ["Jaipur","Udaipur","Jodhpur","Kota"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad"],
  "Uttarakhand": ["Dehradun","Haridwar","Rishikesh"],
  "Uttar Pradesh": ["Lucknow","Noida","Ghaziabad","Kanpur","Agra","Varanasi"],
  "West Bengal": ["Kolkata","Howrah","Siliguri","Durgapur"],
  "Chandigarh": ["Chandigarh"],
  "Delhi": ["New Delhi"],
  "Jammu & Kashmir": ["Srinagar","Jammu"],
};

const techData = {
  "Cloud & DevOps": {
    "Cloud Providers": ["Amazon Web Services (AWS)","Microsoft Azure","Google Cloud Platform (GCP)"],
    "DevOps Tools": ["Docker","Kubernetes","Terraform","Ansible","Jenkins","GitHub Actions"],
    "CI/CD & Monitoring": ["CircleCI","Prometheus","Grafana","Datadog"],
  },
  "Data Science & Analytics": {
    "Machine Learning": ["Scikit-learn","TensorFlow","PyTorch","Keras","Hugging Face"],
    "Data Tools": ["Pandas","NumPy","Apache Spark","Kafka","Airflow"],
    "BI & Analytics": ["Power BI","Tableau","Looker","Qlik"],
  },
  "Web Development": {
    Frontend: ["React.js","Angular","Vue.js","Next.js","Tailwind CSS","Redux"],
    Backend: ["Spring Boot","Django","Flask","Node.js","Express.js","NestJS",".NET Core"],
  },
  "Programming Languages": {
    "Languages": ["Java","Python","C","C++","C#","Go","Kotlin","JavaScript","TypeScript","Swift"],
  },
  "Mobile App Technologies": {
    "Mobile Development": ["Android (Java)","Android (Kotlin)","iOS (Swift)","Flutter","React Native"],
  },
  "Database Technologies": {
    "Databases": ["MySQL","PostgreSQL","Oracle","MS SQL Server","MongoDB","Redis","Snowflake"],
  },
  "Enterprise Systems": {
    "ERP": ["SAP S/4HANA","ABAP","Oracle ERP","Microsoft Dynamics","Workday"],
    "CRM": ["Salesforce","Zoho","HubSpot"],
  },
};

const nonTechData = {
  "Banking & Financial Services": {
    "Sales & RM": ["Lead Generation","Cross-selling","Financial Planning","Client Lifecycle Management"],
    "Compliance": ["KYC / AML Compliance","Customer Onboarding"],
  },
  "Logistics / Supply Chain": {
    "Warehousing": ["Inventory Management","Warehouse Management"],
    "Transportation": ["Last-mile Delivery","Fleet Management","Route Optimization"],
  },
  "E-Commerce / Retail": {
    "Operations": ["E-commerce Operations","Order Processing","Returns Management"],
    "Marketing": ["Performance Marketing","Campaign Reporting"],
  },
  "Manufacturing / Production": {
    "Production": ["Production Planning","Factory Operations"],
    "Quality": ["Quality Control (QC)","ISO/GMP Standards"],
  },
  "Media / Digital / Marketing": {
    "Digital Marketing": ["SEO","SEM / Google Ads","Social Media Management","Lead Generation"],
    "Content": ["Content Strategy","Copywriting"],
  },
};

const generateCTCOptions = () => Array.from({ length: 99 }, (_, i) => `${i + 1} LPA`);
const noticePeriodOptions = ["Immediate","15 Days","30 Days","45 Days","60 Days","90 Days"];
const educationOptions = ["10th","12th","Diploma","B.Sc","B.Com","B.A","B.Tech / B.E","BCA","MBA","MCA","M.Tech","M.Sc","Ph.D","Other"];

const defaultForm = {
  candidate: "", mob: "", emails: "", dob: "",
  curr_emp: "", highest_education: "",
  current_ctc: "", exp_ctc: "",
  total_exp_year: "0", total_exp_months: "0",
  rel_exp_year: "0", rel_exp_months: "0",
  notice_period: "",
  curr_state: "", curr_loc: "",
  pref_state: "", pref_loc: "",
  skill_type: "Technical",
  tech_category: "", tech_subcategory: "", tech_skill: [], tech_exp: [],
  nontech_category: "", nontech_subcategory: "", nontech_skill: [], nontech_exp: [],
  self_rate: "",
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, outline: "none", background: "#fff",
  color: "#1e293b", fontFamily: "inherit", boxSizing: "border-box",
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5,
};
const card = {
  background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0",
  padding: "24px", marginBottom: 20,
};
const cardHead = {
  margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#1e293b",
  paddingBottom: 12, borderBottom: "1px solid #f1f5f9",
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  available:   { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  used:        { bg: "#f0fdf4", text: "#16a34a", border: "#86efac" },
  shortlisted: { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
  selected:    { bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  offered:     { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  rejected:    { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" },
};
function StatusBadge({ status }) {
  const s = (status || "available").toLowerCase();
  const key = Object.keys(STATUS_STYLE).find(k => s.includes(k)) || "available";
  const st = STATUS_STYLE[key];
  return (
    <span style={{
      background: st.bg, color: st.text, border: `1.5px solid ${st.border}`,
      borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {status || "Available"}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReferAndEarn() {
  const [tab, setTab] = useState("upload");   // "upload" | "referrals"
  const [form, setForm] = useState(defaultForm);
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSkillExp, setSelectedSkillExp] = useState("");

  // Referrals tab
  const [referrals, setReferrals] = useState([]);
  const [summary, setSummary] = useState({ total: 0, shortlisted: 0, placed: 0, recruiters: 0 });
  const [loadingRef, setLoadingRef] = useState(false);
  const [refError, setRefError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchReferrals = async () => {
    setLoadingRef(true); setRefError("");
    try {
      const res = await axios.get("/api/referral/my-referrals", { withCredentials: true });
      if (res.data.success) { setReferrals(res.data.referrals); setSummary(res.data.summary); }
      else setRefError(res.data.message || "Failed to load referrals.");
    } catch (err) {
      setRefError(err.response?.data?.message || "Failed to load referrals.");
    } finally { setLoadingRef(false); }
  };

  useEffect(() => { if (tab === "referrals") fetchReferrals(); }, [tab]);

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
    const skill = form._nontech_skill_select; const exp = form._nontech_exp_select;
    if (!skill || !exp) return;
    setForm(f => ({ ...f, nontech_skill: [...f.nontech_skill, skill], nontech_exp: [...f.nontech_exp, exp], _nontech_skill_select: "", _nontech_exp_select: "" }));
  };
  const handleRemoveNonTechSkill = (i) => setForm(f => ({
    ...f, nontech_skill: f.nontech_skill.filter((_, j) => j !== i), nontech_exp: f.nontech_exp.filter((_, j) => j !== i),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.candidate || !form.mob || !form.emails) {
      setSubmitError("Name, email and phone are required."); return;
    }
    if (!consentChecked) {
      setSubmitError("You must confirm that the candidate has been informed before submitting."); return;
    }
    setSubmitting(true); setSubmitError("");
    try {
      // Upload CV first if present
      let cv_url = "";
      if (cvFile) {
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(cvFile);
          });
          const upRes = await axios.post("/api/direct-apply/upload-cv", {
            filename: cvFile.name, contentType: cvFile.type || "application/octet-stream", base64,
          }, { withCredentials: true });
          if (upRes.data.success) cv_url = upRes.data.url;
        } catch (_) {}
      }

      const total_exp = `${form.total_exp_year || 0} yr ${form.total_exp_months || 0} mo`;
      const rel_exp   = `${form.rel_exp_year   || 0} yr ${form.rel_exp_months   || 0} mo`;

      const payload = {
        candidate: form.candidate, mob: form.mob, emails: form.emails, dob: form.dob,
        curr_emp: form.curr_emp, highest_education: form.highest_education,
        current_ctc: form.current_ctc, exp_ctc: form.exp_ctc,
        total_exp, rel_exp, notice_period: form.notice_period,
        curr_state: form.curr_state, curr_loc: form.curr_loc,
        pref_state: form.pref_state, pref_loc: form.pref_loc,
        skill_type: form.skill_type,
        tech_category: form.tech_category, tech_subcategory: form.tech_subcategory,
        tech_skill: JSON.stringify(form.tech_skill), tech_exp: JSON.stringify(form.tech_exp),
        nontech_category: form.nontech_category, nontech_subcategory: form.nontech_subcategory,
        nontech_skill: JSON.stringify(form.nontech_skill), nontech_exp: JSON.stringify(form.nontech_exp),
        self_rate: form.self_rate, cv_url,
      };

      const res = await axios.post("/api/referral/submit", payload, { withCredentials: true });
      if (res.data.success) {
        setSubmitSuccess(true);
        setForm(defaultForm); setCvFile(null); setConsentChecked(false);
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(res.data.message || "Submission failed.");
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return "—"; }
  };

  const filteredReferrals = referrals.filter(r => {
    if (filterStatus && !(r.statusa || "").toLowerCase().includes(filterStatus.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.candidate || "").toLowerCase().includes(q) ||
        (r.emails || "").toLowerCase().includes(q) ||
        (r.pos_name || "").toLowerCase().includes(q) ||
        (r.curr_loc || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ padding: "0 0 48px" }}>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 55%,#f97316 100%)",
        padding: "32px 32px 28px", marginBottom: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gift size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>Refer & Earn</h1>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
              Refer candidates, track their status, and earn rewards when they get placed.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {[
            { id: "upload",    label: "Upload Resume",   icon: Upload },
            { id: "referrals", label: "My Referrals",    icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
              border: tab === id ? "none" : "1.5px solid rgba(255,255,255,0.35)",
              background: tab === id ? "#fff" : "transparent",
              color: tab === id ? "#2563eb" : "#fff",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "32px auto 0", padding: "0 20px" }}>

        {/* ── UPLOAD TAB ─────────────────────────────────────────────────── */}
        {tab === "upload" && (
          <>
            {submitSuccess && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "14px 18px", marginBottom: 24, color: "#166534", fontWeight: 700, fontSize: 14 }}>
                <CheckCircle size={20} color="#16a34a" /> Candidate referred successfully! They will appear in your My Referrals tab.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Personal Info */}
              <div style={card}>
                <h3 style={cardHead}>Personal Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  <div>
                    <label style={lbl}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                    <input name="candidate" value={form.candidate} onChange={handleChange} style={inp} required placeholder="Candidate full name" />
                  </div>
                  <div>
                    <label style={lbl}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                    <input name="emails" value={form.emails} onChange={handleChange} type="email" style={inp} required placeholder="candidate@email.com" />
                  </div>
                  <div>
                    <label style={lbl}>Phone <span style={{ color: "#ef4444" }}>*</span></label>
                    <input name="mob" value={form.mob} onChange={handleChange} style={inp} required placeholder="10-digit mobile" maxLength={10} />
                  </div>
                  <div>
                    <label style={lbl}>Date of Birth</label>
                    <input name="dob" value={form.dob} onChange={handleChange} type="date" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Current Employer</label>
                    <input name="curr_emp" value={form.curr_emp} onChange={handleChange} style={inp} placeholder="Company name" />
                  </div>
                  <div>
                    <label style={lbl}>Highest Education</label>
                    <select name="highest_education" value={form.highest_education} onChange={handleChange} style={inp}>
                      <option value="">Select</option>
                      {educationOptions.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Experience & CTC */}
              <div style={card}>
                <h3 style={cardHead}>Experience & Compensation</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  <div>
                    <label style={lbl}>Total Experience</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select name="total_exp_year" value={form.total_exp_year} onChange={handleChange} style={inp}>
                        {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                      <select name="total_exp_months" value={form.total_exp_months} onChange={handleChange} style={inp}>
                        {Array.from({ length: 12 }, (_, i) => i).map(m => <option key={m} value={m}>{m} mo</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Relevant Experience</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select name="rel_exp_year" value={form.rel_exp_year} onChange={handleChange} style={inp}>
                        {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                      <select name="rel_exp_months" value={form.rel_exp_months} onChange={handleChange} style={inp}>
                        {Array.from({ length: 12 }, (_, i) => i).map(m => <option key={m} value={m}>{m} mo</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Current CTC</label>
                    <select name="current_ctc" value={form.current_ctc} onChange={handleChange} style={inp}>
                      <option value="">Select</option>
                      {generateCTCOptions().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Expected CTC</label>
                    <select name="exp_ctc" value={form.exp_ctc} onChange={handleChange} style={inp}>
                      <option value="">Select</option>
                      {generateCTCOptions().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Notice Period</label>
                    <select name="notice_period" value={form.notice_period} onChange={handleChange} style={inp}>
                      <option value="">Select</option>
                      {noticePeriodOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div style={card}>
                <h3 style={cardHead}>Location</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                  <div>
                    <label style={lbl}>Current State</label>
                    <select name="curr_state" value={form.curr_state} onChange={handleChange} style={inp}>
                      <option value="">Select State</option>
                      {Object.keys(indiaStatesAndCities).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Current City</label>
                    <select name="curr_loc" value={form.curr_loc} onChange={handleChange} style={inp} disabled={!form.curr_state}>
                      <option value="">Select City</option>
                      {(indiaStatesAndCities[form.curr_state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Preferred State</label>
                    <select name="pref_state" value={form.pref_state} onChange={handleChange} style={inp}>
                      <option value="">Select State</option>
                      {Object.keys(indiaStatesAndCities).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Preferred City</label>
                    <select name="pref_loc" value={form.pref_loc} onChange={handleChange} style={inp} disabled={!form.pref_state}>
                      <option value="">Select City</option>
                      {(indiaStatesAndCities[form.pref_state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div style={card}>
                <h3 style={cardHead}>Skills</h3>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Skill Type</label>
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
                        <label style={lbl}>Category</label>
                        <select name="tech_category" value={form.tech_category}
                          onChange={e => setForm(f => ({ ...f, tech_category: e.target.value, tech_subcategory: "", tech_skill: [], tech_exp: [] }))} style={inp}>
                          <option value="">Select Category</option>
                          {Object.keys(techData).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {form.tech_category && (
                        <div>
                          <label style={lbl}>Sub-Category</label>
                          <select name="tech_subcategory" value={form.tech_subcategory} onChange={handleChange} style={inp}>
                            <option value="">Select</option>
                            {Object.keys(techData[form.tech_category] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    {form.tech_subcategory && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} style={{ ...inp, flex: "1 1 150px" }}>
                          <option value="">Select Skill</option>
                          {(techData[form.tech_category]?.[form.tech_subcategory] || []).map(sk => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                        <select value={selectedSkillExp} onChange={e => setSelectedSkillExp(e.target.value)} style={{ ...inp, width: 100 }}>
                          <option value="">Exp</option>
                          {Array.from({ length: 31 }, (_, i) => i).map(y => <option key={y} value={`${y} yr`}>{y} yr</option>)}
                        </select>
                        <button type="button" onClick={handleAddSkill} style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add</button>
                      </div>
                    )}
                    {form.tech_skill.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {form.tech_skill.map((sk, i) => (
                          <span key={i} style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 99, padding: "3px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            {sk} ({form.tech_exp[i]})
                            <button type="button" onClick={() => handleRemoveSkill(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f97316", fontWeight: 900, padding: 0 }}>×</button>
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
                        <label style={lbl}>Category</label>
                        <select value={form.nontech_category}
                          onChange={e => setForm(f => ({ ...f, nontech_category: e.target.value, nontech_subcategory: "", nontech_skill: [], nontech_exp: [] }))} style={inp}>
                          <option value="">Select Category</option>
                          {Object.keys(nonTechData).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {form.nontech_category && (
                        <div>
                          <label style={lbl}>Sub-Category</label>
                          <select name="nontech_subcategory" value={form.nontech_subcategory} onChange={handleChange} style={inp}>
                            <option value="">Select</option>
                            {Object.keys(nonTechData[form.nontech_category] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    {form.nontech_subcategory && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        <select value={form._nontech_skill_select || ""} onChange={e => setForm(f => ({ ...f, _nontech_skill_select: e.target.value }))} style={{ ...inp, flex: "1 1 150px" }}>
                          <option value="">Select Skill</option>
                          {(nonTechData[form.nontech_category]?.[form.nontech_subcategory] || []).map(sk => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                        <select value={form._nontech_exp_select || ""} onChange={e => setForm(f => ({ ...f, _nontech_exp_select: e.target.value }))} style={{ ...inp, width: 100 }}>
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
                            <button type="button" onClick={() => handleRemoveNonTechSkill(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontWeight: 900, padding: 0 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div style={{ marginTop: 18 }}>
                  <label style={lbl}>Self Rating (1–10)</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, self_rate: String(n) }))}
                        style={{ width: 36, height: 36, borderRadius: 8, border: form.self_rate === String(n) ? "none" : "1.5px solid #e2e8f0", background: form.self_rate === String(n) ? "#f97316" : "#fff", color: form.self_rate === String(n) ? "#fff" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CV Upload */}
              <div style={card}>
                <h3 style={cardHead}>Upload Resume / CV</h3>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #cbd5e1", borderRadius: 14, padding: "40px 24px", cursor: "pointer", background: "#f8fafc", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}>
                  <Upload size={28} color={cvFile ? "#16a34a" : "#94a3b8"} style={{ marginBottom: 10 }} />
                  {cvFile ? (
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{cvFile.name}</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Click to upload PDF, DOC, DOCX</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Max 10 MB</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => setCvFile(e.target.files[0] || null)} />
                </label>
                {cvFile && (
                  <button type="button" onClick={() => setCvFile(null)} style={{ marginTop: 8, background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ✕ Remove file
                  </button>
                )}
              </div>

              {/* ── Consent checkbox ─────────────────────────────────────────── */}
              <div
                onClick={() => setConsentChecked(v => !v)}
                style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  background: consentChecked ? "#f0fdf4" : "#fff",
                  border: `2px solid ${consentChecked ? "#86efac" : "#e2e8f0"}`,
                  borderRadius: 14, padding: "18px 20px", marginBottom: 20,
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {/* Custom checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${consentChecked ? "#16a34a" : "#94a3b8"}`,
                  background: consentChecked ? "#16a34a" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {consentChecked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.5 }}>
                    I confirm that the candidate has been informed that their profile will be submitted on the RecruiterV platform and may be shared with all recruiters registered on platform.{" "}
                    <span style={{ color: "#ef4444", fontWeight: 900 }}>*</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", lineHeight: 1.6 }}>
                    By checking this box, you as the recruiter take responsibility for obtaining candidate awareness. RecruiterV is not liable for submissions made without candidate knowledge.
                  </p>
                </div>
              </div>

              {submitError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#991b1b", fontSize: 13 }}>
                  <AlertCircle size={16} /> {submitError}
                </div>
              )}

              <button type="submit" disabled={submitting || !consentChecked} style={{
                width: "100%", background: (submitting || !consentChecked) ? "#e2e8f0" : "linear-gradient(135deg,#2563eb,#f97316)",
                color: (submitting || !consentChecked) ? "#94a3b8" : "#fff", border: "none", borderRadius: 14, padding: "16px 24px",
                fontSize: 16, fontWeight: 800, cursor: (submitting || !consentChecked) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
              }}>
                {submitting
                  ? <><Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Submitting…</>
                  : <><Gift size={18} /> Refer This Candidate</>}
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </form>
          </>
        )}

        {/* ── REFERRALS TAB ──────────────────────────────────────────────────── */}
        {tab === "referrals" && (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Active Referrals",  value: summary.total,       color: "#2563eb", bg: "#eff6ff", icon: Users },
                { label: "Shortlisted",       value: summary.shortlisted, color: "#7e22ce", bg: "#fdf4ff", icon: Star },
                { label: "Selected / Placed", value: summary.placed,      color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
                { label: "Recruiters Working",value: summary.recruiters,  color: "#f97316", bg: "#fff7ed", icon: Clock },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon size={16} color={color} />
                    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 200px" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input placeholder="Search name, email, position…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inp, paddingLeft: 32 }} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, flex: "0 1 170px" }}>
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="shortlist">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="selected">Selected</option>
              </select>
              <button onClick={fetchReferrals} style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Refresh
              </button>
            </div>

            {loadingRef && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                <p>Loading your referrals…</p>
              </div>
            )}

            {refError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#991b1b", fontSize: 13 }}>
                <AlertCircle size={16} /> {refError}
              </div>
            )}

            {!loadingRef && !refError && filteredReferrals.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "#94a3b8" }}>
                <Gift size={40} style={{ margin: "0 auto 14px", opacity: 0.3 }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: "#64748b" }}>No active referrals right now</p>
                <p style={{ fontSize: 13, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                  This page shows only referrals that another recruiter is currently working on a
                  live position. Candidates you referred that are still unused, or that you
                  submitted yourself, do not appear here.
                </p>
              </div>
            )}

            {!loadingRef && filteredReferrals.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 14, overflow: "hidden", border: "1.5px solid #e2e8f0", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)", color: "#fff" }}>
                      {["#", "Candidate", "Email / Phone", "Location", "Skills", "Status", "Date Referred", "Used Against Position", "Date Used", "CV"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{r.candidate}</div>
                          {r.curr_emp && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.curr_emp}</div>}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: "#374151", fontSize: 12 }}>{r.emails}</div>
                          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{r.mob}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                          {[r.curr_loc, r.curr_state].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: 160 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {[...(r.tech_skill || []), ...(r.nontech_skill || [])].slice(0, 3).map((sk, j) => (
                              <span key={j} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{sk}</span>
                            ))}
                            {(r.tech_skill?.length + r.nontech_skill?.length) > 3 && (
                              <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 99, padding: "2px 8px", fontSize: 10 }}>
                                +{(r.tech_skill?.length + r.nontech_skill?.length) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}><StatusBadge status={r.statusa} /></td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(r.referredAt)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {r.pos_name ? (
                            <div>
                              <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 12 }}>{r.pos_name}</div>
                              {r.client && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.client}</div>}
                              {r.usedByName && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>by {r.usedByName}</div>}
                            </div>
                          ) : (
                            <span style={{ color: "#cbd5e1", fontSize: 12 }}>Not yet used</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(r.usedAt)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {r.cv_data ? (
                            <a href={r.cv_data} target="_blank" rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                              <Eye size={11} /> View
                            </a>
                          ) : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 12, textAlign: "right", color: "#94a3b8", fontSize: 12 }}>
                  Showing {filteredReferrals.length} of {referrals.length} referrals
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
