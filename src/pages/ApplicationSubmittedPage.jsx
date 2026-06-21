import { useLocation, useNavigate } from "react-router-dom";
import { Navbar, Card, Button } from "../components/Components.jsx";
import { clearToken, getRole } from "../services/api.js";
import { Clock } from "lucide-react";

// Shown after an employer/coach application is submitted, and also when a
// pending applicant logs in (their account has no privileges until approved).
export default function ApplicationSubmittedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Prefer the role passed right after submitting; otherwise infer from the
  // logged-in pending account's role.
  const stateRole = location.state?.role;
  const storedRole = getRole();
  const role =
    stateRole ||
    (storedRole === "employer"
      ? "employer"
      : storedRole === "coach"
      ? "career coach"
      : "");

  function backToSignIn() {
    clearToken(); // end any pending session
    navigate("/sign-in");
  }

  return (
    <div>
      <Navbar />

      <div className="auth-container">
        <Card className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F4F7] text-[#147d8f]">
            <Clock className="h-7 w-7" />
          </span>

          <h1 className="mb-2 text-xl font-bold text-gray-800">
            Application Pending Approval
          </h1>

          <p className="mb-6 text-sm text-gray-600">
            Thanks for applying{role ? ` to be a ${role}` : ""}! Your account has
            been created and your application is now waiting for an admin to
            review it. You'll be able to access your dashboard once it's
            approved.
          </p>

          <Button onClick={backToSignIn}>Return to Sign In</Button>
        </Card>
      </div>
    </div>
  );
}
