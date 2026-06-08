import { canRenderSlotMedia } from "./HomeMediaAssignmentValidator";

export function resolveSlotMedia(mediaById, slotKey, id) {
  const media = id ? mediaById[id] : null;
  return canRenderSlotMedia(slotKey, media) ? media : null;
}

export function resolveMedia(config, mediaById) {
  const byId = (id) => id ? mediaById[id] : null;
  const bySlot = (slotKey, id) => resolveSlotMedia(mediaById, slotKey, id);

  return {
    hero: {
      desktop: bySlot("hero_desktop", config.heroDesktopMediaId) || bySlot("hero", config.heroDesktopMediaId),
      tablet: bySlot("hero_tablet", config.heroTabletMediaId),
      mobile: bySlot("hero_mobile", config.heroMobileMediaId),
      badge: bySlot("hero_badge", config.heroSection?.badgeMediaId),
    },
    highlight: byId(config.highlightMediaId),
    cards: {
      visit: config.homeCards?.find((card) => card.key === "visit")?.backgroundMediaId ? null : byId(config.visitCardMediaId),
      aria: config.homeCards?.find((card) => card.key === "aria")?.backgroundMediaId ? null : byId(config.ariaCardMediaId),
      stories: config.homeCards?.find((card) => card.key === "stories")?.backgroundMediaId ? null : byId(config.storiesCardMediaId),
      future: config.homeCards?.find((card) => card.key === "future")?.backgroundMediaId ? null : byId(config.futureCardMediaId),
    },
    finalCta: bySlot("final_cta_section", config.finalCtaSection?.backgroundMediaId) || byId(config.finalCtaMediaId),
  };
}

export function mediaMap(records = []) {
  return records.reduce((map, item) => {
    if ((item.status === "active" || item.publishState === "published") && item.isActive !== false) map[item.id] = item;
    return map;
  }, {});
}