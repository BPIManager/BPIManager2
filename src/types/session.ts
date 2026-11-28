import { UserRoleInfo } from "./users/profile";

export interface Session {
  userId: string;
  userName: string;
  profileText: string | null;
  profileImage: string | null;
  arenaRank: string | null;
  totalBpi: number | null;
  iidxId: string | null;
  xId: string | null;
  isPublic: number;
  /** オプション統計への参加（1: 提供する、0: 提供しない） */
  optionStats: number;
  createdAt: Date;
  updatedAt: Date;
  followingCount: number;
  followerCount: number;
  role: UserRoleInfo | null;
}
