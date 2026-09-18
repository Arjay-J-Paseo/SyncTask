import Sidebar from "../components/Sidebar";
import "../styles/files.css";
import "../styles/members.css";

const TEAM = [
  { name: "Aden P.", email: "aden.p@gmail.com", role: "Owner", status: "Member", files: 0, joined: "August 15, 2026", active: "12 mins" },
  { name: "Samantha L.", email: "samantha.l@gmail.com", role: "Member", status: "Active", files: 0, joined: "August 15, 2026", active: "12 mins" },
  { name: "Ashlee B.", email: "ashlee.b@gmail.com", role: "Member", status: "Active", files: 0, joined: "August 15, 2026", active: "4 days" },
  { name: "Racheal L.", email: "racheal.l@gmail.com", role: "Member", status: "Active", files: 2, joined: "August 17, 2026", active: "1 min" },
  { name: "Matthew P.", email: "matthew.p@gmail.com", role: "Member", status: "Active", files: 5, joined: "August 15, 2026", active: "4 days" },
  { name: "Mora B.", email: "mora.b@gmail.com", role: "Member", status: "Pending", files: 3, joined: "August 25, 2026", active: "1 min" },
];

const ACTIVITY = [
  { name: "Michael L.", text: "Signed in and was active", time: "5 mins ago", action: "Notify" },
  { name: "Samantha L.", text: "No activity for 4 days", time: "4 days ago", action: "Notify" },
  { name: "Mora B.", text: "Hasn't logged in yet", time: "1 min ago", action: "Activate" },
];

export default function Members() {
  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <div className="crumb">Members</div>

        <header className="dash-header">
          <h1 className="files-title">Members &amp; Inactivity</h1>
          <p className="muted">
            Manage your team's activity, roles, and keep everyone engaged.
          </p>
        </header>

        <section className="stat-grid">
          <Stat icon="👥" tone="purple" value="8" label="Team members" sub="Total Members" />
          <Stat icon="✔" tone="green" value="4" label="Active members" sub="Active in 3 days" />
          <Stat icon="✓" tone="blue" value="1" label="Inactive" sub="No activity" />
          <Stat icon="⏳" tone="yellow" value="1" label="Pending" sub="Need approval" />
        </section>

        <section className="members-row">
          <div className="panel invite-panel">
            <h3>Invite Members</h3>
            <p>Invite new member to join the team.</p>
            <div className="invite-row">
              <input className="search-input" placeholder="Add email to send invite" />
              <button className="btn-primary">Copy Link</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Activity Monitor</h3>
            </div>
            <ul className="activity-list">
              {ACTIVITY.map((a, i) => (
                <li key={i}>
                  <span className="avatar">{a.name[0]}</span>
                  <div className="activity-body">
                    <div className="activity-name">{a.name}</div>
                    <div className="muted">{a.text}</div>
                  </div>
                  <span className="muted activity-time">{a.time}</span>
                  <button className="btn-notify">{a.action}</button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="members-row">
          <div className="panel">
            <div className="panel-head">
              <h3>Team Members</h3>
              <a href="#" className="link-purple">View All</a>
            </div>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Members</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Contributions</th>
                  <th>Join Date</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {TEAM.map((m) => (
                  <tr key={m.email}>
                    <td>
                      <div className="member-cell">
                        <span className="avatar">{m.name[0]}</span>
                        <div>
                          <div>{m.name}</div>
                          <div className="muted">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{m.role}</td>
                    <td>
                      <span className="pill pill-live">{m.status}</span>
                    </td>
                    <td>{m.files} files</td>
                    <td>{m.joined}</td>
                    <td className="muted">{m.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Recent Notification</h3>
              <a href="#" className="link-purple">View All</a>
            </div>
            <ul className="notif-list">
              <li>
                <span className="avatar">A</span>
                <span className="notif-name">Aden P.</span> joined the workspace
                <span className="muted">— 10m ago</span>
              </li>
              <li>
                <span className="avatar">A</span>
                <span className="notif-name">Ashlee B.</span> has been inactive for 4 days
                <span className="muted">— 2hr ago</span>
              </li>
              <li>
                <span className="avatar">D</span>
                <span className="notif-name">David</span> assigned new task "Fix payment bug"
                <span className="muted">— 12h ago</span>
              </li>
              <li>
                <span className="avatar">A</span>
                <span className="notif-name">Ali</span> gave a good comment on design revision
                <span className="muted">— 1d ago</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, tone, value, label, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-${tone}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}