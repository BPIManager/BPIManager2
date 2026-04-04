import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * ライバル比較・フォロー中ユーザーとのスコア比較を担当するリポジトリクラス。
 */
class RivalRepository {
  /**
   * 楽曲マスタをベースに、自分とライバルのスコアを並列で取得する
   */
  async getRivalComparisonScores(params: {
    viewerId: string;
    rivalId?: string | null;
    version: string;
    limit?: number;
    offset?: number;
  }) {
    const { viewerId, rivalId, version, limit, offset } = params;

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
            eb
              .selectFrom("scores as v2")
              .select((sub) => sub.fn.max("logId").as("maxId"))
              .where("v2.userId", "=", viewerId)
              .where("v2.version", "=", version)
              .whereRef("v2.songId", "=", "s.songId"),
          ),
      )
      .leftJoin("scores as r", (join) => {
        let base = join
          .onRef("r.songId", "=", "s.songId")
          .on("r.version", "=", version)
          .on("r.logId", "=", (eb) => {
            let sub = eb
              .selectFrom("scores as r2")
              .select((s) => s.fn.max("logId").as("m"))
              .where("r2.version", "=", version)
              .whereRef("r2.songId", "=", "s.songId");

            if (rivalId) {
              return sub.where("r2.userId", "=", rivalId);
            } else {
              return sub.where("r2.userId", "in", (qb) =>
                qb
                  .selectFrom("follows")
                  .select("followingId")
                  .where("followerId", "=", viewerId),
              );
            }
          });

        if (rivalId) {
          return base.on("r.userId", "=", rivalId);
        } else {
          return base.on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows")
              .select("followingId")
              .where("followerId", "=", viewerId),
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
      .where((eb) =>
        eb.or([eb("s.deletedAt", "is", null), eb("s.deletedAt", ">", version)]),
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
    version: string;
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
            eb
              .selectFrom("scores as v2")
              .select((s) => s.fn.max("logId").as("m"))
              .where("v2.userId", "=", userId)
              .whereRef("v2.songId", "=", "s.songId"),
          ),
      )
      .innerJoin("scores as r", (join) =>
        join
          .onRef("r.songId", "=", "s.songId")
          .on("r.version", "=", version)
          .on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows")
              .select("followingId")
              .where("followerId", "=", userId),
          )
          .on("r.logId", "=", (eb) =>
            eb
              .selectFrom("scores as r2")
              .select((s) => s.fn.max("logId").as("m"))
              .whereRef("r2.userId", "=", "r.userId")
              .whereRef("r2.songId", "=", "s.songId"),
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

  /**
   * 指定バッチまたは期間内に追い抜いたライバルとその楽曲を取得する。
   *
   * 「追い抜き」とは、今回のスコアがライバルの直前スコアを上回り、
   * かつ自分の直前スコアはライバルを下回っていた楽曲を指す。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param options.range - 期間指定（`start`, `end`, 基準列 `basis`）
   * @param options.batchId - バッチ ID（`range` と排他）
   */
  async getOvertakenRivals(
    userId: string,
    version: string,
    options: {
      range?: { start: Date; end: Date; basis: "lastPlayed" | "createdAt" };
      batchId?: string;
    },
  ) {
    const { range, batchId } = options;

    const timeCol = range?.basis ?? "lastPlayed";

    let query = db
      .selectFrom("scores as current")
      .innerJoin("songs as s", "s.songId", "current.songId")
      .innerJoin("scores as r", (join) =>
        join
          .onRef("r.songId", "=", "current.songId")
          .on("r.version", "=", version)
          .on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows")
              .select("followingId")
              .where("followerId", "=", userId),
          )
          .on("r.logId", "=", (eb) =>
            eb
              .selectFrom("scores as r2")
              .select((s) => s.fn.max("logId").as("m"))
              .whereRef("r2.userId", "=", "r.userId")
              .whereRef("r2.songId", "=", "current.songId")
              .whereRef(`r2.${timeCol}`, "<", `current.${timeCol}`),
          ),
      )
      .innerJoin("users as ru", "ru.userId", "r.userId")
      .leftJoin("scores as prevBest", (join) =>
        join
          .onRef("prevBest.songId", "=", "current.songId")
          .on("prevBest.userId", "=", userId)
          .on("prevBest.version", "=", version)
          .on("prevBest.logId", "=", (eb) =>
            eb
              .selectFrom("scores as pb")
              .select((s) => s.fn.max("logId").as("m"))
              .where("pb.userId", "=", userId)
              .whereRef("pb.songId", "=", "current.songId")
              .whereRef(`pb.${timeCol}`, "<", `current.${timeCol}`),
          ),
      )
      .select([
        "current.songId",
        "ru.userId as rivalUserId",
        "ru.userName as rivalName",
        "ru.profileImage as rivalProfileImage",
        "r.exScore as rivalScore",
        "current.exScore as myNewScore",
        "prevBest.exScore as myOldScore",
      ])
      .where("current.userId", "=", userId)
      .where("current.version", "=", version);

    if (batchId) {
      query = query.where("current.batchId", "=", batchId);
    } else if (range) {
      query = query
        .where(`current.${timeCol}`, ">=", range.start)
        .where(`current.${timeCol}`, "<=", range.end);
    }

    return await query
      .whereRef("current.exScore", ">", "r.exScore")
      .where((eb) =>
        eb.or([
          eb("prevBest.exScore", "is", null),
          eb("r.exScore", ">", eb.ref("prevBest.exScore")),
        ]),
      )
      .execute();
  }

  /**
   * フォロー中ライバルの楽曲ごと平均スコアを取得する。
   * songIds を指定した場合は当該楽曲のみに絞り込む。
   */
  async getRivalAvgScores(params: {
    userId: string;
    version: string;
    songIds?: number[];
  }) {
    const { userId, version, songIds } = params;

    const latestPerRival = db
      .selectFrom("scores as sc")
      .select([
        "sc.songId",
        "sc.userId",
        (eb) => eb.fn.max("sc.logId").as("latestLogId"),
      ])
      .where("sc.version", "=", version)
      .where("sc.userId", "in", (qb) =>
        qb
          .selectFrom("follows")
          .select("followingId")
          .where("followerId", "=", userId),
      )
      .$if(songIds != null && songIds.length > 0, (qb) =>
        qb.where("sc.songId", "in", songIds!),
      )
      .groupBy(["sc.songId", "sc.userId"])
      .as("latest");

    const rows = await db
      .selectFrom("scores as s")
      .innerJoin(latestPerRival, (join) =>
        join
          .onRef("s.logId", "=", "latest.latestLogId")
          .onRef("s.userId", "=", "latest.userId")
          .onRef("s.songId", "=", "latest.songId"),
      )
      .innerJoin("songs as sg", "sg.songId", "s.songId")
      .select([
        "sg.songId",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.title",
        (eb) => eb.fn.avg("s.exScore").as("avgExScore"),
        (eb) => eb.fn.avg("s.bpi").as("avgBpi"),
        (eb) => eb.fn.count("s.logId").as("rivalCount"),
      ])
      .groupBy(["sg.songId", "sg.difficulty"])
      .execute();

    return rows;
  }

  /**
   * フォロー中ライバルの楽曲ごとトップスコアを取得する。
   * songIds を指定した場合は当該楽曲のみに絞り込む。
   */
  async getRivalTopScores(params: {
    userId: string;
    version: string;
    songIds?: number[];
  }) {
    const { userId, version, songIds } = params;

    const latestPerRival = db
      .selectFrom("scores as sc")
      .select([
        "sc.songId",
        "sc.userId",
        (eb) => eb.fn.max("sc.logId").as("latestLogId"),
      ])
      .where("sc.version", "=", version)
      .where("sc.userId", "in", (qb) =>
        qb
          .selectFrom("follows")
          .select("followingId")
          .where("followerId", "=", userId),
      )
      .$if(songIds != null && songIds.length > 0, (qb) =>
        qb.where("sc.songId", "in", songIds!),
      )
      .groupBy(["sc.songId", "sc.userId"])
      .as("latest");

    const rows = await db
      .selectFrom("scores as s")
      .innerJoin(latestPerRival, (join) =>
        join
          .onRef("s.logId", "=", "latest.latestLogId")
          .onRef("s.userId", "=", "latest.userId")
          .onRef("s.songId", "=", "latest.songId"),
      )
      .innerJoin("songs as sg", "sg.songId", "s.songId")
      .select([
        "sg.songId",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.title",
        (eb) => eb.fn.max("s.exScore").as("topExScore"),
        (eb) => eb.fn.max("s.bpi").as("topBpi"),
        (eb) => eb.fn.count("s.logId").as("rivalCount"),
      ])
      .groupBy(["sg.songId", "sg.difficulty"])
      .execute();

    return rows;
  }
}

export const rivalRepo = new RivalRepository();
