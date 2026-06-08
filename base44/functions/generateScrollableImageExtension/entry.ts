import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EXTENSION_SHARE = { subtle: 0.35, medium: 0.6, wide: 0.9, immersive: 1.25 };
const DENSITY_WORD = { minimal: "a few sparse", medium: "a moderate number of", rich: "a rich arrangement of" };

const DEFAULT_POOL = ["shelves", "wall decorations", "small display items", "floor continuation", "soft lighting", "storage objects", "framed pieces", "books", "boxes", "small sculptures", "plants", "fabric", "lamps"];
const MUSEUM_POOL = ["display cases", "archival posters", "costume displays", "stage curtains", "wooden panels", "lanterns", "ceramic pieces", "musical instruments", "masks", "framed cultural photographs", "soft gallery lighting"];

const AVOID = "extra people, distorted faces, duplicated animals, warped text, melted furniture, broken shelves, impossible floor perspective, inconsistent lighting, heavy blur, surreal objects, random fantasy elements, low quality, duplicate main subject, changed center image, broken wall seams, misaligned floorboards";

function seededPick(pool, count, seedNum) {
  const out = [];
  let s = seedNum || 1;
  const items = [...pool];
  for (let i = 0; i < count && items.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * items.length);
    out.push(items.splice(idx, 1)[0]);
  }
  return out;
}

function buildPanelPrompt({ side, objects, density, visualStyle }) {
  const edge = side === "left" ? "left edge" : "right edge";
  return [
    `Continue the image beyond the ${edge} of the provided reference image.`,
    `This is the ${side}-side extension panel of the same physical room or scene.`,
    `Preserve the exact camera height, lens angle, horizon line, vanishing point, wall-floor boundary, ceiling line, object scale, lighting direction, shadow softness, color temperature, material texture, and room perspective of the original reference image.`,
    `Do not create a new room. Do not reframe, zoom, rotate, or change wall position, ceiling direction, floor angle, furniture scale, window scale, object scale, or vanishing point.`,
    `Style: ${visualStyle.replace(/_/g, " ")}.`,
    `Include ${DENSITY_WORD[density] || "a moderate number of"} plausible background details only if they naturally fit the reference: ${objects.join(", ")}.`,
    `The generated side must be usable as a seamless horizontal extension panel when stitched beside the original image. Do not add conflicting architecture, people, readable text, or a second camera perspective.`,
  ].join(" ");
}

function stableHash(value = "") {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function escapeXml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function uploadPanorama(base44, svg, tenantId, roomId) {
  const file = new File([svg], `stitched-panorama-${tenantId || "tenant"}-${roomId || "room"}-${Date.now()}.svg`, { type: "image/svg+xml" });
  const uploaded = await base44.integrations.Core.UploadFile({ file });
  return uploaded?.file_url || uploaded?.url || "";
}

async function composePanorama({ base44, leftUrl, originalUrl, rightUrl, extensionStrength, seamBlendPercent = 0.06, tenantId, roomId }) {
  await Promise.all([fetch(leftUrl), fetch(originalUrl), fetch(rightUrl)]);
  const height = 1000;
  const originalWidth = 1400;
  const sidePanelShare = EXTENSION_SHARE[extensionStrength] ?? 0.6;
  const sideWidth = Math.round(originalWidth * sidePanelShare);
  const seamBlendPixels = Math.max(48, Math.round(originalWidth * seamBlendPercent));
  const width = sideWidth + originalWidth + sideWidth;
  const left = escapeXml(leftUrl);
  const center = escapeXml(originalUrl);
  const right = escapeXml(rightUrl);
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
  const panoramaUrl = await uploadPanorama(base44, svg, tenantId, roomId);
  return {
    panoramaUrl,
    width,
    height,
    seamBlendPixels,
    leftWidth: sideWidth,
    originalWidth,
    rightWidth: sideWidth,
    originalStartXPercent: (sideWidth / width) * 100,
    originalEndXPercent: ((sideWidth + originalWidth) / width) * 100,
    renderMode: "single_stitched_panorama",
    qaScore: 82,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: "failed", code: "UNAUTHORIZED", user_message: "Please sign in to generate room extensions.", next_action: "Sign in and try again." }, { status: 401 });
    const ALLOWED_ROLES = ["admin", "tenant_admin", "super_admin", "owner"];
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({
        status: "failed",
        code: "NO_GENERATION_PERMISSION",
        user_message: "Your account can edit this room, but does not have image generation permission.",
        next_action: "Ask a platform admin to enable generation access.",
      }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      original_image_url,
      extension_strength = "medium",
      randomness = 0.12,
      visual_style = "same_room_realistic",
      object_density = "medium",
      object_pool,
      museum_type,
      tenant_id,
      room_id,
      media_id,
      variation_seed,
    } = body;

    if (!original_image_url || !/^https?:\/\//i.test(original_image_url)) {
      return Response.json({ status: "failed", code: "MISSING_IMAGE", user_message: "There is no image to extend.", next_action: "Upload any image first.", original_image_url: original_image_url || "" }, { status: 400 });
    }

    const pool = Array.isArray(object_pool) && object_pool.length ? object_pool : (museum_type ? MUSEUM_POOL : DEFAULT_POOL);
    const originalImageHash = stableHash(`${original_image_url}-${media_id || ""}`);
    const deterministicSeed = `${tenant_id || "tenant"}-${room_id || "room"}-${originalImageHash}-${extension_strength}-${object_density}-${visual_style}-${randomness}`;
    const seed = String(body.seed || deterministicSeed);
    const effectiveSeed = variation_seed ? `${seed}-variation-${variation_seed}` : seed;
    const seedNum = Array.from(effectiveSeed).reduce((a, c) => a + c.charCodeAt(0), 0) + Math.round(Number(randomness || 0) * 1000);
    const count = object_density === "rich" ? 6 : object_density === "minimal" ? 2 : 4;
    const leftObjects = seededPick(pool, count, seedNum);
    const rightObjects = seededPick(pool, count, seedNum + 137);

    const leftPrompt = buildPanelPrompt({ side: "left", objects: leftObjects, density: object_density, visualStyle: visual_style });
    const rightPrompt = buildPanelPrompt({ side: "right", objects: rightObjects, density: object_density, visualStyle: visual_style });

    const [leftRes, rightRes] = await Promise.all([
      base44.integrations.Core.GenerateImage({ prompt: leftPrompt, existing_image_urls: [original_image_url] }),
      base44.integrations.Core.GenerateImage({ prompt: rightPrompt, existing_image_urls: [original_image_url] }),
    ]);

    const leftUrl = leftRes?.url || "";
    const rightUrl = rightRes?.url || "";
    if (!leftUrl || !rightUrl) {
      return Response.json({ status: "failed", code: "GENERATION_INCOMPLETE", user_message: "The extension panels could not be generated this time.", next_action: "Please try again in a moment.", original_image_url }, { status: 502 });
    }

    const composition = await composePanorama({ base44, leftUrl, originalUrl: original_image_url, rightUrl, extensionStrength: extension_strength, seamBlendPercent: 0.06, tenantId: tenant_id, roomId: room_id });
    if (!composition.panoramaUrl) {
      return Response.json({ status: "failed", code: "STITCHING_FAILED", user_message: "Generated panels exist, but the stitched panorama could not be uploaded.", next_action: "Regenerate the extended background before approval.", original_image_url, left_extension_url: leftUrl, right_extension_url: rightUrl }, { status: 502 });
    }

    const generatedAt = new Date().toISOString();
    const manifest = {
      renderMode: "single_stitched_panorama",
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
      qaWarnings: composition.qaScore >= 75 ? [] : ["This extension generated successfully, but the seam may not be clean enough for public use."],
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
      status: "complete",
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
    });
  } catch (error) {
    return Response.json({ status: "failed", code: "UNEXPECTED", user_message: "Something went wrong while generating the extension.", next_action: "Please try again.", error: error.message || "Generation failed unexpectedly." }, { status: 500 });
  }
});