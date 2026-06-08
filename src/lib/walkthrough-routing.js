export function sortRooms(rooms = []) {
  return [...rooms].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function findRoomIndexByTarget(rooms = [], target) {
  if (!target) return -1;
  return rooms.findIndex((room) => room.id === target || room.room_key === target);
}

export function resolveNextRoomIndex({ rooms = [], currentIndex = 0, target = "" }) {
  const direct = findRoomIndexByTarget(rooms, target);
  if (direct >= 0) return direct;
  const next = currentIndex + 1;
  return next < rooms.length ? next : -1;
}

export function getRoomConnections(rooms = []) {
  return rooms.flatMap((room) => {
    const targets = [room.branching?.next_room_id, room.branching?.fallback_room_id, room.onboarding_config?.skip_target_room_id, ...(room.ctas || []).map((cta) => cta.route), ...(room.finale_config?.next_ctas || []).map((cta) => cta.route), ...(room.onboarding_config?.choices || []).map((choice) => choice.next_room_id), ...(room.branching_choice_config?.choices || []).map((choice) => choice.next_room_id)].filter(Boolean).filter((target) => !String(target).startsWith("/"));
    return targets.map((target) => ({ from: room.id || room.room_key, fromLabel: room.room_key, to: target }));
  });
}