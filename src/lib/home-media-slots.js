export const HOME_MEDIA_SLOTS = [
  { slotKey: "hero", assignedSection: "home.hero", adminLabel: "Hero Background Media", homeConfigPath: "heroDesktopMediaId", publicComponent: "HeroMediaPanel", allowedMediaTypes: ["image", "video"] },
  { slotKey: "hero_desktop", assignedSection: "home.hero.desktop", adminLabel: "Hero Desktop Media", homeConfigPath: "heroDesktopMediaId", publicComponent: "HeroMediaPanel", allowedMediaTypes: ["image", "video"] },
  { slotKey: "hero_tablet", assignedSection: "home.hero.tablet", adminLabel: "Hero Tablet Media", homeConfigPath: "heroTabletMediaId", publicComponent: "HeroMediaPanel", allowedMediaTypes: ["image", "video"] },
  { slotKey: "hero_mobile", assignedSection: "home.hero.mobile", adminLabel: "Hero Mobile Media", homeConfigPath: "heroMobileMediaId", publicComponent: "HeroMediaPanel", allowedMediaTypes: ["image", "video"] },
  { slotKey: "hero_badge", assignedSection: "home.hero.badge", adminLabel: "Visit From Anywhere Badge Media", homeConfigPath: "heroSection.badgeMediaId", publicComponent: "HeroMediaPanel", allowedMediaTypes: ["image"] },
  { slotKey: "museum_highlights_section", assignedSection: "home.museum_highlights_section", adminLabel: "Museum Highlights Section Media", homeConfigPath: "museumHighlightsSection.backgroundMediaId", publicComponent: "HomeHighlightsSection", allowedMediaTypes: ["image", "video"] },
  { slotKey: "museum_highlight_guided_visit", assignedSection: "home.museum_highlight_guided_visit", adminLabel: "Take A Guided Visit Card Media", homeConfigPath: "museumHighlightCards.guided.backgroundMediaId", publicComponent: "HomeHighlightsSection", allowedMediaTypes: ["image", "video"] },
  { slotKey: "museum_highlight_aria", assignedSection: "home.museum_highlight_aria", adminLabel: "Ask ARIA Card Media", homeConfigPath: "museumHighlightCards.aria.backgroundMediaId", publicComponent: "HomeHighlightsSection", allowedMediaTypes: ["image", "video"] },
  { slotKey: "museum_highlight_stories", assignedSection: "home.museum_highlight_stories", adminLabel: "Explore Cultural Stories Card Media", homeConfigPath: "museumHighlightCards.stories.backgroundMediaId", publicComponent: "HomeHighlightsSection", allowedMediaTypes: ["image", "video"] },
  { slotKey: "museum_highlight_tickets", assignedSection: "home.museum_highlight_tickets", adminLabel: "View Tickets Card Media", homeConfigPath: "museumHighlightCards.tickets.backgroundMediaId", publicComponent: "HomeHighlightsSection", allowedMediaTypes: ["image", "video"] },
  { slotKey: "what_you_can_do_section", assignedSection: "home.what_you_can_do_section", adminLabel: "What You Can Do Section Media", homeConfigPath: "whatYouCanDoSection.backgroundMediaId", publicComponent: "HomeModuleGrid", allowedMediaTypes: ["image", "video"] },
  { slotKey: "home_card_visit", assignedSection: "home.home_card_visit", adminLabel: "Visit Card Media", homeConfigPath: "homeCards.visit.backgroundMediaId", publicComponent: "HomeModuleGrid", allowedMediaTypes: ["image", "video"] },
  { slotKey: "home_card_aria", assignedSection: "home.home_card_aria", adminLabel: "ARIA Card Media", homeConfigPath: "homeCards.aria.backgroundMediaId", publicComponent: "HomeModuleGrid", allowedMediaTypes: ["image", "video"] },
  { slotKey: "home_card_stories", assignedSection: "home.home_card_stories", adminLabel: "Stories Card Media", homeConfigPath: "homeCards.stories.backgroundMediaId", publicComponent: "HomeModuleGrid", allowedMediaTypes: ["image", "video"] },
  { slotKey: "home_card_future", assignedSection: "home.home_card_future", adminLabel: "Future Card Media", homeConfigPath: "homeCards.future.backgroundMediaId", publicComponent: "HomeModuleGrid", allowedMediaTypes: ["image", "video"] },
  { slotKey: "schools_partners_section", assignedSection: "home.schools_partners_section", adminLabel: "Schools Visitors Partners Media", homeConfigPath: "schoolsPartnersSection.backgroundMediaId", publicComponent: "HomePathways", allowedMediaTypes: ["image", "video"] },
  { slotKey: "platform_preview_section", assignedSection: "home.platform_preview_section", adminLabel: "Platform Preview Media", homeConfigPath: "platformPreviewSection.backgroundMediaId", publicComponent: "HomePathways", allowedMediaTypes: ["image", "video"] },
  { slotKey: "final_cta_section", assignedSection: "home.final_cta_section", adminLabel: "Final CTA Media", homeConfigPath: "finalCtaSection.backgroundMediaId", publicComponent: "HomeFinalCta", allowedMediaTypes: ["image", "video"] }
];

export const HOME_MEDIA_SLOT_BY_KEY = HOME_MEDIA_SLOTS.reduce((map, slot) => ({ ...map, [slot.slotKey]: slot }), {});

export function slotForCard(prefix, key) {
  if (prefix === "museum") return HOME_MEDIA_SLOT_BY_KEY[`museum_highlight_${key === "guided" ? "guided_visit" : key}`];
  return HOME_MEDIA_SLOT_BY_KEY[`home_card_${key}`];
}