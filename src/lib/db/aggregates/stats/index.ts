import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { sql } from "kysely";
import {
  correlatedLatestLogId,
  latestLogIdPerSongSubquery,
  latestLogIdPerUserSongSubquery,
} from "@/lib/db/shared/latestScore";
import { getSongRankingFromTable } from "@/lib/db/shared/songRanking";
import { logsRepo } from "@/lib/db/domains/logs";
import { songsRepo } from "@/lib/db/domains/songs";

/**
 * 統計ダッシュボード・分析画面向けのデータ取得を担当するリポジトリクラス。
 */
class StatsRepository {
  async getLatestTotalBpi(userId: string, version: string): Promise<number> {
    const result = await logsRepo.getLatestTotalBpi(userId, version);
    return result ? Number(result.totalBpi) : -15;
  }

  // songs・scores・songDefを横断JOINしたAAA表データ集計のため、直接クエリを維持する。
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
          .on("s.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "s2",
              songIdRef: "m.songId",
              version,
              userId,
            }),
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

  // scores・songsを横断JOINした日別プレイ数集計のため、直接クエリを維持する。
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

  // scores・songs・songDefを横断JOINした一覧取得のため、直接クエリを維持する。
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
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("latest"),
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

  // scores・songsを横断JOINしたスコア推移集計のため、直接クエリを維持する。
  // domains/scores からの委譲は廃止し、本メソッドを唯一の実装とした（#156）。
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
        "s.exScore",
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

  // songs・scoresを横断JOINしたBPM分布集計のため、直接クエリを維持する。
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

  async getSongRanking(songId: number, version: string, viewerId: string) {
    return getSongRankingFromTable({
      table: "scores",
      songId,
      version,
      viewerId,
    });
  }

  async getTotalSongCount(
    levels: number[],
    difficulties: string[],
  ): Promise<number> {
    return songsRepo.getCount(levels, difficulties);
  }

  // allScores・allSongsを横断JOINした全楽曲ランキング集計のため、直接クエリを維持する。
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

  // scores・songs・iidxTowerを横断JOINしたBPI推移・段位別プレイ量集計のため、直接クエリを維持する。
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

  async getFilteredSongKeys(
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ): Promise<Set<string>> {
    const rows = await songsRepo.getFilteredTitleDifficultyPairs(
      version,
      levels,
      difficulties,
    );
    return new Set(rows.map((r) => `${r.title}___${r.difficulty}`));
  }

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

export const statsRepo = new StatsRepository();
