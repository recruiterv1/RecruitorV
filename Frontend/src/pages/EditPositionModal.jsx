import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Briefcase, Building, Users, IndianRupee, MapPin, FileText,
  CheckCircle, X, Search, Edit2, Plus
} from 'lucide-react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import CityMultiSelect from '../components/CityMultiSelect';
import { EXPERIENCE_RANGES, EXPERIENCE_YEARS, CTC_OPTIONS } from './Ad_Pos';
import RichTextEditor, { isHtmlEmpty } from '../components/RichTextEditor';
import { TagInput, ListInput, LimitedTextarea, EducationSelect, SearchSelect } from '../components/PositionFieldInputs';
import QuestionsEditor, { QuestionsList, validateQuestions } from '../components/QuestionsEditor';

const positionCategories = [
  "Immediate Hiring", "Interview Drives", "Fast Response", "High Commission", "New"
];

const MAX_SUB_CATS = 2;
// Parse a comma-separated string (or array) into a clean string array
const toArr = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

// Parse stored comma-separated coach/expert names into name array
const parseNames = (stored) => {
  if (!stored) return [];
  if (Array.isArray(stored)) return stored.map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  return stored.split(',').map(s => s.trim()).filter(Boolean);
};

const EditPositionModal = ({ position, onClose, onSuccess }) => {
  const [submit, setSubmit] = useState(false);
  // Selected client's tier-based commission config (from Company_Overview)
  const [companyCommission, setCompanyCommission] = useState({ type: '', tiers: [] });
  // Client-requirement questions set on the company profile (read-only here)
  const [companyQuestions, setCompanyQuestions] = useState([]);
  useEffect(() => {
    const client = position?.client;
    if (!client) return;
    let live = true;
    axios.get(`/addit/overview/${encodeURIComponent(client)}`)
      .then(res => {
        if (!live || !res.data?.found) return;
        const c = res.data.data;
        setCompanyCommission({
          type: c.commissionType || '',
          tiers: Array.isArray(c.commissionTiers) ? c.commissionTiers : [],
        });
        setCompanyQuestions(Array.isArray(c.questions) ? c.questions : []);
      })
      .catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.client]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Coach / Expert list state
  const [coaches, setCoaches] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);

  // Skill categories
  const [skillCategoryHierarchy, setSkillCategoryHierarchy] = useState([]);
  const [skillCatsLoading, setSkillCatsLoading] = useState(false);

  const [form, setForm] = useState({
    hr_name: position.hr_name || '',
    ripplehire_job_id: position.ripplehire_job_id || '',
    ctcStart: position.ctcStart || '',
    ctcEnd: position.ctcEnd || '',
    location: Array.isArray(position.location)
      ? position.location
      : (position.location ? position.location.split(',').map(s => s.trim()).filter(Boolean) : []),
    job_desc: position.job_desc || '',
    commison: position.commison || '',
    position_tier: position.position_tier || '',
    commission_type: position.commission_type || '',
    experience: position.experience || '',
    pos_cat: position.pos_cat || '',
    skill_category: position.skill_category || '',
    skill_sub_category: toArr(position.skill_sub_category),
    specialization: toArr(position.specialization),
    comp_view: position.comp_view || '',
    m_have: position.m_have || '',
    g_have: position.g_have || '',
    compet: position.compet || '',
    key_res: position.key_res || '',
    // Start as empty arrays; populated after coaches/experts load
    coach_ids: [],
    expert_ids: [],
    // ── New structured fields (mirror Add Position) ──
    employment_type: position.employment_type || 'Full Time',
    no_of_positions: position.no_of_positions || 1,
    work_mode: position.work_mode || 'On-site',
    min_exp: position.min_exp || '',
    max_exp: position.max_exp || '',
    min_rel_exp: position.min_rel_exp || '',
    team_handling: position.team_handling || 'No',
    req_education: position.req_education || '',
    pref_education: position.pref_education || '',
    certifications: toArr(position.certifications),
    budget_type: position.budget_type || 'Fixed',
    variable_pay_pct: position.variable_pay_pct || '',
    variable_criteria: position.variable_criteria || '',
    variable_freq: position.variable_freq || 'Annual',
    joining_bonus: position.joining_bonus || 'No',
    interview_mode: position.interview_mode || 'Mixed',
    interview_rounds: Array.isArray(position.interview_rounds) ? position.interview_rounds : [],
    client_questions: Array.isArray(position.client_questions) ? position.client_questions : [],
  });
  const [certInput, setCertInput] = useState('');

  // Fetch coaches + stats, then pre-select from stored names
  useEffect(() => {
    const storedCoachNames = parseNames(position.coach_ids);

    const fetchCoaches = async () => {
      setLoadingCoaches(true);
      try {
        const [res, statsRes] = await Promise.all([
          axios.get('/api/coach-expert/coach/all'),
          axios.get('/api/coach-expert/stats/all', { params: { type: 'coach' } })
        ]);
        if (res.data.success && Array.isArray(res.data.data)) {
          let base = res.data.data;
          if (statsRes.data?.success) {
            const statsById = {};
            (statsRes.data.coaches || []).forEach(s => {
              statsById[s.id] = { positionCount: s.positionCount || 0, acceptedCount: s.statusCounts?.accepted || 0 };
            });
            base = base.map(c => ({
              ...c,
              positionCount: statsById[c.id]?.positionCount || 0,
              acceptedCount: statsById[c.id]?.acceptedCount || 0,
            }));
          }
          setCoaches(base);
          // Pre-select coaches whose names match stored names
          if (storedCoachNames.length > 0) {
            const preSelected = base.filter(c =>
              storedCoachNames.some(n => n.toLowerCase() === (c.name || '').toLowerCase())
            );
            setForm(prev => ({ ...prev, coach_ids: preSelected }));
          }
        }
      } catch (err) {
        console.error('Error fetching coaches:', err);
      } finally {
        setLoadingCoaches(false);
      }
    };

    fetchCoaches();
  }, []);

  // Fetch experts + stats, then pre-select from stored names
  useEffect(() => {
    const storedExpertNames = parseNames(position.expert_ids);

    const fetchExperts = async () => {
      setLoadingExperts(true);
      try {
        const [res, statsRes] = await Promise.all([
          axios.get('/api/coach-expert/expert/all'),
          axios.get('/api/coach-expert/stats/all', { params: { type: 'expert' } })
        ]);
        if (res.data.success && Array.isArray(res.data.data)) {
          let base = res.data.data;
          if (statsRes.data?.success) {
            const statsById = {};
            (statsRes.data.experts || []).forEach(s => {
              statsById[s.id] = { positionCount: s.positionCount || 0, acceptedCount: s.statusCounts?.accepted || 0 };
            });
            base = base.map(e => ({
              ...e,
              positionCount: statsById[e.id]?.positionCount || 0,
              acceptedCount: statsById[e.id]?.acceptedCount || 0,
            }));
          }
          setExperts(base);
          if (storedExpertNames.length > 0) {
            const preSelected = base.filter(e =>
              storedExpertNames.some(n => n.toLowerCase() === (e.name || '').toLowerCase())
            );
            setForm(prev => ({ ...prev, expert_ids: preSelected }));
          }
        }
      } catch (err) {
        console.error('Error fetching experts:', err);
      } finally {
        setLoadingExperts(false);
      }
    };

    fetchExperts();
  }, []);

  // Fetch skill categories (hierarchical)
  useEffect(() => {
    setSkillCatsLoading(true);
    axios.get('/candidate/skill-categories-hierarchical')
      .then(res => { if (res.data.success) setSkillCategoryHierarchy(res.data.categories); })
      .catch(err => console.error('Failed to fetch skill categories:', err))
      .finally(() => setSkillCatsLoading(false));
  }, []);

  // The list view passes a trimmed position object (missing the newer fields).
  // Fetch the full document so every field pre-fills correctly on edit.
  useEffect(() => {
    if (!position?.pos_id) return;
    axios.get(`/candidate/position/${position.pos_id}`)
      .then(res => {
        const p = res.data || {};
        setForm(prev => ({
          ...prev,
          hr_name: p.hr_name ?? prev.hr_name,
          ctcStart: p.ctcStart ?? prev.ctcStart,
          ctcEnd: p.ctcEnd ?? prev.ctcEnd,
          location: Array.isArray(p.location) ? p.location : (p.location ? String(p.location).split(',').map(s => s.trim()).filter(Boolean) : prev.location),
          job_desc: p.job_desc ?? prev.job_desc,
          commison: p.commison ?? prev.commison,
          experience: p.experience ?? prev.experience,
          pos_cat: p.pos_cat ?? prev.pos_cat,
          skill_category: p.skill_category ?? prev.skill_category,
          skill_sub_category: toArr(p.skill_sub_category),
          specialization: toArr(p.specialization),
          comp_view: p.comp_view ?? prev.comp_view,
          m_have: p.m_have ?? prev.m_have,
          g_have: p.g_have ?? prev.g_have,
          compet: p.compet ?? prev.compet,
          key_res: p.key_res ?? prev.key_res,
          employment_type: p.employment_type || prev.employment_type,
          no_of_positions: p.no_of_positions ?? prev.no_of_positions,
          work_mode: p.work_mode || prev.work_mode,
          min_exp: p.min_exp ?? prev.min_exp,
          max_exp: p.max_exp ?? prev.max_exp,
          min_rel_exp: p.min_rel_exp ?? prev.min_rel_exp,
          team_handling: p.team_handling || prev.team_handling,
          req_education: p.req_education ?? prev.req_education,
          pref_education: p.pref_education ?? prev.pref_education,
          certifications: toArr(p.certifications),
          budget_type: p.budget_type || prev.budget_type,
          variable_pay_pct: p.variable_pay_pct ?? prev.variable_pay_pct,
          variable_criteria: p.variable_criteria ?? prev.variable_criteria,
          variable_freq: p.variable_freq || prev.variable_freq,
          joining_bonus: p.joining_bonus || prev.joining_bonus,
          interview_mode: p.interview_mode || prev.interview_mode,
          interview_rounds: Array.isArray(p.interview_rounds) ? p.interview_rounds : prev.interview_rounds,
        }));
      })
      .catch(err => console.error('Failed to fetch full position for edit:', err));
  }, [position?.pos_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'skill_category') {
      setForm(prev => ({ ...prev, skill_category: value, skill_sub_category: [], specialization: [] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Segmented single-select control
  const Seg = ({ name, options }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button type="button" key={o} onClick={() => setForm(p => ({ ...p, [name]: o }))}
          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${form[name] === o ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
          {o}
        </button>
      ))}
    </div>
  );
  const toggleSubCat = (catName) => {
    setForm(prev => {
      const has = prev.skill_sub_category.includes(catName);
      if (!has && prev.skill_sub_category.length >= MAX_SUB_CATS) return prev;
      const nextSubs = has ? prev.skill_sub_category.filter(s => s !== catName) : [...prev.skill_sub_category, catName];
      const catObj = skillCategoryHierarchy.find(c => c.parent === prev.skill_category);
      const validSpecs = new Set((catObj?.children || []).filter(ch => nextSubs.includes(ch.name)).flatMap(ch => ch.subChildren || []));
      return { ...prev, skill_sub_category: nextSubs, specialization: prev.specialization.filter(s => validSpecs.has(s)) };
    });
  };
  const toggleSpec = (specName) => {
    setForm(prev => ({ ...prev, specialization: prev.specialization.includes(specName) ? prev.specialization.filter(s => s !== specName) : [...prev.specialization, specName] }));
  };
  const addCert = () => { const v = certInput.trim(); if (v && !form.certifications.includes(v)) setForm(p => ({ ...p, certifications: [...p.certifications, v] })); setCertInput(''); };
  const removeCert = (i) => setForm(p => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }));
  const addRound = () => setForm(p => ({ ...p, interview_rounds: [...p.interview_rounds, { name: '', duration: '', mode: 'Virtual' }] }));
  const removeRound = (i) => setForm(p => ({ ...p, interview_rounds: p.interview_rounds.filter((_, idx) => idx !== i) }));
  const updateRound = (i, key, val) => setForm(p => ({ ...p, interview_rounds: p.interview_rounds.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  const handleCoachChange = (_, newValue) => {
    setForm(prev => ({ ...prev, coach_ids: newValue }));
  };

  const handleExpertChange = (_, newValue) => {
    setForm(prev => ({ ...prev, expert_ids: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submit) return;

    if (form.location.length === 0) {
      setError('Please select at least one job location');
      return;
    }
    if (form.skill_sub_category.length === 0) {
      setError('Please select a Sub Skill Category');
      return;
    }
    const selCatObj = skillCategoryHierarchy.find(c => c.parent === form.skill_category);
    const availableSpecs = (selCatObj?.children || []).filter(ch => form.skill_sub_category.includes(ch.name)).flatMap(ch => ch.subChildren || []);
    if (availableSpecs.length > 0 && form.specialization.length === 0) {
      setError('Please select a Specialization');
      return;
    }
    const qErr = validateQuestions(form.client_questions);
    if (qErr) {
      setError(`Client requirements — ${qErr}`);
      return;
    }

    try {
      setSubmit(true);
      setError(null);

      const payload = {
        ...form,
        // Convert object arrays back to comma-separated names (same format as Ad_Pos)
        coach_ids: form.coach_ids.map(c => c.name).join(', '),
        expert_ids: form.expert_ids.map(e => e.name).join(', '),
        // Multi-select + certifications → comma-separated strings; keep round count
        skill_sub_category: form.skill_sub_category.join(', '),
        specialization: form.specialization.join(', '),
        certifications: form.certifications.join(', '),
        num_interview_rounds: form.interview_rounds.length,
      };

      const res = await axios.put(`/candidate/pos/modify/${position.id}`, payload, {
        withCredentials: true
      });

      if (res.data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(res.data.message || 'Failed to update position');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update position');
    } finally {
      setSubmit(false);
    }
  };

  const getOptionLabel = (option) => {
    if (!option?.name) return '';
    const plan = (option.userType || 'free').toLowerCase() === 'paid' ? 'P' : 'F';
    const assigned = option.positionCount || 0;
    const accepted = option.acceptedCount || 0;
    return `${option.name}${option.specialization ? ` (${option.specialization})` : ''}  • ${plan} - ${assigned}/${accepted}`;
  };

  const filterOptions = (options, params) =>
    options.filter(o =>
      o.name?.toLowerCase().includes(params.inputValue.toLowerCase()) ||
      o.specialization?.toLowerCase().includes(params.inputValue.toLowerCase())
    );


  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex items-start justify-center p-4">
      <div className="w-full max-w-4xl my-4">
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-4 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Edit2 size={20} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Edit Position</h3>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    {position.position} — ID: {position.pos_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Brief the people working this position — same items as the
                    coach/vendor briefing, but a SPOC's is open to everyone. */}
                <button type="button"
                  onClick={() => window.open(`/briefing/${position.pos_id}`, '_blank', 'noopener')}
                  title="Add or edit the briefing for this position"
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold transition-all whitespace-nowrap">
                  🎙️ Position Briefing
                </button>
                <button type="button" onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Success */}
          {showSuccess && (
            <div className="mx-4 lg:mx-6 mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Position Updated Successfully!</p>
                <p className="text-sm text-green-700">Changes have been saved.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-4 lg:mx-6 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 lg:p-6">

            {/* Basic Information */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Position ID</label>
                  <input type="text" value={position.pos_id} disabled
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-gray-100 text-gray-500 font-mono text-sm" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Position Title</label>
                  <input type="text" value={position.position} disabled
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-gray-100 text-gray-500 text-sm" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Position Category <span className="text-red-500">*</span>
                  </label>
                  <select name="pos_cat" value={form.pos_cat} onChange={handleChange} required
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm">
                    <option value="">Select Category</option>
                    {positionCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Skill Category <span className="text-red-500">*</span>
                  </label>
                  <select name="skill_category" value={form.skill_category} onChange={handleChange} required
                    disabled={skillCatsLoading}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm">
                    <option value="">{skillCatsLoading ? 'Loading…' : 'Select Skill Category'}</option>
                    {/* Always include current saved value so it shows even before list loads */}
                    {form.skill_category && !skillCategoryHierarchy.find(c => c.parent === form.skill_category) && (
                      <option key={form.skill_category} value={form.skill_category}>{form.skill_category}</option>
                    )}
                    {skillCategoryHierarchy.map(cat => <option key={cat.parent} value={cat.parent}>{cat.parent}</option>)}
                  </select>
                </div>

                {/* Sub Skill Category — multi-select (max 2) */}
                {form.skill_category && (() => {
                  const selCatObj = skillCategoryHierarchy.find(c => c.parent === form.skill_category);
                  const subCats = selCatObj ? (selCatObj.children || []) : [];
                  const atMax = form.skill_sub_category.length >= MAX_SUB_CATS;
                  return (
                    <div className="flex flex-col sm:col-span-2 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Sub Skill Category <span className="text-red-500">*</span>
                        <span className="ml-2 font-normal text-gray-400">select up to 2 ({form.skill_sub_category.length}/2)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {subCats.map(ch => {
                          const on = form.skill_sub_category.includes(ch.name);
                          const disabled = !on && atMax;
                          return (
                            <button type="button" key={ch.name} onClick={() => toggleSubCat(ch.name)} disabled={disabled}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${on ? 'bg-blue-50 border-blue-500 text-blue-700' : disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {ch.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Specialization — multi-select (unlimited) */}
                {form.skill_sub_category.length > 0 && (() => {
                  const selCatObj = skillCategoryHierarchy.find(c => c.parent === form.skill_category);
                  const specs = [...new Set((selCatObj?.children || []).filter(ch => form.skill_sub_category.includes(ch.name)).flatMap(ch => ch.subChildren || []))];
                  if (specs.length === 0) return null;
                  return (
                    <div className="flex flex-col sm:col-span-2 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Specialization <span className="text-red-500">*</span>
                        <span className="ml-2 font-normal text-gray-400">select any ({form.specialization.length} selected)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {specs.map(sc => {
                          const on = form.specialization.includes(sc);
                          return (
                            <button type="button" key={sc} onClick={() => toggleSpec(sc)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${on ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {sc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Client & HR Information */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Building size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Client & HR Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Client Name</label>
                  <input type="text" value={position.client || ''} disabled
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-gray-100 text-gray-500 text-sm" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    HR Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="hr_name" value={form.hr_name} onChange={handleChange}
                    placeholder="HR Contact Person" required
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>

                {/* RippleHire JR / Job ID — drives the duplicacy-check deep link */}
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    JR / RippleHire Job ID <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input type="text" name="ripplehire_job_id" value={form.ripplehire_job_id} onChange={handleChange}
                    placeholder="e.g. 886183"
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                  <span className="text-[11px] text-gray-400 mt-1">Used to open this job directly in RippleHire for the duplicacy check.</span>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Client SPOC</label>
                  <input type="text" value={position.clientspoc || ''} disabled
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-gray-100 text-gray-500 text-sm" />
                </div>

                {/* Add Coach — MUI Autocomplete */}
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Add Coach <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Autocomplete
                    multiple
                    options={coaches}
                    value={form.coach_ids}
                    onChange={handleCoachChange}
                    getOptionLabel={getOptionLabel}
                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                    loading={loadingCoaches}
                    filterOptions={filterOptions}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option.id}
                          variant="outlined"
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          sx={{
                            borderColor: '#3b82f6', color: '#1d4ed8',
                            '& .MuiChip-label': { color: '#1d4ed8' },
                            '& .MuiChip-deleteIcon': { color: '#3b82f6', '&:hover': { color: '#1d4ed8' } }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={loadingCoaches ? 'Loading...' : 'Search coaches'}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingCoaches && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#e5e7eb' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          }
                        }}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Search by name or specialization.</p>
                </div>

              </div>
            </div>

            {/* Compensation Details */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Compensation Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    CTC Start <span className="text-red-500">*</span>
                  </label>
                  <SearchSelect
                    value={form.ctcStart}
                    onChange={(v) => setForm(prev => ({ ...prev, ctcStart: v }))}
                    options={CTC_OPTIONS}
                    placeholder="Starting From"
                    searchPlaceholder="Type an amount — e.g. 12"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    CTC End <span className="text-red-500">*</span>
                  </label>
                  <SearchSelect
                    value={form.ctcEnd}
                    onChange={(v) => setForm(prev => ({ ...prev, ctcEnd: v }))}
                    options={CTC_OPTIONS}
                    placeholder="Ending At"
                    searchPlaceholder="Type an amount — e.g. 12"
                  />
                </div>

                {/* Position Tier — from the client's tier-based commission config */}
                {companyCommission.tiers.length > 0 && (
                  <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Position Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="position_tier"
                      value={form.position_tier}
                      onChange={(e) => {
                        const t = companyCommission.tiers.find(x => x.tier === e.target.value);
                        setForm(prev => ({
                          ...prev,
                          position_tier: e.target.value,
                          commison: t ? t.value : prev.commison,
                          commission_type: (t && t.type) || companyCommission.type || 'percentage',
                        }));
                      }}
                      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white"
                    >
                      <option value="">Select tier</option>
                      {companyCommission.tiers.map(t => (
                        <option key={t.tier} value={t.tier}>
                          {t.tier} — {(t.type || companyCommission.type) === 'fixed' ? `Rs. ${Number(t.value).toLocaleString('en-IN')}` : `${t.value}%`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    Commission {form.commission_type === 'fixed' ? '(Rs.)' : '(%)'} <span className="text-red-500">*</span>
                    {form.position_tier && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">From tier: {form.position_tier}</span>}
                  </label>
                  <div className="relative">
                    {form.commission_type === 'fixed' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rs.</span>
                    )}
                    <input type="number" name="commison" value={form.commison} onChange={handleChange}
                      placeholder={form.commission_type === 'fixed' ? 'e.g., 50000' : 'e.g., 10'} step="0.01" required
                      className={`w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl ${form.commission_type === 'fixed' ? 'pl-10 sm:pl-11' : 'px-3 sm:px-4'} pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm`} />
                    {form.commission_type !== 'fixed' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                    )}
                  </div>
                </div>

              </div>

              {form.ctcStart && form.ctcEnd && (
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-semibold">CTC Range Preview:</span>
                    <span className="ml-2 text-blue-700 font-bold">
                      ₹{Number(form.ctcStart).toLocaleString('en-IN')} – ₹{Number(form.ctcEnd).toLocaleString('en-IN')}
                    </span>
                  </p>
                  {form.commison && (
                    <p className="text-xs sm:text-sm text-gray-700 mt-2">
                      <span className="font-semibold">Commission Amount:</span>
                      <span className="ml-2 text-green-700 font-bold">
                        {form.commission_type === 'fixed'
                          ? `Rs. ${Number(form.commison).toLocaleString('en-IN')} (Fixed)`
                          : `₹${((parseFloat(form.ctcStart) * parseFloat(form.commison)) / 100).toLocaleString('en-IN')} (${form.commison}%)`}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Experience Required */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Experience Required</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Experience <span className="text-red-500">*</span>
                  </label>
                  <select name="experience" value={form.experience} onChange={handleChange} required
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white">
                    <option value="">Select experience range</option>
                    {EXPERIENCE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                    {form.experience && !EXPERIENCE_RANGES.includes(form.experience) && (
                      <option value={form.experience}>{form.experience}</option>
                    )}
                  </select>
                </div>

                {/* Add Expert — MUI Autocomplete */}
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Add Expert <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Autocomplete
                    multiple
                    options={experts}
                    value={form.expert_ids}
                    onChange={handleExpertChange}
                    getOptionLabel={getOptionLabel}
                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                    loading={loadingExperts}
                    filterOptions={filterOptions}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option.id}
                          variant="outlined"
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          sx={{
                            borderColor: '#9333ea', color: '#7c3aed',
                            '& .MuiChip-label': { color: '#7c3aed' },
                            '& .MuiChip-deleteIcon': { color: '#9333ea', '&:hover': { color: '#7c3aed' } }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={loadingExperts ? 'Loading...' : 'Search experts'}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingExperts && <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#e5e7eb' },
                            '&:hover fieldset': { borderColor: '#9333ea' },
                            '&.Mui-focused fieldset': { borderColor: '#9333ea' }
                          }
                        }}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Search by name or specialization.</p>
                </div>

              </div>
            </div>

            {/* Job Location */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Location <span className="text-red-500">*</span></h4>
              </div>

              <CityMultiSelect
                value={form.location}
                onChange={(cities) => setForm(prev => ({ ...prev, location: cities }))}
              />
            </div>

            {/* Role classification */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Role classification</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Employment type</label>
                  <Seg name="employment_type" options={["Full Time", "Part Time", "Contractual", "Internship"]} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">No. of positions</label>
                  <input type="number" min="1" name="no_of_positions" value={form.no_of_positions} onChange={handleChange}
                    className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Work mode</label>
                  <Seg name="work_mode" options={["On-site", "Work from home", "Hybrid"]} />
                </div>
              </div>
            </div>

            {/* Experience & education detail */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Experience &amp; education detail</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Minimum experience (yrs)</label>
                  <select name="min_exp" value={form.min_exp} onChange={handleChange} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white">
                    <option value="">Select years</option>
                    {EXPERIENCE_YEARS.map(y => <option key={y} value={y}>{y === 0 ? 'Fresher (0)' : y}</option>)}
                    {form.min_exp !== "" && form.min_exp != null && !EXPERIENCE_YEARS.includes(Number(form.min_exp)) && (
                      <option value={form.min_exp}>{form.min_exp}</option>
                    )}
                  </select></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Maximum experience (yrs)</label>
                  <select name="max_exp" value={form.max_exp} onChange={handleChange} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white">
                    <option value="">Select years</option>
                    {EXPERIENCE_YEARS.map(y => <option key={y} value={y}>{y === 0 ? 'Fresher (0)' : y}</option>)}
                    {form.max_exp !== "" && form.max_exp != null && !EXPERIENCE_YEARS.includes(Number(form.max_exp)) && (
                      <option value={form.max_exp}>{form.max_exp}</option>
                    )}
                  </select></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Min relevant experience (yrs)</label>
                  <select name="min_rel_exp" value={form.min_rel_exp} onChange={handleChange} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm bg-white">
                    <option value="">Select years</option>
                    {EXPERIENCE_YEARS.map(y => <option key={y} value={y}>{y === 0 ? 'Fresher (0)' : y}</option>)}
                    {form.min_rel_exp !== "" && form.min_rel_exp != null && !EXPERIENCE_YEARS.includes(Number(form.min_rel_exp)) && (
                      <option value={form.min_rel_exp}>{form.min_rel_exp}</option>
                    )}
                  </select></div>
                <div className="flex flex-col sm:col-span-3"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Team handling experience required?</label>
                  <Seg name="team_handling" options={["Yes", "No"]} /></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Required education</label>
                  <EducationSelect value={form.req_education}
                    onChange={(v) => setForm(p => ({ ...p, req_education: v }))}
                    placeholder="Select or add required education" /></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Preferred education</label>
                  <EducationSelect value={form.pref_education} exclude={[form.req_education]}
                    onChange={(v) => setForm(p => ({ ...p, pref_education: v }))}
                    placeholder="Select or add preferred education" /></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Mandatory certifications</label>
                  <input type="text" value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }} placeholder="Type & press Enter" className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" /></div>
              </div>
              {form.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.certifications.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{c}
                      <button type="button" onClick={() => removeCert(i)} className="text-blue-400 hover:text-blue-700"><X size={12} /></button></span>
                  ))}
                </div>
              )}
            </div>

            {/* Budget & variable pay */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Budget &amp; variable pay</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex flex-col sm:col-span-2"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Budget type</label>
                  <Seg name="budget_type" options={["Fixed", "Negotiable", "Open"]} /></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Variable pay (%)</label>
                  <input type="number" min="0" name="variable_pay_pct" value={form.variable_pay_pct} onChange={handleChange} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" /></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Variable payout frequency</label>
                  <select name="variable_freq" value={form.variable_freq} onChange={handleChange} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm">
                    {["Monthly", "Quarterly", "Half-yearly", "Annual", "Partially monthly", "Partially half-yearly"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></div>
                <div className="flex flex-col sm:col-span-2"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Variable payout criteria</label>
                  <input type="text" name="variable_criteria" value={form.variable_criteria} onChange={handleChange} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" /></div>
                <div className="flex flex-col"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Joining bonus?</label>
                  <Seg name="joining_bonus" options={["Yes", "No"]} /></div>
              </div>
            </div>

            {/* Recruitment process */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Users size={18} className="text-blue-600" /><h4 className="text-base sm:text-lg font-bold text-gray-900">Recruitment process</h4></div>
                <span className="text-xs text-gray-500">Rounds: <b className="text-gray-800">{form.interview_rounds.length}</b></span>
              </div>
              <div className="flex flex-col mb-4"><label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Overall interview mode</label>
                <Seg name="interview_mode" options={["Virtual", "Face-to-face", "Mixed"]} /></div>
              {form.interview_rounds.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-semibold">Round {i + 1}</span>
                    <button type="button" onClick={() => removeRound(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={r.name} onChange={(e) => updateRound(i, 'name', e.target.value)} placeholder="Round name" className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                    <input type="text" value={r.duration} onChange={(e) => updateRound(i, 'duration', e.target.value)} placeholder="Duration" className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                    <select value={r.mode} onChange={(e) => updateRound(i, 'mode', e.target.value)} className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm">
                      {["AI based", "Virtual", "Face-to-face"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRound} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all text-sm font-semibold">
                <Edit2 size={16} /> Add round
              </button>
            </div>

            {/* Job Requirements */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Requirements</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Key Responsibilities <span className="text-red-500">*</span></label>
                  <LimitedTextarea value={form.key_res} onChange={(v) => setForm(p => ({ ...p, key_res: v }))} maxLen={500} rows={5} placeholder="List key responsibilities (max 500 characters)…" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Must Have Skills <span className="text-red-500">*</span></label>
                  <TagInput value={form.m_have} onChange={(v) => setForm(p => ({ ...p, m_have: v }))} maxTags={5} maxLen={25} placeholder="Add a must-have skill…" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Good to Have Skills <span className="text-red-500">*</span></label>
                  <TagInput value={form.g_have} onChange={(v) => setForm(p => ({ ...p, g_have: v }))} maxTags={5} maxLen={25} placeholder="Add a good-to-have skill…" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Competencies <span className="text-red-500">*</span></label>
                  <ListInput value={form.compet} onChange={(v) => setForm(p => ({ ...p, compet: v }))} maxItems={5} placeholder="Add a competency…" />
                </div>

              </div>
            </div>

            {/* Job Description */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Job Description</h4>
              </div>
              <div className="space-y-4 sm:space-y-6">

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Company Overview <span className="text-red-500">*</span>
                  </label>
                  <textarea name="comp_view" value={form.comp_view} onChange={handleChange} rows={4}
                    placeholder="Company overview and culture..." required
                    className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Job Summary <span className="text-red-500">*</span></label>
                  <LimitedTextarea value={form.job_desc} onChange={(v) => setForm(p => ({ ...p, job_desc: v }))} maxLen={500} rows={6} placeholder="Job summary (max 500 characters)…" />
                </div>

              </div>
            </div>

            {/* Client requirements — company questions (read-only) + position-specific ones */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-600" />
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Client Requirements</h4>
              </div>

              <div className="bg-blue-50/60 border-2 border-blue-100 rounded-xl p-4 mb-5">
                <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">
                  From company profile{position.client ? ` — ${position.client}` : ''}
                </p>
                <p className="text-xs text-gray-500 mb-3">These were added when the company was created and apply to all its positions. Edit them from SuperAdmin → All Companies.</p>
                <QuestionsList questions={companyQuestions} emptyText="No questions set on this company yet." />
              </div>

              <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">Additional questions for this position</p>
              <p className="text-xs text-gray-500 mb-3">Add position-specific requirements — subjective, yes/no, or multiple select (with options).</p>
              <QuestionsEditor
                questions={form.client_questions}
                onChange={(qs) => setForm(prev => ({ ...prev, client_questions: qs }))}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
              <button type="button" onClick={onClose}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base">
                Cancel
              </button>
              <button type="submit" disabled={submit}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base">
                {submit ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPositionModal;
