/**
 * Helpers for surfacing Supabase/PostgREST errors.
 *
 * Supabase returns errors as plain objects shaped like:
 *   { message, code, details, hint }
 * They are NOT Error instances, so `err.message` alone loses `code`,
 * `details` and `hint` — which is usually where the real reason lives
 * (e.g. code 22P02 = invalid input syntax, 42501 = RLS denied).
 */

/** Turn any thrown value into one readable line, keeping code/details/hint. */
export function describeSupabaseError(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;

  const message = error.message || 'Unknown database error';
  if (!error.code && !error.details && !error.hint) return message;

  const parts = [error.code ? `[${error.code}]` : null, message];
  if (error.details) parts.push(`details: ${error.details}`);
  if (error.hint) parts.push(`hint: ${error.hint}`);
  return parts.filter(Boolean).join(' ');
}

/** Keep every field a Supabase error carries, for logs and the dev banner. */
export function toErrorInfo(name, error) {
  return {
    name,
    code: error?.code || null,
    message: error?.message || 'Unknown database error',
    details: error?.details || null,
    hint: error?.hint || null
  };
}

/**
 * Inspect `[ ['queryName', response], ... ]` pairs from Supabase calls and
 * report every call whose `error` is set.
 * Returns `null` when all of them succeeded.
 */
export function collectQueryFailures(entries) {
  const failures = entries
    .filter(([, response]) => response && response.error)
    .map(([name, response]) => toErrorInfo(name, response.error));

  if (failures.length === 0) return null;

  return {
    message: `Failed to load workspace data — ${failures
      .map(f => `${f.name}: ${f.code ? f.code + ' ' : ''}${f.message}`)
      .join(' | ')}`,
    failures,
    at: new Date().toISOString()
  };
}

/** Normalise any thrown value into the shape `error` state expects. */
export function toLoadError(error) {
  if (error && typeof error === 'object' && Array.isArray(error.failures) && error.message) {
    return error;
  }

  return {
    message: describeSupabaseError(error),
    failures: Array.isArray(error?.failures) ? error.failures : [],
    at: new Date().toISOString()
  };
}
