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
  createdAt: Date;
  updatedAt: Date;
  followingCount: number;
  followerCount: number;
}
