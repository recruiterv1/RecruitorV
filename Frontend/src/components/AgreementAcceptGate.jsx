import { useContext, useState } from "react";
import axios from "axios";
import { FileText, Percent, Wallet, ExternalLink, ShieldCheck } from "lucide-react";
import { UserStateContext, UserDispatchContext } from "../context/AuthPro";
import { getRoleTerms, buildRegistrationAgreementPDF } from "../lib/agreementTerms";

// Blocking Terms acceptance for accounts created BEFORE the sign-up checkbox
// existed. Same lightweight consent new users give at registration: a summary of
// what they earn, a mandatory tick, and a link to the full agreement — instead of
// forcing them through the long clause-by-clause page.
//
// Not dismissible: there is no close button and the backdrop ignores clicks.
const AgreementAcceptGate = () => {
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const roleCategory = user?.roleCategory || "";
  const terms = getRoleTerms(roleCategory)
    // Coach/Expert may be stored with display variants; fall back by keyword.
    || getRoleTerms(/coach|guru/i.test(roleCategory) ? "Coach" : /expert/i.test(roleCategory) ? "Expert" : "Recruiter");

  const handleAccept = async () => {
    if (!agreed || saving) return;
    setSaving(true);
    setError("");
    try {
      // Include profile-sourced payment fields so the agreement PDF can render
      // Section 2; anything the recruiter hasn't filled shows as "Not filled".
      const acceptedUser = {
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || user?.mobile || "",
        accountHolderName: user?.accountHolderName || "",
        bankName: user?.bankName || "",
        branchName: user?.branchName || "",
        ifsc: user?.ifsc || "",
        accountNumber: user?.accountNumber || "",
        accountType: user?.accountType || "",
        upiId: user?.upiId || "",
        pan: user?.pan || user?.panNumber || "",
      };
      const timestamp = new Date().toISOString();
      let userIP = "";
      try {
        const ipRes = await axios.get("https://api.ipify.org?format=json");
        userIP = ipRes.data?.ip || "";
      } catch (_) { /* IP is optional */ }

      const doc = buildRegistrationAgreementPDF({ role: terms.label.includes("Coach") ? "Coach" : terms.label.includes("Expert") ? "Expert" : "Recruiter", user: acceptedUser, timestamp, userIP });
      const b64 = doc.output("datauristring").split("base64,")[1];

      const res = await axios.post("/api/agreement/submit", {
        role: terms.key,
        ...(terms.key === "recruiter" ? { commisiontype: "Standard 35% + 5% Variable" } : {}),
        user: acceptedUser,
        meta: { timestamp, ip: userIP, version: "v1.0" },
        pdfBase64: b64,
        fileName: `${terms.label.replace(/[^A-Za-z]/g, "")}_Agreement_${(acceptedUser.name || "User").replace(/\s+/g, "_")}.pdf`,
      }, { withCredentials: true });

      if (res.data?.success) {
        dispatch({ type: "UPDATE_USER", payload: { agreementSigned: true } });
      } else {
        setError(res.data?.message || "Could not record your acceptance. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not record your acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <FileText size={18} className="text-blue-600" />
          <h2 className="font-bold text-gray-900">Accept the Terms &amp; Conditions to continue</h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Before you continue using RecruiterV, please accept the Terms &amp; Conditions
            that apply to your role. This only takes a moment.
          </p>

          {terms && (
            <>
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-100 mb-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your role</p>
                  <p className="font-bold text-gray-900">{terms.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">You earn</p>
                  <p className="text-xl font-extrabold text-orange-600">{terms.headline}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Percent size={15} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Earnings Structure</h3>
                </div>
                <ul className="space-y-1.5">
                  {terms.earnings.map((line, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-blue-400 mt-0.5">•</span><span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={15} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Payout Structure</h3>
                </div>
                <ul className="space-y-1.5">
                  {terms.payout.map((line, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-blue-400 mt-0.5">•</span><span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {terms.note && (
                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">{terms.note}</p>
              )}

              <a
                href={terms.agreementPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700 mb-5"
              >
                View full agreement <ExternalLink size={14} />
              </a>
            </>
          )}

          {/* Mandatory acceptance */}
          <label className="flex items-start gap-3 cursor-pointer select-none p-4 rounded-xl border-2 border-blue-200 bg-blue-50/60">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
              className="w-5 h-5 mt-0.5 accent-blue-600 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-gray-800 font-medium">
              I agree to the Terms &amp; Conditions and the full agreement for my role.
            </span>
          </label>

          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}

          <button
            onClick={handleAccept}
            disabled={!agreed || saving}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck size={16} />
            {saving ? "Recording your acceptance…" : "Accept & Continue"}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            A copy of your acceptance will be emailed to you for your records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgreementAcceptGate;
