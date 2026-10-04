/** DJランク定義と計算ユーティリティ */
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

const ratioOf = (label: string): number => {
  const rank = RANK_TABLE.find((r) => r.label === label);
  if (!rank) throw new Error(`${label} rank is missing from RANK_TABLE`);
  return rank.ratio;
};

/** AAA の境界比率（AAA+ の超過分を求めるために使う） */
export const AAA_RATIO = ratioOf("AAA");
/** MAX- の境界比率 */
export const MAX_MINUS_RATIO = ratioOf("MAX-");

export const getRankDetail = (currentEx: number, maxScore: number) => {
  let currentRank = RANK_TABLE[0];
  let nextRank = RANK_TABLE[1];

  for (let i = 0; i < RANK_TABLE.length; i++) {
    const border = Math.ceil(maxScore * RANK_TABLE[i].ratio);
    if (currentEx >= border) {
      currentRank = RANK_TABLE[i];
      nextRank = RANK_TABLE[i + 1];
    } else {
      break;
    }
  }

  const currentBorder = Math.ceil(maxScore * currentRank.ratio);

  const nextBorder = nextRank ? Math.ceil(maxScore * nextRank.ratio) : maxScore;
  const nextLabel = nextRank ? nextRank.label : "MAX";

  return {
    label: currentRank.label,
    nextLabel,
    surplus: currentEx - currentBorder,
    shortage: nextBorder - currentEx,
  };
};
