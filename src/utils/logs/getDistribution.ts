import type { ChartData } from "@/types/ui/chart";
import { RANK_THRESHOLDS } from "@/constants/theme/rankThreshold";
import { BatchDetailItem } from "@/types/logs/batchDetail";

export const getBpiDistribution = (
  details: BatchDetailItem[],
  step: number = 10,
): ChartData[] => {
  const buckets: ChartData[] = [{ label: "<-10", count: 0 }];
  for (let v = -10; v < 100; v += step) {
    buckets.push({ label: v.toString(), count: 0 });
  }
  buckets.push({ label: "100+", count: 0 });

  details.forEach((item) => {
    const bpi = item.current.bpi ?? -15;
    let idx: number;
    if (bpi < -10) {
      idx = 0;
    } else if (bpi >= 100) {
      idx = buckets.length - 1;
    } else {
      idx = Math.floor((bpi - -10) / step) + 1;
    }
    if (buckets[idx]) buckets[idx].count++;
  });

  return buckets;
};

export const getRankDistribution = (details: BatchDetailItem[]): ChartData[] => {
  const targetLabels = RANK_THRESHOLDS.map((item) => item.label).reverse();

  const counts: Record<string, number> = {};
  targetLabels.forEach((l) => (counts[l] = 0));

  details.forEach((item) => {
    if (!item.notes) return;
    const percentage = item.current.exScore / (item.notes * 2);

    // RANK_THRESHOLDSの末尾はratio: 0(=F)のため必ずいずれかにヒットする
    const achieved = RANK_THRESHOLDS.find((r) => percentage >= r.ratio)!;
    counts[achieved.label]++;
  });

  return targetLabels.map((label) => ({
    label: label,
    count: counts[label] || 0,
  }));
};
