import { BpiCalculator } from "@/lib/bpi";
import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { ok } from "@/middlewares/api/apiResult";
import { BPM_BANDS, getBpmBand } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
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
