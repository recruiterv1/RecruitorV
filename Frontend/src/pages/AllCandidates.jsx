import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { Users, TrendingUp, Eye, Phone, MapPin, Calendar, Filter, X, RotateCcw, Search, Mail, FileText, ChevronLeft, ChevronRight, Loader2, Briefcase, CheckCircle, Bookmark } from 'lucide-react';
import SubmitCandidateTabs from '../components/SubmitCandidateTabs';

const AllCandidates = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [poolSize, setPoolSize] = useState(0);
  const [options, setOptions] = useState({ locations: [], categories: [], skillTypes: [] });
  const [facets, setFacets] = useState(null);
  const [understood, setUnderstood] = useState(null);
  const [narrow, setNarrow] = useState({ expBand: '', noticeBand: '' });
  const [reloadKey, setReloadKey] = useState(0);
  // Which candidates this recruiter has already kept, so the button reads right
  // the moment the list renders rather than after a second round trip.
  const [shortlisted, setShortlisted] = useState(new Set());

  useEffect(() => {
    axios.get('/api/resume-bank/shortlist/ids', { withCredentials: true })
      .then(r => { if (r.data?.success) setShortlisted(new Set(r.data.ids || [])); })
      .catch(() => {});
  }, []);

  const toggleShortlist = async (c) => {
    const on = shortlisted.has(c.id);
    // Moved straight away; put back if the write fails, so the button never
    // shows a state the server does not hold.
    setShortlisted(prev => {
      const next = new Set(prev);
      if (on) next.delete(c.id); else next.add(c.id);
      return next;
    });
    try {
      if (on) await axios.delete(`/api/resume-bank/shortlist/${c.id}`, { withCredentials: true });
      else await axios.post(`/api/resume-bank/shortlist/${c.id}`, {}, { withCredentials: true });
    } catch {
      setShortlisted(prev => {
        const next = new Set(prev);
        if (on) next.add(c.id); else next.delete(c.id);
        return next;
      });
    }
  };

  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    date: null,
    location: '',
    tech_category: '',
    skill_type: '',
  });

  // Free-text search across name, skills, location and employer
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);

  const PER_PAGE = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, filters, availableOnly, narrow]);

  // The dropdowns offer what the pool actually contains, so a filter can never
  // be set to something that returns nothing.
  useEffect(() => {
    axios.get('/api/resume-bank/filters', { withCredentials: true })
      .then(r => {
        if (!r.data?.success) return;
        setOptions({
          locations: r.data.locations || [],
          categories: r.data.categories || [],
          skillTypes: r.data.skillTypes || [],
        });
        setPoolSize(r.data.poolSize || 0);
      })
      .catch(() => {});
  }, []);

  // Searching happens on the server now. Thirty thousand candidates were never
  // going to arrive in the browser — the request that tried timed out and the
  // page showed nothing at all.
  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (search.trim()) params.set('q', search.trim());
    if (filters.location) params.set('location', filters.location);
    if (filters.tech_category) params.set('category', filters.tech_category);
    if (filters.skill_type) params.set('skillType', filters.skill_type);
    if (availableOnly) params.set('availableOnly', 'true');
    if (narrow.expBand) params.set('expBand', narrow.expBand);
    if (narrow.noticeBand) params.set('noticeBand', narrow.noticeBand);

    // Waiting out the typing keeps one request per phrase instead of one per key.
    const timer = setTimeout(() => {
      setLoading(true);
      axios.get(`/api/resume-bank/search?${params.toString()}`, { withCredentials: true })
        .then(r => {
          if (!r.data?.success) return;
          setRows(r.data.rows || []);
          setTotal(r.data.total || 0);
          setPages(r.data.pages || 1);
          setFacets(r.data.facets || null);
          setUnderstood(r.data.understood || null);
          if (r.data.poolSize) setPoolSize(r.data.poolSize);
        })
        .catch(err => { console.error('Resume Bank search failed:', err); setRows([]); setTotal(0); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters, availableOnly, narrow, page, reloadKey]);


  // Re-runs the current search. Used after a candidate is submitted from here,
  // so the row leaves the bank list without a manual reload.
  const refresh = () => setReloadKey(k => k + 1);

  const fmtDate = (ts) => {
    if (!ts) return '';
    const sec = ts._seconds ?? ts.seconds ?? null;
    if (!sec) return '';
    return new Date(sec * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const resetFilters = () => {
    setFilters({ date: null, location: '', tech_category: '', skill_type: '' });
    setSearch('');
    setAvailableOnly(true);
    setNarrow({ expBand: '', noticeBand: '' });
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // ── Cards / modals ────────────────────────────────────────────────────────
  const [detail, setDetail] = useState(null);            // candidate for the details modal
  const [resumeFor, setResumeFor] = useState(null);      // candidate for the "Use Resume" modal
  const [assignments, setAssignments] = useState(null);  // recruiter's assigned positions
  const [selectedPos, setSelectedPos] = useState('');    // radio selection (positionId)
  const [submitCtx, setSubmitCtx] = useState(null);      // opens SubmitCandidateTabs

  const openResume = async (candidate) => {
    setResumeFor(candidate); setSelectedPos(''); setAssignments(null);
    try {
      const r = await axios.get('/api/position-access/my-positions', { withCredentials: true });
      setAssignments(r.data?.data?.assignments || []);
    } catch (_) { setAssignments([]); }
  };
  const proceedResume = () => {
    const a = (assignments || []).find(x => String(x.positionId) === String(selectedPos));
    if (!a) return;
    setSubmitCtx({
      pos_id: a.positionId, pos_name: a.positionTitle || '', client: a.client || '',
      clientspoc: a.clientspoc || '', hr_name: a.hr_name || '', prefill: resumeFor,
    });
    setResumeFor(null);
  };


  const activeFilterCount = [filters.date, filters.location, filters.tech_category, filters.skill_type, search].filter(Boolean).length;

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">All Candidates</h3>
              <p className="text-blue-100 text-sm">{loading ? 'Searching…' : `${total.toLocaleString('en-IN')} of ${poolSize.toLocaleString('en-IN')} candidates`}</p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-800">Search & Filters</h4>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-medium text-sm"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>

          {/* Free-text search bar */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Describe who you need — e.g. Java, Mumbai, 5-10 year, 1month notice"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>

          {/* What the phrase was taken to mean. Shown back so nobody has to guess
              why they got these people — and so a misread is obvious. */}
          {understood && (understood.skills?.length || understood.locations?.length
            || understood.expMin != null || understood.maxNotice != null || understood.position) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[12px]">
              <span className="text-gray-500 font-medium">Looking for:</span>
              {understood.position && (
                <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">
                  position · {understood.position.position}
                </span>
              )}
              {understood.skills?.map(k => (
                <span key={k} className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold">{k}</span>
              ))}
              {understood.locations?.map(l => (
                <span key={l} className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold capitalize">{l}</span>
              ))}
              {understood.expMin != null && (
                <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                  {understood.expMax != null ? `${understood.expMin}-${understood.expMax}` : `${understood.expMin}+`} yrs
                </span>
              )}
              {understood.maxNotice != null && (
                <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                  {understood.maxNotice === 0 ? 'immediate' : `notice ≤ ${understood.maxNotice}d`}
                </span>
              )}
            </div>
          )}

          {/* Narrowing filters, counted from the results actually found — so no
              option ever leads to an empty page, and each says how far it goes. */}
          {facets && total > 0 && (
            <div className="mb-4 space-y-2">
              {[['experience', 'expBand', 'Experience'], ['notice', 'noticeBand', 'Notice']]
                .map(([key, param, label]) => {
                  const list = (facets[key] || []).filter(f => f.value !== 'Not stated');
                  if (!list.length) return null;
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 w-20">{label}</span>
                      {list.slice(0, 6).map(f => (
                        <button key={f.value}
                          onClick={() => setNarrow(n => ({ ...n, [param]: n[param] === f.value ? '' : f.value }))}
                          className={`px-2.5 py-1 rounded-full text-[12px] font-medium border ${
                            narrow[param] === f.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                          {f.value} <span className="opacity-60">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              <label className="flex items-center gap-2 text-[12.5px] text-gray-700 pt-1">
                <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} />
                Only candidates not already in a live pipeline
              </label>
            </div>
          )}

          {/* Dropdown filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Date</label>
              <input
                type="date"
                value={filters.date ? new Date(filters.date).toISOString().split('T')[0] : ''}
                onChange={e => handleFilterChange('date', e.target.value ? new Date(e.target.value) : null)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Skill Type</label>
              <select value={filters.skill_type} onChange={e => handleFilterChange('skill_type', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">All Skill Types</option>
                {options.skillTypes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Tech Category</label>
              <select value={filters.tech_category} onChange={e => handleFilterChange('tech_category', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">All Categories</option>
                {options.categories.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Location</label>
              <select value={filters.location} onChange={e => handleFilterChange('location', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">All Locations</option>
                {options.locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  Search: "{search}"
                  <button onClick={() => setSearch('')}><X size={14} /></button>
                </span>
              )}
              {filters.date && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Date: {new Date(filters.date).toLocaleDateString()}
                  <button onClick={() => handleFilterChange('date', null)}><X size={14} /></button>
                </span>
              )}
              {filters.skill_type && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                  Skill: {filters.skill_type}
                  <button onClick={() => handleFilterChange('skill_type', '')}><X size={14} /></button>
                </span>
              )}
              {filters.tech_category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Category: {filters.tech_category}
                  <button onClick={() => handleFilterChange('tech_category', '')}><X size={14} /></button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  Location: {filters.location}
                  <button onClick={() => handleFilterChange('location', '')}><X size={14} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="p-4 sm:p-6">
          {!search.trim() ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-semibold text-gray-500">Search to find candidates</p>
              <p className="text-sm mt-1">Use multiple keywords separated by comma or space — e.g. <span className="font-medium text-gray-500">React, 7yr, Mumbai</span></p>
            </div>
          ) : loading ? (
            <div className="py-20 grid place-items-center text-gray-400"><Loader2 size={28} className="animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-gray-400"><p className="text-lg font-semibold text-gray-500">No candidates found</p><p className="text-sm mt-1">Try different keywords.</p></div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rows.map((c) => (
                  <div key={c.id || c.candidate + c.emails} onClick={() => setDetail(c)}
                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-blue-300 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 grid place-items-center text-white font-bold flex-shrink-0">{(c.candidate || 'C').charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-gray-900 truncate">{c.candidate || '—'}</span>
                          {/* The same person uploaded more than once. The newest
                              is shown; the older CVs are still on the record. */}
                          {/* Kept for later, and matched to this recruiter's own
                              positions on the Shortlist page. */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleShortlist(c); }}
                            title={shortlisted.has(c.id) ? 'Remove from shortlist' : 'Shortlist this candidate'}
                            className={`flex-shrink-0 p-1 rounded ${shortlisted.has(c.id)
                              ? 'text-blue-600' : 'text-gray-300 hover:text-blue-500'}`}>
                            <Bookmark size={14} fill={shortlisted.has(c.id) ? 'currentColor' : 'none'} />
                          </button>
                          {c.versions > 1 && (
                            <span title={`${c.versions} CVs on file — showing the most recent`}
                              className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {c.versions} CVs
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{c.total_exp ? `${c.total_exp} yrs exp` : (c.skill_type || '')}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2 truncate"><Phone size={14} className="text-gray-400 flex-shrink-0" /> {c.mob || '—'}</div>
                      <div className="flex items-center gap-2 truncate"><Mail size={14} className="text-gray-400 flex-shrink-0" /> <span className="truncate">{c.emails || '—'}</span></div>
                      <div className="flex items-center gap-2"><Calendar size={14} className="text-orange-400 flex-shrink-0" /> Updated {fmtDate(c.updatedAt || c.datePosted) || '—'}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={(e) => { e.stopPropagation(); c.cv_data ? window.open(c.cv_data, '_blank') : null; }} disabled={!c.cv_data}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        <Eye size={14} /> View CV
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openResume(c); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg py-2">
                        <FileText size={14} /> Use Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"><ChevronLeft size={16} /></button>
                  {Array.from({ length: pages }).map((_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 2).map((n, idx, arr) => (
                    <React.Fragment key={n}>
                      {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-1 text-gray-400">…</span>}
                      <button onClick={() => setPage(n)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page === n ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{n}</button>
                    </React.Fragment>
                  ))}
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
              )}
              <p className="text-center text-xs text-gray-400 mt-3">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total.toLocaleString('en-IN')}</p>
            </>
          )}
        </div>
      </div>

      {/* ── Candidate details modal ── */}
      {detail && <CandidateDetailModal c={detail} onClose={() => setDetail(null)} onUseResume={() => { const c = detail; setDetail(null); openResume(c); }} />}

      {/* ── Use Resume: pick an assigned position ── */}
      {resumeFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setResumeFor(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <div><h3 className="font-bold text-gray-900">Use resume for a position</h3><p className="text-xs text-gray-500">Pick one of your assigned positions to submit <b>{resumeFor.candidate}</b>.</p></div>
              <button onClick={() => setResumeFor(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              {assignments === null ? (
                <div className="py-10 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
              ) : assignments.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">You have no assigned positions yet. Assign a position first, then use the resume.</div>
              ) : (
                <div className="space-y-2">
                  {assignments.map(a => (
                    <label key={a.positionId} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${String(selectedPos) === String(a.positionId) ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="usePos" checked={String(selectedPos) === String(a.positionId)} onChange={() => setSelectedPos(a.positionId)} className="mt-1 accent-blue-600" />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5"><Briefcase size={14} className="text-blue-600" /> {a.positionTitle || `Position #${a.positionId}`}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{a.client || '—'}{a.positionId ? ` · #${a.positionId}` : ''}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setResumeFor(null)} className="text-sm text-gray-500 px-3 py-2">Cancel</button>
              <button onClick={proceedResume} disabled={!selectedPos} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-50"><CheckCircle size={15} /> Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit candidate form (prefilled with the candidate + CV) ── */}
      {submitCtx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSubmitCtx(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0"><h3 className="font-bold text-gray-900 truncate">Submit {submitCtx.prefill?.candidate}</h3><p className="text-xs text-gray-500 truncate">{submitCtx.pos_name} · {submitCtx.client}</p></div>
              <button onClick={() => setSubmitCtx(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={20} /></button>
            </div>
            <SubmitCandidateTabs
              pos_id={submitCtx.pos_id} client={submitCtx.client} clientspoc={submitCtx.clientspoc}
              pos_name={submitCtx.pos_name} hr_name={submitCtx.hr_name} prefill={submitCtx.prefill}
              onClose={() => setSubmitCtx(null)}
              onSubmitted={() => { setSubmitCtx(null); refresh(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Candidate details modal — all fields available in the database ───────────
const DETAIL_FIELDS = [
  ['emails', 'Email'], ['mob', 'Phone'], ['curr_loc', 'Current location'], ['pref_loc', 'Preferred location'],
  ['total_exp', 'Total experience'], ['rel_exp', 'Relevant experience'], ['current_ctc', 'Current CTC'], ['exp_ctc', 'Expected CTC'],
  ['notice_period', 'Notice period'], ['curr_emp', 'Current employer'], ['highest_education', 'Highest education'],
  ['skill_type', 'Skill type'], ['tech_category', 'Tech category'], ['tech_subcategory', 'Sub-category'], ['tech_skill', 'Tech skill'],
  ['tech_exp', 'Tech experience'], ['nontech_category', 'Non-tech category'], ['nontech_skill', 'Non-tech skill'],
  ['skill_category', 'Skill category'], ['statusa', 'Status'], ['pos_name', 'Submitted for'], ['client', 'Client'],
  ['recName', 'Submitted by'], ['source', 'Source'], ['rh_id', 'RH ID'], ['jr_number', 'JR number'],
];
const fmtVal = (v) => {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') { const sec = v._seconds ?? v.seconds; return sec ? new Date(sec * 1000).toLocaleDateString('en-GB') : ''; }
  return String(v);
};
function CandidateDetailModal({ c, onClose, onUseResume }) {
  useEffect(() => { const h = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  const rows = DETAIL_FIELDS.map(([k, label]) => [label, fmtVal(c[k])]).filter(([, v]) => v);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 grid place-items-center text-white font-bold flex-shrink-0">{(c.candidate || 'C').charAt(0).toUpperCase()}</div>
            <div className="min-w-0"><h3 className="font-bold text-gray-900 truncate">{c.candidate || '—'}</h3><div className="text-xs text-gray-500 truncate">{c.emails}</div></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {rows.map(([label, value]) => (
              <div key={label} className="py-2 border-b border-gray-100 text-sm">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-gray-800 break-words">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          {c.cv_data && <button onClick={() => window.open(c.cv_data, '_blank')} className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2"><Eye size={15} /> View CV</button>}
          <button onClick={onUseResume} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-lg px-4 py-2"><FileText size={15} /> Use Resume</button>
        </div>
      </div>
    </div>
  );
}

export default AllCandidates;
