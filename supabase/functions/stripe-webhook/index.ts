import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';
import { sendEmail, emailShell, escapeHtml } from '../_shared/email.ts';

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
        // The .neq('status', 'confirmed') guard makes this idempotent: Stripe may
        // deliver the same event more than once (and completed + async_payment_
        // succeeded can both fire), so only the first transition matches a row —
        // preventing the buyer from receiving duplicate confirmation emails.
        const { data: ticket, error } = await service.from('tickets').update({
          status: 'confirmed',
          confirmation_stage: 'payment_confirmed',
          updated_at: new Date().toISOString(),
        }).eq('id', ticketId).neq('status', 'confirmed').select('visitor_name, visitor_email, tenant_id').maybeSingle();
        if (error) {
          console.error('[stripe-webhook] ticket update failed:', error.message);
          // Non-200 so Stripe retries until the DB update succeeds.
          return Response.json({ error: 'Ticket update failed.' }, { status: 500 });
        }
        if (!ticket) {
          // Already confirmed by an earlier delivery — nothing more to do.
          console.log(`[stripe-webhook] ticket ${ticketId} already confirmed; skipping (${event.type})`);
          return Response.json({ received: true });
        }
        console.log(`[stripe-webhook] ticket ${ticketId} marked confirmed (${event.type})`);

        // Fire-and-forget booking-confirmation email to the buyer. An email
        // failure must never turn into a non-200 (that would make Stripe retry).
        if (ticket?.visitor_email) {
          const { data: tenant } = await service.from('museum_tenants').select('name, published_manifest_id').eq('id', ticket.tenant_id).maybeSingle();
          const museumName = tenant?.name || 'the museum';
          const live = !!tenant?.published_manifest_id;
          const html = emailShell(
            'Your pre-booking is confirmed',
            `<p style="line-height:1.6">Hi ${escapeHtml(ticket.visitor_name || 'there')},</p>
             <p style="line-height:1.6">Your ticket for <strong>${escapeHtml(museumName)}</strong> is confirmed and your spot is reserved.</p>
             <p style="line-height:1.6">${live ? 'You can begin your tour any time from the museum site.' : 'The museum is not open just yet — we will email you the moment it goes live and your tour unlocks.'}</p>`,
          );
          const result = await sendEmail({ to: ticket.visitor_email, subject: `You're confirmed — ${museumName}`, html });
          if (!result.sent) console.warn('[stripe-webhook] confirmation email not sent:', result.reason);
        }
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
