import { db } from "@/lib/db";
import { latestLogIdPerSongSubquery, latestLogIdPerUserSongSubquery } from "@/lib/db/shared/latestScore";
import { logsRepo } from "@/lib/db/domains/logs";

/**
 * 統計ダッシュボード向けの近傍ユーザー比較を担当するリポジトリクラス
 * （#182で`stats/index.ts`から分割）。
 */
class StatsSocialRepository {
  async getNeighborIds(
    userTotalBpi: number,
    userId: string,
    version: string,
    n: number,
  ): Promise<string[]> {
    return logsRepo.getUserIdsOrderedByBpiDistance(
      version,
      userId,
      userTotalBpi,
      n,
    );
  }

  // scores・songs・songDefを横断JOINした近傍ユーザーとのスコア比較集計のため、直接クエリを維持する。
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
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("userLatest"),
        (join) => join.onRef("userLatest.maxLogId", "=", "s.logId"),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores as ns")
            .innerJoin(
              latestLogIdPerUserSongSubquery({
                table: "scores",
                version,
                userIds: neighborIds,
              }).as("nLatest"),
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
}

export const statsSocialRepo = new StatsSocialRepository();
