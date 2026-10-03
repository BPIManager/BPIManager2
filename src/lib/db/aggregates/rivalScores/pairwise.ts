import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { sql } from "kysely";
import { correlatedLatestLogId } from "@/lib/db/shared/latestScore/correlated";


/**
 * 自分とライバルの同一曲スコア比較・比較一覧を担当するリポジトリクラス。
 */
class RivalPairwiseRepository {
  async getRivalComparisonScores(params: {
    viewerId: string;
    rivalId?: string | null;
    version: IIDXVersion;
    limit?: number;
    offset?: number;
  }) {
    const { viewerId, rivalId, version, limit, offset } = params;
    const isInf = version === "INF";

    let query = db
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
      )
      .leftJoin("scores as v", (join) =>
        join
          .onRef("v.songId", "=", "s.songId")
          .on("v.userId", "=", viewerId)
          .on("v.version", "=", version)
          .on("v.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "v2",
              songIdRef: "s.songId",
              version,
              userId: viewerId,
            }),
          ),
      )
      .leftJoin("scores as r", (join) => {
        const base = join
          .onRef("r.songId", "=", "s.songId")
          .on("r.version", "=", version)
          .on("r.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "r2",
              songIdRef: "s.songId",
              version,
              ...(rivalId ? { userId: rivalId } : { followersOf: viewerId }),
            }),
          );

        if (rivalId) {
          return base.on("r.userId", "=", rivalId);
        } else {
          return base.on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows as f")
              .innerJoin("users as fu", "fu.userId", "f.followingId")
              .select("f.followingId")
              .where("f.followerId", "=", viewerId)
              // follows行の存在だけでは判定できない(公開時代に成立した
              // followsには承認記録がないため、対象が非公開の場合は
              // 承認記録の有無も要求する)
              .where((eb) =>
                eb.or([
                  eb("fu.isPublic", "=", 1),
                  eb.exists(
                    eb
                      .selectFrom("followApprovalNotifications as fan")
                      .select("fan.id")
                      .where("fan.recipientId", "=", viewerId)
                      .whereRef("fan.actorId", "=", "f.followingId"),
                  ),
                ]),
              ),
          );
        }
      })
      .leftJoin("users as ru", "ru.userId", "r.userId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficultyLevel",
        "s.difficulty",
        "s.releasedVersion",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
        "v.logId as myLogId",
        "v.exScore as myExScore",
        "v.bpi as myBpi",
        "v.clearState as myClearState",
        "v.missCount as myMissCount",
        "v.lastPlayed as myLastPlayed",
        "r.userId as rivalUserId",
        "ru.userName as rivalUserName",
        "r.exScore as rivalExScore",
        "r.bpi as rivalBpi",
        "r.clearState as rivalClearState",
        "r.missCount as rivalMissCount",
        "r.lastPlayed as rivalLastPlayed",
      ])
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("s.deletedAt", "is", null),
            eb("s.deletedAt", ">", version),
          ]),
        ),
      )
      .where((eb) =>
        eb.or([
          eb("v.exScore", "is not", null),
          eb("r.exScore", "is not", null),
        ]),
      );

    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.offset(offset);

    return await query.execute();
  }

  /**
   * スコア差分（ライバル - 自分）を指定した範囲で抽出
   */
  async getScoreComparisonList(params: {
    userId: string;
    version: IIDXVersion;
    limit: number;
    minDiff: number;
    maxDiff: number;
    levelArray: number[];
    diffArray: string[];
    cursor?: { lastDiff: number; lastSongId: string; lastRivalId: string };
  }) {
    const {
      userId,
      version,
      limit,
      cursor,
      levelArray,
      diffArray,
      minDiff,
      maxDiff,
    } = params;
    const diffExpr = sql<number>`r.exScore - v.exScore`;

    let query = db
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
      )
      .innerJoin("scores as v", (join) =>
        join
          .onRef("v.songId", "=", "s.songId")
          .on("v.userId", "=", userId)
          .on("v.version", "=", version)
          .on("v.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "v2",
              songIdRef: "s.songId",
              version,
              userId,
            }),
          ),
      )
      .innerJoin("scores as r", (join) =>
        join
          .onRef("r.songId", "=", "s.songId")
          .on("r.version", "=", version)
          .on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows as f")
              .innerJoin("users as fu", "fu.userId", "f.followingId")
              .select("f.followingId")
              .where("f.followerId", "=", userId)
              // follows行の存在だけでは判定できない(公開時代に成立した
              // followsには承認記録がないため、対象が非公開の場合は
              // 承認記録の有無も要求する)
              .where((eb) =>
                eb.or([
                  eb("fu.isPublic", "=", 1),
                  eb.exists(
                    eb
                      .selectFrom("followApprovalNotifications as fan")
                      .select("fan.id")
                      .where("fan.recipientId", "=", userId)
                      .whereRef("fan.actorId", "=", "f.followingId"),
                  ),
                ]),
              ),
          )
          .on("r.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "r2",
              songIdRef: "s.songId",
              version,
              userIdRef: "r.userId",
            }),
          ),
      )
      .innerJoin("users as ru", "ru.userId", "r.userId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "v.logId",
        "v.exScore",
        "v.bpi",
        "v.clearState",
        "v.missCount",
        "v.lastPlayed as scoreAt",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
        "r.exScore as rivalEx",
        "ru.userName as rivalName",
        "ru.profileImage as rivalImage",
        "r.userId as rivalId",
        sql<number>`r.exScore - v.exScore`.as("exDiff"),
      ])
      .where(diffExpr, ">=", minDiff)
      .where(diffExpr, "<=", maxDiff);

    if (levelArray && levelArray.length > 0) {
      query = query.where("s.difficultyLevel", "in", levelArray);
    }
    if (diffArray && diffArray.length > 0) {
      query = query.where("s.difficulty", "in", diffArray);
    }

    if (cursor) {
      query = query.where((eb) =>
        eb.or([
          eb(sql`r.exScore - v.exScore`, ">", cursor.lastDiff),
          eb.and([
            eb(sql`r.exScore - v.exScore`, "=", cursor.lastDiff),
            eb.or([
              eb("s.songId", ">", Number(cursor.lastSongId)),
              eb.and([
                eb("s.songId", ">=", Number(cursor.lastSongId)),
                eb("r.userId", ">", cursor.lastRivalId),
              ]),
            ]),
          ]),
        ]),
      );
    }

    return await query
      .orderBy("exDiff", "asc")
      .orderBy("s.songId", "asc")
      .orderBy("r.userId", "asc")
      .limit(limit)
      .execute();
  }
}

export const rivalPairwiseRepo = new RivalPairwiseRepository();
