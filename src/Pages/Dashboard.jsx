import Sidebar from "../components/Sidebar";
import "../styles/files.css";
import "../styles/dashboard.css";

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

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

function ProjectFlow() {
  const stages = [
    { label: "Share Files",   color: "#a78bfa" },
    { label: "Monitor Inactivity", color: "#8b5cf6" },
    { label: "Upload",        color: "#7c3aed" },
    { label: "Review",        color: "#6366f1" },
    { label: "Team Chat",     color: "#3b82f6" },
    { label: "Checking",      color: "#3b82f6" },
    { label: "Assign Tasks",  color: "#22c55e" },
    { label: "Vibe Check",    color: "#22c55e" },
    { label: "Meeting",       color: "#64748b" },
    { label: "Analyze",       color: "#64748b" },
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Project Flow</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <p className="panel-sub">Your project progresses through synced flow.</p>
      <div className="flow">
        {stages.map((s, i) => (
          <div key={i} className="flow-step">
            <span className="flow-dot" style={{ background: s.color }} />
            <span className="flow-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentProjectFiles() {
  const files = [
    { name: "Project-Proposal.pdf",  version: "v12", uploaded: "5/6",  owner: "Mara" },
    { name: "Team Briefing.pdf",     version: "v2",  uploaded: "5/6",  owner: "Don" },
    { name: "Logo Design.pdf",       version: "v3",  uploaded: "5/6",  owner: "Dan" },
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Recent Project Files</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <table className="mini-table">
        <thead>
          <tr>
            <th>File name</th>
            <th>Version</th>
            <th>Uploaded</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f, i) => (
            <tr key={i}>
              <td className="cell-name">
                <span className="file-badge file-pdf">PDF</span> {f.name}
              </td>
              <td>{f.version}</td>
              <td>{f.uploaded}</td>
              <td>{f.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InactiveMembers() {
  const members = [
    { name: "Ashleen",  initial: "A" },
    { name: "Magaram", initial: "M" },
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Inactive Members</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <div className="inactive-head">
        <span className="inactive-count">2</span>
        <span className="muted">Members inactive for 24 days</span>
      </div>
      <ul className="member-list">
        {members.map((m) => (
          <li key={m.name}>
            <span className="avatar">{m.initial}</span>
            <span className="member-name">{m.name}</span>
            <button className="btn-notify">Notify</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamSyncTask() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Team SyncTask</h3>
        <a href="#" className="link-purple">View Details</a>
      </div>
      <div className="team-body">
        <div className="team-star">★</div>
        <div>
          <div className="team-score">3.8/5</div>
          <div className="muted">Team's Performance</div>
        </div>
      </div>
    </div>
  );
}

function UpcomingDeadlines() {
  const items = [
    { label: "Feature checkup", date: "September 15", tone: "red" },
    { label: "Design review",   date: "September 20", tone: "purple" },
    { label: "Presentation",    date: "September 26", tone: "yellow" },
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Upcoming Deadlines</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <div className="deadline-summary">
        <span className="deadline-icon">⏰</span>
        <div>
          <div className="deadline-count">3</div>
          <div className="muted">Tasks due soon — stay on track!</div>
        </div>
      </div>
      <ul className="deadline-list">
        {items.map((d) => (
          <li key={d.label}>
            <span className={`dot-bullet dot-${d.tone}`} />
            <span className="deadline-label">{d.label}</span>
            <span className="muted">{d.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskAssignments() {
  const tasks = [
    { name: "API integration",  date: "September 9", by: "Ali" },
    { name: "UI development",   date: "September 9", by: "Ali" },
    { name: "Coding for task",  date: "September 9", by: "Aina" },
    { name: "UI design",        date: "September 9", by: "Aira" },
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Task Assignments</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <div className="task-count">
        <span className="task-icon">🗒</span>
        <div>
          <div className="task-number">4</div>
          <div className="muted">Total assigned tasks</div>
        </div>
      </div>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.name}>
            <input type="checkbox" />
            <span className="task-name">{t.name}</span>
            <span className="muted task-date">{t.date}</span>
            <span className="avatar avatar-sm">{t.by[0]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Recent Activity</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <div className="activity-empty">
        <p className="muted">No recent activity to show.</p>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Dashboard() {
  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <div className="crumb">Dashboard</div>

        <header className="dash-header">
          <h1 className="files-title">Welcome back, Paul!</h1>
          <p className="muted">
            Here's what's happening with your tasks and project today.
          </p>
        </header>

        <section className="stat-grid">
          <Stat icon="📄" tone="purple" value="24" label="Project Files"      sub="Across all teams" />
          <Stat icon="👥" tone="blue"   value="8"  label="Team Members"       sub="2 joined this week" />
          <Stat icon="✔"  tone="green"  value="9"  label="Project Files"      sub="2 Created this week" />
          <Stat icon="🔔" tone="yellow" value="3"  label="Upcoming Deadlines" sub="1 Due this week" />
        </section>

        <section className="dash-row-2">
          <ProjectFlow />
          <RecentProjectFiles />
        </section>

        <section className="dash-row-3">
          <InactiveMembers />
          <TeamSyncTask />
          <UpcomingDeadlines />
        </section>

        <section className="dash-row-2">
          <TaskAssignments />
          <RecentActivity />
        </section>
      </main>
    </div>
  );
}