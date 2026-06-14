// Static catalog of achievements/badges. Earned badges are persisted in
// visitor_badges (0023_visitor_engagement.sql); this file defines the rules
// used to decide when a badge should be newly awarded.
//
// scope: "platform" badges use tenant_id = 'platform' (see migration);
// "tenant" badges are earned per-museum.
export const BADGE_DEFINITIONS = [
  {
    key: "first_steps",
    title: "First Steps",
    description: "Visited your first room in a museum walkthrough.",
    scope: "platform",
    isEarned: ({ journey }) => (journey?.visited_room_keys?.length || 0) >= 1,
  },
  {
    key: "halfway_there",
    title: "Halfway There",
    description: "Explored at least half of a walkthrough.",
    scope: "tenant",
    isEarned: ({ journey }) => (journey?.percent_complete || 0) >= 50,
  },
  {
    key: "full_tour",
    title: "Full Tour",
    description: "Completed an entire walkthrough.",
    scope: "tenant",
    isEarned: ({ journey }) => journey?.status === "completed",
  },
  {
    key: "collector",
    title: "Collector",
    description: "Collected 5 artifacts in a single walkthrough.",
    scope: "tenant",
    isEarned: ({ collectibles }) => (collectibles?.length || 0) >= 5,
  },
  {
    key: "completionist",
    title: "Completionist",
    description: "Collected every artifact in a walkthrough.",
    scope: "tenant",
    isEarned: ({ collectibles, totalArtifacts }) => totalArtifacts > 0 && (collectibles?.length || 0) >= totalArtifacts,
  },
];

export function getBadgeDefinition(key) {
  return BADGE_DEFINITIONS.find((badge) => badge.key === key) || null;
}

// Returns the badge keys that should be newly awarded given the visitor's
// current journey/collectibles state and the badges they already hold.
export function evaluateNewBadges({ journey, collectibles = [], totalArtifacts = 0, earnedBadgeKeys = [] }) {
  const earned = new Set(earnedBadgeKeys);
  return BADGE_DEFINITIONS
    .filter((badge) => !earned.has(badge.key))
    .filter((badge) => badge.isEarned({ journey, collectibles, totalArtifacts }))
    .map((badge) => ({ badge_key: badge.key, tenant_id: badge.scope === "platform" ? "platform" : journey?.tenant_id }));
}
