import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import PathwayPage from './pages/PathwayPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

import ProfilePage from './pages/ProfilePage';
import OnboardFlow from './pages/onboard/OnboardFlow';
import UploadStep from './pages/onboard/UploadStep';
import JobPickerStep from './pages/onboard/JobPickerStep';
import GapStep from './pages/onboard/GapStep';
import RoadmapStep from './pages/onboard/RoadmapStep';

import AnalyticsPage from './pages/admin/AnalyticsPage';
import UsersPage from './pages/admin/UsersPage';
import AdminJobsPage from './pages/admin/JobsPage';
import AdminCoursesPage from './pages/admin/CoursesPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/jobs', element: <JobsPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/pathway/:id', element: <PathwayPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },

      // Onboarding flow — protected, nested
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/onboard',
            element: <OnboardFlow />,
            children: [
              { index: true, element: <UploadStep /> },
              { path: 'job', element: <JobPickerStep /> },
              { path: 'gap', element: <GapStep /> },
              { path: 'roadmap', element: <RoadmapStep /> },
            ],
          },
        ],
      },

      // Fallback
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },

  // Admin routes — standalone layout (no public Navbar/Footer)
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AnalyticsPage /> },
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/jobs', element: <AdminJobsPage /> },
          { path: '/admin/courses', element: <AdminCoursesPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
