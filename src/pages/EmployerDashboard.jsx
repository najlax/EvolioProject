import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  employerLinks,
  Card,
  Button,
  Badge,
  Input,
  StatCard,
  EmptyState,
} from "../components/Components.jsx";
import { students } from "../data.js";

// Employer Dashboard - search candidates and save the ones you like.
export default function EmployerDashboard() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All"); // availability filter
  const [saved, setSaved] = useState([]); // list of saved student ids

  // Simple mock recent activity list
  const recentActivity = [
    { text: "You viewed Aisha Khan's portfolio", time: "1h ago" },
    { text: "You saved Marcus Lee as a candidate", time: "3h ago" },
    { text: "New message from Priya Patel", time: "1d ago" },
  ];

  // Save or unsave a candidate
  function toggleSave(id) {
    if (saved.includes(id)) {
      setSaved(saved.filter((s) => s !== id));
    } else {
      setSaved([...saved, id]);
    }
  }

  // Filter candidates by name search AND availability
  const candidates = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || student.availability === filter;
    return matchesSearch && matchesFilter;
  });

  // Get the full student objects for saved candidates
  const savedCandidates = students.filter((s) => saved.includes(s.id));

  return (
    <div className="page-shell">
      <Sidebar title="Employer" links={employerLinks} />

      <main className="page-main">
        <h1 className="page-header">Employer Dashboard</h1>

        {/* Stat cards */}
        <div className="dashboard-grid">
          <StatCard label="Candidates" value={students.length} />
          <StatCard label="Saved" value={saved.length} accent="teal" />
          <StatCard label="Open Roles" value={3} />
          <StatCard label="Messages" value={3} accent="teal" />
        </div>

        {/* Recent activity (simple mock list) */}
        <Card className="mb-6">
          <h3 className="card-title mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            {recentActivity.map((item, index) => (
              <div key={index} className="activity-row">
                <span className="text-gray-600">{item.text}</span>
                <span className="text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <h2 className="mb-4 text-xl font-bold text-gray-800">Find Candidates</h2>

        {/* Search + filter */}
        <div className="filter-bar">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option>All</option>
            <option>Available</option>
            <option>Limited Availability</option>
            <option>Not Available</option>
          </select>
        </div>

        {/* Candidate cards */}
        {candidates.length === 0 ? (
          <EmptyState message="No candidates match your search." />
        ) : (
          <div className="card-grid">
            {candidates.map((student) => (
              <Card key={student.id}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{student.name}</h3>
                  <Badge text={student.availability} color="teal" />
                </div>
                <p className="text-sm text-gray-500">{student.headline}</p>

                {/* Top skills */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {student.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} text={skill} color="gray" />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => navigate(`/employer/portfolio/${student.id}`)}>
                    View Portfolio
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/employer/messages")}>
                    Contact
                  </Button>
                  <Button variant="outline">Resume</Button>
                  <Button variant="teal" onClick={() => toggleSave(student.id)}>
                    {saved.includes(student.id) ? "Saved ✓" : "Save"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Saved candidates section */}
        <h2 className="mb-3 mt-8 text-xl font-bold text-gray-800">Saved Candidates</h2>
        {savedCandidates.length === 0 ? (
          <EmptyState message="You haven't saved any candidates yet." />
        ) : (
          <div className="card-grid">
            {savedCandidates.map((student) => (
              <Card key={student.id}>
                <h3 className="font-semibold text-gray-800">{student.name}</h3>
                <p className="text-sm text-gray-500">{student.headline}</p>
                <div className="mt-3">
                  <Button onClick={() => navigate(`/employer/portfolio/${student.id}`)}>
                    View Portfolio
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
