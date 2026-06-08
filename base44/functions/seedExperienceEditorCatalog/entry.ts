import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const now = () => new Date().toISOString();
const meta = (sort_order) => ({ status: 'active', created_by_system: true, version: '2.0.0', sort_order, created_at: now(), updated_at: now() });
const titleize = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

async function seedCollection(base44, entityName, records) {
  const existing = await base44.asServiceRole.entities[entityName].list('-created_date', 1000);
  const keys = new Set(existing.map((item) => item.slug || item.check_key).filter(Boolean));
  const missing = records.filter((record) => !keys.has(record.slug || record.check_key));
  for (let i = 0; i < missing.length; i += 50) {
    await base44.asServiceRole.entities[entityName].bulkCreate(missing.slice(i, i + 50));
  }
  return { created: missing.length, skipped: records.length - missing.length };
}

const modules = [
  ['room-foundation-layer','Room Foundation Layer','Controls room background, image, panorama, aspect ratio, floor detection, safe zones, lighting, and spatial boundaries.', ['easy','expert'], true],
  ['artifact-sprite-layer','Artifact Sprite Layer','Controls uploaded artifacts, sprite cleanup, floor placement, drag, resize, rotation, shadow, layering, and interaction.', ['easy','expert'], true],
  ['textual-interpretation-layer','Textual Interpretation Layer','Controls titles, captions, curator notes, translation notes, simplified explanations, and visitor-facing educational text.', ['easy','expert'], true],
  ['media-performance-layer','Media and Performance Layer','Controls video, audio, opera music, narration, ambient sound, performance clips, and timed playback.', ['easy','expert'], true],
  ['interaction-hotspot-layer','Interaction Hotspot Layer','Controls clickable points, hover states, tap states, reveal cards, quiz cards, guided triggers, compare buttons, and artifact detail panels.', ['easy','expert'], true],
  ['story-sequencing-layer','Story Sequencing Layer','Controls guided tour order, room stages, cinematic timing, chapter transitions, emotional pacing, and visitor journey flow.', ['easy','expert'], true],
  ['accessibility-readability-layer','Accessibility and Readability Layer','Controls subtitles, font scale, contrast, simplified mode, elderly mode, child mode, reduced motion, and audio descriptions.', ['easy','expert'], true],
  ['commerce-action-layer','Commerce and Action Layer','Controls ticket links, shop links, vendor links, donation prompts, workshop bookings, membership prompts, and collection inquiries.', ['easy','expert'], false],
  ['qa-publishing-layer','QA and Publishing Layer','Controls validation, missing media checks, broken interaction checks, mobile checks, accessibility checks, tenant safety checks, and publish approval.', ['easy','expert'], true],
  ['analytics-memory-layer','Analytics and Memory Layer','Controls visitor engagement, artifact clicks, room completion, drop-off points, media watch time, scroll depth, and future recommendations.', ['expert'], false]
].map(([slug, title, description, mode_availability, core], index) => ({ slug, title, description, mode_availability, core, ...meta((index + 1) * 10) }));

const toolSlugs = ['upload-room-image','replace-room-image','crop-room-image','enable-scrollable-room','test-scrollable-room','detect-room-floor','manual-floor-baseline','reset-floor-detection','upload-artifact-sprite','remove-artifact-background','refine-sprite-edges','erase-sprite-background-manually','restore-sprite-area','place-artifact-on-floor','lock-artifact-to-floor','unlock-artifact-from-floor','drag-artifact','resize-artifact','rotate-artifact','duplicate-artifact','group-artifacts','bring-artifact-forward','send-artifact-backward','add-room-title','add-artifact-caption','add-curator-note','add-translation-note','add-video-zone','add-audio-hotspot','add-room-music','add-click-hotspot','add-compare-hotspot','add-guided-step','add-quiz-card','add-ticket-action','add-shop-action','preview-as-visitor','preview-as-child','preview-as-elderly','preview-low-bandwidth','run-publish-check','create-revision','rollback-revision','mark-human-verified','publish-draft'];
const tools = toolSlugs.map((slug, index) => ({ slug, title: titleize(slug), description: `SCAVerse editor tool: ${slug.replace(/-/g, ' ')}.`, module_slug: index < 8 ? 'room-foundation-layer' : index < 23 ? 'artifact-sprite-layer' : index < 28 ? 'textual-interpretation-layer' : index < 31 ? 'media-performance-layer' : index < 36 ? 'interaction-hotspot-layer' : 'qa-publishing-layer', tool_type: 'editor_action', mode_availability: index < 8 ? ['easy','expert'] : ['expert'], requires_media: /media|sprite|background|video|audio/.test(slug), requires_room_image: /floor|room|sprite|artifact/.test(slug), requires_selected_artifact: /artifact|sprite/.test(slug) && !slug.startsWith('upload'), qa_related: /check|preview|publish|floor|coordinate/.test(slug), ...meta(index + 1) }));

const enginePresets = [
  ['canvas-row-transition-floor-scan','Canvas Row Transition Floor Scan','Uses canvas row brightness, saturation, and edge transition analysis.','canvas_row_transition_floor_scan',['easy','expert']],
  ['aspect-ratio-safe-floor-estimate','Aspect Ratio Safe Floor Estimate','Safe fallback when image scan confidence is weak.','aspect_ratio_safe_floor_estimate',['easy','expert']],
  ['manual-floor-baseline-override','Manual Floor Baseline Override','Human-verified floor baseline correction.','manual_floor_baseline_override',['expert']],
  ['floor-locked-sprite-placement','Floor Locked Sprite Placement','Snaps sprite bottom edge to detected or verified floor baseline.','floor_locked_sprite_placement',['easy','expert']],
  ['scrollable-image-coordinate-lock','Scrollable Image Coordinate Lock','Keeps artifact coordinates attached to full panorama image instead of viewport.','scrollable_image_coordinate_lock',['easy','expert']],
  ['mobile-safe-zone-generator','Mobile Safe Zone Generator','Produces mobile-safe text and interaction bounds.','mobile_safe_zone_generator',['easy','expert']]
].map(([slug, title, description, method, mode_availability], index) => ({ slug, title, description, method, mode_availability, default_enabled: true, ...meta((index + 1) * 10) }));

const objectTypes = [
  ['floor-artifact-sprite','Floor Artifact Sprite','A cut-out artifact that stands or rests on the detected floor baseline.','bottom_center',true], ['wall-artifact-sprite','Wall Artifact Sprite','A frame, poster, mask, photo, or wall-mounted object.','center',false], ['costume-sprite','Costume Sprite','A costume, robe, garment, headdress, or wearable artifact.','bottom_center',true], ['mask-sprite','Mask Sprite','A mask, face object, character headpiece, or performance symbol.','center',false], ['prop-sprite','Prop Sprite','A stage prop, symbolic object, handheld artifact, or performance accessory.','bottom_center',true], ['instrument-sprite','Instrument Sprite','A musical instrument artifact.','bottom_center',true], ['display-case-sprite','Display Case Sprite','A transparent or semi-transparent case for protecting artifacts.','bottom_center',true], ['text-label','Text Label','A short readable label near an artifact.','top_left',false], ['curator-card','Curator Card','A deeper interpretive card for cultural or historical explanation.','top_left',false], ['video-display-zone','Video Display Zone','A playable embedded video zone.','center',false], ['audio-hotspot','Audio Hotspot','A hotspot that plays music, narration, oral history, opera sound, or ambience.','center',false], ['guided-tour-step','Guided Tour Step','A sequence marker that moves the visitor through the room story.','center',false]
].map(([slug, title, description, default_anchor, floor_locked], index) => ({ slug, title, description, default_anchor, floor_locked, mode_availability: ['easy','expert'], ...meta((index + 1) * 10) }));

const templates = [
  ['asian-opera-heritage-gallery','Asian Opera Heritage Gallery','For costumes, masks, props, instruments, theatre history, and performance storytelling.','cinematic_heritage','ambient_operatic','warm_gallery'], ['immersive-artifact-room','Immersive Artifact Room','For cut-out artifacts placed on floor, wall, or display zones with captions and videos.','premium_museum','soft_ambient','balanced_gallery'], ['performance-memory-room','Performance Memory Room','For videos, oral histories, stage clips, interviews, music, and archive recordings.','theatrical_memory','performance_archive','stage_warm'], ['education-guided-tour-room','Education Guided Tour Room','For schools, families, guided learning, simplified captions, quizzes, and sequential explanation.','clear_educational','light_ambient','readable_gallery'], ['panoramic-gallery-room','Panoramic Gallery Room','For wide left-right room movement and scrollable immersive space.','spatial_gallery','calm_ambient','panoramic_soft'], ['private-collector-room','Private Collector Room','For collectors, galleries, private archives, and premium artifact storytelling.','luxury_archive','subtle_gallery','premium_spotlight'], ['festival-exhibition-room','Festival Exhibition Room','For temporary cultural events, festival exhibitions, and sponsor-supported showcases.','vibrant_cultural','festive_ambient','warm_dynamic'], ['theatre-stage-room','Theatre Stage Room','For performance spaces, stage history, opera characters, and choreography explanation.','dramatic_stage','theatrical_operatic','stage_spotlight']
].map(([slug, title, description, mood, music, lighting], index) => ({ slug, title, description, mood, music, lighting, mode_availability: ['easy','expert'], ...meta((index + 1) * 10) }));

const qaSlugs = ['room-image-required','room-image-must-load','floor-detection-required','floor-confidence-warning','manual-floor-human-verified','sprite-must-not-float','sprite-must-not-sink','sprite-must-remain-visible','sprite-must-have-media','sprite-background-cleanup-warning','scrollable-room-coordinate-lock','mobile-safe-zone-check','missing-artifact-caption','video-zone-must-have-media','audio-hotspot-must-have-media','transcript-recommended','reduced-motion-required','contrast-readability-check','tap-target-size-check','preview-required-before-publish','tenant-id-required','public-renderer-parity-check','unsaved-changes-block-publish','broken-action-check','route-check-required'];
const criticalRules = new Set(['room-image-required','room-image-must-load','sprite-must-not-float','sprite-must-not-sink','sprite-must-remain-visible','sprite-must-have-media','scrollable-room-coordinate-lock','mobile-safe-zone-check','video-zone-must-have-media','audio-hotspot-must-have-media','preview-required-before-publish','tenant-id-required','public-renderer-parity-check','unsaved-changes-block-publish','broken-action-check','route-check-required']);
const qaRules = qaSlugs.map((slug, index) => ({ slug, title: titleize(slug), description: `QA rule for ${slug.replace(/-/g, ' ')}.`, severity: criticalRules.has(slug) ? 'critical' : 'warning', rule_type: 'spatial_editor_publish_gate', blocks_publish: criticalRules.has(slug), mode_availability: ['easy','expert'], ...meta(index + 1) }));
const sentinelChecks = qaSlugs.map((slug) => ({ check_key: `spatial-editor-${slug}`, label: titleize(slug), domain: 'tenant_admin', route: '/museum/:tenantSlug/admin/walkthrough', check_type: criticalRules.has(slug) ? 'publish_gate' : 'spatial_editor', selector: '', expected_behavior: `Validate ${slug.replace(/-/g, ' ')} before publish.`, enabled: true, critical: criticalRules.has(slug), tenant_scope: 'per_tenant', last_status: 'unknown', last_checked_at: now() }));
const prompts = ['explain-artifact-simply','suggest-artifact-placement','check-floating-artifacts','write-room-title','make-room-less-confusing','shorten-caption','child-friendly-explanation','elderly-friendly-explanation','school-tour-summary','accessibility-alt-text','verification-warning','guided-tour-order'].map((slug, index) => ({ slug, title: titleize(slug), description: `Museum Co-Curator preset: ${slug.replace(/-/g, ' ')}. Do not invent facts.`, safety_rule: 'The museum team should verify this before publishing.', mode_availability: ['easy','expert'], ...meta(index + 1) }));
const defaultSettings = [{ slug: 'scaverse-world-class-editor-defaults', title: 'SCAVerse World-Class Editor Defaults', default_floor_detection_method: 'canvas_row_transition_floor_scan', fallback_floor_detection_method: 'aspect_ratio_safe_floor_estimate', manual_floor_method: 'manual_floor_baseline_override', default_sprite_anchor: 'bottom_center', default_sprite_floor_locked: true, default_sprite_shadow_enabled: true, default_sprite_shadow_strength: 0.32, default_sprite_opacity: 1, default_sprite_rotation: 0, default_sprite_scale: 1, default_safe_zone_margin_percent: 5, default_mobile_safe_zone_margin_percent: 8, default_text_readability_mode: 'secondary_3_english', default_preview_required_before_publish: true, default_qa_required_before_publish: true, default_reduced_motion_available: true, easy_mode_enabled: true, expert_mode_enabled: true, museum_co_curator_enabled: true, analytics_memory_enabled: true, scrollable_coordinate_lock_enabled: true, ...meta(1) }];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    const counts = {
      ExperienceEditorModule: await seedCollection(base44, 'ExperienceEditorModule', modules),
      ExperienceEditorTool: await seedCollection(base44, 'ExperienceEditorTool', tools),
      RoomSemanticEnginePreset: await seedCollection(base44, 'RoomSemanticEnginePreset', enginePresets),
      MuseumModeObjectType: await seedCollection(base44, 'MuseumModeObjectType', objectTypes),
      ExperienceEditorTemplate: await seedCollection(base44, 'ExperienceEditorTemplate', templates),
      ExperienceEditorQARule: await seedCollection(base44, 'ExperienceEditorQARule', qaRules),
      MuseumCoCuratorPromptPreset: await seedCollection(base44, 'MuseumCoCuratorPromptPreset', prompts),
      ExperienceEditorDefaultSetting: await seedCollection(base44, 'ExperienceEditorDefaultSetting', defaultSettings),
      QASentinelCheck: await seedCollection(base44, 'QASentinelCheck', sentinelChecks),
    };
    return Response.json({ success: true, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});