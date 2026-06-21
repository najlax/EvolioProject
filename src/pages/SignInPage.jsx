import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar, Card, Input, Button, Modal } from "../components/Components.jsx";
import {
  loginUser,
  setToken,
  setRole,
  setStatus,
  forgotPassword,
} from "../services/api.js";

// Sign In Page - logs in against the backend and stores the auth token.
export default function SignInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSending, setForgotSending] = useState(false);

  // Sign in with email + password only; the backend returns the stored role.
  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");

    try {
      const data = await loginUser({ email, password });
      setToken(data.access_token);
      setRole(data.role);
      setStatus(data.status);

      // A pending employer/coach application has no dashboard access yet.
      if (data.status === "pending") {
        navigate("/application-submitted");
        return;
      }

      // Send the user to the right dashboard based on their stored role.
      if (data.role === "student") navigate("/student/dashboard");
      else if (data.role === "employer") navigate("/employer/dashboard");
      else if (data.role === "coach") navigate("/coach/dashboard");
      else if (data.role === "admin") navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  }

  // Send a forgot-password request. The backend always replies with the same
  // safe message, so we never reveal whether the email exists.
  async function handleForgot(e) {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!forgotEmail) {
      setForgotError("Please enter your email.");
      return;
    }

    setForgotSending(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotMessage(
        res?.message ||
          "If an account exists for that email, we've sent reset instructions."
      );
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotSending(false);
    }
  }

  function closeForgot() {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");
  }

  return (
    <div>
      <Navbar />

      <div className="auth-container">
        <h1 className="auth-title">Sign In to Evolio</h1>

        <Card>
          <form onSubmit={handleLogin}>
            {/* Show an error message if validation fails */}
            {error && <p className="alert-error">{error}</p>}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {/* Forgot password link */}
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-[#001776] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit">Sign In</Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{" "}
          <Link to="/create-account" className="text-[#001776] hover:underline">
            Create one
          </Link>
        </p>
      </div>

      {/* Forgot password modal */}
      <Modal open={forgotOpen} onClose={closeForgot} title="Reset your password">
        {forgotMessage ? (
          <div>
            <p className="alert-success">{forgotMessage}</p>
            <Button onClick={closeForgot}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleForgot}>
            {forgotError && <p className="alert-error">{forgotError}</p>}
            <p className="mb-3 text-sm text-gray-500">
              Enter your account email and we'll send password reset
              instructions if it's registered.
            </p>
            <Input
              label="Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit">
              {forgotSending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
