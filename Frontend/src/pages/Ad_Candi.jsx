import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  Users, Download, TrendingUp, Eye, Calendar, MapPin, Phone,
  Mail, Award, Send, Filter, X, FileSpreadsheet, Briefcase,
  User, DollarSign, Clock, Building, Hash, FileText, ChevronDown,
  ExternalLink, Layers, Star, CheckCircle, AlertCircle, Camera,
} from 'lucide-react';
import {
  Box, Dialog, DialogContent, Button, TextField,
  Autocomplete, Chip, IconButton, CircularProgress,
} from '@mui/material';
import * as XLSX from 'xlsx';
import AiMatchInfo from '../components/AiMatchInfo';
import { formatCommission } from '../lib/commission';
import CvPreview from '../components/CvPreview';

// True when the AI auto-rejected this candidate via CV↔JD screening
const aiRejected = (c) => c?.statusChangedBy === 'ai-screening' ||
  ((c?.matchPercent !== undefined && c?.matchPercent !== null) && c.matchPercent <= 50);

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'screen reject':                   { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'cv feedback pending':             { bg:'#fef9c3', text:'#854d0e', border:'#fde047' },
  submitted:                         { bg:'#ede9fe', text:'#5b21b6', border:'#c4b5fd' },
  'l1 to be schedule':               { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'l1 scheduled':                    { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'l1 feedback pending':             { bg:'#fef9c3', text:'#854d0e', border:'#fde047' },
  'l1 reject':                       { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'l2 to be schedule':               { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'l2 scheduled':                    { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'l2 feedback pending':             { bg:'#fef9c3', text:'#854d0e', border:'#fde047' },
  'l2 reject':                       { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'l3 to be schedule':               { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'l3 scheduled':                    { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'l3 feedback pending':             { bg:'#fef9c3', text:'#854d0e', border:'#fde047' },
  'l3 reject':                       { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'hr to be schedule':               { bg:'#e0f2fe', text:'#075985', border:'#7dd3fc' },
  'hr scheduled':                    { bg:'#e0f2fe', text:'#075985', border:'#7dd3fc' },
  'hr feedback pending':             { bg:'#fef9c3', text:'#854d0e', border:'#fde047' },
  'hr reject':                       { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'background verification pending': { bg:'#fef9c3', text:'#854d0e', border:'#fde047' },
  'background verification reject':  { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'negotiation scheduled':           { bg:'#fdf4ff', text:'#7e22ce', border:'#e9d5ff' },
  'negotiation reject':              { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'to be offered':                   { bg:'#dcfce7', text:'#166534', border:'#86efac' },
  'offer declined':                  { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'offer accepted':                  { bg:'#dcfce7', text:'#166534', border:'#86efac' },
  joining:                           { bg:'#dcfce7', text:'#166534', border:'#86efac' },
  'test assigned':                   { bg:'#e0f2fe', text:'#075985', border:'#7dd3fc' },
  'test select':                     { bg:'#dcfce7', text:'#166534', border:'#86efac' },
  'test reject':                     { bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' },
  'client drop':                     { bg:'#f3f4f6', text:'#374151', border:'#d1d5db' },
  'candidate drop':                  { bg:'#f3f4f6', text:'#374151', border:'#d1d5db' },
  duplicate:                         { bg:'#f3f4f6', text:'#374151', border:'#d1d5db' },
  'position on hold':                { bg:'#ffedd5', text:'#9a3412', border:'#fdba74' },
};
const sc = (s) => STATUS_COLORS[(s || '').toLowerCase()] || { bg:'#f3f4f6', text:'#374151', border:'#d1d5db' };

const StatusBadge = ({ status }) => {
  const c = sc(status);
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {status || '—'}
    </span>
  );
};

// ── Status options ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  'Screen Reject','CV Feedback Pending','Submitted',
  'L1 To be Schedule','L1 Scheduled','L1 Feedback Pending','L1 Reject',
  'L2 To be Schedule','L2 Scheduled','L2 Feedback Pending','L2 Reject',
  'L3 To be Schedule','L3 Scheduled','L3 Feedback Pending','L3 Reject',
  'HR To be Schedule','HR Scheduled','HR Feedback Pending','HR Reject',
  'Background Verification Pending','Background Verification Reject',
  'Negotiation Scheduled','Negotiation Reject',
  'To Be Offered','Offer Declined','Offer Accepted','Joining',
  'Test Assigned','Test Select','Test Reject',
  'Client Drop','Candidate Drop','Duplicate','Position On Hold',
];

// Predefined reasons shown when a candidate is set to "Screen Reject". One must
// be selected; the backend emails the sharing recruiter the matching guidance.
const SCREEN_REJECT_REASONS = [
  'Experience Short', 'Experience High', 'Skill Mismatch', 'Notice Period',
  'Budget Mismatch', 'Notice Verification', 'Relevant Experience', 'Job Stability',
  'Recent Switch', 'Employer Concern', 'Employment Gap', 'Location Mismatch',
  'Industry Mismatch', 'Communication', 'Skills Not Evident',
];

// ── Info row for modal ────────────────────────────────────────────────────────
const InfoItem = ({ icon: Icon, label, value, color = '#6b7280' }) => {
  if (!value) return null;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
      <Icon size={14} color={color} style={{ flexShrink:0, marginTop:3 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', marginBottom:1 }}>{label}</div>
        <div style={{ fontSize:13, color:'#1f2937', fontWeight:500, wordBreak:'break-word' }}>{value}</div>
      </div>
    </div>
  );
};

// ── Position detail modal ─────────────────────────────────────────────────────
const PositionModal = ({ posId, onClose }) => {
  const [pos, setPos]         = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!posId) return;
    setLoading(true);
    axios.get(`/candidate/position/${posId}`)
      .then(r => setPos(r.data))
      .catch(() => setPos(null))
      .finally(() => setLoading(false));
  }, [posId]);

  const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  return (
    <Dialog open={!!posId} onClose={onClose} maxWidth={false}
      PaperProps={{ sx: { borderRadius:'20px', overflow:'hidden', maxWidth:720, width:'100%', m:1, zIndex:1500 } }}>
      <DialogContent sx={{ p:0 }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#7c3aed 60%,#2563eb 100%)', padding:'24px 28px', position:'relative' }}>
          <IconButton onClick={onClose} size="small"
            sx={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.2)', color:'#fff', '&:hover':{ background:'rgba(255,255,255,0.35)' } }}>
            <X size={16} />
          </IconButton>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Briefcase size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.65)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Position Details</div>
              <h2 style={{ margin:0, fontSize:'1.3rem', fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                {loading ? 'Loading…' : (pos?.position || '—')}
              </h2>
              {pos?.client && (
                <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap:5 }}>
                  <Building size={12} /> {pos.client}
                  {pos.pos_id && <span style={{ marginLeft:8, background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'1px 9px', fontSize:11 }}>#{pos.pos_id}</span>}
                </p>
              )}
            </div>
            {pos?.status && (
              <span style={{ marginLeft:'auto', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', borderRadius:20, padding:'4px 14px', fontSize:12, fontWeight:700, flexShrink:0 }}>
                {pos.status}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'22px 28px', maxHeight:'70vh', overflowY:'auto' }}>
          {loading && (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
              <CircularProgress size={32} sx={{ color:'#7c3aed' }} />
            </div>
          )}
          {!loading && !pos && (
            <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>
              <AlertCircle size={36} color="#d1d5db" style={{ marginBottom:10 }} />
              <p>Position details not found</p>
            </div>
          )}
          {!loading && pos && (
            <>
              {/* Key Info Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'0 28px' }}>
                {pos.hr_name && <InfoItem icon={User}       label="HR Contact"     value={pos.hr_name}           color="#0891b2" />}
                {pos.clientspoc_name && <InfoItem icon={User} label="Client SPOC"  value={pos.clientspoc_name}   color="#7c3aed" />}
                {pos.clientspoc && <InfoItem icon={Mail}    label="SPOC Email"     value={pos.clientspoc}        color="#6b7280" />}
                {(pos.ctcStart || pos.ctcEnd) && (
                  <InfoItem icon={DollarSign} label="CTC Range"
                    value={[pos.ctcStart, pos.ctcEnd].filter(Boolean).map(v => `₹${v} LPA`).join(' – ')}
                    color="#059669" />
                )}
                {pos.experience && <InfoItem icon={Clock}      label="Experience"   value={`${pos.experience} yrs`} color="#d97706" />}
                {arr(pos.location).length > 0 && (
                  <InfoItem icon={MapPin} label="Location" value={arr(pos.location).join(', ')} color="#2563eb" />
                )}
                {pos.pos_cat && <InfoItem icon={Layers}    label="Category"       value={pos.pos_cat}           color="#7c3aed" />}
                {pos.commison && <InfoItem icon={Award}    label="Commission"     value={formatCommission(pos.commison, pos.commission_type)} color="#d97706" />}
              </div>

              {/* Skills sections */}
              {arr(pos.m_have).length > 0 && (
                <div style={{ marginTop:18 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:1, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <Star size={12} /> Must Have Skills
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {arr(pos.m_have).map((s, i) => (
                      <span key={i} style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe', borderRadius:20, padding:'3px 11px', fontSize:12, fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {arr(pos.g_have).length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#0891b2', textTransform:'uppercase', letterSpacing:1, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <CheckCircle size={12} /> Good To Have
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {arr(pos.g_have).map((s, i) => (
                      <span key={i} style={{ background:'#e0f2fe', color:'#0891b2', border:'1px solid #bae6fd', borderRadius:20, padding:'3px 11px', fontSize:12 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description */}
              {pos.job_desc && (
                <div style={{ marginTop:18 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Job Description</div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.7, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', whiteSpace:'pre-wrap', maxHeight:200, overflowY:'auto' }}>
                    {pos.job_desc}
                  </div>
                </div>
              )}

              {/* Key Responsibilities */}
              {pos.key_res && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Key Responsibilities</div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.7, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', whiteSpace:'pre-wrap', maxHeight:180, overflowY:'auto' }}>
                    {pos.key_res}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 28px', borderTop:'1px solid #f3f4f6' }}>
          <button onClick={onClose}
            style={{ padding:'8px 22px', background:'#f8fafc', color:'#374151', border:'1.5px solid #e2e8f0', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── CV viewer modal (iframe) ──────────────────────────────────────────────────
const CVModal = ({ url, onClose }) => {
  return (
    <Dialog open={!!url} onClose={onClose} maxWidth={false}
      PaperProps={{ sx: { borderRadius:'20px', overflow:'hidden', maxWidth:920, width:'100%', m:1, zIndex:1500 } }}>
      <DialogContent sx={{ p:0 }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', padding:'14px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <FileText size={18} color="#fff" />
            <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>CV Preview</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button
              onClick={() => window.open(url, '_blank')}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <ExternalLink size={13} /> Open in New Tab
            </button>
            <IconButton onClick={onClose} size="small" sx={{ color:'#fff' }}><X size={16} /></IconButton>
          </div>
        </div>
        {/* preview */}
        <CvPreview url={url} height="78vh" />
      </DialogContent>
    </Dialog>
  );
};

// ── Candidate detail modal ────────────────────────────────────────────────────
const CandidateModal = ({ candidate, onClose, onStatusChange, onEmail, onViewPosition, onViewCV, hideRecruiterInfo = false, clientSpocView = false, onCandidateUpdate }) => {
  const [status, setStatus]     = useState(candidate?.statusa || '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [rejectReason, setRejectReason] = useState(candidate?.rejectReason || '');
  const [statusError, setStatusError]   = useState('');

  // Edit mode state
  const [editMode, setEditMode]   = useState(false);
  const [editData, setEditData]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved]   = useState(false);
  const [editError, setEditError]   = useState('');

  useEffect(() => {
    setStatus(candidate?.statusa || '');
    setSaved(false);
    setRejectReason(candidate?.rejectReason || '');
    setStatusError('');
    setEditMode(false);
    setEditError('');
    if (candidate) {
      setEditData({
        candidate:         candidate.candidate         || '',
        emails:            candidate.emails            || '',
        mob:               candidate.mob               || '',
        curr_emp:          candidate.curr_emp          || '',
        highest_education: candidate.highest_education || '',
        current_ctc:       candidate.current_ctc       || '',
        exp_ctc:           candidate.exp_ctc           || '',
        total_exp:         candidate.total_exp         || '',
        rel_exp:           candidate.rel_exp           || '',
        notice_period:     candidate.notice_period     || '',
        curr_state:        candidate.curr_state        || '',
        curr_loc:          candidate.curr_loc          || '',
        pref_state:        candidate.pref_state        || '',
        pref_loc:          candidate.pref_loc          || '',
        dob:               candidate.dob               || '',
      });
    }
  }, [candidate?.id]);

  if (!candidate) return null;

  const initials = (candidate.candidate || 'C').charAt(0).toUpperCase();

  const isReject = INACTIVE_STATUSES.has(status);
  const isScreenReject = (status || '').toLowerCase().trim() === 'screen reject';
  const reasonDirty = isReject && (rejectReason || '').trim() !== (candidate.rejectReason || '').trim();
  const statusDirty = status !== candidate.statusa;

  const handleSave = async () => {
    if (!statusDirty && !reasonDirty) return;
    // A rejection reason is mandatory whenever a reject-type status is selected.
    if (isReject && !(rejectReason || '').trim()) {
      setStatusError('Please provide a reason for rejection.');
      return;
    }
    setStatusError('');
    setSaving(true);
    await onStatusChange(candidate.id, status, isReject ? rejectReason.trim() : '');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await axios.patch(`/addit/update/direct-applicant/${candidate.id}`, editData, { withCredentials: true });
      setEditSaved(true);
      setEditMode(false);
      // Merge edits back into the local row so modal reflects new values immediately
      if (onCandidateUpdate) onCandidateUpdate(candidate.id, editData);
      setTimeout(() => setEditSaved(false), 3000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const ef = (key) => ({
    value: editData[key] ?? '',
    onChange: e => setEditData(prev => ({ ...prev, [key]: e.target.value })),
  });

  const inputStyle = {
    width: '100%', padding: '7px 11px', borderRadius: 8, fontSize: 13,
    border: '1.5px solid #cbd5e1', outline: 'none', background: '#fff',
    fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, display: 'block' };

  const c = sc(status);

  return (
    <Dialog open={!!candidate} onClose={onClose} maxWidth={false}
      PaperProps={{ sx: { borderRadius:'20px', overflow:'hidden', maxWidth:860, width:'100%', m:1 } }}>
      <DialogContent sx={{ p:0 }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#f97316 100%)', padding:'28px 28px 24px', position:'relative' }}>
          <IconButton onClick={onClose} size="small"
            sx={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.2)', color:'#fff',
              '&:hover':{ background:'rgba(255,255,255,0.35)' } }}>
            <X size={16} />
          </IconButton>

          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt={candidate.candidate || ''} title="Candidate photo"
                style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover', border:'2.5px solid rgba(255,255,255,0.6)', flexShrink:0 }} />
            ) : (
              <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26, fontWeight:800, color:'#fff', flexShrink:0 }}>
                {initials}
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>
                Candidate Profile
              </div>
              <h2 style={{ margin:0, fontSize:'1.4rem', fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                {editMode ? (editData.candidate || candidate.candidate || '—') : (candidate.candidate || '—')}
              </h2>
              <p style={{ margin:'6px 0 0', opacity:0.85, fontSize:'0.88rem', color:'#fff' }}>
                {candidate.pos_name || '—'} &nbsp;·&nbsp; {candidate.client || '—'}
              </p>
              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                {candidate.cv_data && (
                  <button
                    onClick={() => onViewCV(candidate.cv_data)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px',
                      background:'rgba(255,255,255,0.2)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.45)',
                      borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', backdropFilter:'blur(4px)' }}
                  >
                    <Eye size={13} /> View CV
                  </button>
                )}
                {candidate.photo_url && (
                  <a href={candidate.photo_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px',
                      background:'rgba(255,255,255,0.2)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.45)',
                      borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', backdropFilter:'blur(4px)', textDecoration:'none' }}
                  >
                    <Camera size={13} /> View Photo
                  </a>
                )}
                <button
                  onClick={() => onEmail(candidate)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px',
                    background:'rgba(255,255,255,0.2)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.45)',
                    borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', backdropFilter:'blur(4px)' }}
                >
                  <Mail size={13} /> Email Recruiter
                </button>
                {/* Edit toggle — only for clientSpocView */}
                {clientSpocView && !editMode && (
                  <button
                    onClick={() => { setEditMode(true); setEditError(''); setEditSaved(false); }}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px',
                      background:'rgba(255,193,7,0.25)', color:'#fff', border:'1.5px solid rgba(255,193,7,0.6)',
                      borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', backdropFilter:'blur(4px)' }}
                  >
                    ✏️ Edit Details
                  </button>
                )}
                {clientSpocView && editMode && (
                  <button
                    onClick={() => { setEditMode(false); setEditError(''); }}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px',
                      background:'rgba(255,255,255,0.15)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.4)',
                      borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}
                  >
                    ✕ Cancel Edit
                  </button>
                )}
              </div>
            </div>
            <StatusBadge status={candidate.statusa} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'24px 28px', maxHeight:'72vh', overflowY:'auto' }}>

          {/* ── Edit success banner ── */}
          {editSaved && (
            <div style={{ background:'#dcfce7', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, color:'#166534', fontSize:13, fontWeight:600 }}>
              <CheckCircle size={16} /> Candidate details saved successfully!
            </div>
          )}
          {editError && (
            <div style={{ background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:10, padding:'10px 16px', marginBottom:16, color:'#991b1b', fontSize:13, fontWeight:600 }}>
              ⚠ {editError}
            </div>
          )}

          {/* ── Status management ── */}
          <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'16px 20px', marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
              Update Status
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setSaved(false); }}
                style={{
                  flex:1, minWidth:200, padding:'8px 14px', borderRadius:10, fontSize:13, fontWeight:600,
                  border:`2px solid ${c.border}`, background:c.bg, color:c.text, cursor:'pointer', outline:'none',
                }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={handleSave}
                disabled={saving || (!statusDirty && !reasonDirty)}
                style={{
                  padding:'8px 22px', borderRadius:10, fontWeight:700, fontSize:13, border:'none', cursor:'pointer',
                  background: saved ? '#059669' : ((!statusDirty && !reasonDirty) ? '#e5e7eb' : 'linear-gradient(135deg,#2563eb,#f97316)'),
                  color: (!statusDirty && !reasonDirty) ? '#9ca3af' : '#fff',
                  transition:'all 0.2s', minWidth:100,
                }}
              >
                {saving ? <CircularProgress size={14} sx={{ color:'#fff' }} /> : saved ? '✓ Saved!' : 'Save Status'}
              </button>
            </div>

            {/* Mandatory rejection reason — shown for any reject-type status */}
            {isReject && (
              <div style={{ marginTop:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#475569', display:'block', marginBottom:6 }}>
                  Reason for rejection <span style={{ color:'#dc2626' }}>*</span>
                </label>
                {isScreenReject ? (
                  <select
                    value={SCREEN_REJECT_REASONS.includes(rejectReason) ? rejectReason : ''}
                    onChange={e => { setRejectReason(e.target.value); setStatusError(''); setSaved(false); }}
                    style={{
                      width:'100%', padding:'10px 12px', borderRadius:10, fontSize:13,
                      border:`1.5px solid ${statusError ? '#fca5a5' : '#cbd5e1'}`, outline:'none',
                      boxSizing:'border-box', fontFamily:'inherit', background:'#fff', cursor:'pointer',
                    }}
                  >
                    <option value="">— Select a reason —</option>
                    {SCREEN_REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <textarea
                    value={rejectReason}
                    onChange={e => { setRejectReason(e.target.value); setStatusError(''); setSaved(false); }}
                    placeholder="Explain why this candidate is being rejected…"
                    rows={3}
                    style={{
                      width:'100%', padding:'10px 12px', borderRadius:10, fontSize:13, lineHeight:1.5,
                      border:`1.5px solid ${statusError ? '#fca5a5' : '#cbd5e1'}`, outline:'none',
                      resize:'vertical', boxSizing:'border-box', fontFamily:'inherit',
                    }}
                  />
                )}
                {isScreenReject && (
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                    The selected reason&apos;s guidance email will be sent to the recruiter who shared this profile.
                  </div>
                )}
                {statusError && (
                  <div style={{ color:'#dc2626', fontSize:12, marginTop:6, fontWeight:600 }}>⚠ {statusError}</div>
                )}
              </div>
            )}
          </div>

          {/* ── EDIT FORM (clientSpocView only) ── */}
          {editMode && clientSpocView && (
            <div style={{ background:'#fffbeb', border:'2px solid #fcd34d', borderRadius:14, padding:'20px 22px', marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>
                ✏️ Edit Candidate Details
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                {[
                  { key:'candidate',         label:'Full Name' },
                  { key:'emails',            label:'Email' },
                  { key:'mob',               label:'Mobile' },
                  { key:'curr_emp',          label:'Current Employer' },
                  { key:'highest_education', label:'Highest Education' },
                  { key:'current_ctc',       label:'Current CTC (LPA)' },
                  { key:'exp_ctc',           label:'Expected CTC (LPA)' },
                  { key:'total_exp',         label:'Total Experience (yrs)' },
                  { key:'rel_exp',           label:'Relevant Experience (yrs)' },
                  { key:'notice_period',     label:'Notice Period (days)' },
                  { key:'curr_loc',          label:'Current City' },
                  { key:'curr_state',        label:'Current State' },
                  { key:'pref_loc',          label:'Preferred City' },
                  { key:'pref_state',        label:'Preferred State' },
                  { key:'dob',               label:'Date of Birth' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input {...ef(key)} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:18 }}>
                <button
                  onClick={() => { setEditMode(false); setEditError(''); }}
                  style={{ padding:'8px 20px', borderRadius:10, fontWeight:600, fontSize:13, border:'1.5px solid #d1d5db', background:'#fff', color:'#374151', cursor:'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  style={{ padding:'8px 24px', borderRadius:10, fontWeight:700, fontSize:13, border:'none', cursor:'pointer',
                    background:'linear-gradient(135deg,#f59e0b,#f97316)', color:'#fff', minWidth:120,
                    opacity: editSaving ? 0.7 : 1 }}
                >
                  {editSaving ? <CircularProgress size={14} sx={{ color:'#fff' }} /> : '💾 Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Candidate section ── */}
          <div style={{ fontSize:12, fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:0.6, margin:'2px 0 8px', paddingBottom:6, borderBottom:'2px solid #eef2f7' }}>Candidate</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0 28px' }}>
            <InfoItem icon={Mail}     label="Candidate Email"   value={candidate.emails || candidate.email}          color="#2563eb" />
            <InfoItem icon={Phone}    label="Mobile"            value={candidate.mob}                                color="#059669" />
            {/* Position — clickable */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
              <Briefcase size={14} color="#7c3aed" style={{ flexShrink:0, marginTop:3 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', marginBottom:1 }}>Position</div>
                <button
                  onClick={() => candidate.pos_id && onViewPosition(candidate.pos_id)}
                  disabled={!candidate.pos_id}
                  style={{ fontSize:13, color: candidate.pos_id ? '#2563eb' : '#1f2937', fontWeight:600, background:'none', border:'none', padding:0, cursor: candidate.pos_id ? 'pointer' : 'default',
                    textDecoration: candidate.pos_id ? 'underline' : 'none', textDecorationStyle:'dotted', wordBreak:'break-word', textAlign:'left' }}>
                  {candidate.pos_name || '—'}
                  {candidate.pos_id && <ExternalLink size={11} style={{ marginLeft:5, verticalAlign:'middle', opacity:0.6 }} />}
                </button>
              </div>
            </div>
            <InfoItem icon={Building} label="Client"            value={candidate.client}                             color="#6b7280" />
            <InfoItem icon={Clock}    label="Relevant Exp"      value={candidate.rel_exp ? `${candidate.rel_exp} yrs` : null} color="#7c3aed" />
            <InfoItem icon={TrendingUp} label="Total Exp"       value={candidate.total_exp ? `${candidate.total_exp} yrs` : null} color="#7c3aed" />
            <InfoItem icon={DollarSign} label="Current CTC"     value={candidate.current_ctc ? `₹${candidate.current_ctc} LPA` : null} color="#059669" />
            <InfoItem icon={DollarSign} label="Expected CTC"    value={candidate.exp_ctc ? `₹${candidate.exp_ctc} LPA` : null} color="#059669" />
            <InfoItem icon={Clock}    label="Notice Period"     value={candidate.notice_period ? `${candidate.notice_period} days` : null} color="#f97316" />
            <InfoItem icon={MapPin}   label="Current Location"  value={[candidate.curr_loc, candidate.curr_state].filter(Boolean).join(', ')} color="#2563eb" />
            <InfoItem icon={MapPin}   label="Preferred Location"value={[candidate.pref_loc, candidate.pref_state].filter(Boolean).join(', ')} color="#f97316" />
            <InfoItem icon={Building} label="Current Employer"  value={candidate.curr_emp}                          color="#6b7280" />
            <InfoItem icon={Hash}     label="RH ID"             value={candidate.rh_id}                             color="#0891b2" />
            <InfoItem icon={Award}    label="Highest Education" value={candidate.highest_education}                  color="#7c3aed" />
            <InfoItem icon={Calendar} label="Date of Birth"      value={candidate.dob}                               color="#7c3aed" />
            <InfoItem icon={Hash}     label="PAN Number"        value={candidate.pan_number}                        color="#6b7280" />
            <InfoItem icon={Hash}     label="JR Number"         value={candidate.jr_number}                         color="#6b7280" />
            <InfoItem icon={Award}    label="Offer in Hand"     value={candidate.offer_hand}                        color="#d97706" />
            <InfoItem icon={Calendar} label="Offer & DOJ"       value={candidate.offer_amt}                         color="#d97706" />
          </div>

          {/* ── Submitter section — Coach / Expert / Recruiter depending on who submitted ── */}
          {!hideRecruiterInfo && (() => {
            const role = ['Coach', 'Expert', 'Recruiter'].includes(candidate.recRole) ? candidate.recRole : 'Recruiter';
            return (
              <>
                <div style={{ fontSize:12, fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:0.6, margin:'18px 0 8px', paddingBottom:6, borderBottom:'2px solid #eef2f7' }}>{role}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0 28px' }}>
                  <InfoItem icon={User}  label={role}              value={candidate.recName}  color="#2563eb" />
                  <InfoItem icon={Mail}  label={`${role} Email`}   value={candidate.recEmail} color="#6b7280" />
                  <InfoItem icon={Phone} label={`${role} Phone`}   value={candidate.recPhone} color="#0891b2" />
                </div>
              </>
            );
          })()}

          {/* ── Skills ── */}
          {(candidate.tech_skill?.length > 0 || candidate.nontech_skill?.length > 0) && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Skills</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(Array.isArray(candidate.tech_skill) ? candidate.tech_skill : []).map((s, i) => (
                  <span key={i} style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:20, padding:'3px 10px', fontSize:12 }}>{s}</span>
                ))}
                {(Array.isArray(candidate.nontech_skill) ? candidate.nontech_skill : []).map((s, i) => (
                  <span key={i} style={{ background:'#fff7ed', color:'#c2410c', border:'1px solid #fed7aa', borderRadius:20, padding:'3px 10px', fontSize:12 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid #e5e7eb' }}>
            <button
              onClick={onClose}
              style={{ padding:'9px 22px', background:'#f8fafc', color:'#374151',
                border:'1.5px solid #e2e8f0', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Email dialog ──────────────────────────────────────────────────────────────
const EmailDialog = ({ open, candidate, onClose }) => {
  const [emailData, setEmailData] = useState({ subject:'', message:'' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (candidate) {
      setEmailData({
        subject: `${candidate.pos_name} | ${candidate.candidate} | ${candidate.client}`,
        message: `Dear ${candidate.recName},\n\n`,
      });
    }
  }, [candidate?.id]);

  const handleSend = async () => {
    if (!emailData.subject || !emailData.message) { alert('Fill subject and message'); return; }
    setSending(true);
    try {
      await axios.post('/addit/send/email', {
        to: candidate.recEmail,
        subject: emailData.subject,
        message: emailData.message,
        candidateId: candidate.id,
        candidateName: candidate.candidate,
        position: candidate.pos_name,
        client: candidate.client,
        recName: candidate.recName,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Email failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const quickFill = (type) => {
    if (!candidate) return;
    if (type === 'status') {
      setEmailData({
        subject: `Status Update — ${candidate.pos_name} | ${candidate.candidate}`,
        message: `Dear ${candidate.recName},\n\nThe status of your candidate ${candidate.candidate} for the position ${candidate.pos_name} at ${candidate.client} has been updated to: ${candidate.statusa}\n\nBest regards,\nRecruitment Team`,
      });
    } else {
      setEmailData({
        subject: `Interview Schedule — ${candidate.pos_name} | ${candidate.candidate}`,
        message: `Dear ${candidate.recName},\n\nPlease find below the interview schedule for your candidate ${candidate.candidate} for the ${candidate.pos_name} position at ${candidate.client}.\n\nDate & Time: \nMode: \n\nBest regards,\nRecruitment Team`,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius:'16px', overflow:'hidden' } }}>
      <div style={{ background:'linear-gradient(135deg,#2563eb,#f97316)', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Mail size={20} color="#fff" />
          <span style={{ color:'#fff', fontWeight:700, fontSize:16 }}>Email to {candidate?.recName}</span>
        </div>
        <IconButton onClick={onClose} size="small" sx={{ color:'#fff' }}><X size={16} /></IconButton>
      </div>

      <DialogContent sx={{ p:3 }}>
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {['status','schedule'].map(t => (
            <button key={t} onClick={() => quickFill(t)}
              style={{ padding:'4px 12px', background: t==='status' ? '#eff6ff' : '#f0fdf4',
                color: t==='status' ? '#2563eb' : '#166534', border:`1px solid ${t==='status' ? '#bfdbfe' : '#86efac'}`,
                borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {t === 'status' ? 'Status Update Template' : 'Interview Schedule Template'}
            </button>
          ))}
        </div>
        <TextField fullWidth label="To" value={candidate?.recEmail || ''} disabled size="small" sx={{ mb:2 }} />
        <TextField fullWidth label="Subject" value={emailData.subject}
          onChange={e => setEmailData(d => ({ ...d, subject: e.target.value }))} size="small" sx={{ mb:2 }} />
        <TextField fullWidth label="Message" value={emailData.message}
          onChange={e => setEmailData(d => ({ ...d, message: e.target.value }))}
          multiline rows={7} size="small" />
      </DialogContent>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'12px 22px', borderTop:'1px solid #e5e7eb' }}>
        <button onClick={onClose}
          style={{ padding:'8px 18px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          Cancel
        </button>
        <button onClick={handleSend} disabled={sending}
          style={{ padding:'8px 22px', borderRadius:9, border:'none', fontWeight:700, fontSize:13, cursor:'pointer',
            background:'linear-gradient(135deg,#2563eb,#f97316)', color:'#fff', display:'flex', alignItems:'center', gap:6 }}>
          {sending ? <CircularProgress size={14} sx={{ color:'#fff' }} /> : <><Send size={14} /> Send</>}
        </button>
      </div>
    </Dialog>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const INACTIVE_STATUSES = new Set([
  'Screen Reject','L1 Reject','L2 Reject','L3 Reject','HR Reject',
  'Background Verification Reject','Negotiation Reject','Test Reject',
  'Client Drop','Candidate Drop','Duplicate','Offer Declined','Position On Hold',
]);

// Only un-progressed applicants (still at the screening stage) are eligible for
// the bulk "screen reject" action — never touch candidates already moved forward.
const SCREENING_STATUSES = new Set(['applied', 'submitted', '', 'cv feedback pending']);

// Parse a notice-period string ("Immediate", "30 Days", "30") → number of days.
// Returns null when it can't be understood (treated as "unknown → don't reject").
const parseNotice = (v) => {
  const s = (v || '').toString().toLowerCase().trim();
  if (!s) return null;
  if (s.includes('immediate')) return 0;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

// Parse an expected-CTC string ("15 LPA", "15", "12.5") → number (LPA). null if unknown.
const parseCtc = (v) => {
  const s = (v || '').toString().replace(/,/g, '').trim();
  if (!s) return null;
  const m = s.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

const NOTICE_CHOICES = [
  { label: 'Immediate', value: 0 }, { label: '≤ 15 days', value: 15 },
  { label: '≤ 30 days', value: 30 }, { label: '≤ 45 days', value: 45 },
  { label: '≤ 60 days', value: 60 }, { label: '≤ 90 days', value: 90 },
];
const CTC_CHOICES = [5, 8, 10, 12, 15, 18, 20, 25, 30, 40, 50];

const Ad_Candi = ({ clientSpocView = false, recruiterView = false, directOnly = false, vendorView = false }) => {
  const [all, setAll]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [detailRow, setDetailRow] = useState(null);
  const [positionDetail, setPositionDetail] = useState(null);
  const [cvUrl, setCvUrl]       = useState(null);
  const [emailTarget, setEmailTarget] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]   = useState({ dateFrom:'', dateTo:'', recruiterName:[], clientName:[], status:[], hrName:[] });
  // ClientSPOC view: by default only active candidates show (reject-type hidden).
  // "Show all statuses" reveals rejected / dropped / on-hold candidates too.
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex:0, pageSize:15 });
  const [evaluating, setEvaluating] = useState(false);
  // ── Screening filter (directOnly / ClientSPOC direct-applications) ──
  const [screen, setScreen]   = useState({ position:'', location:'', maxNotice:'', maxCtc:'' });
  const [screenConfirm, setScreenConfirm] = useState(false);
  const [screening, setScreening]         = useState(false);
  const [screenResult, setScreenResult]   = useState(null);

  const fetchCandidates = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = clientSpocView
        ? '/addit/show/clientspoc/candi'
        : recruiterView
          ? '/addit/show/recruiter/candi'
          : vendorView
            ? '/vendor/candidates'
            : '/addit/show/all/candi';
      const res = await axios.get(url, { withCredentials: true });
      // A "self-apply" is source=direct_apply where the candidate submitted themselves
      // (recRole: 'Candidate'). When a recruiter's share link brings in a candidate,
      // source stays 'direct_apply' but recRole is 'Recruiter' — those belong in ad_panel.
      const isSelfApply = (c) => c.source === 'direct_apply' && c.recRole !== 'Recruiter';
      // directOnly  → show ONLY pure self-applies (clientspoc-direct-applications)
      // normal view → exclude self-applies and bulk uploads; recruiter-link direct-applies included
      const data = directOnly
        ? (res.data || []).filter(isSelfApply)
        : (res.data || []).filter(c => !isSelfApply(c) && c.source !== 'clientspoc_bulk');
      setAll(data);
      return data;
    } catch (e) { console.error(e); return []; }
    finally { setLoading(false); }
  };

  // Evaluate pending direct-application CVs against the JD (Match %), auto-reject ≤50%
  const evaluatePending = async () => {
    if (evaluating) return;
    setEvaluating(true);
    try {
      let remaining = 1;
      let guard = 0;
      while (remaining > 0 && guard < 20) {
        const res = await axios.post('/api/cv-match/evaluate-batch', { limit: 6 }, { withCredentials: true });
        remaining = res.data?.remaining ?? 0;
        guard++;
        await fetchCandidates(true);   // silent — don't flash the loading spinner
        if (remaining > 0) await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) { console.error('evaluate CVs', e); }
    finally { setEvaluating(false); }
  };

  useEffect(() => {
    // Just load the data — CV evaluation is triggered manually via the button so
    // the page no longer re-fetches in a loop on open.
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (d) => {
    if (!d?._seconds) return '—';
    return new Date(d._seconds * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  };

  const updateStatus = async (id, statusa, rejectReason = '') => {
    await axios.patch(`/addit/update/status/${id}`, { statusa, rejectReason });
    setAll(prev => prev.map(c => c.id === id ? { ...c, statusa, rejectReason } : c));
    if (detailRow?.id === id) setDetailRow(r => ({ ...r, statusa, rejectReason }));
  };

  // Applicants that still have an un-evaluated CV (drives the "Evaluate CVs" button)
  const pendingEvalCount = useMemo(
    () => all.filter(c =>
      (c.matchPercent === undefined || c.matchPercent === null) &&
      !c.matchEvaluated && (c.cv_data || c.cv_url)
    ).length,
    [all]
  );

  // ── Filter options ──
  const uniqueRecruiters = useMemo(() => [...new Set(all.map(c => c.recName).filter(Boolean))].sort(), [all]);
  const uniqueClients    = useMemo(() => [...new Set(all.map(c => c.client).filter(Boolean))].sort(), [all]);
  const uniqueHRNames    = useMemo(() => [...new Set(all.map(c => c.hr_name).filter(Boolean))].sort(), [all]);

  const filteredData = useMemo(() => {
    let d = [...all];
    // Direct-applications view: once a Position is chosen in the Screening Filter,
    // narrow the visible cards to that position. The location/notice/CTC criteria
    // are then used in the render to split these into Matching / Non-Matching.
    if (directOnly && screen.position) {
      d = d.filter(c => c.pos_name === screen.position);
    }
    // Hide reject-type candidates from the ClientSPOC table by default — once a
    // candidate is rejected/dropped/on-hold they move to the Resume Bank. The
    // "Show all statuses" toggle reveals them here.
    if (clientSpocView && !directOnly && !showAllStatuses) d = d.filter(c => !INACTIVE_STATUSES.has(c.statusa));
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom); from.setHours(0,0,0,0);
      d = d.filter(c => c.datePosted?._seconds && new Date(c.datePosted._seconds*1000) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo); to.setHours(23,59,59,999);
      d = d.filter(c => c.datePosted?._seconds && new Date(c.datePosted._seconds*1000) <= to);
    }
    if (filters.recruiterName.length) d = d.filter(c => filters.recruiterName.includes(c.recName));
    if (filters.clientName.length)    d = d.filter(c => filters.clientName.includes(c.client));
    if (filters.status.length)        d = d.filter(c => filters.status.includes(c.statusa));
    if (filters.hrName.length)        d = d.filter(c => filters.hrName.includes(c.hr_name));
    // Latest first — newest submission/update at the top.
    const ts = (c) => (c.datePosted?._seconds || c.updatedAt?._seconds || c.statusaDate?._seconds || 0);
    d.sort((a, b) => ts(b) - ts(a));
    return d;
  }, [all, filters, showAllStatuses, clientSpocView, directOnly, screen]);

  // Direct applications still at their initial (un-actioned) status
  const notUpdatedCount = useMemo(
    () => all.filter(c => ['applied', 'submitted', ''].includes((c.statusa || '').toLowerCase().trim())).length,
    [all]
  );

  const hasActiveFilters = filters.dateFrom || filters.dateTo ||
    filters.recruiterName.length || filters.clientName.length ||
    filters.status.length || filters.hrName.length || showAllStatuses;

  const clearFilters = () => { setFilters({ dateFrom:'', dateTo:'', recruiterName:[], clientName:[], status:[], hrName:[] }); setShowAllStatuses(false); };

  // ── Screening filter options & matching (direct applications view) ──────────
  const screenPositions = useMemo(
    () => [...new Set(all.map(c => c.pos_name).filter(Boolean))].sort(),
    [all]
  );
  const screenLocations = useMemo(
    () => [...new Set(all.flatMap(c => [c.curr_loc, c.pref_loc]).filter(Boolean).map(s => s.trim()))].sort(),
    [all]
  );

  // The bulk action is always scoped to ONE selected position. It only becomes
  // active once a position is chosen — the reject can never span other positions.
  const screenActive = !!screen.position;

  // A candidate PASSES a criterion when it's not set, or the value satisfies it.
  // Unknown/blank candidate values are given the benefit of the doubt (they pass),
  // so nobody is rejected purely for missing data.
  const matchesScreen = (c) => {
    if (screen.location) {
      const loc = screen.location.toLowerCase();
      const hay = [c.curr_loc, c.pref_loc, c.curr_state, c.pref_state]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(loc)) return false;
    }
    if (screen.maxNotice !== '') {
      const n = parseNotice(c.notice_period);
      if (n !== null && n > Number(screen.maxNotice)) return false;
    }
    if (screen.maxCtc !== '') {
      const ctc = parseCtc(c.exp_ctc);
      if (ctc !== null && ctc > Number(screen.maxCtc)) return false;
    }
    return true;
  };

  // Only un-progressed applicants OF THE SELECTED POSITION can be auto-rejected.
  const screenEligible = useMemo(
    () => (screen.position
      ? all.filter(c => c.pos_name === screen.position && SCREENING_STATUSES.has((c.statusa || '').toLowerCase().trim()))
      : []),
    [all, screen.position]
  );
  const nonMatching = useMemo(
    () => (screenActive ? screenEligible.filter(c => !matchesScreen(c)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenEligible, screen, screenActive]
  );
  const matchingCount = screenActive ? screenEligible.length - nonMatching.length : 0;

  const clearScreen = () => { setScreen({ position:'', location:'', maxNotice:'', maxCtc:'' }); setScreenResult(null); };

  const runScreenReject = async () => {
    if (!nonMatching.length) return;
    setScreening(true);
    setScreenResult(null);
    try {
      const parts = [];
      if (screen.position)        parts.push(`Position: ${screen.position}`);
      if (screen.location)        parts.push(`Location: ${screen.location}`);
      if (screen.maxNotice !== '') parts.push(`Notice ≤ ${screen.maxNotice} days`);
      if (screen.maxCtc !== '')    parts.push(`Expected CTC ≤ ${screen.maxCtc} LPA`);
      const rejectReason = `After initial screening, your profile did not match the required criteria for this position (${parts.join('; ')}).`;
      const res = await axios.post('/addit/bulk-screen-reject',
        { ids: nonMatching.map(c => c.id), rejectReason },
        { withCredentials: true });
      setScreenResult(res.data);
      await fetchCandidates();
    } catch (e) {
      setScreenResult({ success:false, message: e.response?.data?.message || 'Bulk reject failed.' });
    } finally {
      setScreening(false);
      setScreenConfirm(false);
    }
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredData.map(c => ({
      'Submitted Date': formatDate(c.datePosted),
      'Candidate Name': c.candidate, 'Email': c.emails, 'Phone': c.mob,
      'RH ID': c.rh_id || '',
      'Current Employer': c.curr_emp || '',
      'Highest Education': c.highest_education || '',
      'Recruiter': c.recName, 'Position': c.pos_name, 'Client': c.client,
      'HR Name': c.hr_name, 'Current CTC': c.current_ctc, 'Expected CTC': c.exp_ctc,
      'Current Location': c.curr_loc, 'Preferred Location': c.pref_loc,
      'Rel Exp': c.rel_exp, 'Offer in Hand': c.offer_hand, 'Status': c.statusa,
    })));
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `Candidates_${new Date().toISOString().split('T')[0]}${hasActiveFilters ? '_Filtered' : ''}.xlsx`);
  };

  // ── 7 table columns ──────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      accessorKey: 'datePosted', header: 'Date', size: 110,
      Cell: ({ cell }) => (
        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>{formatDate(cell.getValue())}</span>
      ),
      sortingFn: (a, b) => (a.original.datePosted?._seconds||0) - (b.original.datePosted?._seconds||0),
    },
    {
      accessorKey: 'candidate', header: 'Candidate', size: 180,
      Cell: ({ cell, row }) => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {row.original.photo_url ? (
            <img src={row.original.photo_url} alt={cell.getValue() || ''} title="Candidate photo"
              style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'2px solid #e5e7eb', flexShrink:0 }} />
          ) : (
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#f97316)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, flexShrink:0 }}>
              {(cell.getValue() || 'C').charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#111827', lineHeight:1.2 }}>{cell.getValue() || '—'}</div>
            {row.original.rel_exp && (
              <div style={{ fontSize:11, color:'#6b7280' }}>{row.original.rel_exp} yrs exp</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'pos_name', header: 'Position', size: 170,
      Cell: ({ cell }) => <span style={{ fontSize:13, fontWeight:600, color:'#1f2937' }}>{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'client', header: 'Client', size: 140,
      Cell: ({ cell }) => <span style={{ fontSize:12, color:'#374151' }}>{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'recName', header: 'Recruiter', size: 150,
      Cell: ({ cell }) => <span style={{ fontSize:12, color:'#374151' }}>{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'curr_loc', header: 'Location', size: 130,
      Cell: ({ cell }) => (
        <div style={{ display:'flex', alignItems:'center', gap:5, color:'#6b7280', fontSize:12 }}>
          <MapPin size={12} color="#3b82f6" />
          {cell.getValue() || '—'}
        </div>
      ),
    },
    ...(directOnly ? [{
      accessorKey: 'matchPercent', header: 'Match %', size: 110,
      Cell: ({ cell, row }) => {
        const v = cell.getValue();
        if (v === undefined || v === null) return <span style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{row.original.matchEvaluated ? 'CV not readable' : 'Not evaluated'}</span>;
        const low = v <= 50;
        return (
          <span title={row.original.matchSummary || ''}
            style={{ fontSize:12, fontWeight:800, padding:'2px 9px', borderRadius:9,
              background: low ? '#fee2e2' : '#dcfce7', color: low ? '#b91c1c' : '#15803d' }}>
            {v}%
          </span>
        );
      },
      sortingFn: (a, b) => (a.original.matchPercent ?? -1) - (b.original.matchPercent ?? -1),
    }] : []),
    {
      accessorKey: 'statusa', header: 'Status', size: 200,
      Cell: ({ cell, row }) => (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <StatusBadge status={cell.getValue()} />
          {(row.original.matchReasoning || row.original.matchSummary) && (
            <AiMatchInfo percent={row.original.matchPercent} reasoning={row.original.matchReasoning}
              summary={row.original.matchSummary} rejected={aiRejected(row.original)} />
          )}
        </div>
      ),
    },
  ], [directOnly]);

  const table = useMaterialReactTable({
    columns, data: filteredData,
    enableColumnOrdering: true, enableColumnResizing: true,
    enableColumnFilters: false, enableSorting: true, enablePagination: true,
    enableDensityToggle: true, enableFullScreenToggle: true,
    enableGlobalFilter: true, enableHiding: true,
    initialState: { density:'compact', sorting:[{ id:'datePosted', desc:true }], pagination:{ pageSize:15 } },
    onPaginationChange: setPagination,
    state: { isLoading: loading, pagination },
    autoResetPageIndex: false,

    ...(directOnly ? {
      renderTopToolbarCustomActions: () => (
        <button
          onClick={evaluatePending}
          disabled={evaluating}
          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10,
            background: evaluating ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: evaluating ? '#6b7280' : '#fff',
            fontWeight:700, fontSize:13, border:'none', cursor: evaluating ? 'default' : 'pointer' }}
          title="Score each CV against the position JD; profiles ≤50% are auto-rejected and emailed"
        >
          {evaluating ? 'Evaluating CVs…' : '✨ Evaluate CVs vs JD'}
        </button>
      ),
    } : {}),

    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => setDetailRow(row.original),
      sx: { cursor:'pointer', '&:hover':{ background:'#eff6ff' }, transition:'background 0.15s' },
    }),
    muiTableContainerProps: { sx: { maxHeight:'calc(100vh - 360px)' } },
    muiTableHeadCellProps: {
      sx: { background:'linear-gradient(to right,#eff6ff,#fff7ed)', borderBottom:'2px solid #bfdbfe', fontWeight:600, color:'#1f2937', fontSize:12 },
    },
    muiTablePaperProps: { sx: { boxShadow:'none', border:'none' } },
    muiTopToolbarProps: {
      sx: {
        background:'linear-gradient(to right,#2563eb,#f97316)',
        '& .MuiIconButton-root':{ color:'white' },
        '& .MuiInputBase-root':{ color:'white', '&::before':{ borderBottomColor:'rgba(255,255,255,0.5)' } },
      },
    },

    renderTopToolbarCustomActions: () => (
      <Box sx={{ display:'flex', gap:1, alignItems:'center', flexWrap:'wrap' }}>
        <button onClick={() => fetchCandidates()}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,255,255,0.2)',
            color:'#fff', border:'none', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          <TrendingUp size={15} /> Refresh
        </button>
        <button onClick={() => setShowFilters(f => !f)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'none', borderRadius:9,
            fontWeight:600, fontSize:13, cursor:'pointer',
            background: hasActiveFilters ? '#f97316' : 'rgba(255,255,255,0.9)', color: hasActiveFilters ? '#fff' : '#2563eb' }}>
          <Filter size={15} /> Filters
          {hasActiveFilters && (
            <span style={{ background:'#fff', color:'#f97316', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {[filters.dateFrom,filters.dateTo,...filters.recruiterName,...filters.clientName,...filters.status,...filters.hrName].filter(Boolean).length}
            </span>
          )}
        </button>
        <button onClick={handleDownloadExcel}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,255,255,0.9)',
            color:'#16a34a', border:'none', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          <FileSpreadsheet size={15} /> Export
        </button>
      </Box>
    ),
  });

  // Reusable applicant card (direct-applications view)
  const renderCard = (c) => {
    const m = c.matchPercent;
    const hasM = m !== undefined && m !== null;
    const lowM = hasM && m <= 50;
    return (
      <div key={c.id} onClick={() => setDetailRow(c)}
        style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:16, padding:16, cursor:'pointer',
          boxShadow:'0 1px 3px rgba(0,0,0,0.06)', transition:'box-shadow .15s, transform .15s, border-color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(37,99,235,0.14)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='#bfdbfe'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='#e5e7eb'; }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:12 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#f97316)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:17, flexShrink:0 }}>
            {(c.candidate || 'C').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.candidate || '—'}</div>
            <div style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.pos_name || '—'}</div>
          </div>
          {hasM ? (
            <span title={c.matchSummary || ''}
              style={{ fontSize:12, fontWeight:800, padding:'3px 10px', borderRadius:10, flexShrink:0,
                background: lowM ? '#fee2e2' : '#dcfce7', color: lowM ? '#b91c1c' : '#15803d' }}>{m}%</span>
          ) : (
            <span style={{ fontSize:10, color:'#9ca3af', fontStyle:'italic', flexShrink:0 }}>{c.matchEvaluated ? 'CV not readable' : 'Not evaluated'}</span>
          )}
        </div>
        {/* Meta */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12, color:'#374151', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><MapPin size={12} color="#3b82f6" />{c.curr_loc || '—'}</div>
          <div style={{ display:'flex', gap:12, color:'#6b7280', fontSize:11 }}>
            <span>Notice: <span style={{ color:'#374151', fontWeight:600 }}>{c.notice_period || '—'}</span></span>
            <span>Exp. CTC: <span style={{ color:'#374151', fontWeight:600 }}>{c.exp_ctc ? `${c.exp_ctc} LPA` : '—'}</span></span>
          </div>
          {c.client && <div style={{ color:'#6b7280' }}>Client: <span style={{ color:'#374151', fontWeight:600 }}>{c.client}</span></div>}
          <div style={{ color:'#9ca3af', fontSize:11 }}>Applied {formatDate(c.datePosted)}</div>
        </div>
        {/* Status + action */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #f3f4f6', paddingTop:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}
            onClick={e => e.stopPropagation()}>
            <StatusBadge status={c.statusa} />
            {(c.matchReasoning || c.matchSummary) && (
              <AiMatchInfo percent={c.matchPercent} reasoning={c.matchReasoning} summary={c.matchSummary} rejected={aiRejected(c)} />
            )}
          </span>
          <span style={{ fontSize:11, fontWeight:700, color:'#2563eb' }}>Update status →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div style={{ background:'linear-gradient(to right,#1e3a5f,#2563eb)', padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ padding:10, background:'rgba(255,255,255,0.2)', borderRadius:12 }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:'1.3rem', fontWeight:800, color:'#fff' }}>All Candidates</h3>
              <p style={{ margin:'2px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {hasActiveFilters ? `${filteredData.length} of ${all.length} candidates` : `${all.length} total`}
                {hasActiveFilters && <span style={{ marginLeft:8, background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'1px 8px', fontSize:11 }}>Filtered</span>}
              </p>
            </div>
            {(directOnly || clientSpocView) && (
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.15)',
                borderRadius:12, padding:'8px 14px' }}
                title="Candidates whose status has not been updated yet">
                <span style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1 }}>{notUpdatedCount}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:600, lineHeight:1.2 }}>status not<br/>updated</span>
              </div>
            )}
            {!directOnly && !clientSpocView && (
              <div style={{ marginLeft:'auto', fontSize:12, color:'rgba(255,255,255,0.6)' }}>
                Click any row to view details & update status
              </div>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ background:'#f8fafc', borderBottom:'2px solid #bfdbfe', padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontWeight:700, fontSize:15, color:'#1f2937', display:'flex', alignItems:'center', gap:6 }}>
                <Filter size={16} /> Advanced Filters
              </span>
              <button onClick={() => setShowFilters(false)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                <X size={18} color="#6b7280" />
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>From Date</label>
                <input type="date" value={filters.dateFrom}
                  onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                  style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13 }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>To Date</label>
                <input type="date" value={filters.dateTo}
                  onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                  style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13 }} />
              </div>
              {[
                { label:'Recruiter', key:'recruiterName', opts:uniqueRecruiters, color:'primary' },
                { label:'Client',    key:'clientName',    opts:uniqueClients,    color:'secondary' },
                { label:'Status',    key:'status',        opts:STATUS_OPTIONS,   color:'success' },
                { label:'HR Name',   key:'hrName',        opts:uniqueHRNames,    color:'warning' },
              ].map(({ label, key, opts, color }) => (
                <div key={key}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>{label}</label>
                  <Autocomplete multiple options={opts} value={filters[key]}
                    onChange={(_, v) => setFilters(f => ({ ...f, [key]: v }))}
                    renderInput={p => <TextField {...p} placeholder={`Select ${label.toLowerCase()}…`} size="small" />}
                    renderTags={(v, gp) => v.map((o, i) => <Chip key={i} label={o} {...gp({ index:i })} size="small" color={color} />)}
                  />
                  {key === 'status' && clientSpocView && !directOnly && (
                    <label style={{ display:'flex', alignItems:'center', gap:6, marginTop:7, fontSize:12, fontWeight:600, color:'#374151', cursor:'pointer' }}>
                      <input type="checkbox" checked={showAllStatuses}
                        onChange={e => setShowAllStatuses(e.target.checked)} />
                      Show all statuses (incl. rejected / on-hold)
                    </label>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:14 }}>
              <button onClick={clearFilters} disabled={!hasActiveFilters}
                style={{ padding:'7px 16px', border:'1.5px solid #d1d5db', borderRadius:9, background:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', opacity: hasActiveFilters ? 1 : 0.5 }}>
                Clear All
              </button>
              <button onClick={() => setShowFilters(false)}
                style={{ padding:'7px 20px', background:'linear-gradient(135deg,#2563eb,#f97316)', color:'#fff', border:'none', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                Apply
              </button>
            </div>
          </div>
        )}

        {directOnly ? (
          <div style={{ padding:'18px 20px' }}>
            {/* Toolbar */}
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:16 }}>
              {(() => {
                const noPending = pendingEvalCount === 0;
                const disabled = evaluating || noPending;
                return (
                  <button onClick={evaluatePending} disabled={disabled}
                    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10,
                      background: disabled ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: disabled ? '#9ca3af' : '#fff',
                      fontWeight:700, fontSize:13, border:'none', cursor: disabled ? 'default' : 'pointer' }}
                    title={noPending ? 'All CVs are already evaluated' : 'Score each pending CV against the position JD; profiles ≤50% are auto-rejected and emailed'}>
                    {evaluating ? 'Evaluating CVs…' : noPending ? '✓ All CVs evaluated' : `✨ Evaluate ${pendingEvalCount} CV${pendingEvalCount !== 1 ? 's' : ''} vs JD`}
                  </button>
                );
              })()}
              <button onClick={() => fetchCandidates()}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#eff6ff',
                  color:'#2563eb', border:'1.5px solid #bfdbfe', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                <TrendingUp size={15} /> Refresh
              </button>
              <button onClick={() => setShowFilters(f => !f)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10,
                  fontWeight:600, fontSize:13, cursor:'pointer', border:'1.5px solid', borderColor: hasActiveFilters ? '#f97316' : '#bfdbfe',
                  background: hasActiveFilters ? '#f97316' : '#fff', color: hasActiveFilters ? '#fff' : '#2563eb' }}>
                <Filter size={15} /> Filters
                {hasActiveFilters && (
                  <span style={{ background:'#fff', color:'#f97316', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {[filters.dateFrom,filters.dateTo,...filters.recruiterName,...filters.clientName,...filters.status,...filters.hrName].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button onClick={handleDownloadExcel}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#f0fdf4',
                  color:'#16a34a', border:'1.5px solid #bbf7d0', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                <FileSpreadsheet size={15} /> Export
              </button>
            </div>

            {/* ── Screening filter → bulk Screen Reject ─────────────────────── */}
            <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:16, marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <Filter size={16} color="#f97316" />
                <span style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>Screening Filter</span>
                <span style={{ fontSize:12, color:'#64748b' }}>— set criteria; applicants who don't match can be screen-rejected &amp; emailed in one click.</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Position</label>
                  <select value={screen.position} onChange={e => setScreen(s => ({ ...s, position:e.target.value }))}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, background:'#fff' }}>
                    <option value="">Any position</option>
                    {screenPositions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Location</label>
                  <select value={screen.location} onChange={e => setScreen(s => ({ ...s, location:e.target.value }))}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, background:'#fff' }}>
                    <option value="">Any location</option>
                    {screenLocations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Notice Period</label>
                  <select value={screen.maxNotice} onChange={e => setScreen(s => ({ ...s, maxNotice:e.target.value }))}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, background:'#fff' }}>
                    <option value="">Any notice period</option>
                    {NOTICE_CHOICES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Expected CTC</label>
                  <select value={screen.maxCtc} onChange={e => setScreen(s => ({ ...s, maxCtc:e.target.value }))}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, background:'#fff' }}>
                    <option value="">Any expected CTC</option>
                    {CTC_CHOICES.map(v => <option key={v} value={v}>≤ {v} LPA</option>)}
                  </select>
                </div>
              </div>

              {!screen.position && (
                <div style={{ marginTop:12, fontSize:12.5, color:'#b45309', background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:9, padding:'8px 12px', fontWeight:600 }}>
                  Select a <strong>Position</strong> first — bulk screen-reject only applies to candidates of the chosen position.
                </div>
              )}

              {screenActive && (
                <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginTop:14 }}>
                  <span style={{ fontSize:13, color:'#334155', fontWeight:700 }}>{screen.position}:</span>
                  <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>✓ {matchingCount} matching</span>
                  <span style={{ fontSize:13, color:'#dc2626', fontWeight:700 }}>✕ {nonMatching.length} not matching</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>(only un-actioned applicants can be rejected)</span>
                  <button onClick={clearScreen}
                    style={{ marginLeft:'auto', padding:'8px 14px', border:'1.5px solid #d1d5db', borderRadius:9, background:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    Clear
                  </button>
                </div>
              )}

              {screenResult && (
                <div style={{ marginTop:12, padding:'10px 14px', borderRadius:9, fontSize:13, fontWeight:600,
                  background: screenResult.success ? '#f0fdf4' : '#fef2f2',
                  color: screenResult.success ? '#166534' : '#991b1b',
                  border: `1.5px solid ${screenResult.success ? '#bbf7d0' : '#fecaca'}` }}>
                  {screenResult.success
                    ? `✓ ${screenResult.rejected} candidate(s) screen-rejected, ${screenResult.emailed} email(s) sent${screenResult.skipped ? `, ${screenResult.skipped} skipped` : ''}.`
                    : `⚠ ${screenResult.message}`}
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#6b7280', fontSize:14 }}>Loading applications…</div>
            ) : filteredData.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontSize:14 }}>
                {screen.position ? 'No applications for this position.' : 'No direct applications found.'}
              </div>
            ) : screen.position ? (
              // ── Split into Matching / Non-Matching sections for the chosen position ──
              (() => {
                const matchCards    = filteredData.filter(matchesScreen);
                const nonMatchCards = filteredData.filter(c => !matchesScreen(c));
                const gridStyle = { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 };
                return (
                  <>
                    {/* (1) Matching Candidates */}
                    <div style={{ marginBottom:26 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:8, borderBottom:'2px solid #bbf7d0' }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:'#16a34a' }} />
                        <h4 style={{ margin:0, fontSize:15, fontWeight:800, color:'#166534' }}>Matching Candidates</h4>
                        <span style={{ fontSize:12, fontWeight:700, color:'#16a34a', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20, padding:'2px 10px' }}>{matchCards.length}</span>
                      </div>
                      {matchCards.length ? (
                        <div style={gridStyle}>{matchCards.map(renderCard)}</div>
                      ) : (
                        <div style={{ color:'#9ca3af', fontSize:13, padding:'12px 0' }}>No matching candidates.</div>
                      )}
                    </div>

                    {/* (2) Non-Matching Candidates */}
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:8, borderBottom:'2px solid #fecaca', flexWrap:'wrap' }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:'#dc2626' }} />
                        <h4 style={{ margin:0, fontSize:15, fontWeight:800, color:'#991b1b' }}>Non-Matching Candidates</h4>
                        <span style={{ fontSize:12, fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:20, padding:'2px 10px' }}>{nonMatchCards.length}</span>
                        <button onClick={() => setScreenConfirm(true)} disabled={!nonMatching.length || screening}
                          style={{ marginLeft:'auto', padding:'8px 16px', border:'none', borderRadius:9, fontWeight:700, fontSize:13,
                            cursor: (!nonMatching.length || screening) ? 'default' : 'pointer',
                            background: (!nonMatching.length || screening) ? '#e5e7eb' : 'linear-gradient(135deg,#dc2626,#f97316)',
                            color: (!nonMatching.length || screening) ? '#9ca3af' : '#fff' }}
                          title={nonMatching.length ? '' : 'No un-actioned non-matching applicants to reject'}>
                          {screening ? 'Rejecting…' : `Reject ${nonMatching.length} non-matching & notify`}
                        </button>
                      </div>
                      {nonMatchCards.length ? (
                        <div style={gridStyle}>{nonMatchCards.map(renderCard)}</div>
                      ) : (
                        <div style={{ color:'#9ca3af', fontSize:13, padding:'12px 0' }}>No non-matching candidates.</div>
                      )}
                    </div>
                  </>
                );
              })()
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
                {filteredData.map(renderCard)}
              </div>
            )}
          </div>
        ) : (
          <MaterialReactTable table={table} />
        )}
      </div>

      {/* Candidate detail modal */}
      <CandidateModal
        candidate={detailRow}
        onClose={() => setDetailRow(null)}
        onStatusChange={updateStatus}
        onEmail={c => { setEmailTarget(c); setDetailRow(null); }}
        onViewPosition={posId => setPositionDetail(posId)}
        onViewCV={url => setCvUrl(url)}
        hideRecruiterInfo={directOnly}
        clientSpocView={clientSpocView}
        onCandidateUpdate={(id, updates) => {
          setAll(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
          setDetailRow(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
        }}
      />

      {/* Bulk screen-reject confirmation */}
      {screenConfirm && (
        <div onClick={() => !screening && setScreenConfirm(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#fff', borderRadius:16, maxWidth:460, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background:'linear-gradient(135deg,#dc2626,#f97316)', padding:'18px 22px', color:'#fff' }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:800 }}>Reject non-matching applicants?</h3>
            </div>
            <div style={{ padding:22, fontSize:14, color:'#1f2937', lineHeight:1.6 }}>
              <p style={{ margin:'0 0 12px' }}>
                <strong>{nonMatching.length}</strong> applicant{nonMatching.length !== 1 ? 's' : ''} that do not match your criteria will be marked
                <strong> “Screen Reject”</strong> and each will receive a rejection email. This cannot be undone in bulk.
              </p>
              <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', fontSize:13, color:'#475569' }}>
                {screen.position        && <div>• Position: <strong>{screen.position}</strong></div>}
                {screen.location        && <div>• Location: <strong>{screen.location}</strong></div>}
                {screen.maxNotice !== '' && <div>• Notice ≤ <strong>{screen.maxNotice} days</strong></div>}
                {screen.maxCtc !== ''    && <div>• Expected CTC ≤ <strong>{screen.maxCtc} LPA</strong></div>}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, padding:'0 22px 22px', justifyContent:'flex-end' }}>
              <button onClick={() => setScreenConfirm(false)} disabled={screening}
                style={{ padding:'9px 18px', border:'1.5px solid #d1d5db', borderRadius:9, background:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={runScreenReject} disabled={screening}
                style={{ padding:'9px 18px', border:'none', borderRadius:9, background:'linear-gradient(135deg,#dc2626,#f97316)', color:'#fff', fontWeight:700, fontSize:13, cursor: screening ? 'default' : 'pointer' }}>
                {screening ? 'Rejecting…' : `Yes, reject ${nonMatching.length} & notify`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Position details modal */}
      <PositionModal
        posId={positionDetail}
        onClose={() => setPositionDetail(null)}
      />

      {/* CV iframe modal */}
      <CVModal
        url={cvUrl}
        onClose={() => setCvUrl(null)}
      />

      {/* Email dialog */}
      <EmailDialog
        open={!!emailTarget}
        candidate={emailTarget}
        onClose={() => setEmailTarget(null)}
      />
    </div>
  );
};

export default Ad_Candi;
