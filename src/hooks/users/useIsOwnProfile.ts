import { useUser } from "@/contexts/users/UserContext";

/**
 * 閲覧中のプロフィールが自分自身のものかどうかを判定する。
 *
 * `router.query.userId` は `string | string[] | undefined` になり得るため、
 * ここで正規化した上で Firebase の uid と比較する。
 *
 * @param userId - 比較対象のユーザー ID（`router.query.userId` 等）
 * @returns 自分自身のプロフィールであれば `true`
 */
export const useIsOwnProfile = (
  userId: string | string[] | undefined,
): boolean => {
  const { fbUser } = useUser();
  const normalizedUserId = typeof userId === "string" ? userId : undefined;

  return !!fbUser?.uid && fbUser.uid === normalizedUserId;
};
