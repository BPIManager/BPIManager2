import { db } from "@/lib/db";
import type { Transaction } from "kysely";
import type { Database, NewOfficialArenaStat } from "@/types/db";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";

/**
 * 指定バージョンにおける各ユーザーの最新 `officialArenaStats` 行の ID を取得するサブクエリを組み立てる。
 */
export function latestPerUserSubquery(version: string) {
  return db
    .selectFrom("officialArenaStats")
    .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
    .where("version", "=", version)
    .groupBy("userId");
}

export async function getLatestArenaStatsPerVersion(userId: string) {
  return await db
    .selectFrom("officialArenaStats as oas")
    .innerJoin(
      db
        .selectFrom("officialArenaStats")
        .select(["version", db.fn.max("id").as("maxId")])
        .where("userId", "=", userId)
        .groupBy("version")
        .as("latest"),
      (join) =>
        join
          .onRef("oas.version", "=", "latest.version")
          .onRef("oas.id", "=", "latest.maxId"),
    )
    .where("oas.userId", "=", userId)
    .select([
      "oas.arenaClass",
      "oas.arenaRank",
      "oas.area",
      "oas.gradeSp",
      "oas.gradeDp",
      "oas.version",
      "oas.fetchedAt",
    ])
    .orderBy("oas.version", "desc")
    .execute();
}

export async function getBestArenaClassPerVersion(
  userId: string,
): Promise<Map<string, { arenaClass: string; fetchedAt: Date }>> {
  const rows = await db
    .selectFrom("officialArenaStats")
    .where("userId", "=", userId)
    .select(["version", "arenaClass", "fetchedAt"])
    .execute();

  const best = new Map<string, { arenaClass: string; fetchedAt: Date }>();
  for (const row of rows) {
    const order = ARENA_RANK_ORDER as readonly string[];
    const rowIdx = order.indexOf(row.arenaClass);
    if (rowIdx === -1) continue;
    const cur = best.get(row.version);
    if (!cur || rowIdx < order.indexOf(cur.arenaClass)) {
      best.set(row.version, {
        arenaClass: row.arenaClass,
        fetchedAt: row.fetchedAt,
      });
    }
  }
  return best;
}

export async function upsertOfficialArenaStats(
  records: NewOfficialArenaStat[],
): Promise<{ inserted: number; skipped: number }> {
  if (records.length === 0) return { inserted: 0, skipped: 0 };

  const version = String(records[0].version);
  const userIds = records.map((r) => r.userId);

  // 読み取り(FOR UPDATE)と書き込みを同一トランザクション内で行い、
  // 同一ユーザー・バージョンへの同時更新による重複行の混入を防ぐ。
  return await db.transaction().execute(async (trx) => {
    const latestMap = await fetchLatestByUserIds(trx, userIds, version);

    const toInsert = records.filter((r) => {
      const latest = latestMap.get(r.userId);
      if (!latest) return true;
      const fetchedAt =
        r.fetchedAt instanceof Date
          ? r.fetchedAt
          : new Date(r.fetchedAt as unknown as string);
      // 同じ fetchedAt ウィンドウでは重複挿入しない（サーバー再起動対策）
      if (latest.fetchedAt.getTime() === fetchedAt.getTime()) return false;
      return (
        latest.arenaClass !== r.arenaClass ||
        latest.area !== r.area ||
        latest.gradeSp !== r.gradeSp ||
        latest.gradeDp !== r.gradeDp ||
        latest.arenaRank !== r.arenaRank ||
        latest.wins !== r.wins ||
        latest.a1continue !== r.a1continue
      );
    });

    if (toInsert.length > 0) {
      await trx.insertInto("officialArenaStats").values(toInsert).execute();
    }

    return {
      inserted: toInsert.length,
      skipped: records.length - toInsert.length,
    };
  });
}

export async function getArenaStatsHistory(
  userId: string,
  version: string,
  start: Date,
  end: Date,
) {
  return db
    .selectFrom("officialArenaStats")
    .select(["fetchedAt", "arenaClass", "arenaRank", "wins", "a1continue"])
    .where("userId", "=", userId)
    .where("version", "=", version)
    .where("fetchedAt", ">=", start)
    .where("fetchedAt", "<=", end)
    .orderBy("fetchedAt", "asc")
    .execute();
}

async function fetchLatestByUserIds(
  trx: Transaction<Database>,
  userIds: string[],
  version: string,
) {
  const rows = await trx
    .selectFrom("officialArenaStats as oas")
    .innerJoin(
      trx
        .selectFrom("officialArenaStats")
        .select(["userId", db.fn.max("id").as("maxId")])
        .where("userId", "in", userIds)
        .where("version", "=", version)
        .groupBy("userId")
        .as("latest"),
      (join) =>
        join
          .onRef("oas.userId", "=", "latest.userId")
          .onRef("oas.id", "=", "latest.maxId"),
    )
    .select([
      "oas.userId",
      "oas.arenaClass",
      "oas.area",
      "oas.gradeSp",
      "oas.gradeDp",
      "oas.arenaRank",
      "oas.wins",
      "oas.a1continue",
      "oas.fetchedAt",
    ])
    .forUpdate()
    .execute();

  return new Map(rows.map((r) => [r.userId, r]));
}
