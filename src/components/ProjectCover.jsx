import {
  Brain,
  Globe,
  Smartphone,
  Database,
  Server,
  Shield,
  Gamepad2,
  Code2,
} from "lucide-react";
import { API_ORIGIN } from "../services/api.js";

// Maps a project's technologies/title to a representative icon + brand gradient,
// so projects without an uploaded image still get a clean "technical cover".
const DOMAINS = [
  {
    icon: Brain,
    label: "AI / ML",
    gradient: "from-[#3199CC] to-[#001776]",
    keys: ["ai", "ml", "machine learning", "tensorflow", "pytorch", "scikit", "nlp", "data science", "pandas", "numpy"],
  },
  {
    icon: Smartphone,
    label: "Mobile",
    gradient: "from-[#199DB2] to-[#001776]",
    keys: ["swift", "swiftui", "kotlin", "flutter", "react native", "android", "ios", "mobile"],
  },
  {
    icon: Database,
    label: "Data",
    gradient: "from-[#147d8f] to-[#001776]",
    keys: ["sql", "postgres", "postgresql", "mysql", "mongodb", "sqlite", "database", "redis"],
  },
  {
    icon: Server,
    label: "Cloud / DevOps",
    gradient: "from-[#3199CC] to-[#147d8f]",
    keys: ["docker", "kubernetes", "aws", "terraform", "ci/cd", "devops", "cloud", "gcp", "azure"],
  },
  {
    icon: Shield,
    label: "Security",
    gradient: "from-[#001776] to-[#147d8f]",
    keys: ["security", "cybersecurity", "owasp", "penetration", "nmap", "burp"],
  },
  {
    icon: Gamepad2,
    label: "Game",
    gradient: "from-[#199DB2] to-[#3199CC]",
    keys: ["unity", "unreal", "godot", "game"],
  },
  {
    icon: Globe,
    label: "Web",
    gradient: "from-[#001776] to-[#199DB2]",
    keys: ["react", "vue", "angular", "next", "node", "express", "html", "css", "tailwind", "javascript", "typescript", "web", "django", "flask", "laravel"],
  },
];

function pickDomain(techStack = [], title = "") {
  const hay = [...techStack, title].join(" ").toLowerCase();
  for (const d of DOMAINS) {
    if (d.keys.some((k) => hay.includes(k))) return d;
  }
  return { icon: Code2, label: "Project", gradient: "from-[#001776] to-[#3199CC]" };
}

// Cover header for a project card.
// - Uses the first uploaded backend image when available.
// - Otherwise renders a domain-based gradient cover (icon + label).
export default function ProjectCover({ project, className = "" }) {
  const images = project?.images || [];
  const cover = images.length > 0 ? `${API_ORIGIN}${images[0]}` : null;

  if (cover) {
    return (
      <div className={`overflow-hidden rounded-lg ${className}`}>
        <img
          src={cover}
          alt={`${project?.title || "Project"} cover`}
          className="h-32 w-full object-cover"
        />
      </div>
    );
  }

  const domain = pickDomain(project?.tech_stack, project?.title);
  const Icon = domain.icon;
  return (
    <div
      className={`flex h-32 w-full items-center justify-center rounded-lg bg-gradient-to-br ${domain.gradient} ${className}`}
    >
      <div className="flex flex-col items-center text-white">
        <Icon className="h-9 w-9" />
        <span className="mt-1 text-xs font-medium tracking-wide text-white/90">
          {domain.label}
        </span>
      </div>
    </div>
  );
}
