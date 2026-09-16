import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import type { HandlerResult } from "@/types/api";
import type { OvertakenMap, VersionOvertakenMap } from "@/types/logs/overtaken";

/**
 * batches ドメインの subhandler 共通型・ヘルパー。
 * 追い抜きライバル関連ヘルパーは旧 batches/[batchId]/scores.ts から移設。
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
  overtakenList: Awaited<ReturnType<typeof rivalRepo.getOvertakenRivals>>,
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
 * バッチ（または期間）内で更新したスコアと、他バージョンでの自分のスコアとの
 * 比較情報一覧を取得する。勝敗・新規追い抜きかどうかに関わらず全件返す
 * （`isNewOvertake`で判定できる）。自分以外のログ閲覧時は空マップを返す
 * （ライバル追い抜きと同様、他人のログでは非公開の比較情報を出さない）。
 */
export async function fetchVersionOvertakenMap(params: {
  userId: string;
  currentVersion: string;
  isOwnLog: boolean;
  batchId?: string;
  range?: { start: Date; end: Date; basis: "lastPlayed" | "createdAt" };
}): Promise<VersionOvertakenMap> {
  const { userId, currentVersion, isOwnLog, batchId, range } = params;
  if (!isOwnLog) return {};

  const rows = await timelineRepo.getVersionComparisons({
    userId,
    currentVersion,
    batchId,
    range,
  });
  return createVersionOvertakenMap(rows);
}
