import type { UserRoleInfo } from "./profile";

/** ライバル検索のrange絞り込み対象キー（総合BPI + レーダー6カテゴリ） */
export type RadarFilterKey =
  | "totalBpi"
  | "notes"
  | "chord"
  | "peak"
  | "charge"
  | "scratch"
  | "soflan";

export interface RadarFilterRange {
  min?: number;
  max?: number;
}

export const RADAR_FILTER_KEYS: readonly RadarFilterKey[] = [
  "totalBpi",
  "notes",
  "chord",
  "peak",
  "charge",
  "scratch",
  "soflan",
];

/** フォロー候補ユーザーの1件分 */
export interface RecommendedUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  arenaClass: string | null;
  totalBpi: number;
  iidxId: string;
  /** レーダーカテゴリ別スコアマップ */
  radar: Record<string, number>;
  updatedAt: string;
  role: UserRoleInfo | null;
}
