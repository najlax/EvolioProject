import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  studentLinks,
  Card,
  Button,
  Badge,
  Input,
  Modal,
  EmptyState,
  LoadingState,
} from "../components/Components.jsx";
import { getProjects, deleteProject as apiDeleteProject } from "../services/api.js";
import { aiFeedback } from "../data.js";

// Projects List Page - shows the student's projects with search/filter
// plus add/edit/delete and a fake "Enhance with AI" feedback modal.
export default function ProjectsListPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All"); // All / Published / Draft

  // AI modal state (mock)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Load this student's projects from the backend on mount.
  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data || []))
      .catch((err) => setError(err.message || "Could not load your projects."))
      .finally(() => setLoading(false));
  }, []);

  async function deleteProject(id) {
    try {
      await apiDeleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || "Could not delete that project.");
    }
  }

  function openAIFeedback() {
    setAiOpen(true);
    setAiLoading(true);
    setTimeout(() => setAiLoading(false), 1500);
  }

  // Filter projects by search text AND status (client-side).
  const visibleProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <div className="page-header-row">
          <h1 className="text-2xl font-bold text-gray-800">My Projects</h1>
          <Link to="/student/projects/new">
            <Button>+ Add Project</Button>
          </Link>
        </div>

        {/* Search + filter controls */}
        <div className="filter-bar">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option>All</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {error && <p className="alert-error">{error}</p>}

        {loading ? (
          <LoadingState message="Loading your projects..." />
        ) : visibleProjects.length === 0 ? (
          <EmptyState message="No projects found. Try adding one!" />
        ) : (
          <>
            {visibleProjects.some((p) => p.featured) && (
              <p className="mb-3 text-sm text-gray-500">
                ⭐ Featured projects show on your portfolio.
              </p>
            )}
            <div className="card-grid">
              {visibleProjects.map((project) => (
                <Card key={project.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{project.title}</h3>
                    {project.featured && <Badge text="Featured" color="teal" />}
                  </div>
                  <p className="mb-3 text-sm text-gray-500">{project.summary}</p>

                  {/* Tech stack tags */}
                  <div className="mb-3 flex flex-wrap gap-1">
                    {project.tech_stack.map((tech) => (
                      <Badge key={tech} text={tech} color="gray" />
                    ))}
                  </div>

                  <Badge
                    text={project.status}
                    color={project.status === "Published" ? "green" : "yellow"}
                  />

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/student/projects/${project.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => deleteProject(project.id)}>
                      Delete
                    </Button>
                    <Button variant="teal" onClick={openAIFeedback}>
                      Enhance with AI
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* AI feedback modal (fake AI) */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="AI Project Feedback">
        {aiLoading ? (
          <LoadingState message="AI is reviewing your project..." />
        ) : (
          <div>
            <p className="mb-4 text-sm text-gray-700">{aiFeedback.projectFeedback}</p>
            <Button onClick={() => setAiOpen(false)}>Got it</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
