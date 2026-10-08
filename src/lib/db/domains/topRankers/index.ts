import { db } from "@/lib/db";
import { sql } from "kysely";

export interface TopRankerAreaCount {
  version: string;
  areaId: number;
  count: number;
}

export const topRankersRepo = {
  /** プレイヤーが1位を獲得している譜面数を、バージョン×エリアごとに集計する */
  async getAreaCounts(iidxId: string): Promise<TopRankerAreaCount[]> {
    const rows = await db
      .selectFrom("topRankers")
      .select([
        "version",
        "areaId",
        sql<number>`COUNT(*)`.as("count"),
      ])
      .where("iidxId", "=", iidxId)
      .groupBy(["version", "areaId"])
      .execute();
    return rows.map((r) => ({ ...r, count: Number(r.count) }));
  },
};
