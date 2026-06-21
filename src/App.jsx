import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public pages
import LandingPage from "./pages/LandingPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import AccountTypeSelectionPage from "./pages/AccountTypeSelectionPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ApplicationSubmittedPage from "./pages/ApplicationSubmittedPage.jsx";
import PublicPortfolioPage from "./pages/PublicPortfolioPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

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
import AdminApplicationsPage from "./pages/AdminApplicationsPage.jsx";
import SystemSettingsPage from "./pages/SystemSettingsPage.jsx";

// App holds all of our routes in one place.
// Each Route connects a URL path to a page component.
// Dashboard pages are guarded by ProtectedRoute (login + role check); the
// backend re-checks every request, so these guards are just for UX.
export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/create-account" element={<AccountTypeSelectionPage />} />
      <Route path="/create-account/:type" element={<RegisterPage />} />
      <Route path="/application-submitted" element={<ApplicationSubmittedPage />} />
      <Route path="/portfolio/:token" element={<PublicPortfolioPage />} />

      {/* Student routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute roles={["student"]}>
            <ProfileEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/resume"
        element={
          <ProtectedRoute roles={["student"]}>
            <ResumeUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects"
        element={
          <ProtectedRoute roles={["student"]}>
            <ProjectsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects/new"
        element={
          <ProtectedRoute roles={["student"]}>
            <AddEditProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects/:projectId/edit"
        element={
          <ProtectedRoute roles={["student"]}>
            <AddEditProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/portfolio"
        element={
          <ProtectedRoute roles={["student"]}>
            <PortfolioPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/review"
        element={
          <ProtectedRoute roles={["student"]}>
            <ReviewWorkflowPage />
          </ProtectedRoute>
        }
      />

      {/* Employer routes */}
      <Route path="/employer/login" element={<EmployerLoginPage />} />
      <Route
        path="/employer/dashboard"
        element={
          <ProtectedRoute roles={["employer", "admin"]}>
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/portfolio/:studentId"
        element={
          <ProtectedRoute roles={["employer", "admin"]}>
            <PortfolioViewerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/portfolio/:studentId/project/:projectId"
        element={
          <ProtectedRoute roles={["employer", "admin"]}>
            <ProjectDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/messages"
        element={
          <ProtectedRoute roles={["employer", "admin"]}>
            <EmployerMessagingPage />
          </ProtectedRoute>
        }
      />

      {/* Career coach routes */}
      <Route
        path="/coach/dashboard"
        element={
          <ProtectedRoute roles={["coach", "admin"]}>
            <CoachDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/review/:studentId"
        element={
          <ProtectedRoute roles={["coach", "admin"]}>
            <PortfolioReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/progress"
        element={
          <ProtectedRoute roles={["coach", "admin"]}>
            <StudentProgressPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employers"
        element={
          <ProtectedRoute roles={["admin"]}>
            <EmployerManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coaches"
        element={
          <ProtectedRoute roles={["admin"]}>
            <CoachManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminApplicationsPage />
          </ProtectedRoute>
        }
      />
      {/* Old role-requests path -> applications, so existing links still work. */}
      <Route
        path="/admin/role-requests"
        element={<Navigate to="/admin/applications" replace />}
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={["admin"]}>
            <SystemSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* The moderation page was removed: redirect any old links safely. */}
      <Route
        path="/admin/moderation"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      {/* Catch-all: clean 404 instead of a blank page. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
