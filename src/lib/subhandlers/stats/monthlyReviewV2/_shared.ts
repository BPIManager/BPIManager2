import dayjs from "@/lib/dayjs";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
import { buildTopSongs } from "@/lib/monthly-review/topSongs";
import { toPlayDateStr } from "@/lib/monthly-review/activity";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

export type MonthlyReviewGranularity = "month" | "year" | "version";

export interface ResolvedMonthlyReviewPeriod {
  granularity: MonthlyReviewGranularity;
  monthStart: string;
  monthEnd: string;
  useMonthBuckets: boolean;
}

/**
 * "all"（バージョン全体）は、各クエリが既にversion列でも絞り込んでいることを
 * 利用し、バージョン発売より確実に前の固定日付〜当日を期間として渡すことで
 * 実現する。バージョンごとの稼働開始/終了日を新たに管理する仕組みは追加しない。
 */
export function resolveMonthlyReviewPeriod(
  month: string,
): ResolvedMonthlyReviewPeriod {
  const isAllMode = month === "all";
  const isYearMode = !isAllMode && /^\d{4}$/.test(month);
  const granularity: MonthlyReviewGranularity = isAllMode
    ? "version"
    : isYearMode
      ? "year"
      : "month";
  const monthStart = isAllMode
    ? "2000-01-01"
    : isYearMode
      ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
      : dayjs.tz(`${month}-01`).format("YYYY-MM-DD");
  const monthEnd = isAllMode
    ? dayjs.tz().format("YYYY-MM-DD")
    : isYearMode
      ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
      : dayjs.tz(`${month}-01`).endOf("month").format("YYYY-MM-DD");
  return { granularity, monthStart, monthEnd, useMonthBuckets: isYearMode || isAllMode };
}

/**
 * 「全期間（月=all）」モードでの楽曲ハイライト「最も伸びた曲」の既定比較先バージョン
 * （＝1つ前のバージョン）を返す。`IIDX_VERSIONS`の並び順（26〜34, INF）上での
 * 直前の要素とする。先頭バージョン（比較対象が無い）の場合は`null`。
 */
export function previousVersionOf(version: string): string | null {
  const idx = (IIDX_VERSIONS as readonly string[]).indexOf(version);
  if (idx <= 0) return null;
  return IIDX_VERSIONS[idx - 1];
}

/** 本人分のBPI推移。radar-growth/activity/rivalsセクションでも使う値のため独立関数にする */
export async function computeOwnerBpiTimeline(
  owner: string,
  version: string,
  monthStart: string,
  monthEnd: string,
  useMonthBuckets: boolean,
) {
  const [ownerPreMonthState, ownerInMonthHistory, allL12SongMeta] =
    await Promise.all([
      monthlyReviewRepo.getPreMonthBpiStateForUsers([owner], version, monthStart),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        [owner],
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getAllL12SongMeta(),
    ]);

  const ownerPreMonthExScoreMap = new Map<number, number>();
  for (const s of ownerPreMonthState) {
    if (s.exScore != null) ownerPreMonthExScoreMap.set(s.songId, Number(s.exScore));
  }

  const { history, bpiStart, bpiEnd, finalExScoreMap } = buildBpiTimeline(
    ownerPreMonthExScoreMap,
    ownerInMonthHistory,
    allL12SongMeta,
    useMonthBuckets,
  );
  const bpiDiff = Math.round((bpiEnd - bpiStart) * 100) / 100;

  return {
    history,
    bpiStart,
    bpiEnd,
    bpiDiff,
    ownerPreMonthExScoreMap,
    finalExScoreMap,
    allL12SongMeta,
  };
}

/** 月内に更新されたスコア一覧（曲ごとの最新ログ）。top-songs/radar-growth/activityで使う */
export async function computeOwnerMonthlyScores(
  owner: string,
  version: string,
  monthStart: string,
  monthEnd: string,
) {
  const scoreBatches = await monthlyReviewRepo.getMonthlyScoreBatches(
    owner,
    version,
    monthStart,
    monthEnd,
  );
  const monthlyBatchIds = scoreBatches.map((b) => b.batchId);
  const batchPlayDateMap = new Map(
    scoreBatches.map((b) => [b.batchId, b.playDate]),
  );

  const monthlyScores = await monthlyReviewRepo.getScoresForBatches(
    owner,
    version,
    monthlyBatchIds,
  );
  const latestInMonthMap = new Map<number, (typeof monthlyScores)[0]>();
  for (const s of monthlyScores) {
    const existing = latestInMonthMap.get(s.songId);
    if (!existing || s.logId > existing.logId) latestInMonthMap.set(s.songId, s);
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
) {
  const songIdsUpdated = latestInMonth.map((s) => s.songId);

  const preScores = compareVersion
    ? await monthlyReviewRepo.getComparisonVersionScores(
        owner,
        compareVersion,
        songIdsUpdated,
      )
    : await monthlyReviewRepo.getPreMonthScoresByLastPlayed(
        owner,
        version,
        songIdsUpdated,
        monthStart,
      );

  const preScoreMap = new Map<number, { exScore: number; bpi: number | null }>();
  for (const s of preScores) {
    preScoreMap.set(s.songId, {
      exScore: s.exScore,
      bpi: s.bpi != null ? Number(s.bpi) : null,
    });
  }

  return buildTopSongs(latestInMonth, preScoreMap);
}
