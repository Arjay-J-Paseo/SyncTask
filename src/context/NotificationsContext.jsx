import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { describeSupabaseError } from '../utils/errors';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationsContext = createContext(null);

// notifications columns: id, user_id, workspace_id, type, title, sub, task_id, read, created_at
// There is no `actions` column, so DB rows simply render without action buttons.
function mapNotification(row) {
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

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { push } = useToast();

  // push() gets a new identity every time a toast renders; holding it in a ref
  // keeps refresh() stable so the load effect cannot loop.
  const pushRef = useRef(push);
  pushRef.current = push;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: loadErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (loadErr) throw loadErr;

      setNotifications((data || []).map(mapNotification));
    } catch (err) {
      console.error('[notifications] load failed:', describeSupabaseError(err), err);
      setNotifications([]);
      setError(describeSupabaseError(err));
      pushRef.current(describeSupabaseError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh().catch(err => {
      console.error('[notifications] refresh rejected:', err);
    });
  }, [refresh]);

  // Resolves true when the row was written, null when it failed.
  async function addNotification({ type, title, sub, taskId = null, workspaceId = null, userId = null } = {}) {
    if (!user) {
      console.error('[notifications] insert skipped: no authenticated user');
      return null;
    }

    const payload = {
      user_id: userId || user.id,
      workspace_id: workspaceId,
      type: type || 'general',
      title: title || 'Notification',
      sub: sub || '',
      task_id: taskId,
      read: false
    };

    try {
      const { error: insErr } = await supabase.from('notifications').insert(payload);

      if (insErr) throw insErr;

      // Re-read so the list mirrors the database rather than a local guess.
      await refresh();
      return true;
    } catch (err) {
      console.error('[notifications] insert failed:', describeSupabaseError(err), err, payload);
      push(describeSupabaseError(err), 'error');
      return null;
    }
  }

  async function markAsRead(id) {
    if (!user) return false;

    try {
      const { error: updErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updErr) throw updErr;

      setNotifications(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
      return true;
    } catch (err) {
      console.error('[notifications] markAsRead failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return false;
    }
  }

  async function markAllAsRead() {
    if (!user) return false;

    try {
      const { error: updErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (updErr) throw updErr;

      setNotifications(list => list.map(n => ({ ...n, read: true })));
      return true;
    } catch (err) {
      console.error('[notifications] markAllAsRead failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return false;
    }
  }

  async function deleteNotification(id) {
    if (!user) return false;

    try {
      const { error: delErr } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) throw delErr;

      setNotifications(list => list.filter(n => n.id !== id));
      return true;
    } catch (err) {
      console.error('[notifications] delete failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return false;
    }
  }

  async function clearAll() {
    if (!user) return false;

    try {
      const { error: delErr } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (delErr) throw delErr;

      setNotifications([]);
      return true;
    } catch (err) {
      console.error('[notifications] clearAll failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return false;
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationsProvider');
  return ctx;
}