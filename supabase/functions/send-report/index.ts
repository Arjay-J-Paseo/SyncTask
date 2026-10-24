// Supabase Edge Function: send-report
//
// Receives a problem report from the SyncTask frontend and delivers it to
// the configured support email via Resend.
//
// Security:
//   - Requires an authenticated Supabase user (JWT verified by Supabase).
//     The function checks the Authorization header and rejects requests
//     without a valid bearer token.
//   - The recipient address is hardcoded below — never trusted from the client.
//   - The Resend API key is stored in Supabase secrets (dashboard), never in
//     the function source or any frontend bundle.
//   - Validates the request body before sending.

const SUPPORT_EMAIL = 'arjaypaseo10@gmail.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReportPayload {
  feature?: string;
  problem?: string;
  details?: string;
  workspaceName?: string;
  workspaceId?: string;
  reporterName?: string;
  reporterEmail?: string;
}

function buildEmailBody(payload: ReportPayload): string {
  const lines = [
    'A new problem report was submitted through SyncTask.',
    '',
    `Feature:        ${payload.feature || '(not selected)'}`,
    `Problem:        ${payload.problem || '(empty)'}`,
    `Details:        ${payload.details || '(none)'}`,
    `Workspace:      ${payload.workspaceName || '(none)'}`,
    `Workspace ID:   ${payload.workspaceId || '(none)'}`,
    `Reported by:    ${payload.reporterName || '(unknown)'}`,
    `Reporter email: ${payload.reporterEmail || '(unknown)'}`,
    `Submitted:      ${new Date().toISOString()}`,
    '',
    '— SyncTask Automated Report',
  ];
  return lines.join('\n');
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  // --- Authentication check ---
  // Supabase functions.invoke() sends the user's JWT in the Authorization
  // header. A bare fetch() without this header gets 401.
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[send-report] rejected: missing Authorization header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Authentication required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  // Validate the Resend API key is configured.
  if (!RESEND_API_KEY) {
    console.error('[send-report] RESEND_API_KEY secret is not set');
    return new Response(
      JSON.stringify({ error: 'Email delivery is not configured. Contact the administrator.' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  let payload: ReportPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  if (!payload.feature || !payload.problem) {
    return new Response(
      JSON.stringify({ error: 'Feature and problem are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  const emailBody = buildEmailBody(payload);

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SyncTask <noreply@synctask.app>',
        to: [SUPPORT_EMAIL],
        subject: `[SyncTask Report] ${payload.feature}: ${payload.problem}`,
        text: emailBody,
      }),
    });

    const resendBody = await resendRes.text();

    if (!resendRes.ok) {
      console.error('[send-report] Resend rejected:', resendRes.status, resendBody);
      return new Response(
        JSON.stringify({ error: 'Email provider rejected the report.', detail: resendBody }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    let resendJson: { id?: string };
    try {
      resendJson = JSON.parse(resendBody);
    } catch {
      resendJson = {};
    }

    console.log('[send-report] Email accepted by Resend:', resendJson.id || '(no id)');

    return new Response(
      JSON.stringify({ ok: true, messageId: resendJson.id || null }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (err) {
    console.error('[send-report] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});