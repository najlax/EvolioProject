import {
  Sidebar,
  coachLinks,
  Card,
  StatCard,
} from "../components/Components.jsx";
import { students, reviews } from "../data.js";

// Student Progress Page - the coach tracks student completion + history.
export default function StudentProgressPage() {
  return (
    <div className="page-shell">
      <Sidebar title="Career Coach" links={coachLinks} />

      <main className="page-main">
        <h1 className="page-header">Student Progress</h1>

        {/* Completion metrics for each student */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id}>
              <p className="font-medium text-gray-800">{student.name}</p>
              <p className="mb-2 text-xs text-gray-500">{student.headline}</p>

              {/* Progress bar for completion */}
              <p className="text-sm text-gray-500">Completion: {student.profileCompletion}%</p>
              <div className="progress-track mt-1">
                <div
                  className="progress-fill"
                  style={{ width: student.profileCompletion + "%" }}
                ></div>
              </div>
            </Card>
          ))}
        </div>

        {/* Progress trend numbers */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Avg Completion" value="62%" />
          <StatCard label="Reviews This Month" value={reviews.length} accent="teal" />
          <StatCard label="Improving Students" value={2} />
        </div>
      </main>
    </div>
  );
}
