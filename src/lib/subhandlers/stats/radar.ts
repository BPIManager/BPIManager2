import { calculateRadar, buildRadarSongMaster } from "@/lib/radar/calculator";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { songsRepo } from "@/lib/db/domains/songs";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

export async function handleStatsRadar(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const [scores, validSongKeys, fullMaster] = await Promise.all([
    statsTablesRepo.getLatestScoresWithMusicData(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    ),
    statsTablesRepo.getFilteredSongKeys(q.version, q.levels, q.difficulties),
    songsRepo.getSongMasterWithDef(),
  ]);
  return ok(
    calculateRadar(scores, buildRadarSongMaster(fullMaster), validSongKeys),
  );
}
