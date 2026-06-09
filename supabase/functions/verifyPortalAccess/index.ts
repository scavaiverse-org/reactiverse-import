import { corsHeaders } from '../_shared/cors.ts';

// Verifies internal portal access. Checks INTERNAL_PORTAL_ACCESS_CODE if set;
// otherwise grants access unconditionally (same behaviour as the Base44 original).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const requiredCode = Deno.env.get('INTERNAL_PORTAL_ACCESS_CODE');
  if (requiredCode) {
    const body = await req.json().catch(() => ({}));
    if (body.code !== requiredCode) {
      return Response.json({ granted: false, reason: 'Invalid access code.' }, { status: 403, headers: corsHeaders });
    }
  }

  return Response.json({ granted: true }, { headers: corsHeaders });
});
