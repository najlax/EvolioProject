import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { clearToken } from "../services/api.js";

// -------------------------------------------------------------
// Button
// A simple button with a few color "variants".
// -------------------------------------------------------------
export function Button({ children, onClick, variant = "primary", type = "button" }) {
  // Pick the right CSS class based on the variant (see index.css)
  let styles = "primary-btn"; // primary (deep navy)
  if (variant === "teal") styles = "secondary-btn"; // secondary
  if (variant === "accent") styles = "accent-btn"; // accent
  if (variant === "outline") styles = "outline-btn";
  if (variant === "danger") styles = "danger-btn";

  return (
    <button type={type} onClick={onClick} className={styles}>
      {children}
    </button>
  );
}

// -------------------------------------------------------------
// Card
// A white rounded box used everywhere.
// -------------------------------------------------------------
export function Card({ children, className = "" }) {
  return <div className={`section-card ${className}`}>{children}</div>;
}

// -------------------------------------------------------------
// Badge
// A small colored label (good for statuses).
// -------------------------------------------------------------
export function Badge({ text, color = "blue" }) {
  // Map a color name to its badge CSS class (see index.css)
  const colors = {
    blue: "badge-blue",
    teal: "badge-teal",
    green: "badge-success",
    yellow: "badge-warning",
    red: "badge-error",
    gray: "badge-gray",
  };
  return <span className={`badge ${colors[color] || colors.blue}`}>{text}</span>;
}

// -------------------------------------------------------------
// Input
// A labeled text input for forms.
// -------------------------------------------------------------
export function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="mb-4">
      {label && <label className="form-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
}

// -------------------------------------------------------------
// Textarea
// A labeled multi-line input for forms.
// -------------------------------------------------------------
export function Textarea({ label, value, onChange, placeholder = "", rows = 4 }) {
  return (
    <div className="mb-4">
      {label && <label className="form-label">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="form-input"
      />
    </div>
  );
}

// -------------------------------------------------------------
// Modal
// A simple popup. Only shows when "open" is true.
// -------------------------------------------------------------
export function Modal({ open, onClose, title, children }) {
  if (!open) return null; // don't render anything when closed

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// EmptyState
// Shown when a list has no items.
// -------------------------------------------------------------
export function EmptyState({ message = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <Inbox className="mb-3 h-10 w-10 text-gray-400" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// -------------------------------------------------------------
// LoadingState
// Shown while we fake-load something.
// -------------------------------------------------------------
export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#001776]" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// -------------------------------------------------------------
// ErrorState
// Shown when something "goes wrong" (mocked).
// -------------------------------------------------------------
export function ErrorState({ message = "Something went wrong." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-red-500" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

// -------------------------------------------------------------
// StatCard
// A small card that shows one number/stat on dashboards.
// -------------------------------------------------------------
export function StatCard({ label, value, accent = "blue" }) {
  const accentColors = {
    blue: "text-[#001776]",
    teal: "text-[#199DB2]",
    accent: "text-[#3199CC]",
    gray: "text-gray-700",
  };
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentColors[accent] || accentColors.blue}`}>
        {value}
      </p>
    </Card>
  );
}

// -------------------------------------------------------------
// Navbar
// The top header used on public pages.
// Left: "E" logo  |  Center: marketing links  |  Right: auth buttons
// -------------------------------------------------------------
export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-[#DDE7F0] bg-white px-6 py-4">
      {/* Left: Evolio logo beside the wordmark, links back home */}
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[#001776]">
        <img src="/logo.svg" alt="Evolio logo" className="h-10 w-auto" />
        Evolio
      </Link>

      {/* Center: simple marketing links (anchor to landing page sections) */}
      <div className="hidden items-center gap-6 md:flex">
        <a href="/#features" className="text-sm text-gray-600 hover:text-[#199DB2]">
          Features
        </a>
        <a href="/#how-it-works" className="text-sm text-gray-600 hover:text-[#199DB2]">
          How it works
        </a>
        <a href="/#for-teams" className="text-sm text-gray-600 hover:text-[#199DB2]">
          For teams
        </a>
      </div>

      {/* Right: auth buttons */}
      <div className="flex items-center gap-2">
        <Link to="/sign-in" className="text-sm text-gray-600 hover:text-[#199DB2]">
          Sign In
        </Link>
        <Link
          to="/create-account"
          className="rounded-lg bg-[#001776] px-4 py-2 text-sm font-medium text-white hover:bg-[#001456]"
        >
          Create Account
        </Link>
      </div>
    </nav>
  );
}

// -------------------------------------------------------------
// Sidebar
// The left menu used on dashboard pages.
// It takes a "title" and a "links" array so we can reuse it
// for students, employers, coaches and admins.
// Each link looks like: { label: "Dashboard", to: "/student/dashboard" }
// -------------------------------------------------------------
export function Sidebar({ title, links }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/sign-in");
  }

  return (
    <aside className="sidebar">
      {/* Logo / title (logo sits on a white chip so it reads on the navy bg) */}
      <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
          <img src="/logo.svg" alt="Evolio logo" className="h-full w-auto" />
        </span>
        Evolio
      </Link>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">{title}</p>

      {/* NavLink gives us an "isActive" flag so the current page is highlighted. */}
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-idle"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button onClick={handleLogout} className="sidebar-link sidebar-link-idle mt-2 text-left">
        Log out
      </button>
    </aside>
  );
}

// -------------------------------------------------------------
// Sidebar link lists (one per role)
// Kept here so every dashboard page can reuse the same menu.
// -------------------------------------------------------------
export const studentLinks = [
  { label: "Dashboard", to: "/student/dashboard" },
  { label: "Profile", to: "/student/profile" },
  { label: "Resume", to: "/student/resume" },
  { label: "Projects", to: "/student/projects" },
  { label: "Portfolio", to: "/student/portfolio" },
  { label: "Review", to: "/student/review" },
];

export const employerLinks = [
  { label: "Dashboard", to: "/employer/dashboard" },
  { label: "Search", to: "/employer/search" },
  { label: "Messages", to: "/employer/messages" },
];

export const coachLinks = [
  { label: "Dashboard", to: "/coach/dashboard" },
  { label: "Student Progress", to: "/coach/progress" },
];

export const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Users", to: "/admin/users" },
  { label: "Employers", to: "/admin/employers" },
  { label: "Coaches", to: "/admin/coaches" },
  { label: "Applications", to: "/admin/applications" },
  { label: "Settings", to: "/admin/settings" },
];
