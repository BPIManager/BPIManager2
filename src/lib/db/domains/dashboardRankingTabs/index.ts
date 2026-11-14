import { db } from "@/lib/db";

export interface DashboardRankingTabRow {
  tabKey: string | null;
  savedComparisonId: number | null;
  visible: boolean;
  targetIndex: number;
}

/**
 * ダッシュボードのランキングタブ設定（dashboardRankingTabs）の読み書き。行が無いユーザーは既定の並び・表示として扱う。
 */
class DashboardRankingTabsRepository {
  /** 並び順（sortOrder 昇順）で設定を取得する */
  async getAllForUser(userId: string) {
    const rows = await db
      .selectFrom("dashboardRankingTabs")
      .select(["tabKey", "savedComparisonId", "sortOrder", "visible", "targetIndex"])
      .where("userId", "=", userId)
      .orderBy("sortOrder", "asc")
      .orderBy("id", "asc")
      .execute();
    return rows.map((r) => ({ ...r, visible: r.visible === 1 }));
  }

  /** 設定を配列の順序で全置換する（DELETE + INSERT を同一トランザクションで実行） */
  async replaceAll(userId: string, tabs: DashboardRankingTabRow[]): Promise<void> {
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("dashboardRankingTabs").where("userId", "=", userId).execute();
      if (tabs.length === 0) return;
      await trx
        .insertInto("dashboardRankingTabs")
        .values(
          tabs.map((t, i) => ({
            userId,
            tabKey: t.tabKey,
            savedComparisonId: t.savedComparisonId,
            sortOrder: i,
            visible: t.visible ? 1 : 0,
            targetIndex: t.targetIndex,
          })),
        )
        .execute();
    });
  }
}

export const dashboardRankingTabsRepo = new DashboardRankingTabsRepository();
