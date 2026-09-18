const VERSIONS = [
  {
    version: "v3.1",
    author: "Ashley Diaz",
    date: "Apr 8, 2026, 10:24 AM",
    note: "Update UI components and added new screens.",
    color: "#22c55e",
  },
  {
    version: "v3.1",
    author: "Ashley Diaz",
    date: "Apr 8, 2026, 10:24 AM",
    note: "Update UI components and added new screens.",
    color: "#3b82f6",
  },
  {
    version: "v3.1",
    author: "Ashley Diaz",
    date: "Apr 8, 2026, 10:24 AM",
    note: "Update UI components and added new screens.",
    color: "#7c3aed",
  },
  {
    version: "v3.1",
    author: "Ashley Diaz",
    date: "Apr 8, 2026, 10:24 AM",
    note: "Update UI components and added new screens.",
    color: "#f59e0b",
  },
  {
    version: "v3.1",
    author: "Ashley Diaz",
    date: "Apr 8, 2026, 10:24 AM",
    note: "Update UI components and added new screens.",
    color: "#a855f7",
  },
];

export default function VersionHistory() {
  return (
    <div className="panel side-panel">
      <div className="panel-head">
        <h3>Version History</h3>
        <a href="#" className="link-purple">View All</a>
      </div>

      <ul className="vh-list">
        {VERSIONS.map((v, i) => (
          <li key={i} className="vh-item">
            <span className="vh-dot" style={{ background: v.color }} />
            <div className="vh-body">
              <div className="vh-version">{v.version}</div>
              <div className="vh-author">{v.author}</div>
              <div className="vh-date">{v.date}</div>
              <div className="vh-note">{v.note}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="vh-banner">
        <span className="vh-banner-icon">✓</span>
        <div>
          <div className="vh-banner-title">Version tracking is automatic</div>
          <div className="vh-banner-text">
            Every time you upload a new version, SyncTask automatically
            increments the version number and saves a timestamp.
          </div>
        </div>
      </div>
    </div>
  );
}