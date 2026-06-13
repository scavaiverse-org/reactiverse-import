import { corsHeaders } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';

// Sends an email notification to the SCAVerse inbox whenever a visitor submits
// a "Become a Tenant" inquiry or a vendor application. Called fire-and-forget
// from the public forms after the row is inserted, so a mail failure never
// blocks the submission. The client sends only { kind, id }; this function
// reads the row back with the service role (bypassing the admin-only RLS on
// these tables) so the email content is always trusted DB data, never
// attacker-supplied text.

const NOTIFY_EMAIL = Deno.env.get('INQUIRY_NOTIFICATION_EMAIL') || 'contact@scaverse.org';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'SCAVerse <notifications@scaverse.org>';
const RESEND_KEY = Deno.env.get('EMAIL_PROVIDER_API_KEY') || Deno.env.get('RESEND_API_KEY') || '';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rows(pairs: [string, unknown][]): string {
  return pairs
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([label, value]) => `<tr><td style="padding:6px 12px;color:#888;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 12px;color:#111">${escapeHtml(value)}</td></tr>`)
    .join('');
}

type EmailContent = { subject: string; html: string; replyTo?: string };

function buildTenantInquiryEmail(record: Record<string, unknown>): EmailContent {
  const ref = `SCV-${String(record.id).slice(0, 8).toUpperCase()}`;
  return {
    subject: `New tenant enquiry — ${record.organization || record.contact_name || ref}`,
    replyTo: typeof record.email === 'string' && record.email.includes('@') ? record.email : undefined,
    html: `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px">
      <h2 style="color:#111">New "Become a Tenant" enquiry</h2>
      <p style="color:#555">A visitor submitted the tenant / franchise enquiry form.</p>
      <table style="border-collapse:collapse;font-size:14px;border:1px solid #eee;border-radius:8px">
        ${rows([
          ['Organization', record.organization],
          ['Contact name', record.contact_name],
          ['Email', record.email],
          ['Museum type', record.museum_type],
          ['Message', record.message],
          ['Reference', ref],
          ['Submitted', record.submitted_at],
        ])}
      </table>
      <p style="color:#888;font-size:12px;margin-top:16px">Manage this enquiry in the SCAVerse admin → Tenants page.</p>
    </div>`,
  };
}

function buildVendorEmail(record: Record<string, unknown>): EmailContent {
  return {
    subject: `New vendor application — ${record.business_name || record.contact_name || 'vendor'}`,
    replyTo: typeof record.email === 'string' && record.email.includes('@') ? record.email : undefined,
    html: `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px">
      <h2 style="color:#111">New vendor application</h2>
      <p style="color:#555">A vendor applied to join ${escapeHtml(record.tenant_name || 'a museum')}.</p>
      <table style="border-collapse:collapse;font-size:14px;border:1px solid #eee;border-radius:8px">
        ${rows([
          ['Business name', record.business_name],
          ['Contact name', record.contact_name],
          ['Email', record.email],
          ['Phone', record.phone],
          ['Category', record.category],
          ['Slot type', record.slot_type],
          ['Museum', record.tenant_name],
          ['Description', record.description],
        ])}
      </table>
      <p style="color:#888;font-size:12px;margin-top:16px">Manage this application in the SCAVerse admin → Vendors page.</p>
    </div>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { kind, id } = await req.json().catch(() => ({}));
    if (!id || (kind !== 'tenant_inquiry' && kind !== 'vendor_application')) {
      return Response.json({ sent: false, reason: 'invalid_request' }, { status: 400, headers: corsHeaders });
    }

    const table = kind === 'tenant_inquiry' ? 'tenant_inquiries' : 'vendors';
    const service = getServiceRoleClient();
    const { data: record, error } = await service.from(table).select('*').eq('id', id).maybeSingle();
    if (error || !record) {
      return Response.json({ sent: false, reason: 'record_not_found' }, { status: 404, headers: corsHeaders });
    }

    const email = kind === 'tenant_inquiry' ? buildTenantInquiryEmail(record) : buildVendorEmail(record);

    // No provider key yet → succeed quietly so the form flow is never affected.
    // Set EMAIL_PROVIDER_API_KEY (a Resend key) in the function secrets to enable.
    if (!RESEND_KEY) {
      console.warn('[notify-inquiry] EMAIL_PROVIDER_API_KEY not set — skipping email for', kind, id);
      return Response.json({ sent: false, reason: 'email_not_configured' }, { status: 200, headers: corsHeaders });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [NOTIFY_EMAIL],
        subject: email.subject,
        html: email.html,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text().catch(() => resendResponse.statusText);
      console.error('[notify-inquiry] Resend error:', detail);
      return Response.json({ sent: false, reason: 'provider_error', detail }, { status: 502, headers: corsHeaders });
    }

    return Response.json({ sent: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('[notify-inquiry] unexpected error:', error);
    return Response.json({ sent: false, reason: 'unexpected_error' }, { status: 500, headers: corsHeaders });
  }
});
