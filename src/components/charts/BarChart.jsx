export default function BarChart({
  data = [],
  height = 260,
  yTicks = [0, 5, 10, 15],
  empty,
  emptyMessage = 'Task activity will appear here as your team starts working.'
}) {
  const max = Math.max(...yTicks, ...data.map(d => d.value), 1);
  const chartH = height - 40;

  if (empty) {
    return (
      <div style={{ position: 'relative', height }}>
        <svg width="100%" height={chartH} style={{ position: 'absolute', inset: '0 0 40px 0' }}>
          {[0,1,2].map(i => (
            <rect key={i} x="45%" y={chartH * 0.35 + i * 20} width={22 + i * 6} height={40 - i * 5}
              rx="10" fill="#e5e5ea" />
          ))}
        </svg>
        <div style={{
          position: 'absolute', top: chartH / 2 + 20, left: '50%', transform: 'translateX(-50%)',
          color: 'var(--text-2)', fontSize: 14, whiteSpace: 'nowrap'
        }}>{emptyMessage}</div>
        <div style={{
          position: 'absolute', bottom: 0, left: 40, right: 0,
          display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`,
          fontSize: 13, color: 'var(--text-2)', textAlign: 'center'
        }}>
          {data.map(d => <div key={d.day}>{d.day}</div>)}
        </div>
        <div style={{
          position: 'absolute', top: 0, bottom: 40, left: 0, width: 30,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontSize: 13, color: 'var(--text-2)'
        }}>
          {[...yTicks].reverse().map(t => <div key={t}>{t}</div>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height }}>
      <div style={{ position: 'absolute', top: 0, bottom: 40, left: 0, width: 30,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        fontSize: 13, color: 'var(--text-2)' }}>
        {[...yTicks].reverse().map(t => <div key={t}>{t}</div>)}
      </div>
      <div style={{ position: 'absolute', left: 40, right: 0, top: 6, bottom: 40,
        display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, alignItems: 'end', gap: 12 }}>
        {data.map(d => (
          <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '62%', background: 'var(--accent)', borderRadius: '6px 6px 0 0',
              height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 40, right: 0, bottom: 0,
        display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, textAlign: 'center',
        fontSize: 13, color: 'var(--text-2)' }}>
        {data.map(d => <div key={d.day}>{d.day}</div>)}
      </div>
    </div>
  );
}
