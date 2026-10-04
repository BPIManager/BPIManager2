import { z } from "zod";
import { BpiCalculator } from "@/lib/bpi";
import { getArenaAverages } from "@/lib/cache/arenaAverages";
import { getSongWithDefCached } from "@/lib/cache/songDefs";
import { scoreActivityRepo } from "@/lib/db/domains/scores/activity";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { NextApiRequest } from "next";

const bpiCalcQuerySchema = z.object({
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

/** GET /bpi/calc */
export async function handleBpiCalc(
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const parsed = bpiCalcQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return err(400, "Invalid parameters");
  }

  const { title, difficulty, exScore, version, includeRank } = parsed.data;

  try {
    const song = await getSongWithDefCached(title, difficulty);
    if (!song) return err(404, "Song not found");

    if (exScore > song.notes * 2) {
      return err(400, `exScore exceeds maximum (${song.notes * 2})`);
    }

    const bpi = BpiCalculator.calc(exScore, {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg ?? null,
      wrScore: song.wrScore ?? null,
      coef: song.coef ?? null,
      mu: song.mu ?? null,
      sigma: song.sigma ?? null,
      residualVar: song.residualVar ?? null,
    });

    const estimatedRankByFormula =
      bpi !== null ? BpiCalculator.estimateRank(bpi) : null;

    const { rank: bpimRank, total: bpimTotal } = includeRank
      ? await scoreActivityRepo.getSongBpimRank(song.songId, exScore, version)
      : { rank: null, total: null };

    let arenaAverages = null;
    if (song.difficultyLevel === 11 || song.difficultyLevel === 12) {
      const entries = await getArenaAverages(version, song.difficultyLevel);
      const entry = entries?.find(
        (e) => e.title === song.title && e.difficulty === song.difficulty,
      );
      arenaAverages = entry?.averages ?? null;
    }

    return ok({
      song: {
        title: song.title,
        difficulty: song.difficulty,
        difficultyLevel: song.difficultyLevel,
        notes: song.notes,
      },
      bpi,
      rank: { estimatedRank: estimatedRankByFormula, bpimRank, bpimTotal },
      metadata: { version, arenaAverages },
    });
  } catch (error: unknown) {
    console.error("BPI calc error:", error);
    return err(500, toErrorMessage(error));
  }
}
