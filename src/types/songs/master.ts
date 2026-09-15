export type SongWithDef = {
  songId: number;
  title: string;
  notes: number;
  difficulty: string | null;
  difficultyLevel: number | null;
  defId: number;
  wrScore: number;
  kaidenAvg: number;
  coef: number | null;
  /** V2(分布ベース)算出用。ALS対象外・未計算の曲は null */
  mu?: number | null;
  sigma?: number | null;
  residualVar?: number | null;
};

export type SongMaster = SongWithDef[];
