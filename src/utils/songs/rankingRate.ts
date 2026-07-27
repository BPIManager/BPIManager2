/**
 * ランキング行の「EX / BPI」列に表示する値を算出する。
 * notes が渡された場合（BPI未計算の全難易度スコア用）は notes 基準の%表記、
 * それ以外は事前計算済みの bpi をそのまま表示する。
 */
export const formatRankingRate = (
  row: { exScore: number | null; bpi?: number | null },
  notes?: number,
): string => {
  if (notes != null) {
    return row.exScore != null
      ? `${((row.exScore / (notes * 2)) * 100).toFixed(1)}%`
      : "-";
  }
  return row.bpi != null ? row.bpi.toFixed(1) : "-";
};
