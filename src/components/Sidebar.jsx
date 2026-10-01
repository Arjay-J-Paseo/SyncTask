import { NavLink } from 'react-router-dom';
import {
  IconHome, IconFile, IconTask, IconUsers, IconVibe, IconChart, IconWorkspace
} from './icons';

const NAV = [
  { to: '/dashboard', label: 'Home',         icon: <IconHome /> },
  { to: '/files',     label: 'Files',        icon: <IconFile /> },
  { to: '/tasks',     label: 'Task',         icon: <IconTask /> },
  { to: '/members',   label: 'Members',      icon: <IconUsers /> },
  { to: '/vibes',     label: 'Vibe Checks',  icon: <IconVibe /> },
  { to: '/analytics', label: 'Analytics',    icon: <IconChart /> }
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {NAV.map(n => (
        <NavLink
          key={n.to}
          to={n.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate()}
        >
          {n.icon}
          <span>{n.label}</span>
        </NavLink>
      ))}

      <div className="sidebar-divider" />

      <NavLink
        to="/workspace"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        onClick={() => onNavigate && onNavigate()}
      >
        <IconWorkspace />
        <span>Workspace</span>
      </NavLink>
    </aside>
  );
}