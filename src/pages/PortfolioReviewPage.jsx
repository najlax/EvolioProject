import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Sidebar,
  coachLinks,
  Card,
  Button,
  Badge,
  Textarea,
  ErrorState,
} from "../components/Components.jsx";
import { students, reviews } from "../data.js";

// Portfolio Review Page - the coach reviews one student's portfolio.
export default function PortfolioReviewPage() {
  const { studentId } = useParams();

  // Find the student being reviewed
  const student = students.find((s) => s.id === studentId);

  // Checklist items the coach can tick off
  const [checklist, setChecklist] = useState({
    profile: true,
    resume: true,
    projects: false,
    links: false,
  });

  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("Needs Revision");
  const [message, setMessage] = useState("");

  // Past feedback for this student (timeline)
  const timeline = student ? reviews.filter((r) => r.studentId === student.id) : [];

  // Show error if the student id is invalid
  if (!student) {
    return (
      <div className="page-shell">
        <Sidebar title="Career Coach" links={coachLinks} />
        <main className="page-main">
          <ErrorState message="Student not found." />
        </main>
      </div>
    );
  }

  // Toggle one checklist item
  function toggleCheck(key) {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  }

  function saveReview() {
    setMessage("Review saved and status updated!");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="page-shell">
      <Sidebar title="Career Coach" links={coachLinks} />

      <main className="page-main">
        <h1 className="page-header mb-1">Review: {student.name}</h1>
        <p className="mb-6 text-sm text-gray-500">{student.headline}</p>

        {message && <p className="alert-success">{message}</p>}

        <div className="content-grid">
          {/* Checklist + AI readiness */}
          <Card>
            <h3 className="card-title">Review Checklist</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={checklist.profile} onChange={() => toggleCheck("profile")} />
                Profile is complete
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={checklist.resume} onChange={() => toggleCheck("resume")} />
                Resume is uploaded
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={checklist.projects} onChange={() => toggleCheck("projects")} />
                Projects have demos
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={checklist.links} onChange={() => toggleCheck("links")} />
                All links work
              </label>
            </div>
          </Card>

          {/* Feedback form + status buttons */}
          <Card>
            <h3 className="card-title">Feedback</h3>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write feedback for the student..."
            />

            {/* Update review status */}
            <p className="mb-2 text-sm font-medium text-gray-700">Set Status:</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Draft", "Needs Revision", "Ready", "Published"].map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "primary" : "outline"}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            <Button variant="teal" onClick={saveReview}>
              Save Review
            </Button>
          </Card>
        </div>

        {/* Feedback timeline */}
        <Card className="mt-6">
          <h3 className="card-title mb-4">Feedback Timeline</h3>
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="flex items-center gap-2">
                  <Badge text={item.status} color="blue" />
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
                <p className="text-sm text-gray-500">{item.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
