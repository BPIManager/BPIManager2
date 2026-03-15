import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";

export const calculateTotalBpi = (
  allScores: any[],
  totalSongs: number,
  version: string,
  topN: number,
) => {
  if (allScores.length === 0) return [];

  const timeline: any[] = [];
  const currentPBs = new Map<number, { bpi: number; level: number }>();
  const dailyGroups = new Map<string, any[]>();

  allScores.forEach((score) => {
    const dayKey = dayjs(score.playDay || score.lastPlayed).format(
      "YYYY-MM-DD",
    );
    if (!dailyGroups.has(dayKey)) dailyGroups.set(dayKey, []);
    dailyGroups.get(dayKey)!.push(score);
  });

  const sortedDayKeys = Array.from(dailyGroups.keys()).sort();

  for (const dayKey of sortedDayKeys) {
    const dayScores = dailyGroups.get(dayKey)!;

    dayScores.forEach((s) => {
      currentPBs.set(s.songId, {
        bpi: s.bpi ?? -15,
        level: s.difficultyLevel,
      });
    });

    const bpis12 = Array.from(currentPBs.values())
      .filter((v) => v.level === 12)
      .map((v) => v.bpi);

    const totalBpi = BpiCalculator.calculateTotalBPI(bpis12, totalSongs);

    timeline.push({
      id: dayKey,
      batchId: dayKey,
      version: Number(version),
      totalBpi,
      songCount: dayScores.length,
      createdAt: dayScores[dayScores.length - 1].lastPlayed,
      topScores: [...dayScores]
        .sort((a, b) => (b.bpi ?? -15) - (a.bpi ?? -15))
        .slice(0, topN)
        .map((s) => ({
          title: s.title,
          bpi: Number(s.bpi),
          clearState: s.clearState,
        })),
      diff: 0,
    });
  }

  timeline.reverse();
  for (let i = 0; i < timeline.length - 1; i++) {
    timeline[i].diff =
      Math.round((timeline[i].totalBpi - timeline[i + 1].totalBpi) * 100) / 100;
  }

  return timeline;
};
