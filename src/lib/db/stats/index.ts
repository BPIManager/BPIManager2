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

    return await query.groupBy("date").orderBy("date", "asc").execute();
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
   * BPM帯別総合BPI計算用：全楽曲とユーザーの最新BPIを取得
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param levels - 対象難易度レベルの配列（省略時は全レベル）
   * @param difficulties - 対象難易度文字列の配列（省略時は全難易度）
   * @returns 楽曲ごとの bpm, bpi（未プレイは null）
   */
  async getSongsWithUserBpiForBpmDistribution(
    userId: string,
    version: string,
    levels?: number[],
    difficulties?: string[],
  ) {
    const versionNum = parseInt(version);

    let query = db
      .selectFrom("songs as m")
      .leftJoin(
        (qb) =>
          qb
            .selectFrom(
              db
                .selectFrom("scores")
                .select((eb) => [
                  "songId",
                  "bpi",
                  "exScore",
                  eb.fn
                    .agg<number>("row_number", [])
                    .over((ob) =>
                      ob.partitionBy("songId").orderBy("logId", "desc"),
                    )
                    .as("rn"),
                ])
                .where("userId", "=", userId)
                .where("version", "=", version)
                .as("ranked"),
            )
            .select(["songId", "bpi", "exScore"])
            .where("rn", "=", 1)
            .as("latest"),
        (join) => join.onRef("latest.songId", "=", "m.songId"),
      )
      .select([
        "m.title",
        "m.difficulty",
        "m.bpm",
        "m.notes",
        "latest.bpi",
        "latest.exScore",
      ])
      .where("m.releasedVersion", "<=", versionNum)
      .where((eb) =>
        eb.or([eb("m.deletedAt", "is", null), eb("m.deletedAt", ">", version)]),
      );

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query.execute();
  }

  /**
   * 指定楽曲のグローバルランキングデータを取得する。
   *
   * 各ユーザーの最新スコア（最大 logId）を取得し、exScore 降順でランキングする。
   * 非公開ユーザーは匿名化して含める。
   *
   * @param songId - 楽曲 ID
   * @param version - バージョン番号
   * @param viewerId - 閲覧者のユーザー ID（自分自身の判定に使用）
   */
  async getSongRanking(songId: number, version: string, viewerId: string) {
    const rows = await db
      .selectFrom("scores as s")
      .innerJoin("users as u", "s.userId", "u.userId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select(["userId", (eb) => eb.fn.max("logId").as("maxLogId")])
            .where("songId", "=", songId)
            .where("version", "=", version)
            .groupBy("userId")
            .as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
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

    const rankings = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.isPublic ? r.userId : `anon-${i}`,
      userName: r.isPublic ? r.userName : "-",
      profileImage: r.isPublic ? r.profileImage : null,
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

  /**
   * 指定バージョン・レベル・難易度に該当する全楽曲の `title___difficulty` キー集合を返す。
   * レーダーチャートの未プレイ曲フィルタリングに使用する。
   */
  async getFilteredSongKeys(
    version: string,
    levels?: number[],
    difficulties?: string[],
  ): Promise<Set<string>> {
    const versionNum = parseInt(version);

    let query = db
      .selectFrom("songs as m")
      .select(["m.title", "m.difficulty"])
      .where("m.releasedVersion", "<=", versionNum)
      .where((eb) =>
        eb.or([eb("m.deletedAt", "is", null), eb("m.deletedAt", ">", version)]),
      );

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    const rows = await query.execute();
    return new Set(rows.map((r) => `${r.title}___${r.difficulty}`));
  }
}

export const statsRepo = new StatsRepository();
