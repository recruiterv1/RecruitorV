import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import {
  Inbox, Send, FileText, Trash2, RefreshCw, Search, X, ChevronLeft,
  Mail, MailOpen, Plus, AlertCircle, Loader2, Reply, Forward, Paperclip, Download, Lock,
  Users, CheckCircle2, Briefcase, MapPin
} from 'lucide-react';
import Sidebar from '../pages/Sidebar';
import ClientSpocSidebar from './Dash_View_ClientSpocSidebar';
import { SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';

const API = '/api/recruiter-email';

// ── Compose Modal ────────────────────────────────────────────────────────────
const ComposeModal = ({ onClose, onSent, displayEmail, editDraft, jdHtml = null, sigHtml = '' }) => {
  // Recipients as a list so multiple addresses can be added. A draft's saved
  // to/toName (single or comma-joined) is seeded back into chips.
  const seedRecipients = () => {
    const emails = (editDraft?.to || '').split(',').map(s => s.trim()).filter(Boolean);
    const names = (editDraft?.toName || '').split(',').map(s => s.trim());
    return emails.map((email, i) => ({ email, name: names[i] && names[i] !== email ? names[i] : '' }));
  };
  const [recipients, setRecipients] = useState(seedRecipients);
  const [subject, setSubject] = useState(editDraft?.subject || '');
  const [body, setBody] = useState(editDraft?.body || '');
  const [contactResults, setContactResults] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ name, size, type, base64 }]
  const searchTimeout = useRef(null);
  const fileRef = useRef(null);

  const MAX_FILE = 10 * 1024 * 1024;      // 10 MB per file
  const MAX_TOTAL = 20 * 1024 * 1024;     // 20 MB across the message
  const addFiles = async (fileList) => {
    setError('');
    const files = Array.from(fileList || []);
    let total = attachments.reduce((s, a) => s + a.size, 0);
    for (const f of files) {
      if (f.size > MAX_FILE) { setError(`"${f.name}" is over 10 MB.`); continue; }
      if (total + f.size > MAX_TOTAL) { setError('Total attachments exceed 20 MB.'); break; }
      if (attachments.some(a => a.name === f.name && a.size === f.size)) continue;
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      total += f.size;
      setAttachments(prev => [...prev, { name: f.name, size: f.size, type: f.type, base64 }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const removeAttachment = (i) => setAttachments(prev => prev.filter((_, j) => j !== i));
  const fmtSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;

  const searchContacts = (q) => {
    setContactSearch(q);
    clearTimeout(searchTimeout.current);
    if (!q) { setContactResults([]); setShowDropdown(false); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/contacts?q=${encodeURIComponent(q)}`, { withCredentials: true });
        setContactResults(res.data.contacts || []);
        setShowDropdown(true);
      } catch (_) {}
    }, 300);
  };

  // A JD email = an optional personal note (from `body`) prepended above the
  // designed JD card. Notes are escaped + newline-preserved so they render safely.
  const composeJdHtml = () => {
    if (!jdHtml) return null;
    const note = (body || '').trim();
    if (!note) return jdHtml;
    const esc = note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    const noteBlock = `<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:20px 20px 0;"><div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;padding:20px 24px;color:#374151;font-size:14px;line-height:1.6;">${esc}</div></div>`;
    return noteBlock + jdHtml;
  };

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());

  // Add a recipient to the list (deduped, case-insensitive on email).
  const addRecipient = (email, name = '') => {
    const e = (email || '').trim();
    if (!isValidEmail(e)) return false;
    setRecipients(prev =>
      prev.some(r => r.email.toLowerCase() === e.toLowerCase())
        ? prev
        : [...prev, { email: e, name: (name || '').trim() }]);
    setContactSearch('');
    setShowDropdown(false);
    return true;
  };
  const removeRecipient = (i) => setRecipients(prev => prev.filter((_, j) => j !== i));

  const selectContact = (c) => { addRecipient(c.email, c.name); };

  // Enter / comma / Tab commits the typed address as a chip so you can add another.
  const onToKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (isValidEmail(contactSearch)) { e.preventDefault(); addRecipient(contactSearch); }
    } else if (e.key === 'Backspace' && !contactSearch && recipients.length) {
      removeRecipient(recipients.length - 1);
    }
  };

  const handleSend = async () => {
    // Include a still-typed valid address that wasn't committed to a chip yet.
    const list = [...recipients];
    if (isValidEmail(contactSearch) && !list.some(r => r.email.toLowerCase() === contactSearch.trim().toLowerCase())) {
      list.push({ email: contactSearch.trim(), name: '' });
    }
    if (list.length === 0 || !subject || (!body && !jdHtml)) { setError('Please add at least one recipient, a subject and a message.'); return; }
    setSending(true); setError('');
    try {
      await axios.post(`${API}/send`, {
        recipients: list,
        // Back-compat fields (comma-joined) so anything reading to/toName still works
        to: list.map(r => r.email).join(', '),
        toName: list.map(r => r.name || r.email).join(', '),
        subject, body: jdHtml ? composeJdHtml() : body, ...(jdHtml ? { htmlBody: composeJdHtml() } : {}),
        draftId: editDraft?.id || null,
        attachments: attachments.map(a => ({ name: a.name, contentType: a.type, base64: a.base64 })),
      }, { withCredentials: true });
      onSent(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email.');
    } finally { setSending(false); }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const draftTo = recipients.map(r => r.email).join(', ');
    const draftToName = recipients.map(r => r.name || r.email).join(', ');
    try {
      if (editDraft?.id) {
        await axios.put(`${API}/draft/${editDraft.id}`, { to: draftTo, toName: draftToName, subject, body }, { withCredentials: true });
      } else {
        await axios.post(`${API}/draft`, { to: draftTo, toName: draftToName, subject, body }, { withCredentials: true });
      }
      onClose();
    } catch (_) {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
           style={{ height: '88vh', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-600 to-orange-500 rounded-t-2xl">
          <span className="text-white font-semibold text-sm">New Message</span>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={saving}
              className="text-white/80 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/20 transition">
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        {/* From */}
        <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500">
          From: <span className="font-medium text-gray-700">{displayEmail}</span>
        </div>

        {/* To */}
        <div className="relative px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 w-10">To</span>
            {recipients.map((r, i) => (
              <span key={r.email + i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                {r.name || r.email}
                <button type="button" onClick={() => removeRecipient(i)}><X size={10} /></button>
              </span>
            ))}
            <input
              className="flex-1 min-w-[140px] text-sm outline-none"
              placeholder={recipients.length ? 'Add another…' : 'Type email or search by name…'}
              value={contactSearch}
              onChange={e => searchContacts(e.target.value)}
              onBlur={() => { if (isValidEmail(contactSearch)) addRecipient(contactSearch); }}
              onKeyDown={onToKeyDown}
            />
          </div>
          {showDropdown && contactResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mx-4">
              {contactResults.map(c => (
                <button key={c.id} onClick={() => selectContact(c)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-left transition">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                    {(c.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{c.email}</span>
                      {c.type && (
                        <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{c.type}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10">Subject</span>
          <input className="flex-1 text-sm outline-none" placeholder="Subject"
            value={subject} onChange={e => setSubject(e.target.value)} />
        </div>

        {/* Body — a JD email shows an editable note + designed preview; otherwise a plain textarea */}
        {jdHtml ? (
          <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-white">
              <div className="text-[11px] font-medium text-gray-500 pb-1">Add a personal note (optional) — appears above the job details:</div>
              <textarea
                className="w-full text-sm outline-none resize-none rounded-lg border border-gray-200 px-3 py-2 min-h-[80px] focus:border-blue-400"
                placeholder="Hi, I thought this role might be a great fit for you…"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>
            <div className="px-2 py-2">
              <div className="text-[11px] text-gray-400 px-2 pb-1">Preview — this is what recipients will receive:</div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: composeJdHtml() }} />
                {sigHtml && <div className="px-6 pb-4" dangerouslySetInnerHTML={{ __html: sigHtml }} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <textarea
              className="px-4 py-3 text-sm outline-none resize-none min-h-40 flex-1"
              placeholder="Write your message…"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            {sigHtml && (
              <div className="mx-4 mb-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2">
                <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Auto signature (added automatically)</div>
                <div dangerouslySetInnerHTML={{ __html: sigHtml }} />
              </div>
            )}
          </div>
        )}

        {/* Auto signature note — appended automatically, not editable */}
        <div className="px-4 pt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Lock size={11} className="flex-shrink-0" />
          <span>The signature above is added automatically to every email and can't be edited.</span>
        </div>

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="px-4 pb-1 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 max-w-full">
                <Paperclip size={12} className="flex-shrink-0" />
                <span className="truncate max-w-[160px]">{a.name}</span>
                <span className="text-gray-400 flex-shrink-0">{fmtSize(a.size)}</span>
                <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm rounded-lg font-medium hover:shadow-md transition disabled:opacity-60">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button onClick={() => fileRef.current?.click()} title="Attach files"
              className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition">
              <Paperclip size={17} />
            </button>
            <input ref={fileRef} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
          </div>
          <button onClick={() => { setBody(''); setAttachments([]); }} className="text-gray-400 hover:text-red-500 transition">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Email Viewer ─────────────────────────────────────────────────────────────
const EmailViewer = ({ email, folder, onDelete, onBack, onReply, onForward }) => {
  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Mail size={48} strokeWidth={1} />
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  const date = email.createdAt?._seconds
    ? new Date(email.createdAt._seconds * 1000)
    : email.createdAt ? new Date(email.createdAt) : null;

  const displayName = folder === 'sent' ? (email.toName || email.to) : (email.fromName || email.from);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="md:hidden text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-base font-semibold text-gray-800 flex-1 truncate">{email.subject || '(no subject)'}</h2>
        <button onClick={() => onDelete(email.id)} className="text-gray-400 hover:text-red-500 transition ml-3">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {(displayName || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">
            {folder === 'sent' ? `To: ${email.toName || email.to}` : `From: ${email.fromName || email.from}`}
          </div>
          <div className="text-xs text-gray-400">
            {folder === 'sent' ? email.to : email.from}
            {date && <span className="ml-2">{date.toLocaleString()}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-50">
        {folder === 'inbox' && (
          <button onClick={() => onReply(email)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-400 rounded px-3 py-1.5 transition">
            <Reply size={13} /> Reply
          </button>
        )}
        <button onClick={() => onForward(email)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-400 rounded px-3 py-1.5 transition">
          <Forward size={13} /> Forward
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {email.body && email.body.trim().startsWith('<') ? (
          <div className="prose prose-sm max-w-none text-gray-700"
               dangerouslySetInnerHTML={{ __html: email.body }} />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{email.body}</p>
        )}

        {/* Attachments */}
        {Array.isArray(email.attachments) && email.attachments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
              <Paperclip size={13} /> {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((a, i) => {
                const fmt = (b) => !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;
                const inner = (
                  <>
                    <FileText size={16} className="text-blue-600 flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm text-gray-800 truncate max-w-[180px]">{a.name || 'attachment'}</span>
                      {a.size ? <span className="block text-[11px] text-gray-400">{fmt(a.size)}</span> : null}
                    </span>
                    {a.url && <Download size={15} className="text-gray-400 flex-shrink-0" />}
                  </>
                );
                return a.url ? (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" download
                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:bg-blue-50 transition">
                    {inner}
                  </a>
                ) : (
                  <span key={i} title="File is no longer available for download"
                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 opacity-60">
                    {inner}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Email List Item ──────────────────────────────────────────────────────────
const EmailItem = ({ email, folder, selected, onClick }) => {
  const date = email.createdAt?._seconds
    ? new Date(email.createdAt._seconds * 1000)
    : email.createdAt ? new Date(email.createdAt) : null;

  const displayName = folder === 'sent' ? (email.toName || email.to) : (email.fromName || email.from);
  const isUnread = !email.read && folder === 'inbox';

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50/50 transition flex items-start gap-3
        ${selected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
        ${isUnread ? 'bg-white' : 'bg-gray-50/40'}`}>
      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${isUnread ? 'bg-gradient-to-br from-blue-500 to-orange-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {(displayName || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {displayName || '(unknown)'}
          </span>
          {date && <span className="text-xs text-gray-400 flex-shrink-0">{date.toLocaleDateString()}</span>}
        </div>
        <div className={`text-xs truncate mt-0.5 flex items-center gap-1 ${isUnread ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
          {Array.isArray(email.attachments) && email.attachments.length > 0 && (
            <Paperclip size={11} className="text-gray-400 flex-shrink-0" />
          )}
          <span className="truncate">{email.subject || '(no subject)'}</span>
        </div>
      </div>
      {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
    </button>
  );
};

// ── Razorpay subscription helpers (shared by paywall + status badge) ─────────
const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

const rupees = (p) => `₹${((p || 0) / 100).toLocaleString('en-IN')}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
const planLabelOf = (status, key) => (status?.plans || []).find(p => p.key === key)?.label || (key === '1year' ? '1 Year' : key === '6month' ? '6 Months' : '');

// Open Razorpay Checkout for the chosen plan, verify, then reload.
// Drives the passed setBusy/setErr. Guards on payments being configured.
//
// One-time payment (autopay paused): uses a Razorpay Order so ALL methods —
// UPI, cards, netbanking, wallets — are available. Access is granted for the
// plan term; there's no auto-renewal (re-purchase when it ends). To switch back
// to recurring autopay, point this at /subscribe + subscription_id + /verify.
async function startSubscription(status, planKey, setBusy, setErr) {
  setErr && setErr('');
  if (!status?.configured) {
    setErr && setErr("Online payment isn't switched on yet — please contact your Administrator to activate your Inbox.");
    return;
  }
  setBusy(true);
  try {
    const ok = await loadRazorpayScript();
    if (!ok) throw new Error('Could not load the payment gateway. Please check your connection.');
    const { data } = await axios.post('/api/inbox-payment/order', { plan: planKey }, { withCredentials: true });
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency || 'INR',
      name: 'RecruiterV',
      description: `Inbox — ${planLabelOf(status, planKey)}`,
      theme: { color: '#2563eb' },
      handler: async (resp) => {
        try {
          await axios.post('/api/inbox-payment/verify-order', {
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_signature: resp.razorpay_signature,
          }, { withCredentials: true });
        } catch (_) {}
        window.location.reload();
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on('payment.failed', () => { setErr && setErr('Payment failed. Please try again.'); setBusy(false); });
    rzp.open();
  } catch (e) {
    setErr && setErr(e.response?.data?.message || e.message);
    setBusy(false);
  }
}

// Two fixed plans → pick one to subscribe (autopay).
function PlanCards({ status, busy, onSubscribe, compact }) {
  const plans = status.plans || [];
  return (
    <div className={`grid ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'} gap-3`}>
      {plans.map(pl => (
        <button key={pl.key} onClick={() => onSubscribe(pl.key)} disabled={busy}
          className="text-left border-2 border-gray-200 hover:border-blue-500 rounded-xl p-4 transition disabled:opacity-60">
          <div className="text-sm font-bold text-gray-900">{pl.label}</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{rupees(pl.amountPaise)}</div>
          <div className="text-xs text-gray-500">for {pl.months} months · one-time</div>
        </button>
      ))}
    </div>
  );
}

// Small building blocks for the paywall landing page.
const FEATURES = [
  { icon: Mail, title: 'Professional Email Address', desc: 'Get a dedicated inbox at firstname.lastname@recruiterv.com — a handle that signals credibility the moment candidates read it.' },
  { icon: Lock, title: 'Built-in Trust Signal', desc: "A @recruiterv.com address instantly communicates you're a verified professional — not a random Gmail sender candidates ignore." },
  { icon: Inbox, title: 'One Inbox, All Conversations', desc: 'Manage outreach, follow-ups and replies from a single professional inbox — no juggling personal and work accounts.' },
  { icon: RefreshCw, title: 'Quick Setup', desc: 'No configuration needed. Your inbox is ready within 60 minutes of a confirmed payment — just log in to RecruiterV and start sending.' },
  { icon: CheckCircle2, title: 'Platform Remains Free', desc: 'RecruiterV stays completely free. Inbox is purely optional — a professional upgrade for those who want to level up their outreach.' },
  { icon: Users, title: 'For Recruiters & Coaches', desc: 'Whether you place candidates or guide careers, a domain-matched email makes every interaction feel intentional and polished.' },
];
const STEPS = [
  { n: '01', title: 'Pick your plan', desc: 'Choose 6 months or 12 months — whichever suits your runway. The longer plan saves you ₹99.' },
  { n: '02', title: 'Pay securely via Razorpay', desc: 'UPI, cards, netbanking — all supported. Takes about 30 seconds. You get a payment receipt instantly.' },
  { n: '03', title: 'Start sending', desc: 'Your inbox is live within minutes. Check your email for credentials, sign in, and you\'re ready to reach out.' },
];
const TESTIMONIALS = [
  { q: 'Response rates on cold outreach went up noticeably. Candidates actually reply when they see a proper domain — not just another Gmail.', name: 'Priya Mehta', role: 'Senior Recruiter, Bengaluru', init: 'PM' },
  { q: "At ₹699 for six months, it's the cheapest credibility upgrade I've found. My clients take first contact more seriously now.", name: 'Arjun Kapoor', role: 'Career Coach, Mumbai', init: 'AK' },
  { q: "Setup took literally three minutes. I didn't expect something this polished from a platform that's otherwise free.", name: 'Sneha Rao', role: 'HR Consultant, Hyderabad', init: 'SR' },
];
const FAQS = [
  { q: 'What does my email address look like?', a: 'Your inbox address is derived from your name, e.g. firstname.lastname@recruiterv.com.' },
  { q: 'How quickly is the inbox set up?', a: 'Your inbox is ready within 60 minutes of a confirmed payment — usually much sooner.' },
  { q: 'Can I access it from any email client?', a: 'Yes — you send and receive from the Inbox inside RecruiterV, and replies reach you there.' },
  { q: 'What happens when my plan expires?', a: 'This is a one-time payment for the plan term — there is no auto-renewal. When it ends, access pauses; just pay again to continue using your inbox.' },
  { q: 'Is my payment secure?', a: 'Payments are processed by Razorpay — secure and PCI DSS compliant. We never see your card details.' },
  { q: 'Can I upgrade from 6-month to 12-month later?', a: 'Yes, you can switch to the annual plan anytime from the inbox subscription controls.' },
];

// ── Paywall shown when the user has no inbox access — full landing page ───────
function InboxPaywall() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    axios.get('/api/inbox-payment/status', { withCredentials: true })
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ eligible: false }));
  }, []);

  if (!status) return <div className="py-24 grid place-items-center"><Loader2 size={26} className="animate-spin text-blue-500" /></div>;

  // ClientSPOC / ineligible roles → contact admin (no self-serve payment).
  if (!status.eligible) {
    return (
      <div className="min-h-full grid place-items-center p-6">
        <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white mb-4"><Lock size={28} /></div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Inbox is a premium feature</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Your account doesn't have access to the Inbox yet. Please <b>contact your Administrator</b> to enable this functionality.</p>
          <p className="text-xs text-gray-400 mt-4">This is a paid service.</p>
        </div>
      </div>
    );
  }

  const plan6 = (status.plans || []).find(p => p.key === '6month') || { amountPaise: 69900, months: 6 };
  const plan12 = (status.plans || []).find(p => p.key === '1year') || { amountPaise: 129900, months: 12 };
  const perMonth = (p) => `₹${Math.round((p.amountPaise / 100) / p.months)}`;
  const buy = (k) => startSubscription(status, k, setBusy, setErr);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const lapsed = status.status && status.status !== 'active';

  return (
    <div className="text-gray-900">
      {/* error / busy banner */}
      {(err || busy) && (
        <div className="sticky top-0 z-40 text-center text-sm py-2 px-4" style={{ background: err ? '#fef2f2' : '#eff6ff', color: err ? '#b91c1c' : '#1d4ed8' }}>
          {err || 'Opening secure checkout…'}
        </div>
      )}

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Premium feature · Platform stays free
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl leading-tight mt-5">
          Your name.<br /><span className="text-blue-600">Your domain.</span><br />Your credibility.
        </h1>
        <p className="text-gray-600 mt-4 max-w-xl mx-auto">
          Get a professional email address like <span className="text-blue-700 bg-blue-50 rounded-md px-2 py-0.5 text-sm">firstname.lastname@recruiterv.com</span> — and watch response rates rise.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => scrollTo('pricing')} className="bg-slate-900 hover:bg-black text-white font-semibold rounded-xl px-5 py-3 text-sm">Choose a plan →</button>
          <button onClick={() => scrollTo('how')} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold rounded-xl px-5 py-3 text-sm">How it works</button>
        </div>
        {lapsed && <p className="text-xs text-orange-600 mt-3">Your previous subscription is {status.status}{status.validUntil ? ` (was valid till ${fmtDate(status.validUntil)})` : ''}.</p>}

        {/* email mockup */}
        <div className="max-w-lg mx-auto mt-10 bg-white border border-gray-200 rounded-2xl shadow-sm text-left overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex gap-1.5 mb-3"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <div><span className="text-gray-400 mr-2">From:</span><span className="text-blue-700">priya.mehta@recruiterv.com</span></div>
              <div><span className="text-gray-400 mr-2">To:</span>rahul.sharma@gmail.com</div>
              <div><span className="text-gray-400 mr-2">Re:</span>Senior Product Manager — Bengaluru</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">recruiterv <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">inbox</span></span>
            <button onClick={() => scrollTo('pricing')} className="bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg px-3 py-1.5">Get Inbox</button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[['2×', 'Average reply rate lift'], ['3 min', 'Setup time'], ['10k+', 'Recruiters on RecruiterV'], ['₹0', 'Platform cost (always free)']].map(([n, l]) => (
            <div key={l}><div className="text-2xl font-extrabold text-slate-900">{n}</div><div className="text-[11px] text-gray-500 mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      {/* ── What you get ── */}
      <section id="features" className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-[11px] font-bold tracking-widest text-blue-600 mb-2">WHAT YOU GET</div>
        <h2 className="font-serif text-3xl mb-8">Everything a professional recruiter needs in an inbox</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {FEATURES.map(f => (
            <div key={f.title}>
              <div className="w-9 h-9 rounded-lg bg-blue-50 grid place-items-center text-blue-600 mb-3"><f.icon size={18} /></div>
              <div className="font-bold text-gray-900 text-sm">{f.title}</div>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works (dark) ── */}
      <section id="how" className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="text-[11px] font-bold tracking-widest text-blue-400 mb-2">SIMPLE AS IT GETS</div>
          <h2 className="font-serif text-3xl mb-10">Up and running in minutes</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-left">
            {STEPS.map(s => (
              <div key={s.n}>
                <div className="text-blue-400 font-bold text-sm mb-1">{s.n}</div>
                <div className="font-bold mb-1">{s.title}</div>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-[11px] font-bold tracking-widest text-blue-600 mb-2">FROM THE COMMUNITY</div>
          <h2 className="font-serif text-3xl mb-8">Recruiters who made the switch</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-sm text-gray-600 leading-relaxed">"{t.q}"</p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white grid place-items-center text-[11px] font-bold">{t.init}</div>
                  <div><div className="text-sm font-semibold text-gray-900">{t.name}</div><div className="text-[11px] text-gray-500">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 py-14 text-center">
        <div className="text-[11px] font-bold tracking-widest text-blue-600 mb-2">SIMPLE PRICING</div>
        <h2 className="font-serif text-3xl">One feature. Two plans. No surprises.</h2>
        <p className="text-sm text-gray-500 mt-2 mb-8">RecruiterV remains completely free. Inbox is optional.</p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          {/* Starter */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="text-[11px] font-bold tracking-widest text-gray-400">STARTER</div>
            <div className="mt-2"><span className="text-3xl font-extrabold text-slate-900">{rupees(plan6.amountPaise)}</span><span className="text-sm text-gray-500"> /{plan6.months} months</span></div>
            <div className="text-xs text-gray-400 mb-4">{perMonth(plan6)} per month</div>
            <ul className="space-y-2 text-sm text-gray-600 mb-5">
              {['firstname.lastname@recruiterv.com', 'Full inbox access', 'Accessible on RecruiterV portal', 'Ready within 60 minutes'].map(x => (
                <li key={x} className="flex items-start gap-2"><CheckCircle2 size={15} className="text-blue-500 mt-0.5 flex-shrink-0" /> {x}</li>
              ))}
            </ul>
            <button onClick={() => buy('6month')} disabled={busy} className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-semibold rounded-xl py-2.5 text-sm transition disabled:opacity-60">Get started — {rupees(plan6.amountPaise)}</button>
          </div>
          {/* Annual */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative">
            <span className="absolute -top-2.5 right-4 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full px-2 py-0.5">Best value</span>
            <div className="text-[11px] font-bold tracking-widest text-slate-400">ANNUAL</div>
            <div className="mt-2"><span className="text-3xl font-extrabold">{rupees(plan12.amountPaise)}</span><span className="text-sm text-slate-400"> /{plan12.months} months</span></div>
            <div className="text-xs text-slate-400 mb-4">{perMonth(plan12)} per month — save ₹{Math.max(0, Math.round((plan6.amountPaise * 2 - plan12.amountPaise) / 100))} vs starter</div>
            <ul className="space-y-2 text-sm text-slate-200 mb-5">
              {['firstname.lastname@recruiterv.com', 'Full inbox access', 'Accessible on RecruiterV portal', 'Ready within 60 minutes', '12 months of uninterrupted access'].map(x => (
                <li key={x} className="flex items-start gap-2"><CheckCircle2 size={15} className="text-blue-400 mt-0.5 flex-shrink-0" /> {x}</li>
              ))}
            </ul>
            <button onClick={() => buy('1year')} disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm transition disabled:opacity-60">Get started — {rupees(plan12.amountPaise)}</button>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-5">Payments processed by Razorpay · Secure · PCI DSS compliant</p>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-14">
          <div className="text-[11px] font-bold tracking-widest text-blue-600 mb-2 text-center">FAQ</div>
          <h2 className="font-serif text-3xl mb-8 text-center">Questions, answered</h2>
          <div className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-2xl">
            {FAQS.map((f, i) => (
              <div key={i}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 text-sm font-medium text-gray-800">
                  {f.q} <span className="text-gray-400 text-lg leading-none flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="px-5 pb-4 -mt-1 text-sm text-gray-500 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <h2 className="font-serif text-3xl">Your name deserves a domain to match.</h2>
          <p className="text-blue-100 text-sm mt-3">Join recruiters and coaches who've made the switch to a professional inbox.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button onClick={() => buy('6month')} disabled={busy} className="bg-white text-blue-700 font-semibold rounded-xl px-5 py-3 text-sm hover:bg-blue-50 disabled:opacity-60">Start with 6 months · {rupees(plan6.amountPaise)}</button>
            <button onClick={() => buy('1year')} disabled={busy} className="bg-blue-800/60 border border-white/30 text-white font-semibold rounded-xl px-5 py-3 text-sm hover:bg-blue-800 disabled:opacity-60">Go annual · {rupees(plan12.amountPaise)} →</button>
          </div>
        </div>
      </section>
    </div>
  );
}

const daysLeft = (iso) => {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
};

// Access status shown in the inbox top bar for recruiter/coach/expert/vendor:
// type (Paid N-month / Free), renewal or valid-till date, days remaining, and a
// Cancel (autopay on) or Renew (autopay off) action for paid subscriptions.
function SubscriptionBadge() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const load = () => axios.get('/api/inbox-payment/status', { withCredentials: true }).then(r => setS(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!s || !s.hasAccess) return null; // only shown to users who currently have access

  const paid = s.source === 'subscription';
  const till = fmtDate(s.validUntil);
  const left = daysLeft(s.validUntil);
  const typeLabel = paid ? (s.plan ? `Paid · ${planLabelOf(s, s.plan)}` : 'Paid') : 'Free access';
  const cancel = async () => {
    if (!window.confirm('Turn off autopay? You keep access until the current period ends.')) return;
    setBusy(true);
    try { await axios.post('/api/inbox-payment/cancel', {}, { withCredentials: true }); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to cancel.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
        <span className={`font-semibold ${paid ? 'text-indigo-700' : 'text-green-700'}`}>{typeLabel}</span>
        {till ? (
          <>
            <span className="text-gray-500">{paid && s.autopay ? 'Renews' : 'Valid till'} {till}</span>
            {left != null && <span className="text-gray-400">· {left} day{left === 1 ? '' : 's'} left</span>}
          </>
        ) : (
          <span className="text-gray-500">Lifetime</span>
        )}
        {paid && (s.autopay ? (
          <>
            <span className="text-green-600 font-medium">Autopay on</span>
            <button onClick={cancel} disabled={busy} className="text-red-500 hover:underline font-medium">Cancel</button>
          </>
        ) : (
          <>
            <span className="text-orange-600 font-medium">Autopay off</span>
            <button onClick={() => setShowPlans(v => !v)} disabled={busy}
              className="bg-blue-600 text-white font-semibold rounded-md px-2.5 py-1 hover:bg-blue-700 disabled:opacity-60">
              Renew
            </button>
          </>
        ))}
      </div>
      {showPlans && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <PlanCards status={s} busy={busy} compact onSubscribe={(k) => startSubscription(s, k, setBusy, setErr)} />
        </div>
      )}
      {err && <p className="absolute right-0 top-full mt-2 text-xs text-red-600 bg-white px-2 py-1 rounded shadow">{err}</p>}
    </div>
  );
}

// Non-editable auto signature — mirrors what the server appends to every email.
function buildSignatureHtml({ name, phone, email } = {}) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = [
    name && esc(name),
    phone && esc(phone),
    email && `<a href="mailto:${esc(email)}" style="color:#2563eb;text-decoration:none;">${esc(email)}</a>`,
    `LinkedIn: <a href="https://www.linkedin.com/company/recruiterv/" style="color:#2563eb;text-decoration:none;">https://www.linkedin.com/company/recruiterv/</a>`,
  ].filter(Boolean);
  return `<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#374151;margin-top:22px;padding-top:14px;border-top:1px solid #e5e7eb;"><div style="margin-bottom:8px;">Best Regards,</div>${
    rows.map(r => `<div>${r}</div>`).join('')
  }</div>`;
}

// Build a designed JD email body for a position, with a role-aware Apply link.
function buildJdHtml(p, applyUrl) {
  const loc = Array.isArray(p.location) ? p.location.join(', ') : (p.location || '');
  const exp = p.experience || [p.min_exp, p.max_exp].filter(Boolean).join('–') || '';
  const facts = [
    ['Experience', exp && `${exp} yrs`], ['Location', loc],
    ['Openings', p.no_of_positions], ['Employment', p.employment_type], ['Work mode', p.work_mode],
    ['Education', p.req_education], ['Skill category', p.skill_category],
  ].filter(([, v]) => v);
  const section = (title, html) => html && String(html).replace(/<[^>]*>/g, '').trim()
    ? `<div style="margin-top:18px;"><div style="font-weight:700;color:#111827;margin-bottom:4px;">${title}</div><div style="color:#374151;font-size:13px;line-height:1.6;">${html}</div></div>` : '';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#f97316);padding:18px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:.3px;">RecruiterV</span>
      </div>
      <div style="padding:24px;color:#1f2937;">
        <h1 style="font-size:22px;margin:0 0 4px;color:#111827;">${p.position || 'Open Position'}</h1>
        <div style="color:#6b7280;font-size:13px;margin-bottom:16px;">${p.client || ''}${loc ? ' · ' + loc : ''}</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${facts.map(([k, v]) => `<tr><td style="padding:5px 0;color:#6b7280;width:42%;">${k}</td><td style="padding:5px 0;font-weight:600;color:#111827;">${v}</td></tr>`).join('')}
        </table>
        ${section('Job Description', p.job_desc)}
        ${section('Key Responsibilities', p.key_res)}
        ${section('Must-have Skills', p.m_have)}
        ${section('Good-to-have Skills', p.g_have)}
        ${section('Competencies', p.compet)}
        ${section('About the Company', p.comp_view)}
        <div style="text-align:center;margin:26px 0 6px;">
          <a href="${applyUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:700;font-size:15px;">Apply Now</a>
        </div>
        <div style="text-align:center;color:#9ca3af;font-size:11px;">or copy this link: ${applyUrl}</div>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #f0f0f0;color:#9ca3af;font-size:11px;">© RecruiterV</div>
    </div>
  </div>`;
}

// "Send JD" — pick one of the user's active positions, then compose the JD email.
function SendJDModal({ recEmail, onClose, onPick }) {
  const [list, setList] = useState(null);
  const [sel, setSel] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    axios.get(`${API}/jd-positions`, { withCredentials: true })
      .then(r => setList(r.data.positions || []))
      .catch(e => { setList([]); setErr(e.response?.data?.message || 'Failed to load positions.'); });
  }, []);
  const proceed = () => {
    const p = (list || []).find(x => String(x.pos_id) === String(sel));
    if (!p) return;
    const applyUrl = `${window.location.origin}/position/${p.pos_id}?view=share&rec=${encodeURIComponent(recEmail || '')}`;
    onPick({ subject: `Opening: ${p.position}${p.client ? ' — ' + p.client : ''}`, html: buildJdHtml(p, applyUrl) });
  };
  const loc = (p) => (Array.isArray(p.location) ? p.location.join(', ') : p.location) || '';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <div><h3 className="font-bold text-gray-900">Send a Job Description</h3><p className="text-xs text-gray-500">Pick a position — its JD + Apply link goes into a new email.</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{err}</div>}
          {list === null ? (
            <div className="py-10 grid place-items-center text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
          ) : list.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">No active positions available to send.</div>
          ) : (
            <div className="space-y-2">
              {list.map(p => (
                <label key={p.pos_id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${String(sel) === String(p.pos_id) ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="jdpos" checked={String(sel) === String(p.pos_id)} onChange={() => setSel(p.pos_id)} className="mt-1 accent-blue-600" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5"><Briefcase size={14} className="text-blue-600" /> {p.position}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.client || '—'}{loc(p) ? ` · ${loc(p)}` : ''} · #{p.pos_id}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 px-3 py-2">Cancel</button>
          <button onClick={proceed} disabled={!sel} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-50"><CheckCircle2 size={15} /> Compose email</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Shared Inbox Component ──────────────────────────────────────────────
export default function InboxPage({ title = 'Inbox', embedded = false }) {
  const [folder, setFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [me, setMe] = useState({ displayEmail: '', name: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMobileViewer, setShowMobileViewer] = useState(false);
  const [fetchMsg, setFetchMsg] = useState('');
  const [replyDraft, setReplyDraft] = useState(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [showJD, setShowJD] = useState(false);      // "Send JD" position picker
  const [jdHtml, setJdHtml] = useState(null);        // designed JD email body
  const [jdSubject, setJdSubject] = useState('');    // subject for the JD email

  const { isSidebarCollapsed } = useContext(SidebarContext);
  const { user } = useContext(UserStateContext);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';

  const fetchMe = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/me`, { withCredentials: true });
      setMe(res.data);
    } catch (_) {}
    finally { setMeLoaded(true); }
  }, []);

  const fetchEmails = useCallback(async (f) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/folder/${f}`, { withCredentials: true });
      setEmails(res.data.emails || []);
    } catch (_) { setEmails([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);
  const pollGmail = async () => {
    setFetchMsg('Checking for new replies…');
    try {
      const r = await axios.post(`${API}/fetch-inbox`, {}, { withCredentials: true });
      const added = r.data?.added ?? 0;
      setFetchMsg(added > 0 ? `${added} new reply${added > 1 ? 's' : ''} arrived` : '');
    } catch (e) {
      setFetchMsg(`Inbox check failed: ${e.response?.data?.error || e.message}`);
    }
  };

  useEffect(() => {
    if (!me.inboxAccess) return;   // paid-feature gate — don't hit data endpoints without access
    const load = async () => {
      if (folder === 'inbox') await pollGmail();
      fetchEmails(folder);
      setSelected(null);
      setShowMobileViewer(false);
    };
    load();
  }, [folder, me.inboxAccess]);

  const handleSelect = async (email) => {
    setSelected(email); setShowMobileViewer(true);
    if (!email.read && folder === 'inbox') {
      try { await axios.put(`${API}/${email.id}/read`, {}, { withCredentials: true }); } catch (_) {}
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/${id}`, { withCredentials: true }); } catch (_) {}
    setEmails(prev => prev.filter(e => e.id !== id));
    if (selected?.id === id) { setSelected(null); setShowMobileViewer(false); }
  };

  const filtered = emails.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.subject || '').toLowerCase().includes(q) ||
           (e.from || '').toLowerCase().includes(q) ||
           (e.to || '').toLowerCase().includes(q) ||
           (e.fromName || '').toLowerCase().includes(q) ||
           (e.toName || '').toLowerCase().includes(q);
  });

  const unreadCount = emails.filter(e => !e.read && folder === 'inbox').length;
  const draftCount = folder === 'draft' ? emails.length : 0;

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'draft', label: 'Drafts', icon: FileText, count: draftCount },
  ];

  // Wrap page content in the role sidebar chrome, OR (embedded) fit the parent
  // shell. A plain function (not a component) so children never remount.
  const frame = (inner) => embedded ? (
    <div className="flex flex-col h-full min-h-[520px] bg-gray-50 overflow-hidden">{inner}</div>
  ) : (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-10'}`}>
        {inner}
      </div>
    </div>
  );

  // Paid-feature gate: while resolving access show a spinner; if not granted,
  // show the paywall / "contact your administrator" screen instead of the mailbox.
  if (!meLoaded) {
    return frame(
      <div className="flex-1 grid place-items-center">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!me.inboxAccess) {
    return frame(
      <div className="flex-1 overflow-y-auto bg-white">
        <InboxPaywall />
      </div>
    );
  }

  return frame(
    <>
      {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {me.displayEmail && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">{me.displayEmail}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <SubscriptionBadge />
            <button
              onClick={() => setShowJD(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-50 transition">
              <Briefcase size={16} /> Send JD
            </button>
            <button
              onClick={() => { setEditDraft(null); setJdHtml(null); setShowCompose(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white text-sm font-medium rounded-xl hover:shadow-md transition">
              <Plus size={16} /> Compose
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Folder nav */}
          <div className="w-44 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col py-4 gap-1">
            {folders.map(f => (
              <button key={f.id} onClick={() => setFolder(f.id)}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition
                  ${folder === f.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <f.icon size={16} />
                <span className="flex-1 text-left">{f.label}</span>
                {f.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                    ${folder === f.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Email list */}
          <div className={`flex flex-col border-r border-gray-200 bg-white overflow-hidden
            ${showMobileViewer ? 'hidden md:flex' : 'flex'} w-80 flex-shrink-0`}>
            <div className="px-3 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400" />
                <input className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400" /></button>}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-gray-400 capitalize font-medium">{folder} · {filtered.length}</span>
              <button
                onClick={async () => {
                  if (folder === 'inbox') await pollGmail();
                  fetchEmails(folder);
                }}
                className="text-gray-400 hover:text-blue-600 transition"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {fetchMsg && (
              <p className={`text-xs px-4 py-1 ${fetchMsg.includes('failed') ? 'text-red-500' : fetchMsg.includes('new repl') ? 'text-green-600' : 'text-gray-400'}`}>
                {fetchMsg}
              </p>
            )}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <MailOpen size={32} strokeWidth={1} />
                  <p className="text-sm">{search ? 'No results' : `No emails in ${folder}`}</p>
                </div>
              ) : (
                filtered.map(email => (
                  <EmailItem key={email.id} email={email} folder={folder}
                    selected={selected?.id === email.id}
                    onClick={() => folder === 'draft' ? (() => { setEditDraft(email); setShowCompose(true); })() : handleSelect(email)} />
                ))
              )}
            </div>
          </div>

          {/* Email viewer */}
          <div className={`flex-1 overflow-hidden bg-white
            ${showMobileViewer ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
            <EmailViewer email={selected} folder={folder} onDelete={handleDelete}
              onBack={() => setShowMobileViewer(false)}
              onReply={(email) => {
                setReplyDraft({
                  to: email.from,
                  toName: email.fromName || email.from,
                  subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`,
                  body: '',
                });
                setShowCompose(true);
              }}
              onForward={(email) => {
                setReplyDraft({
                  to: '',
                  toName: '',
                  subject: email.subject?.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject || ''}`,
                  body: `\n\n---------- Forwarded message ----------\nFrom: ${email.fromName || email.from} <${email.from}>\nSubject: ${email.subject || ''}\n\n${email.body?.replace(/<[^>]*>/g, '') || ''}`,
                });
                setShowCompose(true);
              }} />
          </div>
        </div>

      {showJD && (
        <SendJDModal
          recEmail={user?.email || me.email || ''}
          onClose={() => setShowJD(false)}
          onPick={({ subject, html }) => {
            setShowJD(false);
            setJdSubject(subject); setJdHtml(html); setEditDraft(null); setReplyDraft(null);
            setShowCompose(true);
          }}
        />
      )}

      {showCompose && (
        <ComposeModal
          displayEmail={me.displayEmail}
          sigHtml={buildSignatureHtml({ name: me.name, phone: me.phone, email: me.displayEmail })}
          editDraft={jdHtml ? { subject: jdSubject } : (replyDraft || editDraft)}
          jdHtml={jdHtml}
          onClose={() => { setShowCompose(false); setEditDraft(null); setReplyDraft(null); setJdHtml(null); }}
          onSent={() => fetchEmails('sent')}
        />
      )}
    </>
  );
}
