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

export interface SiteStatsResponse {
  summary: SiteStatsSummary;
  dailyRegistrations: DailyRegistration[];
  arenaRankDistribution: ArenaRankEntry[];
  areaDistribution: AreaEntry[];
  versionScoreDistribution: VersionScoreDistribution;
  hourlyDistribution: Record<SiteStatsPeriod, HourlyEntry[]>;
  weekdayDistribution: Record<SiteStatsPeriod, WeekdayEntry[]>;
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
