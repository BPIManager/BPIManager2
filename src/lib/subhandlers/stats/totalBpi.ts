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
  // 総合BPI(V2)の潜在スキル推定はlevel11+12の全観測を使う必要があるため、
  // 集計母集団(level12Master)とは別にscores全体からobservationsを作る
  // （bulk.ts/manual.tsのbpiSongMaster由来observationsと同じ理由）
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
  // BPIモデルの再推定等により、同じ時点を再計算しても過去に記録された値より
  // 低く出ることがある（monthly-review/bpi.tsのbuildBpiTimelineと同じ理由）。
  // asOf指定時（過去のある日との比較）も含め、その時点までに実際に記録された
  // 最高値を下限として使う
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
