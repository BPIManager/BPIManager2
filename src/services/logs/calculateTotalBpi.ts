import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";

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

interface BatchTotalBpi {
  batchId: string | null;
  totalBpi: number;
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

/**
 * 日別のスコア推移(songCount/topScores)と、その日時点の総合BPIをまとめたタイムラインを作る。
 *
 * 総合BPI自体はここで再計算しない。executeSaveBpiSystemがバッチ単位で既に
 * 計算・ratchet(既知の最高値を下回らない補正)した`logs.totalBpi`を、
 * `batchTotalBpis`(id昇順=処理順)経由でそのまま採用する。生スコアから
 * 独自に再計算すると、判定粒度(日単位/バッチ単位/行単位)をexecuteSaveBpiSystem
 * と完全に一致させない限り値がずれるため、正とする値は常にDB側に一本化する。
 *
 * @param batchTotalBpis - id昇順(=処理順)であること
 */
export const calculateTotalBpi = (
  allScores: ScoreEntry[],
  batchTotalBpis: BatchTotalBpi[],
  version: string,
  topN: number,
): TimelineEntry[] => {
  if (allScores.length === 0) return [];

  const batchOrder = new Map<string, number>();
  const batchTotalBpiByBatchId = new Map<string, number>();
  batchTotalBpis.forEach((b, index) => {
    if (!b.batchId) return;
    batchOrder.set(b.batchId, index);
    batchTotalBpiByBatchId.set(b.batchId, b.totalBpi);
  });

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

  const dayScoresMap = new Map<string, ScoreEntry[]>();
  allScores.forEach((score) => {
    const dayKey = dayKeyOf(score);
    if (!dayScoresMap.has(dayKey)) dayScoresMap.set(dayKey, []);
    dayScoresMap.get(dayKey)!.push(score);
  });

  const sortedDayKeys = Array.from(dayScoresMap.keys()).sort();

  // 総合BPIは既知の最高値を下回らないようラチェットする（他の総合BPI算出箇所と
  // 同じ理由。src/lib/bpi/index.tsのratchetTotalBpi参照）。DBの値自体が既に
  // ratchet済みだが、lastPlayedベースの日単位表示に並べ替える都合上(バック
  // フィル等でバッチの処理順と日付の前後関係が一致しない場合がある)、表示上の
  // 連続性のためにもう一段ratchetする
  const timeline: TimelineEntry[] = [];
  let bestTotalBpiSoFar: number | null = null;

  for (const dayKey of sortedDayKeys) {
    const dayScores = dayScoresMap.get(dayKey)!;

    let bestBatchId: string | null = null;
    let bestOrder = -1;
    dayScores.forEach((s) => {
      if (!s.batchId) return;
      const order = batchOrder.get(s.batchId);
      if (order != null && order > bestOrder) {
        bestOrder = order;
        bestBatchId = s.batchId;
      }
    });

    const dayTotalBpi =
      bestBatchId != null ? (batchTotalBpiByBatchId.get(bestBatchId) ?? -15) : -15;
    bestTotalBpiSoFar = BpiCalculator.ratchetTotalBpi(
      bestTotalBpiSoFar,
      dayTotalBpi,
    );

    timeline.push({
      id: dayKey,
      batchId: dayKey,
      version: version,
      totalBpi: bestTotalBpiSoFar,
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
