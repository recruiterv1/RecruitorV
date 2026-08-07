import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useMaterialReactTable, MaterialReactTable } from 'material-react-table';
import {
  Box, Chip, CircularProgress, MenuItem, Select, FormControl,
  InputLabel, Button, Dialog, DialogContent, IconButton,
  Autocomplete, TextField,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { formatCommission } from '../lib/commission';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  MapPin, Briefcase, IndianRupee, BadgePercent, Users, FileText,
  Building, Calendar, Phone, Mail, User, Star, Award, Hash,
  Clock, X, ChevronRight, Tag, BookOpen, Layers,
  TrendingUp, UserCheck, MessageSquare, Download, Edit2,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const uniq = (arr) => [...new Set(arr.filter(v => v && v !== 'N/A'))].sort();
const fmtDate  = (iso) => iso ? dayjs(iso).format('DD MMM YYYY, hh:mm A') : '—';
const fmtShort = (iso) => iso ? dayjs(iso).format('DD MMM YYYY') : '—';

const STATUS_COLORS = {
  hired: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  shortlisted: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  pending: { bg: '#fef9c3', text: '#854d0e', border: '#fde68a' },
  'on hold': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  'interview scheduled': { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
  selected: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  'not selected': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
};
const statusStyle = (s) =>
  STATUS_COLORS[(s || '').toLowerCase()] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };

// ─── Shared modal wrapper ───────────────────────────────────────────────────
const ModalShell = ({ open, onClose, children, maxWidth = 720 }) => (
  <Dialog open={open} onClose={onClose} maxWidth={false}
    PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', maxWidth, width: '100%', m: 1 } }}>
    <DialogContent sx={{ p: 0 }}>
      {children}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.25)', border: 'none',
          borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        <X size={18} color="#fff" />
      </button>
    </DialogContent>
  </Dialog>
);

// gradient header strip
const ModalHeader = ({ gradient, icon: Icon, iconBg, title, subtitle, badge }) => (
  <div style={{ background: gradient, padding: '28px 28px 24px', color: '#fff', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ background: iconBg || 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 12, flexShrink: 0 }}>
        <Icon size={26} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {badge && (
          <span style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '2px 12px', fontSize: 11,
            fontWeight: 600, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase',
          }}>{badge}</span>
        )}
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word' }}>
          {title || '—'}
        </h2>
        {subtitle && (
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

// info card row
const InfoRow = ({ icon: Icon, label, value, color = '#6b7280' }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 500, wordBreak: 'break-word' }}>{String(value)}</div>
      </div>
    </div>
  );
};

// two-column grid of InfoRows
const InfoGrid = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 24px' }}>
    {items.map((item, i) => item.value || item.value === 0 ? <InfoRow key={i} {...item} /> : null)}
  </div>
);

// skill chips row
const SkillRow = ({ label, skills, color = '#2563eb' }) => {
  const list = Array.isArray(skills) ? skills : typeof skills === 'string' && skills ? [skills] : [];
  if (!list.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {list.map((s, i) => (
          <span key={i} style={{
            background: color + '14', color, border: `1px solid ${color}30`,
            borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 500,
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
};

const SectionHeading = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase',
    letterSpacing: 1, borderBottom: '2px solid #e5e7eb', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>
    {children}
  </div>
);

const Body = ({ children }) => (
  <div style={{ padding: '24px 28px', maxHeight: '65vh', overflowY: 'auto' }}>{children}</div>
);

// ══════════════════════════════════════════════════════════════════════════════
// POSITION MODAL
// ══════════════════════════════════════════════════════════════════════════════
const PositionModal = ({ row, onClose }) => {
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row) { setPos(null); return; }
    if (row.positionDetail) { setPos(row.positionDetail); return; }
    if (!row.positionId) return;
    setLoading(true);
    axios.get(`/candidate/position/${row.positionId}`)
      .then(res => {
        const d = res.data;
        setPos({
          positionTitle: d.position || '',
          client: d.client || '',
          clientspocEmail: d.clientspoc || '',
          clientspocName: d.clientspoc_name || '',
          location: Array.isArray(d.location) ? d.location.join(', ') : (d.location || d.state || ''),
          experience: d.experience || '',
          ctcStart: d.ctcStart || '', ctcEnd: d.ctcEnd || '',
          commison: d.commison || '',
          jobDesc: d.job_desc || '',
          keyRes: d.key_res || '', mustHave: d.m_have || '',
          goodToHave: d.g_have || '', competencies: d.compet || '',
          companyOverview: d.comp_view || '',
          posCategory: d.pos_cat || '', workType: d.workType || '',
          openings: d.openings || '', hrName: d.hr_name || '',
          deadline: d.deadline ? dayjs(d.deadline?._seconds ? d.deadline._seconds * 1000 : d.deadline).format('DD MMM YYYY') : '',
          postedAt: d.datePosted ? dayjs(d.datePosted?._seconds ? d.datePosted._seconds * 1000 : d.datePosted).format('DD MMM YYYY') : '',
        });
      })
      .catch(() => setPos({ positionTitle: row.positionTitle, client: row.client }))
      .finally(() => setLoading(false));
  }, [row]);

  const ctcRange = pos?.ctcStart && pos?.ctcEnd ? `₹${pos.ctcStart} – ₹${pos.ctcEnd} LPA` : (pos?.ctcStart || pos?.ctcEnd ? `₹${pos.ctcStart || pos.ctcEnd} LPA` : '');

  return (
    <ModalShell open={!!row} onClose={onClose} maxWidth={780}>
      <ModalHeader
        gradient="linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)"
        icon={Briefcase}
        badge="Position Details"
        title={pos?.positionTitle || row?.positionTitle || '—'}
        subtitle={pos?.client ? `Client: ${pos.client}` : ''}
      />
      <Body>
        {loading && <div style={{ textAlign: 'center', padding: 40 }}><CircularProgress /></div>}
        {pos && !loading && (
          <>
            {/* Key badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {ctcRange && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '6px 14px' }}>
                  <IndianRupee size={14} color="#2563eb" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>{ctcRange}</span>
                </div>
              )}
              {pos.commison && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '6px 14px' }}>
                  <BadgePercent size={14} color="#a16207" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#a16207' }}>{formatCommission(pos.commison, pos.commission_type)} Commission</span>
                </div>
              )}
              {pos.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '6px 14px' }}>
                  <MapPin size={14} color="#166534" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{pos.location}</span>
                </div>
              )}
              {pos.experience && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '6px 14px' }}>
                  <TrendingUp size={14} color="#7e22ce" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7e22ce' }}>{pos.experience} yrs exp</span>
                </div>
              )}
            </div>

            <SectionHeading>Position Info</SectionHeading>
            <InfoGrid items={[
              { icon: Building,  label: 'Client',          value: pos.client,         color: '#2563eb' },
              { icon: Users,     label: 'Client SPOC',     value: pos.clientspocName || row?.clientspocName, color: '#7c3aed' },
              { icon: Mail,      label: 'SPOC Email',      value: pos.clientspocEmail || row?.clientspocEmail, color: '#6b7280' },
              { icon: User,      label: 'HR Name',         value: pos.hrName,         color: '#6b7280' },
              { icon: Tag,       label: 'Category',        value: pos.posCategory,    color: '#0891b2' },
              { icon: Layers,    label: 'Work Type',       value: pos.workType,       color: '#0891b2' },
              { icon: Users,     label: 'Openings',        value: pos.openings,       color: '#059669' },
              { icon: Calendar,  label: 'Deadline',        value: pos.deadline,       color: '#dc2626' },
              { icon: Calendar,  label: 'Posted On',       value: pos.postedAt,       color: '#6b7280' },
            ]} />

            {pos.companyOverview && (
              <>
                <SectionHeading>Company Overview</SectionHeading>
                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{pos.companyOverview}</p>
              </>
            )}

            {pos.jobDesc && (
              <>
                <SectionHeading>Job Description</SectionHeading>
                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{pos.jobDesc}</p>
              </>
            )}

            {(pos.mustHave || pos.goodToHave || pos.keyRes || pos.competencies) && (
              <>
                <SectionHeading>Requirements</SectionHeading>
                {pos.mustHave    && <InfoRow icon={Star}          label="Must Have"      value={pos.mustHave}    color="#dc2626" />}
                {pos.goodToHave  && <InfoRow icon={ChevronRight}  label="Good To Have"   value={pos.goodToHave}  color="#059669" />}
                {pos.keyRes      && <InfoRow icon={FileText}      label="Key Responsibilities" value={pos.keyRes} color="#2563eb" />}
                {pos.competencies && <InfoRow icon={Award}        label="Competencies"   value={pos.competencies} color="#7c3aed" />}
              </>
            )}
          </>
        )}
      </Body>
    </ModalShell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CANDIDATE MODAL
// ══════════════════════════════════════════════════════════════════════════════
const CandidateModal = ({ row, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!row) { setDetail(null); return; }
    setLoadingDetail(true);
    axios.get(`/api/reports/candidate?id=${encodeURIComponent(row.id)}`)
      .then(res => { if (res.data?.success) setDetail(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [row]);

  const d = detail || {};
  const name   = d.name   || row?.candidateName  || '—';
  const email  = d.email  || row?.candidateEmail || '';
  const status = d.status || row?.status || 'N/A';
  const sc = statusStyle(status);

  return (
    <ModalShell open={!!row} onClose={onClose} maxWidth={800}>
      <ModalHeader
        gradient="linear-gradient(135deg, #065f46 0%, #059669 100%)"
        icon={User}
        badge="Candidate Details"
        title={name}
        subtitle={email}
      />
      <Body>
        {loadingDetail && <div style={{ textAlign: 'center', padding: 32 }}><CircularProgress size={28} /></div>}

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{
            background: sc.bg, color: sc.text, border: `1.5px solid ${sc.border}`,
            borderRadius: 20, padding: '5px 16px', fontWeight: 700, fontSize: 13,
          }}>{status}</span>
          {(d.statusUpdatedAt || row?.statusUpdatedAt) && (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Updated: {fmtShort(d.statusUpdatedAt || row?.statusUpdatedAt)}
            </span>
          )}
        </div>

        <SectionHeading>Personal Information</SectionHeading>
        <InfoGrid items={[
          { icon: User,     label: 'Full Name',          value: name,                                        color: '#059669' },
          { icon: Mail,     label: 'Email',              value: email,                                       color: '#6b7280' },
          { icon: Phone,    label: 'Mobile',             value: d.mobile || row?.candidateMobile,             color: '#6b7280' },
          { icon: Building, label: 'Current Employer',   value: d.currentEmployer || row?.currentEmployer,   color: '#2563eb' },
          { icon: Hash,     label: 'RH ID',              value: d.rhId || row?.rhId,                          color: '#0891b2' },
          { icon: Award,    label: 'Highest Education',  value: d.highestEducation || row?.highestEducation,  color: '#7c3aed' },
          { icon: MapPin,   label: 'Current Location',   value: d.currentLocation  || row?.currentLocation,  color: '#059669' },
          { icon: MapPin,   label: 'Current State',      value: d.currentState,                              color: '#059669' },
          { icon: MapPin,   label: 'Preferred Location', value: d.preferredLocation || row?.preferredLocation, color: '#7c3aed' },
          { icon: MapPin,   label: 'Preferred State',    value: d.preferredState,                            color: '#7c3aed' },
          { icon: Calendar, label: 'Date of Birth',      value: d.dob,                                       color: '#6b7280' },
        ]} />

        <SectionHeading>Experience & Compensation</SectionHeading>
        <InfoGrid items={[
          { icon: TrendingUp,  label: 'Relevant Experience', value: d.relExp        || row?.relExp,       color: '#2563eb' },
          { icon: TrendingUp,  label: 'Total Experience',    value: d.totalExp      || row?.totalExp,     color: '#2563eb' },
          { icon: IndianRupee, label: 'Current CTC',         value: d.currentCTC    || row?.currentCTC,   color: '#059669' },
          { icon: IndianRupee, label: 'Expected CTC',        value: d.expectedCTC   || row?.expectedCTC,  color: '#dc2626' },
          { icon: Clock,       label: 'Notice Period',       value: d.noticePeriod  || row?.noticePeriod, color: '#a16207' },
          { icon: Calendar,    label: 'Last Working Day',    value: d.lastWorkingDay,                    color: '#a16207' },
          { icon: IndianRupee, label: 'Self Rating',         value: d.selfRate,                          color: '#6b7280' },
          { icon: IndianRupee, label: 'Offer In Hand',       value: d.offerInHand,                       color: '#6b7280' },
          { icon: IndianRupee, label: 'Offer Amount',        value: d.offerAmount,                       color: '#6b7280' },
        ]} />

        {(d.techSkills?.length > 0 || d.nonTechSkills?.length > 0 ||
          row?.techSkills?.length > 0 || row?.nonTechSkills?.length > 0) && (
          <>
            <SectionHeading>Skills</SectionHeading>
            <InfoGrid items={[
              { icon: Tag,   label: 'Skill Type',            value: d.skillType,        color: '#6b7280' },
              { icon: Award, label: 'Tech Category',         value: d.techCategory,     color: '#2563eb' },
              { icon: Award, label: 'Tech Subcategory',      value: d.techSubcategory,  color: '#2563eb' },
              { icon: Clock, label: 'Tech Experience',       value: d.techExp,          color: '#2563eb' },
              { icon: Award, label: 'Non-Tech Category',     value: d.nonTechCategory,  color: '#7c3aed' },
              { icon: Award, label: 'Non-Tech Subcategory',  value: d.nonTechSubcategory, color: '#7c3aed' },
              { icon: Clock, label: 'Non-Tech Experience',   value: d.nonTechExp,       color: '#7c3aed' },
            ]} />
            <SkillRow label="Technical Skills"     skills={d.techSkills    || row?.techSkills}    color="#2563eb" />
            <SkillRow label="Non-Technical Skills" skills={d.nonTechSkills || row?.nonTechSkills} color="#7c3aed" />
          </>
        )}

        <SectionHeading>Application Details</SectionHeading>
        <InfoGrid items={[
          { icon: Briefcase, label: 'Position',       value: d.positionName   || row?.positionTitle,    color: '#2563eb' },
          { icon: Building,  label: 'Client',         value: d.client         || row?.client,           color: '#6b7280' },
          { icon: Users,     label: 'Client SPOC',    value: d.clientspoc     || row?.clientspocName,   color: '#6b7280' },
          { icon: User,      label: 'Recruiter',      value: d.recruiterName  || row?.recruiterName,    color: '#7c3aed' },
          { icon: Mail,      label: 'Recruiter Email',value: d.recruiterEmail || row?.recruiterEmail,   color: '#7c3aed' },
          { icon: User,      label: 'HR Name',        value: d.hrName,                                 color: '#6b7280' },
          { icon: FileText,  label: 'JR Number',      value: d.jrNumber,                               color: '#6b7280' },
          { icon: FileText,  label: 'PAN Number',     value: d.panNumber,                              color: '#6b7280' },
          { icon: Calendar,  label: 'Submitted On',   value: fmtDate(d.submittedAt    || row?.submittedAt),    color: '#6b7280' },
          { icon: Calendar,  label: 'Status Updated', value: fmtDate(d.statusUpdatedAt || row?.statusUpdatedAt), color: '#6b7280' },
        ]} />

        {d.cvUrl && (
          <>
            <SectionHeading>Resume</SectionHeading>
            <a href={d.cvUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 600 }}>
              View / Download CV
            </a>
          </>
        )}

        {(row?.coaches?.length > 0 || row?.experts?.length > 0) && (
          <>
            <SectionHeading>Assigned Support</SectionHeading>
            {row?.coaches?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>COACHES</div>
                {row?.coaches.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.875rem', color: '#1f2937', padding: '3px 0' }}>
                    {c.name}{c.email ? ` — ${c.email}` : ''}{c.phone ? ` | ${c.phone}` : ''}
                  </div>
                ))}
              </div>
            )}
            {row?.experts?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>EXPERTS</div>
                {row?.experts.map((e, i) => (
                  <div key={i} style={{ fontSize: '0.875rem', color: '#1f2937', padding: '3px 0' }}>
                    {e.name}{e.email ? ` — ${e.email}` : ''}{e.phone ? ` | ${e.phone}` : ''}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Body>
    </ModalShell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// RECRUITER MODAL
// ══════════════════════════════════════════════════════════════════════════════
const RecruiterModal = ({ row, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!row) { setDetail(null); return; }
    const email = row.recruiterEmail;
    if (!email) return;
    setLoadingDetail(true);
    axios.get(`/api/reports/recruiter?email=${encodeURIComponent(email)}`)
      .then(res => { if (res.data?.success) setDetail(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [row]);

  const d = detail || {};

  return (
    <ModalShell open={!!row} onClose={onClose} maxWidth={780}>
      <ModalHeader
        gradient="linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)"
        icon={UserCheck}
        badge="Recruiter Details"
        title={d.name || row?.recruiterName || '—'}
        subtitle={d.email || row?.recruiterEmail}
      />
      <Body>
        {loadingDetail && <div style={{ textAlign: 'center', padding: 32 }}><CircularProgress size={28} /></div>}

        <SectionHeading>Contact Information</SectionHeading>
        <InfoGrid items={[
          { icon: User,    label: 'Full Name', value: d.name     || row?.recruiterName,     color: '#7c3aed' },
          { icon: Mail,    label: 'Email',     value: d.email    || row?.recruiterEmail,    color: '#6b7280' },
          { icon: Phone,   label: 'Phone',     value: d.mobile   || row?.recruiterPhone,    color: '#6b7280' },
          { icon: MapPin,  label: 'Location',  value: d.location || row?.recruiterLocation, color: '#059669' },
          { icon: MapPin,  label: 'Country',   value: d.country,                           color: '#059669' },
          { icon: MessageSquare, label: 'LinkedIn', value: d.linkedin,                     color: '#2563eb' },
          { icon: MessageSquare, label: 'Website',  value: d.website,                      color: '#2563eb' },
        ]} />

        <SectionHeading>Professional Details</SectionHeading>
        <InfoGrid items={[
          { icon: Tag,        label: 'Role Category',      value: d.roleCategory,                           color: '#7c3aed' },
          { icon: TrendingUp, label: 'Experience Category',value: d.experienceCategory || row?.recruiterExpCategory, color: '#2563eb' },
          { icon: TrendingUp, label: 'Years of Experience',value: d.yearsOfExperience,                      color: '#2563eb' },
          { icon: Briefcase,  label: 'Specialization',     value: d.specialization,                         color: '#0891b2' },
          { icon: Building,   label: 'Current Company',    value: d.currentCompany,                         color: '#6b7280' },
          { icon: User,       label: 'Current Title',      value: d.currentTitle,                           color: '#6b7280' },
          { icon: Tag,        label: 'Commission Type',    value: d.commisiontype || row?.recruiterCommType, color: '#a16207' },
          { icon: Calendar,   label: 'Joined On',          value: fmtShort(d.registrationDate || row?.recruiterJoined), color: '#6b7280' },
          { icon: Calendar,   label: 'Plan Expiry',        value: fmtShort(d.planExpiryDate),               color: '#dc2626' },
          { icon: Star,       label: 'Plan Type',          value: d.planType !== '' ? String(d.planType) : '', color: '#a16207' },
          { icon: UserCheck,  label: 'Agreement Signed',   value: d.agreementSigned ? 'Yes' : d.id ? 'No' : '', color: '#059669' },
          { icon: UserCheck,  label: 'Verified',           value: d.isVerified ? 'Yes' : d.id ? 'No' : '',   color: '#059669' },
          { icon: Users,      label: 'Total Candidates',   value: d.totalCandidates ? String(d.totalCandidates) : '', color: '#2563eb' },
          { icon: Briefcase,  label: 'Total Positions',    value: d.totalPositions  ? String(d.totalPositions)  : '', color: '#2563eb' },
        ]} />

        {d.bio && (
          <>
            <SectionHeading>Bio</SectionHeading>
            <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{d.bio}</p>
          </>
        )}

        {d.skills?.length > 0 && (
          <>
            <SectionHeading>Skills</SectionHeading>
            <SkillRow label="Skills" skills={d.skills} color="#7c3aed" />
          </>
        )}

        {d.targetIndustries?.length > 0 && (
          <>
            <SectionHeading>Target Industries</SectionHeading>
            <SkillRow label="Industries" skills={d.targetIndustries} color="#0891b2" />
          </>
        )}

        {d.recruitmentMethods?.length > 0 && (
          <>
            <SectionHeading>Recruitment Methods</SectionHeading>
            <SkillRow label="Methods" skills={d.recruitmentMethods} color="#059669" />
          </>
        )}

        {d.workExperience?.length > 0 && (
          <>
            <SectionHeading>Work Experience</SectionHeading>
            {d.workExperience.map((w, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{w.title || w.role || '—'}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  {[w.company, w.duration || (w.startDate && w.endDate ? `${w.startDate} – ${w.endDate}` : '')].filter(Boolean).join(' · ')}
                </div>
                {w.description && <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: 4 }}>{w.description}</div>}
              </div>
            ))}
          </>
        )}

        {d.education?.length > 0 && (
          <>
            <SectionHeading>Education</SectionHeading>
            {d.education.map((e, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{e.degree || e.qualification || '—'}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  {[e.institution || e.school, e.year || e.graduationYear].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </>
        )}

        <SectionHeading>Position Context</SectionHeading>
        <InfoGrid items={[
          { icon: Briefcase, label: 'Position',            value: row?.positionTitle,          color: '#2563eb' },
          { icon: Building,  label: 'Client',              value: row?.client,                 color: '#6b7280' },
          { icon: Users,     label: 'Client SPOC',         value: row?.clientspocName,         color: '#6b7280' },
          { icon: Calendar,  label: 'Candidate Submitted', value: fmtShort(row?.submittedAt),  color: '#6b7280' },
        ]} />
      </Body>
    </ModalShell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// COACH / EXPERT MODAL
// ══════════════════════════════════════════════════════════════════════════════
const CoachExpertModal = ({ item, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!item) { setDetail(null); return; }
    const email = item.email;
    if (!email) return;
    setLoadingDetail(true);
    axios.get(`/api/reports/recruiter?email=${encodeURIComponent(email)}`)
      .then(res => { if (res.data?.success) setDetail(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [item]);

  const isCoach = item?.type === 'Coach';
  const d = detail || {};
  const sc = statusStyle(item?.status);
  const accentColor = isCoach ? '#0284c7' : '#d97706';

  return (
    <ModalShell open={!!item} onClose={onClose} maxWidth={780}>
      <ModalHeader
        gradient={isCoach
          ? 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)'
          : 'linear-gradient(135deg, #713f12 0%, #d97706 100%)'}
        icon={isCoach ? BookOpen : Star}
        badge={item?.type || 'Support Professional'}
        title={d.name || item?.name || '—'}
        subtitle={d.email || item?.email}
      />
      <Body>
        {loadingDetail && <div style={{ textAlign: 'center', padding: 32 }}><CircularProgress size={28} /></div>}

        {item?.status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Request Status:</span>
            <span style={{
              background: sc.bg, color: sc.text, border: `1.5px solid ${sc.border}`,
              borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 13,
            }}>{item?.status}</span>
            {item?.requestedAt && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Requested: {fmtShort(item?.requestedAt)}</span>
            )}
          </div>
        )}

        <SectionHeading>Contact Information</SectionHeading>
        <InfoGrid items={[
          { icon: User,    label: 'Full Name', value: d.name     || item?.name,  color: accentColor },
          { icon: Mail,    label: 'Email',     value: d.email    || item?.email, color: '#6b7280' },
          { icon: Phone,   label: 'Phone',     value: d.mobile   || item?.phone, color: '#6b7280' },
          { icon: MapPin,  label: 'Location',  value: d.location,               color: '#059669' },
          { icon: MapPin,  label: 'Country',   value: d.country,                color: '#059669' },
          { icon: MessageSquare, label: 'LinkedIn', value: d.linkedin,           color: '#2563eb' },
          { icon: MessageSquare, label: 'Website',  value: d.website,            color: '#2563eb' },
        ]} />

        <SectionHeading>Professional Details</SectionHeading>
        <InfoGrid items={[
          { icon: Award,      label: 'Type',               value: item?.type,                    color: accentColor },
          { icon: Tag,        label: 'Role Category',      value: d.roleCategory,                color: accentColor },
          { icon: TrendingUp, label: 'Experience Category',value: d.experienceCategory,          color: '#2563eb' },
          { icon: TrendingUp, label: 'Years of Experience',value: d.yearsOfExperience,           color: '#2563eb' },
          { icon: Briefcase,  label: 'Specialization',     value: d.specialization,              color: '#0891b2' },
          { icon: Building,   label: 'Current Company',    value: d.currentCompany,              color: '#6b7280' },
          { icon: User,       label: 'Current Title',      value: d.currentTitle,                color: '#6b7280' },
          { icon: Tag,        label: 'Commission Type',    value: d.commisiontype,               color: '#a16207' },
          { icon: Calendar,   label: 'Joined On',          value: fmtShort(d.registrationDate),  color: '#6b7280' },
          { icon: UserCheck,  label: 'Agreement Signed',   value: d.agreementSigned ? 'Yes' : d.id ? 'No' : '', color: '#059669' },
          { icon: UserCheck,  label: 'Verified',           value: d.isVerified ? 'Yes' : d.id ? 'No' : '',     color: '#059669' },
        ]} />

        {d.bio && (
          <>
            <SectionHeading>Bio</SectionHeading>
            <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{d.bio}</p>
          </>
        )}

        {d.skills?.length > 0 && (
          <>
            <SectionHeading>Skills</SectionHeading>
            <SkillRow label="Skills" skills={d.skills} color={accentColor} />
          </>
        )}

        {d.targetIndustries?.length > 0 && (
          <>
            <SectionHeading>Target Industries</SectionHeading>
            <SkillRow label="Industries" skills={d.targetIndustries} color="#0891b2" />
          </>
        )}

        {d.workExperience?.length > 0 && (
          <>
            <SectionHeading>Work Experience</SectionHeading>
            {d.workExperience.map((w, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{w.title || w.role || '—'}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  {[w.company, w.duration || (w.startDate && w.endDate ? `${w.startDate} – ${w.endDate}` : '')].filter(Boolean).join(' · ')}
                </div>
                {w.description && <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: 4 }}>{w.description}</div>}
              </div>
            ))}
          </>
        )}

        {d.education?.length > 0 && (
          <>
            <SectionHeading>Education</SectionHeading>
            {d.education.map((e, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{e.degree || e.qualification || '—'}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  {[e.institution || e.school, e.year || e.graduationYear].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </>
        )}

        <SectionHeading>Position Context</SectionHeading>
        <InfoGrid items={[
          { icon: Briefcase, label: 'Position', value: item?.positionTitle, color: '#2563eb' },
          { icon: Building,  label: 'Client',   value: item?.client,       color: '#6b7280' },
        ]} />
      </Body>
    </ModalShell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EDIT ASSIGNMENTS MODAL
// ══════════════════════════════════════════════════════════════════════════════
const acStyle = { mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const EditPositionModal = ({ position, onClose, onSaved }) => {
  const [users, setUsers]       = useState({ recruiters: [], coaches: [], experts: [], clientspocs: [] });
  const [current, setCurrent]   = useState({ clientspoc: null, recruiters: [], coaches: [], experts: [] });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');

  // Position's skill category (used to filter users)
  const posCat = (position?.skill_category || '').trim().toLowerCase();

  // Filter a user list to only those matching the position's skill_category.
  // If the position has no category, show everyone.
  const filterByCategory = (list) => {
    if (!posCat) return list;
    return list.filter(u => {
      const cats = Array.isArray(u.skillCategory)
        ? u.skillCategory
        : (u.skillCategory ? [u.skillCategory] : []);
      return cats.some(c => c.trim().toLowerCase() === posCat);
    });
  };

  useEffect(() => {
    if (!position) return;
    setLoadingUsers(true);
    Promise.all([
      axios.get('/admin/users-for-assignment', { withCredentials: true }),
      axios.get(`/admin/position-current-assignments?posId=${encodeURIComponent(position.positionId)}`, { withCredentials: true }),
    ]).then(([uRes, cRes]) => {
      setUsers(uRes.data);
      const curr = cRes.data;
      setCurrent({
        clientspoc: curr.clientspoc?.email
          ? { email: curr.clientspoc.email, name: curr.clientspoc.name || curr.clientspoc.email }
          : null,
        recruiters: curr.recruiters || [],
        coaches:    curr.coaches    || [],
        experts:    curr.experts    || [],
      });
    }).catch(err => console.error('Load error:', err))
      .finally(() => setLoadingUsers(false));
  }, [position?.positionId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post('/admin/update-position-assignments', {
        posId:          position.positionId,
        positionTitle:  position.positionTitle,
        clientspocEmail: current.clientspoc?.email || '',
        clientspocName:  current.clientspoc?.name  || '',
        recruiterEmails: current.recruiters.map(r => r.email),
        coachEmails:     current.coaches.map(c => c.email),
        expertEmails:    current.experts.map(e => e.email),
      }, { withCredentials: true });
      const sent = res.data?.emailsSent || 0;
      setToast(`Saved! ${sent > 0 ? `${sent} notification email${sent > 1 ? 's' : ''} sent.` : ''}`);
      setTimeout(() => { onSaved && onSaved(); onClose(); }, 1400);
    } catch (err) {
      setToast('Error: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setToast(''), 3500);
    } finally {
      setSaving(false);
    }
  };

  const optLabel = opt => opt?.name ? `${opt.name}  ·  ${opt.email}` : (opt?.email || '');
  const optEqual = (a, b) => (a?.email || '') === (b?.email || '');

  const chipColors = { recruiters: 'primary', coaches: 'info', experts: 'warning', clientspoc: 'success' };

  const MultiSelect = ({ label, field, color, options }) => (
    <Autocomplete
      multiple disableCloseOnSelect
      options={options}
      value={current[field]}
      getOptionLabel={optLabel}
      isOptionEqualToValue={optEqual}
      onChange={(_, val) => setCurrent(c => ({ ...c, [field]: val }))}
      renderTags={(val, getTagProps) =>
        val.map((opt, i) => (
          <Chip key={i} label={opt.name || opt.email} color={color} size="small"
            {...getTagProps({ index: i })}
            sx={{ fontWeight: 600, borderRadius: '8px' }}
          />
        ))
      }
      renderInput={params => (
        <TextField {...params} label={label} size="small"
          placeholder={current[field].length ? '' : `Search ${label}…`}
        />
      )}
      sx={acStyle}
    />
  );

  return (
    <ModalShell open={!!position} onClose={onClose} maxWidth={860}>
      <ModalHeader
        gradient="linear-gradient(135deg, #312e81 0%, #7c3aed 50%, #2563eb 100%)"
        icon={Edit2}
        badge="Edit Assignments"
        title={position?.positionTitle || '—'}
        subtitle={`Client: ${position?.client || '—'}`}
      />
      <div style={{ padding: '28px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
        {toast && (
          <div style={{
            background: toast.startsWith('Error') ? '#fee2e2' : '#d1fae5',
            color:       toast.startsWith('Error') ? '#991b1b' : '#065f46',
            border:      `1px solid ${toast.startsWith('Error') ? '#fca5a5' : '#6ee7b7'}`,
            borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontWeight: 600, fontSize: 14,
          }}>{toast}</div>
        )}

        {loadingUsers ? (
          <div style={{ textAlign: 'center', padding: 48 }}><CircularProgress /></div>
        ) : (
          <>
            {/* ── ClientSPOC ── */}
            <div style={{ marginBottom: 6 }}>
              <SectionHeading>Client SPOC</SectionHeading>
            </div>
            <Autocomplete
              options={users.clientspocs}
              value={current.clientspoc}
              getOptionLabel={optLabel}
              isOptionEqualToValue={optEqual}
              onChange={(_, val) => setCurrent(c => ({ ...c, clientspoc: val }))}
              renderInput={params => <TextField {...params} label="Select Client SPOC" size="small" />}
              sx={acStyle}
            />

            {/* Skill category notice */}
            {posCat && (
              <div style={{
                marginBottom: 16, padding: '8px 14px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 8, fontSize: 12, color: '#1d4ed8', fontWeight: 600,
              }}>
                Showing only users whose skill category matches this position: <span style={{ textTransform: 'capitalize' }}>{position?.skill_category}</span>
              </div>
            )}

            {/* ── Recruiters ── */}
            <SectionHeading>Recruiters</SectionHeading>
            <MultiSelect label="Recruiters" field="recruiters" color="primary" options={filterByCategory(users.recruiters)} />

            {/* ── Coaches ── */}
            <SectionHeading>Coaches</SectionHeading>
            <MultiSelect label="Coaches" field="coaches" color="info" options={filterByCategory(users.coaches)} />

            {/* ── Experts ── */}
            <SectionHeading>Experts</SectionHeading>
            <MultiSelect label="Experts" field="experts" color="warning" options={filterByCategory(users.experts)} />

            {/* ── Summary chips ── */}
            {(current.recruiters.length + current.coaches.length + current.experts.length) > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 18px', marginBottom: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Current Selection
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {current.recruiters.map((r, i) => (
                    <span key={i} style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                      👤 {r.name || r.email}
                    </span>
                  ))}
                  {current.coaches.map((c, i) => (
                    <span key={i} style={{ background: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                      🎓 {c.name || c.email}
                    </span>
                  ))}
                  {current.experts.map((e, i) => (
                    <span key={i} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                      ⭐ {e.name || e.email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
              <Button variant="outlined" onClick={onClose} disabled={saving}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                Cancel
              </Button>
              <Button
                variant="contained" onClick={handleSave} disabled={saving}
                sx={{
                  borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3,
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #1d4ed8)' },
                  boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save & Notify'}
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const SuperAdminReports = () => {
  const [allData, setAllData]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [positionFilter,   setPositionFilter]   = useState('');
  const [clientspocFilter, setClientspocFilter] = useState('');
  const [recruiterFilter,  setRecruiterFilter]  = useState('');
  const [coachFilter,      setCoachFilter]      = useState('');
  const [expertFilter,     setExpertFilter]     = useState('');
  const [statusFilter,     setStatusFilter]     = useState('');
  const [dateFrom,         setDateFrom]         = useState(null);
  const [dateTo,           setDateTo]           = useState(null);

  const [positionModal,    setPositionModal]    = useState(null);
  const [candidateModal,   setCandidateModal]   = useState(null);
  const [recruiterModal,   setRecruiterModal]   = useState(null);
  const [coachExpertModal, setCoachExpertModal] = useState(null);
  const [editModal,        setEditModal]        = useState(null);

  const fetchData = () => {
    setLoading(true);
    axios.get('/api/reports/candidates')
      .then(res => { setAllData(res.data?.data || []); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || err.message); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const applyFilters = (rows, exclude = null) => rows.filter(row => {
    if (exclude !== 'position'   && positionFilter   && row.positionTitle  !== positionFilter)  return false;
    if (exclude !== 'clientspoc' && clientspocFilter && row.clientspocName !== clientspocFilter) return false;
    if (exclude !== 'recruiter'  && recruiterFilter  && row.recruiterName  !== recruiterFilter)  return false;
    if (exclude !== 'coach'      && coachFilter      && !row?.coaches?.some(c => c.name === coachFilter)) return false;
    if (exclude !== 'expert'     && expertFilter     && !row?.experts?.some(e => e.name === expertFilter)) return false;
    if (exclude !== 'status'     && statusFilter     && row.status !== statusFilter) return false;
    if (dateFrom && row.submittedAt && dayjs(row.submittedAt).isBefore(dateFrom, 'day')) return false;
    if (dateTo   && row.submittedAt && dayjs(row.submittedAt).isAfter(dateTo,   'day')) return false;
    return true;
  });

  const positionOptions   = useMemo(() => uniq(applyFilters(allData, 'position').map(r => r.positionTitle)),                      [allData, clientspocFilter, recruiterFilter, coachFilter, expertFilter, statusFilter, dateFrom, dateTo]);
  const clientspocOptions = useMemo(() => uniq(applyFilters(allData, 'clientspoc').map(r => r.clientspocName)),                   [allData, positionFilter, recruiterFilter, coachFilter, expertFilter, statusFilter, dateFrom, dateTo]);
  const recruiterOptions  = useMemo(() => uniq(applyFilters(allData, 'recruiter').map(r => r.recruiterName)),                     [allData, positionFilter, clientspocFilter, coachFilter, expertFilter, statusFilter, dateFrom, dateTo]);
  const coachOptions      = useMemo(() => uniq(applyFilters(allData, 'coach').flatMap(r => r.coaches?.map(c => c.name) || [])),   [allData, positionFilter, clientspocFilter, recruiterFilter, expertFilter, statusFilter, dateFrom, dateTo]);
  const expertOptions     = useMemo(() => uniq(applyFilters(allData, 'expert').flatMap(r => r.experts?.map(e => e.name) || [])),  [allData, positionFilter, clientspocFilter, recruiterFilter, coachFilter, statusFilter, dateFrom, dateTo]);
  const statusOptions     = useMemo(() => uniq(applyFilters(allData, 'status').map(r => r.status)),                               [allData, positionFilter, clientspocFilter, recruiterFilter, coachFilter, expertFilter, dateFrom, dateTo]);
  const filteredData      = useMemo(() => applyFilters(allData),                                                                   [allData, positionFilter, clientspocFilter, recruiterFilter, coachFilter, expertFilter, statusFilter, dateFrom, dateTo]);

  const handleReset = () => {
    setPositionFilter(''); setClientspocFilter(''); setRecruiterFilter('');
    setCoachFilter('');    setExpertFilter('');     setStatusFilter('');
    setDateFrom(null);     setDateTo(null);
  };

  const handleExportExcel = () => {
    const rows = filteredData.map(r => ({
      'Position':           r.positionTitle || '',
      'Client':             r.client || '',
      'Client SPOC':        r.clientspocName || '',
      'SPOC Email':         r.clientspocEmail || '',
      'Recruiter':          r.recruiterName || '',
      'Recruiter Email':    r.recruiterEmail || '',
      'Recruiter Phone':    r.recruiterPhone || '',
      'Coach(es)':          r.coaches?.map(c => c.name).join(', ') || '',
      'Expert(s)':          r.experts?.map(e => e.name).join(', ') || '',
      'Candidate Name':     r.candidateName || '',
      'Candidate Email':    r.candidateEmail || '',
      'Candidate Mobile':   r.candidateMobile || '',
      'Current Employer':   r.currentEmployer || '',
      'RH ID':              r.rhId || '',
      'Highest Education':  r.highestEducation || '',
      'Current Location':   r.currentLocation || '',
      'Preferred Location': r.preferredLocation || '',
      'Relevant Exp':       r.relExp || '',
      'Total Exp':          r.totalExp || '',
      'Current CTC':        r.currentCTC || '',
      'Expected CTC':       r.expectedCTC || '',
      'Notice Period':      r.noticePeriod || '',
      'Tech Skills':        Array.isArray(r.techSkills) ? r.techSkills.join(', ') : (r.techSkills || ''),
      'Non-Tech Skills':    Array.isArray(r.nonTechSkills) ? r.nonTechSkills.join(', ') : (r.nonTechSkills || ''),
      'Status':             r.status || '',
      'Submitted On':       r.submittedAt ? dayjs(r.submittedAt).format('DD MMM YYYY') : '',
      'Status Updated On':  r.statusUpdatedAt ? dayjs(r.statusUpdatedAt).format('DD MMM YYYY') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto column widths
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length).slice(0, 50)) + 2,
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidate Report');

    const fileName = `CandidateReport_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'positionTitle', header: 'Position', size: 170,
      Cell: ({ row }) => (
        <span onClick={() => setPositionModal(row.original)}
          style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline dotted' }}
          title="View position details">
          {row.original.positionTitle || '—'}
        </span>
      ),
    },
    { accessorKey: 'client',        header: 'Client',      size: 130 },
    { accessorKey: 'clientspocName', header: 'Client SPOC', size: 140 },
    {
      accessorKey: 'recruiterName', header: 'Recruiter', size: 140,
      Cell: ({ row }) => (
        <span onClick={() => setRecruiterModal(row.original)}
          style={{ color: '#7c3aed', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline dotted' }}
          title="View recruiter details">
          {row.original.recruiterName || '—'}
        </span>
      ),
    },
    {
      id: 'coaches', header: 'Coach(es)', size: 160,
      accessorFn: row => row?.coaches?.map(c => c.name).join(', ') || '—',
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.original.coaches?.length > 0
            ? row.original.coaches.map((c, i) => (
                <Chip key={i} label={c.name} size="small" color="primary" variant="outlined"
                  onClick={() => setCoachExpertModal({ ...c, positionTitle: row.original.positionTitle, client: row.original.client })}
                  sx={{ cursor: 'pointer' }} />
              ))
            : <span style={{ color: '#9ca3af' }}>—</span>}
        </Box>
      ),
    },
    {
      id: 'experts', header: 'Expert(s)', size: 160,
      accessorFn: row => row?.experts?.map(e => e.name).join(', ') || '—',
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.original.experts?.length > 0
            ? row.original.experts.map((e, i) => (
                <Chip key={i} label={e.name} size="small" color="warning" variant="outlined"
                  onClick={() => setCoachExpertModal({ ...e, positionTitle: row.original.positionTitle, client: row.original.client })}
                  sx={{ cursor: 'pointer' }} />
              ))
            : <span style={{ color: '#9ca3af' }}>—</span>}
        </Box>
      ),
    },
    {
      accessorKey: 'candidateName', header: 'Candidate', size: 140,
      Cell: ({ row }) => (
        <span onClick={() => setCandidateModal(row.original)}
          style={{ color: '#059669', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline dotted' }}
          title="View candidate details">
          {row.original.candidateName || '—'}
        </span>
      ),
    },
    { accessorKey: 'candidateEmail',  header: 'Email',  size: 170 },
    { accessorKey: 'candidateMobile', header: 'Mobile', size: 120 },
    {
      id: 'submittedAt', header: 'Submitted', size: 130,
      accessorFn: row => row.submittedAt ? dayjs(row.submittedAt).valueOf() : 0,
      Cell: ({ row }) => fmtShort(row.original.submittedAt),
      sortingFn: 'basic',
    },
    {
      id: 'statusUpdatedAt', header: 'Status Updated', size: 140,
      accessorFn: row => row?.statusUpdatedAt ? dayjs(row?.statusUpdatedAt).valueOf() : 0,
      Cell: ({ row }) => fmtShort(row.original.statusUpdatedAt),
      sortingFn: 'basic',
    },
    {
      accessorKey: 'status', header: 'Status', size: 140,
      Cell: ({ cell }) => {
        const val = cell.getValue() || 'N/A';
        const sc = statusStyle(val);
        return (
          <span style={{
            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
            borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{val}</span>
        );
      },
    },
  ], []);

  const table = useMaterialReactTable({
    columns, data: filteredData,
    enableStickyHeader: true, enableColumnResizing: true, enableGlobalFilter: true,
    enableRowActions: true,
    positionActionsColumn: 'first',
    initialState: { density: 'compact', sorting: [{ id: 'submittedAt', desc: true }], pagination: { pageSize: 25 } },
    muiTableContainerProps: { sx: { maxHeight: 'calc(100vh - 420px)' } },
    muiTopToolbarProps: { sx: { background: '#f8fafc' } },
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: 'Edit',
        size: 60,
        muiTableHeadCellProps: { align: 'center' },
        muiTableBodyCellProps: { align: 'center' },
      },
    },
    renderRowActions: ({ row }) => (
      <IconButton
        size="small"
        title="Edit position assignments"
        onClick={() => setEditModal(row.original)}
        sx={{
          color: '#7c3aed',
          background: '#f5f3ff',
          border: '1px solid #ddd6fe',
          borderRadius: '8px',
          width: 30, height: 30,
          '&:hover': { background: '#ede9fe', color: '#6d28d9' },
        }}
      >
        <Edit2 size={14} />
      </IconButton>
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
        </span>
      </Box>
    ),
  });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error)   return <Box sx={{ p: 4, color: 'error.main', textAlign: 'center' }}>Failed to load: {error}</Box>;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ px: { xs: 1, md: 3 }, py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e3a5f' }}>Candidate Reports</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Click{' '}
            <strong style={{ color: '#2563eb' }}>position name</strong>,{' '}
            <strong style={{ color: '#7c3aed' }}>recruiter name</strong>,{' '}
            <strong style={{ color: '#059669' }}>candidate name</strong>, or any coach / expert chip to view full details.
          </p>
        </Box>

        {/* Search bar */}
        <Box sx={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', p: 2.5, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          {[
            { label: 'Position',    value: positionFilter,   set: setPositionFilter,   opts: positionOptions },
            { label: 'Client SPOC', value: clientspocFilter, set: setClientspocFilter, opts: clientspocOptions },
            { label: 'Recruiter',   value: recruiterFilter,  set: setRecruiterFilter,  opts: recruiterOptions },
            { label: 'Coach',       value: coachFilter,      set: setCoachFilter,      opts: coachOptions },
            { label: 'Expert',      value: expertFilter,     set: setExpertFilter,     opts: expertOptions },
            { label: 'Status',      value: statusFilter,     set: setStatusFilter,     opts: statusOptions },
          ].map(({ label, value, set, opts }) => (
            <FormControl key={label} size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{label}</InputLabel>
              <Select value={value} label={label} onChange={e => set(e.target.value)}>
                <MenuItem value="">All {label}s</MenuItem>
                {opts.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
          ))}
          <DatePicker label="From Date" value={dateFrom} onChange={setDateFrom}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} maxDate={dateTo || undefined} />
          <DatePicker label="To Date" value={dateTo} onChange={setDateTo}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} minDate={dateFrom || undefined} />
          <Button variant="outlined" size="small" onClick={handleReset} sx={{ height: 40, alignSelf: 'center' }}>
            Reset
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            startIcon={<Download size={15} />}
            sx={{
              height: 40, alignSelf: 'center',
              background: 'linear-gradient(135deg, #166534, #16a34a)',
              '&:hover': { background: 'linear-gradient(135deg, #14532d, #15803d)' },
              '&:disabled': { opacity: 0.5 },
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              fontWeight: 700, px: 2.5,
            }}
          >
            Export Excel
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <PositionModal    row={positionModal}   onClose={() => setPositionModal(null)} />
        <CandidateModal   row={candidateModal}  onClose={() => setCandidateModal(null)} />
        <RecruiterModal   row={recruiterModal}  onClose={() => setRecruiterModal(null)} />
        <CoachExpertModal item={coachExpertModal} onClose={() => setCoachExpertModal(null)} />
        <EditPositionModal
          position={editModal}
          onClose={() => setEditModal(null)}
          onSaved={fetchData}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default SuperAdminReports;
