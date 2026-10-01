export default function Avatar({ name = '', size = 'md', variant, src, style }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 1).join('').toUpperCase() || '?';
  const cls = `avatar avatar-${size} ${variant ? `avatar-${variant}` : ''}`;
  return (
    <span className={cls} style={style}>
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  );
}