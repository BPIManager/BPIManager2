import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * 統計ダッシュボード・分析画面向けのデータ取得を担当するリポジトリクラス。
 */
class StatsRepository {
  /**
   * 指定ユーザー・バージョンの最新総合 BPI を取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @returns 総合 BPI 値（記録がない場合は `-15`）
   */
  async getLatestTotalBpi(userId: string, version: string): Promise<number> {
    const result = await db
      .selectFrom("logs")
      .select("totalBpi")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

    return result ? Number(result.totalBpi) : -15;
  }

  /**
   * AAA達成難易度表用：楽曲マスタ、BPI定義、ユーザーの最新スコアを取得
   */
  async getAAATableData(userId: string, version: string, level: number) {
    const versionNum = parseInt(version);

    return await db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores as s1")
            .select(["s1.songId as latest_songId", "s1.exScore", "s1.bpi"])
            .innerJoin(
              (sub) =>
                sub
                  .selectFrom("scores")
                  .select(["songId", (eb) => eb.fn.max("logId").as("maxLogId")])
                  .where("userId", "=", userId)
                  .where("version", "=", version)
                  .groupBy("songId")
                  .as("max_scores"),
              (join) => join.onRef("max_scores.maxLogId", "=", "s1.logId"),
            )
            .as("userScore"),
        (join) => join.onRef("userScore.latest_songId", "=", "m.songId"),
      )
      .select([
        "m.songId",
        "m.title",
        "m.notes",
        "m.difficulty",
        "m.difficultyLevel",
        "m.releasedVersion",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "userScore.exScore as userExScore",
        "userScore.bpi as userBpi",
      ])
      .where("m.difficultyLevel", "=", level)
      // ↓旧作のデータをクエリしたときに当時存在しなかった曲を含めない
      .where("m.releasedVersion", "<=", versionNum)
      .orderBy("m.title", "asc")
      .execute();
  }

  /**
   * 日別のプレイ楽曲数（アクティビティ）を取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param levels - 対象難易度レベルの配列（省略時は全レベル）
   * @param difficulties - 対象難易度文字列の配列（省略時は全難易度）
   * @returns `{ date: string, count: number }[]`（date は JST 日付文字列）
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
        sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as(
          "date",
        ),
        sql<number>`COUNT(DISTINCT s.songId)`.as("count"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version);

    query = query.where((eb) =>
      eb.or([eb("m.deletedAt", "is", null), eb("m.deletedAt", ">", version)]),
    );

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query
      .groupBy(sql`date`)
      .orderBy("date", "asc")
      .execute();
  }

  /**
   * 指定ユーザー・バージョンの「各曲の最新スコア」を楽曲マスタ情報付きで取得
   */
  async getLatestScoresWithMusicData(
    userId: string,
    version: string,
    levels?: number[],
    difficulties?: string[],
  ) {
    let query = db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
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
        "m.bpm",
        "m.difficulty",
        "m.difficultyLevel",
        "m.releasedVersion",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version);

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query.execute();
  }

  /**
   * 指定ユーザーのスコア履歴（BPI 推移）を取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param levels - 対象難易度レベルの配列（空の場合は全レベル）
   * @param difficulties - 対象難易度文字列の配列（空の場合は全難易度）
   * @returns lastPlayed 昇順のスコア・楽曲情報配列
   */
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
        "m.difficultyLevel",
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

  /**
   * 条件に一致する楽曲の総数を取得する。
   *
   * @param levels - 対象難易度レベルの配列（空の場合は全レベル）
   * @param difficulties - 対象難易度文字列の配列（空の場合は全難易度）
   * @returns 楽曲総数
   */
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

export const statsRepo = new StatsRepository();
