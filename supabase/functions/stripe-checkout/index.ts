import { corsHeaders } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

// Creates a Stripe Checkout Session for a saved ticket reservation.
// Prices are resolved server-side (ticketing ModuleConfig, then defaults) —
// the client-supplied total on the reservation row is never trusted.

const ALLOWED_ORIGINS = [
  'https://scaverse.org',
  'https://www.scaverse.org',
  'https://scaverse.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
];

// Mirrors the fallback catalog in TenantTicketJourney.jsx.
const DEFAULT_PRICES: Record<string, number> = {
  virtual_general: 18,
  virtual_premium: 38,
  physical_general: 25,
  physical_vip: 68,
  family: 88,
  group: 15,
};

const MAX_QUANTITY = 50;

async function resolveUnitPrice(service: ReturnType<typeof getServiceRoleClient>, tenantId: string, ticketType: string): Promise<{ price: number | null; label: string; currency: string }> {
  const { data: config } = await service
    .from('module_configs')
    .select('config_json')
    .eq('tenant_id', tenantId)
    .eq('module_key', 'ticketing')
    .maybeSingle();
  const catalog = (config?.config_json?.ticket_types || []) as Array<Record<string, unknown>>;
  const entry = catalog.find((t) => (t.id === ticketType || t.type === ticketType) && t.enabled !== false);
  const configPrice = typeof entry?.price === 'number' && entry.price > 0 ? entry.price : null;
  const price = configPrice ?? DEFAULT_PRICES[ticketType] ?? null;
  return {
    price,
    label: String(entry?.label || ticketType),
    currency: String(entry?.currency || 'SGD').toLowerCase(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!(await checkRateLimit(req, 'stripe-checkout', 10, 60))) {
    return rateLimitResponse();
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Payments not configured. Set STRIPE_SECRET_KEY in Edge Function secrets.' }, { status: 503, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticket_id || '').trim();
    if (!ticketId) {
      return Response.json({ error: 'ticket_id is required.' }, { status: 400, headers: corsHeaders });
    }
    const origin = ALLOWED_ORIGINS.includes(String(body.origin || '')) ? String(body.origin) : ALLOWED_ORIGINS[0];

    const service = getServiceRoleClient();
    const { data: ticket } = await service.from('tickets').select('*').eq('id', ticketId).maybeSingle();
    if (!ticket) {
      return Response.json({ error: 'Reservation not found.' }, { status: 404, headers: corsHeaders });
    }
    if (['paid', 'confirmed'].includes(String(ticket.status || '').toLowerCase())) {
      return Response.json({ already_paid: true }, { headers: corsHeaders });
    }

    const quantity = Math.min(Math.max(Number(ticket.quantity) || 1, 1), MAX_QUANTITY);
    const { price, label, currency } = await resolveUnitPrice(service, ticket.tenant_id, String(ticket.ticket_type || ''));
    if (!price) {
      return Response.json({ error: 'This ticket type requires a custom quote. Please contact the museum.' }, { status: 400, headers: corsHeaders });
    }

    const { data: tenant } = await service.from('museum_tenants').select('slug, name').eq('id', ticket.tenant_id).maybeSingle();
    const slug = tenant?.slug || 'asian-operatic-museum';
    const returnBase = `${origin}/museum/${slug}/tickets-5`;

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('client_reference_id', ticketId);
    params.set('metadata[ticket_id]', ticketId);
    params.set('metadata[tenant_id]', String(ticket.tenant_id || ''));
    params.set('line_items[0][quantity]', String(quantity));
    params.set('line_items[0][price_data][currency]', currency);
    params.set('line_items[0][price_data][unit_amount]', String(Math.round(price * 100)));
    params.set('line_items[0][price_data][product_data][name]', `${tenant?.name || 'Museum'} — ${label}`);
    params.set('success_url', `${returnBase}?payment=success`);
    params.set('cancel_url', `${returnBase}?payment=cancelled`);
    if (ticket.visitor_email && ticket.visitor_email.includes('@')) {
      params.set('customer_email', String(ticket.visitor_email));
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || !session?.url) {
      console.error('[stripe-checkout] session create failed:', session?.error?.message);
      return Response.json({ error: 'Could not start payment. Please try again.' }, { status: 502, headers: corsHeaders });
    }

    await service.from('tickets').update({
      confirmation_stage: 'checkout_started',
      total_price: price * quantity,
      currency: currency.toUpperCase(),
      updated_at: new Date().toISOString(),
    }).eq('id', ticketId);

    return Response.json({ url: session.url, session_id: session.id }, { headers: corsHeaders });
  } catch (error) {
    console.error('[stripe-checkout] unexpected:', error);
    return Response.json({ error: 'Something went wrong starting the payment.' }, { status: 500, headers: corsHeaders });
  }
});
