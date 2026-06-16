import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar, Card, Input, Button } from "../components/Components.jsx";

// Employer Login Page - a login form just for employers (mock only).
export default function EmployerLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    // Basic validation
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    // Send the employer to their dashboard
    navigate("/employer/dashboard");
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
