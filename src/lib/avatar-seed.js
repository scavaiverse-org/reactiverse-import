// Deterministic preset data for the Avatar Creation System. Every list here
// is a fixed, ordered set of {id, label, ...} entries so the same choices
// always produce the same avatar.

export const SKIN_TONES = [
  { id: "porcelain", label: "Porcelain", color: "#f4d6c0" },
  { id: "fair", label: "Fair", color: "#eac3a0" },
  { id: "light", label: "Light", color: "#dba97c" },
  { id: "medium", label: "Medium", color: "#c08a5f" },
  { id: "tan", label: "Tan", color: "#a06a40" },
  { id: "deep", label: "Deep", color: "#7a4a2a" },
  { id: "rich", label: "Rich", color: "#5a3520" },
  { id: "ebony", label: "Ebony", color: "#3a2316" },
];

export const BODY_BUILDS = [
  { id: "slim", label: "Slim", torsoScale: [0.84, 1.0, 0.82], limbScale: 0.88 },
  { id: "average", label: "Average", torsoScale: [1, 1, 1], limbScale: 1 },
  { id: "athletic", label: "Athletic", torsoScale: [1.08, 1.02, 1.04], limbScale: 1.08 },
  { id: "broad", label: "Broad / plus-size", torsoScale: [1.22, 0.98, 1.18], limbScale: 1.16 },
];

export const HEIGHT_RANGE = { min: 0.85, max: 1.18, default: 1.0, step: 0.01 };

export const HAIR_STYLES = [
  { id: "none", label: "Bald / none" },
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
  { id: "ponytail", label: "Ponytail" },
  { id: "afro", label: "Afro" },
];

export const HAIR_COLORS = [
  { id: "black", label: "Black", color: "#1c1410" },
  { id: "darkbrown", label: "Dark brown", color: "#3b2618" },
  { id: "brown", label: "Brown", color: "#5c3d23" },
  { id: "auburn", label: "Auburn", color: "#7a3b22" },
  { id: "blonde", label: "Blonde", color: "#d8b873" },
  { id: "ginger", label: "Ginger", color: "#c1602f" },
  { id: "gray", label: "Gray", color: "#9b968f" },
  { id: "white", label: "White", color: "#f1efe9" },
  { id: "blue", label: "Blue", color: "#3a6ea5" },
  { id: "pink", label: "Pink", color: "#e07ba0" },
];

// Shared swatch set used for both outfit top and bottom colors.
export const OUTFIT_COLORS = [
  { id: "charcoal", label: "Charcoal", color: "#2b2f36" },
  { id: "slate", label: "Slate", color: "#475569" },
  { id: "sky", label: "Sky blue", color: "#3b82f6" },
  { id: "navy", label: "Navy", color: "#1e3a8a" },
  { id: "teal", label: "Teal", color: "#0d9488" },
  { id: "forest", label: "Forest green", color: "#15803d" },
  { id: "olive", label: "Olive", color: "#65823c" },
  { id: "mustard", label: "Mustard", color: "#ca8a04" },
  { id: "burnt-orange", label: "Burnt orange", color: "#c2580c" },
  { id: "crimson", label: "Crimson", color: "#b91c1c" },
  { id: "magenta", label: "Magenta", color: "#a3206e" },
  { id: "violet", label: "Violet", color: "#6d28d9" },
  { id: "cream", label: "Cream", color: "#f5ead6" },
  { id: "white", label: "White", color: "#f4f4f5" },
];

export const ACCESSORIES = [
  { id: "none", label: "None" },
  { id: "glasses", label: "Glasses" },
  { id: "cap", label: "Cap" },
  { id: "headphones", label: "Headphones" },
  { id: "scarf", label: "Scarf" },
];

export const VIEW_MODES = [
  { id: "third_person", label: "Third-person", description: "See your avatar as you walk through the world." },
  { id: "first_person", label: "First-person (POV)", description: "Look out through your avatar's eyes." },
];

export const QUALITY_TIERS = [
  {
    id: "standard",
    label: "Deterministic avatar",
    description: "Built instantly from your customization choices, with an optional photo cutout. Fully available now.",
    available: true,
  },
  {
    id: "ai_enhanced",
    label: "AI-enhanced likeness",
    description: "A future option to reconstruct a closer 3D likeness from your photos using AI. Coming soon — not yet available.",
    available: false,
  },
];

export const SOURCE_PHOTO_TYPES = {
  NONE: "none",
  SELFIE: "selfie",
  FULL_BODY: "full_body",
};

export const SOURCE_PHOTO_TYPE_OPTIONS = [
  { id: SOURCE_PHOTO_TYPES.SELFIE, label: "Selfie / face photo", description: "We'll cut out your face and place it on a customizable body." },
  { id: SOURCE_PHOTO_TYPES.FULL_BODY, label: "Full-body photo", description: "We'll cut out your whole figure and use it as your avatar." },
];

export const AVATAR_CONSENT_COPY = {
  title: "Create your avatar",
  intro: "Before you upload anything, please read this. Your photos and avatar are used to represent you in 3D worlds across the platform.",
  bullets: [
    "Only upload photos of yourself. Do not upload photos of other people without their explicit consent.",
    "We only keep a cropped cutout (your traced outline) — the original photo is never uploaded or stored.",
    "Your avatar and cutout images are visible to other visitors in shared 3D worlds.",
    "You can re-customize or permanently delete your avatar and its images at any time from this screen.",
    "Avatars must not depict nudity, sexual content, hate symbols, or anything illegal. Misuse may result in your avatar being removed.",
  ],
  ageLabel: "I confirm that I am 16 years of age or older (or have a parent/guardian's permission to use this feature).",
  consentLabel: "I consent to my photo(s) being processed to create a 3D avatar, and I confirm any uploaded photo is of myself with consent to use it.",
  skipLabel: "Skip for now — use a default avatar",
};

export const AVATAR_PRIVACY_NOTES = [
  "Cutout images are stored in public, platform-hosted storage so your avatar can render for other visitors — avoid uploading anything you wouldn't want publicly visible.",
  "Deleting your avatar removes your saved customization and cutout images. It does not affect your account.",
];
