export default function StorageUsage() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Storage Usage</h3>
        <a href="#" className="link-purple">Manage Storage</a>
      </div>

      <div className="storage-total">
        <strong>3.4GB</strong> of 7.5GB used <span className="muted">· 45%</span>
      </div>

      <div className="storage-bar">
        <div className="storage-fill" style={{ width: "45%" }} />
      </div>

      <div className="storage-grid">
        <div><span className="dot dot-purple" /> Documents <span className="muted">1.2GB</span></div>
        <div><span className="dot dot-teal"   /> Archives  <span className="muted">400MB</span></div>
        <div><span className="dot dot-pink"   /> Images    <span className="muted">400MB</span></div>
        <div><span className="dot dot-green"  /> Other     <span className="muted">320MB</span></div>
      </div>
    </div>
  );
}