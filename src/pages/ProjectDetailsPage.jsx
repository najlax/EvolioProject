import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Sidebar,
  employerLinks,
  Card,
  Badge,
  ErrorState,
} from "../components/Components.jsx";
import { students, projects } from "../data.js";
import {
  Github,
  ExternalLink,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// =============================================================
// Project Details Page
// Opens when an employer clicks "View Details" on a project card
// inside a student's portfolio. Built for recruiters who skim:
// hero → screenshots → overview → tech → role → quick info → CTA.
// =============================================================
export default function ProjectDetailsPage() {
  const { studentId, projectId } = useParams();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId);
  const student = students.find((s) => s.id === studentId);

  // Lightbox state: which screenshot index is open (null = closed)
  const [lightbox, setLightbox] = useState(null);

  // Guard: bad/unknown project id
  if (!project) {
    return (
      <div className="page-shell">
        <Sidebar title="Employer" links={employerLinks} />
        <main className="page-main">
          <ErrorState message="Sorry, we could not find this project." />
        </main>
      </div>
    );
  }

  const shots = project.screenshots || [];
  const portfolioLink = student ? `/employer/portfolio/${student.id}` : "/employer/dashboard";

  // Lightbox navigation (wraps around)
  function openLightbox(i) {
    setLightbox(i);
  }
  function closeLightbox() {
    setLightbox(null);
  }
  function prevImage() {
    setLightbox((i) => (i - 1 + shots.length) % shots.length);
  }
  function nextImage() {
    setLightbox((i) => (i + 1) % shots.length);
  }

  // Reusable pair of resource buttons (used in hero + bottom CTA).
  // Buttons are hidden entirely when their URL is missing — never disabled.
  function ResourceButtons() {
    return (
      <div className="flex flex-wrap gap-3">
        {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noreferrer"
            className="primary-btn inline-flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" /> View Live Demo
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            className="outline-btn inline-flex items-center gap-2"
          >
            <Github className="h-4 w-4" /> View GitHub Repository
          </a>
        )}
      </div>
    );
  }

  // Quick-info cards — only render the ones that have a value
  const quickInfo = [
    { label: "Project Type", value: project.projectType },
    { label: "Status", value: project.stage },
    {
      label: "Team Size",
      value: project.teamSize
        ? `${project.teamSize} ${project.teamSize === 1 ? "person" : "people"}`
        : "",
    },
  ].filter((item) => item.value);

  return (
    <div className="page-shell">
      <Sidebar title="Employer" links={employerLinks} />

      <main className="page-main">
        {/* Back to the portfolio */}
        <Link
          to={portfolioLink}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#001776]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>

        <div className="mx-auto max-w-4xl space-y-6">
          {/* 1. HERO ---------------------------------------------------- */}
          <Card>
            <p className="text-sm font-medium text-[#199DB2]">{project.category}</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{project.title}</h1>

            {project.completionDate && (
              <p className="mt-1 text-sm text-gray-500">Completed {project.completionDate}</p>
            )}

            {/* Technologies */}
            {project.techStack?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <Badge key={tech} text={tech} color="blue" />
                ))}
              </div>
            )}

            <div className="mt-5">
              <ResourceButtons />
            </div>
          </Card>

          {/* 2. SCREENSHOT GALLERY ------------------------------------- */}
          {shots.length > 0 && (
            <Card>
              <h2 className="card-title">Screenshots</h2>

              {/* Primary screenshot (above the fold) */}
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="block w-full overflow-hidden rounded-xl border border-gray-100"
              >
                <img
                  src={shots[0]}
                  alt={`${project.title} main screenshot`}
                  className="h-auto w-full object-cover transition hover:opacity-95"
                  loading="lazy"
                  decoding="async"
                />
              </button>

              {/* Additional screenshots */}
              {shots.length > 1 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {shots.slice(1).map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => openLightbox(i + 1)}
                      className="overflow-hidden rounded-lg border border-gray-100"
                    >
                      <img
                        src={src}
                        alt={`${project.title} screenshot ${i + 2}`}
                        className="h-32 w-full object-cover transition hover:opacity-90"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 3. OVERVIEW ----------------------------------------------- */}
          {project.description && (
            <Card>
              <h2 className="card-title">Project Overview</h2>
              {/* whitespace-pre-line preserves the line breaks from the text */}
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {project.description}
              </p>
            </Card>
          )}

          {/* 4. TECHNOLOGIES ------------------------------------------- */}
          {project.techStack?.length > 0 && (
            <Card>
              <h2 className="card-title">Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <Badge key={tech} text={tech} color="teal" />
                ))}
              </div>
            </Card>
          )}

          {/* 5. STUDENT ROLE (hidden when empty) ----------------------- */}
          {project.role && (
            <Card>
              <h2 className="card-title">My Role</h2>
              <p className="text-sm font-medium text-gray-800">{project.role}</p>
            </Card>
          )}

          {/* 6. QUICK PROJECT INFORMATION ------------------------------ */}
          {quickInfo.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {quickInfo.map((item) => (
                <Card key={item.label}>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-gray-800">{item.value}</p>
                </Card>
              ))}
            </div>
          )}

          {/* 7. CALL TO ACTION ----------------------------------------- */}
          {(project.demo || project.github) && (
            <Card className="text-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Interested in this project?
              </h2>
              <p className="mb-4 mt-1 text-sm text-gray-500">
                Explore the live product or dive into the source code.
              </p>
              <div className="flex justify-center">
                <ResourceButtons />
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* FULLSCREEN LIGHTBOX -------------------------------------------- */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev / Next (only when there is more than one image) */}
          {shots.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          {/* The image itself (stop click so it doesn't close) */}
          <img
            src={shots[lightbox]}
            alt={`${project.title} screenshot ${lightbox + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          {shots.length > 1 && (
            <p className="absolute bottom-4 text-sm text-white/70">
              {lightbox + 1} / {shots.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
