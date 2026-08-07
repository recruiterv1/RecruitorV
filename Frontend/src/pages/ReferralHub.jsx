import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, Eye, Link2, Search, Bookmark, Trash2,
  FileText, Mic, Target, Coins, Loader2, Inbox,
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import ReferralUploadModal from './ReferralUploadModal';

// ─────────────────────────────────────────────────────────────────────────────
// Refer & Earn hub — dark themed, per the approved design.
//
// Every figure shown comes from real referral records. Metrics whose underlying
// system does not exist yet (resume view tracking, AI match scoring, and the
// rewards/payout ledger) are rendered as "—" with a "not tracked yet" note,
// rather than invented or shown as a misleading zero.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.rne-root{--bg:#0d1117;--panel:#151b26;--panel-2:#1a2130;--line:#232b3a;--ink:#e8ecf3;--ink-soft:#9aa6b8;--ink-faint:#68758a;--accent:#6366f1;--accent-soft:#818cf8;--green:#34d399;--amber:#fbbf24;--pink:#f472b6;--cyan:#22d3ee;background:var(--bg);color:var(--ink);min-height:100vh;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
.rne-root *{box-sizing:border-box;}
.rne-wrap{min-height:100vh;}
.rne-main{min-width:0;}
.rne-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 26px;border-bottom:1px solid var(--line);flex-wrap:wrap;}
.rne-head h1{margin:0;font-size:23px;font-weight:800;letter-spacing:-.4px;}
.rne-head p{margin:4px 0 0;font-size:12.5px;color:var(--ink-faint);}
.rne-head-r{display:flex;align-items:center;gap:10px;}
.rne-date{border:1px solid var(--line);border-radius:8px;padding:7px 12px;font-size:11.5px;color:var(--ink-soft);font-family:ui-monospace,monospace;}
.rne-btn{display:inline-flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:9px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:filter .13s ease;}
.rne-btn:hover{filter:brightness(1.1);}
.rne-body{padding:22px 26px 40px;}
.rne-lbl{font-size:11px;letter-spacing:1.6px;color:var(--ink-faint);font-weight:700;margin:0 0 12px;font-family:ui-monospace,monospace;}
.rne-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:14px;}
.rne-card{background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:16px;}
.rne-stat-h{display:flex;align-items:center;gap:7px;font-size:10.5px;letter-spacing:1.1px;color:var(--ink-faint);font-weight:700;font-family:ui-monospace,monospace;}
.rne-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.rne-stat-v{font-size:29px;font-weight:800;margin:9px 0 3px;letter-spacing:-1px;}
.rne-stat-v.na{color:var(--ink-faint);font-size:24px;}
.rne-stat-s{font-size:11.5px;color:var(--ink-faint);}
.rne-two{display:grid;grid-template-columns:1.55fr 1fr;gap:16px;margin-top:22px;}
@media(max-width:1100px){.rne-two{grid-template-columns:1fr;}}
.rne-panel-h{padding:15px 17px;border-bottom:1px solid var(--line);font-size:14.5px;font-weight:700;}
.rne-act{display:flex;gap:12px;padding:13px 17px;border-bottom:1px solid var(--line);align-items:flex-start;}
.rne-act:last-child{border-bottom:none;}
.rne-act-i{width:31px;height:31px;border-radius:9px;background:var(--panel-2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.rne-act-t{font-size:13px;line-height:1.45;}
.rne-act-w{font-size:11px;color:var(--ink-faint);font-family:ui-monospace,monospace;margin-top:3px;}
.rne-bar-row{margin-bottom:13px;}
.rne-bar-top{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;}
.rne-bar-top b{font-weight:700;}
.rne-bar{height:6px;border-radius:20px;background:var(--panel-2);overflow:hidden;}
.rne-bar span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,var(--accent),var(--accent-soft));}
.rne-conv{margin-top:16px;border:1px solid var(--line);border-radius:11px;padding:15px;text-align:center;background:var(--panel-2);}
.rne-conv-l{font-size:11.5px;color:var(--ink-soft);}
.rne-conv-v{font-size:27px;font-weight:800;color:var(--accent-soft);margin:3px 0;}
.rne-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;}
.rne-tab{border:1px solid var(--line);background:var(--panel);color:var(--ink-soft);border-radius:20px;padding:7px 15px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .13s ease;}
.rne-tab:hover{color:var(--ink);}
.rne-tab.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.rne-count{font-size:12px;color:var(--ink-faint);margin-bottom:12px;}
.rne-tblwrap{background:var(--panel);border:1px solid var(--line);border-radius:13px;overflow:hidden;}
.rne-scroll{overflow-x:auto;}
.rne-tbl{width:100%;border-collapse:collapse;min-width:860px;}
.rne-tbl th{text-align:left;font-size:10.5px;letter-spacing:1.1px;color:var(--ink-faint);font-weight:700;padding:12px 14px;border-bottom:1px solid var(--line);white-space:nowrap;font-family:ui-monospace,monospace;}
.rne-tbl td{padding:13px 14px;font-size:12.5px;border-bottom:1px solid var(--line);white-space:nowrap;}
.rne-tbl tr:last-child td{border-bottom:none;}
.rne-tbl tr:hover td{background:var(--panel-2);}
.rne-mono{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--ink-soft);}
.rne-pill{display:inline-block;border-radius:20px;padding:3px 10px;font-size:10.5px;font-weight:700;}
.rne-pill.gr{background:rgba(52,211,153,.14);color:var(--green);}
.rne-pill.am{background:rgba(251,191,36,.14);color:var(--amber);}
.rne-pill.ac{background:rgba(99,102,241,.16);color:var(--accent-soft);}
.rne-pill.gy{background:var(--panel-2);color:var(--ink-faint);}
.rne-pill.pk{background:rgba(244,114,182,.14);color:var(--pink);}
.rne-empty{text-align:center;padding:52px 20px;color:var(--ink-faint);}
.rne-empty svg{opacity:.4;margin-bottom:12px;}
.rne-empty h3{margin:0 0 6px;font-size:15px;font-weight:700;color:var(--ink-soft);}
.rne-empty p{margin:0;font-size:12.5px;max-width:430px;margin-inline:auto;line-height:1.6;}
.rne-note{margin-top:16px;background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:9px;padding:12px 15px;font-size:12px;color:var(--ink-soft);line-height:1.6;}
.rne-mkbar{display:flex;gap:12px;align-items:center;margin-bottom:18px;flex-wrap:wrap;}
.rne-search{flex:1;min-width:220px;position:relative;}
.rne-search input{width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:11px 13px 11px 38px;color:var(--ink);font-size:13px;font-family:inherit;}
.rne-search input:focus{outline:none;border-color:var(--accent);}
.rne-search input::placeholder{color:#475569;}
.rne-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#475569;}
.rne-sel{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:11px 13px;color:var(--ink);font-size:13px;font-family:inherit;cursor:pointer;}
.rne-sel:focus{outline:none;border-color:var(--accent);}
.rne-matched{font-size:12px;color:#475569;font-family:ui-monospace,'JetBrains Mono',monospace;white-space:nowrap;}
.rne-mk{display:grid;gap:16px;grid-template-columns:1fr;}
@media(min-width:1024px){.rne-mk{grid-template-columns:1fr 1fr;}}
@media(min-width:1400px){.rne-mk{grid-template-columns:1fr 1fr 1fr;}}
.rne-mkc{background:#111827;border:1px solid #1e2a40;border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;transition:box-shadow .2s ease;}
.rne-mkc:hover{box-shadow:0 18px 40px -16px rgba(0,0,0,.7);}
.rne-mkc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.rne-mkc-id{font-size:12px;font-family:ui-monospace,'JetBrains Mono',monospace;color:#475569;}
.rne-mkc-n{font-size:16px;font-weight:700;color:#e8eaf0;margin-top:2px;}
.rne-mkc-r{font-size:14px;color:#64748b;}
.rne-mkc-tag{font-size:12px;font-weight:600;padding:2px 9px;border-radius:20px;font-family:ui-monospace,'JetBrains Mono',monospace;white-space:nowrap;flex-shrink:0;}
.rne-mkc-tag.gr{background:rgba(16,185,129,.125);color:#10b981;border:1px solid rgba(16,185,129,.25);}
.rne-mkc-tag.ac{background:rgba(99,102,241,.125);color:#818cf8;border:1px solid rgba(99,102,241,.25);}
.rne-mkc-tag.am{background:rgba(245,158,11,.125);color:#f59e0b;border:1px solid rgba(245,158,11,.25);}
.rne-mkc-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;}
.rne-mkc-meta span.k{color:#475569;}
.rne-mkc-meta span.v{color:#94a3b8;}
.rne-mkc-chips{display:flex;flex-wrap:wrap;gap:6px;}
.rne-mkc-chip{font-size:12px;padding:2px 8px;border-radius:4px;background:#1e2535;color:#94a3b8;border:1px solid #1e2a40;}
.rne-mkc-foot{padding-top:12px;border-top:1px solid #1e2a40;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.rne-mkc-by{font-size:12px;color:#475569;line-height:1.5;}
.rne-mkc-by b{color:#6366f1;font-weight:600;}
.rne-mkc-acts{display:flex;gap:8px;align-items:center;}
.rne-mkc-save{background:#1e2535;border:1px solid #1e2a40;color:#64748b;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .13s ease;}
.rne-mkc-save:hover{color:#94a3b8;}
.rne-mkc-save.on{color:#818cf8;border-color:rgba(99,102,241,.4);}
.rne-mkc-del{background:#1e2535;border:1px solid #1e2a40;color:#64748b;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .13s ease;}
.rne-mkc-del:hover:not(:disabled){color:#f2879a;border-color:rgba(242,135,154,.4);}
.rne-mkc-del:disabled{opacity:.5;cursor:not-allowed;}
.rne-spin{animation:rnespin 1s linear infinite;}
@keyframes rnespin{to{transform:rotate(360deg);}}
.rne-mkc-use{background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:filter .13s ease;}
.rne-mkc-use:hover{filter:brightness(1.1);}
`;


const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const ago = (iso) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (isNaN(s)) return '';
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  return `${Math.floor(s / 86400)} days ago`;
};
const maskEmail = (e) => {
  if (!e) return '—';
  const [n, d] = e.split('@');
  if (!d) return '—';
  return (n.length <= 2 ? n[0] + '***' : n[0] + '***' + n[n.length - 1]) + '@' + d;
};

const STAGE_PILL = {
  joined: 'gr', offer: 'pk', interview: 'ac', shortlisted: 'ac',
  submitted: 'am', available: 'gy', rejected: 'gy',
};
const STAGE_LABEL = {
  joined: 'Joined', offer: 'Offer', interview: 'Interview', shortlisted: 'Shortlisted',
  submitted: 'Submitted', available: 'Available', rejected: 'Closed',
};

const Stat = ({ label, value, sub, color, na }) => (
  <div className="rne-card">
    <div className="rne-stat-h"><span className="rne-dot" style={{ background: color }} />{label}</div>
    <div className={`rne-stat-v${na ? ' na' : ''}`}>{na ? '—' : value}</div>
    <div className="rne-stat-s">{sub}</div>
  </div>
);

const Empty = ({ title, children }) => (
  <div className="rne-empty">
    <Inbox size={40} />
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);

// Simple prev/next pager shared by the marketplace + my-referrals lists.
const Pager = ({ page, totalPages, total, pageSize, onChange }) => {
  if (total <= pageSize) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 4px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-faint, #64748b)' }}>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: 13 }}>Prev</button>
        <span style={{ fontSize: 13, color: 'var(--ink-faint, #64748b)', padding: '0 4px' }}>Page {page} / {totalPages}</span>
        <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: 13 }}>Next</button>
      </div>
    </div>
  );
};

export default function ReferralHub({ view = 'dashboard' }) {
  const { user } = useContext(UserStateContext);
  const [data, setData] = useState(null);
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState('All');
  const [mkQuery, setMkQuery] = useState('');
  const [mkExp, setMkExp] = useState('all');
  const [page, setPage] = useState(1);
  const MK_PAGE = 12;  // marketplace cards per page
  const MR_PAGE = 20;  // my-referrals rows per page
  // Reset to page 1 whenever the view or any filter changes.
  useEffect(() => { setPage(1); }, [view, filter, mkQuery, mkExp]);
  const navigate = useNavigate();
  // "Save for later" is a local bookmark — there is no server-side saved list yet.
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rne_saved') || '[]'); } catch { return []; }
  });
  // "Use Resume" — carry this candidate to Assigned Positions. Picking a position
  // there opens the Submit Candidate form pre-filled with these details.
  const useResume = (r) => {
    try {
      sessionStorage.setItem('rne_use_resume', JSON.stringify({
        id: r.id, candidate: r.candidate || '', emails: r.emails || '', mob: r.mob || '',
        dob: r.dob || '', curr_emp: r.curr_emp || '', highest_education: r.highest_education || '',
        current_ctc: r.current_ctc || '', exp_ctc: r.exp_ctc || '',
        total_exp: r.total_exp || '', rel_exp: r.rel_exp || '',
        notice_period: r.notice_period || '', curr_state: r.curr_state || '', curr_loc: r.curr_loc || '',
        pref_state: r.pref_state || '', pref_loc: r.pref_loc || '',
        skill_type: r.skill_type || '', tech_category: r.tech_category || '',
        tech_subcategory: r.tech_subcategory || '',
        tech_skill: r.tech_skill || [], tech_exp: r.tech_exp || [],
        nontech_category: r.nontech_category || '', nontech_subcategory: r.nontech_subcategory || '',
        nontech_skill: r.nontech_skill || [], nontech_exp: r.nontech_exp || [],
        cv_data: r.cv_data || '', pan_number: r.pan_number || '',
      }));
    } catch (_) { /* storage unavailable — the form simply opens empty */ }
    navigate('/assigned-positions?use_resume=1');
  };

  // Remove a referral from the pool. Server re-checks ownership and refuses if the
  // resume has already been used on a position.
  const [deletingId, setDeletingId] = useState(null);
  const deleteReferral = async (r) => {
    if (!window.confirm(`Remove ${r.candidate || 'this resume'} from the marketplace?\n\nThis deletes the referral permanently and cannot be undone.`)) return;
    setDeletingId(r.id);
    try {
      const res = await axios.delete(`/api/referral/${r.id}`, { withCredentials: true });
      if (res.data?.success) load();
      else alert(res.data?.message || 'Could not remove this resume.');
    } catch (e) {
      alert(e.response?.data?.message || 'Could not remove this resume.');
    } finally { setDeletingId(null); }
  };

  const toggleSaved = (id) => setSavedIds(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    try { localStorage.setItem('rne_saved', JSON.stringify(next)); } catch (_) {}
    return next;
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/referral/stats', { withCredentials: true }).catch(() => ({ data: null })),
      axios.get('/api/referral/my-referrals', { withCredentials: true }).catch(() => ({ data: null })),
    ]).then(([s, r]) => {
      setData(s.data || null);
      setRefs(r.data?.referrals || []);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const st = data?.stats || {};
  const na = data?.unavailable || {};
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const heading = {
    dashboard:     ['Referral Dashboard', 'Overview of your referral activity and pipeline performance'],
    marketplace:   ['My Resume Bank', 'Referred resumes available in the pool'],
    'my-referrals':['My Referrals', 'Track all resumes you have uploaded to the marketplace'],
    earnings:      ['Earnings', 'Referral rewards and payment history'],
    notifications: ['Notifications', 'Updates on your referred candidates'],
  }[view] || ['Refer & Earn', ''];

  const pipeline = [
    ['Used', st.used || 0], ['Submitted', st.submitted || 0], ['Shortlisted', st.shortlisted || 0],
    ['Interview', st.interview || 0], ['Offer', st.offer || 0], ['Joined', st.joined || 0],
  ];
  const pipeMax = Math.max(...pipeline.map(p => p[1]), 1);

  const filtered = useMemo(() => {
    if (filter === 'All') return refs;
    return refs.filter(r => {
      const s = (r.statusa || '').toLowerCase();
      if (filter === 'Available') return !r.pos_id;
      if (filter === 'Active') return !!r.pos_id;
      return s.includes(filter.toLowerCase());
    });
  }, [refs, filter]);

  return (
    <div className="rne-root">
      <style>{CSS}</style>
      <div className="rne-wrap">
        {/* Main */}
        <main className="rne-main">
          <div className="rne-head">
            <div>
              <h1>{heading[0]}</h1>
              <p>{heading[1]}</p>
            </div>
            <div className="rne-head-r">
              <span className="rne-date">{today}</span>
              <button className="rne-btn" onClick={() => setShowUpload(true)}><Plus size={15} /> Upload Resume</button>
            </div>
          </div>

          <div className="rne-body">
            {loading ? (
              <div className="rne-empty"><Loader2 className="animate-spin" size={26} /><p style={{ marginTop: 10 }}>Loading…</p></div>
            ) : (
              <>
                {/* ── Dashboard ── */}
                {view === 'dashboard' && (
                  <>
                    <p className="rne-lbl">OVERVIEW</p>
                    <div className="rne-grid">
                      <Stat label="TOTAL UPLOADED" value={st.totalUploaded ?? 0} sub="All time" color="var(--accent-soft)" />
                      <Stat label="MATCHED" na={na.matched} sub="Match scoring not enabled yet" color="var(--cyan)" />
                      <Stat label="VIEWED" na={na.viewed} sub="View tracking not enabled yet" color="var(--pink)" />
                      <Stat label="USED" value={st.used ?? 0} sub="In active pipelines" color="var(--accent)" />
                      <Stat label="SUBMITTED" value={st.submitted ?? 0} sub="To clients" color="var(--amber)" />
                      <Stat label="OFFER / JOINED" value={`${st.offer ?? 0} / ${st.joined ?? 0}`} sub="Converted" color="var(--green)" />
                      <Stat label="REWARDS GENERATED" na={na.rewardsGenerated} sub="Rewards ledger not enabled yet" color="var(--green)" />
                      <Stat label="REWARDS PAID" na={na.rewardsPaid} sub="Rewards ledger not enabled yet" color="var(--green)" />
                    </div>

                    <div className="rne-two">
                      <div className="rne-card" style={{ padding: 0 }}>
                        <div className="rne-panel-h">Recent Activity</div>
                        {(data?.activity || []).length === 0 ? (
                          <Empty title="No activity yet">
                            Activity appears here once a recruiter picks up one of your referred resumes
                            and moves the candidate through the hiring pipeline.
                          </Empty>
                        ) : data.activity.map((a, i) => (
                          <div className="rne-act" key={i}>
                            <div className="rne-act-i">
                              {a.stage === 'joined' ? <Target size={15} color="var(--green)" />
                                : a.stage === 'offer' ? <Coins size={15} color="var(--pink)" />
                                : a.stage === 'interview' ? <Mic size={15} color="var(--accent-soft)" />
                                : a.stage === 'submitted' ? <FileText size={15} color="var(--amber)" />
                                : <Link2 size={15} color="var(--ink-soft)" />}
                            </div>
                            <div>
                              <div className="rne-act-t">
                                <b>{a.candidate}</b>
                                {a.status ? ` — ${a.status}` : ''}
                                {a.posName ? ` for ${a.posName}` : ''}
                                {a.client ? ` @ ${a.client}` : ''}
                              </div>
                              <div className="rne-act-w">{ago(a.at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rne-card">
                        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 14 }}>Pipeline Breakdown</div>
                        {pipeline.map(([l, v]) => (
                          <div className="rne-bar-row" key={l}>
                            <div className="rne-bar-top"><span style={{ color: 'var(--ink-soft)' }}>{l}</span><b>{v}</b></div>
                            <div className="rne-bar"><span style={{ width: `${(v / pipeMax) * 100}%` }} /></div>
                          </div>
                        ))}
                        <div className="rne-conv">
                          <div className="rne-conv-l">Conversion Rate</div>
                          <div className="rne-conv-v">{st.conversionRate ?? 0}%</div>
                          <div className="rne-conv-l">Upload → Joined</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Marketplace ── */}
                {view === 'marketplace' && (() => {
                  // The pool = resumes available to reuse: those not tied to a
                  // position, PLUS screen-rejected candidates (e.g. rejected
                  // direct applicants) which are free to be used for other roles.
                  const pool = refs.filter(r => !r.pos_id || (r.statusa || '').toLowerCase() === 'screen reject');
                  const skills = (r) => [
                    ...(Array.isArray(r.tech_skill) ? r.tech_skill : []),
                    ...(Array.isArray(r.nontech_skill) ? r.nontech_skill : []),
                  ].map(String).filter(Boolean);
                  const yrs = (r) => {
                    const m = String(r.total_exp || '').match(/(\d+)/);
                    return m ? parseInt(m[1], 10) : null;
                  };
                  const shown = pool.filter(r => {
                    if (mkQuery.trim()) {
                      const q = mkQuery.trim().toLowerCase();
                      const hay = [r.candidate, r.curr_emp, r.curr_loc, ...skills(r)].join(' ').toLowerCase();
                      if (!hay.includes(q)) return false;
                    }
                    if (mkExp !== 'all') {
                      const y = yrs(r);
                      if (y === null) return false;
                      if (mkExp === '0-3' && !(y <= 3)) return false;
                      if (mkExp === '3-7' && !(y > 3 && y <= 7)) return false;
                      if (mkExp === '7+' && !(y > 7)) return false;
                    }
                    return true;
                  });
                  return (
                    <>
                      <div className="rne-mkbar">
                        <div className="rne-search">
                          <Search size={15} />
                          <input value={mkQuery} onChange={e => setMkQuery(e.target.value)} placeholder="Filter by skill..." />
                        </div>
                        <select className="rne-sel" value={mkExp} onChange={e => setMkExp(e.target.value)}>
                          <option value="all">All Experience</option>
                          <option value="0-3">0–3 years</option>
                          <option value="3-7">3–7 years</option>
                          <option value="7+">7+ years</option>
                        </select>
                        <span className="rne-matched">{shown.length} candidate{shown.length !== 1 ? 's' : ''} available</span>
                      </div>

                      {shown.length === 0 ? (
                        <div className="rne-tblwrap">
                          <Empty title={pool.length ? 'No matches' : 'Nothing in the pool'}>
                            {pool.length
                              ? 'No referred resumes match this filter. Try clearing the search or experience range.'
                              : <>Resumes you upload stay here until a recruiter picks them up for a position. Use <b>Upload Resume</b> to add one.</>}
                          </Empty>
                        </div>
                      ) : (
                        <div className="rne-mk">
                          {shown.slice((page - 1) * MK_PAGE, page * MK_PAGE).map(r => {
                            const sk = skills(r);
                            const saved = savedIds.includes(r.id);
                            return (
                              <div className="rne-mkc" key={r.id}>
                                <div className="rne-mkc-top">
                                  <div style={{ minWidth: 0 }}>
                                    <div className="rne-mkc-id">C-{r.id.slice(0, 4).toUpperCase()}</div>
                                    <div className="rne-mkc-n">{r.candidate || '—'}</div>
                                    <div className="rne-mkc-r">{r.tech_category || r.nontech_category || r.skill_type || 'Candidate'}</div>
                                  </div>
                                  <span className="rne-mkc-tag gr">Available</span>
                                </div>

                                <div className="rne-mkc-meta">
                                  <div><span className="k">Company </span><span className="v">{r.curr_emp || '—'}</span></div>
                                  <div><span className="k">Experience </span><span className="v">{r.total_exp || '—'}</span></div>
                                  <div><span className="k">Location </span><span className="v">{r.curr_loc || '—'}</span></div>
                                  <div><span className="k">Notice </span><span className="v">{r.notice_period || '—'}</span></div>
                                  <div><span className="k">Current CTC </span><span className="v">{r.current_ctc || '—'}</span></div>
                                  <div><span className="k">Expected CTC </span><span className="v">{r.exp_ctc || '—'}</span></div>
                                </div>

                                {sk.length > 0 && (
                                  <div className="rne-mkc-chips">
                                    {sk.slice(0, 6).map((x, i) => <span className="rne-mkc-chip" key={i}>{x}</span>)}
                                  </div>
                                )}

                                <div className="rne-mkc-foot">
                                  <div className="rne-mkc-by">
                                    <div>By <b>You</b></div>
                                    <div>{fmtDate(r.referredAt)}</div>
                                  </div>
                                  <div className="rne-mkc-acts">
                                    <button className={`rne-mkc-save${saved ? ' on' : ''}`} title={saved ? 'Saved' : 'Save for later'}
                                      onClick={() => toggleSaved(r.id)}>
                                      <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                                    </button>
                                    <button className="rne-mkc-del" title="Remove from marketplace"
                                      disabled={deletingId === r.id}
                                      onClick={() => deleteReferral(r)}>
                                      {deletingId === r.id ? <Loader2 size={15} className="rne-spin" /> : <Trash2 size={15} />}
                                    </button>
                                    <button className="rne-mkc-use" onClick={() => useResume(r)}>Use Resume</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <Pager page={page} totalPages={Math.max(1, Math.ceil(shown.length / MK_PAGE))} total={shown.length} pageSize={MK_PAGE} onChange={setPage} />

                      <div className="rne-note">
                        A shared marketplace of other recruiters' referred resumes with AI match scoring
                        isn't built yet — this shows your own pool, so the match badge reads <b>Available</b>
                        rather than a match percentage. <b>Use Resume</b> takes you to Open Positions to pick
                        a position, where the submit form auto-fills from the candidate's email.
                      </div>
                    </>
                  );
                })()}

                {/* ── My Referrals ── */}
                {view === 'my-referrals' && (
                  <>
                    <div className="rne-tabs">
                      {['All', 'Available', 'Active'].map(f => (
                        <button key={f} className={`rne-tab${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                      ))}
                    </div>
                    <div className="rne-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
                    <div className="rne-tblwrap">
                      {filtered.length === 0 ? (
                        <Empty title="No referrals yet">
                          Resumes you refer appear here with their live pipeline stage.
                          Use <b>Upload Resume</b> to refer your first candidate.
                        </Empty>
                      ) : (
                        <div className="rne-scroll">
                          <table className="rne-tbl">
                            <thead><tr>
                              <th>RESUME ID</th><th>CANDIDATE</th><th>UPLOADED</th><th>POSITION</th>
                              <th>USED BY</th><th>STAGE</th><th>REWARD</th><th>STATUS</th>
                            </tr></thead>
                            <tbody>
                              {filtered.slice((page - 1) * MR_PAGE, page * MR_PAGE).map(r => {
                                const stage = (r.statusa || 'Available');
                                const key = stage.toLowerCase() === 'available' ? 'available' : 'submitted';
                                return (
                                  <tr key={r.id}>
                                    <td className="rne-mono">{r.id.slice(0, 8).toUpperCase()}</td>
                                    <td style={{ fontWeight: 600 }}>{r.candidate || '—'}</td>
                                    <td className="rne-mono">{fmtDate(r.referredAt)}</td>
                                    <td>{r.pos_name || '—'}</td>
                                    <td>{r.usedByName || '—'}</td>
                                    <td>{stage}</td>
                                    <td style={{ color: 'var(--ink-faint)' }}>—</td>
                                    <td><span className={`rne-pill ${STAGE_PILL[key]}`}>{r.pos_id ? 'Active' : STAGE_LABEL[key]}</span></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <Pager page={page} totalPages={Math.max(1, Math.ceil(filtered.length / MR_PAGE))} total={filtered.length} pageSize={MR_PAGE} onChange={setPage} />
                    <div className="rne-note">
                      Reward amounts show <b>—</b> because the rewards ledger isn't built yet.
                      Once referral payouts are configured, potential and actual earnings appear in this column.
                    </div>
                  </>
                )}

                {/* ── Earnings ── */}
                {view === 'earnings' && (
                  <>
                    <div className="rne-grid">
                      <Stat label="TOTAL EARNED"  na sub="Rewards ledger not enabled yet" color="var(--green)" />
                      <Stat label="PAID OUT"      na sub="Rewards ledger not enabled yet" color="var(--green)" />
                      <Stat label="APPROVED"      na sub="Rewards ledger not enabled yet" color="var(--amber)" />
                      <Stat label="PENDING"       na sub="Rewards ledger not enabled yet" color="var(--ink-faint)" />
                    </div>
                    <p className="rne-lbl" style={{ marginTop: 24 }}>REWARD HISTORY</p>
                    <div className="rne-tblwrap">
                      <Empty title="No reward records">
                        Referral rewards aren't being tracked yet — there's no payout ledger in the system.
                        Your referred candidates and their pipeline stages are visible under <b>My Referrals</b>.
                      </Empty>
                    </div>
                    <div className="rne-note">
                      To make this page live I'd need to build a rewards engine: reward rules per placement,
                      approval workflow, and payout tracking. Say the word and I'll scope it.
                    </div>
                  </>
                )}

                {/* ── Notifications ── */}
                {view === 'notifications' && (
                  <div className="rne-tblwrap">
                    {(data?.activity || []).length === 0 ? (
                      <Empty title="No notifications">
                        You'll be notified here when one of your referred candidates is picked up
                        or moves forward in a hiring pipeline.
                      </Empty>
                    ) : data.activity.map((a, i) => (
                      <div className="rne-act" key={i}>
                        <div className="rne-act-i"><Eye size={15} color="var(--accent-soft)" /></div>
                        <div>
                          <div className="rne-act-t">
                            <b>{a.candidate}</b>{a.status ? ` — ${a.status}` : ''}
                            {a.posName ? ` for ${a.posName}` : ''}{a.client ? ` @ ${a.client}` : ''}
                          </div>
                          <div className="rne-act-w">{ago(a.at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Upload Resume — two-step dark modal, matching the design */}
      {showUpload && (
        <ReferralUploadModal
          onClose={() => setShowUpload(false)}
          onSubmitted={load}
        />
      )}

    </div>
  );
}
