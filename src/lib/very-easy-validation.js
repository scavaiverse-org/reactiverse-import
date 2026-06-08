export function validateVeryEasyPublishReadiness(rooms = []) {
  const errors = [];
  if (!Array.isArray(rooms)) return ["The museum rooms could not be prepared. Click Fix Everything Automatically."];
  if (rooms.length < 3) errors.push("The museum needs a start, gallery, and ending. Click Fix Everything Automatically.");
  rooms.forEach((room, index) => {
    const label = room?.title || `Room ${index + 1}`;
    if (!room || typeof room !== "object") errors.push(`${label} could not be prepared. Click Fix Everything Automatically.`);
    if (!room?.title) errors.push(`${label} needs a title. Click Fix Everything Automatically.`);
    if (!room?.media_url && !room?.background_media_url) errors.push(`${label} needs an image or video. Click Fix Everything Automatically.`);
  });
  return errors.slice(0, 3);
}