import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MockWorkspaceProvider } from './context/MockWorkspaceContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ActivityProvider } from './context/ActivityContext';
import { ToastProvider } from './context/ToastContext';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import OnboardingLayout from './layouts/OnboardingLayout';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/MockWorkspaceContext';

import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Welcome from './pages/Welcome';
import CreateWorkspace from './pages/CreateWorkspace';
import JoinWorkspace from './pages/JoinWorkspace';
import Workspace from './pages/Workspace';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Tasks from './pages/Tasks';
import AssignManually from './pages/AssignManually';
import AutoAssign from './pages/AutoAssign';
import Members from './pages/Members';
import VibeChecks from './pages/VibeChecks';
import Analytics from './pages/Analytics';
import HelpSupport from './pages/HelpSupport';
import Plans from './pages/Plans';
import NotFound from './pages/NotFound';

function PlansRoute() {
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: workspaceLoading } = useWorkspace();

  if (authLoading || (user && workspaceLoading)) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  }

  if (user && workspace) {
    return <AppShell><Plans /></AppShell>;
  }

  return (
    <main style={{ padding: 'clamp(18px, 2.5vw, 32px)', maxWidth: 1600, minWidth: 0, margin: '0 auto' }}>
      <Plans />
    </main>
  );
}

function LoginRoute() {
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: workspaceLoading, error, refresh } = useWorkspace();

  function retryWorkspaceLoad() {
    refresh().catch(loadError => {
      console.error('[loginRoute] workspace retry rejected:', loadError);
    });
  }

  if (authLoading || (user && workspaceLoading)) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) return <AuthLayout><Login /></AuthLayout>;

  let hasPlanSelection = false;
  try {
    hasPlanSelection = !!sessionStorage.getItem('synctask:selectedPlan');
  } catch {
    // Continue to the normal workspace route if session storage is unavailable.
  }

  if (hasPlanSelection) return <Navigate to="/plans" replace />;
  if (workspace) return <Navigate to="/dashboard" replace />;

  if (error) {
    return (
      <main className="auth-page">
        <section className="auth-card" role="alert">
          <p>Workspace information could not be loaded: {error.message}</p>
          <button className="auth-submit" type="button" onClick={retryWorkspaceLoad}>
            Retry
          </button>
        </section>
      </main>
    );
  }

  return <Navigate to="/workspace/create" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <ActivityProvider>
              <MockWorkspaceProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />

                  <Route path="/signup" element={<AuthLayout><SignUp /></AuthLayout>} />
                  <Route path="/login" element={<LoginRoute />} />
                  <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                  <Route path="/plans" element={<PlansRoute />} />

                  <Route
                    path="/welcome"
                    element={
                      <ProtectedRoute denyIfWorkspace>
                        <OnboardingLayout><Welcome /></OnboardingLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workspace/create"
                    element={
                      <ProtectedRoute>
                        <OnboardingLayout><CreateWorkspace /></OnboardingLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workspace/join"
                    element={
                      <ProtectedRoute>
                        <OnboardingLayout><JoinWorkspace /></OnboardingLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route element={
                    <ProtectedRoute requireWorkspace>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/tasks/new/manual" element={<AssignManually />} />
                    <Route path="/tasks/new/auto" element={<AutoAssign />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/vibes" element={<VibeChecks />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/help" element={<HelpSupport />} />
                    <Route path="/workspace" element={<Workspace />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MockWorkspaceProvider>
            </ActivityProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
