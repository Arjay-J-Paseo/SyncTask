import { useState } from "react";
import Sidebar from "../components/Sidebar";
import FileTable from "../components/FileTable";
import RecentUploads from "../components/RecentUploads";
import StorageUsage from "../components/StorageUsage";
import FileInfoPanel from "../components/FileInfoPanel";
import VersionHistory from "../components/VersionHistory";
import "../styles/files.css";

export default function Files() {
  const [query, setQuery] = useState("");

  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <header className="files-header">
          <h1 className="files-title">Files</h1>
          <button className="btn-primary">
            <span className="btn-icon">↑</span> Upload Files
          </button>
        </header>

        <section className="dropzone">
          <div className="dropzone-icon">⤒</div>
          <p className="dropzone-text">Drag &amp; Drop files here</p>
        </section>

        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search files"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="filter"><option>All File Types</option></select>
          <select className="filter"><option>All Members</option></select>
          <select className="filter"><option>All Pages</option></select>
          <select className="filter"><option>Last Upload</option></select>
          <select className="filter"><option>Sorted by Name</option></select>
        </div>

        <FileTable query={query} />

        <div className="bottom-row">
          <RecentUploads />
          <StorageUsage />
        </div>
      </main>

      <aside className="files-side">
        <div className="file-card">
          <div className="file-card-top">
            <div className="file-card-icon">📄</div>
            <div className="file-card-meta">
              <div className="file-card-name">Design Mockup.fig</div>
              <div className="file-card-sub">UI/UX design files</div>
            </div>
            <span className="file-card-badge">FIG</span>
          </div>
          <div className="file-card-actions">
            <button className="btn-open">Open File ↗</button>
            <button className="btn-more">More Actions ▾</button>
          </div>
        </div>

        <FileInfoPanel />
        <VersionHistory />
      </aside>
    </div>
  );
}