import { BpiCalculator } from "@/lib/bpi";
import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { ok } from "@/middlewares/api/apiResult";
import { BPM_BANDS, getBpmBand } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

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
  const bandMaster = new Map<string, (IBpiBasicSongData & { songId: number })[]>(
    bandLabels.map((label) => [label, []]),
  );
  const bandObservations = new Map<string, IBpiScoreObservation[]>(
    bandLabels.map((label) => [label, []]),
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
    const notes = Number(song.notes);
    bandMaster.get(band)?.push({
      songId: song.songId,
      notes,
      kaidenAvg: song.kaidenAvg,
      wrScore: song.wrScore,
      coef: song.coef,
      mu: song.mu,
      sigma: song.sigma,
      residualVar: song.residualVar,
    });
    const exScore = song.exScore != null ? Number(song.exScore) : null;
    if (exScore !== null) {
      bandObservations.get(band)?.push({ songId: song.songId, notes, exScore });
    }
    const bpi = song.bpi != null ? Number(song.bpi) : -15;
    bandSongs.get(band)?.push({
      title: song.title as string,
      difficulty: song.difficulty as string,
      bpi,
      exScore,
      notes,
    });
  }

  const result = bandLabels.map((label) => {
    const master = bandMaster.get(label) ?? [];
    if (master.length === 0) return { label, totalBpi: null, songs: [] };
    const totalBpi = BpiCalculator.calculateTotalBPI(
      bandObservations.get(label) ?? [],
      master,
    );
    return {
      label,
      totalBpi: Math.round(totalBpi * 100) / 100,
      songs: bandSongs.get(label) ?? [],
    };
  });
  return ok(result.filter((r) => r.totalBpi !== null));
}
