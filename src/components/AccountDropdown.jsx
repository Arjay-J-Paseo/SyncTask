import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';
import {
  IconGear, IconUser, IconUsers, IconBell, IconCrown, IconLogout, IconTrash
} from './icons';

export default function AccountDropdown({
  onClose,
  onOpenProfile,
  onOpenLogout,
  onOpenWorkspace,
  onOpenNotifSettings,
  onLeaveWorkspace
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const items = [
    { icon: <IconUser />,  title: 'Account Setting',      sub: 'Edit your profile, email, and password', onClick: onOpenProfile },
    { icon: <IconUsers />, title: 'Workspace Setting',    sub: 'View workspace details',                 onClick: onOpenWorkspace },
    { icon: <IconBell />,  title: 'Notification Setting', sub: 'Choose what you want to be notified about', onClick: onOpenNotifSettings },
    { icon: <IconUsers />, title: 'Help & Support',       sub: 'FAQs and safety information',              onClick: () => { navigate('/help'); onClose(); } },
    { icon: <IconCrown />, title: 'Subscription',         sub: 'Manage your plan and usage',             onClick: () => { navigate('/plans'); onClose(); } }
  ];

  return (
    <div className="dropdown" role="menu">
      <div className="dropdown-profile">
        <Avatar name={user?.full_name || '?'} size="md" variant="red" />
        <div style={{ flex: 1 }}>
          <div className="dropdown-name">{user?.full_name || 'Loading'}</div>
          <div className="dropdown-email">{user?.email || ''}</div>
        </div>
        <button className="dropdown-gear" aria-label="Settings">
          <IconGear />
        </button>
      </div>

      {items.map((it, i) => (
        <button key={i} className="dropdown-item" onClick={it.onClick}>
          <span className="dropdown-icon">{it.icon}</span>
          <span className="dropdown-text">
            <div className="dropdown-item-title">{it.title}</div>
            <div className="dropdown-item-sub">{it.sub}</div>
          </span>
        </button>
      ))}

      <div className="dropdown-divider" />

      <button className="dropdown-item" onClick={onLeaveWorkspace}>
        <span className="dropdown-icon"><IconTrash /></span>
        <span className="dropdown-text">
          <div className="dropdown-item-title">Leave workspace</div>
          <div className="dropdown-item-sub">You can rejoin later with an invite</div>
        </span>
      </button>

      <button className="dropdown-item" onClick={onOpenLogout}>
        <span className="dropdown-icon"><IconLogout /></span>
        <span className="dropdown-text">
          <div className="dropdown-item-title">Log out</div>
        </span>
      </button>
    </div>
  );
}
