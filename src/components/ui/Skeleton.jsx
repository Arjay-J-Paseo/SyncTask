export function SkeletonList({ rows = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton-circle" />
          <div className="skeleton-col">
            <div className="skeleton" style={{ width: '60%', height: 14 }} />
            <div className="skeleton" style={{ width: '40%', height: 11, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}
