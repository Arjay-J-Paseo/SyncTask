export default function ProgressRing({ value = 0, size = 130, thickness = 16, color = 'var(--accent)' }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = `${(pct / 100) * c} ${c}`;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#e5e5ea" strokeWidth={thickness} fill="none" />
      {pct > 0 && (
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={thickness}
          fill="none" strokeDasharray={dash} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      )}
    </svg>
  );
}