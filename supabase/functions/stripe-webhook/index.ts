import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';

// Stripe webhook receiver. Verifies the event signature, then marks the
// reservation paid on checkout completion. Tour access unlocks automatically
// (Walkthrough gate + Confirmation page both key off tickets.status).
// On successful payment, also credits a unique e-ticket to the buyer's
// inventory (inventory_items), matched against the e_ticket_templates
// catalog by tenant + package (ticket_type).
//
// Register in Stripe dashboard → Developers → Webhooks:
//   https://golunqdunvmubuprufmp.supabase.co/functions/v1/stripe-webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded,
//         checkout.session.async_payment_failed

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function generateETicketCode(packageType: string): string {
  const prefix = String(packageType || 'TICKET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'TKT';
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ETK-${prefix}-${random}`;
}

// Credits one unique e-ticket to the buyer's inventory. No-op for anonymous
// reservations (no created_by_id) and idempotent across webhook retries.
async function creditInventory(service: ReturnType<typeof getServiceRoleClient>, ticket: Record<string, unknown>) {
  if (!ticket.created_by_id) return;

  const { data: existing } = await service.from('inventory_items').select('id').eq('ticket_id', ticket.id).maybeSingle();
  if (existing) return;

  const { data: template } = await service
    .from('e_ticket_templates')
    .select('id, name')
    .eq('tenant_id', ticket.tenant_id)
    .eq('package_type', ticket.ticket_type)
    .eq('is_active', true)
    .maybeSingle();

  const { error } = await service.from('inventory_items').insert({
    user_id: ticket.created_by_id,
    tenant_id: ticket.tenant_id,
    tenant_name: ticket.tenant_name,
    ticket_id: ticket.id,
    template_id: template?.id || null,
    package_type: ticket.ticket_type,
    label: template?.name || ticket.ticket_type,
    e_ticket_code: generateETicketCode(String(ticket.ticket_type || '')),
    visitor_name: ticket.visitor_name,
    visitor_email: ticket.visitor_email,
    quantity: ticket.quantity,
    price: ticket.total_price,
    currency: ticket.currency,
    status: 'active',
  });
  if (error) {
    console.error('[stripe-webhook] inventory credit failed:', error.message);
  } else {
    console.log(`[stripe-webhook] inventory credited for ticket ${ticket.id} (${ticket.ticket_type})`);
  }
}

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
        const { data: updated, error } = await service.from('tickets').update({
          status: 'confirmed',
          confirmation_stage: 'payment_confirmed',
          updated_at: new Date().toISOString(),
        }).eq('id', ticketId).select().maybeSingle();
        if (error) {
          console.error('[stripe-webhook] ticket update failed:', error.message);
          // Non-200 so Stripe retries until the DB update succeeds.
          return Response.json({ error: 'Ticket update failed.' }, { status: 500 });
        }
        console.log(`[stripe-webhook] ticket ${ticketId} marked paid (${event.type})`);
        if (updated) {
          await creditInventory(service, updated);
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
