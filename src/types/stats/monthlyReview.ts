export interface TopSong {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  bpi: number;
  exScore: number;
  notes: number;
  rank: number;
}

export interface TopSongImproved extends TopSong {
  bpiBefore: number;
  bpiAfter: number;
  diff: number;
}

export interface RivalSongHighlight {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  userExScore: number;
  rivalExScore: number;
  margin: number;
}

export interface GrowthParticipant {
  userId: string;
  userName: string;
  isViewer: boolean;
  profileImage: string | null;
  bpiBase: number;
  history: { date: string; bpi: number }[];
}

export interface RivalBpiGrowthEntry {
  userId: string;
  userName: string;
  profileImage: string | null;
  isViewer: boolean;
  bpiGrowth: number;
  growthRate: number | null;
}

export interface RivalDiff {
  userId: string;
  userName: string;
  profileImage: string | null;
  newWins: number;
  newLosses: number;
  topWinningSongs: RivalSongHighlight[];
  bpiStart: number | null;
  bpiEnd: number | null;
  bpiGrowth: number | null;
}

export interface MonthlyArena {
  bestClass: string;
  bestRank: number | null;
  maxA1Continue: number | null;
}

export interface RadarGrowthEntry {
  element: string;
  totalDiff: number;
  bpiStart: number;
  bpiEnd: number;
  songs: TopSongImproved[];
  timeline: { date: string; cumDiff: number }[];
}

export interface MonthlyReviewBpi {
  start: number;
  end: number;
  diff: number;
  history: { date: string; value: number }[];
  /** 全期間モードでの比較先バージョン（月次/年次はnull） */
  compareVersion: string | null;
}

export interface MonthlyReviewTopSongs {
  topBpiSongs: TopSong[];
  topImprovedSongs: TopSongImproved[];
  /** 「最も伸びた曲」の比較先バージョン（全期間モードのみ。月次/年次はnull） */
  compareVersion: string | null;
}

export interface MonthlyReviewActivity {
  totalKeys: number;
  totalScratches: number;
  playDays: number;
  updatedSongs: number;
  byDayOfWeek: { day: number; count: number }[];
  byHour: { hour: number; count: number }[];
  towerRanking: {
    keysRank: number;
    scratchRank: number;
    totalUsers: number;
  } | null;
  bestDays: {
    bestGrowthDay: { date: string; bpiDiff: number } | null;
    bestKeysDay: { date: string; keyCount: number } | null;
    bestScratchDay: { date: string; scratchCount: number } | null;
  } | null;
}

export interface MonthlyReviewRivals {
  rivals: RivalDiff[];
  rivalsGrowthRanking: {
    byAbsGrowth: RivalBpiGrowthEntry[];
    byGrowthRate: RivalBpiGrowthEntry[];
  } | null;
  rivalsGrowthTimeline: GrowthParticipant[] | null;
}

export interface MonthlyReviewRadarGrowth {
  radarGrowth: RadarGrowthEntry[] | null;
  /** 全期間モードでの比較先バージョン（月次/年次はnull） */
  compareVersion: string | null;
  /** 比較先バージョンにデータが無く、伸び幅ではなくBPI降順の単純なリストにフォールバックしたか */
  usingFallbackComparison: boolean;
}

export interface MonthlyReviewArena {
  arena: MonthlyArena | null;
}

export interface MonthlyReviewData
  extends MonthlyReviewRivals,
    MonthlyReviewArena,
    MonthlyReviewRadarGrowth {
  month: string;
  version: string;
  granularity: "month" | "year" | "version";
  bpi: MonthlyReviewBpi;
  topSongs: MonthlyReviewTopSongs;
  activity: MonthlyReviewActivity;
}
