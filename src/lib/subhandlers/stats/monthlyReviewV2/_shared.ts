import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
import { buildTopSongs } from "@/lib/monthly-review/topSongs";
import { toPlayDateStr } from "@/lib/monthly-review/activity";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

type RecomputedBpiTimeline = {
  bpiStart: number;
  bpiEnd: number;
  history: { date: string; value: number }[];
};

export const jstDayStart = (jstDate: string): Date =>
  new Date(`${jstDate}T00:00:00+09:00`);
export const jstDayEnd = (jstDate: string): Date =>
  new Date(`${jstDate}T23:59:59.999+09:00`);

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

/**
 * 本人分のBPI推移。radar-growth/activity/rivalsセクションでも使う値のため独立関数にする。
 *
 * `bpiStart`/`bpiEnd`/`history`（総合BPIの数値・推移）は、シフト法で毎回
 * 再計算するのではなく、スコア取り込み時に{@link BpiCalculator.ratchetTotalBpi}
 * 適用済みで書き込まれる`userStatusLogs.totalBpi`ログをそのまま使うのが基本。
 * 独自に再計算すると、シフト法の未プレイ曲予測が新しい観測で下振れした際に
 * 総合BPIが実際には下がっていないのに下がって見える問題が起きるため
 * （{@link BpiCalculator.ratchetTotalBpi}のコメント参照）、既に正しく
 * ratchet済みの記録値をそのまま信頼するほうが安全かつシンプル。
 *
 * ただし`userStatusLogs.createdAt`は「スコアがBPIMに取り込まれた時刻」であり、
 * 実際のプレイ日（`scores.lastPlayed`）とは限らない（バックフィル・遅延同期の
 * ユーザーは、過去分のスコアをまとめて後日インポートするため、その期間には
 * `createdAt`ベースのログが1件も存在しないことがある）。対象期間にログが
 * 1件も無い（baseline・期間内更新のどちらも無い）場合に限り、
 * `scores.lastPlayed`基準（インポート時刻に左右されない）でシフト法により
 * フォールバック再計算する。
 *
 * なお、レーダー別成長（要素ごとのBPI内訳）は`userStatusLogs`に存在しない
 * （曲群を限定した集計はログとして保存されていない）ため、そちらは従来通り
 * `ownerPreMonthExScoreMap`/`finalExScoreMap`（exScoreの実測値）を使った
 * シフト法の再計算が必要。この関数はその2つのMapも引き続き返す。
 */
export async function computeOwnerBpiTimeline(
  owner: string,
  version: string,
  monthStart: string,
  monthEnd: string,
  useMonthBuckets: boolean,
  compareVersion?: string,
) {
  const startDate = jstDayStart(monthStart);
  const endDate = jstDayEnd(monthEnd);

  const [
    logsInRange,
    latestLogBeforeStart,
    compareVersionLatestLog,
    ownerPreMonthState,
    ownerInMonthHistory,
    allL12SongMeta,
    compareVersionState,
  ] = await Promise.all([
    userStatusLogsRepo.getLogsInRange(db, owner, version, startDate, endDate),
    compareVersion
      ? Promise.resolve(undefined)
      : userStatusLogsRepo.getLatestBefore(db, owner, version, startDate),
    compareVersion
      ? userStatusLogsRepo.getLatestTotalBpi(db, owner, compareVersion)
      : Promise.resolve(undefined),
    monthlyReviewRepo.getPreMonthBpiStateForUsers([owner], version, monthStart),
    monthlyReviewRepo.getInMonthScoreHistoryForUsers([owner], version, monthStart, monthEnd),
    monthlyReviewRepo.getAllL12SongMeta(),
    compareVersion
      ? monthlyReviewRepo.getVersionBpiStateForUsers([owner], compareVersion)
      : Promise.resolve(null),
  ]);

  // レーダー別成長（要素ごとのBPI）はuserStatusLogsに存在しないため、
  // 従来通りexScoreの実測値から独立して再計算する（ログカバレッジの有無に関わらず必要）
  const ownerPreMonthExScoreMap = new Map<number, number>();
  for (const s of ownerPreMonthState) {
    if (s.exScore != null) ownerPreMonthExScoreMap.set(s.songId, Number(s.exScore));
  }
  let compareVersionExScoreMap: Map<number, number> | null = null;
  if (compareVersion && compareVersionState) {
    compareVersionExScoreMap = new Map();
    for (const s of compareVersionState) {
      if (s.exScore != null) compareVersionExScoreMap.set(s.songId, Number(s.exScore));
    }
  }
  const seedExScoreMap = compareVersionExScoreMap ?? ownerPreMonthExScoreMap;
  const recomputed = buildBpiTimeline(
    seedExScoreMap,
    ownerInMonthHistory,
    allL12SongMeta,
    useMonthBuckets,
  );

  const hasLogCoverage = compareVersion
    ? compareVersionLatestLog?.totalBpi != null || logsInRange.length > 0
    : latestLogBeforeStart?.totalBpi != null || logsInRange.length > 0;

  let bpiStart: number;
  let bpiEnd: number;
  let history: { date: string; value: number }[];

  if (hasLogCoverage) {
    bpiStart = compareVersion
      ? (compareVersionLatestLog?.totalBpi != null ? Number(compareVersionLatestLog.totalBpi) : -15)
      : (latestLogBeforeStart?.totalBpi != null ? Number(latestLogBeforeStart.totalBpi) : -15);

    // 期間内にログが1件も無ければ「更新なし」＝前の期間の値（bpiStart）のまま
    bpiEnd =
      logsInRange.length > 0
        ? Number(logsInRange[logsInRange.length - 1].totalBpi)
        : bpiStart;

    const historyRaw = logsInRange.map((row) => ({
      date: dayjs(row.createdAt).tz().format("YYYY-MM-DD"),
      value: Number(row.totalBpi),
    }));
    // 年次/全期間モードは日次だと点が多すぎるため月単位に間引く（同月内は最後の値を採用）
    const historyMap = new Map<string, number>();
    for (const h of historyRaw) {
      const key = useMonthBuckets ? h.date.slice(0, 7) : h.date;
      historyMap.set(key, h.value);
    }
    history = Array.from(historyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ date: useMonthBuckets ? `${key}-01` : key, value }));
  } else {
    // バックフィル等でこの期間に対応するuserStatusLogsが1件も無い場合のみ、
    // scores.lastPlayed基準のシフト法再計算にフォールバックする
    // （既にownerPreMonthExScoreMap/ownerInMonthHistoryで計算済みのため追加クエリ不要）
    bpiStart = recomputed.bpiStart;
    bpiEnd = recomputed.bpiEnd;
    history = recomputed.history;
  }

  const bpiDiff = Math.round((bpiEnd - bpiStart) * 100) / 100;

  return {
    history,
    bpiStart,
    bpiEnd,
    bpiDiff,
    // レーダー別成長（radarGrowth.ts）の「期間前」baselineにもcompareVersionを
    // 反映させるため、指定時はそちらを返す
    ownerPreMonthExScoreMap: seedExScoreMap,
    // レーダー別成長のフォールバック時の「純粋な成長推移」再計算用に生の
    // スコア更新履歴も返す
    ownerInMonthHistory,
    finalExScoreMap: recomputed.finalExScoreMap,
    allL12SongMeta,
  };
}

/**
 * 複数ユーザー分の総合BPI推移をscores.lastPlayed基準のシフト法でまとめて再計算する。
 * `computeOwnerBpiTimeline`のバックフィル・フォールバック経路のバッチ版で、
 * ライバル戦線のうちuserStatusLogsのカバレッジが無いライバルにのみ使う想定
 * （全ライバルではなく該当者だけに絞って呼び出すことで再計算コストを抑える）。
 */
export async function recomputeBpiTimelinesForUsers(
  userIds: string[],
  version: string,
  monthStart: string,
  monthEnd: string,
  useMonthBuckets: boolean,
  compareVersion?: string,
): Promise<Map<string, RecomputedBpiTimeline>> {
  if (userIds.length === 0) return new Map();

  const [preMonthState, inMonthHistory, allL12SongMeta, compareVersionState] =
    await Promise.all([
      compareVersion
        ? Promise.resolve([])
        : monthlyReviewRepo.getPreMonthBpiStateForUsers(userIds, version, monthStart),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        userIds,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getAllL12SongMeta(),
      compareVersion
        ? monthlyReviewRepo.getVersionBpiStateForUsers(userIds, compareVersion)
        : Promise.resolve(undefined),
    ]);

  const preByUser = new Map<string, Map<number, number>>();
  for (const s of preMonthState) {
    if (s.exScore == null) continue;
    if (!preByUser.has(s.userId)) preByUser.set(s.userId, new Map());
    preByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
  }
  const compareByUser = new Map<string, Map<number, number>>();
  for (const s of compareVersionState ?? []) {
    if (s.exScore == null) continue;
    if (!compareByUser.has(s.userId)) compareByUser.set(s.userId, new Map());
    compareByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
  }
  const historyByUser = new Map<string, typeof inMonthHistory>();
  for (const s of inMonthHistory) {
    if (!historyByUser.has(s.userId)) historyByUser.set(s.userId, []);
    historyByUser.get(s.userId)!.push(s);
  }

  const result = new Map<string, RecomputedBpiTimeline>();
  for (const userId of userIds) {
    const seedMap = compareVersion
      ? (compareByUser.get(userId) ?? new Map<number, number>())
      : (preByUser.get(userId) ?? new Map<number, number>());
    const history = historyByUser.get(userId) ?? [];
    const { bpiStart, bpiEnd, history: hist } = buildBpiTimeline(
      seedMap,
      history,
      allL12SongMeta,
      useMonthBuckets,
    );
    result.set(userId, { bpiStart, bpiEnd, history: hist });
  }
  return result;
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
