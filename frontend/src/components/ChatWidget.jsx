import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage, getChatHistory, deleteChatSession } from '../services/chatService';
import { useAuthStore } from '../store/authStore';

// ─── Simple Markdown renderer (bold, bullets, code, line-breaks) ──
function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bullet
        const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-0.5 text-indigo-400 flex-shrink-0">•</span>
              <span>{renderInline(bulletMatch[1])}</span>
            </div>
          );
        }
        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-0.5 text-indigo-400 flex-shrink-0 font-mono text-xs">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  // Bold: **text**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    // Inline code: `text`
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return (
          <code key={j} className="bg-slate-700 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">
            {cp.slice(1, -1)}
          </code>
        );
      }
      return <span key={j}>{cp}</span>;
    });
  });
}

// ─── Typing indicator ────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-slate-700 text-slate-100 rounded-bl-sm'
        }`}
      >
        {isUser ? msg.content : <MarkdownText text={msg.content} />}
        <div className={`text-[10px] mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
          {new Date(msg.timestamp ?? 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── Quick-action chips ──────────────────────────────────────────
const QUICK_CHIPS = [
  { label: 'My skills', message: 'What are my skills?' },
  { label: 'Skill gaps', message: 'What skills am I missing?' },
  { label: 'What to learn', message: 'What should I learn next?' },
  { label: 'Top jobs', message: 'What jobs match my skills?' },
  { label: 'My progress', message: 'How much progress have I made?' },
  { label: 'Recommend courses', message: 'Recommend courses for my missing skills' },
];

// ─── Session history panel ────────────────────────────────────────
function SessionList({ sessions, currentId, onSelect, onDelete, onClose }) {
  if (!sessions.length) {
    return (
      <div className="p-4 text-slate-400 text-sm text-center">No previous conversations</div>
    );
  }
  return (
    <div className="overflow-y-auto max-h-72 divide-y divide-slate-700">
      {sessions.map((s) => (
        <div
          key={s.sessionId}
          className={`flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors cursor-pointer ${
            s.sessionId === currentId ? 'bg-slate-700' : ''
          }`}
        >
          <div className="flex-1 min-w-0" onClick={() => { onSelect(s.sessionId); onClose(); }}>
            <p className="text-sm text-white truncate">{s.title}</p>
            <p className="text-xs text-slate-400 truncate">{s.lastMessage}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(s.sessionId); }}
            className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
            title="Delete session"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main ChatWidget ─────────────────────────────────────────────
export default function ChatWidget() {
  const { user, accessToken } = useAuthStore();
  const [open, setOpen]           = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [sessions, setSessions]   = useState([]);
  const [unread, setUnread]       = useState(0);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  // Greet the user when the widget first opens (no session yet)
  useEffect(() => {
    if (!accessToken || !user) return;
    if (open && messages.length === 0 && !sessionId) {
      setMessages([{
        role: 'assistant',
        content: `Hey ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AdaptLearn AI coach.\n\nAsk me about your **skill gaps**, **what to learn next**, or anything career-related!`,
        timestamp: new Date(),
      }]);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, accessToken, user, messages.length, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getChatHistory();
      setSessions(data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open && showHistory) loadHistory();
  }, [open, showHistory, loadHistory]);

  // Only show for authenticated users — MUST be after all hooks
  if (!accessToken || !user) return null;

  const loadSession = async (sid) => {
    try {
      const s = await import('../services/chatService').then(m => m.getChatSession(sid));
      setSessionId(s.sessionId);
      setMessages(s.messages || []);
    } catch { /* ignore */ }
  };

  const handleDeleteSession = async (sid) => {
    try {
      await deleteChatSession(sid);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));
      if (sid === sessionId) {
        setSessionId(null);
        setMessages([{
          role: 'assistant',
          content: "Session deleted. Start a new conversation below! 👇",
          timestamp: new Date(),
        }]);
      }
    } catch { /* ignore */ }
  };

  const send = async (text) => {
    const msg = text?.trim() || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendChatMessage(msg, sessionId);
      setSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply, intent: result.intent, timestamp: new Date() },
      ]);
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      const errMsg = err?.response?.status === 429
        ? "You've reached the hourly message limit. Try again later!"
        : "I couldn't reach the server. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errMsg, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const startNew = () => {
    setSessionId(null);
    setMessages([{
      role: 'assistant',
      content: `Sure! Starting a fresh conversation. What's on your mind, ${user?.name?.split(' ')[0] || 'there'}? 🚀`,
      timestamp: new Date(),
    }]);
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Open AI chat"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">AdaptLearn Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* History button */}
              <button
                onClick={() => setShowHistory((s) => !s)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Chat history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {/* New chat */}
              <button
                onClick={startNew}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="New conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Session history dropdown */}
          {showHistory && (
            <div className="bg-slate-800 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Past conversations</span>
                <button
                  onClick={() => { setShowHistory(false); loadHistory(); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Refresh
                </button>
              </div>
              <SessionList
                sessions={sessions}
                currentId={sessionId}
                onSelect={loadSession}
                onDelete={handleDeleteSession}
                onClose={() => setShowHistory(false)}
              />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 min-h-[200px]">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5">
                  AI
                </div>
                <div className="bg-slate-700 rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
              {QUICK_CHIPS.slice(0, 4).map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => send(chip.message)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-2 px-4 py-3 border-t border-slate-700 bg-slate-800 flex-shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              disabled={loading}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none overflow-hidden transition-colors disabled:opacity-50 leading-relaxed"
              style={{ minHeight: '38px', maxHeight: '100px' }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Footer hint */}
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-[10px] text-slate-600 text-center">
              AI responses are based on your profile data · 60 msg/hr limit
            </p>
          </div>
        </div>
      )}
    </>
  );
}
