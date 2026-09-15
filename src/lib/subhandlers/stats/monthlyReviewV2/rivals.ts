import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import {
  buildRivals,
  attachRivalBpiTimelines,
  buildGrowthRanking,
  buildGrowthTimeline,
} from "@/lib/monthly-review/rivals";
import { resolveMonthlyReviewPeriod, computeOwnerBpiTimeline } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewRivals(
  q: { userId: string; version: string; month: string },
  access: AccessResult,
): Promise<HandlerResult<unknown>> {
  const owner = q.userId;
  const { version, month } = q;
  const viewerId = access.viewerId;

  try {
    const { monthStart, monthEnd, useMonthBuckets } = resolveMonthlyReviewPeriod(
      month,
    );

    const [userCurrentL1112, preL1112, bpiTimeline] = await Promise.all([
      monthlyReviewRepo.getUserCurrentL1112Scores(owner, version),
      monthlyReviewRepo.getUserPreMonthL1112Scores(owner, version, monthStart),
      computeOwnerBpiTimeline(owner, version, monthStart, monthEnd, useMonthBuckets),
    ]);

    const userL1112SongIds = userCurrentL1112.map((s) => s.songId);
    const rivalL1112Scores =
      userL1112SongIds.length > 0
        ? await monthlyReviewRepo.getRivalsCurrentScoresForSongs({
            ownerId: owner,
            viewerId,
            version,
            songIds: userL1112SongIds,
          })
        : [];

    const userPreL1112Map = new Map<number, number>();
    for (const s of preL1112) userPreL1112Map.set(s.songId, s.exScore);

    const rivals = buildRivals(
      userCurrentL1112.map((s) => ({ ...s, difficulty: s.difficulty as string })),
      rivalL1112Scores.map((r) => ({ ...r, profileImage: r.profileImage ?? null })),
      userPreL1112Map,
    );

    const [rivalPreMonthState, rivalInMonthHistory] = await Promise.all([
      monthlyReviewRepo.getPreMonthBpiStateForUsers(
        rivals.map((r) => r.userId),
        version,
        monthStart,
      ),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        rivals.map((r) => r.userId),
        version,
        monthStart,
        monthEnd,
      ),
    ]);

    const rivalComputedTimeline = attachRivalBpiTimelines(
      rivals,
      rivalPreMonthState,
      rivalInMonthHistory,
      bpiTimeline.allL12SongMeta,
      useMonthBuckets,
    );
    const rivalsGrowthRanking = buildGrowthRanking(
      rivals,
      owner,
      bpiTimeline.bpiDiff,
      bpiTimeline.bpiStart,
    );
    const rivalsGrowthTimeline = buildGrowthTimeline(
      rivals,
      rivalComputedTimeline,
      owner,
      bpiTimeline.history,
      bpiTimeline.bpiStart,
      bpiTimeline.bpiEnd,
      monthStart,
    );

    return ok({ rivals, rivalsGrowthRanking, rivalsGrowthTimeline });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
