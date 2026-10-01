import { IconUsers, IconCrown, IconClock, IconLink } from './icons';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { formatDate } from '../utils/format';

export default function WorkspaceInfoModal({ open }) {
  const { workspace, role, members, inviteCode } = useWorkspace();
  const roleLabel = role === 'admin' ? 'Admin' : role === 'owner' ? 'Owner' : 'Member';
  const createdAt = workspace?.created_at ? new Date(workspace.created_at) : null;
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? formatDate(workspace.created_at)
    : 'Unavailable';

  if (!open) return null;

  return (
    <div className="workspace-info-dropdown" role="menu">
      <div className="workspace-info-header">
        <div className="workspace-info-title">Workspace Information</div>
        <p className="workspace-info-sub">Details about your current workspace.</p>
      </div>

      <div className="workspace-info-list">
        <div className="workspace-info-row">
          <div className="workspace-info-icon"><IconUsers /></div>
          <div className="workspace-info-body">
            <div className="workspace-info-label">Workspace name</div>
            <div className="workspace-info-value">
              <span className="workspace-info-name">{workspace?.name || 'Unavailable'}</span>
              <span className="workspace-info-badge">Private</span>
            </div>
          </div>
        </div>

        <div className="workspace-info-row">
          <div className="workspace-info-icon"><IconUsers /></div>
          <div className="workspace-info-body">
            <div className="workspace-info-label">Members</div>
            <div className="workspace-info-value">
              <span className="workspace-info-name">{members.length}</span>
            </div>
          </div>
        </div>

        <div className="workspace-info-row">
          <div className="workspace-info-icon"><IconLink /></div>
          <div className="workspace-info-body">
            <div className="workspace-info-label">Invite code</div>
            <div className="workspace-info-value">
              <span className="workspace-info-name">{inviteCode || 'Unavailable'}</span>
            </div>
          </div>
        </div>

        <div className="workspace-info-row">
          <div className="workspace-info-icon"><IconCrown /></div>
          <div className="workspace-info-body">
            <div className="workspace-info-label">Your Role</div>
            <div className="workspace-info-value">
              <span className="workspace-info-name">{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="workspace-info-row">
          <div className="workspace-info-icon"><IconClock /></div>
          <div className="workspace-info-body">
            <div className="workspace-info-label">Created</div>
            <div className="workspace-info-value">
              <span className="workspace-info-name">{createdLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
