import { Link } from 'react-router-dom';
import { IconBell, IconMenu, LogoImage } from './icons';
import Avatar from './ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';

export default function TopBar({ unreadCount = 0, onAvatarClick, onBellClick, onMenuClick }) {
  const { user } = useAuth();
  const { role } = useWorkspace();
  const roleLabel = role === 'admin' ? 'Admin' : role === 'owner' ? 'Owner' : 'Member';

  return (
    <header className="app-topbar">
      <div className="row gap-12" style={{ minWidth: 0 }}>
        <button
          className="topbar-hamburger"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <IconMenu />
        </button>
        <Link className="brand" to="/dashboard" aria-label="Go to dashboard">
          <LogoImage size={34} />
          <span>SyncTask</span>
        </Link>
      </div>

      <div className="row gap-12" style={{ flexShrink: 0 }}>
        <button
          className="btn-ghost bell-btn"
          style={{ padding: 8, borderRadius: 8 }}
          aria-label="Notifications"
          onClick={onBellClick}
        >
          <IconBell style={{ width: 24, height: 24, color: '#111' }} />
          {unreadCount > 0 && (
            <span className="bell-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={onAvatarClick}
          className="row gap-12"
          style={{ background: 'transparent', border: 'none' }}
        >
          <Avatar name={user?.full_name || '?'} size="md" variant="red" />
          <div style={{ textAlign: 'left' }} className="topbar-user-text">
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{user?.full_name || 'Loading'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{roleLabel}</div>
          </div>
        </button>
      </div>
    </header>
  );
}