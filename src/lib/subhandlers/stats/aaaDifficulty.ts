import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { HandlerResult } from "@/types/api";
import type { AaaQuery } from "./_shared";

export async function handleStatsAaaDifficulty(
  q: AaaQuery,
): Promise<HandlerResult<unknown>> {
  try {
    const rawData = await statsTablesRepo.getAAATableData(
      q.userId,
      q.version,
      q.level,
    );
    const result = rawData.map((song) => {
      const maxScore = song.notes * 2;
      const aaaTarget = Math.ceil(maxScore * (8 / 9));
      const maxMinusTarget = Math.ceil(maxScore * (17 / 18));
      const songParams = {
        title: song.title,
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
        coef: song.coef as number,
      };
      const aaaTargetBpi = BpiCalculator.calc(aaaTarget, songParams) ?? -15;
      const maxMinusTargetBpi =
        BpiCalculator.calc(maxMinusTarget, songParams) ?? -15;
      const customTarget =
        q.customGoalRatio !== undefined
          ? Math.min(
              maxScore,
              Math.max(
                0,
                Math.ceil(maxScore * q.customGoalRatio) +
                  (q.customGoalOffset ?? 0),
              ),
            )
          : undefined;
      const customTargetBpi =
        customTarget !== undefined
          ? (BpiCalculator.calc(customTarget, songParams) ?? -15)
          : undefined;
      const currentExScore = song.userExScore ?? 0;
      const currentBpi = song.userExScore
        ? (BpiCalculator.calc(song.userExScore, songParams) ?? -15)
        : -15;
      return {
        songId: song.songId,
        title: song.title,
        difficulty: song.difficulty,
        notes: song.notes,
        releasedVersion: song.releasedVersion,
        maxScore,
        targets: {
          aaa: {
            exScore: aaaTarget,
            targetBpi: aaaTargetBpi,
            diff: currentExScore - aaaTarget,
          },
          maxMinus: {
            exScore: maxMinusTarget,
            targetBpi: maxMinusTargetBpi,
            diff: currentExScore - maxMinusTarget,
          },
          ...(customTarget !== undefined && customTargetBpi !== undefined
            ? {
                custom: {
                  exScore: customTarget,
                  targetBpi: customTargetBpi,
                  diff: currentExScore - customTarget,
                },
              }
            : {}),
        },
        user: {
          exScore: currentExScore,
          bpi: currentBpi,
          isAaa: currentExScore >= aaaTarget,
          isMaxMinus: currentExScore >= maxMinusTarget,
        },
      };
    });
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
