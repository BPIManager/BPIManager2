import { latestVersion } from "@/constants/iidx/iidxVersions";
import { notificationsAggregateRepo } from "@/lib/db/aggregates/notifications";
import { ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { NotificationCountResponse } from "@/types/users/notifications";

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
