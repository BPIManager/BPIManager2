import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { BpiCalculator } from "@/lib/bpi";
import { bpiRepo } from "@/lib/db/bpi";
import { getSongWithDefCached } from "@/lib/cache/songDefs";
import { getArenaAverages } from "@/lib/cache/arenaAverages";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/diffs";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/latestVersion";

const querySchema = z.object({
  title: z.string().min(1),
  difficulty: z.enum(IIDX_DIFFICULTIES),
  exScore: z.coerce.number().int().min(0),
  version: z
    .enum(IIDX_VERSIONS)
    .optional()
    .transform((v) => v ?? latestVersion),
  includeRank: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid parameters", errors: parsed.error.issues });
  }

  const { title, difficulty, exScore, version, includeRank } = parsed.data;

  try {
    const song = await getSongWithDefCached(title, difficulty);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    if (exScore > song.notes * 2) {
      return res.status(400).json({
        message: `exScore exceeds maximum (${song.notes * 2})`,
      });
    }

    const bpi = BpiCalculator.calc(exScore, {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg ?? null,
      wrScore: song.wrScore ?? null,
      coef: song.coef ?? null,
    });

    const estimatedRankByFormula =
      bpi !== null ? BpiCalculator.estimateRank(bpi) : null;

    const { rank: bpimRank, total: bpimTotal } = includeRank
      ? await bpiRepo.getSongBpimRank(song.songId, exScore, version)
      : { rank: null, total: null };

    let arenaAverages = null;
    if (song.difficultyLevel === 11 || song.difficultyLevel === 12) {
      const entries = await getArenaAverages(version, song.difficultyLevel);
      const entry = entries?.find(
        (e) => e.title === song.title && e.difficulty === song.difficulty,
      );
      arenaAverages = entry?.averages ?? null;
    }

    return res.status(200).json({
      song: {
        title: song.title,
        difficulty: song.difficulty,
        difficultyLevel: song.difficultyLevel,
        notes: song.notes,
      },
      bpi,
      rank: {
        estimatedRank: estimatedRankByFormula,
        bpimRank,
        bpimTotal,
      },
      metadata: {
        version,
        arenaAverages,
      },
    });
  } catch (error: unknown) {
    console.error("BPI calc error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
