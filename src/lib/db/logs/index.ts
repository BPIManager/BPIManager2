import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { BatchDetailItem } from "@/types/logs/logByBatchId";
import { SongWithScore } from "@/types/songs/withScore";
import { Dayjs } from "dayjs";

/**
 * ログおよびスコア履歴に関するデータ操作を担当するリポジトリ
 */
export class LogRepository {
  static mapToLogNested(row: any): BatchDetailItem {
    const currentEx = Number(row.exScore);
    const prevEx = row.p_exScore !== null ? Number(row.p_exScore) : null;
    const currentBpi = Number(row.bpi);
    const prevBpi = row.p_pbi !== null ? Number(row.p_pbi) : null;

    return {
      songId: row.songId,
      title: row.title,
      difficulty: row.difficulty,
      difficultyLevel: row.difficultyLevel,
      level: row.difficultyLevel,
      notes: Number(row.notes || 0),
      bpm: row.bpm,
      releasedVersion: row.releasedVersion,
      current: {
        exScore: currentEx,
        bpi: currentBpi,
        clearState: row.clearState,
        missCount: row.missCount,
        lastPlayedAt: row.scoreAt,
      },
      previous:
        prevEx !== null
          ? {
              exScore: prevEx,
              bpi: prevBpi,
              clearState: row.p_clearState,
              missCount: row.p_missCount,
            }
          : null,
      diff: {
        exScore: prevEx !== null ? currentEx - prevEx : currentEx,
        bpi:
          prevBpi !== null
            ? Math.round((currentBpi - prevBpi) * 100) / 100
            : Math.round((currentBpi + 15) * 100) / 100,
      },
      wrScore: row.wrScore,
      kaidenAvg: row.kaidenAvg,
      coef: row.coef,
    };
  }

  static mapToFlatSong(row: any): SongWithScore {
    return {
      songId: row.songId,
      title: row.title,
      notes: Number(row.notes || 0),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: row.difficultyLevel,
      releasedVersion: row.releasedVersion,
      logId: row.logId ? Number(row.logId) : null,
      exScore: row.exScore !== null ? Number(row.exScore) : null,
      bpi: row.bpi !== null ? Number(row.bpi) : null,
      clearState: row.clearState,
      missCount: row.missCount,
      scoreAt: row.scoreAt,
      wrScore: row.wrScore,
      kaidenAvg: row.kaidenAvg,
      coef: row.coef,
    };
  }

  getJstRange(dateString: string, unit: "day" | "week" | "month" = "day") {
    const baseDate = dayjs.tz(dateString);

    return {
      start: baseDate.startOf(unit).utc().toDate(),
      end: baseDate.endOf(unit).utc().toDate(),
      label: baseDate.format("YYYY-MM-DD"),
      unit,
    };
  }

  async getRangeNavigation(
    userId: string,
    version: string,
    range: { start: Date; end: Date; unit: "day" | "week" | "month" },
  ) {
    const { start, end, unit } = range;

    const [prevRangeLog, nextRangeLog] = await Promise.all([
      db
        .selectFrom("logs")
        .select(["createdAt"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", "<", start)
        .orderBy("createdAt", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select(["createdAt"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", ">", end)
        .orderBy("createdAt", "asc")
        .executeTakeFirst(),
    ]);

    return {
      prevDate: prevRangeLog
        ? dayjs.utc(prevRangeLog.createdAt).tz().format("YYYY-MM-DD")
        : null,
      nextDate: nextRangeLog
        ? dayjs.utc(nextRangeLog.createdAt).tz().format("YYYY-MM-DD")
        : null,
    };
  }

  async getBatchNavigation(
    userId: string,
    version: string,
    currentCreatedAt: Date,
    range?: { start: Date; end: Date; unit: "day" | "week" | "month" },
  ) {
    const [prevBatch, nextBatch, rangeNav] = await Promise.all([
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", "<", currentCreatedAt)
        .orderBy("createdAt", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", ">", currentCreatedAt)
        .orderBy("createdAt", "asc")
        .executeTakeFirst(),
      range
        ? this.getRangeNavigation(userId, version, range)
        : Promise.resolve({ prevDate: null, nextDate: null }),
    ]);

    return {
      prev: prevBatch || null,
      next: nextBatch || null,
      ...rangeNav,
    };
  }

  /**
   * 特定のバッチIDからログ情報を取得します
   */
  async findBatchById(batchId: string) {
    return await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("batchId", "=", batchId)
      .executeTakeFirst();
  }

  /**
   * 指定されたJSTの期間内に含まれる全てのバッチを取得します
   */
  async findBatchesInRange(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    return await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .orderBy("createdAt", "asc")
      .execute();
  }

  /**
   * スコア情報を取得します。比較対象（過去スコア）や最新定義（SongDef）を結合します。
   * @param options.batchIds 指定したバッチに含まれるスコアのみ取得する場合
   * @param options.targetTime 特定時点（スナップショット）のスコアを取得する場合
   */
  async getScoresWithDetails(
    userId: string,
    version: string,
    options: {
      batchIds?: string[];
      targetTime?: Date;
      comparisonTime?: Date;
    },
  ) {
    const { batchIds, targetTime, comparisonTime } = options;

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
              .where("sub.userId", "=", userId);

            if (comparisonTime) {
              return sub.where("sub.createdAt", "<", comparisonTime);
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
              "difficulty as l_defDiff",
              (eb) => eb.fn.max("defId").as("maxDefId"),
            ]);
          if (targetTime) {
            sub = sub.where("updatedAt", "<=", targetTime);
          } else {
            sub = sub.where("isCurrent", "=", 1);
          }
          return sub.groupBy(["songId", "difficulty"]).as("latest_sd");
        },
        (join) =>
          join
            .onRef("latest_sd.l_defSongId", "=", "s.songId")
            .onRef("latest_sd.l_defDiff", "=", "s.difficulty"),
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
        "prev.bpi as p_pbi",
        "prev.clearState as p_clearState",
        "prev.missCount as p_missCount",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ]);

    if (batchIds) {
      query = query
        .where("current.batchId", "in", batchIds)
        .where("current.logId", "in", (qb) =>
          qb
            .selectFrom("scores")
            .select((eb) => eb.fn.max("logId").as("logId"))
            .where("batchId", "in", batchIds)
            .groupBy("songId"),
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

    query = query.where((eb) =>
      eb.or([eb("s.deletedAt", "is", null), eb("s.deletedAt", ">", version)]),
    );

    return await query
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();
  }
}
