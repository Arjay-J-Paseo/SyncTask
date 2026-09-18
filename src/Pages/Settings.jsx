import Sidebar from "../components/Sidebar";
import "../styles/files.css";

export default function Settings() {
  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <div className="crumb">Settings</div>

        <header className="dash-header">
          <h1 className="files-title">Settings</h1>
          <p className="muted">
            Manage your workspace preferences and account details.
          </p>
        </header>

        <div className="panel">
          <div className="panel-head">
            <h3>Workspace</h3>
          </div>
          <p className="muted">Settings options coming soon.</p>
        </div>
      </main>
    </div>
  );
}