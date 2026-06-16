import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  coachLinks,
  Card,
  Button,
  Badge,
  StatCard,
} from "../components/Components.jsx";
import { students, reviews } from "../data.js";

// Career Coach Dashboard - review queue + workload summary.
export default function CoachDashboard() {
  const navigate = useNavigate();

  // Students waiting in the review queue (mock - just use all students)
  const reviewQueue = students;

  // Count reviews by status for the analytics row
  const needsRevision = reviews.filter((r) => r.status === "Needs Revision").length;
  const ready = reviews.filter((r) => r.status === "Ready").length;

  return (
    <div className="page-shell">
      <Sidebar title="Career Coach" links={coachLinks} />

      <main className="page-main">
        <h1 className="page-header">Coach Dashboard</h1>

        {/* Workload summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <StatCard label="In Queue" value={reviewQueue.length} />
          <StatCard label="Needs Revision" value={needsRevision} accent="teal" />
          <StatCard label="Ready" value={ready} />
          <StatCard label="Reviews Done" value={47} accent="teal" />
        </div>

        <div className="content-grid">
          {/* Review queue */}
          <Card>
            <h3 className="card-title mb-4">Review Queue</h3>
            <div className="space-y-3">
              {reviewQueue.map((student) => (
                <div key={student.id} className="list-row">
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.headline}</p>
                  </div>
                  <Button onClick={() => navigate(`/coach/review/${student.id}`)}>Review</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent feedback activity */}
          <Card>
            <h3 className="card-title mb-4">Recent Feedback Activity</h3>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="timeline-item border-[#199DB2]/30">
                  <div className="flex items-center gap-2">
                    <Badge text={r.status} color="teal" />
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <p className="text-sm text-gray-500">{r.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
