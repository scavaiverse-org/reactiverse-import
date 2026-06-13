// Shared transactional-email helper (Resend). Centralises the provider call so
// every function (notify-inquiry, stripe-webhook, notify-launch, …) sends the
// same way. Reads the same secrets notify-inquiry established:
//   EMAIL_PROVIDER_API_KEY (or RESEND_API_KEY) — Resend API key
//   EMAIL_FROM — verified sender, default "SCAVerse <notifications@scaverse.org>"
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'SCAVerse <notifications@scaverse.org>';
const RESEND_KEY = Deno.env.get('EMAIL_PROVIDER_API_KEY') || Deno.env.get('RESEND_API_KEY') || '';

export function emailConfigured(): boolean {
  return !!RESEND_KEY;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type SendArgs = { to: string | string[]; subject: string; html: string; replyTo?: string };

// Sends one email. Never throws — returns a result object — so callers can fire
// it without risking the main flow (a payment/publish must not fail on email).
export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<{ sent: boolean; reason?: string }> {
  if (!RESEND_KEY) {
    console.warn('[email] EMAIL_PROVIDER_API_KEY not set — skipping:', subject);
    return { sent: false, reason: 'email_not_configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      console.error('[email] Resend error:', detail);
      return { sent: false, reason: 'provider_error' };
    }
    return { sent: true };
  } catch (error) {
    console.error('[email] send failed:', error instanceof Error ? error.message : error);
    return { sent: false, reason: 'exception' };
  }
}

// Shared branded shell so all customer emails look consistent.
export function emailShell(heading: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c22">
    <h2 style="color:#111;margin:0 0 12px">${escapeHtml(heading)}</h2>
    ${bodyHtml}
    <p style="color:#888;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:12px">SCAVerse — immersive museums &amp; experiences.</p>
  </div>`;
}
