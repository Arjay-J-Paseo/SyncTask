import Modal from './ui/Modal';
import Button from './ui/Button';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false
}) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="confirm-modal">
        <h2 className="confirm-modal-title">{title}</h2>
        {message && <p className="confirm-modal-message">{message}</p>}
      </div>
      <div className="confirm-modal-footer">
        <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}