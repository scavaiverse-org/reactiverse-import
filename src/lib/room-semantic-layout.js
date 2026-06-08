export const FLOOR_METHODS = {
  CANVAS_SCAN: "canvas_row_transition_floor_scan",
  FALLBACK: "aspect_ratio_safe_floor_estimate",
  MANUAL: "manual_floor_baseline_override",
  FLOOR_LOCK: "floor_locked_sprite_placement",
  SCROLL_LOCK: "scrollable_image_coordinate_lock",
};

const clamp = (value, min, max) => Math.min(Math.max(Number(value || 0), min), max);
const now = () => new Date().toISOString();

export const MUSEUM_MODE_DEFAULTS = {
  museum_mode_enabled: false,
  artifact_placement_enabled: false,
  artifact_sprites: [],
  room_semantic_layout: createFallbackSemanticLayout(),
};

export function isImageUrl(url = "") {
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.test(String(url || ""));
}

export function confidenceLabel(score = 0, humanVerified = false, fallbackUsed = false) {
  if (humanVerified) return "Human verified floor line";
  if (fallbackUsed || score < 0.58) return "Safe estimated floor";
  if (score >= 0.78) return "High confidence floor read";
  return "Medium confidence floor read";
}

function createZones({ floorYMin = 62, floorYMax = 92, baseline = 86, sidePadding = 10 } = {}) {
  const floorHeight = Math.max(6, floorYMax - floorYMin);
  return {
    safe_placement_zones: [{ id: "primary_floor_safe_zone", x: sidePadding, y: floorYMin, width: 100 - sidePadding * 2, height: floorHeight, zone_type: "floor" }],
    floor_zones: [{ id: "detected_floor", x: 0, y: floorYMin, width: 100, height: 100 - floorYMin, baseline_y: baseline }],
    wall_zones: [{ id: "primary_wall", x: 0, y: 18, width: 100, height: Math.max(18, floorYMin - 18) }],
    ceiling_zones: [{ id: "ceiling", x: 0, y: 0, width: 100, height: 18 }],
    display_zones: [{ id: "central_display", x: 12, y: 24, width: 76, height: Math.max(20, floorYMin - 30) }],
    restricted_zones: [{ id: "bottom_edge_protection", x: 0, y: 94, width: 100, height: 6 }],
    safe_text_zones: [{ id: "upper_text_safe_zone", x: 8, y: 10, width: 84, height: 30 }],
    mobile_safe_zones: [{ id: "mobile_center_safe_zone", x: 8, y: 18, width: 84, height: 64 }],
  };
}

export function createFallbackSemanticLayout({ imageUrl = "", imageWidth = 1600, imageHeight = 900, reason = "canvas scan unavailable" } = {}) {
  const aspect = imageWidth && imageHeight ? imageWidth / imageHeight : 16 / 9;
  const wide = aspect > 1.45;
  const floorYMin = wide ? 61 : 64;
  const floorYMax = 93;
  const baseline = wide ? 87 : 88;
  const floor_confidence = imageUrl ? 0.55 : 0.45;
  const zones = createZones({ floorYMin, floorYMax, baseline, sidePadding: wide ? 10 : 14 });
  return {
    floor_detected: false,
    floor_y_min: floorYMin,
    floor_y_max: floorYMax,
    floor_baseline_y: baseline,
    floor_confidence,
    confidence: floor_confidence,
    floor_confidence_label: confidenceLabel(floor_confidence, false, true),
    fallback_used: true,
    detection_method: FLOOR_METHODS.FALLBACK,
    manual_floor_override: false,
    manual_floor_baseline_y: null,
    human_verified: false,
    ...zones,
    scan_metadata: {
      canvas_width: 0,
      canvas_height: 0,
      source_width: imageWidth,
      source_height: imageHeight,
      row_start_percent: 42,
      row_end_percent: 92,
      selected_transition_percent: baseline,
      transition_score: 0,
      confidence_score: floor_confidence,
      fallback_reason: reason,
      method_used: FLOOR_METHODS.FALLBACK,
    },
    scan_sample_rows: [],
    scan_best_transition: baseline,
    scan_brightness_delta: 0,
    scan_saturation_delta: 0,
    scan_edge_delta: 0,
    image_width: imageWidth,
    image_height: imageHeight,
    aspect_ratio: aspect,
    last_scan_at: now(),
    last_scan_source: imageUrl,
    version: 2,
  };
}

function rgbStats(row) {
  let brightness = 0;
  let saturation = 0;
  let edge = 0;
  for (let i = 0; i < row.length; i += 4) {
    const r = row[i];
    const g = row[i + 1];
    const b = row[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    brightness += (r + g + b) / 3;
    saturation += max ? (max - min) / max : 0;
    if (i >= 4) edge += Math.abs(r - row[i - 4]) + Math.abs(g - row[i - 3]) + Math.abs(b - row[i - 2]);
  }
  const pixels = Math.max(1, row.length / 4);
  return { brightness: brightness / pixels, saturation: saturation / pixels, edge: edge / pixels };
}

export function analyzeCanvasForFloor(canvas, { imageUrl = "" } = {}) {
  if (!canvas?.width || !canvas?.height) return createFallbackSemanticLayout({ imageUrl, reason: "missing canvas" });
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;
  const startPercent = 42;
  const endPercent = 92;
  const step = Math.max(2, Math.floor(height / 120));
  const rows = [];

  for (let y = Math.floor(height * startPercent / 100); y <= Math.floor(height * endPercent / 100); y += step) {
    const data = ctx.getImageData(0, y, width, 1).data;
    rows.push({ y, percent: (y / height) * 100, ...rgbStats(data) });
  }

  let best = null;
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1];
    const row = rows[i];
    const brightnessDelta = Math.abs(row.brightness - prev.brightness);
    const saturationDelta = Math.abs(row.saturation - prev.saturation) * 120;
    const edgeDelta = Math.abs(row.edge - prev.edge) * 0.32;
    const lowerFloorBonus = row.percent > 55 && row.percent < 86 ? 12 : 0;
    const score = brightnessDelta * 0.44 + saturationDelta * 0.28 + edgeDelta * 0.28 + lowerFloorBonus;
    const candidate = { ...row, brightness_delta: brightnessDelta, saturation_delta: saturationDelta, edge_delta: edgeDelta, score };
    if (!best || candidate.score > best.score) best = candidate;
  }

  const transition = clamp(best?.percent || 64, 50, 82);
  const floorYMin = clamp(transition + 2, 54, 82);
  const baseline = clamp(floorYMin + 24, floorYMin + 8, 91);
  const floorYMax = clamp(Math.max(92, baseline + 4), baseline + 2, 96);
  const score = clamp((best?.score || 0) / 42, 0, 1);
  const floor_confidence = score >= 0.48 ? clamp(0.5 + score * 0.48, 0.58, 0.94) : 0.52;
  const fallback = floor_confidence < 0.58;
  if (fallback) return createFallbackSemanticLayout({ imageUrl, imageWidth: width, imageHeight: height, reason: "weak row transition score" });

  const zones = createZones({ floorYMin, floorYMax, baseline, sidePadding: width / height > 1.45 ? 10 : 14 });
  return {
    floor_detected: true,
    floor_y_min: floorYMin,
    floor_y_max: floorYMax,
    floor_baseline_y: baseline,
    floor_confidence,
    confidence: floor_confidence,
    floor_confidence_label: confidenceLabel(floor_confidence),
    fallback_used: false,
    detection_method: FLOOR_METHODS.CANVAS_SCAN,
    manual_floor_override: false,
    manual_floor_baseline_y: null,
    human_verified: false,
    ...zones,
    scan_metadata: {
      canvas_width: width,
      canvas_height: height,
      source_width: width,
      source_height: height,
      row_start_percent: startPercent,
      row_end_percent: endPercent,
      selected_transition_percent: transition,
      transition_score: best?.score || 0,
      confidence_score: floor_confidence,
      fallback_reason: "",
      method_used: FLOOR_METHODS.CANVAS_SCAN,
    },
    scan_sample_rows: rows.filter((_, index) => index % 6 === 0).map((row) => ({ percent: Number(row.percent.toFixed(2)), brightness: Number(row.brightness.toFixed(2)), saturation: Number(row.saturation.toFixed(3)), edge: Number(row.edge.toFixed(2)) })),
    scan_best_transition: transition,
    scan_brightness_delta: best?.brightness_delta || 0,
    scan_saturation_delta: best?.saturation_delta || 0,
    scan_edge_delta: best?.edge_delta || 0,
    image_width: width,
    image_height: height,
    aspect_ratio: width / height,
    last_scan_at: now(),
    last_scan_source: imageUrl,
    version: 2,
  };
}

export function analyzeRoomLayoutForArtifactPlacement({ imageUrl = "", imageWidth = 1600, imageHeight = 900, canvas = null } = {}) {
  return canvas ? analyzeCanvasForFloor(canvas, { imageUrl }) : createFallbackSemanticLayout({ imageUrl, imageWidth, imageHeight });
}

export function applyManualFloorOverride(layout = {}, baselineY = 88) {
  const baseline = clamp(baselineY, 42, 94);
  const floorYMin = clamp(Math.min(Number(layout.floor_y_min || baseline - 24), baseline - 8), 32, baseline - 6);
  const floorYMax = clamp(Math.max(Number(layout.floor_y_max || baseline + 5), baseline + 3), baseline + 2, 96);
  const zones = createZones({ floorYMin, floorYMax, baseline, sidePadding: 10 });
  return {
    ...layout,
    floor_detected: true,
    floor_y_min: floorYMin,
    floor_y_max: floorYMax,
    floor_baseline_y: baseline,
    floor_confidence: 1,
    confidence: 1,
    floor_confidence_label: confidenceLabel(1, true),
    fallback_used: false,
    detection_method: FLOOR_METHODS.MANUAL,
    manual_floor_override: true,
    manual_floor_baseline_y: baseline,
    human_verified: true,
    ...zones,
    scan_metadata: { ...(layout.scan_metadata || {}), selected_transition_percent: baseline, confidence_score: 1, method_used: FLOOR_METHODS.MANUAL },
    last_scan_at: now(),
    version: 2,
  };
}

export function normalizeScrollableCoordinateSpace(room = {}) {
  return {
    scrollable_image_coordinate_space: room.scrollable_image_enabled ? "full_image_percent" : "viewport_percent",
    scrollable_image_viewport_x: Number(room.scrollable_image_viewport_x || 0),
    scrollable_image_full_width_reference: Number(room.scrollable_image_full_width_reference || room.room_semantic_layout?.image_width || 0),
    scrollable_image_public_parity_checked: !!room.scrollable_image_public_parity_checked,
  };
}

export function getDefaultArtifactPlacement({ room = {}, semanticLayout, createdFromMode = "easy" } = {}) {
  const layout = semanticLayout || room.room_semantic_layout || MUSEUM_MODE_DEFAULTS.room_semantic_layout;
  const zone = layout.safe_placement_zones?.[0] || { id: "primary_floor_safe_zone", x: 12, y: 62, width: 76, height: 30 };
  const width = 18;
  const height = 24;
  const baseline = Number(layout.floor_baseline_y || zone.y + zone.height);
  const x = clamp(zone.x + zone.width / 2 - width / 2, 0, 100 - width);
  const y = clamp(baseline - height, 0, 100 - height);
  const createdAt = now();
  return {
    id: crypto.randomUUID(), tenant_id: "", experience_id: "", room_id: room.id || room.room_key || "", artifact_id: "",
    title: "Artifact sprite", description: "", source_image_url: "", media_url: "", sprite_image_url: "", processed_sprite_url: "", active_museum_media_url: "",
    sprite_type: "floor-artifact-sprite", background_removed: false, background_removal_method: "none", background_removal_confidence: 0, background_removal_status: "not_started", edge_cleanup_status: "not_started",
    x, y, x_percent: x, y_percent: y, width, height, width_percent: width, height_percent: height, rotation: 0, scale: 1, opacity: 1, z_index: 5, depth: 5, layer_group: "artifact_sprites",
    anchor_mode: "bottom_center", foot_anchor: "bottom_center", floor_locked: true, floor_contact_y: baseline, floor_baseline_y_at_placement: baseline, semantic_zone_id: zone.id || "primary_floor_safe_zone",
    placement_confidence: Number(layout.floor_confidence || layout.confidence || 0.55), placement_method: FLOOR_METHODS.FLOOR_LOCK,
    shadow_enabled: true, shadow_strength: 0.32, shadow_blur: 18, shadow_offset_x: 0, shadow_offset_y: 8, reflection_enabled: false, reflection_strength: 0.12,
    locked: false, visible: true, editable: true, interactive: true, display_mode: "click", action_type: "open_card", action_target: "", header: "", body: "", caption: "", curator_note: "",
    accessibility_label: "", audio_description: "", video_url: "", audio_url: "", transcript: "", language: "en", created_from_mode: createdFromMode, last_edited_from_mode: createdFromMode,
    qa_state: "needs_review", publish_state: "draft", created_by: "", updated_by: "", created_at: createdAt, updated_at: createdAt, version: 2,
  };
}

export function clampArtifactToSafeZone({ artifact = {}, semanticLayout, snapToFloor = false } = {}) {
  const layout = semanticLayout || MUSEUM_MODE_DEFAULTS.room_semantic_layout;
  const zone = layout.safe_placement_zones?.[0] || { id: "primary_floor_safe_zone", x: 8, y: 60, width: 84, height: 34 };
  const width = clamp(artifact.width ?? artifact.width_percent ?? 18, 3, 90);
  const height = clamp(artifact.height ?? artifact.height_percent ?? 24, 4, 88);
  const minX = 0;
  const maxX = 100 - width;
  const minY = 0;
  const maxY = Math.min(100 - height, Number(layout.floor_y_max || 94) - height);
  const baseline = clamp(artifact.floor_contact_y || layout.floor_baseline_y || zone.y + zone.height, 8, 96);
  const floorY = clamp(baseline - height, minY, maxY);
  const x = clamp(artifact.x ?? artifact.x_percent ?? zone.x + zone.width / 2 - width / 2, minX, maxX);
  const shouldSnap = snapToFloor || artifact.floor_locked !== false;
  const y = shouldSnap ? floorY : clamp(artifact.y ?? artifact.y_percent ?? floorY, minY, maxY);
  return {
    ...artifact,
    width,
    height,
    width_percent: width,
    height_percent: height,
    x,
    y,
    x_percent: x,
    y_percent: y,
    z_index: Number(artifact.z_index ?? artifact.depth ?? 5),
    depth: Number(artifact.depth ?? artifact.z_index ?? 5),
    floor_locked: artifact.floor_locked !== false,
    floor_contact_y: shouldSnap ? baseline : artifact.floor_contact_y || baseline,
    floor_baseline_y_at_placement: artifact.floor_baseline_y_at_placement || baseline,
    placement_method: shouldSnap ? FLOOR_METHODS.FLOOR_LOCK : artifact.placement_method || "manual_free_placement",
    semantic_zone_id: artifact.semantic_zone_id || zone.id || "primary_floor_safe_zone",
    visible: artifact.visible !== false,
    editable: artifact.editable !== false,
    interactive: artifact.interactive !== false,
    updated_at: now(),
    version: artifact.version || 2,
  };
}

export function normalizeMuseumModeRoom(room = {}) {
  const base = { ...MUSEUM_MODE_DEFAULTS, ...room };
  const semanticLayout = base.room_semantic_layout?.safe_placement_zones ? { ...createFallbackSemanticLayout({ imageUrl: base.background_media_url || base.media_url }), ...base.room_semantic_layout } : analyzeRoomLayoutForArtifactPlacement({ imageUrl: base.background_media_url || base.media_url });
  const scrollablePatch = normalizeScrollableCoordinateSpace(base);
  return {
    ...base,
    ...scrollablePatch,
    museum_mode_enabled: !!base.museum_mode_enabled,
    artifact_placement_enabled: !!base.artifact_placement_enabled,
    room_semantic_layout: semanticLayout,
    artifact_sprites: Array.isArray(base.artifact_sprites) ? base.artifact_sprites.map((artifact) => clampArtifactToSafeZone({ artifact: { ...getDefaultArtifactPlacement({ room: base, semanticLayout }), ...artifact }, semanticLayout })) : [],
  };
}