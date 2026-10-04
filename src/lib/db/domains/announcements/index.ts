import { db } from "@/lib/db";

/**
 * お知らせ本文（announcements）と、ユーザーごとの既読（announcementReads）の参照・更新。
 * 内容の追加・更新は SQL（INSERT / UPDATE）で行う。公開日時を過ぎ、isPublished = 1 のものだけを表示する。
 */
class AnnouncementsRepository {
  /**
   * 公開中のお知らせを新しい順に取得する。
   *
   * @param limit - 取得件数の上限
   */
  async listPublished(limit: number) {
    return await db
      .selectFrom("announcements")
      .select(["id", "title", "body", "linkUrl", "publishedAt"])
      .where("isPublished", "=", 1)
      .where("publishedAt", "<=", new Date())
      .orderBy("publishedAt", "desc")
      .orderBy("id", "desc")
      .limit(limit)
      .execute();
  }

  /**
   * 指定したお知らせのうち、ユーザーが既読にしたものの ID を返す。
   *
   * @param userId - ユーザー ID
   * @param announcementIds - 対象のお知らせ ID
   */
  async listReadIds(userId: string, announcementIds: number[]): Promise<number[]> {
    if (announcementIds.length === 0) return [];
    const rows = await db
      .selectFrom("announcementReads")
      .select("announcementId")
      .where("userId", "=", userId)
      .where("announcementId", "in", announcementIds)
      .execute();
    return rows.map((r) => r.announcementId);
  }

  /**
   * 指定したお知らせをまとめて既読にする（既読済みの行は読了日時だけ更新する）。
   *
   * @param userId - ユーザー ID
   * @param announcementIds - 既読にするお知らせ ID
   */
  async markRead(userId: string, announcementIds: number[]) {
    if (announcementIds.length === 0) return;
    await db
      .insertInto("announcementReads")
      .values(announcementIds.map((announcementId) => ({ userId, announcementId })))
      .onDuplicateKeyUpdate({ readAt: new Date() })
      .execute();
  }
}

export const announcementsRepo = new AnnouncementsRepository();
