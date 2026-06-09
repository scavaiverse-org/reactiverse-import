import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, getServiceRoleClient } from '../_shared/supabase-client.ts';

async function resolveChannelId(accessToken: string, channelName: string): Promise<string> {
  let cursor = '';
  const normalizedName = channelName.replace(/^#/, '');
  do {
    const params = new URLSearchParams({ types: 'public_channel,private_channel', exclude_archived: 'true', limit: '200' });
    if (cursor) params.set('cursor', cursor);
    const res = await fetch(`https://slack.com/api/conversations.list?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Unable to list Slack channels');
    const channel = (data.channels || []).find((c: { name: string }) => c.name === normalizedName);
    if (channel) return channel.id;
    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor);
  throw new Error(`Slack channel #${normalizedName} was not found`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403, headers: corsHeaders });
    }

    const accessToken = Deno.env.get('SLACK_BOT_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Slack integration not configured. Set SLACK_BOT_TOKEN in Edge Function secrets.' }, { status: 503, headers: corsHeaders });
    }

    const payload = await req.json().catch(() => ({}));
    const channelId = await resolveChannelId(accessToken, payload.channel || '#museum-alerts');
    const status = payload.status || 'Operational update';
    const details = payload.details || 'SCAVerse museum platform status update posted successfully.';
    const timestamp = new Date().toISOString();
    const text = payload.text || `*${status}*\n${details}\n_Time: ${timestamp}_`;

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: channelId, text }),
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || 'Unable to post Slack message');

    const service = getServiceRoleClient();
    await service.from('audit_log').insert({
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      action: 'slack_operational_status_update',
      target_type: 'SlackChannel',
      target_name: payload.channel || '#museum-alerts',
      details: text,
      metadata: { channel_id: channelId, slack_ts: result.ts },
      timestamp,
      severity: 'info',
    });

    return Response.json({ success: true, channel: payload.channel || '#museum-alerts', slack_ts: result.ts }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
