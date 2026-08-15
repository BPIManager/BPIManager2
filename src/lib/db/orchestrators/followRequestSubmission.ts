import { usersRepo } from "@/lib/db/domains/users";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";

export type SubmitFollowRequestResult =
  | { status: "requested" }
  | { status: "followed" }
  | { status: "invalid_token" }
  | { status: "self" }
  | { status: "target_not_found" };

/**
 * 招待URLのトークンからフォローリクエストを送信する。
 *
 * 対象ユーザーが（招待発行後に）公開設定に変わっていた場合は、承認を待たず
 * 通常のフォローと同様に即時`follows`を作成する（招待URLが古くなっていても
 * 迷子の保留リクエストを残さないため）。
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

  const isAlreadyFollowing = await followsRepo.isFollowing(
    requesterId,
    targetUserId,
  );
  if (isAlreadyFollowing) return { status: "followed" };

  if (target.isPublic) {
    await followsRepo.toggleFollow(requesterId, targetUserId);
    return { status: "followed" };
  }

  await followRequestsRepo.create(requesterId, targetUserId);
  return { status: "requested" };
}
