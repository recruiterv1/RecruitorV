import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import { SidebarProvider, SidebarContext } from "../context/Sidebarcontext";
import { UserDispatchContext } from "../context/AuthPro";
import Sidebar from "./Sidebar";
import Dash_Header from "./Dash_Header";
import Footer from "./Footer";
import { CheckCircle2, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";

// ─── Clause Data ──────────────────────────────────────────────────────────────
const CLAUSES = [
  {
    id: "clause1", title: "1. Purpose of Engagement",
    content: [
      "I understand that my role on the RecruiterV platform operated by Changeleaders Tech LLP is to act as an Industry Expert, providing professional guidance to recruiters to improve candidate evaluation and hiring quality.",
      "My guidance helps recruiters determine whether a candidate's experience and skills appear suitable for the role.",
    ],
  },
  {
    id: "clause2", title: "2. Nature of Engagement",
    content: [
      "I acknowledge that my role as an Industry Expert is independent and advisory in nature and does not constitute employment, partnership, or agency with Changeleaders Tech LLP.",
    ],
  },
  {
    id: "clause3", title: "3. Role Responsibilities",
    content: [
      "I understand that as an Industry Expert I will primarily:",
      "• Review candidate CVs submitted by recruiters",
      "• Evaluate whether the candidate appears suitable for the role",
      "• Highlight strengths or gaps in the profile",
      "• Guide recruiters on what questions they should ask candidates during screening",
    ],
  },
  {
    id: "clause4", title: "4. Candidate Interaction Restriction",
    content: [
      "I acknowledge that as an Industry Expert:",
      "• I will not speak directly with candidates",
      "• I will not conduct interviews",
      "• I will not submit candidates",
      "My role is strictly limited to reviewing CVs and guiding recruiters.",
    ],
  },
  {
    id: "clause5", title: "5. Selecting Areas of Expertise",
    content: [
      "Before participating on the platform, I will select my top 5 expertise areas.",
      "These should be roles where I have personally interviewed candidates or participated in hiring decisions.",
      "I understand that RecruiterV will map me only to roles where my expertise is relevant.",
    ],
  },
  {
    id: "clause6", title: "6. Recruiter Requests & Mapping",
    content: [
      "I understand that:",
      "• Recruiters may request guidance for specific positions",
      "• RecruiterV may map such requests to me based on my expertise and availability",
      "• I may accept or decline such requests",
      "To maintain quality, each expert may support a limited number of recruiters at a time.",
    ],
  },
  {
    id: "clause7", title: "7. Response Expectations",
    content: [
      "I acknowledge that RecruiterV aims to keep the hiring process efficient.",
      "If I do not respond to a request within four (4) hours, the request may automatically be routed to another expert.",
    ],
  },
  {
    id: "clause8", title: "8. Guidance Responsibilities",
    content: [
      "When reviewing a CV, I may guide recruiters on:",
      "• Whether the candidate's experience appears relevant",
      "• Whether the candidate's skill depth seems appropriate",
      "• Whether the profile aligns with the role requirements",
      "• What screening questions recruiters should ask the candidate",
    ],
  },
  {
    id: "clause9", title: "9. Professional Conduct",
    content: [
      "I agree to provide guidance in a professional, neutral, and unbiased manner.",
      "I will aim to provide clear, constructive, and practical guidance that helps recruiters improve their candidate evaluation process.",
    ],
  },
  {
    id: "clause10", title: "10. Compensation",
    content: [
      "I understand that I will receive 10% of the net revenue earned by Changeleaders Tech LLP for a position where:",
      "• I have provided advisory guidance as an Industry Expert, and",
      "• The recruiter successfully closes the position.",
      "Payment will be released within 7 days after the placed candidate completes 90 days of employment with the client organization.",
    ],
  },
  {
    id: "clause11", title: "11. Payment Conditions",
    content: [
      "I acknowledge that compensation will not be payable if:",
      "• The candidate leaves the organization before completing 90 days",
      "• I was not engaged in that position",
      "• The hiring activity occurred outside the RecruiterV platform",
    ],
  },
  {
    id: "clause12", title: "12. Confidentiality",
    content: [
      "I agree to maintain strict confidentiality regarding:",
      "• Job descriptions",
      "• Recruiter information",
      "• Client or company information",
      "• Candidate information",
      "• Hiring discussions",
      "Such information shall not be disclosed to any third party without written consent from Changeleaders Tech LLP.",
    ],
  },
  {
    id: "clause13", title: "13. Intellectual Property",
    content: [
      "I acknowledge that:",
      "• My pre-existing intellectual property remains my own",
      "• Advisory insights shared during the engagement do not transfer ownership of intellectual property to Changeleaders Tech LLP",
    ],
  },
  {
    id: "clause14", title: "14. Term & Termination",
    content: [
      "This agreement will remain active unless terminated.",
      "Either party may terminate this agreement by providing 15 days written notice.",
    ],
  },
  {
    id: "clause15", title: "15. Non-Exclusivity",
    content: [
      "I understand that this engagement is non-exclusive, and I may engage in other professional activities provided there is no conflict of interest.",
    ],
  },
  {
    id: "clause16", title: "16. Governing Law",
    content: [
      "I agree that this agreement will be governed by the laws of India, and disputes shall fall under the jurisdiction of courts in Gurgaon, Haryana.",
    ],
  },
];

const FINAL_CONSENT = {
  id: "finalConsent",
  title: "Final Digital Consent",
  content: [
    "• I have read and understood all clauses of this agreement",
    "• I voluntarily accept the terms of the Industry Expert Agreement",
    "• I consent to digitally signing this agreement through the RecruiterV platform",
  ],
};

const CHECKABLE = [...CLAUSES, FINAL_CONSENT];
const ALL_CLAUSE_IDS = CHECKABLE.map(c => c.id);

// ─── PDF Builder ─────────────────────────────────────────────────────────────
function buildPDF({ user, panNumber, aadhaarNumber, address, timestamp, userIP }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, PH = 297, ML = 14, MR = 14, MT = 22, MB = 22;
  const CW = PW - ML - MR;
  let y = MT, pageNum = 1;
  const LH = 5.5;

  const runningHeader = () => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text("Industry Expert Agreement — RecruiterV Platform", ML, 12);
    doc.text(`Page ${pageNum}`, PW - MR, 12, { align: "right" });
    doc.setDrawColor(220, 220, 220);
    doc.line(ML, 14, PW - MR, 14);
  };

  const newPage = () => {
    doc.addPage();
    pageNum++;
    y = MT;
    runningHeader();
  };

  const chk = (needed) => { if (y + needed > PH - MB) newPage(); };

  const txt = (str, { size = 9.5, bold = false, color = [50, 50, 50], indent = 0 } = {}) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(str, CW - indent);
    chk(lines.length * LH + 1);
    lines.forEach(l => { doc.text(l, ML + indent, y); y += LH; });
  };

  const sp = (n = 1) => { y += LH * n; };

  // ── TITLE BLOCK ──
  doc.setFillColor(30, 80, 200);
  doc.rect(ML, y, CW, 24, "F");
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("INDUSTRY EXPERT AGREEMENT", PW / 2, y + 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("RecruiterV Platform — Changeleaders Tech LLP", PW / 2, y + 18, { align: "center" });
  y += 29;

  // ── INFO BOX ──
  const iH = 48;
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(190, 210, 240);
  doc.roundedRect(ML, y, CW, iH, 3, 3, "FD");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 200);
  doc.text("Auto-Filled Industry Expert Information", ML + 5, y + 8);
  const c1 = ML + 5, c2 = ML + 97;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const dateStr = new Date(timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const tsStr = new Date(timestamp).toLocaleString("en-IN");
  [
    [`Name: ${user?.name || ""}`,           `Effective Date: ${dateStr}`],
    [`Email: ${user?.email || ""}`,         `Timestamp: ${tsStr}`],
    [`PAN: ${panNumber || "N/A"}`,          `Aadhaar: ${aadhaarNumber || "N/A"}`],
    [`Address: ${address || "N/A"}`,        `IP Address: ${userIP || "N/A"}`],
  ].forEach(([left, right], i) => {
    doc.text(left,  c1, y + 16 + i * 8);
    doc.text(right, c2, y + 16 + i * 8);
  });
  y += iH + 8;

  // ── CLAUSE HEADING ──
  txt("CLAUSE-WISE AGREEMENT ACCEPTANCE", { size: 11, bold: true, color: [30, 80, 200] });
  sp(0.5);

  // ── CLAUSES ──
  CLAUSES.forEach(clause => {
    chk(18);
    txt(clause.title, { bold: true, size: 10, color: [20, 20, 20] });
    clause.content.forEach(line =>
      txt(line, { color: [70, 70, 70], indent: line.startsWith("•") ? 4 : 0 })
    );
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    chk(LH);
    doc.text("✓ I Agree — Digitally Accepted", ML, y);
    y += LH;
    sp(1);
  });

  // ── FINAL CONSENT ──
  chk(28);
  txt(FINAL_CONSENT.title, { bold: true, size: 10, color: [20, 20, 20] });
  FINAL_CONSENT.content.forEach(line => txt(line, { color: [70, 70, 70], indent: 4 }));
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  chk(LH);
  doc.text("✓ I Confirm — Digitally Accepted", ML, y);
  y += LH;
  sp(1.5);

  // ── SIGNATURE BLOCK ──
  chk(60);
  doc.setDrawColor(200, 200, 200);
  doc.line(ML, y, PW - MR, y);
  y += 6;
  txt("DIGITAL SIGNATURE RECORD", { bold: true, size: 10.5, color: [30, 80, 200] });
  sp(0.5);

  const half = CW / 2 - 4;
  const rx = ML + half + 8;
  const bH = 48;

  // Company block
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(190, 210, 240);
  doc.roundedRect(ML, y, half, bH, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 200);
  doc.text("For Changeleaders Tech LLP", ML + 4, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("Name: Roshan Kumar", ML + 4, y + 17);
  doc.text("Designation: Founder & CEO", ML + 4, y + 24);
  doc.text("Platform: RecruiterV", ML + 4, y + 31);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("Authorized Signatory", ML + 4, y + 41);

  // Expert block
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(190, 210, 240);
  doc.roundedRect(rx, y, half, bH, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 200);
  doc.text("Industry Expert", rx + 4, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Name: ${user?.name || ""}`, rx + 4, y + 17);
  doc.text(`Email: ${user?.email || ""}`, rx + 4, y + 24);
  doc.text(`Date: ${new Date(timestamp).toLocaleDateString("en-IN")}`, rx + 4, y + 31);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("Digitally Accepted via RecruiterV", rx + 4, y + 41);
  y += bH + 8;

  // Footer
  chk(10);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text(
    "This is a legally binding digitally signed document. © RecruiterV — Changeleaders Tech LLP",
    PW / 2, y + 5, { align: "center" }
  );

  return doc;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ExpertAgreement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">
          <Sidebar />
        </aside>
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64">
              <Sidebar />
            </aside>
          </div>
        )}
        <ExpertContent setIsSidebarOpen={setIsSidebarOpen} />
      </div>
    </SidebarProvider>
  );
};

// ─── Content ──────────────────────────────────────────────────────────────────
const ExpertContent = ({ setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const dispatch = useContext(UserDispatchContext);

  const [loading, setLoading]             = useState(true);
  const [user, setUser]                   = useState(null);
  const [panNumber, setPanNumber]         = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [address, setAddress]             = useState("");
  const [clauseStates, setClauseStates]   = useState({});
  const [submitted, setSubmitted]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [pdfBase64, setPdfBase64]         = useState(null);
  const [userIP, setUserIP]               = useState("");
  const [expandedClauses, setExpandedClauses] = useState({});
  const [timestamp]                       = useState(new Date().toISOString());

  const allClausesAgreed = ALL_CLAUSE_IDS.every(id => !!clauseStates[id]);
  const agreedCount = ALL_CLAUSE_IDS.filter(id => !!clauseStates[id]).length;

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(d => setUserIP(d.ip))
      .catch(() => setUserIP("unknown"));

    axios.get("/api/profile", { withCredentials: true })
      .then(async res => {
        if (res.data.success) {
          const u = res.data.user;
          setUser(u);
          setPanNumber(u.panNumber || u.pan || "");
          setAadhaarNumber(u.aadhaarNumber || u.aadhaar || "");
          setAddress(u.address || "");

          const check = await axios.get(`/api/agreement/check?email=${u.email}&role=expert`);
          if (check.data.success && check.data.submitted) {
            setSubmitted(true);
            if (check.data.pdfBase64) setPdfBase64(check.data.pdfBase64);
          }
        }
      })
      .catch(e => console.error("Profile load error:", e))
      .finally(() => setLoading(false));
  }, []);

  const toggleClause = (id) =>
    setExpandedClauses(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCheck = (id) =>
    setClauseStates(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDownload = () => {
    if (!pdfBase64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = `Industry_Expert_Agreement_${(user?.name || "Expert").replace(/\s+/g, "_")}.pdf`;
    link.click();
  };

  const handleSubmit = async () => {
    if (!allClausesAgreed) return toast.error("Please accept all clauses before submitting.");
    if (!panNumber.trim()) return toast.error("Please enter your PAN Number.");
    if (!aadhaarNumber.trim()) return toast.error("Please enter your Aadhaar Number.");
    if (!address.trim()) return toast.error("Please enter your Address.");

    setSubmitting(true);
    try {
      const doc = buildPDF({ user, panNumber, aadhaarNumber, address, timestamp, userIP });
      const b64 = doc.output("datauristring").split("base64,")[1];

      const res = await axios.post("/api/agreement/submit", {
        role: "expert",
        user: { ...user, pan: panNumber, aadhaar: aadhaarNumber, address },
        meta: { timestamp, ip: userIP, version: "v1.0" },
        pdfBase64: b64,
        fileName: `Industry_Expert_Agreement_${(user?.name || "Expert").replace(/\s+/g, "_")}.pdf`,
      }, { withCredentials: true });

      if (res.data.success) {
        doc.save(`Industry_Expert_Agreement_${(user?.name || "Expert").replace(/\s+/g, "_")}.pdf`);
        setPdfBase64(b64);
        setSubmitted(true);
        dispatch({ type: "UPDATE_USER", payload: { agreementSigned: true } });
        toast.success("Agreement submitted successfully!");
      } else {
        toast.error(res.data.message || "Submission failed.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pl = isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64";

  if (loading) return (
    <div className={`${pl} flex items-center justify-center min-h-screen`}>
      <div className="text-gray-500">Loading agreement...</div>
    </div>
  );

  // ── SUCCESS STATE ──
  if (submitted) return (
    <div className={pl}>
      <Dash_Header onMenuClick={() => setIsSidebarOpen(s => !s)} />
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-green-100 p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={44} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Agreement Signed!</h1>
          <p className="text-gray-500 mb-2">
            Your Industry Expert Agreement has been digitally signed and submitted.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            A signed copy has been sent to your registered email address.
          </p>
          {pdfBase64 && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow"
            >
              <Download size={18} />
              Download Signed Agreement
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );

  // ── FORM STATE ──
  return (
    <div className={pl}>
      <Dash_Header onMenuClick={() => setIsSidebarOpen(s => !s)} />
      <ToastContainer position="top-right" autoClose={4000} />

      <main className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

          {/* Page Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-8 mb-8 text-white text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-4">
              <FileText size={28} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Industry Expert Agreement</h1>
            <p className="text-blue-100 text-sm">RecruiterV Platform — Changeleaders Tech LLP</p>
          </div>

          {/* Auto-Fill Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-4">
              Auto-Filled Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ["Full Name", user?.name],
                ["Registered Email", user?.email],
                ["Effective Date", new Date(timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
                ["Timestamp", new Date(timestamp).toLocaleString("en-IN")],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-gray-500">{label}: </span>
                  <span className="font-medium text-gray-800">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                PAN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={e => setPanNumber(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="ABCDE1234F"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={12}
                placeholder="12-digit Aadhaar number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Your full address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Clause-wise Agreement Acceptance</h2>
            <span className="text-sm font-semibold text-blue-600">
              {agreedCount}/{ALL_CLAUSE_IDS.length} accepted
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(agreedCount / ALL_CLAUSE_IDS.length) * 100}%` }}
            />
          </div>

          {/* Clauses */}
          <div className="space-y-3">
            {CLAUSES.map(clause => {
              const isExpanded = expandedClauses[clause.id] !== false;
              const isChecked = !!clauseStates[clause.id];

              return (
                <div
                  key={clause.id}
                  className={`border rounded-xl overflow-hidden transition-all ${
                    isChecked ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleClause(clause.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-sm text-gray-800">{clause.title}</span>
                    <div className="flex items-center gap-2">
                      {isChecked && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        {clause.content.map((line, i) => (
                          <p key={i} className={line.startsWith("•") ? "pl-3" : ""}>{line}</p>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheck(clause.id)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                          I Agree
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Consent */}
            {(() => {
              const isChecked = !!clauseStates[FINAL_CONSENT.id];
              const isExpanded = expandedClauses[FINAL_CONSENT.id] !== false;
              return (
                <div className={`border-2 rounded-xl overflow-hidden ${isChecked ? "border-green-400 bg-green-50" : "border-blue-300 bg-blue-50"}`}>
                  <button
                    type="button"
                    onClick={() => toggleClause(FINAL_CONSENT.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="font-bold text-sm text-gray-800">{FINAL_CONSENT.title}</span>
                    <div className="flex items-center gap-2">
                      {isChecked && <CheckCircle2 size={16} className="text-green-500" />}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">I confirm that:</p>
                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        {FINAL_CONSENT.content.map((line, i) => (
                          <p key={i} className="pl-3">{line}</p>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheck(FINAL_CONSENT.id)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors">
                          I Confirm & Consent
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Submit */}
          <div className="mt-8 text-center space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!allClausesAgreed || submitting}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base font-bold rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? "Submitting & Signing..." : "Submit & Digitally Sign Agreement"}
            </button>
            <p className="text-xs text-gray-400">
              Button activates only after all {ALL_CLAUSE_IDS.length} clauses are accepted
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExpertAgreement;
