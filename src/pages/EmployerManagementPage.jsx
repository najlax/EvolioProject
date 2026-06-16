import { useState } from "react";
import {
  Sidebar,
  adminLinks,
  Card,
  Button,
  Badge,
  StatCard,
} from "../components/Components.jsx";
import { employers as initialEmployers } from "../data.js";

// Employer Management Page - admin approves employers and sees activity.
export default function EmployerManagementPage() {
  // Keep employers in state so we can change their status
  const [employers, setEmployers] = useState(initialEmployers);

  // Approve a pending employer
  function approve(id) {
    setEmployers(
      employers.map((e) => (e.id === id ? { ...e, status: "Approved" } : e))
    );
  }

  // Count how many are approved (for the summary)
  const approvedCount = employers.filter((e) => e.status === "Approved").length;

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">Employer Management</h1>

        {/* Activity overview */}
        <div className="stats-grid-3">
          <StatCard label="Total Employers" value={employers.length} />
          <StatCard label="Approved" value={approvedCount} accent="teal" />
          <StatCard label="Pending" value={employers.length - approvedCount} />
        </div>

        {/* Employer directory */}
        <Card>
          <h3 className="card-title mb-4">Employer Directory</h3>
          <div className="space-y-3">
            {employers.map((employer) => (
              <div key={employer.id} className="list-row-responsive">
                <div>
                  <p className="font-medium text-gray-800">{employer.company}</p>
                  <p className="text-xs text-gray-500">
                    {employer.name} • {employer.openRoles} open roles •{" "}
                    {employer.candidatesViewed} candidates viewed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    text={employer.status}
                    color={employer.status === "Approved" ? "green" : "yellow"}
                  />
                  {/* Only show approve button if still pending */}
                  {employer.status === "Pending" && (
                    <Button onClick={() => approve(employer.id)}>Approve</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
