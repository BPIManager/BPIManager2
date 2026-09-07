import dayjs from "@/lib/dayjs";
import { BpiCalculator } from "@/lib/bpi";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { usersRepo } from "@/lib/db/domains/users";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { TotalBpiQuery } from "./_shared";

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
    q.version === latestVersion ? getUserAreaRank(user?.iidxId ?? null) : null;

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
