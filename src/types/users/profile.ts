export interface UserRoleInfo {
  role: string;
  description: string;
  grantedAt: string | Date;
}

export interface UserProfileHistory {
  version: string;
  totalBpi: number | null;
  arenaRank: string;
  updatedAt: string | Date;
}

export interface UserRelationship {
  isFollowing: boolean;
  isFollowed: boolean;
  isSelf: boolean;
  isMutual: boolean;
  isFollowedBy: boolean;
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
  history: UserProfileHistory[];
  current: UserProfileHistory | null;
  follows: {
    following: number;
    followers: number;
  };
  relationship: UserRelationship;
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
}
