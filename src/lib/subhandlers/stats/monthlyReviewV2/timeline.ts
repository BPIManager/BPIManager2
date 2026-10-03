import dayjs from "@/lib/dayjs";
import { monthlyBpiStateRepo } from "@/lib/db/aggregates/monthly-review/bpiState";

import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { buildBpiTimeline, calculateTotalBpiForScores } from "@/lib/monthly-review/bpi";

/** `bpiStart`が`null`＝`compareVersion`側にスコアが無く比較不能。それ以外は必ず数値。 */
type RecomputedBpiTimeline = {
  bpiStart: number | null;
  bpiEnd: number;
  history: { date: string; value: number }[];
};

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
  const monthStartDate = dayjs.tz(monthStart).toDate();
  const monthEndDate = dayjs.tz(monthEnd).endOf("day").toDate();

  const [
    ownerPreMonthState,
    ownerInMonthHistory,
    allL12SongMeta,
    compareVersionState,
    priorRecordedMax,
    inRangeRecordedLogs,
  ] = await Promise.all([
    monthlyBpiStateRepo.getPreMonthBpiStateForUsers([owner], version, monthStart),
    monthlyBpiStateRepo.getInMonthScoreHistoryForUsers(
      [owner],
      version,
      monthStart,
      monthEnd,
    ),
    monthlyBpiStateRepo.getAllL12SongMeta(),
    compareVersion
      ? monthlyBpiStateRepo.getVersionBpiStateForUsers([owner], compareVersion)
      : Promise.resolve(null),
    // compareVersionの有無に関わらず、`version`自体の記録済み下限は常に取得する
    // （compareVersionはbaseline取得元を切り替えるだけで、`version`側の
    // ラチェット下限とは無関係）
    userStatusLogsReadRepo.findMaxTotalBpiAsOf(owner, version, monthStartDate),
    userStatusLogsReadRepo.getTotalBpiLogsInRange(
      owner,
      version,
      monthStartDate,
      monthEndDate,
    ),
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
    priorRecordedMax,
    inRangeRecordedLogs,
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
      priorRecordedMax,
      inRangeRecordedLogs,
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

  const monthStartDate = dayjs.tz(monthStart).toDate();
  const monthEndDate = dayjs.tz(monthEnd).endOf("day").toDate();

  const [
    preMonthState,
    inMonthHistory,
    allL12SongMeta,
    compareVersionState,
    priorRecordedMaxByUser,
    inRangeRecordedLogsByUser,
  ] = await Promise.all([
    compareVersion
      ? Promise.resolve([])
      : monthlyBpiStateRepo.getPreMonthBpiStateForUsers(
          userIds,
          version,
          monthStart,
        ),
    monthlyBpiStateRepo.getInMonthScoreHistoryForUsers(
      userIds,
      version,
      monthStart,
      monthEnd,
    ),
    monthlyBpiStateRepo.getAllL12SongMeta(),
    compareVersion
      ? monthlyBpiStateRepo.getVersionBpiStateForUsers(userIds, compareVersion)
      : Promise.resolve(undefined),
    // compareVersionの有無に関わらず、`version`自体の記録済み下限は常に取得する
    // （computeOwnerBpiTimelineと同じ理由）
    userStatusLogsReadRepo.getMaxTotalBpiAsOfForUsers(
      userIds,
      version,
      monthStartDate,
    ),
    userStatusLogsReadRepo.getTotalBpiLogsInRangeForUsers(
      userIds,
      version,
      monthStartDate,
      monthEndDate,
    ),
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
      const priorRecordedMax = priorRecordedMaxByUser.get(userId) ?? null;
      const inRangeRecordedLogs = inRangeRecordedLogsByUser.get(userId) ?? [];
      const pure = buildBpiTimeline(
        new Map(),
        history,
        allL12SongMeta,
        useMonthBuckets,
        priorRecordedMax,
        inRangeRecordedLogs,
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
      const priorRecordedMax = priorRecordedMaxByUser.get(userId) ?? null;
      const inRangeRecordedLogs = inRangeRecordedLogsByUser.get(userId) ?? [];
      const {
        bpiStart,
        bpiEnd,
        history: hist,
      } = buildBpiTimeline(
        preMap,
        history,
        allL12SongMeta,
        useMonthBuckets,
        priorRecordedMax,
        inRangeRecordedLogs,
      );
      result.set(userId, { bpiStart, bpiEnd, history: hist });
    }
  }
  return result;
}
