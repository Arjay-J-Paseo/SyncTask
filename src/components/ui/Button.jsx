export default function Button({
  children, variant = 'primary', size, block, type = 'button', ...rest
}) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', block && 'btn-block']
    .filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest}>{children}</button>;
}