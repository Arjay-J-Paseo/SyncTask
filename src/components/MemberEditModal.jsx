import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Select from './ui/Select';
import Avatar from './ui/Avatar';
import ConfirmModal from './ConfirmModal';

export default function MemberEditModal({ open, member, onClose, onSave, onRemove }) {
  const [role, setRole] = useState('member');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role || 'member');
      setConfirmRemove(false);
    }
  }, [member]);

  if (!member) return null;

  const isOwner = member.role === 'owner';

  function handleSave() {
    onSave(member.id, { role });
  }

  function handleConfirmRemove() {
    onRemove(member.id);
    setConfirmRemove(false);
  }

  return (
    <>
      <Modal open={open && !confirmRemove} onClose={onClose} maxWidth={520}>
        <div className="member-edit">
          <div className="member-edit-header">
            <div className="member-edit-title">Edit Member</div>
          </div>

          <div className="member-edit-profile">
            <Avatar name={member.full_name} size="lg" />
            <div>
              <div className="member-edit-name">{member.full_name}</div>
              <div className="member-edit-email">{member.email}</div>
            </div>
          </div>

          <div className="member-edit-body">
            <Select
              id="member-role"
              name="role"
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isOwner}
            >
              <option value="member">Member — can view and edit tasks</option>
              <option value="admin">Admin — can manage workspace</option>
              <option value="owner">Owner — full control</option>
            </Select>

            {isOwner && (
              <p className="member-edit-note">
                The workspace owner&apos;s role cannot be changed.
              </p>
            )}

            <div className="member-edit-info">
              <div className="member-edit-info-row">
                <span className="member-edit-info-label">Status</span>
                <span className="member-edit-info-value">
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </span>
              </div>
              <div className="member-edit-info-row">
                <span className="member-edit-info-label">Joined</span>
                <span className="member-edit-info-value">
                  {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="member-edit-footer">
            {!isOwner && (
              <Button variant="danger" onClick={() => setConfirmRemove(true)}>
                Remove
              </Button>
            )}
            <div className="row gap-12">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={isOwner}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleConfirmRemove}
        title="Remove this member?"
        message={`${member.full_name} will lose access to the workspace.`}
        confirmLabel="Remove"
        danger
      />
    </>
  );
}