import { useState } from "react";
import {
  Sidebar,
  adminLinks,
  Card,
  Button,
  Badge,
  Input,
  EmptyState,
} from "../components/Components.jsx";
import { students, employers, coaches } from "../data.js";

// User Management Page - admin manages students, employers and coaches.
export default function UserManagementPage() {
  // Build one combined list of all users with a "role" field
  const allUsers = [
    ...students.map((s) => ({ id: s.id, name: s.name, email: s.email, role: "Student" })),
    ...employers.map((e) => ({ id: e.id, name: e.name, email: e.email, role: "Employer" })),
    ...coaches.map((c) => ({ id: c.id, name: c.name, email: c.email, role: "Coach" })),
  ];

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Track which users are "active" (start everyone active)
  const [activeUsers, setActiveUsers] = useState(allUsers.map((u) => u.id));

  function toggleActive(id) {
    if (activeUsers.includes(id)) {
      setActiveUsers(activeUsers.filter((u) => u !== id));
    } else {
      setActiveUsers([...activeUsers, id]);
    }
  }

  // Filter by search text and role
  const visibleUsers = allUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-shell">
      <Sidebar title="Admin" links={adminLinks} />

      <main className="page-main">
        <h1 className="page-header">User Management</h1>

        {/* Search + role filter */}
        <div className="filter-bar">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option>All</option>
            <option>Student</option>
            <option>Employer</option>
            <option>Coach</option>
          </select>
        </div>

        {/* Users table (cards) */}
        {visibleUsers.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <Card>
            <div className="space-y-3">
              {visibleUsers.map((user) => {
                const isActive = activeUsers.includes(user.id);
                return (
                  <div key={user.id} className="list-row-responsive">
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge text={user.role} color="blue" />
                      <Badge text={isActive ? "Active" : "Disabled"} color={isActive ? "green" : "red"} />
                      <Button variant="outline" onClick={() => toggleActive(user.id)}>
                        {isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
