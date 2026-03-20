import { db } from "@/lib/db";
import { sql } from "kysely";

class MetricsRepository {
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

  async getAllSongs() {
    return await db
      .selectFrom("songs")
      .select(["title", "difficulty", "notes"])
      .execute();
  }

  async getArenaAverageScores(version: string, difficultyLevel: number) {
    return await this.buildArenaAverageQuery(
      version,
      difficultyLevel,
    ).execute();
  }

  private buildArenaAverageQuery(version: string, difficultyLevel: number) {
    return db
      .selectFrom("bkScores as s")
      .innerJoin("bkUsers as u", "s.userId", "u.userId")
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
        "u.arenarank",
        sql<number>`AVG(s.exScore)`.as("avgExScore"),
        sql<number>`COUNT(s.userId)`.as("sampleSize"),
      ])
      .where("s.version", "=", version)
      .where("s.difficultyLevel", "=", difficultyLevel)
      .where("u.arenarank", "in", ["A1", "A2", "A3", "A4", "A5"])
      .groupBy(["s.title", "s.difficulty", "u.arenarank"]);
  }
}

export const metricsRepo = new MetricsRepository();
