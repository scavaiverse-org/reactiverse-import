import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';

// Anonymous visitor data gateway.
//
// Because anonymous visitors have no JWT, Postgres RLS cannot scope a query to
// a specific visitor_id — any anon caller could read or mutate any visitor's
// rows.  Instead, all anonymous visitor reads and writes go through this Edge
// Function, which:
//   1. Accepts the caller-supplied visitor_id.
//   2. Rate-limits requests per IP (20 req/min).
//   3. Uses the service-role client (bypasses RLS) but adds an explicit
//      .eq('visitor_id', visitor_id) filter to every query, enforcing
//      server-side scoping that PostgREST RLS cannot provide for anon callers.
//   4. Never returns rows belonging to a different visitor_id.
//
// Authenticated users should continue to use PostgREST directly; the owner_*
// RLS policies keyed to auth.uid() remain in place for them.

const ALLOWED_ACTIONS = new Set([
  'get_journey',
  'save_journey',
  'get_collectibles',
  'add_collectible',
  'get_badges',
  'add_badge',
  'get_all_journeys',
]);

function err(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!(await checkRateLimit(req, 'visitor-data', 20, 60))) {
    return rateLimitResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err('Invalid JSON body.');
  }

  const { visitor_id, action, tenant_id, walkthrough_key, payload } = body as {
    visitor_id?: string;
    action?: string;
    tenant_id?: string;
    walkthrough_key?: string;
    payload?: Record<string, unknown>;
  };

  if (!visitor_id || typeof visitor_id !== 'string' || visitor_id.length < 8) {
    return err('visitor_id is required and must be at least 8 characters.');
  }
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return err(`Unknown action. Allowed: ${[...ALLOWED_ACTIONS].join(', ')}`);
  }

  const db = getServiceRoleClient();

  try {
    switch (action) {
      // ── Read the visitor's journey for one walkthrough ─────────────────────
      case 'get_journey': {
        if (!tenant_id || !walkthrough_key) return err('tenant_id and walkthrough_key are required.');
        const { data, error } = await db
          .from('visitor_journeys')
          .select('*')
          .eq('visitor_id', visitor_id)
          .eq('tenant_id', tenant_id)
          .eq('walkthrough_key', walkthrough_key)
          .is('user_id', null)
          .limit(1);
        if (error) throw error;
        return Response.json({ data: data ?? [] }, { headers: corsHeaders });
      }

      // ── Create or update the visitor's journey ────────────────────────────
      case 'save_journey': {
        if (!tenant_id || !walkthrough_key) return err('tenant_id and walkthrough_key are required.');
        if (!payload || typeof payload !== 'object') return err('payload is required.');

        // Verify the payload does not smuggle a different visitor_id or user_id.
        const safe = {
          ...(payload as Record<string, unknown>),
          visitor_id,
          user_id: null,
          tenant_id,
          walkthrough_key,
        };

        // Check for an existing row first.
        const { data: existing } = await db
          .from('visitor_journeys')
          .select('id')
          .eq('visitor_id', visitor_id)
          .eq('tenant_id', tenant_id)
          .eq('walkthrough_key', walkthrough_key)
          .is('user_id', null)
          .maybeSingle();

        let result;
        if (existing?.id) {
          const { data, error } = await db
            .from('visitor_journeys')
            .update({ ...safe, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .eq('visitor_id', visitor_id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await db
            .from('visitor_journeys')
            .insert(safe)
            .select()
            .single();
          if (error) throw error;
          result = data;
        }
        return Response.json({ data: result }, { headers: corsHeaders });
      }

      // ── List all journeys across all tenants (for Passport page) ──────────
      case 'get_all_journeys': {
        const { data, error } = await db
          .from('visitor_journeys')
          .select('*')
          .eq('visitor_id', visitor_id)
          .is('user_id', null)
          .order('last_visited_at', { ascending: false });
        if (error) throw error;
        return Response.json({ data: data ?? [] }, { headers: corsHeaders });
      }

      // ── List collectibles for one walkthrough ─────────────────────────────
      case 'get_collectibles': {
        if (!tenant_id || !walkthrough_key) return err('tenant_id and walkthrough_key are required.');
        const { data, error } = await db
          .from('visitor_collectibles')
          .select('*')
          .eq('visitor_id', visitor_id)
          .eq('tenant_id', tenant_id)
          .eq('walkthrough_key', walkthrough_key)
          .is('user_id', null)
          .order('collected_at', { ascending: false });
        if (error) throw error;
        return Response.json({ data: data ?? [] }, { headers: corsHeaders });
      }

      // ── Add a collectible ─────────────────────────────────────────────────
      case 'add_collectible': {
        if (!payload || typeof payload !== 'object') return err('payload is required.');
        const { artifact_key } = payload as { artifact_key?: string };
        if (!artifact_key) return err('payload.artifact_key is required.');

        const effectiveTenantId = tenant_id ?? (payload as Record<string, unknown>).tenant_id;
        const effectiveWalkthroughKey = walkthrough_key ?? (payload as Record<string, unknown>).walkthrough_key;
        if (!effectiveTenantId || !effectiveWalkthroughKey) {
          return err('tenant_id and walkthrough_key are required.');
        }

        const safe = {
          ...(payload as Record<string, unknown>),
          visitor_id,
          user_id: null,
          tenant_id: effectiveTenantId,
          walkthrough_key: effectiveWalkthroughKey,
        };

        // Idempotent — skip if already collected.
        const { data: existing } = await db
          .from('visitor_collectibles')
          .select('id')
          .eq('visitor_id', visitor_id)
          .eq('artifact_key', artifact_key)
          .eq('tenant_id', safe.tenant_id as string)
          .eq('walkthrough_key', safe.walkthrough_key as string)
          .is('user_id', null)
          .maybeSingle();
        if (existing?.id) {
          return Response.json({ data: existing, skipped: true }, { headers: corsHeaders });
        }

        const { data, error } = await db
          .from('visitor_collectibles')
          .insert(safe)
          .select()
          .single();
        if (error) throw error;
        return Response.json({ data }, { headers: corsHeaders });
      }

      // ── List badges ───────────────────────────────────────────────────────
      case 'get_badges': {
        let q = db
          .from('visitor_badges')
          .select('*')
          .eq('visitor_id', visitor_id)
          .is('user_id', null);
        // The supabase-js query builder returns a new instance rather than
        // mutating in place, so the filter must be reassigned to take effect.
        if (tenant_id) q = q.eq('tenant_id', tenant_id);
        const { data, error } = await q;
        if (error) throw error;
        return Response.json({ data: data ?? [] }, { headers: corsHeaders });
      }

      // ── Award a badge ─────────────────────────────────────────────────────
      case 'add_badge': {
        if (!payload || typeof payload !== 'object') return err('payload is required.');
        const { badge_key } = payload as { badge_key?: string };
        if (!badge_key) return err('payload.badge_key is required.');

        const badgeTenantId = (tenant_id ?? (payload as Record<string, unknown>).tenant_id ?? 'platform') as string;

        // Idempotent.
        const { data: existing } = await db
          .from('visitor_badges')
          .select('id')
          .eq('visitor_id', visitor_id)
          .eq('badge_key', badge_key)
          .eq('tenant_id', badgeTenantId)
          .is('user_id', null)
          .maybeSingle();
        if (existing?.id) {
          return Response.json({ data: existing, skipped: true }, { headers: corsHeaders });
        }

        const { data, error } = await db
          .from('visitor_badges')
          .insert({ visitor_id, user_id: null, badge_key, tenant_id: badgeTenantId })
          .select()
          .single();
        if (error) throw error;
        return Response.json({ data }, { headers: corsHeaders });
      }

      default:
        return err('Unhandled action.');
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[visitor-data]', action, message);
    return Response.json({ error: 'Internal error.' }, { status: 500, headers: corsHeaders });
  }
});
