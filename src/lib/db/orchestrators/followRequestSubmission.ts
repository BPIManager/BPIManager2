import { db } from "@/lib/db";
import { usersRepo } from "@/lib/db/domains/users";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";

export type SubmitFollowRequestResult =
  | { status: "requested" }
  | { status: "followed" }
  | { status: "invalid_token" }
  | { status: "self" }
  | { status: "target_not_found" };

/**
 * 招待URLのトークンからフォローリクエストを送信する。発行後に公開設定へ変わっていた場合は承認を待たず即時 follows を作る。
 * 古い招待URLでも保留リクエストが迷子にならないようにするため。
 *
 * @param requesterId - リクエストを送るユーザー ID
 * @param token - 招待URLのトークン
 */
export async function submitFollowRequest(
  requesterId: string,
  token: string,
): Promise<SubmitFollowRequestResult> {
  const invite = await followInviteLinksRepo.getByToken(token);
  if (!invite) return { status: "invalid_token" };

  const targetUserId = invite.userId;
  if (targetUserId === requesterId) return { status: "self" };

  const target = await usersRepo.getAccessInfo(targetUserId);
  if (!target) return { status: "target_not_found" };

  if (target.isPublic) {
    // isFollowing の事前チェック＋toggleFollow（反転）は連打等の同時呼び出しで解除に反転しうるため使わない。
     // 常にフォロー成立のみを意図するので、冪等な create（upsert）で成立させる。
    await db
      .transaction()
      .execute((trx) => followsRepo.create(trx, requesterId, targetUserId));
    return { status: "followed" };
  }

  // 非公開なら follows 行に加えて承認記録も確認する。承認記録の無い既存 follows は既フォロー扱いにせず、正規のリクエストとして再送信できるようにする。
  const hasApprovedAccess =
    await followAccessAggregateRepo.hasApprovedFollowAccess(
      requesterId,
      targetUserId,
    );
  if (hasApprovedAccess) return { status: "followed" };

  await followRequestsRepo.create(requesterId, targetUserId);
  return { status: "requested" };
}
