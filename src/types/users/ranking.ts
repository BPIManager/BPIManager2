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

export interface SongRankEntry {
  songId: number;
  title: string;
  notes: number;
  bpm: string;
  difficulty: string;
  difficultyLevel: number;
  releasedVersion: string | null;
  logId: number;
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  lastPlayed: string;
  rank: number;
  totalPlayers: number;
}

export interface UserSongRankingsResponse {
  songs: SongRankEntry[];
}

export type TowerPeriod = "day" | "week" | "month";
export type TowerType = "total" | "key" | "scratch";

export interface TowerRankingEntry {
  rank: number;
  userId: string;
  userName: string;
  profileImage: string | null;
  isPublic: number;
  iidxId: string | null;
  totalCount: number;
  keyCount: number;
  scratchCount: number;
  isSelf: boolean;
}

export interface TowerRankingResponse {
  rankings: TowerRankingEntry[];
  totalCount: number;
  selfRank: number;
  startDate: string;
  endDate: string;
  viewerRadar: Record<string, { totalBpi: number; songs: unknown[] }>;
}
