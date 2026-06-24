import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Sidebar,
  employerLinks,
  Card,
  Button,
  Badge,
  Textarea,
  ErrorState,
} from "../components/Components.jsx";
import CandidateChat from "../components/CandidateChat.jsx";
import { students, projects, resumes } from "../data.js";
import { chatWithCandidate } from "../services/api.js";
import { Github, ExternalLink, Bot, FileText, Sparkles } from "lucide-react";

// Portfolio Viewer Page - how an employer sees a student's full portfolio.
export default function PortfolioViewerPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  // Find the student from the URL id
  const student = students.find((s) => s.id === studentId);
  const studentProjects = student ? projects.filter((p) => p.studentId === student.id) : [];
  const resume = student ? resumes.find((r) => r.studentId === student.id) : null;

  // Local state for feedback box + save + AI chat
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // If the student id is wrong, show an error state
  if (!student) {
    return (
      <div className="page-shell">
        <Sidebar title="Employer" links={employerLinks} />
        <main className="page-main">
          <ErrorState message="Sorry, we could not find this candidate." />
        </main>
      </div>
    );
  }

  function sendFeedback() {
    setFeedbackSent(true);
    setFeedback("");
    setTimeout(() => setFeedbackSent(false), 2000);
  }

  // Build a portfolio context string from the candidate's data so the AI can
  // answer strictly from it (profile, skills, projects, AI summary).
  const candidateContext = [
    `Name: ${student.name}`,
    `Headline: ${student.headline || "N/A"}`,
    `Location: ${student.location || "N/A"}`,
    `Availability: ${student.availability || "N/A"}`,
    `Bio: ${student.bio || "N/A"}`,
    `Skills: ${(student.skills || []).join(", ") || "N/A"}`,
    `AI Summary: ${student.summary || "N/A"}`,
    "Projects:",
    ...(studentProjects.length
      ? studentProjects.map(
          (p) =>
            `- ${p.title}: ${p.summary || p.description || ""}` +
            ((p.techStack || []).length
              ? ` (Tech: ${p.techStack.join(", ")})`
              : "") +
            (p.role ? ` [Role: ${p.role}]` : "")
        )
      : ["None"]),
  ].join("\n");

  // Send a chat question to the backend (answers only from the context above).
  async function handleChatSend(question, history) {
    const res = await chatWithCandidate(candidateContext, question, history);
    return res?.answer || "";
  }

  return (
    <div className="page-shell">
      <Sidebar title="Employer" links={employerLinks} />

      <main className="page-main">
        <h1 className="page-header">Candidate Portfolio</h1>

        <div className="content-grid-3">
          {/* Left: profile, resume, projects */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile */}
            <Card>
              <div className="flex items-center gap-4">
                <div className={`avatar ${student.avatarColor}`}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
                  <p className="text-sm text-gray-500">{student.headline}</p>
                  <Badge text={student.availability} color="green" />

                  {/* GitHub + resume links shown right under the name */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    {student.github && (
                      <a
                        href={student.github}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#001776] hover:underline"
                      >
                        <Github className="h-4 w-4" /> GitHub
                      </a>
                    )}
                    {resume && (
                      <a
                        href={`/${resume.fileName}`}
                        target="_blank"
                        rel="noreferrer"
                        title={resume.fileName}
                        className="flex items-center gap-1 text-[#199DB2] hover:underline"
                      >
                        <FileText className="h-4 w-4" /> Resume
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{student.bio}</p>
            </Card>

            {/* AI Portfolio Summary - same summary shown on the dashboard cards.
                Visible to anyone who opens this portfolio. */}
            <Card className="border-violet-100 bg-violet-50/60">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  <h3 className="card-title mb-0 text-violet-800">AI Portfolio Summary</h3>
                </div>
                <span className="text-xs text-violet-400">
                  Generated by Evolio AI · Based on verified portfolio data
                </span>
              </div>

              {student.summary ? (
                <p className="text-sm leading-relaxed text-gray-700">{student.summary}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  No AI summary is available for this candidate yet.
                </p>
              )}

              <div className="mt-4 border-t border-violet-100 pt-3">
                <p className="flex items-center gap-2 text-sm text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  Use the “Ask About This Candidate” panel to ask specific questions.
                </p>
              </div>
            </Card>

            {/* Projects with evaluation note */}
            <Card>
              <h3 className="card-title">Projects</h3>
              <div className="space-y-4">
                {studentProjects.map((p) => (
                  <div key={p.id} className="project-item">
                    {/* Screenshot above the title, spanning the full item width */}
                    {p.screenshots?.[0] && (
                      <img
                        src={p.screenshots[0]}
                        alt={`${p.title} screenshot`}
                        className="-mx-4 -mt-4 mb-4 h-44 w-[calc(100%+2rem)] max-w-none rounded-t-lg object-cover"
                        loading="lazy"
                      />
                    )}
                    <h4 className="font-medium text-gray-800">{p.title}</h4>
                    <p className="text-sm text-gray-500">{p.summary}</p>

                    {/* Collaborator links */}
                    {p.collaborators.length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        Collaborators: {p.collaborators.join(", ")}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <Button
                        onClick={() =>
                          navigate(`/employer/portfolio/${student.id}/project/${p.id}`)
                        }
                      >
                        View Details
                      </Button>
                      {p.github && (
                        <a href={p.github} className="flex items-center gap-1 text-[#001776]">
                          <Github className="h-4 w-4" /> Code
                        </a>
                      )}
                      {p.demo && (
                        <a href={p.demo} className="flex items-center gap-1 text-[#199DB2]">
                          <ExternalLink className="h-4 w-4" /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: actions, feedback, bot */}
          <div className="space-y-6">
            {/* Quick actions */}
            <Card>
              <h3 className="card-title">Actions</h3>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/employer/messages")}>Contact Student</Button>
                <Button variant="teal" onClick={() => setSaved(!saved)}>
                  {saved ? "Saved ✓" : "Save Candidate"}
                </Button>
              </div>
            </Card>

            {/* Leave feedback */}
            <Card>
              <h3 className="card-title">Leave Feedback</h3>
              {feedbackSent && <p className="alert-success mb-2">Feedback sent!</p>}
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your feedback..."
              />
              <Button onClick={sendFeedback}>Send</Button>
            </Card>

            {/* Ask About This Candidate - opens a conversational AI chat */}
            <Card>
              <div className="mb-2 flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#7c3aed]" />
                <h3 className="font-semibold text-gray-800">Ask About This Candidate</h3>
              </div>
              <p className="mb-3 text-sm text-gray-500">
                Chat with the AI assistant about {student.name}'s skills,
                projects and experience.
              </p>
              <Button onClick={() => setChatOpen(true)}>Start Chat</Button>
            </Card>
          </div>
        </div>
      </main>

      {/* Conversational AI chat panel */}
      <CandidateChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        candidateName={student.name}
        onSend={handleChatSend}
      />
    </div>
  );
}
