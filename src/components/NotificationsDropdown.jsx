import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconBell, IconTask, IconTrash } from './icons';
import ConfirmModal from './ConfirmModal';

// Maps a public.notifications row to the dropdown item shape
// (same shape as NotificationsContext.mapNotification).
function mapRowToItem(row) {
  return {
    id: row.id,
    type: row.type || 'general',
    title: row.title || 'Notification',
    sub: row.sub || '',
    read: !!row.read,
    taskId: row.task_id || null,
    actions: null,
    createdAt: row.created_at
  };
}

export default function NotificationsDropdown({
  items,
  onItemClick,
  onDelete,
  onMarkAllRead,
  onClearAll,
  onAction
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [confirmClear, setConfirmClear] = useState(false);
  const [liveItems, setLiveItems] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = mapRowToItem(payload.new);

          // Prevent duplicates by checking if notification already exists
          setLiveItems((prev) => {
            if (prev.some((n) => n.id === newNotification.id)) return prev;

            // Prepend new notification to the list
            return [newNotification, ...prev];
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or user change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Merge realtime inserts ahead of the prop list, de-duplicated by id.
  const mergedItems = [
    ...liveItems.filter((live) => !items.some((n) => n.id === live.id)),
    ...items
  ];
  const hasUnread = mergedItems.some(n => !n.read);
  const visibleItems = mergedItems;

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
            {visibleItems.length > 0 && (
              <button className="notification-header-btn danger" onClick={() => setConfirmClear(true)}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="notification-list">
          {visibleItems.length === 0 && (
            <div className="notification-empty">No notifications.</div>
          )}

          {visibleItems.map(n => (
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
        message={`All ${visibleItems.length} notification${visibleItems.length === 1 ? '' : 's'} will be removed. This cannot be undone.`}
        confirmLabel="Clear all"
        danger
      />
    </>
  );
}