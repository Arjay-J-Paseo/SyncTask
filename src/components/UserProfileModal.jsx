import { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { IconCamera } from './icons';
import { describeSupabaseError } from '../utils/errors';

export default function UserProfileModal({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  const { role } = useWorkspace();
  const { push } = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  useEffect(() => {
    if (user) setName(user.full_name || '');
  }, [user, open]);

  async function handleSave() {
    if (saveLock.current || !user?.id) return;
    const fullName = name.trim();
    if (!fullName) {
      push('Name is required', 'error');
      return;
    }

    saveLock.current = true;
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      push('Profile saved', 'success');
      onClose();
    } catch (err) {
      console.error('[profile] save failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-header">User Profile</div>
      <div className="modal-body">
        <div className="row gap-20" style={{ marginTop: 6 }}>
          <Avatar name={name || '?'} size="lg" variant="red" style={{ width: 72, height: 72, fontSize: 26 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{name || 'Loading'}</div>
            <button
              type="button"
              className="chip"
              onClick={() => push('Photo upload coming later')}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <IconCamera style={{ width: 16, height: 16 }} />
              Change Photo
            </button>
          </div>
        </div>

        <div className="mt-24">
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="mt-16">
          <label className="field-label">Email</label>
          <input className="input" value={user?.email || ''} readOnly />
        </div>

        <div className="mt-16">
          <label className="field-label">Role</label>
          <input className="input" value={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unavailable'} readOnly />
        </div>
      </div>
      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="accent" onClick={handleSave} disabled={saving}>Save</Button>
      </div>
    </Modal>
  );
}