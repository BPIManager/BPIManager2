import { SongWithScore } from "@/types/songs/score";

interface RawSongScoreRow {
  songId: number;
  title: string;
  notes: number | string | null;
  bpm: string | null;
  difficulty: string;
  difficultyLevel: number;
  releasedVersion: number | null;
  logId?: number | string | null;
  exScore: number | string | null;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  scoreAt: string | Date | null;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
}

export const mapToFlatSong = (row: RawSongScoreRow): SongWithScore => {
  return {
    songId: row.songId,
    title: row.title,
    notes: Number(row.notes || 0),
    bpm: row.bpm,
    difficulty: row.difficulty,
    difficultyLevel: row.difficultyLevel,
    releasedVersion: row.releasedVersion,
    logId: row.logId ? Number(row.logId) : null,
    exScore: row.exScore !== null ? Number(row.exScore) : null,
    bpi: row.bpi !== null ? Number(row.bpi) : null,
    clearState: row.clearState,
    missCount: row.missCount,
    scoreAt: row.scoreAt,
    wrScore: row.wrScore,
    kaidenAvg: row.kaidenAvg,
    coef: row.coef,
  };
};
