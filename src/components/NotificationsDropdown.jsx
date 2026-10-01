import { useState } from 'react';
import { IconUser, IconBell, IconTask, IconTrash } from './icons';
import ConfirmModal from './ConfirmModal';

export default function NotificationsDropdown({
  items,
  onItemClick,
  onDelete,
  onMarkAllRead,
  onClearAll,
  onAction
}) {
  const hasUnread = items.some(n => !n.read);
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    onClearAll();
    setConfirmClear(false);
  }

  function handleItemClick(n) {
    if (!n.read) onItemClick && onItemClick(n);
  }

  return (
    <>
      <div className="notification-dropdown" role="menu">
        <div className="notification-header">
          <div className="notification-title">Notifications</div>
          <div className="notification-header-actions">
            {hasUnread && (
              <button className="notification-header-btn" onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button className="notification-header-btn danger" onClick={() => setConfirmClear(true)}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="notification-list">
          {items.length === 0 && (
            <div className="notification-empty">No notifications.</div>
          )}

          {items.map(n => (
            <div
              key={n.id}
              className={`notification-item ${n.read ? 'read' : ''} ${n.taskId ? 'notification-clickable' : ''}`}
              onClick={() => handleItemClick(n)}
            >
              <div className="notification-avatar">
                {n.type === 'task' && <IconTask style={{ width: 16, height: 16 }} />}
                {n.type === 'member' && <IconUser style={{ width: 16, height: 16 }} />}
                {n.type === 'general' && <IconBell style={{ width: 16, height: 16 }} />}
              </div>

              <div className="notification-body">
                <div className="notification-line-title">
                  {n.title}
                  {!n.read && <span className="notification-unread-dot" />}
                </div>
                <div className="notification-line-sub">{n.sub}</div>

                {n.actions && n.actions.length > 0 && (
                  <div className="notification-actions">
                    {n.actions.map((action, i) => (
                      <button
                        key={i}
                        className={`notification-action-btn ${action.variant === 'primary' ? 'primary' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction && onAction(n.id, action.key);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="notification-delete"
                aria-label="Delete notification"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(n.id);
                }}
              >
                <IconTrash style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClear}
        title="Clear all notifications?"
        message={`All ${items.length} notification${items.length === 1 ? '' : 's'} will be removed. This cannot be undone.`}
        confirmLabel="Clear all"
        danger
      />
    </>
  );
}