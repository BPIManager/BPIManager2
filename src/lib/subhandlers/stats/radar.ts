import { calculateRadar, buildRadarSongMaster } from "@/lib/radar/calculator";
import { statsLatestScoresRepo } from "@/lib/db/aggregates/stats/latestScores";
import { statsSongTablesRepo } from "@/lib/db/aggregates/stats/songTables";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

export async function handleStatsRadar(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const [scores, validSongKeys, fullMaster] = await Promise.all([
    statsLatestScoresRepo.getLatestScoresWithMusicData(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    ),
    statsSongTablesRepo.getFilteredSongKeys(q.version, q.levels, q.difficulties),
    songMasterRepo.getSongMasterWithDef(),
  ]);
  return ok(
    calculateRadar(scores, buildRadarSongMaster(fullMaster), validSongKeys),
  );
}
