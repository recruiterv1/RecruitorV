import { useState } from "react";
import { isSuccessMessage } from '../utils/messageTone';
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Phone, Mail, User, Lock, Briefcase, Shield, Users, UserCheck, BookOpen, Award } from "lucide-react";
import QuestionsEditor, { validateQuestions } from "../components/QuestionsEditor";
import RichTextEditor from "../components/RichTextEditor";
import MandatoryFieldsEditor, { defaultRequiredFields } from "../components/MandatoryFieldsEditor";

const ClientSpocCompany=()=> {
  
  
  const [form, setForm] = useState({
    commisson:"",
    lower:"",
    name:"",
    overview:"",
    photoRequired: false
  });

  // Client-requirement questions (subjective / yes-no / multiple-select).
  const [questions, setQuestions] = useState([]);
  // Candidate instructions (rich text) — shown to candidates before company overview.
  const [candidateInstructions, setCandidateInstructions] = useState("");
  // Audio description — spoken aloud from the 🔊 speaker next to the company name.
  const [audioText, setAudioText] = useState("");
  const [requiredFields, setRequiredFields] = useState(() => defaultRequiredFields({}));

  // Tier-based commission: each tier row has its own Fixed/Percentage type.
  const [tiers, setTiers] = useState([{ type: "", tier: "", value: "" }]);
  const updTier = (i, key, val) => setTiers(t => t.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  const addTier = () => setTiers(t => [...t, { type: t[t.length - 1]?.type || "", tier: "", value: "" }]);
  const removeTier = (i) => setTiers(t => t.length > 1 ? t.filter((_, idx) => idx !== i) : t);

  const [message, setMessage] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Add validateForm function
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = "Company name is required";
    }
    
    if (!form.lower.trim()) {
      newErrors.lower = "Lower case company name is required";
    } else if (!/^[a-z\s]+$/.test(form.lower)) {
      newErrors.lower = "Only lowercase letters and spaces allowed";
    }
    
    const touched = tiers.filter(t => t.type || t.tier.trim() || t.value.trim());
    const filled = tiers.filter(t => t.type && t.tier.trim() && t.value.trim());
    if (filled.length === 0) {
      newErrors.commisson = "Add at least one tier: select Fixed or Percentage, then enter a tier level and value";
    } else if (touched.some(t => !t.type || !t.tier.trim() || !t.value.trim())) {
      newErrors.commisson = "Every tier row needs a type (Fixed/Percentage), a tier level, and a value";
    } else if (filled.some(t => isNaN(parseFloat(t.value)))) {
      newErrors.commisson = "Tier values must be numeric";
    } else if (filled.some(t => t.type === "percentage" && parseFloat(t.value) > 100)) {
      newErrors.commisson = "Percentage cannot exceed 100";
    }
    
    if (!form.overview.trim()) {
      newErrors.overview = "Company overview is required";
    }

    const qErr = validateQuestions(questions);
    if (qErr) newErrors.questions = qErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage("");

    const filledTiers = tiers
      .map(t => ({ type: t.type, tier: t.tier.trim(), value: t.value.trim() }))
      .filter(t => t.type && t.tier && t.value);
    const dataToSend = {
          // Legacy single commission value/type = first tier's, so existing
          // consumers (position commission, company cards) keep working.
          commisson: filledTiers[0]?.value || form.commisson.trim(),
          commissionType: filledTiers[0]?.type || "",
          commissionTiers: filledTiers,
          questions: questions.map(q => ({ type: q.type, question: q.question.trim(), options: (q.options || []).filter(o => o.trim()) })).filter(q => q.question),
          lower:form.lower.trim(),
          name:form.name.trim(),
          overview:form.overview.trim(),
          candidateInstructions,
          audioText,
          requiredFields,
          photoRequired: (requiredFields.find(f => f.key === 'photo')?.required) === true
    };

    console.log("Data being sent to backend:", dataToSend);

    try {
      const res = await axios.post("/clientspoc/companyAdd", dataToSend, {
        withCredentials: true
      });
      
      setMessage("Company added successfully!");
      setForm({ commisson:"", lower:"", name:"", overview:"", photoRequired: false });
      setAudioText("");
      setTiers([{ type: "", tier: "", value: "" }]);
      setQuestions([]);
      setCandidateInstructions("");
      
    } catch (err) {
      console.error("Full error:", err);
      
      setMessage(
        err.response?.data?.message || "Something went wrong. Please check console for details."
      );
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Add New Company
          </h2>
        </div>

        <div className="p-6 sm:p-8">
            {message && (
              <div className={`mb-4 p-4 rounded-xl ${
                isSuccessMessage(message) 
                  ? "bg-green-50 text-green-700 border-2 border-green-200" 
                  : "bg-red-50 text-red-700 border-2 border-red-200"
                }`}>
                    {message}
              </div>
            )}


          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Company Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={`w-full border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter Company Name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Lower Name */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Company Name (*Only Alphabet Lower)
              </label>
              <input
                type="text"
                name="lower"
                required
                value={form.lower}
                onChange={handleChange}
                className={`w-full border-2 ${errors.lower ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Enter Lower Name (e.g. 'accuvate', 'know max')"
              />
              {errors.lower && (
                <p className="text-red-500 text-xs mt-1">{errors.lower}</p>
              )}
            </div>

            {/* Commission — type (Fixed / Percentage) + tier rows */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Commission
              </label>

              {/* Tier rows — each row picks its own Fixed/Percentage type */}
              <div className="space-y-3 bg-blue-50/60 border-2 border-blue-100 rounded-xl p-4">
                {tiers.map((row, i) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {/* Fixed / Percentage toggle for this tier */}
                      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                        {[{ k: 'fixed', label: 'Fixed (₹)' }, { k: 'percentage', label: 'Percentage (%)' }].map(o => (
                          <button
                            key={o.k}
                            type="button"
                            onClick={() => { updTier(i, 'type', o.k); if (errors.commisson) setErrors({ ...errors, commisson: "" }); }}
                            className={`px-3 py-2 text-xs font-semibold transition-all ${
                              row.type === o.k
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-500 hover:bg-blue-50'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        disabled={tiers.length === 1}
                        title="Remove this tier"
                        className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-1">Position Tier Level</label>
                        <input
                          type="text"
                          value={row.tier}
                          onChange={e => { updTier(i, 'tier', e.target.value); if (errors.commisson) setErrors({ ...errors, commisson: "" }); }}
                          placeholder={`e.g. Tier ${i + 1} / L${i + 1} / Senior`}
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-1">{row.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}</label>
                        <div className="relative">
                          {row.type === 'fixed' && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                          )}
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.value}
                            onChange={e => { updTier(i, 'value', e.target.value); if (errors.commisson) setErrors({ ...errors, commisson: "" }); }}
                            placeholder={row.type === 'percentage' ? 'e.g. 8.33' : 'e.g. 50000'}
                            className={`w-full border-2 border-gray-200 rounded-lg ${row.type === 'fixed' ? 'pl-7 pr-3' : row.type === 'percentage' ? 'pl-3 pr-7' : 'px-3'} py-2.5 text-sm focus:border-blue-500 outline-none transition-all bg-white`}
                          />
                          {row.type === 'percentage' && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTier}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  + Add another tier
                </button>
              </div>

              {errors.commisson && (
                <p className="text-red-500 text-xs mt-1">{errors.commisson}</p>
              )}
            </div>

            {/* OverView - Changed to textarea */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Company Overview
              </label>
              <textarea
                name="overview"
                required
                value={form.overview}
                onChange={handleChange}
                rows="4"
                className={`w-full border-2 ${errors.overview ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-vertical`}
                placeholder="Enter Company Overview"
              />
              {errors.overview && (
                <p className="text-red-500 text-xs mt-1">{errors.overview}</p>
              )}
            </div>

            {/* Candidate Instructions (rich text) */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Candidate Instructions
              </label>
              <p className="text-xs text-gray-500 mb-2">Shown to candidates before the company overview on the apply and shared-position pages.</p>
              <RichTextEditor
                value={candidateInstructions}
                onChange={setCandidateInstructions}
                placeholder="e.g. Keep your updated resume and ID ready; be reachable between 10am–6pm…"
                minHeight={140}
              />
            </div>

            {/* Audio Description (spoken) */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Audio Description (spoken)
              </label>
              <p className="text-xs text-gray-500 mb-2">Played aloud when a recruiter taps the 🔊 speaker next to the company name on the position pages. Recruiters can choose Hindi or other Indian languages to hear it.</p>
              <textarea
                name="audioText"
                rows={4}
                value={audioText}
                onChange={(e) => setAudioText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-vertical"
                placeholder="e.g. About the company, the role, what makes a strong candidate, and any key tips for recruiters…"
              />
            </div>

            {/* Mandatory fields in the submit form */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Mandatory fields in submit form
              </label>
              <MandatoryFieldsEditor value={requiredFields} onChange={setRequiredFields} />
            </div>

            {/* Client Requirement Questions */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Client Requirement Questions
                <span className="font-normal text-gray-400 text-xs">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                These questions will be shown on every position of this company. Types: subjective, yes/no, or multiple select (with options).
              </p>
              <QuestionsEditor questions={questions} onChange={(qs) => { setQuestions(qs); if (errors.questions) setErrors({ ...errors, questions: "" }); }} />
              {errors.questions && (
                <p className="text-red-500 text-xs mt-1">{errors.questions}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding New Company...
                </span>
              ) : (
                "Add New Company"
              )}
            </button>
          </form>

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ClientSpocCompany;