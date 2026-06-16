import { useEffect, useState } from "react";
import {
  Sidebar,
  studentLinks,
  Card,
  Input,
  Textarea,
  Button,
  LoadingState,
  ErrorState,
} from "../components/Components.jsx";
import { getProfile, updateProfile } from "../services/api.js";

// Profile Editor Page - lets a student edit their profile info.
export default function ProfileEditorPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [availability, setAvailability] = useState("Open to work");

  // Load the logged-in student's profile from the backend on mount.
  useEffect(() => {
    getProfile()
      .then((p) => {
        setName(p.name || "");
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setSkills((p.skills || []).join(", "));
        setLocation(p.location || "");
        setGithub(p.github || "");
        setLinkedin(p.linkedin || "");
        setContactEmail(p.contact_email || "");
        setAvailability(p.availability || "Open to work");
      })
      .catch((err) => setError(err.message || "Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      await updateProfile({
        name,
        headline,
        bio,
        // Turn the comma list into a clean array of skills.
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        location,
        github,
        linkedin,
        contact_email: contactEmail,
        availability,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Could not save your profile.");
    }
  }

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <h1 className="page-header">Edit Profile</h1>

        {loading ? (
          <LoadingState message="Loading your profile..." />
        ) : (
          <Card className="max-w-2xl">
            {saved && <p className="alert-success">Profile saved successfully!</p>}
            {error && <p className="alert-error">{error}</p>}

            <form onSubmit={handleSave}>
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              <Input
                label="Skills (comma separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input label="GitHub" value={github} onChange={(e) => setGithub(e.target.value)} />
              <Input
                label="LinkedIn"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
              <Input
                label="Contact Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />

              {/* Availability status dropdown */}
              <div className="mb-4">
                <label className="form-label">Availability Status</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="form-input"
                >
                  <option>Open to work</option>
                  <option>Interviewing</option>
                  <option>Not looking</option>
                </select>
              </div>

              <Button type="submit">Save Profile</Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
