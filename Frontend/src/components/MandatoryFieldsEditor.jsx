import React from 'react';
import { X } from 'lucide-react';

// Candidate fields a company can mark mandatory in the submit form. Keys map to the
// submit form's fields (see DashViewV2 enforcement).
export const REQUIRED_FIELD_CATALOG = [
  { key: 'photo', label: 'Candidate Photo' },
  { key: 'pan_number', label: 'PAN Number' },
  { key: 'jr_number', label: 'JR Number' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'curr_emp', label: 'Current Employer' },
  { key: 'highest_education', label: 'Highest Education' },
  { key: 'total_exp', label: 'Total Experience' },
  { key: 'rel_exp', label: 'Relevant Experience' },
  { key: 'skill_evidence', label: 'Skill Evidence' },
  { key: 'current_ctc', label: 'Current CTC' },
  { key: 'exp_ctc', label: 'Expected CTC' },
  { key: 'offer_hand', label: 'Offer In Hand' },
  { key: 'curr_state', label: 'Current State' },
  { key: 'curr_loc', label: 'Current City' },
  { key: 'relocation', label: 'Relocation Willingness' },
  { key: 'notice_period', label: 'Notice Period' },
  { key: 'last_day', label: 'Earliest Joining Date' },
  { key: 'notice_proof', label: 'Notice Proof Status' },
  { key: 'avg_tenure', label: 'Average Tenure' },
  { key: 'emp_gaps', label: 'Employment Gaps' },
  { key: 'employer_tier', label: 'Employer Verification Tier' },
  { key: 'industry_match', label: 'Industry Match' },
  { key: 'self_rate', label: 'Self Rating' },
];

// Default config for a company that has none yet — preserves current behaviour
// (PAN mandatory, photo per the old photoRequired flag) and offers JR No as optional.
export const defaultRequiredFields = (company = {}) => {
  if (Array.isArray(company.requiredFields) && company.requiredFields.length) return company.requiredFields;
  return [
    { key: 'photo', label: 'Candidate Photo', required: company.photoRequired === true },
    { key: 'pan_number', label: 'PAN Number', required: true },
    { key: 'jr_number', label: 'JR Number', required: false },
  ];
};

// value: array of {key,label,required}; onChange(next)
export default function MandatoryFieldsEditor({ value = [], onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const usedKeys = new Set(rows.map(r => r.key));
  const remaining = REQUIRED_FIELD_CATALOG.filter(c => !usedKeys.has(c.key));

  const toggle = (key) => onChange(rows.map(r => (r.key === key ? { ...r, required: !r.required } : r)));
  const remove = (key) => onChange(rows.filter(r => r.key !== key));
  const addFromCatalog = (key) => { const c = REQUIRED_FIELD_CATALOG.find(x => x.key === key); if (c && !usedKeys.has(c.key)) onChange([...rows, { key: c.key, label: c.label, required: true }]); };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Choose which candidate details are <b>mandatory</b> in the recruiter's submit-candidate form for this company.
        Toggle each on/off, and use <b>+ Add a field</b> to include more.
      </p>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.key} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
            <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
              <input type="checkbox" checked={!!r.required} onChange={() => toggle(r.key)} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm font-medium text-gray-700">{r.label}</span>
            </label>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.required ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {r.required ? 'Mandatory' : 'Optional'}
            </span>
            <button type="button" onClick={() => remove(r.key)} title="Remove" className="text-gray-400 hover:text-red-500"><X size={15} /></button>
          </div>
        ))}
        {rows.length === 0 && <div className="text-xs text-gray-400">No fields configured — the form's defaults apply.</div>}
      </div>
      {remaining.length > 0 && (
        <div className="mt-2">
          <select value="" onChange={e => { if (e.target.value) { addFromCatalog(e.target.value); e.target.value = ''; } }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
            <option value="">+ Add a field…</option>
            {remaining.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
