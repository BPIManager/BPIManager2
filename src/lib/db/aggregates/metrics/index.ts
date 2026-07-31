import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * Arena メトリクス生成に使用する集計クエリを担当するリポジトリクラス。
 */
class MetricsRepository {
  /**
   * 現在有効な曲定義（`songDef.isCurrent = 1`）を楽曲マスタと結合して取得する。
   *
   * @returns タイトル・難易度・ノーツ数・皆伝平均・WR スコア・補正係数の配列
   */
  async getSongDefs() {
    return await db
      .selectFrom("songDef as sd")
      .innerJoin("songs as s", "s.songId", "sd.songId")
      .select([
        "s.title",
        "s.difficulty",
        "s.notes",
        "sd.kaidenAvg",
        "sd.wrScore",
        "sd.coef",
      ])
      .where("sd.isCurrent", "=", 1)
      .execute();
  }

  /**
   * 全楽曲のタイトル・難易度・ノーツ数を取得する。
   *
   * @returns `{ title, difficulty, notes }` の配列
   */
  async getAllSongs() {
    return await db
      .selectFrom("songs")
      .select(["title", "difficulty", "notes"])
      .execute();
  }

  /**
   * 指定バージョン・難易度レベルにおけるアリーナランク別の平均スコアを集計する。
   *
   * 対象ランクは A1〜A5。`bkScores`・`bkUsers` テーブル（バックアップデータ）を使用する。
   * 過去バージョンのデータ生成に使用する。
   *
   * @param version - バージョン番号
   * @param difficultyLevel - 難易度レベル（11 または 12）
   * @returns タイトル・難易度・ランク・平均スコア・サンプル数の配列
   */
  async getArenaAverageScores(version: string, difficultyLevel: number) {
    return await this.buildArenaAverageQuery(
      version,
      difficultyLevel,
    ).execute();
  }

  /**
   * 指定バージョン・難易度レベルにおけるアリーナランク別の平均スコアを集計する。
   *
   * 対象ランクは A1〜A5。`scores`・`songs`・`bkUsers` テーブルを使用する。
   * 最新バージョンのデータ生成に使用する。
   *
   * @param version - バージョン番号
   * @param difficultyLevel - 難易度レベル（11 または 12）
   * @returns タイトル・難易度・ランク・平均スコア・サンプル数の配列
   */
  async getArenaAverageScoresFromScores(
    version: string,
    difficultyLevel: number,
  ) {
    return await this.buildArenaAverageQueryFromScores(
      version,
      difficultyLevel,
    ).execute();
  }

  private buildArenaAverageQuery(version: string, difficultyLevel: number) {
    return db
      .selectFrom("bkScores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("officialArenaStats as oas")
            .innerJoin(
              (qb2) =>
                qb2
                  .selectFrom("officialArenaStats")
                  .select([
                    "userId",
                    (eb) => eb.fn.max("fetchedAt").as("maxFetchedAt"),
                  ])
                  .where("version", "=", version)
                  .groupBy("userId")
                  .as("m"),
              (join) =>
                join
                  .onRef("m.userId", "=", "oas.userId")
                  .onRef("m.maxFetchedAt", "=", "oas.fetchedAt"),
            )
            .select([
              "oas.userId",
              sql<string>`oas.arenaClass`.as("arenarank"),
            ])
            .where("oas.version", "=", version)
            .as("u"),
        (join) => join.onRef("u.userId", "=", "s.userId"),
      )
      .innerJoin("songs as sg", (join) =>
        join
          .onRef("sg.title", "=", "s.title")
          .onRef("sg.difficulty", "=", "s.difficulty"),
      )
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("bkScores")
            .select([
              "title",
              "difficulty",
              "userId",
              (eb) => eb.fn.max("logId").as("maxLogId"),
            ])
            .where("version", "=", version)
            .where("difficultyLevel", "=", difficultyLevel)
            .groupBy(["title", "difficulty", "userId"])
            .as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "s.title",
        "s.difficulty",
        sql<string>`u.arenarank`.as("arenarank"),
        sql<number>`AVG(s.exScore)`.as("avgExScore"),
        sql<number>`COUNT(s.userId)`.as("sampleSize"),
      ])
      .where("s.version", "=", version)
      .where("s.difficultyLevel", "=", difficultyLevel)
      .where(sql`u.arenarank`, "in", ["A1", "A2", "A3", "A4", "A5"])
      .where("sg.releasedVersion", "<=", Number(version))
      .groupBy(sql`s.title, s.difficulty, u.arenarank`);
  }

  private buildArenaAverageQueryFromScores(
    version: string,
    difficultyLevel: number,
  ) {
    return db
      .selectFrom("scores as s")
      .innerJoin("songs as sg", "s.songId", "sg.songId")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("officialArenaStats as oas")
            .innerJoin(
              (qb2) =>
                qb2
                  .selectFrom("officialArenaStats")
                  .select([
                    "userId",
                    (eb) => eb.fn.max("fetchedAt").as("maxFetchedAt"),
                  ])
                  .where("version", "=", version)
                  .groupBy("userId")
                  .as("m"),
              (join) =>
                join
                  .onRef("m.userId", "=", "oas.userId")
                  .onRef("m.maxFetchedAt", "=", "oas.fetchedAt"),
            )
            .select([
              "oas.userId",
              sql<string | null>`oas.arenaClass`.as("arenarank"),
            ])
            .where("oas.version", "=", version)
            .as("u"),
        (join) => join.onRef("u.userId", "=", "s.userId"),
      )
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores as s2")
            .innerJoin("songs as sg2", "s2.songId", "sg2.songId")
            .select([
              "s2.songId",
              "s2.userId",
              (eb) => eb.fn.max("s2.logId").as("maxLogId"),
            ])
            .where("s2.version", "=", version)
            .where("sg2.difficultyLevel", "=", difficultyLevel)
            .groupBy(["s2.songId", "s2.userId"])
            .as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "sg.title",
        "sg.difficulty",
        sql<string | null>`u.arenarank`.as("arenarank"),
        sql<number>`AVG(s.exScore)`.as("avgExScore"),
        sql<number>`COUNT(s.userId)`.as("sampleSize"),
      ])
      .where("s.version", "=", version)
      .where("sg.difficultyLevel", "=", difficultyLevel)
      .where("sg.releasedVersion", "<=", Number(version))
      .where(sql`u.arenarank`, "in", ["A1", "A2", "A3", "A4", "A5"])
      .groupBy(sql`sg.title, sg.difficulty, u.arenarank`);
  }
}

export const metricsRepo = new MetricsRepository();
