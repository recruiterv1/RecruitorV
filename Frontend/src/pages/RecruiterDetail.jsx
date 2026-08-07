import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  LayoutGrid, Activity, Target, Briefcase, AlertTriangle, Users, Trophy,
  ArrowLeft, ChevronDown, TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertCircle, Search, MessageCircle, Send, X,
} from 'lucide-react';

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0e17', sidebar: '#0b0f1b', card: '#111827', cardBorder: '#1e2740',
  inner: '#0f1524', innerBorder: '#1b2338',
  hi: '#e8edf6', mid: '#93a0b8', lo: '#5c6a83',
  green: '#34d399', greenBar: '#10b981', blue: '#60a5fa', indigo: '#818cf8',
  red: '#f87171', amber: '#fbbf24', purple: '#a78bfa', orange: '#fb923c', track: '#1e2740',
};
const AVA = ['#6366f1', '#10b981', '#a855f7', '#f97316', '#f59e0b', '#06b6d4', '#ec4899'];
const avaColor = (s = '') => AVA[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVA.length];
const initials = (s = '?') => s.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

// ── Small building blocks ────────────────────────────────────────────────────
const Card = ({ children, style, pad = 24 }) => (
  <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: pad, ...style }}>{children}</div>
);
const StatCard = ({ label, value, sub, valueColor }) => (
  <div style={{ background: C.inner, border: `1px solid ${C.innerBorder}`, borderRadius: 12, padding: '18px 20px' }}>
    <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: valueColor || C.hi, letterSpacing: 0.3 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: C.lo, marginTop: 4 }}>{sub}</div>}
  </div>
);
const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: 1, color: C.hi, textTransform: 'uppercase' }}>{title}</h3>
    {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: C.mid }}>{sub}</p>}
  </div>
);

const Ring = ({ pct, size = 108, stroke = 8, color = C.green, children }) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
};

const CatBar = ({ label, value, max }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
      <span style={{ color: C.mid }}>{label}</span><span style={{ color: C.hi, fontWeight: 600 }}>{value}/{max}</span>
    </div>
    <div style={{ height: 6, background: C.track, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: C.greenBar, borderRadius: 4 }} />
    </div>
  </div>
);

const num = (v, suffix = '') => (v === null || v === undefined) ? '—' : `${v}${suffix}`;

const SearchBox = ({ value, onChange, placeholder }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.inner, border: `1px solid ${C.innerBorder}`, borderRadius: 9, padding: '7px 11px' }}>
    <Search size={14} color={C.lo} />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: C.hi, fontSize: 13 }} />
    {value && <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', color: C.lo, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>}
  </div>
);

// ── Tabs ──────────────────────────────────────────────────────────────────────
const NAV = [
  { k: 'overview', label: 'Overview', icon: LayoutGrid },
  { k: 'activity', label: 'Activity', icon: Activity },
  { k: 'quality', label: 'Quality', icon: Target },
  { k: 'positions', label: 'Positions', icon: Briefcase },
  { k: 'rejections', label: 'Rejections', icon: AlertTriangle },
  { k: 'collaboration', label: 'Collaboration', icon: Users },
  { k: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function RecruiterDetail({ recruiterId, allRows = [], onBack, onSelect }) {
  const [tab, setTab] = useState('overview');
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [recSearch, setRecSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const sidebarRows = useMemo(() => {
    const q = recSearch.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(r => (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q));
  }, [allRows, recSearch]);

  useEffect(() => {
    let live = true;
    setLoading(true); setErr('');
    axios.get(`/admin/reports/recruiter-detail/${recruiterId}`, { withCredentials: true })
      .then(r => { if (live) setD(r.data?.detail || null); })
      .catch(e => { if (live) setErr(e?.response?.data?.message || 'Failed to load'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [recruiterId]);

  const p = d?.profile;
  const kpiStrip = d ? [
    { label: 'Overall Score', value: `${d.kpis.overallScore}/100`, color: C.green },
    { label: 'Status', value: d.kpis.status, color: d.kpis.status === 'Active' ? C.green : C.amber },
    { label: 'Login Consistency', value: `${d.kpis.loginConsistency}%`, color: C.green },
    { label: 'Positions Assigned', value: d.kpis.positionsAssigned, color: C.indigo },
    { label: 'CVs Submitted', value: d.kpis.cvsSubmitted, color: C.hi },
    { label: 'Acceptance Rate', value: `${d.kpis.acceptanceRate}%`, color: C.green },
    { label: 'Offer Rate', value: `${d.kpis.offerRate}%`, color: C.red },
    { label: 'Joining Rate', value: `${d.kpis.joiningRate}%`, color: C.green },
    { label: 'Avg Days to First CV', value: num(d.kpis.avgDaysToFirstCV, 'd'), color: C.hi },
    { label: 'Direct Applicants', value: d.kpis.directApplicants, color: C.indigo },
    { label: 'Total Submissions', value: d.kpis.totalSubmissions, color: C.hi },
  ] : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: C.bg, color: C.hi, display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 232, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.cardBorder}`,
        display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 18px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>R</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>RecruitIQ</div>
            <div style={{ fontSize: 11, color: C.lo }}>Performance Analytics</div>
          </div>
        </div>
        <nav style={{ padding: 12, flex: 1, overflowY: 'auto' }}>
          {NAV.map(({ k, label, icon: Icon }) => {
            const active = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)}
                style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 12px', marginBottom: 3,
                  borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, fontWeight: 600,
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent', color: active ? '#a5b4fc' : C.mid }}>
                <Icon size={17} /> {label}
              </button>
            );
          })}
        </nav>
        {/* Recruiter list */}
        <div style={{ borderTop: `1px solid ${C.cardBorder}`, padding: 12, maxHeight: 260, overflowY: 'auto' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: C.lo, padding: '4px 8px 8px' }}>RECRUITERS</div>
          <div style={{ padding: '0 4px 8px' }}>
            <SearchBox value={recSearch} onChange={setRecSearch} placeholder="Search recruiters…" />
          </div>
          {sidebarRows.length === 0 && <div style={{ padding: '6px 8px', fontSize: 12, color: C.lo }}>No matches.</div>}
          {sidebarRows.map(r => {
            const active = r.id === recruiterId;
            return (
              <button key={r.id} onClick={() => onSelect && onSelect(r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 8px', marginBottom: 2,
                  borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: avaColor(r.name || r.email), color: '#fff',
                  display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(r.name || r.email)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: active ? C.hi : C.mid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name || r.email}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.session?.activeNow ? C.green : C.amber, flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.cardBorder}`, fontSize: 11, color: C.lo }}>
          {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
          <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${C.cardBorder}`, color: C.mid, borderRadius: 9, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, textTransform: 'capitalize' }}>{tab}</h2>
          <button onClick={() => p && setProfileOpen(true)} disabled={!p}
            title="View full profile"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: C.card,
              border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: '6px 12px', cursor: p ? 'pointer' : 'default', color: C.hi }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: avaColor(p?.name), color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, overflow: 'hidden' }}>
              {p?.profilePhoto ? <img src={p.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p ? initials(p.name || p.email) : '·')}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{p?.name || '—'}</span>
            <ChevronDown size={15} color={C.lo} />
          </button>
        </div>

        {/* KPI strip */}
        {d && (
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${C.cardBorder}` }}>
            {kpiStrip.map((k, i) => (
              <div key={i} style={{ padding: '12px 18px', borderRight: `1px solid ${C.cardBorder}`, minWidth: 118, flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: C.lo, marginBottom: 4, whiteSpace: 'nowrap' }}>{k.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '60%', color: C.mid }}>Loading recruiter analytics…</div>
          ) : err ? (
            <div style={{ color: C.red, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 20, fontWeight: 600 }}>{err}</div>
          ) : d ? (
            <>
              {tab === 'overview' && <Overview d={d} onMessage={() => setChatOpen(true)} />}
              {tab === 'activity' && <ActivityTab d={d} />}
              {tab === 'quality' && <QualityTab d={d} />}
              {tab === 'positions' && <PositionsTab d={d} />}
              {tab === 'rejections' && <RejectionsTab d={d} />}
              {tab === 'collaboration' && <CollaborationTab d={d} />}
              {tab === 'leaderboard' && <Leaderboard allRows={allRows} onSelect={onSelect} currentId={recruiterId} />}
            </>
          ) : null}
        </div>
      </main>

      {/* Inline chat widget — bottom-right corner */}
      {chatOpen && p?.email && (
        <ChatWidget email={p.email} name={p.name} onClose={() => setChatOpen(false)} />
      )}

      {/* Full profile modal */}
      {profileOpen && p && (
        <ProfileModal p={p} onClose={() => setProfileOpen(false)} onMessage={() => { setProfileOpen(false); setChatOpen(true); }} />
      )}
    </div>
  );
}

// ── Full profile modal ──────────────────────────────────────────────────────
const ProfileModal = ({ p, onClose, onMessage }) => {
  const rows = [
    ['Email', p.email], ['Phone', p.phone], ['Location', [p.location, p.country].filter(Boolean).join(', ')],
    ['Current company', p.company], ['Current title', p.currentTitle || p.designation],
    ['Experience', p.yearsOfExperience ? `${p.yearsOfExperience} yrs` : p.experienceCategory],
    ['Skill category', p.skillCategory], ['Date joined', p.dateJoined],
    ['Profile completion', `${p.profileCompletion || 0}%`],
    ['Agreement', p.agreementSigned ? 'Signed' : 'Not signed'],
  ].filter(([, v]) => v && String(v).trim());
  const links = [
    ['LinkedIn', p.linkedin], ['Website', p.website], ['Twitter', p.twitter],
  ].filter(([, v]) => v);
  const openCv = () => {
    if (!p.resume) return;
    const w = window.open();
    if (p.resume.startsWith('data:')) { w.document.write(`<iframe src="${p.resume}" style="border:0;width:100%;height:100%"></iframe>`); }
    else { w.location = p.resume; }
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', color: '#1f2937', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 24px', background: 'linear-gradient(135deg,#1e3a5f,#6366f1)', color: '#fff', position: 'relative' }}>
          <span style={{ width: 60, height: 60, borderRadius: '50%', background: avaColor(p.name), display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 22, overflow: 'hidden', flexShrink: 0 }}>
            {p.profilePhoto ? <img src={p.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(p.name || p.email)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{p.name || '—'}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{p.designation}</div>
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '2px 9px', borderRadius: 6 }}>{p.status}</span>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
        </div>
        <div style={{ padding: 24 }}>
          {p.bio && <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: '#374151' }}>{p.bio}</p>}

          {/* Detail rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {rows.map(([k, v], i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1f2937', wordBreak: 'break-word' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Skills */}
          {Array.isArray(p.skills) && p.skills.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.skills.map((s, i) => <span key={i} style={{ background: '#eef2ff', color: '#4f46e5', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>{typeof s === 'string' ? s : (s.name || '')}</span>)}
              </div>
            </div>
          )}

          {/* Work experience */}
          {Array.isArray(p.workExperience) && p.workExperience.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Work experience</div>
              {p.workExperience.map((w, i) => (
                <div key={i} style={{ borderLeft: '2px solid #c7d2fe', paddingLeft: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{w.title || w.role || w.position || 'Role'}{w.company ? ` · ${w.company}` : ''}</div>
                  {(w.from || w.to || w.duration) && <div style={{ fontSize: 12, color: '#94a3b8' }}>{w.duration || [w.from, w.to].filter(Boolean).join(' – ')}</div>}
                  {w.description && <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>{w.description}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {Array.isArray(p.education) && p.education.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Education</div>
              {p.education.map((e, i) => (
                <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  {e.degree || e.qualification || 'Qualification'}{e.institution ? ` · ${e.institution}` : ''}{e.year ? ` (${e.year})` : ''}
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {links.map(([k, v], i) => (
                <a key={i} href={v.startsWith('http') ? v : `https://${v}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12.5, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>{k} ↗</a>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {p.resume ? (
              <button onClick={openCv} style={{ flex: 1, minWidth: 140, padding: '11px 16px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13.5, background: 'linear-gradient(135deg,#2563eb,#6366f1)', color: '#fff' }}>
                📄 View CV{p.resumeFileName ? ` (${p.resumeFileName})` : ''}
              </button>
            ) : (
              <div style={{ flex: 1, minWidth: 140, padding: '11px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, background: '#f1f5f9', color: '#94a3b8', textAlign: 'center' }}>No CV uploaded</div>
            )}
            <button onClick={onMessage} style={{ padding: '11px 16px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13.5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Inline chat widget (uses the platform chat API with the current session) ──
const ChatWidget = ({ email, name, onClose }) => {
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errMsg, setErrMsg] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const loadMessages = async (id, quiet) => {
    try {
      const r = await axios.get(`/api/chat/messages/${id}`, { withCredentials: true });
      if (r.data?.success) setMessages(r.data.messages || []);
    } catch (e) { if (!quiet) setErrMsg('Could not load messages.'); }
  };

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await axios.post('/api/chat/open', { withEmail: email }, { withCredentials: true });
        if (!live) return;
        if (r.data?.success) { setConvId(r.data.conversationId); setStatus('ready'); await loadMessages(r.data.conversationId); }
        else { setStatus('error'); setErrMsg(r.data?.message || 'Could not open chat.'); }
      } catch (e) { if (live) { setStatus('error'); setErrMsg(e.response?.data?.message || 'Could not open chat with this recruiter.'); } }
    })();
    return () => { live = false; };
  }, [email]);

  useEffect(() => {
    if (!convId) return;
    const t = setInterval(() => loadMessages(convId, true), 3000);
    return () => clearInterval(t);
  }, [convId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || !convId || sending) return;
    setSending(true); setText('');
    try {
      await axios.post('/api/chat/send', { conversationId: convId, text: t }, { withCredentials: true });
      await loadMessages(convId, true);
    } catch (e) { setErrMsg('Failed to send.'); setText(t); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, width: 360, maxWidth: 'calc(100vw - 32px)', height: 480, maxHeight: 'calc(100vh - 40px)',
      background: '#fff', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>{initials(name || email)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || email}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Recruiter</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {status === 'loading' && <div style={{ margin: 'auto', color: '#94a3b8', fontSize: 13 }}>Opening chat…</div>}
        {status === 'error' && <div style={{ margin: 'auto', color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{errMsg}</div>}
        {status === 'ready' && messages.length === 0 && <div style={{ margin: 'auto', color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No messages yet.<br />Say hello 👋</div>}
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
            <div style={{ padding: '8px 12px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.45, wordBreak: 'break-word',
              background: m.mine ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff', color: m.mine ? '#fff' : '#1f2937',
              border: m.mine ? 'none' : '1px solid #e5e7eb', borderBottomRightRadius: m.mine ? 4 : 14, borderBottomLeftRadius: m.mine ? 14 : 4 }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* Composer */}
      <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={status !== 'ready'} placeholder={status === 'ready' ? 'Type a message…' : 'Connecting…'}
          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, outline: 'none' }} />
        <button onClick={send} disabled={status !== 'ready' || !text.trim() || sending}
          style={{ width: 40, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
            background: (status !== 'ready' || !text.trim()) ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Overview ────────────────────────────────────────────────────────────────
const Overview = ({ d, onMessage }) => {
  const p = d.profile, s = d.score, h = d.health;
  const rows = [
    ['Date Joined', p.dateJoined], ['Days on Platform', num(p.daysOnPlatform)], ['Days Logged In', num(p.daysLoggedIn)],
    ['Login %', `${p.loginPct}%`], ['Last Login', p.lastLogin], ['Last Position Assigned', p.lastPositionAssigned],
    ['Last CV Submitted', p.lastCvSubmitted], ['Current Status', p.status],
  ];
  const hColor = h.level === 'healthy' ? C.green : h.level === 'warning' ? C.amber : C.red;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
      <Card>
        <SectionTitle title="Recruiter Profile" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: avaColor(p.name), color: '#fff', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 800 }}>{p.avatarInitials || initials(p.name)}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{p.name || '—'}</div>
            <div style={{ fontSize: 13, color: C.mid }}>{p.designation}</div>
            <span style={{ display: 'inline-block', marginTop: 5, fontSize: 11, fontWeight: 700, color: p.status === 'Active' ? C.green : C.amber, background: p.status === 'Active' ? 'rgba(52,211,153,0.14)' : 'rgba(251,191,36,0.14)', padding: '2px 9px', borderRadius: 6 }}>{p.status}</span>
          </div>
        </div>
        {rows.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i ? `1px solid ${C.innerBorder}` : 'none', fontSize: 13 }}>
            <span style={{ color: C.mid }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}

        {/* Login history — last 7 days */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.innerBorder}` }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: C.lo, marginBottom: 12 }}>LOGIN HISTORY · LAST 7 DAYS</div>
          {p.loginHistory?.length ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {p.loginHistory.map((h, i) => (
                <div key={i} title={`${h.day}: ${h.active ? `${h.hours}h active` : 'no activity'}`}
                  style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.lo, marginBottom: 5 }}>{h.weekday}</div>
                  <div style={{ height: 34, borderRadius: 6, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    background: h.active ? 'rgba(52,211,153,0.14)' : C.inner, border: `1px solid ${h.active ? C.green + '55' : C.innerBorder}`, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${h.active ? Math.max(18, Math.min(100, (h.hours / 8) * 100)) : 0}%`, background: C.greenBar }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: h.active ? C.green : C.lo, marginTop: 4, fontWeight: 600 }}>{h.active ? `${h.hours}h` : '—'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.lo }}>No login activity recorded yet.</div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Overall Score" sub="Weighted performance index across all categories" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14 }}>
          <Ring pct={s.overall} size={128} stroke={9}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{s.overall}</div>
            <div style={{ fontSize: 11, color: C.lo }}>out of 100</div>
          </Ring>
          <div style={{ fontSize: 12, color: C.mid, marginTop: 8 }}>Overall Recruiter Score</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {s.overall >= 60 ? <TrendingUp size={16} color={C.green} /> : <TrendingDown size={16} color={C.red} />}
          <span style={{ fontWeight: 700, fontSize: 14 }}>{s.trend}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.green, background: 'rgba(52,211,153,0.14)', padding: '2px 9px', borderRadius: 6 }}>{d.profile.status}</span>
        </div>
        {s.categories.map((c, i) => <CatBar key={i} {...c} />)}
      </Card>

      <Card>
        <SectionTitle title="Health Indicators" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.1)', border: `1px solid ${hColor}44`, borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
          <CheckCircle2 size={17} color={hColor} />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: hColor }}>
            {h.level === 'healthy' ? 'Healthy — All indicators on track' : h.level === 'warning' ? 'Warning — Needs attention' : 'Critical — Inactive'}
          </span>
        </div>
        {h.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.innerBorder}` }}>
            {it.ok ? <CheckCircle2 size={16} color={C.green} /> : <AlertCircle size={16} color={C.amber} />}
            <div>
              <div style={{ fontSize: 12, color: C.lo }}>{it.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: it.ok ? C.green : C.amber }}>{it.value}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: C.lo, margin: '16px 0 10px' }}>THRESHOLDS</div>
        {[
          { icon: CheckCircle2, color: C.green, text: 'Healthy: logged in today, CV this week, has active positions' },
          { icon: AlertCircle, color: C.amber, text: 'Warning: no login 5d, no CV 7d' },
          { icon: XCircle, color: C.red, text: 'Critical: no login 15d, no submission 30d' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 8, fontSize: 12.5, color: C.mid }}>
            <t.icon size={15} color={t.color} style={{ flexShrink: 0, marginTop: 1 }} /> {t.text}
          </div>
        ))}

        {/* Chat with this recruiter */}
        {p.email && (
          <button onClick={() => onMessage && onMessage()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, width: '100%',
              padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13.5,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
            <MessageCircle size={16} /> Message {(p.name || '').split(' ')[0] || 'recruiter'}
          </button>
        )}
      </Card>
    </div>
  );
};

// ── Activity ────────────────────────────────────────────────────────────────
const ActivityTab = ({ d }) => {
  const a = d.activity.stats;
  const cards = [
    ['Total Positions Assigned', a.totalPositionsAssigned], ['Active Positions', a.activePositions],
    ['Closed Positions', a.closedPositions], ['Total CVs Submitted', a.totalCvsSubmitted],
    ['CVs This Week', a.cvsThisWeek], ['CVs This Month', a.cvsThisMonth],
    ['Messages Sent', a.messagesSent], ['Coaching Sessions Joined', a.coachingSessionsJoined],
    ['Shareable Links Copied', a.shareableLinksCopied], ['Direct Applicants Received', a.directApplicantsReceived],
    ['Referrals Shared', a.referralsShared], ['Avg CVs per Position', a.avgCvsPerPosition],
  ];
  return (
    <>
      <SectionTitle title="Activity Score" sub="Measures effort and engagement on the platform" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 22 }}>
        {cards.map(([l, v], i) => <StatCard key={i} label={l} value={v} />)}
      </div>
      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Weekly CV Submissions (Last 7 Weeks)</div>
        <BarChart data={d.activity.weekly} color={C.indigo} />
      </Card>
    </>
  );
};

const BarChart = ({ data, color = C.indigo, height = 220 }) => {
  const max = Math.max(1, ...data.map(x => x.value));
  const ticks = 4;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height, fontSize: 11, color: C.lo, textAlign: 'right', paddingBottom: 22 }}>
        {Array.from({ length: ticks + 1 }, (_, i) => <span key={i}>{Math.round((max * (ticks - i)) / ticks)}</span>)}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 12, height, borderLeft: `1px solid ${C.track}`, borderBottom: `1px solid ${C.track}`, paddingLeft: 10 }}>
        {data.map((x, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div title={`${x.value}`} style={{ width: '60%', maxWidth: 46, height: `${(x.value / max) * (height - 26)}px`, minHeight: x.value ? 3 : 0, background: `linear-gradient(180deg,${color},${color}55)`, borderRadius: '5px 5px 0 0' }} />
            <div style={{ fontSize: 11, color: C.lo, marginTop: 6 }}>{x.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Quality ─────────────────────────────────────────────────────────────────
const QualityTab = ({ d }) => {
  const q = d.quality;
  const gauges = [
    { label: 'CV Acceptance Rate', val: q.rates.cvAcceptance, color: C.green },
    { label: 'Interview Rate', val: q.rates.interview, color: C.amber },
    { label: 'Selection Rate', val: q.rates.selection, color: C.red },
    { label: 'Joining Rate', val: q.rates.joining, color: C.green },
  ];
  const cards = [
    { label: 'Accepted CVs', value: q.cards.acceptedCvs, sub: `of ${q.cards.submittedTotal} submitted` },
    { label: 'Offer Drop Rate', value: `${q.cards.offerDropRate}%` },
    { label: 'Duplicate Submissions', value: `${q.cards.duplicateSubmissions}%` },
    { label: 'Avg CVs for 1 Interview', value: q.cards.avgCvsForInterview },
  ];
  const fcolors = [C.greenBar, C.greenBar, C.amber, C.red, C.red];
  return (
    <>
      <SectionTitle title="Quality Score" sub="Measures effectiveness and conversion outcomes" />
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Key Quality Rates</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, justifyItems: 'center' }}>
          {gauges.map((g, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <Ring pct={g.val} size={104} stroke={8} color={g.color}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{g.val}</div>
                <div style={{ fontSize: 10, color: C.lo }}>%</div>
              </Ring>
              <div style={{ fontSize: 12.5, color: C.mid, marginTop: 8 }}>{g.label}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 18 }}>
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>
      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Conversion Funnel</div>
        {q.funnel.map((f, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: C.mid }}>{f.label}</span>
              <span><span style={{ color: C.lo, marginRight: 10 }}>{f.count}</span><b>{f.pct}%</b></span>
            </div>
            <div style={{ height: 8, background: C.track, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${f.pct}%`, background: fcolors[i], borderRadius: 5 }} />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
};

// ── Positions ───────────────────────────────────────────────────────────────
const statusChip = (st) => {
  const s = (st || '').toLowerCase();
  const map = s.includes('fill') ? [C.green, 'rgba(52,211,153,0.14)']
    : s.includes('closed') ? [C.lo, 'rgba(148,163,184,0.14)']
    : s.includes('hold') ? [C.orange, 'rgba(251,146,60,0.14)']
    : [C.blue, 'rgba(96,165,250,0.14)'];
  return <span style={{ fontSize: 11.5, fontWeight: 700, color: map[0], background: map[1], padding: '3px 10px', borderRadius: 6 }}>{st || 'Active'}</span>;
};
const PositionsTab = ({ d }) => {
  const pos = d.positions;
  const cards = [
    { label: 'Positions Assigned', value: pos.assigned },
    { label: 'Positions Filled', value: pos.filled, sub: `${pos.fillRate}% fill rate` },
    { label: 'Avg Days to First CV', value: num(pos.avgDaysFirstCv, 'd') },
    { label: 'Avg Days to First Interview', value: num(pos.avgDaysFirstInterview, 'd') },
    { label: 'Avg Days to Closure', value: num(pos.avgDaysClosure, 'd') },
  ];
  return (
    <>
      <SectionTitle title="Position Performance" sub="Speed and efficiency across all assigned positions" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 18 }}>
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>
      <Card pad={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px' }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Recent Positions</span>
          <span style={{ fontSize: 12, color: C.lo }}>Avg {d.activity.stats.avgCvsPerPosition} CVs per position</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: C.lo, textAlign: 'left', borderTop: `1px solid ${C.innerBorder}`, borderBottom: `1px solid ${C.innerBorder}` }}>
                {['Position', 'Assigned', 'First CV', 'First Interview', 'CVs', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 22px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pos.recent.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: C.lo }}>No positions assigned.</td></tr>
              ) : pos.recent.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.innerBorder}` }}>
                  <td style={{ padding: '14px 22px', fontWeight: 600 }}>{r.position}{r.client ? <span style={{ color: C.lo, fontWeight: 400 }}> · {r.client}</span> : ''}</td>
                  <td style={{ padding: '14px 22px', color: C.mid }}>{r.assigned}</td>
                  <td style={{ padding: '14px 22px', color: C.mid }}>{r.firstCv}</td>
                  <td style={{ padding: '14px 22px', color: C.mid }}>{r.firstInterview}</td>
                  <td style={{ padding: '14px 22px', fontWeight: 700 }}>{r.cvs}</td>
                  <td style={{ padding: '14px 22px' }}>{statusChip(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

// ── Rejections ──────────────────────────────────────────────────────────────
const RejectionsTab = ({ d }) => {
  const rj = d.rejections;
  const rcolors = [C.indigo, C.purple, C.green, C.amber, C.orange, C.lo];
  return (
    <>
      <SectionTitle title="Rejection Analysis" sub="Understanding why candidates are rejected" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 20 }}>
        <Card>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Top Rejection Reasons</div>
          {rj.reasons.map((r, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>{r.label}</span>
                <span><span style={{ color: C.lo, marginRight: 10 }}>{r.count}</span><b style={{ color: rcolors[i % rcolors.length] }}>{r.pct}%</b></span>
              </div>
              <div style={{ height: 8, background: C.track, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.pct}%`, background: rcolors[i % rcolors.length], borderRadius: 5 }} />
              </div>
            </div>
          ))}
          {rj.reasons.every(r => r.count === 0) && <div style={{ color: C.lo, fontSize: 13 }}>No rejections recorded.</div>}
        </Card>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 18 }}>Rejection Breakdown</div>
            {rj.breakdown.map((b, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.mid }}>{b.label} Rate</span><b>{b.pct}%</b>
                </div>
                <div style={{ height: 6, background: C.track, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, background: [C.amber, C.red, C.purple, C.lo][i], borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {rj.breakdown.map((b, i) => <StatCard key={i} label={b.label} value={`${b.pct}%`} />)}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Collaboration ───────────────────────────────────────────────────────────
const CollaborationTab = ({ d }) => {
  const c = d.collaboration;
  const cards = [
    ['Coaching Sessions Joined', c.coachingSessionsJoined], ['Team Messages Sent', c.teamMessagesSent],
    ['Team Messages Read', c.teamMessagesRead], ['Help Requests Raised', c.helpRequestsRaised],
    ['Positions Shared', c.positionsShared], ['CVs Shared with Team', c.cvsSharedWithTeam], ['CVs Used by Others', c.cvsUsedByOthers],
  ];
  return (
    <>
      <SectionTitle title="Collaboration" sub="Team engagement, knowledge sharing, and peer contribution" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 22 }}>
        {cards.map(([l, v], i) => <StatCard key={i} label={l} value={v} />)}
      </div>
      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Team Engagement Overview</div>
        <BarChart color={C.purple} data={[
          { label: 'Msg Sent', value: c.teamMessagesSent }, { label: 'Msg Read', value: c.teamMessagesRead },
          { label: 'CV Shared', value: c.cvsSharedWithTeam }, { label: 'Coach', value: c.coachingSessionsJoined },
          { label: 'Pos Shared', value: c.positionsShared }, { label: 'CV Used', value: c.cvsUsedByOthers },
        ]} />
      </Card>
    </>
  );
};

// ── Leaderboard (computed from all report rows) ──────────────────────────────
const Leaderboard = ({ allRows, onSelect, currentId }) => {
  const [metric, setMetric] = useState('score');
  const [search, setSearch] = useState('');
  const metrics = [
    { k: 'score', label: 'Overall Score' }, { k: 'acceptance', label: 'Acceptance Rate' },
    { k: 'cvs', label: 'Total CVs' }, { k: 'positions', label: 'Positions' },
  ];
  const ranked = useMemo(() => {
    const withM = allRows.map(r => {
      const submitted = r.positions.reduce((s, p) => s + p.totalCandidates, 0);
      const active = r.positions.reduce((s, p) => s + p.activeCandidates, 0);
      const acceptance = submitted ? Math.round((active / submitted) * 100) : 0;
      const positions = r.positions.length;
      const score = Math.round(acceptance * 0.6 + Math.min(100, submitted) * 0.25 + Math.min(100, positions * 4) * 0.15);
      return { ...r, _m: { score, acceptance, cvs: submitted, positions } };
    });
    return withM.sort((a, b) => b._m[metric] - a._m[metric]);
  }, [allRows, metric]);
  // Keep the true rank number even after filtering by search.
  const q = search.trim().toLowerCase();
  const shown = q ? ranked.filter(r => (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q)) : ranked;
  const rankColor = (i) => [C.amber, '#cbd5e1', C.orange][i] || C.lo;
  const fmt = (v) => metric === 'score' ? `${v}/100` : metric === 'acceptance' ? `${v}%` : v;
  return (
    <>
      <SectionTitle title="Leaderboard" sub="Rank recruiters across key performance metrics" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {metrics.map(m => (
          <button key={m.k} onClick={() => setMetric(m.k)}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: metric === m.k ? '#4f46e5' : C.card, color: metric === m.k ? '#fff' : C.mid }}>{m.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', width: 240, maxWidth: '100%' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search recruiters…" />
        </div>
      </div>
      {shown.length === 0 && <div style={{ color: C.lo, fontSize: 14, padding: '20px 0' }}>No recruiters match “{search}”.</div>}
      {shown.map((r) => {
        const i = ranked.indexOf(r);
        return (
        <div key={r.id} onClick={() => onSelect && onSelect(r.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 16, background: C.card, cursor: 'pointer',
            border: `1px solid ${r.id === currentId ? '#4f46e5' : i === 0 ? C.amber + '55' : C.cardBorder}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: rankColor(i), width: 26 }}>{i + 1}</div>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: avaColor(r.name || r.email), color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{initials(r.name || r.email)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700 }}>{r.name || r.email}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: r.session?.activeNow ? C.green : C.amber, background: r.session?.activeNow ? 'rgba(52,211,153,0.14)' : 'rgba(251,191,36,0.14)', padding: '1px 8px', borderRadius: 5 }}>{r.session?.activeNow ? 'Active' : 'Dormant'}</span>
            </div>
            <div style={{ fontSize: 12, color: C.lo }}>{r.skillCategory || 'Recruiter'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? C.amber : C.green }}>{fmt(r._m[metric])}</div>
            <div style={{ fontSize: 11, color: C.lo }}>{metrics.find(m => m.k === metric).label}</div>
          </div>
        </div>
        );
      })}
    </>
  );
};
