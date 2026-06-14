import { timingSafeEqual } from 'node:crypto';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

// Verifies internal portal access against INTERNAL_PORTAL_ACCESS_CODE.
// Returns 503 when the secret is not set (no fallback open access).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Rate limited to slow brute-forcing of INTERNAL_PORTAL_ACCESS_CODE.
  if (!(await checkRateLimit(req, 'verify-portal-access', 10, 60))) {
    return rateLimitResponse();
  }

  const requiredCode = Deno.env.get('INTERNAL_PORTAL_ACCESS_CODE');
  if (!requiredCode) {
    // Deny all access when the env var is not configured. Granting unconditional
    // access when the secret is missing would be a production security hole.
    console.error('[verifyPortalAccess] INTERNAL_PORTAL_ACCESS_CODE is not set — denying all access.');
    return Response.json(
      { granted: false, reason: 'Portal access is not configured on this deployment.' },
      { status: 503, headers: corsHeaders },
    );
  }

  const body = await req.json().catch(() => ({}));
  // Constant-time comparison so response timing can't be used to infer the
  // access code character-by-character. timingSafeEqual requires equal-length
  // buffers, so guard the length first (length is far less useful to leak).
  const provided = new TextEncoder().encode(String(body.code ?? ''));
  const expected = new TextEncoder().encode(requiredCode);
  const codeValid = provided.length === expected.length && timingSafeEqual(provided, expected);
  if (!codeValid) {
    return Response.json({ granted: false, reason: 'Invalid access code.' }, { status: 403, headers: corsHeaders });
  }

  return Response.json({ granted: true }, { headers: corsHeaders });
});
