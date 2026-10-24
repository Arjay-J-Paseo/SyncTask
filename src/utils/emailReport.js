/**
 * Client-side helper for submitting a problem report to the SyncTask
 * support Edge Function.
 *
 * Uses supabase.functions.invoke() so the user's active session JWT and the
 * project's anon key are supplied automatically. This avoids the 401 that
 * occurs when calling the function URL with a bare fetch() and no auth headers.
 *
 * The recipient address is hardcoded server-side — the browser never
 * supplies it.
 */

import { supabase } from '../lib/supabase';

function errorMessageFromBody(body) {
  if (!body || typeof body !== 'object') return '';

  let detail = body.detail;
  if (typeof detail === 'string') {
    try {
      detail = JSON.parse(detail);
    } catch {
      // Resend details may also be plain text.
    }
  }

  if (detail && typeof detail === 'object') {
    return detail.message || detail.error || body.error || body.message || '';
  }
  return detail || body.error || body.message || '';
}

/**
 * Submit a problem report. Returns `{ ok: true }` only when the Edge Function
 * confirms the email was accepted by Resend.
 *
 * @param {object} payload
 * @param {string} payload.feature
 * @param {string} payload.problem
 * @param {string} [payload.details]
 * @param {string} [payload.workspaceName]
 * @param {string} [payload.workspaceId]
 * @param {string} [payload.reporterName]
 * @param {string} [payload.reporterEmail]
 * @returns {Promise<{ok: boolean, messageId?: string|null, error?: string}>}
 */
export async function submitReport(payload) {
  if (!payload.feature || !payload.problem) {
    return { ok: false, error: 'Feature and problem are required.' };
  }

  let result;
  try {
    result = await supabase.functions.invoke('send-report', {
      body: payload,
    });
  } catch (err) {
    return { ok: false, error: 'Network error: ' + (err instanceof Error ? err.message : String(err)) };
  }

  // supabase.functions.invoke returns { data, error }.
  // A 401 from the function appears as an error with a non-null error.
  if (result.error) {
    const response = result.error.context || result.response;
    let responseBody;
    if (response?.clone) {
      try {
        responseBody = await response.clone().json();
      } catch {
        try {
          responseBody = { error: await response.clone().text() };
        } catch {
          responseBody = null;
        }
      }
    }

    const status = response?.status || result.error.status || result.error.statusCode;
    const msg = errorMessageFromBody(responseBody) || result.error.message || String(result.error);
    return { ok: false, error: status ? `HTTP ${status}: ${msg}` : msg };
  }

  const data = result.data;
  if (!data) {
    return { ok: false, error: 'Empty response from server.' };
  }

  // The Edge Function returns { ok: true, messageId } on success.
  if (data.ok === true) {
    return { ok: true, messageId: data.messageId ?? null };
  }

  // The function returned a JSON body with ok != true (e.g. Resend rejected).
  const detail = errorMessageFromBody(data);
  return { ok: false, error: detail || 'Report delivery failed.' };
}
