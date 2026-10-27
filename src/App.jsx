import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { CandidateLayout } from './layouts/CandidateLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

import { LandingPage } from './pages/public/LandingPage.jsx';
import { JobsPage } from './pages/public/JobsPage.jsx';
import { JobDetailPage } from './pages/public/JobDetailPage.jsx';
import { NotFoundPage } from './pages/public/NotFoundPage.jsx';
// Lazy: the browse experience pulls in Framer Motion, Radix and Recharts,
// none of which the institutional portal routes need.
const BrowsePage = lazy(() =>
  import('./browse/BrowsePage.jsx').then((m) => ({ default: m.BrowsePage })),
);
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';

import { CandidateDashboard } from './pages/candidate/CandidateDashboard.jsx';
import { UploadCvPage } from './pages/candidate/UploadCvPage.jsx';
import { ProfileReviewPage } from './pages/candidate/ProfileReviewPage.jsx';
import { ProfilePage } from './pages/candidate/ProfilePage.jsx';
import { MyApplicationsPage } from './pages/candidate/MyApplicationsPage.jsx';
import { NotificationsPage } from './pages/candidate/NotificationsPage.jsx';
import { ConsentPage } from './pages/screening/ConsentPage.jsx';
import { DetailsPage } from './pages/screening/DetailsPage.jsx';
import { DeviceCheckPage } from './pages/screening/DeviceCheckPage.jsx';
import { RunnerPage } from './pages/screening/RunnerPage.jsx';
import { DonePage } from './pages/screening/DonePage.jsx';

import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminJobsPage } from './pages/admin/AdminJobsPage.jsx';
import { JobFormPage } from './pages/admin/JobFormPage.jsx';
import { JobApplicantsPage } from './pages/admin/JobApplicantsPage.jsx';
import { ApplicationDetailPage } from './pages/admin/ApplicationDetailPage.jsx';
import { AdminInterviewsPage } from './pages/admin/AdminInterviewsPage.jsx';
import { TalentPoolPage } from './pages/admin/TalentPoolPage.jsx';
import { ComparePage } from './pages/admin/ComparePage.jsx';
import { TeamPage } from './pages/admin/TeamPage.jsx';
import { CandidatesPage } from './pages/admin/CandidatesPage.jsx';
import { ActivityLogPage } from './pages/admin/ActivityLogPage.jsx';

export const App = () => (
  <Routes>
    {/* Public — the job board stays shareable; only the API is POST-only. */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/404" element={<NotFoundPage />} />
    </Route>

    {/* Candidate */}
    <Route
      element={
        <ProtectedRoute role="candidate">
          <CandidateLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<CandidateDashboard />} />
      <Route path="/profile/upload-cv" element={<UploadCvPage />} />
      <Route path="/profile/review" element={<ProfileReviewPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/applications" element={<MyApplicationsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      {/* Video screening round */}
      <Route path="/applications/:id/screening/consent" element={<ConsentPage />} />
      <Route path="/applications/:id/screening/details" element={<DetailsPage />} />
      <Route path="/applications/:id/screening/check" element={<DeviceCheckPage />} />
      <Route path="/applications/:id/screening" element={<RunnerPage />} />
      <Route path="/applications/:id/screening/done" element={<DonePage />} />
    </Route>

    {/* Staff: admin, principal and recruiter share this shell. What each can
        see inside is decided per-page, and enforced on the server. */}
    <Route
      element={
        <ProtectedRoute staffOnly>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/jobs" element={<AdminJobsPage />} />
      <Route path="/admin/jobs/new" element={<JobFormPage />} />
      <Route path="/admin/jobs/:id/edit" element={<JobFormPage />} />
      <Route path="/admin/jobs/:id/applicants" element={<JobApplicantsPage />} />
      {/* Same page without a job id: every applicant in the viewer's scope,
          reached from the dashboard counters. */}
      <Route path="/admin/applicants" element={<JobApplicantsPage />} />
      <Route path="/admin/applications/:id" element={<ApplicationDetailPage />} />
      <Route path="/admin/interviews" element={<AdminInterviewsPage />} />
      <Route path="/admin/talent-pool" element={<TalentPoolPage />} />
      <Route path="/admin/jobs/:id/compare" element={<ComparePage />} />
      {/* The candidate directory spans the whole school and offering a role is
          a hiring decision, so it is principal-and-above like Team. */}
      <Route
        path="/admin/candidates"
        element={
          <ProtectedRoute minRole="principal">
            <CandidatesPage />
          </ProtectedRoute>
        }
      />

      {/* Team management is principal-and-above; a recruiter typing this URL
          is sent back to their dashboard. The server enforces it regardless. */}
      <Route
        path="/admin/team"
        element={
          <ProtectedRoute minRole="principal">
            <TeamPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/activity" element={<ActivityLogPage />} />
    </Route>

    {/* Job-seeker browse experience — its own shell, outside the
        institutional layouts, since it carries a different visual system. */}
    <Route
      path="/browse"
      element={
        <Suspense fallback={<div className="min-h-screen bg-[#FDFCFA]" />}>
          <BrowsePage />
        </Suspense>
      }
    />

    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);
