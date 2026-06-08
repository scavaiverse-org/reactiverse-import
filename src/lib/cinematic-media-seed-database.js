const baseProfiles = {
  ancient: { cinematicProfile: "slow reveal, warm spotlight, museum silence", soundtrackProfile: "soft drones, low percussion, distant chimes", lightingMood: "warm amber gallery light", roomEnvironment: "heritage gallery", transitionStyle: "fade", narrationStyle: "calm curator voice", pacingProfile: "slow" },
  performance: { cinematicProfile: "curtain reveal, spotlight drift, close detail", soundtrackProfile: "stage ambience, strings, soft drums", lightingMood: "dramatic stage glow", roomEnvironment: "performance hall", transitionStyle: "cinematic_zoom", narrationStyle: "expressive guide voice", pacingProfile: "medium" },
  future: { cinematicProfile: "neon glide, hologram scan, portal entry", soundtrackProfile: "ambient synth, pulse, digital shimmer", lightingMood: "cool neon contrast", roomEnvironment: "future gallery", transitionStyle: "portal", narrationStyle: "precise cinematic voice", pacingProfile: "medium" },
  nature: { cinematicProfile: "wide discovery, soft mist, layered depth", soundtrackProfile: "wind, water, temple bells", lightingMood: "green-gold natural light", roomEnvironment: "immersive landscape", transitionStyle: "fade", narrationStyle: "gentle explorer voice", pacingProfile: "slow" }
};

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const CINEMATIC_MEDIA_SEED_DATABASE = [
  ["Ancient Artifact", "Ancient ceremonial object", "ancient"],
  ["Samurai Armor", "Samurai armor under gallery light", "ancient"],
  ["Asian Ceramics", "Ceramic collection with fine craft detail", "ancient"],
  ["Opera Mask", "Opera mask and character identity", "performance"],
  ["Temple Interior", "Sacred temple interior", "ancient"],
  ["Floating Lanterns", "Floating lantern night atmosphere", "performance"],
  ["Historical Battlefield", "Historic battlefield memory", "ancient"],
  ["Museum Hall", "Grand museum hall", "ancient"],
  ["Ancient Scroll", "Ancient scroll and manuscript", "ancient"],
  ["Dynasty Throne", "Dynasty throne room", "ancient"],
  ["Royal Crown", "Royal crown treasury display", "ancient"],
  ["Mythological Creature", "Mythological creature gallery", "performance"],
  ["Maritime Relic", "Maritime relic and navigation", "ancient"],
  ["Space Artifact", "Space artifact in dark gallery", "future"],
  ["Cyberpunk Exhibit", "Cyberpunk city exhibit", "future"],
  ["AI Future Gallery", "AI future gallery", "future"],
  ["Neon Tokyo", "Neon Tokyo immersive street", "future"],
  ["Traditional Dance", "Traditional dance performance", "performance"],
  ["Heritage Textile", "Heritage textile close detail", "ancient"],
  ["Shadow Puppetry", "Shadow puppetry stage", "performance"],
  ["Ancient Weapon", "Ancient weapon display", "ancient"],
  ["Fossil Display", "Fossil display hall", "ancient"],
  ["Underwater Ruins", "Underwater ruins", "nature"],
  ["Jungle Temple", "Jungle temple discovery", "nature"],
  ["Sacred Shrine", "Sacred shrine approach", "ancient"],
  ["Hologram Gallery", "Hologram gallery", "future"],
  ["Digital Rain Room", "Digital rain room", "future"],
  ["Ancient Library", "Ancient library archive", "ancient"],
  ["Gold Treasury", "Gold treasury vault", "ancient"],
  ["Interactive Projection Room", "Interactive projection room", "future"]
].map(([category, title, profileKey], index) => {
  const ids = [
    "photo-1554907984-15263bfd63bd", "photo-1577083552431-6e5fd01aa342", "photo-1594744803329-e58b31de8bf5", "photo-1503095396549-807759245b35", "photo-1609599006353-e629aaabfeae", "photo-1518998053901-5348d3961a04", "photo-1566127444979-b3d2b654e3d7", "photo-1524995997946-a1c2e315a42f", "photo-1519167758481-83f29c8cf6d8", "photo-1511795409834-ef04bbd61622"
  ];
  const profile = baseProfiles[profileKey];
  return {
    id: `cinematic-seed-${index + 1}`,
    preview: photo(ids[index % ids.length]),
    thumbnail: photo(ids[index % ids.length]),
    title,
    tags: [category.toLowerCase().replaceAll(" ", "-"), profileKey, "cinematic", "museum-ready"],
    category,
    emotionalTone: profileKey === "future" ? "awe and anticipation" : profileKey === "performance" ? "drama and wonder" : profileKey === "nature" ? "mystery and discovery" : "reverence and curiosity",
    cinematicProfile: profile.cinematicProfile,
    soundtrackProfile: profile.soundtrackProfile,
    semanticCategory: category,
    recommendedRoomType: index === 0 ? "onboarding_guide" : index === 29 ? "finale_room" : profileKey === "performance" ? "performance_stage" : profileKey === "future" ? "walkthrough_exhibition" : "artifact_room",
    autoCameraMovement: profile.cinematicProfile,
    soundtrackSuggestion: profile.soundtrackProfile,
    lightingMood: profile.lightingMood,
    roomEnvironment: profile.roomEnvironment,
    cinematicTransitionStyle: profile.transitionStyle,
    narrationStyle: profile.narrationStyle,
    pacingProfile: profile.pacingProfile,
  };
});

export function getSeedAsset(index = 0) {
  return CINEMATIC_MEDIA_SEED_DATABASE[index % CINEMATIC_MEDIA_SEED_DATABASE.length];
}