import { SongWithScore } from "@/types/songs/withScore";

export const mapToFlatSong = (row: any): SongWithScore => {
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
