import { db } from "@/lib/db";

interface TimelineLogEntry {
  id: number;
  batchId: string;
  version: string;
  totalBpi: number;
  songCount: number;
  diff: number;
  createdAt: Date;
  topScores: { title: string; bpi: number; clearState: string | null }[];
}

/**
 * `logs`（バッチ）と `scores` を横断してユーザーのスコア推移タイムラインを集計するリポジトリクラス。
 */
class ScoreTimelineAggregateRepository {
  /**
   * ユーザーのタイムラインログ（BPI推移 + 各バッチのTOPnスコア）を取得 / バッチID基準
   */
  // logs・scores・songsを横断JOINしたタイムライン集計のため、直接クエリを維持する。
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
    }, [] as TimelineLogEntry[]);
  }
}

export const scoreTimelineRepo = new ScoreTimelineAggregateRepository();
