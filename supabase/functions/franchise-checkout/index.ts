import { corsHeaders } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

// Creates a Stripe Checkout session for the franchisee "Early Bird" plan:
// a 7-day free trial, then SGD 300 billed every 6 months. If Stripe isn't
// configured, returns { stripe_configured: false } so the client falls back
// to the PayNow QR flow (UEN-based, paid manually).

const ALLOWED_ORIGINS = [
  'https://scaverse.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
];

const TRIAL_PERIOD_DAYS = 7;
const PLAN_AMOUNT_SGD = 300;
const PLAN_INTERVAL_MONTHS = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!(await checkRateLimit(req, 'franchise-checkout', 10, 60))) {
    return rateLimitResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    const inquiryId = String(body.inquiry_id || '').trim();
    if (!inquiryId) {
      return Response.json({ error: 'inquiry_id is required.' }, { status: 400, headers: corsHeaders });
    }
    const origin = ALLOWED_ORIGINS.includes(String(body.origin || '')) ? String(body.origin) : ALLOWED_ORIGINS[0];

    const service = getServiceRoleClient();
    const { data: inquiry } = await service.from('tenant_inquiries').select('*').eq('id', inquiryId).maybeSingle();
    if (!inquiry) {
      return Response.json({ error: 'Application not found.' }, { status: 404, headers: corsHeaders });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      await service.from('tenant_inquiries').update({
        plan: 'franchisee_early_bird',
        checkout_status: 'paynow_pending',
        updated_at: new Date().toISOString(),
      }).eq('id', inquiryId);
      return Response.json({ stripe_configured: false }, { headers: corsHeaders });
    }

    const returnBase = `${origin}/become-a-tenant`;
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('client_reference_id', inquiryId);
    params.set('metadata[inquiry_id]', inquiryId);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'sgd');
    params.set('line_items[0][price_data][unit_amount]', String(PLAN_AMOUNT_SGD * 100));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][recurring][interval_count]', String(PLAN_INTERVAL_MONTHS));
    params.set('line_items[0][price_data][product_data][name]', 'SCAVerse Tenant — Early Bird (6 months)');
    params.set('subscription_data[trial_period_days]', String(TRIAL_PERIOD_DAYS));
    params.set('success_url', `${returnBase}?checkout=success`);
    params.set('cancel_url', `${returnBase}?checkout=cancelled`);
    if (inquiry.email && String(inquiry.email).includes('@')) {
      params.set('customer_email', String(inquiry.email));
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
      console.error('[franchise-checkout] session create failed:', session?.error?.message);
      return Response.json({ error: 'Could not start payment. Please try again.' }, { status: 502, headers: corsHeaders });
    }

    const { error: updateErr } = await service.from('tenant_inquiries').update({
      plan: 'franchisee_early_bird',
      checkout_status: 'checkout_started',
      checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    }).eq('id', inquiryId);
    if (updateErr) {
      console.error('[franchise-checkout] failed to update inquiry after session create:', updateErr.message);
    }

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    console.error('[franchise-checkout] unexpected:', error);
    return Response.json({ error: 'Something went wrong starting the payment.' }, { status: 500, headers: corsHeaders });
  }
});
