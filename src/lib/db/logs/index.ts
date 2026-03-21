import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * ログおよびスコア履歴に関するデータ操作を担当するリポジトリ
 */
class LogRepository {
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
    range: { start: Date; end: Date; unit: string },
    groupedBy: "createdAt" | "lastPlayed" = "createdAt",
  ) {
    const { start, end } = range;
    const isLastPlayed = groupedBy === "lastPlayed";
    const dateCol = isLastPlayed ? "lastPlayed" : "createdAt";
    const columns: ("lastPlayed" | "createdAt" | "totalBpi")[] = isLastPlayed
      ? [dateCol]
      : [dateCol, "totalBpi"];
    const table = isLastPlayed ? "scores" : "logs";

    const [prevRow, nextRow] = await Promise.all([
      db
        .selectFrom(table)
        .select(columns)
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where(dateCol, "<", start)
        .orderBy(dateCol, "desc")
        .executeTakeFirst(),
      db
        .selectFrom(table)
        .select(columns)
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where(dateCol, ">", end)
        .orderBy(dateCol, "asc")
        .executeTakeFirst(),
    ]);

    return {
      prevDate: prevRow,
      nextDate: nextRow,
    };
  }

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

  /**
   * ユーザーのタイムラインログ（BPI推移 + 各バッチのTOPnスコア）を取得 / バッチID基準
   */
  async getTimelineByBatches(params: {
    userId: string;
    version: string;
    topN?: number;
    since?: Date;
    until?: Date;
  }) {
    const { userId, version, topN = 5, since, until } = params;

    const rows = await db
      .selectFrom((qb) => {
        let base = qb
          .selectFrom("logs")
          .select([
            "id as l_id",
            "totalBpi as l_totalBpi",
            "batchId as l_batchId",
            "createdAt as l_createdAt",
            "version as l_version",
            sql<number | null>`LAG(totalBpi) OVER (ORDER BY createdAt ASC)`.as(
              "l_prevTotalBpi",
            ),
          ])
          .where("userId", "=", userId)
          .where("version", "=", version);

        if (since) base = base.where("createdAt", ">=", since);
        if (until) base = base.where("createdAt", "<=", until);

        return base.as("l_with_lag");
      })
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select([
              "batchId as sc_batchId",
              (eb) => eb.fn.count("logId").as("songCount"),
            ])
            .where("userId", "=", userId)
            .groupBy("batchId")
            .as("counts"),
        (join) => join.onRef("counts.sc_batchId", "=", "l_with_lag.l_batchId"),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores as sc")
            .innerJoin("songs as s", "s.songId", "sc.songId")
            .select([
              "sc.batchId as ts_batchId",
              "s.title as ts_title",
              "sc.bpi as ts_bpi",
              "sc.clearState as ts_clearState",
              sql`ROW_NUMBER() OVER (PARTITION BY sc.batchId ORDER BY sc.bpi DESC)`.as(
                "rn",
              ),
            ])
            .where("sc.userId", "=", userId)
            .as("ranked_scores"),
        (join) =>
          join.onRef("ranked_scores.ts_batchId", "=", "l_with_lag.l_batchId"),
      )
      .selectAll()
      .where((eb) => eb.or([eb("rn", "is", null), eb("rn", "<=", topN)]))
      .orderBy("l_createdAt", "desc")
      .orderBy("ts_bpi", "desc")
      .execute();

    return rows.reduce((acc, row) => {
      let log = acc.find((l) => l.batchId === row.l_batchId);
      if (!log) {
        const currentBpi = Number(row.l_totalBpi);
        const prevBpi =
          row.l_prevTotalBpi !== null ? Number(row.l_prevTotalBpi) : null;
        log = {
          id: row.l_id,
          batchId: row.l_batchId,
          version: Number(row.l_version),
          totalBpi: currentBpi,
          songCount: Number(row.songCount ?? 0),
          diff:
            prevBpi !== null
              ? Math.round((currentBpi - prevBpi) * 100) / 100
              : 0,
          createdAt: row.l_createdAt,
          topScores: [],
        };
        acc.push(log);
      }
      if (row.ts_title) {
        log.topScores.push({
          title: row.ts_title,
          bpi: Number(row.ts_bpi),
          clearState: row.ts_clearState,
        });
      }
      return acc;
    }, [] as any[]);
  }

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
   * フォロー中ライバルの楽曲ごと平均スコアを取得する
   */
  async getRivalAvgScores(params: { userId: string; version: string }) {
    const { userId, version } = params;

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
   * 自己歴代ベストスコアを全バージョン（または今作を除く全バージョン）から取得する。
   * @param userId ユーザーID
   * @param currentVersion 今作のバージョン番号 (excludeCurrent=true のとき除外対象)
   * @param excludeCurrent true のとき今作バージョンを除外する
   */
  async getBestEverScores(params: {
    userId: string;
    currentVersion: string;
    excludeCurrent: boolean;
  }) {
    const { userId, currentVersion, excludeCurrent } = params;
    let latestPerVersionSub = db
      .selectFrom("scores as sc")
      .select([
        "sc.songId",
        "sc.version",
        (eb) => eb.fn.max("sc.logId").as("latestLogId"),
      ])
      .where("sc.userId", "=", userId);

    if (excludeCurrent) {
      latestPerVersionSub = latestPerVersionSub.where(
        "sc.version",
        "!=",
        currentVersion,
      );
    }

    const latestPerVersion = latestPerVersionSub
      .groupBy(["sc.songId", "sc.version"])
      .as("lpv");
    const bestLogSub = db
      .selectFrom("scores as s2")
      .innerJoin(latestPerVersion, (join) =>
        join
          .onRef("s2.logId", "=", "lpv.latestLogId")
          .onRef("s2.songId", "=", "lpv.songId"),
      )
      .select([
        "s2.songId as b_songId",
        (eb) => eb.fn.max("s2.exScore").as("bestExScore"),
      ])
      .groupBy("s2.songId")
      .as("best");
    const bestScoreRow = db
      .selectFrom("scores as bs")
      .innerJoin(bestLogSub, (join) =>
        join
          .onRef("bs.songId", "=", "best.b_songId")
          .onRef("bs.exScore", "=", "best.bestExScore"),
      )
      .where("bs.userId", "=", userId)
      .select([
        "bs.songId as r_songId",
        "bs.version as r_version",
        (eb) => eb.fn.max("bs.logId").as("r_logId"),
      ])
      .groupBy("bs.songId")
      .as("bestRow");

    const rows = await db
      .selectFrom("scores as sc2")
      .innerJoin(bestScoreRow, (join) =>
        join
          .onRef("sc2.logId", "=", "bestRow.r_logId")
          .onRef("sc2.songId", "=", "bestRow.r_songId"),
      )
      .innerJoin("songs as sg", "sg.songId", "sc2.songId")
      .leftJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "sc2.songId").on("sd.isCurrent", "=", 1),
      )
      .select([
        "sg.songId",
        "sg.title",
        "sg.notes",
        "sg.bpm",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.releasedVersion",
        "sc2.exScore as bestExScore",
        "sc2.bpi as bestBpi",
        "sc2.version as bestVersion",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .execute();

    return rows;
  }

  async getSelfVersionScores(params: {
    userId: string;
    currentVersion: string;
    targetVersion: string;
  }) {
    const { userId, currentVersion, targetVersion } = params;

    const rows = await db
      .selectFrom("songs as s")
      .innerJoin(
        (qb) => {
          return qb
            .selectFrom("songDef")
            .select([
              "songId as l_defSongId",
              (eb) => eb.fn.max("defId").as("maxDefId"),
            ])
            .where("isCurrent", "=", 1)
            .groupBy("songId")
            .as("latest_sd");
        },
        (join) => join.onRef("latest_sd.l_defSongId", "=", "s.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .leftJoin("scores as cur", (join) =>
        join
          .onRef("cur.songId", "=", "s.songId")
          .on("cur.userId", "=", userId)
          .on("cur.version", "=", currentVersion)
          .on("cur.logId", "=", (eb) =>
            eb
              .selectFrom("scores as c2")
              .select((s) => s.fn.max("logId").as("m"))
              .where("c2.userId", "=", userId)
              .where("c2.version", "=", currentVersion)
              .whereRef("c2.songId", "=", "s.songId"),
          ),
      )
      .leftJoin("scores as prev", (join) =>
        join
          .onRef("prev.songId", "=", "s.songId")
          .on("prev.userId", "=", userId)
          .on("prev.version", "=", targetVersion)
          .on("prev.logId", "=", (eb) =>
            eb
              .selectFrom("scores as p2")
              .select((s) => s.fn.max("logId").as("m"))
              .where("p2.userId", "=", userId)
              .where("p2.version", "=", targetVersion)
              .whereRef("p2.songId", "=", "s.songId"),
          ),
      )
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "cur.exScore as myExScore",
        "cur.bpi as myBpi",
        "cur.clearState as myClearState",
        "cur.missCount as myMissCount",
        "cur.lastPlayed as myLastPlayed",
        "prev.exScore as prevExScore",
        "prev.bpi as prevBpi",
        "prev.clearState as prevClearState",
        "prev.missCount as prevMissCount",
        "prev.lastPlayed as prevLastPlayed",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .where((eb) =>
        eb.or([
          eb("s.deletedAt", "is", null),
          eb("s.deletedAt", ">", currentVersion),
        ]),
      )
      .where((eb) =>
        eb.or([
          eb("cur.exScore", "is not", null),
          eb("prev.exScore", "is not", null),
        ]),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();

    return rows;
  }
}

export const logsRepo = new LogRepository();
