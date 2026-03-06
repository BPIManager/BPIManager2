import { db } from "@/lib/db";
import { sql } from "kysely";

export class StatsRepository {
  /**
   * 指定ユーザー・バージョンのアクティビティデータを取得
   */
  async getActivityData(
    userId: string,
    version: string,
    levels?: number[],
    difficulties?: string[],
  ) {
    let query = db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .select([
        sql<string>`DATE(s.lastPlayed)`.as("date"),
        sql<number>`COUNT(s.logId)`.as("count"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.lastPlayed", ">=", sql<Date>`DATE_SUB(NOW(), INTERVAL 1 YEAR)`);

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query
      .groupBy(sql`DATE(s.lastPlayed)`)
      .orderBy("date", "asc")
      .execute();
  }

  /**
   * 指定ユーザー・バージョンの「各曲の最新スコア」を楽曲マスタ情報付きで取得
   */
  async getLatestScoresWithMusicData(userId: string, version: string) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select([
              "songId as latest_songId",
              (eb) => eb.fn.max("logId").as("maxLogId"),
            ])
            .where("userId", "=", userId)
            .where("version", "=", version)
            .groupBy("songId")
            .as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "s.logId",
        "s.userId",
        "s.songId",
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.missCount",
        "s.lastPlayed",
        "m.title",
        "m.notes",
        "m.difficulty",
        "m.difficultyLevel",
      ])
      .execute();
  }

  async getScoreHistory(
    userId: string,
    version: string,
    levels: number[],
    difficulties: string[],
  ) {
    let query = db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .select([
        "s.logId",
        "s.songId",
        "s.bpi",
        "s.lastPlayed",
        "m.title",
        "m.difficulty",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.songId", "is not", null);

    if (levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query.orderBy("s.lastPlayed", "asc").execute();
  }

  async getTotalSongCount(
    levels: number[],
    difficulties: string[],
  ): Promise<number> {
    let query = db
      .selectFrom("songs")
      .select((eb) => eb.fn.count("songId").as("count"));

    if (levels.length > 0) query = query.where("difficultyLevel", "in", levels);
    if (difficulties.length > 0)
      query = query.where("difficulty", "in", difficulties);

    const result = await query.executeTakeFirst();
    return Number(result?.count || 0);
  }
}
