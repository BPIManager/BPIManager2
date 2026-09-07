import dayjs from "@/lib/dayjs";
import { BpiCalculator } from "@/lib/bpi";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { usersRepo } from "@/lib/db/domains/users";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { IIDXVersion } from "@/types/iidx/version";
import type { HandlerResult } from "@/types/api";

type TotalBpiQuery = { userId: string; version: IIDXVersion; asOf?: string };

/** GET stats/totalBpi */
export async function handleStatsTotalBpi(
  q: TotalBpiQuery,
): Promise<HandlerResult<unknown>> {
  const targetTime =
    !q.asOf || q.asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(q.asOf).endOf("day").utc().toDate();

  const [scores, totalCount, user] = await Promise.all([
    scoreDetailRepo.getScoresWithDetails(q.userId, q.version, {
      targetTime,
      onlyLastPlayedInRange: { start: new Date(0), end: targetTime },
    }),
    statsTablesRepo.getTotalSongCount([12], []),
    usersRepo.getIidxId(q.userId),
  ]);

  const level12Scores = scores.filter((s) => Number(s.difficultyLevel) === 12);
  const bpis = level12Scores.map((s) =>
    s.bpi !== null && s.bpi !== undefined ? Number(s.bpi) : -15,
  );
  const totalBpi = BpiCalculator.calculateTotalBPI(bpis, totalCount);
  const estimatedRank = BpiCalculator.estimateRank(totalBpi);
  const areaRank =
    q.version === latestVersion
      ? getUserAreaRank(user?.iidxId ?? null)
      : null;

  return ok({
    totalBpi,
    estimatedRank,
    playedCount: level12Scores.length,
    totalCount,
    area: areaRank?.area ?? null,
    areaRank: areaRank?.areaRank ?? null,
    totalInArea: areaRank?.totalInArea ?? null,
  });
}

type AaaQuery = {
  userId: string;
  version: IIDXVersion;
  level: number;
  customGoalRatio?: number;
  customGoalOffset?: number;
};

/** GET stats/aaaDifficulty （bare + checkUserAccess はルート側で実施） */
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

