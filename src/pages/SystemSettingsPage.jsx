import { useState } from "react";
import {
  Sidebar,
  adminLinks,
  Card,
  Button,
} from "../components/Components.jsx";

// System Settings Page - simple platform configuration (mock toggles).
export default function SystemSettingsPage() {
  // Feature flags as simple on/off booleans
  const [features, setFeatures] = useState({
    aiFeedback: true,
    employerMessaging: true,
    publicPortfolios: false,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyReport: false,
  });

  // Access policy (a simple dropdown)
  const [accessPolicy, setAccessPolicy] = useState("Invite only");

  const [message, setMessage] = useState("");

  // Flip one feature flag on/off
  function toggleFeature(key) {
    setFeatures({ ...features, [key]: !features[key] });
  }

  function toggleNotification(key) {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  }

  function saveSettings() {
    setMessage("Settings saved!");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">System Settings</h1>

        {message && <p className="alert-success">{message}</p>}

        <div className="content-grid">
          {/* Feature flags */}
          <Card>
            <h3 className="card-title">Feature Flags</h3>
            <Toggle
              label="AI Feedback"
              on={features.aiFeedback}
              onToggle={() => toggleFeature("aiFeedback")}
            />
            <Toggle
              label="Employer Messaging"
              on={features.employerMessaging}
              onToggle={() => toggleFeature("employerMessaging")}
            />
            <Toggle
              label="Public Portfolios"
              on={features.publicPortfolios}
              onToggle={() => toggleFeature("publicPortfolios")}
            />
          </Card>

          {/* Notification settings */}
          <Card>
            <h3 className="card-title">Notifications</h3>
            <Toggle
              label="Email Alerts"
              on={notifications.emailAlerts}
              onToggle={() => toggleNotification("emailAlerts")}
            />
            <Toggle
              label="Weekly Report"
              on={notifications.weeklyReport}
              onToggle={() => toggleNotification("weeklyReport")}
            />
          </Card>

          {/* Access policy */}
          <Card>
            <h3 className="card-title">Access Policy</h3>
            <select
              value={accessPolicy}
              onChange={(e) => setAccessPolicy(e.target.value)}
              className="form-input"
            >
              <option>Invite only</option>
              <option>Open registration</option>
              <option>Admin approval required</option>
            </select>
          </Card>
        </div>

        <div className="mt-6">
          <Button onClick={saveSettings}>Save Settings</Button>
        </div>
      </main>
    </div>
  );
}

// Small reusable toggle row used only on this page.
function Toggle({ label, on, onToggle }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      {/* A simple button that acts like an on/off switch */}
      <button
        onClick={onToggle}
        className={`h-6 w-11 rounded-full p-1 transition ${on ? "bg-[#199DB2]" : "bg-gray-300"}`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`}
        ></span>
      </button>
    </div>
  );
}
