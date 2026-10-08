import { db } from "@/lib/db";
import { sql } from "kysely";

export interface TopRankerAreaCount {
  version: string;
  areaId: number;
  difficulty: string;
  difficultyLevel: number;
  count: number;
}

export const topRankersSummaryRepo = {
  /** プレイヤーが1位を獲得している譜面数を、バージョン×エリア×難易度×レベルごとに集計する（難易度・レベルは`allSongs`から引く） */
  async getAreaCounts(iidxId: string): Promise<TopRankerAreaCount[]> {
    const rows = await db
      .selectFrom("topRankers as t")
      .innerJoin("allSongs as s", "s.songId", "t.songId")
      .select([
        "t.version",
        "t.areaId",
        "s.difficulty",
        "s.difficultyLevel",
        sql<number>`COUNT(*)`.as("count"),
      ])
      .where("t.iidxId", "=", iidxId)
      .groupBy(["t.version", "t.areaId", "s.difficulty", "s.difficultyLevel"])
      .execute();
    return rows.map((r) => ({ ...r, count: Number(r.count) }));
  },
};
