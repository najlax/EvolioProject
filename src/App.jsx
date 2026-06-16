import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public pages
import LandingPage from "./pages/LandingPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import PublicPortfolioPage from "./pages/PublicPortfolioPage.jsx";

// Student pages
import StudentDashboard from "./pages/StudentDashboard.jsx";
import ProfileEditorPage from "./pages/ProfileEditorPage.jsx";
import ResumeUploadPage from "./pages/ResumeUploadPage.jsx";
import ProjectsListPage from "./pages/ProjectsListPage.jsx";
import AddEditProjectPage from "./pages/AddEditProjectPage.jsx";
import PortfolioPreviewPage from "./pages/PortfolioPreviewPage.jsx";
import ReviewWorkflowPage from "./pages/ReviewWorkflowPage.jsx";

// Employer pages
import EmployerLoginPage from "./pages/EmployerLoginPage.jsx";
import EmployerDashboard from "./pages/EmployerDashboard.jsx";
import PortfolioViewerPage from "./pages/PortfolioViewerPage.jsx";
import ProjectDetailsPage from "./pages/ProjectDetailsPage.jsx";
import EmployerMessagingPage from "./pages/EmployerMessagingPage.jsx";

// Career coach pages
import CoachDashboard from "./pages/CoachDashboard.jsx";
import PortfolioReviewPage from "./pages/PortfolioReviewPage.jsx";
import StudentProgressPage from "./pages/StudentProgressPage.jsx";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import EmployerManagementPage from "./pages/EmployerManagementPage.jsx";
import CoachManagementPage from "./pages/CoachManagementPage.jsx";
import ContentModerationPage from "./pages/ContentModerationPage.jsx";
import SystemSettingsPage from "./pages/SystemSettingsPage.jsx";

// App holds all of our routes in one place.
// Each Route connects a URL path to a page component.
export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/create-account" element={<CreateAccountPage />} />
      <Route path="/portfolio/:token" element={<PublicPortfolioPage />} />

      {/* Student routes (require a logged-in user) */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute>
            <ProfileEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/resume"
        element={
          <ProtectedRoute>
            <ResumeUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects"
        element={
          <ProtectedRoute>
            <ProjectsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects/new"
        element={
          <ProtectedRoute>
            <AddEditProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects/:projectId/edit"
        element={
          <ProtectedRoute>
            <AddEditProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/portfolio"
        element={
          <ProtectedRoute>
            <PortfolioPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/review"
        element={
          <ProtectedRoute>
            <ReviewWorkflowPage />
          </ProtectedRoute>
        }
      />

      {/* Employer routes */}
      <Route path="/employer/login" element={<EmployerLoginPage />} />
      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
      <Route path="/employer/portfolio/:studentId" element={<PortfolioViewerPage />} />
      <Route
        path="/employer/portfolio/:studentId/project/:projectId"
        element={<ProjectDetailsPage />}
      />
      <Route path="/employer/messages" element={<EmployerMessagingPage />} />

      {/* Career coach routes */}
      <Route path="/coach/dashboard" element={<CoachDashboard />} />
      <Route path="/coach/review/:studentId" element={<PortfolioReviewPage />} />
      <Route path="/coach/progress" element={<StudentProgressPage />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/employers" element={<EmployerManagementPage />} />
      <Route path="/admin/coaches" element={<CoachManagementPage />} />
      <Route path="/admin/moderation" element={<ContentModerationPage />} />
      <Route path="/admin/settings" element={<SystemSettingsPage />} />
    </Routes>
  );
}
