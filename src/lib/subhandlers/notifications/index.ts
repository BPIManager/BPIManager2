import { latestVersion } from "@/constants/iidx/iidxVersions";
import { notificationsRepo } from "@/lib/db/domains/notifications";
import { notificationsAggregateRepo } from "@/lib/db/aggregates/notifications";
import { err, ok } from "@/middlewares/api/apiResult";
import { notificationsQuerySchema } from "@/schemas/notifications/query";
import type { HandlerResult } from "@/types/api";
import type { NotificationCountResponse } from "@/types/users/notifications";

type NotificationRows = Awaited<
  ReturnType<typeof notificationsAggregateRepo.getNotifications>
>;

/**
 * 通知のビジネスロジックを「`res` へ書き込む」形から切り離し、正規化した
 * `HandlerResult` を返す形にまとめたもの。v1/v2 のルートアダプタから共有する。
 */

/** 通知一覧をページネーション付きで取得する */
export async function getNotifications(
  userId: string,
  rawQuery: unknown,
): Promise<HandlerResult<NotificationRows>> {
  const parsed = notificationsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return err(
      400,
      parsed.error.issues[0]?.message ?? "Invalid query parameters",
    );
  }

  const { type, page, limit } = parsed.data;
  const items = await notificationsAggregateRepo.getNotifications({
    userId,
    type,
    limit,
    latestVersion,
    offset: page * limit,
  });

  return ok(items);
}

/** 全通知を既読にする（最終既読日時を更新する） */
export async function markNotificationsRead(
  userId: string,
): Promise<HandlerResult<{ success: true }>> {
  await notificationsRepo.updateLastRead(userId);
  return ok({ success: true });
}

/** 未読通知件数を取得する */
export async function getUnreadCount(
  userId: string,
): Promise<HandlerResult<NotificationCountResponse>> {
  const count = await notificationsAggregateRepo.getUnreadCount(
    userId,
    latestVersion,
  );
  return ok(count);
}
