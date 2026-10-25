import type { NextApiRequest } from "next";
import { rivalOvertakenRepo } from "@/lib/db/aggregates/rivalScores/overtaken";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import type { HandlerResult } from "@/types/api";
import { previousVersionOf } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import type { BatchRecordCounts } from "@/types/logs/batchDetail";
import type {
  OvertakenMap,
  VersionOvertakenInfo,
  VersionOvertakenMap,
} from "@/types/logs/overtaken";

/**
 * batches ドメインの subhandler 共通型・ヘルパー（追い抜きライバル関連を含む）。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

export function computeRivalRankMap(
  overtakenMap: OvertakenMap,
  rivalScores: { songId: number | null; exScore: number | null }[],
): Record<
  number,
  { myRankBefore: number; myRankAfter: number; totalRivals: number }
> {
  const scoresBySong: Record<number, number[]> = {};
  for (const row of rivalScores) {
    if (row.songId == null || row.exScore == null) continue;
    if (!scoresBySong[row.songId]) scoresBySong[row.songId] = [];
    scoresBySong[row.songId].push(row.exScore);
  }

  const result: Record<
    number,
    { myRankBefore: number; myRankAfter: number; totalRivals: number }
  > = {};
  for (const [songIdStr, rivals] of Object.entries(overtakenMap)) {
    const songId = Number(songIdStr);
    const myOldScore = rivals[0]?.myOldScore ?? null;
    const myNewScore = rivals[0]?.myNewScore ?? 0;
    const allScores = scoresBySong[songId] ?? [];
    const totalRivals = allScores.length;
    result[songId] = {
      myRankBefore:
        myOldScore !== null
          ? allScores.filter((s) => s > myOldScore).length + 1
          : totalRivals + 1,
      myRankAfter: allScores.filter((s) => s > myNewScore).length + 1,
      totalRivals,
    };
  }
  return result;
}

export function createOvertakenMap(
  overtakenList: Awaited<ReturnType<typeof rivalOvertakenRepo.getOvertakenRivals>>,
): OvertakenMap {
  return overtakenList.reduce<OvertakenMap>((acc, curr) => {
    if (!curr.songId) return acc;
    if (!acc[curr.songId]) acc[curr.songId] = [];
    acc[curr.songId].push({
      rivalUserId: curr.rivalUserId,
      rivalName: curr.rivalName,
      rivalProfileImage: curr.rivalProfileImage,
      rivalScore: curr.rivalScore,
      myNewScore: curr.myNewScore,
      myOldScore: curr.myOldScore,
    });
    return acc;
  }, {});
}

function createVersionOvertakenMap(
  rows: Awaited<ReturnType<typeof timelineRepo.getVersionComparisons>>,
): VersionOvertakenMap {
  return rows.reduce<VersionOvertakenMap>((acc, curr) => {
    if (!curr.songId || curr.targetScore === null || !curr.targetVersion)
      return acc;
    if (!acc[curr.songId]) acc[curr.songId] = [];
    const isNewOvertake =
      curr.myNewScore > curr.targetScore &&
      (curr.myOldScore === null || curr.myOldScore <= curr.targetScore);
    acc[curr.songId].push({
      targetVersion: curr.targetVersion,
      targetVersionLabel: getVersionNameFromNumber(curr.targetVersion),
      targetScore: curr.targetScore,
      myNewScore: curr.myNewScore,
      myOldScore: curr.myOldScore,
      diff: curr.myNewScore - curr.targetScore,
      isNewOvertake,
    });
    return acc;
  }, {});
}

/**
 * 更新曲の versionOvertaken / previous から、自己歴代更新数と前作超え曲数(現在のスコアが前作を上回る更新曲数)を集計する。
 * 自己歴代更新は過去のスコアが存在する曲のみ数える（初プレイは含めない）。
 */
export function computeRecordCounts(
  songs: {
    current: { exScore: number };
    previous: { exScore: number } | null;
    versionOvertaken: VersionOvertakenInfo[];
  }[],
  version: string,
): BatchRecordCounts {
  // INFINITASはナンバリングの系列外のため、34を前作として扱わない
  const prevVersion = version === "INF" ? null : previousVersionOf(version);
  let selfBestUpdates = 0;
  let prevVersionOvertakes = 0;
  let hasPrevVersionScore = false;

  for (const s of songs) {
    const pastScores = [
      ...(s.previous ? [s.previous.exScore] : []),
      ...s.versionOvertaken.map((v) => v.targetScore),
    ];
    if (pastScores.length > 0 && s.current.exScore > Math.max(...pastScores)) {
      selfBestUpdates++;
    }

    const prevRow = prevVersion
      ? s.versionOvertaken.find((v) => v.targetVersion === prevVersion)
      : undefined;
    if (prevRow) {
      hasPrevVersionScore = true;
      if (prevRow.diff > 0) prevVersionOvertakes++;
    }
  }

  return {
    selfBestUpdates,
    prevVersionOvertakes: hasPrevVersionScore ? prevVersionOvertakes : null,
  };
}

/**
 * バッチ（または期間）内で更新したスコアと、他バージョンの自分のスコアとの比較情報を全件返す（isNewOvertake で新規追い抜きを判定できる）。
 */
export async function fetchVersionOvertakenMap(params: {
  userId: string;
  currentVersion: string;
  batchId?: string;
  range?: { start: Date; end: Date; basis: "lastPlayed" | "createdAt" };
}): Promise<VersionOvertakenMap> {
  const { userId, currentVersion, batchId, range } = params;

  const rows = await timelineRepo.getVersionComparisons({
    userId,
    currentVersion,
    batchId,
    range,
  });
  return createVersionOvertakenMap(rows);
}
