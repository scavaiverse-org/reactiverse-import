// Ready-to-load example worlds for the 3D World Builder. Each entry builds a
// complete, valid threeDWorldConfig via createThreeDWorldConfig() — loading
// one replaces the current draft, the same way "Load Sample World" does for
// the AOM Heritage Portal Room (see buildSampleWorldConfig in
// three-d-world-validation.js, which remains the Portal Room example).
//
// These exist so admins can see every object type, gamification system, NPC
// preset, and door/portal pattern in a working configuration, then tweak it
// rather than starting from a blank world. Media URL fields are left empty —
// admins replace them with real uploads; the Superguide explains what each
// field is for.

import { createThreeDWorldConfig } from "@/lib/three-d-world-validation";

export const THREE_D_WORLD_EXAMPLES = [
  {
    id: "heritage_gallery",
    name: "Heritage Gallery Walkthrough",
    templateId: "museum_gallery",
    summary: "A circular gallery with a welcome panel, a curator-verified founding photo, a sacred ceremonial drum, an oral history recording, a heritage quiz, a collectible token, and an exit — with gamification and a Museum Host guide already set up.",
    build: () => createThreeDWorldConfig({
      selectedTemplate: "museum_gallery",
      moodPreset: "premium_calm",
      roomSize: "medium",
      layoutShape: "circular_gallery",
      movementMode: "click_to_move_guided",
      guidedPathEnabled: true,
      atmosphereEffect: "dust_motes",
      spawnPoint: "front_center",
      zones: [
        { id: "zone_entrance", name: "Entrance", description: "Visitors arrive and read the welcome panel." },
        { id: "zone_collection", name: "Collection", description: "Founding photo and ceremonial drum on display." },
        { id: "zone_quiz_corner", name: "Quiz Corner", description: "Heritage quiz and collectible token." },
      ],
      objects: [
        { id: "welcome_panel", type: "text_panel", title: "Welcome to the Heritage Gallery", description: "", body: "Walk around the gallery to learn about our founding story and community heritage.", fontSize: "medium", alignment: "center", creator: "", period: "", culture: "", material: "", provenance: "", sourceCitation: "", curatorialStatus: "", sensitivity: "none", position: { x: 0, y: 1.6, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "founding_photo", type: "image_frame", title: "Founding Photograph, 1958", description: "", imageUrl: "", caption: "The founding committee outside the original building.", altText: "Black and white photo of the founding committee standing outside the original building in 1958.", creator: "Unknown photographer", period: "1958", culture: "Local heritage", material: "Silver gelatin print", provenance: "Donated by the founding family", sourceCitation: "Town Archive, Box 12, Folder 4", curatorialStatus: "curator_verified", sensitivity: "none", spriteMode: false, billboard: false, position: { x: -2.5, y: 1.6, z: -2 }, rotation: { x: 0, y: 25, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "ceremonial_drum", type: "artifact_display", title: "Ceremonial Drum", description: "A hand-carved drum used in seasonal ceremonies.", modelUrl: "", imageUrl: "", lighting: "spotlight", altText: "A wooden ceremonial drum with painted hide and carved handles.", creator: "Community artisans", period: "Early 20th century", culture: "Local heritage community", material: "Wood, hide, natural pigment", provenance: "On loan from the cultural council", sourceCitation: "", curatorialStatus: "community_voice", sensitivity: "sacred", spriteMode: true, billboard: true, position: { x: 2.5, y: 1, z: -2 }, rotation: { x: 0, y: -20, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "oral_history", type: "audio_point", title: "Oral History: Founding Story", description: "", audioUrl: "", transcript: "In 1958, a small group of neighbours pooled their savings to buy this building and open it to the whole community.", loop: false, position: { x: 0, y: 1.2, z: -5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "play_audio", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "heritage_quiz", type: "quiz_station", title: "Heritage Quiz", description: "", question: "In what year was the gallery founded?", answers: ["1948", "1958", "1968"], correctAnswer: "1958", reward: "heritage_token", position: { x: -2, y: 1, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "start_quiz", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "heritage_token", type: "collectible", title: "Heritage Explorer Token", description: "Awarded for completing the heritage quiz.", name: "Heritage Explorer Token", iconUrl: "", rarity: "common", rewardPoints: 10, unlockEffect: "", position: { x: -2, y: 1.2, z: 2.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "collect_item", triggerRadius: 1.5, visible: true, lockCondition: "visitor_completes_heritage_quiz" },
        { id: "exit_door", type: "door", title: "Exit to Main Lobby", description: "", destinationRoomId: "room_main_lobby", doorType: "normal_door", transitionStyle: "fade", locked: false, unlockCondition: "", position: { x: 4, y: 0, z: 3 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "go_to_room", triggerRadius: 2, visible: true, lockCondition: "" },
      ],
      gamification: {
        enabled: true,
        systems: ["collectibles", "quest_steps", "visitor_score"],
        collectibles: [
          { id: "heritage_token", name: "Heritage Explorer Token", description: "Collect this by completing the heritage quiz.", rewardPoints: 10, unlocks: [] },
        ],
        questSteps: ["Read the welcome panel", "View the founding photograph", "Listen to the oral history recording", "Answer the heritage quiz correctly"],
        badges: ["Heritage Explorer"],
        completionReward: "Completion Badge",
      },
      npcGuide: {
        enabled: true,
        npcType: "museum_host",
        avatarStyle: "formal_gallery_guide",
        tone: "warm, clear, respectful",
        openingLine: "Welcome. I’ll guide you through this exhibition step by step.",
        script: "Start at the welcome panel, then explore the founding photograph and ceremonial drum. Listen to the oral history when you're ready, then try the heritage quiz near the exit.",
        dialogueSteps: ["Welcome to the Heritage Gallery", "Take a look at the founding photograph", "Listen to the oral history recording", "Try the heritage quiz before you leave"],
        triggerType: "on_room_start",
      },
      accessibility: { sensoryWarning: "", textScale: "normal", highContrast: false, twoDFallbackEnabled: true, miniMapEnabled: true },
      publishStatus: "draft",
    }),
  },

  {
    id: "family_memory_archive",
    name: "Family Memory Archive",
    templateId: "memory_archive",
    summary: "A warm, guided memory corridor with a Memory Keeper guide, a childhood memory capsule, a grandparent's portrait and voice recording, a closing story panel, and a locked Legacy Gate that opens once all memories are viewed.",
    build: () => createThreeDWorldConfig({
      selectedTemplate: "memory_archive",
      moodPreset: "nostalgic_warm",
      roomSize: "small",
      layoutShape: "long_corridor",
      movementMode: "guided_walkthrough",
      atmosphereEffect: "warm_embers",
      fogOverride: "light",
      spawnPoint: "entrance_door",
      zones: [
        { id: "zone_entrance", name: "Entrance", description: "Visitors arrive and meet the Memory Keeper." },
        { id: "zone_memories", name: "Memories", description: "Photos, voices, and memory capsules from the family." },
        { id: "zone_legacy_gate", name: "Legacy Gate", description: "Closing story and the gate onward." },
      ],
      objects: [
        { id: "memory_keeper_npc", type: "npc_guide", title: "Memory Keeper", description: "", name: "Memory Keeper", avatarStyle: "soft_glowing_archive_guide", script: "This room holds memories of our family. Take your time as you move through each one.", voice: "soft_glowing_archive_guide", dialogueSteps: ["This room holds memories of our family", "Take your time with each one", "When you're ready, continue to the legacy gate"], position: { x: -1, y: 0, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "", triggerType: "on_zone_enter" },
        { id: "memory_childhood", type: "memory_capsule", title: "Childhood Summers", description: "", story: "Every summer, the whole family gathered at the lake house for two weeks of swimming, fishing, and late dinners on the porch.", mediaUrl: "", emotionTag: "joyful", color: "warm_gold", altText: "A memory capsule glowing warm gold, representing childhood summer memories.", creator: "", period: "1970s-1980s", culture: "", material: "", provenance: "", sourceCitation: "", curatorialStatus: "community_voice", sensitivity: "none", position: { x: 1.5, y: 1.4, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "show_story", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "grandmother_portrait", type: "image_frame", title: "Grandmother, 1965", description: "", imageUrl: "", caption: "Grandma on her wedding day.", altText: "A portrait photo of grandmother on her wedding day in 1965.", creator: "Family collection", period: "1965", culture: "Family heritage", material: "Photograph", provenance: "Family photo album", sourceCitation: "", curatorialStatus: "community_voice", sensitivity: "none", spriteMode: false, billboard: false, position: { x: -1.5, y: 1.6, z: -5 }, rotation: { x: 0, y: 20, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "grandfather_voice", type: "audio_point", title: "Grandfather's Voice", description: "", audioUrl: "", transcript: "I remember the day we moved into this house. It was raining, and your grandmother carried the radio in first so we'd have music while we unpacked.", loop: false, position: { x: 1.5, y: 1.2, z: -5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "play_audio", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "our_story_panel", type: "text_panel", title: "Our Family's Story", description: "", body: "This archive is a small window into our family's life — a few memories we wanted to keep and share with the people we love.", fontSize: "medium", alignment: "center", creator: "", period: "", culture: "", material: "", provenance: "", sourceCitation: "", curatorialStatus: "", sensitivity: "none", position: { x: 0, y: 1.6, z: -7 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "legacy_gate", type: "door", title: "Legacy Gate", description: "", destinationRoomId: "room_main_lobby", doorType: "memory_gate", transitionStyle: "memory_flash", locked: true, unlockCondition: "visitor_views_all_memories", position: { x: 0, y: 0, z: -9 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "go_to_room", triggerRadius: 2, visible: true, lockCondition: "" },
      ],
      gamification: { enabled: false, systems: [], collectibles: [], questSteps: [], badges: [], completionReward: "" },
      npcGuide: {
        enabled: true,
        npcType: "memory_keeper",
        avatarStyle: "soft_glowing_archive_guide",
        tone: "gentle, emotional, reflective",
        openingLine: "This room holds memories. Take your time as you move through them.",
        script: "This room holds memories of our family. Take your time as you move through each one. When you're ready, continue through the legacy gate.",
        dialogueSteps: ["This room holds memories of our family", "Take your time with each one", "When you're ready, continue to the legacy gate"],
        triggerType: "on_zone_enter",
      },
      accessibility: { sensoryWarning: "This room contains an audio recording of a family member who has passed away.", textScale: "large", highContrast: true, twoDFallbackEnabled: true, miniMapEnabled: true },
      publishStatus: "draft",
    }),
  },

  {
    id: "cinematic_brand_walkthrough",
    name: "Cinematic Brand Walkthrough",
    templateId: "cinematic_walkthrough",
    summary: "An auto-walkthrough brand story: opening panel, two video walls with transcripts, a 'Learn More' floating button, a direction sign, and an elevator to the showroom — with a Brand Insider badge on completion.",
    build: () => createThreeDWorldConfig({
      selectedTemplate: "cinematic_walkthrough",
      moodPreset: "cinematic_dark",
      roomSize: "large",
      layoutShape: "long_corridor",
      movementMode: "auto_walkthrough",
      autoWalkthroughEnabled: true,
      mobileControls: false,
      atmosphereEffect: "floating_lights",
      fogOverride: "medium",
      glowOverride: "medium",
      spawnPoint: "cinematic_start_marker",
      zones: [
        { id: "zone_opening", name: "Opening", description: "Brand introduction panel." },
        { id: "zone_product_reveal", name: "Product Reveal", description: "First video wall reveals the product." },
        { id: "zone_vision", name: "Vision", description: "Second video wall shares the brand's vision." },
        { id: "zone_showroom_link", name: "Showroom Link", description: "Direction sign and elevator to the showroom." },
      ],
      objects: [
        { id: "opening_panel", type: "text_panel", title: "Our Story Begins", description: "", body: "For ten years, we've been building products that bring people together. Walk with us through where we've been — and where we're going.", fontSize: "large", alignment: "center", creator: "", period: "", culture: "", material: "", provenance: "", sourceCitation: "", curatorialStatus: "", sensitivity: "none", position: { x: 0, y: 1.8, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "product_reveal_video", type: "video_wall", title: "Product Reveal", description: "", videoUrl: "", thumbnailUrl: "", autoplay: true, mute: true, loop: false, transcript: "Introducing our newest product — designed with our community, built to last, and ready for what's next.", position: { x: 0, y: 1.6, z: -6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 1.2, z: 1 }, clickAction: "play_video", triggerRadius: 3, visible: true, lockCondition: "" },
        { id: "vision_video", type: "video_wall", title: "Our Vision", description: "", videoUrl: "", thumbnailUrl: "", autoplay: true, mute: true, loop: false, transcript: "We believe technology should bring people closer, not push them apart. Here's what we're building toward.", position: { x: 0, y: 1.6, z: -10 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 1.2, z: 1 }, clickAction: "play_video", triggerRadius: 3, visible: true, lockCondition: "" },
        { id: "learn_more_button", type: "floating_button", title: "Learn More", description: "", label: "Learn More", actionType: "open_external_link", targetUrl: "https://example.com/about", destinationRoomId: "", color: "cyan", size: "medium", position: { x: 1.5, y: 1.4, z: -10 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_external_link", triggerRadius: 1.5, visible: true, lockCondition: "" },
        { id: "next_room_sign", type: "direction_sign", title: "Showroom →", description: "", label: "Showroom →", arrowDirection: "forward", position: { x: 0, y: 1.2, z: -13 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "showroom_elevator", type: "door", title: "Showroom Elevator", description: "", destinationRoomId: "room_showroom", doorType: "elevator", transitionStyle: "elevator_transition", locked: false, unlockCondition: "", position: { x: 0, y: 0, z: -14 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "go_to_room", triggerRadius: 2, visible: true, lockCondition: "" },
      ],
      gamification: { enabled: true, systems: ["badges"], collectibles: [], questSteps: [], badges: ["Brand Insider"], completionReward: "Final Story Reveal" },
      npcGuide: { enabled: false, npcType: "", avatarStyle: "", tone: "", openingLine: "", script: "", dialogueSteps: [], triggerType: "on_room_start" },
      accessibility: { sensoryWarning: "This walkthrough contains fast camera movement, flashing lights, and loud music.", textScale: "normal", highContrast: false, twoDFallbackEnabled: true, miniMapEnabled: false },
      publishStatus: "draft",
    }),
  },

  {
    id: "marketplace_street",
    name: "Marketplace Street",
    templateId: "marketplace_street",
    summary: "A lively open street with three tenant product booths, a direction sign to the plaza, a loyalty stamp collectible, a Market Host guide, and an exit back to the main lobby.",
    build: () => createThreeDWorldConfig({
      selectedTemplate: "marketplace_street",
      moodPreset: "lively_public",
      roomSize: "large",
      layoutShape: "marketplace_street",
      movementMode: "free_walk",
      mobileControls: true,
      atmosphereEffect: "none",
      spawnPoint: "middle_of_room",
      zones: [
        { id: "zone_bakery", name: "Bakery Row", description: "Local bakery booth." },
        { id: "zone_ceramics", name: "Ceramics Corner", description: "Handmade ceramics booth." },
        { id: "zone_apparel", name: "Apparel Stalls", description: "Apparel booth and plaza exit." },
      ],
      objects: [
        { id: "bakery_booth", type: "product_booth", title: "Riverside Bakery", description: "", brandName: "Riverside Bakery", productName: "Sourdough Loaf", price: "$6.50", imageUrl: "", linkUrl: "https://example.com/riverside-bakery", ctaText: "Visit shop", altText: "A wooden market booth for Riverside Bakery displaying fresh sourdough loaves.", position: { x: -4, y: 0, z: -2 }, rotation: { x: 0, y: 30, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_external_link", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "ceramics_booth", type: "product_booth", title: "Hollow Hill Ceramics", description: "", brandName: "Hollow Hill Ceramics", productName: "Hand-thrown Mug", price: "$18.00", imageUrl: "", linkUrl: "https://example.com/hollow-hill-ceramics", ctaText: "Visit shop", altText: "A market booth for Hollow Hill Ceramics displaying hand-thrown mugs and bowls.", position: { x: 0, y: 0, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_external_link", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "apparel_booth", type: "product_booth", title: "North Star Apparel", description: "", brandName: "North Star Apparel", productName: "Knit Scarf", price: "$24.00", imageUrl: "", linkUrl: "https://example.com/north-star-apparel", ctaText: "Visit shop", altText: "A market booth for North Star Apparel displaying knitted scarves and hats.", position: { x: 4, y: 0, z: -2 }, rotation: { x: 0, y: -30, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_external_link", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "plaza_sign", type: "direction_sign", title: "Plaza & Exit", description: "", label: "Plaza & Exit", arrowDirection: "right", position: { x: 2, y: 1.2, z: 1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "loyalty_stamp", type: "collectible", title: "Loyalty Stamp", description: "Collect a stamp from visiting the market.", name: "Loyalty Stamp", iconUrl: "", rarity: "common", rewardPoints: 5, unlockEffect: "", position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "collect_item", triggerRadius: 1.5, visible: true, lockCondition: "" },
        { id: "market_exit", type: "door", title: "Exit to Main Lobby", description: "", destinationRoomId: "room_main_lobby", doorType: "marketplace_entrance", transitionStyle: "walk_through", locked: false, unlockCondition: "", position: { x: 0, y: 0, z: 4 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "go_to_room", triggerRadius: 2, visible: true, lockCondition: "" },
      ],
      gamification: {
        enabled: true,
        systems: ["collectibles", "visitor_score"],
        collectibles: [{ id: "loyalty_stamp", name: "Loyalty Stamp", description: "Collected by visiting the marketplace.", rewardPoints: 5, unlocks: [] }],
        questSteps: ["Visit the bakery booth", "Visit the ceramics booth", "Visit the apparel booth"],
        badges: ["Market Regular"],
        completionReward: "Special Tenant Offer",
      },
      npcGuide: {
        enabled: true,
        npcType: "market_host",
        avatarStyle: "friendly_marketplace_guide",
        tone: "casual, helpful, energetic",
        openingLine: "Explore the booths around you. Tap anything that catches your eye.",
        script: "Welcome to the market! Check out the bakery, ceramics, and apparel booths around you. Collect a loyalty stamp before you head out.",
        dialogueSteps: ["Welcome to the market", "Check out the booths around you", "Collect a loyalty stamp before you leave"],
        triggerType: "on_object_click",
      },
      accessibility: { sensoryWarning: "", textScale: "normal", highContrast: false, twoDFallbackEnabled: true, miniMapEnabled: true },
      publishStatus: "draft",
    }),
  },

  {
    id: "futuristic_innovation_room",
    name: "Futuristic Innovation Room",
    templateId: "futuristic_room",
    summary: "A glowing sci-fi showcase with a spotlighted prototype, a Future Guide NPC, an innovation quiz, and a portal onward — using a custom spawn point and progress-path gamification.",
    build: () => createThreeDWorldConfig({
      selectedTemplate: "futuristic_room",
      moodPreset: "futuristic_glow",
      roomSize: "medium",
      layoutShape: "single_room",
      movementMode: "click_to_move_guided",
      guidedPathEnabled: true,
      atmosphereEffect: "floating_lights",
      glowOverride: "strong",
      spawnPoint: "custom_xyz",
      spawnPointCustom: { x: 0, y: 0, z: 4 },
      zones: [
        { id: "zone_showcase", name: "Showcase", description: "The prototype display and spotlight." },
        { id: "zone_briefing", name: "Briefing", description: "Future guide, quiz, and portal onward." },
      ],
      objects: [
        { id: "innovation_model", type: "artifact_display", title: "Prototype X-1", description: "Our next-generation concept device.", modelUrl: "", imageUrl: "", lighting: "spotlight", altText: "A sleek silver and glass prototype device on a lit pedestal.", creator: "Innovation Lab", period: "2026 concept", culture: "", material: "Aluminium and glass", provenance: "", sourceCitation: "", curatorialStatus: "", sensitivity: "none", spriteMode: false, billboard: false, position: { x: 0, y: 1, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "showcase_light", type: "light_source", title: "Showcase Spotlight", description: "", lightType: "spot", intensity: 1.4, color: "#7dd3fc", targetObjectId: "innovation_model", position: { x: 0, y: 3, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "future_guide_npc", type: "npc_guide", title: "Future Guide", description: "", name: "Future Guide", avatarStyle: "futuristic_ai_guide", script: "Welcome to the world. I'll help you understand what each station means. Take a look at Prototype X-1, then try the quiz.", voice: "futuristic_ai_guide", dialogueSteps: ["Welcome to the world", "Take a look at Prototype X-1", "Try the quiz when you're ready"], position: { x: 1.5, y: 0, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "", triggerType: "on_quest_complete" },
        { id: "innovation_quiz", type: "quiz_station", title: "Innovation Quiz", description: "", question: "What is Prototype X-1 made from?", answers: ["Wood and fabric", "Aluminium and glass", "Recycled plastic"], correctAnswer: "Aluminium and glass", reward: "innovation_badge", position: { x: -1.5, y: 1, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "start_quiz", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "next_portal", type: "portal", title: "Enter Vision Room", description: "", destinationRoomId: "room_vision", portalEffect: "blue_warp", doorType: "glowing_portal", transitionStyle: "portal_warp", locked: false, unlockCondition: "", color: "cyan", position: { x: 0, y: 1, z: -6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "go_to_room", triggerRadius: 2, visible: true, lockCondition: "" },
      ],
      gamification: {
        enabled: true,
        systems: ["progress_path", "quest_steps"],
        collectibles: [],
        questSteps: ["View Prototype X-1", "Talk to the Future Guide", "Answer the innovation quiz"],
        badges: ["Innovation Badge"],
        completionReward: "Bonus Room Access",
      },
      npcGuide: {
        enabled: true,
        npcType: "future_guide",
        avatarStyle: "futuristic_ai_guide",
        tone: "smart, simple, helpful",
        openingLine: "Welcome to the world. I’ll help you understand what each station means.",
        script: "Welcome to the world. I'll help you understand what each station means. Take a look at Prototype X-1, then try the quiz.",
        dialogueSteps: ["Welcome to the world", "Take a look at Prototype X-1", "Try the quiz when you're ready"],
        triggerType: "on_quest_complete",
      },
      accessibility: { sensoryWarning: "This room contains bright pulsing lights.", textScale: "normal", highContrast: true, twoDFallbackEnabled: true, miniMapEnabled: true },
      publishStatus: "draft",
    }),
  },

  {
    id: "theatre_hall_premiere",
    name: "Theatre Hall Premiere",
    templateId: "theatre_hall",
    summary: "A spotlighted stage with a custom-scripted host NPC, a premiere video wall with transcript, programme notes, and a locked staircase to the lounge that unlocks once the show finishes.",
    build: () => createThreeDWorldConfig({
      selectedTemplate: "theatre_hall",
      moodPreset: "stage_spotlight",
      roomSize: "medium",
      layoutShape: "stage_front",
      movementMode: "fixed_view_guided",
      atmosphereEffect: "none",
      glowOverride: "spotlight",
      fogOverride: "light",
      spawnPoint: "front_center",
      zones: [
        { id: "zone_stage", name: "Stage", description: "Host NPC and premiere screen." },
        { id: "zone_lounge_exit", name: "Lounge Exit", description: "Programme notes and the staircase to the lounge." },
      ],
      objects: [
        { id: "stage_host_npc", type: "npc_guide", title: "Jordan Reyes", description: "", name: "Jordan Reyes", avatarStyle: "", script: "Good evening, and welcome to the premiere. Please take your seat — the show is about to begin.", voice: "", dialogueSteps: ["Good evening, and welcome", "Please take your seat", "Enjoy the show"], position: { x: 0, y: 0, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "", triggerType: "on_room_start" },
        { id: "premiere_screen", type: "video_wall", title: "Premiere Screening", description: "", videoUrl: "", thumbnailUrl: "", autoplay: false, mute: false, loop: false, transcript: "Tonight's premiere tells the story of our community over the last fifty years, in the words of the people who lived it.", position: { x: 0, y: 2, z: -5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 3, y: 1.8, z: 1 }, clickAction: "play_video", triggerRadius: 3, visible: true, lockCondition: "" },
        { id: "programme_notes", type: "text_panel", title: "Programme Notes", description: "", body: "Tonight's premiere runs approximately 40 minutes. The lounge will open once the screening ends.", fontSize: "medium", alignment: "center", creator: "", period: "", culture: "", material: "", provenance: "", sourceCitation: "", curatorialStatus: "", sensitivity: "none", position: { x: -2.5, y: 1.4, z: 0 }, rotation: { x: 0, y: 30, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "open_popup", triggerRadius: 2, visible: true, lockCondition: "" },
        { id: "lounge_stairs", type: "door", title: "Staircase to Lounge", description: "", destinationRoomId: "room_lounge", doorType: "staircase", transitionStyle: "cinematic_cut", locked: true, unlockCondition: "visitor_watches_full_show", position: { x: 3, y: 0, z: 1 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 1, y: 1, z: 1 }, clickAction: "go_to_room", triggerRadius: 2, visible: true, lockCondition: "" },
      ],
      gamification: { enabled: false, systems: [], collectibles: [], questSteps: [], badges: [], completionReward: "" },
      npcGuide: {
        enabled: true,
        npcType: "",
        avatarStyle: "formal_host",
        tone: "warm, formal, welcoming",
        openingLine: "Good evening, and welcome to the premiere.",
        script: "Good evening, and welcome to the premiere. Please take your seat — the show is about to begin. The lounge will open once the screening ends.",
        dialogueSteps: ["Good evening, and welcome", "Please take your seat", "The lounge opens after the show"],
        triggerType: "on_room_start",
      },
      accessibility: { sensoryWarning: "This room contains loud audio and strobe-style stage lighting.", textScale: "large", highContrast: true, twoDFallbackEnabled: true, miniMapEnabled: false },
      publishStatus: "draft",
    }),
  },
];

export function getThreeDWorldExample(id) {
  return THREE_D_WORLD_EXAMPLES.find((entry) => entry.id === id) || null;
}
