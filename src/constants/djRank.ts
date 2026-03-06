type RankConfig = { label: string; ratio: number };

export const RANK_TABLE: RankConfig[] = [
  { label: "F", ratio: 0 },
  { label: "E", ratio: 2 / 9 },
  { label: "D", ratio: 3 / 9 },
  { label: "C", ratio: 4 / 9 },
  { label: "B", ratio: 5 / 9 },
  { label: "A", ratio: 6 / 9 },
  { label: "AA", ratio: 7 / 9 },
  { label: "AAA", ratio: 8 / 9 },
  { label: "MAX-", ratio: 17 / 18 },
];
