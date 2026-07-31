import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";

interface ScoreEntry {
  songId: number;
  bpi: number | null;
  difficultyLevel: number;
  title: string;
  clearState?: string | null;
  playDay?: string | null;
  lastPlayed?: string | Date | null;
}

interface TimelineEntry {
  id: string;
  batchId: string;
  version: string;
  totalBpi: number;
  songCount: number;
  createdAt: string | Date | null | undefined;
  topScores: {
    title: string;
    bpi: number;
    clearState: string | null | undefined;
  }[];
  diff: number;
}

export const calculateTotalBpi = (
  allScores: ScoreEntry[],
  totalSongs: number,
  version: string,
  topN: number,
): TimelineEntry[] => {
  if (allScores.length === 0) return [];

  const timeline: TimelineEntry[] = [];
  const currentPBs = new Map<number, { bpi: number; level: number }>();
  const dailyGroups = new Map<string, ScoreEntry[]>();

  // 日付情報が欠損したスコアを「今日」として扱うと実際の推移を歪めるため、
  // 既知の日付の中で最も古いバケットに寄せる
  const knownDayKeys = allScores
    .filter((score) => score.playDay || score.lastPlayed)
    .map((score) =>
      dayjs(score.playDay || score.lastPlayed).format("YYYY-MM-DD"),
    )
    .sort();
  const fallbackDayKey = knownDayKeys[0] ?? dayjs(0).format("YYYY-MM-DD");

  allScores.forEach((score) => {
    const dayKey =
      score.playDay || score.lastPlayed
        ? dayjs(score.playDay || score.lastPlayed).format("YYYY-MM-DD")
        : fallbackDayKey;
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
      .map((v) => v.bpi)
      .sort((a, b) => b - a);

    const totalBpi = BpiCalculator.calculateTotalBPI(bpis12, totalSongs);

    timeline.push({
      id: dayKey,
      batchId: dayKey,
      version: version,
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
