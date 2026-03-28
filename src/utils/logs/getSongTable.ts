import { getDJRank } from "../songs/djRank";
import { BatchDetailItem } from "@/types/logs/batchDetail";

export const mapBatchToSongs = (batchSongs: BatchDetailItem[]) => {
  return batchSongs.map((s) => {
    const maxScore = s.notes * 2;
    const currentEx = s.current.exScore;

    return {
      ...s,
      logId: null,
      difficultyLevel: s.level,
      bpm: s.bpm ?? null,
      releasedVersion: s.releasedVersion ?? null,
      wrScore: s.wrScore ?? null,
      kaidenAvg: s.kaidenAvg ?? null,
      coef: s.coef ?? null,
      exScore: currentEx,
      bpi: s.current.bpi,
      clearState: s.current.clearState,
      missCount: s.current.missCount,
      scoreAt: s.current.lastPlayedAt,
      exDiff: s.diff.exScore,
      bpiDiff: s.diff.bpi,

      djRankDisplay: {
        current: `${getDJRank(currentEx, maxScore, { mode: "current", output: "label" })}${getDJRank(currentEx, maxScore, { mode: "current", output: "value" })}`,
        next: `${getDJRank(currentEx, maxScore, { mode: "next", output: "label" })}${getDJRank(currentEx, maxScore, { mode: "next", output: "value" })}`,
      },
    };
  });
};
