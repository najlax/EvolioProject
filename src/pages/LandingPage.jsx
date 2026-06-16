import { Link } from "react-router-dom";
import { Navbar, Button, Card } from "../components/Components.jsx";
import { Rocket, Users, Eye, FileText, MessageSquare, Share2 } from "lucide-react";

// Landing Page - the first page people see at "/"
export default function LandingPage() {
  return (
    <div>
      <Navbar />

      {/* Hero section - clean, with one clear primary action.
          Subtle navy->teal tint keeps it light and on-brand. */}
      <section className="bg-gradient-to-br from-[#F8FAFC] via-white to-[#E1F4F7] px-6 py-24 text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold text-[#001776] md:text-5xl">
          Build and Share Your{" "}
          <span className="text-[#199DB2]">Student Portfolio</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-500">
          Evolio helps students create a profile, upload a resume, add projects,
          get review feedback, and share their portfolio with employers.
        </p>

        {/* A single clean call to action */}
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/create-account">
            <Button>Get Started Free</Button>
          </Link>
          <Link to="/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Features section (anchor: #features) */}
      <section id="features" className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">Features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <Rocket className="mb-3 h-8 w-8 text-[#001776]" />
            <h3 className="font-semibold text-gray-800">Showcase Projects</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your best work with GitHub and demo links.
            </p>
          </Card>
          <Card>
            <Users className="mb-3 h-8 w-8 text-[#199DB2]" />
            <h3 className="font-semibold text-gray-800">Get Feedback</h3>
            <p className="mt-1 text-sm text-gray-500">
              Career coaches review your portfolio and help you improve.
            </p>
          </Card>
          <Card>
            <Eye className="mb-3 h-8 w-8 text-[#3199CC]" />
            <h3 className="font-semibold text-gray-800">Get Discovered</h3>
            <p className="mt-1 text-sm text-gray-500">
              Employers find you and reach out about jobs.
            </p>
          </Card>
        </div>
      </section>

      {/* How it works section (anchor: #how-it-works) */}
      <section id="how-it-works" className="bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <FileText className="mb-3 h-8 w-8 text-[#001776]" />
              <h3 className="font-semibold text-gray-800">1. Create your profile</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your details, skills, and upload your resume.
              </p>
            </Card>
            <Card>
              <MessageSquare className="mb-3 h-8 w-8 text-[#199DB2]" />
              <h3 className="font-semibold text-gray-800">2. Get reviewed</h3>
              <p className="mt-1 text-sm text-gray-500">
                A career coach reviews your portfolio and gives feedback.
              </p>
            </Card>
            <Card>
              <Share2 className="mb-3 h-8 w-8 text-[#3199CC]" />
              <h3 className="font-semibold text-gray-800">3. Share it</h3>
              <p className="mt-1 text-sm text-gray-500">
                Publish your portfolio and share it with employers.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* For teams section (anchor: #for-teams) */}
      <section id="for-teams" className="mx-auto max-w-4xl px-6 py-12">
        <Card className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">For Teams</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Bootcamps, coaches, and employers use Evolio to track student progress,
            review portfolios, and discover new talent - all in one place.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/coach/dashboard">
              <Button variant="outline">Coach Dashboard</Button>
            </Link>
            <Link to="/employer/dashboard">
              <Button variant="teal">Employer Dashboard</Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Simple footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-6 text-center text-sm text-gray-400">
        © 2026 Evolio - A student bootcamp project
      </footer>
    </div>
  );
}
