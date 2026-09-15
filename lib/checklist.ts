export const storageKey = (roomId: number) => `equipment-checklist-room-${roomId}`;

export const readChecked = (roomId: number): Set<number> => {
  try {
    const saved = localStorage.getItem(storageKey(roomId));
    if (saved) return new Set(JSON.parse(saved));
  } catch {
    // ignore malformed storage
  }
  return new Set();
};
