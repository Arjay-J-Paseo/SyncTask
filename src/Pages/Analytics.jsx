import Sidebar from "../components/Sidebar";
import "../styles/files.css";
import "../styles/analytics.css";

const SERIES_A = [40, 55, 45, 62, 58, 70, 65, 72, 60, 68];
const SERIES_B = [30, 42, 38, 55, 60, 58, 62, 70, 55, 62];

const TABLE = [
  { task: "Finish design system", assignee: "Cham", due: "Apr 14, 2026", priority: "High", status: "In Progress" },
  { task: "Finalize design system", assignee: "Brian", due: "Apr 22, 2026", priority: "Medium", status: "Completed" },
  { task: "User testing report", assignee: "Aina", due: "Apr 27, 2026", priority: "Medium", status: "Not Started" },
];

export default function Analytics() {
  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <div className="crumb">Analytics</div>

        <header className="dash-header">
          <h1 className="files-title">Analytics &amp; Deadlines</h1>
          <p className="muted">
            Track team activity and manage approaching deadlines all in one place.
          </p>
        </header>

        <section className="stat-grid">
          <Stat icon="👥" tone="purple" value="8" label="Active members" sub="6/8 this month" />
          <Stat icon="📄" tone="purple" value="24" label="Files Uploaded" sub="From 6 files" />
          <Stat icon="✔" tone="green" value="16" label="Task Completed" sub="This week" />
          <Stat icon="🔔" tone="yellow" value="3" label="Upcoming Deadlines" sub="September" />
        </section>

        <section className="analytics-row-1">
          <div className="panel">
            <div className="panel-head">
              <h3>Team Activity Over Time</h3>
              <span className="muted">This Month</span>
            </div>
            <MiniChart />
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Team Activity Over Time</h3>
              <span className="muted">This Month</span>
            </div>
            <ul className="bar-list">
              {[["Aali", 1], ["Chanel", 6], ["Tom", 8], ["Ali", 4], ["Davi", 2]].map(([n, v]) => (
                <li key={n}>
                  <span className="bar-name">{n}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${v * 12}%` }} />
                  </div>
                  <span className="bar-value">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Upcoming Deadlines</h3>
              <span className="muted">This Month</span>
            </div>
            <CalendarMini />
          </div>
        </section>

        <section className="analytics-row-2">
          <div className="panel">
            <div className="panel-head">
              <h3>Team Health</h3>
            </div>
            <div className="health-placeholder">
              <p className="muted">Overall health, performance and activity.</p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Workflow Insights</h3>
              <span className="muted">This Week</span>
            </div>
            <div className="insight-grid">
              <Insight icon="📄" value="24" label="Files Uploaded" sub="This week" tone="purple" />
              <Insight icon="📥" value="24" label="Files Downloaded" sub="This week" tone="red" />
              <Insight icon="📄" value="24" label="Files Uploaded" sub="This week" tone="purple" />
              <Insight icon="⏱" value="24" label="Files Uploaded" sub="This week" tone="yellow" />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Files Uploaded This Week</h3>
              <span className="muted">View All</span>
            </div>
            <div className="files-empty">
              <p className="muted">No files uploaded this week.</p>
            </div>
          </div>
        </section>

        <section className="analytics-row-3">
          <div className="panel">
            <div className="panel-head">
              <h3>Team Activity Over Time</h3>
              <span className="muted">View All</span>
            </div>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((r) => (
                  <tr key={r.task}>
                    <td>{r.task}</td>
                    <td>{r.assignee}</td>
                    <td>{r.due}</td>
                    <td>
                      <span className={`pill pill-${r.priority === "High" ? "live" : "checking"}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel keep-panel">
            <h3>Keep Your Team on Task</h3>
            <p>Monitor, sync, and track all items in one place through the dashboard.</p>
            <button className="btn-primary">Explore Task</button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- helpers ---------- */

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

function MiniChart() {
  const points = (arr) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * 100},${100 - v}`).join(" ");
  return (
    <svg className="mini-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points(SERIES_A)} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
      <polyline points={points(SERIES_B)} fill="none" stroke="#22c55e" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarMini() {
  return (
    <div className="calendar">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <div key={i} className="cal-head">{d}</div>
      ))}
      {Array.from({ length: 28 }, (_, i) => (
        <div key={i} className={`cal-cell ${i === 12 ? "active" : ""}`}>
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function Insight({ icon, value, label, sub, tone }) {
  return (
    <div className="insight">
      <div className={`stat-icon stat-${tone}`}>{icon}</div>
      <div className="insight-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}