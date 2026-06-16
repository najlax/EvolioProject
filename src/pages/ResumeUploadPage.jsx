import { useEffect, useRef, useState } from "react";
import {
  Sidebar,
  studentLinks,
  Card,
  Button,
  AIBox,
  Badge,
  LoadingState,
} from "../components/Components.jsx";
import {
  API_ORIGIN,
  getResume,
  uploadResume,
  deleteResume,
} from "../services/api.js";
import { aiFeedback } from "../data.js";
import { FileText, Upload } from "lucide-react";

const ALLOWED = ["pdf", "docx"];

// Resume Upload Page - upload/replace a resume + view a mock AI review.
export default function ResumeUploadPage() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Load the current resume (a 404 just means none uploaded yet).
  useEffect(() => {
    getResume()
      .then((meta) => setResume(meta))
      .catch(() => setResume(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError("");
    setMessage("");

    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError("Please upload a PDF or Word (.docx) file.");
      return;
    }

    try {
      const meta = await uploadResume(file);
      setResume(meta);
      setMessage("Resume uploaded successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setError(err.message || "Could not upload your resume.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setError("");
    try {
      await deleteResume();
      setResume(null);
      setMessage("Resume deleted.");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setError(err.message || "Could not delete your resume.");
    }
  }

  return (
    <div className="page-shell">
      <Sidebar title="Student" links={studentLinks} />

      <main className="page-main">
        <h1 className="page-header">Resume</h1>

        {message && <p className="alert-success">{message}</p>}
        {error && <p className="alert-error">{error}</p>}

        <div className="content-grid">
          {/* Upload area + metadata */}
          <div className="space-y-6">
            <Card>
              <h3 className="card-title">Upload / Replace Resume</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current && fileInputRef.current.click();
                }}
                className="upload-box cursor-pointer p-8 hover:border-[#3199CC]"
              >
                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload a PDF or .docx</p>
              </div>
            </Card>

            {loading ? (
              <LoadingState message="Loading resume..." />
            ) : resume ? (
              <Card>
                <h3 className="card-title">Resume Details</h3>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-[#001776]" />
                  <div>
                    <p className="font-medium text-gray-800">{resume.original_filename}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {resume.upload_date?.slice(0, 10)} •{" "}
                      {Math.max(1, Math.round(resume.file_size / 1024))} KB
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge text={resume.file_type?.toUpperCase()} color="teal" />
                  <a href={`${API_ORIGIN}${resume.url}`} target="_blank" rel="noreferrer">
                    <Button variant="outline">Download</Button>
                  </a>
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <h3 className="card-title">Resume Details</h3>
                <p className="text-sm text-gray-500">No resume uploaded yet.</p>
              </Card>
            )}
          </div>

          {/* Preview + AI review */}
          <div className="space-y-6">
            <Card>
              <h3 className="card-title">Preview</h3>
              {resume ? (
                <iframe
                  title="Resume preview"
                  src={`${API_ORIGIN}${resume.url}`}
                  className="preview-box h-96 w-full"
                />
              ) : (
                <div className="preview-box h-48">No resume to preview yet.</div>
              )}
            </Card>

            {/* AI resume review panel (fake AI) */}
            <AIBox
              title="AI Resume Review"
              buttonLabel="Review My Resume"
              result={aiFeedback.resumeReview}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
