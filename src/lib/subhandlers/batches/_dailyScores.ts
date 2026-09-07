import dayjs from "@/lib/dayjs";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { createOvertakenMap, computeRivalRankMap } from "./_shared";
import type { IIDXVersion } from "@/types/iidx/version";

/**
 * 追い抜きライバル取得の完了を待ってから、その楽曲群のライバル最新スコアを取得する。
 * overtakenPromise 自体は他のクエリと独立なため、呼び出し元で Promise.all に含めることで
 * history/totalSongs/scores 取得と並行させ、直列 await を避ける。
 */
async function fetchRivalScoresForOvertaken(
  overtakenPromise: Promise<
    Awaited<ReturnType<typeof rivalRepo.getOvertakenRivals>>
  >,
  uid: string,
  ver: IIDXVersion,
  isOwnLog: boolean,
) {
  const overtaken = await overtakenPromise;
  const overtakenSongIds = Object.keys(createOvertakenMap(overtaken))
    .map(Number)
    .filter(Boolean);

  return isOwnLog && overtakenSongIds.length > 0
    ? rivalRepo.getRivalLatestScoresBySong({
        userId: uid,
        version: ver,
        songIds: overtakenSongIds,
      })
    : [];
}

/** プレイ日時ベースの詳細取得 */
export async function handleLastPlayedBase(
  uid: string,
  ver: IIDXVersion,
  range: ReturnType<typeof navigationRepo.getJstRange>,
  nav: Awaited<ReturnType<typeof navigationRepo.getRangeNavigation>>,
  isOwnLog: boolean,
  type: string = "day",
) {
  const overtakenPromise = isOwnLog
    ? rivalRepo.getOvertakenRivals(uid, ver, {
        range: { ...range, basis: "lastPlayed" },
      })
    : Promise.resolve([]);
  const rivalScoresPromise = fetchRivalScoresForOvertaken(
    overtakenPromise,
    uid,
    ver,
    isOwnLog,
  );

  const [history, totalSongs, dailyScores, overtaken, rivalScores] =
    await Promise.all([
      statsTablesRepo.getScoreHistory(uid, ver, [], []),
      statsTablesRepo.getTotalSongCount([12], []),
      type === "day"
        ? scoreDetailRepo.getScoresByLastPlayedRange(uid, ver, range)
        : scoreDetailRepo.getScoresWithDetails(uid, ver, {
            onlyLastPlayedInRange: range,
          }),
      overtakenPromise,
      rivalScoresPromise,
    ]);

  if (dailyScores.length === 0) {
    throw new Error("No activity found for this period.");
  }

  const overtakenMap = createOvertakenMap(overtaken);
  const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

  const timeline = calculateTotalBpi(history, totalSongs, ver, 0);
  const currentSnapshot = timeline.find((t) => t.id === range.label);
  const currentIndex = timeline.findIndex((t) => t.id === range.label);
  const nextSnapshot = timeline[currentIndex - 1];
  // For week/month: find the last snapshot before the period start, not just the adjacent day
  const prevSnapshot =
    type === "day"
      ? timeline[currentIndex + 1]
      : timeline.find(
          (t) => t.id < dayjs(range.start).tz().format("YYYY-MM-DD"),
        );

  // 週・月単位のナビゲーション用に nav の実際の日付を優先して使用する
  const prevNavDate =
    (nav.prevDate as { lastPlayed?: Date } | null)?.lastPlayed ?? null;
  const nextNavDate =
    (nav.nextDate as { lastPlayed?: Date } | null)?.lastPlayed ?? null;

  return {
    songs: dailyScores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: overtakenMap[s.songId] || [],
        rivalRankInfo: rivalRankMap[s.songId] ?? null,
      };
    }),
    pagination: {
      prev: {
        batchId: prevNavDate
          ? dayjs(prevNavDate).format("YYYY-MM-DD")
          : "previous",
        createdAt: prevNavDate ?? prevSnapshot?.createdAt ?? null,
        totalBpi: prevSnapshot?.totalBpi ?? -15,
      },
      current: {
        batchId: range.label,
        createdAt: range.end,
        totalBpi: currentSnapshot?.totalBpi ?? -15,
        label: `${range.label} のプレイ履歴`,
      },
      next: {
        batchId: nextNavDate ? dayjs(nextNavDate).format("YYYY-MM-DD") : "next",
        createdAt: nextNavDate ?? nextSnapshot?.createdAt ?? null,
        totalBpi: nextSnapshot?.totalBpi ?? -15,
      },
      groupedBy: "lastPlayed",
    },
  };
}

/** インポート日時(バッチ)ベースの詳細取得 */
export async function handleCreatedAtBase(
  uid: string,
  ver: IIDXVersion,
  range: ReturnType<typeof navigationRepo.getJstRange>,
  nav: Awaited<ReturnType<typeof navigationRepo.getRangeNavigation>>,
  isOwnLog: boolean,
  type: string = "day",
) {
  const batches = await navigationRepo.findBatchesInRange(
    uid,
    ver,
    range.start,
    range.end,
  );
  if (batches.length === 0) throw new Error("No logs found.");

  const overtakenPromise = isOwnLog
    ? rivalRepo.getOvertakenRivals(uid, ver, {
        range: { ...range, basis: "createdAt" },
      })
    : Promise.resolve([]);
  const rivalScoresPromise = fetchRivalScoresForOvertaken(
    overtakenPromise,
    uid,
    ver,
    isOwnLog,
  );

  const [scores, overtaken, rivalScores] = await Promise.all([
    type === "day"
      ? scoreDetailRepo.getScoresWithDetails(uid, ver, {
          batchIds: batches.map((b) => b.batchId),
          comparisonTime: batches[0].createdAt,
        })
      : scoreDetailRepo.getScoresWithDetails(uid, ver, {
          batchIds: batches.map((b) => b.batchId),
        }),
    overtakenPromise,
    rivalScoresPromise,
  ]);
  const overtakenMap = createOvertakenMap(overtaken);
  const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

  return {
    songs: scores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: s.songId ? overtakenMap[s.songId] || [] : [],
        rivalRankInfo: s.songId ? (rivalRankMap[s.songId] ?? null) : null,
      };
    }),
    pagination: {
      prev: nav.prevDate,
      current: {
        ...batches[batches.length - 1],
        count: batches.length,
      },
      next: nav.nextDate,
      groupedBy: "createdAt",
    },
  };
}

