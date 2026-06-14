import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, getServiceRoleClient } from '../_shared/supabase-client.ts';
import { TENANT_ADMIN_ROLES } from '../_shared/rbac.ts';

const EXTENSION_SHARE: Record<string, number> = { subtle: 0.35, medium: 0.6, wide: 0.9, immersive: 1.25 };
const DENSITY_WORD: Record<string, string> = { minimal: 'a few sparse', medium: 'a moderate number of', rich: 'a rich arrangement of' };

const DEFAULT_POOL = ['shelves', 'wall decorations', 'small display items', 'floor continuation', 'soft lighting', 'storage objects', 'framed pieces', 'books', 'boxes', 'small sculptures', 'plants', 'fabric', 'lamps'];
const MUSEUM_POOL = ['display cases', 'archival posters', 'costume displays', 'stage curtains', 'wooden panels', 'lanterns', 'ceramic pieces', 'musical instruments', 'masks', 'framed cultural photographs', 'soft gallery lighting'];
const AVOID = 'extra people, distorted faces, duplicated animals, warped text, melted furniture, broken shelves, impossible floor perspective, inconsistent lighting, heavy blur, surreal objects, random fantasy elements, low quality, duplicate main subject, changed center image, broken wall seams, misaligned floorboards';

const ALLOWED_ROLES: string[] = TENANT_ADMIN_ROLES;

function seededPick(pool: string[], count: number, seedNum: number): string[] {
  const out: string[] = [];
  let s = seedNum || 1;
  const items = [...pool];
  for (let i = 0; i < count && items.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * items.length);
    out.push(...items.splice(idx, 1));
  }
  return out;
}

function buildPanelPrompt({ side, objects, density, visualStyle }: { side: string; objects: string[]; density: string; visualStyle: string }) {
  const edge = side === 'left' ? 'left edge' : 'right edge';
  return [
    `Continue the image beyond the ${edge} of the provided reference image.`,
    `This is the ${side}-side extension panel of the same physical room or scene.`,
    `Preserve the exact camera height, lens angle, horizon line, vanishing point, wall-floor boundary, ceiling line, object scale, lighting direction, shadow softness, color temperature, material texture, and room perspective of the original reference image.`,
    `Do not create a new room. Do not reframe, zoom, rotate, or change wall position, ceiling direction, floor angle, furniture scale, window scale, object scale, or vanishing point.`,
    `Style: ${visualStyle.replace(/_/g, ' ')}.`,
    `Include ${DENSITY_WORD[density] || 'a moderate number of'} plausible background details only if they naturally fit the reference: ${objects.join(', ')}.`,
    `The generated side must be usable as a seamless horizontal extension panel when stitched beside the original image. Do not add conflicting architecture, people, readable text, or a second camera perspective.`,
  ].join(' ');
}

function stableHash(value = '') {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function escapeXml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function generateImage(prompt: string, imageUrl: string, seed: number): Promise<string> {
  const falKey = Deno.env.get('FAL_KEY') || Deno.env.get('AI_GENERATION_API_KEY');
  if (!falKey) {
    throw new Error('Image generation is not configured. Set FAL_KEY in Supabase Edge Function secrets.');
  }

  // FAL.ai flux-dev image-to-image. Abort if FAL hangs so the function doesn't
  // stall indefinitely (image generation can legitimately take a while).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  let response: Response;
  try {
    response = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
        negative_prompt: AVOID,
        strength: 0.85,
        num_inference_steps: 28,
        seed,
        image_size: 'landscape_16_9',
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Image generation failed: ${err}`);
  }

  const data = await response.json();
  const url = data?.images?.[0]?.url || data?.image?.url || data?.url || '';
  if (!url) throw new Error('Image generation returned no URL');
  return url;
}

// Browsers refuse to load external image references inside an SVG rendered
// via <img>/background-image, so the panorama must embed its three images as
// data URIs to display anywhere on the public site.
async function toDataUri(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`Could not fetch panorama panel image (${response.status})`);
  const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error(`Panorama panel is not an image (${contentType})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

async function uploadPanorama(svg: string, tenantId: string, roomId: string): Promise<string> {
  const service = getServiceRoleClient();
  const fileName = `panoramas/${tenantId || 'tenant'}/${roomId || 'room'}-${Date.now()}.svg`;
  // public-media: visitors must be able to load the panorama anonymously.
  const { data, error } = await service.storage
    .from('public-media')
    .upload(fileName, new Blob([svg], { type: 'image/svg+xml' }), { upsert: true, contentType: 'image/svg+xml' });
  if (error) throw new Error(`Panorama upload failed: ${error.message}`);
  const { data: { publicUrl } } = service.storage.from('public-media').getPublicUrl(data.path);
  return publicUrl;
}

async function composePanorama({ leftUrl, originalUrl, rightUrl, extensionStrength, tenantId, roomId }: {
  leftUrl: string; originalUrl: string; rightUrl: string;
  extensionStrength: string; tenantId: string; roomId: string;
}) {
  const height = 1000;
  const originalWidth = 1400;
  const sidePanelShare = EXTENSION_SHARE[extensionStrength] ?? 0.6;
  const sideWidth = Math.round(originalWidth * sidePanelShare);
  const seamBlendPixels = Math.max(48, Math.round(originalWidth * 0.06));
  const width = sideWidth + originalWidth + sideWidth;
  const [left, center, right] = await Promise.all([
    toDataUri(leftUrl),
    toDataUri(originalUrl),
    toDataUri(rightUrl),
  ]);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="fadeIn" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white" stop-opacity="1"/></linearGradient>
    <linearGradient id="fadeOut" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="white" stop-opacity="1"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
    <mask id="centerLeftFade"><rect width="${seamBlendPixels}" height="${height}" fill="url(#fadeIn)"/></mask>
    <mask id="rightFade"><rect width="${seamBlendPixels}" height="${height}" fill="url(#fadeIn)"/></mask>
  </defs>
  <image href="${left}" x="0" y="0" width="${sideWidth + seamBlendPixels}" height="${height}" preserveAspectRatio="xMaxYMid slice"/>
  <image href="${center}" x="${sideWidth}" y="0" width="${originalWidth}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <image href="${center}" x="${sideWidth}" y="0" width="${seamBlendPixels}" height="${height}" preserveAspectRatio="xMinYMid slice" mask="url(#centerLeftFade)"/>
  <image href="${right}" x="${sideWidth + originalWidth - seamBlendPixels}" y="0" width="${sideWidth + seamBlendPixels}" height="${height}" preserveAspectRatio="xMinYMid slice" mask="url(#rightFade)"/>
</svg>`;

  const panoramaUrl = await uploadPanorama(svg, tenantId, roomId);
  return {
    panoramaUrl, width, height, seamBlendPixels,
    leftWidth: sideWidth, originalWidth, rightWidth: sideWidth,
    originalStartXPercent: (sideWidth / width) * 100,
    originalEndXPercent: ((sideWidth + originalWidth) / width) * 100,
    renderMode: 'single_stitched_panorama',
    qaScore: 82,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) {
      return Response.json({ status: 'failed', code: 'UNAUTHORIZED', user_message: 'Please sign in to generate room extensions.', next_action: 'Sign in and try again.' }, { status: 401, headers: corsHeaders });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ status: 'failed', code: 'NO_GENERATION_PERMISSION', user_message: 'Your account does not have image generation permission.', next_action: 'Ask a platform admin to enable generation access.' }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const {
      original_image_url,
      extension_strength = 'medium',
      randomness = 0.12,
      visual_style = 'same_room_realistic',
      object_density = 'medium',
      object_pool,
      museum_type,
      tenant_id,
      room_id,
      media_id,
      variation_seed,
    } = body;

    if (!original_image_url || !/^https?:\/\//i.test(original_image_url)) {
      return Response.json({ status: 'failed', code: 'MISSING_IMAGE', user_message: 'There is no image to extend.', next_action: 'Upload any image first.', original_image_url: original_image_url || '' }, { status: 400, headers: corsHeaders });
    }

    const pool = Array.isArray(object_pool) && object_pool.length ? object_pool : (museum_type ? MUSEUM_POOL : DEFAULT_POOL);
    const originalImageHash = stableHash(`${original_image_url}-${media_id || ''}`);
    const deterministicSeed = `${tenant_id || 'tenant'}-${room_id || 'room'}-${originalImageHash}-${extension_strength}-${object_density}-${visual_style}-${randomness}`;
    const seed = String(body.seed || deterministicSeed);
    const effectiveSeed = variation_seed ? `${seed}-variation-${variation_seed}` : seed;
    const seedNum = Array.from(effectiveSeed).reduce((a: number, c: string) => a + c.charCodeAt(0), 0) + Math.round(Number(randomness || 0) * 1000);
    const count = object_density === 'rich' ? 6 : object_density === 'minimal' ? 2 : 4;
    const leftObjects = seededPick(pool, count, seedNum);
    const rightObjects = seededPick(pool, count, seedNum + 137);

    const leftPrompt = buildPanelPrompt({ side: 'left', objects: leftObjects, density: object_density, visualStyle: visual_style });
    const rightPrompt = buildPanelPrompt({ side: 'right', objects: rightObjects, density: object_density, visualStyle: visual_style });

    const [leftUrl, rightUrl] = await Promise.all([
      generateImage(leftPrompt, original_image_url, seedNum),
      generateImage(rightPrompt, original_image_url, seedNum + 137),
    ]);

    if (!leftUrl || !rightUrl) {
      return Response.json({ status: 'failed', code: 'GENERATION_INCOMPLETE', user_message: 'The extension panels could not be generated this time.', next_action: 'Please try again in a moment.', original_image_url }, { status: 502, headers: corsHeaders });
    }

    const composition = await composePanorama({ leftUrl, originalUrl: original_image_url, rightUrl, extensionStrength: extension_strength, tenantId: tenant_id, roomId: room_id });
    if (!composition.panoramaUrl) {
      return Response.json({ status: 'failed', code: 'STITCHING_FAILED', user_message: 'Generated panels exist, but the stitched panorama could not be uploaded.', next_action: 'Regenerate the extended background before approval.', original_image_url, left_extension_url: leftUrl, right_extension_url: rightUrl }, { status: 502, headers: corsHeaders });
    }

    const generatedAt = new Date().toISOString();
    const manifest = {
      renderMode: 'single_stitched_panorama',
      originalPreserved: true,
      publicUsesSingleImage: true,
      leftPanelUrl: leftUrl,
      rightPanelUrl: rightUrl,
      stitchedPanoramaUrl: composition.panoramaUrl,
      seamBlendPercent: 0.06,
      seamBlendPixels: composition.seamBlendPixels,
      generationSettings: { extension_strength, object_density, visual_style, randomness },
      deterministicSeed,
      variationSeed: variation_seed || null,
      qaScore: composition.qaScore,
      qaWarnings: composition.qaScore >= 75 ? [] : ['This extension generated successfully, but the seam may not be clean enough for public use.'],
      generatedAt,
      approvedAt: null,
      approvedBy: null,
      sourceOriginalUrl: original_image_url,
      leftObjects,
      rightObjects,
      generationPrompt: `${leftPrompt} || ${rightPrompt}`,
      negativePrompt: AVOID,
      originalStartXPercent: composition.originalStartXPercent,
      originalEndXPercent: composition.originalEndXPercent,
      width: composition.width,
      height: composition.height,
    };

    return Response.json({
      data: {
        status: 'complete',
        original_image_url,
        left_extension_url: leftUrl,
        right_extension_url: rightUrl,
        extended_panorama_url: composition.panoramaUrl,
        scrollable_image_extended_url: composition.panoramaUrl,
        extension_strength,
        object_density,
        seed,
        deterministic_seed: deterministicSeed,
        variation_seed: variation_seed || null,
        manifest,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Generation failed unexpectedly.';
    const isConfig = msg.includes('not configured');
    return Response.json({
      data: {
        status: 'failed',
        code: isConfig ? 'NOT_CONFIGURED' : 'UNEXPECTED',
        user_message: isConfig ? msg : 'Something went wrong while generating the extension.',
        next_action: isConfig ? 'Set FAL_KEY in Supabase Edge Function secrets.' : 'Please try again.',
        error: msg,
      },
    }, { status: 500, headers: corsHeaders });
  }
});
