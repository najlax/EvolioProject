import { useState } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { Navbar, Card, Input, Textarea, Button } from "../components/Components.jsx";
import { registerUser } from "../services/api.js";

// Per-account-type copy. Employer/coach show extra application fields.
const CONFIG = {
  student: {
    title: "Create Your Student Account",
    isApplication: false,
    submitLabel: "Create Account",
  },
  employer: {
    title: "Employer Application",
    isApplication: true,
    submitLabel: "Submit Application",
    orgLabel: "Company / Organization",
    orgPlaceholder: "e.g. Acme Inc.",
    messageLabel: "Tell us about your hiring needs",
  },
  coach: {
    title: "Career Coach Application",
    isApplication: true,
    submitLabel: "Submit Application",
    orgLabel: "Area of Expertise",
    orgPlaceholder: "e.g. Software Engineering careers",
    messageLabel: "Tell us about your coaching background",
  },
};

// Step 2 of sign up: the actual form, adapted to the chosen account type.
export default function RegisterPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const config = CONFIG[type];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Unknown type -> back to the selection step.
  if (!config) {
    return <Navigate to="/create-account" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (config.isApplication && !organization) {
      setError(`Please fill in the ${config.orgLabel.toLowerCase()} field.`);
      return;
    }
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await registerUser({
        name,
        email,
        password,
        account_type: type,
        organization,
        message,
      });

      if (config.isApplication) {
        // Show the pending-approval confirmation.
        navigate("/application-submitted", {
          state: { role: type === "employer" ? "employer" : "career coach" },
        });
      } else {
        navigate("/sign-in");
      }
    } catch (err) {
      setError(err.message || "Could not create your account. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Navbar />

      <div className="auth-container">
        <h1 className="auth-title">{config.title}</h1>

        <Card>
          {config.isApplication && (
            <p className="mb-4 rounded-lg bg-[#E6F2FA] p-3 text-sm text-[#001776]">
              Your account will be created with a <strong>pending</strong>{" "}
              application. An admin must approve it before you can access{" "}
              {type === "employer" ? "employer" : "coach"} features.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            {error && <p className="alert-error">{error}</p>}

            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {config.isApplication && (
              <>
                <Input
                  label={config.orgLabel}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder={config.orgPlaceholder}
                />
                <Textarea
                  label={config.messageLabel}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </>
            )}

            <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              I agree to the Terms and Conditions
            </label>

            <Button type="submit">
              {submitting ? "Please wait..." : config.submitLabel}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/create-account" className="text-[#001776] hover:underline">
            ← Choose a different account type
          </Link>
        </p>
      </div>
    </div>
  );
}
