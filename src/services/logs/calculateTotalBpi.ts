import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";
import type {
  IBpiBasicSongData,
  IBpiScoreObservation,
} from "@/types/songs/bpi";

interface ScoreEntry {
  songId: number;
  bpi: number | null;
  exScore: number;
  notes: number;
  difficultyLevel: number;
  title: string;
  clearState?: string | null;
  playDay?: string | null;
  lastPlayed?: string | Date | null;
  batchId?: string | null;
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
  allSongs: (IBpiBasicSongData & { songId: number })[],
  version: string,
  topN: number,
): TimelineEntry[] => {
  if (allScores.length === 0) return [];

  const timeline: TimelineEntry[] = [];
  const currentPBs = new Map<
    number,
    { bpi: number; level: number; exScore: number; notes: number }
  >();

  // 日付情報が欠損したスコアを「今日」として扱うと実際の推移を歪めるため、
  // 既知の日付の中で最も古いバケットに寄せる
  const knownDayKeys = allScores
    .filter((score) => score.playDay || score.lastPlayed)
    .map((score) =>
      dayjs(score.playDay || score.lastPlayed).format("YYYY-MM-DD"),
    )
    .sort();
  const fallbackDayKey = knownDayKeys[0] ?? dayjs(0).format("YYYY-MM-DD");

  const dayKeyOf = (score: ScoreEntry) =>
    score.playDay || score.lastPlayed
      ? dayjs(score.playDay || score.lastPlayed).format("YYYY-MM-DD")
      : fallbackDayKey;

  const sortedScores = [...allScores].sort((a, b) => {
    const at =
      a.playDay || a.lastPlayed
        ? dayjs(a.playDay || a.lastPlayed).valueOf()
        : 0;
    const bt =
      b.playDay || b.lastPlayed
        ? dayjs(b.playDay || b.lastPlayed).valueOf()
        : 0;
    return at - bt;
  });

  const stepGroups = new Map<string, ScoreEntry[]>();
  sortedScores.forEach((score, index) => {
    const stepKey = score.batchId ? `batch:${score.batchId}` : `row:${index}`;
    if (!stepGroups.has(stepKey)) stepGroups.set(stepKey, []);
    stepGroups.get(stepKey)!.push(score);
  });
  // sortedScoresは時系列順であり、Mapはキーの初出順を保持するため、
  // ここでの反復順がそのままステップの時系列順になる
  const sortedStepKeys = Array.from(stepGroups.keys());

  // 総合BPIは既知の最高値を下回らないようラチェットする（他の総合BPI算出箇所と
  // 同じ理由。src/lib/bpi/index.tsのratchetTotalBpi参照）。この関数はDBの
  // userStatusLogsを経由せず生スコアから再計算するため、ループ内の running max
  // を基準にする
  let bestTotalBpiSoFar: number | null = null;
  const dayTotalBpi = new Map<string, number>();
  const dayScoresMap = new Map<string, ScoreEntry[]>();

  for (const stepKey of sortedStepKeys) {
    const stepScores = stepGroups.get(stepKey)!;
    const dayKey = dayKeyOf(stepScores[0]);

    stepScores.forEach((s) => {
      currentPBs.set(s.songId, {
        bpi: s.bpi ?? -15,
        level: s.difficultyLevel,
        exScore: s.exScore,
        notes: s.notes,
      });
    });

    const observations: IBpiScoreObservation[] = Array.from(
      currentPBs.entries(),
    ).map(([songId, v]) => ({ songId, notes: v.notes, exScore: v.exScore }));

    const freshTotalBpi = BpiCalculator.calculateTotalBPI(
      observations,
      allSongs,
    );
    bestTotalBpiSoFar = BpiCalculator.ratchetTotalBpi(
      bestTotalBpiSoFar,
      freshTotalBpi,
    );
    dayTotalBpi.set(dayKey, bestTotalBpiSoFar);

    if (!dayScoresMap.has(dayKey)) dayScoresMap.set(dayKey, []);
    dayScoresMap.get(dayKey)!.push(...stepScores);
  }

  const sortedDayKeys = Array.from(dayScoresMap.keys()).sort();

  for (const dayKey of sortedDayKeys) {
    const dayScores = dayScoresMap.get(dayKey)!;
    timeline.push({
      id: dayKey,
      batchId: dayKey,
      version: version,
      totalBpi: dayTotalBpi.get(dayKey)!,
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
