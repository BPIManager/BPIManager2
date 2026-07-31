import { db } from "@/lib/db";

/**
 * `songs`・`songDef`・`scores`を横断し、指定ユーザーがまだプレイしていない楽曲を
 * 曲定義（WRスコア・皆伝平均・補正係数）付きで取得するリポジトリクラス。
 *
 * `domains/songs`・`domains/scores`いずれの単一責務にも収まらないクロスドメイン
 * 参照のため、`aggregates/`に配置する。
 */
class UnplayedSongsAggregateRepository {
  /**
   * 指定ユーザー・バージョンで未プレイの楽曲一覧を取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号文字列
   */
  async getUnplayedSongs(userId: string, version: string) {
    return await db
      .selectFrom("songs as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("songDef")
            .select([
              "songId as l_defSongId",
              (eb) => eb.fn.max("defId").as("maxDefId"),
            ])
            .where("isCurrent", "=", 1)
            .groupBy("songId")
            .as("latest_sd"),
        (join) => join.onRef("latest_sd.l_defSongId", "=", "s.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores as sc")
            .select([
              "sc.songId as sc_songId",
              "sc.exScore",
              "sc.bpi",
              "sc.clearState",
              "sc.missCount",
              "sc.lastPlayed",
              "sc.logId",
            ])
            .where("sc.userId", "=", userId)
            .where("sc.version", "=", version)
            .where("sc.logId", "=", (eb) =>
              eb
                .selectFrom("scores as sc2")
                .select((s) => s.fn.max("logId").as("m"))
                .where("sc2.userId", "=", userId)
                .where("sc2.version", "=", version)
                .whereRef("sc2.songId", "=", "sc.songId"),
            )
            .as("my"),
        (join) => join.onRef("my.sc_songId", "=", "s.songId"),
      )
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .where("my.sc_songId", "is", null)
      .where((eb) =>
        eb.or([eb("s.deletedAt", "is", null), eb("s.deletedAt", ">", version)]),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();
  }
}

export const unplayedSongsAggregateRepo = new UnplayedSongsAggregateRepository();
