import { db } from "@/lib/db";
import type { NewOfficialArenaStat } from "@/types/db";
import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";

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
  const latestMap = await fetchLatestByUserIds(userIds, version);

  const toInsert = records.filter((r) => {
    const latest = latestMap.get(r.userId);
    if (!latest) return true;
    // 同じ fetchedAt ウィンドウでは重複挿入しない（サーバー再起動対策）
    if (latest.fetchedAt.getTime() === (r.fetchedAt as Date).getTime()) return false;
    return (
      latest.arenaClass !== r.arenaClass ||
      latest.area !== r.area ||
      latest.gradeSp !== r.gradeSp ||
      latest.gradeDp !== r.gradeDp ||
      latest.arenaRank !== r.arenaRank ||
      latest.wins !== r.wins
    );
  });

  if (toInsert.length > 0) {
    await db.insertInto("officialArenaStats").values(toInsert).execute();
  }

  return {
    inserted: toInsert.length,
    skipped: records.length - toInsert.length,
  };
}

export async function getArenaStatsHistory(
  userId: string,
  version: string,
  start: Date,
  end: Date,
) {
  return db
    .selectFrom("officialArenaStats")
    .select(["fetchedAt", "arenaClass", "arenaRank", "wins"])
    .where("userId", "=", userId)
    .where("version", "=", version)
    .where("fetchedAt", ">=", start)
    .where("fetchedAt", "<=", end)
    .orderBy("fetchedAt", "asc")
    .execute();
}

async function fetchLatestByUserIds(userIds: string[], version: string) {
  const rows = await db
    .selectFrom("officialArenaStats as oas")
    .innerJoin(
      db
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
      "oas.fetchedAt",
    ])
    .execute();

  return new Map(rows.map((r) => [r.userId, r]));
}
