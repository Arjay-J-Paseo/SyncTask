import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUsers, IconPlus } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { describeSupabaseError } from '../utils/errors';
import './Workspace.css';

export default function Workspace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace, myWorkspaces, myWorkspacesError, loading, refresh } = useWorkspace();
  const [selectingWorkspaceId, setSelectingWorkspaceId] = useState(null);
  const [selectionError, setSelectionError] = useState('');
  const createdWorkspaces = myWorkspaces.filter(item => item.owner_id === user?.id);
  const joinedWorkspaces = myWorkspaces.filter(item => item.owner_id !== user?.id);

  async function selectWorkspace(item) {
    if (selectingWorkspaceId) return;
    setSelectingWorkspaceId(item.id);
    setSelectionError('');
    try {
      const result = await refresh(item.id);
      if (!result?.ok) throw result?.error || new Error('Workspace could not be loaded.');
      navigate('/dashboard');
    } catch (error) {
      setSelectionError(describeSupabaseError(error));
    } finally {
      setSelectingWorkspaceId(null);
    }
  }

  function renderWorkspaceList(items, emptyText) {
    if (items.length === 0) return <p className="muted">{emptyText}</p>;

    return (
      <div className="ws-workspace-list">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className="ws-workspace-item"
            onClick={() => selectWorkspace(item)}
            disabled={!!selectingWorkspaceId || workspace?.id === item.id}
            aria-current={workspace?.id === item.id ? 'true' : undefined}
          >
            <span className="ws-workspace-name">{item.name}</span>
            <span className="ws-workspace-meta">
              {selectingWorkspaceId === item.id
                ? 'Loading…'
                : workspace?.id === item.id
                  ? 'Current workspace'
                  : item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Workspace</h1>
        <p className="page-sub">Create or join workspace</p>
      </div>

      <section className="ws-existing-workspaces">
        <h2 className="ws-section-title">Existing Workspaces</h2>
        {selectionError && <p className="ws-list-error" role="alert">{selectionError}</p>}
        {loading ? (
          <p className="muted" role="status">Loading workspaces…</p>
        ) : myWorkspacesError ? (
          <p className="ws-list-error" role="alert">
            {import.meta.env.DEV
              ? describeSupabaseError(myWorkspacesError)
              : 'Could not load your workspaces. Please try again.'}
          </p>
        ) : (
          <div className="ws-workspace-groups">
            <div className="ws-workspace-group">
              <h3 className="ws-group-title">Workspaces I Created</h3>
              {renderWorkspaceList(createdWorkspaces, 'No workspaces created yet.')}
            </div>
            <div className="ws-workspace-group">
              <h3 className="ws-group-title">Workspaces I Joined</h3>
              {renderWorkspaceList(joinedWorkspaces, 'No joined workspaces yet.')}
            </div>
          </div>
        )}
      </section>

      <section className="ws-create-join">
        <h2 className="ws-section-title">Create your own workspace or join now</h2>
        <div className="ws-manage-grid">
          <button
            type="button"
            className="ws-manage-card"
            onClick={() => navigate('/workspace/create')}
          >
            <div className="ws-manage-icon">
              <IconPlus />
            </div>
            <div className="ws-manage-title">Create Workspace</div>
            <div className="ws-manage-sub">
              Start a new shared space for your team.
            </div>
            <span className="ws-manage-action">Create Workspace</span>
          </button>

          <button
            type="button"
            className="ws-manage-card"
            onClick={() => navigate('/workspace/join')}
          >
            <div className="ws-manage-icon">
              <IconUsers />
            </div>
            <div className="ws-manage-title">Join Workspace</div>
            <div className="ws-manage-sub">
              Use an invite code or link from your team admin.
            </div>
            <span className="ws-manage-action">Join Workspace</span>
          </button>
        </div>
      </section>
    </>
  );
}
