import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, X } from 'lucide-react';
import { UserStateContext } from './AuthPro';

export const ChatNotifyContext = createContext({ total: 0 });
export const useChatNotify = () => useContext(ChatNotifyContext);

const ChatNotifyProvider = ({ children }) => {
  const { user } = useContext(UserStateContext) || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [total, setTotal] = useState(0);
  const [toasts, setToasts] = useState([]);
  const prevRef = useRef({});       // conversationId -> unread count seen
  const firstLoadRef = useRef(true);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/chat/unread', { withCredentials: true });
      if (!res.data?.success) return;
      const items = res.data.items || [];
      setTotal(res.data.total || 0);

      const onMessagesPage = (location.pathname || '').toLowerCase().includes('messages');
      const newToasts = [];
      items.forEach(it => {
        const prev = prevRef.current[it.id] || 0;
        if (!firstLoadRef.current && it.unread > prev && !onMessagesPage) {
          newToasts.push({
            id: `${it.id}-${it.lastMessageAt || Date.now()}`,
            convName: it.otherName,
            role: it.otherRole,
            message: it.lastMessage,
          });
        }
      });

      // Rebuild seen-map from current items (others are read = 0)
      const next = {};
      items.forEach(it => { next[it.id] = it.unread; });
      prevRef.current = next;
      firstLoadRef.current = false;

      if (newToasts.length) {
        setToasts(prev => {
          // de-dupe by conversation, keep newest 4
          const byConv = {};
          [...prev, ...newToasts].forEach(t => { byConv[t.id.split('-')[0]] = t; });
          return Object.values(byConv).slice(-4);
        });
        // chime (best-effort, ignored if blocked)
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.05;
          o.start(); o.stop(ctx.currentTime + 0.12);
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) { setTotal(0); prevRef.current = {}; firstLoadRef.current = true; return; }
    poll();
    const t = setInterval(poll, 8000);
    return () => clearInterval(t);
  }, [user, poll]);

  // Auto-dismiss each toast after 7s
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map(t => setTimeout(() => dismiss(t.id), 7000));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const openMessages = (toastId) => {
    dismiss(toastId);
    navigate('/messages');
  };

  return (
    <ChatNotifyContext.Provider value={{ total, refresh: poll }}>
      {children}

      {/* Bottom-right toast stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)]">
        {toasts.map(t => (
          <div key={t.id}
            className="relative bg-white border border-blue-200 shadow-xl rounded-2xl p-3 pr-8 cursor-pointer hover:shadow-2xl transition-all animate-chat-pop"
            onClick={() => openMessages(t.id)}>
            <button onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
              <X size={14} />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">New message from {t.convName}</p>
                <p className="text-xs text-gray-500 truncate">{t.message || 'Tap to open chat'}</p>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Click to reply →</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes chat-pop { from { transform: translateY(12px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .animate-chat-pop { animation: chat-pop 0.25s ease-out forwards; }
        @keyframes chat-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .animate-chat-blink { animation: chat-blink 1.1s ease-in-out infinite; }
      `}</style>
    </ChatNotifyContext.Provider>
  );
};

export default ChatNotifyProvider;
