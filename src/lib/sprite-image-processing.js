// SPRITE PHOTOSHOP — DETERMINISTIC SUBJECT ISOLATION ENGINE
// processing_method: "deterministic_subject_mask_v1"
//
// Pipeline: load -> safe downscale -> background flood-fill from edges (color + luminance)
// -> connected-component analysis (keep largest central foreground) -> edge feather/matting
// -> tight crop + safe padding -> center inside normalized transparent canvas -> validate -> export.
//
// Hard rule: a rectangular crop with background still inside is a FAILED sprite, never "ready".

const MAX_EXPORT_EDGE = 1600;
const PROCESS_EDGE = 520; // downscale target for mask computation (keeps it fast + deterministic)

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Sprite export failed")), type, quality);
  });
}

export function loadImageToCanvas(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = typeof source === "string" ? "" : URL.createObjectURL(source);
    const cleanup = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        resolve({ image: img, canvas, ctx, width: img.naturalWidth, height: img.naturalHeight });
      } finally {
        cleanup();
      }
    };
    img.onerror = () => { cleanup(); reject(new Error("We could not load this image.")); };
    img.src = objectUrl || source;
  });
}

// Rough initial focus box (NOT a final sprite). Used only to bias detection to the center.
export function estimateInitialFocusCrop(width, height) {
  const marginX = Math.round(width * 0.04);
  const marginY = Math.round(height * 0.03);
  return {
    x: marginX,
    y: marginY,
    width: Math.max(1, width - marginX * 2),
    height: Math.max(1, height - marginY * 2),
    method: "initial_focus_box",
    confidence: 0.5,
  };
}

// Backwards-compatible aliases (used by SubjectCropCanvas as a starting rectangle only).
export const estimateCentralSubjectCrop = estimateInitialFocusCrop;

// ---------------------------------------------------------------------------
// Stage helpers
// ---------------------------------------------------------------------------

function drawDownscaled(sourceCanvas, focusCrop) {
  const sx = focusCrop ? clamp(Math.round(focusCrop.x), 0, sourceCanvas.width - 1) : 0;
  const sy = focusCrop ? clamp(Math.round(focusCrop.y), 0, sourceCanvas.height - 1) : 0;
  const sw = focusCrop ? clamp(Math.round(focusCrop.width), 1, sourceCanvas.width - sx) : sourceCanvas.width;
  const sh = focusCrop ? clamp(Math.round(focusCrop.height), 1, sourceCanvas.height - sy) : sourceCanvas.height;
  const scale = Math.min(1, PROCESS_EDGE / Math.max(sw, sh));
  const w = Math.max(8, Math.round(sw * scale));
  const h = Math.max(8, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, w, h);
  return { canvas, ctx, w, h, sx, sy, sw, sh };
}

function colorDist(data, i, r, g, b) {
  const dr = data[i] - r;
  const dg = data[i + 1] - g;
  const db = data[i + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Sample the border ring to characterise the background (median-ish via averaging clusters).
function sampleBorderColors(data, w, h) {
  const samples = [];
  const push = (x, y) => { const i = (y * w + x) * 4; samples.push([data[i], data[i + 1], data[i + 2]]); };
  const stepX = Math.max(1, Math.floor(w / 40));
  const stepY = Math.max(1, Math.floor(h / 40));
  for (let x = 0; x < w; x += stepX) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += stepY) { push(0, y); push(w - 1, y); }
  return samples;
}

// Build a background mask by flood-filling inward from the borders, expanding into
// pixels that are colour-similar to neighbouring background. This is the core of true
// segmentation: foreground = everything the background flood cannot reach.
function buildBackgroundMask(data, w, h, tolerance) {
  const total = w * h;
  const isBg = new Uint8Array(total); // 1 = background
  const queue = new Int32Array(total);
  let qHead = 0;
  let qTail = 0;

  const borderColors = sampleBorderColors(data, w, h);
  const seedTol = tolerance + 18;

  // Seed: all border pixels are background.
  const seed = (idx) => { if (!isBg[idx]) { isBg[idx] = 1; queue[qTail++] = idx; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + (w - 1)); }

  // For each border seed find nearest border color (already similar). Flood inward.
  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % w;
    const y = (idx / w) | 0;
    const i = idx * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];

    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < w - 1 ? idx + 1 : -1,
      y > 0 ? idx - w : -1,
      y < h - 1 ? idx + w : -1,
    ];
    for (let n = 0; n < 4; n++) {
      const nIdx = neighbors[n];
      if (nIdx < 0 || isBg[nIdx]) continue;
      const ni = nIdx * 4;
      // Similar to this background pixel -> part of background.
      const d = colorDist(data, ni, r, g, b);
      if (d <= tolerance) {
        isBg[nIdx] = 1;
        queue[qTail++] = nIdx;
      }
    }
  }

  // Second pass: any remaining pixel that is very close to a sampled border color AND
  // touches background gets absorbed (handles gradients / vignettes).
  for (let pass = 0; pass < 2; pass++) {
    for (let idx = 0; idx < total; idx++) {
      if (isBg[idx]) continue;
      const x = idx % w;
      const y = (idx / w) | 0;
      const touchesBg =
        (x > 0 && isBg[idx - 1]) || (x < w - 1 && isBg[idx + 1]) ||
        (y > 0 && isBg[idx - w]) || (y < h - 1 && isBg[idx + w]);
      if (!touchesBg) continue;
      const i = idx * 4;
      let nearest = Infinity;
      for (let s = 0; s < borderColors.length; s++) {
        const c = borderColors[s];
        const d = colorDist(data, i, c[0], c[1], c[2]);
        if (d < nearest) nearest = d;
        if (nearest <= seedTol) break;
      }
      if (nearest <= seedTol) { isBg[idx] = 1; queue[qTail++] = idx; }
    }
  }

  return isBg; // 1 = background, 0 = foreground candidate
}

// Connected components on foreground (isBg==0). Keep largest component nearest center.
function keepCentralComponent(isBg, w, h) {
  const total = w * h;
  const label = new Int32Array(total).fill(-1);
  const stack = new Int32Array(total);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const diag = Math.sqrt(cx * cx + cy * cy) || 1;

  let bestLabel = -1;
  let bestScore = -Infinity;
  let labelId = 0;
  const components = [];

  for (let start = 0; start < total; start++) {
    if (isBg[start] || label[start] !== -1) continue;
    let sp = 0;
    stack[sp++] = start;
    label[start] = labelId;
    let size = 0;
    let sumX = 0, sumY = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let edgeTouch = 0;

    while (sp > 0) {
      const idx = stack[--sp];
      const x = idx % w;
      const y = (idx / w) | 0;
      size++;
      sumX += x; sumY += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edgeTouch++;

      const nb = [
        x > 0 ? idx - 1 : -1, x < w - 1 ? idx + 1 : -1,
        y > 0 ? idx - w : -1, y < h - 1 ? idx + w : -1,
      ];
      for (let n = 0; n < 4; n++) {
        const nIdx = nb[n];
        if (nIdx < 0 || isBg[nIdx] || label[nIdx] !== -1) continue;
        label[nIdx] = labelId;
        stack[sp++] = nIdx;
      }
    }

    const ccx = sumX / size;
    const ccy = sumY / size;
    const centerDist = Math.sqrt((ccx - cx) ** 2 + (ccy - cy) ** 2) / diag;
    const areaFrac = size / total;
    const edgeFrac = edgeTouch / size;
    // Score: big + central + not glued to the border.
    const score = areaFrac * (1.2 - centerDist) * (1 - Math.min(0.8, edgeFrac));
    components.push({ labelId, size, areaFrac });
    if (size > total * 0.0025 && score > bestScore) { bestScore = score; bestLabel = labelId; }
    labelId++;
  }

  const mask = new Uint8Array(total); // 1 = keep (subject)
  if (bestLabel >= 0) {
    for (let idx = 0; idx < total; idx++) if (label[idx] === bestLabel) mask[idx] = 1;
  }
  const significant = components.filter((c) => c.areaFrac > 0.01).length;
  return { mask, componentCount: significant || components.length };
}

// Morphological close (fill small holes) + open (remove specks) on the keep-mask.
function refineMask(mask, w, h) {
  const total = w * h;
  const dilate = (src) => {
    const out = new Uint8Array(total);
    for (let idx = 0; idx < total; idx++) {
      if (src[idx]) { out[idx] = 1; continue; }
      const x = idx % w; const y = (idx / w) | 0;
      if ((x > 0 && src[idx - 1]) || (x < w - 1 && src[idx + 1]) ||
          (y > 0 && src[idx - w]) || (y < h - 1 && src[idx + w])) out[idx] = 1;
    }
    return out;
  };
  const erode = (src) => {
    const out = new Uint8Array(total);
    for (let idx = 0; idx < total; idx++) {
      if (!src[idx]) continue;
      const x = idx % w; const y = (idx / w) | 0;
      const keep =
        (x === 0 || src[idx - 1]) && (x === w - 1 || src[idx + 1]) &&
        (y === 0 || src[idx - w]) && (y === h - 1 || src[idx + w]);
      if (keep) out[idx] = 1;
    }
    return out;
  };
  // close then open
  return erode(dilate(dilate(erode(mask))));
}

// Compute soft alpha (0..255) at full processing resolution with a feathered edge band.
function maskToAlpha(mask, w, h) {
  const total = w * h;
  const alpha = new Uint8Array(total);
  for (let i = 0; i < total; i++) alpha[i] = mask[i] ? 255 : 0;
  // Feather: pixels adjacent to the boundary become semi-transparent for soft fur/hair edges.
  const feather = new Uint8Array(total);
  for (let idx = 0; idx < total; idx++) {
    if (!mask[idx]) continue;
    const x = idx % w; const y = (idx / w) | 0;
    const boundary =
      (x > 0 && !mask[idx - 1]) || (x < w - 1 && !mask[idx + 1]) ||
      (y > 0 && !mask[idx - w]) || (y < h - 1 && !mask[idx + w]);
    if (boundary) feather[idx] = 1;
  }
  for (let idx = 0; idx < total; idx++) if (feather[idx]) alpha[idx] = 170;
  return alpha;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateSpriteOutput(metrics) {
  const reasons = [];
  const { alphaCoverage, transparentRatio, bboxFracW, bboxFracH, componentCount, edgeTouchRatio, centerDist } = metrics;

  if (alphaCoverage < 0.04) reasons.push("Subject is too small or was removed");
  if (alphaCoverage > 0.85) reasons.push("Background retained (subject covers almost the whole image)");
  if (transparentRatio < 0.08) reasons.push("Output still resembles a rectangular photo");
  if (bboxFracW > 0.985 && bboxFracH > 0.985) reasons.push("Foreground box equals the full image");
  if (componentCount > 6) reasons.push("Too many non-subject regions");
  if (edgeTouchRatio > 0.55) reasons.push("Subject is glued to the photo border");
  if (centerDist > 0.62) reasons.push("Detected subject is not central");

  // Rectangle risk: large solid area + almost no transparency.
  const rectangleRisk = transparentRatio < 0.1 && alphaCoverage > 0.8;
  if (rectangleRisk) reasons.push("Background still inside the sprite");

  return { passed: reasons.length === 0, reasons, rectangleRisk };
}

// ---------------------------------------------------------------------------
// Canonical processor
// ---------------------------------------------------------------------------

export async function processMuseumSprite(source, options = {}) {
  const loaded = await loadImageToCanvas(source);
  const focusCrop = options.crop || null;
  const tolerance = clamp(options.tolerance ?? 34, 16, 80);

  // B. Downscale for processing
  const proc = drawDownscaled(loaded.canvas, focusCrop);
  const { data } = proc.ctx.getImageData(0, 0, proc.w, proc.h);

  // C/D. Background flood mask -> foreground
  const isBg = buildBackgroundMask(data, proc.w, proc.h, tolerance);

  // E/G/H. Keep central connected component
  const { mask: rawMask, componentCount } = keepCentralComponent(isBg, proc.w, proc.h);

  // F. Refine + feather
  const refined = refineMask(rawMask, proc.w, proc.h);
  const alpha = maskToAlpha(refined, proc.w, proc.h);

  // Metrics on the processing mask
  let keep = 0, minX = proc.w, minY = proc.h, maxX = 0, maxY = 0, edgeTouch = 0, sumX = 0, sumY = 0;
  for (let idx = 0; idx < proc.w * proc.h; idx++) {
    if (!refined[idx]) continue;
    keep++;
    const x = idx % proc.w; const y = (idx / proc.w) | 0;
    sumX += x; sumY += y;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (x === 0 || y === 0 || x === proc.w - 1 || y === proc.h - 1) edgeTouch++;
  }
  const total = proc.w * proc.h;
  const alphaCoverage = keep / total;
  const transparentRatio = 1 - alphaCoverage;
  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);
  const pcx = (proc.w - 1) / 2, pcy = (proc.h - 1) / 2;
  const procDiag = Math.sqrt(pcx * pcx + pcy * pcy) || 1;
  const centerDist = keep ? Math.sqrt((sumX / keep - pcx) ** 2 + (sumY / keep - pcy) ** 2) / procDiag : 1;

  const metrics = {
    alphaCoverage,
    transparentRatio,
    bboxFracW: bboxW / proc.w,
    bboxFracH: bboxH / proc.h,
    componentCount,
    edgeTouchRatio: keep ? edgeTouch / keep : 1,
    centerDist,
  };
  const validation = validateSpriteOutput(metrics);
  const maskQuality = clamp(
    0.4 * (1 - Math.min(1, metrics.edgeTouchRatio)) +
    0.3 * (1 - Math.min(1, metrics.centerDist)) +
    0.3 * clamp(transparentRatio, 0, 1),
    0, 1
  );

  // I/J. Map processing bbox back to source space, crop tight + safe padding, center on canvas.
  const scaleX = proc.sw / proc.w;
  const scaleY = proc.sh / proc.h;
  const padX = bboxW * 0.08;
  const padY = bboxH * 0.08;
  const srcX = clamp(proc.sx + (minX - padX) * scaleX, 0, loaded.width - 1);
  const srcY = clamp(proc.sy + (minY - padY) * scaleY, 0, loaded.height - 1);
  const srcW = clamp((bboxW + padX * 2) * scaleX, 1, loaded.width - srcX);
  const srcH = clamp((bboxH + padY * 2) * scaleY, 1, loaded.height - srcY);

  // Export canvas (full-res capped), centered with transparent padding.
  const exportScale = Math.min(1, MAX_EXPORT_EDGE / Math.max(srcW, srcH));
  const subjectW = Math.max(1, Math.round(srcW * exportScale));
  const subjectH = Math.max(1, Math.round(srcH * exportScale));
  const pad = Math.round(Math.max(subjectW, subjectH) * 0.06);
  const outW = subjectW + pad * 2;
  const outH = subjectH + pad * 2;

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d", { willReadFrequently: true });
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.clearRect(0, 0, outW, outH);
  octx.drawImage(loaded.canvas, srcX, srcY, srcW, srcH, pad, pad, subjectW, subjectH);

  // Apply alpha mask (upscaled from processing resolution) onto the exported subject.
  const subjectData = octx.getImageData(0, 0, outW, outH);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const oi = (y * outW + x) * 4;
      const insideX = x - pad;
      const insideY = y - pad;
      if (insideX < 0 || insideY < 0 || insideX >= subjectW || insideY >= subjectH) {
        subjectData.data[oi + 3] = 0;
        continue;
      }
      // Map subject pixel -> processing mask coords
      const mx = clamp(Math.round(minX - padX + (insideX / subjectW) * (bboxW + padX * 2)), 0, proc.w - 1);
      const my = clamp(Math.round(minY - padY + (insideY / subjectH) * (bboxH + padY * 2)), 0, proc.h - 1);
      const a = alpha[my * proc.w + mx];
      subjectData.data[oi + 3] = Math.min(subjectData.data[oi + 3], a);
    }
  }
  octx.putImageData(subjectData, 0, 0);

  const blob = await canvasToBlob(out, "image/png");
  const fallbackUsed = !validation.passed && options.allowFallback === true;

  const metadata = generateSpriteMetadata({
    crop: { x: srcX, y: srcY, width: srcW, height: srcH, confidence: maskQuality },
    originalWidth: loaded.width,
    originalHeight: loaded.height,
    outputWidth: outW,
    outputHeight: outH,
    method: "deterministic_subject_mask_v1",
    validationPassed: validation.passed,
    metrics,
    maskQuality,
    rectangleRisk: validation.rectangleRisk,
    fallbackUsed,
    editedByUser: !!options.editedByUser,
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    crop: metadata && { x: srcX, y: srcY, width: srcW, height: srcH, method: "deterministic_subject_mask_v1", confidence: maskQuality },
    metadata,
    validation,
    maskQuality,
    warnings: validation.reasons,
  };
}

export function generateSpriteMetadata({ crop, originalWidth, originalHeight, outputWidth, outputHeight, method = "deterministic_subject_mask_v1", validationPassed = false, metrics = {}, maskQuality = 0, rectangleRisk = false, fallbackUsed = false, editedByUser = false }) {
  const now = new Date().toISOString();
  return {
    method,
    processing_method: method,
    original_width: originalWidth,
    original_height: originalHeight,
    crop_x: Math.round(crop?.x || 0),
    crop_y: Math.round(crop?.y || 0),
    crop_width: Math.round(crop?.width || 0),
    crop_height: Math.round(crop?.height || 0),
    output_width: outputWidth,
    output_height: outputHeight,
    validation_passed: validationPassed,
    background_removed: validationPassed,
    transparent_background: validationPassed,
    subject_detected: validationPassed,
    alpha_coverage: Number((metrics.alphaCoverage || 0).toFixed(4)),
    transparent_pixel_ratio: Number((metrics.transparentRatio || 0).toFixed(4)),
    connected_components: metrics.componentCount || 0,
    foreground_bbox: { w: Number((metrics.bboxFracW || 0).toFixed(3)), h: Number((metrics.bboxFracH || 0).toFixed(3)) },
    mask_quality: Number(maskQuality.toFixed(3)),
    subject_confidence: Number(maskQuality.toFixed(3)),
    confidence: Number(maskQuality.toFixed(3)),
    rectangle_risk: !!rectangleRisk,
    fallback_used: !!fallbackUsed,
    manual_refinement_required: !validationPassed,
    edge_cleanup_applied: validationPassed,
    crop_applied: true,
    output_format: "png",
    edited_by_user: editedByUser,
    created_at: now,
    updated_at: now,
  };
}

export function normalizeSpriteAsset(sprite = {}) {
  const activeUrl = sprite.active_museum_media_url || sprite.processed_sprite_url || sprite.media_url || sprite.original_media_url || "";
  const now = new Date().toISOString();
  const x = Number(sprite.x ?? sprite.x_percent ?? sprite.museum_position?.x ?? 50);
  const y = Number(sprite.y ?? sprite.y_percent ?? sprite.museum_position?.y ?? 70);
  const width = Number(sprite.width ?? sprite.width_percent ?? sprite.museum_position?.width ?? 18);
  const height = Number(sprite.height ?? sprite.height_percent ?? sprite.museum_position?.height ?? 24);
  const processing = sprite.sprite_processing || {};
  const validated = !!processing.validation_passed;
  return {
    ...sprite,
    media_url: activeUrl,
    sprite_image_url: sprite.sprite_image_url || activeUrl,
    active_museum_media_url: activeUrl,
    processed_sprite_url: sprite.processed_sprite_url || activeUrl,
    original_media_url: sprite.original_media_url || sprite.source_image_url || sprite.media_url || activeUrl,
    source_image_url: sprite.source_image_url || sprite.original_media_url || sprite.media_url || activeUrl,
    artifact_type: sprite.artifact_type || sprite.media_type || "image",
    media_type: sprite.media_type || sprite.artifact_type || "image",
    sprite_type: sprite.sprite_type || "floor-artifact-sprite",
    background_removed: validated && !!processing.background_removed,
    background_removal_method: sprite.background_removal_method || processing.processing_method || processing.method || "deterministic_subject_mask_v1",
    background_removal_confidence: Number(sprite.background_removal_confidence ?? processing.mask_quality ?? processing.subject_confidence ?? processing.confidence ?? 0),
    background_removal_status: validated ? "processed" : "needs_review",
    edge_cleanup_status: sprite.edge_cleanup_status || (processing.eraser_touchup_applied ? "manual_cleanup_applied" : (validated ? "clean" : "needs_review")),
    x,
    y,
    x_percent: x,
    y_percent: y,
    width,
    height,
    width_percent: width,
    height_percent: height,
    rotation: Number(sprite.rotation ?? sprite.museum_position?.rotation ?? 0),
    scale: Number(sprite.scale ?? 1),
    opacity: Number(sprite.opacity ?? 1),
    z_index: Number(sprite.z_index ?? sprite.depth ?? sprite.museum_position?.z_index ?? 5),
    depth: Number(sprite.depth ?? sprite.z_index ?? sprite.museum_position?.z_index ?? 5),
    anchor_mode: sprite.anchor_mode || "bottom_center",
    foot_anchor: sprite.foot_anchor || "bottom_center",
    floor_locked: sprite.floor_locked !== false,
    visible: sprite.visible !== false,
    editable: sprite.editable !== false,
    interactive: sprite.interactive !== false,
    caption: sprite.caption || sprite.header || "",
    language: sprite.language || "en",
    qa_state: sprite.qa_state || (validated ? "ready" : "needs_review"),
    publish_state: sprite.publish_state || "draft",
    created_at: sprite.created_at || now,
    updated_at: now,
    version: sprite.version || 2,
    sprite_mode_enabled: true,
    museum_position: {
      x,
      y,
      width,
      height,
      rotation: Number(sprite.rotation ?? sprite.museum_position?.rotation ?? 0),
      z_index: Number(sprite.depth ?? sprite.museum_position?.z_index ?? 5),
      locked: !!(sprite.locked ?? sprite.museum_position?.locked),
    },
  };
}