export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  profileImage: string | null;
  isPublic: number;
  iidxId: string | null;
  totalBpi: number;
  arenaRank: string | null;
  isSelf: boolean;
}

export interface GlobalRankingResponse {
  rankings: RankingEntry[];
  totalCount: number;
  selfRank: number;
  viewerRadar: Record<string, { totalBpi: number; songs: unknown[] }>;
}

export interface SongRankingEntry {
  rank: number;
  userId: string;
  userName: string;
  profileImage: string | null;
  exScore: number | null;
  bpi: number | null;
  isSelf: boolean;
}

export interface SongRankingResponse {
  rankings: SongRankingEntry[];
  totalCount: number;
  selfRank: number;
}
