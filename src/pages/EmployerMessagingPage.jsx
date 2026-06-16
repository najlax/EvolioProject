import { useState } from "react";
import {
  Sidebar,
  employerLinks,
  Card,
  Button,
  Modal,
  Textarea,
} from "../components/Components.jsx";
import { messages as initialMessages, outreachTemplates } from "../data.js";

// Employer Messaging Page - a simple mock chat with outreach templates.
export default function EmployerMessagingPage() {
  // Keep the conversation in state so we can add new messages
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Send a new message (mock - just adds it to the list)
  function sendMessage() {
    if (!newMessage) return;
    const msg = {
      id: "m" + (messages.length + 1),
      from: "employer",
      name: "You",
      text: newMessage,
      time: "Now",
    };
    setMessages([...messages, msg]);
    setNewMessage("");
    setModalOpen(false);
  }

  // Use a template by putting it into the message box
  function useTemplate(text) {
    setNewMessage(text);
    setModalOpen(true);
  }

  return (
    <div className="page-shell">
      <Sidebar title="Employer" links={employerLinks} />

      <main className="page-main">
        <div className="page-header-row">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <Button onClick={() => setModalOpen(true)}>New Message</Button>
        </div>

        <div className="content-grid-3">
          {/* Conversation history (2 columns) */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="card-title mb-4">Conversation with Aisha Khan</h3>
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    // Employer messages on the right, student on the left
                    className={`flex ${m.from === "employer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg p-3 text-sm ${
                        m.from === "employer"
                          ? "bg-[#001776] text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className="mt-1 text-xs opacity-70">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Outreach templates */}
          <div>
            <Card>
              <h3 className="card-title">Outreach Templates</h3>
              <div className="space-y-2">
                {outreachTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => useTemplate(template)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-left text-sm text-gray-600 hover:bg-[#F0F4FF]"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* New message modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Send a Message">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <Button onClick={sendMessage}>Send Message</Button>
      </Modal>
    </div>
  );
}
