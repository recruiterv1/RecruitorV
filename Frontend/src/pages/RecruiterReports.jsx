import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  Users, Download, Eye, Calendar, MapPin, Phone,
  Mail, Award, Filter, X, FileSpreadsheet, Briefcase,
  User, DollarSign, Clock, Building, Hash, FileText,
  ExternalLink, TrendingUp, CheckCircle, AlertCircle,
  BarChart3, RefreshCw,
} from 'lucide-react';
import {
  Box, Dialog, DialogContent, IconButton, Autocomplete,
  TextField, Chip, CircularProgress,
} from '@mui/material';
import * as XLSX from 'xlsx';

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
};
const sc = (s) => STATUS_COLORS[(s || '').toLowerCase()] || { bg:'#f3f4f6', text:'#374151', border:'#d1d5db' };

const REJECT_STATUSES = new Set([
  'screen reject','l1 reject','l2 reject','l3 reject','hr reject',
  'background verification reject','negotiation reject','test reject',
  'client drop','candidate drop','duplicate','offer declined',
]);
const OFFER_STATUSES = new Set(['to be offered','offer accepted','joining']);

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
  'Client Drop','Candidate Drop','Duplicate',
];

// ── Info row helper ────────────────────────────────────────────────────────────
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

// ── CV viewer modal ────────────────────────────────────────────────────────────
const CVModal = ({ url, onClose }) => {
  const embedUrl = url
    ? url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview')
    : '';
  return (
    <Dialog open={!!url} onClose={onClose} maxWidth={false}
      PaperProps={{ sx: { borderRadius:'20px', overflow:'hidden', maxWidth:920, width:'100%', m:1, zIndex:1500 } }}>
      <DialogContent sx={{ p:0 }}>
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', padding:'14px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <FileText size={18} color="#fff" />
            <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>CV Preview</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => window.open(url, '_blank')}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <ExternalLink size={13} /> Open in New Tab
            </button>
            <IconButton onClick={onClose} size="small" sx={{ color:'#fff' }}><X size={16} /></IconButton>
          </div>
        </div>
        <iframe src={embedUrl} title="CV Preview"
          style={{ width:'100%', height:'78vh', border:'none', display:'block', background:'#f3f4f6' }} allow="autoplay" />
      </DialogContent>
    </Dialog>
  );
};

// ── Candidate detail modal ─────────────────────────────────────────────────────
const CandidateModal = ({ candidate, onClose, onViewCV }) => {
  if (!candidate) return null;
  const initials = (candidate.candidate || 'C').charAt(0).toUpperCase();
  const c = sc(candidate.statusa);

  return (
    <Dialog open={!!candidate} onClose={onClose} maxWidth={false}
      PaperProps={{ sx: { borderRadius:'20px', overflow:'hidden', maxWidth:820, width:'100%', m:1 } }}>
      <DialogContent sx={{ p:0 }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#f97316 100%)', padding:'28px 28px 24px', position:'relative' }}>
          <IconButton onClick={onClose} size="small"
            sx={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.2)', color:'#fff',
              '&:hover':{ background:'rgba(255,255,255,0.35)' } }}>
            <X size={16} />
          </IconButton>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:26, fontWeight:800, color:'#fff', flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>
                Candidate Profile
              </div>
              <h2 style={{ margin:0, fontSize:'1.4rem', fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                {candidate.candidate || '—'}
              </h2>
              <p style={{ margin:'6px 0 0', opacity:0.85, fontSize:'0.88rem', color:'#fff' }}>
                {candidate.pos_name || '—'} &nbsp;·&nbsp; {candidate.client || '—'}
              </p>
              {(candidate.cv_data || candidate.cv_url) && (
                <button
                  onClick={() => onViewCV(candidate.cv_data || candidate.cv_url)}
                  style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:5, padding:'5px 13px',
                    background:'rgba(255,255,255,0.2)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.45)',
                    borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  <Eye size={13} /> View CV
                </button>
              )}
            </div>
            <StatusBadge status={candidate.statusa} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'24px 28px', maxHeight:'68vh', overflowY:'auto' }}>
          {/* Status display (read-only for recruiter) */}
          <div style={{ background: c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <CheckCircle size={16} color={c.text} />
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:c.text, textTransform:'uppercase', letterSpacing:0.5 }}>Current Status</div>
              <div style={{ fontSize:14, fontWeight:700, color:c.text }}>{candidate.statusa || '—'}</div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0 28px' }}>
            <InfoItem icon={Mail}       label="Candidate Email"    value={candidate.emails || candidate.email}   color="#2563eb" />
            <InfoItem icon={Phone}      label="Mobile"             value={candidate.mob}                         color="#059669" />
            <InfoItem icon={Calendar}   label="Date of Birth"      value={candidate.dob}                         color="#7c3aed" />
            <InfoItem icon={Briefcase}  label="Position"           value={candidate.pos_name}                    color="#7c3aed" />
            <InfoItem icon={Building}   label="Client"             value={candidate.client}                      color="#6b7280" />
            <InfoItem icon={User}       label="HR Name"            value={candidate.hr_name}                     color="#0891b2" />
            <InfoItem icon={Hash}       label="JR Number"          value={candidate.jr_number}                   color="#6b7280" />
            <InfoItem icon={Hash}       label="PAN Number"         value={candidate.pan_number}                  color="#6b7280" />
            <InfoItem icon={Clock}      label="Relevant Exp"       value={candidate.rel_exp ? `${candidate.rel_exp} yrs` : null} color="#7c3aed" />
            <InfoItem icon={TrendingUp} label="Total Exp"          value={candidate.total_exp ? `${candidate.total_exp} yrs` : null} color="#7c3aed" />
            <InfoItem icon={DollarSign} label="Current CTC"        value={candidate.current_ctc ? `₹${candidate.current_ctc} LPA` : null} color="#059669" />
            <InfoItem icon={DollarSign} label="Expected CTC"       value={candidate.exp_ctc ? `₹${candidate.exp_ctc} LPA` : null} color="#059669" />
            <InfoItem icon={Clock}      label="Notice Period"      value={candidate.notice_period ? `${candidate.notice_period} days` : null} color="#f97316" />
            <InfoItem icon={MapPin}     label="Current Location"   value={[candidate.curr_loc, candidate.curr_state].filter(Boolean).join(', ')} color="#2563eb" />
            <InfoItem icon={MapPin}     label="Preferred Location" value={[candidate.pref_loc, candidate.pref_state].filter(Boolean).join(', ')} color="#f97316" />
            <InfoItem icon={Building}   label="Current Employer"   value={candidate.curr_emp}                    color="#6b7280" />
            <InfoItem icon={Hash}       label="RH ID"              value={candidate.rh_id}                       color="#0891b2" />
            <InfoItem icon={Award}      label="Highest Education"  value={candidate.highest_education}           color="#7c3aed" />
            <InfoItem icon={Award}      label="Self Rating"        value={candidate.self_rate}                   color="#d97706" />
            <InfoItem icon={Award}      label="Offer in Hand"      value={candidate.offer_hand}                  color="#d97706" />
            <InfoItem icon={Calendar}   label="Offer & DOJ"        value={candidate.offer_amt}                   color="#d97706" />
          </div>

          {/* Skills */}
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

          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid #e5e7eb' }}>
            <button onClick={onClose}
              style={{ padding:'9px 22px', background:'#f8fafc', color:'#374151', border:'1.5px solid #e2e8f0', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, bg, text, border }) => (
  <div style={{ background: bg, border:`1.5px solid ${border}`, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
    <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon size={20} color={text} />
    </div>
    <div>
      <div style={{ fontSize:24, fontWeight:800, color:text, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:text, opacity:0.75, fontWeight:600, marginTop:3 }}>{label}</div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const RecruiterReports = () => {
  const [all, setAll]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [detailRow, setDetailRow] = useState(null);
  const [cvUrl, setCvUrl]       = useState(null);
  const [pagination, setPagination] = useState({ pageIndex:0, pageSize:20 });

  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', clients: [], positions: [], statuses: [],
  });

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/addit/show/recruiter/candi', { withCredentials: true });
      setAll(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const formatDate = (d) => {
    if (!d?._seconds) return '—';
    return new Date(d._seconds * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  };

  // ── Derived filter options ──
  const uniqueClients   = useMemo(() => [...new Set(all.map(c => c.client).filter(Boolean))].sort(), [all]);
  const uniquePositions = useMemo(() => {
    const src = filters.clients.length ? all.filter(c => filters.clients.includes(c.client)) : all;
    return [...new Set(src.map(c => c.pos_name).filter(Boolean))].sort();
  }, [all, filters.clients]);

  // ── Filtered data ──
  const filteredData = useMemo(() => {
    let d = [...all];
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom); from.setHours(0,0,0,0);
      d = d.filter(c => c.datePosted?._seconds && new Date(c.datePosted._seconds*1000) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo); to.setHours(23,59,59,999);
      d = d.filter(c => c.datePosted?._seconds && new Date(c.datePosted._seconds*1000) <= to);
    }
    if (filters.clients.length)   d = d.filter(c => filters.clients.includes(c.client));
    if (filters.positions.length) d = d.filter(c => filters.positions.includes(c.pos_name));
    if (filters.statuses.length)  d = d.filter(c => filters.statuses.includes(c.statusa));
    return d;
  }, [all, filters]);

  const hasActiveFilters = filters.dateFrom || filters.dateTo ||
    filters.clients.length || filters.positions.length || filters.statuses.length;

  const clearFilters = () => setFilters({ dateFrom:'', dateTo:'', clients:[], positions:[], statuses:[] });

  // ── Stats ──
  const stats = useMemo(() => {
    const src = hasActiveFilters ? filteredData : all;
    return {
      total:   src.length,
      active:  src.filter(c => !REJECT_STATUSES.has((c.statusa || '').toLowerCase())).length,
      offers:  src.filter(c => OFFER_STATUSES.has((c.statusa || '').toLowerCase())).length,
      rejected:src.filter(c => REJECT_STATUSES.has((c.statusa || '').toLowerCase())).length,
    };
  }, [all, filteredData, hasActiveFilters]);

  // ── XLS export ──
  const handleExport = () => {
    const data = filteredData.map(c => ({
      'Submitted Date':     formatDate(c.datePosted),
      'Candidate Name':     c.candidate,
      'Email':              c.emails || c.email,
      'Mobile':             c.mob,
      'DOB':                c.dob,
      'Position':           c.pos_name,
      'JR Number':          c.jr_number,
      'Client':             c.client,
      'HR Name':            c.hr_name,
      'Current Employer':   c.curr_emp,
      'RH ID':              c.rh_id || '',
      'Highest Education':  c.highest_education || '',
      'Relevant Exp (yrs)': c.rel_exp,
      'Total Exp (yrs)':    c.total_exp,
      'Current CTC (LPA)':  c.current_ctc,
      'Expected CTC (LPA)': c.exp_ctc,
      'Notice Period (days)':c.notice_period,
      'Current Location':   [c.curr_loc, c.curr_state].filter(Boolean).join(', '),
      'Preferred Location': [c.pref_loc, c.pref_state].filter(Boolean).join(', '),
      'Offer in Hand':      c.offer_hand,
      'Offer/DOJ':          c.offer_amt,
      'Self Rating':        c.self_rate,
      'Tech Skills':        Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : '',
      'Non-Tech Skills':    Array.isArray(c.nontech_skill) ? c.nontech_skill.join(', ') : '',
      'PAN Number':         c.pan_number,
      'Status':             c.statusa,
      'CV URL':             c.cv_data || c.cv_url || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'My Candidates');
    const suffix = hasActiveFilters ? '_Filtered' : '';
    XLSX.writeFile(wb, `MyRecruits_${new Date().toISOString().split('T')[0]}${suffix}.xlsx`);
  };

  // ── Table columns ──
  const columns = useMemo(() => [
    {
      accessorKey: 'datePosted', header: 'Date Submitted', size: 130,
      Cell: ({ cell }) => (
        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>{formatDate(cell.getValue())}</span>
      ),
      sortingFn: (a, b) => (a.original.datePosted?._seconds||0) - (b.original.datePosted?._seconds||0),
    },
    {
      accessorKey: 'candidate', header: 'Candidate', size: 190,
      Cell: ({ cell, row }) => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#f97316)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, flexShrink:0 }}>
            {(cell.getValue() || 'C').charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#111827', lineHeight:1.2 }}>{cell.getValue() || '—'}</div>
            {row.original.mob && (
              <div style={{ fontSize:11, color:'#6b7280' }}>{row.original.mob}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'pos_name', header: 'Position', size: 180,
      Cell: ({ cell }) => <span style={{ fontSize:13, fontWeight:600, color:'#1f2937' }}>{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'client', header: 'Client', size: 140,
      Cell: ({ cell }) => <span style={{ fontSize:12, color:'#374151' }}>{cell.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'current_ctc', header: 'Curr CTC', size: 110,
      Cell: ({ cell }) => {
        const v = cell.getValue();
        return <span style={{ fontSize:12, color:'#059669', fontWeight:600 }}>{v ? `₹${v}L` : '—'}</span>;
      },
    },
    {
      accessorKey: 'exp_ctc', header: 'Exp CTC', size: 110,
      Cell: ({ cell }) => {
        const v = cell.getValue();
        return <span style={{ fontSize:12, color:'#2563eb', fontWeight:600 }}>{v ? `₹${v}L` : '—'}</span>;
      },
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
    {
      accessorKey: 'statusa', header: 'Status', size: 190,
      Cell: ({ cell }) => <StatusBadge status={cell.getValue()} />,
    },
    {
      accessorKey: 'cv_data', header: 'CV', size: 70,
      enableSorting: false,
      Cell: ({ cell, row }) => {
        const url = cell.getValue() || row.original.cv_url;
        return url ? (
          <button
            onClick={e => { e.stopPropagation(); setCvUrl(url); }}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'#eff6ff',
              color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer' }}>
            <Eye size={11} /> CV
          </button>
        ) : <span style={{ color:'#d1d5db', fontSize:12 }}>—</span>;
      },
    },
  ], []);

  const table = useMaterialReactTable({
    columns, data: filteredData,
    enableColumnOrdering: true, enableColumnResizing: true,
    enableColumnFilters: false, enableSorting: true, enablePagination: true,
    enableDensityToggle: true, enableFullScreenToggle: true,
    enableGlobalFilter: true, enableHiding: true,
    initialState: { density:'compact', sorting:[{ id:'datePosted', desc:true }], pagination:{ pageSize:20 } },
    onPaginationChange: setPagination,
    state: { isLoading: loading, pagination },
    autoResetPageIndex: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => setDetailRow(row.original),
      sx: { cursor:'pointer', '&:hover':{ background:'#eff6ff' }, transition:'background 0.15s' },
    }),
    muiTableContainerProps: { sx: { maxHeight:'calc(100vh - 420px)' } },
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
        <button onClick={fetchCandidates}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,255,255,0.2)',
            color:'#fff', border:'none', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button onClick={handleExport}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,255,255,0.9)',
            color:'#16a34a', border:'none', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          <FileSpreadsheet size={14} /> {hasActiveFilters ? 'Export Filtered' : 'Export All'}
        </button>
      </Box>
    ),
  });

  return (
    <div className="w-full py-6">

      {/* Page header */}
      <div style={{ background:'linear-gradient(to right,#1e3a5f,#2563eb)', borderRadius:'16px 16px 0 0', padding:'20px 24px', marginBottom:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ padding:10, background:'rgba(255,255,255,0.2)', borderRadius:12 }}>
            <BarChart3 size={24} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin:0, fontSize:'1.25rem', fontWeight:800, color:'#fff' }}>My Candidate Reports</h3>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
              {hasActiveFilters
                ? `${filteredData.length} of ${all.length} candidates (filtered)`
                : `${all.length} total candidates submitted`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ background:'#f8fafc', borderLeft:'1.5px solid #e2e8f0', borderRight:'1.5px solid #e2e8f0', padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
        <StatCard label="Total Submitted"  value={stats.total}    icon={Users}        bg="#eff6ff" text="#1d4ed8" border="#bfdbfe" />
        <StatCard label="Active Pipeline"  value={stats.active}   icon={TrendingUp}   bg="#f0fdf4" text="#166534" border="#86efac" />
        <StatCard label="Offers/Joining"   value={stats.offers}   icon={CheckCircle}  bg="#dcfce7" text="#059669" border="#6ee7b7" />
        <StatCard label="Not Progressed"   value={stats.rejected} icon={AlertCircle}  bg="#fef2f2" text="#dc2626" border="#fca5a5" />
      </div>

      {/* Filter bar */}
      <div style={{ background:'#fff', borderLeft:'1.5px solid #e2e8f0', borderRight:'1.5px solid #e2e8f0', borderBottom:'1.5px solid #e2e8f0', padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontWeight:700, fontSize:14, color:'#1f2937', display:'flex', alignItems:'center', gap:6 }}>
            <Filter size={15} /> Filters
            {hasActiveFilters && (
              <span style={{ background:'#2563eb', color:'#fff', borderRadius:20, padding:'1px 8px', fontSize:11, fontWeight:700 }}>
                {[filters.dateFrom, filters.dateTo, ...filters.clients, ...filters.positions, ...filters.statuses].filter(Boolean).length}
              </span>
            )}
          </span>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', background:'#fef2f2', color:'#dc2626',
                border:'1px solid #fca5a5', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <X size={12} /> Clear All
            </button>
          )}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>From Date</label>
            <input type="date" value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>To Date</label>
            <input type="date" value={filters.dateTo}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Client</label>
            <Autocomplete multiple options={uniqueClients} value={filters.clients}
              onChange={(_, v) => setFilters(f => {
                // drop any selected positions that don't belong to newly selected clients
                const validPositions = v.length
                  ? [...new Set(all.filter(c => v.includes(c.client)).map(c => c.pos_name).filter(Boolean))]
                  : all.map(c => c.pos_name).filter(Boolean);
                return {
                  ...f,
                  clients: v,
                  positions: f.positions.filter(p => validPositions.includes(p)),
                };
              })}
              renderInput={p => <TextField {...p} placeholder="Select client…" size="small" />}
              renderTags={(v, gp) => v.map((o, i) => <Chip key={i} label={o} {...gp({ index:i })} size="small" color="primary" />)}
            />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Position</label>
            <Autocomplete multiple options={uniquePositions} value={filters.positions}
              onChange={(_, v) => setFilters(f => ({ ...f, positions: v }))}
              renderInput={p => <TextField {...p} placeholder="Select position…" size="small" />}
              renderTags={(v, gp) => v.map((o, i) => <Chip key={i} label={o} {...gp({ index:i })} size="small" color="secondary" />)}
            />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Status</label>
            <Autocomplete multiple options={STATUS_OPTIONS} value={filters.statuses}
              onChange={(_, v) => setFilters(f => ({ ...f, statuses: v }))}
              renderInput={p => <TextField {...p} placeholder="Select status…" size="small" />}
              renderTags={(v, gp) => v.map((o, i) => <Chip key={i} label={o} {...gp({ index:i })} size="small" color="success" />)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:'0 0 16px 16px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
        <MaterialReactTable table={table} />
      </div>

      {/* Modals */}
      <CandidateModal
        candidate={detailRow}
        onClose={() => setDetailRow(null)}
        onViewCV={url => { setDetailRow(null); setCvUrl(url); }}
      />
      <CVModal url={cvUrl} onClose={() => setCvUrl(null)} />
    </div>
  );
};

export default RecruiterReports;
