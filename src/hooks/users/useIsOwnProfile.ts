import { useUser } from "@/contexts/users/UserContext";

/**
 * 閲覧中のプロフィールが自分自身かを判定する。router.query.userId は配列になりうるため正規化してから Firebase uid と比較する。
 *
 * @param userId - 比較対象のユーザー ID（router.query.userId 等）
 * @returns 自分自身のプロフィールであれば true
 */
export const useIsOwnProfile = (
  userId: string | string[] | undefined,
): boolean => {
  const { fbUser } = useUser();
  const normalizedUserId = typeof userId === "string" ? userId : undefined;

  return !!fbUser?.uid && fbUser.uid === normalizedUserId;
};
