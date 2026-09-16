export type SiteStatsPeriod = "all" | "d90" | "d30" | "d7";

export interface SiteStatsSummary {
  totalUsers: number;
  newUsersToday: number;
  totalLogs: number;
  newLogsToday: number;
  totalAllScores: number;
  newAllScoresToday: number;
}

export interface DailyRegistration {
  date: string;
  users: number;
  logs: number;
  allScores: number;
  scores: number;
}

export interface ArenaRankEntry {
  rank: string;
  count: number;
}

export interface VersionScoreEntry {
  version: string;
  count: number;
}

export interface VersionScoreDistribution {
  versions: VersionScoreEntry[];
  total: number;
}

export interface HourlyEntry {
  hour: number;
  logs: number;
  allScores: number;
}

export interface WeekdayEntry {
  weekday: number;
  logs: number;
  allScores: number;
}

export interface SongPlayerEntry {
  songId: number;
  title: string;
  difficulty: string;
  playerCount: number;
}

export interface AreaEntry {
  area: string;
  count: number;
}

export interface TotalBpiHistogramBucket {
  bucketStart: number;
  bucketEnd: number;
  count: number;
}

export interface SiteStatsResponse {
  summary: SiteStatsSummary;
  dailyRegistrations: DailyRegistration[];
  /** バージョン番号 → ランク別カウント配列。データが無いバージョンはキー自体が無い */
  arenaRankDistribution: Record<string, ArenaRankEntry[]>;
  areaDistribution: AreaEntry[];
  versionScoreDistribution: VersionScoreDistribution;
  hourlyDistribution: Record<SiteStatsPeriod, HourlyEntry[]>;
  weekdayDistribution: Record<SiteStatsPeriod, WeekdayEntry[]>;
  /** バージョン番号 → 5刻みバケット配列（-15〜100）。データが無いバージョンはキー自体が無い */
  totalBpiHistogram: Record<string, TotalBpiHistogramBucket[]>;
  generatedAt?: string;
}

export interface OfficialArenaEntry {
  rank: string;
  count: number;
}

export interface OfficialArenaResponse {
  distribution: OfficialArenaEntry[];
  totalMatched: number;
  totalPlayers: number;
  generatedAt: string;
}

export interface SongPopulationResponse {
  songs: SongPlayerEntry[];
  total: number;
  hasMore: boolean;
}
