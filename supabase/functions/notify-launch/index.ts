import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, getServiceRoleClient } from '../_shared/supabase-client.ts';
import { TENANT_ADMIN_ROLES, MASTER_ROLES } from '../_shared/rbac.ts';
import { sendEmail, emailShell, escapeHtml } from '../_shared/email.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

// Emails confirmed pre-bookers that their museum is now live. Called
// (fire-and-forget) from PublishMuseumDialog after a museum is published.
// Idempotent: only tickets with launch_email_sent_at IS NULL are emailed and
// each is stamped once sent, so re-publishing a new version never re-emails
// buyers who were already notified. Admin-only (the caller's JWT is checked).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!(await checkRateLimit(req, 'notify-launch', 5, 60))) {
    return rateLimitResponse();
  }

  try {
    const { tenant_id } = await req.json().catch(() => ({}));
    if (!tenant_id) {
      return Response.json({ error: 'tenant_id is required.' }, { status: 400, headers: corsHeaders });
    }

    const user = await getAuthUser(req);
    if (!user || !TENANT_ADMIN_ROLES.includes(user.role)) {
      return Response.json({ error: 'forbidden' }, { status: 403, headers: corsHeaders });
    }
    // Platform admins may notify any tenant; a franchise owner may only notify
    // a tenant they belong to. Without this, an owner of Tenant A could email
    // Tenant B's buyers.
    const isPlatformAdmin = MASTER_ROLES.includes(user.role);
    if (!isPlatformAdmin && !user.tenantIds.includes(tenant_id)) {
      return Response.json({ error: 'forbidden' }, { status: 403, headers: corsHeaders });
    }

    const service = getServiceRoleClient();
    const { data: tenant } = await service.from('museum_tenants').select('name').eq('id', tenant_id).maybeSingle();
    const museumName = tenant?.name || 'The museum';

    // Confirmed buyers for this tenant who haven't been notified yet.
    const { data: tickets, error } = await service
      .from('tickets')
      .select('id, visitor_name, visitor_email')
      .eq('tenant_id', tenant_id)
      .in('status', ['paid', 'confirmed'])
      .is('launch_email_sent_at', null);
    if (error) {
      console.error('[notify-launch] ticket query failed:', error.message);
      return Response.json({ error: 'query_failed' }, { status: 500, headers: corsHeaders });
    }

    let sent = 0;
    for (const ticket of tickets || []) {
      if (!ticket.visitor_email) continue;
      const html = emailShell(
        `${museumName} is now live`,
        `<p style="line-height:1.6">Hi ${escapeHtml(ticket.visitor_name || 'there')},</p>
         <p style="line-height:1.6"><strong>${escapeHtml(museumName)}</strong> has opened — your tour is ready. Head back any time to begin your visit.</p>`,
      );
      const result = await sendEmail({ to: ticket.visitor_email, subject: `${museumName} is now live`, html });
      if (result.sent) {
        const { error: stampErr } = await service.from('tickets')
          .update({ launch_email_sent_at: new Date().toISOString() })
          .eq('id', ticket.id);
        if (stampErr) {
          // Email already went out; log so a failed stamp (which risks a
          // duplicate on the next run) can be investigated.
          console.error(`[notify-launch] failed to stamp ticket ${ticket.id}:`, stampErr.message);
        }
        sent += 1;
      }
    }

    return Response.json({ sent, total: (tickets || []).length }, { headers: corsHeaders });
  } catch (error) {
    console.error('[notify-launch] unexpected error:', error);
    return Response.json({ error: 'unexpected_error' }, { status: 500, headers: corsHeaders });
  }
});
