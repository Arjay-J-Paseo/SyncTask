export default function Textarea({ label, error, hint, id, ...rest }) {
  const taId = id || rest.name;
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={taId}>{label}</label>}
      <textarea id={taId} className={`textarea ${error ? 'error' : ''}`} {...rest} />
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}