import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { BpiCalculator } from "@/lib/bpi";

export const BPM_BANDS = [
  { label: "200~", min: 200, max: Infinity },
  { label: "180~200", min: 180, max: 200 },
  { label: "160~180", min: 160, max: 180 },
  { label: "140~160", min: 140, max: 160 },
  { label: "120~140", min: 120, max: 140 },
  { label: "~120", min: 0, max: 120 },
] as const;

function getBpmBand(bpm: string | null | undefined): string {
  if (!bpm) return "Soflan";
  if (bpm.includes("-")) return "Soflan";
  const num = parseInt(bpm, 10);
  if (isNaN(num)) return "Soflan";
  for (const band of BPM_BANDS) {
    if (num >= band.min && num < band.max) return band.label;
  }
  return "Soflan";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const query = parseStatsQuery(req.query, res);
  if (!query) return;
  const { userId, version, levels, difficulties } = query;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const songs = await statsRepo.getSongsWithUserBpiForBpmDistribution(
      userId,
      version,
      levels.length > 0 ? levels : undefined,
      difficulties.length > 0 ? difficulties : undefined,
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

    return res.status(200).json(result.filter((r) => r.totalBpi !== null));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
