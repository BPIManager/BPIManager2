import { CLEAR_STATES } from "@/constants/iidx/clearLamps";
/**
 * クリアランプ種別を数値ランクにマッピングする定数。
 * 値が大きいほど上位のクリア種別を示す。
 */
export const LAMP_RANK: Record<string, number> = Object.fromEntries(
  ["NO PLAY", ...CLEAR_STATES.map((s) => s.value)].map((value, rank) => [
    value,
    rank,
  ]),
);

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
