import { useMemo } from "react";

const ROWS = [
  { name: "Project-Proposal.pdf", type: "PDF",  version: "v12", owner: "Mara", tags: ["Annual", "Planning"],  uploaded: "5/6", status: "Live",     size: "1.4MB", warn: false },
  { name: "Logo Design.pdf",      type: "DOCX", version: "v3",  owner: "Don",  tags: ["Design"],              uploaded: "5/6", status: "Checking", size: "2.8MB", warn: true  },
  { name: "Team Briefing.pdf",    type: "DOCX", version: "v2",  owner: "Don",  tags: ["Branding", "Internal"],uploaded: "5/6", status: "Archived", size: "2.2MB", warn: false },
  { name: "Project-Proposal.pdf", type: "PDF",  version: "v12", owner: "Mara", tags: ["Annual", "Planning"],  uploaded: "5/6", status: "Live",     size: "1.6MB", warn: true  },
  { name: "Meeting Notes.pdf",    type: "DOCX", version: "v1",  owner: "Dan",  tags: ["Planning", "Vibe"],    uploaded: "5/6", status: "Checking", size: "2.6MB", warn: false },
  { name: "Project-Proposal.pdf", type: "PDF",  version: "v12", owner: "Mara", tags: ["Annual", "Planning"],  uploaded: "5/6", status: "Live",     size: "1.6MB", warn: true  },
  { name: "Logo Design.pdf",      type: "DOCX", version: "v3",  owner: "Don",  tags: ["Design"],              uploaded: "5/6", status: "Checking", size: "1.6MB", warn: false },
  { name: "Team Briefing.pdf",    type: "DOCX", version: "v2",  owner: "Don",  tags: ["Branding", "Internal"],uploaded: "5/6", status: "Archived", size: "1.6MB", warn: false },
];

const statusClass = (s) =>
  ({
    Live: "pill pill-live",
    Checking: "pill pill-checking",
    Archived: "pill pill-archived",
  }[s] || "pill");

export default function FileTable({ query }) {
  const rows = useMemo(
    () =>
      ROWS.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <div className="table-wrap">
      <table className="file-table">
        <thead>
          <tr>
            <th></th>
            <th>File Name</th>
            <th>Type</th>
            <th>Version</th>
            <th>Owner</th>
            <th>Tags</th>
            <th>Uploaded</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.warn ? "row-warn" : ""}>
              <td><input type="checkbox" /></td>
              <td className="cell-name">
                <span className={`file-badge file-${r.type.toLowerCase()}`}>
                  {r.type}
                </span>
                {r.name}
              </td>
              <td>{r.type}</td>
              <td>{r.version}</td>
              <td>{r.owner}</td>
              <td>
                {r.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </td>
              <td>{r.uploaded}</td>
              <td><span className={statusClass(r.status)}>{r.status}</span></td>
              <td className="cell-size">{r.size}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-footer">
        <span>Showing 1-8 of 28 Files</span>
        <div className="pager">
          <button>‹</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>›</button>
        </div>
      </div>
    </div>
  );
}