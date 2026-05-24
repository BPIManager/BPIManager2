export const ARENA_RANK_ORDER = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
] as const;

export type ArenaRank = (typeof ARENA_RANK_ORDER)[number];

export const A_RANKS = ["A1", "A2", "A3", "A4", "A5"] as const;
export type ARank = (typeof A_RANKS)[number];
