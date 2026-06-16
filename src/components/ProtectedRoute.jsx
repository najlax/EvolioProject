import { Navigate } from "react-router-dom";
import { getToken } from "../services/api.js";

// Guards private pages: if there is no auth token, send the user to sign in.
export default function ProtectedRoute({ children }) {
  if (!getToken()) {
    return <Navigate to="/sign-in" replace />;
  }
  return children;
}
