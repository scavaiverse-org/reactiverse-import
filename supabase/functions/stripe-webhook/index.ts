import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';

// Stripe webhook receiver. Verifies the event signature, then marks the
// reservation paid on checkout completion. Tour access unlocks automatically
// (Walkthrough gate + Confirmation page both key off tickets.status).
//
// Register in Stripe dashboard → Developers → Webhooks:
//   https://golunqdunvmubuprufmp.supabase.co/functions/v1/stripe-webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded,
//         checkout.session.async_payment_failed

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    return Response.json({ error: 'STRIPE_WEBHOOK_SECRET not configured.' }, { status: 503 });
  }
  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await Stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketId = session.metadata?.ticket_id || session.client_reference_id;
      if (ticketId && session.payment_status === 'paid') {
        const service = getServiceRoleClient();
        // tickets_status_check allows pending/confirmed/used/expired/refunded —
        // 'confirmed' is the unlock status used by the tour gate + Confirmation page.
        const { error } = await service.from('tickets').update({
          status: 'confirmed',
          confirmation_stage: 'payment_confirmed',
          updated_at: new Date().toISOString(),
        }).eq('id', ticketId);
        if (error) {
          console.error('[stripe-webhook] ticket update failed:', error.message);
          // Non-200 so Stripe retries until the DB update succeeds.
          return Response.json({ error: 'Ticket update failed.' }, { status: 500 });
        }
        console.log(`[stripe-webhook] ticket ${ticketId} marked paid (${event.type})`);
      }
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketId = session.metadata?.ticket_id || session.client_reference_id;
      if (ticketId) {
        const service = getServiceRoleClient();
        await service.from('tickets').update({
          confirmation_stage: 'payment_failed',
          updated_at: new Date().toISOString(),
        }).eq('id', ticketId);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] handler error:', error);
    return Response.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }
});
