import type { RadarCategory } from "@/types/stats/radar";

export interface RadarGrowthEntry {
  category: RadarCategory;
  before: number;
  after: number;
  diff: number;
}

export interface RadarGrowthSnapshot {
  categories: RadarGrowthEntry[];
}

export interface RadarGrowthSongScore {
  exScore: number;
  bpi: number | null;
}

export interface RadarGrowthSong {
  songId: number;
  title: string;
  difficulty: string | null;
  /** 更新前。期間内に初めて記録した曲は null */
  before: RadarGrowthSongScore | null;
  after: RadarGrowthSongScore;
  /** この曲の更新だけを巻き戻した場合とのカテゴリ総合BPIの差（単独の寄与） */
  impact: number;
}

export interface RadarGrowthSongsResponse {
  category: RadarCategory;
  songs: RadarGrowthSong[];
}
