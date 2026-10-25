import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * 指定期間にプレイ記録(`lastPlayed`)のあるスコアを、楽曲情報付きで時系列に返す。
 * scores と songs の結合を伴う読み取りのため aggregates に置く。
 */
export const performanceRepo = {
  async getPlaysInRange(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    const rows = await db
      .selectFrom("scores as s")
      .innerJoin("songs", "songs.songId", "s.songId")
      .select([
        "s.songId",
        "songs.title",
        "songs.difficulty",
        "songs.difficultyLevel",
        "s.exScore",
        "s.bpi",
        sql<number>`UNIX_TIMESTAMP(s.lastPlayed) * 1000`.as("playedAt"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.lastPlayed", ">=", start)
      .where("s.lastPlayed", "<=", end)
      .orderBy("s.lastPlayed", "asc")
      .orderBy("s.logId", "asc")
      .execute();
    return rows.map((r) => ({
      songId: r.songId,
      title: r.title,
      difficulty: r.difficulty,
      level: r.difficultyLevel,
      exScore: r.exScore,
      bpi: r.bpi === null ? null : Number(r.bpi),
      playedAt: Number(r.playedAt),
    }));
  },

  /** ☆12の曲ごとの日別(JST)最良単曲BPI。「今日のBPI」を日単位で集計するための素材 */
  async getLevel12BpisInRange(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    const jstDate = sql<string>`DATE_FORMAT(CONVERT_TZ(s.lastPlayed, '+00:00', '+09:00'), '%Y-%m-%d')`;
    const rows = await db
      .selectFrom("scores as s")
      .innerJoin("songs", "songs.songId", "s.songId")
      .select([
        jstDate.as("playDate"),
        "s.songId",
        (eb) => eb.fn.max("s.bpi").as("bpi"),
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("songs.difficultyLevel", "=", 12)
      .where("s.bpi", "is not", null)
      .where("s.lastPlayed", ">=", start)
      .where("s.lastPlayed", "<=", end)
      .groupBy([jstDate, "s.songId"])
      .execute();
    return rows.map((r) => ({
      playDate: String(r.playDate),
      bpi: Number(r.bpi),
    }));
  },
};
