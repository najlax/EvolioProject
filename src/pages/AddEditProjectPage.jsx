import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Sidebar,
  studentLinks,
  Card,
  Input,
  Textarea,
  Button,
  LoadingState,
} from "../components/Components.jsx";
import {
  API_ORIGIN,
  getProject,
  getProjectImages,
  createProject,
  updateProject,
  uploadProjectImage,
  extractProjectSkills,
} from "../services/api.js";
import { ImagePlus, X, Sparkles } from "lucide-react";

// Add/Edit Project Page - one form used for BOTH adding and editing.
// If there is a :projectId in the URL we are editing, otherwise adding.
export default function AddEditProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(projectId);

  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // AI skill-extraction status shown after the project is saved.
  const [aiStatus, setAiStatus] = useState("");   // "running" | "done" | "error"
  const [aiSkills, setAiSkills] = useState([]);
  const [aiError, setAiError] = useState("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState("");
  const [github, setGithub] = useState("");
  const [demo, setDemo] = useState("");
  const [status, setStatus] = useState("Draft");
  const [featured, setFeatured] = useState(false);
  const [collaborators, setCollaborators] = useState("");

  // screenshotPreview is what we show; screenshotFile is the new file to upload.
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);

  const fileInputRef = useRef(null);

  // When editing, load the project (and its first image) from the backend.
  useEffect(() => {
    if (!editing) return;
    Promise.all([getProject(projectId), getProjectImages(projectId)])
      .then(([p, images]) => {
        setTitle(p.title || "");
        setSummary(p.summary || "");
        setDescription(p.description || "");
        setTech((p.tech_stack || []).join(", "));
        setGithub(p.github_link || "");
        setDemo(p.demo_link || "");
        setStatus(p.status || "Draft");
        setFeatured(Boolean(p.featured));
        setCollaborators((p.collaborators || []).join(", "));
        if (images && images.length > 0) {
          setScreenshotPreview(`${API_ORIGIN}${images[0].url}`);
        }
      })
      .catch((err) => setError(err.message || "Could not load this project."))
      .finally(() => setLoading(false));
  }, [editing, projectId]);

  function handleScreenshotChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function toList(text) {
    return text.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setAiError("");
    setAiSkills([]);
    setAiStatus("");
    setSaving(true);
    try {
      const payload = {
        title,
        summary,
        description,
        content: "",
        tech_stack: toList(tech),
        github_link: github,
        demo_link: demo,
        status,
        featured,
        collaborators: toList(collaborators),
      };

      const project = editing
        ? await updateProject(projectId, payload)
        : await createProject(payload);

      // Upload the screenshot (if a new one was chosen) to the saved project.
      if (screenshotFile) {
        await uploadProjectImage(project.id, screenshotFile);
      }

      // The project is saved. Now extract skills with AI. This runs after the
      // save so a failure here never blocks saving the project.
      setSaving(false);
      setAiStatus("running");
      try {
        const res = await extractProjectSkills(project.id);
        setAiSkills(res?.skills || []);
        setAiStatus("done");
        // Give the student a moment to see the result, then continue.
        setTimeout(() => navigate("/student/projects"), 1500);
      } catch (aiErr) {
        setAiStatus("error");
        setAiError(aiErr.message || "Could not extract skills with AI.");
        setTimeout(() => navigate("/student/projects"), 2000);
      }
      return;
    } catch (err) {
      setError(err.message || "Could not save the project.");
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <h1 className="page-header">{editing ? "Edit Project" : "Add Project"}</h1>

        {loading ? (
          <LoadingState message="Loading project..." />
        ) : (
          <div className="max-w-3xl">
            <div>
              <Card>
                {error && <p className="alert-error">{error}</p>}

                {/* AI skill-extraction status (after save) */}
                {aiStatus === "running" && (
                  <p className="mb-4 flex items-center gap-2 rounded-lg bg-[#E1F4F7] p-2 text-sm text-[#147d8f]">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Extracting skills with AI...
                  </p>
                )}
                {aiStatus === "done" && (
                  <div className="alert-success">
                    <span className="flex items-center gap-2 font-medium">
                      <Sparkles className="h-4 w-4" />
                      Skills extracted and added to your profile
                    </span>
                    {aiSkills.length > 0 && (
                      <p className="mt-1">{aiSkills.join(", ")}</p>
                    )}
                  </div>
                )}
                {aiStatus === "error" && (
                  <p className="alert-error">{aiError}</p>
                )}

                <form onSubmit={handleSave}>
                  <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Input
                    label="Summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                  <Textarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                  <Input
                    label="Tech Stack (comma separated)"
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                  />
                  <Input
                    label="GitHub Link"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                  />
                  <Input label="Demo Link" value={demo} onChange={(e) => setDemo(e.target.value)} />

                  {/* Screenshot uploader */}
                  <div className="mb-4">
                    <label className="form-label">Screenshot</label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={handleScreenshotChange}
                    />

                    {screenshotPreview ? (
                      <div className="relative">
                        <img
                          src={screenshotPreview}
                          alt="Project screenshot preview"
                          className="w-full rounded-lg border border-gray-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotPreview("");
                            setScreenshotFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-gray-600 shadow hover:bg-white"
                          aria-label="Remove screenshot"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="mt-2 text-sm text-[#199DB2] hover:underline"
                        >
                          Replace screenshot
                        </button>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            fileInputRef.current && fileInputRef.current.click();
                        }}
                        className="upload-box cursor-pointer p-6 hover:border-[#3199CC]"
                      >
                        <ImagePlus className="mb-2 h-7 w-7 text-gray-400" />
                        <p className="text-sm text-gray-500">Click to add a screenshot (PNG or JPG)</p>
                      </div>
                    )}
                  </div>

                  {/* Status dropdown */}
                  <div className="mb-4">
                    <label className="form-label">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="form-input"
                    >
                      <option>Draft</option>
                      <option>Published</option>
                    </select>
                  </div>

                  {/* Feature on portfolio */}
                  <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                    />
                    Feature this project on my portfolio
                  </label>

                  <Input
                    label="Collaborators (comma separated)"
                    value={collaborators}
                    onChange={(e) => setCollaborators(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button type="submit">
                      {saving
                        ? "Saving..."
                        : aiStatus === "running"
                        ? "Analyzing..."
                        : "Save Project"}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/student/projects")}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
