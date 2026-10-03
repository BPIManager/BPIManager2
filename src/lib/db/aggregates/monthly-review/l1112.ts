import { db } from "@/lib/db";
import { jstDayStart } from "./dates";

import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore/perSong";
import { latestLogIdPerUserSongSubquery } from "@/lib/db/shared/latestScore/perUser";
import { wherePublicOnly } from "@/lib/db/shared/visibility";

/**
 * 月次まとめのL11/L12譜面スコアとライバルの現在スコアを担当するリポジトリクラス。
 */
class MonthlyL1112Repository {
  async getUserCurrentL1112Scores(userId: string, version: string) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "s.songId",
        "s.exScore",
        "m.title",
        "m.difficulty",
        "m.difficultyLevel",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("m.difficultyLevel", "in", [11, 12])
      .execute();
  }

  // scores・songsを横断JOINしたレベル11/12月初時点スコア取得のため、直接参照を維持する。

  async getUserPreMonthL1112Scores(
    userId: string,
    version: string,
    monthStart: string,
  ) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
          extra: (qb) =>
            qb.where("lastPlayed", "<", jstDayStart(monthStart)),
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.exScore"])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("m.difficultyLevel", "in", [11, 12])
      .execute();
  }

  // follows・users・scores を横断するフォロー中ライバルの現在スコア取得のため直接参照を維持する。可視範囲は閲覧者で変わる:
   // 本人閲覧は公開+承認済み非公開、第三者閲覧は公開フォローのみ（承認しただけの非公開ライバルを第三者に晒さない）。

  async getRivalsCurrentScoresForSongs(params: {
    ownerId: string;
    viewerId: string | undefined;
    version: string;
    songIds: number[];
  }) {
    const { ownerId, viewerId, version, songIds } = params;
    if (songIds.length === 0) return [];

    const includeApproved = !!viewerId && viewerId === ownerId;

    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .innerJoin("scores as s", "u.userId", "s.userId")
      .innerJoin(
        latestLogIdPerUserSongSubquery({
          table: "scores",
          version,
          followersOf: ownerId,
          songIds,
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "s.songId",
        "s.exScore",
      ])
      .where("f.followerId", "=", ownerId)
      .where("s.version", "=", version)
      .$call((qb) =>
        includeApproved
          ? qb.where((eb) =>
              eb.or([
                eb("u.isPublic", "=", 1),
                eb.exists(
                  eb
                    .selectFrom("followApprovalNotifications as fan")
                    .select("fan.id")
                    .where("fan.recipientId", "=", ownerId)
                    .whereRef("fan.actorId", "=", "u.userId"),
                ),
              ]),
            )
          : wherePublicOnly(qb, "u.isPublic"),
      )
      .execute();
  }
}

export const monthlyL1112Repo = new MonthlyL1112Repository();
