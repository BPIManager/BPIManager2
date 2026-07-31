import { db } from "@/lib/db";
import { sql } from "kysely";

type TowerRow = { playDate: string; keyCount: number; scratchCount: number };

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

export const iidxTowerRepo = {
  async upsertRows(
    userId: string,
    version: string,
    rows: TowerRow[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    await db
      .insertInto("iidxTower")
      .values(rows.map((r) => ({ userId, version, ...r })))
      .onDuplicateKeyUpdate({
        keyCount: sql`VALUES(keyCount)`,
        scratchCount: sql`VALUES(scratchCount)`,
        updatedAt: sql`NOW()`,
      })
      .execute();
    return rows.length;
  },

  async getByUser(userId: string, version?: string) {
    let query = db
      .selectFrom("iidxTower")
      .select(["version", "playDate", "keyCount", "scratchCount", "updatedAt"])
      .where("userId", "=", userId);
    if (version) query = query.where("version", "=", version);
    return query.orderBy("playDate", "desc").execute();
  },

  async getLatest(userId: string, version: string, limit = 30) {
    return db
      .selectFrom("iidxTower")
      .select(["playDate", "keyCount", "scratchCount"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("playDate", "desc")
      .limit(limit)
      .execute();
  },

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
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.isPublic",
        "u.iidxId",
        sql<number>`SUM(t.keyCount + t.scratchCount)`.as("totalCount"),
        sql<number>`SUM(t.keyCount)`.as("keyCount"),
        sql<number>`SUM(t.scratchCount)`.as("scratchCount"),
      ])
      .where("t.version", "=", version)
      .where("t.playDate", ">=", new Date(startDate))
      .where("t.playDate", "<=", new Date(endDate))
      .groupBy([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.isPublic",
        "u.iidxId",
      ])
      .orderBy(sql`SUM(t.keyCount + t.scratchCount)`, "desc")
      .execute();
  },
};
