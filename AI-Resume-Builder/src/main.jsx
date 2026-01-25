import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.scss';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import SignInPage from './auth/sign-in/index.jsx';
import SignUpPage from './auth/sign-up/index.jsx';
import ForgotPasswordPage from './auth/forgot-password/index.jsx';
import ResetPasswordPage from './auth/reset-password/index.jsx';
import Home from './home/index.jsx';
import Pricing from './home/Pricing.jsx';
import Dashboard from './dashboard/index.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import EditResume from './dashboard/resume/[resumeId]/edit/index.jsx';
import ViewResume from './my-resume/[resumeId]/view/index.jsx';
import AuthCallback from './auth/callback/index.jsx';
import RecruiterLayout from './recruiter/RecruiterLayout.jsx';
import RecruiterJobs from './recruiter/jobs/index.jsx';
import CreateJob from './recruiter/jobs/create.jsx';
import JobDetails from './recruiter/jobs/[id]/index.jsx';
import EditJob from './recruiter/jobs/edit.jsx';
import Candidates from './recruiter/Candidates.jsx';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!token) {
    return <Navigate to="/auth/sign-in" />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/pricing',
    element: <Pricing />,
  },
  {
    element: <App />,
    children: [
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/resume/:resumeId/edit',
        element: (
          <ProtectedRoute>
            <EditResume />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/recruiter',
    element: (
      <ProtectedRoute>
        <RecruiterLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <RecruiterJobs />, // For now, dashboard is jobs list
      },
      {
        path: 'jobs',
        element: <RecruiterJobs />,
      },
      {
        path: 'jobs/create',
        element: <CreateJob />,
      },
      {
        path: 'jobs/:id',
        element: <JobDetails />,
      },
      {
        path: 'jobs/:id/edit',
        element: <EditJob />,
      },
      {
        path: 'candidates',
        element: <Candidates />,
      },
    ],
  },
  {
    path: '/auth/sign-in',
    element: <SignInPage />,
  },
  {
    path: '/auth/sign-up',
    element: <SignUpPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/my-resume/:resumeId/view',
    element: <ViewResume />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);