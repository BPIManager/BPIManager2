import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import { ok } from "@/middlewares/api/apiResult";
import { BPM_BANDS, getBpmBand } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
import type { ValidStep } from "@/schemas/stats/singleBPIDistribution";
import type { HandlerResult } from "@/types/api";

export async function handleStatsBpmBpiDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const songs = await statsChartsRepo.getSongsWithUserBpiForBpmDistribution(
    q.userId,
    q.version,
    q.levels.length > 0 ? q.levels : undefined,
    q.difficulties.length > 0 ? q.difficulties : undefined,
  );
  const bandLabels = [...BPM_BANDS.map((b) => b.label), "Soflan"];
  const bandBpis = new Map<string, number[]>(
    bandLabels.map((label) => [label, []]),
  );
  const bandTotals = new Map<string, number>(
    bandLabels.map((label) => [label, 0]),
  );
  const bandSongs = new Map<
    string,
    {
      title: string;
      difficulty: string;
      bpi: number;
      exScore: number | null;
      notes: number | null;
    }[]
  >(bandLabels.map((label) => [label, []]));

  for (const song of songs) {
    const band = getBpmBand(song.bpm as string | null | undefined);
    bandTotals.set(band, (bandTotals.get(band) ?? 0) + 1);
    const bpi = song.bpi != null ? Number(song.bpi) : -15;
    bandBpis.get(band)?.push(bpi);
    bandSongs.get(band)?.push({
      title: song.title as string,
      difficulty: song.difficulty as string,
      bpi,
      exScore: song.exScore != null ? Number(song.exScore) : null,
      notes: song.notes != null ? Number(song.notes) : null,
    });
  }

  const result = bandLabels.map((label) => {
    const bpis = bandBpis.get(label) ?? [];
    const total = bandTotals.get(label) ?? 0;
    if (total === 0) return { label, totalBpi: null, songs: [] };
    const sorted = [...bpis].sort((a, b) => b - a);
    const totalBpi = BpiCalculator.calculateTotalBPI(sorted, total);
    return {
      label,
      totalBpi: Math.round(totalBpi * 100) / 100,
      songs: bandSongs.get(label) ?? [],
    };
  });
  return ok(result.filter((r) => r.totalBpi !== null));
}

/** GET stats/djRankDistribution */
export async function handleStatsDjRankDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    q.userId,
    q.version,
  );
  const distribution = RANK_TABLE.map((r) => ({ label: r.label, count: 0 }));
  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (q.levels.length > 0 && !q.levels.includes(s.difficultyLevel as number))
      return;
    if (
      q.difficulties.length > 0 &&
      !q.difficulties.includes(s.difficulty as string)
    )
      return;
    const maxScore = (s.notes || 0) * 2;
    if (maxScore === 0) return;
    const rankIdx = RANK_TABLE.findLastIndex(
      (r) => s.exScore / maxScore >= r.ratio,
    );
    if (rankIdx !== -1) distribution[rankIdx].count++;
  });
  return ok(distribution);
}

type StepQuery = StatsQuery & { step: ValidStep };

/** GET stats/scoreRateDistribution */
export async function handleStatsScoreRateDistribution(
  q: StepQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, step } = q;
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    userId,
    version,
  );
  const distribution: { label: string; count: number }[] = [];
  for (let v = 0; v < 100; v += step) {
    distribution.push({ label: v.toString(), count: 0 });
  }
  distribution.push({ label: "100", count: 0 });

  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
      return;
    if (
      difficulties.length > 0 &&
      !difficulties.includes(s.difficulty as string)
    )
      return;
    const maxScore = (s.notes || 0) * 2;
    if (maxScore === 0) return;
    const rate = (s.exScore / maxScore) * 100;
    const idx = Math.min(Math.floor(rate / step), distribution.length - 1);
    if (distribution[idx]) distribution[idx].count++;
  });
  return ok(distribution);
}

/** GET stats/singleBPIDistribution */
export async function handleStatsSingleBpiDistribution(
  q: StepQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, step } = q;
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    userId,
    version,
  );
  const distribution: { label: string; count: number }[] = [];
  distribution.push({ label: "<-10", count: 0 });
  for (let v = -10; v < 100; v += step) {
    distribution.push({ label: v.toString(), count: 0 });
  }
  distribution.push({ label: "100+", count: 0 });

  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
      return;
    if (
      difficulties.length > 0 &&
      !difficulties.includes(s.difficulty as string)
    )
      return;
    const bpi = s.bpi ?? -15;
    let idx: number;
    if (bpi < -10) {
      idx = 0;
    } else if (bpi >= 100) {
      idx = distribution.length - 1;
    } else {
      idx = Math.floor((bpi - -10) / step) + 1;
    }
    if (distribution[idx]) distribution[idx].count++;
  });
  return ok(distribution);
}
