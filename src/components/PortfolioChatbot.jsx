import { useState } from "react";
import { Card, Button } from "./Components.jsx";
import { askPortfolioChatbot } from "../services/api.js";
import { Bot, Send } from "lucide-react";

// AI chatbot that answers employer questions using ONLY the student's data.
// `studentId` is the student's user id (from the public portfolio data).
export default function PortfolioChatbot({ studentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]); // {role: "user"|"bot", text}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setError("");
    // Send the conversation so far so the bot can follow up in context.
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
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

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-[#001776]" />
        <h2 className="card-title mb-0">Ask about this candidate</h2>
      </div>
      <p className="mb-3 text-sm text-gray-500">
        Ask about this student's skills, projects, experience or technologies.
        Answers come only from their portfolio.
      </p>

      {/* Conversation */}
      {messages.length > 0 && (
        <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <span
                className={
                  "inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm " +
                  (m.role === "user"
                    ? "bg-[#001776] text-white"
                    : "bg-gray-100 text-gray-700")
                }
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="mb-2 text-sm text-gray-400">Assistant is typing…</p>
      )}
      {error && <p className="alert-error">{error}</p>}

      <form onSubmit={handleAsk} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What technologies has this student used?"
          className="form-input flex-1"
        />
        <Button type="submit">
          <span className="flex items-center gap-1">
            <Send className="h-4 w-4" /> Ask
          </span>
        </Button>
      </form>
    </Card>
  );
}
