import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FALLBACKS = {
  image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop&auto=format',
  video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  audio: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'
};

const SKIP_FIELDS = new Set(['id', 'created_date', 'updated_date', 'created_by_id', 'created_by', 'app_id', 'entity_name']);

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function isBrokenPlaceholder(value) {
  return /yourcdn\.com|example\.com|placeholder|placehold\.co/i.test(String(value));
}

function inferKind(key, value, parent = {}) {
  const field = String(key).toLowerCase();
  const url = String(value).toLowerCase().split('?')[0];
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

async function urlWorks(url) {
  if (isBrokenPlaceholder(url)) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    let response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (response.ok) return true;
    response = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-2048' }, signal: controller.signal });
    if (response.ok) return true;
    response = await fetch(url, { method: 'GET', signal: controller.signal });
    return response.ok;
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function repairTree(value, report, parent = {}, key = '') {
  if (Array.isArray(value)) {
    const repairedArray = [];
    for (const item of value) repairedArray.push(await repairTree(item, report, parent, key));
    return repairedArray;
  }

  if (value && typeof value === 'object') {
    const repairedObject = { ...value };
    for (const [childKey, childValue] of Object.entries(value)) {
      repairedObject[childKey] = await repairTree(childValue, report, value, childKey);
    }
    return repairedObject;
  }

  if (!isUrl(value)) return value;

  const working = await urlWorks(value);
  if (working) {
    report.valid_urls += 1;
    return value;
  }

  const kind = inferKind(key, value, parent);
  const replacement = FALLBACKS[kind];
  report.replacements.push({ field: key, kind, original: value, replacement });
  return replacement;
}

function cleanRecord(record) {
  const payload = {};
  for (const [key, value] of Object.entries(record)) {
    if (!SKIP_FIELDS.has(key)) payload[key] = value;
  }
  return payload;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apply = body.apply !== false;
    const records = await base44.asServiceRole.entities.ExperienceConfig.filter({ module_key: 'walkthrough' }, '-updated_date', 100);
    const results = [];

    for (const record of records) {
      const report = { id: record.id, label: record.title || record.walkthrough_key || 'Walkthrough', valid_urls: 0, replacements: [] };
      const repaired = await repairTree(cleanRecord(record), report);

      if (apply && report.replacements.length > 0) {
        repaired.updated_at = new Date().toISOString();
        repaired.last_updated = repaired.updated_at;
        await base44.asServiceRole.entities.ExperienceConfig.update(record.id, repaired);
      }

      results.push({ ...report, applied: apply && report.replacements.length > 0 });
    }

    return Response.json({
      scanned_records: records.length,
      scanned_urls: results.reduce((total, item) => total + item.valid_urls + item.replacements.length, 0),
      replaced_urls: results.reduce((total, item) => total + item.replacements.length, 0),
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});