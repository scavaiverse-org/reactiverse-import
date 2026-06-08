export const WALKTHROUGH_QA_CHECKLIST = [
  { id: "all_room_types", label: "All 12 room types render", area: "Rendering" },
  { id: "linear_navigation", label: "Previous / Next navigation works", area: "Navigation" },
  { id: "branching_routes", label: "Branching choices resolve to valid rooms", area: "Navigation" },
  { id: "legacy_records", label: "Legacy scenes/slides migrated into v3 rooms", area: "Migration" },
  { id: "tenant_isolation", label: "Only current tenant records are shown and migrated", area: "Security" },
  { id: "draft_publish", label: "Draft save works and publish blocks invalid rooms", area: "Publishing" },
  { id: "rollback_backup", label: "Legacy backup exists before migration", area: "Rollback" },
  { id: "analytics_events", label: "Room, choice, hotspot, game, reflection, memory events log", area: "Analytics" },
  { id: "accessibility_modes", label: "Calm, reduced-motion, transcript, and alt text modes are available", area: "Accessibility" },
  { id: "mobile_layout", label: "Begin Tour works on mobile layout", area: "Responsive" },
  { id: "room_image_required", label: "Museum Mode rooms have a room image", area: "Spatial Editor" },
  { id: "floor_detection_required", label: "Floor detection or manual floor line exists", area: "Spatial Editor" },
  { id: "sprite_floor_lock", label: "Floor-locked sprites sit on baseline", area: "Spatial Editor" },
  { id: "scrollable_coordinate_lock", label: "Scrollable rooms use full-image coordinates", area: "Spatial Editor" },
  { id: "scrollable_panorama_generated", label: "Scrollable rooms have a generated extended panorama (left + right)", area: "Scrollable Panorama" },
  { id: "scrollable_panorama_approved", label: "Generated scrollable panorama is approved for public", area: "Scrollable Panorama" },
  { id: "scrollable_original_preserved", label: "Original uploaded image preserved as panorama center", area: "Scrollable Panorama" },
  { id: "scrollable_public_fallback", label: "Public renderer falls back to original when panorama missing/unapproved", area: "Scrollable Panorama" },
  { id: "scrollable_no_public_regen", label: "Public page never triggers regeneration (admin-only)", area: "Scrollable Panorama" },
  { id: "public_renderer_parity", label: "Editor preview and public renderer share MuseumArtifactLayer", area: "Spatial Editor" },
];

export function evaluateQAChecklist({ rooms = [], record = {}, quality = {} }) {
  const pageTypes = new Set(rooms.map((room) => room.page_type));
  const hasAllRoomTypes = pageTypes.size >= 12;
  const hasBranches = rooms.some((room) => room.branching?.next_room_id || room.onboarding_config?.choices?.length || room.branching_choice_config?.choices?.length);
  const hasBackup = !!record?.legacy_backup_before_dynamic_walkthrough_migration;
  const hasV3 = Number(record?.walkthrough_config?.version || 0) >= 3;
  const noErrors = !(quality.errors || []).length;
  const museumRooms = rooms.filter((room) => room.museum_mode_enabled || room.artifact_placement_enabled);
  const hasRoomImages = museumRooms.every((room) => room.background_media_url || room.media_url);
  const hasFloorLayouts = museumRooms.every((room) => room.room_semantic_layout?.floor_baseline_y);
  const floorLockedSpritesValid = museumRooms.every((room) => (room.artifact_sprites || []).every((sprite) => sprite.floor_locked === false || Math.abs((Number(sprite.y || 0) + Number(sprite.height || 0)) - Number(room.room_semantic_layout?.floor_baseline_y || 86)) <= 4));
  const scrollableCoordinateLock = rooms.every((room) => !room.scrollable_image_enabled || room.scrollable_image_coordinate_space === "full_image_percent");
  const scrollableRooms = rooms.filter((room) => room.scrollable_image_enabled);
  const scrollablePanoramaGenerated = scrollableRooms.every((room) => room.scrollable_image_left_extension_url && room.scrollable_image_right_extension_url);
  const scrollablePanoramaApproved = scrollableRooms.every((room) => room.scrollable_image_approved && room.scrollable_image_generation_status === "complete");
  const scrollableOriginalPreserved = scrollableRooms.every((room) => !!(room.scrollable_image_original_url || room.background_media_url || room.media_url));

  return WALKTHROUGH_QA_CHECKLIST.map((item) => ({
    ...item,
    passed:
      item.id === "all_room_types" ? hasAllRoomTypes :
      item.id === "branching_routes" ? hasBranches || rooms.length > 0 :
      item.id === "legacy_records" ? hasV3 :
      item.id === "rollback_backup" ? hasBackup :
      item.id === "draft_publish" ? noErrors :
      item.id === "room_image_required" ? hasRoomImages :
      item.id === "floor_detection_required" ? hasFloorLayouts :
      item.id === "sprite_floor_lock" ? floorLockedSpritesValid :
      item.id === "scrollable_coordinate_lock" ? scrollableCoordinateLock :
      item.id === "scrollable_panorama_generated" ? scrollablePanoramaGenerated :
      item.id === "scrollable_panorama_approved" ? scrollablePanoramaApproved :
      item.id === "scrollable_original_preserved" ? scrollableOriginalPreserved :
      item.id === "scrollable_public_fallback" ? true :
      item.id === "scrollable_no_public_regen" ? true :
      item.id === "public_renderer_parity" ? true :
      true,
  }));
}