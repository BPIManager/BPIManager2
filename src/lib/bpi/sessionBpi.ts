import { BpiV1 } from "@bpim/bpicalc";

// 更新した☆12の単曲BPI集合を1つの対象楽曲として扱い、べき乗平均で集約する（未プレイの穴埋めは発生しない）。
// 少数の観測では縮小推定でシフト法（calculateTotalBPI）が実力より低く出るため使わない。
const v1Aggregator = new BpiV1();

/** 「今日のBPI」。単曲BPIが1件も無ければ null */
export const calcSessionBpi = (bpis: number[]): number | null => {
  if (bpis.length === 0) return null;
  const desc = [...bpis].sort((a, b) => b - a);
  return v1Aggregator.total(desc, desc.length);
};
