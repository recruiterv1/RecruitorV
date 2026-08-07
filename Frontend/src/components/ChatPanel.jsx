import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { Send, Search, MessageSquare, ArrowLeft, Loader, Users, Paperclip, Smile, X, UsersRound, FileText, Plus } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';

// Map the logged-in user's roleCategory to a chat role (fallback for the Group button)
const roleFromUser = (user) => {
  const rc = (user?.roleCategory || user?.role || '').toString().toLowerCase();
  if (rc === 'coach') return 'coach';
  if (rc === 'expert') return 'expert';
  if (rc === 'clientspoc') return 'clientspoc';
  if (rc === 'admin' || rc === 'super admin' || rc === 'superadmin') return 'admin';
  return '';
};

const roleBadge = {
  admin: 'bg-purple-100 text-purple-700',
  coach: 'bg-blue-100 text-blue-700',
  expert: 'bg-indigo-100 text-indigo-700',
  clientspoc: 'bg-orange-100 text-orange-700',
  recruiter: 'bg-green-100 text-green-700',
  group: 'bg-pink-100 text-pink-700',
};
// Friendly display label for a role badge ('admin' is shown as "Support").
const roleLabel = (r) => (r === 'admin' ? 'Support' : r);
const GROUP_ROLES = ['coach', 'expert', 'admin', 'clientspoc'];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EMOJIS = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤩','🥳','👍','👎','🙏','👏','🙌','💪','🔥','✨','🎉','💯','❤️','💙','💚','✅','❌','⚠️','📌','📎','📄','📷','💼','🤝','👋','🙂','😅','😉','🤔','😢','😮','🚀'];

const fmtTime = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// Render message text with clickable links (incl. /position/ links)
const Linkified = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s]+|\/position\/[A-Za-z0-9_-]+)/g);
  return parts.map((p, i) => {
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all">{p}</a>;
    if (/^\/position\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all">{p}</a>;
    return <span key={i}>{p}</span>;
  });
};

const ChatPanel = () => {
  const { user } = useContext(UserStateContext) || {};
  const [sections, setSections] = useState([]);
  const [myRole, setMyRole] = useState('');
  const effectiveRole = myRole || roleFromUser(user);
  const [conversations, setConversations] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [active, setActive] = useState(null); // { conversationId, email, name, role, isGroup, members }
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [showListMobile, setShowListMobile] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [mentionList, setMentionList] = useState(null); // members to pick when typing "@"
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const prevConvRef = useRef(null);
  const prevLenRef = useRef(0);

  const loadContacts = useCallback(async () => {
    try {
      const [cRes, convRes] = await Promise.all([
        axios.get('/api/chat/contacts', { withCredentials: true }),
        axios.get('/api/chat/conversations', { withCredentials: true }),
      ]);
      setSections(cRes.data?.sections || []);
      setMyRole(cRes.data?.role || '');
      setConversations(convRes.data?.conversations || []);
    } catch (e) { console.error('chat contacts', e); }
    finally { setLoadingContacts(false); }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/conversations', { withCredentials: true });
      setConversations(res.data?.conversations || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { const t = setInterval(refreshConversations, 5000); return () => clearInterval(t); }, [refreshConversations]);

  const loadMessages = useCallback(async (conversationId, quiet) => {
    if (!quiet) setLoadingMsgs(true);
    try {
      const res = await axios.get(`/api/chat/messages/${conversationId}`, { withCredentials: true });
      const next = res.data?.messages || [];
      // Skip the state update when nothing changed, so polling doesn't re-render/scroll.
      setMessages(prev => {
        if (prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id) return prev;
        return next;
      });
    } catch (e) { console.error('chat messages', e); }
    finally { if (!quiet) setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (!active?.conversationId) return;
    const t = setInterval(() => { loadMessages(active.conversationId, true); refreshConversations(); }, 3000);
    return () => clearInterval(t);
  }, [active, loadMessages, refreshConversations]);

  // Auto-scroll the message pane ONLY when the conversation changes or a new message
  // arrives while you're near the bottom — never yank you up/down while reading or polling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const convChanged = prevConvRef.current !== active?.conversationId;
    const grew = messages.length > prevLenRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (convChanged || (grew && nearBottom)) {
      el.scrollTop = el.scrollHeight;
    }
    prevConvRef.current = active?.conversationId;
    prevLenRef.current = messages.length;
  }, [messages, active]);

  const openDirect = async (contact) => {
    setShowListMobile(false); setShowEmoji(false);
    setActive({ conversationId: null, email: contact.email, name: contact.name || contact.otherName, role: contact.role || contact.otherRole, isGroup: false });
    setMessages([]);
    try {
      const res = await axios.post('/api/chat/open', { withEmail: contact.email }, { withCredentials: true });
      if (res.data?.success) {
        setActive({ conversationId: res.data.conversationId, email: res.data.other.email, name: res.data.other.name, role: res.data.other.role, isGroup: false });
        await loadMessages(res.data.conversationId); refreshConversations();
      }
    } catch (e) { alert(e.response?.data?.message || 'Could not open chat'); setActive(null); }
  };

  // Auto-open a chat when arriving via /messages?to=<email> (e.g. the "Message"
  // button on the recruiter detail dashboard).
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    const to = new URLSearchParams(window.location.search).get('to');
    if (to) { autoOpenedRef.current = true; openDirect({ email: to }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConversation = async (conv) => {
    setShowListMobile(false); setShowEmoji(false);
    if (conv.isGroup) {
      setActive({ conversationId: conv.id, name: conv.name, isGroup: true, role: 'group', members: [] });
      await loadMessages(conv.id);
      try { const r = await axios.get(`/api/chat/conversation/${conv.id}`, { withCredentials: true }); if (r.data?.success) setActive(a => ({ ...a, members: r.data.conversation.members || [] })); } catch { /* ignore */ }
    } else {
      setActive({ conversationId: conv.id, email: conv.otherEmail, name: conv.otherName, role: conv.otherRole, isGroup: false });
      await loadMessages(conv.id);
    }
    refreshConversations();
  };

  // @mention helpers (group chats)
  const computeMentions = (body) => {
    if (!active?.isGroup) return [];
    const members = active.members || [];
    if (/@all\b/i.test(body)) return members.map(m => m.email);
    const out = [];
    members.forEach(m => { if (m.name && body.includes(`@${m.name}`)) out.push(m.email); });
    return [...new Set(out)];
  };
  const onTextChange = (val) => {
    setText(val);
    if (active?.isGroup) {
      const mm = val.match(/@([\w.-]*)$/);
      if (mm) {
        const qq = mm[1].toLowerCase();
        const opts = [{ email: '__all__', name: 'all' }, ...(active.members || [])]
          .filter(m => m.name && (qq === '' || m.name.toLowerCase().includes(qq) || (m.email || '').toLowerCase().includes(qq)));
        setMentionList(opts.slice(0, 6));
      } else setMentionList(null);
    }
  };
  const pickMention = (m) => {
    setText(t => t.replace(/@([\w.-]*)$/, `@${m.name} `));
    setMentionList(null);
  };

  const sendMessage = async (attachment) => {
    const t = text.trim();
    if ((!t && !attachment) || !active?.conversationId || sending) return;
    const mentions = computeMentions(t);
    setSending(true); setShowEmoji(false); setMentionList(null);
    if (!attachment) setText('');
    setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, text: t, attachment: attachment || null, mentions, mine: true, createdAt: Date.now() }]);
    try {
      await axios.post('/api/chat/send', { conversationId: active.conversationId, text: t, attachment, mentions }, { withCredentials: true });
      if (attachment) setText('');
      await loadMessages(active.conversationId, true); refreshConversations();
    } catch (e) { alert(e.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  // Render message text: clickable links + highlighted @mentions
  const renderBody = (body) => {
    const names = (active?.isGroup ? (active.members || []) : []).map(m => m.name).filter(Boolean).map(escapeRe).sort((a, b) => b.length - a.length);
    const mentionPart = `@(?:all${names.length ? '|' + names.join('|') : ''})`;
    const re = new RegExp(`(https?:\\/\\/[^\\s]+|\\/position\\/[A-Za-z0-9_-]+|${mentionPart})`, 'g');
    return body.split(re).map((p, i) => {
      if (/^https?:\/\//.test(p) || /^\/position\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all">{p}</a>;
      if (p && p[0] === '@') return <span key={i} className="font-semibold text-indigo-600 bg-indigo-100/70 rounded px-0.5">{p}</span>;
      return <span key={i}>{p}</span>;
    });
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !active?.conversationId) return;
    if (file.size > 15 * 1024 * 1024) { alert('File too large (max 15MB)'); return; }
    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const up = await axios.post('/api/chat/upload', { filename: file.name, contentType: file.type, base64 }, { withCredentials: true });
      if (up.data?.success) {
        await sendMessage({ url: up.data.url, name: up.data.name, type: up.data.type, kind: up.data.kind });
      }
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const convByEmail = {};
  conversations.forEach(c => { if (!c.isGroup) convByEmail[(c.otherEmail || '').toLowerCase()] = c; });
  const groups = conversations.filter(c => c.isGroup);
  const directConvs = conversations.filter(c => !c.isGroup);

  const q = search.toLowerCase();
  const matchesConv = (c) => !q || (c.otherName || c.name || '').toLowerCase().includes(q) || (c.otherEmail || '').toLowerCase().includes(q);
  const matchesContact = (c) => (c.name || c.email || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);

  return (
    <div className="w-full p-3 sm:p-4 lg:p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex" style={{ height: 'calc(100vh - 160px)', minHeight: 480 }}>
        {/* ── Left ── */}
        <div className={`${showListMobile ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 flex-shrink-0`}>
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2"><MessageSquare size={18} /> Messages</h3>
              {GROUP_ROLES.includes(effectiveRole) && (
                <button onClick={() => setGroupModal(true)} className="flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg">
                  <Plus size={13} /> Group
                </button>
              )}
            </div>
            <div className="relative mt-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 bg-white/20 placeholder-white/60 text-white border border-white/30 rounded-xl text-sm focus:outline-none focus:bg-white/30" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex justify-center py-10"><Loader className="animate-spin text-blue-500" /></div>
            ) : (
              <>
                {/* Groups — always show existing groups; search filters them */}
                {groups.filter(matchesConv).length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Groups</p>
                    {groups.filter(matchesConv).map(g => {
                      const isActive = active?.conversationId === g.id;
                      return (
                        <button key={g.id} onClick={() => openConversation(g)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 ${isActive ? 'bg-blue-50' : ''}`}>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center flex-shrink-0"><UsersRound size={16} /></div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800 text-sm truncate">{g.name}</p>
                            <p className="text-xs text-gray-400 truncate">{g.lastMessage || `${g.memberCount} members`}</p>
                          </div>
                          {g.unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{g.unread}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 1:1 conversations — only existing chats shown by default */}
                {(() => {
                  const filteredDirect = directConvs.filter(matchesConv);
                  // Contacts from sections that match search but have NO existing conversation
                  const newContacts = q
                    ? sections.flatMap(s => s.contacts.filter(c => matchesContact(c) && !convByEmail[(c.email || '').toLowerCase()]))
                    : [];

                  if (!q && directConvs.length === 0 && groups.length === 0) {
                    return (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <Users size={36} className="mx-auto mb-2 opacity-30" />
                        No conversations yet.<br />Search by name to find someone and start chatting.
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Existing 1:1 conversations */}
                      {filteredDirect.length > 0 && (
                        <div>
                          <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Recent</p>
                          {filteredDirect.map(conv => {
                            const isActive = active && !active.isGroup && (active.email || '').toLowerCase() === (conv.otherEmail || '').toLowerCase();
                            return (
                              <button key={conv.id} onClick={() => openConversation(conv)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 ${isActive ? 'bg-blue-50' : ''}`}>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0">{(conv.otherName || conv.otherEmail || '?')[0].toUpperCase()}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{conv.otherName || conv.otherEmail?.split('@')[0]}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roleBadge[conv.otherRole] || 'bg-gray-100 text-gray-600'}`}>{roleLabel(conv.otherRole)}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">{conv.lastMessage || conv.otherEmail}</p>
                                </div>
                                {conv.unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{conv.unread}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* New contacts (only shown when searching) */}
                      {newContacts.length > 0 && (
                        <div>
                          <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Start new chat</p>
                          {newContacts.map(c => {
                            const isActive = active && !active.isGroup && (active.email || '').toLowerCase() === (c.email || '').toLowerCase();
                            return (
                              <button key={c.email} onClick={() => openDirect(c)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 ${isActive ? 'bg-blue-50' : ''}`}>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0">{(c.name || c.email || '?')[0].toUpperCase()}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{c.name || c.email.split('@')[0]}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roleBadge[c.role] || 'bg-gray-100 text-gray-600'}`}>{roleLabel(c.role)}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Search returned nothing */}
                      {q && filteredDirect.length === 0 && newContacts.length === 0 && groups.filter(matchesConv).length === 0 && (
                        <div className="p-6 text-center text-gray-400 text-sm">No results for "{search}"</div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* ── Right ── */}
        <div className={`${showListMobile ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="opacity-20 mb-3" />
              <p className="text-sm">Select a contact or group to start chatting</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <button onClick={() => setShowListMobile(true)} className="md:hidden p-1 text-gray-500"><ArrowLeft size={18} /></button>
                <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold ${active.isGroup ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
                  {active.isGroup ? <UsersRound size={16} /> : (active.name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{active.name}</p>
                  {active.isGroup
                    ? <p className="text-xs text-gray-400 truncate">{(active.members || []).map(m => m.name).join(', ') || 'Group'}</p>
                    : <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roleBadge[active.role] || 'bg-gray-100 text-gray-600'}`}>{roleLabel(active.role)}</span>}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10"><Loader className="animate-spin text-blue-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-10">No messages yet. Say hello! 👋</div>
                ) : messages.map(m => (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm ${m.mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'} ${m.mentionsMe && !m.mine ? 'ring-2 ring-indigo-400' : ''}`}>
                      {active.isGroup && !m.mine && m.senderName && <p className="text-[11px] font-bold text-indigo-500 mb-0.5">{m.senderName}{m.mentionsMe ? ' · mentioned you' : ''}</p>}
                      {m.attachment && m.attachment.kind === 'image' && (
                        <a href={m.attachment.url} target="_blank" rel="noopener noreferrer">
                          <img src={m.attachment.url} alt={m.attachment.name} className="rounded-lg max-h-56 mb-1 object-cover" />
                        </a>
                      )}
                      {m.attachment && m.attachment.kind !== 'image' && (
                        <a href={m.attachment.url} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-2 mb-1 px-2.5 py-2 rounded-lg ${m.mine ? 'bg-blue-500' : 'bg-gray-100'}`}>
                          <FileText size={16} /> <span className="truncate max-w-[180px]">{m.attachment.name}</span>
                        </a>
                      )}
                      {m.text && <p className="whitespace-pre-wrap break-words">{renderBody(m.text)}</p>}
                      <p className={`text-[10px] mt-0.5 ${m.mine ? 'text-blue-100' : 'text-gray-400'}`}>{fmtTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 bg-white relative">
                {active.isGroup && mentionList && mentionList.length > 0 && (
                  <div className="absolute bottom-full left-12 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-56 z-20 max-h-56 overflow-y-auto">
                    {mentionList.map(m => (
                      <button key={m.email} onClick={() => pickMention(m)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-50 text-left">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs flex items-center justify-center font-bold">{(m.name || '@')[0].toUpperCase()}</span>
                        <span className="text-sm text-gray-700 truncate">{m.name === 'all' ? 'all (everyone)' : m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showEmoji && (
                  <div className="absolute bottom-full left-2 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-8 gap-1 w-72 z-10">
                    {EMOJIS.map(e => <button key={e} onClick={() => { setText(t => t + e); }} className="text-xl hover:bg-gray-100 rounded">{e}</button>)}
                  </div>
                )}
                <div className="p-3 flex items-center gap-2">
                  <button onClick={() => setShowEmoji(v => !v)} className="text-gray-400 hover:text-blue-600 p-1"><Smile size={20} /></button>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-gray-400 hover:text-blue-600 p-1 disabled:opacity-50">
                    {uploading ? <Loader size={18} className="animate-spin" /> : <Paperclip size={20} />}
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={onFile} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />
                  <input
                    value={text} onChange={e => onTextChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={active.isGroup ? 'Message… use @ to tag members' : 'Type a message…'}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={() => sendMessage()} disabled={sending || (!text.trim())}
                    className="flex items-center justify-center w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex-shrink-0">
                    {sending ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {groupModal && (
        <NewGroupModal sections={sections} onClose={() => setGroupModal(false)}
          onCreated={(conv) => { setGroupModal(false); loadContacts(); openConversation({ id: conv.conversationId, isGroup: true, name: conv.name }); }} />
      )}
    </div>
  );
};

const NewGroupModal = ({ sections, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState({});
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const all = sections.flatMap(s => s.contacts);

  const toggle = (email) => setSelected(p => ({ ...p, [email]: !p[email] }));
  const chosen = all.filter(c => selected[c.email]);

  const create = async () => {
    if (!name.trim()) { setErr('Enter a group name'); return; }
    if (chosen.length < 1) { setErr('Select at least one member'); return; }
    setCreating(true); setErr('');
    try {
      const res = await axios.post('/api/chat/group/create', { name: name.trim(), members: chosen.map(c => c.email) }, { withCredentials: true });
      if (res.data?.success) onCreated(res.data);
      else setErr(res.data?.message || 'Failed to create group');
    } catch (e) { setErr(e.response?.data?.message || 'Failed to create group'); }
    finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-2xl flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><UsersRound size={18} /> New Group</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name"
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-pink-400 focus:outline-none" />
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add members ({chosen.length} selected)</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {all.length === 0 && <p className="text-sm text-gray-400">No contacts available to add.</p>}
              {sections.map(sec => (
                <div key={sec.label}>
                  <p className="text-[11px] font-semibold text-gray-400 mb-1">{sec.label}</p>
                  {sec.contacts.map(c => (
                    <label key={c.email} className="flex items-center gap-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!selected[c.email]} onChange={() => toggle(c.email)} className="accent-pink-500" />
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs flex items-center justify-center font-bold">{(c.name || c.email)[0].toUpperCase()}</span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{c.name || c.email.split('@')[0]}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roleBadge[c.role] || 'bg-gray-100 text-gray-600'}`}>{roleLabel(c.role)}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={create} disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
            {creating ? <Loader size={15} className="animate-spin" /> : <UsersRound size={15} />} Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
