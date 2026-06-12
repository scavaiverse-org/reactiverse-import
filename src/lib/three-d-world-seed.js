// Seed data for the 3D World Builder — templates, moods, layouts, objects,
// interactions, gamification, NPCs, performance rules, previews, and the
// publish checklist. The builder reads every dropdown and default from here.

export const THREE_D_WORLD_EDITOR_SEED = {
  editorName: "3D World Builder",
  editorDescription:
    "Create immersive 3D rooms, exhibitions, memory spaces, marketplace worlds, portals, and guided walkthroughs without code.",

  conditionalDisplayRule: {
    showWhenField: "masterPageType",
    showWhenValueIncludes: ["3D World", "3D world", "3d world", "World Builder", "three_d_world"],
    fallbackRule:
      "If roomType or masterPageType equals 3D World, open the 3D World Builder section automatically.",
  },

  worldTemplates: [
    { id: "museum_gallery", name: "Museum Gallery", category: "Exhibition", description: "Clean gallery room for artifacts, framed images, video walls, and story panels.", bestFor: ["museums", "heritage", "AOM tenant", "artifacts", "curated exhibitions"], defaultMood: "premium_calm", defaultMovement: "click_to_move_guided", recommendedObjectLimit: 40 },
    { id: "memory_archive", name: "Memory Archive", category: "Memory", description: "Emotional archive room for family stories, historical memories, personal moments, and legacy content.", bestFor: ["memories", "family archive", "heritage stories", "tribute rooms"], defaultMood: "nostalgic_warm", defaultMovement: "guided_walkthrough", recommendedObjectLimit: 35 },
    { id: "cinematic_walkthrough", name: "Cinematic Walkthrough Exhibition", category: "Walkthrough", description: "A guided cinematic path where visitors move through stations in order.", bestFor: ["storytelling", "onboarding", "brand journey", "tenant showcase"], defaultMood: "cinematic_dark", defaultMovement: "auto_walkthrough", recommendedObjectLimit: 30 },
    { id: "portal_room", name: "Portal Room", category: "Navigation", description: "A central hub with doors and portals linking to other rooms.", bestFor: ["room navigation", "world map", "multi-room museum", "tenant lobby"], defaultMood: "futuristic_glow", defaultMovement: "click_to_move", recommendedObjectLimit: 25 },
    { id: "marketplace_street", name: "Marketplace Street", category: "Commerce", description: "A virtual street with booths, product displays, tenant stalls, and interactive purchase links.", bestFor: ["tenant marketplace", "shops", "products", "brand booths"], defaultMood: "lively_public", defaultMovement: "free_walk", recommendedObjectLimit: 60 },
    { id: "futuristic_room", name: "Futuristic Room", category: "Innovation", description: "A sleek sci-fi room for innovation showcases, AI explainers, and premium demos.", bestFor: ["tech", "AI", "innovation", "premium brand room"], defaultMood: "futuristic_blue", defaultMovement: "click_to_move_guided", recommendedObjectLimit: 35 },
    { id: "theatre_hall", name: "Theatre Hall", category: "Presentation", description: "A stage-based room for videos, talks, performances, ceremonies, and guided presentations.", bestFor: ["video showcase", "launch event", "performance", "presentation"], defaultMood: "stage_spotlight", defaultMovement: "fixed_view_guided", recommendedObjectLimit: 20 },
    { id: "empty_3d_space", name: "Empty 3D Space", category: "Custom", description: "Blank world for advanced admins who want full control.", bestFor: ["custom builds", "advanced creators", "experimental rooms"], defaultMood: "neutral_clean", defaultMovement: "free_walk", recommendedObjectLimit: 80 },
  ],

  moodPresets: [
    { id: "premium_calm", name: "Premium Calm", lighting: "soft_gallery_lights", backgroundMusic: "soft_ambient", colorTone: "warm_white_gold", fog: false, glow: "subtle", emotionalTone: "quiet, elegant, curated" },
    { id: "nostalgic_warm", name: "Nostalgic Warm", lighting: "warm_memory_lights", backgroundMusic: "gentle_piano", colorTone: "sepia_gold", fog: "light", glow: "soft", emotionalTone: "personal, reflective, emotional" },
    { id: "cinematic_dark", name: "Cinematic Dark", lighting: "spotlight_path", backgroundMusic: "cinematic_low", colorTone: "black_blue_gold", fog: "medium", glow: "medium", emotionalTone: "dramatic, immersive, serious" },
    { id: "futuristic_glow", name: "Futuristic Glow", lighting: "neon_edge_lights", backgroundMusic: "soft_sci_fi", colorTone: "blue_purple_cyan", fog: "light", glow: "strong", emotionalTone: "modern, advanced, digital" },
    { id: "futuristic_blue", name: "Futuristic Blue", lighting: "neon_edge_lights", backgroundMusic: "soft_sci_fi", colorTone: "blue_purple_cyan", fog: "light", glow: "strong", emotionalTone: "modern, advanced, digital" },
    { id: "lively_public", name: "Lively Public", lighting: "bright_daylight", backgroundMusic: "light_public_ambient", colorTone: "bright_multicolor", fog: false, glow: "none", emotionalTone: "open, social, energetic" },
    { id: "stage_spotlight", name: "Stage Spotlight", lighting: "stage_lights", backgroundMusic: "pre_show_ambient", colorTone: "black_red_gold", fog: "light", glow: "spotlight", emotionalTone: "performance, attention, ceremony" },
    { id: "neutral_clean", name: "Neutral Clean", lighting: "balanced_soft", backgroundMusic: "none", colorTone: "white_gray", fog: false, glow: "none", emotionalTone: "simple, clear, flexible" },
  ],

  roomLayoutOptions: {
    roomSizes: [
      { id: "small", name: "Small", description: "Best for one focused exhibit or short memory room." },
      { id: "medium", name: "Medium", description: "Best for most exhibitions and walkthrough rooms." },
      { id: "large", name: "Large", description: "Best for marketplaces, multi-zone worlds, and big museums." },
      { id: "massive", name: "Massive", description: "Use only when needed. May be heavier on mobile." },
    ],
    layoutShapes: ["single_room", "long_corridor", "circular_gallery", "multi_zone_hall", "marketplace_street", "hub_and_spoke", "maze_light", "stage_front", "open_world_square"],
    wallStyles: ["white_gallery_wall", "dark_museum_wall", "glass_wall", "heritage_wall", "wood_panel_wall", "futuristic_metal_wall", "stone_archive_wall", "custom_uploaded_texture"],
    floorStyles: ["polished_gallery_floor", "marble_floor", "wood_floor", "black_reflective_floor", "stone_floor", "street_floor", "futuristic_grid_floor", "custom_uploaded_texture"],
    ceilingStyles: ["none_open_sky", "flat_gallery_ceiling", "high_museum_ceiling", "glass_ceiling", "cinematic_dark_ceiling", "futuristic_light_ceiling"],
    spawnPointOptions: ["front_center", "entrance_door", "middle_of_room", "custom_xyz", "cinematic_start_marker"],
  },

  visitorMovementModes: [
    { id: "click_to_move", name: "Click to Move", description: "Visitor taps or clicks where they want to go. Best for public users." },
    { id: "click_to_move_guided", name: "Click to Move + Guided Path", description: "Visitor can move, but the system suggests the best route." },
    { id: "guided_walkthrough", name: "Guided Walkthrough", description: "Visitor follows a structured sequence from station to station." },
    { id: "auto_walkthrough", name: "Auto Walkthrough", description: "Camera moves automatically like a cinematic tour." },
    { id: "free_walk", name: "Free Walk", description: "Visitor explores freely using joystick, WASD, or mobile controls." },
    { id: "fixed_view_guided", name: "Fixed View Guided", description: "Visitor stays mostly fixed while scenes, panels, or objects appear." },
  ],

  objectLibrary: [
    { id: "image_frame", name: "Image Frame", category: "Display", description: "A frame for photos, artwork, memories, or exhibit images.", editableFields: ["title", "imageUrl", "caption", "position", "rotation", "scale", "clickAction"] },
    { id: "video_wall", name: "Video Wall", category: "Display", description: "Large screen for video stories, walkthroughs, tenant videos, or explainers.", editableFields: ["title", "videoUrl", "thumbnailUrl", "autoplay", "mute", "loop", "position", "rotation", "scale"] },
    { id: "audio_point", name: "Audio Point", category: "Audio", description: "A sound hotspot that plays narration, music, oral history, or explanation.", editableFields: ["title", "audioUrl", "transcript", "triggerRadius", "position", "loop"] },
    { id: "text_panel", name: "Text Panel", category: "Information", description: "Readable panel for descriptions, labels, explanations, or instructions.", editableFields: ["title", "body", "fontSize", "alignment", "position", "rotation", "scale"] },
    { id: "artifact_display", name: "Artifact Display", category: "Museum", description: "Pedestal or glass case for an object, artifact, collectible, or product.", editableFields: ["title", "modelUrl", "imageUrl", "description", "position", "rotation", "scale", "lighting"] },
    { id: "memory_capsule", name: "Memory Capsule", category: "Memory", description: "Clickable memory orb that opens a story, image, audio, or video.", editableFields: ["title", "story", "mediaUrl", "emotionTag", "position", "color", "clickAction"] },
    { id: "door", name: "Door", category: "Navigation", description: "Physical door that links to another room.", editableFields: ["title", "destinationRoomId", "locked", "unlockCondition", "position", "rotation", "scale"] },
    { id: "portal", name: "Portal", category: "Navigation", description: "Glowing portal that transports visitors to another world or room.", editableFields: ["title", "destinationRoomId", "portalEffect", "locked", "unlockCondition", "position", "color"] },
    { id: "product_booth", name: "Product Booth", category: "Commerce", description: "Booth for tenant products, services, marketplace items, or sponsor showcases.", editableFields: ["brandName", "productName", "price", "imageUrl", "linkUrl", "ctaText", "position", "rotation", "scale"] },
    { id: "npc_guide", name: "NPC Guide", category: "Guide", description: "Virtual guide that welcomes visitors and explains the room.", editableFields: ["name", "avatarStyle", "script", "voice", "position", "triggerType", "dialogueSteps"] },
    { id: "quiz_station", name: "Quiz Station", category: "Gamification", description: "Interactive question station for learning, onboarding, or quests.", editableFields: ["question", "answers", "correctAnswer", "reward", "position", "rotation", "scale"] },
    { id: "collectible", name: "Collectible", category: "Gamification", description: "Item visitors can collect to unlock rewards, badges, or hidden rooms.", editableFields: ["name", "description", "iconUrl", "rarity", "rewardPoints", "position", "unlockEffect"] },
    { id: "floating_button", name: "Floating Button", category: "Action", description: "3D clickable button for actions such as open link, start video, or go next.", editableFields: ["label", "actionType", "targetUrl", "destinationRoomId", "position", "color", "size"] },
    { id: "direction_sign", name: "Direction Sign", category: "Navigation", description: "Arrow or signboard that guides visitors to the next area.", editableFields: ["label", "arrowDirection", "position", "rotation", "scale"] },
    { id: "light_source", name: "Light Source", category: "Environment", description: "Editable light for spotlight, ambient glow, or object highlight.", editableFields: ["lightType", "intensity", "color", "position", "targetObjectId"] },
  ],

  interactionTypes: [
    { id: "open_popup", name: "Open Popup", description: "Opens a panel with text, images, video, audio, or links." },
    { id: "go_to_room", name: "Go to Another Room", description: "Moves visitor to a selected room." },
    { id: "play_audio", name: "Play Audio", description: "Plays narration, music, sound effect, or oral history." },
    { id: "play_video", name: "Play Video", description: "Plays a video inside the 3D world or in a popup." },
    { id: "open_external_link", name: "Open External Link", description: "Opens a safe external URL." },
    { id: "start_quiz", name: "Start Quiz", description: "Starts a quiz or knowledge check." },
    { id: "collect_item", name: "Collect Item", description: "Adds item to visitor progress." },
    { id: "unlock_door", name: "Unlock Door", description: "Unlocks a door after a condition is met." },
    { id: "show_story", name: "Show Story", description: "Displays a memory, exhibit story, or tenant narrative." },
    { id: "trigger_animation", name: "Trigger Animation", description: "Animates an object, portal, light, or scene." },
  ],

  gamificationSeed: {
    enabledByDefault: false,
    availableSystems: [
      { id: "progress_path", name: "Progress Path", description: "Visitors complete stations in order." },
      { id: "collectibles", name: "Collectibles", description: "Visitors find and collect hidden items." },
      { id: "unlockable_doors", name: "Unlockable Doors", description: "Doors open after completing actions." },
      { id: "badges", name: "Badges", description: "Visitors earn badges for completion." },
      { id: "quest_steps", name: "Quest Steps", description: "Visitors complete missions inside the world." },
      { id: "visitor_score", name: "Visitor Score", description: "Visitors gain points for exploration, quiz answers, and discoveries." },
    ],
    defaultRewards: ["Completion Badge", "Hidden Memory Unlock", "Bonus Room Access", "Downloadable Certificate", "Special Tenant Offer", "Final Story Reveal"],
  },

  npcGuideSeed: {
    defaultNPCs: [
      { id: "museum_host", name: "Museum Host", avatarStyle: "formal_gallery_guide", tone: "warm, clear, respectful", openingLine: "Welcome. I’ll guide you through this exhibition step by step." },
      { id: "memory_keeper", name: "Memory Keeper", avatarStyle: "soft_glowing_archive_guide", tone: "gentle, emotional, reflective", openingLine: "This room holds memories. Take your time as you move through them." },
      { id: "future_guide", name: "Future Guide", avatarStyle: "futuristic_ai_guide", tone: "smart, simple, helpful", openingLine: "Welcome to the world. I’ll help you understand what each station means." },
      { id: "market_host", name: "Market Host", avatarStyle: "friendly_marketplace_guide", tone: "casual, helpful, energetic", openingLine: "Explore the booths around you. Tap anything that catches your eye." },
    ],
    dialogueRules: { maxWordsPerLine: 24, readingLevel: "Secondary 3 English", avoidLongParagraphs: true, alwaysExplainNextAction: true },
    triggerOptions: ["on_room_start", "on_object_click", "on_zone_enter", "on_quest_complete"],
  },

  doorAndPortalSystem: {
    requiredFields: ["doorName", "destinationRoomId", "doorType", "isLocked", "unlockCondition", "transitionStyle"],
    doorTypes: ["normal_door", "museum_archway", "glowing_portal", "hidden_door", "elevator", "staircase", "timeline_gate", "memory_gate", "marketplace_entrance"],
    transitionStyles: ["fade", "walk_through", "portal_warp", "cinematic_cut", "elevator_transition", "memory_flash"],
    validationRules: [
      "Every door must have a destination room.",
      "Locked doors must have an unlock condition.",
      "Every 3D world must have at least one exit.",
      "Do not allow broken room links.",
      "Warn admin if destination room is unpublished.",
    ],
  },

  mediaAnchors: {
    allowedMediaTypes: ["image", "video", "audio", "3d_model", "pdf", "external_link", "text_story", "quiz", "product"],
    anchorTypes: ["wall_frame", "floor_marker", "floating_orb", "pedestal", "screen", "booth", "door_label", "npc_dialogue", "popup_panel"],
    mediaRules: [
      "Images should support thumbnails.",
      "Videos should support thumbnail, mute, autoplay, and loop settings.",
      "Audio should support transcript for accessibility.",
      "3D models should have size limits and mobile fallback images.",
      "Every media object should have a title and optional description.",
    ],
  },

  performanceRules: {
    mobileFirst: true,
    defaultMaxObjectsMobile: 40,
    defaultMaxObjectsDesktop: 80,
    warnings: [
      { id: "too_many_objects", message: "This world may be too heavy for mobile. Reduce the number of objects." },
      { id: "large_video_files", message: "Large videos may slow down the room. Use compressed videos or thumbnails." },
      { id: "missing_fallback_image", message: "A 3D model needs a fallback image for slower devices." },
      { id: "spawn_blocked", message: "Visitor starting point is blocked by an object." },
      { id: "no_exit", message: "This world has no exit door or portal." },
      { id: "broken_door_link", message: "A door or portal is linked to a missing or unpublished room." },
      { id: "unlabelled_object", message: "One or more objects have no title. Add labels for clarity." },
    ],
    optimisationActions: ["compress_media", "reduce_object_count", "disable_realtime_shadows", "use_static_lighting", "lazy_load_far_objects", "replace_heavy_model_with_image", "limit_particle_effects"],
  },

  previewModes: [
    { id: "admin_preview", name: "Admin Preview", description: "Preview with edit markers and object boundaries visible." },
    { id: "visitor_preview", name: "Visitor Preview", description: "Preview exactly how a visitor sees the world." },
    { id: "mobile_preview", name: "Mobile Preview", description: "Preview the room on a phone-sized screen." },
    { id: "guided_tour_preview", name: "Guided Tour Preview", description: "Preview the room station by station." },
    { id: "public_live_preview", name: "Public Live Preview", description: "Preview the published experience." },
  ],

  publishChecklist: [
    { id: "has_template", label: "World template selected", severity: "required" },
    { id: "has_spawn_point", label: "Visitor starting point is set", severity: "required" },
    { id: "has_exit", label: "At least one exit door or portal exists", severity: "required" },
    { id: "all_doors_linked", label: "All doors and portals are linked correctly", severity: "required" },
    { id: "objects_have_titles", label: "Important objects have titles", severity: "recommended" },
    { id: "media_loaded", label: "Media files are valid", severity: "required" },
    { id: "mobile_safe", label: "World is safe for mobile visitors", severity: "recommended" },
    { id: "preview_checked", label: "Visitor preview has been checked", severity: "required" },
    { id: "performance_checked", label: "Performance warnings reviewed", severity: "recommended" },
  ],

  defaultSampleWorld: {
    roomTitle: "AOM Heritage Portal Room",
    masterPageType: "3D World",
    selectedTemplate: "portal_room",
    moodPreset: "premium_calm",
    roomSize: "medium",
    layoutShape: "hub_and_spoke",
    movementMode: "click_to_move_guided",
    spawnPoint: "entrance_door",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "Visitor starts here and receives a short welcome." },
      { id: "zone_memory_wall", name: "Memory Wall", description: "A wall of image frames and memory capsules." },
      { id: "zone_main_portals", name: "Main Portals", description: "Doors and portals to other rooms." },
      { id: "zone_final_story", name: "Final Story", description: "A closing panel and video." },
    ],
    starterObjects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome to the Heritage Room", body: "Walk through this room to explore stories, memories, and connected exhibitions.", position: { x: 0, y: 1.6, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup" },
      { id: "host_npc", type: "npc_guide", name: "Museum Host", title: "Museum Host", script: "Welcome. I’ll guide you through this room. Start with the memory wall, then enter the portal that interests you.", position: { x: -1.5, y: 0, z: -2 }, triggerType: "on_room_start" },
      { id: "memory_capsule_1", type: "memory_capsule", title: "First Memory", story: "This capsule holds the first story in this exhibition.", position: { x: 2, y: 1.4, z: -2 }, color: "warm_gold", clickAction: "show_story" },
      { id: "portal_to_timeline", type: "portal", title: "Enter Timeline Room", destinationRoomId: "room_timeline", portalEffect: "soft_gold_warp", locked: false, position: { x: 0, y: 1, z: -6 }, color: "gold" },
      { id: "door_to_final_memory", type: "door", title: "Final Memory Door", destinationRoomId: "room_final_memory", locked: true, unlockCondition: "visitor_collects_first_memory", position: { x: 4, y: 0, z: -4 }, rotation: { x: 0, y: -45, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { id: "exit_door", type: "door", title: "Exit to Main Lobby", destinationRoomId: "room_main_lobby", locked: false, position: { x: -4, y: 0, z: 1 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    ],
    gamification: {
      enabled: true,
      systems: ["collectibles", "unlockable_doors", "progress_path"],
      collectibles: [
        { id: "first_memory_token", name: "First Memory Token", description: "Collect this to unlock the Final Memory Door.", rewardPoints: 10, unlocks: ["door_to_final_memory"] },
      ],
    },
    publishStatus: "draft",
  },
};

export function getWorldTemplate(id) {
  return THREE_D_WORLD_EDITOR_SEED.worldTemplates.find((template) => template.id === id) || null;
}

export function getMoodPreset(id) {
  return THREE_D_WORLD_EDITOR_SEED.moodPresets.find((preset) => preset.id === id) || null;
}

export function getObjectType(id) {
  return THREE_D_WORLD_EDITOR_SEED.objectLibrary.find((entry) => entry.id === id) || null;
}
