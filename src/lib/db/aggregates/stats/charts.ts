import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { sql } from "kysely";
import { currentSongDefSubquery } from "@/lib/db/shared/songDef";

/**
 * 統計ダッシュボード向けのチャート用データ（活動ヒートマップ・BPM分布・
 * BPI/プレイ数の日次推移等）を担当するリポジトリクラス。
 */
class StatsChartsRepository {
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
      .leftJoin(
        () =>
          currentSongDefSubquery()
            .select(["songId", "wrScore", "kaidenAvg", "coef", "mu", "sigma", "residualVar"])
            .as("def"),
        (join) => join.onRef("def.songId", "=", "m.songId"),
      )
      .select([
        "m.songId",
        "m.title",
        "m.difficulty",
        "m.bpm",
        "m.notes",
        "latest.bpi",
        "latest.exScore",
        "def.wrScore",
        "def.kaidenAvg",
        "def.coef",
        "def.mu",
        "def.sigma",
        "def.residualVar",
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
      .leftJoin(
        () =>
          currentSongDefSubquery()
            .select(["songId", "wrScore", "kaidenAvg", "coef"])
            .as("def"),
        (join) => join.onRef("def.songId", "=", "m.songId"),
      )
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
        // bpi(exScore)は曲ごとに単調増加なので、同じグループ内でmax(bpi)と
        // max(exScore)は同一行に対応する
        eb.fn.max("s.exScore").as("exScore"),
        // def.*はサブクエリ(派生テーブル)経由でsongIdに1:1のため実質集約不要だが、
        // MySQLのONLY_FULL_GROUP_BYの関数従属性判定が派生テーブルには及ばないため
        // max()で包んでおく
        eb.fn.max("def.wrScore").as("wrScore"),
        eb.fn.max("def.kaidenAvg").as("kaidenAvg"),
        eb.fn.max("def.coef").as("coef"),
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
}

export const statsChartsRepo = new StatsChartsRepository();
