export interface ScoreData {
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
}

export interface CurrentScoreData extends ScoreData {
  lastPlayedAt: string | Date | null;
}

export interface BatchDetailItem {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  level: number;
  notes: number;
  bpm: string | null;
  releasedVersion: number | null;
  current: CurrentScoreData;
  previous: ScoreData | null;
  diff: {
    exScore: number;
    bpi: number;
  };
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
}
