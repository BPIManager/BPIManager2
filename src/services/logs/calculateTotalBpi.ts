import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

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
  logId?: number | string;
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

  // ステップは（日付, batchId）の組で区切る。executeSaveBpiSystem はバッチ単位で ratchet するため、
   // 同一バッチ×同一日をまとめて1ステップにし、バッチ完了前の中間状態を偽のピークにしない。
  const stepGroups = new Map<string, ScoreEntry[]>();
  allScores.forEach((score, index) => {
    const dayKey = dayKeyOf(score);
    const batchKey = score.batchId ?? `row:${index}`;
    const stepKey = `${dayKey}::${batchKey}`;
    if (!stepGroups.has(stepKey)) stepGroups.set(stepKey, []);
    stepGroups.get(stepKey)!.push(score);
  });

  // ステップは日付（昇順）を主キー、同日内はバッチの書き込み順（logId 最小値昇順）を副キーにする。実プレイ日付ベースの推移表示のため。
  const stepEntries = Array.from(stepGroups.values()).map((scores) => ({
    dayKey: dayKeyOf(scores[0]),
    minLogId: Math.min(
      ...scores.map((s) => (s.logId != null ? Number(s.logId) : Infinity)),
    ),
    scores,
  }));
  stepEntries.sort(
    (a, b) => a.dayKey.localeCompare(b.dayKey) || a.minLogId - b.minLogId,
  );

  // 総合BPIは既知の最高値を下回らないようラチェットする（running max を基準にする）。
   // DBの userStatusLogs を経由せず生スコアから再計算するため。src/lib/bpi/index.ts の ratchetTotalBpi 参照。
  let bestTotalBpiSoFar: number | null = null;
  const dayTotalBpi = new Map<string, number>();
  const dayScoresMap = new Map<string, ScoreEntry[]>();

  for (const { dayKey, scores: stepScores } of stepEntries) {
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
