import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import {
  LayoutDashboard, UserPlus, ClipboardList, LogOut,
  ChevronLeft, ChevronRight, Gift, Upload, CheckCircle,
  Users, TrendingUp, FileText, Search, Eye, X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Static data (India states/cities + skill options)
// ─────────────────────────────────────────────────────────────────────────────
const indiaStates = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
];

const skillTypes = ['Technical', 'Non-Technical', 'Both'];
const techCats   = ['IT / Software','Data & Analytics','Cloud & DevOps','Cybersecurity','Hardware / Networking','Other Tech'];
const nonTechCats = ['Sales','Marketing','Finance','HR','Operations','Customer Service','Legal','Other'];
const expOptions  = ['< 1 yr','1 yr','2 yr','3 yr','4 yr','5 yr','6 yr','7 yr','8 yr','9 yr','10+ yr'];
const noticePeriodOptions = ['Immediate','15 days','30 days','45 days','60 days','90 days'];
const educationOptions = ['10th','12th','Diploma','B.Tech/B.E.','B.Sc','BCA','B.Com','B.A.','MBA','MCA','M.Tech','M.Sc','Ph.D','Other'];

const defaultForm = {
  candidate:'', emails:'', mob:'', dob:'',
  curr_emp:'', highest_education:'',
  current_ctc:'', exp_ctc:'',
  total_exp_year:'', total_exp_months:'', rel_exp_year:'', rel_exp_months:'',
  notice_period:'',
  curr_state:'', curr_loc:'', pref_state:'', pref_loc:'',
  skill_type:'', tech_category:'', tech_subcategory:'', nontech_category:'', nontech_subcategory:'',
  tech_skill:[], tech_exp:[], nontech_skill:[], nontech_exp:[],
  self_rate:'',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
const RefererSidebar = ({ activeView, setActiveView }) => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const { user } = useContext(UserStateContext);
  const isCollapsed = isSidebarCollapsed || false;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await axios.post('/auth/logout', {}, { withCredentials: true }); } catch {}
    window.location.href = '/log_rec';
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',       view: 'dashboard' },
    { icon: UserPlus,        label: 'Add Candidate',   view: 'add' },
    { icon: ClipboardList,   label: 'Candidate Status', view: 'status' },
  ];

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-violet-700 to-purple-900 transition-all duration-300 shadow-2xl flex flex-col`}
      style={{ height: '100%' }}
    >
      {/* Logo */}
      <div className="flex-shrink-0 p-4 border-b border-purple-500/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV" className="w-auto object-contain" style={{ height: 40 }} />
          )}
          {isCollapsed && (
            <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV" className="w-auto object-contain mx-auto" style={{ height: 30 }} />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isCollapsed)}
            className={`p-2 text-white hover:bg-purple-600 rounded-lg transition-colors flex-shrink-0 ${isCollapsed ? 'mx-auto mt-2' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* User info */}
      {!isCollapsed && (
        <div className="flex-shrink-0 p-4 border-b border-purple-500/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user?.name || 'R').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name || 'Referrer'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Gift size={10} className="text-yellow-300" />
                <p className="text-purple-200 text-xs">Referrer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = activeView === item.view;
            return (
              <li key={item.view}>
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all w-full text-left group relative
                    ${active ? 'bg-white text-purple-700 shadow-lg font-bold' : 'text-purple-100 hover:bg-purple-600/50 hover:text-white font-medium'}
                    ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm flex-1 truncate">{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-xl pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 p-3 border-t border-purple-500/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-purple-200 hover:bg-purple-600/50 hover:text-white transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard View
// ─────────────────────────────────────────────────────────────────────────────
const DashboardView = ({ summary, candidates, setActiveView }) => {
  const { user } = useContext(UserStateContext);
  const statCards = [
    { label: 'Total Submitted',  value: summary.total,      color: '#6d28d9', bg: '#f5f3ff', icon: Users },
    { label: 'Used / Placed',    value: summary.used,       color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle },
    { label: 'Available Pool',   value: summary.available,  color: '#2563eb', bg: '#eff6ff', icon: TrendingUp },
    { label: 'Shortlisted',      value: summary.shortlisted,color: '#d97706', bg: '#fffbeb', icon: Gift },
  ];

  return (
    <div>
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed,#a855f7)', borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Gift size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Welcome, {user?.name || 'Referrer'}! 👋</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 14 }}>Submit candidates and earn commissions when they get placed.</p>
          </div>
          <button
            onClick={() => setActiveView('add')}
            style={{ marginLeft: 'auto', background: '#fff', color: '#7c3aed', border: 'none', borderRadius: 12, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            <UserPlus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color }}>{value}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent submissions */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Recent Submissions</h3>
          {candidates.length > 5 && (
            <button onClick={() => setActiveView('status')} style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>View all →</button>
          )}
        </div>
        {candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <UserPlus size={40} color="#a855f7" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>No candidates yet</p>
            <p style={{ margin: '6px 0 16px', color: '#64748b', fontSize: 13 }}>Submit your first candidate to start earning</p>
            <button onClick={() => setActiveView('add')} style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Add Candidate
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Candidate','Email / Phone','Skills','Status','Submitted On'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 5).map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>{c.candidate}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      <div>{c.emails}</div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>{c.mob}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      {(c.tech_skill || []).slice(0, 2).map(s => (
                        <span key={s} style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 4, display: 'inline-block', marginBottom: 2 }}>{s}</span>
                      ))}
                      {(c.tech_skill || []).length > 2 && <span style={{ fontSize: 11, color: '#9ca3af' }}>+{c.tech_skill.length - 2}</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: c.statusa === 'Available' ? '#f0fdf4' : c.statusa === 'Shortlisted' ? '#fffbeb' : '#eff6ff',
                        color: c.statusa === 'Available' ? '#16a34a' : c.statusa === 'Shortlisted' ? '#d97706' : '#2563eb',
                        borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                      }}>{c.statusa || 'Available'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {c.referredAt ? new Date(c.referredAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
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

// ─────────────────────────────────────────────────────────────────────────────
// Add Candidate View  (same fields as CandidateApply)
// ─────────────────────────────────────────────────────────────────────────────
const AddCandidateView = ({ onSuccess }) => {
  const [form, setForm]           = useState(defaultForm);
  const [cvFile, setCvFile]       = useState(null);
  const [cvUrl, setCvUrl]         = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitOk, setSubmitOk]   = useState(false);
  const [techSkillInput, setTechSkillInput]     = useState('');
  const [techExpInput, setTechExpInput]         = useState('');
  const [nonTechSkillInput, setNonTechSkillInput] = useState('');
  const [nonTechExpInput, setNonTechExpInput]   = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const uploadCV = async (file) => {
    if (!file) return '';
    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await axios.post('/api/direct-apply/upload-cv', {
        filename: file.name, contentType: file.type, base64,
      }, { withCredentials: true });
      return res.data.url || '';
    } catch { return ''; }
    finally { setUploading(false); }
  };

  const handleAddTechSkill = () => {
    if (!techSkillInput.trim() || !techExpInput) return;
    setForm(f => ({ ...f, tech_skill: [...f.tech_skill, techSkillInput.trim()], tech_exp: [...f.tech_exp, techExpInput] }));
    setTechSkillInput(''); setTechExpInput('');
  };
  const handleAddNonTechSkill = () => {
    if (!nonTechSkillInput.trim() || !nonTechExpInput) return;
    setForm(f => ({ ...f, nontech_skill: [...f.nontech_skill, nonTechSkillInput.trim()], nontech_exp: [...f.nontech_exp, nonTechExpInput] }));
    setNonTechSkillInput(''); setNonTechExpInput('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.candidate || !form.mob || !form.emails) {
      setSubmitError('Name, mobile, and email are required.'); return;
    }
    setSubmitting(true); setSubmitError('');
    let cv_url = cvUrl;
    if (cvFile && !cvUrl) cv_url = await uploadCV(cvFile);
    const total_exp = `${form.total_exp_year || 0} yr ${form.total_exp_months || 0} mo`;
    const rel_exp   = `${form.rel_exp_year || 0} yr ${form.rel_exp_months || 0} mo`;
    try {
      await axios.post('/api/referer/submit', {
        ...form, total_exp, rel_exp, cv_url,
        tech_skill: JSON.stringify(form.tech_skill),
        tech_exp: JSON.stringify(form.tech_exp),
        nontech_skill: JSON.stringify(form.nontech_skill),
        nontech_exp: JSON.stringify(form.nontech_exp),
      }, { withCredentials: true });
      setSubmitOk(true);
      setForm(defaultForm); setCvFile(null); setCvUrl('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const inp = { width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', color: '#1e293b', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 };
  const sec = { background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '20px 22px', marginBottom: 18 };
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 };

  if (submitOk) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ width: 72, height: 72, background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCircle size={36} color="#22c55e" />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#166534' }}>Candidate Submitted!</h3>
      <p style={{ margin: '0 0 24px', color: '#374151', fontSize: 14 }}>The candidate has been added to the pool and will be visible to all verified recruiters.</p>
      <button onClick={() => setSubmitOk(false)} style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
        + Submit Another
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: '#fff' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900 }}>Add a Candidate</h2>
        <p style={{ margin: 0, opacity: 0.85, fontSize: 13 }}>Fill in the candidate's details below. Their profile will be shared with all recruiters on the platform.</p>
      </div>

      {/* Personal Info */}
      <div style={sec}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#1e293b', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Personal Information</h3>
        <div style={grid}>
          {[['candidate','Full Name','text',true],['emails','Email','email',true],['mob','Mobile','tel',true],['dob','Date of Birth','date',false]].map(([name,label,type,req]) => (
            <div key={name}>
              <label style={lbl}>{label}{req && <span style={{ color:'#ef4444' }}> *</span>}</label>
              <input name={name} value={form[name]} onChange={handleChange} type={type} required={req} style={inp} placeholder={label} />
            </div>
          ))}
          <div>
            <label style={lbl}>Current Employer</label>
            <input name="curr_emp" value={form.curr_emp} onChange={handleChange} style={inp} placeholder="Company name" />
          </div>
          <div>
            <label style={lbl}>Highest Education</label>
            <select name="highest_education" value={form.highest_education} onChange={handleChange} style={inp}>
              <option value="">Select</option>
              {educationOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Experience & CTC */}
      <div style={sec}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#1e293b', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Experience & CTC</h3>
        <div style={grid}>
          <div>
            <label style={lbl}>Total Experience</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select name="total_exp_year" value={form.total_exp_year} onChange={handleChange} style={{ ...inp, flex: 1 }}>
                <option value="">Yrs</option>
                {Array.from({length:21},(_,i)=>i).map(n=><option key={n}>{n}</option>)}
              </select>
              <select name="total_exp_months" value={form.total_exp_months} onChange={handleChange} style={{ ...inp, flex: 1 }}>
                <option value="">Mos</option>
                {Array.from({length:12},(_,i)=>i).map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Relevant Experience</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select name="rel_exp_year" value={form.rel_exp_year} onChange={handleChange} style={{ ...inp, flex: 1 }}>
                <option value="">Yrs</option>
                {Array.from({length:21},(_,i)=>i).map(n=><option key={n}>{n}</option>)}
              </select>
              <select name="rel_exp_months" value={form.rel_exp_months} onChange={handleChange} style={{ ...inp, flex: 1 }}>
                <option value="">Mos</option>
                {Array.from({length:12},(_,i)=>i).map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Current CTC (LPA)</label>
            <input name="current_ctc" value={form.current_ctc} onChange={handleChange} style={inp} placeholder="e.g. 8" />
          </div>
          <div>
            <label style={lbl}>Expected CTC (LPA)</label>
            <input name="exp_ctc" value={form.exp_ctc} onChange={handleChange} style={inp} placeholder="e.g. 12" />
          </div>
          <div>
            <label style={lbl}>Notice Period</label>
            <select name="notice_period" value={form.notice_period} onChange={handleChange} style={inp}>
              <option value="">Select</option>
              {noticePeriodOptions.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={sec}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#1e293b', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Location</h3>
        <div style={grid}>
          {[['curr_state','Current State','pref_state','Preferred State'],['curr_loc','Current City','pref_loc','Preferred City']].flatMap(([a,al,b,bl]) => [
            <div key={a}><label style={lbl}>{al}</label>
              {a.includes('state') ? (
                <select name={a} value={form[a]} onChange={handleChange} style={inp}>
                  <option value="">Select state</option>
                  {indiaStates.map(s=><option key={s}>{s}</option>)}
                </select>
              ) : <input name={a} value={form[a]} onChange={handleChange} style={inp} placeholder={al} />}
            </div>,
            <div key={b}><label style={lbl}>{bl}</label>
              {b.includes('state') ? (
                <select name={b} value={form[b]} onChange={handleChange} style={inp}>
                  <option value="">Select state</option>
                  {indiaStates.map(s=><option key={s}>{s}</option>)}
                </select>
              ) : <input name={b} value={form[b]} onChange={handleChange} style={inp} placeholder={bl} />}
            </div>,
          ])}
        </div>
      </div>

      {/* Skills */}
      <div style={sec}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#1e293b', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Skills</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Skill Type</label>
          <select name="skill_type" value={form.skill_type} onChange={handleChange} style={{ ...inp, maxWidth: 260 }}>
            <option value="">Select</option>
            {skillTypes.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>

        {(form.skill_type === 'Technical' || form.skill_type === 'Both') && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Technical Category</label>
            <select name="tech_category" value={form.tech_category} onChange={e => setForm(f => ({ ...f, tech_category: e.target.value, tech_skill: [], tech_exp: [] }))} style={{ ...inp, maxWidth: 300, marginBottom: 10 }}>
              <option value="">Select category</option>
              {techCats.map(c=><option key={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={lbl}>Skill</label>
                <input value={techSkillInput} onChange={e=>setTechSkillInput(e.target.value)} style={inp} placeholder="e.g. React.js" />
              </div>
              <div style={{ width: 110 }}>
                <label style={lbl}>Experience</label>
                <select value={techExpInput} onChange={e=>setTechExpInput(e.target.value)} style={inp}>
                  <option value="">Select</option>
                  {expOptions.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <button type="button" onClick={handleAddTechSkill} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
            </div>
            {form.tech_skill.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.tech_skill.map((s, i) => (
                  <span key={i} style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd', borderRadius: 99, padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s} · {form.tech_exp[i]}
                    <button type="button" onClick={() => setForm(f => ({ ...f, tech_skill: f.tech_skill.filter((_,j)=>j!==i), tech_exp: f.tech_exp.filter((_,j)=>j!==i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 900, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {(form.skill_type === 'Non-Technical' || form.skill_type === 'Both') && (
          <div>
            <label style={lbl}>Non-Technical Category</label>
            <select name="nontech_category" value={form.nontech_category} onChange={e => setForm(f => ({ ...f, nontech_category: e.target.value, nontech_skill: [], nontech_exp: [] }))} style={{ ...inp, maxWidth: 300, marginBottom: 10 }}>
              <option value="">Select category</option>
              {nonTechCats.map(c=><option key={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={lbl}>Skill</label>
                <input value={nonTechSkillInput} onChange={e=>setNonTechSkillInput(e.target.value)} style={inp} placeholder="e.g. Digital Marketing" />
              </div>
              <div style={{ width: 110 }}>
                <label style={lbl}>Experience</label>
                <select value={nonTechExpInput} onChange={e=>setNonTechExpInput(e.target.value)} style={inp}>
                  <option value="">Select</option>
                  {expOptions.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <button type="button" onClick={handleAddNonTechSkill} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
            </div>
            {form.nontech_skill.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.nontech_skill.map((s, i) => (
                  <span key={i} style={{ background: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe', borderRadius: 99, padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s} · {form.nontech_exp[i]}
                    <button type="button" onClick={() => setForm(f => ({ ...f, nontech_skill: f.nontech_skill.filter((_,j)=>j!==i), nontech_exp: f.nontech_exp.filter((_,j)=>j!==i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 900, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Self Rating */}
        <div style={{ marginTop: 18 }}>
          <label style={lbl}>Self Rating (1–10)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({length:10},(_,i)=>i+1).map(n => (
              <button key={n} type="button" onClick={() => setForm(f => ({ ...f, self_rate: String(n) }))}
                style={{ width: 36, height: 36, borderRadius: 8, border: form.self_rate === String(n) ? 'none' : '1.5px solid #e2e8f0', background: form.self_rate === String(n) ? '#7c3aed' : '#fff', color: form.self_rate === String(n) ? '#fff' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CV Upload */}
      <div style={sec}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Resume / CV</h3>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #c4b5fd', borderRadius: 12, padding: '24px 16px', cursor: 'pointer', background: '#faf5ff', gap: 8 }}>
          <Upload size={28} color="#7c3aed" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6d28d9' }}>{cvFile ? cvFile.name : 'Click to upload PDF or Word'}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Max 5MB · PDF, DOC, DOCX</span>
          <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { setCvFile(e.target.files[0] || null); setCvUrl(''); }} />
        </label>
      </div>

      {submitError && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>
          {submitError}
        </div>
      )}

      <button type="submit" disabled={submitting || uploading}
        style={{ width: '100%', background: (submitting || uploading) ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 24px', fontSize: 15, fontWeight: 800, cursor: (submitting || uploading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
        {submitting ? 'Submitting…' : uploading ? 'Uploading CV…' : <><CheckCircle size={18} /> Submit Candidate</>}
      </button>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Candidate Status View
// ─────────────────────────────────────────────────────────────────────────────
const CandidateStatusView = ({ candidates, summary, loading }) => {
  const [search, setSearch]   = useState('');
  const [cvModal, setCvModal] = useState(null);

  const filtered = candidates.filter(c =>
    !search ||
    c.candidate.toLowerCase().includes(search.toLowerCase()) ||
    c.emails.toLowerCase().includes(search.toLowerCase()) ||
    (c.curr_loc || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = s => {
    if (!s) return { bg: '#f0fdf4', color: '#16a34a' };
    const sl = s.toLowerCase();
    if (sl === 'available') return { bg: '#f0fdf4', color: '#16a34a' };
    if (sl === 'shortlisted') return { bg: '#fffbeb', color: '#d97706' };
    if (sl === 'selected' || sl === 'offered' || sl === 'joined') return { bg: '#eff6ff', color: '#2563eb' };
    if (sl === 'not matching' || sl === 'rejected') return { bg: '#fef2f2', color: '#dc2626' };
    return { bg: '#f8fafc', color: '#64748b' };
  };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total',       value: summary.total,       color: '#6d28d9', bg: '#f5f3ff' },
          { label: 'Used/Placed', value: summary.used,        color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Available',   value: summary.available,   color: '#2563eb', bg: '#eff6ff' },
          { label: 'Shortlisted', value: summary.shortlisted, color: '#d97706', bg: '#fffbeb' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${color}22` }}>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color }}>{value}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or city…" style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#','Candidate','Email / Phone','Location','Skills','Status','Submitted On','Used Against','CV'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No candidates found.</td></tr>
              ) : filtered.map((c, i) => {
                const sc = statusColor(c.statusa);
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>{i+1}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{c.candidate}</td>
                    <td style={{ padding: '12px 14px', color: '#374151' }}>
                      <div>{c.emails}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{c.mob}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                      {c.curr_loc}{c.curr_state ? `, ${c.curr_state}` : ''}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {(c.tech_skill||[]).slice(0,2).map(s=>(
                        <span key={s} style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 3, display: 'inline-block', marginBottom: 2 }}>{s}</span>
                      ))}
                      {(c.tech_skill||[]).length > 2 && <span style={{ fontSize: 11, color: '#9ca3af' }}>+{c.tech_skill.length-2}</span>}
                      {(c.nontech_skill||[]).slice(0,1).map(s=>(
                        <span key={s} style={{ background: '#f3e8ff', color: '#7c3aed', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 3, display: 'inline-block', marginBottom: 2 }}>{s}</span>
                      ))}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{c.statusa || 'Available'}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {c.referredAt ? new Date(c.referredAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#374151' }}>
                      {c.pos_name ? (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{c.pos_name}</div>
                          {c.client && <div style={{ fontSize: 11, color: '#64748b' }}>{c.client}</div>}
                          {c.usedAt && <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(c.usedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                        </div>
                      ) : <span style={{ color: '#9ca3af', fontSize: 11 }}>Not yet used</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.cv_data ? (
                        <button onClick={() => setCvModal(c.cv_data)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
                          <Eye size={14} /> View
                        </button>
                      ) : <span style={{ color: '#9ca3af', fontSize: 11 }}>N/A</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CV Modal */}
      {cvModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Candidate CV</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={cvModal} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Open ↗</a>
                <button onClick={() => setCvModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff' }}><X size={16} /></button>
              </div>
            </div>
            <iframe src={cvModal} style={{ flex: 1, border: 'none', minHeight: 500 }} title="CV Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Content Wrapper
// ─────────────────────────────────────────────────────────────────────────────
const RefererContent = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary]       = useState({ total: 0, used: 0, available: 0, shortlisted: 0 });
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const res = await axios.get('/api/referer/my-candidates', { withCredentials: true });
      setCandidates(res.data.candidates || []);
      setSummary(res.data.summary || { total: 0, used: 0, available: 0, shortlisted: 0 });
    } catch { /* silent */ }
    finally { setLoadingCandidates(false); }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const { isSidebarCollapsed } = useContext(SidebarContext);

  const viewTitles = { dashboard: 'Dashboard', add: 'Add Candidate', status: 'Candidate Status' };

  return (
    <div
      className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col min-h-screen`}
    >
      <Dash_Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <main className="flex-1 p-4 sm:p-6 bg-gray-50">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{viewTitles[activeView]}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Referrer Dashboard · {viewTitles[activeView]}</p>
          </div>

          {activeView === 'dashboard' && (
            <DashboardView summary={summary} candidates={candidates} setActiveView={setActiveView} />
          )}
          {activeView === 'add' && (
            <AddCandidateView onSuccess={() => { fetchCandidates(); setActiveView('status'); }} />
          )}
          {activeView === 'status' && (
            <CandidateStatusView candidates={candidates} summary={summary} loading={loadingCandidates} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────
export default function RefererDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <RefererSidebar activeView={activeView} setActiveView={setActiveView} />
        </aside>

        {/* Mobile sidebar */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <RefererSidebar activeView={activeView} setActiveView={setActiveView} />
            </aside>
          </div>
        )}

        {/* Main */}
        <RefererContentWrapper
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
        />
      </div>
    </SidebarProvider>
  );
}

// Inner wrapper to access SidebarContext
function RefererContentWrapper({ isSidebarOpen, setIsSidebarOpen, activeView, setActiveView }) {
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary]       = useState({ total: 0, used: 0, available: 0, shortlisted: 0 });
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const { isSidebarCollapsed } = useContext(SidebarContext);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const res = await axios.get('/api/referer/my-candidates', { withCredentials: true });
      setCandidates(res.data.candidates || []);
      setSummary(res.data.summary || { total: 0, used: 0, available: 0, shortlisted: 0 });
    } catch { /* silent */ }
    finally { setLoadingCandidates(false); }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const viewTitles = { dashboard: 'Dashboard', add: 'Add Candidate', status: 'Candidate Status' };

  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col min-h-screen`}>
      <Dash_Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <main className="flex-1 p-4 sm:p-6 bg-gray-50">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{viewTitles[activeView]}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Referrer Dashboard · {viewTitles[activeView]}</p>
          </div>
          {activeView === 'dashboard' && (
            <DashboardView summary={summary} candidates={candidates} setActiveView={setActiveView} />
          )}
          {activeView === 'add' && (
            <AddCandidateView onSuccess={() => { fetchCandidates(); setActiveView('status'); }} />
          )}
          {activeView === 'status' && (
            <CandidateStatusView candidates={candidates} summary={summary} loading={loadingCandidates} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
