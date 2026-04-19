import { followsRepo } from "@/lib/db/follow";
import type { FollowsQuery } from "@/schemas/follows/query";
import { NextApiResponse } from "next";

/**
 * フォロー・フォロワー一覧を取得する API サブハンドラー。
 *
 * クエリパラメータ `type`（`"following"` | `"followers"`）、`page`、`limit` を受け取り、
 * ページネーションされた結果を返す。
 *
 * @param req - Next.js API リクエスト
 * @param res - Next.js API レスポンス
 * @param targetUserId - 一覧を取得する対象ユーザーの ID
 * @param viewerId - 閲覧者のユーザー ID（未認証の場合は省略）
 */
export async function handleGetFollows(
  res: NextApiResponse,
  targetUserId: string,
  viewerId: string | undefined,
  query: FollowsQuery,
) {
  const result = await followsRepo.getFollowList({
    targetUserId,
    viewerId,
    type: query.type,
    page: query.page,
    limit: query.limit,
  });

  return res.status(200).json(result);
}

/**
 * フォローを実行する API サブハンドラー。
 *
 * 既にフォロー済みの場合や自分自身へのフォローはエラーを返す。
 *
 * @param res - Next.js API レスポンス
 * @param targetUserId - フォロー対象ユーザーの ID
 * @param viewerId - フォローを行うユーザーの ID
 */
export async function handlePutFollow(
  res: NextApiResponse,
  targetUserId: string,
  viewerId: string,
) {
  if (viewerId === targetUserId) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const isAlreadyFollowing = await followsRepo.isFollowing(
    viewerId,
    targetUserId,
  );
  if (isAlreadyFollowing) {
    return res
      .status(200)
      .json({ success: true, isFollowing: true, message: "Already followed" });
  }

  const isFollowed = await followsRepo.toggleFollow(viewerId, targetUserId);
  return res
    .status(200)
    .json({ success: true, isFollowing: isFollowed, message: "Followed" });
}

/**
 * フォロー解除を実行する API サブハンドラー。
 *
 * 既にフォロー解除済みの場合はそのまま成功レスポンスを返す。
 *
 * @param res - Next.js API レスポンス
 * @param targetUserId - フォロー解除対象ユーザーの ID
 * @param viewerId - フォロー解除を行うユーザーの ID
 */
export async function handleDeleteFollow(
  res: NextApiResponse,
  targetUserId: string,
  viewerId: string,
) {
  const isCurrentlyFollowing = await followsRepo.isFollowing(
    viewerId,
    targetUserId,
  );
  if (!isCurrentlyFollowing) {
    return res.status(200).json({
      success: true,
      isFollowing: false,
      message: "Already unfollowed",
    });
  }

  const isFollowed = await followsRepo.toggleFollow(viewerId, targetUserId);
  return res
    .status(200)
    .json({ success: true, isFollowing: isFollowed, message: "Unfollowed" });
}
