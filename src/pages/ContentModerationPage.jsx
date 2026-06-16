import { useState } from "react";
import {
  Sidebar,
  adminLinks,
  Card,
  Button,
  Badge,
  EmptyState,
} from "../components/Components.jsx";
import { reportedContent } from "../data.js";

// Content Moderation Page - admin reviews reported portfolios/projects.
export default function ContentModerationPage() {
  // Keep reports in state so we can change their status
  const [reports, setReports] = useState(reportedContent);

  // Update a report's status (Approve = keep, Remove = take down)
  function updateStatus(id, newStatus) {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  }

  // Pick a badge color for a status
  function statusColor(status) {
    if (status === "Approved") return "green";
    if (status === "Removed") return "red";
    return "yellow"; // Pending
  }

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">Content Moderation</h1>

        <h2 className="mb-3 text-lg font-semibold text-gray-700">Moderation Queue</h2>

        {/* Reported content list */}
        {reports.length === 0 ? (
          <EmptyState message="Nothing to moderate. Great job!" />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-medium text-gray-800">{report.type}</p>
                      <Badge text={report.status} color={statusColor(report.status)} />
                    </div>
                    <p className="text-sm text-gray-500">Owner: {report.owner}</p>
                    <p className="text-sm text-gray-500">Reason: {report.reason}</p>
                  </div>

                  {/* Moderation actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => updateStatus(report.id, "Approved")}>
                      Keep
                    </Button>
                    <Button variant="danger" onClick={() => updateStatus(report.id, "Removed")}>
                      Remove
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
