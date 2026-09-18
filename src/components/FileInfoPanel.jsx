export default function FileInfoPanel() {
  return (
    <div className="panel side-panel">
      <h3>File Information</h3>

      <dl className="info-list">
        <div>
          <dt>Owner</dt>
          <dd>
            <span className="owner-dot" />
            Ashley Diaz
          </dd>
        </div>

        <div>
          <dt>Current Version</dt>
          <dd>v3.1</dd>
        </div>

        <div>
          <dt>File Size</dt>
          <dd>28.4 MB</dd>
        </div>

        <div>
          <dt>Uploaded</dt>
          <dd>Apr 8, 2026 10:24 AM</dd>
        </div>

        <div>
          <dt>Location</dt>
          <dd>Research &amp; Design</dd>
        </div>

        <div>
          <dt>Tags</dt>
          <dd className="info-tags">
            <span className="tag">Design</span>
            <span className="tag">UI</span>
            <button className="add-tag">+ Add tag</button>
          </dd>
        </div>
      </dl>
    </div>
  );
}