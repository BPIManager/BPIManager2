export interface UserRoleInfo {
  role: string;
  description: string;
  grantedAt: string | Date;
}

export interface UserRelationship {
  isFollowing: boolean;
  isFollowed: boolean;
  isSelf: boolean;
  isMutual: boolean;
  isFollowedBy: boolean;
}

export interface StatEntry {
  version: string;
  arenaClass: string | null;
  arenaRank: number | null;
  area: string | null;
  gradeSp: string | null;
  gradeDp: string | null;
  totalBpi: number | null;
  updatedAt: Date | string | null;
  bestArenaClass: string | null;
  bestArenaClassAt: Date | string | null;
}

export interface StatsPrivacySettings {
  showArenaClass: boolean;
  showArenaRank: boolean;
  showArea: boolean;
  showGrade: boolean;
}

export interface AreaRankInfo {
  area: string;
  areaRank: number;
  totalInArea: number;
}

export interface UserProfileData {
  userId: string;
  userName: string;
  profileText: string | null;
  profileImage: string | null;
  iidxId: string | null;
  xId: string | null;
  isPublic: number;
  role: UserRoleInfo | null;
  follows: {
    following: number;
    followers: number;
  };
  relationship: UserRelationship;
  stats: StatEntry[];
  areaRank: AreaRankInfo | null;
}

export interface UserProfileCompare {
  winLoss: {
    win: number;
    loss: number;
    draw: number;
    total: number;
    winRate: number;
  } | null;
  radar: {
    NOTES: number;
    CHORD: number;
    PEAK: number;
    CHARGE: number;
    SCRATCH: number;
    SOFLAN: number;
  } | null;
}

export interface UserProfileResponse {
  profile: UserProfileData;
  compare?: UserProfileCompare;
  statsPrivacy?: StatsPrivacySettings;
}
