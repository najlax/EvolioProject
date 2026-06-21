import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Navbar,
  Card,
  Badge,
  LoadingState,
  ErrorState,
} from "../components/Components.jsx";
import { API_ORIGIN, getPublicPortfolio } from "../services/api.js";
import { Github, ExternalLink } from "lucide-react";

// Public, no-login view of a student's portfolio, opened via a share token.
export default function PublicPortfolioPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicPortfolio(token)
      .then(setData)
      .catch((err) => setError(err.message || "This portfolio link is not available."))
      .finally(() => setLoading(false));
  }, [token]);

  const profile = data?.profile;
  const projects = data?.projects || [];

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <LoadingState message="Loading portfolio..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="space-y-6">
            <Card>
              <h1 className="text-2xl font-bold text-gray-800">
                {profile?.name || "Student Portfolio"}
              </h1>
              {profile?.headline && (
                <p className="text-sm text-gray-500">{profile.headline}</p>
              )}
              {profile?.availability && (
                <div className="mt-2">
                  <Badge text={profile.availability} color="green" />
                </div>
              )}
              {profile?.bio && <p className="mt-4 text-sm text-gray-600">{profile.bio}</p>}

              {(profile?.skills || []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} text={skill} color="blue" />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="card-title">Projects</h2>
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500">No projects to show yet.</p>
              ) : (
                <div className="space-y-4">
                  {projects.map((p) => (
                    <div key={p.id} className="project-item">
                      {/* Project screenshots, if any were uploaded */}
                      {p.images && p.images.length > 0 && (
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
                      )}
                      <h3 className="font-medium text-gray-800">{p.title}</h3>
                      <p className="text-sm text-gray-500">{p.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.tech_stack || []).map((tech) => (
                          <Badge key={tech} text={tech} color="gray" />
                        ))}
                      </div>
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
        )}
      </div>
    </div>
  );
}
