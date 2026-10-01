import Modal from './ui/Modal';
import Button from './ui/Button';
import { IconLogout } from './icons';

export default function LogoutConfirmModal({ open, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="logout-modal">
        <div className="logout-modal-icon">
          <IconLogout style={{ width: 52, height: 52, color: '#dc2626' }} />
        </div>
        <h2 className="logout-modal-title">Are you sure you want to log out?</h2>
        <p className="logout-modal-sub">
          You will need to log in again to access your account/workspace.
        </p>
      </div>
      <div className="logout-modal-footer">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Log out</Button>
      </div>
    </Modal>
  );
}