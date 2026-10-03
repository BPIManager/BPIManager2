import { monthlyBpiStateRepo } from "@/lib/db/aggregates/monthly-review/bpiState";
import { monthlyActivityRepo } from "@/lib/db/aggregates/monthly-review/activity";

import { buildTopSongs } from "@/lib/monthly-review/topSongs";
import { toPlayDateStr } from "@/lib/monthly-review/activity";

/** 月内に更新されたスコア一覧（曲ごとの最新ログ）。top-songs/radar-growth/activityで使う */
export async function computeOwnerMonthlyScores(
  owner: string,
  version: string,
  monthStart: string,
  monthEnd: string,
) {
  const scoreBatches = await monthlyActivityRepo.getMonthlyScoreBatches(
    owner,
    version,
    monthStart,
    monthEnd,
  );
  const monthlyBatchIds = scoreBatches.map((b) => b.batchId);
  const batchPlayDateMap = new Map(
    scoreBatches.map((b) => [b.batchId, b.playDate]),
  );

  const monthlyScores = await monthlyBpiStateRepo.getScoresForBatches(
    owner,
    version,
    monthlyBatchIds,
  );
  const latestInMonthMap = new Map<number, (typeof monthlyScores)[0]>();
  for (const s of monthlyScores) {
    const existing = latestInMonthMap.get(s.songId);
    if (!existing || s.logId > existing.logId)
      latestInMonthMap.set(s.songId, s);
  }
  const latestInMonth = Array.from(latestInMonthMap.values());

  const songUpdateDateMap = new Map<number, string>();
  for (const s of latestInMonth) {
    const playDate = s.batchId
      ? (batchPlayDateMap.get(s.batchId as string) ?? null)
      : null;
    if (playDate) songUpdateDateMap.set(s.songId, toPlayDateStr(playDate));
  }

  return { latestInMonth, songUpdateDateMap };
}

/**
 * BPIトップ3・改善曲（`rank`はbuildTopSongs内でbpicalcの推定順位関数から算出済み）。
 * radar-growthセクションからも呼ばれる。
 *
 * `compareVersion`省略時は月内比較（`monthStart`より前の直近スコア）を使う。
 * 「全期間（月=all）」モードは元々の期間開始が2000年固定の便宜上の値で
 * 「期間開始前のスコア」という比較が意味を持たないため、`compareVersion`に
 * 比較対象バージョン（既定は前バージョン）を渡し、そのバージョン内での
 * 最新スコアを比較元として使う。
 */
export async function computeOwnerTopSongs(
  owner: string,
  version: string,
  monthStart: string,
  latestInMonth: Awaited<
    ReturnType<typeof computeOwnerMonthlyScores>
  >["latestInMonth"],
  compareVersion?: string,
  excludeNewPlays = false,
) {
  const songIdsUpdated = latestInMonth.map((s) => s.songId);

  const preScores = compareVersion
    ? await monthlyBpiStateRepo.getComparisonVersionScores(
        owner,
        compareVersion,
        songIdsUpdated,
      )
    : await monthlyBpiStateRepo.getPreMonthScoresByLastPlayed(
        owner,
        version,
        songIdsUpdated,
        monthStart,
      );

  const preScoreMap = new Map<
    number,
    { exScore: number; bpi: number | null }
  >();
  for (const s of preScores) {
    preScoreMap.set(s.songId, {
      exScore: s.exScore,
      bpi: s.bpi != null ? Number(s.bpi) : null,
    });
  }

  return buildTopSongs(latestInMonth, preScoreMap, excludeNewPlays);
}
