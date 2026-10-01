import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { IconPlus, IconUsers, IconCheckCircle } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import './Onboarding.css';

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = (user?.full_name || 'there').split(' ')[0];

  return (
    <div className="welcome">
      <h1 className="welcome-title">Welcome to SyncTask, {firstName}!</h1>
      <p className="welcome-sub">
        Create a workspace for your team or join an existing one to get started.
      </p>

      <div className="welcome-cards">
        <div className="welcome-card">
          <div className="welcome-card-icon">
            <IconPlus style={{ width: 26, height: 26 }} />
          </div>
          <div className="welcome-card-title">Create Workspace</div>
          <p className="welcome-card-desc">
            Start a new shared space for your team to manage files, tasks, deadlines, and
            collaboration all in one place.
          </p>
          <Button variant="primary" size="lg" block onClick={() => navigate('/workspace/create')}>
            Create Workspace
          </Button>
          <ul className="welcome-benefits">
            <li><IconCheckCircle style={{ width: 18, height: 18, color: 'var(--accent)' }} /><span>Set up in minutes</span></li>
            <li><IconCheckCircle style={{ width: 18, height: 18, color: 'var(--accent)' }} /><span>Invite your team</span></li>
            <li><IconCheckCircle style={{ width: 18, height: 18, color: 'var(--accent)' }} /><span>Keep work organized</span></li>
          </ul>
        </div>

        <div className="welcome-card">
          <div className="welcome-card-icon">
            <IconUsers style={{ width: 26, height: 26 }} />
          </div>
          <div className="welcome-card-title">Join Workspace</div>
          <p className="welcome-card-desc">
            Join an existing team using an invite code or invite link from your team admin
            or a colleague.
          </p>
          <Button variant="primary" size="lg" block onClick={() => navigate('/workspace/join')}>
            Join Workspace
          </Button>
          <ul className="welcome-benefits">
            <li><IconCheckCircle style={{ width: 18, height: 18, color: 'var(--accent)' }} /><span>Set up in minutes</span></li>
            <li><IconCheckCircle style={{ width: 18, height: 18, color: 'var(--accent)' }} /><span>Quick and easy</span></li>
            <li><IconCheckCircle style={{ width: 18, height: 18, color: 'var(--accent)' }} /><span>Start collaborating</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}