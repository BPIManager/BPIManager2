import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * サイト統計ダッシュボードの楽曲人気ランキング（12レベル帯のプレイ人口）を
 * 担当するリポジトリクラス（#183で`siteStats/index.ts`から分割）。
 */
class SiteStatsSongPopulationRepository {
  // scores・songsを横断JOINしたプレイ人口ランキング集計のため、直接参照を維持する。
  async getSongPopulationPage(
    order: "top" | "bottom",
    offset: number,
    limit: number,
  ) {
    const dir = order === "top" ? "desc" : "asc";
    const rows = await db
      .selectFrom("scores as s")
      .innerJoin("songs as sg", "s.songId", "sg.songId")
      .select([
        "s.songId",
        "sg.title",
        "sg.difficulty",
        sql<number>`COUNT(DISTINCT s.userId)`.as("playerCount"),
      ])
      .where("sg.difficultyLevel", "=", 12)
      .groupBy(["s.songId", "sg.title", "sg.difficulty"])
      .orderBy(sql`COUNT(DISTINCT s.userId)`, dir)
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((r) => ({
      songId: r.songId,
      title: r.title,
      difficulty: r.difficulty,
      playerCount: Number(r.playerCount),
    }));
  }

  // scores・songsを横断JOINしたプレイ人口集計のため、直接参照を維持する。
  async getSongPopulationTotal() {
    const result = await db
      .selectFrom("scores as s")
      .innerJoin("songs as sg", "s.songId", "sg.songId")
      .select(sql<number>`COUNT(DISTINCT s.songId)`.as("count"))
      .where("sg.difficultyLevel", "=", 12)
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }
}

export const siteStatsSongPopulationRepo =
  new SiteStatsSongPopulationRepository();
