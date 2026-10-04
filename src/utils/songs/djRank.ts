import { RANK_TABLE, getRankDetail } from "@/constants/iidx/rankBorders";

interface DJRankOptions {
  mode: "current" | "next";
  output: "label" | "value";
}

/** AAA の境界比率（AAA+ の超過分を求めるために使う） */
const AAA_RATIO = (() => {
  const aaa = RANK_TABLE.find((r) => r.label === "AAA");
  if (!aaa) throw new Error("AAA rank is missing from RANK_TABLE");
  return aaa.ratio;
})();

/**
 * DJランクの表示ラベルと差分を返す。境界定義は getRankDetail に一本化し、表示と差分の値がずれないようにする。
 * current は現在ランクからの超過分、next は次ランクまでの不足分（最上位帯は満点までの不足分）。
 */
export const getDJRank = (
  exScore: number,
  maxScore: number,
  options: DJRankOptions,
): string => {
  const { mode, output } = options;
  const detail = getRankDetail(exScore, maxScore);

  let label: string;
  let scoreDiff: number;

  // AAA 帯と MAX- 帯は、左に現在ランク、右に「100%までの不足」か「AAA からの超過」を出す（MAX- 境界との差は使わない）
  if (detail.label === "MAX-") {
    if (mode === "current") {
      label = "MAX-";
      scoreDiff = maxScore - exScore;
    } else {
      label = "AAA+";
      scoreDiff = exScore - Math.ceil(maxScore * AAA_RATIO);
    }
  } else if (detail.label === "AAA") {
    if (mode === "current") {
      label = "AAA+";
      scoreDiff = exScore - Math.ceil(maxScore * AAA_RATIO);
    } else {
      label = "MAX-";
      scoreDiff = maxScore - exScore;
    }
  } else if (mode === "current") {
    label = `${detail.label}+`;
    scoreDiff = detail.surplus;
  } else {
    // 次ランク名は表の表記（例: MAX-）の場合と、最上位後の "MAX"（満点）の場合がある
    label = detail.nextLabel.endsWith("-")
      ? detail.nextLabel
      : `${detail.nextLabel}-`;
    scoreDiff = detail.shortage;
  }

  return output === "value" ? `${Math.ceil(scoreDiff)}` : label;
};
