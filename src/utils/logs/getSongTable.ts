import { getDJRank } from "../songs/djRank";

export const mapBatchToSongs = (batchSongs: any[]) => {
  return batchSongs.map((s) => {
    const maxScore = s.notes * 2;
    const currentEx = s.current.exScore;

    return {
      ...s,
      difficultyLevel: s.level,
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
