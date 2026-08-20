import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Building2, Search, Loader2, RefreshCw, BadgePercent, Pencil, X, Camera } from 'lucide-react';
import QuestionsEditor, { validateQuestions } from '../components/QuestionsEditor';
import RichTextEditor from '../components/RichTextEditor';
import MandatoryFieldsEditor, { defaultRequiredFields } from '../components/MandatoryFieldsEditor';

// ── Edit Modal ────────────────────────────────────────────────────────────────
/**
 * Company create/edit form. SuperAdmin edits an existing company; a vendor uses
 * the identical form to submit a new one for approval — `saveRequest` swaps the
 * endpoint so the fields and validation stay in one place.
 */
export const CompanyFormModal = ({ company = {}, onClose, onSaved, title, saveRequest }) => {
  const [form, setForm] = useState({
    name:         company.name         || '',
    lower:        company.lower        || '',
    commisson:    company.commisson    || '',
    overview:     company.overview     || '',
    candidateInstructions: company.candidateInstructions || '',
    audioText:    company.audioText    || '',
    photoRequired: company.photoRequired === true,
  });
  const [requiredFields, setRequiredFields] = useState(() => defaultRequiredFields(company));
  // Tier-based commission (same as Add New Company) — each row has its own type
  const [tiers, setTiers] = useState(
    Array.isArray(company.commissionTiers) && company.commissionTiers.length
      ? company.commissionTiers.map(t => ({ type: t.type || company.commissionType || '', tier: t.tier || '', value: String(t.value ?? '') }))
      : [{ type: '', tier: '', value: '' }]
  );
  const updTier = (i, key, val) => setTiers(t => t.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  const addTier = () => setTiers(t => [...t, { type: t[t.length - 1]?.type || '', tier: '', value: '' }]);
  const removeTier = (i) => setTiers(t => t.length > 1 ? t.filter((_, idx) => idx !== i) : t);
  // Client-requirement questions — prefilled from the company record.
  const [questions, setQuestions] = useState(
    Array.isArray(company.questions)
      ? company.questions.map(q => ({ type: q.type || 'subjective', question: q.question || '', options: Array.isArray(q.options) ? q.options : [] }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Company name is required'); return; }
    if (!form.lower.trim()) { setError('Lowercase name is required'); return; }
    if (!/^[a-z\s]+$/.test(form.lower.trim())) { setError('Lowercase name must contain only lowercase letters and spaces'); return; }

    // Commission tiers — validated only when at least one row is filled in;
    // without any filled tier the stored legacy commission stays untouched.
    let commissionPayload = {};
    const touched = tiers.filter(t => t.type || t.tier.trim() || t.value.trim());
    if (touched.length) {
      const filled = tiers.map(t => ({ type: t.type, tier: t.tier.trim(), value: t.value.trim() })).filter(t => t.type && t.tier && t.value);
      if (filled.length === 0) { setError('Add at least one tier: select Fixed or Percentage, then enter a tier level and value'); return; }
      if (touched.some(t => !t.type || !t.tier.trim() || !t.value.trim())) { setError('Every tier row needs a type (Fixed/Percentage), a tier level, and a value'); return; }
      if (filled.some(t => isNaN(parseFloat(t.value)))) { setError('Tier values must be numeric'); return; }
      if (filled.some(t => t.type === 'percentage' && parseFloat(t.value) > 100)) { setError('Percentage cannot exceed 100'); return; }
      commissionPayload = { commissionType: filled[0].type, commissionTiers: filled, commisson: filled[0].value };
    }

    const qErr = validateQuestions(questions);
    if (qErr) { setError(qErr); return; }
    const cleanQuestions = questions
      .map(q => ({ type: q.type, question: q.question.trim(), options: (q.options || []).filter(o => o.trim()) }))
      .filter(q => q.question);

    setSaving(true);
    setError('');
    try {
      const photoRequired = (requiredFields.find(f => f.key === 'photo')?.required) === true;
      const payload = { ...form, photoRequired, lower: form.lower.trim(), ...commissionPayload, questions: cleanQuestions, requiredFields };
      if (saveRequest) await saveRequest(payload);
      else await axios.put(`/clientspoc/company/${company.id}`, payload, { withCredentials: true });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Pencil size={16} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">{title || 'Edit Company'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Company Name</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Lowercase Name <span className="font-normal text-gray-400">(letters only)</span></label>
            <input name="lower" value={form.lower} onChange={handleChange} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Commission</label>
            {/* Tier rows — each row picks its own Fixed/Percentage type */}
            <div className="space-y-3 bg-blue-50/60 border-2 border-blue-100 rounded-xl p-3">
              {tiers.map((row, i) => (
                <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Fixed / Percentage toggle for this tier */}
                    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                      {[{ k: 'fixed', label: 'Fixed (₹)' }, { k: 'percentage', label: 'Percentage (%)' }].map(o => (
                        <button key={o.k} type="button"
                          onClick={() => { updTier(i, 'type', o.k); setError(''); }}
                          className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                            row.type === o.k
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-500 hover:bg-blue-50'
                          }`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => removeTier(i)} disabled={tiers.length === 1}
                      title="Remove this tier"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex-shrink-0">
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1">Position Tier Level</label>
                      <input type="text" value={row.tier}
                        onChange={e => { updTier(i, 'tier', e.target.value); setError(''); }}
                        placeholder={`e.g. Tier ${i + 1}`}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1">{row.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}</label>
                      <div className="relative">
                        {row.type === 'fixed' && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                        )}
                        <input type="number" min="0" step="any" value={row.value}
                          onChange={e => { updTier(i, 'value', e.target.value); setError(''); }}
                          placeholder={row.type === 'percentage' ? 'e.g. 8.33' : 'e.g. 50000'}
                          className={`w-full border-2 border-gray-200 rounded-lg ${row.type === 'fixed' ? 'pl-7 pr-3' : row.type === 'percentage' ? 'pl-3 pr-7' : 'px-3'} py-2 text-sm focus:border-blue-500 outline-none bg-white`} />
                        {row.type === 'percentage' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addTier}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all">
                + Add another tier
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Company Overview</label>
            <textarea name="overview" value={form.overview} onChange={handleChange} rows={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all resize-vertical" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Candidate Instructions</label>
            <p className="text-xs text-gray-500 mb-1.5">Shown to candidates before the company overview on the apply and shared-position pages.</p>
            <RichTextEditor
              value={form.candidateInstructions}
              onChange={(html) => setForm(f => ({ ...f, candidateInstructions: html }))}
              placeholder="e.g. Keep your updated resume and ID ready; be reachable between 10am–6pm…"
              minHeight={140}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Audio Description (spoken)</label>
            <p className="text-xs text-gray-500 mb-1.5">Played aloud when a recruiter taps the 🔊 speaker next to the company name on the position pages. Recruiters can choose Hindi or other Indian languages to hear it.</p>
            <textarea name="audioText" value={form.audioText} onChange={handleChange} rows={4}
              placeholder="e.g. About the company, the role, what makes a strong candidate, and any key tips for recruiters…"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all resize-vertical" />
          </div>

          {/* Mandatory fields in the submit form */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Mandatory fields in submit form</label>
            <MandatoryFieldsEditor value={requiredFields} onChange={setRequiredFields} />
          </div>

          {/* Client Requirement Questions */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Client Requirement Questions <span className="font-normal text-gray-400 text-xs">(shown on every position of this company)</span></label>
            <QuestionsEditor compact questions={questions} onChange={(qs) => { setQuestions(qs); setError(''); }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold py-2.5 rounded-xl hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 transition-all">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const EditModal = CompanyFormModal;

const AllCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [sort,      setSort]      = useState('name');
  const [commBand,  setCommBand]  = useState('all');
  const [editing,   setEditing]   = useState(null); // company object being edited

  const fetchCompanies = () => {
    setLoading(true);
    axios.get('/clientspoc/companies-full', { withCredentials: true })
      .then(r => setCompanies(r.data?.companies || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchCompanies(); }, []);

  const num = (c) => { const n = parseFloat(c?.commisson); return isNaN(n) ? 0 : n; };

  const filtered = useMemo(() => {
    let d = companies.filter(c => {
      const q = search.trim().toLowerCase();
      if (q && !((c.name || '').toLowerCase().includes(q) || (c.overview || '').toLowerCase().includes(q))) return false;
      const cm = num(c);
      if (commBand === 'lt5'   && !(cm < 5))              return false;
      if (commBand === '5to10' && !(cm >= 5 && cm < 10))  return false;
      if (commBand === 'gte10' && !(cm >= 10))             return false;
      return true;
    });
    d.sort((a, b) => {
      if (sort === 'commission-high') return num(b) - num(a);
      if (sort === 'commission-low')  return num(a) - num(b);
      return (a.name || '').localeCompare(b.name || '');
    });
    return d;
  }, [companies, search, sort, commBand]);

  return (
    <div className="p-4 sm:p-6">
      {editing && (
        <EditModal
          company={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchCompanies}
        />
      )}

      <div className="flex items-center gap-2 mb-4">
        <Building2 size={20} className="text-gray-600" />
        <h1 className="text-lg font-bold text-gray-900">All Companies</h1>
        <span className="text-xs text-gray-400 ml-1">{companies.length} total</span>
        <button onClick={fetchCompanies} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-[220px]">
          <Search size={15} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company name or overview…"
            className="bg-transparent text-sm outline-none w-full" />
        </div>
        <select value={commBand} onChange={e => setCommBand(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="all">All commissions</option>
          <option value="lt5">&lt; 5%</option>
          <option value="5to10">5% – 10%</option>
          <option value="gte10">≥ 10%</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="name">Sort: Name (A–Z)</option>
          <option value="commission-high">Sort: Commission (high → low)</option>
          <option value="commission-low">Sort: Commission (low → high)</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 size={20} className="animate-spin inline" /></div>
      ) : !filtered.length ? (
        <div className="py-16 text-center text-gray-400">{companies.length ? 'No companies match your filters.' : 'No companies added yet.'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 text-white grid place-items-center font-bold flex-shrink-0">
                    {(c.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{c.name || '—'}</div>
                    <div className="text-[11px] text-gray-400 truncate">{c.lower || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                    <BadgePercent size={12} /> {c.commisson || '0'}%
                  </span>
                  <button
                    onClick={() => setEditing(c)}
                    title="Edit company"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 whitespace-pre-wrap mb-2">
                {c.overview || 'No overview provided.'}
              </p>
              {c.photoRequired && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <Camera size={11} /> Photo required
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCompanies;
