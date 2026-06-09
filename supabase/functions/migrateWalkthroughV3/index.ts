import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, getServiceRoleClient } from '../_shared/supabase-client.ts';

const WALKTHROUGH_EDITOR_TYPE = 'aom_world_class_experience_builder';
const WALKTHROUGHS = ['walkthrough1', 'walkthrough2', 'walkthrough3', 'walkthrough4', 'walkthrough5'];

function deterministicId(recordId: string, prefix: string, index: number) {
  return `${recordId || 'record'}_${prefix}_${index + 1}`;
}

function walkthroughLabel(key = 'walkthrough1') {
  return key.replace('walkthrough', 'Walkthrough');
}

function roomSuffixFromIndex(index = 0) {
  let n = index + 1;
  let suffix = '';
  while (n > 0) {
    n -= 1;
    suffix = String.fromCharCode(97 + (n % 26)) + suffix;
    n = Math.floor(n / 26);
  }
  return suffix;
}

function createAccessibilityConfig(source: Record<string, unknown> = {}) {
  return {
    reduced_motion_text: source.reduced_motion_text || '',
    sensory_warning: source.sensory_warning || '',
    calm_mode_available: source.calm_mode_available !== false,
    transcript: source.transcript || '',
    alt_text: source.alt_text || '',
  };
}

function createAdaptiveModesConfig(source: Record<string, unknown> = {}) {
  return {
    calm_mode: source.calm_mode !== false,
    reduced_motion: source.reduced_motion !== false,
    accessibility_mode: source.accessibility_mode !== false,
    mobile_mode: source.mobile_mode !== false,
  };
}

function createBranchingConfig(source: Record<string, unknown> = {}) {
  return {
    required: !!source.required,
    optional: source.optional !== false,
    next_room_id: source.next_room_id || '',
    fallback_room_id: source.fallback_room_id || '',
    conditions: Array.isArray(source.conditions) ? source.conditions : [],
  };
}

function ensureTypeConfigs(room: Record<string, unknown> = {}) {
  const pageType = room.page_type || 'walkthrough_exhibition';
  return {
    emotional_intensity: Number(room.emotional_intensity ?? 40),
    curiosity_level: Number(room.curiosity_level ?? 55),
    educational_density: Number(room.educational_density ?? 50),
    interaction_density: Number(room.interaction_density ?? 45),
    sensory_intensity: Number(room.sensory_intensity ?? 45),
    estimated_duration_seconds: Number(room.estimated_duration_seconds ?? 60),
    ambience: room.ambience || '',
    mood: room.mood || '',
    lighting: room.lighting || '',
    camera_motion: room.camera_motion || 'none',
    foreground_media_url: room.foreground_media_url || '',
    narrator_audio_url: room.narrator_audio_url || '',
    ...room,
    page_type: pageType,
    accessibility: createAccessibilityConfig((room.accessibility as Record<string, unknown>) || {}),
    adaptive_modes: createAdaptiveModesConfig((room.adaptive_modes as Record<string, unknown>) || {}),
    branching: createBranchingConfig((room.branching as Record<string, unknown>) || {}),
    onboarding_config: { guide_mode: 'welcome', guide_name: 'Museum Guide', guide_avatar_url: '', guide_voice_url: '', intro_text: '', step_instruction: '', visitor_choice_prompt: '', choices: [], show_progress: true, allow_skip: false, skip_target_room_id: '', ...((room.onboarding_config as Record<string, unknown>) || {}) },
    artifact_config: { room_layout: 'spotlight', artifacts: [], show_artifact_cards: true, allow_zoom: true, allow_save_artifact: false, allow_ask_ai: true, semantic_description: '', ai_explainer_prompt: '', ...((room.artifact_config as Record<string, unknown>) || {}) },
    exhibition_config: { exhibition_mode: 'cinematic_scene', scene_title: '', scene_narrative: '', camera_motion: 'none', mood: '', lighting: '', ambience_audio_url: '', narrator_audio_url: '', hotspots: [], cinematic_ctas: [], ...((room.exhibition_config as Record<string, unknown>) || {}) },
    gamification_config: { game_type: 'quiz', objective_text: '', instructions: '', points_awarded: 10, badge_name: '', badge_icon_url: '', required_completion: false, allow_retry: true, success_message: 'Great work — challenge complete.', failure_message: 'Try again or continue when ready.', next_room_on_success: '', next_room_on_failure: '', questions: [], missions: [], ...((room.gamification_config as Record<string, unknown>) || {}) },
    reflection_config: { reflection_prompt: '', journal_placeholder: 'Write what this room made you notice...', mood_options: ['calm', 'curious', 'moved'], calm_mode_default: true, completion_message: 'Reflection saved.', ...((room.reflection_config as Record<string, unknown>) || {}) },
    ai_conversation_config: { persona_name: 'ARIA', system_context: 'Answer only from this museum experience and the current room context.', starter_questions: ['What should I notice here?', 'Why is this important?'], artifact_context_enabled: true, suggested_next_room_id: '', ...((room.ai_conversation_config as Record<string, unknown>) || {}) },
    performance_config: { stage_title: '', performance_media_url: '', script_text: '', lyrics_text: '', translation_text: '', spotlight_style: 'gold', subtitles_enabled: true, ...((room.performance_config as Record<string, unknown>) || {}) },
    timeline_config: { timeline_title: '', events: [], show_progression_line: true, chronology_mode: 'linear', ...((room.timeline_config as Record<string, unknown>) || {}) },
    archive_config: { archive_title: '', documents: [], searchable: true, categories: ['poster', 'recording', 'photo', 'scan'], ...((room.archive_config as Record<string, unknown>) || {}) },
    branching_choice_config: { prompt: 'Which path would you like to follow?', choices: [], ...((room.branching_choice_config as Record<string, unknown>) || {}) },
    memory_collection_config: { collection_title: '', prompt: 'Save a discovery from this room.', collectibles: [], allow_journal: true, ...((room.memory_collection_config as Record<string, unknown>) || {}) },
    finale_config: { completion_message: 'You completed the experience.', achievement_title: 'Museum Journey Complete', next_ctas: [], ...((room.finale_config as Record<string, unknown>) || {}) },
  };
}

function mapScene(record: Record<string, unknown>, scene: Record<string, unknown> = {}, index = 0, walkthroughKey = 'walkthrough1') {
  return ensureTypeConfigs({
    ...scene,
    id: scene.id || deterministicId(record.id as string, 'scene', index),
    room_key: scene.room_key || `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`,
    order: index + 1,
    page_type: scene.page_type || 'walkthrough_exhibition',
    title: scene.title || `Room ${index + 1}`,
    description: scene.description || '',
    narration: scene.narration || (scene as Record<string, unknown>).narrative || scene.description || '',
    media_url: scene.media_url || (scene as Record<string, unknown>).image || (scene as Record<string, unknown>).image_url || '',
    audio_url: scene.audio_url || (scene as Record<string, unknown>).audio || (scene as Record<string, unknown>).ambience_audio_url || '',
    hotspots: Array.isArray(scene.hotspots) ? scene.hotspots : [],
    exhibition_config: {
      ...((scene.exhibition_config as Record<string, unknown>) || {}),
      scene_title: scene.title || (scene.exhibition_config as Record<string, unknown>)?.scene_title || '',
      scene_narrative: scene.narration || (scene as Record<string, unknown>).narrative || scene.description || (scene.exhibition_config as Record<string, unknown>)?.scene_narrative || '',
    },
  });
}

function normalizeRooms(record: Record<string, unknown>, walkthroughKey: string) {
  const wc = record.walkthrough_config as Record<string, unknown> || {};
  const oc = record.onboarding_config as Record<string, unknown> || {};
  const source: unknown[] =
    Array.isArray(wc.rooms) && (wc.rooms as unknown[]).length ? wc.rooms as unknown[] :
    Array.isArray(record.rooms) && (record.rooms as unknown[]).length ? record.rooms as unknown[] :
    Array.isArray(wc.scenes) && (wc.scenes as unknown[]).length ? (wc.scenes as unknown[]).map((s, i) => mapScene(record, s as Record<string, unknown>, i, walkthroughKey)) :
    Array.isArray(oc.slides) && (oc.slides as unknown[]).length ? (oc.slides as unknown[]).map((slide: unknown, index: number) => ensureTypeConfigs({ ...slide as Record<string, unknown>, id: (slide as Record<string, unknown>).id || deterministicId(record.id as string, 'slide', index), room_key: (slide as Record<string, unknown>).room_key || `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`, order: index + 1, page_type: 'onboarding_guide' })) :
    [];

  const rooms = (source.length ? source : [mapScene(record, { title: 'Room 1' }, 0, walkthroughKey)])
    .map((room: unknown, index: number) => ensureTypeConfigs({
      ...(room as Record<string, unknown>),
      id: (room as Record<string, unknown>).id || deterministicId(record.id as string, 'room', index),
      room_key: (room as Record<string, unknown>).room_key || `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`,
      order: index + 1,
      visibility: (room as Record<string, unknown>).visibility || 'draft',
      hotspots: Array.isArray((room as Record<string, unknown>).hotspots) ? (room as Record<string, unknown>).hotspots : [],
      ctas: Array.isArray((room as Record<string, unknown>).ctas) ? (room as Record<string, unknown>).ctas : [],
    }));

  return rooms
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.order || 0) - Number(b.order || 0))
    .map((room: Record<string, unknown>, index: number) => ({ ...room, order: index + 1 }));
}

function validateRooms(rooms: Record<string, unknown>[]) {
  const errors: string[] = [];
  rooms.forEach((room, index) => {
    const label = room.room_key || `Room ${index + 1}`;
    if (!String(room.title || '').trim()) errors.push(`${label}: title is required.`);
    if (!Number.isFinite(Number(room.order))) errors.push(`${label}: order is required.`);
    const ec = room.exhibition_config as Record<string, unknown> || {};
    if (room.page_type === 'walkthrough_exhibition' && !String(ec.scene_narrative || '').trim() && !String(room.narration || '').trim()) errors.push(`${label}: scene narrative or narration is required.`);
    const oc = room.onboarding_config as Record<string, unknown> || {};
    if (room.page_type === 'onboarding_guide' && !String(oc.intro_text || '').trim() && !String(room.narration || '').trim()) errors.push(`${label}: onboarding intro text is required.`);
  });
  return errors;
}

function scoreRooms(rooms: Record<string, unknown>[]) {
  const errors = validateRooms(rooms);
  return {
    completion_readiness: Math.max(0, 100 - errors.length * 12),
    publish_safety: Math.max(0, 100 - errors.length * 18),
    room_count: rooms.length,
    errors,
    warnings: rooms.filter((r) => (r.media_url || r.background_media_url) && !(r.accessibility as Record<string, unknown>)?.alt_text).map((r) => `${r.room_key}: add alt text for media.`),
  };
}

function buildMigratedPayload(record: Record<string, unknown>) {
  const wc = record.walkthrough_config as Record<string, unknown> || {};
  const walkthroughKey = (record.walkthrough_key || wc.walkthrough_key || 'walkthrough1') as string;
  const rooms = normalizeRooms(record, walkthroughKey);
  const quality = scoreRooms(rooms as Record<string, unknown>[]);
  const now = new Date().toISOString();
  return {
    walkthroughKey,
    rooms,
    quality,
    payload: {
      tenant_id: record.tenant_id,
      museum_id: record.museum_id || record.tenant_id,
      tenant_name: record.tenant_name,
      module_key: 'walkthrough',
      walkthrough_key: walkthroughKey,
      title: record.title || walkthroughLabel(walkthroughKey),
      description: record.description || 'AOM Immersive Experience Builder configuration',
      status: record.status || 'draft',
      legacy_backup_before_dynamic_walkthrough_migration: record.legacy_backup_before_dynamic_walkthrough_migration || {
        walkthrough_config: record.walkthrough_config,
        onboarding_config: record.onboarding_config,
        rooms: record.rooms,
        backed_up_at: now,
      },
      walkthrough_config: {
        ...wc,
        version: 3,
        editor_type: WALKTHROUGH_EDITOR_TYPE,
        walkthrough_key: walkthroughKey,
        rooms,
        journey_map: { room_count: rooms.length },
        timeline_metrics: { total_duration_seconds: (rooms as Record<string, unknown>[]).reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.estimated_duration_seconds || 0), 0) },
        quality_scores: quality,
        warnings: quality.warnings,
        draft_state: 'migrated_v3_draft',
        updated_at: now,
      },
      rooms,
      updated_at: now,
      last_updated: now,
    },
  };
}

function buildRollbackPayload(record: Record<string, unknown>) {
  const backup = record.legacy_backup_before_dynamic_walkthrough_migration as Record<string, unknown>;
  if (!backup) return null;
  const now = new Date().toISOString();
  return { walkthrough_config: backup.walkthrough_config, onboarding_config: backup.onboarding_config, rooms: backup.rooms, status: 'draft', updated_at: now, last_updated: now };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'dry_run';
    const tenantId = body.tenant_id || body.tenantId || '';
    const walkthroughKey = body.walkthrough_key || '';
    const service = getServiceRoleClient();

    let query = service.from('experience_configs').select('*').eq('module_key', 'walkthrough').order('updated_at', { ascending: false }).limit(100);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (walkthroughKey && WALKTHROUGHS.includes(walkthroughKey)) query = query.eq('walkthrough_key', walkthroughKey);

    const { data: records, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

    const results = [];
    for (const record of records || []) {
      if (mode === 'rollback') {
        const rollbackPayload = buildRollbackPayload(record);
        if (!rollbackPayload) {
          results.push({ id: record.id, tenant_id: record.tenant_id, action: 'rollback_skipped_no_backup' });
        } else {
          if (body.apply === true) await service.from('experience_configs').update(rollbackPayload).eq('id', record.id);
          results.push({ id: record.id, tenant_id: record.tenant_id, action: body.apply === true ? 'rolled_back' : 'rollback_ready' });
        }
      } else {
        const migrated = buildMigratedPayload(record);
        if (mode === 'apply' || body.apply === true) await service.from('experience_configs').update(migrated.payload).eq('id', record.id);
        results.push({ id: record.id, tenant_id: record.tenant_id, walkthrough_key: migrated.walkthroughKey, room_count: migrated.rooms.length, publish_safety: migrated.quality.publish_safety, errors: migrated.quality.errors, warnings: migrated.quality.warnings, action: mode === 'apply' || body.apply === true ? 'migrated' : 'dry_run' });
      }
    }

    return Response.json({ data: { mode, apply: body.apply === true || mode === 'apply', count: results.length, results } }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
