import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar, Card, Input, Button } from "../components/Components.jsx";
import { loginUser, setToken, setRole, setStatus } from "../services/api.js";

// Employer Login Page - a login form just for employers.
export default function EmployerLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Real login against the backend. Only employer (or admin) accounts may use
  // the employer area; everyone else is told to use the normal sign in.
  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");

    try {
      const data = await loginUser({ email, password });
      if (data.status === "pending") {
        setError(
          "Your employer application is still pending admin approval."
        );
        return;
      }
      if (data.role !== "employer" && data.role !== "admin") {
        setError("This account is not an employer. Please use the normal sign in.");
        return;
      }
      setToken(data.access_token);
      setRole(data.role);
      setStatus(data.status);
      navigate("/employer/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  }

  return (
    <div>
      <Navbar />

      <div className="auth-container">
        <h1 className="auth-title">Employer Login</h1>

        <Card>
          <form onSubmit={handleLogin}>
            {error && <p className="alert-error">{error}</p>}

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button type="submit">Login as Employer</Button>
          </form>
        </Card>

        {/* Links to the other auth pages */}
        <div className="mt-4 space-y-1 text-center text-sm text-gray-500">
          <p>
            New employer?{" "}
            <Link to="/create-account" className="text-[#001776] hover:underline">
              Create Account
            </Link>
          </p>
          <p>
            Not an employer?{" "}
            <Link to="/sign-in" className="text-[#001776] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
