import { ChartData } from "@/components/partials/DashBoard/DistributionChart/ui";
import { getDJRank } from "../songs/djRank";
import { RANK_THRESHOLDS } from "@/components/partials/Metrics/ArenaAverage/ui";
import { BatchDetailItem } from "@/types/logs/batchDetail";

export const getBpiDistribution = (details: BatchDetailItem[]): ChartData[] => {
  const bins = [
    "<0",
    "0",
    "10",
    "20",
    "30",
    "40",
    "50",
    "60",
    "70",
    "80",
    "90",
    "100+",
  ];
  const counts = new Array(bins.length).fill(0);

  details.forEach((item) => {
    const bpi = item.current.bpi;
    if (bpi < 0) counts[0]++;
    else if (bpi >= 100) counts[11]++;
    else {
      const index = Math.floor(bpi / 10) + 1;
      if (index >= 1 && index <= 10) counts[index]++;
    }
  });

  return bins.map((label, i) => ({ label, count: counts[i] }));
};

export const getRankDistribution = (details: BatchDetailItem[]): ChartData[] => {
  const targetLabels = RANK_THRESHOLDS.map((item) => item.label).reverse();

  const counts: Record<string, number> = {};
  targetLabels.forEach((l) => (counts[l] = 0));

  details.forEach((item) => {
    if (!item.notes) return;
    const percentage = item.current.exScore / (item.notes * 2);

    const achieved = RANK_THRESHOLDS.find((r) => percentage >= r.ratio);

    if (achieved) {
      counts[achieved.label]++;
    } else {
      counts["F"]++;
    }
  });

  return targetLabels.map((label) => ({
    label: label,
    count: counts[label] || 0,
  }));
};
