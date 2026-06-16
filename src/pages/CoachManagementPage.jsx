import {
  Sidebar,
  adminLinks,
  Card,
  Button,
  Badge,
  StatCard,
} from "../components/Components.jsx";
import { coaches } from "../data.js";

// Career Coach Management Page - admin views coaches and their performance.
export default function CoachManagementPage() {
  // Add up totals for the summary cards
  const totalStudents = coaches.reduce((sum, c) => sum + c.assignedStudents, 0);
  const totalReviews = coaches.reduce((sum, c) => sum + c.reviewsCompleted, 0);

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">Coach Management</h1>

        {/* Performance summary */}
        <div className="stats-grid-3">
          <StatCard label="Total Coaches" value={coaches.length} />
          <StatCard label="Students Assigned" value={totalStudents} accent="teal" />
          <StatCard label="Reviews Completed" value={totalReviews} />
        </div>

        {/* Coach directory */}
        <Card>
          <h3 className="card-title mb-4">Coach Directory</h3>
          <div className="space-y-3">
            {coaches.map((coach) => (
              <div key={coach.id} className="list-row-responsive">
                <div>
                  <p className="font-medium text-gray-800">{coach.name}</p>
                  <p className="text-xs text-gray-500">{coach.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge text={`${coach.assignedStudents} students`} color="blue" />
                  <Badge text={`${coach.reviewsCompleted} reviews`} color="teal" />
                  <Badge text={`★ ${coach.rating}`} color="yellow" />
                  {/* Assignment management (mock) */}
                  <Button variant="outline">Assign Students</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
