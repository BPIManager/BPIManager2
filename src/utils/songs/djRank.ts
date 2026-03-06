import { RANK_TABLE } from "@/constants/djRank";

interface DJRankOptions {
  mode: "current" | "next";
  output: "label" | "value";
}

export const getRankIndex = (percentage: number): number => {
  const index = RANK_TABLE.findLastIndex((r) => percentage >= r.ratio);
  return index === -1 ? 0 : index;
};

export const getDJRank = (
  exScore: number,
  maxScore: number,
  options: DJRankOptions,
): string => {
  const { mode, output } = options;
  const percentage = exScore / maxScore;
  const currentIdx = getRankIndex(percentage);

  const isHighAAA = percentage >= 17 / 18;
  const isNormalAAA = percentage >= 8 / 9 && percentage < 17 / 18;

  let label: string;
  let scoreDiff: number;

  if (isNormalAAA || isHighAAA) {
    const distToMax = maxScore - exScore;
    const distFromAAA = exScore - Math.ceil(maxScore * (8 / 9));

    const showMaxMinus =
      (isNormalAAA && mode === "current") || (isHighAAA && mode === "next");

    if (showMaxMinus) {
      label = "MAX-";
      scoreDiff = distToMax;
    } else {
      label = "AAA+";
      scoreDiff = distFromAAA;
    }
  } else {
    const currentRank = RANK_TABLE[currentIdx];
    const nextRank =
      RANK_TABLE[currentIdx + 1] || RANK_TABLE[RANK_TABLE.length - 1];

    if (mode === "current") {
      label = `${currentRank.label}+`;
      scoreDiff = exScore - Math.ceil(maxScore * currentRank.ratio);
    } else {
      label = `${nextRank.label}-`;
      scoreDiff = Math.ceil(maxScore * nextRank.ratio) - exScore;
    }
  }

  return output === "value" ? `${Math.ceil(scoreDiff)}` : label;
};
