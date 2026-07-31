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

/**
 * ユーザーのプロフィール・統計ページ上でのARENA関連情報（クラス・ランク・エリア・段位）
 * の公開設定を取得する。未設定の場合はデフォルト値（クラスのみ公開）を返す。
 */
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

/**
 * ユーザーのARENA情報公開設定を作成・更新する。指定しなかった項目はデフォルト値で埋める。
 */
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
