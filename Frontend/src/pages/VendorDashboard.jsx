import React, { useState, useEffect, useContext, useMemo } from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Users, UserPlus, BarChart3, LogOut, RefreshCw, Eye, EyeOff,
  PlusCircle, FolderOpen, ClipboardList,
  ChevronDown, ChevronRight, ChevronLeft, AlertCircle, Building,
  Briefcase, Download, X, Hash, Store, Menu, Clock, MapPin,
  IndianRupee, BadgePercent, Search, UserCheck, FileText, ExternalLink, MessageSquare, Inbox, Building2, Mic, LayoutDashboard, Trash2
} from 'lucide-react';
import { UserStateContext, UserDispatchContext } from '../context/AuthPro';
import Ad_Candi from './Ad_Candi';
import Ad_Pos from './Ad_Pos';
import { CompanyFormModal } from './AllCompanies';
import EditPositionModal from './EditPositionModal';
import ChatPanel from '../components/ChatPanel';
import InboxPage from '../components/InboxPage';
import { RichTextView } from '../components/RichTextEditor';

// ── helpers ────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return 'N/A';
  try {
    const ts = d._seconds ? d._seconds * 1000 : typeof d === 'string' ? Date.parse(d) : d;
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return 'N/A'; }
};

// ── Add Recruiter ──────────────────────────────────────────────
const RegisterRecruiterTab = ({ vendorInfo, vendorInfoLoaded, vendorInfoError, onRegistered, onRetry }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get('/vendor/skill-categories', { withCredentials: true })
      .then(res => setSkillCategories(res.data.data || []))
      .catch(() => setSkillCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, cat];
    });
    if (errors.skillCategory) setErrors(e => ({ ...e, skillCategory: '' }));
  };

  // Still loading
  if (!vendorInfoLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-gray-500">Loading…</span>
      </div>
    );
  }

  // API failed — show error with retry
  if (vendorInfoError || vendorInfo == null) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Vendor Info</h3>
          <p className="text-gray-600 text-sm mb-1">Could not fetch your vendor profile from the server.</p>
          {vendorInfoError && <p className="text-xs text-red-500 mb-4 font-mono bg-red-100 rounded px-3 py-2">{vendorInfoError}</p>}
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const qty = vendorInfo.recruiterQuantity ?? 0;
  const used = vendorInfo.recruitersUsed ?? 0;
  const remaining = qty - used;

  if (qty === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Recruiter Quota Not Configured</h3>
          <p className="text-gray-600 text-sm mb-4">
            Your vendor account does not have a recruiter quota set yet. An administrator needs to set your allowed recruiter count before you can register recruiters.
          </p>
          <div className="bg-white rounded-xl border border-amber-200 p-4 text-left text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-2">How to fix this:</p>
            <p>1. Ask your administrator to log in to the admin dashboard</p>
            <p>2. Go to <strong>Vendor Management</strong></p>
            <p>3. Find your vendor account and click <strong>Update Quota</strong></p>
            <p>4. Set the allowed number of recruiters and save</p>
          </div>
        </div>
      </div>
    );
  }

  if (remaining <= 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="mx-auto text-orange-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">Recruiter Limit Reached</h3>
        <p className="text-gray-500 text-sm">You have used all {qty} recruiter slot{qty !== 1 ? 's' : ''}. Contact your administrator to increase your quota.</p>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true); setMsg(null);
    try {
      await axios.post('/vendor/register-recruiter', {
        ...form,
        skillCategory: selectedCategories,
        experienceCategory: selectedCategories.join(', '),
      }, { withCredentials: true });
      setMsg({ type: 'success', text: `Recruiter "${form.name}" registered! Credentials emailed.` });
      setForm({ name: '', email: '', password: '', mobile: '' });
      setSelectedCategories([]);
      onRegistered();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Registration failed.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-blue-700 to-orange-500 rounded-2xl p-5 mb-6 text-white flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Register New Recruiter</h3>
          <p className="text-white/80 text-sm mt-0.5">{remaining} slot{remaining !== 1 ? 's' : ''} remaining of {vendorInfo.recruiterQuantity}</p>
        </div>
        <div className={`rounded-xl px-4 py-2 text-center ${qty === 0 ? 'bg-amber-400/30 border border-amber-300' : 'bg-white/20'}`}>
          <div className="text-2xl font-black">{used}/{qty}</div>
          <div className="text-xs text-white/80">{qty === 0 ? '⚠ Quota not set' : 'Used'}</div>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        {[
          { label: 'Full Name *', name: 'name', type: 'text', placeholder: 'Enter full name' },
          { label: 'Email Address *', name: 'email', type: 'email', placeholder: 'recruiter@example.com' },
          { label: 'Mobile', name: 'mobile', type: 'tel', placeholder: 'Optional' },
        ].map(f => (
          <div key={f.name}>
            <label className="text-sm font-semibold text-gray-700 block mb-1">{f.label}</label>
            <input
              type={f.type}
              value={form[f.name]}
              onChange={e => { setForm({ ...form, [f.name]: e.target.value }); if (errors[f.name]) setErrors({ ...errors, [f.name]: '' }); }}
              placeholder={f.placeholder}
              className={`w-full border-2 ${errors[f.name] ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
            />
            {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errors[f.name]}</p>}
          </div>
        ))}

        {/* Skill Category multi-select — max 3 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Skill Category <span className="text-gray-400 font-normal">(select up to 3)</span>
          </label>
          {/* Selected tags */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedCategories.map(cat => (
                <span key={cat} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {cat}
                  <button type="button" onClick={() => toggleCategory(cat)} className="text-blue-500 hover:text-blue-800 ml-0.5">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {loadingCats ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Loading categories…
            </div>
          ) : skillCategories.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No categories available. Ask admin to add skill categories.</p>
          ) : (
            <div className="flex flex-wrap gap-2 border-2 border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
              {skillCategories.map(cat => {
                const selected = selectedCategories.includes(cat);
                const disabled = !selected && selectedCategories.length >= 3;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => !disabled && toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                      selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : disabled
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
          {selectedCategories.length >= 3 && (
            <p className="text-xs text-amber-600 mt-1">Maximum 3 categories selected</p>
          )}
          {errors.skillCategory && <p className="text-red-500 text-xs mt-1">{errors.skillCategory}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }); }}
              placeholder="••••••••"
              className={`w-full border-2 ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2.5 pr-11 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          <p className="text-xs text-gray-400 mt-1">Credentials will be emailed to the recruiter. Minimum 6 characters.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-all"
        >
          {loading ? 'Adding…' : 'Add Recruiter (Paid Plan)'}
        </button>
      </form>
    </div>
  );
};

// ── Recruiter Detail Modal ──────────────────────────────────────
// ── CV Viewer Modal ─────────────────────────────────────────────
const CvViewerModal = ({ cvUrl, candidateName, positionName, status, submittedDate, onClose }) => {
  const [loadError, setLoadError] = useState(false);

  // Build an embeddable URL — Google Drive "view" links need the /preview form
  const embedUrl = cvUrl?.includes('drive.google.com')
    ? cvUrl.replace('/view', '/preview').replace('/edit', '/preview')
    : cvUrl;

  const st = (status || '').toLowerCase();
  const statusCls = (st.includes('reject') || st.includes('drop') || st === 'duplicate')
    ? 'bg-red-600 text-white'
    : st === 'submitted'
    ? 'bg-green-500 text-white'
    : 'bg-white/20 text-white/90';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ height: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-white flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">{candidateName}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {positionName && (
                  <span className="text-white/80 text-xs">{positionName}</span>
                )}
                {positionName && (status || submittedDate) && (
                  <span className="text-white/40 text-xs">·</span>
                )}
                {status && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>
                    {status}
                  </span>
                )}
                {submittedDate && (
                  <span className="text-white/70 text-xs">{submittedDate}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <ExternalLink size={13} /> Open in new tab
            </a>
            <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CV viewer */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FileText size={48} className="text-gray-300" />
              <p className="text-gray-500 font-medium">Cannot display this file inline.</p>
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                <ExternalLink size={15} /> Open CV
              </a>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={`CV — ${candidateName}`}
              className="w-full h-full border-0"
              onError={() => setLoadError(true)}
              allow="autoplay"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Recruiter Detail Modal ──────────────────────────────────────
const RecruiterDetailModal = ({ recruiterId, recruiterName, accountStatus, onAccessChanged, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPos, setExpandedPos] = useState(null);
  const [cvViewer, setCvViewer] = useState(null); // { url, name }
  const [status, setStatus] = useState(accountStatus || 'approved');
  const [accessSaving, setAccessSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const isBlocked = status === 'blocked';

  // Detach this recruiter from the vendor's group. Their account stays active —
  // they simply carry on as an independent recruiter.
  const removeFromGroup = async () => {
    if (!window.confirm(
      `Remove ${recruiterName} from your group?\n\n` +
      `They will no longer appear under your account and this frees a recruiter slot.` +
      (isBlocked
        ? `\n\nNote: you have declined their access, and that stays in place after removal. Only an admin can grant it back.`
        : `\n\nTheir account stays active — they continue working normally as an independent recruiter.`)
    )) return;
    setRemoving(true);
    try {
      const res = await axios.post('/vendor/remove-recruiter', { recruiterId }, { withCredentials: true });
      if (res.data?.success) {
        onAccessChanged?.();
        onClose();
      } else {
        alert(res.data?.message || 'Could not remove recruiter');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove recruiter');
    } finally {
      setRemoving(false);
    }
  };

  // Grant / decline this recruiter's dashboard access.
  const toggleAccess = async () => {
    const action = isBlocked ? 'unblock' : 'block';
    if (action === 'block' && !window.confirm(`Decline access for ${recruiterName}?\n\nThey will be signed out and will not be able to log in until access is granted again.`)) return;
    setAccessSaving(true);
    try {
      const res = await axios.post('/vendor/recruiter-access', { recruiterId, action }, { withCredentials: true });
      if (res.data?.success) {
        setStatus(res.data.accountStatus);
        onAccessChanged?.();
      } else {
        alert(res.data?.message || 'Could not update access');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update access');
    } finally {
      setAccessSaving(false);
    }
  };

  useEffect(() => {
    setError(null);
    axios.get(`/vendor/recruiter-detail?recruiterId=${recruiterId}`, { withCredentials: true })
      .then(res => setData(res.data))
      .catch(err => {
        console.error('recruiter-detail error:', err?.response?.data || err.message);
        setError(err?.response?.data?.message || 'Failed to load data');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [recruiterId]);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-5 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{recruiterName}</h2>
              {isBlocked && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                  ACCESS DECLINED
                </span>
              )}
            </div>
            <p className="text-white/75 text-xs mt-0.5">
              {data ? `${data.positions?.length || 0} positions · ${data.totalCandidates || 0} candidates` : 'Loading…'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={removeFromGroup}
              disabled={removing}
              title="Detach this recruiter from your group — their account stays active"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 text-white border border-white/40 hover:bg-white/25 transition-all disabled:opacity-50"
            >
              {removing ? 'Removing…' : 'Remove from Group'}
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X size={22} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
              <span className="text-gray-500">Loading data…</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertCircle size={40} className="mx-auto text-red-300 mb-3" />
              <p className="text-red-500 font-medium">Error loading data</p>
              <p className="text-gray-400 text-sm mt-1">{error}</p>
            </div>
          ) : !data ? null : (
            <div className="space-y-5">
              {/* Recruiter profile details */}
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="font-medium text-gray-800 break-all">{data.recruiter?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p className="font-medium text-gray-800">{data.recruiter?.mobile || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Experience</p>
                  <p className="font-medium text-gray-800">{data.recruiter?.experienceCategory || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Specialization</p>
                  <p className="font-medium text-gray-800">{data.recruiter?.specialization || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Registered</p>
                  <p className="font-medium text-gray-800">{fmt(data.recruiter?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                    {data.recruiter?.accountStatus || 'Active'}
                  </span>
                </div>
                {(() => {
                  const sc = data.recruiter?.skillCategory;
                  const cats = Array.isArray(sc) ? sc : sc ? [sc] : [];
                  return cats.length > 0 && (
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-xs text-gray-400 mb-1">Skill Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cats.map(s => (
                          <span key={s} className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Candidate submissions */}
              {!data.positions?.length ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <Briefcase size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No candidate submissions yet.</p>
                </div>
              ) : (
              <div className="space-y-3">
              {data.positions.map(pos => (
                <div key={pos.pos_id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPos(expandedPos === pos.pos_id ? null : pos.pos_id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Briefcase size={14} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{pos.pos_name}</p>
                        <p className="text-xs text-gray-500">{pos.client} · {pos.pos_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <NotesLight pos={pos} />
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {pos.candidates.length} candidate{pos.candidates.length !== 1 ? 's' : ''}
                      </span>
                      {expandedPos === pos.pos_id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>
                  </button>
                  {expandedPos === pos.pos_id && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-blue-50">
                          <tr>
                            {['Candidate','Email','Phone','Status','Curr CTC','Exp CTC','Experience','Location','Notice','Submitted','CV'].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-semibold text-blue-700 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {pos.candidates.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{c.name}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.email || '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.phone || '—'}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${c.status === 'Selected' ? 'bg-green-100 text-green-700' : c.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.currentCTC ? `₹${parseInt(c.currentCTC).toLocaleString()}` : '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.expectedCTC ? `₹${parseInt(c.expectedCTC).toLocaleString()}` : '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.experience || '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.curr_loc || '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.notice_period || '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.submittedDate}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {c.cvUrl ? (
                                  <button
                                    onClick={() => setCvViewer({ url: c.cvUrl, name: c.name, positionName: pos.pos_name, status: c.status, submittedDate: c.submittedDate })}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                  >
                                    <FileText size={11} /> View CV
                                  </button>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* CV viewer — renders on top of the recruiter modal */}
    {cvViewer && (
      <CvViewerModal
        cvUrl={cvViewer.url}
        candidateName={cvViewer.name}
        positionName={cvViewer.positionName}
        status={cvViewer.status}
        submittedDate={cvViewer.submittedDate}
        onClose={() => setCvViewer(null)}
      />
    )}
    </>
  );
};

// ── My Teams ───────────────────────────────────────────────────
const MyRecruitersTab = ({ recruiters, loading, onRefresh }) => {
  // Removing detaches the recruiter from this vendor — it never deletes their
  // account, because their submitted candidates and history belong to them.
  const removeRecruiter = async (r) => {
    if (!window.confirm(
      `Remove ${r.name || r.email} from your team?\n\n` +
      'They keep their RecruiterV account and their candidates — they simply stop being part of your team.'
    )) return;
    try {
      const res = await axios.post('/vendor/remove-recruiter', { recruiterId: r.id }, { withCredentials: true });
      alert(res.data?.message || 'Recruiter removed from your team.');
      onRefresh && onRefresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not remove this recruiter.');
    }
  };

  const [detailModal, setDetailModal] = useState(null); // { id, name }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" /><span className="text-gray-500">Loading…</span></div>;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{recruiters.length} Recruiter{recruiters.length !== 1 ? 's' : ''}</h3>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"><RefreshCw size={15} /> Refresh</button>
      </div>
      {!recruiters.length ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No recruiters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {recruiters.map(r => (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all"
              onClick={() => setDetailModal({ id: r.id, name: r.name || r.email, accountStatus: r.accountStatus })}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(r.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500 truncate">{r.email}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeRecruiter(r); }}
                  title="Remove from your team"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                {r.mobile && <p>📞 {r.mobile}</p>}
                <p>Registered: {fmt(r.createdAt)}</p>
                <p>Last active: {fmt(r.lastActive)}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="inline-block bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Paid Plan</span>
                  {r.accountStatus === 'blocked' && (
                    <span className="inline-block bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">Access Declined</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailModal && (
        <RecruiterDetailModal
          recruiterId={detailModal.id}
          recruiterName={detailModal.name}
          accountStatus={detailModal.accountStatus}
          onAccessChanged={onRefresh}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
};

// ── Reports ────────────────────────────────────────────────────
const ReportsTab = () => {
  const [positions, setPositions] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [candidatesData, setCandidatesData] = useState([]);
  const [loadingPos, setLoadingPos] = useState(true);
  const [loadingCand, setLoadingCand] = useState(false);
  const [summary, setSummary] = useState({ totalCandidates: 0, uniqueRecruiters: 0 });

  useEffect(() => {
    axios.get('/vendor/reports/positions', { withCredentials: true })
      .then(res => setPositions(res.data.data || []))
      .catch(() => setPositions([]))
      .finally(() => setLoadingPos(false));
  }, []);

  useEffect(() => { setSelectedPositions([]); }, [selectedClient]);

  const clientOptions = useMemo(() => [...new Set(positions.map(p => p.client).filter(Boolean))].sort(), [positions]);
  const clientFilteredPositions = useMemo(
    () => selectedClient ? positions.filter(p => p.client === selectedClient) : positions,
    [positions, selectedClient]
  );

  useEffect(() => {
    if (!selectedPositions.length) { setCandidatesData([]); setSummary({ totalCandidates: 0, uniqueRecruiters: 0 }); return; }
    const t = setTimeout(() => {
      setLoadingCand(true);
      const params = { pos_ids: selectedPositions.join(',') };
      if (selectedDate) { params.startDate = selectedDate; params.endDate = selectedDate; }
      axios.get('/vendor/reports/candidates', { params, withCredentials: true })
        .then(res => {
          const groups = res.data.data || [];
          setCandidatesData(groups);
          setSummary({ totalCandidates: res.data.totalCandidates || groups.reduce((s, g) => s + g.candidateCount, 0), uniqueRecruiters: groups.length });
        })
        .catch(() => setCandidatesData([]))
        .finally(() => setLoadingCand(false));
    }, 300);
    return () => clearTimeout(t);
  }, [selectedPositions, selectedDate]);

  const flatCandidates = useMemo(() => {
    const rows = [];
    candidatesData.forEach(group => {
      (group.candidates || []).forEach(c => {
        rows.push({
          recruiterName: group.recruiterName,
          name: c.name || 'N/A',
          email: c.email || 'N/A',
          phone: c.phone || 'N/A',
          status: c.status || 'Submitted',
          submittedDate: c.submittedDate || 'N/A',
          currentCTC: c.currentCTC || 'N/A',
          expectedCTC: c.expectedCTC || 'N/A',
          experience: c.experience || 'N/A',
          skills: c.skills || (Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : c.tech_skill) || 'N/A',
          noticePeriod: c.notice_period || 'N/A',
          lastWorkingDay: c.last_day || 'N/A',
          currentLocation: c.curr_loc || 'N/A',
          currentState: c.curr_state || 'N/A',
          preferredLocation: c.pref_loc || 'N/A',
          preferredState: c.pref_state || 'N/A',
          selfRate: c.self_rate || 'N/A',
          offerInHand: c.offer_hand || 'N/A',
          offerAmount: c.offer_amt || 'N/A',
          currentEmployer: c.curr_emp || 'N/A',
          rhId: c.rh_id || 'N/A',
          highestEducation: c.highest_education || 'N/A',
          skillType: c.skill_type || 'N/A',
          techCategory: c.tech_category || 'N/A',
          techSubcategory: c.tech_subcategory || 'N/A',
          techSkills: Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : (c.tech_skill || 'N/A'),
          techExperience: c.tech_exp || 'N/A',
          nonTechCategory: c.nontech_category || 'N/A',
          nonTechSubcategory: c.nontech_subcategory || 'N/A',
          nonTechSkills: Array.isArray(c.nontech_skill) ? c.nontech_skill.join(', ') : (c.nontech_skill || 'N/A'),
          nonTechExperience: c.nontech_exp || 'N/A',
          dob: c.dob || 'N/A',
          jrNumber: c.jr_number || 'N/A',
          panNumber: c.pan_number || 'N/A',
          client: c.client || 'N/A',
          hrName: c.hr_name || 'N/A',
          positionName: c.pos_name || 'N/A',
          cvUrl: c.cvUrl || c.cv_data || '',
        });
      });
    });
    return rows;
  }, [candidatesData]);

  const downloadXLS = () => {
    if (!flatCandidates.length) return;
    const rows = flatCandidates.map(r => ({
      'Candidate': r.name, 'Recruiter': r.recruiterName, 'Email': r.email, 'Phone': r.phone,
      'Status': r.status, 'Submitted On': r.submittedDate, 'Current CTC': r.currentCTC,
      'Expected CTC': r.expectedCTC, 'Experience': r.experience, 'Notice Period': r.noticePeriod,
      'Last Day': r.lastWorkingDay, 'Current State': r.currentState, 'Current Location': r.currentLocation,
      'Preferred State': r.preferredState, 'Preferred Location': r.preferredLocation,
      'Self Rate': r.selfRate, 'Offer In Hand': r.offerInHand, 'Offer Amount': r.offerAmount,
      'Current Employer': r.currentEmployer, 'RH ID': r.rhId, 'Highest Education': r.highestEducation,
      'Skill Type': r.skillType, 'Tech Category': r.techCategory, 'Tech Subcategory': r.techSubcategory,
      'Tech Skills': r.techSkills, 'Tech Exp': r.techExperience,
      'NonTech Category': r.nonTechCategory, 'NonTech Subcategory': r.nonTechSubcategory,
      'NonTech Skills': r.nonTechSkills, 'NonTech Exp': r.nonTechExperience,
      'DOB': r.dob, 'JR Number': r.jrNumber, 'PAN': r.panNumber,
      'Client': r.client, 'HR Name': r.hrName, 'Position': r.positionName,
      'Skills': r.skills, 'CV URL': r.cvUrl,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Candidates Report');
    XLSX.writeFile(wb, `vendor-report-${Date.now()}.xlsx`);
  };

  if (loadingPos) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" /><span className="text-gray-500">Loading positions…</span></div>;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vendor Reports</h2>
          <p className="text-sm text-gray-500">Candidate analytics by your recruiters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadXLS}
            disabled={!flatCandidates.length}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-all"
          >
            <Download size={15} /> Download XLS
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Client filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Client</label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            >
              <option value="">All Clients</option>
              {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Position multi-select */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Positions ({clientFilteredPositions.length} available)
            </label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
              {!positions.length ? (
                <p className="text-xs text-gray-400 text-center py-2">No positions available</p>
              ) : !clientFilteredPositions.length ? (
                <p className="text-xs text-gray-400 text-center py-2">No positions for this client</p>
              ) : clientFilteredPositions.map(p => (
                <label key={p.pos_id} className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPositions.includes(p.pos_id)}
                    onChange={() => setSelectedPositions(prev => prev.includes(p.pos_id) ? prev.filter(x => x !== p.pos_id) : [...prev, p.pos_id])}
                    className="accent-blue-600"
                  />
                  <span className="text-xs text-gray-700 truncate">{p.pos_name} <span className="text-gray-400">({p.client})</span></span>
                </label>
              ))}
            </div>
            {selectedPositions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedPositions.map(pid => {
                  const p = positions.find(x => x.pos_id === pid);
                  return (
                    <span key={pid} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {p?.pos_name || pid}
                      <button type="button" onClick={() => setSelectedPositions(prev => prev.filter(x => x !== pid))} className="text-blue-400 hover:text-blue-700"><X size={10} /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="text-xs text-red-500 hover:underline mt-1">Clear date</button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        {selectedPositions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <p className="text-xs text-blue-100">Total Candidates</p>
              <p className="text-2xl font-bold mt-0.5">{loadingCand ? '—' : summary.totalCandidates}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
              <p className="text-xs text-orange-100">Recruiters</p>
              <p className="text-2xl font-bold mt-0.5">{loadingCand ? '—' : summary.uniqueRecruiters}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
              <p className="text-xs text-purple-100">Positions Selected</p>
              <p className="text-2xl font-bold mt-0.5">{selectedPositions.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {selectedPositions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Select one or more positions to see candidates</p>
        </div>
      ) : loadingCand ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-gray-500">Loading candidates…</span>
        </div>
      ) : flatCandidates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No candidates found for the selected filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">{flatCandidates.length} candidate{flatCandidates.length !== 1 ? 's' : ''} across {summary.uniqueRecruiters} recruiter{summary.uniqueRecruiters !== 1 ? 's' : ''}</p>
          </div>
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                {['#','Candidate','Recruiter','Email','Phone','Status','Submitted','Curr CTC','Exp CTC','Experience','Notice','Location','Client','Position','Skills','CV'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flatCandidates.map((c, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{c.name}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.recruiterName}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.email}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.phone}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${c.status === 'Selected' ? 'bg-green-100 text-green-700' : c.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.submittedDate}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.currentCTC || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.expectedCTC || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.experience || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.noticePeriod || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.currentLocation || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.client}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.positionName}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{c.skills || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {c.cvUrl ? <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">View</a> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Open Positions ─────────────────────────────────────────────


// ── Per-question notes lights (one per briefing question) ───────────────────
//  green glow  → recruiter has listened to that answer
//  red glow    → answered by the vendor, not listened yet
//  red + cross → the vendor hasn't answered that question
const NotesLight = ({ pos }) => {
  const state = pos.briefingState || (pos.hasNotes ? 'ready' : 'pending');
  if (state === 'pending') {
    return (
      <span title="You haven't briefed this position yet"
        className="relative inline-flex items-center justify-center flex-shrink-0"
        style={{ width: 14, height: 14 }} onClick={e => e.stopPropagation()}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444',
          boxShadow: '0 0 5px 1.5px #ef444499', animation: 'notesPulse 1.6s ease-in-out infinite' }} />
        <svg viewBox="0 0 14 14" width="14" height="14" style={{ position: 'absolute', inset: 0 }}>
          <line x1="3" y1="3" x2="11" y2="11" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
          <line x1="11" y1="3" x2="3" y2="11" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes notesPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      </span>
    );
  }
  const listened = !!pos.notesListened;
  const colour = state === 'draft' ? '#f59e0b' : listened ? '#22c55e' : '#ef4444';
  const tip = state === 'draft'
    ? 'Briefing saved as draft — not published to your team yet'
    : listened
      ? `Listened${pos.notesListenedAt ? ' on ' + new Date(pos.notesListenedAt).toLocaleString('en-IN') : ''}`
      : 'Briefing published — this recruiter has not listened yet';
  return (
    <span title={tip} className="inline-flex items-center flex-shrink-0"
      style={{ width: 14, height: 14 }} onClick={e => e.stopPropagation()}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: colour,
        boxShadow: `0 0 5px 1.5px ${colour}99`, animation: 'notesPulse 1.6s ease-in-out infinite' }} />
      <style>{`@keyframes notesPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </span>
  );
};


// Vendor landing page. "Direct" positions are the ones the vendor added
// themselves; "RecruiterV" ones come from the wider platform.
const VendorDashboardTab = ({ onGo }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    axios.get('/vendor/dashboard-stats', { withCredentials: true })
      .then(r => { if (live) setData(r.data); })
      .catch(e => { if (live) setError(e.response?.data?.message || 'Could not load your dashboard.'); });
    return () => { live = false; };
  }, []);

  if (error) return <div className="py-16 text-center text-red-500 text-sm">{error}</div>;
  if (!data) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;

  const s = data.stats || {};
  const cards = [
    { label: 'Direct Active Positions', value: s.directActivePositions, hint: 'Positions you added', tone: 'from-blue-500 to-blue-600', go: 'added-positions' },
    { label: 'RecruiterV Active Positions', value: s.platformActivePositions, hint: 'Platform positions your team holds', tone: 'from-purple-500 to-purple-600', go: 'assigned-positions' },
    { label: 'Active CVs', value: s.activeCvs, hint: 'Candidates still in play', tone: 'from-green-500 to-green-600', go: 'candidates' },
    { label: 'Matching CVs on Active Positions', value: s.cvsOnActivePositions, hint: 'Live CVs against active positions', tone: 'from-teal-500 to-teal-600', go: 'candidates' },
    { label: 'Positions Without Active CV', value: s.positionsWithoutCv, hint: 'Need sourcing attention', tone: 'from-orange-500 to-red-500', go: 'assigned-positions' },
    { label: 'CVs in Upcoming Drive', value: s.cvsInUpcomingDrive, hint: 'Scheduled or to be scheduled', tone: 'from-amber-500 to-orange-500', go: 'candidates' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">Where your team stands right now.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(c => (
          <button key={c.label} onClick={() => onGo && onGo(c.go)}
            className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${c.tone}`} />
            <div className="p-4">
              <p className="text-3xl font-bold text-gray-900">{c.value ?? 0}</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{c.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.hint}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Client-wise Active Positions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Across both your own and RecruiterV positions.</p>
        </div>
        {!data.clientWise?.length ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No active positions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Active positions</th>
                  <th className="px-5 py-3 font-semibold">Active CVs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.clientWise.map(c => (
                  <tr key={c.client} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3 font-semibold text-gray-800">{c.client}</td>
                    <td className="px-5 py-3 text-gray-700">{c.positions}</td>
                    <td className="px-5 py-3 text-gray-700">{c.cvs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const VendorAssignedPositionsTab = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const load = () => axios.get('/vendor/assigned-positions', { withCredentials: true })
    .then(r => setRows(r.data?.positions || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  if (!rows) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
  if (!rows.length) return <div className="py-16 text-center text-gray-400 text-sm">No positions assigned to you or your team yet. Assign one from Open Positions.</div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Positions you or your recruiters are working on. You can only submit candidates against a
        position that is assigned to you — take it onto your own account first.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(p => (
          <div key={p.pos_id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-gray-900 leading-snug">{p.position}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                (p.status || 'active').toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {p.status || 'active'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">#{p.pos_id}</div>
            <div className="text-xs text-gray-600 mt-2 truncate">{p.client}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {Array.isArray(p.location) ? p.location.join(', ') : (p.location || '—')}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.assignedTo.map(who => (
                <span key={who} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  who === 'Self' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                  {who === 'Self' ? '👤 Self' : who}
                </span>
              ))}
            </div>

            {p.selfAssigned ? (
              <button onClick={() => navigate(`/dash_view/${p.pos_id}?submit=1`)}
                className="mt-4 w-full py-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white text-xs font-bold rounded-xl">
                Submit Candidate
              </button>
            ) : (
              <button onClick={() => navigate(`/dash_view/${p.pos_id}`)}
                className="mt-4 w-full py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl">
                Assign to me to submit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const VendorCompaniesTab = () => {
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);   // { company, isNew }
  const [msg, setMsg] = useState(null);

  const load = () => axios.get('/vendor/companies', { withCredentials: true })
    .then(r => setRows(r.data?.companies || []))
    .catch(() => setRows([]));

  useEffect(() => { load(); }, []);

  const save = async (payload) => {
    const r = modal.isNew
      ? await axios.post('/vendor/companies', payload, { withCredentials: true })
      : await axios.put(`/vendor/companies/${modal.company.id}`, payload, { withCredentials: true });
    setMsg(r.data?.message || 'Saved.');
    setTimeout(() => setMsg(null), 5000);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Companies</h2>
          <p className="text-sm text-gray-500">
            Add a company here, then a SuperAdmin approves it. Positions can be published
            on RecruiterV only against an approved company.
          </p>
        </div>
        <button onClick={() => setModal({ company: {}, isNew: true })}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl">
          + Add Company
        </button>
      </div>

      {msg && <div className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2">{msg}</div>}

      {!rows ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : !rows.length ? (
        <div className="py-12 text-center text-gray-400 text-sm">You haven't added any company yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{c.name}</p>
                {!c.approved && c.rejectedReason && (
                  <p className="text-xs text-red-600 mt-0.5">Rejected: {c.rejectedReason}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!c.approved && (
                  <button onClick={() => setModal({ company: c, isNew: false })}
                    className="text-xs font-semibold text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50">
                    Edit
                  </button>
                )}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.approved
                  ? 'bg-green-100 text-green-700'
                  : c.rejectedReason ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {c.approved ? 'Approved' : c.rejectedReason ? 'Rejected' : 'Pending approval'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CompanyFormModal
          company={modal.company}
          title={modal.isNew ? 'Add Company' : 'Edit Company'}
          saveRequest={save}
          onSaved={() => {}}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

const VendorAddedPositionsTab = () => {
  const [rows, setRows] = useState(null);
  const [editPos, setEditPos] = useState(null);
  const [holdFor, setHoldFor] = useState(null);
  const [reason, setReason] = useState('');
  const load = () => axios.get('/vendor/my-positions', { withCredentials: true })
    .then(r => setRows(r.data?.positions || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const doHold = async () => {
    if (!reason.trim()) return;
    try {
      await axios.post(`/vendor/positions/${holdFor.id}/hold`, { reason: reason.trim() }, { withCredentials: true });
      setHoldFor(null); setReason(''); load();
    } catch (e) { alert(e.response?.data?.message || 'Failed to hold.'); }
  };

  if (!rows) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
  if (!rows.length) return <div className="py-16 text-center text-gray-400 text-sm">You haven't posted any positions yet. Use “Add Position”.</div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Positions you posted. You can edit them until the ClientSPOC approves — after that they're locked.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-gray-900 leading-snug">{p.position}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                p.canEdit ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {p.canEdit ? 'Awaiting approval' : (p.status || 'live')}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">#{p.pos_id}</div>
            <div className="text-xs text-gray-600 mt-2 truncate">{p.client}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {Array.isArray(p.location) ? p.location.join(', ') : (p.location || '—')}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              {p.canEdit ? (
                <button onClick={() => setEditPos(p)}
                  className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50">Edit</button>
              ) : (
                <span className="text-[11px] text-gray-400">Approved — editing locked</span>
              )}
              {(p.status || '').toLowerCase() !== 'hold' && (
                <button onClick={() => { setHoldFor(p); setReason(''); }}
                  className="text-xs font-medium text-orange-600 border border-orange-200 rounded-lg px-2.5 py-1.5 hover:bg-orange-50">Hold</button>
              )}
            </div>

            {holdFor?.id === p.id && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  placeholder="Reason for holding (required)…"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/40" />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setHoldFor(null)} className="text-xs text-gray-500 px-3 py-1.5">Cancel</button>
                  <button onClick={doHold} disabled={!reason.trim()}
                    className="text-xs font-semibold text-white bg-orange-600 rounded-lg px-3 py-1.5 disabled:opacity-50">Confirm hold</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editPos && (
        <EditPositionModal
          position={editPos}
          onClose={() => setEditPos(null)}
          onSuccess={() => { setEditPos(null); load(); }}
        />
      )}
    </div>
  );
};

const OpenPositionsTab = ({ recruiters }) => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState(null); // position detail modal
  const [assignModal, setAssignModal] = useState(null); // { pos_id, posName }
  const [assigningId, setAssigningId] = useState(null); // recruiterId being assigned
  const [assignResults, setAssignResults] = useState({}); // recruiterId → { success, message }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get('/vendor/open-positions', { withCredentials: true });
        setPositions(res.data.data || []);
      } catch (err) {
        console.error('open-positions error:', err.response?.status, err.response?.data);
        setPositions([]);
      }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = positions.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.position?.toLowerCase().includes(q) ||
      p.client?.toLowerCase().includes(q) ||
      p.pos_id?.toLowerCase().includes(q) ||
      p.skill_category?.toLowerCase().includes(q) ||
      p.pos_cat?.toLowerCase().includes(q) ||
      p.clientspocName?.toLowerCase().includes(q) ||
      p.clientspocEmail?.toLowerCase().includes(q) ||
      p.hr_name?.toLowerCase().includes(q) ||
      p.experience?.toLowerCase().includes(q) ||
      p.location?.join(', ').toLowerCase().includes(q) ||
      p.state?.join(', ').toLowerCase().includes(q)
    );
  }
  );

  const handleAssign = async (pos_id, posName, recruiterId) => {
    setAssigningId(recruiterId);
    try {
      const res = await axios.post('/vendor/assign-recruiter', { pos_id, recruiterId }, { withCredentials: true });
      setAssignResults(prev => ({ ...prev, [recruiterId]: { success: true, message: res.data.message } }));
    } catch (err) {
      setAssignResults(prev => ({ ...prev, [recruiterId]: { success: false, message: err.response?.data?.message || 'Failed' } }));
    } finally {
      setAssigningId(null);
    }
  };

  const openAssign = (pos) => {
    setAssignModal({ pos_id: pos.pos_id, posName: pos.position });
    setAssignResults({});
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
      <span className="text-gray-500">Loading positions…</span>
    </div>
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by position, client, skill category, SPOC name, location, HR…"
          className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{search ? 'No matching positions' : 'No active positions available'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(pos => (
            <div key={pos.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-4">
                <p className="font-bold text-white truncate text-base">{pos.position}</p>
                <p className="text-white/80 text-xs mt-0.5 truncate">{pos.client}</p>
              </div>
              <div className="p-4 flex-1 space-y-2 text-sm">
                {(pos.experience) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={13} className="text-gray-400 flex-shrink-0" />
                    <span>{pos.experience} yrs exp</span>
                  </div>
                )}
                {(pos.ctcStart || pos.ctcEnd) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <IndianRupee size={13} className="text-gray-400 flex-shrink-0" />
                    <span>{pos.ctcStart}{pos.ctcEnd ? ` – ${pos.ctcEnd}` : ''} LPA</span>
                  </div>
                )}
                {pos.location?.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{pos.location.join(', ')}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 font-mono">{pos.pos_id}</p>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => navigate(`/dash_view/${pos.pos_id}`)}
                  className="flex-1 py-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => openAssign(pos)}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Assign Recruiter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Position Detail Modal */}
      {selectedPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-5 flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-xl font-bold text-white truncate">{selectedPos.position}</h2>
                <p className="text-white/80 text-sm mt-0.5">{selectedPos.client} · {selectedPos.pos_id}</p>
              </div>
              <button onClick={() => setSelectedPos(null)} className="text-white/80 hover:text-white flex-shrink-0">
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* ClientSPOC contact card */}
              {(selectedPos.clientspocName || selectedPos.clientspocEmail) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {(selectedPos.clientspocName || selectedPos.clientspocEmail).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Client SPOC</p>
                    {selectedPos.clientspocName && <p className="font-bold text-gray-800 text-sm">{selectedPos.clientspocName}</p>}
                    {selectedPos.clientspocEmail && <p className="text-xs text-gray-600 truncate">✉ {selectedPos.clientspocEmail}</p>}
                    {selectedPos.clientspocPhone && <p className="text-xs text-gray-600">📞 {selectedPos.clientspocPhone}</p>}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Client', selectedPos.client],
                  ['HR / SPOC', selectedPos.hr_name],
                  ['Experience', selectedPos.experience ? `${selectedPos.experience} yrs` : 'N/A'],
                  ['CTC', selectedPos.ctcStart ? `${selectedPos.ctcStart}${selectedPos.ctcEnd ? ` – ${selectedPos.ctcEnd}` : ''} LPA` : 'N/A'],
                  ['Location', Array.isArray(selectedPos.location) ? selectedPos.location.join(', ') : selectedPos.location || 'N/A'],
                  ['Category', selectedPos.pos_cat || selectedPos.skill_category || 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
              {selectedPos.job_desc && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Job Description</p>
                  <div className="text-sm text-gray-600"><RichTextView value={selectedPos.job_desc} /></div>
                </div>
              )}
              {selectedPos.key_res && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Key Responsibilities</p>
                  <div className="text-sm text-gray-600"><RichTextView value={selectedPos.key_res} /></div>
                </div>
              )}
              {selectedPos.m_have && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Must Have Skills</p>
                  <div className="text-sm text-gray-600"><RichTextView value={selectedPos.m_have} /></div>
                </div>
              )}
              {selectedPos.g_have && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Good to Have Skills</p>
                  <div className="text-sm text-gray-600"><RichTextView value={selectedPos.g_have} /></div>
                </div>
              )}
              {selectedPos.compet && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Competencies</p>
                  <div className="text-sm text-gray-600"><RichTextView value={selectedPos.compet} /></div>
                </div>
              )}
              {selectedPos.comp_view && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Company Overview</p>
                  <div className="text-sm text-gray-600"><RichTextView value={selectedPos.comp_view} /></div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button onClick={() => setSelectedPos(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Close</button>
              <button
                onClick={() => { setSelectedPos(null); openAssign(selectedPos); }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                Assign Recruiter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Recruiter Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="bg-blue-100 rounded-full p-2 flex-shrink-0"><UserCheck size={20} className="text-blue-600" /></div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-base">Assign Recruiter</h3>
                <p className="text-xs text-gray-500 truncate">{assignModal.posName}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {recruiters.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No recruiters registered yet. Register recruiters first.
                </div>
              ) : (
                <div className="space-y-2">
                  {recruiters.map(r => {
                    const result = assignResults[r.id];
                    return (
                      <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${result?.success ? 'border-green-200 bg-green-50' : result ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(r.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{r.name}</p>
                          <p className="text-xs text-gray-500 truncate">{r.email}</p>
                          {result && (
                            <p className={`text-xs mt-0.5 font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>{result.message}</p>
                          )}
                        </div>
                        {!result && (
                          <button
                            onClick={() => handleAssign(assignModal.pos_id, assignModal.posName, r.id)}
                            disabled={assigningId === r.id}
                            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            {assigningId === r.id ? '…' : 'Assign'}
                          </button>
                        )}
                        {result?.success && <span className="flex-shrink-0 text-green-600 text-lg">✓</span>}
                        {result && !result.success && (
                          <button
                            onClick={() => setAssignResults(prev => { const n = {...prev}; delete n[r.id]; return n; })}
                            className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600"
                          >Retry</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setAssignModal(null)} className="w-full border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────
const VendorDashboard = () => {
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();

  // Honour a #hash so the sidebar (and deep links) can open a specific tab.
  const VALID_TABS = ['register', 'recruiters', 'candidates', 'direct-applicants', 'positions',
    'assigned-positions', 'add-position', 'added-positions', 'messages', 'inbox', 'reports'];
  const tabFromHash = () => {
    const h = (window.location.hash || '').replace('#', '').trim();
    return VALID_TABS.includes(h) ? h : 'dashboard';   // land on the dashboard
  };
  const [activeTab, setActiveTab] = useState(tabFromHash);
  const [openGroups, setOpenGroups] = useState({});
  useEffect(() => {
    const onHash = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [vendorInfo, setVendorInfo] = useState(null);
  const [vendorInfoLoaded, setVendorInfoLoaded] = useState(false);
  const [vendorInfoError, setVendorInfoError] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);

  const showExpanded = !isSidebarCollapsed || isHovered;

  const loadVendorInfo = async () => {
    setVendorInfoError(null);
    try {
      const res = await axios.get('/vendor/me', { withCredentials: true });
      const data = res.data?.data;
      setVendorInfo({
        id: data?.id || '',
        name: data?.name || '',
        email: data?.email || '',
        recruiterQuantity: data?.recruiterQuantity ?? 0,
        recruitersUsed: data?.recruitersUsed ?? 0,
        recruitersRemaining: data?.recruitersRemaining ?? 0,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('vendor/me failed:', err.response?.status, msg);
      setVendorInfoError(msg);
      // Don't set recruiterQuantity — leave vendorInfo null so we show a proper error
      setVendorInfo(null);
    } finally {
      setVendorInfoLoaded(true);
    }
  };
  const loadRecruiters = async () => {
    setLoadingRecruiters(true);
    try { const res = await axios.get('/vendor/recruiters', { withCredentials: true }); setRecruiters(res.data.data || []); }
    catch { setRecruiters([]); }
    finally { setLoadingRecruiters(false); }
  };

  useEffect(() => { loadVendorInfo(); loadRecruiters(); }, []);

  const handleLogout = async () => {
    try { await axios.post('/admin/adlogout', {}, { withCredentials: true }); } catch { /* ignore */ }
    dispatch({ type: 'LOGOUT' });
    navigate('/vendor');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
      id: 'teams-group', icon: Users, label: 'My Teams',
      children: [
        { id: 'recruiters', icon: Users, label: 'My Teams' },
        { id: 'register', icon: UserPlus, label: 'Add Recruiter' },
      ],
    },
    {
      id: 'candidates-group', icon: FileText, label: 'Candidates',
      children: [
        { id: 'candidates', icon: FileText, label: 'All Candidates' },
        { id: 'direct-applicants', icon: UserCheck, label: 'Direct Applicants' },
      ],
    },
    {
      id: 'positions-group', icon: Briefcase, label: 'Positions',
      children: [
        { id: 'positions', icon: Briefcase, label: 'Open Positions' },
        { id: 'assigned-positions', icon: ClipboardList, label: 'Assigned Positions' },
        { id: 'add-position', icon: PlusCircle, label: 'Add Position' },
        { id: 'added-positions', icon: FolderOpen, label: 'Added Positions' },
      ],
    },
    { id: 'companies', icon: Building2, label: 'Companies' },
    // Briefings live on their own pages (shared with coaches/experts), so this
    // entry navigates rather than switching a tab.
    {
      id: 'briefings-group', icon: Mic, label: 'Position Briefings',
      children: [
        { id: 'briefings-mine', icon: ClipboardList, label: 'My Briefings', path: '/my-briefings' },
        { id: 'briefings-add', icon: Mic, label: 'Add Briefing', path: '/my-briefings#pending' },
      ],
    },
    // Messages and Inbox are reachable from the floating buttons bottom-right,
    // so they're kept out of the sidebar to avoid duplicating them.
    { id: 'reports', icon: BarChart3, label: 'Reports' },
  ];

  const renderNav = (forMobile = false) => (
    <ul className="space-y-2">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        // Groups expand to reveal their sub-items.
        if (item.children) {
          const groupActive = item.children.some(c => c.id === activeTab);
          const isOpen = openGroups[item.id] ?? groupActive;
          return (
            <li key={item.id}>
              <button
                onClick={() => setOpenGroups(g => ({ ...g, [item.id]: !isOpen }))}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  groupActive ? 'bg-blue-700/60 text-white' : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                } ${(!showExpanded && !forMobile) ? 'justify-center' : ''}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {(showExpanded || forMobile) && (
                  <>
                    <span className="font-medium text-sm flex-1 truncate text-left">{item.label}</span>
                    <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {isOpen && (showExpanded || forMobile) && (
                <ul className="mt-1 ml-4 space-y-1 border-l border-blue-700/60 pl-2">
                  {item.children.map(c => {
                    const CIcon = c.icon;
                    const cActive = activeTab === c.id;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => {
                            setIsMobileSidebarOpen(false);
                            if (c.path) navigate(c.path); else setActiveTab(c.id);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            cActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow' : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                          }`}
                        >
                          <CIcon size={16} className="flex-shrink-0" />
                          <span className="truncate text-left">{c.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        }
        const active = activeTab === item.id;
        return (
          <li key={item.id}>
            <button
              onClick={() => {
                setIsMobileSidebarOpen(false);
                if (item.path) navigate(item.path); else setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                active ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
              } ${(!showExpanded && !forMobile) ? 'justify-center' : ''}`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {(showExpanded || forMobile) && (
                <span className="font-medium text-sm flex-1 truncate text-left">{item.label}</span>
              )}
              {!showExpanded && !isHovered && !forMobile && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const activeLabel = menuItems.find(m => m.id === activeTab)?.label || '';

  const tabContent = {
    dashboard: <VendorDashboardTab onGo={setActiveTab} />,
    register: <RegisterRecruiterTab vendorInfo={vendorInfo} vendorInfoLoaded={vendorInfoLoaded} vendorInfoError={vendorInfoError} onRegistered={() => { loadVendorInfo(); loadRecruiters(); }} onRetry={loadVendorInfo} />,
    recruiters: <MyRecruitersTab recruiters={recruiters} loading={loadingRecruiters} onRefresh={loadRecruiters} />,
    candidates: <Ad_Candi vendorView={true} />,
    positions: <OpenPositionsTab recruiters={recruiters} />,
    'direct-applicants': <Ad_Candi vendorView={true} directOnly={true} />,
    'assigned-positions': <VendorAssignedPositionsTab />,
    'add-position': <Ad_Pos vendorMode={{ onPosted: () => setActiveTab('added-positions') }} />,
    'added-positions': <VendorAddedPositionsTab />,
    'companies': <VendorCompaniesTab />,
    messages: <div className="h-[calc(100vh-160px)] min-h-[520px] bg-white rounded-xl border border-gray-200 overflow-hidden"><ChatPanel /></div>,
    inbox: <div className="h-[calc(100vh-160px)] min-h-[520px] bg-white rounded-xl border border-gray-200 overflow-hidden"><InboxPage title="Inbox" embedded /></div>,
    reports: <ReportsTab />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl transition-all duration-300 ${showExpanded ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700/50">
          <div className="flex items-center justify-between">
            {showExpanded ? (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV" className="w-auto object-contain" style={{ height: '100%' }} />
                </div>
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0">
                  {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
              </>
            ) : (
              <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV" className="w-auto object-contain mx-auto" style={{ height: '100%' }} />
            )}
          </div>
        </div>

        {/* User profile */}
        <div className="p-4 border-b border-blue-700/50">
          <div className={`flex items-center gap-3 ${!showExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'V'}</span>
            </div>
            {showExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.name || 'Vendor'}</p>
                <p className="text-blue-300 text-xs truncate">Vendor</p>
              </div>
            )}
          </div>
        </div>

        {/* Quota badge */}
        {showExpanded && vendorInfo && (
          <div className="mx-4 mt-3 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Hash size={14} className="text-white/70" />
            <span className="text-white/90 text-xs font-semibold">{vendorInfo.recruitersUsed}/{vendorInfo.recruiterQuantity} Recruiters</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          {renderNav(false)}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-700/50">
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all ${!showExpanded ? 'justify-center' : ''}`}>
            <LogOut size={20} className="flex-shrink-0" />
            {showExpanded && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-blue-700/50 flex items-center justify-between">
              <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV" className="w-auto object-contain" style={{ height: '100%' }} />
              <button onClick={() => setIsMobileSidebarOpen(false)} className="text-white hover:text-orange-400"><X size={24} /></button>
            </div>
            <div className="p-4 border-b border-blue-700/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'V'}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user?.name || 'Vendor'}</p>
                <p className="text-blue-300 text-xs">Vendor</p>
              </div>
            </div>
            <nav className="flex-1 py-6 px-3 overflow-y-auto">{renderNav(true)}</nav>
            <div className="p-4 border-t border-blue-700/50">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all">
                <LogOut size={20} /><span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className={`transition-all duration-300 ${showExpanded ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <AnnouncementBar />
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{activeLabel}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Vendor Dashboard</p>
              </div>
            </div>
            {vendorInfo && (
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                <Hash size={14} className="text-blue-600" />
                <span className="text-blue-700 text-sm font-semibold">{vendorInfo.recruitersUsed}/{vendorInfo.recruiterQuantity} Recruiters Used</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {tabContent[activeTab]}
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;
