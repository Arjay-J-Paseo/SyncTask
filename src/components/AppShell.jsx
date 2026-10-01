import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import AccountDropdown from './AccountDropdown';
import UserProfileModal from './UserProfileModal';
import LogoutConfirmModal from './LogoutConfirmModal';
import WorkspaceInfoModal from './WorkspaceInfoModal';
import NotificationSettingsModal from './NotificationSettingsModal';
import NotificationsDropdown from './NotificationsDropdown';
import ConfirmModal from './ConfirmModal';
import DataErrorBanner from './DataErrorBanner';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { describeSupabaseError } from '../utils/errors';

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const { signOut } = useAuth();
  const { leaveWorkspace } = useWorkspace();
  const {
    notifications,
    unreadCount,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutLock = useRef(false);
  const leaveLock = useRef(false);

  async function confirmLogout() {
    if (logoutLock.current) return;
    logoutLock.current = true;
    try {
      await signOut();
      setLogoutOpen(false);
      push('Logged out', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('[appShell] sign out failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      logoutLock.current = false;
    }
  }

  async function confirmLeave() {
    if (leaveLock.current) return;
    leaveLock.current = true;
    try {
      await leaveWorkspace();
      setLeaveOpen(false);
      push('Left workspace', 'success');
      navigate('/welcome', { replace: true });
    } catch (err) {
      console.error('[appShell] leave workspace failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      leaveLock.current = false;
    }
  }

  function handleNotifAction(id, actionKey) {
    if (actionKey === 'follow-up') push('Follow-up sent to Marie (mock)', 'success');
    else if (actionKey === 'assign') push('Opening task assignment… (mock)', 'success');
    deleteNotification(id);
  }

  return (
    <div className="app-shell">
      <TopBar
        unreadCount={unreadCount}
        onAvatarClick={() => { setMenuOpen(o => !o); setBellOpen(false); setMobileMenuOpen(false); }}
        onBellClick={() => {
          setBellOpen(o => !o);
          setMenuOpen(false);
          setMobileMenuOpen(false);
          // Re-read on open so notifications created elsewhere appear (no Realtime yet).
          refreshNotifications();
        }}
        onMenuClick={() => { setMobileMenuOpen(o => !o); setMenuOpen(false); setBellOpen(false); }}
      />

      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)}
               style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <AccountDropdown
            onClose={() => setMenuOpen(false)}
            onOpenProfile={() => { setMenuOpen(false); setProfileOpen(true); }}
            onOpenWorkspace={() => { setMenuOpen(false); setWorkspaceOpen(true); }}
            onOpenNotifSettings={() => { setMenuOpen(false); setNotifSettingsOpen(true); }}
            onOpenLogout={() => { setMenuOpen(false); setLogoutOpen(true); }}
            onLeaveWorkspace={() => { setMenuOpen(false); setLeaveOpen(true); }}
          />
        </>
      )}

      {bellOpen && (
        <>
          <div onClick={() => setBellOpen(false)}
               style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <NotificationsDropdown
            items={notifications}
            onItemClick={(notif) => {
              markAsRead(notif.id);
              setBellOpen(false);
              if (notif.taskId) navigate(`/tasks?task=${notif.taskId}`);
            }}
            onDelete={(id) => deleteNotification(id)}
            onMarkAllRead={markAllAsRead}
            onClearAll={clearAll}
            onAction={handleNotifAction}
          />
        </>
      )}

      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="app-body">
        <Sidebar mobileOpen={mobileMenuOpen} onNavigate={() => setMobileMenuOpen(false)} />
        <main className="app-main">
          <DataErrorBanner />
          {children}
        </main>
      </div>

      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
      {workspaceOpen && (
        <>
          <div onClick={() => setWorkspaceOpen(false)}
               style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <WorkspaceInfoModal open={workspaceOpen} />
        </>
      )}
      <NotificationSettingsModal
        open={notifSettingsOpen}
        onClose={() => setNotifSettingsOpen(false)}
      />
      <ConfirmModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={confirmLeave}
        title="Leave this workspace?"
        message="You'll lose access to all tasks, files, and members. You can rejoin later with an invite code."
        confirmLabel="Leave"
        danger
      />
    </div>
  );
}