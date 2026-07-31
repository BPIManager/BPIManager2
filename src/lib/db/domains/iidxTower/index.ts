import { db } from "@/lib/db";
import { sql } from "kysely";

type TowerRow = { playDate: string; keyCount: number; scratchCount: number };

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

  /**
   * 指定期間の段位（キー数・スクラッチ数・プレイ日数）を集計する。
   */
  async getRangeSummary(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ): Promise<{ totalKeys: number; totalScratches: number; playDays: number }> {
    const result = await db
      .selectFrom("iidxTower")
      .select([
        (eb) => eb.fn.sum<number>("keyCount").as("totalKeys"),
        (eb) => eb.fn.sum<number>("scratchCount").as("totalScratches"),
        (eb) => eb.fn.count<number>("playDate").as("playDays"),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("playDate", ">=", start)
      .where("playDate", "<=", end)
      .executeTakeFirst();
    return {
      totalKeys: Number(result?.totalKeys ?? 0),
      totalScratches: Number(result?.totalScratches ?? 0),
      playDays: Number(result?.playDays ?? 0),
    };
  },

  /**
   * 指定期間内の全ユーザー中でのキー数・スクラッチ数の順位を取得する。
   */
  async getRangeRanking(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ): Promise<{
    keysRank: number;
    scratchRank: number;
    totalUsers: number;
  } | null> {
    const result = await db
      .selectFrom((eb) =>
        eb
          .selectFrom((qb) =>
            qb
              .selectFrom("iidxTower")
              .select([
                "userId",
                (eb2) => eb2.fn.sum<number>("keyCount").as("totalKeys"),
                (eb2) =>
                  eb2.fn.sum<number>("scratchCount").as("totalScratches"),
              ])
              .where("version", "=", version)
              .where("playDate", ">=", start)
              .where("playDate", "<=", end)
              .groupBy("userId")
              .as("agg"),
          )
          .select((eb2) => [
            "agg.userId",
            "agg.totalKeys",
            "agg.totalScratches",
            eb2.fn
              .agg<number>("RANK")
              .over((ob) => ob.orderBy("agg.totalKeys", "desc"))
              .as("keysRank"),
            eb2.fn
              .agg<number>("RANK")
              .over((ob) => ob.orderBy("agg.totalScratches", "desc"))
              .as("scratchRank"),
            eb2.fn.countAll<number>().over().as("totalUsers"),
          ])
          .as("ranked"),
      )
      .select(["keysRank", "scratchRank", "totalUsers"])
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!result) return null;
    return {
      keysRank: Number(result.keysRank),
      scratchRank: Number(result.scratchRank),
      totalUsers: Number(result.totalUsers),
    };
  },

  /**
   * 指定期間の日別段位データ（キー数・スクラッチ数）を取得する。
   */
  async getDailyInRange(userId: string, version: string, start: Date, end: Date) {
    return db
      .selectFrom("iidxTower")
      .select(["playDate", "keyCount", "scratchCount"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("playDate", ">=", start)
      .where("playDate", "<=", end)
      .orderBy("playDate", "asc")
      .execute();
  },
};
