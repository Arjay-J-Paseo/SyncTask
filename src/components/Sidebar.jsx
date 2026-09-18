import { NavLink } from "react-router-dom";

const NAV = [
  { label: "Home",        icon: "⌂", to: "/dashboard" },
  { label: "Files",       icon: "🗀", to: "/files" },
  { label: "Task",        icon: "☑", to: "/tasks" },
  { label: "Members",     icon: "👥", to: "/members" },
  { label: "Vibe Checks", icon: "◔", to: "/vibe-checks" },
  { label: "Analytics",   icon: "📊", to: "/analytics" },
  { label: "Settings",    icon: "⚙", to: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">S</div>
        <span className="brand-name">SyncTask</span>
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}