import Sidebar from "../components/Sidebar";
import "../styles/files.css";
import "../styles/tasks.css";

const COLUMNS = [
  {
    title: "To do",
    tone: "pink",
    tasks: ["Prepare the Presentation", "Draft finalised", "Brief finalised", "Create"],
  },
  {
    title: "In Progress",
    tone: "purple",
    tasks: ["Improve the design", "Finalize the mock up", "Remove unnecessary design"],
  },
  {
    title: "In Progress",
    tone: "green",
    tasks: ["Login page", "Auth copy of proposal", "Agent report"],
  },
];

export default function Tasks() {
  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <div className="crumb">Task</div>

        <header className="dash-header">
          <h1 className="files-title">Task Management</h1>
          <p className="muted">
            Track activity, streamline cleanup task, and keep your team moving forward.
          </p>
        </header>

        <section className="stat-grid">
          <Stat icon="🗒" tone="purple" value="24" label="Open Task" sub="Across all projects" />
          <Stat icon="✔" tone="green" value="8" label="Completed Task" sub="2 Created this week" />
          <Stat icon="⚠" tone="yellow" value="3" label="Overdue Task" sub="Need Attention" />
          <Stat icon="✂" tone="purple" value="7" label="Automated Assignments" sub="This week" />
        </section>

        <section className="panel cleanup-panel">
          <div className="cleanup-icon">✂</div>
          <div className="cleanup-body">
            <h3>Clean Up Task Lottery</h3>
            <p>
              Automatically assign clean-up task to inactive members. When a member
              is inactive for 3 days, SyncTask randomly assigns a cleanup task to
              help keep the team accountable and the project moving.
            </p>
            <div className="cleanup-actions">
              <button className="btn-primary">Trigger Task Lottery</button>
              <button className="btn-ghost">View inactive members</button>
            </div>
          </div>
          <div className="cleanup-side">
            <div className="panel-head">
              <h3>Latest Result</h3>
            </div>
          </div>
        </section>

        <section className="kanban">
          {COLUMNS.map((col, i) => (
            <div key={i} className={`kanban-col kanban-${col.tone}`}>
              <div className="kanban-head">{col.title}</div>
              <ul className="kanban-list">
                {col.tasks.map((t, j) => (
                  <li key={j} className="kanban-card">
                    <input type="checkbox" defaultChecked={j === 0} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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