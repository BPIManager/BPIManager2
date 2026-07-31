import { db } from "@/lib/db";

const DEFAULT_PRIVACY = {
  showArenaClass: 1,
  showArenaRank: 0,
  showArea: 0,
  showGrade: 0,
};

export type StatsPrivacyRow = {
  showArenaClass: number;
  showArenaRank: number;
  showArea: number;
  showGrade: number;
};

export async function getStatsPrivacy(userId: string): Promise<StatsPrivacyRow> {
  const row = await db
    .selectFrom("statsPrivacy")
    .select(["showArenaClass", "showArenaRank", "showArea", "showGrade"])
    .where("userId", "=", userId)
    .executeTakeFirst();

  return row
    ? {
        showArenaClass: row.showArenaClass,
        showArenaRank: row.showArenaRank,
        showArea: row.showArea,
        showGrade: row.showGrade,
      }
    : { ...DEFAULT_PRIVACY };
}

export async function upsertStatsPrivacy(
  userId: string,
  settings: Partial<StatsPrivacyRow>,
) {
  const values = { userId, ...DEFAULT_PRIVACY, ...settings };
  await db
    .insertInto("statsPrivacy")
    .values(values)
    .onDuplicateKeyUpdate(settings)
    .execute();
}
