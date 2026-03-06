// types/sql.ts
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
};

export type SongMaster = SongWithDef[];
