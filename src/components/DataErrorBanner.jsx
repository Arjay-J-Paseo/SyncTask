import { useWorkspace } from '../context/MockWorkspaceContext';

/**
 * Surfaces failed Supabase queries instead of letting them pass as empty data.
 * Always shows the failing query name + Postgres code/message in the UI;
 * the extra `details` / `hint` fields are shown in development only.
 */
export default function DataErrorBanner() {
  const { error, refresh, loading } = useWorkspace();

  if (!error) return null;

  const isDev = import.meta.env.DEV;

  return (
    <div className="data-error-banner" role="alert">
      <div className="data-error-banner-body">
        <div className="data-error-banner-title">
          Couldn&apos;t load all workspace data
        </div>
        <div className="data-error-banner-message">{error.message}</div>

        {isDev && error.failures?.length > 0 && (
          <ul className="data-error-banner-list">
            {error.failures.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <strong>{f.name}</strong>
                {f.code ? ` · ${f.code}` : ''} — {f.message}
                {f.details ? ` · details: ${f.details}` : ''}
                {f.hint ? ` · hint: ${f.hint}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="data-error-banner-retry"
        onClick={() => refresh()}
        disabled={loading}
      >
        {loading ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}
