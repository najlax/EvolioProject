import { Navigate } from "react-router-dom";
import { getToken, getRole, getStatus } from "../services/api.js";

// Where each role should land if it tries to open a page it isn't allowed to.
const HOME_BY_ROLE = {
  student: "/student/dashboard",
  employer: "/employer/dashboard",
  coach: "/coach/dashboard",
  admin: "/admin/dashboard",
};

// Guards private pages.
// - No token            -> send to sign in.
// - Pending application  -> send to the pending-approval page (no privileges).
// - Wrong role           -> send to the user's own dashboard.
// `roles` is an optional array of roles allowed to view the page.
// The backend still enforces access on every request; this is just UX.
export default function ProtectedRoute({ children, roles }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  // Employer/coach applicants have no dashboard access until approved.
  if (getStatus() === "pending") {
    return <Navigate to="/application-submitted" replace />;
  }

  if (roles && roles.length > 0) {
    const role = getRole();
    if (!roles.includes(role)) {
      return <Navigate to={HOME_BY_ROLE[role] || "/sign-in"} replace />;
    }
  }

  return children;
}
