import { RANK_TABLE, getRankDetail } from "@/constants/iidx/rankBorders";

interface DJRankOptions {
  mode: "current" | "next";
  output: "label" | "value";
}

export const getRankIndex = (percentage: number): number => {
  const index = RANK_TABLE.findLastIndex((r) => percentage >= r.ratio);
  return index === -1 ? 0 : index;
};

/**
 * DJランクの表示ラベルと差分を返す。境界の定義は `getRankDetail` に一本化しており、
 * 表示（`getDJRank`）と差分計算（`getRankDetail`）で値がずれないようにする。
 *
 * - `current`: 現在ランクからの超過分（例: `AAA+`）。MAX-帯は `MAX-` の超過分
 * - `next`: 次ランクまでの不足分（例: `D-`）。最上位帯は満点までの不足分
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

  if (mode === "current") {
    label = detail.label === "MAX-" ? "MAX-" : `${detail.label}+`;
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
