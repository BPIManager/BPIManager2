import { canViewUserData } from "@/lib/db/shared/visibility";

/**
 * 非公開ユーザーのランキング表示用に、userId・userName・profileImage を匿名化してマスクする。
 * 閲覧者に依らず結果が同じ匿名ランキング用のため、自分自身でもマスクする（viewerId 無しで isPublic のみ判定）。
 *
 * @param params.isPublic - 公開設定（truthy であれば公開）
 * @param params.userId - 元の userId（マスク時は使用されない）
 * @param params.userName - 元の userName
 * @param params.profileImage - 元の profileImage
 * @param params.anonId - マスク時に使う匿名 ID（行ごとに一意な値を渡す）
 */
export function maskPrivateIdentity(params: {
  isPublic: number | boolean;
  userId: string;
  userName: string;
  profileImage: string | null;
  anonId: string;
}): { userId: string; userName: string; profileImage: string | null } {
  const isVisible = canViewUserData({
    targetUserId: params.userId,
    isPublic: params.isPublic,
  });
  return {
    userId: isVisible ? params.userId : params.anonId,
    userName: isVisible ? params.userName : "-",
    profileImage: isVisible ? params.profileImage : null,
  };
}
