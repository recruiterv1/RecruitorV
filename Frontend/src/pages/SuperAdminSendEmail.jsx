import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Mail, Filter, Send, Users, X, RefreshCw, CheckCircle, AlertCircle,
  Bold, Italic, Underline, List, ListOrdered, Link, Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight, Strikethrough, History, BarChart2,
} from 'lucide-react';

const USER_TYPES = ['Recruiter', 'Coach', 'Expert', 'Clientspoc', 'Vendor'];

const LAST_ACTIVE_OPTIONS = [
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
  { label: '60 days', value: 1440 },
  { label: '90 days', value: 2160 },
];

const POSITION_COUNT_OPTIONS = [
  { label: 'More than 3', value: 3 },
  { label: 'More than 5', value: 5 },
  { label: 'More than 7', value: 7 },
  { label: 'More than 10', value: 10 },
  { label: 'More than 12', value: 12 },
  { label: '15+', value: 15 },
];

const PROFILE_PCT_OPTIONS = [
  { label: 'Above 80%', value: 'above80' },
  { label: 'Above 60%', value: 'above60' },
  { label: 'Below 40%', value: 'below40' },
];

// ── Rich Text Editor ──────────────────────────────────────────────────────────
const RichEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const isComposing = useRef(false);

  const exec = useCallback((cmd, arg = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (!isComposing.current) onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  }, [exec]);

  const ToolBtn = ({ onClick, title, children }) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }} title={title}
      className="p-1.5 rounded transition-colors hover:bg-gray-100 text-gray-600">
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolBtn onClick={() => exec('bold')} title="Bold"><Bold size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic"><Italic size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline"><Underline size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={14} /></ToolBtn>
        <span className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1"><Heading1 size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2"><Heading2 size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'p')} title="Paragraph"><span className="text-xs font-bold px-0.5">P</span></ToolBtn>
        <span className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={14} /></ToolBtn>
        <span className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Align right"><AlignRight size={14} /></ToolBtn>
        <span className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={insertLink} title="Insert link"><Link size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting"><span className="text-xs font-bold px-0.5">Tx</span></ToolBtn>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        className="min-h-[260px] p-4 text-sm text-gray-800 focus:outline-none"
        style={{ lineHeight: '1.7' }}
        data-placeholder={placeholder}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none;}`}</style>
    </div>
  );
};

const SelectBox = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
      className="h-9 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
      <option value="">{placeholder || 'Any'}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ value, label, color }) => (
  <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${color}`}>
    <span className="text-base font-bold">{value ?? '—'}</span>
    <span className="text-xs font-medium opacity-75">{label}</span>
  </div>
);

// ── History Tab ───────────────────────────────────────────────────────────────
const EmailHistory = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({});
  const [expanded, setExpanded] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/bulk-email/history', { withCredentials: true });
      if (res.data.success) setCampaigns(res.data.campaigns);
    } catch (err) {
      console.error('History fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const refreshStats = async (id) => {
    setRefreshing(p => ({ ...p, [id]: true }));
    try {
      const res = await axios.post(`/admin/bulk-email/stats/${id}`, {}, { withCredentials: true });
      if (res.data.success) {
        setCampaigns(prev => prev.map(c =>
          c.id === id ? { ...c, delivered: res.data.delivered, opened: res.data.opened, statsUpdatedAt: Date.now() } : c
        ));
      }
    } catch (err) {
      console.error('Stats refresh failed', err);
    } finally {
      setRefreshing(p => ({ ...p, [id]: false }));
    }
  };

  const fmt = (ms) => ms ? new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <RefreshCw size={20} className="animate-spin mr-2" /> Loading history…
    </div>
  );

  if (!campaigns.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <History size={40} className="mb-3 opacity-30" />
      <p className="font-medium">No campaigns sent yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} found</p>
        <button onClick={fetchHistory} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold">
          <RefreshCw size={13} /> Refresh list
        </button>
      </div>

      {campaigns.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Row */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{c.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmt(c.sentAt)}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatPill value={c.totalSent} label="Sent" color="bg-blue-50 text-blue-700" />
              <StatPill value={c.delivered} label="Delivered" color="bg-green-50 text-green-700" />
              <StatPill value={c.opened} label="Opened" color="bg-purple-50 text-purple-700" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => refreshStats(c.id)} disabled={refreshing[c.id]}
                title="Refresh stats from Brevo"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                <BarChart2 size={13} className={refreshing[c.id] ? 'animate-pulse' : ''} />
                {refreshing[c.id] ? 'Refreshing…' : 'Refresh Stats'}
              </button>
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2">
                {expanded === c.id ? 'Hide' : 'Details'}
              </button>
            </div>
          </div>

          {/* Expanded details */}
          {expanded === c.id && (
            <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Recipients</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{c.recipientCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Failed</p>
                  <p className="text-sm font-bold text-red-600 mt-0.5">{c.totalFailed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Delivery Rate</p>
                  <p className="text-sm font-bold text-green-700 mt-0.5">
                    {c.totalSent > 0 ? `${Math.round((c.delivered / c.totalSent) * 100)}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Open Rate</p>
                  <p className="text-sm font-bold text-purple-700 mt-0.5">
                    {c.delivered > 0 ? `${Math.round((c.opened / c.delivered) * 100)}%` : '—'}
                  </p>
                </div>
              </div>
              {c.statsUpdatedAt && (
                <p className="text-xs text-gray-400">Stats last refreshed: {fmt(c.statsUpdatedAt)}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const SuperAdminSendEmail = () => {
  const [activeTab, setActiveTab] = useState('compose');
  const [authOk, setAuthOk] = useState(null); // null=checking, true=ok, false=denied

  const [userType, setUserType] = useState('');
  const [lastActiveHours, setLastActiveHours] = useState(null);
  const [positionCountMin, setPositionCountMin] = useState(null);
  const [hasTeam, setHasTeam] = useState(null);
  const [profilePctOp, setProfilePctOp] = useState(null);
  const [agreementSigned, setAgreementSigned] = useState(null);

  const [recipients, setRecipients] = useState([]);
  const [previewing, setPreviewing] = useState(false);
  const [previewDone, setPreviewDone] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    axios.get('/admin/bulk-email/history', { withCredentials: true })
      .then(() => setAuthOk(true))
      .catch(err => {
        setAuthOk(false);
        const msg = err.response?.data?.message || 'Access denied';
        setAuthError(`Admin session check failed: "${msg}". Please log out and log back in as an Admin user.`);
      });
  }, []);

  const handlePreview = async () => {
    if (!userType) { setError('Please select a User Type first.'); return; }
    setError(''); setResult(null); setPreviewing(true);
    try {
      const res = await axios.post('/admin/bulk-email/preview', {
        userType,
        lastActiveHours: lastActiveHours ? Number(lastActiveHours) : null,
        positionCountMin: positionCountMin ? Number(positionCountMin) : null,
        hasTeam: hasTeam === 'true' ? true : hasTeam === 'false' ? false : null,
        profilePctOp: profilePctOp || null,
        agreementSigned: agreementSigned === 'true' ? true : agreementSigned === 'false' ? false : null,
      }, { withCredentials: true });
      if (res.data.success) { setRecipients(res.data.recipients); setPreviewDone(true); }
      else setError(res.data.message || 'Failed to fetch recipients');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recipients');
    } finally { setPreviewing(false); }
  };

  const removeRecipient = (email) => setRecipients(prev => prev.filter(r => r.email !== email));

  const addManualEmail = () => {
    const trimmed = manualEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Invalid email address: ' + trimmed); return; }
    if (recipients.some(r => r.email === trimmed)) { setManualEmail(''); return; }
    setRecipients(prev => [...prev, { email: trimmed, name: '' }]);
    setManualEmail(''); setError('');
  };

  const handleSend = async () => {
    if (!recipients.length) { setError('No recipients.'); return; }
    if (!subject.trim()) { setError('Please enter a subject.'); return; }
    if (!body.trim()) { setError('Please enter email body.'); return; }
    if (!window.confirm(`Send email to ${recipients.length} recipient(s)? This cannot be undone.`)) return;

    setError(''); setResult(null); setSending(true);
    try {
      const res = await axios.post('/admin/bulk-email/send', { recipients, subject, htmlContent: body }, { withCredentials: true });
      if (res.data.success) {
        const { sent, failed, errors: errList } = res.data;
        setResult({ sent, failed, errors: errList });
        if (failed === 0) {
          setSubject(''); setBody(''); setRecipients([]); setPreviewDone(false); setManualEmail('');
        }
      } else {
        setError(res.data.message || 'Send failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Send failed');
    } finally { setSending(false); }
  };

  const resetFilters = () => {
    setUserType(''); setLastActiveHours(null); setPositionCountMin(null);
    setHasTeam(null); setProfilePctOp(null); setAgreementSigned(null);
    setRecipients([]); setPreviewDone(false); setResult(null); setError(''); setManualEmail('');
  };

  const showPositionCount = ['Recruiter', 'Coach', 'Expert'].includes(userType);
  const showHasTeam = ['Coach', 'Expert'].includes(userType);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-xl"><Mail size={22} className="text-white" /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-sm text-gray-500">Send bulk emails and track delivery stats</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[{ id: 'compose', label: 'Compose', icon: Mail }, { id: 'history', label: 'History', icon: History }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Auth check banner */}
      {authOk === null && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
          <RefreshCw size={14} className="animate-spin" /> Verifying admin session…
        </div>
      )}
      {authOk === false && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Admin access denied</p>
            <p className="text-sm text-red-700 mt-0.5">{authError}</p>
            <p className="text-xs text-red-600 mt-1">Log out and log in again via the admin login page to refresh your session.</p>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && <EmailHistory />}

      {/* ── COMPOSE TAB ── */}
      {activeTab === 'compose' && (
        <>
          {result && result.sent > 0 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Email campaign sent!</p>
                <p className="text-sm text-green-700">
                  {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ''}. Switch to the History tab to track delivery stats.
                </p>
                <p className="text-xs text-green-600 mt-1">If not in inbox, please check the <strong>Spam / Junk</strong> folder.</p>
              </div>
            </div>
          )}
          {result && result.failed > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">{result.sent === 0 ? 'Send failed' : `${result.failed} failed`}</p>
                {result.errors && result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700 mt-1"><span className="font-medium">{e.email}:</span> {e.error}</p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">Filters</h2>
              </div>
              <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <RefreshCw size={13} /> Reset all
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">User Type <span className="text-red-500">*</span></label>
                <select value={userType} onChange={e => { setUserType(e.target.value); setRecipients([]); setPreviewDone(false); }}
                  className="h-9 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Select type…</option>
                  {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <SelectBox label="Last Active" value={lastActiveHours || ''} onChange={setLastActiveHours} options={LAST_ACTIVE_OPTIONS} placeholder="Any time" />
              {showPositionCount && <SelectBox label="Position Count" value={positionCountMin || ''} onChange={setPositionCountMin} options={POSITION_COUNT_OPTIONS} placeholder="Any count" />}
              {showHasTeam && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Has Team</label>
                  <select value={hasTeam || ''} onChange={e => setHasTeam(e.target.value || null)}
                    className="h-9 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">Any</option>
                    <option value="true">Has team members</option>
                    <option value="false">No team members</option>
                  </select>
                </div>
              )}
              <SelectBox label="Profile %" value={profilePctOp || ''} onChange={setProfilePctOp} options={PROFILE_PCT_OPTIONS} placeholder="Any %" />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agreement Signed</label>
                <select value={agreementSigned || ''} onChange={e => setAgreementSigned(e.target.value || null)}
                  className="h-9 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Any</option>
                  <option value="true">Signed</option>
                  <option value="false">Not signed</option>
                </select>
              </div>
            </div>

            <div className="px-6 pb-5">
              <button onClick={handlePreview} disabled={previewing || !userType}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {previewing ? <RefreshCw size={15} className="animate-spin" /> : <Users size={15} />}
                {previewing ? 'Fetching…' : 'Fetch Recipients'}
              </button>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800">To</h2>
              {recipients.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{recipients.length}</span>
              )}
              {previewDone && recipients.length === 0 && (
                <span className="text-sm text-gray-400 ml-2">No recipients matched the filters</span>
              )}
            </div>

            <div className="flex gap-2">
              <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManualEmail()}
                placeholder="Type an email and press Enter or click +"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button onClick={addManualEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                + Add
              </button>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
                {recipients.map(r => (
                  <span key={r.email} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                    {r.name ? `${r.name} <${r.email}>` : r.email}
                    <button onClick={() => removeRecipient(r.email)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">Reply-to: support@recruiterv.in</p>
          </div>

          {/* Compose */}
          {recipients.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <Mail size={16} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">Compose Email</h2>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Subject <span className="text-red-500">*</span></label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Body <span className="text-red-500">*</span></label>
                <RichEditor value={body} onChange={setBody} placeholder="Write your email here…" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Sending to <span className="font-semibold text-gray-700">{recipients.length}</span> recipient{recipients.length !== 1 ? 's' : ''} · Reply-to: <span className="font-medium">support@recruiterv.in</span>
                </p>
                <button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim() || authOk !== true}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow transition-all">
                  {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  {sending ? 'Sending…' : 'Send Email'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminSendEmail;
