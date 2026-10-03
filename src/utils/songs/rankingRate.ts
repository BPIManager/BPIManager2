/**
 * ランキング行の「EX / BPI」列の表示値を算出する。notes が渡された場合（BPI 未計算の全難易度）は notes 基準の%、それ以外は事前計算済みの bpi を表示する。
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
