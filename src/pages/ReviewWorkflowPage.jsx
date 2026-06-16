import { useEffect, useState } from "react";
import {
  Sidebar,
  studentLinks,
  Card,
  Button,
  Badge,
  LoadingState,
} from "../components/Components.jsx";
import {
  getReviewStatus,
  getReviewFeedback,
  submitReview,
} from "../services/api.js";

// Review Workflow Page - shows the review status and a feedback timeline.
export default function ReviewWorkflowPage() {
  const statuses = ["Draft", "Needs Revision", "Ready", "Published"];

  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState("Draft");
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load the current review status and feedback from the backend.
  async function loadReview() {
    const data = await getReviewFeedback();
    setCurrentStatus(data.status);
    setFeedback(data.feedback || []);
  }

  useEffect(() => {
    loadReview()
      .catch((err) => setError(err.message || "Could not load review status."))
      .finally(() => setLoading(false));
  }, []);

  function statusColor(status) {
    if (status === "Published") return "green";
    if (status === "Ready") return "teal";
    if (status === "Needs Revision") return "yellow";
    return "gray"; // Draft
  }

  async function submitForReview() {
    setError("");
    try {
      await submitReview();
      await loadReview();
      setMessage("Submitted for review!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setError(err.message || "Could not submit for review.");
    }
  }

  // Publishing has no backend endpoint yet, so this only updates the view.
  function publishPortfolio() {
    setCurrentStatus("Published");
    setMessage("Portfolio published!");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <h1 className="page-header">Review Workflow</h1>

        {message && <p className="alert-success">{message}</p>}
        {error && <p className="alert-error">{error}</p>}

        {loading ? (
          <LoadingState message="Loading review status..." />
        ) : (
          <>
            <Card className="mb-6">
              <h3 className="card-title">Status</h3>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Badge
                    key={status}
                    text={status}
                    color={status === currentStatus ? statusColor(status) : "gray"}
                  />
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={submitForReview}>Submit for Review</Button>
                <Button variant="teal" onClick={publishPortfolio}>
                  Publish Portfolio
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="card-title mb-4">Feedback Timeline</h3>
              {feedback.length === 0 ? (
                <p className="text-sm text-gray-500">No feedback yet.</p>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item, index) => (
                    <div key={index} className="timeline-item pl-4">
                      <div className="flex items-center gap-2">
                        <Badge text={item.status} color={statusColor(item.status)} />
                        <span className="text-xs text-gray-400">{item.date}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-700">{item.reviewer}</p>
                      <p className="text-sm text-gray-500">{item.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
