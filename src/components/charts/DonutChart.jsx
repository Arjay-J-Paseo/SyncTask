// Simple SVG donut: takes segments [{value, color}]
export default function DonutChart({ segments = [], size = 220, thickness = 32, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} stroke="#e5e5ea" strokeWidth={thickness} fill="none" />
        {centerLabel && (
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fill="#6b6b72">{centerLabel}</text>
        )}
      </svg>
    );
  }

  let offset = 0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} stroke="#f0f0f3" strokeWidth={thickness} fill="none" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dash = `${len} ${c - len}`;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} stroke={s.color} strokeWidth={thickness}
            fill="none" strokeDasharray={dash} strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        );
        offset += len;
        return el;
      })}
      {centerLabel && (
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fill="#111114" fontWeight="600">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}