import type { NextApiRequest } from "next";
import { ok } from "@/middlewares/api/apiResult";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { announcementsRepo } from "@/lib/db/domains/announcements";
import type { HandlerResult } from "@/types/api";
import type { AnnouncementsResponse } from "@/types/announcements";

/** お知らせ一覧の表示件数。古いものは一覧から外れる */
export const ANNOUNCEMENT_LIST_LIMIT = 20;

/**
 * GET /api/v2/announcements（未ログインでも取得できる）
 * ログイン中は既読状態と未読件数を返す。未ログインは未読件数を 0 とする。
 */
export async function handleListAnnouncements(req: NextApiRequest): Promise<{
  result: HandlerResult<AnnouncementsResponse>;
  targetUserId: string;
  viewerId: string | null;
}> {
  const uid = await resolveOptionalUid(req);
  const rows = await announcementsRepo.listPublished(ANNOUNCEMENT_LIST_LIMIT);
  const readIds = new Set(
    uid ? await announcementsRepo.listReadIds(uid, rows.map((r) => r.id)) : [],
  );

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    linkUrl: r.linkUrl && /^https?:\/\//i.test(r.linkUrl) ? r.linkUrl : null,
    publishedAt: r.publishedAt.toISOString(),
    isRead: readIds.has(r.id),
  }));
  const unreadCount = uid ? items.filter((i) => !i.isRead).length : 0;

  return {
    result: ok({ items, unreadCount }),
    targetUserId: uid,
    viewerId: uid || null,
  };
}
