import { Link } from "react-router-dom";
import { Navbar, Button } from "../components/Components.jsx";

// Shown for any unknown route (including the removed moderation page).
export default function NotFoundPage() {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="mb-2 text-5xl font-bold text-[#001776]">404</h1>
        <p className="mb-6 text-gray-600">
          Sorry, we couldn't find the page you were looking for.
        </p>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
