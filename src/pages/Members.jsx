import { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import MemberEditModal from '../components/MemberEditModal';
import { SkeletonCards, SkeletonList } from '../components/ui/Skeleton';
import { IconUsers, IconClock, IconCrown, IconLink, IconCopy } from '../components/icons';
import { formatDate } from '../utils/format';
import { describeSupabaseError } from '../utils/errors';
import { supabase } from '../lib/supabase';
import './Members.css';

function getMemberStatusDisplay(status) {
  const normalizedStatus = String(status || '').toLowerCase();
  const isActive = normalizedStatus === 'active';

  return {
    dotClass: isActive ? 'dot-active' : 'dot-inactive',
    color: isActive ? 'var(--success)' : 'var(--text-2)',
    label: normalizedStatus
      ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
      : 'Unknown'
  };
}

export default function Members() {
  const { push } = useToast();
  const { workspace, members, inviteCode, role, updateMember, removeMember, refresh } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(inviteCode);
  const [editingMember, setEditingMember] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const memberWriteLock = useRef(false);
  const inviteCodeLock = useRef(false);

  useEffect(() => {
    if (inviteCode) setCode(inviteCode);
  }, [inviteCode]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const activeCount = members.filter(m => m.status === 'active').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;
  const roleLabel = role === 'admin' ? 'Admin' : role === 'owner' ? 'Owner' : 'Member';

  const inviteLink = `https://synctask.app/join/${code}`;

  function copyCode() {
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    push('Invite code copied', 'success');
  }

  function copyLink() {
    if (navigator.clipboard) navigator.clipboard.writeText(inviteLink);
    push('Invite link copied', 'success');
  }

  async function createNewCode() {
    if (inviteCodeLock.current) return;
    if (!workspace?.id) {
      push('No active workspace is available for invite code generation.', 'error');
      return;
    }

    inviteCodeLock.current = true;
    setGeneratingCode(true);
    try {
      const { error } = await supabase.rpc('generate_invite_code', {
        p_workspace_id: workspace.id
      });
      if (error) throw error;

      const refreshResult = await refresh();
      if (!refreshResult?.ok) {
        throw refreshResult?.error || new Error('The new invite code could not be loaded.');
      }

      push('New invite code generated', 'success');
    } catch (err) {
      console.error('[members] invite code generation failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      inviteCodeLock.current = false;
      setGeneratingCode(false);
    }
  }

  async function handleSaveMember(id, updates) {
    if (memberWriteLock.current) return false;
    memberWriteLock.current = true;
    try {
      await updateMember(id, updates);
      push('Member role updated', 'success');
      setEditingMember(null);
      return true;
    } catch (err) {
      console.error('[members] role update failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return false;
    } finally {
      memberWriteLock.current = false;
    }
  }

  async function handleRemoveMember(id) {
    if (memberWriteLock.current) return false;
    memberWriteLock.current = true;
    try {
      await removeMember(id);
      push('Member removed', 'success');
      setEditingMember(null);
      return true;
    } catch (err) {
      console.error('[members] removal failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return false;
    } finally {
      memberWriteLock.current = false;
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Members</div>
        <h1 className="page-title">Members</h1>
        <p className="page-sub">Manage your workspace members and invite new ones.</p>
      </div>

      {loading ? (
        <>
          <SkeletonCards count={4} />
          <div className="card" style={{ marginTop: 22 }}>
            <SkeletonList rows={3} />
          </div>
        </>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-icon"><IconUsers style={{ width: 22, height: 22 }} /></div>
              <div><div className="kpi-label">Total members</div><div className="kpi-value">{members.length}</div></div>
            </div>
            <div className="kpi">
              <div className="kpi-icon" style={{ background: '#dcfce7', color: 'var(--success)' }}>
                <span className="dot dot-active" />
              </div>
              <div><div className="kpi-label">Active members</div><div className="kpi-value">{activeCount}</div></div>
            </div>
            <div className="kpi">
              <div className="kpi-icon"><IconClock style={{ width: 22, height: 22 }} /></div>
              <div><div className="kpi-label">Pending invites</div><div className="kpi-value">{pendingCount}</div></div>
            </div>
            <div className="kpi">
              <div className="kpi-icon"><IconCrown style={{ width: 22, height: 22 }} /></div>
              <div><div className="kpi-label">Workspace role</div><div className="kpi-value">{roleLabel}</div></div>
            </div>
          </div>

          <div className="members-grid">
            <div className="card">
              <div className="card-header bordered">
                <div className="card-title">Team members</div>
              </div>
              <div className="members-table">
                <div className="members-head">
                  <span>Member</span><span>Role</span><span>Joined</span>
                  <span>Last Active</span><span>Status</span>
                </div>
                {members.map(m => (
                  <div
                    key={m.id}
                    className="members-row members-row-clickable"
                    onClick={() => setEditingMember(m)}
                  >
                    <div className="members-cell-name">
                      <Avatar name={m.full_name} size="sm" />
                      <span>{m.full_name}</span>
                    </div>
                    <div className="members-role">{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</div>
                    <div className="muted">{formatDate(m.joined_at)}</div>
                    <div className="muted">{formatDate(m.last_active_at)}</div>
                    <div>
                      {(() => {
                        const statusDisplay = getMemberStatusDisplay(m.status);
                        return (
                          <>
                            <span className={`dot ${statusDisplay.dotClass}`} />{' '}
                            <span style={{ color: statusDisplay.color, fontWeight: 600, fontSize: 13 }}>
                              {statusDisplay.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <IconLink style={{ width: 30, height: 30, color: 'var(--text)' }} />
                <div className="h3 mt-12">Generate invite code</div>
                <p className="muted mt-4" style={{ fontSize: 13.5 }}>
                  Share this code or link with your team to join your workspace.
                </p>

                <div className="members-code">
                  <span>{code}</span>
                  <button className="members-code-copy" onClick={copyCode} aria-label="Copy code">
                    <IconCopy style={{ width: 18, height: 18 }} />
                  </button>
                </div>

                <div className="members-link">
                  <div className="members-link-text">{inviteLink}</div>
                </div>

                <Button variant="primary" block onClick={copyLink} style={{ marginTop: 14 }}>
                  <IconLink style={{ width: 16, height: 16 }} /> Copy Invite Link
                </Button>
                <Button variant="secondary" block onClick={copyCode} style={{ marginTop: 10 }}>
                  <IconCopy style={{ width: 16, height: 16 }} /> Copy Code Only
                </Button>
                <Button variant="secondary" block onClick={createNewCode} disabled={generatingCode} style={{ marginTop: 10 }}>
                  {generatingCode ? 'Generating...' : 'Create New Code'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <MemberEditModal
        open={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveMember}
        onRemove={handleRemoveMember}
      />
    </div>
  );
}
