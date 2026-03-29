import type { UserRoleInfo } from "./profile";

/** フォロー候補ユーザーの1件分 */
export interface RecommendedUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  arenaRank: string;
  totalBpi: number;
  iidxId: string;
  /** レーダーカテゴリ別スコアマップ */
  radar: Record<string, number>;
  updatedAt: string;
  role: UserRoleInfo | null;
}
