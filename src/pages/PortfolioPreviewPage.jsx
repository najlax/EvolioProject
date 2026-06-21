import { useEffect, useState } from "react";
import {
  Sidebar,
  studentLinks,
  Card,
  Button,
  Badge,
  Input,
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
import { Github, ExternalLink } from "lucide-react";

// Portfolio Preview Page - shows how the student's public portfolio looks.
export default function PortfolioPreviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [resume, setResume] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

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
                      {/* Project screenshots (from uploaded project images) */}
                      {p.images && p.images.length > 0 ? (
                        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {p.images.map((img, i) => (
                            <img
                              key={i}
                              src={`${API_ORIGIN}${img}`}
                              alt={`${p.title} screenshot ${i + 1}`}
                              className="h-28 w-full rounded-lg border border-gray-200 object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mb-3 flex h-28 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                          No screenshots added yet
                        </div>
                      )}

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

          {/* Right: stats + share settings */}
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
          </div>
        </div>
      </main>
    </div>
  );
}
