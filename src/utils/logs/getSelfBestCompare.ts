import { BpiCalculator } from "@/lib/bpi";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import type { RivalScore } from "@/types/songs/score";

/** 更新前時点の自己ベスト(同バージョンの更新前スコアと他バージョンのスコアの最大)を比較先として返す。過去スコアが無ければ null */
export const getPriorSelfBest = (song: BatchDetailItem): RivalScore | null => {
  let best: RivalScore | null = null;

  if (song.previous) {
    best = {
      exScore: song.previous.exScore,
      bpi: song.previous.bpi,
      clearState: song.previous.clearState,
      missCount: song.previous.missCount,
      lastPlayed: null,
    };
  }

  for (const v of song.versionOvertaken ?? []) {
    if (best && best.exScore !== null && v.targetScore <= best.exScore) continue;
    best = {
      exScore: v.targetScore,
      bpi: BpiCalculator.calc(v.targetScore, {
        notes: song.notes,
        kaidenAvg: song.kaidenAvg ?? null,
        wrScore: song.wrScore ?? null,
        coef: song.coef,
        mu: song.mu,
        sigma: song.sigma,
        residualVar: song.residualVar,
      }),
      clearState: null,
      missCount: null,
      lastPlayed: null,
    };
  }

  return best;
};
