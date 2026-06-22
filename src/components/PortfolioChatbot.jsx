import { useEffect, useRef, useState } from "react";
import { Card } from "./Components.jsx";
import { askPortfolioChatbot } from "../services/api.js";
import { Bot, Send, Sparkles } from "lucide-react";

// Suggested starter questions (match the mockup).
const SUGGESTIONS = [
  "What's their strongest technical skill?",
  "What databases have they worked with?",
  "Summarize their experience",
  "What technologies have they used?",
];

// AI chatbot that answers employer questions using ONLY the student's data.
// `studentId` is the student's user id; `studentName` is optional for the intro.
export default function PortfolioChatbot({ studentId, studentName }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Hi! I'm Evolio's AI assistant. I can answer questions about ${
        studentName ? `${studentName}'s` : "this student's"
      } skills, projects, experience and background — based only on their verified portfolio data. What would you like to know?`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Smoothly keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const q = (text || "").trim();
    if (!q || loading) return;

    setError("");
    // Conversation so far (exclude the welcome message) for follow-up context.
    const history = messages
      .filter((m, i) => !(i === 0 && m.role === "bot"))
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await askPortfolioChatbot(studentId, q, history);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res?.answer || "No answer returned." },
      ]);
    } catch (err) {
      setError(err.message || "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  // Only show suggestions before the employer has asked anything.
  const showSuggestions = messages.length <= 1;

  return (
    <Card className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#001776] px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Ask About This Candidate</h2>
          <p className="text-xs text-white/70">Powered by Evolio AI</p>
        </div>
      </div>

      {/* Suggested questions */}
      {showSuggestions && (
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Suggested questions
          </p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-[#3199CC] hover:bg-[#F0F4FF]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "bot" && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E1F4F7] text-[#147d8f]">
                <Bot className="h-4 w-4" />
              </span>
            )}
            <span
              className={
                "inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                (m.role === "user"
                  ? "rounded-br-sm bg-[#001776] text-white"
                  : "rounded-bl-sm bg-gray-100 text-gray-700")
              }
            >
              {m.text}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E1F4F7] text-[#147d8f]">
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
        className="flex items-center gap-2 border-t border-gray-100 px-4 py-3"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about skills, projects, experience..."
          className="form-input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#001776] text-white transition hover:bg-[#001456] disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <p className="px-4 pb-3 text-center text-xs text-gray-400">
        Answers are based on verified portfolio data only.
      </p>
    </Card>
  );
}
