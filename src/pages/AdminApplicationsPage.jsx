import { useEffect, useState } from "react";
import {
  Sidebar,
  adminLinks,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingState,
} from "../components/Components.jsx";
import {
  getApplications,
  approveApplication,
  rejectApplication,
} from "../services/api.js";

// Admin page to review pending employer & coach applications.
export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    getApplications("pending")
      .then((data) => setApplications(data || []))
      .catch((err) => setError(err.message || "Could not load applications."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    setError("");
    try {
      const res = await approveApplication(id);
      setMessage(res?.message || "Application approved.");
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.message || "Could not approve the application.");
    }
  }

  async function handleReject(id) {
    setError("");
    try {
      await rejectApplication(id);
      setMessage("Application rejected.");
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.message || "Could not reject the application.");
    }
  }

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">Applications</h1>
        <p className="mb-6 text-sm text-gray-500">
          Review pending employer and career coach applications. Approving one
          activates the user's role; rejecting keeps them as a regular student.
        </p>

        {message && <p className="alert-success">{message}</p>}
        {error && <p className="alert-error">{error}</p>}

        {loading ? (
          <LoadingState message="Loading applications..." />
        ) : applications.length === 0 ? (
          <EmptyState message="No pending applications right now." />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-800">
                        {app.user_name || app.user_email}
                      </p>
                      <Badge text={app.requested_role} color="teal" />
                      <Badge text="Pending" color="yellow" />
                    </div>
                    <p className="text-sm text-gray-500">{app.user_email}</p>
                    {app.organization && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {app.requested_role === "employer"
                            ? "Organization: "
                            : "Area of focus: "}
                        </span>
                        {app.organization}
                      </p>
                    )}
                    {app.message && (
                      <p className="text-sm text-gray-500">"{app.message}"</p>
                    )}
                    {app.created_at && (
                      <p className="text-xs text-gray-400">
                        Applied {app.created_at.slice(0, 10)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(app.id)}>Approve</Button>
                    <Button variant="danger" onClick={() => handleReject(app.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
