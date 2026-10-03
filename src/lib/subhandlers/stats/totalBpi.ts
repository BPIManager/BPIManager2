import dayjs from "@/lib/dayjs";
import { BpiCalculator } from "@/lib/bpi";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { usersRepo } from "@/lib/db/domains/users";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { IBpiScoreObservation } from "@/types/songs/bpi";
import type { TotalBpiQuery } from "./_shared";

export async function handleStatsTotalBpi(
  q: TotalBpiQuery,
): Promise<HandlerResult<unknown>> {
  const targetTime =
    !q.asOf || q.asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(q.asOf).endOf("day").utc().toDate();

  const [scores, songMaster, user] = await Promise.all([
    scoreDetailRepo.getScoresWithDetails(q.userId, q.version, {
      targetTime,
      onlyLastPlayedInRange: { start: new Date(0), end: targetTime },
    }),
    songMasterRepo.getSongMasterWithDef(),
    usersRepo.getIidxId(q.userId),
  ]);

  const level12Master = songMaster.filter((s) => s.difficultyLevel === 12);
  const totalCount = level12Master.length;
  const level12Scores = scores.filter((s) => Number(s.difficultyLevel) === 12);
  // 潜在スキル推定は level 11+12 の全観測が必要なため、集計母集団（level12Master）とは別に scores 全体から observations を作る。
  const observations: IBpiScoreObservation[] = scores
    .filter((s) => s.exScore !== null && s.exScore !== undefined)
    .map((s) => ({
      songId: s.songId,
      notes: s.notes,
      exScore: Number(s.exScore),
    }));
  const freshTotalBpi = BpiCalculator.calculateTotalBPI(
    observations,
    level12Master,
  );
  // モデル再推定等で同じ時点の再計算値が過去の記録より低く出うるため、asOf 指定時を含め、その時点までの記録済み最高値を下限にする。
   // monthly-review の buildBpiTimeline と同じ理由。
  const previousBest = await userStatusLogsReadRepo.findMaxTotalBpiAsOf(q.userId, q.version, targetTime,);
  const totalBpi = BpiCalculator.ratchetTotalBpi(previousBest, freshTotalBpi);
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
