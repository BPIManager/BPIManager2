import { db } from "@/lib/db";

class LogScoreRepository {
  async getScoresByLastPlayedRange(
    userId: string,
    version: string,
    range: { start: Date; end: Date },
  ) {
    return await this.getScoresWithDetails(userId, version, {
      targetTime: range.end,
      comparisonTime: range.start,
      onlyLastPlayedInRange: range,
    });
  }

  /**
   * スコア情報を取得します。比較対象（過去スコア）や最新定義（SongDef）を結合します。
   * @param userId ユーザーID
   * @param version バージョン
   * @param options.batchIds 指定したバッチに含まれるスコアのみ取得する場合
   * @param options.targetTime 特定時点（スナップショット）のスコアを取得する場合
   * @param options.comparisonTime 比較対象とする過去時点（この時刻より前の最新スコアを prev として取得）
   * @param options.onlyLastPlayedInRange 最終プレイ日時（lastPlayed）が指定範囲内のスコアを取得する場合
   */
  async getScoresWithDetails(
    userId: string,
    version: string,
    options: {
      batchIds?: string[];
      targetTime?: Date;
      comparisonTime?: Date;
      onlyLastPlayedInRange?: { start: Date; end: Date };
    },
  ) {
    const { batchIds, targetTime, comparisonTime, onlyLastPlayedInRange } =
      options;

    let query = db
      .selectFrom("scores as current")
      .innerJoin("songs as s", "s.songId", "current.songId")
      .leftJoin("scores as prev", (join) =>
        join
          .onRef("prev.songId", "=", "current.songId")
          .on("prev.userId", "=", userId)
          .on("prev.version", "=", version)
          .on("prev.logId", "=", (qb) => {
            let sub = qb
              .selectFrom("scores as sub")
              .select((eb) => eb.fn.max("sub.logId").as("maxLogId"))
              .whereRef("sub.songId", "=", "current.songId")
              .where("sub.userId", "=", userId)
              .where("sub.version", "=", version);

            if (comparisonTime) {
              const timeColumn = onlyLastPlayedInRange
                ? "sub.lastPlayed"
                : "sub.createdAt";
              return sub.where(timeColumn, "<", comparisonTime);
            } else {
              return sub.whereRef("sub.logId", "<", "current.logId");
            }
          }),
      )
      .leftJoin(
        (qb) => {
          let sub = qb
            .selectFrom("songDef")
            .select([
              "songId as l_defSongId",
              (eb) => eb.fn.max("defId").as("maxDefId"),
            ]);

          if (targetTime) {
            sub = sub.where("updatedAt", "<=", targetTime);
          } else {
            sub = sub.where("isCurrent", "=", 1);
          }
          return sub.groupBy("songId").as("latest_sd");
        },
        (join) => join.onRef("latest_sd.l_defSongId", "=", "s.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficultyLevel",
        "s.difficulty",
        "s.releasedVersion",
        "current.exScore",
        "current.bpi",
        "current.clearState",
        "current.missCount",
        "current.lastPlayed as scoreAt",
        "prev.exScore as p_exScore",
        "prev.bpi as p_bpi",
        "prev.clearState as p_clearState",
        "prev.missCount as p_missCount",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ]);

    if (batchIds && batchIds.length > 0) {
      query = query
        .where("current.batchId", "in", batchIds)
        .where("current.logId", "in", (qb) =>
          qb
            .selectFrom("scores")
            .select((eb) => eb.fn.max("logId").as("logId"))
            .where("batchId", "in", batchIds)
            .groupBy("songId"),
        );
    } else if (onlyLastPlayedInRange) {
      query = query
        .where("current.userId", "=", userId)
        .where("current.version", "=", version)
        .where("current.lastPlayed", ">=", onlyLastPlayedInRange.start)
        .where("current.lastPlayed", "<=", onlyLastPlayedInRange.end)
        .where("current.logId", "in", (qb) =>
          qb
            .selectFrom("scores as inner_sc")
            .select((eb) => eb.fn.max("inner_sc.logId").as("maxId"))
            .where("inner_sc.userId", "=", userId)
            .where("inner_sc.version", "=", version)
            .where("inner_sc.lastPlayed", ">=", onlyLastPlayedInRange.start)
            .where("inner_sc.lastPlayed", "<=", onlyLastPlayedInRange.end)
            .groupBy("inner_sc.songId"),
        );
    } else if (targetTime) {
      query = query
        .innerJoin(
          (qb) =>
            qb
              .selectFrom("scores")
              .select([
                "songId as l_songId",
                (eb) => eb.fn.max("logId").as("maxLogId"),
              ])
              .where("userId", "=", userId)
              .where("version", "=", version)
              .where("createdAt", "<=", targetTime)
              .groupBy("songId")
              .as("latest_sc"),
          (join) => join.onRef("latest_sc.l_songId", "=", "s.songId"),
        )
        .whereRef("current.logId", "=", "latest_sc.maxLogId");
    }
    return await query
      .where((eb) =>
        eb.or([eb("s.deletedAt", "is", null), eb("s.deletedAt", ">", version)]),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
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
        "m.difficultyLevel",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.songId", "is not", null);

    if (levels.length > 0)
      query = query.where("m.difficultyLevel", "in", levels);
    if (difficulties.length > 0)
      query = query.where("m.difficulty", "in", difficulties);

    return await query.orderBy("s.lastPlayed", "asc").execute();
  }
}

export const scoreDetailRepo = new LogScoreRepository();
