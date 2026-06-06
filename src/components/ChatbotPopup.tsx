import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: string;
}

// For local dev set REACT_APP_CHATBOT_API_URL=http://localhost:8000/python_api
// in .env.
const CHATBOT_API_URL =
  process.env.REACT_APP_CHATBOT_API_URL || '/python_api';

const STORAGE_KEY = 'evchamp_chat_history_v1';
const SESSION_KEY = 'evchamp_chat_session_id_v1';

const WELCOME_MESSAGE: ChatMessage = {
  content:
    "Hi! Hope you're having a great day. 👋\nWelcome to **EVChamp Assistant**. Ask me anything about our platform — plans, charging network, battery diagnostics, franchise, and more.\n⚡ **AI-powered support**, available 24×7.\nHow can I help you?",
  isUser: false,
  timestamp: new Date().toISOString(),
};

// Inline markdown: **bold**, *italic*, [text](url). Order matters — links
// first so their inner [text] isn't mistaken for italics.
const INLINE_RE =
  /(\[[^\]]+\]\(https?:\/\/[^\s)]+\))|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)/g;

const renderInline = (text: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  text.replace(INLINE_RE, (match, link, bold, italic, offset: number) => {
    if (offset > last) out.push(text.slice(last, offset));
    if (link) {
      const m = link.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (m) {
        out.push(
          <a
            key={`l-${i++}`}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 break-all"
          >
            {m[1]}
          </a>
        );
      } else {
        out.push(link);
      }
    } else if (bold) {
      out.push(
        <strong key={`b-${i++}`} className="font-semibold">
          {bold.slice(2, -2)}
        </strong>
      );
    } else if (italic) {
      out.push(
        <em key={`i-${i++}`} className="italic">
          {italic.slice(1, -1)}
        </em>
      );
    }
    last = offset + match.length;
    return match;
  });
  if (last < text.length) out.push(text.slice(last));
  return out;
};

// Block-level renderer: paragraphs, bullet lists (`- ` or `* `), and
// numbered lists (`1. `). Keeps things lightweight — no react-markdown dep.
const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (!listType) return;
    const ListTag = listType;
    blocks.push(
      <ListTag
        key={`list-${key++}`}
        className={
          listType === 'ul'
            ? 'list-disc pl-5 my-1 space-y-0.5'
            : 'list-decimal pl-5 my-1 space-y-0.5'
        }
      >
        {listItems}
      </ListTag>
    );
    listType = null;
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);

    if (bullet) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(<li key={`li-${key++}`}>{renderInline(bullet[1])}</li>);
    } else if (numbered) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(<li key={`li-${key++}`}>{renderInline(numbered[1])}</li>);
    } else if (line.trim() === '') {
      flushList();
      // blank line — preserve paragraph break
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
    } else {
      flushList();
      blocks.push(<div key={`p-${key++}`}>{renderInline(line)}</div>);
    }
  }
  flushList();
  return blocks;
};

const loadHistory = (): ChatMessage[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore
  }
  return [WELCOME_MESSAGE];
};

const ChatbotPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Server-side session id (mirrors ZipsureAI). Kept in sessionStorage so
  // a page refresh keeps the same backend conversation while it's still
  // warm in the function's _session_cache.
  const [sessionId, setSessionId] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_KEY)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazily fetch a session_id on first open. Same pattern as ZipsureAI's
  // GET /python_api/chatbot.
  useEffect(() => {
    if (!isOpen || sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${CHATBOT_API_URL}/chatbot`);
        if (!r.ok) return;
        const data = await r.json();
        if (cancelled || !data.session_id) return;
        sessionStorage.setItem(SESSION_KEY, data.session_id);
        setSessionId(data.session_id);
      } catch {
        // Fine — /ask will create one on its own if absent.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, sessionId]);

  // Persist to sessionStorage on every message change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // sessionStorage may be unavailable (private mode); fail silently
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      content: trimmed,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // POST /python_api/ask  { question, session_id? }
      const response = await fetch(`${CHATBOT_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // Server owns the conversation memory; persist its session_id so
      // subsequent /ask calls land on the same backend history.
      if (data.session_id && data.session_id !== sessionId) {
        sessionStorage.setItem(SESSION_KEY, data.session_id);
        setSessionId(data.session_id);
      }
      const botContent = data.response || "Sorry, I didn't get that.";

      setMessages((prev) => [
        ...prev,
        {
          content: botContent,
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => [
        ...prev,
        {
          content:
            'Sorry, there was an error processing your message. Please try again.',
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const BotAvatar = () => (
    <div className="relative w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-600" aria-hidden="true">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
    </div>
  );

  return (
    <>
      {/* Floating chat toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        style={{
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
          marginRight: 'env(safe-area-inset-right, 0px)',
        }}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
      >
        {isOpen ? (
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 sm:w-7 sm:h-7 stroke-white"
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 sm:w-7 sm:h-7 stroke-white"
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
              AI
            </span>
          </>
        )}
      </button>

      {/* Chat popup window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300
                     ${
                       isExpanded
                         ? 'inset-4 sm:inset-8 md:inset-12'
                         : 'bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[75vh] sm:h-[580px] max-h-[640px]'
                     }`}
          style={{
            marginBottom: isExpanded ? undefined : 'env(safe-area-inset-bottom, 0px)',
            marginRight: isExpanded ? undefined : 'env(safe-area-inset-right, 0px)',
          }}
          role="dialog"
          aria-label="EVChamp Assistant"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-3 flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">EVChamp AI</p>
              <p className="text-xs text-white/80 leading-tight">EV Platform Assistant</p>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 stroke-white"
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              aria-label={isExpanded ? 'Shrink chat' : 'Expand chat'}
            >
              {isExpanded ? (
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 stroke-white"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 stroke-white"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              aria-label="Close chat"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-white"
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isUser && <BotAvatar />}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    msg.isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  <div className="break-words leading-relaxed text-sm">
                    {renderMarkdown(msg.content)}
                  </div>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.isUser ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <BotAvatar />
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 bg-white px-3 py-2.5 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about EVChamp..."
              disabled={isLoading}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
              aria-label="Send message"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>

          {/* Footer */}
          <div className="bg-white border-t border-gray-100 py-1.5 text-center">
            <p className="text-[10px] text-gray-400">
              Powered by <span className="font-semibold text-blue-600">EVChamp AI</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotPopup;
