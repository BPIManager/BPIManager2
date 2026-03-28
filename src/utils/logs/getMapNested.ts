import { BatchDetailItem } from "@/types/logs/logByBatchId";

interface RawScoreRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number | null;
  bpm: string | null;
  releasedVersion: number | null;
  exScore: number | string;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  scoreAt: string | Date | null;
  p_exScore: number | string | null;
  p_bpi: number | null;
  p_clearState: string | null;
  p_missCount: number | null;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
}

export const mapToLogNested = (row: RawScoreRow): BatchDetailItem => {
  const currentEx = Number(row.exScore);
  const prevEx = row.p_exScore !== null ? Number(row.p_exScore) : null;
  const currentBpi = Number(row.bpi);
  const prevBpi = row.p_bpi !== null ? Number(row.p_bpi) : null;

  return {
    songId: row.songId,
    title: row.title,
    difficulty: row.difficulty,
    difficultyLevel: row.difficultyLevel,
    level: row.difficultyLevel,
    notes: Number(row.notes || 0),
    bpm: row.bpm,
    releasedVersion: row.releasedVersion,
    current: {
      exScore: currentEx,
      bpi: currentBpi,
      clearState: row.clearState,
      missCount: row.missCount,
      lastPlayedAt: row.scoreAt,
    },
    previous:
      prevEx !== null
        ? {
            exScore: prevEx,
            bpi: prevBpi,
            clearState: row.p_clearState,
            missCount: row.p_missCount,
          }
        : null,
    diff: {
      exScore: prevEx !== null ? currentEx - prevEx : currentEx,
      bpi:
        prevBpi !== null
          ? Math.round((currentBpi - prevBpi) * 100) / 100
          : Math.round((currentBpi + 15) * 100) / 100,
    },
    wrScore: row.wrScore,
    kaidenAvg: row.kaidenAvg,
    coef: row.coef,
  };
};
