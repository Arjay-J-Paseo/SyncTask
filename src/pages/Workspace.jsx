import { useNavigate } from 'react-router-dom';
import { IconUsers, IconPlus, IconCheckCircle } from '../components/icons';
import './Workspace.css';

export default function Workspace() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Workspaces</div>
        <h1 className="page-title">Manage your workspaces</h1>
        <p className="page-sub">Join an existing team or start a new workspace.</p>
      </div>

      <div className="ws-manage-grid">
        <button
          type="button"
          className="ws-manage-card"
          onClick={() => navigate('/workspace/join')}
        >
          <div className="ws-manage-icon">
            <IconUsers />
          </div>
          <div className="ws-manage-title">Join a workspace</div>
          <div className="ws-manage-sub">
            Use an invite code or link from your team admin.
          </div>
          <ul className="ws-manage-benefits">
            <li><IconCheckCircle /><span>Use your invite code</span></li>
            <li><IconCheckCircle /><span>Find your teammates</span></li>
            <li><IconCheckCircle /><span>Start collaborating</span></li>
          </ul>
        </button>

        <button
          type="button"
          className="ws-manage-card"
          onClick={() => navigate('/workspace/create')}
        >
          <div className="ws-manage-icon">
            <IconPlus />
          </div>
          <div className="ws-manage-title">Create a workspace</div>
          <div className="ws-manage-sub">
            Start a new shared space for your team.
          </div>
          <ul className="ws-manage-benefits">
            <li><IconCheckCircle /><span>Set up in minutes</span></li>
            <li><IconCheckCircle /><span>Invite your team</span></li>
            <li><IconCheckCircle /><span>Keep work organized</span></li>
          </ul>
        </button>
      </div>
    </div>
  );
}