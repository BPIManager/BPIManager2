import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
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
  async getAAATableData(userId: string, version: IIDXVersion, level: number) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version);

    return await db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .leftJoin("scores as s", (join) =>
        join
          .onRef("s.songId", "=", "m.songId")
          .on("s.userId", "=", userId)
          .on("s.version", "=", version)
          .on("s.logId", "=", (qb) =>
            qb
              .selectFrom("scores as s2")
              .select((eb) => eb.fn.max("s2.logId").as("maxLogId"))
              .whereRef("s2.songId", "=", "m.songId")
              .where("s2.userId", "=", userId)
              .where("s2.version", "=", version),
          ),
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
        "s.exScore as userExScore",
        "s.bpi as userBpi",
      ])
      .where("m.difficultyLevel", "=", level)
      .$if(!isInf, (qb) => qb.where("m.releasedVersion", "<=", versionNum!))
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
    const isInf = version === "INF";

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
      .where("s.version", "=", version)
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("m.deletedAt", "is", null),
            eb("m.deletedAt", ">", version),
          ]),
        ),
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
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version);

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
      .$if(!isInf, (qb) =>
        qb
          .where("m.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("m.deletedAt", "is", null),
              eb("m.deletedAt", ">", version),
            ]),
          ),
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
   * 指定ユーザー・バージョンで、プレイ済みの各楽曲における全ユーザー内での順位を返す。
   *
   * allScores / allSongs テーブルを走査し、MySQL 8 のウィンドウ関数
   * (RANK / COUNT) で楽曲ごとの順位と総プレイ人数を算出する。
   *
   * @param userId  - 対象ユーザー ID
   * @param version - バージョン番号
   * @returns 楽曲ごとの順位情報配列
   */
  async getUserSongRankings(userId: string, version: string) {
    const rows = await db
      .with("user_latest", (db) =>
        db
          .selectFrom("allScores as s")
          .innerJoin(
            (qb) =>
              qb
                .selectFrom("allScores")
                .select(["songId", (eb) => eb.fn.max("logId").as("maxLogId")])
                .where("userId", "=", userId)
                .where("version", "=", version)
                .groupBy("songId")
                .as("m"),
            (join) => join.onRef("m.maxLogId", "=", "s.logId"),
          )
          .where("s.userId", "=", userId)
          .select([
            "s.songId",
            "s.logId",
            "s.exScore",
            "s.bpi",
            "s.clearState",
            "s.missCount",
            "s.lastPlayed",
          ]),
      )
      .with("per_song_latest", (db) =>
        db
          .selectFrom("allScores as s")
          .innerJoin(
            (qb) =>
              qb
                .selectFrom("allScores")
                .select([
                  "userId",
                  "songId",
                  (eb) => eb.fn.max("logId").as("maxLogId"),
                ])
                .where("version", "=", version)
                .groupBy(["userId", "songId"])
                .as("m"),
            (join) =>
              join
                .onRef("m.maxLogId", "=", "s.logId")
                .onRef("m.userId", "=", "s.userId")
                .onRef("m.songId", "=", "s.songId"),
          )
          .select((eb) => [
            "s.userId",
            "s.songId",
            "s.exScore",
            eb.fn
              .agg<number>("rank", [])
              .over((ob) =>
                ob.partitionBy("s.songId").orderBy("s.exScore", "desc"),
              )
              .as("rnk"),
            eb.fn
              .countAll<number>()
              .over((ob) => ob.partitionBy("s.songId"))
              .as("totalPlayers"),
          ]),
      )
      .selectFrom("user_latest as ul")
      .innerJoin("per_song_latest as psl", (join) =>
        join
          .onRef("psl.songId", "=", "ul.songId")
          .on("psl.userId", "=", userId),
      )
      .innerJoin("allSongs as sg", "sg.songId", "ul.songId")
      .select((eb) => [
        "ul.songId",
        "sg.title",
        "sg.notes",
        "sg.bpm",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.releasedVersion",
        "ul.logId",
        "ul.exScore",
        "ul.bpi",
        "ul.clearState",
        "ul.missCount",
        "ul.lastPlayed",
        eb.ref("psl.rnk").as("rank"),
        "psl.totalPlayers",
      ])
      .orderBy("psl.rnk", "asc")
      .execute();

    return rows.map((r) => ({
      ...r,
      rank: Number(r.rank),
      totalPlayers: Number(r.totalPlayers),
      bpi: r.bpi !== null && r.bpi !== undefined ? Number(r.bpi) : null,
    }));
  }

  /**
   * 日別BPI統計 + プレーボリューム取得用
   */
  async getBpiAndVolumePerDate(
    userId: string,
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ) {
    const isInf = version === "INF";

    let scoreQuery = db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .select((eb) => [
        eb
          .fn<string>("DATE", [
            eb.fn("CONVERT_TZ", [
              eb.ref("s.lastPlayed"),
              eb.val("+00:00"),
              eb.val("+09:00"),
            ]),
          ])
          .as("date"),
        "s.songId",
        "m.notes",
        eb.fn.max("s.bpi").as("bpi"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.bpi", "is not", null)
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("m.deletedAt", "is", null),
            eb("m.deletedAt", ">", version),
          ]),
        ),
      );

    if (levels?.length)
      scoreQuery = scoreQuery.where("m.difficultyLevel", "in", levels);
    if (difficulties?.length)
      scoreQuery = scoreQuery.where("m.difficulty", "in", difficulties);

    const scores = await scoreQuery.groupBy(["date", "s.songId"]).execute();

    const tower = await db
      .selectFrom("iidxTower")
      .select(["playDate as date", "keyCount", "scratchCount"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .execute();

    return { scores, tower };
  }

  /**
   * 月次まとめ用：月内の logs (BPI推移) を取得する。
   * monthStart/monthEnd は JST での月初/月末日付文字列 (YYYY-MM-DD)
   */
  async getMonthlyBpiHistory(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("logs")
      .select(["id", "totalBpi", "createdAt", "batchId"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where(
        sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
        ">=",
        monthStart,
      )
      .where(
        sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
        "<=",
        monthEnd,
      )
      .orderBy("createdAt", "asc")
      .execute();
  }

  /**
   * 月次まとめ用：月開始直前の最後の log を取得する。
   */
  async getLastLogBeforeMonth(
    userId: string,
    version: string,
    monthStart: string,
  ) {
    return await db
      .selectFrom("logs")
      .select(["id", "totalBpi", "createdAt", "batchId"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where(
        sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
        "<",
        monthStart,
      )
      .orderBy("createdAt", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * 月次まとめ用：月内に更新されたスコア（楽曲情報付き）を取得する。
   * batchIds は月内の logs.batchId 配列。
   */
  async getScoresForBatches(
    userId: string,
    version: string,
    batchIds: string[],
  ) {
    if (batchIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .select([
        "s.logId",
        "s.songId",
        "s.bpi",
        "s.exScore",
        "s.batchId",
        "m.title",
        "m.difficulty",
        "m.difficultyLevel",
        "m.notes",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.batchId", "in", batchIds)
      .execute();
  }

  /**
   * 月次まとめ用：指定 songId 群について月開始直前の最新スコアを取得する。
   */
  async getPreMonthScores(
    userId: string,
    version: string,
    songIds: number[],
    beforeBatchIds: string[],
  ) {
    if (songIds.length === 0 || beforeBatchIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select(["s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .where("s2.songId", "in", songIds)
            .where("s2.batchId", "in", beforeBatchIds)
            .groupBy("s2.songId")
            .as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.bpi", "s.exScore"])
      .where("s.userId", "=", userId)
      .execute();
  }

  /**
   * 月次まとめ用：月内の iidxTower データ（鍵盤・スクラッチ）を集計する。
   */
  async getMonthlyTowerStats(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    const result = await db
      .selectFrom("iidxTower")
      .select([
        (eb) => eb.fn.sum<number>("keyCount").as("totalKeys"),
        (eb) => eb.fn.sum<number>("scratchCount").as("totalScratches"),
        (eb) => eb.fn.count<number>("playDate").as("playDays"),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where(sql`playDate`, ">=", monthStart)
      .where(sql`playDate`, "<=", monthEnd)
      .executeTakeFirst();
    return {
      totalKeys: Number(result?.totalKeys ?? 0),
      totalScratches: Number(result?.totalScratches ?? 0),
      playDays: Number(result?.playDays ?? 0),
    };
  }

  /**
   * 月次まとめ用：指定ユーザーのレベル11/12の最新スコアを全曲取得する。
   */
  async getUserCurrentL1112Scores(userId: string, version: string) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select(["s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .groupBy("s2.songId")
            .as("latest"),
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

  /**
   * 月次まとめ用：指定 logId より前のユーザーのL11/L12スコアを全曲取得する。
   */
  async getUserPreMonthL1112Scores(
    userId: string,
    version: string,
    monthStart: string,
  ) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select(["s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .where(
              sql<string>`DATE(CONVERT_TZ(s2.lastPlayed, '+00:00', '+09:00'))`,
              "<",
              monthStart,
            )
            .groupBy("s2.songId")
            .as("latest"),
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

  /**
   * 月次まとめ用：複数ユーザーの月開始前の最新 BPI をL12曲ごとに取得する。
   * BPI タイムラインの初期状態として使用。
   */
  async getPreMonthBpiStateForUsers(
    userIds: string[],
    version: string,
    monthStart: string,
  ) {
    if (userIds.length === 0) return []
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .innerJoin("songs as m2", "s2.songId", "m2.songId")
            .select([
              "s2.userId",
              "s2.songId",
              (eb) => eb.fn.max("s2.logId").as("maxLogId"),
            ])
            .where("s2.userId", "in", userIds)
            .where("s2.version", "=", version)
            .where("m2.difficultyLevel", "=", 12)
            .where("m2.difficulty", "in", ["HYPER", "ANOTHER", "LEGGENDARIA"])
            .where(
              sql<string>`DATE(CONVERT_TZ(s2.lastPlayed, '+00:00', '+09:00'))`,
              "<",
              monthStart,
            )
            .groupBy(["s2.userId", "s2.songId"])
            .as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.userId", "s.songId", "s.bpi"])
      .execute()
  }

  /**
   * 月次まとめ用：複数ユーザーの月内L12スコア更新履歴を lastPlayed 昇順で返す。
   * BpiCalculator で日ごとに totalBPI を再計算するための素材。
   */
  async getInMonthScoreHistoryForUsers(
    userIds: string[],
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    if (userIds.length === 0) return []
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .select(["s.userId", "s.songId", "s.bpi", "s.lastPlayed"])
      .where("s.userId", "in", userIds)
      .where("s.version", "=", version)
      .where("m.difficultyLevel", "=", 12)
      .where("m.difficulty", "in", ["HYPER", "ANOTHER", "LEGGENDARIA"])
      .where(
        sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`,
        ">=",
        monthStart,
      )
      .where(
        sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`,
        "<=",
        monthEnd,
      )
      .orderBy("s.lastPlayed", "asc")
      .orderBy("s.logId", "asc")
      .execute()
  }

  /**
   * 月次まとめ用：月内スコア更新の曜日・時間帯別集計
   * MySQL DAYOFWEEK: 1=Sun, 2=Mon, ..., 7=Sat
   */
  async getMonthlyActivityBreakdown(userId: string, version: string, batchIds: string[]) {
    if (batchIds.length === 0) return []
    return await db
      .selectFrom("scores as s")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as("dow"),
        sql<number>`HOUR(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as("hour"),
        sql<number>`COUNT(DISTINCT s.songId)`.as("count"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.batchId", "in", batchIds)
      .groupBy(["dow", "hour"])
      .execute()
  }

  /**
   * 月次まとめ用：複数ライバルの月初・月末 totalBpi を一括取得する。
   */
  async getRivalsBpiForMonth(
    rivalIds: string[],
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    if (rivalIds.length === 0) return []

    const [preRows, endRows] = await Promise.all([
      // Last log before the month (month-start BPI)
      db
        .selectFrom("logs as l")
        .innerJoin(
          (qb) =>
            qb
              .selectFrom("logs")
              .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
              .where("userId", "in", rivalIds)
              .where("version", "=", version)
              .where(
                sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
                "<",
                monthStart,
              )
              .groupBy("userId")
              .as("pre"),
          (join) =>
            join.onRef("l.id", "=", "pre.maxId").onRef("l.userId", "=", "pre.userId"),
        )
        .select(["l.userId", "l.totalBpi"])
        .execute(),

      // Last log in month (month-end BPI)
      db
        .selectFrom("logs as l")
        .innerJoin(
          (qb) =>
            qb
              .selectFrom("logs")
              .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
              .where("userId", "in", rivalIds)
              .where("version", "=", version)
              .where(
                sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
                ">=",
                monthStart,
              )
              .where(
                sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
                "<=",
                monthEnd,
              )
              .groupBy("userId")
              .as("end"),
          (join) =>
            join.onRef("l.id", "=", "end.maxId").onRef("l.userId", "=", "end.userId"),
        )
        .select(["l.userId", "l.totalBpi"])
        .execute(),
    ])

    const preMap = new Map(preRows.map((r) => [r.userId, Number(r.totalBpi)]))
    const endMap = new Map(endRows.map((r) => [r.userId, Number(r.totalBpi)]))

    return rivalIds.map((id) => {
      const bpiStart = preMap.get(id) ?? null
      const bpiEnd = endMap.get(id) ?? null
      const bpiGrowth =
        bpiStart !== null && bpiEnd !== null
          ? Math.round((bpiEnd - bpiStart) * 100) / 100
          : null
      return { userId: id, bpiStart, bpiEnd, bpiGrowth }
    })
  }

  /**
   * 月次まとめ用：複数ライバルの月内 日別 totalBpi タイムラインを取得する。
   * 1日1エントリ（最新 id のもの）を返す。
   */
  async getRivalsMonthlyBpiTimeline(
    rivalIds: string[],
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    if (rivalIds.length === 0) return []

    return await db
      .selectFrom("logs as l")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("logs")
            .select([
              "userId",
              sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`.as("date"),
              (eb) => eb.fn.max("id").as("maxId"),
            ])
            .where("userId", "in", rivalIds)
            .where("version", "=", version)
            .where(
              sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
              ">=",
              monthStart,
            )
            .where(
              sql<string>`DATE(CONVERT_TZ(createdAt, '+00:00', '+09:00'))`,
              "<=",
              monthEnd,
            )
            .groupBy(["userId", "date"])
            .as("latest"),
        (join) => join.onRef("l.id", "=", "latest.maxId"),
      )
      .select([
        "l.userId",
        sql<string>`DATE(CONVERT_TZ(l.createdAt, '+00:00', '+09:00'))`.as("date"),
        "l.totalBpi",
      ])
      .orderBy("l.userId")
      .orderBy("date")
      .execute()
  }

  /**
   * 月次まとめ用：タワーデータの月間ランキング（キー・スクラッチ）を返す。
   * 全ユーザーの月次合計を取得し、JS側でランクを計算する。
   */
  async getMonthlyTowerRanking(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    const allTotals = await db
      .selectFrom("iidxTower")
      .select([
        "userId",
        (eb) => eb.fn.sum<number>("keyCount").as("totalKeys"),
        (eb) => eb.fn.sum<number>("scratchCount").as("totalScratches"),
      ])
      .where("version", "=", version)
      .where(sql`playDate`, ">=", monthStart)
      .where(sql`playDate`, "<=", monthEnd)
      .groupBy("userId")
      .execute()

    const totalUsers = allTotals.length
    if (totalUsers === 0) return null

    const userRow = allTotals.find((r) => r.userId === userId)
    if (!userRow) return null

    const userKeys = Number(userRow.totalKeys)
    const userScratches = Number(userRow.totalScratches)

    const keysRank = 1 + allTotals.filter((r) => Number(r.totalKeys) > userKeys).length
    const scratchRank = 1 + allTotals.filter((r) => Number(r.totalScratches) > userScratches).length

    return { keysRank, scratchRank, totalUsers }
  }

  /**
   * 月次まとめ用：フォロー中ライバルの現在のスコア（レベル11/12）を取得する。
   */
  async getRivalsCurrentScoresForSongs(
    viewerId: string,
    version: string,
    songIds: number[],
  ) {
    if (songIds.length === 0) return [];
    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .innerJoin("scores as s", "u.userId", "s.userId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .innerJoin("follows as f2", "f2.followingId", "s2.userId")
            .select(["s2.userId", "s2.songId", (eb) => eb.fn.max("s2.logId").as("maxLogId")])
            .where("f2.followerId", "=", viewerId)
            .where("s2.version", "=", version)
            .where("s2.songId", "in", songIds)
            .groupBy(["s2.userId", "s2.songId"])
            .as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["u.userId", "u.userName", "u.profileImage", "s.songId", "s.exScore"])
      .where("f.followerId", "=", viewerId)
      .where("s.version", "=", version)
      .where("u.isPublic", "=", 1)
      .execute();
  }

  /**
   * 月次まとめ用：月内のアリーナ最高ランク・最高勝利数・最高A1維持を返す。
   */
  async getMonthlyArenaStats(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    const rows = await db
      .selectFrom("officialArenaStats")
      .select(["arenaClass", "arenaRank", "wins", "a1continue", "fetchedAt"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("fetchedAt", ">=", new Date(`${monthStart}T00:00:00+09:00`))
      .where("fetchedAt", "<=", new Date(`${monthEnd}T23:59:59+09:00`))
      .orderBy("fetchedAt", "asc")
      .execute();
    return rows;
  }

  /**
   * 指定バージョン・レベル・難易度に該当する全楽曲の `title___difficulty` キー集合を返す。
   * レーダーチャートの未プレイ曲フィルタリングに使用する。
   */
  async getFilteredSongKeys(
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ): Promise<Set<string>> {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version);

    let query = db
      .selectFrom("songs as m")
      .select(["m.title", "m.difficulty"])
      .$if(!isInf, (qb) =>
        qb
          .where("m.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("m.deletedAt", "is", null),
              eb("m.deletedAt", ">", version),
            ]),
          ),
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

  /**
   * 指定ユーザーの総合 BPI に最も近い n 名のユーザー ID を返す。
   *
   * logs テーブルから各ユーザーの最新 totalBpi を取得し、
   * |totalBpi - userTotalBpi| 昇順で上位 n 件を選ぶ。
   *
   * @param userTotalBpi - 基準となる総合 BPI
   * @param userId       - 除外する自分自身のユーザー ID
   * @param version      - バージョン番号
   * @param n            - 取得する近傍プレイヤー数
   */
  async getNeighborIds(
    userTotalBpi: number,
    userId: string,
    version: string,
    n: number,
  ): Promise<string[]> {
    const rows = await db
      .selectFrom("logs as l")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("logs")
            .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
            .where("version", "=", version)
            .groupBy("userId")
            .as("latest"),
        (join) => join.onRef("latest.maxId", "=", "l.id"),
      )
      .select("l.userId")
      .where("l.userId", "!=", userId)
      .orderBy(sql<number>`ABS(l.totalBpi - ${userTotalBpi})`, "asc")
      .limit(n)
      .execute();

    return rows.map((r) => r.userId);
  }

  /**
   * ユーザーの各曲最新スコアと、近傍プレイヤーの平均 BPI を結合して返す。
   *
   * @param userId      - 対象ユーザー ID
   * @param neighborIds - 近傍プレイヤーの ID 配列
   * @param version     - バージョン番号
   * @param levels      - 絞り込む難易度レベル（省略時は全レベル）
   * @param difficulties - 絞り込む難易度文字列（省略時は全難易度）
   */
  async getNeighborScoreComparison(
    userId: string,
    neighborIds: string[],
    version: string,
    levels?: number[],
    difficulties?: string[],
  ) {
    if (neighborIds.length === 0) return [];

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
            .as("userLatest"),
        (join) => join.onRef("userLatest.maxLogId", "=", "s.logId"),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores as ns")
            .innerJoin(
              (qb2) =>
                qb2
                  .selectFrom("scores")
                  .select([
                    "userId",
                    "songId",
                    (eb) => eb.fn.max("logId").as("maxLogId"),
                  ])
                  .where("version", "=", version)
                  .where("userId", "in", neighborIds)
                  .groupBy(["userId", "songId"])
                  .as("nLatest"),
              (join) =>
                join
                  .onRef("nLatest.maxLogId", "=", "ns.logId")
                  .onRef("nLatest.userId", "=", "ns.userId")
                  .onRef("nLatest.songId", "=", "ns.songId"),
            )
            .select([
              "ns.songId",
              (eb) => eb.fn.avg<number>("ns.bpi").as("neighborAvgBpi"),
              (eb) => eb.fn.count<number>("ns.userId").as("neighborCount"),
            ])
            .groupBy("ns.songId")
            .as("neighbors"),
        (join) => join.onRef("neighbors.songId", "=", "s.songId"),
      )
      .select([
        "s.logId",
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
        "neighbors.neighborAvgBpi",
        "neighbors.neighborCount",
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
   * lastPlayed基準で月内に更新されたスコアのbatchIdと最終プレイ日を返す。
   */
  async getMonthlyScoreBatches(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("scores")
      .select([
        "batchId",
        // DATE_FORMAT returns VARCHAR → MySQL2 returns string (not Date object)
        sql<string>`DATE_FORMAT(MAX(CONVERT_TZ(lastPlayed, '+00:00', '+09:00')), '%Y-%m-%d')`.as("playDate"),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where(
        sql<string>`DATE(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'))`,
        ">=",
        monthStart,
      )
      .where(
        sql<string>`DATE(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'))`,
        "<=",
        monthEnd,
      )
      .where("batchId", "is not", null)
      .groupBy("batchId")
      .execute() as { batchId: string; playDate: string }[]
  }

  /**
   * batchId一覧に対応するlogsを取得する（BPIスナップショット用）。
   */
  async getLogsForBatches(userId: string, version: string, batchIds: string[]) {
    if (batchIds.length === 0) return []
    return await db
      .selectFrom("logs")
      .select(["id", "totalBpi", "createdAt", "batchId"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("batchId", "in", batchIds)
      .orderBy("createdAt", "asc")
      .execute()
  }

  /**
   * lastPlayed基準で月開始直前の最後のlogを取得する。
   */
  async getLastLogBeforeMonthByLastPlayed(
    userId: string,
    version: string,
    monthStart: string,
  ) {
    // 月開始より前にlastPlayedがある最後のバッチのlogを取得
    return await db
      .selectFrom("logs as l")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select([
              "batchId",
              sql<string>`DATE_FORMAT(MAX(CONVERT_TZ(lastPlayed, '+00:00', '+09:00')), '%Y-%m-%d')`.as("playDate"),
            ])
            .where("userId", "=", userId)
            .where("version", "=", version)
            .where("batchId", "is not", null)
            .groupBy("batchId")
            .as("sp"),
        (join) => join.onRef("l.batchId", "=", "sp.batchId"),
      )
      .select(["l.id", "l.totalBpi", "l.createdAt", "l.batchId"])
      .where("l.userId", "=", userId)
      .where("l.version", "=", version)
      .where(sql`sp.playDate`, "<", monthStart)
      .orderBy(sql`sp.playDate`, "desc")
      .orderBy("l.id", "desc")
      .limit(1)
      .executeTakeFirst()
  }

  /**
   * lastPlayed基準で曜日・時間帯別スコア更新集計を返す。
   */
  async getMonthlyActivityBreakdownByLastPlayed(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("scores as s")
      .select([
        sql<number>`DAYOFWEEK(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as("dow"),
        sql<number>`HOUR(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`.as("hour"),
        sql<number>`COUNT(DISTINCT s.songId)`.as("count"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where(
        sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`,
        ">=",
        monthStart,
      )
      .where(
        sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`,
        "<=",
        monthEnd,
      )
      .groupBy(["dow", "hour"])
      .execute()
  }

  /**
   * lastPlayed基準でライバルの月初・月末 totalBpi を取得する。
   */
  async getRivalsBpiForMonthByLastPlayed(
    rivalIds: string[],
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    if (rivalIds.length === 0) return []

    // 各ライバルのbatchId別最終プレイ日を取得（DATE_FORMAT→string返却）
    const batchPlayDates = await db
      .selectFrom("scores")
      .select([
        "userId",
        "batchId",
        sql<string>`DATE_FORMAT(MAX(CONVERT_TZ(lastPlayed, '+00:00', '+09:00')), '%Y-%m-%d')`.as("playDate"),
      ])
      .where("userId", "in", rivalIds)
      .where("version", "=", version)
      .where("batchId", "is not", null)
      .groupBy(["userId", "batchId"])
      .execute() as { userId: string; batchId: string; playDate: string }[]

    const batchPlayMap = new Map(batchPlayDates.map((r) => [`${r.userId}:${r.batchId}`, r.playDate]))

    // 全ライバルの全ログを1回で取得し、JS側でpre/endに分類する
    const allLogs = await db
      .selectFrom("logs as l")
      .select(["l.userId", "l.totalBpi", "l.batchId"])
      .where("l.userId", "in", rivalIds)
      .where("l.version", "=", version)
      .where("l.batchId", "is not", null)
      .execute()

    // playDate < monthStart の最終log per userId
    const preByUser = new Map<string, { totalBpi: number; playDate: string }>()
    for (const row of allLogs) {
      const batchId = row.batchId as string
      const playDate = batchPlayMap.get(`${row.userId}:${batchId}`)
      if (!playDate || playDate >= monthStart) continue
      const existing = preByUser.get(row.userId)
      if (!existing || playDate > existing.playDate) {
        preByUser.set(row.userId, { totalBpi: Number(row.totalBpi), playDate })
      }
    }

    // playDate <= monthEnd の最終log per userId
    const endByUser = new Map<string, { totalBpi: number; playDate: string }>()
    for (const row of allLogs) {
      const batchId = row.batchId as string
      const playDate = batchPlayMap.get(`${row.userId}:${batchId}`)
      if (!playDate || playDate > monthEnd) continue
      const existing = endByUser.get(row.userId)
      if (!existing || playDate > existing.playDate) {
        endByUser.set(row.userId, { totalBpi: Number(row.totalBpi), playDate })
      }
    }

    return rivalIds.map((id) => {
      const bpiStart = preByUser.get(id)?.totalBpi ?? null
      const bpiEnd = endByUser.get(id)?.totalBpi ?? null
      const bpiGrowth =
        bpiStart !== null && bpiEnd !== null
          ? Math.round((bpiEnd - bpiStart) * 100) / 100
          : null
      return { userId: id, bpiStart, bpiEnd, bpiGrowth }
    })
  }

  /**
   * 月次まとめ用：指定曲について月開始直前の最新スコアをlastPlayed基準で取得する。
   */
  async getPreMonthScoresByLastPlayed(
    userId: string,
    version: string,
    songIds: number[],
    monthStart: string,
  ) {
    if (songIds.length === 0) return []
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .select([
              "s2.songId",
              (eb) => eb.fn.max("s2.logId").as("maxLogId"),
            ])
            .where("s2.userId", "=", userId)
            .where("s2.version", "=", version)
            .where("s2.songId", "in", songIds)
            .where(
              sql<string>`DATE(CONVERT_TZ(s2.lastPlayed, '+00:00', '+09:00'))`,
              "<",
              monthStart,
            )
            .groupBy("s2.songId")
            .as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.bpi", "s.exScore"])
      .execute()
  }

  /**
   * lastPlayed基準でライバルの日別totalBpiタイムラインを返す。
   */
  async getRivalsMonthlyBpiTimelineByLastPlayed(
    rivalIds: string[],
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    if (rivalIds.length === 0) return []

    // 月内にlastPlayedがあるバッチのlogs
    const rows = await db
      .selectFrom("logs as l")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s")
            .select([
              "s.userId",
              "s.batchId",
              sql<string>`DATE_FORMAT(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'), '%Y-%m-%d')`.as("playDate"),
            ])
            .where("s.userId", "in", rivalIds)
            .where("s.version", "=", version)
            .where(
              sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`,
              ">=",
              monthStart,
            )
            .where(
              sql<string>`DATE(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'))`,
              "<=",
              monthEnd,
            )
            .where("s.batchId", "is not", null)
            .groupBy(["s.userId", "s.batchId", "playDate"])
            .as("sp"),
        (join) =>
          join
            .onRef("l.batchId", "=", "sp.batchId")
            .onRef("l.userId", "=", "sp.userId"),
      )
      .select([
        "l.userId",
        sql<string>`sp.playDate`.as("date"),
        "l.totalBpi",
      ])
      .orderBy("l.userId")
      .orderBy(sql`sp.playDate`)
      .execute()

    return rows
  }

  /**
   * lastPlayed基準でスコアデータがある月一覧を返す（YYYY-MM 降順）。
   */
  /**
   * 月次まとめ用：月内の iidxTower 日別データを返す（ベスト日計算用）。
   */
  async getMonthlyDailyTowerData(
    userId: string,
    version: string,
    monthStart: string,
    monthEnd: string,
  ) {
    return await db
      .selectFrom("iidxTower")
      .select(["playDate", "keyCount", "scratchCount"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where(sql`playDate`, ">=", monthStart)
      .where(sql`playDate`, "<=", monthEnd)
      .orderBy("playDate", "asc")
      .execute()
  }

  /**
   * 月次まとめ用：レーダー要素別総合BPI計算のため全L12曲のsongId・title・difficultyを返す。
   */
  async getAllL12SongMeta() {
    return await db
      .selectFrom("songs as m")
      .select(["m.songId", "m.title", "m.difficulty"])
      .where("m.difficultyLevel", "=", 12)
      .where("m.difficulty", "in", ["HYPER", "ANOTHER", "LEGGENDARIA"])
      .execute()
  }

  async getAvailableMonths(userId: string, version: string) {
    const rows = await db
      .selectFrom("scores")
      .select(
        sql<string>`DATE_FORMAT(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'), '%Y-%m')`.as("month"),
      )
      .where("userId", "=", userId)
      .where("version", "=", version)
      .groupBy(sql`DATE_FORMAT(CONVERT_TZ(lastPlayed, '+00:00', '+09:00'), '%Y-%m')`)
      .orderBy(sql`month`, "desc")
      .execute()
    return rows.map((r) => r.month)
  }
}

export const statsRepo = new StatsRepository();
