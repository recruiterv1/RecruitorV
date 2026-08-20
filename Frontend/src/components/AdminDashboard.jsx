import React, { useState, useEffect, useContext } from 'react';
import VendorSpocModal from './VendorSpocModal';
import { useNavigate } from 'react-router-dom';
import { UserStateContext, UserDispatchContext } from '../context/AuthPro';
import axios from 'axios';
import {
  Users,
  Briefcase,
  Database,
  LogOut,
  Menu,
  X,
  User,
  Building2,
  UserCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileBarChart2,
  Wrench,
  UserPlus,
  FilePlus,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  FileText,
  Shuffle,
  Gift,
  Store,
  Hash,
  Edit2,
  Link2,
  Mail,
} from 'lucide-react';

import Footer from '../pages/Footer';
import RecruiterStats from '../pages/RecruiterStats';
import PositionStats from '../pages/PositionStats';
import ClientStats from '../pages/ClientStats';
import CandidateStats from '../pages/CandidateStats';
import CoachExpertStats from '../pages/CoachExpertStats';
import AllCoaches from '../pages/AllCoaches';
import AllExperts from '../pages/AllExperts';
import AllRecruiters from '../pages/AllRecruiters';
import AllClientSpocs from '../pages/AllClientSpocs';
import SuperAdminCoachExpertRequests from '../pages/SuperAdminCoachExpertRequests';
import SuperAdminAssignedPositions from '../pages/SuperAdminAssignedPositions';
import SuperAdminReports from '../pages/SuperAdminReports';
import RecruiterReport from '../pages/RecruiterReport';
import CoachReport from '../pages/CoachReport';
import ExpertReport from '../pages/ExpertReport';
import ClientSpocReport from '../pages/ClientSpocReport';
import PositionReport from '../pages/PositionReport';
import AllVendors from '../pages/AllVendors';
import AdminAddCandidate from '../pages/AdminAddCandidate';
import AllPositions from '../pages/AllPositions';
import SuperAdminSendEmail from '../pages/SuperAdminSendEmail';

const AdminTools = () => {
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const run = async () => {
    if (!window.confirm('This will set accountStatus=approved for every existing recruiter, coach & expert who does not have a status yet. Proceed?')) return;
    setRunning(true); setResult(null);
    try {
      const res = await axios.post('/admin/bulk-approve-existing-users', {}, { withCredentials: true });
      setResult({ ok: true, msg: res.data.message });
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.message || err.message });
    } finally { setRunning(false); }
  };
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Tools</h2>
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Bulk Approve Existing Users</h3>
        <p className="text-sm text-gray-500 mb-4">Run once after enabling the approval gate. Sets <code>accountStatus=approved</code> for every recruiter, coach, and expert who does not have a status yet, so they can continue logging in.</p>
        <button onClick={run} disabled={running}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
          {running ? 'Running…' : 'Run Bulk Approve'}
        </button>
        {result && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${result.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {result.msg}
          </div>
        )}
      </div>
    </div>
  );
};

const PendingUsersPanel = ({ userType }) => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState(null);
  const [resumeModal, setResumeModal] = React.useState(null); // { url, name }
  const [reassignModal, setReassignModal] = React.useState(null); // { user }
  const [reassigning, setReassigning] = React.useState(false);

  const endpoints = {
    expert: '/api/coach-expert/expert/all',
    coach: '/api/coach-expert/coach/all',
    recruiter: '/recruiterstats/all',
  };

  const labels = { expert: 'Expert', coach: 'Coach', recruiter: 'Recruiter' };
  const colors = {
    expert: { badge: 'bg-red-100 text-red-700', ring: 'from-red-500 to-orange-500' },
    coach: { badge: 'bg-orange-100 text-orange-700', ring: 'from-orange-500 to-amber-500' },
    recruiter: { badge: 'bg-green-100 text-green-700', ring: 'from-green-500 to-blue-500' },
  };

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(endpoints[userType], { withCredentials: true });
      const all = res.data.recruiters || res.data.data || [];
      setUsers(all.filter(u => u.accountStatus === 'pending'));
    } catch (err) {
      console.error('PendingUsersPanel fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (u, action) => {
    if (action === 'reject' && !window.confirm(`Delete this ${labels[userType]}? This cannot be undone.`)) return;
    setUpdatingId(u.id);
    try {
      await axios.patch('/admin/user-account-status', { userId: u.id, userType, action }, { withCredentials: true });
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReassign = async (toType) => {
    const u = reassignModal.user;
    setReassigning(true);
    try {
      await axios.post('/admin/reassign-user', { userId: u.id, fromType: userType, toType }, { withCredentials: true });
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setReassignModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Reassign failed');
    } finally {
      setReassigning(false);
    }
  };

  const handleMakeReferrer = async () => {
    const u = reassignModal.user;
    if (!window.confirm(`Move ${u.name} to Referrer? They will receive an email explaining this and how to earn through referrals.`)) return;
    setReassigning(true);
    try {
      await axios.post('/admin/make-referrer', { userId: u.id, fromType: userType }, { withCredentials: true });
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setReassignModal(null);
      alert('✅ User moved to Referrer and email sent successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to make referrer');
    } finally {
      setReassigning(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      const ts = d._seconds ? d._seconds * 1000 : (typeof d === 'string' ? Date.parse(d) : d);
      return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  const col = colors[userType];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
      <span className="text-gray-500 font-medium">Loading pending {labels[userType]}s…</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className={`bg-gradient-to-r ${col.ring} rounded-2xl p-5 mb-6 shadow-lg flex items-center justify-between`}>
        <div>
          <h2 className="text-xl font-bold text-white">Pending {labels[userType]}s</h2>
          <p className="text-white/80 text-sm mt-1">
            {users.length === 0 ? 'No pending registrations' : `${users.length} awaiting approval`}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
          <p className="text-lg font-semibold text-gray-700">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No pending {labels[userType]}s to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(u => {
            const busy = updatingId === u.id;
            const name = u.name || 'Unknown';
            const email = u.email || '—';
            const phone = u.mobile || u.phone || '—';
            const spec = u.specialization || u.experienceCategory || '—';
            const plan = u.userType === 'paid' ? 'Paid' : u.planType === 1 ? 'Paid' : 'Free';
            const resumeUrl = u.resumeUrl;
            return (
              <div key={u.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Card header */}
                <div className={`bg-gradient-to-r ${col.ring} p-4 flex items-center gap-3`}>
                  <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{name}</p>
                    <p className="text-white/80 text-xs truncate">{email}</p>
                  </div>
                  <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full flex-shrink-0">{plan}</span>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="w-4 text-gray-400">📞</span>
                    <span>{phone}</span>
                  </div>
                  {spec !== '—' && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <span className="w-4 text-gray-400 mt-0.5">🎯</span>
                      <span className="line-clamp-2">{spec}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock size={13} className="text-gray-400" />
                    <span>Registered: {formatDate(u.createdAt || u.registrationDate)}</span>
                  </div>
                  {resumeUrl && (
                    <button
                      onClick={() => setResumeModal({ url: resumeUrl, name })}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      <FileText size={13} /> View Resume
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(u, 'approve')}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(u, 'waitlist')}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Clock size={13} /> Waitlist
                    </button>
                    <button
                      onClick={() => handleAction(u, 'reject')}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Trash2 size={13} /> Reject
                    </button>
                  </div>
                  <button
                    onClick={() => setReassignModal({ user: u })}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Shuffle size={13} /> Reassign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reassign modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-full p-2">
                <Shuffle size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reassign User</h3>
                <p className="text-xs text-gray-500 truncate">{reassignModal.user.name} — currently <span className="font-semibold capitalize">{userType}</span></p>
              </div>
              <button onClick={() => setReassignModal(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Assign to:</p>
            <div className="flex gap-2 mb-3">
              {['recruiter', 'coach', 'expert'].filter(t => t !== userType).map(t => {
                const btnColors = {
                  recruiter: 'bg-green-600 hover:bg-green-700',
                  coach: 'bg-orange-500 hover:bg-orange-600',
                  expert: 'bg-red-500 hover:bg-red-600',
                };
                return (
                  <button
                    key={t}
                    onClick={() => handleReassign(t)}
                    disabled={reassigning}
                    className={`flex-1 py-2.5 ${btnColors[t]} disabled:opacity-50 text-white text-sm font-bold rounded-xl capitalize transition-colors`}
                  >
                    {reassigning ? '…' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
            {/* Referrer option */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">Or convert to a referrer role:</p>
              <button
                onClick={handleMakeReferrer}
                disabled={reassigning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <Gift size={14} /> {reassigning ? '…' : 'Make Referrer — Earn by Submitting Candidates'}
              </button>
              <p className="text-xs text-gray-400 mt-1.5 text-center">User gets an apology email + invite to earn as a Referrer</p>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">The user's data will be moved and they will receive an email notification.</p>
          </div>
        </div>
      )}

      {/* Resume preview modal */}
      {resumeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '92vh',
          }}>
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#f97316 100%)',
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <FileText size={22} color="#fff" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#fff' }}>Resume — {resumeModal.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>PDF Preview</p>
              </div>
              <a
                href={resumeModal.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8,
                  fontWeight: 700, fontSize: 12, textDecoration: 'none', cursor: 'pointer',
                }}
              >
                ↗ Open in Tab
              </a>
              <button
                onClick={() => setResumeModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>

            {/* PDF iframe */}
            <div style={{ flex: 1, overflow: 'hidden', background: '#f1f5f9' }}>
              <iframe
                src={resumeModal.url}
                title="Resume Preview"
                style={{ width: '100%', height: '75vh', border: 'none', display: 'block' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Vendor Management panel
// ──────────────────────────────────────────────────────────────
const VendorManagement = () => {
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editModal, setEditModal] = React.useState(null);
  const [newQty, setNewQty] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [assocModal, setAssocModal] = React.useState(null); // { vendor }
  const [unassocRecruiters, setUnassocRecruiters] = React.useState([]);
  const [loadingUnassoc, setLoadingUnassoc] = React.useState(false);
  const [selectedRecs, setSelectedRecs] = React.useState([]);
  const [assocSearch, setAssocSearch] = React.useState('');
  const [assocSaving, setAssocSaving] = React.useState(false);
  const [spocVendor, setSpocVendor] = React.useState(null);
  const [platformBusy, setPlatformBusy] = React.useState(null);

  // Optimistic: flip the card immediately, roll back if the write fails.
  const togglePlatform = async (vendor, allow) => {
    setPlatformBusy(vendor.id);
    setVendors(prev => prev.map(x => x.id === vendor.id ? { ...x, allowPlatformPositions: allow } : x));
    try {
      await axios.patch('/admin/vendor-platform-access', { vendorId: vendor.id, allow }, { withCredentials: true });
    } catch (err) {
      setVendors(prev => prev.map(x => x.id === vendor.id ? { ...x, allowPlatformPositions: !allow } : x));
      alert(err.response?.data?.message || 'Could not update platform access');
    } finally { setPlatformBusy(null); }
  };

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/vendors', { withCredentials: true });
      setVendors(res.data.data || []);
    } catch { setVendors([]); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { loadVendors(); }, []);

  const handleSaveQuota = async () => {
    const qty = parseInt(newQty, 10);
    if (!qty || qty < 1) { alert('Enter a valid quantity (min 1)'); return; }
    setSaving(true);
    try {
      await axios.patch('/admin/vendor-quota', { vendorId: editModal.vendor.id, recruiterQuantity: qty }, { withCredentials: true });
      setVendors(prev => prev.map(v => v.id === editModal.vendor.id ? { ...v, recruiterQuantity: qty } : v));
      setEditModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const openAssocModal = async (vendor) => {
    setAssocModal({ vendor });
    setSelectedRecs([]);
    setAssocSearch('');
    setLoadingUnassoc(true);
    try {
      const res = await axios.get('/admin/recruiters/unassociated', { withCredentials: true });
      setUnassocRecruiters(res.data.data || []);
    } catch { setUnassocRecruiters([]); }
    finally { setLoadingUnassoc(false); }
  };

  const toggleRec = (id) => setSelectedRecs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAssociate = async () => {
    if (!selectedRecs.length) return;
    setAssocSaving(true);
    try {
      const res = await axios.post('/admin/associate-recruiters', { vendorId: assocModal.vendor.id, recruiterIds: selectedRecs }, { withCredentials: true });
      alert(res.data.message);
      setAssocModal(null);
      loadVendors();
    } catch (err) {
      alert(err.response?.data?.message || 'Association failed');
    } finally { setAssocSaving(false); }
  };

  const filteredUnassoc = unassocRecruiters.filter(r =>
    !assocSearch || r.name?.toLowerCase().includes(assocSearch.toLowerCase()) || r.email?.toLowerCase().includes(assocSearch.toLowerCase())
  );

  const fmt = (d) => {
    if (!d) return 'N/A';
    try {
      const ts = d._seconds ? d._seconds * 1000 : typeof d === 'string' ? Date.parse(d) : d;
      return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" /><span className="text-gray-500">Loading vendors…</span></div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-5 mb-6 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Vendor Management</h2>
          <p className="text-white/80 text-sm mt-1">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={loadVendors} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Store size={48} className="mx-auto text-purple-300 mb-3" />
          <p className="text-lg font-semibold text-gray-700">No Vendors Yet</p>
          <p className="text-sm text-gray-400 mt-1">Add vendors from the Add User section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map(v => {
            const pct = v.recruiterQuantity > 0 ? Math.round((v.recruitersUsed / v.recruiterQuantity) * 100) : 0;
            return (
              <div key={v.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {(v.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{v.name}</p>
                    <p className="text-white/75 text-xs truncate">{v.email}</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Recruiters Used</span>
                      <span className="font-bold text-gray-700">{v.recruitersUsed}/{v.recruiterQuantity}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[11px] text-gray-400">Positions added</p>
                      <p className="text-lg font-bold text-gray-800 leading-tight">{v.positionsAdded ?? 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[11px] text-gray-400">On RecruiterV roles</p>
                      <p className="text-lg font-bold text-gray-800 leading-tight">{v.platformPositionsWorking ?? 0}</p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={v.allowPlatformPositions !== false}
                      disabled={platformBusy === v.id}
                      onChange={(e) => togglePlatform(v, e.target.checked)}
                      className="w-4 h-4 accent-blue-600 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-[11px] leading-snug text-gray-600">
                      Team may work <b className="text-gray-800">RecruiterV positions</b>.
                      Unticked, they only see positions this vendor added.
                    </span>
                  </label>

                  <div className="text-[11px] text-gray-500">
                    ClientSPOCs: <b className="text-gray-700">{(v.clientspocs || []).length}</b>
                    {(v.clientspocs || []).length > 0 && (
                      <span className="text-gray-400"> — {(v.clientspocs || []).map(x => x.name || x.email).join(', ')}</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    Added: {fmt(v.createdAt)}{v.upgradedFromCoach && <span className="ml-1 text-purple-500">· upgraded from coach</span>}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditModal({ vendor: v }); setNewQty(String(v.recruiterQuantity)); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      <Edit2 size={13} /> Update Quota
                    </button>
                    <button
                      onClick={() => openAssocModal(v)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      <Link2 size={13} /> Associate
                    </button>
                  </div>
                  <button
                    onClick={() => setSpocVendor(v)}
                    className="w-full py-2 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl transition-colors"
                  >
                    Assign ClientSPOCs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {spocVendor && (
        <VendorSpocModal vendor={spocVendor} onClose={() => setSpocVendor(null)} onSaved={loadVendors} />
      )}

      {/* Edit Quota Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-purple-100 rounded-full p-2"><Hash size={20} className="text-purple-600" /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Update Recruiter Quota</h3>
                <p className="text-xs text-gray-500">{editModal.vendor.name} — currently {editModal.vendor.recruitersUsed} used</p>
              </div>
              <button onClick={() => setEditModal(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">New Recruiter Quantity</label>
            <input
              type="number"
              min="1"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              className="w-full border-2 border-purple-200 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 outline-none mb-2"
              placeholder="e.g. 15"
            />
            {parseInt(newQty, 10) < editModal.vendor.recruitersUsed && (
              <p className="text-xs text-amber-600 mb-3">⚠ New quantity is less than currently used ({editModal.vendor.recruitersUsed}). Existing recruiters won't be removed but new ones can't be added.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditModal(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleSaveQuota} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Associate Recruiters Modal */}
      {assocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-2"><Link2 size={20} className="text-blue-600" /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Associate Existing Recruiters</h3>
                <p className="text-xs text-gray-500">Vendor: {assocModal.vendor.name}</p>
              </div>
              <button onClick={() => setAssocModal(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Select recruiters to link to this vendor. Their plan will be upgraded to Paid. The vendor quota will auto-adjust if needed.</p>
            <input
              type="text"
              value={assocSearch}
              onChange={e => setAssocSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none mb-3"
            />
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingUnassoc ? (
                <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" /><span className="text-gray-400 text-sm">Loading…</span></div>
              ) : filteredUnassoc.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">{assocSearch ? 'No matching recruiters' : 'All recruiters are already associated with a vendor'}</div>
              ) : (
                <div className="space-y-2">
                  {filteredUnassoc.map(r => (
                    <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedRecs.includes(r.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <input type="checkbox" checked={selectedRecs.includes(r.id)} onChange={() => toggleRec(r.id)} className="accent-blue-600 flex-shrink-0" />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(r.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                        <p className="text-xs text-gray-500 truncate">{r.email}{r.mobile ? ` · ${r.mobile}` : ''}</p>
                      </div>
                      {r.planType === 1 && <span className="ml-auto text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">Paid</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => setAssocModal(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleAssociate} disabled={!selectedRecs.length || assocSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                {assocSaving ? 'Associating…' : `Associate ${selectedRecs.length || ''} Recruiter${selectedRecs.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users-all-experts');
  const [openGroups, setOpenGroups] = useState({ users: true });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();

  const showExpanded = !isSidebarCollapsed || isHovered;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch({ type: "LOGOUT" });
      window.location.href = '/clientspoc';
    }
  };

  const menuItems = [
    {
      id: 'add-candidate',
      icon: FilePlus,
      label: 'Add Candidate',
      component: <AdminAddCandidate />
    },
    {
      id: 'users',
      icon: Users,
      label: 'Users',
      children: [
        {
          id: 'users-all-experts',
          icon: User,
          label: 'All Experts',
          component: <AllExperts embedded />
        },
        {
          id: 'users-all-coaches',
          icon: UserCheck,
          label: 'All Coach',
          component: <AllCoaches embedded />
        },
        {
          id: 'users-all-recruiters',
          icon: Users,
          label: 'All Recruiter',
          component: <AllRecruiters embedded />
        },
        {
          id: 'users-all-clientspocs',
          icon: Building2,
          label: 'All ClientSPOC',
          component: <AllClientSpocs embedded />
        },
        {
          id: 'users-all-vendors',
          icon: Store,
          label: 'All Vendor',
          component: <AllVendors embedded />
        },
      ]
    },
    {
      id: 'newly-registered',
      icon: UserPlus,
      label: 'Newly Registered',
      children: [
        {
          id: 'newly-registered-experts',
          icon: User,
          label: 'Experts',
          component: <PendingUsersPanel userType="expert" />
        },
        {
          id: 'newly-registered-coaches',
          icon: UserCheck,
          label: 'Coaches',
          component: <PendingUsersPanel userType="coach" />
        },
        {
          id: 'newly-registered-recruiters',
          icon: Users,
          label: 'Recruiters',
          component: <PendingUsersPanel userType="recruiter" />
        },
      ]
    },
    {
      id: 'statistics',
      icon: Database,
      label: 'Statistics',
      children: [
        {
          id: 'candidatestats',
          icon: Users,
          label: 'Candidate Statistics',
          component: <CandidateStats />
        },
        {
          id: 'recruiterstats',
          icon: Database,
          label: 'Recruiter Statistics',
          component: <RecruiterStats />
        },
        {
          id: 'clientstats',
          icon: Building2,
          label: 'Client Statistics',
          component: <ClientStats />
        },
        {
          id: 'positionstats',
          icon: Briefcase,
          label: 'Position Statistics',
          component: <PositionStats />
        },
        {
          id: 'coach-expert-stats',
          icon: UserCheck,
          label: 'Coach & Expert Stats',
          component: <CoachExpertStats />
        }
      ]
    },
    {
      id: 'all-positions',
      icon: Briefcase,
      label: 'All Positions',
      component: <AllPositions />
    },
    {
      id: 'assigned-positions',
      icon: Users,
      label: 'All Assigned Positions',
      component: <SuperAdminAssignedPositions />
    },
    {
      id: 'superadmin-coach-expert-requests',
      icon: ClipboardList,
      label: 'Coach/Expert Request',
      component: <SuperAdminCoachExpertRequests />
    },
    {
      id: 'reports',
      icon: BarChart3,
      label: 'Reports',
      children: [
        {
          id: 'report-candidate',
          icon: FileBarChart2,
          label: 'Candidate Report',
          component: <SuperAdminReports />
        },
        {
          id: 'report-recruiter',
          icon: FileBarChart2,
          label: 'Recruiter Report',
          component: <RecruiterReport />
        },
        {
          id: 'report-coach',
          icon: FileBarChart2,
          label: 'Coach Report',
          component: <CoachReport />
        },
        {
          id: 'report-expert',
          icon: FileBarChart2,
          label: 'Expert Report',
          component: <ExpertReport />
        },
        {
          id: 'report-clientspoc',
          icon: FileBarChart2,
          label: 'Client SPOC Report',
          component: <ClientSpocReport />
        },
        {
          id: 'report-position',
          icon: FileBarChart2,
          label: 'Position Report',
          component: <PositionReport />
        },
      ]
    },
    {
      id: 'vendor-management',
      icon: Store,
      label: 'Vendor Management',
      component: <VendorManagement />
    },
    {
      id: 'send-email',
      icon: Mail,
      label: 'Send Email',
      component: <SuperAdminSendEmail />
    },
    {
      id: 'admin-tools',
      icon: Wrench,
      label: 'Admin Tools',
      component: <AdminTools />
    },
  ];

  const activeComponent =
    menuItems.find(item => item.id === activeTab)?.component ||
    menuItems.filter(mi => mi.children).flatMap(mi => mi.children).find(ch => ch.id === activeTab)?.component;

  const activeLabel =
    menuItems.find(item => item.id === activeTab)?.label ||
    menuItems.filter(mi => mi.children).flatMap(mi => mi.children).find(ch => ch.id === activeTab)?.label;

  const renderNavItems = (forMobile = false) => (
    <ul className="space-y-2">
      {menuItems.map((item, index) => {
        if (item.children && Array.isArray(item.children)) {
          const Icon = item.icon;
          const isOpen = !!openGroups[item.id];
          return (
            <li key={item.id}>
              <button
                onClick={() => setOpenGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-100 hover:bg-blue-700/50 hover:text-white transition-all ${(!showExpanded && !forMobile) ? 'justify-center' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {(showExpanded || forMobile) && (
                  <span className="font-semibold text-sm flex-1 truncate text-left">{item.label}</span>
                )}
                {(showExpanded || forMobile) && (
                  <span className="text-xs">{isOpen ? '▾' : '▸'}</span>
                )}
              </button>
              <ul className={`mt-1 space-y-1 ${isOpen ? '' : 'hidden'}`}>
                {item.children.map((child, cidx) => {
                  const ChildIcon = child.icon;
                  const active = activeTab === child.id;
                  return (
                    <li key={child.id}>
                      <button
                        onClick={() => {
                          setActiveTab(child.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                          active
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                            : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                        } ${(!showExpanded && !forMobile) ? 'justify-center' : 'pl-8'}`}
                      >
                        <ChildIcon size={18} className="flex-shrink-0" />
                        {(showExpanded || forMobile) && (
                          <span className="text-sm flex-1 truncate text-left opacity-0 animate-fadeIn" style={{ animationDelay: `${220 + cidx * 30}ms` }}>
                            {child.label}
                          </span>
                        )}
                        {!showExpanded && !isHovered && !forMobile && (
                          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                            {child.label}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        } else {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                } ${(!showExpanded && !forMobile) ? 'justify-center' : ''}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {(showExpanded || forMobile) && (
                  <span className="font-medium text-sm flex-1 truncate text-left opacity-0 animate-fadeIn" style={{ animationDelay: `${200 + index * 30}ms` }}>
                    {item.label}
                  </span>
                )}
                {!showExpanded && !isHovered && !forMobile && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>
            </li>
          );
        }
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">

      {/* ========== SIDEBAR - DESKTOP ========== */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl transition-all duration-300 ${showExpanded ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700/50">
          <div className="flex items-center justify-between">
            {showExpanded ? (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src="https://www.recruiterv.com/recruitorV.png"
                    alt="RecruiterV Logo"
                    className="w-auto object-contain opacity-0 animate-fadeIn"
                    style={{ height: '100%', animationDelay: '100ms' }}
                  />
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
                >
                  {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
              </>
            ) : (
              <img
                src="https://www.recruiterv.com/recruitorV.png"
                alt="RecruiterV Logo"
                className="w-auto object-contain mx-auto"
                style={{ height: '100%' }}
              />
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-blue-700/50">
          <div className={`flex items-center gap-3 ${!showExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            {showExpanded && (
              <div className="flex-1 min-w-0 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
                <p className="text-white font-semibold text-sm truncate">{user?.name || 'Admin'}</p>
                <p className="text-blue-300 text-xs truncate">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
          {renderNavItems(false)}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-700/50">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${!showExpanded ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {showExpanded && (
              <span className="font-medium text-sm opacity-0 animate-fadeIn" style={{ animationDelay: '300ms' }}>Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* ========== SIDEBAR - MOBILE ========== */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-2xl animate-slide-in">
            <div className="p-6 border-b border-blue-700/50">
              <div className="flex items-center justify-between">
                <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV Logo" className="w-auto object-contain" style={{ height: '100%' }} />
                <button onClick={() => setIsMobileSidebarOpen(false)} className="text-white hover:text-orange-400 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-4 border-b border-blue-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name || 'Admin'}</p>
                  <p className="text-blue-300 text-xs">Administrator</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 py-6 px-3 overflow-y-auto">
              {renderNavItems(true)}
            </nav>
            <div className="p-4 border-t border-blue-700/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div className={`transition-all duration-300 ${showExpanded ? 'lg:pl-64' : 'lg:pl-20'}`}>

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-md border-b-2 border-blue-100">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}! 👋
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">{activeLabel || 'Dashboard'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-orange-50 px-3 py-2 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-xs">{user?.name?.charAt(0) || 'A'}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden lg:block">{user?.name || 'Admin'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-screen">
          <React.Fragment key={activeTab}>
            {activeComponent}
          </React.Fragment>
        </main>

        <Footer />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }

        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }

        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(30,58,138,0.3); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.5); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.7); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
export { PendingUsersPanel, VendorManagement };
