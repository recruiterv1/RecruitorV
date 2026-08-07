import jsPDF from "jspdf";

// Single source of truth for the role-wise agreement highlights shown in the
// registration Terms modal, and for the acceptance PDF generated when a user
// agrees at sign-up. The wording mirrors the full agreement pages.

export const RECRUITER_COMMISSION_TYPE = "Standard 35% + 5% Variable";

export const ROLE_TERMS = {
  Recruiter: {
    key: "recruiter",
    label: "Recruiter",
    agreementPath: "/recruiter-agreement",
    docTitle: "Freelance Recruiter Agreement — RecruiterV Platform",
    headline: "35% + 5% variable",
    earnings: [
      "35% of net revenue realised from the client.",
      "Plus a 5% variable component, subject to performance and the terms determined by the platform.",
    ],
    payout: [
      "50% after the candidate completes 30 days of employment.",
      "50% after the candidate completes 90 days of employment.",
    ],
    note: "Payouts are subject to candidate continuity and client payment realization.",
  },
  Coach: {
    key: "coach",
    label: "Coach (Hiring Guru)",
    agreementPath: "/coach-agreement",
    docTitle: "Hiring Guru Agreement — RecruiterV Platform",
    headline: "10%",
    earnings: [
      "10% of the net revenue earned by Changeleaders Tech LLP for a position where you have provided advisory guidance and the position is successfully closed by the recruiter.",
    ],
    payout: [
      "Released within 7 days after the placed candidate completes 90 days of continuous employment.",
    ],
    note: "No compensation is payable if the candidate leaves before 90 days, or for positions supported outside the portal.",
  },
  Expert: {
    key: "expert",
    label: "Industry Expert",
    agreementPath: "/expert-agreement",
    docTitle: "Industry Expert Agreement — RecruiterV Platform",
    headline: "10%",
    earnings: [
      "10% of the net revenue earned by Changeleaders Tech LLP for a position where you have provided advisory guidance as an Industry Expert and the recruiter successfully closes the position.",
    ],
    payout: [
      "Released within 7 days after the placed candidate completes 90 days of employment with the client organization.",
    ],
    note: "No compensation is payable if the candidate leaves before 90 days, or for positions supported outside the portal.",
  },
};

export const getRoleTerms = (roleCategory) => ROLE_TERMS[roleCategory] || null;

// ── Full recruiter agreement clauses (source of truth for the emailed PDF) ─────
// Clauses 1 & 2 reworded per the latest agreement; clauses 3–16 unchanged.
export const RECRUITER_CLAUSES = [
  { title: "1. Purpose of Engagement", content: [
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
  ]},
  { title: "2. Independent Contractor Relationship", content: [
    "I acknowledge that my engagement with RecruiterV is solely as an Independent Contractor.",
    "This Agreement does not create any employer-employee relationship, partnership, agency, joint venture, or entitlement to employment benefits.",
  ]},
  { title: "3. Scope of Recruiter Responsibilities", content: [
    "I agree to perform recruitment services including:",
    "• Candidate sourcing", "• Candidate screening", "• Candidate engagement",
    "• Submission of candidate profiles through the RecruiterV platform",
    "Client acquisition, billing, collections, and client communication remain the responsibility of the platform.",
  ]},
  { title: "4. Platform Operating Model", content: [
    "I understand that hiring mandates may be displayed to recruiters based on:",
    "• Skill alignment", "• Past submission quality", "• Platform performance indicators", "• Platform allocation logic",
    "RecruiterV reserves the right to limit or prioritize recruiter participation in mandates.",
  ]},
  { title: "5. Recruiter Earnings Structure", content: [
    "Recruiters working on RecruiterV are entitled to:",
    "35% of net revenue realised from the client.",
    "In addition, a 5% variable component may be payable, subject to performance and the terms determined by the platform.",
  ]},
  { title: "6. Payout Structure", content: [
    "Recruiter commission payments will be released in two stages:",
    "• 50% after the candidate completes 30 days of employment",
    "• 50% after the candidate completes 90 days of employment",
    "Payouts are subject to candidate continuity and client payment realization.",
  ]},
  { title: "7. Submission & Quality Standards", content: [
    "I acknowledge that:",
    "• I may submit a maximum of 3 candidate profiles per mandate, unless specified otherwise.",
    "• All submissions must be genuine, verified, and relevant to the role.",
    "• Duplicate, fabricated, or misleading submissions are not allowed.",
    "RecruiterV reserves the right to reject profiles not meeting quality standards.",
  ]},
  { title: "8. Ethical Code of Conduct", content: [
    "I agree that I will not:",
    "• Misrepresent candidate information", "• Manipulate compensation expectations", "• Submit duplicate candidates",
    "• Contact clients directly without authorization", "• Attempt to bypass the RecruiterV platform",
    "Violation of these rules may result in account suspension or termination.",
  ]},
  { title: "9. Candidate Ownership Framework", content: [
    "Candidate ownership shall be determined strictly by RecruiterV platform records.",
    "Ownership is valid only when:",
    "• The candidate is submitted through the platform", "• The submission timestamp is verified", "• Candidate identity validation exists",
    "Candidate ownership remains valid for 90 days from submission date.",
  ]},
  { title: "10. Replacement & Recovery", content: [
    "If a candidate resigns, withdraws, or is terminated before qualifying milestones, payout eligibility shall depend on client replacement clauses.",
    "Recruiters may be expected to assist in replacement sourcing where applicable.",
  ]},
  { title: "11. Recruiter Representations", content: [
    "I confirm that:",
    "• All candidate information submitted by me will be accurate", "• Candidates will be sourced lawfully",
    "• I will comply with all applicable regulations and tax obligations",
  ]},
  { title: "12. Confidentiality & Non-Circumvention", content: [
    "I agree to maintain strict confidentiality regarding:",
    "• Client identities", "• Compensation structures", "• Mandate details", "• Platform workflows",
    "I will not attempt to bypass the platform or establish direct business relationships with clients introduced through RecruiterV.",
  ]},
  { title: "13. Platform Data Usage", content: [
    "I acknowledge that:",
    "• All platform systems, workflows, and data belong to RecruiterV", "• Platform access is conditional and revocable",
    "I will not copy, scrape, redistribute, or misuse platform data.",
  ]},
  { title: "14. Limitation of Liability", content: [
    "I acknowledge that earnings on RecruiterV are performance-based and depend on successful hiring outcomes.",
    "The platform does not guarantee income or mandate allocation.",
  ]},
  { title: "15. Termination", content: [
    "RecruiterV may suspend or terminate recruiter access in cases of:",
    "• Fraud", "• Ethical violations", "• Platform misuse", "• Confidentiality breaches",
    "Upon termination, the recruiter remains eligible only for valid earned commissions.",
  ]},
  { title: "16. Governing Law", content: [
    "This agreement shall be governed by the laws of India.",
    "Courts in Gurgaon, Haryana shall have exclusive jurisdiction.",
  ]},
];

export const FINAL_CONSENT_LINES = [
  "• I have carefully read and understood this Agreement.",
  "• I voluntarily agree to all the terms and conditions.",
  "• The payment details provided by me are accurate and belong to me.",
  "• I consent to execute this Agreement electronically.",
  "• I understand that my digital acceptance shall have the same legal effect as my handwritten signature under the Information Technology Act, 2000.",
];

// Bank/payment fields captured on the profile and rendered in the agreement PDF.
// `key` matches the profile field; a missing value renders as "Not filled".
export const PAYMENT_FIELDS = [
  { key: "accountHolderName", label: "Account Holder Name" },
  { key: "bankName",          label: "Bank Name" },
  { key: "branchName",        label: "Branch Name" },
  { key: "ifsc",              label: "IFSC Code" },
  { key: "accountNumber",     label: "Account Number", mask: true },
  { key: "accountType",       label: "Account Type" },
  { key: "upiId",             label: "UPI ID (Optional)" },
  { key: "pan",               label: "PAN Number" },
];

// Mask an account number for the PDF — show only the last 4 digits.
const maskAccount = (v) => {
  const s = String(v || "").replace(/\s+/g, "");
  if (s.length <= 4) return s;
  return "XXXX" + s.slice(-4);
};

// Build the acceptance-record PDF for a user who agreed to the Terms at
// registration. Contains the role's key terms plus the acceptance record
// (name / email / role / timestamp / IP). PAN and address are not collected at
// sign-up, so they are intentionally omitted.
export function buildRegistrationAgreementPDF({ role, user, timestamp, userIP }) {
  const terms = getRoleTerms(role);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, PH = 297, ML = 14, MR = 14, MT = 22, MB = 22;
  const CW = PW - ML - MR;
  const LH = 5.5;
  let y = MT;

  const header = () => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(terms?.docTitle || "RecruiterV Agreement", ML, 12);
    doc.setDrawColor(220, 220, 220);
    doc.line(ML, 14, PW - MR, 14);
  };
  const chk = (needed) => { if (y + needed > PH - MB) { doc.addPage(); y = MT; header(); } };
  const txt = (str, { size = 9.5, bold = false, color = [60, 60, 60], indent = 0 } = {}) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(str, CW - indent);
    chk(lines.length * LH + 1);
    lines.forEach((l) => { doc.text(l, ML + indent, y); y += LH; });
  };

  const isRecruiter = (terms?.key || String(role).toLowerCase()) === "recruiter";

  header();
  txt(terms?.docTitle || "RecruiterV Agreement", { size: 14, bold: true, color: [20, 20, 20] });
  y += 2;
  txt("Digital Acceptance & E-Sign Agreement", { size: 9, color: [110, 110, 110] });
  y += 4;

  // ── Section 1: Auto-filled information ──
  txt("Section 1: Recruiter Information", { size: 11, bold: true, color: [30, 80, 200] });
  txt(`Name: ${user?.name || ""}`);
  txt(`Registered Email ID: ${user?.email || ""}`);
  txt(`Mobile Number: ${user?.phone || user?.mobile || "Not filled"}`);
  txt(`Role: ${terms?.label || role || ""}`);
  txt(`Acceptance Timestamp: ${timestamp || new Date().toISOString()}`);
  if (userIP) txt(`IP Address: ${userIP}`);
  txt(`Agreement Version: v1.0`);
  y += 4;

  // ── Section 2: Payment details (recruiter) — profile-sourced, "Not filled" when empty ──
  if (isRecruiter) {
    txt("Section 2: Payment Details", { size: 11, bold: true, color: [30, 80, 200] });
    PAYMENT_FIELDS.forEach((f) => {
      const raw = user?.[f.key];
      const val = raw ? (f.mask ? maskAccount(raw) : String(raw)) : "Not filled";
      txt(`${f.label}: ${val}`, raw ? {} : { color: [180, 60, 60] });
    });
    y += 1;
    txt("Declaration: I confirm that the above bank account belongs to me and all information provided is true and correct. RecruiterV shall not be responsible for any payment delays or failures arising due to incorrect banking information provided by me.", { size: 8.5, color: [90, 90, 90] });
    y += 4;
  }

  // ── Section 3: The agreement clauses ──
  if (isRecruiter) {
    txt("Section 3: Recruiter Agreement", { size: 11, bold: true, color: [30, 80, 200] });
    y += 1;
    RECRUITER_CLAUSES.forEach((clause) => {
      chk(16);
      txt(clause.title, { size: 10, bold: true, color: [20, 20, 20] });
      clause.content.forEach((line) => txt(line, { color: [70, 70, 70], indent: line.startsWith("•") ? 4 : 0 }));
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      chk(LH);
      doc.text("I Agree - Digitally Accepted", ML, y);
      y += LH + 1;
    });
  } else if (terms) {
    // Coach/Expert: their role-specific highlights.
    txt("Earnings Structure", { size: 11, bold: true, color: [20, 20, 20] });
    terms.earnings.forEach((l) => txt(`• ${l}`, { indent: 3 }));
    y += 2;
    txt("Payout Structure", { size: 11, bold: true, color: [20, 20, 20] });
    terms.payout.forEach((l) => txt(`• ${l}`, { indent: 3 }));
    if (terms.note) { y += 2; txt(terms.note, { size: 8.5, color: [110, 110, 110] }); }
    y += 4;
  }

  // ── Final digital consent ──
  y += 2;
  chk(30);
  txt("Final Digital Consent", { size: 11, bold: true, color: [20, 20, 20] });
  FINAL_CONSENT_LINES.forEach((l) => txt(l, { color: [70, 70, 70], indent: 4 }));
  y += 2;

  // ── Digital signature block ──
  chk(34);
  doc.setDrawColor(200, 200, 200);
  doc.line(ML, y, PW - MR, y);
  y += 6;
  txt("For Changeleaders Consulting Private Limited", { size: 10, bold: true, color: [30, 80, 200] });
  txt("Authorized Signatory");
  txt("Name: Roshan Kumar Rawat");
  txt("Designation: Founder & CEO");
  txt("Platform: RecruiterV");
  y += 3;
  doc.setTextColor(22, 163, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  chk(LH);
  doc.text("✓ Digitally Accepted & Signed via RecruiterV", ML, y);

  return doc;
}
