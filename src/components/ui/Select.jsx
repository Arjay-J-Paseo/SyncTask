export default function Select({ label, error, hint, id, children, ...rest }) {
  const selId = id || rest.name;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={selId}>{label}</label>}
      <select id={selId} className={`select ${error ? 'error' : ''}`} {...rest}>{children}</select>
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}