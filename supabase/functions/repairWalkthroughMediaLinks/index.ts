import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, getServiceRoleClient } from '../_shared/supabase-client.ts';

const FALLBACKS: Record<string, string> = {
  image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop&auto=format',
  video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  audio: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
};
const SKIP_FIELDS = new Set(['id', 'created_at', 'updated_at', 'created_by_id', 'created_by', 'tenant_id']);

function isUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function isBrokenPlaceholder(value: string) {
  return /yourcdn\.com|example\.com|placeholder|placehold\.co/i.test(value);
}

function inferKind(key: string, value: string, parent: Record<string, unknown> = {}): string {
  const field = key.toLowerCase();
  const url = value.toLowerCase().split('?')[0];
  const parentType = String(parent.media_type || parent.artifact_type || '').toLowerCase();
  if (/\.(mp3|wav|ogg|m4a)$/.test(url)) return 'audio';
  if (/\.(mp4|webm|mov|m4v)$/.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(url)) return 'image';
  if (field.includes('audio') || field.includes('voice') || field.includes('narrator') || field.includes('ambience')) return 'audio';
  if (field.includes('video')) return 'video';
  if ((field === 'media_url' || field === 'performance_media_url') && parentType === 'audio') return 'audio';
  if ((field === 'media_url' || field === 'performance_media_url') && parentType === 'video') return 'video';
  return 'image';
}

async function urlWorks(url: string): Promise<boolean> {
  if (isBrokenPlaceholder(url)) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (res.ok) return true;
    res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-2048' }, signal: controller.signal });
    if (res.ok) return true;
    res = await fetch(url, { method: 'GET', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

interface Report { id: string; label: string; valid_urls: number; replacements: Array<{ field: string; kind: string; original: string; replacement: string }>; }

async function repairTree(value: unknown, report: Report, parent: Record<string, unknown> = {}, key = ''): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map((item) => repairTree(item, report, parent, key)));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await repairTree(v, report, value as Record<string, unknown>, k);
    }
    return out;
  }
  if (!isUrl(value)) return value;
  const working = await urlWorks(value);
  if (working) { report.valid_urls += 1; return value; }
  const kind = inferKind(key, value, parent);
  const replacement = FALLBACKS[kind];
  report.replacements.push({ field: key, kind, original: value, replacement });
  return replacement;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const apply = body.apply !== false;
    const service = getServiceRoleClient();
    const { data: records, error } = await service
      .from('experience_configs')
      .select('*')
      .eq('module_key', 'walkthrough')
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

    const results = [];
    for (const record of records || []) {
      const report: Report = { id: record.id, label: record.title || record.walkthrough_key || 'Walkthrough', valid_urls: 0, replacements: [] };
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(record)) {
        if (!SKIP_FIELDS.has(k)) cleaned[k] = v;
      }
      const repaired = await repairTree(cleaned, report) as Record<string, unknown>;
      if (apply && report.replacements.length > 0) {
        repaired.updated_at = new Date().toISOString();
        repaired.last_updated = repaired.updated_at;
        await service.from('experience_configs').update(repaired).eq('id', record.id);
      }
      results.push({ ...report, applied: apply && report.replacements.length > 0 });
    }

    return Response.json({
      data: {
        scanned_records: (records || []).length,
        scanned_urls: results.reduce((t, r) => t + r.valid_urls + r.replacements.length, 0),
        replaced_urls: results.reduce((t, r) => t + r.replacements.length, 0),
        results,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
