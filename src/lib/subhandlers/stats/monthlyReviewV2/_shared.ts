import dayjs from "@/lib/dayjs";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import {
  buildBpiTimeline,
  calculateTotalBpiForScores,
} from "@/lib/monthly-review/bpi";
import { buildTopSongs } from "@/lib/monthly-review/topSongs";
import { toPlayDateStr } from "@/lib/monthly-review/activity";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

/** `bpiStart`が`null`＝`compareVersion`側にスコアが無く比較不能。それ以外は必ず数値。 */
type RecomputedBpiTimeline = {
  bpiStart: number | null;
  bpiEnd: number;
  history: { date: string; value: number }[];
};

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
  return {
    granularity,
    monthStart,
    monthEnd,
    useMonthBuckets: isYearMode || isAllMode,
  };
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
 * `scores.lastPlayed`基準のシフト法で算出する（`userStatusLogs.createdAt`は
 * インポート時刻であり実プレイ日と一致しないため使わない）。
 *
 * `compareVersion`指定時は、前バージョンのbaselineをシフト法のseedに混ぜると
 * ratchetで現バージョンの下降が消えるため、`bpiStart`と`bpiEnd`/`history`を
 * 独立して計算する。
 */
export async function computeOwnerBpiTimeline(
  owner: string,
  version: string,
  monthStart: string,
  monthEnd: string,
  useMonthBuckets: boolean,
  compareVersion?: string,
) {
  const [
    ownerPreMonthState,
    ownerInMonthHistory,
    allL12SongMeta,
    compareVersionState,
  ] = await Promise.all([
    monthlyReviewRepo.getPreMonthBpiStateForUsers([owner], version, monthStart),
    monthlyReviewRepo.getInMonthScoreHistoryForUsers(
      [owner],
      version,
      monthStart,
      monthEnd,
    ),
    monthlyReviewRepo.getAllL12SongMeta(),
    compareVersion
      ? monthlyReviewRepo.getVersionBpiStateForUsers([owner], compareVersion)
      : Promise.resolve(null),
  ]);

  const ownerPreMonthExScoreMap = new Map<number, number>();
  for (const s of ownerPreMonthState) {
    if (s.exScore != null)
      ownerPreMonthExScoreMap.set(s.songId, Number(s.exScore));
  }
  let compareVersionExScoreMap: Map<number, number> | null = null;
  if (compareVersion && compareVersionState) {
    compareVersionExScoreMap = new Map();
    for (const s of compareVersionState) {
      if (s.exScore != null)
        compareVersionExScoreMap.set(s.songId, Number(s.exScore));
    }
  }
  const seedExScoreMap = compareVersionExScoreMap ?? ownerPreMonthExScoreMap;

  // finalExScoreMapはbaseline混在の問題が起きないため、このseedでまとめて計算する
  const seeded = buildBpiTimeline(
    seedExScoreMap,
    ownerInMonthHistory,
    allL12SongMeta,
    useMonthBuckets,
  );

  let bpiStart: number;
  let bpiEnd: number;
  let history: { date: string; value: number }[];

  if (compareVersion) {
    bpiStart = calculateTotalBpiForScores(
      compareVersionExScoreMap ?? new Map(),
      allL12SongMeta,
    );
    const pure = buildBpiTimeline(
      new Map(),
      ownerInMonthHistory,
      allL12SongMeta,
      useMonthBuckets,
    );
    bpiEnd = pure.bpiEnd;
    history = pure.history;
  } else {
    bpiStart = seeded.bpiStart;
    bpiEnd = seeded.bpiEnd;
    history = seeded.history;
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
    finalExScoreMap: seeded.finalExScoreMap,
    allL12SongMeta,
    // compareVersion指定時、そのバージョンにユーザーのスコアが1件も無いと
    // bpiStartは「全曲未プレイ」扱いの見かけ上のBPI（floor値、大きくマイナスになりうる）
    // になり、bpiDiffが実態とかけ離れた値になる。呼び出し側で「比較不能」を
    // 判定できるようフラグを返す
    hasCompareData: !compareVersion || (compareVersionExScoreMap?.size ?? 0) > 0,
  };
}

/**
 * 複数ユーザー分の総合BPI推移をscores.lastPlayed基準のシフト法でまとめて再計算する。
 * ライバル戦線等、複数ユーザーを一括で扱う箇所から使う。
 *
 * `compareVersion`指定時、対象バージョンのスコアが無いユーザーは`bpiStart: null`
 * （比較不能。`bpiEnd`/`history`はそのバージョン内の推移として引き続き返す）。
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
        : monthlyReviewRepo.getPreMonthBpiStateForUsers(
            userIds,
            version,
            monthStart,
          ),
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
    const history = historyByUser.get(userId) ?? [];
    if (compareVersion) {
      // baseline（前バージョン最終値）とhistory/bpiEnd（現バージョンの純粋な推移）を
      // 独立して計算する（computeOwnerBpiTimelineと同じ理由）
      const compareMap = compareByUser.get(userId);
      const pure = buildBpiTimeline(
        new Map(),
        history,
        allL12SongMeta,
        useMonthBuckets,
      );
      const bpiStart =
        compareMap && compareMap.size > 0
          ? calculateTotalBpiForScores(compareMap, allL12SongMeta)
          : null;
      result.set(userId, {
        bpiStart,
        bpiEnd: pure.bpiEnd,
        history: pure.history,
      });
    } else {
      const preMap = preByUser.get(userId) ?? new Map<number, number>();
      const {
        bpiStart,
        bpiEnd,
        history: hist,
      } = buildBpiTimeline(preMap, history, allL12SongMeta, useMonthBuckets);
      result.set(userId, { bpiStart, bpiEnd, history: hist });
    }
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
