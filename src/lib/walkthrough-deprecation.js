export const LEGACY_WALKTHROUGH_FILES = [
  "pages/tenant/BeginTour1",
  "pages/tenant/BeginTour2",
  "pages/tenant/BeginTour3",
  "pages/tenant/BeginTour4",
  "pages/tenant/BeginTour5",
  "pages/Onboarding",
  "pages/RoomPreview",
];

export function getDeprecationStatus(record = {}) {
  const version = Number(record?.walkthrough_config?.version || 0);
  const editorType = record?.walkthrough_config?.editor_type || "legacy";
  const hasDynamicRooms = Array.isArray(record?.walkthrough_config?.rooms) && record.walkthrough_config.rooms.length > 0;
  const hasLegacyScenes = Array.isArray(record?.walkthrough_config?.scenes) && record.walkthrough_config.scenes.length > 0;
  const hasLegacySlides = Array.isArray(record?.onboarding_config?.slides) && record.onboarding_config.slides.length > 0;

  return {
    isDynamicV3: version >= 3 && hasDynamicRooms,
    editorType,
    hasDynamicRooms,
    hasLegacyScenes,
    hasLegacySlides,
    legacySourcesDetected: hasLegacyScenes || hasLegacySlides,
    canDeprecateLegacyRoutes: version >= 3 && hasDynamicRooms && !hasLegacyScenes && !hasLegacySlides,
  };
}