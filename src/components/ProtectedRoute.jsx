import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';

export default function ProtectedRoute({
  children,
  requireWorkspace = false,
  denyIfWorkspace = false
}) {
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();
  const location = useLocation();

  if (authLoading || (user && wsLoading)) {
    return (
      <div style={{ padding: 40, color: 'var(--text-2)', textAlign: 'center' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireWorkspace && !workspace) {
    return <Navigate to="/welcome" replace />;
  }

  if (denyIfWorkspace && workspace) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}