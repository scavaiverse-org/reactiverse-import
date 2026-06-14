import { corsHeaders } from './cors.ts';
import { getServiceRoleClient } from './supabase-client.ts';

// Best-effort client identifier for rate limiting (Cloudflare/most proxies
// set one of these; falls back to a shared bucket if neither is present).
function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || 'unknown';
}

// Checks and atomically increments a rate limit bucket for this request's
// client IP via the public.check_rate_limit RPC (see migration 0025).
// Fails open (allows the request) if the rate limit check itself errors, so
// a database hiccup never takes down a public endpoint.
export async function checkRateLimit(req: Request, bucket: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const ip = clientIp(req);
  const service = getServiceRoleClient();
  const { data, error } = await service.rpc('check_rate_limit', {
    p_bucket_key: `${bucket}:${ip}`,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error(`[rate-limit] ${bucket} check failed:`, error);
    return true;
  }
  return data !== false;
}

export function rateLimitResponse(): Response {
  return Response.json(
    { error: 'Too many requests. Please try again shortly.' },
    { status: 429, headers: corsHeaders },
  );
}
