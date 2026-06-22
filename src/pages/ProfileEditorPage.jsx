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
import { getProfile, updateProfile, generatePortfolioSummary } from "../services/api.js";
import { Sparkles } from "lucide-react";

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
  const [availability, setAvailability] = useState("Available");

  // AI summary generation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDone, setAiDone] = useState(false);

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
        setAvailability(p.availability || "Available");
      })
      .catch((err) => setError(err.message || "Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  // Generate a professional bio with AI and place it in the Bio field.
  // The student can still edit it before saving.
  async function handleGenerateSummary() {
    setAiError("");
    setAiDone(false);
    setAiLoading(true);
    try {
      const res = await generatePortfolioSummary();
      if (res?.summary) {
        setBio(res.summary);
        setAiDone(true);
        setTimeout(() => setAiDone(false), 2500);
      }
    } catch (err) {
      setAiError(err.message || "Could not generate a summary right now.");
    } finally {
      setAiLoading(false);
    }
  }

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

              {/* AI summary generator: fills the Bio field above. */}
              <div className="mb-4 -mt-2">
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1 text-sm text-[#199DB2] hover:underline disabled:opacity-60"
                >
                  <Sparkles className={`h-4 w-4 ${aiLoading ? "animate-pulse" : ""}`} />
                  {aiLoading ? "Generating with AI..." : "Generate bio with AI"}
                </button>
                {aiDone && (
                  <p className="mt-1 text-xs text-green-700">
                    AI summary added to your bio. Review and save.
                  </p>
                )}
                {aiError && <p className="mt-1 text-xs text-red-600">{aiError}</p>}
              </div>

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
                  <option>Available</option>
                  <option>Limited Availability</option>
                  <option>Not Available</option>
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
