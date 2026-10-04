import type { NextApiRequest } from "next";
import { ok } from "@/middlewares/api/apiResult";
import { announcementsRepo } from "@/lib/db/domains/announcements";
import { ANNOUNCEMENT_LIST_LIMIT } from "./list";
import { authUidOf } from "@/lib/subhandlers/auth/_shared";
import type { HandlerResult } from "@/types/api";

/**
 * POST /api/v2/announcements/read（ログイン必須）
 * 一覧に表示されているお知らせ（公開中の新しい順）を、まとめて既読にする。
 */
export async function handleMarkAnnouncementsRead(req: NextApiRequest): Promise<{
  result: HandlerResult<{ marked: number }>;
  targetUserId: string;
  viewerId: string;
}> {
  const uid = authUidOf(req);
  const rows = await announcementsRepo.listPublished(ANNOUNCEMENT_LIST_LIMIT);
  const ids = rows.map((r) => r.id);
  await announcementsRepo.markRead(uid, ids);
  return { result: ok({ marked: ids.length }), targetUserId: uid, viewerId: uid };
}
