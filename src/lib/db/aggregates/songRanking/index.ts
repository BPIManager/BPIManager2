import { db } from "@/lib/db";
import { LatestScoreTable } from "@/lib/db/shared/latestScore/types";
import { latestLogIdPerUserSongSubquery } from "@/lib/db/shared/latestScore/perUser";
import { maskPrivateIdentity } from "@/lib/db/shared/privacyMask";

export interface SongRankingEntry {
  rank: number;
  userId: string;
  userName: string;
  profileImage: string | null;
  exScore: number;
  bpi: number | null;
  isSelf: boolean;
}

export interface SongRankingResult {
  rankings: SongRankingEntry[];
  totalCount: number;
  selfRank: number;
}

/**
 * 指定楽曲の全ユーザー最新スコアランキング。scores と allScores で実装がほぼ同一だったため共通化した。
 * 非公開ユーザーは anon-{index} に匿名化してマスクする。
 *
 * @param params.table - 対象テーブル（scores | allScores）
 * @param params.songId - 楽曲 ID
 * @param params.version - バージョン番号
 * @param params.viewerId - 閲覧者のユーザー ID（自分自身の判定に使用）
 */
export async function getSongRankingFromTable(params: {
  table: LatestScoreTable;
  songId: number;
  version: string;
  viewerId: string;
}): Promise<SongRankingResult> {
  const { table, songId, version, viewerId } = params;

  const latest = latestLogIdPerUserSongSubquery({
    table,
    version,
    songIds: [songId],
  });

  const rows = await db
    .selectFrom(`${table} as s` as "scores as s")
    .innerJoin("users as u", "s.userId", "u.userId")
    .innerJoin(latest.as("latest"), (join) =>
      join.onRef("latest.maxLogId", "=", "s.logId"),
    )
    .select([
      "s.userId",
      "u.userName",
      "u.profileImage",
      "u.isPublic",
      "s.exScore",
      "s.bpi",
    ])
    .where("s.songId", "=", songId)
    .orderBy("s.exScore", "desc")
    .execute();

  const rankings: SongRankingEntry[] = rows.map((r, i) => ({
    rank: i + 1,
    ...maskPrivateIdentity({
      isPublic: r.isPublic,
      userId: r.userId,
      userName: r.userName,
      profileImage: r.profileImage,
      anonId: `anon-${i}`,
    }),
    exScore: r.exScore,
    bpi: r.bpi !== null && r.bpi !== undefined ? Number(r.bpi) : null,
    isSelf: r.userId === viewerId,
  }));

  const selfEntry = rankings.find((r) => r.isSelf);

  return {
    rankings,
    totalCount: rankings.length,
    selfRank: selfEntry?.rank ?? 0,
  };
}
