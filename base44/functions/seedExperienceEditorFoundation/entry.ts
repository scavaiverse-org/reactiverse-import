import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VERSION = '2.0.0';
const stamp = () => new Date().toISOString();
const base = (slug, title, description, sort_order, modes = ['easy', 'expert']) => ({ slug, title, description, mode_availability: modes, status: 'active', created_by_system: true, version: VERSION, sort_order, created_at: stamp(), updated_at: stamp() });

const modules = [
  base('room-foundation-layer', 'Room Foundation Layer', 'Controls room background, image, panorama, aspect ratio, floor detection, safe zones, lighting, and spatial boundaries.', 10),
  base('artifact-sprite-layer', 'Artifact Sprite Layer', 'Controls uploaded artifacts, sprite cleanup, floor placement, drag, resize, rotation, shadow, layering, and interaction.', 20),
  base('textual-interpretation-layer', 'Textual Interpretation Layer', 'Controls titles, captions, curator notes, translation notes, simplified explanations, and visitor-facing educational text.', 30),
  base('media-performance-layer', 'Media and Performance Layer', 'Controls video, audio, opera music, narration, ambient sound, performance clips, and timed playback.', 40),
  base('interaction-hotspot-layer', 'Interaction Hotspot Layer', 'Controls clickable points, hover states, tap states, reveal cards, quiz cards, guided triggers, compare buttons, and artifact detail panels.', 50),
  base('story-sequencing-layer', 'Story Sequencing Layer', 'Controls guided tour order, room stages, cinematic timing, chapter transitions, emotional pacing, and visitor journey flow.', 60),
  base('accessibility-readability-layer', 'Accessibility and Readability Layer', 'Controls subtitles, font scale, contrast, simplified mode, elderly mode, child mode, reduced motion, and audio descriptions.', 70),
  { ...base('commerce-action-layer', 'Commerce and Action Layer', 'Controls ticket links, shop links, vendor links, donation prompts, workshop bookings, membership prompts, and collection inquiries.', 80), core: false },
  base('qa-publishing-layer', 'QA and Publishing Layer', 'Controls validation, missing media checks, broken interaction checks, mobile checks, accessibility checks, tenant safety checks, and publish approval.', 90),
  { ...base('analytics-memory-layer', 'Analytics and Memory Layer', 'Controls visitor engagement, artifact clicks, room completion, drop-off points, media watch time, scroll depth, and future recommendations.', 100, ['expert']), core: false },
].map((item, index) => ({ core: true, ...item, sort_order: item.sort_order || (index + 1) * 10 }));

const toolSlugs = ['upload-room-image','replace-room-image','crop-room-image','enable-scrollable-room','test-scrollable-room','detect-room-floor','manual-floor-baseline','reset-floor-detection','upload-artifact-sprite','remove-artifact-background','refine-sprite-edges','erase-sprite-background-manually','restore-sprite-area','place-artifact-on-floor','lock-artifact-to-floor','unlock-artifact-from-floor','drag-artifact','resize-artifact','rotate-artifact','duplicate-artifact','group-artifacts','bring-artifact-forward','send-artifact-backward','add-room-title','add-artifact-caption','add-curator-note','add-translation-note','add-video-zone','add-audio-hotspot','add-room-music','add-click-hotspot','add-compare-hotspot','add-guided-step','add-quiz-card','add-ticket-action','add-shop-action','preview-as-visitor','preview-as-child','preview-as-elderly','preview-low-bandwidth','run-publish-check','create-revision','rollback-revision','mark-human-verified','publish-draft'];
const tools = toolSlugs.map((slug, index) => ({ ...base(slug, slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '), `SCAVerse editor tool: ${slug.replaceAll('-', ' ')}.`, index + 1), module_slug: index < 8 ? 'room-foundation-layer' : index < 23 ? 'artifact-sprite-layer' : index < 31 ? 'textual-interpretation-layer' : index < 37 ? 'interaction-hotspot-layer' : index < 41 ? 'qa-publishing-layer' : 'qa-publishing-layer', tool_type: slug.includes('preview') ? 'preview' : slug.includes('publish') || slug.includes('check') ? 'qa' : 'editor', requires_media: /media|video|audio|sprite|background|image/.test(slug), requires_room_image: /floor|scrollable|artifact|sprite|room/.test(slug), requires_selected_artifact: /artifact|sprite|background|resize|rotate|duplicate|lock|unlock|forward|backward|erase|restore|refine/.test(slug), qa_related: /check|preview|publish|floating|qa/.test(slug) }));

const enginePresets = [
  ['canvas-row-transition-floor-scan', 'Canvas Row Transition Floor Scan', 'Uses canvas row brightness, saturation, and edge transition analysis.', 'canvas_row_transition_floor_scan'],
  ['aspect-ratio-safe-floor-estimate', 'Aspect Ratio Safe Floor Estimate', 'Safe fallback when image scan confidence is weak.', 'aspect_ratio_safe_floor_estimate'],
  ['manual-floor-baseline-override', 'Manual Floor Baseline Override', 'Human-verified floor baseline correction.', 'manual_floor_baseline_override'],
  ['floor-locked-sprite-placement', 'Floor Locked Sprite Placement', 'Snaps sprite bottom edge to detected or verified floor baseline.', 'floor_locked_sprite_placement'],
  ['scrollable-image-coordinate-lock', 'Scrollable Image Coordinate Lock', 'Keeps artifact coordinates attached to full panorama image instead of viewport.', 'scrollable_image_coordinate_lock'],
  ['mobile-safe-zone-generator', 'Mobile Safe Zone Generator', 'Produces mobile-safe text and interaction bounds.', 'mobile_safe_zone_generator'],
].map(([slug, title, description, method], index) => ({ ...base(slug, title, description, (index + 1) * 10), method, default_enabled: true }));

const objectTypes = [
  ['floor-artifact-sprite','Floor Artifact Sprite','A cut-out artifact that stands or rests on the detected floor baseline.','bottom_center',true],
  ['wall-artifact-sprite','Wall Artifact Sprite','A frame, poster, mask, photo, or wall-mounted object.','center',false],
  ['costume-sprite','Costume Sprite','A costume, robe, garment, headdress, or wearable artifact.','bottom_center',true],
  ['mask-sprite','Mask Sprite','A mask, face object, character headpiece, or performance symbol.','center',false],
  ['prop-sprite','Prop Sprite','A stage prop, symbolic object, handheld artifact, or performance accessory.','bottom_center',true],
  ['instrument-sprite','Instrument Sprite','A musical instrument artifact.','bottom_center',true],
  ['display-case-sprite','Display Case Sprite','A transparent or semi-transparent case for protecting artifacts.','bottom_center',true],
  ['text-label','Text Label','A short readable label near an artifact.','top_left',false],
  ['curator-card','Curator Card','A deeper interpretive card for cultural or historical explanation.','top_left',false],
  ['video-display-zone','Video Display Zone','A playable embedded video zone.','center',false],
  ['audio-hotspot','Audio Hotspot','A hotspot that plays music, narration, oral history, opera sound, or ambience.','center',false],
  ['guided-tour-step','Guided Tour Step','A sequence marker that moves the visitor through the room story.','center',false],
].map(([slug, title, description, default_anchor, floor_locked_default], index) => ({ ...base(slug, title, description, (index + 1) * 10), default_anchor, floor_locked_default }));

const templates = [
  ['asian-opera-heritage-gallery','Asian Opera Heritage Gallery','For costumes, masks, props, instruments, theatre history, and performance storytelling.','cinematic_heritage','ambient_operatic','warm_gallery'],
  ['immersive-artifact-room','Immersive Artifact Room','For cut-out artifacts placed on floor, wall, or display zones with captions and videos.','premium_museum','soft_ambient','balanced_gallery'],
  ['performance-memory-room','Performance Memory Room','For videos, oral histories, stage clips, interviews, music, and archive recordings.','theatrical_memory','performance_archive','stage_warm'],
  ['education-guided-tour-room','Education Guided Tour Room','For schools, families, guided learning, simplified captions, quizzes, and sequential explanation.','clear_educational','light_ambient','readable_gallery'],
  ['panoramic-gallery-room','Panoramic Gallery Room','For wide left-right room movement and scrollable immersive space.','spatial_gallery','calm_ambient','panoramic_soft'],
  ['private-collector-room','Private Collector Room','For collectors, galleries, private archives, and premium artifact storytelling.','luxury_archive','subtle_gallery','premium_spotlight'],
  ['festival-exhibition-room','Festival Exhibition Room','For temporary cultural events, festival exhibitions, and sponsor-supported showcases.','vibrant_cultural','festive_ambient','warm_dynamic'],
  ['theatre-stage-room','Theatre Stage Room','For performance spaces, stage history, opera characters, and choreography explanation.','dramatic_stage','theatrical_operatic','stage_spotlight'],
].map(([slug, title, description, mood, music, lighting], index) => ({ ...base(slug, title, description, (index + 1) * 10), mood, music, lighting }));

const qaRulesRaw = ['room-image-required','room-image-must-load','floor-detection-required','floor-confidence-warning','manual-floor-human-verified','sprite-must-not-float','sprite-must-not-sink','sprite-must-remain-visible','sprite-must-have-media','sprite-background-cleanup-warning','scrollable-room-coordinate-lock','mobile-safe-zone-check','missing-artifact-caption','video-zone-must-have-media','audio-hotspot-must-have-media','transcript-recommended','reduced-motion-required','contrast-readability-check','tap-target-size-check','preview-required-before-publish','tenant-id-required','public-renderer-parity-check','unsaved-changes-block-publish','broken-action-check','route-check-required'];
const critical = new Set(['room-image-required','room-image-must-load','sprite-must-not-float','sprite-must-not-sink','sprite-must-remain-visible','sprite-must-have-media','scrollable-room-coordinate-lock','mobile-safe-zone-check','video-zone-must-have-media','audio-hotspot-must-have-media','preview-required-before-publish','tenant-id-required','public-renderer-parity-check','unsaved-changes-block-publish','broken-action-check','route-check-required']);
const qaRules = qaRulesRaw.map((slug, index) => ({ ...base(slug, slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '), `QA Sentinel publishing rule: ${slug.replaceAll('-', ' ')}.`, index + 1), severity: critical.has(slug) ? 'critical' : slug.includes('human') ? 'advisory' : 'warning', blocks_publish: critical.has(slug) }));

const coCurator = [
  ['explain-artifact-simply','Explain Artifact Simply','Rewrite artifact explanation in simple public museum English. Do not invent facts.'],
  ['suggest-artifact-placement','Suggest Artifact Placement','Suggest placement using visible room layout, floor safety, balance, and readability.'],
  ['check-floating-artifacts','Check Floating Artifacts','Check sprite floor alignment, safe zones, overlap, and scale.'],
  ['write-room-title','Write Room Title','Generate clear, cinematic, culturally respectful room titles.'],
  ['make-room-less-confusing','Make Room Less Confusing','Review room from public visitor view and identify confusion.'],
  ['shorten-caption','Shorten Caption','Turn long text into short visitor-facing caption.'],
  ['child-friendly-explanation','Child Friendly Explanation','Explain room or artifact for young visitors without making false claims.'],
  ['elderly-friendly-explanation','Elderly Friendly Explanation','Make text clearer, slower, and easier to read.'],
  ['school-tour-summary','School Tour Summary','Create a structured learning summary for school groups.'],
  ['accessibility-alt-text','Accessibility Alt Text','Generate alt text from provided artifact description and visible content only.'],
  ['verification-warning','Verification Warning','Flag claims that need museum verification before publishing.'],
  ['guided-tour-order','Guided Tour Order','Suggest a room sequence that improves emotional pacing and learning clarity.'],
].map(([slug, title, prompt_text], index) => ({ ...base(slug, title, prompt_text, (index + 1) * 10), prompt_text: `${prompt_text} If unsure, say: “The museum team should verify this before publishing.”` }));

const defaults = [{ ...base('scaverse-world-class-editor-defaults', 'SCAVerse World-Class Editor Defaults', 'Canonical defaults for the unified SCAVerse Spatial Museum Editor.', 1), default_floor_detection_method: 'canvas_row_transition_floor_scan', fallback_floor_detection_method: 'aspect_ratio_safe_floor_estimate', manual_floor_method: 'manual_floor_baseline_override', default_sprite_anchor: 'bottom_center', default_sprite_floor_locked: true, default_sprite_shadow_enabled: true, default_sprite_shadow_strength: 0.32, default_sprite_opacity: 1, default_sprite_rotation: 0, default_sprite_scale: 1, default_safe_zone_margin_percent: 5, default_mobile_safe_zone_margin_percent: 8, default_text_readability_mode: 'secondary_3_english', default_preview_required_before_publish: true, default_qa_required_before_publish: true, default_reduced_motion_available: true, easy_mode_enabled: true, expert_mode_enabled: true, museum_co_curator_enabled: true, analytics_memory_enabled: true, scrollable_coordinate_lock_enabled: true }];

async function upsertMany(base44, entityName, records) {
  const existing = await base44.asServiceRole.entities[entityName].filter({}, '-created_date', 1000);
  const existingSlugs = new Set((existing || []).map((row) => row.slug).filter(Boolean));
  const missing = records.filter((record) => !existingSlugs.has(record.slug));
  for (let i = 0; i < missing.length; i += 50) {
    await base44.asServiceRole.entities[entityName].bulkCreate(missing.slice(i, i + 50));
  }
  return { created: missing.length, skipped_existing: records.length - missing.length, total: records.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const groups = {
      ExperienceEditorModule: modules,
      ExperienceEditorTool: tools,
      RoomSemanticEnginePreset: enginePresets,
      MuseumModeObjectType: objectTypes,
      ExperienceEditorTemplate: templates,
      ExperienceEditorQARule: qaRules,
      MuseumCoCuratorPromptPreset: coCurator,
      ExperienceEditorDefaultSetting: defaults,
    };
    const selectedGroups = payload.entity ? { [payload.entity]: groups[payload.entity] || [] } : groups;
    const counts = {};
    for (const [entityName, records] of Object.entries(selectedGroups)) {
      counts[entityName] = await upsertMany(base44, entityName, records);
    }

    return Response.json({ success: true, version: VERSION, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});