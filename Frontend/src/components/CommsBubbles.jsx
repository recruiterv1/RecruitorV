import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, MessageSquare } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { useChatNotify } from '../context/ChatNotify';

// Role → { inbox, chat } destinations. Chat lives inside /ad_panel for
// clientspoc/vendor and at /messages for recruiter/coach/expert.
const ROLE_LINKS = {
  recruiter:  { inbox: '/recruiter-inbox',  chat: '/messages' },
  coach:      { inbox: '/coach-inbox',      chat: '/messages' },
  expert:     { inbox: '/expert-inbox',     chat: '/messages' },
  clientspoc: { inbox: '/clientspoc-inbox', chat: '/ad_panel#messages' },
  vendor:     { inbox: '/clientspoc-inbox', chat: '/ad_panel#messages' },
};

// Floating Inbox (mail) + Chat bubbles, bottom-right, on every page for a
// logged-in user. Replaces the sidebar Inbox/Chat menu items.
export default function CommsBubbles() {
  const { user } = useContext(UserStateContext);
  const navigate = useNavigate();
  const location = useLocation();
  let chatUnread = 0;
  try { chatUnread = useChatNotify()?.total || 0; } catch (_) { /* provider optional */ }

  const role = (user?.roleCategory || '').toLowerCase().replace(/\s+/g, '');
  const links = ROLE_LINKS[role];
  if (!user?.email || !links) return null; // only for signed-in users with an inbox/chat

  const go = (path) => {
    if (path.includes('#')) { window.location.assign(path); }
    else navigate(path);
  };

  const onInbox = location.pathname === links.inbox;
  const onChat = links.chat.includes('#')
    ? (location.pathname === '/ad_panel' && location.hash === '#messages')
    : location.pathname === links.chat;

  const Bubble = ({ label, active, onClick, children, badge }) => (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 focus:outline-none ${
        active ? 'ring-2 ring-offset-2 ring-blue-400' : ''
      }`}
      style={{ background: 'linear-gradient(135deg,#2563eb,#f97316)' }}
    >
      <span className="text-white">{children}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3 print:hidden">
      <Bubble label="Inbox" active={onInbox} onClick={() => go(links.inbox)}>
        <Mail size={22} />
      </Bubble>
      <Bubble label="Chat" active={onChat} badge={chatUnread} onClick={() => go(links.chat)}>
        <MessageSquare size={22} />
      </Bubble>
    </div>
  );
}
