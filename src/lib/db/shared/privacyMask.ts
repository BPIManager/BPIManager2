import { canViewUserData } from "@/lib/db/shared/visibility";

/**
 * 非公開ユーザーのランキング表示用に、ユーザー識別情報を匿名化してマスクする。
 *
 * `db/shared/songRanking.ts` と `pages/api/v1/users/[userId]/ranking/tower.ts` で
 * 同一のマスク処理（userId/userName/profileImageを非公開ユーザーの場合だけ置き換える）が
 * 重複していたため共通化した。閲覧者に関わらず結果が変わらない匿名ランキング用のため、
 * 自分自身であってもマスクする（`canViewUserData`をviewerId無しで呼び、isPublicのみで判定）。
 *
 * @param params.isPublic - 公開設定（truthy であれば公開）
 * @param params.userId - 元の userId（マスク時は使用されない）
 * @param params.userName - 元の userName
 * @param params.profileImage - 元の profileImage
 * @param params.anonId - マスク時に使う匿名 ID（呼び出し元で行ごとに一意な値を渡す）
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
