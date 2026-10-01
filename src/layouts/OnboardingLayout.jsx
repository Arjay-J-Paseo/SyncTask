import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { LogoImage, IconHome, IconWorkspace } from '../components/icons';
import './OnboardingLayout.css';

export default function OnboardingLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const isHome = location.pathname === '/welcome';

  return (
    <div className="onboarding-app">
      <aside className="onboarding-sidebar">
        <Link className="onboarding-brand" to="/welcome" aria-label="SyncTask home">
          <LogoImage size={40} />
          <span>SyncTask</span>
        </Link>

        <nav aria-label="Main navigation">
          <Link
            className={`onboarding-nav-link ${isHome ? 'active' : ''}`}
            to="/welcome"
            aria-current={isHome ? 'page' : undefined}
          >
            <span className="onboarding-nav-icon">
              <IconHome />
            </span>
            <span>Home</span>
          </Link>

          {workspace && (
            <button
              type="button"
              className="onboarding-nav-link onboarding-dashboard-link"
              onClick={() => navigate('/dashboard')}
            >
              <span className="onboarding-nav-icon">
                <IconWorkspace />
              </span>
              <span>Back to Dashboard</span>
            </button>
          )}
        </nav>

        <p className="onboarding-sidebar-note">
          A little more organized.<br />
          A lot more together.
        </p>
      </aside>

      <main className="onboarding-main">
        <div className="onboarding-screen">
          {children}
        </div>
      </main>
    </div>
  );
}