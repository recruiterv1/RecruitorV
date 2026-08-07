import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import { RECRUITER_COMMISSION_TYPE } from "../lib/agreementTerms";
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
      "I understand that RecruiterV, operated by Changeleaders Consulting Private Limited, is a technology platform that enables independent recruiters to work on recruitment mandates published on the platform.",
      "My responsibilities include:",
      "• Candidate sourcing",
      "• Resume screening",
      "• Candidate engagement",
      "• Interview coordination",
      "• Candidate follow-up",
      "• Candidate joining support",
      "• Submission of candidate profiles exclusively through RecruiterV",
      "I understand that RecruiterV manages client acquisition, client servicing, billing, collections, and commercial negotiations.",
    ],
  },
  {
    id: "clause2", title: "2. Independent Contractor Relationship",
    content: [
      "I acknowledge that my engagement with RecruiterV is solely as an Independent Contractor.",
      "This Agreement does not create any employer-employee relationship, partnership, agency, joint venture, or entitlement to employment benefits.",
    ],
  },
  {
    id: "clause3", title: "3. Scope of Recruiter Responsibilities",
    content: [
      "I agree to perform recruitment services including:",
      "• Candidate sourcing",
      "• Candidate screening",
      "• Candidate engagement",
      "• Submission of candidate profiles through the RecruiterV platform",
      "Client acquisition, billing, collections, and client communication remain the responsibility of the platform.",
    ],
  },
  {
    id: "clause4", title: "4. Platform Operating Model",
    content: [
      "I understand that hiring mandates may be displayed to recruiters based on:",
      "• Skill alignment",
      "• Past submission quality",
      "• Platform performance indicators",
      "• Platform allocation logic",
      "RecruiterV reserves the right to limit or prioritize recruiter participation in mandates.",
    ],
  },
  {
    id: "clause5", title: "5. Recruiter Earnings Structure",
    content: [
      "Recruiters working on RecruiterV are entitled to:",
      "35% of net revenue realised from the client.",
      "In addition, a 5% variable component may be payable, subject to performance and the terms determined by the platform.",
    ],
  },
  {
    id: "clause6", title: "6. Payout Structure",
    content: [
      "Recruiter commission payments will be released in two stages:",
      "• 50% after the candidate completes 30 days of employment",
      "• 50% after the candidate completes 90 days of employment",
      "Payouts are subject to candidate continuity and client payment realization.",
    ],
  },
  {
    id: "clause7", title: "7. Submission & Quality Standards",
    content: [
      "I acknowledge that:",
      "• I may submit a maximum of 3 candidate profiles per mandate, unless specified otherwise.",
      "• All submissions must be genuine, verified, and relevant to the role.",
      "• Duplicate, fabricated, or misleading submissions are not allowed.",
      "RecruiterV reserves the right to reject profiles not meeting quality standards.",
    ],
  },
  {
    id: "clause8", title: "8. Ethical Code of Conduct",
    content: [
      "I agree that I will not:",
      "• Misrepresent candidate information",
      "• Manipulate compensation expectations",
      "• Submit duplicate candidates",
      "• Contact clients directly without authorization",
      "• Attempt to bypass the RecruiterV platform",
      "Violation of these rules may result in account suspension or termination.",
    ],
  },
  {
    id: "clause9", title: "9. Candidate Ownership Framework",
    content: [
      "Candidate ownership shall be determined strictly by RecruiterV platform records.",
      "Ownership is valid only when:",
      "• The candidate is submitted through the platform",
      "• The submission timestamp is verified",
      "• Candidate identity validation exists",
      "Candidate ownership remains valid for 90 days from submission date.",
    ],
  },
  {
    id: "clause10", title: "10. Replacement & Recovery",
    content: [
      "If a candidate resigns, withdraws, or is terminated before qualifying milestones, payout eligibility shall depend on client replacement clauses.",
      "Recruiters may be expected to assist in replacement sourcing where applicable.",
    ],
  },
  {
    id: "clause11", title: "11. Recruiter Representations",
    content: [
      "I confirm that:",
      "• All candidate information submitted by me will be accurate",
      "• Candidates will be sourced lawfully",
      "• I will comply with all applicable regulations and tax obligations",
    ],
  },
  {
    id: "clause12", title: "12. Confidentiality & Non-Circumvention",
    content: [
      "I agree to maintain strict confidentiality regarding:",
      "• Client identities",
      "• Compensation structures",
      "• Mandate details",
      "• Platform workflows",
      "I will not attempt to bypass the platform or establish direct business relationships with clients introduced through RecruiterV.",
    ],
  },
  {
    id: "clause13", title: "13. Platform Data Usage",
    content: [
      "I acknowledge that:",
      "• All platform systems, workflows, and data belong to RecruiterV",
      "• Platform access is conditional and revocable",
      "I will not copy, scrape, redistribute, or misuse platform data.",
    ],
  },
  {
    id: "clause14", title: "14. Limitation of Liability",
    content: [
      "I acknowledge that earnings on RecruiterV are performance-based and depend on successful hiring outcomes.",
      "The platform does not guarantee income or mandate allocation.",
    ],
  },
  {
    id: "clause15", title: "15. Termination",
    content: [
      "RecruiterV may suspend or terminate recruiter access in cases of:",
      "• Fraud",
      "• Ethical violations",
      "• Platform misuse",
      "• Confidentiality breaches",
      "Upon termination, the recruiter remains eligible only for valid earned commissions.",
    ],
  },
  {
    id: "clause16", title: "16. Governing Law",
    content: [
      "This agreement shall be governed by the laws of India.",
      "Courts in Gurgaon, Haryana shall have exclusive jurisdiction.",
    ],
  },
];

const FINAL_CONSENT = {
  id: "finalConsent",
  title: "Final Digital Consent",
  content: [
    "• I have read and understood all clauses of the Recruiter Agreement",
    "• I voluntarily accept the terms and conditions",
    "• I consent to digitally signing this agreement through the RecruiterV platform",
  ],
};

const CHECKABLE = [...CLAUSES.filter(c => !c.headerOnly && !c.subClause), FINAL_CONSENT];
const ALL_CLAUSE_IDS = CHECKABLE.map(c => c.id);

// ─── PDF Builder ─────────────────────────────────────────────────────────────
function buildPDF({ user, panNumber, address, timestamp, userIP }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, PH = 297, ML = 14, MR = 14, MT = 22, MB = 22;
  const CW = PW - ML - MR;
  let y = MT, pageNum = 1;
  const LH = 5.5;

  const runningHeader = () => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text("Freelance Recruiter Agreement — RecruiterV Platform", ML, 12);
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

  const txt = (str, { x = ML, size = 9.5, bold = false, color = [50, 50, 50], indent = 0 } = {}) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(str, CW - indent);
    chk(lines.length * LH + 1);
    lines.forEach(l => { doc.text(l, x + indent, y); y += LH; });
  };

  const sp = (n = 1) => { y += LH * n; };

  // ── TITLE BLOCK ──
  doc.setFillColor(30, 80, 200);
  doc.rect(ML, y, CW, 24, "F");
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("FREELANCE RECRUITER AGREEMENT", PW / 2, y + 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("RecruiterV Platform — Changeleaders Consulting Private Limited", PW / 2, y + 18, { align: "center" });
  y += 29;

  // ── INFO BOX ──
  const iH = 48;
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(190, 210, 240);
  doc.roundedRect(ML, y, CW, iH, 3, 3, "FD");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 200);
  doc.text("Auto-Filled Recruiter Information", ML + 5, y + 8);
  const c1 = ML + 5, c2 = ML + 95;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const dateStr = new Date(timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const tsStr = new Date(timestamp).toLocaleString("en-IN");
  [
    [`Name: ${user?.name || ""}`,    `Effective Date: ${dateStr}`],
    [`Email: ${user?.email || ""}`,  `Timestamp: ${tsStr}`],
    [`PAN: ${panNumber || "N/A"}`,   `IP Address: ${userIP || "N/A"}`],
    [`Address: ${address || "N/A"}`, `Agreement Version: v1.0`],
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
    if (clause.headerOnly) {
      chk(14);
      txt(clause.title, { bold: true, size: 10, color: [20, 20, 20] });
      clause.content.forEach(line => txt(line, { color: [70, 70, 70], indent: 3 }));
      sp(0.5);
      return;
    }

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
  doc.text("For Changeleaders Consulting Pvt Ltd", ML + 4, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("Name: Roshan Kumar Rawat", ML + 4, y + 17);
  doc.text("Designation: Founder & CEO", ML + 4, y + 24);
  doc.text("Platform: RecruiterV", ML + 4, y + 31);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("Authorized Signatory", ML + 4, y + 41);

  // Recruiter block
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(190, 210, 240);
  doc.roundedRect(rx, y, half, bH, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 200);
  doc.text("Recruiter", rx + 4, y + 8);
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
    "This is a legally binding digitally signed document. © RecruiterV — Changeleaders Consulting Private Limited",
    PW / 2, y + 5, { align: "center" }
  );

  return doc;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RecruiterAgreement = () => {
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
        <RecruiterContent setIsSidebarOpen={setIsSidebarOpen} />
      </div>
    </SidebarProvider>
  );
};

// ─── Content ──────────────────────────────────────────────────────────────────
const RecruiterContent = ({ setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const dispatch = useContext(UserDispatchContext);

  const [loading, setLoading]       = useState(true);
  const [user, setUser]             = useState(null);
  const [panNumber, setPanNumber]   = useState("");
  const [address, setAddress]       = useState("");
  const [clauseStates, setClauseStates] = useState({});
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfBase64, setPdfBase64]   = useState(null);
  const [userIP, setUserIP]         = useState("");
  const [expandedClauses, setExpandedClauses] = useState({});
  const [timestamp]                 = useState(new Date().toISOString());

  const totalItems = ALL_CLAUSE_IDS.length + 1; // +1 for earnings structure selection
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
          setAddress(u.address || "");

          const check = await axios.get(`/api/agreement/check?email=${u.email}&role=recruiter`);
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
    const fileName = `Recruiter_Agreement_${(user?.name || "Recruiter").replace(/\s+/g, "_")}.pdf`;
    // If we already have the exact signed copy, download it as-is. Otherwise
    // (e.g. a returning user — the PDF base64 isn't stored server-side) rebuild
    // the same agreement from their profile data so the download always works.
    if (pdfBase64) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = fileName;
      link.click();
      return;
    }
    try {
      const doc = buildPDF({ user, panNumber, address, timestamp, userIP });
      doc.save(fileName);
    } catch (e) {
      console.error("Download regenerate error:", e);
      toast.error("Could not generate the agreement PDF. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!allClausesAgreed) return toast.error("Please accept all clauses before submitting.");
    if (!panNumber.trim()) return toast.error("Please enter your PAN Number.");
    if (!address.trim()) return toast.error("Please enter your Address.");

    const commisiontype = RECRUITER_COMMISSION_TYPE;

    setSubmitting(true);
    try {
      const doc = buildPDF({ user, panNumber, address, timestamp, userIP });
      const b64 = doc.output("datauristring").split("base64,")[1];

      const res = await axios.post("/api/agreement/submit", {
        role: "recruiter",
        commisiontype,
        user: { ...user, pan: panNumber, address },
        meta: { timestamp, ip: userIP, version: "v1.0" },
        pdfBase64: b64,
        fileName: `Recruiter_Agreement_${(user?.name || "Recruiter").replace(/\s+/g, "_")}.pdf`,
      }, { withCredentials: true });

      if (res.data.success) {
        doc.save(`Recruiter_Agreement_${(user?.name || "Recruiter").replace(/\s+/g, "_")}.pdf`);
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
            Your Freelance Recruiter Agreement has been digitally signed and submitted.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            A signed copy has been sent to your registered email address.
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow"
          >
            <Download size={18} />
            Download Signed Agreement
          </button>
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Freelance Recruiter Agreement</h1>
            <p className="text-blue-100 text-sm">RecruiterV Platform — Changeleaders Consulting Private Limited</p>
          </div>

          {/* Auto-Fill Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-4">
              Auto-Filled Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ["Recruiter Name", user?.name],
                ["Email ID", user?.email],
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
              {agreedCount}/{totalItems} accepted
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(agreedCount / totalItems) * 100}%` }}
            />
          </div>

          {/* Clauses */}
          <div className="space-y-3">
            {CLAUSES.map(clause => {
              if (clause.headerOnly) {
                return (
                  <div key={clause.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-bold text-blue-800 text-sm">{clause.title}</h3>
                    {clause.content.map((line, i) => (
                      <p key={i} className="text-gray-600 text-sm mt-1">{line}</p>
                    ))}
                  </div>
                );
              }


              const isExpanded = expandedClauses[clause.id] !== false; // default expanded
              const isChecked = !!clauseStates[clause.id];

              return (
                <div
                  key={clause.id}
                  className={`border rounded-xl overflow-hidden transition-all ${
                    isChecked ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Clause Header */}
                  <button
                    type="button"
                    onClick={() => toggleClause(clause.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-sm text-gray-800">
                      {clause.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {isChecked && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Clause Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        {clause.content.map((line, i) => (
                          <p key={i} className={line.startsWith("•") ? "pl-3" : ""}>
                            {line}
                          </p>
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
              Button activates only after all {totalItems} items are accepted
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecruiterAgreement;
