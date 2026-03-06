export const LAMP_RANK: Record<string, number> = {
  "NO PLAY": 0,
  FAILED: 1,
  "ASSIST CLEAR": 2,
  "EASY CLEAR": 3,
  CLEAR: 4,
  "HARD CLEAR": 5,
  "EX HARD CLEAR": 6,
  "FULL COMBO": 7,
};

export const isImproved = (
  newLamp: string,
  oldLamp: string | null,
): boolean => {
  const newRank = LAMP_RANK[newLamp] ?? 0;
  const oldRank = LAMP_RANK[oldLamp ?? "NO PLAY"] ?? 0;
  return newRank > oldRank;
};
