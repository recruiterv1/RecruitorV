import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  User,
  Briefcase,
  MapPin,
  Code,
  Loader2,
} from "lucide-react";

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
  "Web Development": {
    Frontend: ["React.js", "Angular", "Vue.js", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap", "Redux"],
    Backend: ["Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "NestJS", ".NET Core", "REST APIs", "GraphQL"],
  },
  "Data Science": {
    "Machine Learning": ["Scikit-learn", "TensorFlow", "PyTorch", "Keras", "Hugging Face"],
    "Data Tools": ["Pandas", "NumPy", "Apache Spark", "Kafka", "Power BI", "Tableau"],
  },
  "Programming Languages": {
    "Languages": ["Java", "Python", "C", "C++", "C#", "Go", "Kotlin", "JavaScript", "TypeScript", "Swift", "PHP", "Ruby"],
  },
  "Database Technologies": {
    "Databases": ["MySQL", "PostgreSQL", "Oracle", "MongoDB", "Cassandra", "DynamoDB", "Redis", "Snowflake"],
  },
  "Mobile Development": {
    "Mobile": ["Android (Java)", "Android (Kotlin)", "iOS (Swift)", "Flutter", "React Native"],
  },
  "Testing & QA": {
    "Testing": ["Selenium", "Cypress", "Playwright", "Postman", "JMeter", "TestNG"],
  },
  "Security": {
    "Security": ["OWASP", "IAM", "OAuth", "SSO", "Snyk", "Veracode", "Okta"],
  },
};

const nonTechData = {
  "Banking & Finance": {
    "Products": ["Current Account Management", "Savings Account Management", "Wealth Management", "Insurance Products", "Working Capital Loans"],
    "Compliance": ["KYC / AML Compliance", "Regulatory Compliance", "Customer Onboarding"],
    "Sales": ["Lead Generation", "Cross-selling", "Financial Planning & Advisory"],
  },
  "Logistics": {
    "Warehousing": ["Inventory Management", "Warehouse Management", "Warehouse Automation"],
    "Transportation": ["Last-mile Delivery", "Reverse Logistics", "Fleet Management"],
    "Planning": ["Supply Planning", "Demand Forecasting", "Supply Chain Analytics"],
  },
  "E-Commerce": {
    "Operations": ["E-commerce Operations", "Order Processing", "Returns Management", "D2C Fulfillment"],
    "Marketing": ["Digital Marketing", "Performance Marketing", "Pricing Strategy"],
  },
  "Manufacturing": {
    "Production": ["Production Planning", "SAP PP", "Factory Operations", "Quality Control"],
    "Process": ["Lean Manufacturing", "6S / Kaizen", "Machine Efficiency (OEE)"],
  },
  "Media & Marketing": {
    "Content": ["Content Strategy", "Copywriting", "Video Content Planning"],
    "Digital": ["SEO", "SEM / Google Ads", "Social Media Management", "Email Marketing"],
  },
};

const generateCTCOptions = () => Array.from({ length: 99 }, (_, i) => `${i + 1} LPA`);
const generateYears = () => Array.from({ length: 31 }, (_, i) => i);
const generateMonths = () => Array.from({ length: 12 }, (_, i) => i);

const defaultForm = {
  candidate: "",
  emails: "",
  mob: "",
  dob: "",
  curr_emp: "",
  highest_education: "",
  current_ctc: "",
  exp_ctc: "",
  total_exp_year: "",
  total_exp_months: "",
  rel_exp_year: "",
  rel_exp_months: "",
  notice_period: "",
  curr_state: "",
  curr_loc: "",
  pref_state: "",
  pref_loc: "",
  skill_type: "",
  tech_category: "",
  tech_subcategory: "",
  tech_skill: [],
  tech_exp: [],
  nontech_category: "",
  nontech_subcategory: "",
  nontech_skill: [],
  nontech_exp: [],
  self_rate: "",
  cv_data: "",
  jr_number: "",
  pan_number: "",
  offer_hand: "",
  offer_amt: "",
};

export default function AdminAddCandidate() {
  const [form, setForm] = useState(defaultForm);

  // Resume parse state
  const [resumeFile, setResumeFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedBanner, setParsedBanner] = useState(false);
  const [parseError, setParseError] = useState("");
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const resumeInputRef = useRef();

  const [cvUploading, setCvUploading] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Freeform skill add
  const [skillInput, setSkillInput] = useState("");
  const [skillExpInput, setSkillExpInput] = useState("");

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Resume drag/drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleResumeUpload(file);
  };
  const handleResumeInput = (e) => {
    const file = e.target.files[0];
    if (file) handleResumeUpload(file);
  };

  const handleResumeUpload = async (file) => {
    setResumeFile(file);
    setParsedBanner(false);
    setParseError("");
    setDetectedSkills([]);
    setParsing(true);
    try {
      // Send as base64 JSON — avoids Cloud Run multipart/busboy issues
      const base64Resume = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await axios.post("/admin/parse-resume", {
        filename:    file.name,
        contentType: file.type || "application/octet-stream",
        base64:      base64Resume,
      }, { withCredentials: true });
      const fields = res.data?.fields || {};
      setForm((f) => ({
        ...f,
        candidate: fields.candidate || f.candidate,
        emails: fields.emails || f.emails,
        mob: fields.mob || f.mob,
        curr_emp: fields.curr_emp || f.curr_emp,
        total_exp_year: fields.total_exp_year || f.total_exp_year,
        rel_exp_year: fields.rel_exp_year || f.rel_exp_year,
        notice_period: fields.notice_period || f.notice_period,
        current_ctc: fields.current_ctc || f.current_ctc,
        exp_ctc: fields.exp_ctc || f.exp_ctc,
        curr_loc: fields.curr_loc || f.curr_loc,
        highest_education: fields.highest_education || f.highest_education,
      }));
      if (fields.extractedSkills?.length) setDetectedSkills(fields.extractedSkills);

      // Also upload the same resume file as the candidate's CV
      setCvUploading(true);
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const upRes = await axios.post(
          "/api/direct-apply/upload-cv",
          { filename: `admin/${Date.now()}_${file.name}`, contentType: file.type, base64 },
          { withCredentials: true }
        );
        if (upRes.data?.url) {
          setForm((f) => ({ ...f, cv_data: upRes.data.url }));
        }
      } catch { /* CV upload failed silently — cv_data stays empty */ }
      finally { setCvUploading(false); }

      setParsedBanner(true);
    } catch (err) {
      setParseError("Failed to parse resume. Please fill the form manually.");
    } finally {
      setParsing(false);
    }
  };

  // Tech skill helpers
  const handleTechCategoryChange = (e) => {
    setForm((f) => ({ ...f, tech_category: e.target.value, tech_subcategory: "", tech_skill: [], tech_exp: [] }));
  };
  const handleTechSubcategoryChange = (e) => {
    setForm((f) => ({ ...f, tech_subcategory: e.target.value, tech_skill: [], tech_exp: [] }));
  };
  const handleTechSkillSelect = (e) => {
    const skill = e.target.value;
    if (!skill || form.tech_skill.includes(skill)) return;
    if (form.tech_skill.length >= 10) { alert("Max 10 skills"); return; }
    setForm((f) => ({ ...f, tech_skill: [...f.tech_skill, skill], tech_exp: [...f.tech_exp, ""] }));
  };
  const removeTechSkill = (i) => {
    const s = [...form.tech_skill]; s.splice(i, 1);
    const x = [...form.tech_exp]; x.splice(i, 1);
    setForm((f) => ({ ...f, tech_skill: s, tech_exp: x }));
  };
  const updateTechExp = (i, val) => {
    const x = [...form.tech_exp]; x[i] = val;
    setForm((f) => ({ ...f, tech_exp: x }));
  };

  // Nontech skill helpers
  const handleNonTechCategoryChange = (e) => {
    setForm((f) => ({ ...f, nontech_category: e.target.value, nontech_subcategory: "", nontech_skill: [], nontech_exp: [] }));
  };
  const handleNonTechSubcategoryChange = (e) => {
    setForm((f) => ({ ...f, nontech_subcategory: e.target.value, nontech_skill: [], nontech_exp: [] }));
  };
  const handleNonTechSkillSelect = (e) => {
    const skill = e.target.value;
    if (!skill || form.nontech_skill.includes(skill)) return;
    if (form.nontech_skill.length >= 10) { alert("Max 10 skills"); return; }
    setForm((f) => ({ ...f, nontech_skill: [...f.nontech_skill, skill], nontech_exp: [...f.nontech_exp, ""] }));
  };
  const removeNonTechSkill = (i) => {
    const s = [...form.nontech_skill]; s.splice(i, 1);
    const x = [...form.nontech_exp]; x.splice(i, 1);
    setForm((f) => ({ ...f, nontech_skill: s, nontech_exp: x }));
  };
  const updateNonTechExp = (i, val) => {
    const x = [...form.nontech_exp]; x[i] = val;
    setForm((f) => ({ ...f, nontech_exp: x }));
  };

  // Add freeform skill
  const addFreeformSkill = () => {
    if (!skillInput.trim()) return;
    if (form.skill_type === "Technical") {
      if (form.tech_skill.includes(skillInput.trim())) return;
      setForm((f) => ({ ...f, tech_skill: [...f.tech_skill, skillInput.trim()], tech_exp: [...f.tech_exp, skillExpInput] }));
    } else {
      if (form.nontech_skill.includes(skillInput.trim())) return;
      setForm((f) => ({ ...f, nontech_skill: [...f.nontech_skill, skillInput.trim()], nontech_exp: [...f.nontech_exp, skillExpInput] }));
    }
    setSkillInput("");
    setSkillExpInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    // PAN number and resume are mandatory
    if (!String(form.pan_number || "").trim()) {
      setSubmitError("PAN number is required.");
      return;
    }
    if (!form.cv_data && !resumeFile) {
      setSubmitError("A resume is required. Please upload the candidate's resume.");
      return;
    }

    setSubmitting(true);

    // cv_data is already set when the resume was uploaded for parsing
    const payload = { ...form };

    try {
      await axios.post("/addit/data/candi", payload, { withCredentials: true });
      setSubmitSuccess(true);
      setForm(defaultForm);
      setResumeFile(null);
      setParsedBanner(false);
      setDetectedSkills([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";
  const sectionHeader = (icon, title) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-orange-100">
      <span className="text-orange-500">{icon}</span>
      <h3 className="text-base font-bold text-gray-700">{title}</h3>
    </div>
  );

  const currentTechData = form.tech_category ? techData[form.tech_category] : null;
  const currentTechSkills = form.tech_subcategory && currentTechData ? currentTechData[form.tech_subcategory] : null;
  const currentNonTechData = form.nontech_category ? nonTechData[form.nontech_category] : null;
  const currentNonTechSkills = form.nontech_subcategory && currentNonTechData ? currentNonTechData[form.nontech_subcategory] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
          <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Add Candidate</h1>
            <p className="text-orange-100 text-sm mt-1">Upload a resume to auto-fill or enter details manually</p>
          </div>
        </div>

        {submitSuccess && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">
            <CheckCircle size={18} />
            <span className="font-medium">Candidate added successfully!</span>
          </div>
        )}
        {submitError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-orange-500" size={20} />
              <h3 className="text-base font-bold text-gray-700">Resume Upload (Auto-Fill)</h3>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => resumeInputRef.current?.click()}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-2 text-orange-500">
                  <Loader2 size={36} className="animate-spin" />
                  <p className="font-medium">Parsing resume...</p>
                </div>
              ) : resumeFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={36} className="text-orange-400" />
                  <p className="font-medium text-gray-700">{resumeFile.name}</p>
                  <p className="text-xs text-gray-400">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload size={36} className="text-orange-300" />
                  <p className="font-medium text-gray-600">Drop PDF/DOCX here or click to browse</p>
                  <p className="text-xs">Supported: PDF, DOCX</p>
                </div>
              )}
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleResumeInput}
              />
            </div>

            {parsedBanner && (
              <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
                <CheckCircle size={16} />
                <span>Resume parsed! Fields pre-filled below.</span>
              </div>
            )}
            {parseError && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={16} />
                <span>{parseError}</span>
              </div>
            )}

            {detectedSkills.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Detected Skills (hints):</p>
                <div className="flex flex-wrap gap-2">
                  {detectedSkills.map((sk, i) => (
                    <span key={i} className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {sectionHeader(<User size={18} />, "Personal Information")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Candidate Name *</label>
                <input className={inputCls} value={form.candidate} onChange={(e) => set("candidate", e.target.value)} placeholder="Full name" required />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input className={inputCls} type="email" value={form.emails} onChange={(e) => set("emails", e.target.value)} placeholder="email@example.com" required />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input className={inputCls} type="tel" value={form.mob} onChange={(e) => set("mob", e.target.value)} placeholder="10-digit mobile" required />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input className={inputCls} type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>PAN Number *</label>
                <input className={inputCls} value={form.pan_number} onChange={(e) => set("pan_number", e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} required />
              </div>
              <div>
                <label className={labelCls}>Current Employer</label>
                <input className={inputCls} value={form.curr_emp} onChange={(e) => set("curr_emp", e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <label className={labelCls}>Highest Education</label>
                <select className={inputCls} value={form.highest_education} onChange={(e) => set("highest_education", e.target.value)}>
                  <option value="">Select Education</option>
                  {["10th", "12th", "Diploma", "Graduate", "Post Graduate", "PhD"].map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Experience & Compensation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {sectionHeader(<Briefcase size={18} />, "Experience & Compensation")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Current CTC</label>
                <select className={inputCls} value={form.current_ctc} onChange={(e) => set("current_ctc", e.target.value)}>
                  <option value="">Select CTC</option>
                  {generateCTCOptions().map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Expected CTC</label>
                <select className={inputCls} value={form.exp_ctc} onChange={(e) => set("exp_ctc", e.target.value)}>
                  <option value="">Select CTC</option>
                  {generateCTCOptions().map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Total Experience</label>
                <div className="flex gap-2">
                  <select className={inputCls} value={form.total_exp_year} onChange={(e) => set("total_exp_year", e.target.value)}>
                    <option value="">Yrs</option>
                    {generateYears().map((y) => <option key={y} value={y}>{y} yr</option>)}
                  </select>
                  <select className={inputCls} value={form.total_exp_months} onChange={(e) => set("total_exp_months", e.target.value)}>
                    <option value="">Months</option>
                    {generateMonths().map((m) => <option key={m} value={m}>{m} mo</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Relevant Experience</label>
                <div className="flex gap-2">
                  <select className={inputCls} value={form.rel_exp_year} onChange={(e) => set("rel_exp_year", e.target.value)}>
                    <option value="">Yrs</option>
                    {generateYears().map((y) => <option key={y} value={y}>{y} yr</option>)}
                  </select>
                  <select className={inputCls} value={form.rel_exp_months} onChange={(e) => set("rel_exp_months", e.target.value)}>
                    <option value="">Months</option>
                    {generateMonths().map((m) => <option key={m} value={m}>{m} mo</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Notice Period</label>
                <select className={inputCls} value={form.notice_period} onChange={(e) => set("notice_period", e.target.value)}>
                  <option value="">Select Notice Period</option>
                  {["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Self Rating (1–10)</label>
                <select className={inputCls} value={form.self_rate} onChange={(e) => set("self_rate", e.target.value)}>
                  <option value="">Select Rating</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {sectionHeader(<MapPin size={18} />, "Location")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Current State</label>
                <select
                  className={inputCls}
                  value={form.curr_state}
                  onChange={(e) => setForm((f) => ({ ...f, curr_state: e.target.value, curr_loc: "" }))}
                >
                  <option value="">Select State</option>
                  {Object.keys(indiaStatesAndCities).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Current City</label>
                <select className={inputCls} value={form.curr_loc} onChange={(e) => set("curr_loc", e.target.value)} disabled={!form.curr_state}>
                  <option value="">Select City</option>
                  {form.curr_state && indiaStatesAndCities[form.curr_state]?.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Preferred State</label>
                <select
                  className={inputCls}
                  value={form.pref_state}
                  onChange={(e) => setForm((f) => ({ ...f, pref_state: e.target.value, pref_loc: "" }))}
                >
                  <option value="">Select State</option>
                  {Object.keys(indiaStatesAndCities).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Preferred City</label>
                <select className={inputCls} value={form.pref_loc} onChange={(e) => set("pref_loc", e.target.value)} disabled={!form.pref_state}>
                  <option value="">Select City</option>
                  {form.pref_state && indiaStatesAndCities[form.pref_state]?.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {sectionHeader(<Code size={18} />, "Skills")}

            <div className="mb-4">
              <label className={labelCls}>Skill Type</label>
              <div className="flex gap-6 mt-1">
                {["Technical", "Non-Technical"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="skill_type"
                      value={type}
                      checked={form.skill_type === type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          skill_type: e.target.value,
                          tech_category: "",
                          tech_subcategory: "",
                          tech_skill: [],
                          tech_exp: [],
                          nontech_category: "",
                          nontech_subcategory: "",
                          nontech_skill: [],
                          nontech_exp: [],
                        }))
                      }
                      className="accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.skill_type === "Technical" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select className={inputCls} value={form.tech_category} onChange={handleTechCategoryChange}>
                      <option value="">Select Category</option>
                      {Object.keys(techData).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Subcategory</label>
                    <select className={inputCls} value={form.tech_subcategory} onChange={handleTechSubcategoryChange} disabled={!form.tech_category}>
                      <option value="">Select Subcategory</option>
                      {currentTechData && Object.keys(currentTechData).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Add Skill</label>
                    <select className={inputCls} onChange={handleTechSkillSelect} value="" disabled={!form.tech_subcategory}>
                      <option value="">Select Skill</option>
                      {currentTechSkills?.map((sk) => <option key={sk} value={sk}>{sk}</option>)}
                    </select>
                  </div>
                </div>

                {/* Freeform skill add */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className={labelCls}>Or type a skill manually</label>
                    <input className={inputCls} value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Skill name" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFreeformSkill())} />
                  </div>
                  <div>
                    <label className={labelCls}>Experience</label>
                    <input className={inputCls + " w-28"} value={skillExpInput} onChange={(e) => setSkillExpInput(e.target.value)} placeholder="e.g. 2 yrs" />
                  </div>
                  <button type="button" onClick={addFreeformSkill} className="h-9 px-3 bg-orange-500 text-white rounded-lg flex items-center gap-1 text-sm hover:bg-orange-600">
                    <Plus size={16} /> Add
                  </button>
                </div>

                {form.tech_skill.length > 0 && (
                  <div className="space-y-2">
                    {form.tech_skill.map((sk, i) => (
                      <div key={i} className="flex items-center gap-3 bg-orange-50 rounded-lg px-3 py-2">
                        <span className="flex-1 text-sm font-medium text-gray-700">{sk}</span>
                        <input
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                          placeholder="Experience"
                          value={form.tech_exp[i] || ""}
                          onChange={(e) => updateTechExp(i, e.target.value)}
                        />
                        <button type="button" onClick={() => removeTechSkill(i)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.skill_type === "Non-Technical" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select className={inputCls} value={form.nontech_category} onChange={handleNonTechCategoryChange}>
                      <option value="">Select Category</option>
                      {Object.keys(nonTechData).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Subcategory</label>
                    <select className={inputCls} value={form.nontech_subcategory} onChange={handleNonTechSubcategoryChange} disabled={!form.nontech_category}>
                      <option value="">Select Subcategory</option>
                      {currentNonTechData && Object.keys(currentNonTechData).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Add Skill</label>
                    <select className={inputCls} onChange={handleNonTechSkillSelect} value="" disabled={!form.nontech_subcategory}>
                      <option value="">Select Skill</option>
                      {currentNonTechSkills?.map((sk) => <option key={sk} value={sk}>{sk}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className={labelCls}>Or type a skill manually</label>
                    <input className={inputCls} value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Skill name" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFreeformSkill())} />
                  </div>
                  <div>
                    <label className={labelCls}>Experience</label>
                    <input className={inputCls + " w-28"} value={skillExpInput} onChange={(e) => setSkillExpInput(e.target.value)} placeholder="e.g. 2 yrs" />
                  </div>
                  <button type="button" onClick={addFreeformSkill} className="h-9 px-3 bg-orange-500 text-white rounded-lg flex items-center gap-1 text-sm hover:bg-orange-600">
                    <Plus size={16} /> Add
                  </button>
                </div>

                {form.nontech_skill.length > 0 && (
                  <div className="space-y-2">
                    {form.nontech_skill.map((sk, i) => (
                      <div key={i} className="flex items-center gap-3 bg-orange-50 rounded-lg px-3 py-2">
                        <span className="flex-1 text-sm font-medium text-gray-700">{sk}</span>
                        <input
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                          placeholder="Experience"
                          value={form.nontech_exp[i] || ""}
                          onChange={(e) => updateNonTechExp(i, e.target.value)}
                        />
                        <button type="button" onClick={() => removeNonTechSkill(i)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CV upload status (shown while resume is being saved as CV) */}
          {cvUploading && (
            <div className="flex items-center gap-2 text-orange-500 text-sm bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
              <Loader2 size={16} className="animate-spin flex-shrink-0" />
              Saving resume as CV…
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pb-8">
            <button
              type="submit"
              disabled={submitting || cvUploading || parsing}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-xl shadow-md hover:from-orange-600 hover:to-orange-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting...
                </>
              ) : (
                "Add Candidate"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
