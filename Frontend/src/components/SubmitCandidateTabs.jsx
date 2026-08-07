import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Eye, Save, X, Mail, Phone, MapPin, FileText } from 'lucide-react';
import Dash_Form from '../pages/Dash_Form';
import CvPreview from './CvPreview';

const EDITABLE = [
  ['candidate', 'Name'], ['emails', 'Email'], ['mob', 'Phone'], ['curr_loc', 'Current Location'],
  ['total_exp', 'Total Exp'], ['rel_exp', 'Relevant Exp'], ['current_ctc', 'Current CTC'],
  ['exp_ctc', 'Expected CTC'], ['notice_period', 'Notice Period'], ['highest_education', 'Education'],
  ['skillCategory', 'Skill Category'],
];

// Friendly labels for the read-only "All details" section.
const LABELS = {
  pos_name: 'Position', client: 'Client', clientspoc: 'Client SPOC', hr_name: 'HR Name',
  statusa: 'Status', source: 'Source', recName: 'Recruiter', recEmail: 'Recruiter Email',
  curr_state: 'Current State', pref_state: 'Preferred State', pref_loc: 'Preferred Location',
  self_rate: 'Self Rating', last_day: 'Last Working Day', offer_hand: 'Offer in Hand',
  offer_amt: 'Offer Amount', curr_emp: 'Current Employer', dob: 'Date of Birth',
  jr_number: 'JR Number', pan_number: 'PAN', rh_id: 'RH ID', skill_type: 'Skill Type',
  tech_category: 'Tech Category', tech_subcategory: 'Tech Subcategory', tech_skill: 'Tech Skills',
  tech_exp: 'Tech Experience', nontech_category: 'Non-Tech Category', nontech_subcategory: 'Non-Tech Subcategory',
  nontech_skill: 'Non-Tech Skills', nontech_exp: 'Non-Tech Experience', datePosted: 'Added On',
  updatedAt: 'Updated', addedBy: 'Added By', addedByRole: 'Added By Role', pos_id: 'Position ID',
};

// Fields never shown/edited in the modal: internal/system metadata + the ones
// the recruiter asked to hide (recruiter/position/client/status/source/dates).
const HIDE = new Set([
  // internal / system
  'id', 'matchTokens', 'resumeText', 'cv_data', 'cv_url', 'skillsText', 'password', 'pass', '__v',
  'recId', 'recRole', 'bankSourceId', 'fromResumeBank', 'matchPercent', 'matched', 'missing',
  'matchEvaluated', 'matchEvaluatedAt', 'matchNote', 'matchSummary', 'matchReasoning', 'matchMethod',
  'statusaDate', 'statusChangedAt', 'statusChangedBy', 'statusChangedByName', 'addedByRole',
  // explicitly hidden per request
  'clientspoc', 'recEmail', 'recName', 'source', 'hr_name', 'pos_id', 'pos_name', 'client',
  'datePosted', 'statusa', 'updatedAt', 'addedBy',
  // skills handled by its own chip editor
  'skills',
]);

// Additional fields shown/edited below the main EDITABLE block.
// Only these keys are ever rendered — whitelist prevents hidden fields leaking through.
const ADDITIONAL_FIELDS = [
  ['curr_state', 'Current State'], ['pref_state', 'Preferred State'], ['pref_loc', 'Preferred Location'],
  ['curr_emp', 'Current Employer'], ['self_rate', 'Self Rating'], ['last_day', 'Last Working Day'],
  ['offer_hand', 'Offer in Hand'], ['offer_amt', 'Offer Amount'], ['dob', 'Date of Birth'],
  ['jr_number', 'JR Number'], ['pan_number', 'PAN'], ['rh_id', 'RH ID'],
  ['skill_type', 'Skill Type'], ['tech_category', 'Tech Category'], ['tech_subcategory', 'Tech Subcategory'],
  ['tech_skill', 'Tech Skills'], ['tech_exp', 'Tech Experience'],
  ['nontech_category', 'Non-Tech Category'], ['nontech_subcategory', 'Non-Tech Subcategory'],
  ['nontech_skill', 'Non-Tech Skills'], ['nontech_exp', 'Non-Tech Experience'],
];

// Candidate fields that are arrays of simple values (edited as comma lists).
const ARRAY_FIELDS = new Set(['tech_skill', 'tech_exp', 'nontech_skill', 'nontech_exp']);

const EDITABLE_KEYS = new Set(EDITABLE.map(([k]) => k));

const labelFor = (k) => LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());

const fmtVal = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (Array.isArray(v)) {
    if (!v.length) return null;
    return v.map(x => (x && typeof x === 'object' ? Object.values(x).filter(Boolean).join(' ') : String(x))).filter(Boolean).join(', ') || null;
  }
  if (typeof v === 'object') {
    if (typeof v._seconds === 'number') return new Date(v._seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const vals = Object.values(v).filter(x => x !== null && x !== '' && typeof x !== 'object');
    return vals.length ? vals.join(', ') : null;
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

// ── Candidate details modal: the exact "Use your own" form, prefilled, + CV ──
const DetailModal = ({ id, pos, onClose, onSubmitted }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    axios.get(`/addit/bank-candidate/${id}`, { withCredentials: true })
      .then(r => { if (on) setData(r.data?.candidate || null); })
      .catch(() => { if (on) setData(null); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [id]);

  const cvUrl = data?.cv_data || data?.cv_url || '';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-bold text-gray-900">Candidate Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" size={18} /> Loading…</div>
        ) : !data ? (
          <div className="p-10 text-center text-red-500">Could not load candidate.</div>
        ) : (
          <div className="flex-1 overflow-y-auto grid lg:grid-cols-2 gap-0">
            {/* Exactly the "Use your own" form, prefilled with this candidate */}
            <div className="p-3 lg:border-r">
              <Dash_Form
                pos_id={pos?.pos_id}
                client={pos?.client}
                clientspoc={pos?.clientspoc}
                pos_name={pos?.pos_name}
                hr_name={pos?.hr_name}
                prefill={data}
                onSubmitted={() => { onSubmitted && onSubmitted(); onClose(); }}
              />
            </div>
            {/* CV + Photo panel */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 inline-flex items-center gap-1"><FileText size={12} /> CV</span>
                {data.photo_url && (
                  <a href={data.photo_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                    <img src={data.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    View Photo
                  </a>
                )}
              </div>
              {cvUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  <CvPreview url={cvUrl} height="80vh" />
                </div>
              ) : (
                <div className="h-[80vh] border rounded-lg grid place-items-center text-gray-400 text-sm">No CV attached</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Tabbed Submit Candidate modal body ───────────────────────────────────────
const SubmitCandidateTabs = ({ pos_id, client, clientspoc, pos_name, hr_name, prefill = null, onClose, onSubmitted }) => {
  // A candidate carried in from Refer & Earn goes straight to the pre-filled form.
  const [tab, setTab] = useState(prefill ? 'own' : 'matching');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [visible, setVisible] = useState(10);
  const [photoRequired, setPhotoRequired] = useState(false);

  // Company photo requirement — mirrors the "Use your own" form.
  useEffect(() => {
    if (!client) { setPhotoRequired(false); return; }
    axios.get(`/clientspoc/company-settings?name=${encodeURIComponent(client)}`)
      .then(r => setPhotoRequired(r.data?.photoRequired === true))
      .catch(() => setPhotoRequired(false));
  }, [client]);

  // Fisher–Yates shuffle so recruiters see a random set first (10 at a time).
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const fetchMatches = () => {
    setLoading(true);
    setVisible(10);
    axios.get(`/candidate/pos/${pos_id}/matching-bank`, { withCredentials: true })
      .then(r => setMatches(shuffle(r.data?.candidates || [])))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (tab === 'matching' && pos_id) fetchMatches(); /* eslint-disable-next-line */ }, [tab, pos_id]);

  const toggleSelect = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= 2 ? prev : [...prev, id]));

  const submitSelected = async () => {
    if (!selected.length) return;
    setSubmitting(true); setResult(null);
    try {
      const r = await axios.post(`/addit/pos/${pos_id}/submit-from-bank`, { candidateIds: selected }, { withCredentials: true });
      setResult(r.data);
      if (r.data?.submitted?.length) { setSelected([]); onSubmitted && onSubmitted(); fetchMatches(); }
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Submission failed.' });
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-0 border-b mb-4 -mt-1">
        <button onClick={() => setTab('matching')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === 'matching' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          ✨ Matching Candidates
        </button>
        <button onClick={() => setTab('own')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === 'own' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Use your own
        </button>
      </div>

      {tab === 'own' ? (
        <Dash_Form pos_id={pos_id} client={client} clientspoc={clientspoc} pos_name={pos_name} hr_name={hr_name} prefill={prefill} onSubmitted={onSubmitted} />
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Candidates from the resume bank matching this position's JD by 75%+. Select up to <b>2</b> and submit with details auto-filled.
          </p>

          {photoRequired && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>This company <b>requires a candidate photo</b>. Candidates without a photo will be skipped — open <b>View details</b> to add a photo and submit from there.</span>
            </div>
          )}

          {result && (
            <div className={`mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {result.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>
                {result.error
                  ? result.error
                  : `${result.submitted?.length || 0} submitted${result.skipped?.length ? `, ${result.skipped.length} skipped (${result.skipped.map(s => s.reason).join('; ')})` : ''}.`}
              </span>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" size={18} /> Finding matches…</div>
          ) : matches.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No resume-bank candidates match this position at 75%+ yet.</div>
          ) : (
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {matches.slice(0, visible).map(c => {
                const isSel = selected.includes(c.id);
                const disabled = !isSel && selected.length >= 2;
                return (
                  <div key={c.id} className={`rounded-xl border p-3 ${isSel ? 'border-green-400 ring-1 ring-green-300 bg-green-50/40' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={isSel} disabled={disabled} onChange={() => toggleSelect(c.id)} className="mt-1 w-4 h-4 accent-green-600 disabled:opacity-40" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-gray-900 truncate">{c.candidate || 'Unnamed'}</div>
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            <Sparkles size={10} /> {c.matchPercent}%
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                          {c.emails && <span className="inline-flex items-center gap-1"><Mail size={11} />{c.emails}</span>}
                          {c.mob && <span className="inline-flex items-center gap-1"><Phone size={11} />{c.mob}</span>}
                          {c.curr_loc && <span className="inline-flex items-center gap-1"><MapPin size={11} />{c.curr_loc}</span>}
                        </div>
                        <div className="mt-1.5 text-[11px] text-gray-600">
                          <span className="font-semibold text-green-700">Matched:</span> {c.matched?.length ? c.matched.join(', ') : '—'}
                          {c.missing?.length > 0 && <> · <span className="font-semibold text-gray-400">Missing:</span> {c.missing.join(', ')}</>}
                        </div>
                        <div className="mt-2">
                          <button onClick={() => setDetailId(c.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 rounded-lg px-2.5 py-1">
                            <Eye size={13} /> View details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {matches.length > visible && (
                <div className="pt-1 text-center">
                  <button onClick={() => setVisible(v => v + 10)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-green-700 border border-green-200 hover:bg-green-50 rounded-lg">
                    Load more ({matches.length - visible} more)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit bar */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-gray-500">{selected.length}/2 selected</span>
            <button onClick={submitSelected} disabled={!selected.length || submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Submit selected
            </button>
          </div>
        </div>
      )}

      {detailId && (
        <DetailModal
          id={detailId}
          pos={{ pos_id, client, clientspoc, pos_name, hr_name }}
          onClose={() => setDetailId(null)}
          onSubmitted={() => { onSubmitted && onSubmitted(); fetchMatches(); }}
        />
      )}
    </div>
  );
};

export default SubmitCandidateTabs;
