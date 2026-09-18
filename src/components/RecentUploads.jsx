const UPLOADS = [
  { name: "Logo Design.pdf",      version: "v3", type: "DOCX" },
  { name: "Team Briefing.pdf",    version: "v2", type: "DOCX" },
  { name: "Project-Proposal.pdf", version: "v1", type: "PDF"  },
  { name: "Project-Proposal.pdf", version: "v4", type: "PDF"  },
];

export default function RecentUploads() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Recent Uploads</h3>
        <a href="#" className="link-purple">View All</a>
      </div>
      <ul className="upload-list">
        {UPLOADS.map((u, i) => (
          <li key={i}>
            <span className={`file-badge file-${u.type.toLowerCase()}`}>
              {u.type}
            </span>
            <span className="upload-name">{u.name}</span>
            <span className="upload-version">{u.version}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}