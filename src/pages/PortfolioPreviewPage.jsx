import { useEffect, useState } from "react";
import {
  Sidebar,
  studentLinks,
  Card,
  Button,
  Badge,
  Input,
  Modal,
  AIBox,
  LoadingState,
} from "../components/Components.jsx";
import {
  API_ORIGIN,
  getProfile,
  getProjects,
  getResume,
  generateShareLink,
  updateShareSettings,
} from "../services/api.js";
import { aiFeedback } from "../data.js";
import { Github, ExternalLink, Bot } from "lucide-react";

// Portfolio Preview Page - shows how the student's public portfolio looks.
export default function PortfolioPreviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [resume, setResume] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Bot modal (mock)
  const [botOpen, setBotOpen] = useState(false);
  const [botLoading, setBotLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getProfile(),
      getProjects(),
      getResume().catch(() => null),
      generateShareLink().catch(() => null),
    ])
      .then(([p, projs, res, share]) => {
        setProfile(p);
        setProjects(projs || []);
        setResume(res);
        if (share) {
          setShareUrl(share.url);
          setIsPublic((share.visibility || "public") === "public");
        }
      })
      .catch((err) => setError(err.message || "Could not load your portfolio."))
      .finally(() => setLoading(false));
  }, []);

  async function togglePublic(checked) {
    setIsPublic(checked);
    try {
      await updateShareSettings({ visibility: checked ? "public" : "private" });
    } catch (err) {
      setError(err.message || "Could not update sharing settings.");
    }
  }

  function askBot() {
    setBotOpen(true);
    setBotLoading(true);
    setTimeout(() => setBotLoading(false), 1500);
  }

  if (loading) {
    return (
      <div className="page-shell">
        <Sidebar title="Student" links={studentLinks} />
        <main className="page-main">
          <h1 className="page-header">Portfolio Preview</h1>
          <LoadingState message="Loading your portfolio..." />
        </main>
      </div>
    );
  }

  const featured = projects.filter((p) => p.featured);
  const publishedCount = projects.filter((p) => p.status === "Published").length;

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <h1 className="page-header">Portfolio Preview</h1>
        {error && <p className="alert-error">{error}</p>}

        <div className="content-grid-3">
          {/* Left: profile + projects (2 columns) */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="flex items-center gap-4">
                <div className="avatar bg-[#001776]">
                  {(profile.name || "?").charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
                  <p className="text-sm text-gray-500">{profile.headline}</p>
                  <div className="mt-1">
                    <Badge text={profile.availability} color="green" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{profile.bio}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {resume ? (
                  <a href={`${API_ORIGIN}${resume.url}`} target="_blank" rel="noreferrer">
                    <Button>Download Resume</Button>
                  </a>
                ) : (
                  <Button>Download Resume</Button>
                )}
              </div>
            </Card>

            {/* Skills */}
            <Card>
              <h3 className="card-title">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).map((skill) => (
                  <Badge key={skill} text={skill} color="blue" />
                ))}
              </div>
            </Card>

            {/* Featured projects */}
            <Card>
              <h3 className="card-title">Featured Projects</h3>
              {featured.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No featured projects yet. Mark a project as featured to show it here.
                </p>
              ) : (
                <div className="space-y-4">
                  {featured.map((p) => (
                    <div key={p.id} className="project-item">
                      <h4 className="font-medium text-gray-800">{p.title}</h4>
                      <p className="text-sm text-gray-500">{p.summary}</p>

                      {p.collaborators.length > 0 && (
                        <p className="mt-1 text-xs text-gray-400">
                          With: {p.collaborators.join(", ")}
                        </p>
                      )}

                      <div className="mt-2 flex gap-3 text-sm">
                        {p.github_link && (
                          <a href={p.github_link} className="flex items-center gap-1 text-[#001776]">
                            <Github className="h-4 w-4" /> Code
                          </a>
                        )}
                        {p.demo_link && (
                          <a href={p.demo_link} className="flex items-center gap-1 text-[#199DB2]">
                            <ExternalLink className="h-4 w-4" /> Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: stats, share settings, AI, bot */}
          <div className="space-y-6">
            <Card>
              <p className="text-sm text-gray-500">Published Projects</p>
              <p className="mt-1 text-2xl font-bold text-[#001776]">{publishedCount}</p>
            </Card>

            {/* Shareable link settings */}
            <Card>
              <h3 className="card-title">Shareable Link</h3>
              <Input value={shareUrl} onChange={() => {}} />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => togglePublic(e.target.checked)}
                />
                Make portfolio public
              </label>
            </Card>

            {/* AI portfolio score (mock) */}
            <AIBox
              title="AI Portfolio Score"
              buttonLabel="Score My Portfolio"
              result={`Score: ${aiFeedback.portfolioScore}/100. ${aiFeedback.portfolioScoreText}`}
            />

            {/* Ask About This Candidate bot (mock) */}
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#001776]" />
                <h3 className="font-semibold text-gray-800">Ask About This Candidate</h3>
              </div>
              <p className="mb-3 text-sm text-gray-500">
                Employers can ask the AI bot questions about this candidate.
              </p>
              <Button onClick={askBot}>Ask the Bot</Button>
            </Card>
          </div>
        </div>
      </main>

      {/* Bot modal (fake AI) */}
      <Modal open={botOpen} onClose={() => setBotOpen(false)} title="Candidate Bot">
        {botLoading ? (
          <LoadingState message="Bot is thinking..." />
        ) : (
          <div>
            <p className="mb-4 text-sm text-gray-700">{aiFeedback.candidateBotAnswer}</p>
            <Button onClick={() => setBotOpen(false)}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
