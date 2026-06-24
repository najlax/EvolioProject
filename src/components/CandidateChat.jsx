import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

// Default suggested questions shown at the top of a fresh conversation.
const DEFAULT_SUGGESTIONS = [
  "What is their strongest technical skill?",
  "Tell me about their main project.",
  "What technologies have they used?",
  "Summarize their experience.",
  "What are their key strengths?",
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// A modern, conversational chat panel ("Ask About This Candidate").
// Reusable: the parent supplies `onSend(question, history) => Promise<answer>`,
// so this component only owns the chat UI/UX (history, bubbles, suggestions,
// loading, scrolling, animations).
export default function CandidateChat({
  open,
  onClose,
  candidateName = "this candidate",
  suggestions = DEFAULT_SUGGESTIONS,
  onSend,
}) {
  const welcome = {
    role: "bot",
    text: `Hi! I'm Evolio's AI assistant. I can answer questions about ${candidateName}'s skills, projects, experience and background based on their verified portfolio data. What would you like to know?`,
    time: now(),
  };

  const [messages, setMessages] = useState([welcome]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  if (!open) return null;

  async function send(text) {
    const q = (text || "").trim();
    if (!q || loading) return;

    setError("");
    // History (exclude the welcome message) for follow-up context.
    const history = messages
      .filter((m, i) => !(i === 0 && m.role === "bot"))
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: q, time: now() }]);
    setQuestion("");
    setLoading(true);
    try {
      const answer = await onSend(q, history);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: answer || "No answer returned.", time: now() },
      ]);
    } catch (err) {
      setError(err.message || "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <div
      className="chat-pop fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-96 sm:rounded-2xl"
      role="dialog"
      aria-label="Ask about this candidate"
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">Ask About This Candidate</h2>
          <p className="truncate text-xs text-white/80">
            Powered by Evolio AI · {candidateName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-white/80 hover:bg-white/15 hover:text-white"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Suggested questions */}
      {showSuggestions && (
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Suggested questions
          </p>
          <div className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-[#7c3aed] hover:bg-[#f5f3ff]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-msg-in flex items-end gap-2 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "bot" && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-[#7c3aed]">
                <Bot className="h-4 w-4" />
              </span>
            )}
            <div className={m.role === "user" ? "text-right" : "text-left"}>
              <span
                className={
                  "inline-block max-w-[15rem] rounded-2xl px-3 py-2 text-sm sm:max-w-[16rem] " +
                  (m.role === "user"
                    ? "rounded-br-sm bg-[#001776] text-white"
                    : "rounded-bl-sm bg-gray-100 text-gray-700")
                }
              >
                {m.text}
              </span>
              {m.time && (
                <p className="mt-1 px-1 text-[10px] text-gray-400">{m.time}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg-in flex items-end gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-[#7c3aed]">
              <Bot className="h-4 w-4" />
            </span>
            <span className="inline-block rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-400">
              Assistant is typing…
            </span>
          </div>
        )}
      </div>

      {error && <p className="px-4 text-sm text-red-600">{error}</p>}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
        className="flex items-center gap-2 border-t border-gray-100 px-3 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about skills, projects, experience..."
          className="form-input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white transition hover:bg-[#6d28d9] disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <p className="pb-3 text-center text-xs text-gray-400">
        Answers are based on verified portfolio data only.
      </p>
    </div>
  );
}
