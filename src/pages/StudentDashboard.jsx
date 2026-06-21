import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  studentLinks,
  StatCard,
  Card,
  Button,
  Badge,
  LoadingState,
} from "../components/Components.jsx";
import {
  getProfile,
  getProjects,
  getResume,
  getReviewStatus,
} from "../services/api.js";

// Work out a rough profile completion percentage from the filled-in fields.
function profileCompletion(profile) {
  if (!profile) return 0;
  const checks = [
    profile.name,
    profile.headline,
    profile.bio,
    profile.location,
    (profile.skills || []).length > 0,
    profile.github || profile.linkedin,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// Student Dashboard - overview of the student's progress and stats.
export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("Draft");

  useEffect(() => {
    Promise.all([
      getProfile(),
      getProjects(),
      getResume().then(() => true).catch(() => false),
      getReviewStatus(),
    ])
      .then(([p, projs, resumeExists, review]) => {
        setProfile(p);
        setProjects(projs || []);
        setHasResume(resumeExists);
        setReviewStatus(review.status);
      })
      .catch((err) => setError(err.message || "Could not load your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const completion = profileCompletion(profile);
  const publishedCount = projects.filter((p) => p.status === "Published").length;
  const draftCount = projects.filter((p) => p.status !== "Published").length;

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <h1 className="page-header">Dashboard</h1>

        {error && <p className="alert-error">{error}</p>}

        {loading ? (
          <LoadingState message="Loading your dashboard..." />
        ) : (
          <>
            {/* Status row */}
            <div className="stats-grid-3">
              <Card>
                <p className="text-sm text-gray-500">Profile Completion</p>
                <p className="mt-1 text-2xl font-bold text-[#001776]">{completion}%</p>
                <div className="progress-track mt-2">
                  <div className="progress-fill" style={{ width: completion + "%" }}></div>
                </div>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Resume Status</p>
                <div className="mt-2">
                  <Badge
                    text={hasResume ? "Uploaded" : "Missing"}
                    color={hasResume ? "green" : "yellow"}
                  />
                </div>
              </Card>
              <Card>
                <p className="text-sm text-gray-500">Review Status</p>
                <div className="mt-2">
                  <Badge text={reviewStatus} color="yellow" />
                </div>
              </Card>
            </div>

            {/* Numbers grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Projects" value={projects.length} />
              <StatCard label="Published" value={publishedCount} accent="teal" />
              <StatCard label="Drafts" value={draftCount} />
            </div>

            {/* Quick links */}
            <div className="mb-6 flex flex-wrap gap-3">
              <Link to="/student/profile">
                <Button>Edit Profile</Button>
              </Link>
              <Link to="/student/projects">
                <Button variant="outline">Manage Projects</Button>
              </Link>
              <Link to="/student/portfolio">
                <Button variant="teal">Preview Portfolio</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
