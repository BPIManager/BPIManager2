/** BPM帯の分類（曲検索・BPI最適化の対象曲フィルタ等で共有） */
export type BpmBand = "slow" | "mid" | "fast" | "soflan";
export const BPM_BANDS: BpmBand[] = ["slow", "mid", "fast", "soflan"];

/**
 * 曲のBPM表記から低速(~135)/中速(135~170)/高速(170~)/SOFLANに分類する。
 * "120-180"のようなハイフン等区切りの可変速表記は、平均値で速度帯に
 * 丸めてしまうと実際の体感速度と乖離するため、速度帯とは別にSOFLANとして
 * 扱う（単一BPM値の曲のみ低速/中速/高速で分類する）。
 */
export function bpmBandOf(bpm: string | null | undefined): BpmBand {
  if (!bpm) return "soflan";
  if (/[-〜~]/.test(bpm)) return "soflan";
  const value = Number(bpm.trim());
  if (Number.isNaN(value)) return "soflan";
  if (value < 135) return "slow";
  if (value < 170) return "mid";
  return "fast";
}
