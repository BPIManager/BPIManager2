import { db } from "@/lib/db";
import { sql } from "kysely";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";

export type TowerRankingRawEntry = {
  userId: string;
  userName: string;
  profileImage: string | null;
  isPublic: number;
  iidxId: string | null;
  totalCount: number;
  keyCount: number;
  scratchCount: number;
};

/**
 * `iidxTower`と`users`を横断するランキング表示用の複合ビューを組み立てる。
 *
 * ランキング表示用の`userName`/`profileImage`/`isPublic`/`iidxId`等は
 * `users`ドメインのカラムのため、`domains/iidxTower`ではなくここに置く（#174）。
 */
export const iidxTowerAggregateRepo = {
  async getTowerRanking(params: {
    version: string;
    startDate: string;
    endDate: string;
  }): Promise<TowerRankingRawEntry[]> {
    const { version, startDate, endDate } = params;
    return db
      .selectFrom("iidxTower as t")
      .innerJoin("users as u", "t.userId", "u.userId")
      .select([
        ...userDisplayColumns("u"),
        "u.iidxId",
        sql<number>`SUM(t.keyCount + t.scratchCount)`.as("totalCount"),
        sql<number>`SUM(t.keyCount)`.as("keyCount"),
        sql<number>`SUM(t.scratchCount)`.as("scratchCount"),
      ])
      .where("t.version", "=", version)
      .where("t.playDate", ">=", new Date(startDate))
      .where("t.playDate", "<=", new Date(endDate))
      .groupBy([...userDisplayColumns("u"), "u.iidxId"])
      .orderBy(sql`SUM(t.keyCount + t.scratchCount)`, "desc")
      .execute();
  },
};
