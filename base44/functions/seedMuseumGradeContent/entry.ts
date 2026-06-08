import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SEED_SOURCE = 'SCAVERSE_TOTAL_DATABASE_SEED';
const TENANT_SLUG = 'asia-operatic-museum';
const TENANT_NAME = 'Asia Operatic Museum Singapore';
const now = () => new Date().toISOString();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const placeholderImage = 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1600&q=80';

const experienceZones = [
  ['Hero Hologram Experience', 'hero-hologram-sang-nila-utama', 'hologram', 'Sang Nila Utama appears as a full-body hologram to welcome visitors into the origin story of Singapore through myth, memory, leadership, and maritime imagination.'],
  ['Immersive Interactive Zone', 'immersive-interactive-zone', 'xr_led_ar_vr_tactile', 'A multi-sensory zone where visitors move through LED storytelling, AR screens, seated VR games, and tactile tabletop interactions connected to the 5 Kings narrative.'],
  ['Mulan Experience Zone', 'mulan-experience-zone', 'hologram_ar_storytelling', 'A cultural heroism zone exploring courage, identity, loyalty, disguise, family duty, and performance through hologram artefacts, full-body character storytelling, and AR screen interaction.'],
  ['XRetail Cultural Marketplace', 'xretail-cultural-marketplace', 'commerce_ar_ai', 'A storytelling commerce layer where museum products, cultural artefacts, educational kits, costumes, books, and digital collectibles are sold with emotional cultural context.'],
  ['XLearning Academy', 'xlearning-academy', 'learning_certification', 'A learning layer for students, visitors, teachers, guides, internal staff, and future franchise consultants.'],
  ['XGaming Quest Layer', 'xgaming-quest-layer', 'gamification', 'A mission-based cultural learning game where visitors earn badges by completing story paths, AR discoveries, quizzes, and exhibit challenges.']
];

const exhibitTitles = [
  'Sang Nila Utama: The Lion Vision', 'The Founding Myth of Temasek', 'Maritime Routes of Early Singapore', 'The Crown and the Sea', 'The First King’s Oath',
  '5 Kings: Leadership Through Time', 'King One: Wisdom and Rule', 'King Two: Conflict and Strategy', 'King Three: Ritual and Memory', 'King Four: Trade and Power', 'King Five: Legacy and Renewal',
  'Mulan: Courage Behind the Mask', 'Mulan’s Armour', 'Mulan’s Family Scroll', 'Mulan’s Battlefield Journey', 'Opera Masks of Transformation', 'The Red Stage Curtain', 'Instruments of the Opera Pit',
  'Costumes as Living Memory', 'The Scholar Warrior Archetype', 'Women Who Crossed Boundaries', 'The Dragon Motif', 'Lanterns and Night Performance', 'Tactile Table of Kingdoms', 'LED Sea of Origins',
  'AR Artefact Discovery Wall', 'VR Palace Trial', 'Children’s Myth Hunt', 'Multilingual Story Guide', 'Future Museum Command Centre'
];

const learningTitles = [
  'Introduction to Asia Operatic Museum', 'Sang Nila Utama and the Founding Myth', 'Understanding the 5 Kings', 'Mulan: Courage and Identity', 'Opera Costumes and Symbolism',
  'How Hologram Storytelling Works', 'How AR Screen Learning Works', 'How VR Museum Games Teach History', 'Tactile Learning for Families', 'Cultural Storytelling for Guides',
  'Visitor Engagement Basics', 'Museum Accessibility Basics', 'SCAVerse Platform Overview', 'Admin Panel Training', 'Vendor Marketplace Training', 'Ticketing Operations',
  'Content Update Workflow', 'QA Sentinel Basics', 'Analytics for Museum Teams', 'AI Guide Supervision', 'SCAVAI Academy Internal Certification', 'SCAVAI Academy Public Certification',
  'Master Franchise Knowledge Transfer', 'Service Franchise Training', 'Cultural XR Consultant Starter Module'
];

const badgeNames = ['First Visitor', 'Myth Seeker', 'Kingdom Explorer', 'Mulan Courage Badge', 'Opera Mask Reader', 'XR Apprentice', 'Hologram Witness', 'AR Discoverer', 'VR Challenger', 'Tactile Strategist', 'Cultural Guardian', 'Master Storyteller'];
const pageSeeds = [
  ['Home', '/museum/asia-operatic-museum/home'], ['Walkthrough', '/museum/asia-operatic-museum/begin-tour'], ['AI Guide', '/museum/asia-operatic-museum/guide'], ['Tickets', '/museum/asia-operatic-museum/tickets'],
  ['Commerce', '/museum/asia-operatic-museum/commerce'], ['Vendors', '/museum/asia-operatic-museum/vendors'], ['Vendor Register', '/museum/asia-operatic-museum/vendors/register'], ['Platform Overview', '/platform/overview'],
  ['Tenant Login', '/tenant-login'], ['Admin Dashboard', '/museum/asia-operatic-museum/admin'], ['QA Sentinel', '/platform/admin/qa-sentinel'], ['Analytics', '/museum/asia-operatic-museum/admin/analytics'],
  ['Media Registry', '/museum/asia-operatic-museum/admin/home'], ['Content Manager', '/platform/admin/content-data'], ['Experience Manager', '/museum/asia-operatic-museum/admin/walkthrough'], ['Migration Readiness', '/platform/admin/infrastructure'],
  ['Academy / Learning', '/museum/asia-operatic-museum/home'], ['Gaming Missions', '/museum/asia-operatic-museum/begin-tour'], ['XR Preview', '/virtual-experience']
];

async function findOne(base44, entityName, filter) {
  const rows = await base44.asServiceRole.entities[entityName].filter(filter, '-created_date', 1);
  return rows?.[0] || null;
}

async function upsertByFilter(base44, entityName, filter, payload) {
  const existing = await findOne(base44, entityName, filter);
  if (existing) {
    await base44.asServiceRole.entities[entityName].update(existing.id, payload);
    return { created: 0, updated: 1, id: existing.id };
  }
  const created = await base44.asServiceRole.entities[entityName].create(payload);
  return { created: 1, updated: 0, id: created.id };
}

async function createMissing(base44, entityName, filter, keyField, records) {
  if (!records.length) return { created: 0, skipped: 0 };
  const existing = await base44.asServiceRole.entities[entityName].filter(filter, '-created_date', 1000);
  const keys = new Set(existing.map((row) => row[keyField]).filter(Boolean));
  const missing = records.filter((record) => !keys.has(record[keyField]));
  for (let i = 0; i < missing.length; i += 50) {
    await base44.asServiceRole.entities[entityName].bulkCreate(missing.slice(i, i + 50));
  }
  return { created: missing.length, skipped: records.length - missing.length };
}

function buildTenantPayload() {
  return {
    name: TENANT_NAME,
    slug: TENANT_SLUG,
    status: 'live',
    description: 'Asia Operatic Museum Singapore is a future-ready cultural museum platform combining immersive storytelling, AR/XR experiences, hologram zones, learning journeys, gamified missions, commerce, vendor participation, and AI-guided visitor engagement.',
    region: 'Singapore',
    owner: 'SCAVAI x Faheem MOA Pilot',
    custom_domain: '',
    enabled_modules: ['onboarding', 'ticketing', 'ai_guide', 'walkthrough', 'vendors', 'commerce', 'analytics', 'gamification'],
    launch_readiness: 70,
    theme_config: {
      primary_color: '#D4AF37', secondary_color: '#111827', font: 'Inter', logo_url: '',
      hero_title: TENANT_NAME,
      hero_subtitle: 'A future-ready cultural museum experience powered by XR storytelling, hologram zones, AI guidance, learning journeys, gamified discovery, and cultural commerce.',
      primary_cta_label: 'Start the Museum Journey', primary_cta_path: 'begin-tour', secondary_cta_label: 'Explore the XR Platform', secondary_cta_path: '/virtual-experience',
      tenant_type: 'museum_pilot', demo_mode: true, export_ready_target: true, pilot_project: true, moa_alignment: true,
      default_language: 'en-SG', supported_languages: ['English', 'Malay', 'Mandarin', 'Tamil'], accessibility_level: 'WCAG_2_1_AA_TARGET', timezone: 'Asia/Singapore', seed_source: SEED_SOURCE
    },
    updated_at: now()
  };
}

function buildExperienceConfig(tenantId) {
  const walkthroughSteps = [
    'Arrival and Welcome', 'AI Guide Introduction', 'LED Origin Story', 'Sang Nila Utama Hologram', 'Artefact Discovery', '5 Kings AR Screen', '5 Kings VR Game', 'Tactile Tabletop Challenge',
    'Mulan Hologram', 'Mulan AR Screen', 'Learning Reflection', 'Museum Shop', 'Badge Completion', 'Feedback and Exit'
  ].map((title, index) => ({
    id: slugify(title), room_key: slugify(title), order: index + 1, page_type: index % 4 === 0 ? 'onboarding_guide' : index % 4 === 1 ? 'exhibition_room' : index % 4 === 2 ? 'gamification_room' : 'reflection_chamber',
    title, subtitle: `MOA walkthrough step ${index + 1}`, description: `${title} gives visitors a clear demo-safe experience connected to XR storytelling, cultural learning, accessibility, and migration-ready content governance.`,
    narration: `${title}: this station explains the cultural story with honest demo status and hardware fallback guidance.`, media_type: 'image', media_url: placeholderImage, background_media_url: placeholderImage,
    visibility: 'published', hotspots: [], ctas: [{ label: index === 13 ? 'Complete Journey' : 'Continue', action: 'next' }],
    accessibility: { alt_text: `${title} placeholder visual`, transcript: `${title} narration transcript`, calm_mode_available: true, reduced_motion_text: 'A static interpretation fallback is available if motion or hardware is unavailable.' },
    fallback_if_hardware_unavailable: 'Show the static story panel, approved narration, image placeholder, and AI-guide explanation until physical hardware/assets are confirmed.',
    learning_objective: 'Understand one cultural idea and one XR museum operation concept.'
  }));

  return {
    tenant_id: tenantId, tenant_name: TENANT_NAME, module_key: 'moa_total_seed', walkthrough_key: 'aom-moa-walkthrough', title: TENANT_NAME,
    description: 'MOA-aligned XR, XRetail, XLearning, XGaming, AI guide, accessibility, analytics, and migration-readiness seed configuration.', status: 'published',
    onboarding_config: { seed_source: SEED_SOURCE, public_intro: 'Begin a guided cultural XR journey through Singapore origin stories, 5 Kings leadership, and Mulan courage.', language_support: ['English', 'Malay', 'Mandarin', 'Tamil'] },
    ai_guide_config: { guide_name: 'ARIA', tone: 'warm, simple, clear, culturally respectful, Secondary 3 English', safety_rule: 'Never claim demo hardware is installed unless marked production-ready.', knowledge_entry_count: 120 },
    walkthrough_config: { version: 3, editor_type: 'aom_moa_seeded_experience', walkthrough_key: 'aom-moa-walkthrough', rooms: walkthroughSteps, journey_map: { zones: experienceZones.map(([name, slug]) => ({ name, slug })) }, quality_scores: { content_density: 92, demo_truthfulness: 85, export_readiness: 70 }, updated_at: now() },
    rooms: walkthroughSteps,
    room_preview_config: { demo_mode: true, placeholder_assets_disclosed: true },
    gamification_config: { badges: badgeNames, mission_count: 30, completion_message: 'You completed the Asia Operatic Museum demo journey.' },
    experience_modes: ['xr_storytelling', 'hologram_demo', 'vr_demo', 'ar_preview', 'xretail', 'xlearning', 'xgaming', 'accessibility'],
    theme_config: { primary_color: '#D4AF37', secondary_color: '#111827', font: 'Inter', seed_source: SEED_SOURCE }, updated_at: now(), last_updated: now()
  };
}

function buildExhibits(tenantId) {
  return exhibitTitles.map((title, index) => ({
    tenant_id: tenantId, tenant_name: TENANT_NAME, title, summary: `${title} is a seeded MOA exhibit for the Asia Operatic Museum demo ecosystem.`,
    description: `${title} introduces visitors to cultural story, performance memory, XR interpretation, and learning prompts in a museum-safe way.`,
    long_description: `${title} connects historical imagination, performance heritage, visitor learning, accessibility, and demo-ready XR storytelling. The record is intentionally marked as seeded demo content and should be replaced or reviewed by curators before production deployment.`,
    historical_significance: 'This exhibit supports the MOA pilot by connecting cultural narrative, digital interpretation, visitor education, and platform readiness.',
    related_exhibits: exhibitTitles.slice(Math.max(0, index - 2), index + 3), media_references: [`aom-media-${String(index + 1).padStart(3, '0')}`], ai_guide_context: `ARIA may explain ${title} using approved museum context and avoid unsupported production claims.`,
    station_number: index + 1, category: ['opera_tradition', 'costume_art', 'music_instruments', 'stage_design', 'cultural_heritage', 'interactive'][index % 6], image_url: placeholderImage, audio_url: '',
    narrative_text: `Observe ${title}. What does it reveal about courage, memory, leadership, theatre, or cultural identity?`, is_featured: index < 8, status: 'published', engagement_count: 25 + index * 3,
    tags: [TENANT_SLUG, SEED_SOURCE, 'moa', 'demo', index < 15 ? 'xr-story' : 'learning']
  }));
}

function buildContentAssets(tenantId) {
  const groups = ['SNU hologram', 'SNU artefact', 'Mulan hologram', 'Mulan artefact', '5 Kings character', 'LED welcome', 'VR environment', 'tactile tabletop', 'commerce product', 'academy', 'gamification badge', 'accessibility', 'admin preview', 'export documentation'];
  return Array.from({ length: 80 }, (_, index) => {
    const group = groups[index % groups.length];
    const type = ['image', 'video', 'audio', 'document', 'metadata', 'animation', 'script', 'station'][index % 8];
    return {
      tenant_id: tenantId, tenant_name: TENANT_NAME, asset_type: type, title: `${group} Placeholder Asset ${index + 1}`, url: placeholderImage,
      description: `${group} seed asset for MOA demo. Asset status: placeholder_required_replacement. Intended usage is connected to XR, learning, commerce, gaming, accessibility, or export readiness.`,
      metadata: { media_key: `aom-media-${String(index + 1).padStart(3, '0')}`, intended_usage: group, linked_module: group.toLowerCase().replace(/\s+/g, '_'), alt_text: `${group} placeholder media`, replacement_required: true, production_status: 'placeholder_required_replacement', rights_status: 'demo_placeholder', approval_state: 'pending_curator_review', publish_status: 'published', seed_source: SEED_SOURCE },
      status: 'published', version: '1.0', tags: [TENANT_SLUG, SEED_SOURCE, 'placeholder_required_replacement', slugify(group)]
    };
  });
}

function buildMuseumMedia(tenantId) {
  return Array.from({ length: 24 }, (_, index) => ({
    tenantId, museumId: tenantId, tenantSlug: TENANT_SLUG, name: `AOM Media Registry Slot ${index + 1}`, presetName: 'MOA Seed Media', presetSlug: `aom-media-registry-${index + 1}`,
    description: 'Museum-owned media registry placeholder that must be replaced with approved production assets before live hardware deployment.', ownershipScope: 'museum', assignedPage: pageSeeds[index % pageSeeds.length][1],
    assignedComponent: `moa-seed-component-${index + 1}`, renderType: ['background', 'foreground', 'poster', 'fallback'][index % 4], mediaType: index % 5 === 0 ? 'video' : 'image', sourceType: 'url', fileUrl: placeholderImage,
    thumbnailUrl: placeholderImage, originalFileName: `aom-placeholder-${index + 1}.jpg`, fileExtension: 'jpg', mimeType: 'image/jpeg', autoplay: false, loop: true, muted: true, publishState: 'published', isActive: true,
    tags: [TENANT_SLUG, SEED_SOURCE, 'placeholder_required_replacement'], createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: now(), updatedAt: now()
  }));
}

function buildTenantContent(tenantId) {
  return pageSeeds.map(([name, route], index) => ({
    tenantId, pageKey: slugify(name), sectionKey: 'moa_seed_overview', contentType: 'page', title: `${name} — ${TENANT_NAME}`, subtitle: 'MOA-aligned demo content',
    body: `${name} is populated with realistic demo content for AR/XR, hologram, XRetail, XLearning, XGaming, AI guide, analytics, accessibility, and migration-readiness review. Route: ${route}.`,
    structuredData: { route, seed_source: SEED_SOURCE, empty_state_fallback: `${name} content is available in demo mode and should be curator-reviewed before production.` }, layoutConfig: { version: 1, demo_mode: true }, mediaIds: [],
    visibilityScope: 'tenant', publishState: 'published', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: now(), updatedAt: now(), version: 1, aiSummary: `${name} seeded for MOA demo readiness.`, aiTags: ['MOA', 'SCAVerse', 'demo']
  }));
}

function buildVendors(tenantId) {
  const types = ['cultural artisan', 'museum shop supplier', 'book publisher', 'education partner', 'XR content partner', 'costume maker', 'prop fabricator', '3D artist', 'school partner', 'workshop facilitator', 'food and beverage partner', 'event partner', 'accessibility reviewer', 'translation partner', 'media production partner'];
  return types.map((type, index) => ({
    tenant_id: tenantId, tenant_name: TENANT_NAME, business_name: `AOM Demo ${type.replace(/\b\w/g, (c) => c.toUpperCase())}`, contact_name: 'Demo Contact', email: `demo-vendor-${index + 1}@example.com`, phone: '+65 0000 0000',
    category: ['cultural_arts', 'merchandise', 'education', 'technology', 'experiences', 'food_beverage', 'corporate_sponsor'][index % 7], description: `Safe demo vendor for ${type}. No private personal data is used.`,
    logo_url: '', status: index % 5 === 0 ? 'pending' : 'approved', slot_type: index % 4 === 0 ? 'premium' : 'standard', website_url: 'https://example.com', products_count: 2 + (index % 5), revenue_total: 0
  }));
}

function buildTickets(tenantId) {
  const tickets = [['Adult General Admission', 18], ['Child General Admission', 9], ['Student Pass', 12], ['Senior Pass', 10], ['Family Bundle', 48], ['School Group Pass', 120], ['Guided Tour Add-On', 15], ['Premium Hologram Experience', 28], ['XR Full Experience Bundle', 38], ['Workshop Pass', 25]];
  return tickets.map(([ticket_type, price], index) => ({
    tenant_id: tenantId, tenant_name: TENANT_NAME, ticket_type, visitor_name: `Demo Visitor ${index + 1}`, visitor_email: `demo-ticket-${index + 1}@example.com`, quantity: 1 + (index % 4), total_price: price, currency: 'SGD', status: 'confirmed',
    visit_date: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), notes: 'Seeded demo ticket. checkout_mode=demo; payment_provider_status=not_connected.', access_mode: index % 3 === 0 ? 'hybrid' : 'virtual', ticket_addons: ['AI guide', 'XR preview'], group_type: index % 4 === 0 ? 'family' : 'individual', confirmation_stage: 'demo_confirmed', source_step: SEED_SOURCE, ai_help_used: index % 2 === 0
  }));
}

function buildAnalytics(tenantId) {
  const eventTypes = ['page_view', 'exhibit_view', 'ticket_viewed', 'ticket_selected', 'commerce_viewed', 'commerce_category_viewed', 'ai_guide_question_asked', 'walkthrough_started', 'walkthrough_scene_viewed', 'hotspot_opened', 'walkthrough_completed', 'vendor_application_started', 'tester_agent_run'];
  return Array.from({ length: 500 }, (_, index) => ({
    tenant_id: tenantId, tenant_name: TENANT_NAME, event_type: eventTypes[index % eventTypes.length], source_page: pageSeeds[index % pageSeeds.length][1], device_type: ['desktop', 'mobile', 'tablet'][index % 3],
    event_data: { seed_source: SEED_SOURCE, demo_day: 30 - (index % 30), visitor_segment: ['family', 'student', 'teacher', 'tourist', 'admin'][index % 5], count_value: 1 + (index % 4), created_at: daysAgo(index % 30) }
  }));
}

function buildModules(tenantId) {
  const products = Array.from({ length: 40 }, (_, index) => ({ product_name: ['Sang Nila Utama Mini Hologram Card', 'Mulan Courage Poster', '5 Kings Learning Card Set', 'Opera Mask Replica: Red Warrior', 'Children’s Kingdom Quest Kit', 'Museum Explorer Notebook', 'XR Family Bundle', 'Teacher Resource Pack'][index % 8] + ` ${Math.floor(index / 8) + 1}`, slug: `aom-product-${index + 1}`, category: ['tickets', 'books', 'learning_kits', 'costumes', 'replicas', 'digital_packs', 'teacher_resources', 'xr_bundles'][index % 8], price_sgd: 8 + (index % 12) * 4, ar_preview_enabled: index < 12, checkout_status: 'demo', publish_status: 'published' }));
  const learning = learningTitles.map((title, index) => ({ title, slug: slugify(title), audience: ['children', 'teens', 'adults', 'teachers', 'museum staff', 'tour guides', 'franchise consultants'][index % 7], difficulty: ['introductory', 'intermediate', 'staff'][index % 3], learning_goals: ['Understand the cultural story', 'Connect exhibits to XR learning', 'Use the platform responsibly'], quiz_questions: [`What is one key idea from ${title}?`], completion_badge: badgeNames[index % badgeNames.length], estimated_duration: 15 + (index % 4) * 10, certification_eligible: index > 10, publish_status: 'published' }));
  const missions = Array.from({ length: 30 }, (_, index) => ({ mission_title: `AOM Mission ${index + 1}: ${badgeNames[index % badgeNames.length]}`, slug: `aom-mission-${index + 1}`, mission_type: ['discovery', 'quiz', 'AR scan', 'VR challenge', 'tactile puzzle', 'exhibit hunt', 'story choice', 'family mission'][index % 8], story_context: 'Visitors complete a culturally respectful challenge linked to exhibits, learning, and XR demo stations.', objectives: ['Find a story clue', 'Answer one reflection question', 'Unlock the next badge'], completion_conditions: ['Complete objective list', 'View linked exhibit'], reward_points: 25 + index * 5, badge: badgeNames[index % badgeNames.length], age_group: ['children', 'teens', 'family', 'adult'][index % 4], difficulty: ['easy', 'medium', 'hard'][index % 3], estimated_duration: 5 + (index % 5) * 3, publish_status: 'published' }));
  const aiKnowledge = Array.from({ length: 120 }, (_, index) => ({ topic: ['museum overview', 'tickets', 'Sang Nila Utama', '5 Kings', 'Mulan', 'AR/XR', 'accessibility', 'learning', 'shop', 'safety'][index % 10], question: `Demo question ${index + 1}: What should visitors know?`, answer: 'ARIA gives a warm, simple, culturally respectful answer and clearly states when an item is demo-only or pending hardware confirmation.', confidence_level: 0.82, fallback_answer: 'I do not have enough verified information yet, but I can guide you to an approved museum topic.', escalation_required: index % 17 === 0, publish_status: 'published' }));
  return [
    ['onboarding', { walkthrough_steps: 14, seed_source: SEED_SOURCE }], ['walkthrough', { zones: experienceZones, steps: 14, seed_source: SEED_SOURCE }], ['ai_guide', { knowledge_entries: aiKnowledge, seed_source: SEED_SOURCE }],
    ['ticketing', { currency: 'SGD', checkout_mode: 'demo', payment_provider_status: 'not_connected', ticket_types: ['Adult General Admission', 'Child General Admission', 'Student Pass', 'Senior Pass', 'Family Bundle', 'School Group Pass', 'Guided Tour Add-On', 'Premium Hologram Experience', 'XR Full Experience Bundle', 'Workshop Pass'], seed_source: SEED_SOURCE }],
    ['vendors', { vendor_count: 15, onboarding_status: 'demo_ready', seed_source: SEED_SOURCE }], ['commerce', { products, ar_preview_placeholders: 12, checkout_mode: 'demo', payment_provider_status: 'not_connected', seed_source: SEED_SOURCE }],
    ['analytics', { tracked_events: ['page_view', 'exhibit_view', 'ticket_click', 'product_view', 'vendor_view', 'ai_question', 'mission_started', 'mission_completed', 'learning_module_started', 'learning_module_completed', 'media_view', 'admin_update', 'QA_check', 'export_check'], seed_source: SEED_SOURCE }],
    ['gamification', { learning_modules: learning, game_missions: missions, badges: badgeNames, accessibility_records: buildAccessibility(), multilingual_labels: buildMultilingual(), migration_readiness: buildReadiness(), seed_source: SEED_SOURCE }]
  ].map(([module_key, config_json]) => ({ tenant_id: tenantId, tenant_name: TENANT_NAME, module_key, enabled: true, status: module_key === 'analytics' ? 'warning' : 'healthy', content_readiness: module_key === 'analytics' ? 75 : 88, config_completeness: module_key === 'ticketing' ? 70 : 86, record_count: JSON.stringify(config_json).length, last_updated: now(), config_json }));
}

function buildAccessibility() {
  return ['alt text coverage', 'keyboard navigation checks', 'screen reader labels', 'color contrast checks', 'caption/subtitle requirements', 'multilingual requirements', 'family-friendly navigation', 'senior visitor support', 'child visitor support', 'motion sensitivity fallback'].map((name, index) => ({ name, status: ['target_defined', 'partially_tested', 'needs_manual_audit'][index % 3], notes: 'Seeded target only; manual accessibility audit still required.' }));
}

function buildMultilingual() {
  return ['Welcome', 'Tickets', 'Exhibits', 'Guide', 'Shop', 'Learn', 'Play', 'Accessibility', 'Help'].map((label) => ({ label, languages: ['English', 'Malay', 'Mandarin', 'Tamil'], translation_status: 'pending_human_review' }));
}

function buildReadiness() {
  return ['Base44 dependency map', 'entity export map', 'media export map', 'auth replacement plan', 'Supabase schema alignment', 'route verification', 'environment variables', 'secret management', 'build verification', 'tenant isolation', 'admin permissions', 'payment integration', 'analytics integration', 'file storage', 'CDN readiness', 'error monitoring', 'backup plan', 'rollback plan'].map((name, index) => ({ name, status: index < 5 ? 'partial' : index % 4 === 0 ? 'blocker' : 'not_started', evidence: 'Seeded readiness record, not external proof.', required_action: 'Verify in staging before migration cutover.', owner_role: index % 2 === 0 ? 'platform_admin' : 'technical_lead', migration_risk: index % 4 === 0 ? 'high' : 'medium' }));
}

function buildQAIssues(tenantId) {
  return Array.from({ length: 20 }, (_, index) => ({
    issue_key: `moa-seed-${index + 1}`, title: `MOA QA seeded issue ${index + 1}`, description: 'Seeded QA issue for migration gate demonstration; not a runtime-confirmed browser failure.', severity: ['critical', 'major', 'minor', 'warning', 'info'][index % 5], status: index % 4 === 0 ? 'open' : index % 4 === 1 ? 'investigating' : index % 4 === 2 ? 'fixed' : 'ignored', domain: index % 2 === 0 ? 'tenant_admin' : 'public_museum', area: ['route_integrity', 'tenant_isolation', 'media_links', 'export_readiness'][index % 4], route: pageSeeds[index % pageSeeds.length][1], expected_result: 'Route, content, permissions, and migration status should be verified before cutover.', actual_result: 'Seeded item requires manual or automated verification.', human_impact: 'Prevents false confidence before export.', likely_cause: 'Migration proof not complete.', root_cause_hypothesis: 'External systems, storage, RLS, or hardware may not be fully connected yet.', fix_summary: 'Verify with QA Sentinel and staging Supabase.', recommended_fix_steps: ['Open route', 'Verify permissions', 'Verify data persistence', 'Confirm no console errors'], likely_files_affected: ['App.jsx', 'supabase/migrations', 'api/base44Client.js'], risk_level: index % 5 === 0 ? 'critical' : 'medium', fix_complexity: 'moderate', estimated_fix_area: 'unknown', regression_test_steps: ['Repeat route check', 'Confirm expected status'], safe_to_autofix: false, tenant_id: tenantId, tenant_slug: TENANT_SLUG, first_seen_at: now(), last_seen_at: now(), last_verified_at: now(), fixed_at: index % 4 === 2 ? now() : null, regression_count: 0, occurrence_count: 1, fingerprint: `moa-seed-fingerprint-${index + 1}`
  }));
}

function buildQAChecks() {
  return Array.from({ length: 80 }, (_, index) => ({ check_key: `moa-check-${index + 1}`, label: `MOA QA Check ${index + 1}`, domain: ['public_museum', 'tenant_admin', 'platform', 'system'][index % 4], route: pageSeeds[index % pageSeeds.length][1], check_type: ['route', 'cta', 'form', 'upload', 'permission', 'data_persistence', 'redirect', 'media_binding', 'admin_tab', 'frontend_backend_match'][index % 10], selector: '', expected_behavior: 'Should render, protect, redirect, persist, or fail safely according to migration readiness rules.', enabled: true, critical: index % 9 === 0, tenant_scope: index % 2 === 0 ? 'per_tenant' : 'global', last_status: ['unknown', 'passing', 'failing', 'skipped'][index % 4], last_checked_at: now() }));
}

function buildAdminRecords(tenantId) {
  const approvalRequests = Array.from({ length: 20 }, (_, index) => ({ tenantId, targetEntity: ['Exhibit', 'ContentAsset', 'ExperienceConfig', 'ModuleConfig'][index % 4], targetId: `moa-target-${index + 1}`, requestedState: 'published', status: ['pending', 'approved', 'revision_requested'][index % 3], reviewerComments: 'Seeded approval workflow record for admin demo.', requestedBy: SEED_SOURCE, visibilityScope: 'tenant', publishState: 'pending_review', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: daysAgo(index % 14), updatedAt: now() }));
  const revisions = Array.from({ length: 15 }, (_, index) => ({ tenantId, targetEntity: ['Home', 'Walkthrough', 'Commerce', 'AIGuide', 'Learning'][index % 5], targetId: `moa-revision-${index + 1}`, versionNumber: index + 1, snapshot: { old_content_summary: 'Earlier demo draft', new_content_summary: 'MOA-aligned seeded content', change_reason: 'Foundation proof and demo readiness', rollback_available: true }, diff: { fields_changed: ['title', 'body', 'metadata'] }, changeSummary: 'Seeded revision history for admin panels.', restorePoint: true, visibilityScope: 'tenant', publishState: 'approved', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: daysAgo(index), updatedAt: now() }));
  const workflows = Array.from({ length: 10 }, (_, index) => ({ tenantId, workflowKey: `moa-ai-workflow-${index + 1}`, name: ['Cultural Guide Answer Generator', 'Exhibit Summary Generator', 'Learning Module Generator', 'Visitor Safety Response', 'Vendor Product Story Generator', 'AR Preview Copy Generator', 'Hologram Script Generator', 'VR Mission Generator', 'Accessibility Checker', 'QA Sentinel Inspector'][index], description: 'Seeded AI workflow requiring human review before production use.', triggerType: 'manual', steps: [{ name: 'draft', approval_required: true }, { name: 'review', cultural_rules: true }], isActive: true, visibilityScope: 'tenant', publishState: 'published', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: now(), updatedAt: now() }));
  const outputs = Array.from({ length: 25 }, (_, index) => ({ tenantId, executionId: `moa-execution-${index + 1}`, targetEntity: 'Exhibit', targetId: `moa-exhibit-${index + 1}`, outputType: ['summary', 'tags', 'seo', 'draft_content', 'recommendation'][index % 5], text: 'Seeded AI output for admin demonstration. Must be reviewed before production publication.', json: { seed_source: SEED_SOURCE, cultural_review_required: true }, confidence: 0.78, reviewState: index % 3 === 0 ? 'approved' : 'unreviewed', visibilityScope: 'tenant', publishState: 'pending_review', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: now(), updatedAt: now() }));
  return { approvalRequests, revisions, workflows, outputs };
}

function buildPrompts(tenantId) {
  const names = ['Cultural Guide Answer Generator', 'Exhibit Summary Generator', 'Learning Module Generator', 'Visitor Safety Response', 'Vendor Product Story Generator', 'AR Preview Copy Generator', 'Hologram Script Generator', 'VR Mission Generator', 'Accessibility Checker', 'QA Sentinel Inspector', 'Migration Readiness Auditor', 'Admin Content Reviewer'];
  return names.map((name, index) => ({
    masterPrompt: { tenantId, promptKey: slugify(name), name, description: `${name} seeded for SCAVerse MOA workflows.`, scope: 'tenant', visibilityScope: 'tenant', publishState: 'published', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: now(), updatedAt: now() },
    version: { tenantId, masterPromptId: slugify(name), versionNumber: 1, promptText: `${name}: produce culturally respectful, demo-safe, human-reviewable output.`, systemInstructions: 'Never overclaim hardware, payment, production, or cultural facts. Use simple clear language and require review for sensitive content.', modelConfig: { approval_required: true, seed_source: SEED_SOURCE }, testInputs: [{ input: 'Demo input' }], testResults: [{ status: 'seeded_not_verified' }], rolloutStage: 'active', visibilityScope: 'tenant', publishState: 'published', createdBy: SEED_SOURCE, updatedBy: SEED_SOURCE, createdAt: now(), updatedAt: now() }
  }));
}

async function seedPromptPairs(base44, tenantId) {
  let masters = 0;
  let versions = 0;
  const pairs = buildPrompts(tenantId);
  for (const pair of pairs) {
    const master = await upsertByFilter(base44, 'MasterPrompt', { promptKey: pair.masterPrompt.promptKey }, pair.masterPrompt);
    masters += master.created;
    pair.version.masterPromptId = master.id || pair.masterPrompt.promptKey;
    const version = await upsertByFilter(base44, 'PromptVersion', { masterPromptId: pair.version.masterPromptId, versionNumber: 1 }, pair.version);
    versions += version.created;
  }
  return { masters, versions };
}

async function upsertModules(base44, tenantId) {
  let created = 0;
  let updated = 0;
  for (const module of buildModules(tenantId)) {
    const result = await upsertByFilter(base44, 'ModuleConfig', { tenant_id: tenantId, module_key: module.module_key }, module);
    created += result.created;
    updated += result.updated;
  }
  return { created, updated };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const tenantResult = await upsertByFilter(base44, 'MuseumTenant', { slug: TENANT_SLUG }, buildTenantPayload());
    const tenantId = tenantResult.id;
    const counts = { MuseumTenant: tenantResult.created, updated_tenant: tenantResult.updated };

    await upsertByFilter(base44, 'ExperienceConfig', { tenant_id: tenantId }, buildExperienceConfig(tenantId));
    counts.ExperienceConfig = 1;
    counts.ModuleConfig = await upsertModules(base44, tenantId);
    counts.Exhibit = await createMissing(base44, 'Exhibit', { tenant_id: tenantId }, 'title', buildExhibits(tenantId));
    counts.ContentAsset = await createMissing(base44, 'ContentAsset', { tenant_id: tenantId }, 'title', buildContentAssets(tenantId));
    counts.MuseumMediaRegistry = await createMissing(base44, 'MuseumMediaRegistry', { tenantId }, 'name', buildMuseumMedia(tenantId));
    counts.TenantContent = await createMissing(base44, 'TenantContent', { tenantId }, 'title', buildTenantContent(tenantId));
    counts.Vendor = await createMissing(base44, 'Vendor', { tenant_id: tenantId }, 'business_name', buildVendors(tenantId));
    counts.Ticket = await createMissing(base44, 'Ticket', { tenant_id: tenantId }, 'ticket_type', buildTickets(tenantId));
    counts.AnalyticsEvent = await createMissing(base44, 'AnalyticsEvent', { tenant_id: tenantId }, 'source_page', buildAnalytics(tenantId));

    const admin = buildAdminRecords(tenantId);
    counts.ApprovalRequest = await createMissing(base44, 'ApprovalRequest', { tenantId }, 'targetId', admin.approvalRequests);
    counts.ContentRevision = await createMissing(base44, 'ContentRevision', { tenantId }, 'targetId', admin.revisions);
    counts.AIWorkflow = await createMissing(base44, 'AIWorkflow', { tenantId }, 'workflowKey', admin.workflows);
    counts.AIOutput = await createMissing(base44, 'AIOutput', { tenantId }, 'executionId', admin.outputs);
    counts.Prompts = await seedPromptPairs(base44, tenantId);

    counts.QASentinelCheck = await createMissing(base44, 'QASentinelCheck', {}, 'check_key', buildQAChecks());
    counts.QASentinelIssue = await createMissing(base44, 'QASentinelIssue', { tenant_id: tenantId }, 'issue_key', buildQAIssues(tenantId));
    counts.QASentinelRun = await createMissing(base44, 'QASentinelRun', { tenant_id: tenantId }, 'run_id', Array.from({ length: 5 }, (_, index) => ({ run_id: `moa-seed-run-${index + 1}`, run_type: ['manual', 'smoke', 'full', 'regression', 'scheduled'][index], status: index < 2 ? 'passed' : 'partial', started_at: daysAgo(index), finished_at: now(), duration_ms: 30000 + index * 8000, routes_tested: 20 + index * 8, ctas_tested: 40 + index * 10, forms_tested: 5 + index, functions_tested: 2, issues_found: 4 + index, critical_count: index === 0 ? 0 : 1, major_count: 2, minor_count: 3, tenant_id: tenantId, tenant_slug: TENANT_SLUG, summary: 'Seeded QA Sentinel run for migration-readiness gate.', coverage_map: { seed_source: SEED_SOURCE } })));
    counts.QASentinelEvent = await createMissing(base44, 'QASentinelEvent', { tenant_id: tenantId }, 'message', Array.from({ length: 30 }, (_, index) => ({ event_type: ['route_visit', 'click', 'permission_check', 'issue_created', 'issue_updated'][index % 5], route: pageSeeds[index % pageSeeds.length][1], component_name: 'MOASeed', target_label: `Seed Event ${index + 1}`, message: `MOA seeded QA event ${index + 1}`, metadata: { seed_source: SEED_SOURCE }, severity: index % 10 === 0 ? 'critical' : index % 3 === 0 ? 'warning' : 'info', timestamp: now(), tenant_id: tenantId, tenant_slug: TENANT_SLUG })));
    counts.QASentinelExport = await createMissing(base44, 'QASentinelExport', {}, 'export_id', Array.from({ length: 5 }, (_, index) => ({ export_id: `moa-seed-export-${index + 1}`, created_at: now(), created_by: user.email, export_type: ['json', 'markdown', 'txt'][index % 3], issue_count: 20, critical_count: 4, major_count: 4, minor_count: 4, warning_count: 4, regression_count: 0, included_tabs: ['Live Issues', 'Route Matrix', 'Exports'], filters: { tenant_id: tenantId }, export_blob: `MOA seeded export ${index + 1}. Export readiness remains partial until Base44 decoupling, Supabase proof, storage proof, and external integrations are complete.`, checksum: `moa-seed-checksum-${index + 1}`, version: '1.0' })));

    counts.PlatformHealth = await createMissing(base44, 'PlatformHealth', {}, 'service_key', ['frontend_build', 'route_integrity', 'database_connection', 'media_links', 'auth_flow', 'tenant_isolation', 'admin_console', 'AI_guide', 'ticketing', 'commerce', 'analytics', 'export', 'accessibility', 'performance'].map((service, index) => ({ service_key: `moa-${service}`, service_name: service.replace(/_/g, ' '), status: ['operational', 'degraded', 'maintenance'][index % 3], message: 'Seeded health snapshot. External production proof still required where applicable.', last_checked: now(), uptime_percent: 95 - (index % 5), response_time_ms: 120 + index * 15, error_count: index % 4 })));

    await base44.asServiceRole.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name || user.email, action: 'scaverse_moa_total_database_seed', target_type: 'MuseumTenant', target_id: tenantId, target_name: TENANT_NAME, details: 'Idempotent MOA seed executed with honest demo, placeholder, migration, QA, XR, XRetail, XLearning, XGaming, AI, analytics, accessibility, and admin records.', metadata: { counts, seed_source: SEED_SOURCE, remaining_blockers: ['Real XR/hologram/VR hardware not connected', 'Real 3D assets not uploaded', 'Payment provider not connected', 'Supabase live proof still required', 'Base44 decoupling still required'] }, timestamp: now(), severity: 'info' });

    return Response.json({
      success: true,
      seed_source: SEED_SOURCE,
      tenant: { id: tenantId, name: TENANT_NAME, slug: TENANT_SLUG },
      counts,
      migration_readiness: 'partial_ready_demo_seeded_not_cutover_ready',
      build_result: 'not_run_by_function',
      remaining_blockers: ['Base44 decoupling', 'Supabase live proof', 'RLS/storage tests', 'real XR/hologram/VR assets and hardware', 'payment integration', 'full route/CTA QA'],
      next_steps: ['Run this function from admin context', 'Run npm run lint and npm run build', 'Open QA Sentinel export', 'Verify tenant pages and admin panels', 'Start Supabase adapter parity work']
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});