import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Menu, ArrowLeft, UploadCloud, FileText, Trash2, Loader2, CheckCircle2,
  Mail, Phone, User, X, Save, AlertCircle, Sparkles, Search, RefreshCw, Tag, Pencil
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import CvViewButton from '../components/CvViewButton';

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MAX_FILES = 10;
const ACCEPT = '.pdf,.doc,.docx';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ClientSpocBulkResumes = () => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);       // parsed resume rows
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null); // { type, text }
  const [bulkCategory, setBulkCategory] = useState('');

  // Tabs + "My Uploaded Resumes" list
  const [tab, setTab] = useState('upload'); // 'upload' | 'list'
  const [myResumes, setMyResumes] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null); // resume being edited (modal)
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    axios.get('/candidate/skill-categories')
      .then(r => setCategories(r.data?.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const fetchMyResumes = () => {
    setListLoading(true);
    axios.get('/clientspoc/bulk-resume/list', { withCredentials: true })
      .then(r => setMyResumes(r.data?.resumes || []))
      .catch(() => setMyResumes([]))
      .finally(() => setListLoading(false));
  };

  useEffect(() => { if (tab === 'list') fetchMyResumes(); }, [tab]);

  const handleDeleteResume = async (r) => {
    if (!window.confirm(`Delete ${r.candidate || 'this candidate'}'s resume? This cannot be undone.`)) return;
    setDeletingId(r.id);
    try {
      await axios.delete(`/clientspoc/bulk-resume/${r.id}`, { withCredentials: true });
      setMyResumes(prev => prev.filter(x => x.id !== r.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (r) => setEditTarget({
    ...r,
    skills: Array.isArray(r.skills) ? [...r.skills] : [],
  });

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editTarget.skillCategory || !editTarget.skillCategory.trim()) {
      alert('Skill category is required.');
      return;
    }
    setEditSaving(true);
    try {
      const payload = {
        candidate: editTarget.candidate || '',
        emails: editTarget.emails || '',
        mob: editTarget.mob || '',
        skills: editTarget.skills || [],
        skillCategory: editTarget.skillCategory || '',
      };
      await axios.patch(`/clientspoc/bulk-resume/${editTarget.id}`, payload, { withCredentials: true });
      setMyResumes(prev => prev.map(x => x.id === editTarget.id ? { ...x, ...payload } : x));
      setEditTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleFiles = async (fileList) => {
    setBanner(null);
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (rows.length + files.length > MAX_FILES) {
      setBanner({ type: 'error', text: `You can upload a maximum of ${MAX_FILES} resumes at a time.` });
      return;
    }
    setParsing(true);
    for (const file of files) {
      const tempId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      // optimistic placeholder
      setRows(prev => [...prev, { tempId, filename: file.name, loading: true }]);
      try {
        const base64 = await fileToBase64(file);
        const res = await axios.post('/clientspoc/bulk-resume/parse', {
          filename: file.name,
          contentType: file.type,
          base64,
        }, { withCredentials: true });
        const d = res.data || {};
        setRows(prev => prev.map(r => r.tempId === tempId ? {
          tempId,
          filename: d.filename || file.name,
          candidate: d.candidate || '',
          emails: d.emails || '',
          mob: d.mob || '',
          skills: d.skills || [],
          cv_data: d.cv_data || '',
          resumeText: d.resumeText || '',
          skillCategory: d.skillCategory || '',   // auto-suggested from skills
          autoCategory: !!d.skillCategory,
          parsed: d.parsed,
          duplicate: !!d.duplicate,
          duplicateName: d.duplicateName || '',
          overwrite: false,
          loading: false,
        } : r));
      } catch (err) {
        setRows(prev => prev.map(r => r.tempId === tempId ? {
          ...r, loading: false, error: err.response?.data?.message || 'Could not read this file.',
        } : r));
      }
    }
    setParsing(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const updateRow = (tempId, patch) =>
    setRows(prev => prev.map(r => r.tempId === tempId ? { ...r, ...patch } : r));

  const removeRow = (tempId) => setRows(prev => prev.filter(r => r.tempId !== tempId));

  const removeSkill = (tempId, idx) =>
    setRows(prev => prev.map(r => r.tempId === tempId
      ? { ...r, skills: r.skills.filter((_, i) => i !== idx) } : r));

  const addSkill = (tempId, value) => {
    const v = value.trim();
    if (!v) return;
    setRows(prev => prev.map(r => r.tempId === tempId && !r.skills.includes(v)
      ? { ...r, skills: [...r.skills, v] } : r));
  };

  const applyCategoryToAll = () => {
    if (!bulkCategory) return;
    setRows(prev => prev.map(r => ({ ...r, skillCategory: bulkCategory })));
  };

  const ready = rows.filter(r => !r.loading && !r.error);
  const allHaveCategory = ready.length > 0 && ready.every(r => r.skillCategory);

  const handleSave = async () => {
    setBanner(null);
    if (!ready.length) { setBanner({ type: 'error', text: 'Nothing to save yet.' }); return; }
    const missing = ready.findIndex(r => !r.skillCategory);
    if (missing !== -1) {
      setBanner({ type: 'error', text: `Please select a skill category for "${ready[missing].candidate || ready[missing].filename}". It is mandatory.` });
      return;
    }
    setSaving(true);
    try {
      const payload = ready.map(r => ({
        candidate: r.candidate,
        emails: r.emails,
        mob: r.mob,
        skills: r.skills,
        skillCategory: r.skillCategory,
        cv_data: r.cv_data,
        resumeText: r.resumeText || '',
        overwrite: !!r.overwrite,
      }));
      const res = await axios.post('/clientspoc/bulk-resume/save', { candidates: payload }, { withCredentials: true });
      const { saved = 0, overwritten = 0, skipped = [] } = res.data || {};
      const parts = [];
      if (saved) parts.push(`${saved} saved`);
      if (overwritten) parts.push(`${overwritten} overwritten`);
      if (skipped.length) parts.push(`${skipped.length} skipped as duplicate${skipped.length > 1 ? 's' : ''}`);
      const summary = parts.length ? parts.join(', ') : 'Nothing saved';
      setBanner({
        type: skipped.length && !saved && !overwritten ? 'error' : 'success',
        text: `${summary}.${skipped.length ? ` Duplicate(s) not overwritten: ${skipped.join(', ')}. Tick "Overwrite existing" to replace them.` : ' You can upload the next batch now, or open "My Uploaded Resumes" to view them.'}`,
      });
      // Keep any rows that were skipped (duplicates not overwritten) so the user
      // can tick Overwrite and retry; clear the rest.
      const skippedSet = new Set(skipped);
      setRows(prev => prev.filter(r => skippedSet.has(r.candidate || r.emails || 'Unnamed')));
      setBulkCategory('');
      fetchMyResumes(); // refresh the list in the background; stay on Upload for the next batch
    } catch (err) {
      setBanner({ type: 'error', text: err.response?.data?.message || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">
        <ClientSpocSidebar />
      </aside>
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64"><ClientSpocSidebar /></aside>
        </div>
      )}

      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Menu size={24} />
              </button>
              <button onClick={() => navigate('/ad_panel')} className="p-2 hover:bg-gray-100 rounded-lg" title="Back to Dashboard">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Bulk Resume Upload</h1>
                <p className="text-sm text-gray-500">Up to {MAX_FILES} at a time · no overall limit · {user?.name || 'Client SPOC'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex gap-0 max-w-5xl mx-auto">
            <button onClick={() => setTab('upload')}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'upload' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Upload Resumes
            </button>
            <button onClick={() => setTab('list')}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'list' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              My Uploaded Resumes
            </button>
          </div>
        </div>

        <main className="min-h-screen p-4 sm:p-6 max-w-5xl mx-auto">
          {banner && tab === 'upload' && (
            <div className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              banner.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {banner.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{banner.text}</span>
            </div>
          )}

          {tab === 'list' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="Search name, email, skill, category…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" />
                </div>
                <button onClick={fetchMyResumes} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:border-green-300 text-gray-600">
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {listLoading ? (
                <div className="text-sm text-gray-500 flex items-center gap-2 py-10 justify-center"><Loader2 size={18} className="animate-spin" /> Loading…</div>
              ) : (() => {
                const q = listSearch.toLowerCase().trim();
                const filtered = myResumes.filter(r => !q || [r.candidate, r.emails, r.mob, r.skillCategory, (r.skills || []).join(' ')].some(v => (v || '').toLowerCase().includes(q)));
                if (!filtered.length) {
                  return <div className="text-center text-gray-400 py-12">{myResumes.length ? 'No resumes match your search.' : 'You haven’t uploaded any resumes yet.'}</div>;
                }
                return (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">{filtered.length} resume(s)</p>
                    {filtered.map(r => (
                      <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900">{r.candidate || 'Unnamed candidate'}</div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              {r.emails && <span className="inline-flex items-center gap-1"><Mail size={12} />{r.emails}</span>}
                              {r.mob && <span className="inline-flex items-center gap-1"><Phone size={12} />{r.mob}</span>}
                              <span className="inline-flex items-center gap-1"><Tag size={12} className="text-green-600" /><b className="text-green-700">{r.skillCategory || '—'}</b></span>
                              <span>{fmtDate(r.datePosted)}</span>
                            </div>
                            {r.skills?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.skills.slice(0, 12).map((s, i) => (
                                  <span key={i} className="text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {r.cv_data ? <CvViewButton url={r.cv_data} /> : <span className="text-xs text-gray-400">No CV</span>}
                            <button onClick={() => openEdit(r)} title="Edit"
                              className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg border border-gray-200">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDeleteResume(r)} disabled={deletingId === r.id} title="Delete"
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 disabled:opacity-50">
                              {deletingId === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {tab === 'upload' && (<>
          {/* Dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="cursor-pointer border-2 border-dashed border-green-300 hover:border-green-500 bg-white rounded-2xl p-8 text-center transition-colors"
          >
            <UploadCloud size={40} className="mx-auto text-green-500" />
            <p className="mt-3 font-semibold text-gray-800">Click to select or drag &amp; drop resumes</p>
            <p className="text-sm text-gray-500 mt-1">PDF or DOCX · up to {MAX_FILES} per batch · {rows.length}/{MAX_FILES} in this batch</p>
            <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden
              onChange={(e) => handleFiles(e.target.files)} />
          </div>

          {parsing && (
            <p className="mt-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Reading resumes…</p>
          )}

          {/* Apply category to all */}
          {ready.length > 1 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">Set skill category for all:</span>
              <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-green-500">
                <option value="">Choose…</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={applyCategoryToAll} disabled={!bulkCategory}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40">
                Apply to all
              </button>
            </div>
          )}

          {/* Parsed resume cards */}
          <div className="mt-5 space-y-4">
            {rows.map((r, idx) => (
              <div key={r.tempId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-green-100 text-green-700 text-sm font-bold flex-shrink-0">{idx + 1}</span>
                    <FileText size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">{r.filename}</span>
                  </div>
                  <button onClick={() => removeRow(r.tempId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>

                {r.loading ? (
                  <div className="mt-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Reading…</div>
                ) : r.error ? (
                  <div className="mt-3 text-sm text-red-600 flex items-center gap-2"><AlertCircle size={16} /> {r.error}</div>
                ) : (
                  <>
                    {!r.parsed && (
                      <p className="mt-2 text-xs text-amber-600">Couldn't auto-read this file — please fill the details manually.</p>
                    )}
                    {r.duplicate && (
                      <div className={`mt-2 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${r.overwrite ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                        <span className={`text-xs font-semibold inline-flex items-center gap-1 ${r.overwrite ? 'text-blue-700' : 'text-amber-700'}`}>
                          <AlertCircle size={14} />
                          Duplicate{r.duplicateName ? ` of "${r.duplicateName}"` : ''} — same email &amp; phone already exists.
                          {!r.overwrite && <span className="font-normal text-amber-600"> Will be skipped unless overwritten.</span>}
                        </span>
                        <label className="text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ml-auto text-gray-700">
                          <input type="checkbox" checked={!!r.overwrite} onChange={(e) => updateRow(r.tempId, { overwrite: e.target.checked })} />
                          Overwrite existing
                        </label>
                      </div>
                    )}
                    <div className="mt-3 grid sm:grid-cols-3 gap-3">
                      <label className="block">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><User size={12} /> Name</span>
                        <input value={r.candidate} onChange={(e) => updateRow(r.tempId, { candidate: e.target.value })}
                          className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-green-500" placeholder="Candidate name" />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Mail size={12} /> Email</span>
                        <input value={r.emails} onChange={(e) => updateRow(r.tempId, { emails: e.target.value })}
                          className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-green-500" placeholder="email@example.com" />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Phone size={12} /> Phone</span>
                        <input value={r.mob} onChange={(e) => updateRow(r.tempId, { mob: e.target.value })}
                          className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-green-500" placeholder="10-digit mobile" />
                      </label>
                    </div>

                    {/* Skills */}
                    <div className="mt-3">
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Sparkles size={12} /> Skills</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.skills.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1.5 py-1">
                            {s}
                            <button onClick={() => removeSkill(r.tempId, i)} className="text-blue-400 hover:text-blue-700"><X size={12} /></button>
                          </span>
                        ))}
                        {r.skills.length === 0 && <span className="text-xs text-gray-400">No skills detected — add manually below.</span>}
                      </div>
                      <input
                        type="text"
                        placeholder="Type a skill and press Enter"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(r.tempId, e.target.value); e.target.value = ''; } }}
                        className="mt-2 w-full sm:w-64 text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-green-500"
                      />
                    </div>

                    {/* Mandatory skill category (auto-suggested from skills) */}
                    <div className="mt-3">
                      <span className="text-xs font-medium text-gray-500">
                        Skill Category <span className="text-red-500">*</span>
                        {r.autoCategory && r.skillCategory && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                            <Sparkles size={10} /> Auto-suggested
                          </span>
                        )}
                      </span>
                      <select value={r.skillCategory} onChange={(e) => updateRow(r.tempId, { skillCategory: e.target.value, autoCategory: false })}
                        className={`mt-1 w-full sm:w-72 text-sm border rounded-lg px-3 py-2 outline-none focus:border-green-500 ${r.skillCategory ? 'border-gray-300' : 'border-red-300 bg-red-50'}`}>
                        <option value="">Select category (required)…</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Save bar */}
          {ready.length > 0 && (
            <div className="sticky bottom-0 mt-6 bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {ready.length} resume(s) ready{!allHaveCategory && <span className="text-red-500"> · select a skill category for each</span>}
              </span>
              <button onClick={handleSave} disabled={saving || !allHaveCategory}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save to Candidate Bank
              </button>
            </div>
          )}
          </>)}
        </main>
      </div>

      {/* Edit resume modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !editSaving && setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-base font-bold text-gray-900">Edit Resume</h3>
              <button onClick={() => !editSaving && setEditTarget(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><User size={12} /> Name</span>
                <input value={editTarget.candidate || ''} onChange={(e) => setEditTarget(t => ({ ...t, candidate: e.target.value }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-green-500" placeholder="Candidate name" />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Mail size={12} /> Email</span>
                  <input value={editTarget.emails || ''} onChange={(e) => setEditTarget(t => ({ ...t, emails: e.target.value }))}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-green-500" placeholder="email@example.com" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Phone size={12} /> Phone</span>
                  <input value={editTarget.mob || ''} onChange={(e) => setEditTarget(t => ({ ...t, mob: e.target.value }))}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-green-500" placeholder="10-digit mobile" />
                </label>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Sparkles size={12} /> Skills</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(editTarget.skills || []).map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1.5 py-1">
                      {s}
                      <button onClick={() => setEditTarget(t => ({ ...t, skills: t.skills.filter((_, j) => j !== i) }))} className="text-blue-400 hover:text-blue-700"><X size={12} /></button>
                    </span>
                  ))}
                  {(editTarget.skills || []).length === 0 && <span className="text-xs text-gray-400">No skills — add below.</span>}
                </div>
                <input type="text" placeholder="Type a skill and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = e.target.value.trim();
                      if (v) setEditTarget(t => t.skills.includes(v) ? t : ({ ...t, skills: [...t.skills, v] }));
                      e.target.value = '';
                    }
                  }}
                  className="mt-2 w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-green-500" />
              </div>

              <label className="block">
                <span className="text-xs font-medium text-gray-500">Skill Category <span className="text-red-500">*</span></span>
                <select value={editTarget.skillCategory || ''} onChange={(e) => setEditTarget(t => ({ ...t, skillCategory: e.target.value }))}
                  className={`mt-1 w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-green-500 ${editTarget.skillCategory ? 'border-gray-300' : 'border-red-300 bg-red-50'}`}>
                  <option value="">Select category (required)…</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button onClick={() => setEditTarget(null)} disabled={editSaving}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                {editSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSpocBulkResumes;
