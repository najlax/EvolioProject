import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  employerLinks,
  Card,
  Button,
  Badge,
  Input,
  EmptyState,
  LoadingState,
} from "../components/Components.jsx";
import { searchStudents, searchProjects } from "../services/api.js";

// Keyword search over students and projects (database search, no AI).
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("students"); // "students" | "projects"
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const [stu, proj] = await Promise.all([
        searchStudents(q),
        searchProjects(q),
      ]);
      setStudents(stu || []);
      setProjects(proj || []);
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const results = tab === "students" ? students : projects;

  return (
    <div className="page-shell">
      <Sidebar title="Employer" links={employerLinks} />

      <main className="page-main">
        <h1 className="page-header">Search</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="filter-bar">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, projects, skills..."
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={tab === "students" ? "primary" : "outline"}
            onClick={() => setTab("students")}
          >
            Students ({students.length})
          </Button>
          <Button
            variant={tab === "projects" ? "primary" : "outline"}
            onClick={() => setTab("projects")}
          >
            Projects ({projects.length})
          </Button>
        </div>

        {error && <p className="alert-error">{error}</p>}

        {loading ? (
          <LoadingState message="Searching..." />
        ) : !searched ? (
          <EmptyState message="Type a keyword above to search students and projects." />
        ) : results.length === 0 ? (
          <EmptyState message="No results found. Try a different keyword." />
        ) : tab === "students" ? (
          <div className="card-grid">
            {students.map((s) => (
              <Card key={s.id}>
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                {s.headline && (
                  <p className="mb-2 text-sm text-gray-500">{s.headline}</p>
                )}
                {s.skills.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {s.skills.slice(0, 8).map((skill) => (
                      <Badge key={skill} text={skill} color="blue" />
                    ))}
                  </div>
                )}
                {s.share_token ? (
                  <Link to={`/portfolio/${s.share_token}`}>
                    <Button variant="outline">View Portfolio</Button>
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400">No public portfolio yet.</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="card-grid">
            {projects.map((p) => (
              <Card key={p.id}>
                <h3 className="font-semibold text-gray-800">{p.title}</h3>
                <p className="mb-1 text-xs text-gray-400">by {p.owner_name}</p>
                {p.summary && (
                  <p className="mb-2 text-sm text-gray-500">{p.summary}</p>
                )}
                {p.tech_stack.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {p.tech_stack.map((tech) => (
                      <Badge key={tech} text={tech} color="gray" />
                    ))}
                  </div>
                )}
                {p.share_token && (
                  <Link to={`/portfolio/${p.share_token}`}>
                    <Button variant="outline">View Portfolio</Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
