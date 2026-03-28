/**
 * クリアランプ種別を数値ランクにマッピングする定数。
 * 値が大きいほど上位のクリア種別を示す。
 */
export const LAMP_RANK: Record<string, number> = {
  "NO PLAY": 0,
  FAILED: 1,
  "ASSIST CLEAR": 2,
  "EASY CLEAR": 3,
  CLEAR: 4,
  "HARD CLEAR": 5,
  "EX HARD CLEAR": 6,
  "FULLCOMBO CLEAR": 7,
};

/**
 * 新しいランプ種別が旧ランプより上位かどうかを返す。
 *
 * @param newLamp - 新しいクリアランプ種別
 * @param oldLamp - 旧クリアランプ種別（未プレイの場合は `null`）
 * @returns 新しいランプが旧ランプより上位であれば `true`
 */
export const isImproved = (
  newLamp: string,
  oldLamp: string | null,
): boolean => {
  const newRank = LAMP_RANK[newLamp] ?? 0;
  const oldRank = LAMP_RANK[oldLamp ?? "NO PLAY"] ?? 0;
  return newRank > oldRank;
};
