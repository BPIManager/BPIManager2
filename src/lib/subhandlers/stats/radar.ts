import { calculateRadar, buildRadarSongMaster } from "@/lib/radar/calculator";
import { statsLatestScoresRepo } from "@/lib/db/aggregates/stats/latestScores";
import { statsSongTablesRepo } from "@/lib/db/aggregates/stats/songTables";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { logRadarRepo } from "@/lib/db/domains/logs/radar";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { BpiCalculator } from "@/lib/bpi";
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
  const radar = calculateRadar(scores, buildRadarSongMaster(fullMaster), validSongKeys);

  // ラチェット（過去最高を下回らない）は、既定のレーダー（☆12・全難易度）にだけ適用する。
  // 絞り込み時の値は保存済みの値と母集団が異なるため、都度計算した値をそのまま返す
  if (isDefaultRadarFilter(q.levels, q.difficulties)) {
    const best = await logRadarRepo.getMax(q.userId, q.version);
    if (best) {
      for (const category of Object.keys(radar) as (keyof typeof radar)[]) {
        radar[category].totalBpi = BpiCalculator.ratchetTotalBpi(
          best[category] ?? null,
          radar[category].totalBpi,
        );
      }
    }
  }
  return ok(radar);
}

const isDefaultRadarFilter = (levels: number[], difficulties: string[]) =>
  levels.length === 1 &&
  levels[0] === 12 &&
  difficulties.length === IIDX_DIFFICULTIES.length &&
  IIDX_DIFFICULTIES.every((d) => difficulties.includes(d));
