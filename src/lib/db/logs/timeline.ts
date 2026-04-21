import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";

class ScoreTimelineRepository {
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
          .select((eb) => [
            "id as l_id",
            "totalBpi as l_totalBpi",
            "batchId as l_batchId",
            "createdAt as l_createdAt",
            "version as l_version",
            eb.fn
              .agg<number | null>("lag", [eb.ref("totalBpi")])
              .over((ob) => ob.orderBy("createdAt", "asc"))
              .as("l_prevTotalBpi"),
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
            .select((eb) => [
              "sc.batchId as ts_batchId",
              "s.title as ts_title",
              "sc.bpi as ts_bpi",
              "sc.clearState as ts_clearState",
              eb.fn
                .agg("row_number", [])
                .over((ob) =>
                  ob.partitionBy("sc.batchId").orderBy("sc.bpi", "desc"),
                )
                .as("rn"),
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
          version: row.l_version,
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
    currentVersion: IIDXVersion;
    targetVersion: string;
  }) {
    const { userId, currentVersion, targetVersion } = params;
    const isInf = currentVersion === "INF";

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
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("s.deletedAt", "is", null),
            eb("s.deletedAt", ">", currentVersion),
          ]),
        ),
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

export const timelineRepo = new ScoreTimelineRepository();
