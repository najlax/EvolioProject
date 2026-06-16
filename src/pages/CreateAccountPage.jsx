import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar, Card, Input, Button } from "../components/Components.jsx";
import { registerUser } from "../services/api.js";

// Create Account Page - registers a new student/employer via the backend.
export default function CreateAccountPage() {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("Student");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // All four account types can be created.
  const roles = ["Student", "Employer", "Career Coach", "Admin"];

  // Validate the form, then create the account through the backend.
  async function handleSubmit(e) {
    e.preventDefault();

    // Simple validation checks
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
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
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }

    setError("");
    try {
      await registerUser({ name, email, password, role });
      // All good - show success then redirect to sign in.
      setSuccess(true);
      setTimeout(() => navigate("/sign-in"), 1200);
    } catch (err) {
      setError(err.message || "Could not create account. Please try again.");
    }
  }

  return (
    <div>
      <Navbar />

      <div className="auth-container">
        <h1 className="auth-title">Create Your Account</h1>

        <Card>
          {/* Success message after creating account */}
          {success ? (
            <p className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
              Account created! Redirecting to sign in...
            </p>
          ) : (
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

              {/* Role selector */}
              <div className="mb-4">
                <label className="form-label">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Terms checkbox */}
              <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                I agree to the Terms and Conditions
              </label>

              <Button type="submit">Create Account</Button>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-[#001776] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
