import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Components.jsx";
import { GraduationCap, Briefcase, UserCheck, ArrowRight } from "lucide-react";

// Step 1 of sign up: choose how you want to join Evolio.
const OPTIONS = [
  {
    type: "student",
    title: "Student",
    icon: GraduationCap,
    description:
      "Build your portfolio, upload your resume, and share your work. Your account is ready right away.",
    cta: "Create student account",
  },
  {
    type: "employer",
    title: "Employer Application",
    icon: Briefcase,
    description:
      "Discover and review student talent. Employer access is granted after an admin reviews your application.",
    cta: "Apply as employer",
  },
  {
    type: "coach",
    title: "Career Coach Application",
    icon: UserCheck,
    description:
      "Guide students and review their portfolios. Coach access is granted after an admin reviews your application.",
    cta: "Apply as career coach",
  },
];

export default function AccountTypeSelectionPage() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Join Evolio</h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose the type of account you'd like to create.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => navigate(`/create-account/${opt.type}`)}
                className="group flex flex-col rounded-xl border border-[#DDE7F0] bg-white p-6 text-left shadow-sm transition hover:border-[#3199CC] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3199CC]"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#E6F2FA] text-[#001776]">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mb-2 text-lg font-semibold text-gray-800">
                  {opt.title}
                </h2>
                <p className="mb-4 flex-1 text-sm text-gray-500">
                  {opt.description}
                </p>
                <span className="flex items-center gap-1 text-sm font-medium text-[#001776] group-hover:underline">
                  {opt.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-[#001776] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
