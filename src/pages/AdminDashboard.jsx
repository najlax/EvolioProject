import {
  Sidebar,
  adminLinks,
  Card,
  StatCard,
} from "../components/Components.jsx";
import { analytics } from "../data.js";

// Admin Dashboard - platform-wide metrics and alerts.
export default function AdminDashboard() {
  const stats = analytics.admin;

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">Admin Dashboard</h1>

        {/* Platform metrics */}
        <div className="dashboard-grid">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Students" value={stats.totalStudents} accent="teal" />
          <StatCard label="Employers" value={stats.totalEmployers} />
          <StatCard label="Coaches" value={stats.totalCoaches} accent="teal" />
        </div>

        <div className="dashboard-grid">
          <StatCard label="Published Portfolios" value={stats.publishedPortfolios} />
          <StatCard label="User Growth" value={stats.userGrowth} accent="teal" />
          <StatCard label="Employer Engagement" value={stats.employerEngagement} />
        </div>

        {/* Review workflow analytics (simple text bars) */}
        <Card>
          <h3 className="card-title mb-4">Review Workflow</h3>
          <div className="space-y-3 text-sm">
            {/* Each bar is a simple div with a width */}
            <ReviewBar label="Draft" percent={20} />
            <ReviewBar label="Needs Revision" percent={35} />
            <ReviewBar label="Ready" percent={25} />
            <ReviewBar label="Published" percent={20} />
          </div>
        </Card>
      </main>
    </div>
  );
}

// Small helper component for a labeled progress bar.
// (Kept in this file because it is only used here.)
function ReviewBar({ label, percent }) {
  return (
    <div>
      <div className="flex justify-between text-gray-600">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="progress-track mt-1">
        <div className="progress-fill bg-[#3199CC]" style={{ width: percent + "%" }}></div>
      </div>
    </div>
  );
}
