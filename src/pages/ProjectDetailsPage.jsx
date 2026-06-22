import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Sidebar,
  employerLinks,
  Card,
  Badge,
  ErrorState,
} from "../components/Components.jsx";
import { students, projects } from "../data.js";
import ProjectGallery from "../components/ProjectGallery.jsx";
import { Github, ExternalLink, ArrowLeft } from "lucide-react";

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
              <ProjectGallery images={shots} title={project.title} />
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
    </div>
  );
}
