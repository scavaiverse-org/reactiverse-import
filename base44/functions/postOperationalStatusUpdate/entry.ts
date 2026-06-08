import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function resolveChannelId(accessToken, channelName) {
  let cursor = '';
  const normalizedName = channelName.replace(/^#/, '');

  do {
    const params = new URLSearchParams({
      types: 'public_channel,private_channel',
      exclude_archived: 'true',
      limit: '200'
    });
    if (cursor) params.set('cursor', cursor);

    const response = await fetch(`https://slack.com/api/conversations.list?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Unable to list Slack channels');
    }

    const channel = (data.channels || []).find((item) => item.name === normalizedName);
    if (channel) return channel.id;

    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor);

  throw new Error(`Slack channel #${normalizedName} was not found`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');
    const channelId = await resolveChannelId(accessToken, payload.channel || '#museum-alerts');

    const status = payload.status || 'Operational update';
    const details = payload.details || 'SCAVerse museum platform status update posted successfully.';
    const timestamp = new Date().toISOString();
    const text = payload.text || `*${status}*\n${details}\n_Time: ${timestamp}_`;

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channelId,
        text
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'Unable to post Slack message');
    }

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      user_name: user.full_name || user.email,
      action: 'slack_operational_status_update',
      target_type: 'SlackChannel',
      target_name: payload.channel || '#museum-alerts',
      details: text,
      metadata: { channelId, slack_ts: result.ts },
      timestamp,
      severity: 'info'
    });

    return Response.json({ success: true, channel: payload.channel || '#museum-alerts', slack_ts: result.ts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});